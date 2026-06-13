# Session Log — 2026-06-08

**Project:** VarTracker (variation-tracker)
**Agent:** Cody (CTO)
**Focus:** Paywall enforcement architecture — root cause analysis + foundational fix

---

## What was done

### Architectural review

Full audit of the trial/subscription system across all layers:
- `subscription-guard.ts` — TypeScript evaluation logic
- `supabase/proxy.ts` — middleware enforcement
- All API routes for subscription guard presence
- `jobs/new/page.tsx` and `variations/new/page.tsx` — direct client-side Supabase inserts (no sub check)
- All migration files (001–014)
- `signup/route.ts`, `checkout/route.ts`, `webhooks/stripe/route.ts`

### Bugs found

1. **`subscription_status` constraint missing 'none'** — `expire_trials()` (migration 013) sets status to `'none'`, but the column constraint from migration 001 only allows `('active','trialing','past_due','canceled','incomplete')`. Every cron run was failing silently. Expired trial users kept permanent trialing access.

2. **`stripe_customer_id` never persisted** — `checkout/route.ts` used the session (user) client to update `stripe_customer_id`. Migration `014_lockdown_contractor_columns` restricts the `authenticated` role to only `full_name/company_name/phone`. The update silently failed on every checkout. Every checkout created a new orphaned Stripe customer. Webhook events by `stripe_customer_id` matched 0 rows.

3. **Double trial** — `subscription_data.trial_period_days: 7` in Stripe checkout gave users a second free trial after their app-managed signup trial. 14 free days total, unintentional.

4. **No RLS subscription enforcement on INSERT** — `jobs` and `variations` RLS policies only checked ownership. An authenticated user with an expired trial could write directly to the PostgREST API and create records, bypassing middleware and API route guards.

5. **Duplicate `014_` migration prefix** — `014_lockdown_contractor_columns.sql` and `014_rate_limit_tracking.sql` — noted in PR documentation; handled by naming new migrations from 015.

### PRs opened (merge in order)

| PR | Branch | What it fixes |
|----|--------|--------------|
| [#55](https://github.com/jacques567/Variation-Tracker/pull/55) | `fix/subscription-status-constraint` | Migration 015: adds 'none' to constraint — unblocks cron |
| [#56](https://github.com/jacques567/Variation-Tracker/pull/56) | `fix/stripe-checkout-persistence` | Service role for stripe_customer_id; removes double trial |
| [#57](https://github.com/jacques567/Variation-Tracker/pull/57) | `feat/rls-subscription-enforcement` | Migration 016: has_active_subscription() + RLS INSERT enforcement + client-side UX |

**Merge order matters:** #55 before #57 (RLS function reads subscription_status including 'none').

### Architecture established

The correct enforcement order is now:
```
DB (RLS) → API routes → Middleware → Client UI
```

`has_active_subscription()` is the single source of truth at the DB layer. It mirrors `evaluateSubscription()` in TypeScript — any future rule change must update both.

---

## Files changed

| File | Change |
|------|--------|
| `supabase/migrations/015_fix_subscription_status_constraint.sql` | New — constraint fix |
| `supabase/migrations/016_rls_subscription_enforcement.sql` | New — has_active_subscription() + RLS policies |
| `src/app/api/stripe/checkout/route.ts` | Fix — service role for writes, remove double trial |
| `src/app/(dashboard)/jobs/new/page.tsx` | UX — pre-submit subscription check |
| `src/app/(dashboard)/jobs/[id]/variations/new/page.tsx` | UX — pre-submit subscription check |
| `TASKS.md` | Updated — Alma's paywall flag with PR tracking |

---

## Decisions made

- **RLS as primary enforcer, not API routes** — Supabase is designed for direct client queries; adding API routes purely for subscription checks would be the wrong abstraction. RLS cannot be bypassed regardless of how the write reaches Supabase.
- **Split 'for all' policies into per-operation** — expired users retain read/update/delete access to existing data. Only INSERT is gated.
- **Service role for stripe_customer_id** — consistent with signup and webhook routes which already use service role for sensitive fields.
- **No second Stripe trial** — app-managed trial (no card) is the only trial. Stripe subscription starts immediately on payment.

---

### Full-review findings & fixes

Ran `/full-review` across all three PRs. Two medium findings in PR #57:
- **WITH CHECK missing on UPDATE policies** — added to both `jobs` and `variations` to prevent `contractor_id`/`job_id` reassignment via direct API UPDATE
- **evaluateSubscription bundled in 'use client' components** — extracted pure logic to new `src/lib/subscription-evaluation.ts` module (no Supabase client, safe to import anywhere). Client components now import the evaluation module directly. `subscription-guard.ts` re-exports for existing server-side callers unchanged.

All fixes committed and pushed to PR #57.

### Migrations applied to production

Both migrations successfully applied to production Supabase:

**Migration 015** — Fixed subscription_status constraint
- Added `'none'` to the allowed values
- Ran `select public.expire_trials()` — **result: 6 contractors expired** (cron was silently broken since launch; now working)

**Migration 016** — RLS subscription enforcement
- Created `has_active_subscription()` function
- Split jobs/variations policies from 'for all' to explicit per-operation
- Added INSERT subscription check on jobs, variations, and storage
- Verified: all 10 policies in place, WITH CHECK present on UPDATE policies

---

## What's next

1. Merge PR #55, #56, #57 to main (in that order)
2. Purge non-test contractors from production (keep test1, test2, test3)
3. Final QA: test expired trial lockout, test subscription renewal flow
