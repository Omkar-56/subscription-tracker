import pg from 'pg';
import { env } from './env.js';

const { Client } = pg;

function getDbConfig() {
  // If Cloudflare Hyperdrive is available, use its managed connection
  // Hyperdrive manages SSL to PostgreSQL upstream, so local SSL must NOT be enabled.
  if (process.env.HYPERDRIVE_CONNECTION_STRING) {
    return {
      connectionString: process.env.HYPERDRIVE_CONNECTION_STRING,
      ssl: false,
    };
  }

  let connectionString = env.databaseUrl || process.env.DATABASE_URL || '';

  // Clean any trailing query parameters like ?sslmode=require if we are handling SSL object
  const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
  const isProduction = (env.nodeEnv || process.env.NODE_ENV) === 'production';

  return {
    connectionString,
    ssl: isProduction || isSupabase ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  };
}

let schemaChecked = false;

export async function ensureSchema() {
  if (schemaChecked) return;

  const dbUrl = process.env.HYPERDRIVE_CONNECTION_STRING || env.databaseUrl || process.env.DATABASE_URL;
  if (!dbUrl) {
    schemaChecked = true;
    return;
  }

  try {
    // 1. Ultra-fast check: if subscriptions table exists, schema is already initialized.
    // This avoids heavy DDL execution, table locking, and catalog contention on worker cold starts.
    const res = await executeDirectQuery(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions' LIMIT 1;`
    );
    if (res?.rows && res.rows.length > 0) {
      schemaChecked = true;
      return;
    }

    // 2. Only if the table does not exist (e.g. brand new blank database), create schema:
    await executeDirectQuery(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
          CREATE TYPE billing_cycle AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
          CREATE TYPE subscription_status AS ENUM ('active', 'cancelled');
        END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        avatar_url TEXT,
        base_currency TEXT NOT NULL DEFAULT 'INR',
        reset_password_token TEXT,
        reset_password_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
        currency TEXT NOT NULL DEFAULT 'INR',
        billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
        next_renewal_date DATE NOT NULL,
        status subscription_status NOT NULL DEFAULT 'active',
        notes TEXT,
        reminder_days_before INT NOT NULL DEFAULT 2,
        last_reminder_sent_at TIMESTAMPTZ,
        is_free_trial BOOLEAN NOT NULL DEFAULT FALSE,
        trial_end_date DATE,
        cancellation_deadline DATE,
        post_trial_amount NUMERIC(10, 2),
        post_trial_currency TEXT DEFAULT 'INR',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_renewal ON subscriptions(user_id, next_renewal_date ASC);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_active_due ON subscriptions(status, next_renewal_date) WHERE status = 'active';
      CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON subscriptions(user_id, is_free_trial, trial_end_date) WHERE is_free_trial = TRUE;

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
        billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_payments_sub_date ON payments(subscription_id, paid_date DESC, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, paid_date DESC, created_at DESC);

      CREATE TABLE IF NOT EXISTS price_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        old_amount NUMERIC(10, 2) NOT NULL,
        new_amount NUMERIC(10, 2) NOT NULL,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_price_history_sub_changed ON price_history(subscription_id, changed_at DESC);

      CREATE TABLE IF NOT EXISTS reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        due_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        channel TEXT NOT NULL DEFAULT 'in_app',
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_reminders_user_pending ON reminders(user_id, due_date ASC) WHERE status = 'pending';
      CREATE INDEX IF NOT EXISTS idx_reminders_sub_due ON reminders(user_id, subscription_id, due_date);
      CREATE INDEX IF NOT EXISTS idx_reminders_subscription_id ON reminders(subscription_id);
    `);
    schemaChecked = true;
  } catch (err) {
    console.warn('[ensureSchema warning]:', err.message);
    schemaChecked = true;
  }
}

/**
 * Execute query using an ephemeral pg.Client with connection timeout
 */
async function executeDirectQuery(text, params) {
  const config = getDbConfig();
  const client = new Client(config);
  try {
    await client.connect();
    return await client.query(text, params);
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

export async function query(text, params) {
  return executeDirectQuery(text, params);
}

export async function withTransaction(callback) {
  const config = getDbConfig();
  const client = new Client(config);
  try {
    await client.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw err;
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

export const pool = {
  query: (text, params) => executeDirectQuery(text, params),
  connect: async () => {
    const client = new Client(getDbConfig());
    await client.connect();
    return {
      query: (t, p) => client.query(t, p),
      release: () => client.end(),
    };
  },
  end: async () => {},
};
