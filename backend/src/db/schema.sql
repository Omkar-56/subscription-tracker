-- SubTrack schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id TEXT,
  avatar_url TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  reminder_days_before INT NOT NULL DEFAULT 3,
  reset_password_token TEXT,
  reset_password_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist for existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_days_before INT NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token);

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
