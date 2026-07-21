# ADR 0001: Auth Routing & Access Control

**Status:** Accepted (reflects current implementation)
**Date:** 2026-07-19

## Context

VarTracker needs to control who can reach which pages: unauthenticated visitors,
authenticated-but-unsubscribed contractors, active subscribers, and admins all
see different route sets. Enforcement needs to happen in more than one place
because a single layer can't cover everything cheaply:

- Auth checks need the request's cookies before any page component runs, to
  avoid a flash of protected content and to redirect with the right
  destination preserved.
- Subscription state depends on a DB row (`contractors`), which is too slow/
  fragile to trust as the *only* gate on every request — DB hiccups shouldn't
  lock out paying users.
- Some Next.js versions in this project renamed `middleware.ts` to a `proxy.ts`
  convention (see git history: `962dfda`, `a09efde`, `c00b229`), so naming
  and file placement here is unusually easy to get wrong across upgrades.

## Decision

Use a **layered, defence-in-depth** model with three tiers:

### 1. Edge proxy (`src/proxy.ts` → `src/lib/supabase/proxy.ts`)

This is the Next.js 16 equivalent of `middleware.ts` (the project uses the
`proxy.ts` naming/export convention after the framework's rename). It runs on
every request matched by `config.matcher` (everything except static assets)
and is the first gate:

- Calls `supabase.auth.getUser()` — never `getSession()` — because `getUser()`
  validates the JWT server-side and refreshes it; `getSession()` only trusts
  the client-supplied token.
- Classifies the path as an auth route (`/login`, `/register`,
  `/forgot-password`), a public route (`/sign*`, `/api*`, `/terms`,
  `/privacy`, `/cookies`, `/reset-password`), the root route (`/`), or
  everything else (protected).
- Unauthenticated + protected → redirect to `/login?next=<original path>` so
  the user lands back where they were headed after signing in.
- Authenticated + auth route → redirect to `next` (if it's a safe relative
  path) or `/jobs`.
- Authenticated + protected (excluding `/subscribe` and `/admin`) → look up
  `contractors.subscription_status` and redirect to `/subscribe` if
  `evaluateSubscription()` says the subscription isn't valid.
  - On a DB/transport error during this lookup, the proxy **fails open**
    (lets the request through) rather than kicking a possibly-paying user to
    `/subscribe`. This is safe because API routes independently enforce
    subscription via `checkSubscription()` — the proxy paywall is a UX
    convenience, not the security boundary for data access.

### 2. Layout-level server guards (defence-in-depth)

Route-group layouts re-check auth server-side even though the proxy already
ran, because layouts are the last line before a page renders and this project
treats the proxy as "should have caught it" rather than "guaranteed to have
caught it":

- `src/app/(auth)/layout.tsx` — if a user is already authenticated, redirect
  to `/jobs`. Comment in the file: "Middleware handles this first, but guard
  here as defence-in-depth."
- `src/app/(dashboard)/layout.tsx` — redirect to `/login` if no user;
  redirect to `/subscribe` if the subscription isn't valid (beta mode
  excluded). This is called out in-file as "the real gate," with the
  client-side `SubscriptionGate` component treated as belt-and-suspenders,
  not the source of truth.
- `src/app/admin/layout.tsx` — redirect to `/login` if no user; then calls
  the `is_admin()` Postgres RPC (SECURITY DEFINER) rather than querying an
  `admin_emails` table directly, because that table's RLS policy is
  `USING false` — no session client can read it. `is_admin()` reads
  `auth.email()` from the JWT server-side inside Postgres and bypasses that
  restriction safely.

### 3. Row-Level Security + RPC boundary (data layer)

Even if a routing check were bypassed, RLS policies are the actual authority
on what data a request can read/write — but the DB-layer gate is narrower
than "block everything," and it's worth being precise about the scope:

- **RLS gates INSERT only, not SELECT/UPDATE/DELETE.** Per
  `supabase/migrations/016_rls_subscription_enforcement.sql`: an expired or
  cancelled contractor can still read, edit, and delete their *existing*
  jobs/variations (ownership-only check: `auth.uid() = contractor_id`).
  Only *creating new* jobs/variations/photo-uploads requires
  `has_active_subscription()` to return true. The intent (per the migration's
  own comment) is narrow: stop a lapsed user from writing new data via
  direct PostgREST calls that bypass the proxy redirect and API route
  guards — not to lock them out of data they already own.
- **Subscription enforcement is duplicated on purpose**: application logic
  in `evaluateSubscription()` (`src/lib/subscription-evaluation.ts`, re-exported
  via `subscription-guard.ts`) and the DB function `has_active_subscription()`
  (same migration) implement the same trial/grace-period rules independently.
  The migration's own comment states any rule change must be reflected in
  both places — confirmed by reading both implementations, not just inferred
  from a comment on one side.
