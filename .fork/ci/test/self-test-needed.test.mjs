import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selfTestNeeded } from '../lib/self-test-needed.mjs';
import { makeRepo, writeFiles, commit } from './helpers/git-fixture.mjs';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'self-test-needed.mjs');

test('true when fork-ci code or its workflow changed', () => {
  assert.equal(selfTestNeeded(['.fork/ci/lib/paths.mjs']), true);
  assert.equal(selfTestNeeded(['README.md', '.github/workflows/fork-ci.yml']), true);
});

test('false for other paths, including other fork-only paths', () => {
  assert.equal(selfTestNeeded(['specs/001/spec.md', '.fork/README.md', 'recipes/a/index.ts']), false);
  assert.equal(selfTestNeeded(['.github/workflows/ob1-gate-v2.yml']), false);
  assert.equal(selfTestNeeded([]), false);
});

test('bin prints true/false for a push range', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'README.md': 'x' });
  const before = commit(repo, 'base');
  writeFiles(repo, { '.fork/ci/lib/x.mjs': 'export {}' });
  const after = commit(repo, 'touch fork-ci');
  const p = spawnSync(process.execPath, [BIN, '--event', 'push', '--before', before, '--after', after], { cwd: repo.dir, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  assert.equal(p.stdout.trim(), 'true');
});
