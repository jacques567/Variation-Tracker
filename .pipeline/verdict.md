CODY PIPELINE VERDICT — postcode-address-lookup — 2026-06-17
═══════════════════════════════════════════════════════════════
Branch: feature/postcode-address-lookup
Spec: .pipeline/spec.md
Changes: .pipeline/changes.md
Tests: .pipeline/test-results.md

SPEC REQUIREMENTS CHECK
───────────────────────
✓ Postcode input + Find button renders in default state
✓ postcodes.io called directly from browser — no proxy, no API key, no cost
✓ Town + county auto-populate in readonly field on success
✓ Street input is editable; assembly fires on every keystroke
✓ Address assembled as "{street}, {adminDistrict}, {postcode}" — matches spec format
✓ 404 response → inline error, stays in lookup mode
✓ Network/server error → auto-switches to manual entry mode
✓ "Enter manually" toggle always accessible in lookup and found modes
✓ "Use postcode lookup" toggle always accessible in manual mode
✓ Empty postcode validates before API call (no unnecessary fetch)
✓ Spaces stripped from postcode before call (M11AB and M1 1AB both handled)
✓ No DB schema change — address stays single string
✓ Session storage persistence handled entirely by parent — no duplication
✓ initialValue prop starts in manual mode — forward-compatible with edit page

DEVIATIONS FROM SPEC
────────────────────
One undeclared additive (minor): Enter key triggers Find on the postcode input.
Noted by Mason in changes.md. Additive only — does not change any specified behaviour.
Not a concern.

One issue found and fixed during review:
Hidden required sentinel input added to block form submission with empty address
when user stays in lookup mode without completing selection. Fix committed
(1f80247) before verdict was written — clean.

TEST COVERAGE CHECK
───────────────────
Type check: ✅ clean
E2E automated: 6/6 passing (Chromium + Firefox)
Interactive component: BLOCKED — auth-gated, consistent with project pattern
Manual verification: performed in dev preview (SW1A 1AA → "Westminster, London, SW1A 1AA" ✅)
All 8 interactive spec cases documented in spec for future auth-fixture implementation.

ARCHITECTURAL CONCERNS
──────────────────────
None. Direct browser fetch to a public CORS-enabled API is the right call here —
no secrets, no server round-trip, no complexity. The component is self-contained,
follows existing className conventions, and touches nothing outside its own state.

VERDICT
═══════════════════════════════════════════════════════════════
✅ APPROVED — safe to PR to main

Clean implementation, zero cost, spec-compliant. The one real issue (empty address
submission) was caught and fixed in review. E2E scaffold is solid for when auth
fixtures land. Merge when ready.
═══════════════════════════════════════════════════════════════
