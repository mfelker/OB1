import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../lib/report.mjs';

const verdict = (over = {}) => ({
  conclusion: 'failure', counts: {}, failing: ['recipes/b'], advisories: [], missing: [],
  removed: ['recipes/old'], bypasses: [], ...over,
});
const results = [
  { path: 'recipes/a', mode: 'strict', origin: 'fork', outcome: 'pass', reason: 'all tests passed',
    runtimes: [{ kind: 'node-plain', root: 'recipes/a', outcome: 'pass', reason: '', durationMs: 5 }], durationMs: 5 },
  { path: 'recipes/b', mode: 'strict', origin: 'fork', outcome: 'fail', reason: 'tests failed',
    runtimes: [{ kind: 'deno', root: 'recipes/b', outcome: 'fail', reason: 'tests failed', durationMs: 5 }], durationMs: 5 },
];
const detect = { skipped: { forkOnly: 3, template: 0, other: 1 } };

test('header shows the conclusion', () => {
  assert.match(renderReport(verdict(), results, detect), /^## Fork CI verdict: ❌ failure/);
  assert.match(renderReport(verdict({ conclusion: 'success', failing: [] }), results.slice(0, 1), detect), /^## Fork CI verdict: ✅ success/);
});

test('table has the contract columns and one row per folder', () => {
  const md = renderReport(verdict(), results, detect);
  assert.match(md, /\| Folder \| Mode \| Origin \| Outcome \| Runtimes \| Reason \|/);
  assert.match(md, /\| recipes\/a \| strict \| fork \| ✅ pass \| node-plain ✅ \| all tests passed \|/);
  assert.match(md, /\| recipes\/b \| strict \| fork \| ❌ fail \| deno ❌ \| tests failed \|/);
});

test('every non-pass row states a reason category', () => {
  const md = renderReport(verdict(), results, detect);
  const row = md.split('\n').find(l => l.startsWith('| recipes/b'));
  assert.match(row, /tests failed/);
});

test('missing results get a timeout row with a reason', () => {
  const md = renderReport(verdict({ missing: ['recipes/c'], failing: ['recipes/c'] }), [], detect);
  assert.match(md, /\| recipes\/c \| .* \| ❌ timeout \| — \| no result \(job lost or timed out\) \|/);
});

test('footer lists removed folders and skipped path counts', () => {
  const md = renderReport(verdict(), results, detect);
  assert.match(md, /Removed: recipes\/old/);
  assert.match(md, /Skipped paths: 3 fork-only, 0 template, 1 other/);
});

test('no folders → explicit message instead of an empty table', () => {
  const md = renderReport(verdict({ conclusion: 'success', failing: [], removed: [] }), [], detect);
  assert.match(md, /No contribution folders changed/);
  assert.doesNotMatch(md, /\| Folder \|/);
});

test('pipes in reasons are escaped so the table stays intact', () => {
  const r = [{ ...results[1], reason: 'a | b' }];
  const md = renderReport(verdict(), r, detect);
  assert.match(md, /a \\\| b/);
});

// ---- US2 (T028) ----

test('US2: no-tests rows name the runtime; exempt rows say docs-only', () => {
  const rs = [
    { path: 'server', mode: 'strict', origin: 'fork', outcome: 'no-tests', reason: 'no tests for deno code',
      runtimes: [
        { kind: 'deno', root: 'server', outcome: 'no-tests', reason: 'no tests for deno code', durationMs: 0 },
        { kind: 'node-script', root: 'server', outcome: 'pass', reason: 'tests passed', durationMs: 5 },
      ], durationMs: 5 },
    { path: 'skills/x', mode: 'strict', origin: 'fork', outcome: 'exempt', reason: 'docs-only (no executable code)', runtimes: [], durationMs: 1 },
  ];
  const md = renderReport(verdict({ failing: ['server'], removed: [] }), rs, detect);
  assert.match(md, /\| server \| strict \| fork \| ❌ no-tests \| deno ❌, node-script ✅ \| no tests for deno code \|/);
  assert.match(md, /\| skills\/x \| strict \| fork \| ➖ exempt \| docs-only \| docs-only \(no executable code\) \|/);
});

// ---- US4 (T040) ----

test('US4: advisory upstream rows show ⚠️ and "(from upstream)"', () => {
  const rs = [{ path: 'recipes/u', mode: 'advisory', origin: 'upstream', outcome: 'no-tests', reason: 'no tests for node code',
    runtimes: [{ kind: 'node-plain', root: 'recipes/u', outcome: 'no-tests', reason: 'no tests for node code', durationMs: 0 }], durationMs: 1 }];
  const md = renderReport(verdict({ conclusion: 'success', failing: [], advisories: ['recipes/u'], removed: [] }), rs, detect);
  assert.match(md, /\| recipes\/u \| advisory \| upstream \| ⚠️ no-tests \| node-plain ⚠️ \| no tests for node code \(from upstream\) \|/);
});

// ---- spec 003 U33 (T017): advisory TDD status section ----

const ok = verdict({ conclusion: 'success', failing: [], removed: [] });
const feat = (dir, verdict, cycleLog = true, verification = verdict !== 'missing') => ({ dir, cycleLog, verification, verdict });
const tdd = (...features) => ({ headRef: 'fork/x', features, linked: features.length > 0, error: null });
const tddSection = md => md.slice(md.indexOf('### TDD status (advisory)'));

test('U33 renderReport renders the advisory TDD status section per contract T1-T10', () => {
  const head = '### TDD status (advisory)\n\n| Feature | Cycle log | Audit report | Verdict |\n|---------|-----------|--------------|---------|\n';
  // T1
  assert.equal(tddSection(renderReport(ok, [], detect, tdd(feat('specs/003-a', 'PASS')))),
    `${head}| specs/003-a | ✅ | ✅ | ✅ PASS |\n`);
  // T2, T3, T5
  const md = renderReport(ok, [], detect, tdd(
    feat('specs/1', 'PASS_WITH_GAPS'), feat('specs/2', 'FAIL'), feat('specs/3', 'BLOCKED'), feat('specs/4', 'unreadable')));
  assert.match(md, /\| specs\/1 \| ✅ \| ✅ \| ⚠️ PASS_WITH_GAPS \|/);
  assert.match(md, /\| specs\/2 \| ✅ \| ✅ \| ❌ FAIL \|/);
  assert.match(md, /\| specs\/3 \| ✅ \| ✅ \| ❌ BLOCKED \|/);
  assert.match(md, /\| specs\/4 \| ✅ \| ✅ \| ⚠️ unreadable \|/);
  // T4, T6
  assert.match(renderReport(ok, [], detect, tdd(feat('specs/5', 'missing', false))), /\| specs\/5 \| ➖ \| ➖ \| ➖ missing \|/);
  // T7: one row per feature
  const rows = tddSection(renderReport(ok, [], detect, tdd(feat('specs/a', 'PASS'), feat('specs/b', 'FAIL')))).split('\n').filter(l => l.startsWith('| specs/'));
  assert.equal(rows.length, 2);
  // T8
  assert.equal(tddSection(renderReport(ok, [], detect, tdd())), '### TDD status (advisory)\n\nNo feature linked to fork/x (advisory).\n');
  // T9: no section for null or undefined
  assert.doesNotMatch(renderReport(ok, [], detect, null), /TDD status/);
  assert.doesNotMatch(renderReport(ok, [], detect), /TDD status/);
  // T10
  assert.equal(tddSection(renderReport(ok, [], detect, { error: 'EISDIR: illegal operation' })),
    '### TDD status (advisory)\n\nTDD status unavailable: EISDIR: illegal operation (advisory)\n');
});

test('U33 pipes and newlines in TDD status names and messages are escaped', () => {
  assert.match(renderReport(ok, [], detect, tdd(feat('specs/a|b', 'PASS'))), /\| specs\/a\\\|b \| ✅ \| ✅ \| ✅ PASS \|/);
  assert.match(renderReport(ok, [], detect, { headRef: 'fork/a|b', features: [], linked: false, error: null }),
    /No feature linked to fork\/a\\\|b \(advisory\)\./);
  assert.match(renderReport(ok, [], detect, { error: 'bad | thing\nline2' }), /TDD status unavailable: bad \\\| thing line2 \(advisory\)/);
});

test('U33 the TDD section leaves the rest of the report unchanged', () => {
  const base = renderReport(verdict(), results, detect);
  const withTdd = renderReport(verdict(), results, detect, tdd(feat('specs/a', 'FAIL')));
  assert.ok(withTdd.startsWith(base.trimEnd()));
});
