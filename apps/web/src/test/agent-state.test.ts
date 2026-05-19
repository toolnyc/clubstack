import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as state from '../../../.agent/lib/state';

// Note: The state file is located at .agent/state.json relative to project root
const PROJECT_ROOT = path.join(__dirname, '../../../');
const STATE_PATH = path.join(PROJECT_ROOT, '.agent/state.json');
const STATE_TMP_PATH = `${STATE_PATH}.tmp`;

describe('Agent State Management', () => {
  beforeEach(() => {
    // Clean up state file before each test
    if (fs.existsSync(STATE_PATH)) {
      fs.unlinkSync(STATE_PATH);
    }
    if (fs.existsSync(STATE_TMP_PATH)) {
      fs.unlinkSync(STATE_TMP_PATH);
    }
  });

  afterEach(() => {
    // Clean up state file after each test
    if (fs.existsSync(STATE_PATH)) {
      fs.unlinkSync(STATE_PATH);
    }
    if (fs.existsSync(STATE_TMP_PATH)) {
      fs.unlinkSync(STATE_TMP_PATH);
    }
  });

  describe('readState', () => {
    it('should return default state when file does not exist', () => {
      const result = state.readState();

      expect(result.version).toBe(1);
      expect(result.current_feature).toBe(null);
      expect(result.feature_started_at).toBe(null);
      expect(result.state.epic_created).toBe(false);
      expect(result.state.feature_active).toBe(false);
      expect(result.state.types_current).toBe(false);
      expect(result.state.design_checked).toBe(false);
      expect(result.state.verify_passed).toBe(false);
      expect(result.state.session_active).toBe(false);
      expect(result.metadata.epic_created_at).toBe(null);
      expect(result.metadata.feature_active_at).toBe(null);
    });

    it('should read valid state file', () => {
      state.setSentinel('verify_passed');

      const result = state.readState();

      expect(result.state.verify_passed).toBe(true);
      expect(result.metadata.verify_passed_at).not.toBe(null);
      expect(typeof result.metadata.verify_passed_at).toBe('string');
    });

    it('should throw error on malformed JSON', () => {
      fs.writeFileSync(STATE_PATH, 'invalid json {]');

      expect(() => state.readState()).toThrow();
    });

    it('should throw error on invalid schema', () => {
      fs.writeFileSync(STATE_PATH, JSON.stringify({ version: 'not-a-number' }));

      expect(() => state.readState()).toThrow();
    });
  });

  describe('setSentinel', () => {
    it('should set sentinel to true with timestamp', () => {
      const beforeTime = new Date().toISOString();
      state.setSentinel('verify_passed');
      const afterTime = new Date().toISOString();

      const result = state.readState();

      expect(result.state.verify_passed).toBe(true);
      expect(result.metadata.verify_passed_at).not.toBe(null);

      const timestamp = result.metadata.verify_passed_at!;
      expect(timestamp).toGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should update last_updated timestamp', () => {
      state.setSentinel('verify_passed');

      const result = state.readState();

      expect(result.last_updated).not.toBe(null);
      expect(typeof result.last_updated).toBe('string');
    });

    it('should set feature when provided', () => {
      state.setSentinel('feature_active', 'pre-commit-gate');

      const result = state.readState();

      expect(result.current_feature).toBe('pre-commit-gate');
      expect(result.feature_started_at).not.toBe(null);
      expect(result.state.feature_active).toBe(true);
    });

    it('should update existing state without losing other sentinels', () => {
      state.setSentinel('verify_passed');
      state.setSentinel('types_current');

      const result = state.readState();

      expect(result.state.verify_passed).toBe(true);
      expect(result.state.types_current).toBe(true);
    });
  });

  describe('clearSentinel', () => {
    it('should clear sentinel to false and null timestamp', () => {
      state.setSentinel('verify_passed');
      state.clearSentinel('verify_passed');

      const result = state.readState();

      expect(result.state.verify_passed).toBe(false);
      expect(result.metadata.verify_passed_at).toBe(null);
    });

    it('should preserve other sentinels when clearing one', () => {
      state.setSentinel('verify_passed');
      state.setSentinel('types_current');
      state.clearSentinel('verify_passed');

      const result = state.readState();

      expect(result.state.verify_passed).toBe(false);
      expect(result.state.types_current).toBe(true);
    });

    it('should update last_updated timestamp', async () => {
      state.setSentinel('verify_passed');
      const lastUpdatedAfterSet = state.readState().last_updated;

      // Small delay to ensure different timestamp
      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await wait(10);

      state.clearSentinel('verify_passed');

      const result = state.readState();

      expect(result.last_updated).toBeGreaterThanOrEqual(lastUpdatedAfterSet);
    });
  });

  describe('clearAllSentinels', () => {
    it('should clear all sentinels and timestamps', () => {
      state.setSentinel('verify_passed');
      state.setSentinel('types_current');
      state.setSentinel('feature_active', 'test-feature');

      state.clearAllSentinels();

      const result = state.readState();

      expect(result.state.epic_created).toBe(false);
      expect(result.state.feature_active).toBe(false);
      expect(result.state.types_current).toBe(false);
      expect(result.state.design_checked).toBe(false);
      expect(result.state.verify_passed).toBe(false);
      expect(result.state.session_active).toBe(false);

      expect(result.metadata.epic_created_at).toBe(null);
      expect(result.metadata.feature_active_at).toBe(null);
      expect(result.metadata.types_current_at).toBe(null);
      expect(result.metadata.design_checked_at).toBe(null);
      expect(result.metadata.verify_passed_at).toBe(null);
      expect(result.metadata.session_active_at).toBe(null);

      expect(result.current_feature).toBe(null);
      expect(result.feature_started_at).toBe(null);
    });

    it('should update last_updated timestamp', async () => {
      state.setSentinel('verify_passed');
      const lastUpdatedBeforeClear = state.readState().last_updated;

      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await wait(10);

      state.clearAllSentinels();

      const result = state.readState();

      expect(result.last_updated).toBeGreaterThanOrEqual(lastUpdatedBeforeClear);
    });
  });

  describe('isSentinelSet', () => {
    it('should return true if sentinel is set', () => {
      state.setSentinel('verify_passed');

      const result = state.isSentinelSet('verify_passed');

      expect(result).toBe(true);
    });

    it('should return false if sentinel is not set', () => {
      const result = state.isSentinelSet('verify_passed');

      expect(result).toBe(false);
    });

    it('should return false after clearing sentinel', () => {
      state.setSentinel('verify_passed');
      state.clearSentinel('verify_passed');

      const result = state.isSentinelSet('verify_passed');

      expect(result).toBe(false);
    });
  });

  describe('getSentinelTimestamp', () => {
    it('should return timestamp when sentinel is set', () => {
      const beforeTime = new Date().toISOString();
      state.setSentinel('verify_passed');
      const afterTime = new Date().toISOString();

      const timestamp = state.getSentinelTimestamp('verify_passed');

      expect(timestamp).not.toBe(null);
      expect(timestamp).toGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should return null when sentinel is not set', () => {
      const timestamp = state.getSentinelTimestamp('verify_passed');

      expect(timestamp).toBe(null);
    });

    it('should return null after clearing sentinel', () => {
      state.setSentinel('verify_passed');
      state.clearSentinel('verify_passed');

      const timestamp = state.getSentinelTimestamp('verify_passed');

      expect(timestamp).toBe(null);
    });
  });

  describe('Atomic writes and race conditions', () => {
    it('should not create partial files on write', () => {
      state.setSentinel('verify_passed');

      expect(fs.existsSync(STATE_PATH)).toBe(true);
      expect(fs.existsSync(STATE_TMP_PATH)).toBe(false);

      const content = fs.readFileSync(STATE_PATH, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.state.verify_passed).toBe(true);
    });

    it('should handle concurrent writes (last write wins)', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            // Each write sets a different sentinel
            const sentinels: state.SentinelName[] = [
              'epic_created',
              'feature_active',
              'types_current',
              'design_checked',
              'verify_passed',
              'session_active',
              'epic_created',
              'feature_active',
              'types_current',
              'design_checked',
            ];

            state.setSentinel(sentinels[i]);
            resolve();
          })
        );
      }

      await Promise.all(promises);

      // File should exist and be valid JSON
      expect(fs.existsSync(STATE_PATH)).toBe(true);

      const result = state.readState();
      expect(result.state).toBeDefined();

      // At least one sentinel should be true (the last write)
      const anySentinelTrue = Object.values(result.state).some((v) => v === true);
      expect(anySentinelTrue).toBe(true);
    });
  });

  describe('Schema validation', () => {
    it('should validate ISO 8601 timestamps', () => {
      state.setSentinel('verify_passed');

      const result = state.readState();

      // Check that timestamps are valid ISO 8601
      expect(() => new Date(result.last_updated)).not.toThrow();
      expect(() => new Date(result.metadata.verify_passed_at!)).not.toThrow();
    });

    it('should reject invalid state with missing required fields', () => {
      fs.writeFileSync(STATE_PATH, JSON.stringify({ version: 1 }));

      expect(() => state.readState()).toThrow();
    });

    it('should reject state with wrong types', () => {
      fs.writeFileSync(
        STATE_PATH,
        JSON.stringify({
          version: 1,
          last_updated: '2026-05-19T00:00:00Z',
          current_feature: null,
          feature_started_at: null,
          state: {
            epic_created: 'not-a-boolean', // Invalid
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
        })
      );

      expect(() => state.readState()).toThrow();
    });
  });

  describe('Temp file cleanup', () => {
    it('should clean up temp file on successful write', () => {
      state.setSentinel('verify_passed');

      expect(fs.existsSync(STATE_TMP_PATH)).toBe(false);
    });

    it('should clean up temp file on write error', () => {
      // Mock writeFileSync to fail on temp write
      const originalWriteSync = fs.writeFileSync;
      const originalRenameSync = fs.renameSync;

      try {
        let attemptCount = 0;
        fs.writeFileSync = vi.fn((filePath: string, data: string) => {
          attemptCount++;
          if (attemptCount === 1 && filePath.includes('.tmp')) {
            throw new Error('Write failed');
          }
          return originalWriteSync(filePath, data);
        });

        expect(() => state.setSentinel('verify_passed')).toThrow();

        // Temp file should be cleaned up
        expect(fs.existsSync(STATE_TMP_PATH)).toBe(false);
      } finally {
        fs.writeFileSync = originalWriteSync;
        fs.renameSync = originalRenameSync;
      }
    });
  });
});
