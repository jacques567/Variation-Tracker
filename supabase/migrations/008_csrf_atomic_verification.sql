-- Atomic CSRF token verification to prevent race conditions
-- Ensures token can't be used twice even under high concurrency
create or replace function public.verify_and_mark_csrf_token(
  p_token text,
  p_user_id uuid default null
)
returns jsonb as $$
declare
  v_id uuid;
  v_user_id uuid;
  v_expires_at timestamptz;
  v_secret text;
begin
  -- Lock and read: SELECT FOR UPDATE prevents concurrent reads
  select id, user_id, expires_at
  into v_id, v_user_id, v_expires_at
  from public.csrf_tokens
  where token = p_token
    and used = false
  for update;

  -- Token not found or already used
  if v_id is null then
    return jsonb_build_object('is_valid', false, 'reason', 'token_not_found');
  end if;

  -- Token expired
  if v_expires_at < now() then
    return jsonb_build_object('is_valid', false, 'reason', 'expired');
  end if;

  -- User binding mismatch (if user specified)
  if p_user_id is not null and v_user_id != p_user_id then
    return jsonb_build_object('is_valid', false, 'reason', 'user_mismatch');
  end if;

  -- Mark token as used atomically (within same transaction)
  update public.csrf_tokens set used = true where id = v_id;

  return jsonb_build_object('is_valid', true);
end;
$$ language plpgsql;

-- Grant execution to authenticated and anonymous users
-- Note: Real authorization (who can call this RPC) is enforced at the application level:
-- - /api/sign: Public endpoint, allows unauthenticated CSRF verification
-- - /api/signatures: Requires authentication before calling RPC
grant execute on function public.verify_and_mark_csrf_token to authenticated, anon;
