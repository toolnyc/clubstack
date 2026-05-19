import * as fs from 'fs';
import * as path from 'path';

/**
 * Agent state type definitions
 */
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

const STATE_PATH = path.join(__dirname, '..', 'state.json');
const SCHEMA_PATH = path.join(__dirname, '..', 'state.schema.json');

/**
 * Default state when file doesn't exist
 */
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

/**
 * Validate state against schema
 * Throws error if invalid
 */
function validateState(state: unknown): asserts state is AgentState {
  if (typeof state !== 'object' || state === null) {
    throw new Error('State must be an object');
  }

  const s = state as Record<string, unknown>;

  // Check required top-level fields
  if (typeof s.version !== 'number' || s.version < 1) {
    throw new Error('State.version must be a number >= 1');
  }

  if (typeof s.last_updated !== 'string') {
    throw new Error('State.last_updated must be an ISO 8601 string');
  }

  if (s.current_feature !== null && typeof s.current_feature !== 'string') {
    throw new Error('State.current_feature must be a string or null');
  }

  if (s.feature_started_at !== null && typeof s.feature_started_at !== 'string') {
    throw new Error('State.feature_started_at must be an ISO 8601 string or null');
  }

  // Check state object
  if (typeof s.state !== 'object' || s.state === null) {
    throw new Error('State.state must be an object');
  }

  const stateObj = s.state as Record<string, unknown>;
  const requiredSentinels: SentinelName[] = [
    'epic_created',
    'feature_active',
    'types_current',
    'design_checked',
    'verify_passed',
    'session_active',
  ];

  for (const sentinel of requiredSentinels) {
    if (typeof stateObj[sentinel] !== 'boolean') {
      throw new Error(`State.state.${sentinel} must be a boolean`);
    }
  }

  // Check metadata object
  if (typeof s.metadata !== 'object' || s.metadata === null) {
    throw new Error('State.metadata must be an object');
  }

  const metadata = s.metadata as Record<string, unknown>;
  const metadataKeys = requiredSentinels.map((k) => `${k}_at`);

  for (const key of metadataKeys) {
    if (metadata[key] !== null && typeof metadata[key] !== 'string') {
      throw new Error(`State.metadata.${key} must be an ISO 8601 string or null`);
    }
  }
}

/**
 * Write state to disk atomically
 * Uses temp file + rename pattern for POSIX safety
 */
function writeState(state: AgentState): void {
  const tempPath = `${STATE_PATH}.tmp`;

  try {
    // Write to temp file
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));

    // Atomic rename (POSIX) - on Windows, remove target first
    if (process.platform === 'win32' && fs.existsSync(STATE_PATH)) {
      fs.unlinkSync(STATE_PATH);
    }

    fs.renameSync(tempPath, STATE_PATH);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Read current state from disk
 * Returns default state if file doesn't exist
 */
export function readState(): AgentState {
  if (!fs.existsSync(STATE_PATH)) {
    return { ...DEFAULT_STATE };
  }

  try {
    const content = fs.readFileSync(STATE_PATH, 'utf-8');
    const state = JSON.parse(content);
    validateState(state);
    return state;
  } catch (error) {
    throw new Error(
      `Failed to read/parse state file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Set a sentinel to true with current timestamp
 * Optionally set current_feature and feature_started_at
 */
export function setSentinel(name: SentinelName, feature?: string): void {
  const state = readState();

  // Update sentinel
  state.state[name] = true;

  // Update metadata timestamp
  const metadataKey = `${name}_at` as const;
  state.metadata[metadataKey] = new Date().toISOString();

  // Update feature info if provided
  if (feature) {
    state.current_feature = feature;
    state.feature_started_at = new Date().toISOString();
  }

  // Update last_updated
  state.last_updated = new Date().toISOString();

  writeState(state);
}

/**
 * Clear a sentinel (set to false, clear timestamp)
 */
export function clearSentinel(name: SentinelName): void {
  const state = readState();

  // Clear sentinel
  state.state[name] = false;

  // Clear metadata timestamp
  const metadataKey = `${name}_at` as const;
  state.metadata[metadataKey] = null;

  // Update last_updated
  state.last_updated = new Date().toISOString();

  writeState(state);
}

/**
 * Clear all sentinels (set to false, clear all timestamps)
 */
export function clearAllSentinels(): void {
  const state = readState();

  // Clear all sentinels
  state.state.epic_created = false;
  state.state.feature_active = false;
  state.state.types_current = false;
  state.state.design_checked = false;
  state.state.verify_passed = false;
  state.state.session_active = false;

  // Clear all metadata timestamps
  state.metadata.epic_created_at = null;
  state.metadata.feature_active_at = null;
  state.metadata.types_current_at = null;
  state.metadata.design_checked_at = null;
  state.metadata.verify_passed_at = null;
  state.metadata.session_active_at = null;

  // Clear feature info
  state.current_feature = null;
  state.feature_started_at = null;

  // Update last_updated
  state.last_updated = new Date().toISOString();

  writeState(state);
}

/**
 * Check if a sentinel is set (true)
 */
export function isSentinelSet(name: SentinelName): boolean {
  const state = readState();
  return state.state[name];
}

/**
 * Get sentinel timestamp (when it was last set to true)
 * Returns null if never set or currently false
 */
export function getSentinelTimestamp(name: SentinelName): string | null {
  const state = readState();
  const metadataKey = `${name}_at` as const;
  return state.metadata[metadataKey];
}
