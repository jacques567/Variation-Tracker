## What does this PR do?

<!-- One sentence. What changed and why. -->

---

## Security Checklist

> These are the things the CI pipeline *can't* automatically verify — they require human judgement.
> Tick each box or leave a note explaining why it doesn't apply.

### 🔒 Inputs — things coming *into* the app

- [ ] **Request bodies validated** — any new `request.json()` call has a Zod schema
      *(ELI5: don't trust anything a user sends you. Always check the shape before using it.)*
- [ ] **Headers verified** — IP addresses, tokens or IDs read from headers are format-checked before use
      *(ELI5: headers are like a name badge anyone can print themselves. Check the photo.)*
- [ ] **No direct DB input from user** — user-supplied values never interpolated into raw SQL strings
      *(ELI5: never let a customer write on your order form and hand it straight to the kitchen.)*

### 🔒 State — things stored or cached

- [ ] **Client cache has TTL** — any `sessionStorage` or `localStorage` write stores an `issuedAt` timestamp
      *(ELI5: don't serve leftovers without checking the date on the container.)*
- [ ] **Multi-step DB ops are atomic** — operations that must succeed together use an RPC or transaction
      *(ELI5: a bank transfer should either move the money fully or not at all — never halfway.)*

### 🔒 Outputs — things going *out* of the app

- [ ] **Errors are generic to the client** — `catch` blocks log detail server-side, return a generic message to the client
      *(ELI5: if your shop's alarm goes off, you call the police — you don't announce which safe is broken on the PA.)*
- [ ] **No internal field names in error responses** — `details` payloads don't expose DB column names or API schema
      *(ELI5: don't hand a burglar a map of the building while telling them they can't enter.)*

### 🔒 Auth — who's allowed to do what

- [ ] **New endpoints have an auth check** — any new `route.ts` verifies the user session before doing work
      *(ELI5: before helping someone, check they actually work here.)*
- [ ] **Correct key used** — reads/writes use `anon` key + RLS, not `service_role` key, unless there's a documented reason
      *(ELI5: use the staff key that only opens certain doors, not the master key that opens everything.)*

---

## Test coverage

- [ ] New behaviour is covered by an E2E or unit test
- [ ] Ran `npm run test:e2e` locally and all tests pass

---

## Notes for reviewer

<!-- Anything the reviewer should know that isn't obvious from the diff. -->
