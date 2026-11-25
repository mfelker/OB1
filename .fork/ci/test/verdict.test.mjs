import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worstOutcome, computeVerdict } from '../lib/verdict.mjs';

const ok = { detect: 'success', test: 'success', testSql: 'skipped', selfTest: 'skipped' };
const detectFor = (...paths) => ({
  has_folders: paths.length > 0,
  matrix: { include: paths.map(p => ({ path: p, mode: 'strict', origin: 'fork', needsPostgres: false })) },
  has_sql: false, sql_matrix: { include: [] }, removed: [], skipped: { forkOnly: 0, template: 0, other: 0 },
});
const res = (path, outcome) => ({ path, mode: 'strict', origin: 'fork', outcome, reason: '', runtimes: [], durationMs: 1 });

test('outcome precedence: timeout > setup > fail > no-tests > sql-unverified > pass > exempt', () => {
  assert.equal(worstOutcome(['pass', 'timeout', 'fail']), 'timeout');
  assert.equal(worstOutcome(['fail', 'setup']), 'setup');
  assert.equal(worstOutcome(['no-tests', 'fail']), 'fail');
  assert.equal(worstOutcome(['sql-unverified', 'no-tests']), 'no-tests');
  assert.equal(worstOutcome(['pass', 'sql-unverified']), 'sql-unverified');
  assert.equal(worstOutcome(['exempt', 'pass']), 'pass');
  assert.equal(worstOutcome([]), 'exempt');
});

test('all folders pass → success', () => {
  const v = computeVerdict({ detect: detectFor('recipes/a'), results: [res('recipes/a', 'pass')], jobs: ok });
  assert.equal(v.conclusion, 'success');
  assert.deepEqual(v.failing, []);
  assert.deepEqual(v.counts, { pass: 1 });
});

test('a failing folder → failure and listed', () => {
  const v = computeVerdict({
    detect: detectFor('recipes/a', 'recipes/b'),
    results: [res('recipes/a', 'pass'), res('recipes/b', 'fail')],
    jobs: { ...ok, test: 'failure' },
  });
  assert.equal(v.conclusion, 'failure');
  assert.deepEqual(v.failing, ['recipes/b']);
});

test('a matrix folder without a result → missing, counted as timeout, failure', () => {
  const v = computeVerdict({ detect: detectFor('recipes/a', 'recipes/b'), results: [res('recipes/a', 'pass')], jobs: ok });
  assert.equal(v.conclusion, 'failure');
  assert.deepEqual(v.missing, ['recipes/b']);
  assert.equal(v.counts.timeout, 1);
});

test('detect not successful, or no detect output → failure', () => {
  assert.equal(computeVerdict({ detect: detectFor(), results: [], jobs: { ...ok, detect: 'failure' } }).conclusion, 'failure');
  assert.equal(computeVerdict({ detect: null, results: [], jobs: ok }).conclusion, 'failure');
});

test('removed folders are carried through and never fail', () => {
  const d = { ...detectFor('recipes/a'), removed: ['recipes/old'] };
  const v = computeVerdict({ detect: d, results: [res('recipes/a', 'pass')], jobs: ok });
  assert.deepEqual(v.removed, ['recipes/old']);
  assert.equal(v.conclusion, 'success');
});

// ---- US3 (T033) ----

test('US3: no folders and test job skipped → success', () => {
  const v = computeVerdict({ detect: detectFor(), results: [], jobs: { ...ok, test: 'skipped' } });
  assert.equal(v.conclusion, 'success');
});

test('US3: folders expected but test job skipped (no results) → failure', () => {
  const v = computeVerdict({ detect: detectFor('recipes/a'), results: [], jobs: { ...ok, test: 'skipped' } });
  assert.equal(v.conclusion, 'failure');
});

test('US3: self-test failure or cancellation → failure; success/skipped are fine', () => {
  for (const [selfTest, expected] of [['failure', 'failure'], ['cancelled', 'failure'], ['success', 'success'], ['skipped', 'success']]) {
    const v = computeVerdict({ detect: detectFor(), results: [], jobs: { ...ok, test: 'skipped', selfTest } });
    assert.equal(v.conclusion, expected, selfTest);
  }
});

test('US3: a failed self-test is reported in the verdict', () => {
  const v = computeVerdict({ detect: detectFor(), results: [], jobs: { ...ok, selfTest: 'failure' } });
  assert.equal(v.selfTest, 'failure');
});

// ---- US4 (T040) ----

const adv = (path, outcome) => ({ ...res(path, outcome), mode: 'advisory', origin: 'upstream' });
const detectModes = entries => ({
  ...detectFor(), has_folders: entries.length > 0,
  matrix: { include: entries.map(([path, mode]) => ({ path, mode, origin: mode === 'advisory' ? 'upstream' : 'fork', needsPostgres: false })) },
});

test('US4: advisory failures and no-tests never fail the verdict; they are listed as advisories', () => {
  const v = computeVerdict({
    detect: detectModes([['recipes/u', 'advisory'], ['recipes/v', 'advisory']]),
    results: [adv('recipes/u', 'fail'), adv('recipes/v', 'no-tests')],
    jobs: ok,
  });
  assert.equal(v.conclusion, 'success');
  assert.deepEqual(v.failing, []);
  assert.deepEqual(v.advisories, ['recipes/u', 'recipes/v']);
});

