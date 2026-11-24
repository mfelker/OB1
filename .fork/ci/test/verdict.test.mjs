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
