# Spec: Postcode Address Lookup

**Feature request:** When creating a new job, the user types a postcode to assist with address entry — improving UX over free-text input.

**Requested by:** Jacques  
**Phase:** Planner (awaiting Cody pre-approval)  
**Updated:** 2026-06-17 — supersedes previous spec (getAddress.io was shut down by High Court order, February 2026)

---

## OPEN QUESTIONS (must resolve before branching)

1. **Scope** — New Job form only (`/jobs/new`), or also Job Edit (`/jobs/[id]`)?
2. **Manual fallback** — Always show "Enter address manually" bypass. Confirmed default?

---

## Feasibility Assessment

### What Jacques asked for
"User types a postcode → picks their full address from a list."

### The honest answer
**True address-from-postcode dropdown is not achievable for free in 2026.**

The data is owned by Royal Mail (Postcode Address File, PAF) — any API that returns individual street addresses is paying for a PAF licence. The landscape right now:

| Option | Cost | Returns individual addresses? | Status |
|---|---|---|---|
| **postcodes.io** | Free, no auth, no limits | ❌ No — postcode metadata only (town, county, lat/lng) | ✅ Live |
| **getAddress.io** | Was free tier 20/day | ✅ Yes | ❌ **Shut down Feb 2026** (High Court ruling) |
| **Ideal Postcodes** | Paid (~£0.02–0.03/lookup, small free dev quota) | ✅ Yes | ✅ Live but costs money |
| **OS Places API** | Free 5k/month (PSGA licence) | ✅ Yes | ✅ Live but requires registration + API key |

### Recommended approach: postcodes.io + split address fields
**Zero cost. Zero API key. Genuine UX improvement.**

Instead of typing `14 Maple Street, Manchester, Greater Manchester, M1 1AB`, the user:

1. Types their postcode (`M1 1AB`) and clicks **Find**
2. postcodes.io returns: town (`Manchester`), district (`Manchester`), county (`Greater Manchester`)
3. Town + county auto-populate — user only types `14 Maple Street`
4. Everything assembles into the existing `address` string on submit

**Why this is still a real improvement:** Users rarely know their town/county spelling precisely. The #1 address entry error is town and postcode mismatch. This eliminates it.

### Alternative if Jacques wants true address picker later
Register for OS Places API (free, 5k/month, PSGA licence via [os.co.uk](https://osdatahub.os.uk/)). This is the only legitimate free-tier option that returns individual addresses post-getaddress.io. Requires registration and an API key. Not in scope for this ticket unless Jacques confirms.

---

## Deliverables

1. A reusable `PostcodeLookup` client component: postcode input → Find button → auto-fills town into address
2. Integration into `/jobs/new/page.tsx` replacing the current plain address text input
3. Graceful error states (not found, API down → fall back to manual entry)
4. E2E test: valid postcode → town autofill, invalid postcode → error, manual entry path

**No new API route required** — postcodes.io is a public API with CORS headers. Call it directly from the browser. No API key. No secrets.

---

## Files to create or modify

| File | Action | Notes |
|---|---|---|
| `src/components/jobs/PostcodeLookup.tsx` | Create | Client component. Props: `onAddressChange: (address: string) => void`. Renders postcode input + Find button + address line input (pre-filled) + "or enter manually" toggle |
| `src/app/(dashboard)/jobs/new/page.tsx` | Modify | Replace the single `address` input with `<PostcodeLookup>`. Address in form state unchanged — PostcodeLookup calls `onAddressChange` which sets `formData.address` |
| `tests/e2e/postcode-lookup.spec.ts` | Create | Playwright: mock fetch to postcodes.io, test happy path + not found + manual entry |

No `.env` changes. No new packages. No backend route.

---

## API call spec

Direct client-side `fetch` — no proxy needed:

```
GET https://api.postcodes.io/postcodes/{postcode}
```

Response (200):
```json
{
  "status": 200,
  "result": {
    "postcode": "M1 1AB",
    "admin_district": "Manchester",
    "admin_county": "Greater Manchester",
    "region": "North West England"
  }
}
```

Response (404 — postcode not found):
```json
{ "status": 404, "error": "Postcode not found" }
```

No auth headers. No rate limit for reasonable usage.

---

## PostcodeLookup component UX flow

```
[Postcode input ____] [Find]
  or enter address manually ↓

→ on Find click:
  - Validate postcode is non-empty
  - Call postcodes.io
  - On success: show address input pre-filled with "{district}, {county}, {postcode}"
    User types house number + street into a second input above it
    Both inputs assemble: "{street}, {district}, {postcode}" → onAddressChange()
  - On 404: "Postcode not found" inline error, stays in postcode entry state
  - On fetch error: "Address lookup unavailable" → switch to manual mode

Manual mode:
  Single text input (current behaviour), "Use postcode lookup" link above it
```

### Component states

1. **Default** — postcode input + Find button + "or enter manually" link
2. **Loading** — button shows spinner, input disabled
3. **Success** — two inputs: "Street / house number" (editable) + "Town, county, postcode" (readonly, from API) + "Not right? Enter manually" link
4. **Error (not found)** — inline message under postcode, stays in state 1
5. **Error (API down)** — inline message, auto-switches to manual mode
6. **Manual mode** — standard full-address text input

---

## Address assembly

Assemble on every keystroke in the street input:

```ts
const assembled = `${street}, ${adminDistrict}, ${postcode}`
onAddressChange(assembled)
```

Stored in `formData.address` exactly as before. No DB schema change.

---

## Patterns to follow

- Client component pattern: match `src/components/jobs/JobCard.tsx` className conventions
- Form state integration: follow `handleInputChange` pattern in `new/page.tsx`
- Loading/error patterns: match existing patterns in `new/page.tsx` (`loading` state, inline error `<p>`)

---

## Edge cases

- Postcode with or without space (`M11AB` vs `M1 1AB`) — strip spaces, API handles both
- Empty postcode on Find click — inline validation, no fetch
- API returns valid postcode but no `admin_district` — fall back to just `{postcode}` in address
- User selects postcode lookup result then wants to type full address manually — "Enter manually" link always visible
- Session storage persists `formData.address` — already handled by existing logic, no change needed

---

## What is NOT in scope

- Individual address list/dropdown (requires paid API — OS Places if Jacques wants it later)
- Job Edit page (`/jobs/[id]`) — address rarely changes post-creation
- Storing postcode as a separate DB column — `address` stays a single string
- Postcode format validation beyond what postcodes.io rejects
- International addresses

---

## Implementation estimate

- PostcodeLookup component: ~1.5 hrs
- Integration into new/page.tsx: ~30 min
- E2E test: ~45 min
- **Total: ~2.75 hrs**

---

## Dependencies

None. postcodes.io is free, public, no registration, no API key. No new npm packages.

---

_Spec written by Mason — Phase 1 Planner. Tagging Cody for pre-approval._
