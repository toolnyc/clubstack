import { clear } from './sentinels.mjs';
import { readFileSync } from 'fs';

const SKIP_UPDATED_AT = [
  'booking_dates', 'booking_artists', 'calendar_cache', 'contract_signatures',
  'invoice_line_items', 'threads', 'messages', 'booking_access_tokens',
  'venue_contacts', 'transfers', 'technical_riders', 'waitlist_signups'
];

function processInput(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const filePath = input.tool_input?.file_path || '';

  // Only check migration files
  if (!filePath.match(/supabase\/migrations\/.*\.sql$/)) process.exit(0);

  // Read file content
  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { process.exit(0); }

  const lines = content.split('\n');
  const errors = [];
  const warns = [];

  // Find all CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const lineNum = content.slice(0, match.index).split('\n').length;

    // Check RLS enabled
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (!rlsRegex.test(content)) {
      errors.push(`Line ${lineNum}: Table "${tableName}" missing ENABLE ROW LEVEL SECURITY`);
    }

    // Check at least one policy exists
    const policyRegex = new RegExp(`CREATE\\s+POLICY\\s+.*\\bON\\s+(?:public\\.)?${tableName}\\b`, 'i');
    if (!policyRegex.test(content)) {
      warns.push(`Line ${lineNum}: Table "${tableName}" has no policies — RLS enabled but all access blocked`);
    }

    // Check for id uuid
    // Look between this CREATE TABLE and the next closing paren
    const tableStart = match.index;
    const tableEnd = content.indexOf(');', tableStart);
    if (tableEnd > 0) {
      const tableDef = content.slice(tableStart, tableEnd);
      if (!/\bid\s+uuid/i.test(tableDef)) {
        warns.push(`Line ${lineNum}: Table "${tableName}" — consider using "id uuid primary key default gen_random_uuid()"`);
      }
      if (!/\bcreated_at\b/i.test(tableDef)) {
        warns.push(`Line ${lineNum}: Table "${tableName}" missing "created_at" column`);
      }
      if (!SKIP_UPDATED_AT.includes(tableName) && !/\bupdated_at\b/i.test(tableDef)) {
        warns.push(`Line ${lineNum}: Table "${tableName}" missing "updated_at" column`);
      }
    }
  }

  // Check for dangerous write policies
  const policyRegex = /CREATE\s+POLICY\s+"([^"]+)".*?\bON\s+(?:public\.)?(\w+)\s+FOR\s+(INSERT|UPDATE|DELETE).*?USING\s*\(\s*true\s*\)/gis;
  while ((match = policyRegex.exec(content)) !== null) {
    const [, policyName, tableName, operation] = match;
    const lineNum = content.slice(0, match.index).split('\n').length;
    errors.push(`Line ${lineNum}: Policy "${policyName}" on "${tableName}" uses USING (true) for ${operation} — security hole, all rows writable by anyone`);
  }

  // Clear types-current sentinel (migration written = types stale)
  clear('typesCurrent');

  if (errors.length === 0 && warns.length === 0) process.exit(0);

  let feedback = '--- SQL Migration Review ---\n';
  if (errors.length > 0) {
    feedback += '\n🚫 ERRORS (must fix):\n' + errors.map(e => `  • ${e}`).join('\n');
  }
  if (warns.length > 0) {
    feedback += '\n⚠️ WARNINGS:\n' + warns.map(w => `  • ${w}`).join('\n');
  }

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
