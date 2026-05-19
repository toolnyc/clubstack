# Feature Spec: Pre-Commit Verification Gate & State Migration

## Overview

Two infrastructure improvements to prevent commits that fail verification and consolidate agent state into a single, structured, CI-enforceable JSON file.

---

## Change 1: Pre-Commit Verification Gate

### Problem Statement

Currently, `simple-git-hooks` only runs Prettier formatting via `lint-staged`. Developers can commit code that fails linting, tests, or builds. CI catches these failures later, wasting time and causing churn.

**Goal**: Block commits at the point of creation if verification fails.

**Constraint**: Only verify changed files in `apps/web/src/` to keep pre-commit fast. Full verification happens in CI.

### Solution Overview

Extend the existing `simple-git-hooks` configuration to run verification steps on staged files before allowing commit.

**Verification sequence**:
1. Prettier (already exists) — formats staged files
2. ESLint — lints staged TypeScript files
3. Type check — runs `tsc --noEmit` on the entire web app
4. Unit tests — runs tests related to staged files
5. Build check — verifies the app builds successfully

**Performance optimization**: Run steps in parallel where possible (lint + typecheck). Skip build if no `apps/web/src/` files changed.

### Technical Design

#### File Structure

```
.
├── .simple-git-hooks.json         (new - replaces package.json config)
├── scripts/
│   └── pre-commit.sh              (new - verification orchestrator)
└── package.json                   (update - move git hooks config out)
```

#### `.simple-git-hooks.json`

```json
{
  "pre-commit": "sh scripts/pre-commit.sh"
}
```

**Rationale**: Separate config file makes the hook script path explicit and keeps `package.json` cleaner.

#### `scripts/pre-commit.sh`

```bash
#!/usr/bin/env bash
set -e

# Pre-commit verification gate for apps/web/src/
# Blocks commits that fail lint, typecheck, test, or build

echo "🔍 Running pre-commit verification..."

# Get list of staged files in apps/web/src/
STAGED_WEB_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '^apps/web/src/' || true)

if [ -z "$STAGED_WEB_FILES" ]; then
  echo "✅ No files in apps/web/src/ staged — skipping verification"
  exit 0
fi

echo "📝 Staged files:"
echo "$STAGED_WEB_FILES"
echo ""

# 1. Prettier (already runs via lint-staged)
echo "✨ Formatting (handled by lint-staged)..."

# 2. Lint + Typecheck (parallel)
echo "🔍 Linting and type-checking..."
pnpm --filter web lint &
LINT_PID=$!

wait $LINT_PID || {
  echo "❌ Lint or type check failed"
  exit 1
}

# 3. Unit tests (affected tests only)
echo "🧪 Running tests..."
pnpm --filter web test || {
  echo "❌ Tests failed"
  exit 1
}

# 4. Build check (full build to catch integration issues)
echo "🏗️  Verifying build..."
pnpm --filter web build || {
  echo "❌ Build failed"
  exit 1
}

echo "✅ All verifications passed"
```

**Permissions**: Make executable via `chmod +x scripts/pre-commit.sh` during setup.

#### `package.json` updates

**Remove**:
```json
"simple-git-hooks": {
  "pre-commit": "pnpm lint-staged"
},
```

