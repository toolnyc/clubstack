import { readFileSync } from 'fs';

function processInput(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const filePath = input.tool_input?.file_path || '';

  // Only check test files
  if (!filePath.match(/\.test\.tsx?$/)) process.exit(0);

  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { process.exit(0); }

  const warns = [];

  // 1. Render without behavioral assertions
  const renderCount = (content.match(/\brender\s*\(/g) || []).length;
  const behavioralPatterns = /userEvent\.|fireEvent\.|screen\.getBy|screen\.findBy|screen\.queryBy|\.toBeInTheDocument|\.toHaveTextContent|\.toHaveAttribute|\.toBeVisible|\.toBeDisabled|\.toHaveBeenCalled|expect\(/g;
  const behavioralCount = (content.match(behavioralPatterns) || []).length;
  if (renderCount > 0 && behavioralCount === 0) {
    warns.push('Test renders component but makes no behavioral assertions — it can never catch a bug.');
  }

  // 2. Generic test names
  const genericPattern = /(?:it|test)\s*\(\s*['"`](renders?|works?|should render|is defined|mounts?|displays?)['"`\s,]/gi;
  let match;
  while ((match = genericPattern.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length;
    warns.push(`Line ${lineNum}: Generic test name "${match[1]}" — name what the user does or sees.`);
  }

  // 3. High mock density
  const nonBlankLines = content.split('\n').filter(l => l.trim().length > 0).length;
  const mockCount = (content.match(/\b(?:vi|jest)\.mock\s*\(/g) || []).length;
  if (nonBlankLines > 0 && mockCount / nonBlankLines > 0.5) {
    warns.push('High mock density — this test may be testing mock behavior rather than real code.');
  }

  // 4. Architecture test special case
  if (filePath.endsWith('architecture.test.ts')) {
    warns.push('Architecture tests should only grow. If you removed or weakened an assertion, explain why in a comment. New rules must test real codebase boundaries (import paths, SQL structure, naming conventions) — not style preferences.');
  }

  if (warns.length === 0) process.exit(0);

  const feedback = '--- Test Quality Review ---\n' + warns.map(w => `⚠️ ${w}`).join('\n');

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
