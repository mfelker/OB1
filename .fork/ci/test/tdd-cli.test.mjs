import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CI_SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

const PASS = "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('adds', () => assert.equal(1 + 1, 2));\n";
const FAIL = "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('breaks', () => assert.equal(1 + 1, 3, 'decisive failure marker'));\n";
const PLAIN = "console.log('plain script ran');\n";

/** Plan text with the three R3 lines; pass null to omit a line. */
function plan({ lane = 'fork feature', worktree = 'none (fork-`main` checkout)', folder = '`recipes/x`' } = {}) {
  const lines = ['# Implementation Plan', ''];
  if (lane !== null) lines.push(`**Lane**: ${lane}`);
  if (folder !== null) lines.push(`**Contribution folder**: ${folder}`);
  if (worktree !== null) lines.push(`**Worktree**: ${worktree}`);
  return `${lines.join('\n')}\n`;
}

/** Write a { relPath: content } map under dir. */
function writeMap(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

/**
 * A temp repo with a copy of the adapter (.fork/ci/bin, lib, sql), an active feature
 * specs/001-a whose plan is built from `planOpts`, and `files` merged in.
 */
function cliRepo(planOpts = {}, files = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-cli-')));
  for (const sub of ['bin', 'lib', 'sql']) cpSync(join(CI_SRC, sub), join(root, '.fork/ci', sub), { recursive: true });
  writeMap(root, {
    '.specify/feature.json': `${JSON.stringify({ feature_directory: 'specs/001-a' })}\n`,
    'specs/001-a/plan.md': plan(planOpts),
    ...files,
  });
  return root;
}

/** Run the copied adapter from the repo root, as the extension would. */
function tdd(root, args, extraEnv = {}) {
  const { NODE_TEST_CONTEXT: _n, SPECIFY_FEATURE_DIRECTORY: _s, ...env } = process.env;
  const r = spawnSync(process.execPath, [join(root, '.fork/ci/bin/tdd.mjs'), ...args], { cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8' });
  return { ...r, lastLine: r.stdout.trimEnd().split('\n').at(-1) ?? '' };
}

test('U22 where prints the JSON, including featureDir and folderExists', () => {
  const root = cliRepo({}, { 'recipes/x/a.test.mjs': PASS, 'recipes/x/a.mjs': 'export const a = 1;\n' });
  const r = tdd(root, ['where']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.lastLine.startsWith('{'), `stdout: ${r.stdout}`);
  const where = JSON.parse(r.lastLine);
  assert.deepEqual(where, {
    repoRoot: root,
    featureDir: join(root, 'specs/001-a'),
    lane: 'fork',
    tree: root,
    folder: 'recipes/x',
    folderExists: true,
    runtimes: [{ kind: 'node-plain', root: 'recipes/x', testFiles: ['a.test.mjs'] }],
  });
  const missing = JSON.parse(tdd(cliRepo({ folder: '`recipes/new`' }), ['where']).lastLine);
  assert.equal(missing.folderExists, false);
  assert.deepEqual(missing.runtimes, []);
});