**Keep** (lint-staged still runs for formatting):
```json
"lint-staged": {
  "*.{ts,tsx}": ["prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

**Add to scripts**:
```json
"hooks:install": "simple-git-hooks"
```

### Implementation Steps

1. **Create `.simple-git-hooks.json`**
   - Define `pre-commit` hook pointing to `scripts/pre-commit.sh`

2. **Create `scripts/pre-commit.sh`**
   - Implement verification logic as specified above
   - Make executable: `chmod +x scripts/pre-commit.sh`

3. **Update `package.json`**
   - Move `simple-git-hooks` config to `.simple-git-hooks.json`
   - Add `hooks:install` script

4. **Test the hook**
   ```bash
   # Reinstall hooks
   pnpm hooks:install
   
   # Create a failing commit
   echo "const x: number = 'string'" > apps/web/src/test-fail.ts
   git add apps/web/src/test-fail.ts
   git commit -m "test: should fail typecheck"
   # Expected: Hook blocks commit with type error
   
   # Clean up
   git restore --staged apps/web/src/test-fail.ts
   rm apps/web/src/test-fail.ts
   ```

5. **Update documentation**
   - Add "Pre-commit verification" section to `AGENTS.md` under "Git Conventions"
   - Document how to bypass hook in emergencies: `git commit --no-verify`

### Testing Approach

| Scenario | Expected Outcome |
|----------|------------------|
| Stage file with ESLint error | Commit blocked, shows lint error |
| Stage file with TypeScript error | Commit blocked, shows type error |
| Stage file that breaks a test | Commit blocked, shows test failure |
| Stage file that breaks build | Commit blocked, shows build error |
| Stage file outside `apps/web/src/` | Hook passes immediately |
| Stage valid file in `apps/web/src/` | Commit succeeds after verification |
| Run `git commit --no-verify` | Bypasses hook (emergency escape hatch) |

**Performance test**: Time the hook with 5, 10, 20 staged files. Target: <30s for 10 files.

### Rollout Plan

1. **Dev environment setup**
   - Run `pnpm hooks:install` in existing clones
   - Add to README: "After pulling, run `pnpm hooks:install` if hooks were updated"

2. **CI enforcement** (optional future enhancement)
   - Add CI check that verifies `.simple-git-hooks.json` exists
   - Ensures all developers have hooks installed

3. **Escape hatch**
   - Document `--no-verify` flag for emergencies (e.g., hotfix commits)
   - Log a warning when used

### Edge Cases

- **Merge commits**: Hook runs on merge commits with conflicts. If verification fails, abort merge and fix conflicts.
- **Rebase**: Hook runs for each rebased commit. May be slow for large rebases — document `--no-verify` for interactive rebases.
- **Empty commits**: Hook exits early if no `apps/web/src/` files staged.
- **Partial staging**: Hook only verifies staged hunks, but typecheck and build run on the full codebase. This may catch errors in unstaged code. This is **intentional** — the working tree must be valid.
- **Build artifacts**: `.next/` is gitignored, so build artifacts don't pollute the working tree.

### Known Limitations

1. **Performance**: Full build on every commit may be slow (~10-30s). Acceptable for solo dev, may need optimization for team scale (e.g., skip build if only tests changed).

2. **False positives**: Type errors in unstaged files block commits. Mitigation: Ensure working tree is clean before committing.

3. **No file watch cache**: Each commit runs from scratch. Future: Use turbo or nx to cache verification results.

---

## Change 2: Introduce `.agent/state.json` for Structured State Management

### Problem Statement

Currently, there is no standardized way to track agent state. As workflows evolve and multiple droids coordinate work, we need a **single source of truth** for workflow state.

**Issues**:
1. **No state tracking**: No way to know which feature is active, when it started, or what verification has passed.
2. **Manual coordination**: Droids and scripts have no standard way to communicate state.
3. **No CI enforcement**: Can't gate deployments on verification status.
4. **Agent-agnostic location**: Need a neutral `.agent/` space, not tool-specific directories.

**Goal**: Create a structured, atomic, CI-enforceable state file at `.agent/state.json` to track feature lifecycle and verification status.

### Solution Overview

Create a new `.agent/state.json` file with:
- All sentinel booleans grouped in a `state` object
- Timestamps for each state change
- Atomic write via temp file + rename
- JSON Schema validation
- TypeScript API module for safe, type-checked access

### Technical Design

#### File Structure

```
.agent/
├── state.json              (new - unified state file)
├── state.schema.json       (new - JSON schema for validation)
└── skills/                 (existing - preserved)
```

#### `.agent/state.json` Schema

```json
{
  "$schema": "./.agent/state.schema.json",
  "version": 1,
  "last_updated": "2026-05-19T14:32:00Z",
  "current_feature": null,
  "feature_started_at": null,
  "state": {
    "epic_created": false,
    "feature_active": false,
    "types_current": true,
    "design_checked": false,
    "verify_passed": false,
    "session_active": true
  },
  "metadata": {
    "epic_created_at": null,
    "feature_active_at": null,
    "types_current_at": "2026-05-19T12:00:00Z",
    "design_checked_at": null,
    "verify_passed_at": null,
    "session_active_at": "2026-05-19T10:15:00Z"
  }
}
```

**Field definitions**:

| Field | Type | Description |
|-------|------|-------------|
| `version` | integer | Schema version. Start at 1. Increment for breaking changes. |
| `last_updated` | ISO 8601 string | Timestamp of last write. Updated on every state change. |
| `current_feature` | string \| null | Name of active feature (e.g., "pre-commit-gate"). Null if no feature active. |
| `feature_started_at` | ISO 8601 string \| null | When `feature_active` was set. Null if no feature active. |
| `state.*` | boolean | Sentinel flags. Legacy names preserved (snake_case). |
| `metadata.*_at` | ISO 8601 string \| null | When each sentinel was last set to `true`. Null if never set or currently `false`. |

**Rationale for schema design**:
- **Top-level `state` object**: Groups all boolean flags together. Easy to scan.
- **Separate `metadata` object**: Timestamps don't clutter the primary state flags.
- **`current_feature` at top level**: Most frequently accessed field. Quick grep target.
- **ISO 8601 timestamps**: Sortable, human-readable, timezone-aware.
- **Version field**: Enables future schema migrations without breaking parsers.

#### `.agent/state.schema.json` (JSON Schema Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "last_updated", "state", "metadata"],
  "properties": {
    "version": {
      "type": "integer",
      "minimum": 1
    },
    "last_updated": {
      "type": "string",
      "format": "date-time"
    },
    "current_feature": {
      "type": ["string", "null"]
    },
    "feature_started_at": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "state": {
      "type": "object",
      "required": [
        "epic_created",
        "feature_active",
        "types_current",
        "design_checked",
        "verify_passed",
        "session_active"
      ],
      "properties": {
        "epic_created": { "type": "boolean" },
        "feature_active": { "type": "boolean" },
        "types_current": { "type": "boolean" },
        "design_checked": { "type": "boolean" },
        "verify_passed": { "type": "boolean" },
        "session_active": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "metadata": {
      "type": "object",
      "required": [
        "epic_created_at",
        "feature_active_at",
        "types_current_at",
        "design_checked_at",
        "verify_passed_at",
        "session_active_at"
      ],
      "properties": {
        "epic_created_at": { "type": ["string", "null"], "format": "date-time" },
        "feature_active_at": { "type": ["string", "null"], "format": "date-time" },
        "types_current_at": { "type": ["string", "null"], "format": "date-time" },
        "design_checked_at": { "type": ["string", "null"], "format": "date-time" },
        "verify_passed_at": { "type": ["string", "null"], "format": "date-time" },
        "session_active_at": { "type": ["string", "null"], "format": "date-time" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

#### API: `.agent/lib/state.ts` (Node.js module)

**TypeScript interface**:

```typescript
export interface AgentState {
  version: 1;
  last_updated: string; // ISO 8601
  current_feature: string | null;
  feature_started_at: string | null;
  state: {
    epic_created: boolean;
    feature_active: boolean;
    types_current: boolean;
    design_checked: boolean;
    verify_passed: boolean;
    session_active: boolean;
  };
  metadata: {
    epic_created_at: string | null;
    feature_active_at: string | null;
    types_current_at: string | null;
    design_checked_at: string | null;
    verify_passed_at: string | null;
    session_active_at: string | null;
  };
}

