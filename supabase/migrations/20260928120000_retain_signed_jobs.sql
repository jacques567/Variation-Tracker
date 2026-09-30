-- ─── RETAIN JOBS HOLDING SIGNED VARIATIONS ──────────────────────────────────
--
-- Resolves the decision flagged as a "known gap" in
-- 20260725105048_lock_signed_variations.sql: retention wins over convenience
-- deletion. A signed variation is a contractual record — see the 6-year
-- retention promise in the privacy policy (UK Limitation Act 1980, and the
-- UK GDPR Art 17(3)(b) legal-claims exception to erasure).
--
-- Deleting the parent job cascades to its variations and signatures (see
-- 001_initial_schema.sql, job_id references public.jobs(id) on delete
-- cascade). That cascade does not consult RLS, so the earlier migration's
-- "no edits, no deletion" lock on signed variations doesn't stop a job-level
-- delete from wiping them anyway.
--
-- This migration closes that path with a trigger: hard-deleting a job that
-- has at least one signed variation is rejected outright. The job route
-- (src/app/api/jobs/[id]/route.ts) also checks this up front and returns a
-- friendly 409, steering the user to the existing 'archived' status instead
-- — this trigger is the backstop for any other path (console, script, a
-- future endpoint) that skips the API layer.

CREATE OR REPLACE FUNCTION public.prevent_delete_of_signed_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.variations
    WHERE job_id = OLD.id AND status = 'signed'
  ) THEN
    RAISE EXCEPTION
      'Cannot delete a job that has signed variations — archive it instead. (job_id: %)', OLD.id
      USING ERRCODE = '23503'; -- foreign_key_violation: closest standard code for "referenced, can't delete"
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_of_signed_job ON public.jobs;

CREATE TRIGGER trg_prevent_delete_of_signed_job
  BEFORE DELETE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_of_signed_job();

COMMENT ON FUNCTION public.prevent_delete_of_signed_job IS
  'Blocks hard-delete of a job with any signed variation. Signed records are retained 6 years per the privacy policy; users archive the job instead of deleting it.';
