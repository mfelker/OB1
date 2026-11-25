#!/usr/bin/env node
// TDD adapter: run the active feature's tests in its plan's worktree and folder (contracts/tdd-adapter-cli.md).
import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTarget } from '../lib/tdd-target.mjs';
import { scanRuntimes } from '../lib/runtimes.mjs';

const REPO_ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));

function where() {
  const target = resolveTarget({ repoRoot: REPO_ROOT, env: process.env });
  const runtimes = target.folderExists
    ? scanRuntimes(join(target.tree, target.folder), target.folder).map(({ kind, root, testFiles }) => ({ kind, root, testFiles }))
    : [];
  process.stdout.write(`${JSON.stringify({ ...target, runtimes })}\n`);
  return 0;
}

const [op] = process.argv.slice(2);
if (op === 'where') process.exitCode = where();
