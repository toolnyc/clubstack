---
name: build-issue
description: DEPRECATED — use /epic then /feature instead. This skill redirects to the new workflow.
---

# Build Issue — Deprecated

This skill has been replaced by a two-step workflow that produces better results:

1. **`/epic "<description>"`** — Research the codebase, define scope, produce a structured plan
2. **`/feature <epic-slug>`** — Build from the plan with quality gates enforced

## Why the Change

The old workflow assumed an Epic Spec existed in Obsidian and went straight to implementation. The new workflow:

- Derives current state from the actual codebase (not stale specs)
- Requires explicit scope confirmation before any code is written
- Enforces quality gates automatically (design, verify, session close)

## If You Need a Quick Fix

For changes < 5 lines to existing files (typos, config values, small corrections), you don't need an epic. Edit directly. The pre-tool gate only blocks **new file creation**.
