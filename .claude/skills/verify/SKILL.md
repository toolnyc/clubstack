---
name: verify
description: Run the full verification loop — lint, test, build. Fix-forward on failure. Use after completing any implementation.
---

# Verify

Run the full verification loop. Fix any failures — do not ask, fix-forward.

## Steps

1. Run `pnpm lint` — fix any ESLint or TypeScript errors
2. Run `pnpm test` — fix any failing tests (including architecture tests)
3. Run `pnpm build` — fix any build errors
4. If any step failed and you made fixes, re-run all three from the top
5. Stop when all three pass clean

## Rules

- Never skip a failing test — either fix the code or fix the test
- Never disable ESLint rules to pass — fix the underlying issue
- Architecture test failures mean a convention was violated — fix the source, not the test
- Report what you fixed, not what passed
