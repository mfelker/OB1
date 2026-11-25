// Resolve the TDD adapter's target from the active feature's plan (data-model TddTarget; research R3).
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** A target-resolution error with a single-line message; the CLI exits 2. */
export class TargetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TargetError';
  }
}

const NO_FEATURE = 'no active feature (set SPECIFY_FEATURE_DIRECTORY or .specify/feature.json)';

/** `feature_directory` from `.specify/feature.json`, or undefined when absent or unreadable. */
function featureJsonDir(repoRoot) {
  try {
    return JSON.parse(readFileSync(join(repoRoot, '.specify', 'feature.json'), 'utf8')).feature_directory;
  } catch {
    return undefined;
  }
}

/** @returns {{repoRoot:string, featureDir:string, lane:string, tree:string, folder:string, folderExists:boolean}} */
export function resolveTarget({ repoRoot, env = process.env } = {}) {
  const dir = env.SPECIFY_FEATURE_DIRECTORY || featureJsonDir(repoRoot);
  if (typeof dir !== 'string' || dir === '') throw new TargetError(NO_FEATURE);
  const featureDir = resolve(repoRoot, dir);
  return { repoRoot, featureDir };
}
