import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { requireFolder, resolveTarget, TargetError } from '../lib/tdd-target.mjs';

/** Plan text with the three R3 lines; pass null to omit a line. */
function plan({ lane = 'fork feature', worktree = 'none (fork-`main` checkout)', folder = '`.fork/ci` (fork tooling)' } = {}) {
  const lines = ['# Implementation Plan', ''];
  if (lane !== null) lines.push(`**Lane**: ${lane}`);
  if (folder !== null) lines.push(`**Contribution folder**: ${folder}`);
  if (worktree !== null) lines.push(`**Worktree**: ${worktree}`);
  return `${lines.join('\n')}\n`;
}

/** Fixture repo root (real path) from an in-memory { relPath: content } map. */
function fixtureRepo(files) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-target-')));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

const featureJson = dir => `${JSON.stringify({ feature_directory: dir }, null, 2)}\n`;

test('U1 SPECIFY_FEATURE_DIRECTORY wins over feature.json', () => {
  const root = fixtureRepo({
    '.specify/feature.json': featureJson('specs/001-a'),
    'specs/001-a/plan.md': plan(),
    'specs/002-b/plan.md': plan(),
    '.fork/ci/x.mjs': 'export const x = 1;\n',
  });
  const t = resolveTarget({ repoRoot: root, env: { SPECIFY_FEATURE_DIRECTORY: 'specs/002-b' } });
  assert.equal(t.featureDir, join(root, 'specs/002-b'));
});

test('U2 feature.json feature_directory is used when there is no env', () => {
  const root = fixtureRepo({
    '.specify/feature.json': featureJson('specs/001-a'),
    'specs/001-a/plan.md': plan(),
    '.fork/ci/x.mjs': 'export const x = 1;\n',
  });
  const t = resolveTarget({ repoRoot: root, env: {} });
  assert.equal(t.featureDir, join(root, 'specs/001-a'));
});

const NO_FEATURE = 'no active feature (set SPECIFY_FEATURE_DIRECTORY or .specify/feature.json)';

/** Assert resolveTarget throws a TargetError with exactly this message. */
function throwsTarget(root, env, message) {
  assert.throws(() => resolveTarget({ repoRoot: root, env }), err => {
    assert.ok(err instanceof TargetError, `expected TargetError, got ${err?.name}: ${err?.message}`);
    assert.equal(err.message, message);
    return true;
  });
}

test('U3 neither env nor feature.json gives "no active feature"', () => {
  throwsTarget(fixtureRepo({ 'specs/001-a/plan.md': plan() }), {}, NO_FEATURE);
  throwsTarget(fixtureRepo({ '.specify/feature.json': '{}\n', 'specs/001-a/plan.md': plan() }), {}, NO_FEATURE);
});

/** A one-feature fixture repo whose plan is built from `planOpts`; extra files merged in. */
function featureRepo(planOpts, extra = { '.fork/ci/x.mjs': 'export const x = 1;\n' }) {
  return fixtureRepo({
    '.specify/feature.json': featureJson('specs/001-a'),
    'specs/001-a/plan.md': plan(planOpts),
    ...extra,
  });
}

