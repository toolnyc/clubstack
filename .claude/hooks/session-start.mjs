import { check, set } from './sentinels.mjs';
import { readProgress } from './progress.mjs';
import { execSync } from 'child_process';

function formatProgress() {
  const p = readProgress();
  if (!p.currentFeature && p.completedFeatures.length === 0 && p.blockers.length === 0) return '';

  let out = '\n\n--- Build Progress ---';
  if (p.currentFeature) {
    out += `\nFeature: ${p.currentFeature}`;
    out += `\nStep: ${p.currentStep || 'unknown'}`;
  }
  if (p.completedFeatures.length > 0) {
    out += `\nCompleted: ${p.completedFeatures.join(', ')}`;
  }
  if (p.blockers.length > 0) {
    const latest = p.blockers[p.blockers.length - 1];
    out += `\nLatest blocker: ${latest.feature}/${latest.step} — ${latest.error}`;
  }
  if (p.lastCommit) {
    out += `\nLast WIP commit: ${p.lastCommit}`;
  }
  if (p.buildPlan) {
    out += `\nBuild plan: ${p.buildPlan}`;
  }
  return out;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { input = {}; }

  const event = input.session_event || input.event || '';
  const prev = check('sessionActive');

  let currentBranch = '';
  try {
    currentBranch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}

  const progressContext = formatProgress();

  // --- RESUME: session reconnected with full context ---
  if (event === 'resume' && prev.exists) {
    const age = prev.age || '?';
    const msg = `Session resumed (started ${prev.data?.timestamp || 'unknown'}, ${age}h ago, branch "${prev.data?.branch || 'unknown'}").
You have full conversation context. Before continuing:
• If the previous work is done, run /session-close to capture the report.
• Otherwise, continue where you left off.${progressContext}`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: msg
      }
    };
    process.stdout.write(JSON.stringify(output));
    // Don't reset sentinel — same session continues
    process.exit(0);
  }

  // --- COMPACT: context was compressed, details are fading ---
  if (event === 'compact' && prev.exists) {
    const msg = `Context was just compressed — conversation details have been summarized.
Save important decisions to memory NOW before more detail is lost:
• Key decisions or conventions from this session → save to memory files
• If the session is wrapping up, run /session-close while you still have context.${progressContext}`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: msg
      }
    };
    process.stdout.write(JSON.stringify(output));
    // Don't reset sentinel — same session continues
    process.exit(0);
  }

  // --- STARTUP or CLEAR: new or reset session ---
  if (prev.exists) {
    // Dirty exit — previous session didn't close cleanly
    const since = prev.data?.timestamp || '';
    let gitSummary = '';

    try {
      const sinceFlag = since ? `--since="${since}"` : '-5';
      const log = execSync(`git log --oneline ${sinceFlag} 2>/dev/null`, { encoding: 'utf8' }).trim();
      const diff = execSync('git diff HEAD --stat 2>/dev/null', { encoding: 'utf8' }).trim();
      if (log) gitSummary += `\nCommits since last session:\n${log}`;
      if (diff) gitSummary += `\nUncommitted changes:\n${diff}`;
      if (!log && !diff) gitSummary = '\nNo commits or uncommitted changes found.';
    } catch {
      gitSummary = '\nCould not read git history.';
    }

    const prevBranch = prev.data?.branch || 'unknown';
    const age = prev.age || '?';

    const warning = `⚠ Previous session did not close cleanly.
Started ${since || 'unknown time'} on branch "${prevBranch}" (${age}h ago).
${gitSummary}${progressContext}

→ Run /session-close now to write the missed report, or say "skip" to continue without one.`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: warning
      }
    };
    process.stdout.write(JSON.stringify(output));
  }

  // Set fresh sentinel for this new session
  set('sessionActive', { branch: currentBranch });
  process.exit(0);
});
