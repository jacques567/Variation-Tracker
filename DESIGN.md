# VarTracker — Design System

Exported from Stitch design system asset `assets/17479271680059202132` ("VarTracker Design System v3"), locked 2026-08-12. This is the canonical token reference for building VarTracker's UI — implementations should match these values exactly, not the values in earlier/broken Stitch assets (see **Known-bad references** below).

Stitch project: https://stitch.withgoogle.com/projects/12670254359852135253
Validated screens in that project: "VarTracker Login Modern Minimal 1" (prototype), "VarTracker Component Reference" (component sheet).

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

Two earlier Stitch design system assets in the same project are broken due to a platform bug (Stitch's `edit_screens` tool let its internal theme-editing agent rewrite values beyond what was asked, and once forked an entirely unrelated system). Neither is applied to anything live:
- `assets/15704262547670023861` — drifted from the intended flat `#0057B8` to `#007afd` with `FIDELITY` color variant
- `assets/487e9c81c450435897e8b4139620c0f9` ("Reliant Professional") — an unrelated system with Work Sans/Inter/JetBrains Mono fonts, never requested

Only `assets/17479271680059202132` is valid. If rebuilding this system in the future, use only `create_design_system` / `update_design_system` / `apply_design_system` for token-level changes — never `edit_screens`, which is safe only for scoped content edits (text, layout, element swaps), not color/theme changes.
