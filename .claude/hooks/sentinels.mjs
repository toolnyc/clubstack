import { existsSync, statSync, writeFileSync, unlinkSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const STATE_DIR = '.claude/state';

const FILES = {
  epicCreated:    join(STATE_DIR, 'epic-created'),
  featureActive:  join(STATE_DIR, 'feature-active'),
  typesCurrent:   join(STATE_DIR, 'types-current'),
  designChecked:  join(STATE_DIR, 'design-checked'),
  verifyPassed:   join(STATE_DIR, 'verify-passed'),
  sessionActive:  join(STATE_DIR, 'session-active'),
};

export function check(name, { maxAgeHours = null } = {}) {
  const path = FILES[name];
  if (!path) return { exists: false, error: `Unknown sentinel: ${name}` };
  if (!existsSync(path)) return { exists: false };
  const stats = statSync(path);
  const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
  let data = {};
  try { data = JSON.parse(readFileSync(path, 'utf8')); } catch {}
  if (maxAgeHours !== null && ageHours > maxAgeHours) {
    return { exists: true, stale: true, age: Math.round(ageHours), data };
  }
  return { exists: true, stale: false, age: Math.round(ageHours), data };
}

export function set(name, context = {}) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  const path = FILES[name];
  if (!path) throw new Error(`Unknown sentinel: ${name}`);
  writeFileSync(path, JSON.stringify({ timestamp: new Date().toISOString(), ...context }, null, 2));
}

export function clear(name) {
  const path = FILES[name];
  if (path && existsSync(path)) unlinkSync(path);
}

export function clearAll() {
  Object.values(FILES).forEach(p => { try { if (existsSync(p)) unlinkSync(p); } catch {} });
}
