---
name: feature
description: Build a feature from an existing epic. Requires /epic to have been run first. Manages the feature-active sentinel.
---

# Feature

Build a planned feature from an epic file.

**$ARGUMENTS** — epic slug (e.g., `agency-dj-roster`) or path to epic file

## Pre-flight

1. Read `.claude/epics/PREFLIGHT.md` — if it has unchecked items, show them to the user before proceeding
2. Resolve the epic file:
   - Try `.claude/epics/$ARGUMENTS.md`
   - Try `.claude/epics/$ARGUMENTS` (if path provided directly)
   - If not found: **stop** — "No epic found for '$ARGUMENTS'. Run /epic '$ARGUMENTS' first."
3. Check `.claude/state/feature-active`:
   - If exists and < 48h old: show active epic name and ask "Resume this feature or start a new one?"
   - If stale (> 48h): warn and offer to clear
4. Read the epic file fully before proceeding

## Sentinel Setup

```bash
# Write .active file (gitignored)
echo "$ARGUMENTS" > .claude/epics/.active
# Set feature-active sentinel
node -e "import('./.claude/hooks/sentinels.mjs').then(s => {
  s.set('featureActive', { epic: '$ARGUMENTS' });
  s.clear('verifyPassed');
  s.clear('designChecked');
})"
# Initialize progress tracking
node -e "import('./.claude/hooks/progress.mjs').then(p => p.writeProgress({ currentFeature: '$ARGUMENTS', currentStep: 'schema' }))"
```

## Build Order

Follow this order strictly — each step depends on the previous:

1. **Schema** (if Data Model in epic is not "None")
   - Run `/db-migrate <migration-name>`
   - Wait for `pnpm db:types` to complete and types-current sentinel to be set
   - **WIP checkpoint:**
     ```bash
     git add supabase/migrations/ apps/web/src/lib/supabase/database.types.ts
     git commit -m "wip($ARGUMENTS): schema"
     node -e "import('./.claude/hooks/progress.mjs').then(p => { p.updateStep('server'); p.writeProgress({ lastCommit: '$(git rev-parse --short HEAD)' }); })"
     ```

2. **Server layer** — server actions and/or route handlers
   - Reference the API Surface from the epic
   - All logic in `src/lib/<domain>/actions.ts` or similar
   - No Supabase imports outside `src/lib/supabase/`
   - **WIP checkpoint:**
     ```bash
     git add apps/web/src/lib/
     git commit -m "wip($ARGUMENTS): server layer"
     node -e "import('./.claude/hooks/progress.mjs').then(p => { p.updateStep('ui'); p.writeProgress({ lastCommit: '$(git rev-parse --short HEAD)' }); })"
     ```

3. **UI layer** — components and pages
   - Reference the UI Breakdown from the epic
   - Run `/design-check <file>` on each new TSX file as it's completed
   - Server Components by default; `'use client'` only when needed
   - **WIP checkpoint:**
     ```bash
     git add apps/web/src/app/ apps/web/src/components/
     git commit -m "wip($ARGUMENTS): ui components"
     node -e "import('./.claude/hooks/progress.mjs').then(p => { p.updateStep('tests'); p.writeProgress({ lastCommit: '$(git rev-parse --short HEAD)' }); })"
     ```

4. **Tests** — colocated with source files
   - Unit tests for business logic in lib/
   - Component tests for UI behavior
   - Architecture tests remain untouched unless adding new rules
   - **WIP checkpoint:**
     ```bash
     git add apps/web/src/
     git commit -m "wip($ARGUMENTS): tests"
     node -e "import('./.claude/hooks/progress.mjs').then(p => { p.updateStep('verify'); p.writeProgress({ lastCommit: '$(git rev-parse --short HEAD)' }); })"
     ```

## Iteration Discipline

Caps prevent infinite loops. Reflection prevents repeated mistakes.

### Limits

- **Max verify attempts:** 2 — if `pnpm lint && pnpm test && pnpm build` fails twice, stop.
- **Max fix-forward loops per step:** 3 — if a step's code fails lint/typecheck 3 times, stop.

### Before Each Retry

STOP and reflect before retrying. Answer these three questions explicitly:

1. What exactly failed? (paste the error, not a summary)
2. Why did my previous fix not work?
3. What is different about this attempt?

Do not retry without writing these answers. This forced reflection cuts stuck-agent loops by 67% (Osmani research).

### On Cap Hit

When a limit is reached:

1. Commit whatever currently works:
   ```bash
   git add -A && git commit -m "wip($ARGUMENTS): partial — <step> blocked"
   ```
2. Log the blocker:
   ```bash
   node -e "import('./.claude/hooks/progress.mjs').then(p => p.addBlocker('$ARGUMENTS', '<step>', '<error summary>'))"
   ```
3. Report to user: "Blocked on `<step>` after N attempts. Error: `<summary>`. Committed partial progress."
4. Move to the next step if possible, or stop the feature build.

## Verification

After all files are written:

```bash
# Run full verify cycle
pnpm lint && pnpm test && pnpm build
```

On clean pass:

```bash
node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('verifyPassed', { epic: '$ARGUMENTS' }))"
# Final feature commit on top of WIP history
git add -A
git commit -m "feat($ARGUMENTS): <description from epic>"
node -e "import('./.claude/hooks/progress.mjs').then(p => p.completeFeature('$ARGUMENTS'))"
```

On failure: fix-forward, but respect iteration caps (see Iteration Discipline above). Before each retry, perform the mandatory 3-question reflection. Never skip a test or disable a lint rule.

## Closeout

After verify passes:

- Remove `.claude/epics/.active`
- Update epic file status: `status: draft` → `status: completed`
- Output: "Feature complete. Run /session-close to capture this session."

## Rules

- Never start writing code without reading the epic first
- If the epic's current state section turns out to be wrong (codebase changed since epic was written), update it before proceeding
- If scope creep is identified during build, stop and update the epic — don't silently expand scope
