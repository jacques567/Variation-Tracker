# VarTracker — Design System

**This file is the sole exact source of truth for VarTracker's design tokens.** It is hand-authored and lives in the repo — it does not update itself, and Stitch does not update it. Originally exported from Stitch design system asset `assets/17479271680059202132` ("VarTracker Design System v3"), locked 2026-08-12.

⚠️ **Do not trust the live Stitch asset or rendered screens for exact color values.** Confirmed 2026-08-13: Stitch's stored design system asset has been observed drifting to different unrequested primary colors and `colorVariant` settings across multiple correction attempts, including at least one where no rendering call (`apply_design_system`) was involved — this looks like asynchronous server-side regeneration outside client control, not a sequencing mistake. Build against the values documented in this file, not whatever color currently renders in Stitch.

Stitch project: https://stitch.withgoogle.com/projects/12670254359852135253
Reference screens in that project: "VarTracker Login Modern Minimal 1" (prototype), "VarTracker Component Reference" (component sheet) — visual layout/structure reference only, colors on these screens may not match this document exactly.

## Brand

Construction-industry variation tracker. Reliable, professional tone — not playful. A blue mark (gradient `#2EA7FF` → `#0057B8`) built from two overlapping angular V/W chevron shapes forming an interlocking mark, paired with a near-black wordmark.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `primary-fill` | `#0057B8` | **Flat only.** Every button, link, focus ring, and any UI element with text/icons on top. 6.8:1 contrast with white text — verified WCAG AA pass. |
| `primary-gradient` | `linear-gradient(135deg, #2EA7FF, #0057B8)` | **Logo mark only.** Never a UI fill — white text on the light end (`#2EA7FF`) measures ~2.6:1, fails WCAG AA. This was a real bug caught and fixed this session; don't reintroduce it. |
| `dark-neutral` | `#0F1720` | Primary text on light backgrounds |
| `light-neutral` | `#E6EAF0` | Page background |
| `white` | `#FFFFFF` | Card surfaces |

### Status colors

Two valid sets exist right now, for two different surfaces — reconcile when Forge implements the redesign:

**Currently live** (real Tailwind classes already shipping in the coded app — use exactly these until the redesign ships):

| Status | Background | Text |
|---|---|---|
| Signed / success | `#F0FDF4` (green-50) | `#15803D` (green-700) |
| Pending / warning | `#FFFBEB` (amber-50) | `#92400E` (amber-800) |
| Expired / error | `#FEE2E2` (red-100) | `#DC2626` (red-600) |
| Completed / neutral | `#F3F4F6` (gray-100) | `#4B5563` (gray-600) |

