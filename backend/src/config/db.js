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

let schemaPromise = null;

export async function ensureSchema() {
  const dbUrl = process.env.HYPERDRIVE_CONNECTION_STRING || env.databaseUrl || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[ensureSchema] DATABASE_URL is not set. Skipping schema initialization.');
    return;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
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

          -- 1. Users table
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

          ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'INR';
          ALTER TABLE users ALTER COLUMN base_currency SET DEFAULT 'INR';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;

          -- Drop obsolete columns from users (plan tiers, unused scans & reminders)
          ALTER TABLE users DROP COLUMN IF EXISTS reminder_days_before CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS plan CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS plan_status CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS billing_cycle CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS current_period_start CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS current_period_end CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS cancel_at_period_end CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS customer_id CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS subscription_external_id CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS ai_scans_used CASCADE;
          ALTER TABLE users DROP COLUMN IF EXISTS ai_scans_reset_at CASCADE;

          -- Drop obsolete tables
          DROP TABLE IF EXISTS user_plan_subscriptions CASCADE;

          -- Users Indexes
          CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
          CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

          -- 2. Subscriptions table
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

          ALTER TABLE subscriptions ALTER COLUMN currency SET DEFAULT 'INR';
          ALTER TABLE subscriptions ALTER COLUMN post_trial_currency SET DEFAULT 'INR';
          ALTER TABLE subscriptions ALTER COLUMN reminder_days_before SET DEFAULT 2;

          -- Subscriptions Indexes
          CREATE INDEX IF NOT EXISTS idx_subscriptions_user_renewal ON subscriptions(user_id, next_renewal_date ASC);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_active_due ON subscriptions(status, next_renewal_date) WHERE status = 'active';
          CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON subscriptions(user_id, is_free_trial, trial_end_date) WHERE is_free_trial = TRUE;

          -- 3. Payments table (notes column removed)
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

          -- Remove notes from payments if present
          ALTER TABLE payments DROP COLUMN IF EXISTS notes CASCADE;
          ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';

          -- Payments Indexes
          CREATE INDEX IF NOT EXISTS idx_payments_sub_date ON payments(subscription_id, paid_date DESC, created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, paid_date DESC, created_at DESC);

          -- 4. Price History table
          CREATE TABLE IF NOT EXISTS price_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
            old_amount NUMERIC(10, 2) NOT NULL,
            new_amount NUMERIC(10, 2) NOT NULL,
            changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          -- Price History Indexes
          CREATE INDEX IF NOT EXISTS idx_price_history_sub_changed ON price_history(subscription_id, changed_at DESC);

          -- 5. Reminders table
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

          -- Reminders Indexes
          CREATE INDEX IF NOT EXISTS idx_reminders_user_pending ON reminders(user_id, due_date ASC) WHERE status = 'pending';
          CREATE INDEX IF NOT EXISTS idx_reminders_sub_due ON reminders(user_id, subscription_id, due_date);
        `);
      } catch (err) {
        console.error('[ensureSchema error]', err.message);
        schemaPromise = null;
        throw err;
      }
    })();
  }
  return schemaPromise;
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
  await ensureSchema();
  return executeDirectQuery(text, params);
}

export async function withTransaction(callback) {
  await ensureSchema();
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