- **Public token-gated access** (e.g. `/sign/[token]`) never queries base
  tables directly from the public client. It goes through a SECURITY
  DEFINER RPC (`get_variation_by_token`) that returns only the columns the
  page needs, explicitly excluding `contractor_id`, `job_id`, and
  `client_email`. The token itself is validated as a v4 UUID before it ever
  reaches the database.

### Login endpoint hardening

`src/app/api/auth/login/route.ts` previously had a per-account lockout only
(5 attempts / 15 min, keyed to an existing `contractors` row) — an attacker
credential-stuffing across many different emails from one IP, or probing
emails with no matching account, hit no throttling at all. It now also
applies the same IP-based `checkRateLimit()` pattern already used on
`/api/sign` and `/api/csrf-token` (10 requests/min per IP), on top of the
existing per-account lockout.

The route also no longer returns the raw Supabase session (access/refresh
tokens) in its JSON response body — the real session already lands in
httpOnly cookies via the cookie-adapter in `createClient()`. The one caller
that read `session.access_token` (`(auth)/login/page.tsx`, to pass as a
Bearer token to `/api/admin/check-admin`) turned out not to need it:
`check-admin` reads the session from cookies, not the Authorization header,
so the token was already unused dead weight in that request.

## Consequences

**Positive**
- No single point of failure: an edge-proxy bug, a layout bug, or an RLS
  bug alone is not enough to expose protected data or bypass the paywall.
- Fail-open behaviour on the subscription DB lookup avoids false-positive
  lockouts for paying customers during transient DB issues, without
  weakening actual data access control (RLS + `checkSubscription()` in API
  routes still hold).
- Redirect-with-`next` preserves user intent through the login flow instead
  of dumping everyone at a generic landing page.

**Beta mode is an intentional full paywall bypass, not a bug**
- `NEXT_PUBLIC_BETA_MODE` is only ever true on the separate beta deployment
  (`beta-vartracker.vercel.app`); the production domain (`vartracker.com`)
  never sets it. On the beta deployment, beta testers get free reign —
  no subscription required at all. Confirmed as intended, not a leftover.
- Because of this, the bypass has to be applied consistently everywhere the
  paywall is enforced: `(dashboard)/layout.tsx`'s
  `if (!betaMode && !isValid) redirect('/subscribe')` **and** the equivalent
  check in the proxy (`src/lib/supabase/proxy.ts`) both gate on
  `isBetaMode()` now. (The proxy runs before the layout on every request, so
  it needs its own check — the layout's bypass alone wasn't enough.)
- Production lockdown: the production domain only serves a coming-soon
  landing page (`src/app/page.tsx`), but `/login`, `/register`, and
  `/forgot-password` were still directly reachable there even with no
  paywall to hit. `(auth)/layout.tsx` now redirects to `/` whenever
  `!isBetaMode()`, so those routes are only live on the beta deployment.

**Negative / accepted trade-offs**
- Logic is duplicated across three layers (proxy, layout, RLS/RPC) by
  design. Any change to routing rules or subscription rules must be applied
  in multiple files — `subscription-guard.ts` AND the corresponding
  migration, as an example. This is deliberate, not an oversight, but it is
  a real maintenance cost and a place future changes can drift out of sync.
- The `proxy.ts` naming (vs. the conventional `middleware.ts`) is
  non-obvious and specific to this project's Next.js 16 migration history.
  Anyone scaffolding auth in a new route or debugging "why isn't middleware
  running" needs to know to look for `src/proxy.ts`, not
  `src/middleware.ts`.
- Fail-open on the subscription lookup is a conscious risk acceptance: a
  sustained DB outage would let unsubscribed users reach dashboard pages
  through the proxy layer. This is currently judged acceptable because the
  API-route-level `checkSubscription()` calls still block actual data
  mutations.

## Alternatives considered

- **Single edge-proxy-only enforcement**: rejected because a proxy-only
  model has no fallback if the matcher config is wrong or a route is added
  without updating it — the layout guards catch that class of bug.
- **RLS-only enforcement (no proxy/layout redirects)**: rejected on UX
  grounds — users would hit rendered-then-blocked pages or raw Postgres
  errors instead of clean redirects to `/login` or `/subscribe`.
- **Fail-closed on subscription DB errors**: rejected because a transient
  DB blip would incorrectly paywall active paying customers; the team
  preferred to accept the (currently believed low) risk of a fail-open
  window, backstopped by API-level enforcement.
