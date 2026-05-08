-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 010: Security Hardening
--
-- Fixes:
-- 1. Remove "Public can insert signature" — sign_variation RPC is SECURITY
--    DEFINER and handles inserts; this open policy allows direct table
--    inserts that bypass status checks, row locking, and token validation.
-- 2. Remove overly broad "Public read variations with valid token" — replaced
--    by get_variation_by_token() SECURITY DEFINER RPC which only returns the
--    specific variation for a given token, exposing no other rows.
-- 3. Tighten csrf_tokens UPDATE policy — "Allow authenticated users to
--    update csrf tokens" uses USING (true), allowing any user to mark any
--    token as used (DoS) or reset the used flag. The verify_and_mark_csrf_token
--    RPC is SECURITY DEFINER so it doesn't need this policy.
-- 4. Introduce is_admin() SECURITY DEFINER function — fixes admin panel being
--    inaccessible because admin_emails SELECT policy is USING (false), blocking
--    the session client used in admin/layout.tsx.
-- 5. Introduce get_variation_by_token() SECURITY DEFINER function — safe public
--    read path that exposes only sign-page fields; no contractor_id, no job_id.
-- 6. Invalidate signature token on signing — sign_variation now sets
--    signature_token_expires_at = now() so the link becomes invalid immediately
--    after signing, not just after the 7-day window.
-- 7. Add audit_log table — captures security-sensitive events (signatures
--    created) for compliance and incident response.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. DROP DANGEROUS / OVERLY BROAD RLS POLICIES ──────────────────────────

-- Signatures: public insert is not needed — sign_variation RPC is SECURITY
-- DEFINER and bypasses RLS. This open policy lets anyone insert fake signatures.
DROP POLICY IF EXISTS "Public can insert signature" ON public.signatures;

-- Variations: public read by expiry alone is too broad — any anon client can
-- enumerate all non-expired variations without knowing a token.
DROP POLICY IF EXISTS "Public read variations with valid token" ON public.variations;

-- csrf_tokens: overly broad UPDATE policy — any role can update any token row.
-- verify_and_mark_csrf_token() is SECURITY DEFINER and handles this internally.
DROP POLICY IF EXISTS "Allow authenticated users to update csrf tokens" ON public.csrf_tokens;

-- Add a correctly scoped UPDATE policy: service role only.
CREATE POLICY "Service role can update csrf tokens"
  ON public.csrf_tokens FOR UPDATE
  USING (auth.role() = 'service_role');


-- ─── 2. is_admin() — SECURITY DEFINER ADMIN CHECK ───────────────────────────
-- No-argument form reads auth.email() from the calling JWT internally.
-- Fixes admin layout/notes routes that query admin_emails via session client
-- (which is blocked by the existing USING (false) SELECT RLS policy).
-- Drop any old signature variants first.
DROP FUNCTION IF EXISTS public.is_admin(email text);
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_email text;
BEGIN
  v_email := auth.email();
  IF v_email IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = v_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only authenticated users can call this; anon cannot impersonate an admin.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ─── 3. get_variation_by_token() — SAFE PUBLIC READ PATH ────────────────────
-- Replaces the dropped public RLS policy on variations.
-- Returns ONLY the fields the sign page needs — no contractor_id, no job_id,
-- no client_email, no client_phone. Token is the gate; rate-limiting on the
-- API route provides additional protection against enumeration.
DROP FUNCTION IF EXISTS public.get_variation_by_token(uuid);

CREATE OR REPLACE FUNCTION public.get_variation_by_token(p_token uuid)
RETURNS TABLE (
  id                        uuid,
  description               text,
  cost                      integer,
  date                      date,
  photo_url                 text,
  status                    text,
  signature_token_expires_at timestamptz,
  job_name                  text,
  client_name               text,
  address                   text,
  signer_name               text,
  signed_at                 timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.description,
    v.cost,
    v.date,
    v.photo_url,
    v.status,
    v.signature_token_expires_at,
    j.job_name,
    j.client_name,
    j.address,
    s.client_name  AS signer_name,
    s.signed_at
  FROM public.variations v
  JOIN  public.jobs        j ON j.id = v.job_id
  LEFT JOIN public.signatures s ON s.variation_id = v.id
  WHERE v.signature_token = p_token
    -- Block access for expired, unsigned tokens — prevents reading variation
    -- details from links that were never signed and have since expired.
    -- Signed variations are always accessible (to show the "already signed"
    -- state); their token is invalidated by sign_variation() but the row
    -- is intentionally still readable so clients can confirm their signature.
    AND (
      v.signature_token_expires_at > now()
      OR v.status = 'signed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Both anon (client signing page) and authenticated (contractor preview) can call.
GRANT EXECUTE ON FUNCTION public.get_variation_by_token(uuid) TO anon, authenticated;


-- ─── 4. sign_variation() — INVALIDATE TOKEN ON SIGN ─────────────────────────
-- Adds signature_token_expires_at = now() to the UPDATE so the signing link
-- becomes invalid immediately after signing, not just after the 7-day window.
CREATE OR REPLACE FUNCTION public.sign_variation(
  p_variation_id  uuid,
  p_client_name   text,
  p_signature_data text,
  p_client_ip     inet
)
RETURNS jsonb AS $$
DECLARE
  v_variation public.variations;
BEGIN
  -- Lock the row for update — prevents concurrent signing race condition.
  SELECT * INTO v_variation
  FROM public.variations
  WHERE id = p_variation_id
  FOR UPDATE;

  IF v_variation IS NULL THEN
    RETURN jsonb_build_object('error', 'Variation not found', 'code', 'not_found');
  END IF;

  IF v_variation.status = 'signed' THEN
    RETURN jsonb_build_object('error', 'Already signed', 'code', 'already_signed');
  END IF;

  INSERT INTO public.signatures (variation_id, client_name, signature_data, client_ip)
  VALUES (p_variation_id, p_client_name, p_signature_data, p_client_ip);

  -- Set status AND immediately expire the token so the link is dead at once.
  UPDATE public.variations
  SET
    status                     = 'signed',
    signature_token_expires_at = now()
  WHERE id = p_variation_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5. audit_log TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   text        NOT NULL,
  actor_id     uuid,                            -- nullable: public signing has no actor
  target_table text,
  target_id    uuid,
  metadata     jsonb,
  client_ip    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins may read audit events.
CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

-- INSERT is restricted to service_role. The audit trigger (audit_on_signature_created)
-- is SECURITY DEFINER and runs as the function owner (postgres superuser), so it
-- bypasses RLS entirely — it does not need a permissive INSERT policy.
-- Keeping this locked to service_role prevents anon/authenticated clients from
-- injecting fabricated audit events via the Supabase REST API.
CREATE POLICY "Service role can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Index for common query patterns.
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type  ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_id   ON public.audit_log(target_id);


-- ─── 6. AUDIT TRIGGER — signatures ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_on_signature_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    event_type,
    target_table,
    target_id,
    metadata,
    client_ip
  ) VALUES (
    'signature.created',
    'signatures',
    NEW.id,
    jsonb_build_object(
      'variation_id', NEW.variation_id,
      'client_name',  NEW.client_name,
      'signed_at',    NEW.signed_at
    ),
    NEW.client_ip::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_signature_created ON public.signatures;
CREATE TRIGGER audit_signature_created
  AFTER INSERT ON public.signatures
  FOR EACH ROW EXECUTE FUNCTION public.audit_on_signature_created();
