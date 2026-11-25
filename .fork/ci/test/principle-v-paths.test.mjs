import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeRepo, git, writeFiles, commit } from './helpers/git-fixture.mjs';
import { repoRelative } from '../lib/principle-v-paths.mjs';

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