test('U4 lane grammar: fork, upstream-bound, staged; placeholder and unknown are errors', () => {
  const laneOf = value => resolveTarget({ repoRoot: featureRepo({ lane: value }), env: {} }).lane;
  assert.equal(laneOf('fork feature'), 'fork');
  assert.equal(laneOf('upstream-bound feature'), 'upstream-bound');
  assert.equal(laneOf('staged upstream PR #532'), 'staged');
  throwsTarget(featureRepo({ lane: '[fork feature / upstream-bound feature / staged upstream PR #N]' }), {},
    'plan Lane is a placeholder (specs/001-a/plan.md)');
  throwsTarget(featureRepo({ lane: 'experimental' }), {}, 'unknown lane: experimental (specs/001-a/plan.md)');
  throwsTarget(featureRepo({ lane: null }), {}, 'plan has no Lane line (specs/001-a/plan.md)');
  throwsTarget(fixtureRepo({ '.specify/feature.json': featureJson('specs/001-a') }), {}, 'plan not found: specs/001-a/plan.md');
});

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test', GIT_CONFIG_NOSYSTEM: '1' };
const gitIn = (dir, args) => execFileSync('git', args, { cwd: dir, env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();

/** Make `root` a git repo with one commit and add a linked worktree beside it; returns the worktree's real path. */
function addWorktree(root) {
  gitIn(root, ['init', '-q', '-b', 'main']);
  gitIn(root, ['add', '-A']);
  gitIn(root, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init']);
  const wt = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-wt-'))), 'wt');
  gitIn(root, ['worktree', 'add', '-q', '-b', 'feature', wt]);
  return wt;
}

test('U5 a backticked absolute Worktree path becomes tree', () => {
  const root = fixtureRepo({ '.fork/ci/x.mjs': 'export const x = 1;\n' });
  const wt = addWorktree(root);
  const repo = featureRepo({ lane: 'staged upstream PR #1', worktree: `\`${wt}\`. Every source path is rooted here.` });
  assert.equal(resolveTarget({ repoRoot: repo, env: {} }).tree, wt);
});

test('U6 Worktree none… gives repoRoot', () => {
  const treeOf = value => {
    const root = featureRepo({ worktree: value });
    return [resolveTarget({ repoRoot: root, env: {} }).tree, root];
  };
  for (const value of ['none (fork-`main` checkout)', 'None', 'NONE: runs in `.`']) {
    const [tree, root] = treeOf(value);
    assert.equal(tree, root, value);
  }
});

test('U7 a Worktree placeholder or a non-absolute token is an error', () => {
  const templateLine = '**Worktree** *(upstream-bound / staged)*: `[/absolute/path/to/worktree]` — all source paths in this plan and in tasks.md are rooted here; spec-kit commands still run from the fork-`main` checkout';
  const fromTemplate = fixtureRepo({
    '.specify/feature.json': featureJson('specs/001-a'),
    'specs/001-a/plan.md': `${plan({ lane: 'staged upstream PR #1', worktree: null })}${templateLine}\n`,
  });
  throwsTarget(fromTemplate, {}, 'plan Worktree is a placeholder (specs/001-a/plan.md)');
  const NOT_ABS = 'plan Worktree must be an absolute path or "none"';
  throwsTarget(featureRepo({ worktree: '`relative/wt`' }), {}, NOT_ABS);
  throwsTarget(featureRepo({ worktree: 'the sibling checkout' }), {}, NOT_ABS);
  throwsTarget(featureRepo({ worktree: '' }), {}, NOT_ABS);
});

test('U8 a missing Worktree line gives repoRoot for fork; staged and upstream-bound get an error', () => {
  const root = featureRepo({ lane: 'fork feature', worktree: null });
  assert.equal(resolveTarget({ repoRoot: root, env: {} }).tree, root);
  throwsTarget(featureRepo({ lane: 'staged upstream PR #1', worktree: null }), {}, 'plan Worktree required for staged lane');
  throwsTarget(featureRepo({ lane: 'upstream-bound feature', worktree: null }), {}, 'plan Worktree required for upstream-bound lane');
});

test('U9 a Worktree not on disk, or not a git work tree, is an error', () => {
  const gone = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-gone-'))), 'never-created');
  throwsTarget(featureRepo({ lane: 'staged upstream PR #1', worktree: `\`${gone}\`` }), {}, `worktree not found: ${gone}`);
  const plainDir = realpathSync(mkdtempSync(join(tmpdir(), 'fork-tdd-plain-')));
  throwsTarget(featureRepo({ lane: 'staged upstream PR #1', worktree: `\`${plainDir}\`` }), {}, `worktree not found: ${plainDir}`);
});

test('U10 Contribution folder grammar: placeholder, N/A before backticks, trailing / stripped, leading / or .. rejected', () => {
  const folderOf = value => resolveTarget({ repoRoot: featureRepo({ folder: value }), env: {} }).folder;
  assert.equal(folderOf('`.fork/ci` (the adapter and fork-ci code and tests)'), '.fork/ci');
  assert.equal(folderOf('`recipes/atomizer/`'), 'recipes/atomizer');
  const NO_FOLDER = 'plan has no Contribution folder (specs/001-a/plan.md)';
  // The plan template's literal line, and spec 001's literal line (N/A wins over its backticked `.fork/ci/`).
  throwsTarget(featureRepo({ folder: '`[category]/[kebab-case-name]/`' }), {}, NO_FOLDER);
  throwsTarget(featureRepo({ folder: 'N/A. Fork infrastructure lives in `.fork/ci/` plus `.github/workflows/fork-ci.yml`.' }), {}, NO_FOLDER);
  throwsTarget(featureRepo({ folder: null }), {}, NO_FOLDER);
  throwsTarget(featureRepo({ folder: 'somewhere in recipes' }), {}, NO_FOLDER);
  throwsTarget(featureRepo({ folder: '`/etc/passwd`' }), {}, 'plan Contribution folder must be repo-relative: /etc/passwd');
  throwsTarget(featureRepo({ folder: '`recipes/../..`' }), {}, 'plan Contribution folder must be repo-relative: recipes/../..');
});

test('U11 folderExists:false is allowed for suite only; other operations get "folder not found"', () => {
  const present = featureRepo({});
  const t = resolveTarget({ repoRoot: present, env: {} });
  assert.equal(t.folderExists, true);
  assert.equal(requireFolder(t), t);
  const absent = featureRepo({ folder: '`recipes/new-thing/`' });
  const u = resolveTarget({ repoRoot: absent, env: {} });
  assert.equal(u.folderExists, false);
  assert.throws(() => requireFolder(u), err => err instanceof TargetError
    && err.message === `folder not found in tree: recipes/new-thing (${absent})`);
});
