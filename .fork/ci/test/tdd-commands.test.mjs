import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildCommand, resolveFile, runtimeFor } from '../lib/tdd-commands.mjs';
import { fixtureFiles } from './fixtures.mjs';
import { TargetError } from '../lib/tdd-target.mjs';

/** A fresh real temp dir populated from an in-memory { relPath: content } map. */
function tempTree(prefix, files = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

/** Assert `fn` throws a TargetError with exactly this message. */
function throwsTarget(fn, message) {
  assert.throws(fn, err => {
    assert.ok(err instanceof TargetError, `expected TargetError, got ${err?.name}: ${err?.message}`);
    assert.equal(err.message, message);
    return true;
  });
}

const T = 'export {};\n';

test('U12 file resolution: folder, then tree, then repo root; the inside-tree check runs after every resolution', () => {
  const repoRoot = tempTree('fork-tdd-repo-', { 'c.test.mjs': T, 'b.test.mjs': T, 'recipes/x/a.test.mjs': T });
  const tree = tempTree('fork-tdd-tree-', { 'recipes/x/a.test.mjs': T, 'a.test.mjs': T, 'b.test.mjs': T });
  const outside = tempTree('fork-tdd-out-', { 'o.test.mjs': T });
  symlinkSync(join(outside, 'o.test.mjs'), join(tree, 'recipes/x/link.test.mjs'));
  const target = { repoRoot, tree, folder: 'recipes/x' };

  assert.equal(resolveFile('a.test.mjs', target), join(tree, 'recipes/x/a.test.mjs'));
  assert.equal(resolveFile('b.test.mjs', target), join(tree, 'b.test.mjs'));
  assert.equal(resolveFile('recipes/x/a.test.mjs', target), join(tree, 'recipes/x/a.test.mjs'));
  assert.equal(resolveFile(join(tree, 'b.test.mjs'), target), join(tree, 'b.test.mjs'));
  throwsTarget(() => resolveFile('c.test.mjs', target), `c.test.mjs is outside the target tree ${tree}`);
  throwsTarget(() => resolveFile(join(outside, 'o.test.mjs'), target), `${join(outside, 'o.test.mjs')} is outside the target tree ${tree}`);
  const up = join('..', '..', '..', outside.split('/').at(-1), 'o.test.mjs');
  throwsTarget(() => resolveFile(up, target), `${up} is outside the target tree ${tree}`);
  throwsTarget(() => resolveFile('link.test.mjs', target), `link.test.mjs is outside the target tree ${tree}`);
  throwsTarget(() => resolveFile('missing.test.mjs', target), 'file not found: missing.test.mjs');
});

test('U13 a file no runtime owns is rejected, naming the patterns', () => {
  const tree = tempTree('fork-tdd-tree-', { ...fixtureFiles('node-plain', 'recipes/x'), 'recipes/x/tests/test_y.py': 'def test_y():\n    pass\n', 'README.md': '# r\n' });
  const target = { repoRoot: tree, tree, folder: 'recipes/x' };
  const owned = runtimeFor(join(tree, 'recipes/x/lib/__tests__/x.test.mjs'), target);
  assert.equal(owned.kind, 'node-plain');
  assert.equal(owned.root, 'recipes/x');
  assert.equal(runtimeFor(join(tree, 'recipes/x/tests/test_y.py'), target).kind, 'python');
  for (const rel of ['recipes/x/lib/x.js', 'README.md']) {
    assert.throws(() => runtimeFor(join(tree, rel), target), err => {
      assert.ok(err instanceof TargetError, `expected TargetError, got ${err?.name}: ${err?.message}`);
      assert.ok(err.message.startsWith(`${rel} is not a test file of any runtime in recipes/x (patterns: `), err.message);
      for (const needle of ['_test|\\.test|\\.spec', '^test_[^/]*\\.py$', 'tests/verify.sql']) assert.ok(err.message.includes(needle), `${needle} in ${err.message}`);
      assert.ok(!err.message.includes('\n'));
      return true;
    });
  }
});

const NODE_TEST = "import { test } from 'node:test';\ntest('ok', () => {});\n";

test('U14 node-test single/file argv (isolation none, spec reporter, anchored escaped name as one element) and cwd = tree + root', () => {
  const tree = tempTree('fork-tdd-tree-', { 'recipes/x/lib/__tests__/x.test.mjs': NODE_TEST, 'recipes/x/lib/x.js': 'module.exports = 1;\n' });
  const target = { repoRoot: tree, tree, folder: 'recipes/x' };
  const file = join(tree, 'recipes/x/lib/__tests__/x.test.mjs');
  const runtime = runtimeFor(file, target);
  const name = 'a.b (c) [d] {1} $x^ | * + ? \\ end';
  const single = buildCommand({ op: 'single', runtime, tree, file, name });
  assert.equal(single.op, 'single');
  assert.equal(single.kind, 'node-test');
  assert.equal(single.unsupported, null);
  assert.equal(single.cwd, join(tree, 'recipes/x'));
  assert.deepEqual(single.argv, [process.execPath, '--test', '--test-isolation=none', '--test-reporter=spec',
    '--test-name-pattern=^a\\.b \\(c\\) \\[d\\] \\{1\\} \\$x\\^ \\| \\* \\+ \\? \\\\ end$', 'lib/__tests__/x.test.mjs']);
  assert.ok(new RegExp(single.argv[4].slice('--test-name-pattern='.length)).test(name));
  const whole = buildCommand({ op: 'file', runtime, tree, file });
  assert.equal(whole.op, 'file');
  assert.equal(whole.kind, 'node-test');
  assert.equal(whole.cwd, join(tree, 'recipes/x'));
  assert.deepEqual(whole.argv, [process.execPath, '--test', '--test-isolation=none', '--test-reporter=spec', 'lib/__tests__/x.test.mjs']);
});
