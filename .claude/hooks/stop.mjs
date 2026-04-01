import { execSync } from 'child_process';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let count = 0;
  try {
    const result = execSync('git diff HEAD --name-only -- src/ 2>/dev/null', { encoding: 'utf8' });
    count = result.trim().split('\n').filter(l => l.length > 0).length;
  } catch {
    process.exit(0);
  }

  if (count < 3) process.exit(0);

  const feedback = `--- Session summary reminder ---
You modified ${count} source files this session. Before closing:
• Run /session-close to capture learnings and write the Obsidian report
• Check if any SKILL.md files need updating based on patterns that emerged
• Confirm /verify passed (or run it now if not)`;

  const output = {
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: feedback
    }
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
