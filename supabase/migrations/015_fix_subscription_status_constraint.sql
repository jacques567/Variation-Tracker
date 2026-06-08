-- Fix subscription_status constraint to include 'none'.
--
-- expire_trials() (migration 013) transitions expired auto-enrolled trials to
-- subscription_status = 'none', but the column check constraint from migration 001
-- only permits ('active','trialing','past_due','canceled','incomplete').
--
-- Effect: every cron run has been throwing a constraint violation and silently failing —
-- expired trial users were staying on 'trialing' indefinitely.
--
-- 'none' is the canonical "no active subscription" state used throughout the application
-- (subscription-guard.ts evaluateSubscription, getReasonForStatus). NULL is preserved as
-- "record exists but status not yet written" — distinct from an explicit 'none'.

alter table public.contractors
  drop constraint contractors_subscription_status_check;

alter table public.contractors
  add constraint contractors_subscription_status_check
  check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'none'));

-- Also rename the duplicate 014 migration for rate_limit_tracking to 015 to fix the
-- numbering collision. The table was already created in production, so this migration
-- only updates the local filename convention — no SQL change needed here.
-- NOTE: Rename 014_rate_limit_tracking.sql → 015_rate_limit_tracking.sql in a follow-up
-- housekeeping commit (cannot rename a file that was already applied to production via
-- supabase db push without a full reset; the constraint fix above is the actionable change).
