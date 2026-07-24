# Variation Tracker – SOP & Project Notes

## CRITICAL: Before Any Code Changes

**ALWAYS do this first:**
1. Run `git status` to verify current branch
2. Confirm you are NOT on main — main is protected
3. Create a feature branch: `git checkout -b feature/description`
4. Reference this SOP before touching any files

Do not proceed with edits until feature branch is created.

**Also confirm the checkout itself isn't stale before relying on it.** This folder is what Vercel deploys from GitHub, not what's live — but it's still the reference point for "what does prod actually look like." Incident 2026-07-11: this checkout was found sitting on a leftover feature branch (`feature/wire-nextjs-middleware`) instead of `main`, missing 4 merged PRs. Before starting work or answering "is X live yet," run `git status` and confirm you're on `main` and `git pull` is clean — don't assume the folder is current.

---

## Git Workflow (SOP)

**Main branch is protected.** All code changes follow this process:

1. **Create feature branch** — `git checkout -b feature/description`
2. **Make changes** — write code, commit frequently
3. **Test locally** — run `npm run test:e2e` to verify all tests pass
4. **Push to GitHub** — `git push origin feature-branch`
5. **Create PR** — `gh pr create` to propose merge to main
6. **Review & merge** — GitHub Actions verifies tests pass; Jacques merges (Claude never merges without explicit approval)

**Before pushing, always run:**
```bash
npm run test:e2e
```

If all tests pass locally ✅, push to GitHub. GitHub Actions will run tests again as backup verification.

**Why:** Catches bugs early. Saves time by not pushing broken code to GitHub.

### Visual Regression Tests

This project includes visual regression tests (Playwright screenshots). Important notes:

- **Local dev**: Run full tests — visual regression catches UI breakage
- **CI/CD (GitHub Actions)**: Visual regression tests are **skipped** because snapshots are OS-specific
  - macOS and Linux render pages differently
  - This prevents flaky CI failures
  - Functional tests (104) still run and pass
- **If visual regression fails locally**: Review the diff, update snapshots if intentional (`npm run test:e2e -- --update-snapshots`), commit them

---

## CI

- **Status:** ✅ Live
- **Template:** TypeScript (custom `main.yml` — more comprehensive than baseline)
- **Workflow file:** `.github/workflows/main.yml`
- **Checks:** Lint + type check + build → security audit + secret scan → E2E tests (Playwright)
- **Branch protection:** Set on `main` — PRs required, checks must pass

---

## File Structure Notes

- `research/competitive-brief-v1.md` — competitive brief (moved from project root May 2026)
- `planning/risk-register-v1.md` — risk register (moved from project root May 2026)
- `testing/archive/` — superseded Playwright configs (`playwright.config.ts`, `playwright.production.config.ts`). Active config: `testing/playwright.production.v2.config.ts`
- `building/archive/` — misplaced Next.js artifacts (`next-env.d.ts`, `tsconfig.tsbuildinfo`) that were in `building/`. Canonical versions live at project root. `building/src/` is empty — do not use.
- `Agents/archive/` — superseded agent files (`ALMA.md`, `Alma-CEO-Agent.html`). Current versions: `ALMA-v3.md`, `Alma-CEO-Agent-v2.html`
- `Agents/paperclip/` — Paperclip agentic project files (`package.json`, `node_modules`, etc.)

@AGENTS.md
