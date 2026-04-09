import { execSync } from 'child_process';
import { check } from './sentinels.mjs';

process.stdin.setEncoding('utf8');
process.stdin.resume();
process.stdin.on('end', () => {
  const session = check('sessionActive');

  // Count modified source files
  let fileCount = 0;
  try {
    const result = execSync('git diff HEAD --name-only -- apps/web/src/ 2>/dev/null', { encoding: 'utf8' });
    fileCount = result.trim().split('\n').filter(l => l.length > 0).length;
  } catch {}

  // Count total commits this session (if we have a session timestamp)
  let commitCount = 0;
  if (session.exists && session.data?.timestamp) {
    try {
      const log = execSync(`git log --oneline --since="${session.data.timestamp}" 2>/dev/null`, { encoding: 'utf8' });
      commitCount = log.trim().split('\n').filter(l => l.length > 0).length;
    } catch {}
  }

  // Remind if: 3+ files modified, OR any commits were made this session, OR session has been active 1h+
  const hasWork = fileCount >= 3 || commitCount > 0 || (session.exists && session.age >= 1);

  if (!hasWork) process.exit(0);

  const parts = [];
  if (fileCount > 0) parts.push(`${fileCount} uncommitted source file${fileCount === 1 ? '' : 's'}`);
  if (commitCount > 0) parts.push(`${commitCount} commit${commitCount === 1 ? '' : 's'} this session`);
  if (parts.length === 0 && session.exists) parts.push(`session active for ${session.age}h`);

  const feedback = `--- Session close reminder ---
${parts.join(', ')}. Before closing:
• Run /session-close to capture learnings and write the Obsidian report
• Check if any SKILL.md files need updating based on patterns that emerged
• If code was written: confirm /verify passed (or run it now)`;

  const output = {
    systemMessage: feedback
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