export type SentinelName = keyof AgentState['state'];
```

**Functions**:

```typescript
// Read current state (returns default state if file doesn't exist)
export function readState(): AgentState;

// Set a sentinel to true with timestamp
export function setSentinel(name: SentinelName, feature?: string): void;

// Clear a sentinel (set to false, clear timestamp)
export function clearSentinel(name: SentinelName): void;

// Clear all sentinels
export function clearAllSentinels(): void;

// Check if a sentinel is set
export function isSentinelSet(name: SentinelName): boolean;

// Get sentinel timestamp
export function getSentinelTimestamp(name: SentinelName): string | null;

// Validate state against schema (throws on invalid)
function validateState(state: unknown): asserts state is AgentState;
```

**Implementation details**:

1. **Atomic writes**:
   ```typescript
   function writeState(state: AgentState): void {
     const tempPath = `${STATE_PATH}.tmp`;
     fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));
     fs.renameSync(tempPath, STATE_PATH); // Atomic on POSIX
   }
   ```

2. **Error handling**:
   - If `.agent/state.json` is missing, return default state (all false, no feature)
   - If `.agent/state.json` is malformed, throw error with helpful message
   - If schema validation fails, throw error with JSON path to invalid field

3. **No migration needed**:
   - `.claude/state/` has been deleted (as of 2026-05-19)
   - Start fresh with `.agent/state.json`
   - If file doesn't exist, API creates it with default state on first write
   - If file is deleted, API regenerates it with default state on next read

4. **Default state**:
   ```typescript
   const DEFAULT_STATE: AgentState = {
     version: 1,
     last_updated: new Date().toISOString(),
     current_feature: null,
     feature_started_at: null,
     state: {
       epic_created: false,
       feature_active: false,
       types_current: false,
       design_checked: false,
       verify_passed: false,
       session_active: false,
     },
     metadata: {
       epic_created_at: null,
       feature_active_at: null,
       types_current_at: null,
       design_checked_at: null,
       verify_passed_at: null,
       session_active_at: null,
     },
   };
   ```

#### `.gitignore` updates

**Add**:
```
# Agent state (machine-local, ephemeral)
.agent/state.json
.agent/state.json.tmp
```

**Rationale**: State is machine-local and should never be committed. Temp files from atomic writes must also be ignored. The `.gitignore` entry ensures CI environments always start with default (clean) state.

### Implementation Steps

1. **Create `.agent/state.schema.json`**
   - Copy JSON Schema Draft 7 schema from the Technical Design section above
   - Validate with `npx ajv-cli` before committing

2. **Create `.agent/lib/state.ts`**
   - Implement the 6 exported functions as specified (readState, setSentinel, clearSentinel, clearAllSentinels, isSentinelSet, getSentinelTimestamp)
   - Implement atomic writes using temp file + rename pattern
   - Implement default state generation
   - Add error handling for malformed files

3. **Add unit tests** (`apps/web/src/test/agent-state.test.ts`)
   - Test reading default state (file doesn't exist)
   - Test setting and clearing sentinels
   - Test atomic writes (temp file cleanup, no corruption)
   - Test schema validation (invalid JSON, missing fields)
   - Test concurrent writes (10 parallel operations)
   - Test timestamp accuracy

4. **Update `.gitignore`**
   - Add `.agent/state.json` and `.agent/state.json.tmp` to ignore ephemeral state

5. **Update documentation** in `AGENTS.md`
   - Add "Agent State Management" section
   - Document the state schema, API functions, and usage examples
   - Note that state file is ephemeral and auto-regenerated on first use

6. **Test in real workflows**
   - Use state API in droid invocations to set `feature_active` sentinel
   - Verify state persists across commands
   - Confirm state can be read and validated in CI

### Testing Approach

| Test Case | Expected Outcome |
|-----------|------------------|
| Read state (file doesn't exist) | Returns default state |
| Set sentinel `verify_passed` | State file written with `verify_passed: true` + timestamp |
| Clear sentinel `verify_passed` | State file updated with `verify_passed: false`, timestamp nulled |
| Set sentinel with feature name | `current_feature` and `feature_started_at` updated |
| Clear all sentinels | All flags false, all timestamps null |
| Write malformed JSON to state file | Next read throws validation error |
| Concurrent writes (race condition) | Atomic rename ensures no corruption |
| Migrate from `.claude/state/` | All legacy sentinels + timestamps preserved |

**Concurrency test**:
```bash
# Spawn 10 concurrent writes
for i in {1..10}; do
  node -e "require('./.agent/lib/state.ts').setSentinel('session_active')" &
