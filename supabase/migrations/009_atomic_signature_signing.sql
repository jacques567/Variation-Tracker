-- Create atomic RPC function for signing variations
-- This prevents race conditions where two concurrent requests could both insert signatures
-- and update the variation status, causing duplicate records.

CREATE OR REPLACE FUNCTION public.sign_variation(
  p_variation_id uuid,
  p_client_name text,
  p_signature_data text,
  p_client_ip inet
)
RETURNS jsonb AS $$
DECLARE
  v_variation variations;
  v_result jsonb;
BEGIN
  -- Lock the variation row for update to prevent concurrent modifications
  SELECT * INTO v_variation FROM public.variations
  WHERE id = p_variation_id
  FOR UPDATE;

  -- Check if variation exists
  IF v_variation IS NULL THEN
    RETURN jsonb_build_object('error', 'Variation not found', 'code', 'not_found');
  END IF;

  -- Check if already signed
  IF v_variation.status = 'signed' THEN
    RETURN jsonb_build_object('error', 'Already signed', 'code', 'already_signed');
  END IF;

  -- Insert the signature
  INSERT INTO public.signatures (variation_id, client_name, signature_data, client_ip)
  VALUES (p_variation_id, p_client_name, p_signature_data, p_client_ip);

  -- Update variation status to signed
  UPDATE public.variations
  SET status = 'signed'
  WHERE id = p_variation_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
