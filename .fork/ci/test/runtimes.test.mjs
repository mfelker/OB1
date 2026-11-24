import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { scanRuntimes } from '../lib/runtimes.mjs';
import { setupFolder } from './helpers/folder.mjs';

const byKind = (rts, kind) => rts.filter(r => r.kind === kind);

test('deno runtime: deno.json root, code vs tests, sandboxed command without --allow-net', () => {
  const f = setupFolder('deno-tested');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'deno');
  assert.equal(rt.root, 'recipes/fx');
  assert.deepEqual(rt.codeFiles, ['index.ts']);
  assert.deepEqual(rt.testFiles, ['index_test.ts']);
  assert.deepEqual(rt.command, ['deno', 'test', '--node-modules-dir=none', '--no-prompt', '--allow-env', '--allow-read']);
  assert.ok(!rt.command.some(a => a.startsWith('--allow-net')));
});

test('node-script runtime: package.json with a test script', () => {
  const f = setupFolder('node-script');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'node-script');
  assert.deepEqual(rt.codeFiles, ['src/a.mjs']);
  assert.deepEqual(rt.testFiles, ['src/__tests__/a.test.mjs']);
  assert.deepEqual(rt.command, ['npm', 'test']);
});

test('node-plain runtime: test files run with node --test', () => {
  const f = setupFolder('node-plain');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'node-plain');
  assert.deepEqual(rt.codeFiles, ['lib/x.js']);
  assert.deepEqual(rt.testFiles, ['lib/__tests__/x.test.mjs']);
  assert.deepEqual(rt.command, ['node', '--test', 'lib/__tests__/x.test.mjs']);
});

test('python runtime: test_*.py run with pytest', () => {
  const f = setupFolder('python-tested');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'python');
  assert.deepEqual(rt.codeFiles, ['imp.py']);
  assert.deepEqual(rt.testFiles, ['tests/test_imp.py']);
  assert.deepEqual(rt.command, ['python', '-m', 'pytest', '-q']);
});

test('nested sub-project gets its own root', () => {
  const f = setupFolder('nested-plugin');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'node-script');
  assert.equal(rt.root, 'recipes/fx/plugin');
  assert.deepEqual(rt.testFiles, ['test/p.test.mjs']);
});

test('mixed deno + package.json folder splits TS to deno and JS to node-script', () => {
  const f = setupFolder('mixed-server', 'server');
  const rts = scanRuntimes(f.abs, f.path);
  assert.deepEqual(byKind(rts, 'deno')[0].codeFiles, ['index.ts']);
  assert.deepEqual(byKind(rts, 'deno')[0].testFiles, []);
  assert.deepEqual(byKind(rts, 'node-script')[0].testFiles, ['test-stateless.mjs']);
});

test('config files, .d.ts and node_modules are not code; .svelte is code; .spec counts as a test', () => {
  const f = setupFolder('node-plain');
  const extra = {
    'vite.config.ts': 'x', 'eslint.config.mjs': 'x', 'types.d.ts': 'x',
    'node_modules/dep/index.js': 'x', 'App.svelte': '<p/>', 'lib/__tests__/y.spec.js': 'x',
  };
  for (const [rel, c] of Object.entries(extra)) setupWrite(f.abs, rel, c);
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.deepEqual(rt.codeFiles, ['App.svelte', 'lib/x.js']);
  assert.deepEqual(rt.testFiles, ['lib/__tests__/x.test.mjs', 'lib/__tests__/y.spec.js']);
});

function setupWrite(dir, rel, content) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), content);
}

// ---- SQL (T048) ----

test('SQL: .sql without tests/verify.sql → sql runtime with no command', () => {
  const f = setupFolder('sql-only');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'sql');
  assert.deepEqual(rt.codeFiles, ['schema.sql']);
  assert.deepEqual(rt.testFiles, []);
  assert.equal(rt.command, null);
});

test('SQL: tests/verify.sql → psql command run in the folder', () => {
  const f = setupFolder('sql-verify');
  const [rt] = scanRuntimes(f.abs, f.path);
  assert.equal(rt.kind, 'sql');
  assert.equal(rt.root, 'recipes/fx');
  assert.deepEqual(rt.testFiles, ['tests/verify.sql']);
  assert.deepEqual(rt.command, ['psql', '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-f', 'tests/verify.sql']);
});