done
wait

# Verify state.json is valid JSON and has session_active: true
node -e "console.assert(require('./.agent/state.json').state.session_active)"
```

### Rollout Plan

1. **Phase 1: Create foundation**
   - Add `.agent/state.schema.json` with full JSON Schema validation
   - Add `.agent/lib/state.ts` with all 6 API functions and atomic writes
   - Add unit tests to verify behavior
   - Commit to `develop` branch

2. **Phase 2: Integrate with droids**
   - Update droid invocation helpers to use state API (set `feature_active` on start)
   - Verify state API can be called from bash scripts in pre-commit hooks
   - Test end-to-end with a real feature workflow

3. **Phase 3: CI enforcement**
   - Add GitHub Actions check that validates schema (if file exists)
   - Add pre-deploy check: `verify_passed === true`
   - Document CI usage in `AGENTS.md`

### Edge Cases

- **Corrupt state file**: If JSON parse fails, throw error with helpful message. User can delete file to reset to defaults on next use.
- **Schema version mismatch**: If `state.version > 1`, throw error: "State file is from a newer version. Update your tooling."
- **Missing `.agent/` directory**: Create automatically on first write.
- **Read during write**: Atomic rename (temp file → target) ensures reads always see a complete, valid state file. Never a partial write.
- **CI environment**: State file doesn't exist in CI (not committed, not shared). CI scripts must handle missing file gracefully (API returns default state).
- **File deleted**: If `.agent/state.json` is deleted between operations, next read/write auto-generates with defaults.
- **Multiple concurrent processes**: Atomic writes prevent corruption. Last write wins (acceptable for solo dev with short-lived commands).

### CI Integration (Future Enhancement)

Add to `.github/workflows/ci.yml`:

```yaml
- name: Validate agent state
  run: |
    if [ -f .agent/state.json ]; then
      npx ajv-cli validate -s .agent/state.schema.json -d .agent/state.json
    fi
