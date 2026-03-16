---
name: design-check
description: Verify a component or page matches the Clubstack design system. Use after building UI.
---

# Design System Check

Review the specified component or page against the Design System Spec:

1. Read the Design System Spec at `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research/Design System Spec.md`
2. Read the component/page code specified by $ARGUMENTS
3. Check against these rules:

## Tokens

- [ ] All spacing uses token values (4px base unit scale)
- [ ] Border radius uses `radius-sm/md/lg/full` tokens
- [ ] Shadows use `shadow-sm/md/lg` tokens (minimal usage)
- [ ] Transitions use `transition-fast/base/slow/reveal` tokens

## Color

- [ ] No hardcoded colors — all CSS custom properties
- [ ] Accent ratio: ~95% monochrome, ~4% cyan, ~1% neon
- [ ] Status colors use semantic tokens (available/busy/booked/hold/error)
- [ ] Works in both light and dark mode

## Typography

- [ ] Mono for data (numbers, dates, status labels, nav items, button text)
- [ ] Sans for narrative (body text, headings, descriptions)
- [ ] Type scale tokens used (not raw px/rem)
- [ ] Max reading width 65ch for body text

## Components

- [ ] Max one primary button per screen
- [ ] Labels always visible (no placeholder-only inputs)
- [ ] Optional fields labeled "(optional)", not required fields with asterisks
- [ ] Cards: bg-secondary, border-primary, radius-lg, no shadow by default
- [ ] Status indicators: 8px dot + mono label, never color alone

## Accessibility

- [ ] Color contrast WCAG AA (4.5:1 body, 3:1 large)
- [ ] Visible focus rings on all interactive elements
- [ ] `aria-live` on dynamic status changes
- [ ] `prefers-reduced-motion` respected

$ARGUMENTS should be a file path or component name to check.
