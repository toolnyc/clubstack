---
name: build
description: Execute a build plan — chain epics/features without human intervention. Reads BUILDPLAN.md and executes sequentially.
---

# Build

Execute a build plan from `.claude/epics/BUILDPLAN.md` or a specified plan file. Chains `/epic` -> `/feature` -> `/verify` -> `/verify-agent` -> commit for each item, with automatic advancement and failure recovery.

**$ARGUMENTS** — (optional) path to build plan file. Default: `.claude/epics/BUILDPLAN.md`

## Pre-flight

1. Resolve the build plan file:
   - If `$ARGUMENTS` provided: use that path
   - Otherwise: read `.claude/epics/BUILDPLAN.md`
   - If not found: **stop** — "No build plan found. Create `.claude/epics/BUILDPLAN.md` first."

2. Parse the plan:
   - Each numbered line is an epic slug
   - Indented lines (prefixed with `-`) depend on their parent and run after it
   - Lines starting with `#` or blank lines are ignored

3. Read progress:

   ```bash
   node -e "import('./.claude/hooks/progress.mjs').then(p => console.log(JSON.stringify(p.readProgress(), null, 2)))"
   ```

4. Display the plan with status:
   - [x] completed features (from `completedFeatures`)
   - [>] current feature (from `currentFeature`)
   - [ ] remaining features
   - Show any logged blockers

5. Initialize progress tracking:

   ```bash
   node -e "import('./.claude/hooks/progress.mjs').then(p => p.writeProgress({ buildPlan: '$PLAN_FILE_PATH' }))"
   ```

6. Ask user: **"Continue from [next-incomplete-item]? (y/n)"** — this is the only human approval in the entire build run.

## Execution Loop

For each epic slug in plan order:

### 1. Check if already done

If slug is in `completedFeatures` -> skip, move to next.

### 2. Check if blocked by parent

If this is an indented item and its parent is in `blockers` -> skip, log "Skipped: depends on blocked parent".

### 3. Create epic if needed

If `.claude/epics/<slug>.md` does not exist:

- The plan should include a one-line description after the slug (e.g., `1. roster-management — Agency roster CRUD`)
- Run `/epic "<description>"` to create the epic file
- If no description: **stop** — "Epic `<slug>` not found and no description in plan."

### 4. Build the feature

```bash
node -e "import('./.claude/hooks/progress.mjs').then(p => p.writeProgress({ currentFeature: '<slug>', currentStep: 'feature', currentEpicIndex: <index> }))"
```

Run `/feature <slug>`

### 5. Verify

Run `/verify`

If verify fails after 2 attempts (respecting iteration caps from feature skill):

```bash
node -e "import('./.claude/hooks/progress.mjs').then(p => p.addBlocker('<slug>', 'verify', '<error summary>'))"
```

- Commit partial: `git add -A && git commit -m "wip(<slug>): blocked — verify failed"`
- Check if next item depends on this one (indented under it) -> skip dependents too
- Continue to next independent item

### 6. Independent verification

If epic has acceptance criteria, run `/verify-agent`. If it fails after 1 retry, log as warning but don't block.

### 7. Commit and advance

```bash
git add -A
git commit -m "feat(<slug>): <description from epic>"
node -e "import('./.claude/hooks/progress.mjs').then(p => p.completeFeature('<slug>'))"
```

### 8. Context window check

After each completed feature, assess context pressure:

- If the conversation has been running for a long time (many tool calls, approaching limits)
- Or if auto-compaction has triggered during this build run

Then:

```bash
git add -A && git commit -m "wip(build): context checkpoint"
node -e "import('./.claude/hooks/progress.mjs').then(p => p.writeProgress({ currentStep: 'context-pause' }))"
```

Output: **"Context pressure — committing and requesting session restart. Resume with `/build` to continue from `<next-slug>`."**
Stop execution.

## Stop Conditions

- **All features complete:** Output summary of completed features and any blockers. Run `/session-close`.
- **2 consecutive blocked features:** Stop and report to user. Something systemic may be wrong.
- **Context pressure:** Commit checkpoint, stop, request restart.
- **User interrupt:** Commit current state, update progress.

## Resume

When `/build` is run and `progress.json` already has a `buildPlan`:

- Show completed features with checkmarks
- Show current position
- Show blockers (if any)
- Ask to continue from the next incomplete item

## Plan File Format

`.claude/epics/BUILDPLAN.md`:

```markdown
# Build Plan: <name>

## Execution Order

1. <slug> — <one-line description>
2. <slug> — <one-line description>
   - <dependent-slug> — <description> (runs after parent)
3. <slug> — <one-line description>
```

## Rules

- One confirmation at start, then fully autonomous
- Never skip `/verify` — every feature must pass lint + test + build before advancing
- On 2 consecutive blocked features: stop and report to user
- Always commit before stopping (crash recovery via progress.json)
- Do not modify the build plan file during execution
- Respect all iteration caps from the feature skill (2 verify, 3 fix-forward)