```

This ensures committed state files (if ever committed accidentally) are valid.

---

## Implementation Notes

### Technology Choices

1. **`simple-git-hooks` over Husky**: Already in use. Simpler, no install step, works with pnpm.

2. **Bash script for pre-commit**: Portable, easy to debug, doesn't require Node.js runtime.

3. **Node.js/TypeScript for state API**: Matches codebase stack. Easy to import from existing scripts.

4. **JSON Schema Draft 7**: Widely supported, can validate in CI with `ajv-cli`.

5. **Atomic writes via temp + rename**: POSIX standard. No external dependencies.

### Assumptions

1. **Solo developer**: No multi-user concurrency concerns. Atomic writes (temp file + rename) are sufficient.

2. **Git hooks are opt-in**: Developers must run `pnpm hooks:install` after clone to activate pre-commit gate. Not auto-installed.

3. **State file is ephemeral**: Never committed to repo. Safe to delete anytime. Auto-regenerates on next API call.

4. **CI never relies on state file**: CI environments run clean with no `.agent/state.json`. Scripts handle missing state gracefully (return defaults).

5. **State directory exists**: `.agent/` directory is already committed (contains scripts, skills, schemas). State file is added to `.gitignore`.

### Potential Gotchas

1. **Pre-commit performance**: Full build on every commit may be slow (~10-30s). Acceptable for solo dev. Monitor with `time git commit`. Consider skipping build in future if only docs or tests changed.

2. **State file atomicity on Windows**: `fs.renameSync()` is **not atomic** on Windows if target exists. Add `fs.unlinkSync(STATE_PATH)` before rename on Windows. Detect with `process.platform === 'win32'`.

3. **JSON formatting**: Use 2-space indent to match codebase style. Optionally add `*.json` to Prettier config if not already there.

4. **Schema evolution**: If sentinel names change in the future, bump `version` field and add migration logic in `readState()` to handle old vs. new schemas.

5. **CI temp files**: Ensure `.agent/state.json.tmp` is in `.gitignore` so failed writes don't pollute the repo.

---

## Success Criteria

### Change 1: Pre-Commit Verification Gate

- [ ] Hook blocks commits with lint errors
- [ ] Hook blocks commits with type errors
- [ ] Hook blocks commits with test failures
- [ ] Hook blocks commits with build errors
- [ ] Hook passes for valid commits in <30s
- [ ] Hook skips verification if no `apps/web/src/` files staged
- [ ] `git commit --no-verify` bypasses hook
- [ ] Documentation updated in `AGENTS.md`

### Change 2: State Management with `.agent/state.json`

- [ ] `.agent/state.schema.json` created and validates successfully
- [ ] `.agent/lib/state.ts` implemented with 6 API functions
- [ ] All sentinel operations (set, clear, read, check) work correctly
- [ ] State file generated with valid JSON on first write
- [ ] State file survives 10 concurrent writes without corruption
- [ ] Schema validation throws helpful error on malformed JSON
- [ ] Documentation added to `AGENTS.md` with usage examples
- [ ] Unit tests pass with >95% coverage of state API

---

## Appendix: Example Usage

### Pre-commit Hook

```bash
# Normal workflow
git add apps/web/src/components/booking-card.tsx
git commit -m "feat: add booking card component"
# → Hook runs lint, typecheck, test, build
# → If all pass, commit succeeds

# Emergency bypass
git commit -m "hotfix: critical bug" --no-verify
# → Hook skipped, commit succeeds immediately
```

### State API

```typescript
import { setSentinel, isSentinelSet, readState } from './.agent/lib/state';

// Start a feature
setSentinel('feature_active', 'pre-commit-gate');

// Check if verify passed
if (isSentinelSet('verify_passed')) {
  console.log('✅ Verification passed');
}

// Read full state
const state = readState();
console.log(`Current feature: ${state.current_feature}`);
console.log(`Last updated: ${state.last_updated}`);

// Clear all sentinels (end of session)
clearAllSentinels();
```

### CI State Validation

```bash
# Validate schema (if state file exists)
npx ajv-cli validate -s .agent/state.schema.json -d .agent/state.json

# Check if verify passed before deploy
if [ "$(node -p "require('./.agent/state.json').state.verify_passed")" = "true" ]; then
  echo "✅ Verified, deploying..."
else
  echo "❌ Verification not passed, blocking deploy"
  exit 1
fi
```
