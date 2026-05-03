-- ─── CSRF TOKENS ────────────────────────────────────────────────────────────
-- Store CSRF tokens in database for persistence across restarts and user binding
create table public.csrf_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now() not null,
  client_ip text
);

-- Indexes for performance
create index idx_csrf_tokens_user_id on public.csrf_tokens(user_id);
create index idx_csrf_tokens_expires_at on public.csrf_tokens(expires_at);
create index idx_csrf_tokens_token on public.csrf_tokens(token);

-- Enable RLS
alter table public.csrf_tokens enable row level security;

-- RLS Policies: Users can only read their own tokens
create policy "Users can read own csrf tokens"
  on public.csrf_tokens for select
  using (auth.uid() = user_id);

-- Allow authenticated users to create CSRF tokens (includes anon key)
create policy "Allow authenticated users to create csrf tokens"
  on public.csrf_tokens for insert
  with check (true);

-- Allow service role to manage tokens (insert/update/delete)
create policy "Service role can manage csrf tokens"
  on public.csrf_tokens for all
  using (auth.role() = 'service_role');

-- Allow authenticated users to update tokens (mark as used)
create policy "Allow authenticated users to update csrf tokens"
  on public.csrf_tokens for update
  using (true)
  with check (true);

-- Cleanup function for expired/used tokens (called periodically)
create or replace function public.cleanup_expired_csrf_tokens()
returns void as $$
begin
  delete from public.csrf_tokens
  where expires_at < now()
    or (used = true and created_at < now() - interval '1 day');
end;
$$ language plpgsql;
