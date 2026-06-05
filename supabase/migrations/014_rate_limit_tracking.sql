-- Rate limit tracking for signup endpoint
-- Stores per-IP signup attempts with automatic cleanup of old records

create table public.rate_limit_attempts (
  id bigserial primary key,
  endpoint_key text not null,
  attempted_at timestamptz not null default now()
);

create index idx_rate_limit_attempts_lookup on public.rate_limit_attempts(endpoint_key, attempted_at desc);

-- Lock down table permissions: service role only
alter table public.rate_limit_attempts enable row level security;
revoke all on table public.rate_limit_attempts from anon, authenticated;
grant select, insert, delete on table public.rate_limit_attempts to service_role;
