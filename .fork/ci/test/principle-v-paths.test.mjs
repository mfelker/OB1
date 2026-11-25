import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeRepo, git, writeFiles, commit, branch, checkout } from './helpers/git-fixture.mjs';
import { repoRelative, checkoutState, GuardError } from '../lib/principle-v-paths.mjs';

function tempRepo(files = { 'docs/a.md': '1' }) {
  const repo = makeRepo();
  repo.dir = realpathSync(repo.dir);
  writeFiles(repo, files);
  commit(repo, 'base');
  return repo;
}

test('U12 repoRelative: relative, absolute and .. forms agree', () => {
  const repo = tempRepo();
  const forms = ['docs/a.md', join(repo.dir, 'docs/a.md'), 'docs/../docs/a.md'];
  for (const form of forms) {
    assert.equal(repoRelative(form, repo.dir).relPath, 'docs/a.md', form);
  }
});

test('U13 repoRelative: root is the git top-level of the path\'s own checkout', () => {
  const repo = tempRepo();
  const wt = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-ci-wt-'))), 'wt');
  git(repo, ['worktree', 'add', '-q', '-b', 'other', wt]);
  const got = repoRelative(join(wt, 'docs/a.md'), repo.dir);
  assert.deepEqual(got, { root: wt, relPath: 'docs/a.md' });
});

test('U14 repoRelative: a path through a symlinked directory matches the real path', () => {
  const repo = tempRepo();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'fork-ci-ln-')));
  symlinkSync(join(repo.dir, 'docs'), join(outside, 'viaLink'));
  symlinkSync(join(repo.dir, 'docs'), join(repo.dir, 'inRepoLink'));
  const real = repoRelative(join(repo.dir, 'docs/a.md'), repo.dir);
  assert.deepEqual(repoRelative(join(outside, 'viaLink/a.md'), repo.dir), real);
  assert.deepEqual(repoRelative('inRepoLink/a.md', repo.dir), real);
});

test('U15 repoRelative: a file not yet created resolves through its nearest existing ancestor', () => {
  const repo = tempRepo();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'fork-ci-ln-')));
  symlinkSync(join(repo.dir, 'docs'), join(outside, 'viaLink'));
  assert.deepEqual(repoRelative('docs/new/deeper/x.md', repo.dir), { root: repo.dir, relPath: 'docs/new/deeper/x.md' });
  assert.deepEqual(repoRelative(join(outside, 'viaLink/new/x.md'), repo.dir), { root: repo.dir, relPath: 'docs/new/x.md' });
});

test('U16 repoRelative: outside every checkout, or the root itself, gives relPath null', () => {
  const repo = tempRepo();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'fork-ci-out-')));
  assert.equal(repoRelative(join(outside, 'x.md'), repo.dir).relPath, null);
  assert.equal(repoRelative(join(outside, 'missing/dir/x.md'), repo.dir).relPath, null);
  assert.equal(repoRelative(repo.dir, outside).relPath, null);
  assert.equal(repoRelative('.', repo.dir).relPath, null);
});

test('U17 checkoutState: branch is the branch name, or HEAD when detached', () => {
  const repo = tempRepo();
  assert.equal(checkoutState(repo.dir).branch, 'main');
  git(repo, ['checkout', '-q', '-b', 'contrib/x']);
  assert.equal(checkoutState(repo.dir).branch, 'contrib/x');
  git(repo, ['checkout', '-q', '--detach']);
  assert.equal(checkoutState(repo.dir).branch, 'HEAD');
});

test('U18 checkoutState: mergeInProgress is true while MERGE_HEAD exists', () => {
  const repo = tempRepo();
  branch(repo, 'side');
  writeFiles(repo, { 'c.md': 'main' });
  commit(repo, 'main moves');
  checkout(repo, 'side');
  writeFiles(repo, { 'b.md': 'side' });
  commit(repo, 'side moves');
  checkout(repo, 'main');
  assert.equal(checkoutState(repo.dir).mergeInProgress, false);
  git(repo, ['merge', '--no-commit', '--no-ff', 'side']);
  assert.equal(checkoutState(repo.dir).mergeInProgress, true);
  commit(repo, 'merge done');
  assert.equal(checkoutState(repo.dir).mergeInProgress, false);
});

test('U19 checkoutState: throws GuardError for a directory that is not a git work tree', () => {
  const plain = realpathSync(mkdtempSync(join(tmpdir(), 'fork-ci-plain-')));
  assert.throws(() => checkoutState(plain), (err) => err instanceof GuardError && err.name === 'GuardError' && err.message.length > 0);
  assert.throws(() => checkoutState(join(plain, 'missing')), GuardError);
  const repo = tempRepo();
  assert.throws(() => checkoutState(join(repo.dir, '.git')), GuardError);
});
