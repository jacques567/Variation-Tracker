-- Migration 012: Unique email constraint + login activity tracking
-- Prevents duplicate user accounts, tracks last login for efficient admin UI

-- Add unique constraint on contractors.email
ALTER TABLE contractors ADD CONSTRAINT contractors_email_unique UNIQUE(email);

-- Add last_login_at column to track login activity
ALTER TABLE contractors ADD COLUMN last_login_at timestamptz DEFAULT NULL;

-- Create index on last_login_at for faster queries in admin dashboard
CREATE INDEX contractors_last_login_at_idx ON contractors(last_login_at DESC);

-- Add login_attempt_count for rate limiting (tracks failed attempts)
ALTER TABLE contractors ADD COLUMN login_attempt_count INT DEFAULT 0;

-- Add login_attempt_reset_at to track when to reset attempt counter
ALTER TABLE contractors ADD COLUMN login_attempt_reset_at timestamptz DEFAULT NULL;

-- Index for failed login rate limiting queries
CREATE INDEX contractors_login_attempt_reset_idx ON contractors(login_attempt_reset_at);
