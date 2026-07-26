-- Tracks whether the contractor has already been emailed for a given variation's
-- signing-link expiry, so the daily cron job (see /api/cron/variation-notifications)
-- doesn't send duplicate reminders/notices on subsequent runs.

alter table public.variations
add column expiry_reminder_sent_at timestamptz,
add column expiry_notice_sent_at timestamptz;
