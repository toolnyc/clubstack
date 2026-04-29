---
name: docs-sync
description: Update AGENTS.md, skills, and docs/ to match the current codebase. Run when docs feel stale or after a major feature.
---

# Docs Sync

Bring documentation back into alignment with the current codebase.

## Steps

1. Review recent git history for pattern-setting decisions:

   ```bash
   git log --oneline -50
   ```

2. Read all skill files in `.claude/skills/`

3. Read `AGENTS.md`, `docs/architecture.md`, `docs/database.md`, `docs/testing.md`

4. Compare each doc against reality:

   **`docs/architecture.md`** — Does the described `src/` structure match the actual directory tree?
   Run: `find src -type d | sort` and compare.

   **`docs/database.md`** — Are the RLS patterns still current? Check against recent migrations.

   **`docs/testing.md`** — Do the described patterns match what's actually in `src/test/`?

   **AGENTS.md** — Are all commands in `package.json`? Are all env vars in `.env.local.example`?

   **Each SKILL.md** — Do all referenced file paths exist? Do referenced commands still work?

5. For each stale item: produce a specific edit (what line changes to what). Show all proposed changes before applying any.

6. Apply with confirmation for structural changes, auto-apply for factual corrections (wrong paths, renamed commands).

## Rules

- Stale documentation is worse than no documentation — it actively misleads
- If something is uncertain, mark it with a `<!-- TODO: verify -->` comment rather than leaving the stale content
- After applying: run `pnpm lint` to catch any TypeScript paths that were updated
