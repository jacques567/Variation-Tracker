-- Structured event log for security-relevant failures (auth, CSRF, signature
-- rejections) that today only reach console.error and disappear in prod.
-- Mirrors the pattern already proven by stripe_webhook_logs.
create table if not exists public.security_event_logs (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  status text not null check (status in ('success', 'failed')),
  error_message text,
  contractor_id uuid references public.contractors(id) on delete set null,
  client_ip text,
  metadata jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now()
);

create index if not exists security_event_logs_event_type_idx
  on public.security_event_logs (event_type, logged_at desc);

alter table public.security_event_logs enable row level security;

-- Writes go through the service-role client only (same as stripe_webhook_logs);
-- no policy grants access to anon/authenticated roles.
