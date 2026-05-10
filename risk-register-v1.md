# Risk Register — Variation Tracker
**Date:** April 2026
**Stage:** Pre-launch (building)
**Scope:** Full business — Operational, Security & Data, Compliance & Legal
**Owner:** Jacques Parker

---

## Risk Matrix

|  | Low impact | Medium impact | High impact |
|---|---|---|---|
| **High likelihood** | Medium | High | Critical |
| **Medium likelihood** | Low | Medium | High |
| **Low likelihood** | Low | Low | Medium |

---

## Critical Risks

### RISK-01 — E-signature legal validity
- **Category:** Compliance & Legal
- **Description:** Clients sign variations via a tokenised link with no identity verification beyond clicking the link. If a client disputes a variation, the signature may not hold up as legally binding in all jurisdictions (UK eIDAS/Electronic Communications Act 2000, or Australian Electronic Transactions Act).
- **Likelihood:** Medium — disputes are common in construction; legal challenge is plausible once money is involved
- **Impact:** High — a disputed signature could mean unpaid work and reputational damage
- **Risk level:** Critical
- **Mitigation:**
  1. Add IP address capture to signature records (already in schema — ensure it is populated consistently)
  2. Add a timestamp and client name assertion stored immutably at time of signing
  3. Display a declaration above the signature field: "By signing, I [client name] confirm I authorise this variation" — this creates explicit consent language
  4. Store a snapshot of the variation description and cost at time of signing so the record cannot be altered post-signature
  5. Send the client an email confirmation immediately after signing (paper trail outside the app)
  6. [Inference] A simple electronic signature (SES) is typically sufficient for commercial contracts under UK/AU law — verify with a solicitor before marketing this as legally binding
- **Owner:** Jacques
- **Status:** Open — partially mitigated by IP capture and signature_data storage; missing email confirmation and consent language

---

### RISK-02 — Supabase cost spike at scale
- **Category:** Operational / Financial
- **Description:** Supabase free and Pro tiers have hard limits on database size, storage, and egress. Photo attachments accumulating per variation could cause costs to spike unpredictably as contractor count grows.
- **Likelihood:** Medium — photo storage grows linearly with usage; egress costs compound
- **Impact:** High — unexpected infrastructure costs could erode margins or require emergency re-architecture
- **Risk level:** Critical
- **Mitigation:**
  1. Set a Supabase billing alert at 70% of current tier limits
  2. Implement photo compression before upload (client-side resize to 1MB or less)
  3. Model the cost per contractor per month at 10, 100, and 1,000 active contractors before finalising pricing
  4. Evaluate Supabase Storage vs Cloudflare R2 for photo storage at scale (R2 has zero egress fees)
  5. Consider gating photo storage on higher subscription tiers
- **Owner:** Jacques
- **Status:** Open — no cost modelling done; no billing alerts set

---

## High Risks

### RISK-03 — No mobile app limits on-site usability
- **Category:** Operational / Strategic
- **Description:** Variations are logged at the job site. Without a mobile app or PWA, contractors must use a browser on mobile — a degraded experience that may cause drop-off or switching to Tradify.
- **Likelihood:** High — tradies work on-site daily
- **Impact:** Medium — increases churn risk; caps appeal to field-first users
- **Risk level:** High
- **Mitigation:**
  1. Ensure the web app is fully responsive on mobile Safari and Chrome
  2. Add a PWA manifest so contractors can Add to Home Screen as a stopgap
  3. Prioritise mobile app as a roadmap item within 6 months of launch
- **Owner:** Jacques
- **Status:** Open

---

### RISK-04 — Single-founder dependency
- **Category:** Operational
- **Description:** All product, engineering, support, and business decisions sit with one person. Illness, burnout, or a personal emergency could halt all progress or leave paying customers unsupported.
- **Likelihood:** Medium — pre-launch is high-pressure; burnout risk is real
- **Impact:** High — product stops, customers churn, reputation suffers
- **Risk level:** High
- **Mitigation:**
  1. Document all infrastructure credentials and deployment procedures
  2. Use Vercel for deployments so the app runs without active intervention
  3. Set up a status page (e.g. UptimeRobot free tier)
  4. Identify one trusted person who could access infrastructure in an emergency
  5. Avoid over-committing to support SLAs you cannot meet solo
- **Owner:** Jacques
- **Status:** Open

---

