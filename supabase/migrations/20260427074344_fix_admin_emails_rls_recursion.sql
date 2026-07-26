-- Fix infinite recursion in admin_emails RLS policy
-- The "Admins can read admin emails" policy caused recursion because it
-- queries admin_emails to check the policy, which requires checking the policy again.
--
-- Admin authorization is already checked server-side (API routes) using the service role key,
-- which bypasses RLS. So we only need the deny policy for public to prevent enumeration.

DROP POLICY IF EXISTS "Admins can read admin emails" ON public.admin_emails;

-- The "Public cannot read admin emails" policy remains to prevent enumeration
-- Users cannot list or read admin emails via client, but API routes use service role
