import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../lib/principle-v.mjs';

const upstream = {
  files: new Set(['CLAUDE.md', 'docs/01-getting-started.md']),
  dirs: new Set(['docs', 'recipes', '.claude', '.github', '.github/workflows']),
};
const base = { relPath: 'CLAUDE.md', branch: 'main', mergeInProgress: false, upstream };
const run = over => decide({ ...base, ...over });

test('U1 D1: relPath null is allowed', () => {
  const d = run({ relPath: null });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D1');
});

test('U2 D2: a branch other than main (or detached HEAD) is allowed; main is not covered by D2', () => {
  for (const branch of ['feature/x', 'fork/principle-v-guard', 'HEAD']) {
    const d = run({ branch });
    assert.equal(d.allowed, true, branch);
    assert.equal(d.rule, 'D2', branch);
  }
  assert.notEqual(run({ branch: 'main' }).rule, 'D2');
});

test('U3 D3: mergeInProgress on main is allowed', () => {
  const d = run({ mergeInProgress: true });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D3');
});
