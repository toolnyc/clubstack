import { check } from './sentinels.mjs';
import { existsSync } from 'fs';

const GATES = [
  {
    tools: ['Write'],
    pathPattern: /^src\//,
    newFilesOnly: true,
    requires: 'featureActive',
    maxAgeHours: 48,
    severity: 'block',
    message: 'Cannot create new source files without an active feature context.\nRun /feature <epic-name> to begin a feature build.\nQuick fixes to existing files are not blocked.',
  },
  {
    tools: ['Write'],
    pathPattern: /supabase\/migrations\//,
    newFilesOnly: true,
    requires: 'featureActive',
    maxAgeHours: 48,
    severity: 'block',
    message: 'Cannot create migrations without an active feature context.\nRun /feature <epic-name> first.',
  },
  {
    tools: ['Bash'],
    commandPattern: /git commit|gh pr create/,
    requires: 'verifyPassed',
    maxAgeHours: 2,
    severity: 'warn',
    message: '/verify has not passed since the last file changes. Run /verify before committing.',
  },
];

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const toolName = input.tool_name;
  const toolInput = input.tool_input || {};
  const cwd = input.cwd || process.cwd();

  for (const gate of GATES) {
    if (!gate.tools.includes(toolName)) continue;

    if (gate.pathPattern && toolInput.file_path) {
      const relPath = toolInput.file_path.startsWith(cwd)
        ? toolInput.file_path.slice(cwd.length + 1)
        : toolInput.file_path;
      if (!gate.pathPattern.test(relPath)) continue;
    }

    if (gate.commandPattern && toolInput.command) {
      if (!gate.commandPattern.test(toolInput.command)) continue;
    } else if (gate.commandPattern && !toolInput.command) {
      continue;
    }

    if (gate.newFilesOnly) {
      if (toolName === 'Edit') continue;
      if (toolInput.file_path && existsSync(toolInput.file_path)) continue;
    }

    const sentinel = check(gate.requires, { maxAgeHours: gate.maxAgeHours });
    if (sentinel.exists && !sentinel.stale) continue;

    let msg = gate.message;
    if (sentinel.exists && sentinel.stale) {
      msg += `\n(Context is ${sentinel.age}h old — expired after ${gate.maxAgeHours}h)`;
    }

    if (gate.severity === 'block') {
      process.stderr.write(msg);
      process.exit(2);
    } else {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: `⚠️ WARNING: ${msg}`
        }
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }
  }

  process.exit(0);
});
