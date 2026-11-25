import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { tddStatus } from '../lib/tdd-status.mjs';

// Build a temp repo root from { relPath: content }.
function tree(files) {
  const root = mkdtempSync(join(tmpdir(), 'fork-ci-tdd-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}
const spec = branch => `# Feature Specification: x\n\n**Feature Branch**: \`${branch}\`\n**Created**: 2026-11-24\n`;

test('U31 empty headRef (push event) gives null', () => {
  const root = tree({ 'specs/001-a/spec.md': spec('fork/a') });
  assert.equal(tddStatus(root, ''), null);
});

test('U30 no spec names the branch gives linked:false with no features', () => {
  const root = tree({ 'specs/001-a/spec.md': spec('fork/a'), 'specs/002-b/spec.md': spec('stage/b') });
  assert.deepEqual(tddStatus(root, 'fork/other'), { headRef: 'fork/other', features: [], linked: false, error: null });
});

const report = verdictLine => `---\nfeature: 001-a\n${verdictLine}\nstandard: x.md # rubric\n---\n\n# Verification\n`;

test('U28 tddStatus reports per-feature cycle log, audit report and verdict', () => {
  const cases = [
    ['PASS', { 'tdd/cycle-log.md': '# log\n', 'tdd/verification.md': report('verdict: PASS') }, true, true],
    ['PASS_WITH_GAPS', { 'tdd/verification.md': report('verdict: PASS_WITH_GAPS # gaps noted') }, false, true],
    ['FAIL', { 'tdd/verification.md': report('verdict: FAIL').replace(/\n/g, '\r\n') }, false, true],
    ['BLOCKED', { 'tdd/cycle-log.md': '', 'tdd/verification.md': report('verdict: BLOCKED   ') }, true, true],
    ['missing', { 'tdd/cycle-log.md': '# log\n' }, true, false],
    ['unreadable', { 'tdd/verification.md': report('verdict: GREAT') }, false, true],
    ['unreadable', { 'tdd/verification.md': report('verdict:') }, false, true],
    ['unreadable', { 'tdd/verification.md': '# Verification\n\nverdict: PASS\n' }, false, true],
    ['unreadable', { 'tdd/verification.md': '---\nfeature: 001-a\n---\n\nverdict: PASS\n' }, false, true],
  ];
  for (const [verdict, files, cycleLog, verification] of cases) {
    const fx = { 'specs/001-a/spec.md': spec('fork/a'), 'specs/002-b/spec.md': spec('fork/b') };
    for (const [rel, content] of Object.entries(files)) fx[`specs/001-a/${rel}`] = content;
    const s = tddStatus(tree(fx), 'fork/a');
    assert.equal(s.linked, true, verdict);
    assert.deepEqual(s.features, [{ dir: 'specs/001-a', cycleLog, verification, verdict }], JSON.stringify(files));
  }
});

test('U29 several specs naming the same branch give one entry each, sorted by dir', () => {
  const root = tree({
    'specs/010-c/spec.md': spec('fork/shared'),
    'specs/002-b/spec.md': spec('fork/other'),
    'specs/001-a/spec.md': spec('fork/shared'),
    'specs/001-a/tdd/verification.md': report('verdict: PASS'),
  });
  const s = tddStatus(root, 'fork/shared');
  assert.deepEqual(s.features.map(f => [f.dir, f.verdict]), [['specs/001-a', 'PASS'], ['specs/010-c', 'missing']]);
});
