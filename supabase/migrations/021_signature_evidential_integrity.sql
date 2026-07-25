-- Signature evidential integrity
--
-- Addresses three defects in the e-signature evidence bundle. A fourth —
-- signed variations remaining editable — was fixed by 019_lock_signed_variations.sql
-- while this branch was open; see section 2 below.
--
--   2. The declaration shown to the client ("I authorise this variation and the
--      additional cost of £X") was rendered client-side only and never stored,
--      so the actual consent wording could not be produced in evidence.
--
--   3. No snapshot of the variation content as it stood at the moment of
--      signing, and no hash to prove the snapshot itself is untampered.
--
--   4. No record of how the signing link reached the client (email, WhatsApp,
--      SMS, in person). See variation_deliveries below — note the honest
--      distinction between system-sent and contractor-declared evidence.


-- digest() for the content hash lives in pgcrypto.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ─── 1. SIGNATURE CONTENT SNAPSHOT + CONSENT WORDING ────────────────────────
-- Columns are nullable because pre-existing signature rows cannot be
-- retrospectively snapshotted. A NULL snapshot means "signed before this
-- migration" and should be presented as such, never as a verified snapshot.

ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS declaration_text  text,
  ADD COLUMN IF NOT EXISTS user_agent        text,
  ADD COLUMN IF NOT EXISTS signed_description text,
  ADD COLUMN IF NOT EXISTS signed_cost       integer,   -- pence, matching variations.cost
  ADD COLUMN IF NOT EXISTS signed_date       date,
  ADD COLUMN IF NOT EXISTS content_hash      text;

COMMENT ON COLUMN public.signatures.declaration_text IS
  'Verbatim consent wording displayed to the signatory at the moment of signing.';
COMMENT ON COLUMN public.signatures.content_hash IS
  'SHA-256 of variation id|description|cost|date at signing time. Recomputable to detect post-signing edits.';


-- ─── 2. LOCK SIGNED VARIATIONS — ALREADY DONE ───────────────────────────────
-- Defect 1 was fixed independently by 019_lock_signed_variations.sql while this
-- branch was open. That migration is the authority; nothing is redefined here,
-- because two migrations dropping and recreating the same policy would make the
-- final state depend on apply order.
--
-- 019 additionally blocks flipping status to 'signed' by hand in its WITH CHECK,
-- which this branch's version did not, and documents the remaining cascade-delete
-- gap (deleting a parent job still removes signed variations — left open
-- deliberately, since blocking it collides with the GDPR right to erasure).
--
-- Signatures are append-only. Nothing in the application updates or deletes
-- them; absent policies mean RLS denies both for anon and authenticated roles.


-- ─── 3. DELIVERY AUDIT TRAIL ────────────────────────────────────────────────
-- How the signing link reached the client.
--
-- evidence_source is the load-bearing column:
--   'system'   — the platform performed the send and holds the provider record
--                (e.g. the confirmation email sent via Resend).
--   'declared' — the contractor states they sent it this way. Contemporaneous
--                and timestamped, but self-reported. Weaker evidence, and the
--                PDF must label it as such rather than implying verification.
--
-- Sharing currently happens via clipboard copy or the OS share sheet, neither
-- of which reveals the destination app to the page. Recording the share event
-- honestly ("link copied at 14:02") is worth more than inferring a channel we
-- cannot observe.

CREATE TABLE IF NOT EXISTS public.variation_deliveries (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id    uuid        NOT NULL REFERENCES public.variations(id) ON DELETE CASCADE,
  channel         text        NOT NULL CHECK (channel IN (
                                'email', 'whatsapp', 'sms', 'share_sheet',
                                'link_copied', 'in_person', 'other'
                              )),
  recipient       text,                       -- email address or mobile number, as sent
  note            text,                       -- free-text context, e.g. "handed over on site"
  evidence_source text        NOT NULL DEFAULT 'declared'
                              CHECK (evidence_source IN ('system', 'declared')),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  recorded_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  client_ip       text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS variation_deliveries_variation_id_idx
  ON public.variation_deliveries(variation_id, sent_at DESC);

ALTER TABLE public.variation_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can read own delivery records"
  ON public.variation_deliveries FOR SELECT
  USING (
    auth.uid() = (
      SELECT j.contractor_id
      FROM public.variations v
      JOIN public.jobs j ON j.id = v.job_id
      WHERE v.id = variation_id
    )
  );

CREATE POLICY "Contractors can record own deliveries"
  ON public.variation_deliveries FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid()
    AND auth.uid() = (
      SELECT j.contractor_id
      FROM public.variations v
      JOIN public.jobs j ON j.id = v.job_id
      WHERE v.id = variation_id
    )
  );

-- Append-only: no UPDATE or DELETE policy. A delivery log that can be rewritten
-- after a dispute arises is not evidence.

CREATE POLICY "Admins can read all delivery records"
  ON public.variation_deliveries FOR SELECT
  USING (public.is_admin());


-- ─── 4. sign_variation() — SNAPSHOT AT SIGNING ──────────────────────────────
-- The snapshot is taken server-side from the locked row, never from the client
-- payload. The declaration text does come from the client (it is what their
-- browser rendered), but every value interpolated into it is verified against
-- the locked row below, so a tampered declaration is rejected rather than
-- stored.

CREATE OR REPLACE FUNCTION public.sign_variation(
  p_variation_id    uuid,
  p_client_name     text,
  p_signature_data  text,
  p_client_ip       inet,
  p_declaration_text text DEFAULT NULL,
  p_user_agent      text DEFAULT NULL
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

  -- The declaration states the cost. If the client's browser rendered a cost
  -- that no longer matches the row we are about to sign, the variation changed
  -- underneath them — refuse rather than record a consent to the wrong figure.
  -- Commas are stripped first: the client renders "£1,234.00" but cost is
  -- stored in pence, so the comparison is made on the ungrouped decimal form.
  IF p_declaration_text IS NOT NULL
     AND position(
           to_char(v_variation.cost / 100.0, 'FM999999990.00')
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

-- Drop the 4-arg signature so no caller can silently sign without a snapshot.
DROP FUNCTION IF EXISTS public.sign_variation(uuid, text, text, inet);
