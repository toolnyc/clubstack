---
name: decompose
description: Break today's roadmap block into specific buildable subtasks. Run when you sit down to work.
---

# Decompose

Turn today's high-level roadmap item into 3–5 specific, buildable subtasks for a 45–60 minute session.

**$ARGUMENTS** — optional: override task description (defaults to auto-detecting today's block from the roadmap)

## Steps

1. Read `docs/mvp-roadmap.md` to find the current task:
   - Look for the first row with an empty Status column
   - If $ARGUMENTS is provided, use that as the task description instead
   - Note the phase and week for context

2. Explore the codebase to understand what exists:
   - Grep for related code in `src/lib/`, `src/components/`, `src/app/`, `apps/`
   - Read any files that will be touched
   - Check `supabase/migrations/` if DB tables are involved
   - Check if an epic already exists for this work

3. Decompose the task into **3–5 subtasks**, each:
   - Completable in 10–20 minutes
   - Has a clear "done" state (file created, test passes, screen renders, API responds)
   - References specific files to create or edit
   - Ordered by dependency (do X before Y)

4. Output the plan as a checklist:

```
## Today's Session: <task name>
Phase: <phase> | Week: <week> | Day: <day>

### Context
<1-2 sentences on what exists and what we're building on>

### Subtasks
- [ ] <specific action> → <done state>
- [ ] <specific action> → <done state>
- [ ] <specific action> → <done state>
- [ ] <specific action> → <done state>

### If time remains
- [ ] <stretch goal>

### Needs epic?
<yes/no — if yes, suggest the epic description to run>
```

5. If the task requires new files in `src/` or `supabase/migrations/`:
   - Check `.claude/state/feature-active` — if not set, note that `/epic` + `/feature` must run first
   - Suggest the epic description to use

6. After outputting the plan, ask: "Ready to start? I'll kick off subtask 1."

## Rules

- Never modify `docs/mvp-roadmap.md` status column — the user marks items done
- Keep subtasks concrete: "Create `apps/mobile/src/screens/Login.tsx` with email input + submit button" not "Build the login screen"
- If the roadmap task is too vague or large for one session, say so and suggest splitting it
- Reference existing code by file path — don't reinvent what's already built
- If $ARGUMENTS mentions a calendar event or vague description, interpret it as a feature task and decompose accordingly
