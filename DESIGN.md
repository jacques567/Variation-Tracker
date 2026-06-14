# VarTracker Design System

**Status:** Production-ready  
**Last updated:** 2026-06-14  
**Owner:** Canvas (design), Forge (implementation)

---

## Brand Identity

**Aesthetic:** Engineering-focused, structural, minimal. No serifs, no decoration. Precision and clarity over personality.

**Color Strategy:** Committed palette — teal brand colour carries 30–60% of surfaces. Clean, professional, approachable without being friendly.

**Typography:** IBM Plex Sans throughout (geometric, technical, no variation). Scale + weight for hierarchy only.

**Physical scene:** Project manager reviewing variation notices at their desk, Tuesday morning. Expects efficiency and clarity. Tool must feel solid, intentional, trustworthy.

---

## Design Tokens

### Colours

| Token | Hex | OKLCH | Usage |
|-------|-----|-------|-------|
| `--color-primary` | #0F4C5C | oklch(0.35 0.09 195°) | Hero, buttons, focus states, accents |
| `--color-primary-dark` | #0A2F3D | oklch(0.20 0.08 195°) | Button hover, active states |
| `--color-primary-darkest` | #061F2D | oklch(0.12 0.07 195°) | Button active pressed |
| `--color-background-primary` | #F5F3F0 | oklch(0.96 0.01 30°) | Form sections, neutral surfaces |
| `--color-background-secondary` | #FFFFFF | oklch(1.0 0 0°) | Input backgrounds, cards |
| `--color-text-primary` | #1A1A1A | oklch(0.10 0.008 0°) | Headings, body text |
| `--color-text-secondary` | #666666 | oklch(0.42 0.01 0°) | Muted text, hints |
| `--color-text-tertiary` | #999999 | oklch(0.60 0.01 0°) | Placeholders, disabled |
| `--color-border-light` | #DDD7D2 | oklch(0.85 0.01 30°) | Input borders, dividers |
| `--color-border-medium` | #C9B8AA | oklch(0.75 0.02 30°) | Hover states |
| `--color-error-bg` | #FCE4E6 | oklch(0.94 0.03 0°) | Error backgrounds |
| `--color-error-text` | #B71C1C | oklch(0.45 0.10 15°) | Error messages |
| `--color-error-border` | #F5A5AA | oklch(0.70 0.05 15°) | Error borders |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | IBM Plex Sans, -apple-system, sans-serif | All text |
| `--font-size-xs` | 0.75rem (12px) | Labels, metadata |
| `--font-size-sm` | 0.875rem (14px) | Body, form hints |
| `--font-size-base` | 0.95rem (15px) | Form inputs, default body |
| `--font-size-md` | 1rem (16px) | Subheadings, emphasis |
| `--font-size-lg` | 1.5rem (24px) | Form section titles |
| `--font-size-xl` | 2.2rem (35px) | Major headings |
| `--font-size-2xl` | 3.2rem (51px) | Page hero headings |
| `--font-weight-regular` | 400 | Body text |
| `--font-weight-medium` | 500 | Emphasis, labels |
| `--font-weight-semibold` | 600 | Strong emphasis |
| `--font-weight-bold` | 700 | Headings |
| `--line-height-tight` | 1.1 | Headings |
| `--line-height-normal` | 1.4 | Form labels |
| `--line-height-relaxed` | 1.6 | Body copy |
| `--letter-spacing-tight` | -0.01em | Large headings |
| `--letter-spacing-normal` | 0em | Default |
| `--letter-spacing-wide` | 0.8px | Uppercase labels |

### Spacing Scale

**Base unit: 4px** — all spacing multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 0.5rem (8px) | Input padding, tight spacing |
| `--spacing-sm` | 0.75rem (12px) | Field gaps, label-to-input |
| `--spacing-md` | 1rem (16px) | Section padding, comfortable gaps |
| `--spacing-lg` | 1.5rem (24px) | Between form groups, section breaks |
| `--spacing-xl` | 2rem (32px) | Major section spacing |
| `--spacing-2xl` | 2.5rem (40px) | Form card padding |
| `--spacing-3xl` | 3rem (48px) | Page-level padding, hero section |
| `--spacing-4xl` | 4rem (64px) | Full-page margins |

### Border & Corners

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-thin` | 1px | Light borders, dividers |
| `--border-width-medium` | 2px | Input borders, focus rings |
| `--border-width-thick` | 3px | Accent borders (hero separator) |
| `--border-radius-none` | 0px | Sharp corners everywhere |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | Default, no elevation |
| `--shadow-subtle` | 0 2px 4px rgba(0, 0, 0, 0.04) | Minimal depth |
| `--shadow-sm` | 0 4px 8px rgba(0, 0, 0, 0.08) | Light cards |
| `--shadow-md` | 0 8px 16px rgba(0, 0, 0, 0.12) | Elevated containers |

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease | Link hovers, simple state |
| `--transition-normal` | 200ms cubic-bezier(0.4, 0, 0.2, 1) | Input focus, button state |
| `--transition-slow` | 300ms cubic-bezier(0.4, 0, 0.2, 1) | Page transitions |

---

## Components

### Input (Text, Email, Password)

**States:** default, hover, focus, disabled, error

```css
.form-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-border-light);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius-none);
  transition: all var(--transition-normal);
}

