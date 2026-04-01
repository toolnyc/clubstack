---
name: kb-prune
description: Remove and reorganize stale content from CLAUDE.md, skills, and docs/. More aggressive than docs-sync — prunes rather than updates.
---

# Knowledge Base Prune

Remove outdated, duplicate, or misleading content from the project knowledge base.

## Steps

1. **Audit skill files** — for each `.claude/skills/*/SKILL.md`:
   - Check every file path reference: does the file exist? (`ls <path>`)
   - Check every command: does it exist in `package.json` scripts?
   - Check every Obsidian path: `obsidian read path="..."` — errors = dead links
   - Flag: stale paths, renamed commands, Obsidian notes that no longer exist

2. **Audit CLAUDE.md**:
   - Compare env vars listed to `.env.local.example` — flag missing or removed vars
   - Compare commands listed to `package.json` — flag removed scripts
   - Check cron job routes exist in `src/app/api/cron/`
   - Flag any "planned" features that have since been built (no longer "Known Gaps")

3. **Audit `docs/`**:
   - `docs/architecture.md`: run `find src -type d | sort` and compare to described structure
   - `docs/database.md`: compare RLS patterns to actual recent migration policies
   - `docs/testing.md`: compare described test patterns to `src/test/` contents

4. **Check for duplicates**:
   - Is the same convention documented in multiple places?
   - Is any SKILL.md content redundant with CLAUDE.md?
   - Consolidate: one canonical location per piece of knowledge

5. Produce a specific prune list:

   ```
   DELETE: [skill] reference to src/lib/old-module.ts (file removed)
   UPDATE: [CLAUDE.md] remove LEGACY_VAR from env vars table (not in .env.local.example)
   CONSOLIDATE: [design-check + CLAUDE.md] both describe the accent ratio rule — keep in design-check only
   ```

6. Apply each action with individual confirmation. Deletions require explicit "yes".

## Rules

- A shorter, accurate knowledge base beats a longer, partially stale one
- When in doubt between updating and deleting: delete — it can be recreated if needed
- Always run `pnpm lint` after edits that touch import paths
