import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { STATE_DIR } from './sentinels.mjs';

const PROGRESS_FILE = join(STATE_DIR, 'progress.json');

const EMPTY = {
  buildPlan: null,
  currentFeature: null,
  currentStep: null,
  currentEpicIndex: 0,
  completedFeatures: [],
  blockers: [],
  lastCommit: null,
};

export function readProgress() {
  if (!existsSync(PROGRESS_FILE)) return { ...EMPTY };
  try {
    return { ...EMPTY, ...JSON.parse(readFileSync(PROGRESS_FILE, 'utf8')) };
  } catch {
    return { ...EMPTY };
  }
}

export function writeProgress(data) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  const current = readProgress();
  const merged = { ...current, ...data };
  writeFileSync(PROGRESS_FILE, JSON.stringify(merged, null, 2));
}

export function updateStep(step) {
  writeProgress({ currentStep: step });
}

export function addBlocker(feature, step, error) {
  const current = readProgress();
  current.blockers.push({
    feature,
    step,
    error,
    timestamp: new Date().toISOString(),
  });
  writeProgress({ blockers: current.blockers });
}

export function completeFeature(slug) {
  const current = readProgress();
  const completed = current.completedFeatures.includes(slug)
    ? current.completedFeatures
    : [...current.completedFeatures, slug];
  writeProgress({
    currentFeature: null,
    currentStep: null,
    completedFeatures: completed,
  });
}

export function clearProgress() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(EMPTY, null, 2));
}
