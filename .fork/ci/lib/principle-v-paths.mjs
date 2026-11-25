// I/O helpers for the Principle V guard (contracts/rule.md "Helpers").
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

function gitOut(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function repoRelative(path, cwd) {
  const given = resolve(cwd, path);
  const abs = join(realpathSync(dirname(given)), basename(given));
  const root = gitOut(dirname(abs), ['rev-parse', '--show-toplevel']);
  const relPath = relative(root, abs).split('\\').join('/');
  return { root, relPath };
}
