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

### Status colors (real Tailwind classes already shipping in the app — use exactly these)

| Status | Background | Text |
|---|---|---|
| Signed / success | `#F0FDF4` (green-50) | `#15803D` (green-700) |
| Pending / warning | `#FFFBEB` (amber-50) | `#92400E` (amber-800) |
| Expired / error | `#FEE2E2` (red-100) | `#DC2626` (red-600) |
| Completed / neutral | `#F3F4F6` (gray-100) | `#4B5563` (gray-600) |

## Typography

Intended typeface: **Poppins** (weights Regular/Medium/Semibold). Poppins isn't in Stitch's font enum, so **Montserrat** was used as the closest available geometric-sans proxy for previewing in Stitch — the real coded app should load actual Poppins from Google Fonts, not Montserrat.

## Shape & spacing

- Corner radius: `rounded-xl` (12px) on cards, buttons, inputs
- Cards: white background, soft border, subtle shadow
- Blueprint/architectural diamond line-pattern background — **full intensity** on login/auth/marketing screens, a much **quieter, low-opacity** variant of the same pattern on working screens (dashboard, job list, job detail) so it never distracts from data entry

## Icons

`lucide-react`, outline style only (2px stroke, no fill) — matches the real coded app. Never Material Symbols or filled icon styles. Icons already in use: `Plus`, `CheckCircle`, `X`, `MapPin`, `ChevronRight`, `ArrowLeft`, `FileText`, `LogOut`, `Briefcase`, `Upload`.

## Logo — do not regenerate

The VarTracker logo is a real, hand-designed asset (created in Fresco by Jacques). **Never generate, redraw, or approximate it in Stitch or any AI tool** — this was tried once this session and rejected immediately. Source files:
- `design/VarTrackerLogo3Trans.png` — transparent PNG, use this
- `design/archive/VarTrackerNamelogo.svg` — archived vector (auto-traced, not a clean source — prefer the PNG)
- `VarTrackerName.jpg` (repo root) — source for `public/VarTrackerName.jpg`, already used on the live landing page

Any Stitch screen needing the logo gets a labeled blank placeholder ("Logo goes here") — composite the real file in by hand during actual development.

## Validation status

Only the login screen ("VarTracker Login Modern Minimal 1") is a validated prototype as of 2026-08-12, checked against `web-design-guidelines`, a manual WCAG contrast pass, and `impeccable`'s design laws. Every other screen — including `/sign/[token]`, the jobs list, and job detail — is **not yet built** against this system. Generate those against the locked `designSystem` asset (`assets/17479271680059202132`) before considering their look final.

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
