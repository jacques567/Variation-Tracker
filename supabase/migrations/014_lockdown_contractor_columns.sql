-- Lock down which columns authenticated users can update on their own contractor row.
-- The existing "Contractors can update own profile" RLS policy gates UPDATEs row-by-row
-- (auth.uid() = id). On top of that, this migration narrows the writable column set so
-- users cannot elevate their own subscription_status, trial_ends_at, grace_period_expires_at,
-- subscription_id, stripe_customer_id, role, or login-tracking fields directly via the
-- Supabase client.
--
-- Service-role clients (signup endpoint, Stripe webhook, cron) bypass RLS and column
-- grants entirely, so they retain full UPDATE access — which is what we want.

revoke update on public.contractors from authenticated;

grant update (
  full_name,
  company_name,
  phone
) on public.contractors to authenticated;
