# Variation Tracker – SOP & Project Notes

## Git Workflow (SOP)

**Main branch is protected.** All code changes follow this process:

1. **Create feature branch** — `git checkout -b feature/description`
2. **Make changes** — write code, commit frequently
3. **Test locally** — run `npm run test:e2e` to verify all tests pass
4. **Push to GitHub** — `git push origin feature-branch`
5. **Create PR** — `gh pr create` to propose merge to main
6. **Review & merge** — GitHub Actions verifies tests pass, then merge

**Before pushing, always run:**
```bash
npm run test:e2e
```

If all tests pass locally ✅, push to GitHub. GitHub Actions will run tests again as backup verification.

**Why:** Catches bugs early. Saves time by not pushing broken code to GitHub.

---

@AGENTS.md
