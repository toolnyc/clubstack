---
name: verify-before-commit
description: Always run /verify (lint + test + build) before any git commit, not after
type: feedback
---

Run the full verification suite (lint, test, build) BEFORE committing, not after. Don't commit WIP checkpoints without passing verify first.

**Why:** User wants to ensure code quality gates are checked before anything hits git history, not as an afterthought.

**How to apply:** During feature builds, run `pnpm lint && pnpm test && pnpm build` before every `git commit`, including WIP commits. The feature skill's WIP checkpoint pattern should be: write code → verify → commit, not write code → commit → verify at the end.