### RISK-05 — Stripe payment failure handling
- **Category:** Operational / Financial
- **Description:** Contractors on past_due or canceled subscriptions could retain access if webhook handling or access control is not properly gated. Conversely, a webhook failure could wrongly lock out a paying customer.
- **Likelihood:** Medium — Stripe webhook failures are a known edge case
- **Impact:** High — revenue leakage or customer damage
- **Risk level:** High
- **Mitigation:**
  1. Verify subscription status is checked server-side on every protected route
  2. Test the full cancellation to lockout flow before launch
  3. Test the past_due to grace period to lockout flow
  4. Set up Stripe webhook logging so failures are visible
- **Owner:** Jacques
- **Status:** Open — subscription_status is in schema; server-side enforcement needs verification

---

### RISK-06 — Data breach / unauthorised access to contractor data
- **Category:** Security & Data
- **Description:** Contractor job data, client contact details (name, email, phone), and variation records are sensitive commercial data. A breach could expose client relationships and financials.
- **Likelihood:** Low-Medium — Supabase RLS mitigates most risk; misconfigured policies are the main vector
- **Impact:** High — reputational damage, potential legal liability under UK GDPR / AU Privacy Act
- **Risk level:** High
- **Mitigation:**
  1. Audit all Supabase RLS policies — every table must restrict reads/writes to the authenticated contractor's own data
  2. Ensure the signature token route (unauthenticated public access for clients) is scoped only to the specific variation, not the full job or contractor record
  3. Never expose stripe_customer_id or subscription_id to the client-side unnecessarily
  4. Enable Supabase audit logging
  5. Do a pre-launch security pass: check for any tables without RLS enabled
- **Owner:** Jacques
- **Status:** Open — RLS policies exist but formal audit not completed

---

### RISK-07 — Competitor fast-follow on e-signature
- **Category:** Strategic
- **Description:** Tradify or Planyard could add client e-signature on variations, eliminating your primary differentiator. Both already serve the same customer base.
- **Likelihood:** Medium — both have engineering resources; the feature is not technically complex
- **Impact:** Medium — reduces differentiation; could stall growth if they move before you have brand loyalty
- **Risk level:** High
- **Mitigation:**
  1. Move quickly to acquire early adopters and build switching costs (history, audit trail, branding)
  2. Deepen the e-signature feature beyond easy-to-copy — audit trail PDF, client notifications, expiry dates, bulk reminders
  3. Monitor Tradify and Planyard changelogs monthly
- **Owner:** Jacques
- **Status:** Open

---

## Medium Risks

### RISK-08 — Client e-signature token security
- **Category:** Security & Data
- **Description:** The signature_token is the only authentication mechanism for the client-facing sign page. If tokens are predictable or not expired after signing, a third party could sign on behalf of a client.
- **Likelihood:** Low — tokens are likely UUIDs (random); risk is low if implemented correctly
- **Impact:** High — fraudulent signatures are a serious legal and reputational problem
- **Risk level:** Medium
- **Mitigation:**
  1. Confirm tokens are cryptographically random UUIDs (v4), not sequential
  2. Invalidate/expire the token once a signature is submitted — do not allow re-signing
  3. Log client IP and timestamp at the moment of signing
- **Owner:** Jacques
- **Status:** Open

---

### RISK-09 — No data backup or disaster recovery plan
- **Category:** Operational / Security
- **Description:** A database corruption or accidental deletion with no recovery plan could result in permanent data loss for paying contractors.
- **Likelihood:** Low — Supabase is reliable; accidental deletion is the main risk
- **Impact:** High — complete data loss
- **Risk level:** Medium
- **Mitigation:**
  1. Enable Supabase daily backups (verify which plan tier includes this)
  2. Set up a scheduled export of critical tables to a separate store
  3. Document the actual recovery procedure, not just "Supabase has backups"
- **Owner:** Jacques
- **Status:** Open

---

### RISK-10 — GDPR / Privacy Act compliance for client data
- **Category:** Compliance & Legal
- **Description:** Contractor clients' names, emails, phone numbers, and IP addresses are stored. Under UK GDPR and AU Privacy Act, this requires a privacy policy, a lawful basis for processing, and data subject rights. Pre-launch, there is likely no privacy policy in place.
- **Likelihood:** High — all SaaS products processing personal data must comply
- **Impact:** Medium — fines unlikely at early stage, but operating without a privacy policy is a legal exposure and trust barrier
- **Risk level:** Medium
- **Mitigation:**
  1. Publish a privacy policy before launch (Termly or Iubenda can generate a draft; have a solicitor review)
  2. Publish terms of service covering contractor and client data use
  3. Add a data deletion mechanism for contractor and client data
