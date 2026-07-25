-- ─── LOCK SIGNED VARIATIONS ─────────────────────────────────────────────────
--
-- A signed variation is evidence. The client drew a signature against a
-- specific description and a specific cost, and the invoice now reproduces
-- that signature as formal proof of what they agreed to.
--
-- Until this migration, the UPDATE policy on variations checked ownership and
-- nothing else. A contractor could sign off a £500 variation, then change the
-- cost to £5,000 afterwards. The signature row was never touched, so the
-- invoice would show the client's genuine signature beside a figure they had
-- never seen. Reachable straight from the browser with the public anon key —
-- no app code needed.
--
-- After this migration, once status = 'signed' the row is frozen to the
-- contractor: no edits, no deletion.
--
-- Signing itself still works. public.sign_variation is SECURITY DEFINER and
-- bypasses RLS, as does the expiry-notification cron (service role). Those are
-- the only paths that legitimately write to a variation's status.

-- ─── 1. UPDATE — owner only, and only while unsigned ────────────────────────
DROP POLICY IF EXISTS "Contractors can update own variations" ON public.variations;

CREATE POLICY "Contractors can update own unsigned variations"
  ON public.variations FOR UPDATE
  USING (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
    AND status <> 'signed'   -- can't touch a row that has been signed
  )
  WITH CHECK (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id  -- no job_id reassignment
    )
    AND status <> 'signed'   -- and can't mark one signed by hand; only the
                             -- sign_variation RPC may do that, and it always
                             -- writes a matching signature row in the same
                             -- transaction. Without this a contractor could
                             -- flip status to 'signed' with no signature at all.
  );

-- ─── 2. DELETE — owner only, and only while unsigned ────────────────────────
DROP POLICY IF EXISTS "Contractors can delete own variations" ON public.variations;

CREATE POLICY "Contractors can delete own unsigned variations"
  ON public.variations FOR DELETE
  USING (
    auth.uid() = (
      select contractor_id from public.jobs where id = job_id
    )
    AND status <> 'signed'
  );

-- ─── KNOWN GAP (deliberate — needs a product decision) ───────────────────────
--
-- Deleting the parent job still removes signed variations, because
-- variations.job_id cascades on delete, and cascade deletes do not consult the
-- child table's RLS policies. contractors -> jobs cascades the same way.
--
-- This is left open on purpose. Blocking it would mean a contractor could not
-- delete a job (or close their account) once anything was signed, which
-- collides with the GDPR right to erasure. Retention vs erasure is a legal
-- call for the business, not something to settle in a migration.
--
-- Note the two are different in character: editing one signed variation's cost
-- is quiet, targeted, and produces a plausible-looking fraudulent invoice.
-- Deleting the whole job destroys the invoice along with it. This migration
-- closes the quiet path.
--
-- If retention wins, the shape is: block hard-delete of jobs holding signed
-- variations and steer users to the existing 'archived' status instead.
