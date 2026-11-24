import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, writeFiles, commit, addRemoteRef } from './helpers/git-fixture.mjs';
import { fixtureFiles } from './fixtures.mjs';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'detect.mjs');

function detect(repo, args) {
  const p = spawnSync(process.execPath, [BIN, ...args, '--upstream-ref', 'refs/remotes/upstream/main'], { cwd: repo.dir, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  return JSON.parse(p.stdout);
}

function baseRepo() {
  const repo = makeRepo();
  writeFiles(repo, { 'README.md': 'root\n' });
  const base = commit(repo, 'base');
  addRemoteRef(repo, 'upstream/main', base);
  return { repo, base };
}

test('stdout follows the contract shape', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, fixtureFiles('node-plain', 'recipes/a'));
  const after = commit(repo, 'add a');
  const d = detect(repo, ['--event', 'push', '--before', base, '--after', after]);
  assert.deepEqual(Object.keys(d).sort(), ['has_folders', 'has_sql', 'matrix', 'removed', 'skipped', 'sql_matrix']);
  assert.equal(d.has_folders, true);
  assert.deepEqual(d.matrix.include, [{ path: 'recipes/a', mode: 'strict', origin: 'fork', needsPostgres: false }]);
  assert.equal(d.has_sql, false);
  assert.deepEqual(d.sql_matrix, { include: [] });
});

test('two changed folders → two matrix entries; removed folders listed separately', () => {
  const { repo } = baseRepo();
  writeFiles(repo, { ...fixtureFiles('node-plain', 'recipes/a'), ...fixtureFiles('deno-tested', 'integrations/b'), ...fixtureFiles('docs-only', 'skills/old') });
  const before = commit(repo, 'three folders');
  writeFiles(repo, { 'recipes/a/lib/x.js': 'module.exports = 2;\n', 'integrations/b/index.ts': 'export const y = 2;\n' });
  writeFiles(repo, Object.fromEntries(Object.keys(fixtureFiles('docs-only', 'skills/old')).map(k => [k, null])));
  const after = commit(repo, 'change two, remove one');
  const d = detect(repo, ['--event', 'push', '--before', before, '--after', after]);
  assert.deepEqual(d.matrix.include.map(e => e.path), ['integrations/b', 'recipes/a']);
  assert.deepEqual(d.removed, ['skills/old']);
});

test('PR mode works against base and head shas', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, fixtureFiles('node-plain', 'recipes/a'));
  const head = commit(repo, 'pr change');
  const d = detect(repo, ['--event', 'pull_request', '--base', base, '--head', head]);
  assert.deepEqual(d.matrix.include.map(e => e.path), ['recipes/a']);
});

// ---- US3 (T032) ----

test('US3: only fork-only paths → no folders, skipped counted', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, { 'specs/001/spec.md': 'x', '.fork/README.md': 'x', '.github/workflows/fork-ci.yml': 'x' });
  const after = commit(repo, 'fork-only');
  const d = detect(repo, ['--event', 'push', '--before', base, '--after', after]);
  assert.equal(d.has_folders, false);
  assert.deepEqual(d.matrix.include, []);
  assert.equal(d.skipped.forkOnly, 3);
});

test('US3: fork-only paths plus one folder → exactly that folder', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, { 'specs/001/spec.md': 'x', ...fixtureFiles('node-plain', 'recipes/a') });
  const after = commit(repo, 'mixed');
  const d = detect(repo, ['--event', 'push', '--before', base, '--after', after]);
  assert.deepEqual(d.matrix.include.map(e => e.path), ['recipes/a']);
  assert.equal(d.skipped.forkOnly, 1);
});

// ---- SQL (T048) ----

test('SQL: a folder with tests/verify.sql is routed to sql_matrix with needsPostgres', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, { ...fixtureFiles('sql-verify', 'schemas/v'), ...fixtureFiles('sql-only', 'schemas/o'), ...fixtureFiles('node-plain', 'recipes/a') });
  const after = commit(repo, 'sql folders');
  const d = detect(repo, ['--event', 'push', '--before', base, '--after', after]);
  assert.equal(d.has_sql, true);
  assert.deepEqual(d.sql_matrix.include, [{ path: 'schemas/v', mode: 'strict', origin: 'fork', needsPostgres: true }]);
  assert.deepEqual(d.matrix.include.map(e => e.path), ['recipes/a', 'schemas/o']);
  assert.equal(d.has_folders, true);
});

test('SQL: only a verify-script folder changed → has_folders false, has_sql true', () => {
  const { repo, base } = baseRepo();
  writeFiles(repo, fixtureFiles('sql-verify', 'schemas/v'));
  const after = commit(repo, 'sql only');
  const d = detect(repo, ['--event', 'push', '--before', base, '--after', after]);
  assert.equal(d.has_folders, false);
  assert.equal(d.has_sql, true);
});
