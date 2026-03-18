# Testing

## Stack

- **Unit/Component tests:** Vitest + React Testing Library + jsdom
- **E2E tests:** Playwright
- **API mocking:** MSW (Mock Service Worker)

## Commands

```bash
pnpm test          # Run all unit + architecture tests
pnpm test:watch    # Watch mode
pnpm e2e           # Run Playwright E2E tests
pnpm e2e:ui        # Playwright UI mode
```

## Conventions

- Colocate test files next to source: `dj-card.tsx` → `dj-card.test.tsx`
- Architecture tests live in `src/test/architecture.test.ts` — these enforce project invariants mechanically
- Test behavior, not implementation — assert on what the user sees, not internal state
- Use shared factories for test data (see `src/test/factories.ts` if it exists)
- No mocking Supabase in integration tests — use MSW for API boundaries

## Architecture Tests

These tests enforce conventions automatically:

- No direct `@supabase/*` imports in app/components
- No inline styles (Tailwind only)
- No `any` types
- RLS enabled on every table
- `updated_at` on every table
- Kebab-case file naming in components
- No hardcoded secrets

If an architecture test fails, fix the source code — never modify the architecture test to pass.
