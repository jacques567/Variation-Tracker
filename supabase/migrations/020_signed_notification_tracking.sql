-- Tracks whether the contractor has been emailed that a variation was signed.
--
-- The notification is sent inline from POST /api/sign as a best-effort step (a
-- failed email must never fail the client's signature). This column is what makes
-- that safe: the daily cron (/api/cron/variation-notifications) sweeps up any
-- signed variation whose notification never went out, so a Resend outage delays
-- the email rather than losing it. Mirrors expiry_reminder_sent_at (018).

alter table public.variations
add column signed_notice_sent_at timestamptz;

-- Backfill every variation that was already signed before this feature existed.
-- Without this, the first cron run after deploy would email contractors about
-- variations their clients signed weeks ago. Stamped with the actual signing time
-- where we have one so the column stays truthful.
update public.variations v
set signed_notice_sent_at = coalesce(s.signed_at, now())
from public.signatures s
where s.variation_id = v.id
  and v.status = 'signed'
  and v.signed_notice_sent_at is null;

-- Signed rows with no signature record shouldn't exist (sign_variation() writes
-- both in one transaction) but backfill defensively so none can leak into the sweep.
update public.variations
set signed_notice_sent_at = now()
where status = 'signed'
  and signed_notice_sent_at is null;

-- Partial index: the cron's sweep query filters on exactly this predicate, and the
-- matching set is normally empty or near-empty.
create index if not exists variations_signed_notice_pending_idx
  on public.variations (status)
  where signed_notice_sent_at is null;
