import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, writeFiles, commit, branch, checkout } from './helpers/git-fixture.mjs';
import { changedFiles, folderStatus, GitError, ZERO_SHA } from '../lib/changes.mjs';

function forkWithBranch() {
  const repo = makeRepo();
  writeFiles(repo, { 'recipes/a/index.ts': '1', 'recipes/b/index.ts': '1' });
  const base = commit(repo, 'base');
  branch(repo, 'feature');
  // fork main moves ahead after the branch point
  writeFiles(repo, { 'recipes/b/index.ts': '2' });
  const mainTip = commit(repo, 'main ahead');
  checkout(repo, 'feature');
  writeFiles(repo, { 'recipes/a/index.ts': '2' });
  const head = commit(repo, 'feature change');
  return { repo, base, mainTip, head };
}

test('PR mode diffs from the merge-base (main moving ahead does not leak in)', () => {
  const { repo, mainTip, head } = forkWithBranch();
  const files = changedFiles(repo.dir, { event: 'pull_request', base: mainTip, head });
  assert.deepEqual(files, ['recipes/a/index.ts']);
});

test('push mode diffs before..after', () => {
  const { repo, base, mainTip } = forkWithBranch();
  const files = changedFiles(repo.dir, { event: 'push', before: base, after: mainTip });
  assert.deepEqual(files, ['recipes/b/index.ts']);
});

test('push mode with an all-zero before falls back to after~1..after', () => {
  const { repo, mainTip } = forkWithBranch();
  const files = changedFiles(repo.dir, { event: 'push', before: ZERO_SHA, after: mainTip });
  assert.deepEqual(files, ['recipes/b/index.ts']);
});

test('push mode on a root commit lists all its files', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'server/index.ts': '1' });
  const root = commit(repo, 'root');
  assert.deepEqual(changedFiles(repo.dir, { event: 'push', before: ZERO_SHA, after: root }), ['server/index.ts']);
});

test('deleted files are reported and the folder status is removed', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'recipes/old/index.ts': '1', 'recipes/keep/index.ts': '1' });
  const before = commit(repo, 'base');
  writeFiles(repo, { 'recipes/old/index.ts': null });
  const after = commit(repo, 'delete old');
  assert.deepEqual(changedFiles(repo.dir, { event: 'push', before, after }), ['recipes/old/index.ts']);
  assert.equal(folderStatus(repo.dir, after, 'recipes/old'), 'removed');
  assert.equal(folderStatus(repo.dir, after, 'recipes/keep'), 'present');
});

test('an unknown sha raises GitError', () => {
  const { repo, head } = forkWithBranch();
  assert.throws(
    () => changedFiles(repo.dir, { event: 'pull_request', base: 'deadbeef'.repeat(5), head }),
    GitError,
  );
});
