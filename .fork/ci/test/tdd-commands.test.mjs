import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('U15 node count parser: tests 0 is zero-match; unparseable output gives null', () => {
  const tree = tempTree('fork-tdd-tree-', { 'recipes/x/a.test.mjs': NODE_TEST });
  const file = join(tree, 'recipes/x/a.test.mjs');
  const runtime = runtimeFor(file, { repoRoot: tree, tree, folder: 'recipes/x' });
  const { countParser } = buildCommand({ op: 'single', runtime, tree, file, name: 'ok' });
  const summary = (t, p, f) => `✔ ok (0.2ms)\nℹ tests ${t}\nℹ suites 0\nℹ pass ${p}\nℹ fail ${f}\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\nℹ duration_ms 40\n`;
  assert.deepEqual(countParser(summary(0, 0, 0), 0), { tests: 0, passed: 0, failed: 0 });
  assert.deepEqual(countParser(summary(1, 1, 0), 0), { tests: 1, passed: 1, failed: 0 });
  assert.deepEqual(countParser(summary(1, 0, 1), 1), { tests: 1, passed: 0, failed: 1 });
  // The last summary wins (a nested run's summary may appear earlier in the output).
  assert.deepEqual(countParser(`${summary(9, 9, 0)}${summary(2, 1, 1)}`, 1), { tests: 2, passed: 1, failed: 1 });
  assert.equal(countParser('SyntaxError: Unexpected token\n', 1), null);
  assert.equal(countParser('', 0), null);
  assert.equal(countParser('ℹ tests 1\n', 0), null);
});

test('U16 a test-*.mjs script without node:test is kind plain-script: single unsupported, file uses process isolation', () => {
  const tree = tempTree('fork-tdd-tree-', { 'recipes/x/test-live.mjs': "console.log('live ok');\n", 'recipes/x/x.mjs': 'export const x = 1;\n' });
  const file = join(tree, 'recipes/x/test-live.mjs');
  const runtime = runtimeFor(file, { repoRoot: tree, tree, folder: 'recipes/x' });
  const single = buildCommand({ op: 'single', runtime, tree, file, name: 'anything' });
  assert.equal(single.kind, 'plain-script');
  assert.equal(single.unsupported, 'plain script, no named tests; use `file`');
  const whole = buildCommand({ op: 'file', runtime, tree, file });
  assert.equal(whole.kind, 'plain-script');
  assert.equal(whole.unsupported, null);
  assert.equal(whole.cwd, join(tree, 'recipes/x'));
  assert.deepEqual(whole.argv, [process.execPath, '--test', '--test-reporter=spec', 'test-live.mjs']);
});

test('U17 deno argv is runtime.command plus --filter; the 0 passed parser', () => {
  const tree = tempTree('fork-tdd-tree-', fixtureFiles('deno-tested', 'integrations/d'));
  const file = join(tree, 'integrations/d/index_test.ts');
  const runtime = runtimeFor(file, { repoRoot: tree, tree, folder: 'integrations/d' });
  assert.equal(runtime.kind, 'deno');
  const single = buildCommand({ op: 'single', runtime, tree, file, name: 'add (x)' });
  assert.equal(single.kind, 'deno');
  assert.equal(single.unsupported, null);
  assert.equal(single.cwd, join(tree, 'integrations/d'));
  assert.deepEqual(single.argv, [...runtime.command, '--filter', 'add (x)', 'index_test.ts']);
  const whole = buildCommand({ op: 'file', runtime, tree, file });
  assert.deepEqual(whole.argv, [...runtime.command, 'index_test.ts']);
  const p = single.countParser;
  // Real deno 2.9 summary lines, with their ANSI colour codes.
  assert.deepEqual(p('\u001b[0m\u001b[32mok\u001b[0m | 0 passed | 0 failed | 2 filtered out \u001b[0m\u001b[38;5;245m(1ms)\u001b[0m\n', 0), { tests: 0, passed: 0, failed: 0 });
  assert.deepEqual(p('ok | 1 passed | 0 failed | 1 filtered out (1ms)\n', 0), { tests: 1, passed: 1, failed: 0 });
  assert.deepEqual(p('FAILED | 1 passed | 2 failed (4ms)\n', 1), { tests: 3, passed: 1, failed: 2 });
  assert.deepEqual(p('error: No test modules found\n', 1), { tests: 0, passed: 0, failed: 0 });
  assert.equal(p('error: Module not found "file:///x.ts".\n', 1), null);
});

const sha1 = s => createHash('sha1').update(s).digest('hex');

test('U18 python: cached venv keyed by tree + root and the requirements hash; argv -k; exit 5 is zero-match', () => {
  const tree = tempTree('fork-tdd-tree-', { ...fixtureFiles('python-tested', 'integrations/p'), 'integrations/p/requirements.txt': 'requests==2.32.3\n' });
  const file = join(tree, 'integrations/p/tests/test_imp.py');
  const runtime = runtimeFor(file, { repoRoot: tree, tree, folder: 'integrations/p' });
  const cwd = join(tree, 'integrations/p');
  const venv = join(tmpdir(), `fork-tdd-venv-${sha1(cwd)}`);
  const single = buildCommand({ op: 'single', runtime, tree, file, name: 'test_double' });
  assert.equal(single.kind, 'python');
  assert.equal(single.cwd, cwd);
  assert.deepEqual(single.venv, { dir: venv, requirements: 'requirements.txt', requirementsHash: sha1('requests==2.32.3\n') });
  assert.deepEqual(single.argv, [join(venv, 'bin', 'python'), '-m', 'pytest', '-q', '-k', 'test_double', 'tests/test_imp.py']);
  assert.deepEqual(buildCommand({ op: 'file', runtime, tree, file }).argv, [join(venv, 'bin', 'python'), '-m', 'pytest', '-q', 'tests/test_imp.py']);
  const bare = tempTree('fork-tdd-tree-', fixtureFiles('python-tested', 'integrations/p'));
  const bareFile = join(bare, 'integrations/p/tests/test_imp.py');
  const bareCmd = buildCommand({ op: 'file', runtime: runtimeFor(bareFile, { repoRoot: bare, tree: bare, folder: 'integrations/p' }), tree: bare, file: bareFile });
  assert.deepEqual(bareCmd.venv, { dir: join(tmpdir(), `fork-tdd-venv-${sha1(join(bare, 'integrations/p'))}`), requirements: null, requirementsHash: sha1('') });
  const p = single.countParser;
  assert.deepEqual(p('1 deselected in 0.01s\n', 5), { tests: 0, passed: 0, failed: 0 });
  assert.deepEqual(p('.\n1 passed in 0.01s\n', 0), { tests: 1, passed: 1, failed: 0 });
  assert.deepEqual(p('F.\nFAILED tests/test_imp.py::test_double - assert 3 == 4\n1 failed, 1 passed, 1 error in 0.03s\n', 1), { tests: 3, passed: 1, failed: 2 });
  assert.equal(p('ERROR: usage: python -m pytest\n', 4), null);
});
