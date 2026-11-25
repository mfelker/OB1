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
  const real = realpathSync(existing);
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

export function checkoutState(root) {
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
