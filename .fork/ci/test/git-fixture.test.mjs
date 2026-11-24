import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  makeRepo, writeFiles, commit, branch, checkout, merge, addRemoteRef, git,
} from './helpers/git-fixture.mjs';

test('makeRepo creates an empty git repo with a main branch', () => {
  const repo = makeRepo();
  assert.ok(existsSync(join(repo.dir, '.git')));
  assert.equal(git(repo, ['symbolic-ref', '--short', 'HEAD']), 'main');
});

test('writeFiles writes nested files and null deletes them', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'a/b/c.txt': 'hello' });
  assert.equal(readFileSync(join(repo.dir, 'a/b/c.txt'), 'utf8'), 'hello');
  writeFiles(repo, { 'a/b/c.txt': null });
  assert.ok(!existsSync(join(repo.dir, 'a/b/c.txt')));
});

test('commit returns the new sha and supports committer override', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'x.txt': '1' });
  const sha = commit(repo, 'first', { committer: { name: 'GitHub', email: 'noreply@github.com' } });
  assert.match(sha, /^[0-9a-f]{40}$/);
  assert.equal(git(repo, ['log', '-1', '--format=%cn <%ce>']), 'GitHub <noreply@github.com>');
});

test('branch, checkout and no-ff merge produce a two-parent merge commit', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'x.txt': '1' });
  commit(repo, 'base');
  branch(repo, 'feature');
  checkout(repo, 'feature');
  writeFiles(repo, { 'y.txt': '2' });
  commit(repo, 'feature work');
  checkout(repo, 'main');
  const m = merge(repo, 'feature', { noFf: true, message: 'custom merge' });
  assert.equal(git(repo, ['rev-list', '--parents', '-n', '1', m]).split(' ').length, 3);
  assert.equal(git(repo, ['log', '-1', '--format=%s', m]), 'custom merge');
});

test('addRemoteRef creates refs/remotes/<name>', () => {
  const repo = makeRepo();
  writeFiles(repo, { 'x.txt': '1' });
  const sha = commit(repo, 'base');
  addRemoteRef(repo, 'upstream/main', sha);
  assert.equal(git(repo, ['rev-parse', 'refs/remotes/upstream/main']), sha);
});
