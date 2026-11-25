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

test('U4 D9: a new top-level path upstream does not have is allowed', () => {
  const d = run({ relPath: 'NOTES.md' });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D9');
});

test('U5 D4: a file that exists upstream is denied', () => {
  const d = run({ relPath: 'CLAUDE.md' });
  assert.equal(d.allowed, false);
  assert.equal(d.rule, 'D4');
});

test('U6 D8: a new file inside an upstream folder is denied; a sibling top-level path is not', () => {
  for (const relPath of ['docs/x.md', 'docs/a/b/c.md']) {
    const d = run({ relPath });
    assert.equal(d.allowed, false, relPath);
    assert.equal(d.rule, 'D8', relPath);
  }
  const sibling = run({ relPath: 'docsx.md' });
  assert.equal(sibling.allowed, true);
  assert.equal(sibling.rule, 'D9');
});

test('U7 D7: with upstream null, a non-fork path is denied', () => {
  const d = run({ relPath: 'NOTES.md', upstream: null });
  assert.equal(d.allowed, false);
  assert.equal(d.rule, 'D7');
});
