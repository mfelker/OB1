import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { delimiter } from 'node:path';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CI_SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

const PASS = "import { describe, test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('adds', () => assert.equal(1 + 1, 2));\n";
const FAIL = "import { describe, test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('breaks', () => assert.equal(1 + 1, 3, 'decisive failure marker'));\n";
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
function tdd(root, args, extraEnv = {}, nodeArgs = []) {
  const { NODE_TEST_CONTEXT: _n, SPECIFY_FEATURE_DIRECTORY: _s, ...env } = process.env;
  const r = spawnSync(process.execPath, [...nodeArgs, join(root, '.fork/ci/bin/tdd.mjs'), ...args], { cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8' });
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

test('U23 single/file end to end: pass 0, fail 1, zero-match 3, unsupported 4; full child output streamed', () => {
  const noisy = `import { describe, test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('noisy', () => {\n  for (let i = 0; i < 3000; i++) console.log(\`noise line \${i}\`);\n  assert.equal(1, 2, 'decisive failure marker');\n});\n`;
  const root = cliRepo({}, {
    'recipes/x/a.mjs': 'export const a = 1;\n',
    'recipes/x/pass.test.mjs': PASS,
    'recipes/x/fail.test.mjs': FAIL,
    'recipes/x/noisy.test.mjs': noisy,
    'recipes/x/test-plain.mjs': PLAIN,
  });
  const pass = tdd(root, ['single', 'pass.test.mjs', 'adds']);
  assert.equal(pass.status, 0, pass.stdout + pass.stderr);
  assert.match(pass.lastLine, /tests=1 pass=1 fail=0 → pass$/);
  const fail = tdd(root, ['single', 'recipes/x/fail.test.mjs', 'breaks']);
  assert.equal(fail.status, 1, fail.stdout + fail.stderr);
  assert.match(fail.lastLine, /tests=1 pass=0 fail=1 → fail$/);
  assert.ok(fail.stdout.includes('decisive failure marker'));
  const zero = tdd(root, ['single', 'pass.test.mjs', 'no such test']);
  assert.equal(zero.status, 3, zero.stdout + zero.stderr);
  assert.match(zero.lastLine, /tests=0 pass=0 fail=0 → no tests matched "no such test"$/);
  const wholePass = tdd(root, ['file', 'pass.test.mjs']);
  assert.equal(wholePass.status, 0);
  assert.match(wholePass.lastLine, /tests=1 pass=1 fail=0 → pass$/);
  assert.equal(tdd(root, ['file', 'fail.test.mjs']).status, 1);
  const loud = tdd(root, ['file', 'noisy.test.mjs']);
  assert.equal(loud.status, 1);
  assert.ok(loud.stdout.includes('noise line 0\n') && loud.stdout.includes('noise line 2999\n'), 'the whole child output is passed through, untruncated');
  assert.ok(loud.stdout.includes('decisive failure marker'));
  const plainFile = tdd(root, ['file', 'test-plain.mjs']);
  assert.equal(plainFile.status, 0, plainFile.stdout + plainFile.stderr);
  assert.ok(plainFile.stdout.includes('plain script ran'));
  const plainSingle = tdd(root, ['single', 'test-plain.mjs', 'x']);
  assert.equal(plainSingle.status, 4);
  assert.equal(plainSingle.stderr.trim(), 'tdd: single unsupported for plain-script: plain script, no named tests; use `file`');
});

test('U24 suite exit mapping, including the empty baseline (no-tests, exempt, missing folder)', () => {
  const suite = files => tdd(cliRepo({}, files), ['suite']);
  const pass = suite({ 'recipes/x/a.mjs': 'export const a = 1;\n', 'recipes/x/a.test.mjs': PASS });
  assert.equal(pass.status, 0, pass.stdout + pass.stderr);
  assert.match(pass.lastLine, /^\[tdd\] suite\b.*→ pass$/);
  assert.ok(pass.stdout.includes('[tdd] suite node-plain recipes/x: pass'), pass.stdout);
  const fail = suite({ 'recipes/x/a.mjs': 'export const a = 1;\n', 'recipes/x/a.test.mjs': FAIL });
  assert.equal(fail.status, 1, fail.stdout + fail.stderr);
  assert.match(fail.lastLine, /→ fail: tests failed \(exit 1\)$/);
  const sql = suite({ 'recipes/x/schema.sql': 'select 1;\n' });
  assert.equal(sql.status, 0, sql.stdout + sql.stderr);
  assert.match(sql.lastLine, /→ sql-unverified$/);
  assert.ok(sql.stdout.includes('sql unverified (advisory)'));
  const noTests = suite({ 'recipes/x/a.mjs': 'export const a = 1;\n' });
  assert.equal(noTests.status, 0, noTests.stdout + noTests.stderr);
  assert.match(noTests.lastLine, /→ empty baseline: no tests yet$/);
  const docs = suite({ 'recipes/x/README.md': '# docs\n' });
  assert.equal(docs.status, 0, docs.stdout + docs.stderr);
  assert.match(docs.lastLine, /→ empty baseline: docs-only$/);
  const missing = tdd(cliRepo({ folder: '`recipes/not-yet`' }), ['suite']);
  assert.equal(missing.status, 0, missing.stdout + missing.stderr);
  assert.match(missing.lastLine, /→ empty baseline: folder does not exist yet$/);
});

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test', GIT_CONFIG_NOSYSTEM: '1' };
const gitIn = (dir, args) => execFileSync('git', args, { cwd: dir, env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();

/** Make `dir` a git repo with everything committed on `main`. */
function commitAll(dir) {
  gitIn(dir, ['init', '-q', '-b', 'main']);
  gitIn(dir, ['add', '-A']);
  gitIn(dir, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init']);
}

test('U25 suite restores a lockfile it modified that was clean before', () => {
  // The passing test dirties both tracked lockfiles in its runtime root (cwd), as an install would.
  const dirtying = "import { describe, test } from 'node:test';\nimport { writeFileSync } from 'node:fs';\ntest('dirties', () => { writeFileSync('deno.lock', 'rewritten\\n'); writeFileSync('package-lock.json', 'rewritten\\n'); });\n";
  const root = cliRepo({}, {
    'recipes/x/a.mjs': 'export const a = 1;\n',
    'recipes/x/a.test.mjs': dirtying,
    'recipes/x/deno.lock': 'original deno lock\n',
    'recipes/x/package-lock.json': 'original npm lock\n',
  });
  commitAll(root);
  writeFileSync(join(root, 'recipes/x/package-lock.json'), 'edited by the developer\n'); // dirty before the run: left alone
  const r = tdd(root, ['suite']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(readFileSync(join(root, 'recipes/x/deno.lock'), 'utf8'), 'original deno lock\n');
  assert.ok(r.stdout.includes('[tdd] restored recipes/x/deno.lock'), r.stdout);
  assert.equal(readFileSync(join(root, 'recipes/x/package-lock.json'), 'utf8'), 'rewritten\n');
  assert.ok(!r.stdout.includes('restored recipes/x/package-lock.json'));
});

test('U26 usage, target and Node < 26 errors exit 2 with a single-line message', () => {
  const root = cliRepo({}, { 'recipes/x/a.mjs': 'export const a = 1;\n', 'recipes/x/a.test.mjs': PASS });
  const USAGE = 'usage: tdd.mjs where | single <file> <name> | file <file> | suite';
  const errs = [
    [tdd(root, []), `tdd: missing subcommand; ${USAGE}`],
    [tdd(root, ['bogus']), `tdd: unknown subcommand "bogus"; ${USAGE}`],
    [tdd(root, ['single', 'a.test.mjs']), `tdd: single needs <file> <name>; ${USAGE}`],
    [tdd(root, ['file']), `tdd: file needs <file>; ${USAGE}`],
    [tdd(root, ['where'], { SPECIFY_FEATURE_DIRECTORY: 'specs/999-none' }), 'tdd: plan not found: specs/999-none/plan.md'],
  ];
  const noFeature = cliRepo();
  writeFileSync(join(noFeature, '.specify/feature.json'), '{}\n');
  errs.push([tdd(noFeature, ['where']), 'tdd: no active feature (set SPECIFY_FEATURE_DIRECTORY or .specify/feature.json)']);
  const gone = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-gone-'))), 'wt');
  errs.push([tdd(cliRepo({ lane: 'staged upstream PR #1', worktree: `\`${gone}\`` }), ['suite']), `tdd: worktree not found: ${gone}`]);
  const newFolder = cliRepo({ folder: '`recipes/new`' });
  errs.push([tdd(newFolder, ['file', 'a.test.mjs']), `tdd: folder not found in tree: recipes/new (${newFolder})`]);
  errs.push([tdd(root, ['where'], {}, ['--import', 'data:text/javascript,Object.defineProperty(process.versions,"node",{value:"24.1.0"})']), 'tdd: requires Node >= 26 (found 24.1.0)']);
  for (const [r, message] of errs) {
    assert.equal(r.status, 2, `${message}\n${r.stdout}${r.stderr}`);
    assert.equal(r.stderr, `${message}\n`);
  }
});

test('U27 the summary line names feature= and folder=', () => {
  const root = cliRepo({}, { 'recipes/x/a.mjs': 'export const a = 1;\n', 'recipes/x/a.test.mjs': PASS });
  assert.equal(tdd(root, ['single', 'a.test.mjs', 'adds']).lastLine,
    '[tdd] single node-test feature=specs/001-a folder=recipes/x: tests=1 pass=1 fail=0 → pass');
  assert.equal(tdd(root, ['file', 'a.test.mjs']).lastLine,
    '[tdd] file node-test feature=specs/001-a folder=recipes/x: tests=1 pass=1 fail=0 → pass');
  assert.equal(tdd(root, ['suite']).lastLine, '[tdd] suite feature=specs/001-a folder=recipes/x → pass');
  assert.equal(tdd(cliRepo({ folder: '`recipes/new`' }), ['suite']).lastLine,
    '[tdd] suite feature=specs/001-a folder=recipes/new → empty baseline: folder does not exist yet');
});

/**
 * Acceptance layout: a committed repo R (adapter copy + feature plan) whose recipes/x test FAILS,
 * plus a real linked worktree W where recipes/x's test PASSES. Routing to the wrong tree shows as a failure.
 */
function stagedLayout(planFor) {
  const repo = cliRepo({}, { 'recipes/x/a.mjs': 'export const a = 1;\n', 'recipes/x/a.test.mjs': FAIL.replace("'breaks'", "'adds'") });
  commitAll(repo);
  const wt = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-accept-wt-'))), 'wt');
  gitIn(repo, ['worktree', 'add', '-q', '-b', 'staged-x', wt]);
  writeFileSync(join(wt, 'recipes/x/a.test.mjs'), PASS);
  writeFileSync(join(repo, 'specs/001-a/plan.md'), plan(planFor(wt)));
  return { repo, wt };
}

describe('acceptance', () => {
  test('A3 suite for a feature whose plan names a real git worktree runs that worktree\'s folder', () => {
    const { repo, wt } = stagedLayout(wt => ({ lane: 'staged upstream PR #1', worktree: `\`${wt}\`. Every source path is rooted here.` }));
    assert.equal(JSON.parse(tdd(repo, ['where']).lastLine).tree, wt);
    const r = tdd(repo, ['suite']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.lastLine, '[tdd] suite feature=specs/001-a folder=recipes/x → pass');
  });

  // contracts/tdd-profile.md `single`, verbatim, expanded the way the extension does and run by a shell from the repo root.
  const PROFILE_SINGLE = 'node .fork/ci/bin/tdd.mjs single {file} "{name}"';
  const profile = (repo, template, vars) => {
    const { NODE_TEST_CONTEXT: _n, SPECIFY_FEATURE_DIRECTORY: _s, ...env } = process.env;
    const command = template.replace('{file}', vars.file).replace('{name}', vars.name);
    const r = spawnSync(command, { shell: true, cwd: repo, encoding: 'utf8', env: { ...env, PATH: `${dirname(process.execPath)}${delimiter}${env.PATH}` } });
    return { ...r, lastLine: r.stdout.trimEnd().split('\n').at(-1) ?? '' };
  };

  test('A4 the profile single command run as written gives exit 3 for a name that matches nothing', () => {
    const { repo } = stagedLayout(wt => ({ lane: 'staged upstream PR #1', worktree: `\`${wt}\`` }));
    const zero = profile(repo, PROFILE_SINGLE, { file: 'recipes/x/a.test.mjs', name: 'a name (that) matches [nothing]' });
    assert.equal(zero.status, 3, zero.stdout + zero.stderr);
    assert.equal(zero.lastLine, '[tdd] single node-test feature=specs/001-a folder=recipes/x: tests=0 pass=0 fail=0 → no tests matched "a name (that) matches [nothing]"');
    const hit = profile(repo, PROFILE_SINGLE, { file: 'recipes/x/a.test.mjs', name: 'adds' });
    assert.equal(hit.status, 0, hit.stdout + hit.stderr);
  });

  test('A5 a fork feature with Worktree none uses the repo-root checkout', () => {
    // Another worktree exists, but the fork plan says none: the repo root's (failing) copy is the one that runs.
    const { repo } = stagedLayout(() => ({ lane: 'fork feature', worktree: 'none (fork-`main` checkout)' }));
    assert.equal(JSON.parse(tdd(repo, ['where']).lastLine).tree, repo);
    const r = profile(repo, PROFILE_SINGLE, { file: 'recipes/x/a.test.mjs', name: 'adds' });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.ok(r.stdout.includes('decisive failure marker'));
    assert.equal(r.lastLine, '[tdd] single node-test feature=specs/001-a folder=recipes/x: tests=1 pass=0 fail=1 → fail');
  });
});