test('US4: a missing advisory result does not fail; a missing strict one does', () => {
  const d = detectModes([['recipes/u', 'advisory'], ['recipes/s', 'strict']]);
  const v1 = computeVerdict({ detect: d, results: [res('recipes/s', 'pass')], jobs: ok });
  assert.equal(v1.conclusion, 'success');
  assert.deepEqual(v1.advisories, ['recipes/u']);
  const v2 = computeVerdict({ detect: d, results: [adv('recipes/u', 'pass')], jobs: ok });
  assert.equal(v2.conclusion, 'failure');
  assert.deepEqual(v2.failing, ['recipes/s']);
});

test('US4: strict failures still fail alongside advisories', () => {
  const v = computeVerdict({
    detect: detectModes([['recipes/u', 'advisory'], ['recipes/s', 'strict']]),
    results: [adv('recipes/u', 'fail'), res('recipes/s', 'fail')],
    jobs: ok,
  });
  assert.equal(v.conclusion, 'failure');
  assert.deepEqual(v.failing, ['recipes/s']);
  assert.deepEqual(v.advisories, ['recipes/u']);
});

// ---- spec 003 U34 (T018): the advisory TDD status never changes the verdict ----

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERDICT_BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'verdict.mjs');
const featSpec = `# Feature Specification: a\n\n**Feature Branch**: \`fork/a\`\n`;
const vReport = v => `---\nfeature: 001-a\nverdict: ${v}\n---\n`;

// A repo root with fork-ci inputs plus the given specs/ files.
function verdictRoot(files) {
  const root = mkdtempSync(join(tmpdir(), 'fork-ci-verdict-'));
  const all = { 'ci-detect/detect.json': JSON.stringify(detectFor('recipes/a')), 'ci-results/a.json': JSON.stringify(res('recipes/a', 'pass')), ...files };
  for (const [rel, content] of Object.entries(all)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    if (content === null) mkdirSync(join(root, rel)); else writeFileSync(join(root, rel), content);
  }
  return root;
}

function runVerdict(root, headRef, detectResult) {
  const env = { ...process.env };
  delete env.HEAD_REF;
  delete env.NODE_TEST_CONTEXT;
  if (headRef !== undefined) env.HEAD_REF = headRef;
  const summary = join(root, 'summary.md');
  writeFileSync(summary, '');
  const p = spawnSync(process.execPath, [VERDICT_BIN, '--detect', 'ci-detect/detect.json', '--results', 'ci-results',
    '--detect-result', detectResult, '--test-result', 'success', '--test-sql-result', 'skipped',
    '--self-test-result', 'skipped', '--summary', summary], { cwd: root, env, encoding: 'utf8' });
  return { status: p.status, stdout: p.stdout, stderr: p.stderr, summary: readFileSync(summary, 'utf8') };
}
const withoutTdd = md => { const i = md.indexOf('\n\n### TDD status (advisory)'); return i < 0 ? md : `${md.slice(0, i)}\n`; };

test('U34 bin/verdict.mjs: same conclusion and exit for every TDD status, including a throwing tddStatus', () => {
  const variants = [
    ['PASS', { 'specs/001-a/spec.md': featSpec, 'specs/001-a/tdd/cycle-log.md': '', 'specs/001-a/tdd/verification.md': vReport('PASS') }, 'fork/a', /\| specs\/001-a \| ✅ \| ✅ \| ✅ PASS \|/],
    ['PASS_WITH_GAPS', { 'specs/001-a/spec.md': featSpec, 'specs/001-a/tdd/verification.md': vReport('PASS_WITH_GAPS') }, 'fork/a', /⚠️ PASS_WITH_GAPS/],
    ['FAIL', { 'specs/001-a/spec.md': featSpec, 'specs/001-a/tdd/verification.md': vReport('FAIL') }, 'fork/a', /❌ FAIL/],
    ['BLOCKED', { 'specs/001-a/spec.md': featSpec, 'specs/001-a/tdd/verification.md': vReport('BLOCKED') }, 'fork/a', /❌ BLOCKED/],
    ['missing', { 'specs/001-a/spec.md': featSpec }, 'fork/a', /➖ missing/],
    ['unreadable', { 'specs/001-a/spec.md': featSpec, 'specs/001-a/tdd/verification.md': vReport('NOPE') }, 'fork/a', /⚠️ unreadable/],
    ['no link', { 'specs/001-a/spec.md': featSpec }, 'fork/zzz', /No feature linked to fork\/zzz \(advisory\)\./],
    ['push', { 'specs/001-a/spec.md': featSpec }, '', null],
    ['throws', { 'specs/001-a/spec.md': null }, 'fork/a', /TDD status unavailable: .*EISDIR.* \(advisory\)/],
  ];
  for (const detectResult of ['success', 'failure']) {
    const base = runVerdict(verdictRoot({}), undefined, detectResult);
    assert.equal(base.status, detectResult === 'success' ? 0 : 1, base.stderr);
    assert.doesNotMatch(base.stdout, /TDD status/);
    for (const [name, files, headRef, section] of variants) {
      const r = runVerdict(verdictRoot(files), headRef, detectResult);
      const label = `${detectResult}/${name}`;
      assert.equal(r.status, base.status, `${label}: ${r.stderr}`);
      assert.equal(withoutTdd(r.stdout), base.stdout, label);
      assert.equal(withoutTdd(r.summary), base.summary, label);
      if (section) assert.match(r.stdout, section, label); else assert.doesNotMatch(r.stdout, /TDD status/, label);
    }
  }
});
