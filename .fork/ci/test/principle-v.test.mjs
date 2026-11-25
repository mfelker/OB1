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
