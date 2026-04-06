---
slug: expo-init
created: 2026-04-06
status: completed
---

# Epic: Expo Init

## Intent

Scaffold the React Native / Expo app shell so mobile development can begin.
No business logic — just a bootable app wired into the monorepo.

## Current State

- Monorepo is live: `pnpm-workspace.yaml` globs `apps/*` and `packages/*`
- `apps/web/` is the only app — Next.js, fully working
- Root `package.json` has `--filter web` scripts only
- `apps/mobile/` does not exist
- `docs/architecture.md` already documents the planned mobile directory structure

## Delta — What Needs to Be Built

1. Scaffold Expo app at `apps/mobile/` with Expo Router (file-based routing)
2. Add mobile workspace scripts to root `package.json` (`dev:mobile`, `lint:mobile`)
3. Clean template boilerplate — set app name to "Clubstack", scheme to `clubstack://`
4. Confirm it boots in Expo Go (iOS simulator or physical device)
5. Confirm `pnpm dev` (web) still works — no workspace conflicts

## Data Model

None.

## API Surface

None.

## UI Breakdown

Template default screens only — will be replaced in Week 3 (Auth + Onboarding).

## Acceptance Criteria

- `apps/mobile/` exists with a valid `package.json` and Expo Router config
- `pnpm install` from root resolves all workspace deps without errors
- `pnpm dev:mobile` starts Metro bundler
- App renders in Expo Go without crash
- `pnpm dev` (web) still starts the Next.js dev server cleanly
- App displays "Clubstack" as the app name

## Known Risks

- Expo SDK version compatibility with the workspace's Node version
- pnpm hoisting behavior with React Native's module resolution (may need `.npmrc` tweaks)
- Expo Go may require specific SDK version alignment
