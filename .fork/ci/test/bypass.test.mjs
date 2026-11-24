import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBypasses } from '../lib/bypass.mjs';
import { computeVerdict } from '../lib/verdict.mjs';
import { makeRepo, writeFiles, commit, branch, checkout, merge, addRemoteRef, git } from './helpers/git-fixture.mjs';

const UP = 'refs/remotes/upstream/main';
const GITHUB = { name: 'GitHub', email: 'noreply@github.com' };

/** Upstream base B; fork main adds a fork-only commit; returns the main tip before any merge. */
function world() {
  const repo = makeRepo();
  writeFiles(repo, { 'recipes/a/index.ts': '1\n' });
  const B = commit(repo, 'upstream base');
  addRemoteRef(repo, 'upstream/main', B);
  writeFiles(repo, { '.fork/README.md': 'fork\n' });
  const before = commit(repo, 'fork-only');
  return { repo, B, before };
}

/** A branch cut from `from` with one commit; returns to main. */
function sideBranch(repo, name, from, file) {
  branch(repo, name, from);
  checkout(repo, name);
  writeFiles(repo, { [file]: `${name}\n` });
  commit(repo, `work on ${name}`);
  checkout(repo, 'main');
}

const range = (repo, before) => `${before}..${git(repo, ['rev-parse', 'HEAD'])}`;

test('flags a local merge of an upstream-based branch (default message) with its branch name', () => {
  const { repo, B, before } = world();
  sideBranch(repo, 'stage/pr-12-x', B, 'recipes/a/fix.ts');
  const m = merge(repo, 'stage/pr-12-x', { noFf: true });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), [{ sha: m, branch: 'stage/pr-12-x' }]);
});

test('flags a local merge with a custom message; branch is unknown', () => {
  const { repo, B, before } = world();
  sideBranch(repo, 'contrib/mfelker/y', B, 'recipes/y/index.ts');
  const m = merge(repo, 'contrib/mfelker/y', { noFf: true, message: '[fork] Stage upstream PR #12 (y)' });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), [{ sha: m, branch: 'unknown' }]);
});

test('does not flag a PR merge committed by GitHub', () => {
  const { repo, B, before } = world();
  sideBranch(repo, 'stage/pr-13-z', B, 'recipes/a/z.ts');
  merge(repo, 'stage/pr-13-z', { noFf: true, message: 'Merge pull request #13 from mfelker/stage/pr-13-z', committer: GITHUB });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), []);
});

test('does not flag an upstream sync merge (second parent on the upstream ref)', () => {
  const { repo, B, before } = world();
  branch(repo, 'up', B);
  checkout(repo, 'up');
  writeFiles(repo, { 'recipes/a/index.ts': '2\n' });
  const U1 = commit(repo, 'upstream moves');
  addRemoteRef(repo, 'upstream/main', U1);
  checkout(repo, 'main');
  merge(repo, 'up', { noFf: true, message: 'sync upstream' });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), []);
});

test('does not flag a local merge of a fork/ branch cut from fork main', () => {
  const { repo, before } = world();
  sideBranch(repo, 'fork/feature', 'main', '.fork/feature.md');
  merge(repo, 'fork/feature', { noFf: true });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), []);
});

test('ignores non-merge commits', () => {
  const { repo, before } = world();
  writeFiles(repo, { 'recipes/a/index.ts': 'direct\n' });
  commit(repo, 'direct commit');
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), UP), []);
});

test('an all-zero before checks only the pushed tip', () => {
  const { repo, B } = world();
  sideBranch(repo, 'stage/pr-14-w', B, 'recipes/a/w.ts');
  const m = merge(repo, 'stage/pr-14-w', { noFf: true });
  assert.deepEqual(findBypasses(repo.dir, `${'0'.repeat(40)}..${m}`, UP), [{ sha: m, branch: 'stage/pr-14-w' }]);
});

test('a missing upstream ref yields no findings (cannot classify)', () => {
  const { repo, B, before } = world();
  sideBranch(repo, 'stage/pr-15-v', B, 'recipes/a/v.ts');
  merge(repo, 'stage/pr-15-v', { noFf: true });
  assert.deepEqual(findBypasses(repo.dir, range(repo, before), 'refs/remotes/upstream/none'), []);
});

test('verdict fails when bypasses are present and lists them', () => {
  const detect = { has_folders: false, matrix: { include: [] }, has_sql: false, sql_matrix: { include: [] }, removed: [], skipped: { forkOnly: 0, template: 0, other: 0 } };
  const jobs = { detect: 'success', test: 'skipped', testSql: 'skipped', selfTest: 'skipped' };
  const v = computeVerdict({ detect, results: [], jobs, bypasses: [{ sha: 'abc', branch: 'stage/pr-1-x' }] });
  assert.equal(v.conclusion, 'failure');
  assert.deepEqual(v.bypasses, [{ sha: 'abc', branch: 'stage/pr-1-x' }]);
});
