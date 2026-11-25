// I/O helpers for the Principle V guard (contracts/rule.md "Helpers").
import { execFileSync } from 'node:child_process';
import { relative, resolve } from 'node:path';

function gitOut(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function repoRelative(path, cwd) {
  const root = gitOut(cwd, ['rev-parse', '--show-toplevel']);
  const relPath = relative(root, resolve(cwd, path)).split('\\').join('/');
  return { root, relPath };
}