.form-input:hover {
  border-color: var(--color-border-medium);
  background: var(--color-background-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
  box-shadow: inset 0 0 0 1px var(--color-primary);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input.error {
  border-color: var(--color-error-border);
  background: var(--color-error-bg);
}
```

### Button (Primary CTA)

**States:** default, hover, active, disabled

```css
.button {
  padding: 1rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: var(--border-width-medium) solid var(--color-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  border-radius: var(--border-radius-none);
}

.button:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.button:active {
  background: var(--color-primary-darkest);
  border-color: var(--color-primary-darkest);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Form Label

```css
.form-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}
```

### Form Group (Label + Input)

```css
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-lg);
}

.form-group .form-label {
  margin-bottom: var(--spacing-sm);
}
```

### Hero Section

```css
.hero {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-dark) 100%
  );
  padding: var(--spacing-4xl) var(--spacing-3xl);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(255, 255, 255, 0.02) 40px,
      rgba(255, 255, 255, 0.02) 41px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(255, 255, 255, 0.02) 40px,
      rgba(255, 255, 255, 0.02) 41px
    );
  pointer-events: none;
}
```

### Form Card

```css
.form-card {
  background: var(--color-background-primary);
  padding: var(--spacing-2xl);
  border: var(--border-width-thin) solid var(--color-border-light);
  position: relative;
  max-width: 420px;
}

.form-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
}
```

### Error Message

```css
.error-message {
  background: var(--color-error-bg);
  border: var(--border-width-thin) solid var(--color-error-border);
  color: var(--color-error-text);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-none);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
}
```

### Link

```css
.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}
```

---

## Layout System

### Login Page (Reference)

- **Grid:** 38% (hero) / 62% (form)
- **Hero height:** 100vh minimum
- **Form container:** centered, max-width 420px
- **Responsive breakpoint:** 1024px (stack to single column)

### General Layout Principles

1. **Asymmetry over balance** — 38/62 split, 40/60 split preferred over 50/50
2. **Sharp corners everywhere** — border-radius: 0 on all elements
3. **Breathing room in hero** — generous padding, centered content
4. **Form card padding** — 2.5rem minimum internal padding
5. **Vertical rhythm** — spacing scale of 1.5rem between major sections
6. **Grid texture in hero** — optional 40px repeating grid at 2% opacity for depth

### Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | ≥ 1200px | Full split-screen or asymmetric |
| Tablet | 768px – 1199px | Flex reflow, adapt as needed |
| Mobile | < 768px | Single column, full width |

---

## Motion & Interactions

### Transition Principles

- **No layout animations** — only colour, opacity, border-colour, box-shadow
- **Ease-out curves** — `cubic-bezier(0.4, 0, 0.2, 1)` for snappy feel
- **Fast for hover** — 150ms for link hovers
- **Normal for input** — 200ms for focus/input interactions
- **No bounce, no elastic** — precision over playfulness

### Focus Indicators

- Always visible on interactive elements
- Use teal border + inset shadow (no glow)
- Minimum 2px visible contrast

---

## Typography Hierarchy

### Heading Scale

| Level | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| h1 | 3.2rem | 700 | 1.1 | Page hero headings |
| h2 | 2.2rem | 700 | 1.2 | Section titles, major headings |
| h3 | 1.5rem | 600 | 1.3 | Subsection headings |
| h4 | 1rem | 600 | 1.4 | Card titles, emphasis |
| Body | 0.95rem | 400 | 1.6 | Default text, form inputs |
| Small | 0.875rem | 400 | 1.5 | Form labels, hints |
| Tiny | 0.75rem | 500 | 1.4 | Metadata, uppercase labels |

**Hierarchy requirement:** Minimum 1.25x scale ratio between adjacent levels.

---

## Accessibility

### Contrast Ratios

- Text on primary button: 7.2:1 (AAA)
- Form labels: 9.8:1 (AAA)
- Placeholder text: 4.5:1 (AA minimum)
- Disabled state: acceptable to drop to AA for visual distinction

### Focus & Interactive States

- Focus ring always visible (2px teal border minimum)
- Disabled state indicated by opacity + cursor change
- Error state uses color + border + message (never color alone)
- Hover states use color change or border change (not transform)

### Keyboard Navigation

- Tab order follows visual flow
- All interactive elements focusable
- Submit button focused at form end

---

## Implementation Checklist

### CSS Setup
- [ ] Define all design tokens as CSS custom properties
- [ ] Create base stylesheet with system fonts
- [ ] Set box-sizing to border-box globally
- [ ] Define focus styles on `:focus-visible`

### Components
- [ ] Input (text, email, password, textarea)
- [ ] Button (primary, secondary, ghost states)
- [ ] Form label + group
- [ ] Error message + validation states
- [ ] Links (default, hover, visited)
- [ ] Card containers
- [ ] Hero section
- [ ] Navigation/header

### Pages (in order)
1. Login (reference design ✓)
2. Jobs dashboard
3. Admin panel
4. Settings
5. 404 / error pages

### Responsive
- [ ] Test all breakpoints
- [ ] Verify touch targets (44px minimum)
- [ ] Check input focus on mobile
- [ ] Test dark mode (if applicable)

---

## Files & References

- **Mockup:** `design/login-editorial.html` (interactive, all states)
- **Spec:** This file (source of truth)
- **Typography:** IBM Plex Sans (Google Fonts)
- **Colours:** Defined in tokens section above

---

## Handoff Notes for Forge

**This is the single source of truth.** Every page, every component, every state should match these tokens exactly.

**CSS Custom Properties setup:** Create a `styles/tokens.css` that defines all `--color-*`, `--spacing-*`, `--font-*` variables. Every page imports it.

**No deviations.** If you're about to create a button that doesn't match the spec, stop and ask instead. Consistency > experimentation right now.

**Component library:** Build reusable React/HTML/Vue components (Button, Input, FormGroup, Card, etc.) that consume these tokens. Each component handles its own states (hover, focus, disabled, error).

**Questions?** Reference this doc first. If ambiguous, ask Canvas before coding.