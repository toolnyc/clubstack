---
name: build-issue
description: Build a GitHub issue from the MVP Epic Spec. Use when creating or implementing a specific feature ticket.
---

# Build Issue

When given an issue number, title, or feature description from the MVP Epic Spec:

1. Read the MVP Epic Spec at `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research/MVP Epic Spec.md`
2. Read the Design System Spec at `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research/Design System Spec.md`
3. Read the current CLAUDE.md for architecture and conventions
4. Identify all related data model entities and their relationships
5. Implement the feature following these steps:
   - Schema/migration if new tables needed
   - Types in `src/types/`
   - Server-side logic (API routes, server actions)
   - UI components (design system primitives first, then feature components)
   - Tests: unit tests for business logic, component tests for UI, E2E test for the flow
6. Create a commit with conventional commit message (`feat:`, `fix:`, etc.)

$ARGUMENTS should be the issue title or feature name to build.

Always check existing code before creating new files. Prefer editing over creating.
