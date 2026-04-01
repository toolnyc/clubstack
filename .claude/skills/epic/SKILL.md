---
name: epic
description: Plan a feature from plain English. Required before /feature can run. Produces a structured epic file.
---

# Epic

Turn a plain English feature description into a structured implementation plan.

**$ARGUMENTS** — plain English description of what to build (e.g., "Agency DJ roster — add/remove/reorder DJs")

## Steps

1. Accept the feature description from $ARGUMENTS
2. Explore the codebase to understand current state:
   - Grep for related existing code (`src/lib/`, `src/components/`, `src/app/`)
   - Read affected lib/ modules and component directories
   - Read `docs/architecture.md` and `docs/database.md`
3. Check `.claude/state/epic-created` — if it exists, show the current epic slug and ask if replacing or creating new
4. Derive the slug from $ARGUMENTS (kebab-case, max 5 words, e.g., `agency-dj-roster`)
5. Write the epic to `.claude/epics/<slug>.md` using this structure:

```
---
slug: <slug>
created: YYYY-MM-DD
status: draft
---

# Epic: <title>

## Intent
What problem does this solve, and for whom?

## Current State
What already exists in the codebase related to this? (Derived from exploration — not assumed.)
Reference specific files and functions that will be affected.

## Delta — What Needs to Be Built
Only what doesn't exist yet. Be specific.

## Data Model
New or changed tables, columns, foreign keys, RLS policies needed.
If no DB changes: "None."

## API Surface
Server actions and/or route handlers to create or modify.
Include function signatures where possible.

## UI Breakdown
Pages → sections → components hierarchy.
Note which components already exist vs. need to be created.

## Acceptance Criteria
Concrete, testable conditions. Each criterion should be a user-observable outcome.

## Known Risks
What could go wrong? What external dependencies or tricky integrations exist?
```

6. Show the epic to the user. Do not save until confirmed.
7. On confirmation: save the file, then run:
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('epicCreated', { epic: '<slug>' }))"
   ```
8. Output: "Epic saved to .claude/epics/<slug>.md. Run /feature <slug> to begin building."

## Rules

- Current state must be derived from reading the actual codebase — never assume
- Delta must be minimal — only what the codebase doesn't already have
- Accept criteria must be testable, not vague ("user can add a DJ to roster" not "roster works correctly")
