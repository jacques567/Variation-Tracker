# Handoff to Forge: VarTracker Design System & Implementation

**From:** Canvas (Design)  
**To:** Forge (Frontend Implementation)  
**Date:** 2026-06-14  
**Status:** Ready to build  

---

## Mission

Implement the VarTracker login page design (complete, finalized mockup) into the actual codebase, then use the locked design system to build out remaining pages (jobs dashboard, admin panel, settings) with consistency and speed.

**Timeline:** Login first (high priority), then systematic page rollout.

---

## What You Have

### 1. Reference Design (Complete)
- **File:** `design/login-editorial.html`
- **Status:** Fully interactive mockup with all states
- **Content:** Email/password form, hero section with logo, error handling, responsive
- **Open in browser:** Perfect reference for pixel-perfect implementation

### 2. Design System (Comprehensive)
- **File:** `DESIGN.md` (project root)
- **Content:** 
  - All design tokens (colors, typography, spacing, shadows, borders, transitions)
  - Component specifications with ready-to-use CSS
  - Layout principles and responsive strategy
  - Accessibility requirements
  - Implementation checklist

**This is your single source of truth.** Every page, every component must match this spec exactly.

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. **Set up design tokens** → Create `src/styles/tokens.css` with all CSS custom properties
2. **Create component library** → Build reusable components:
   - `Input` (text, email, password, textarea)
   - `Button` (primary, secondary states)
   - `FormGroup` (label + input wrapper)
   - `Card` (base container)
   - `ErrorMessage` (validation state)
   - `Link` (styled anchor)
3. **Implement Login page** → Use components to build the actual login at `src/app/(auth)/login/`
4. **Test & verify** → Responsive, keyboard nav, all states (hover, focus, disabled, error)

### Phase 2: Core Pages (Week 2–3)
1. **Jobs Dashboard** → List page showing variations, asymmetric layout
2. **Admin Panel** → User/project management, tables, form sections
3. **Settings** → Account, project settings, preference toggles

### Phase 3: Completeness (Week 4)
1. **Error pages** → 404, 500, access-denied
2. **Polish** → Dark mode (if required), loading states, empty states

---

## Key Constraints (Don't Deviate)

### Typography
- **Font:** IBM Plex Sans (all headings, all body text)
- **No serifs, no variations.** Use weight + scale only.
- **Sizes:** Follow the scale in DESIGN.md exactly
- **Line-height:** 1.1 for headings, 1.6 for body

### Corners
- **All elements: border-radius: 0**
- Sharp corners everywhere. No exceptions.

### Colors
- **Use CSS custom properties** from tokens.css
- **Never hardcode hex values** in component CSS
- **Teal is primary:** #0F4C5C for buttons, focus states, accents

### Spacing
- **All gaps must be multiples of 4px** (use the spacing scale: 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px)
- **No arbitrary padding.** Reference `--spacing-*` tokens.

### Transitions
- **Fast (150ms):** Link hovers
- **Normal (200ms):** Input focus, button interactions
- **No layout animations** — only color, opacity, border-color, box-shadow

### Responsive
- **Breakpoint:** 1024px for major layout shift
- **Mobile:** Single column, full width, 44px+ touch targets

---

## Technical Setup

### CSS Structure
```
src/styles/
├── tokens.css        ← All CSS custom properties
├── base.css          ← Global styles, resets
├── components.css    ← Component styles (Button, Input, etc.)
└── layout.css        ← Page layout, grid systems
```

### Component Structure (React example)
```
src/components/
├── Input.jsx         ← Input component, all states
├── Button.jsx        ← Button component, all states
├── FormGroup.jsx     ← Label + Input wrapper
├── Card.jsx          ← Card container
├── ErrorMessage.jsx  ← Error display
└── Link.jsx          ← Styled link
```

Each component should:
1. Accept standard props (className, disabled, error, etc.)
2. Apply appropriate token variables
3. Handle all states (hover, focus, active, disabled, error)
4. Use transition tokens for smooth interactions

### Login Page Path
- Current: `src/app/(auth)/login/page.tsx`
- Uses new component library to build the page
- Reference: `design/login-editorial.html`
- Supabase integration already exists, just needs UI update

---

## QA Checklist (Before Shipping Each Page)

- [ ] All text uses IBM Plex Sans
- [ ] All corners are 0px radius (sharp)
- [ ] All colours from design tokens (no hardcoded hex)
- [ ] Spacing is multiples of 4px
- [ ] Button states (hover, active, disabled) work
- [ ] Input focus ring visible and correct colour
- [ ] Error states display properly
- [ ] Form labels uppercase with correct spacing
- [ ] Responsive below 1024px works
- [ ] Touch targets 44px+ on mobile
- [ ] Keyboard tab order logical
- [ ] No layout shifts on hover/focus

---

## Common Questions

**Q: What if I need a color not in the tokens?**  
A: Stop. Ask Canvas first. New colours need to be added to the system, not hacked in.

**Q: Can I use a different font for emphasis?**  
A: No. Use weight + size only. IBM Plex Sans everywhere.

**Q: Do we need dark mode?**  
A: Not yet. Light theme only. Add to backlog if requested.

**Q: What about animations/micro-interactions?**  
A: Transition tokens cover basic interactions. Anything fancier needs Canvas approval first.

**Q: Should I add padding/spacing for "breathing room"?**  
A: No. Stick to the spacing scale exactly. The system is balanced already.

---

## Communication

**If blocked:** Ask Canvas in Slack, don't guess.  
**If token is ambiguous:** Reference DESIGN.md, then ask Canvas.  
**If something looks wrong:** Take a screenshot, compare to login mockup, ask before changing.

---

## Next Steps

1. Read DESIGN.md thoroughly
2. Build CSS tokens (copy/paste from DESIGN.md)
3. Implement component library (Button, Input, etc.)
4. Build Login page
5. Test against mockup
6. Move to next page

**You're set. Build it.**

---

## Files You Own

- `/src` — all implementation
- `/src/styles/tokens.css` — design tokens (create this)
- `/src/components/` — component library (create this)
- `/design/login-editorial.html` — reference (don't edit)
- `DESIGN.md` — source of truth (read-only)

Good luck. Questions? Ask Canvas first, code second.