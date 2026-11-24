// e2e (T062): a test added while staging, as the fork's TDD rule requires.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('smoke-all.js exists and is non-empty', () => {
  const src = readFileSync(new URL('../smoke-all.js', import.meta.url), 'utf8');
  assert.ok(src.length > 0);
});