- **Owner:** Jacques
- **Status:** Open — no privacy policy or ToS exists yet

---

### RISK-11 — Dependency on third-party services
- **Category:** Operational
- **Description:** The product depends on Supabase, Stripe, and Vercel. Outages or pricing changes in any of these directly affect the product.
- **Likelihood:** Low — all three are reliable; pricing changes are the more realistic risk
- **Impact:** Medium — outage equals downtime; pricing change equals margin squeeze
- **Risk level:** Medium
- **Mitigation:**
  1. Track status pages for Supabase, Stripe, and Vercel
  2. Keep infrastructure costs as a tracked line item; re-evaluate at 100 and 500 contractors
- **Owner:** Jacques
- **Status:** Open

---

### RISK-12 — Pricing too low to sustain the business
- **Category:** Financial
- **Description:** Without cost modelling, the subscription price may not cover infrastructure, support time, and development — especially if Supabase costs scale with usage.
- **Likelihood:** Medium — common early-stage SaaS mistake
- **Impact:** Medium — unsustainable unit economics discovered too late
- **Risk level:** Medium
- **Mitigation:**
  1. Model cost per contractor at 10, 100, 1,000 users (Supabase + Stripe fees + Vercel)
  2. Set a minimum price that covers infrastructure plus a reasonable hourly rate for support
  3. Do not lock in pricing with annual plans until unit economics are validated
- **Owner:** Jacques
- **Status:** Open

---

## Low Risks

### RISK-13 — PDF rendering inconsistency
- **Category:** Operational
- **Description:** React-PDF edge cases (long descriptions, special characters) could produce malformed PDFs on certain records.
- **Likelihood:** Low
- **Impact:** Low — a support issue, not a critical failure
- **Risk level:** Low
- **Mitigation:** Add a PDF preview step before sending; test with long descriptions and special characters before launch
- **Owner:** Jacques
- **Status:** Open

---

## Risk Summary

| Risk | Category | Likelihood | Impact | Level | Status |
|---|---|---|---|---|---|
| RISK-01 E-signature legal validity | Compliance & Legal | Medium | High | **Critical** | Open |
| RISK-02 Supabase cost at scale | Operational / Financial | Medium | High | **Critical** | Open |
| RISK-03 No mobile app | Operational / Strategic | High | Medium | **High** | Open |
| RISK-04 Single-founder dependency | Operational | Medium | High | **High** | Open |
| RISK-05 Stripe payment handling | Operational / Financial | Medium | High | **High** | Open |
| RISK-06 Data breach | Security & Data | Low-Medium | High | **High** | Open |
| RISK-07 Competitor fast-follow | Strategic | Medium | Medium | **High** | Open |
| RISK-08 Token security | Security & Data | Low | High | **Medium** | Open |
| RISK-09 No backup / DR plan | Operational | Low | High | **Medium** | Open |
| RISK-10 GDPR / Privacy compliance | Compliance & Legal | High | Medium | **Medium** | Open |
| RISK-11 Third-party dependencies | Operational | Low | Medium | **Medium** | Open |
| RISK-12 Pricing sustainability | Financial | Medium | Medium | **Medium** | Open |
| RISK-13 PDF rendering edge cases | Operational | Low | Low | **Low** | Open |

---

## Recommended Pre-Launch Actions (Priority Order)

1. **E-signature consent language** — add a declaration above the signature field before any contractor uses it with a real client
2. **Privacy policy + ToS** — publish both before launch; required by law
3. **Supabase RLS audit** — confirm no table is accessible without row-level restrictions
4. **Token expiry after signing** — confirm tokens are invalidated post-signature
5. **Stripe webhook testing** — walk through cancellation and past_due flows end-to-end
6. **Cost modelling** — calculate per-contractor infrastructure cost at 10/100/1,000 users
7. **Supabase billing alert** — set a threshold alert before costs surprise you
8. **Email confirmation on signing** — send client a copy of what they signed immediately after

---

*Risk register compiled: April 2026 | Review recommended: monthly pre-launch, quarterly post-launch*
