// Resolve the TDD adapter's target from the active feature's plan (data-model TddTarget; research R3).
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

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

/** Text after the first `:` of the line starting `**<field>**`, or undefined when there is no such line. */
function planField(planText, field) {
  const line = planText.split('\n').find(l => l.startsWith(`**${field}**`));
  if (line === undefined) return undefined;
  const i = line.indexOf(':');
  return (i < 0 ? '' : line.slice(i + 1)).replace(/\*\([^)]*\)\*/g, '').trim();
}

const LANES = [['staged', 'staged'], ['upstream-bound', 'upstream-bound'], ['fork', 'fork']];

function parseLane(value, planRel) {
  if (value === undefined) throw new TargetError(`plan has no Lane line (${planRel})`);
  if (value.includes('[')) throw new TargetError(`plan Lane is a placeholder (${planRel})`);
  const hit = LANES.find(([prefix]) => value.toLowerCase().startsWith(prefix));
  if (!hit) throw new TargetError(`unknown lane: ${value} (${planRel})`);
  return hit[1];
}

/** The worktree path from the Worktree value: `none…` is the repo root, else the first backticked token, which must be absolute. */
function parseTree(value, repoRoot, planRel, lane) {
  if (value === undefined) {
    if (lane === 'fork') return repoRoot;
    throw new TargetError(`plan Worktree required for ${lane} lane`);
  }
  if ((value ?? '').includes('[')) throw new TargetError(`plan Worktree is a placeholder (${planRel})`);
  if (/^none/i.test(value ?? '')) return repoRoot;
  const m = /`([^`]*)`/.exec(value ?? '');
  if (!m || !isAbsolute(m[1])) throw new TargetError('plan Worktree must be an absolute path or "none"');
  return workTree(m[1]);
}

/** The real path of `path` when it is the top of a git work tree, else a TargetError. */
function workTree(path) {
  try {
    const real = realpathSync(path);
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: real, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (realpathSync(top) === real) return real;
  } catch { /* missing, or not a work tree */ }
  throw new TargetError(`worktree not found: ${path}`);
}

/** @returns {{repoRoot:string, featureDir:string, lane:string, tree:string, folder:string, folderExists:boolean}} */
export function resolveTarget({ repoRoot, env = process.env } = {}) {
  const dir = env.SPECIFY_FEATURE_DIRECTORY || featureJsonDir(repoRoot);
  if (typeof dir !== 'string' || dir === '') throw new TargetError(NO_FEATURE);
  const featureDir = resolve(repoRoot, dir);
  const planRel = relative(repoRoot, join(featureDir, 'plan.md')).split(sep).join('/');
  let planText;
  try {
    planText = readFileSync(join(featureDir, 'plan.md'), 'utf8');
  } catch {
    throw new TargetError(`plan not found: ${planRel}`);
  }
  const lane = parseLane(planField(planText, 'Lane'), planRel);
  const tree = parseTree(planField(planText, 'Worktree'), repoRoot, planRel, lane);
  return { repoRoot, featureDir, lane, tree };
}
