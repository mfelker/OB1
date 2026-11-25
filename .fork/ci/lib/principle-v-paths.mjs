// I/O helpers for the Principle V guard (contracts/rule.md "Helpers").
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';

function gitOut(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function repoRelative(path, cwd) {
  const abs = resolve(cwd, path);
  const root = gitOut(dirname(abs), ['rev-parse', '--show-toplevel']);
  const relPath = relative(root, abs).split('\\').join('/');
  return { root, relPath };
}
