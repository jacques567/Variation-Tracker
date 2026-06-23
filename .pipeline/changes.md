# Changes: Postcode Address Lookup

**Branch:** feature/postcode-address-lookup  
**Built by:** Mason  
**Date:** 2026-06-17

---

## Summary

Replaced the free-text `Site address` input on `/jobs/new` with a postcode-first lookup component backed by postcodes.io. No API key, no cost, no backend proxy.

---

## Files created or modified

| File | Action | Lines |
|---|---|---|
| `src/components/jobs/PostcodeLookup.tsx` | Created | 152 |
| `src/app/(dashboard)/jobs/new/page.tsx` | Modified | +9 / -4 |
| `tests/e2e/postcode-lookup.spec.ts` | Created | 107 |
| `.pipeline/spec.md` | Created (supersedes prior spec) | — |

---

## What was built

- `PostcodeLookup` client component with three modes: `lookup` (default), `found` (post-success), `manual` (bypass)
- In `found` mode: street input (editable) + readonly autofill showing `{adminDistrict}, {county}, {postcode}` from postcodes.io
- Assembles final address as `"{street}, {adminDistrict}, {postcode}"` on every keystroke → calls `onAddressChange` → sets `formData.address` in parent
- Session storage persistence handled by existing parent logic — no changes needed there
- Graceful fallbacks: 404 → inline error, network failure → auto-switches to manual mode
- "Enter manually" / "Use postcode lookup" toggle always accessible
- Enter key triggers Find

## Verified in browser

- `SW1A1AA` → returned `Westminster, London, SW1A 1AA` in readonly field ✅
- Street `10 Downing Street` → sessionStorage address = `"10 Downing Street, Westminster, SW1A 1AA"` ✅

---

## Deviations from spec.md

**Zero deviations.**

One additive behaviour not in spec: Enter key on the postcode input triggers Find (via `onKeyDown`). Additive only, does not change any specified behaviour.

---

_Tagging Alf: Build complete — `.pipeline/changes.md` ready for test._
