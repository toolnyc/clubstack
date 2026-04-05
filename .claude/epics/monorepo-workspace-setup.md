---
slug: monorepo-workspace-setup
created: 2026-04-05
status: completed
---

# Epic: Monorepo Workspace Setup

## Intent

Convert the flat Next.js project to a pnpm workspace monorepo so that a React Native/Expo mobile app (Day 3) and shared packages (Day 4) can be added alongside the existing web app. No new features — pure structural move.

## Current State

- Single Next.js app at repo root: `src/`, `public/`, `e2e/`, `supabase/`
- Config files at root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `postcss.config.mjs`, `vercel.json`
- Sentry configs at root: `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts`
- `package.json` has all deps (Next.js, React, Stripe, Supabase, testing, etc.) in one flat file
- No `pnpm-workspace.yaml` — not a monorepo yet
- `@/` path alias maps to `./src/*` in tsconfig
- Vitest includes `src/**/*.test.{ts,tsx}`, setup at `./src/test/setup.ts`
- Playwright testDir is `./e2e`
- Pre-tool gate hook (`pre-tool-gate.mjs`) blocks new files matching `^src/` without feature-active sentinel
- Post-tool TSX design hook checks files matching `^src/.*\.tsx$`
- Stop hook runs `git diff HEAD --name-only -- src/`
- 54 test files, 447 tests, all passing
- `simple-git-hooks` + `lint-staged` at root for pre-commit

## Delta — What Needs to Be Built

### 1. Workspace Root

- Create `pnpm-workspace.yaml` with `apps/*` and `packages/*`
- Slim root `package.json`: keep workspace scripts, `simple-git-hooks`, `lint-staged`, shared dev tooling (eslint, prettier, typescript). Move app-specific deps to `apps/web/`
- Root scripts become orchestrators: `"dev": "pnpm --filter web dev"`, `"build": "pnpm --filter web build"`, `"lint": "pnpm --filter web lint"`, `"test": "pnpm --filter web test"`, etc.

### 2. Move Next.js to `apps/web/`

- Move: `src/`, `public/`, `next.config.ts`, `postcss.config.mjs`, `sentry.*.config.ts`, `next-env.d.ts`
- Move + update: `tsconfig.json` (paths stay `@/` → `./src/*`), `vitest.config.ts`, `eslint.config.mjs`
- Create `apps/web/package.json` with Next.js + runtime deps, app-specific dev deps
- `vercel.json` stays at root (Vercel expects it there) — no change needed since Vercel auto-detects framework in subdirectory

### 3. Keep at Root

- `CLAUDE.md`, `AGENTS.md`, `docs/`, `.claude/`, `supabase/`, `e2e/`, `__fixtures__/`, `scripts/`, `vercel.json`, `pnpm-lock.yaml`
- Playwright config stays at root (tests the deployed app, not a specific package)

### 4. Update Hooks

- `pre-tool-gate.mjs`: `^src/` → `^apps\/web\/src\/` (and keep `^src/` for backward compat during transition, or just update)
- `post-tool-tsx-design.mjs`: `^src\/.*\.tsx$` → `^apps\/web\/src\/.*\.tsx$`
- `stop.mjs`: `git diff HEAD --name-only -- src/` → `git diff HEAD --name-only -- apps/web/src/`

### 5. Update Docs References

- `CLAUDE.md`: commands section, architecture test path
- `docs/architecture.md`: `src/` directory tree references
- `docs/testing.md`: test file locations
- `docs/database.md`: if it references `src/types/`

### 6. Vercel Configuration

- Add `vercel.json` root directory setting or use Vercel project settings to point at `apps/web`
- Alternatively: Vercel auto-detects if `apps/web` has `next.config.ts`

## Data Model

None.

## API Surface

None — no new endpoints. Existing routes in `src/app/api/` move to `apps/web/src/app/api/` unchanged.

## UI Breakdown

None — no UI changes. All components move as-is.

## Acceptance Criteria

1. `pnpm install` succeeds from workspace root
2. `pnpm lint` (root) runs ESLint + tsc against `apps/web` and passes
3. `pnpm test` (root) runs Vitest against `apps/web` and all 447 tests pass
4. `pnpm build` (root) produces a successful Next.js production build in `apps/web`
5. `pnpm dev` (root) starts the Next.js dev server from `apps/web`
6. `@/` import alias resolves correctly in all files
7. Pre-tool gate hook still blocks new file creation in `apps/web/src/` without feature-active
8. TSX design hook still checks files in `apps/web/src/`
9. Vercel deployment still works (vercel.json + auto-detection)
10. `supabase/` directory remains at repo root (shared across apps)
11. No files left orphaned at old `src/` location

## Known Risks

1. **pnpm workspace hoisting** — Some Next.js deps may need explicit hoisting config if they don't resolve from `apps/web/node_modules`. Watch for runtime "module not found" errors.
2. **Vercel root directory** — May need to configure Vercel project settings to set root directory to `apps/web`. Can be done via dashboard or `vercel.json`.
3. **Sentry config paths** — Sentry's Next.js plugin expects config files at the Next.js project root, not the monorepo root. Must move with the app.
4. **lint-staged paths** — Globs like `*.{ts,tsx}` may need scoping or the root config needs to handle the new directory structure.
5. **simple-git-hooks** — Must stay at root (git hooks run from repo root). lint-staged should still work since it operates on staged files by path.
