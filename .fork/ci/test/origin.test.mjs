import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { originOf } from '../lib/origin.mjs';
import { makeRepo, writeFiles, commit, branch, checkout, merge, addRemoteRef, git } from './helpers/git-fixture.mjs';

const UP = 'refs/remotes/upstream/main';
const DETECT = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'detect.mjs');

/**
 * Shared history:
 *   B  = upstream base (recipes/u, recipes/f)
 *   F  = fork-only commit on main (.fork/)
 *   U1 = upstream changes recipes/u
 */
function world() {
  const repo = makeRepo();
  writeFiles(repo, { 'recipes/u/index.ts': 'u1\n', 'recipes/f/index.ts': 'f1\n' });
  const B = commit(repo, 'upstream base');
  branch(repo, 'up', B);
  writeFiles(repo, { '.fork/README.md': 'fork\n' });
  commit(repo, 'fork-only');
  checkout(repo, 'up');
  writeFiles(repo, { 'recipes/u/index.ts': 'u2\n' });
  const U1 = commit(repo, 'upstream changes u');
  checkout(repo, 'main');
  return { repo, B, U1 };
}

const mergeRef = (repo, base, ref) => {
  checkout(repo, base);
  git(repo, ['checkout', '-q', '--detach']);
  return merge(repo, ref, { noFf: true, message: `merge ${ref}` });
};

test('(a) sync merged locally: upstream-only folder → upstream/advisory', () => {
  const { repo, U1 } = world();
  addRemoteRef(repo, 'upstream/main', U1);
  const M = merge(repo, 'up', { noFf: true, message: 'sync upstream' });
  assert.equal(originOf(repo.dir, M, UP, 'recipes/u'), 'upstream');
});

test('(b) sync via PR merge ref → upstream/advisory', () => {
  const { repo, U1 } = world();
  addRemoteRef(repo, 'upstream/main', U1);
  branch(repo, 'sync/upstream-x', U1);
  const R = mergeRef(repo, 'main', 'sync/upstream-x');
  assert.equal(originOf(repo.dir, R, UP, 'recipes/u'), 'upstream');
});

test('(c) contrib cut from a newer upstream: untouched upstream folder → upstream; owner folder → fork', () => {
  const { repo } = world();
  const M = merge(repo, 'up', { noFf: true, message: 'sync U1' });
  checkout(repo, 'up');
  writeFiles(repo, { 'recipes/u/index.ts': 'u3\n' });
  const U2 = commit(repo, 'upstream changes u again');
  addRemoteRef(repo, 'upstream/main', U2);
  branch(repo, 'contrib/mfelker/c', U2);
  checkout(repo, 'contrib/mfelker/c');
  writeFiles(repo, { 'recipes/c/index.ts': 'mine\n' });
  commit(repo, 'owner contribution');
  branch(repo, 'fork-main-at-M', M);
  const R = mergeRef(repo, 'fork-main-at-M', 'contrib/mfelker/c');
  assert.equal(originOf(repo.dir, R, UP, 'recipes/u'), 'upstream');
  assert.equal(originOf(repo.dir, R, UP, 'recipes/c'), 'fork');
});

test('(d) staged upstream PR: contributor folder → fork/strict', () => {
  const { repo, B, U1 } = world();
  merge(repo, 'up', { noFf: true, message: 'sync U1' });
  addRemoteRef(repo, 'upstream/main', U1);
  branch(repo, 'stage/pr-9-x', B);
  checkout(repo, 'stage/pr-9-x');
  writeFiles(repo, { 'recipes/f/index.ts': 'contributor\n' });
  commit(repo, 'contributor change', { author: { name: 'Contributor', email: 'c@example.test' } });
  const R = mergeRef(repo, 'main', 'stage/pr-9-x');
  assert.equal(originOf(repo.dir, R, UP, 'recipes/f'), 'fork');
});

test('(e) sync touching a folder the fork already modified → fork/strict', () => {
  const { repo, U1 } = world();
  writeFiles(repo, { 'recipes/u/extra.ts': 'fork addition\n' });
  commit(repo, 'fork modifies recipes/u');
  addRemoteRef(repo, 'upstream/main', U1);
  const M = merge(repo, 'up', { noFf: true, message: 'sync upstream' });
  assert.equal(originOf(repo.dir, M, UP, 'recipes/u'), 'fork');
});

test('missing upstream ref → fork (strict is the safe default)', () => {
  const { repo } = world();
  assert.equal(originOf(repo.dir, 'HEAD', 'refs/remotes/upstream/nope', 'recipes/u'), 'fork');
});

test('detect wires origin: upstream-only folder is advisory, fork folder strict', () => {
  const { repo, U1 } = world();
  addRemoteRef(repo, 'upstream/main', U1);
  const before = git(repo, ['rev-parse', 'HEAD']);
  merge(repo, 'up', { noFf: true, message: 'sync upstream' });
  writeFiles(repo, { 'recipes/f/index.ts': 'fork change\n' });
  const after = commit(repo, 'fork changes f');
  const p = spawnSync(process.execPath, [DETECT, '--event', 'push', '--before', before, '--after', after, '--upstream-ref', UP], { cwd: repo.dir, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  const byPath = Object.fromEntries(JSON.parse(p.stdout).matrix.include.map(e => [e.path, e]));
  assert.deepEqual(byPath['recipes/u'], { path: 'recipes/u', mode: 'advisory', origin: 'upstream', needsPostgres: false });
  assert.deepEqual(byPath['recipes/f'], { path: 'recipes/f', mode: 'strict', origin: 'fork', needsPostgres: false });
});
