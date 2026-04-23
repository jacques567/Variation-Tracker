# Variation Tracker – SOP & Project Notes

## Git Workflow (SOP)

**Main branch is protected.** All code changes follow this process:

1. **Create feature branch** — `git checkout -b feature/description`
2. **Make changes** — write code, commit frequently
3. **Test locally** — ensure changes work before submitting
4. **Create PR** — `gh pr create` to propose merge to main
5. **Review & merge** — verify nothing breaks, then merge

**Why:** Keeps bad code off main. Every commit to main is safe and reviewed.

---

@AGENTS.md
