import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { resolveTarget, TargetError } from '../lib/tdd-target.mjs';

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
