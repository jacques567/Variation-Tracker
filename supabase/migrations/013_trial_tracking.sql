-- Trial tracking: 7-day auto-enrolled trial on signup
-- See TASKS.md "Auto-Enroll Trial" section.

-- 1. Add trial_ends_at column
alter table public.contractors
add column trial_ends_at timestamptz;

create index idx_contractors_trial_ends_at on public.contractors(trial_ends_at)
where subscription_status = 'trialing';

-- 2. expire_trials() — sets subscription_status to 'none' for expired auto-enrolled trials.
-- Only targets trials WITHOUT a Stripe subscription_id, so we don't override Stripe-managed
-- trials (Stripe webhooks own those transitions).
create or replace function public.expire_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.contractors
    set subscription_status = 'none'
  where subscription_status = 'trialing'
    and trial_ends_at is not null
    and trial_ends_at < now()
    and subscription_id is null;

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.expire_trials() from public, anon, authenticated;

-- 3. Schedule via pg_cron — runs daily at 00:15 UTC.
-- pg_cron is enabled by default on Supabase. If your plan disables it, replace with a
-- Supabase Edge Function on a cron schedule that calls expire_trials().
-- Migration is idempotent: drop any existing job with the same name before scheduling.
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'expire-trials-daily') then
    perform cron.unschedule('expire-trials-daily');
  end if;
end $$;

select cron.schedule(
  'expire-trials-daily',
  '15 0 * * *',
  $$ select public.expire_trials(); $$
);
