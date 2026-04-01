---
name: verify
description: Run the full verification loop — lint, test, build. Sets verify-passed sentinel on clean pass.
---

# Verify

Run the full verification loop. Fix any failures — do not ask, fix-forward.

## Steps

1. Clear the verify-passed sentinel (starting fresh):
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.clear('verifyPassed'))"
   ```
2. Run `pnpm lint` — fix any ESLint or TypeScript errors
3. Run `pnpm test` — fix any failing tests (including architecture tests)
4. Run `pnpm build` — fix any build errors
5. If any step failed and you made fixes, re-run all three from the top
6. When all three pass clean: set the sentinel:
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('verifyPassed'))"
   ```
7. Output what was fixed (not what passed)

## Rules

- Never skip a failing test — either fix the code or fix the test (and explain why)
- Never disable ESLint rules to pass — fix the underlying issue
- Architecture test failures mean a convention was violated — fix the source, not the test
- If `pnpm build` fails but `pnpm lint` and `pnpm test` pass: look for type errors or missing imports introduced by recent changes
