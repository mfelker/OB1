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

function featureJsonDir(repoRoot) {
  return JSON.parse(readFileSync(join(repoRoot, '.specify', 'feature.json'), 'utf8')).feature_directory;
}

/** @returns {{repoRoot:string, featureDir:string, lane:string, tree:string, folder:string, folderExists:boolean}} */
export function resolveTarget({ repoRoot, env = process.env } = {}) {
  const featureDir = resolve(repoRoot, env.SPECIFY_FEATURE_DIRECTORY || featureJsonDir(repoRoot));
  return { repoRoot, featureDir };
}
