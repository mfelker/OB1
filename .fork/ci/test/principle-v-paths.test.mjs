import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { makeRepo, writeFiles, commit } from './helpers/git-fixture.mjs';
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
