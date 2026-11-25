// I/O helpers for the Principle V guard (contracts/rule.md "Helpers").
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

function gitOut(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function repoRelative(path, cwd) {
  // Resolve through the nearest existing ancestor, then append the rest.
  let existing = resolve(cwd, path);
  const tail = [];
  while (!existsSync(existing)) {
    tail.unshift(basename(existing));
    existing = dirname(existing);
  }
  const real = realpathSync.native(existing);
  const abs = join(real, ...tail);
  let root;
  try {
    root = gitOut(statSync(real).isDirectory() ? real : dirname(real), ['rev-parse', '--show-toplevel']);
  } catch {
    return { root: null, relPath: null };
  }
  const rel = relative(root, abs).split('\\').join('/');
  return { root, relPath: rel === '' ? null : rel };
}

export class GuardError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardError';
  }
}

export function checkoutState(root) {
  let insideWorkTree = false;
  try {
    insideWorkTree = gitOut(root, ['rev-parse', '--is-inside-work-tree']) === 'true';
  } catch {
    // fall through to the error below
  }
  if (!insideWorkTree) throw new GuardError(`not a git work tree: ${root}`);
  let branch;
  try {
    branch = gitOut(root, ['symbolic-ref', '--short', '-q', 'HEAD']);
  } catch {
    branch = 'HEAD'; // detached
  }
  let mergeInProgress = true;
  try {
    gitOut(root, ['rev-parse', '-q', '--verify', 'MERGE_HEAD']);
  } catch {
    mergeInProgress = false;
  }
  return { branch, mergeInProgress };
}

export function upstreamPaths(root) {
  // Not trimmed: -z output is NUL-separated and names may carry spaces.
  let out;
  try {
    out = execFileSync('git', ['-C', root, 'ls-tree', '-r', '-z', '--name-only', 'upstream/main'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null; // ref missing or git failed: the rule fails closed (D7)
  }
  const files = new Set(out.split('\0').filter(Boolean));
  const dirs = new Set();
  for (const file of files) {
    for (let dir = dirname(file); dir !== '.'; dir = dirname(dir)) dirs.add(dir);
  }
  return { files, dirs };
}
