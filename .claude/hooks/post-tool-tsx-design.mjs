import { clear } from './sentinels.mjs';
import { readFileSync } from 'fs';

function processInput(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const filePath = input.tool_input?.file_path || '';
  const cwd = input.cwd || process.cwd();

  // Only check TSX files in src/
  const relPath = filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
  if (!relPath.match(/^src\/.*\.tsx$/)) process.exit(0);

  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { process.exit(0); }

  const lines = content.split('\n');
  const warns = [];

  // 1. Hardcoded hex colors
  lines.forEach((line, i) => {
    const hexMatch = line.match(/(?<![\w-])#[0-9a-fA-F]{3,8}(?![\w-])/g);
    if (hexMatch) {
      warns.push(`Line ${i + 1}: Hardcoded hex color ${hexMatch.join(', ')} — use Tailwind color tokens`);
    }
  });

  // 2. Inline style objects
  lines.forEach((line, i) => {
    if (/style=\{/.test(line)) {
      warns.push(`Line ${i + 1}: Inline style object — use Tailwind classes instead`);
    }
  });

  // 3. Hardcoded pixel values in className
  lines.forEach((line, i) => {
    if (/\b(?:w|h|p|m|gap|space)-\[[\d.]+px\]/.test(line)) {
      warns.push(`Line ${i + 1}: Arbitrary pixel value in className — use token-based sizing`);
    }
  });

  // Clear design-checked sentinel
  clear('designChecked');

  if (warns.length === 0) process.exit(0);

  const feedback = '--- TSX Design Review ---\n' + warns.map(w => `⚠️ ${w}`).join('\n');

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: feedback
    }
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => processInput(raw));
