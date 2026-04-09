---
name: verify-agent
description: Spawn an isolated agent that independently verifies the feature against its acceptance criteria. Anti-sycophancy measure.
---

# Verify Agent (Isolated)

Spawn a worktree-isolated agent that verifies the current feature meets its acceptance criteria WITHOUT seeing implementation code or rationale.

Based on MIT CSAIL sycophancy research (arXiv 2602.19141): agents that see implementation rationale become sycophantic. An isolated agent that only sees acceptance criteria and a running app provides honest verification.

## When to Run

After `/verify` passes (lint + test + build clean) but before final commit. Only run if the epic has an Acceptance Criteria section.

## Pre-flight

1. Read the active epic file from `.claude/epics/.active` to get the slug
2. Read `.claude/epics/<slug>.md`
3. Extract ONLY the **Acceptance Criteria** section — nothing else from the epic
4. If no acceptance criteria section exists: skip this skill, output "No acceptance criteria — skipping isolated verify"
5. Ensure dev server is running (`pnpm dev` or confirm localhost:3000 responds)

## Spawn the Isolated Agent

Use the Agent tool with these parameters:

```
Agent(
  description: "Independent QA verification",
  isolation: "worktree",
  prompt: <see below>
)
```

**Agent prompt** (fill in `{{criteria}}` from the epic):

```
You are an independent QA agent. You have NEVER seen the implementation
code for this feature. Your job is to verify acceptance criteria by
interacting with the running application.

## Acceptance Criteria

{{criteria}}

## Base URL

http://localhost:3000

## Instructions

- Use the Playwright MCP browser tool to navigate and inspect the application
- For each criterion, determine PASS or FAIL with evidence
- Take accessibility snapshots as evidence for each check
- Do NOT read any source code files — you are testing the product, not the code
- Do NOT use Glob, Grep, or Read tools on source files
- Be skeptical — assume nothing works until you verify it yourself
- If a page returns an error or does not load, that is a FAIL

## Output Format

Return a structured verdict:

### Results

For each criterion:
- **Criterion:** <text>
- **Result:** PASS / FAIL
- **Evidence:** <what you observed>

### Summary

- **Overall:** PASS / FAIL
- **Pass count:** X / Y
```

## Handle Results

- **All pass:** Proceed to final commit
- **Any fail:** Report which criteria failed with evidence. Fix the issues, re-run `/verify`, then re-run `/verify-agent` (max 1 retry)
- **Agent error/timeout:** Report the error, proceed without isolated verification (do not block the build on infrastructure issues)

## Rules

- Never give the agent access to implementation files, commit messages, or epic rationale
- The agent gets: acceptance criteria text, base URL, Playwright MCP tools
- Max 1 retry of verify-agent per feature build
- If verify-agent is unavailable (MCP not running, worktree issues), log a warning and continue — do not block
