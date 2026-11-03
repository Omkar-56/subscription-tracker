-- SubTrack Schema (Minimal, High-Performance, Cloudflare-Ready)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  base_currency TEXT NOT NULL DEFAULT 'INR',
  reset_password_token TEXT,
  reset_password_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure users structure & cleanup obsolete columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE users ALTER COLUMN base_currency SET DEFAULT 'INR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

-- 2. Subscriptions Table
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

-- 3. Payments Table (Cleaned: notes removed)
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

-- Remove notes column from payments if present
ALTER TABLE payments DROP COLUMN IF EXISTS notes CASCADE;
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_sub_date ON payments(subscription_id, paid_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, paid_date DESC, created_at DESC);

-- 4. Price History Table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  old_amount NUMERIC(10, 2) NOT NULL,
  new_amount NUMERIC(10, 2) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Price History Indexes
CREATE INDEX IF NOT EXISTS idx_price_history_sub_changed ON price_history(subscription_id, changed_at DESC);

-- 5. Reminders Table
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
