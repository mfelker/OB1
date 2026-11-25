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
