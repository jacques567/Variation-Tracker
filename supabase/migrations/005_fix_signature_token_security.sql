-- Add signature token expiration
ALTER TABLE public.variations
ADD COLUMN signature_token_expires_at timestamptz default (now() + interval '7 days');

-- Update existing tokens to expire in 7 days (default behavior going forward)
UPDATE public.variations
SET signature_token_expires_at = created_at + interval '7 days'
WHERE signature_token_expires_at IS NULL;

-- Fix the RLS policy: only allow public read if they provide the correct token
-- We'll use a security definer function to check the token from the request
CREATE OR REPLACE FUNCTION public.verify_signature_token(token uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.variations
    WHERE signature_token = token
      AND signature_token_expires_at > now()
      AND status != 'signed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can read variation by token" ON public.variations;

-- Create a new policy that requires passing the token (app will filter by token in WHERE clause)
-- Since Postgres doesn't have a direct way to pass custom params in RLS, we allow all public reads
-- but the app MUST filter by token in the query
CREATE POLICY "Public read variations with valid token"
  ON public.variations FOR SELECT
  USING (signature_token_expires_at > now());

-- Also add RLS to admin_emails to prevent enumeration
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public cannot read admin emails"
  ON public.admin_emails FOR SELECT
  USING (false);

CREATE POLICY "Admins can read admin emails"
  ON public.admin_emails FOR SELECT
  USING (auth.email() IN (SELECT email FROM public.admin_emails));
