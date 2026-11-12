-- Fix false "content_mismatch" rejections on sign_variation().
--
-- Two bugs in the check added by 20260726191210_signature_evidential_integrity.sql:
--
-- 1. The declaration wording was recently changed so a negative cost (a
--    discount/reduction) is now described in the client's browser as a
--    positive magnitude ("the resulting reduction of £4,500.00") rather than
--    a signed figure ("the additional cost of -£4,500.00"). The old check
--    searched for the signed decimal (e.g. "-4500.00"), which no longer
--    appears anywhere in that rendered text — every discount variation would
--    fail to sign. Compare against the absolute value instead; the
--    declaration only needs to state the correct magnitude, not the sign
--    (the framing — "additional cost" vs "reduction" — already carries that).
--
-- 2. Intl.NumberFormat can render a negative amount using U+2212 (MINUS SIGN)
--    instead of ASCII U+002D (HYPHEN-MINUS) depending on browser/locale data,
--    which also broke the substring match intermittently for signed values
--    even before the wording change above. Comparing on the absolute value
--    sidesteps this too, since the compared string is never signed.
--
-- Everything else below is copied verbatim from the prior version — only the
-- `position(...)` comparison line changes (v_variation.cost -> abs(v_variation.cost)).
CREATE OR REPLACE FUNCTION public.sign_variation(
  p_variation_id     uuid,
  p_client_name      text,
  p_signature_data   text,
  p_client_ip        inet,
  p_declaration_text text,
  p_user_agent       text
)
RETURNS jsonb AS $$
DECLARE
  v_variation public.variations;
  v_hash      text;
BEGIN
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

  IF p_declaration_text IS NULL OR btrim(p_declaration_text) = '' THEN
    RETURN jsonb_build_object(
      'error', 'Declaration text is required', 'code', 'missing_declaration'
    );
  END IF;

  -- Commas are stripped first: the client renders "£1,234.00" but cost is
  -- stored in pence, so the comparison is made on the ungrouped decimal form.
  -- Compared on abs(cost) — see file header for why.
  IF position(
           to_char(abs(v_variation.cost) / 100.0, 'FM999999990.00')
           IN replace(p_declaration_text, ',', '')
         ) = 0 THEN
    RETURN jsonb_build_object(
      'error', 'Variation changed while you were signing. Please reload and try again.',
      'code', 'content_mismatch'
    );
  END IF;

  v_hash := encode(
    digest(
      v_variation.id::text || '|' ||
      coalesce(v_variation.description, '') || '|' ||
      v_variation.cost::text || '|' ||
      coalesce(v_variation.date::text, ''),
      'sha256'
    ),
    'hex'
  );

  INSERT INTO public.signatures (
    variation_id, client_name, signature_data, client_ip,
    declaration_text, user_agent,
    signed_description, signed_cost, signed_date, content_hash
  )
  VALUES (
    p_variation_id, p_client_name, p_signature_data, p_client_ip,
    p_declaration_text, p_user_agent,
    v_variation.description, v_variation.cost, v_variation.date, v_hash
  );

  UPDATE public.variations
  SET
    status                     = 'signed',
    signature_token_expires_at = now()
  WHERE id = p_variation_id;

  RETURN jsonb_build_object('success', true, 'content_hash', v_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
