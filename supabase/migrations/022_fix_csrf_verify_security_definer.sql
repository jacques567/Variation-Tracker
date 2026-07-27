-- Fix: verify_and_mark_csrf_token was never actually SECURITY DEFINER.
--
-- Migration 010 tightened csrf_tokens' UPDATE policy to service_role only,
-- on the stated assumption that this RPC was SECURITY DEFINER and therefore
-- didn't need a broader policy (see 010's own header comment, point 3).
-- That assumption was wrong — 008 created the function with the default
-- SECURITY INVOKER, so it runs with the calling role's privileges.
--
-- Since Postgres RLS gates `SELECT ... FOR UPDATE` on the UPDATE policy (not
-- just SELECT) — the row lock is treated as update-intent — and no UPDATE
-- policy exists for `authenticated` or `anon`, the function's `for update`
-- clause has been silently matching zero rows for every caller since 010
-- shipped. verifyCsrfToken() in src/lib/csrf.ts has therefore been rejecting
-- every legitimate token as "token_not_found", and every delivery-record /
-- signature-flow write gated by CSRF has been failing.
--
-- Fix: mark the function SECURITY DEFINER, matching is_admin() and
-- verify_signature_token() elsewhere in this schema. This is safe because
-- the function already self-validates ownership (p_user_id match) and
-- single-use (used = false) before mutating — it doesn't need RLS to do
-- that job, which is exactly why it was designed as a dedicated RPC.

CREATE OR REPLACE FUNCTION public.verify_and_mark_csrf_token(
  p_token text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
  v_user_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Lock and read: SELECT FOR UPDATE prevents concurrent reads
  SELECT id, user_id, expires_at
  INTO v_id, v_user_id, v_expires_at
  FROM public.csrf_tokens
  WHERE token = p_token
    AND used = false
  FOR UPDATE;

  -- Token not found or already used
  IF v_id IS NULL THEN
    RETURN jsonb_build_object('is_valid', false, 'reason', 'token_not_found');
  END IF;

  -- Token expired
  IF v_expires_at < now() THEN
    RETURN jsonb_build_object('is_valid', false, 'reason', 'expired');
  END IF;

  -- User binding mismatch (if user specified)
  IF p_user_id IS NOT NULL AND v_user_id != p_user_id THEN
    RETURN jsonb_build_object('is_valid', false, 'reason', 'user_mismatch');
  END IF;

  -- Mark token as used atomically (within same transaction)
  UPDATE public.csrf_tokens SET used = true WHERE id = v_id;

  RETURN jsonb_build_object('is_valid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_and_mark_csrf_token(text, uuid) TO authenticated, anon;
