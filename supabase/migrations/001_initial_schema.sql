-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── CONTRACTORS ────────────────────────────────────────────────────────────
create table public.contractors (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text not null,
  company_name        text,
  phone               text,
  stripe_customer_id  text unique,
  subscription_status text check (subscription_status in ('active','trialing','past_due','canceled','incomplete')),
  subscription_id     text unique,
  created_at          timestamptz default now() not null
);

alter table public.contractors enable row level security;

create policy "Contractors can view own profile"
  on public.contractors for select
  using (auth.uid() = id);

create policy "Contractors can update own profile"
  on public.contractors for update
  using (auth.uid() = id);

-- ─── JOBS ───────────────────────────────────────────────────────────────────
create table public.jobs (
  id              uuid primary key default uuid_generate_v4(),
  contractor_id   uuid not null references public.contractors(id) on delete cascade,
  client_name     text not null,
  client_email    text not null,
  client_phone    text,
  job_name        text not null,
  address         text not null,
  original_value  integer not null default 0, -- stored in pence
  status          text not null default 'active' check (status in ('active','completed','archived')),
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.jobs enable row level security;

create policy "Contractors can manage own jobs"
  on public.jobs for all
  using (auth.uid() = contractor_id);

-- ─── VARIATIONS ─────────────────────────────────────────────────────────────
create table public.variations (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid not null references public.jobs(id) on delete cascade,
  description      text not null,
  cost             integer not null default 0, -- stored in pence
  date             date not null default current_date,
  photo_url        text,
  status           text not null default 'draft' check (status in ('draft','pending','signed')),
  signature_token  uuid not null default uuid_generate_v4() unique,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

alter table public.variations enable row level security;

create policy "Contractors can manage own variations"
  on public.variations for all
  using (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
  );

-- Public read via signature token (for client sign page — no auth required)
create policy "Public can read variation by token"
  on public.variations for select
  using (true);

-- ─── SIGNATURES ─────────────────────────────────────────────────────────────
create table public.signatures (
  id              uuid primary key default uuid_generate_v4(),
  variation_id    uuid not null references public.variations(id) on delete cascade unique,
  client_name     text not null,
  signature_data  text not null, -- base64 PNG
  signed_at       timestamptz default now() not null,
  client_ip       text
);

alter table public.signatures enable row level security;

-- Contractors can read signatures on their own variations
create policy "Contractors can read own signatures"
  on public.signatures for select
  using (
    auth.uid() = (
      select j.contractor_id
      from public.variations v
      join public.jobs j on j.id = v.job_id
      where v.id = variation_id
    )
  );

-- Public can insert (client submits signature — no auth)
create policy "Public can insert signature"
  on public.signatures for insert
  with check (true);

-- ─── STORAGE BUCKET ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('variation-photos', 'variation-photos', false);

create policy "Contractors can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'variation-photos' and auth.uid() is not null);

create policy "Contractors can view own photos"
  on storage.objects for select
  using (bucket_id = 'variation-photos' and auth.uid() is not null);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

create trigger variations_updated_at
  before update on public.variations
  for each row execute function public.handle_updated_at();

-- ─── NEW USER TRIGGER ───────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.contractors (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
