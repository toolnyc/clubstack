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
5. **Mobile check** (conditional): If any files under `apps/mobile/` were modified in the current feature build (check with `git diff --name-only HEAD~5 | grep apps/mobile/`), also run:
   - `pnpm verify:mobile` — runs expo-doctor + expo export --platform web
   - Fix any warnings or export errors before proceeding
   - Skip this step if no mobile files were touched
6. If any step failed and you made fixes, re-run all three from the top (mobile check only needs one pass)
7. When all pass clean: set the sentinel:
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('verifyPassed'))"
   ```
8. Output what was fixed (not what passed)

## Rules

- Never skip a failing test — either fix the code or fix the test (and explain why)
- Never disable ESLint rules to pass — fix the underlying issue
- Architecture test failures mean a convention was violated — fix the source, not the test
- If `pnpm build` fails but `pnpm lint` and `pnpm test` pass: look for type errors or missing imports introduced by recent changes
