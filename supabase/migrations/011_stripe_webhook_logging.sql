-- Add grace period tracking to contractors table
alter table public.contractors
add column grace_period_expires_at timestamptz;

-- Create stripe webhook logs table for debugging and compliance
create table public.stripe_webhook_logs (
  id                uuid primary key default uuid_generate_v4(),
  event_type        text not null,
  event_id          text not null unique,
  status            text not null check (status in ('success', 'failed')),
  error_message     text,
  customer_id       text,
  subscription_id   text,
  payload           jsonb not null,
  logged_at         timestamptz default now() not null,
  created_at        timestamptz default now() not null
);

-- Enable RLS (admin-only access for now)
alter table public.stripe_webhook_logs enable row level security;

-- Only service role can read logs (no user access)
create policy "Service role can read webhook logs"
  on public.stripe_webhook_logs for select
  using (false); -- Prevent any user access; only service role bypasses RLS

-- Create index for efficient lookups
create index idx_stripe_webhook_logs_customer_id on public.stripe_webhook_logs(customer_id);
create index idx_stripe_webhook_logs_event_type on public.stripe_webhook_logs(event_type);
create index idx_stripe_webhook_logs_logged_at on public.stripe_webhook_logs(logged_at);
create index idx_stripe_webhook_logs_status on public.stripe_webhook_logs(status);
