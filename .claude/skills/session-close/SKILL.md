---
name: session-close
description: End-of-session capture. Summarizes work done, updates skills if needed, writes Obsidian report, clears sentinels.
---

# Session Close

Run at the end of every working session where code was written.

## Steps

1. Check for changes:

   ```bash
   git diff --stat HEAD
   git log --oneline -10
   ```

   If no changes since last commit: skip to step 6.

2. Summarize what was built or changed this session. Include:
   - Features added or modified
   - Migrations created
   - Tests written
   - Bugs fixed

3. Review for new conventions:
   Ask explicitly: "Did any new convention, pattern, or architectural decision emerge in this session?"
   If yes:
   - Edit the relevant SKILL.md file now (not later)
   - Add to the `## Active Conventions` table in CLAUDE.md with today's date and rationale

4. Review skills for accuracy:
   - Did any skill reference a file path or command that turned out to be wrong?
   - Did a workflow need extra steps not captured in the skill?
     Fix SKILL.md files now.

5. Write session report to Obsidian:

   ```bash
   cd "/Users/pete/Dropbox/Notes/Obsidian/Clubstack" && obsidian create \
     path="Clubstack/Session Reports/Session — $(date '+%Y-%m-%d') <descriptive-title>.md" \
     content="<report>" 2>/dev/null
   ```

   Report structure:
   - What was built
   - Decisions made (and why)
   - Conventions established
   - Open questions or next steps
   - Link to epic file if applicable

6. Clear all sentinels:
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.clearAll())"
   rm -f .claude/epics/.active
   ```

## Rules

- Never skip the "new conventions" question — this is how the system stays current
- If a skill was wrong, fix it in this session before clearing sentinels
- The session report is permanent record — write it as if future-you will need to understand the context six months from now
