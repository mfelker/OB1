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
  const root = gitOut(statSync(real).isDirectory() ? real : dirname(real), ['rev-parse', '--show-toplevel']);
  const relPath = relative(root, abs).split('\\').join('/');
  return { root, relPath };
}
