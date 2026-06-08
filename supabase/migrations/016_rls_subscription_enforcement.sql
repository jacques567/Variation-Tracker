-- RLS subscription enforcement for jobs and variations INSERT.
--
-- Problem: the existing 'for all' RLS policies on jobs and variations only check
-- ownership (auth.uid() = contractor_id). An authenticated user with an expired
-- trial or cancelled subscription can write directly to the PostgREST API and
-- create records — bypassing the middleware redirect and API route guards.
--
-- Solution: split the broad 'for all' policies into explicit per-operation policies.
-- SELECT / UPDATE / DELETE keep the ownership-only check (users can still read and
-- manage existing data after expiry). INSERT requires an active subscription.
--
-- The has_active_subscription() function is the single source of truth for
-- "is this user allowed to write?" at the database layer. It mirrors the TypeScript
-- evaluateSubscription() logic in src/lib/subscription-evaluation.ts. Any change to
-- the trial/grace-period rules must be reflected in both places.


-- ─── SUBSCRIPTION CHECK FUNCTION ────────────────────────────────────────────

-- Returns true if the current authenticated user has a valid subscription:
--   active:     paid and current
--   trialing:   within the 7-day app-managed trial window
--   past_due:   within the 7-day grace period before hard lockout
--
-- Uses SECURITY DEFINER so the function executes as its owner (bypasses RLS on
-- the contractors table — prevents infinite recursion if contractors itself ever
-- has a subscription-gated policy).
-- STABLE: reads data, never writes, result can be cached within a single query.
-- set search_path: prevents search-path injection attacks.

create or replace function public.has_active_subscription()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.contractors
    where id = auth.uid()
      and (
        subscription_status = 'active'
        or (subscription_status = 'trialing'  and trial_ends_at            > now())
        or (subscription_status = 'past_due'  and grace_period_expires_at  > now())
      )
  )
$$;

-- Restrict direct calls: only authenticated users (via RLS evaluation) and service
-- role should invoke this. Anon should not be able to probe subscription state.
revoke all on function public.has_active_subscription() from public, anon;
grant execute on function public.has_active_subscription() to authenticated;


-- ─── JOBS ────────────────────────────────────────────────────────────────────

-- Drop the single 'for all' policy and replace with per-operation policies.
drop policy "Contractors can manage own jobs" on public.jobs;

-- Read + manage existing records: ownership only.
-- Expired users can still view/edit/delete their existing jobs.
create policy "Contractors can select own jobs"
  on public.jobs for select
  using (auth.uid() = contractor_id);

create policy "Contractors can update own jobs"
  on public.jobs for update
  using  (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id); -- prevents contractor_id reassignment via UPDATE

create policy "Contractors can delete own jobs"
  on public.jobs for delete
  using (auth.uid() = contractor_id);

-- Create new jobs: requires active subscription.
create policy "Contractors can insert jobs with active subscription"
  on public.jobs for insert
  with check (
    auth.uid() = contractor_id
    and public.has_active_subscription()
  );


-- ─── VARIATIONS ──────────────────────────────────────────────────────────────

drop policy "Contractors can manage own variations" on public.variations;

-- Ownership check resolves via the parent job's contractor_id.
create policy "Contractors can select own variations"
  on public.variations for select
  using (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
  );

create policy "Contractors can update own variations"
  on public.variations for update
  using (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id -- relies on jobs(id) PK index
    )
  )
  with check (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id -- prevents job_id reassignment via UPDATE
    )
  );

create policy "Contractors can delete own variations"
  on public.variations for delete
  using (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
  );

-- Create new variations: requires active subscription.
create policy "Contractors can insert variations with active subscription"
  on public.variations for insert
  with check (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
    and public.has_active_subscription()
  );


-- ─── STORAGE (variation-photos bucket) ───────────────────────────────────────

-- The existing upload policy only checks auth.uid() is not null — any authenticated
-- user can upload photos regardless of subscription. Gate uploads to match the
-- variation INSERT policy, so expired users can't consume storage quota.

drop policy "Contractors can upload photos" on storage.objects;

create policy "Contractors can upload photos with active subscription"
  on storage.objects for insert
  with check (
    bucket_id = 'variation-photos'
    and auth.uid() is not null
    and public.has_active_subscription()
  );

-- Note: the public read policy on storage.objects for the signature flow is unchanged.
-- Clients signing a variation use a public URL — no auth, no subscription check needed.