**Redesign target** (what's actually shipping across all 13 Claude Design canvas screens, `.design-canvas/vartracker-*/` — verified in a full WCAG contrast sweep 2026-08-27; supersedes the live values above once Forge implements this design):

| Status | Background | Text | Contrast |
|---|---|---|---|
| Signed / success | `#ECFDF5` | `#047857` | 5.21:1 |
| Pending / warning | `#FFFBEB` | `#92400E` (body text) / `#B45309` (pills) | 6.84:1 / 4.84:1 |
| Past due / error | `#FEF2F2` | `#B91C1C` | 5.91:1 — darkened from `#DC2626` (4.41:1, failed AA) |
| Completed / neutral | `#F3F4F6` | `#4B5563` | 6.87:1 |

Secondary/muted text on light surfaces (redesign): `#6B7280` on white (4.83:1) or on `#F7F9FB` (4.58:1) — replaces earlier `#9199A6`/`#9AA6B5`-style grays that failed contrast; those remain valid only for text on the dark `#0F1720` admin nav (7.30:1).

## Typography

Intended typeface: **Poppins** (weights Regular/Medium/Semibold). Poppins isn't in Stitch's font enum, so **Montserrat** was used as the closest available geometric-sans proxy for previewing in Stitch — the real coded app should load actual Poppins from Google Fonts, not Montserrat.

### Type scale (redesign target — `.design-canvas/vartracker-*/` only)

**Added 2026-08-27** after `impeccable audit` flagged a systemic "flat type hierarchy" antipattern (near-continuous 11–19px sizes with no real contrast between roles) across 31 of 39 screen files. Fixed via `impeccable typeset`: consolidated to four roles, with page titles / key figures pushed high enough that every screen clears a 2:1 largest-to-smallest ratio.

| Role | Size | Use |
|---|---|---|
| Caption / meta | `12px` | Timestamps, helper text, table meta |
| Body / label | `14px` | Field labels, body copy, secondary values |
| Subhead | `16px` | Card headers, section labels (where a screen needs a mid-tier) |
| Title / key figure | `24px` (data-dense app screens) or `28px` (auth screens, low information density) | Page `<h1>`, prominent money/stat figures, the "VarTracker" wordmark on auth screens |

Differentiate roles within the same size by weight and color (e.g. `font-weight:600` + `#0F1720` for a value vs. `font-weight:400` + `#6B7280` for its label) rather than introducing another 1–2px size step — this was the root cause of the original flat hierarchy.
## Shape & spacing

- Corner radius: `rounded-xl` (12px) on cards, buttons, inputs
- Cards: white background, soft border, subtle shadow
- Blueprint/architectural diamond line-pattern background — **live today** on the coded marketing pages (e.g. `src/app/about/page.tsx`, `diamondPattern` style object), full intensity per the original spec. Not used anywhere else in the live app yet.
- **Redesign target (`.design-canvas/vartracker-*/` only) — departs from the diamond pattern.** Every canvas screen uses a photographic background instead, rendered as an `<img>` (not CSS `background-image` — that doesn't render in Claude Design canvas) at `opacity:0.5`, scaled down on Tablet/Mobile (`transform:scale(0.8)`/`scale(0.5)`) so it doesn't read as zoomed-in. Assignment per section:
  - Auth flow (Login, Register, Forgot/Reset Password): `bg-desktop.jpg`
  - Core app (Jobs List, Job Detail, New Job, New Variation, Categories): `bg-app.jpg`
  - Sign Page / Subscribe: `bg-sign.jpg`
  - Admin (Dashboard, Contractors, Contractor Detail): `bg-admin.jpg`, paired with a dark `#0F1720` nav bar (vs. white elsewhere) to signal the elevated/different context
  - When Forge implements this redesign, decide then whether the diamond pattern survives anywhere (e.g. marketing pages outside this screen set) or is fully retired — not decided as of 2026-08-27.

## Icons

`lucide-react`, outline style only (2px stroke, no fill) — matches the real coded app. Never Material Symbols or filled icon styles. Icons already in use: `Plus`, `CheckCircle`, `X`, `MapPin`, `ChevronRight`, `ArrowLeft`, `FileText`, `LogOut`, `Briefcase`, `Upload`.

## Logo — do not regenerate

The VarTracker logo is a real, hand-designed asset (created in Fresco by Jacques). **Never generate, redraw, or approximate it in Stitch or any AI tool** — this was tried once this session and rejected immediately. Source files, both in `design/` (gitignored — local originals, not committed; copy into `public/` per-worktree when a build needs them):
- `design/VarTrackerLogo3Trans.png` — the mark (icon only), transparent PNG. Use for compact/square placements.
- `design/VarTrackerName3Trans.png` — the full wordmark, transparent PNG. This is the current logo asset for lockup/header placements — supersedes `VarTrackerName.jpg` for anything new.
- `design/archive/VarTrackerNamelogo.svg` — archived vector (auto-traced, not a clean source — prefer the PNGs)
- `VarTrackerName.jpg` (repo root) — legacy, opaque background. Still the source for `public/VarTrackerName.jpg` on the live landing page; don't touch that page. Don't use this file for new work — use `VarTrackerName3Trans.png` instead, since it's transparent and composites cleanly onto any background.

Any Stitch screen needing the logo gets a labeled blank placeholder ("Logo goes here") — composite the real file in by hand during actual development.

## Validation status

**Updated 2026-08-27.** All 13 planned screens are now built in Claude Design canvas (not Stitch — see note below), each across Desktop/Tablet/Mobile: Login, Register, Forgot Password, Reset Password, Jobs List, New Job, Job Detail, New Variation, Categories, Sign Page, Subscribe, Admin Dashboard, Admin Contractors, Admin Contractor Detail. Checked against `web-design-guidelines` (fixed: wrong placeholder copy on Categories, four touch targets under 44×44px, literal `...` vs `…`), a full manual WCAG AA contrast sweep (zero failures remaining), and `impeccable audit` + `typeset` (fixed a systemic flat type-hierarchy antipattern, 34 detector findings → 0). Not yet run: `impeccable critique`/`polish`. `ui-ux-pro-max` is a React Native pattern/token database and doesn't apply here (this is a web app, not React Native).

**Note on tooling:** the screens above were built with Claude Design canvas (`.design-canvas/vartracker-*/`), not Stitch — this branch (`claude/vartracker-design-handoff-ce5018`) diverged from the Stitch-based work referenced elsewhere in this document. Treat the Stitch asset IDs and warnings below as historical context for how these tokens were originally derived, not as the live design tool. `main` independently merged an earlier, unreconciled copy of this file from the Stitch branch (via a different PR) — this version is the merge of both, current as of 2026-08-27.

## Known-bad references — do not use

Two earlier Stitch design system assets in the same project are broken due to platform issues (see below). Neither is applied to anything live:
- `assets/15704262547670023861` — drifted from the intended flat `#0057B8` to `#007afd` with `FIDELITY` color variant
- `assets/487e9c81c450435897e8b4139620c0f9` ("Reliant Professional") — an unrelated system with Work Sans/Inter/JetBrains Mono fonts, never requested

`assets/17479271680059202132` is the intended asset, but as of 2026-08-13 its live color values also cannot be trusted exactly — see the warning at the top of this file.

## Why colors on the auto-generated Stitch screens don't match this doc exactly

Two separate issues, both confirmed this session:

1. **Stitch auto-generates a full Material Design tonal palette** (secondary, tertiary, a full neutral/surface scale) from just a seed color + `colorVariant` setting — this happens automatically, is not something explicitly requested, and is visible in Stitch's own Design System panel alongside the intentional brand colors documented above. The `tertiary` and extended neutral scale are algorithmic byproducts, not part of VarTracker's brand — nothing in this document or the real app uses them. Ignore them.
2. **The stored design system asset does not reliably hold explicit values, including via calls previously believed safe.** `apply_design_system` and even standalone `update_design_system` calls have been observed being silently overwritten with different, unrequested primary colors and `colorVariant` settings shortly after being set correctly — confirmed across three consecutive correction attempts on 2026-08-13, each producing a different unrequested result. This does not appear to be caused by call sequencing or tool choice; it looks like asynchronous regeneration on Stitch's backend. No reliable fix was found via the available tools — repeated retries are not expected to help and should not be attempted past one correction pass.

**Practical takeaway:** treat this file as authoritative. Treat any color rendered in Stitch — including the design system panel and generated screens — as an approximate visual reference, not a value to copy exactly into code.
