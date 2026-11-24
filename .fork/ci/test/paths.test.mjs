import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyPath, mapPaths, CATEGORIES } from '../lib/paths.mjs';

test('CATEGORIES lists the seven upstream contribution categories', () => {
  assert.deepEqual([...CATEGORIES].sort(), [
    'dashboards', 'extensions', 'integrations', 'primitives', 'recipes', 'schemas', 'skills',
  ]);
});

test('maps a file in each category to <category>/<name>', () => {
  for (const cat of CATEGORIES) {
    assert.deepEqual(classifyPath(`${cat}/thing/deep/file.ts`), {
      kind: 'folder', folder: `${cat}/thing`, category: cat,
    });
  }
});

test('maps server/ files to the server folder', () => {
  assert.deepEqual(classifyPath('server/index.ts'), { kind: 'folder', folder: 'server', category: 'server' });
});

test('fork-only paths are skipped as forkOnly', () => {
  for (const p of [
    '.specify/memory/constitution.md',
    'specs/001-fork-ci/spec.md',
    '.fork/ci/lib/paths.mjs',
    '.claude/skills/speckit-plan/SKILL.md',
    '.github/workflows/fork-ci.yml',
  ]) {
    assert.equal(classifyPath(p).kind, 'forkOnly', p);
  }
});

test('_template folders are skipped as template', () => {
  assert.equal(classifyPath('recipes/_template/README.md').kind, 'template');
});

test('everything else is other', () => {
  for (const p of [
    'docs/01-getting-started.md', '.github/workflows/ob1-gate-v2.yml', 'README.md',
    'recipes/README.md', '.claude/settings.json',
  ]) {
    assert.equal(classifyPath(p).kind, 'other', p);
  }
});

test('mapPaths groups changed files per folder and counts skips', () => {
  const result = mapPaths([
    'recipes/a/index.ts', 'recipes/a/README.md', 'server/index.ts',
    'specs/x.md', '.fork/README.md', 'schemas/_template/x.sql', 'docs/y.md',
  ]);
  assert.deepEqual(result.folders, [
    { path: 'recipes/a', category: 'recipes', changedFiles: ['recipes/a/README.md', 'recipes/a/index.ts'] },
    { path: 'server', category: 'server', changedFiles: ['server/index.ts'] },
  ]);
  assert.deepEqual(result.skipped, { forkOnly: 2, template: 1, other: 1 });
});
