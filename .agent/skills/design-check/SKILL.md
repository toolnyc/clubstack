---
name: design-check
description: Verify a component or page matches the Clubstack design system. Sets design-checked sentinel on pass.
---

# Design System Check

Review the specified file or directory against the Clubstack design system.

**$ARGUMENTS** — file path or component name to check (e.g., `src/components/booking/booking-card.tsx`)

## Steps

1. Read the file(s) specified by $ARGUMENTS
2. Run through each category below — mark pass/fail with specific line references
3. Fix all failures before declaring done
4. On clean pass, set sentinel:
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('designChecked', { file: '$ARGUMENTS' }))"
   ```

## Tokens

- [ ] All spacing uses Tailwind scale (not arbitrary `[47px]`)
- [ ] Border radius: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full` — not raw values
- [ ] Shadows: minimal. `shadow-sm` at most. No `shadow-xl`, no `drop-shadow`
- [ ] Transitions via utility classes, not inline style

## Color

- [ ] No hardcoded hex values — all `text-*`, `bg-*`, `border-*` Tailwind tokens or CSS custom properties
- [ ] Accent ratio: ~95% monochrome (zinc/slate/neutral), ~4% cyan, ~1% neon/highlight
- [ ] Status colors use semantic tokens only: available/busy/booked/hold/error
- [ ] `dark:` variants present for every `bg-*` and `text-*` that differs in dark mode

## Typography

- [ ] Mono (`font-mono`) for: numbers, dates, times, dollar amounts, IDs, status labels, button text, nav items, code
- [ ] Sans (`font-sans`) for: body paragraphs, headings, descriptions, marketing copy
- [ ] Type scale tokens used — not raw `text-[14px]`
- [ ] Body text max width: `max-w-prose` or `max-w-[65ch]`

## Components

- [ ] Maximum one primary button (filled/high-emphasis) per screen or card
- [ ] All inputs have visible `<label>` elements — no placeholder-only inputs
- [ ] Optional fields labeled "(optional)" — required fields need no asterisk
- [ ] Cards: `bg-secondary border border-primary rounded-lg` — no shadow by default
- [ ] Status indicators: 8px dot + mono label. Never color alone to convey state.
- [ ] Empty states: present and designed (not blank white space)
- [ ] Loading states: present for any async data

## Accessibility

- [ ] Color contrast WCAG AA: 4.5:1 for body text, 3:1 for large text/icons
- [ ] Visible focus rings on all interactive elements (not `outline-none` without replacement)
- [ ] `aria-live` or `aria-atomic` on dynamic status regions
- [ ] `prefers-reduced-motion`: any GSAP animation wrapped in motion check

## Fix Protocol

For each failure: fix it now, then re-check that item. Don't list and move on.
If a failure requires design system discussion (new pattern needed): flag it and leave a `// TODO: design-system` comment rather than making an ad-hoc decision.
