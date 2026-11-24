import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Column names of `create table [if not exists] thoughts (...)` in SQL text. */
export function thoughtsColumns(sql) {
  const m = /create table (?:if not exists )?(?:public\.)?thoughts\s*\(([\s\S]*?)\n\);/i.exec(sql);
  assert.ok(m, 'create table thoughts not found');
  return m[1].split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split(/\s+/)[0]);
}

test('bootstrap.sql thoughts columns match docs/01-getting-started.md', () => {
  const doc = readFileSync(join(ROOT, 'docs', '01-getting-started.md'), 'utf8');
  const boot = readFileSync(join(ROOT, '.fork', 'ci', 'sql', 'bootstrap.sql'), 'utf8');
  assert.deepEqual(thoughtsColumns(boot), thoughtsColumns(doc));
});

test('bootstrap.sql has no destructive statements (constitution Principle I)', () => {
  const boot = readFileSync(join(ROOT, '.fork', 'ci', 'sql', 'bootstrap.sql'), 'utf8');
  assert.doesNotMatch(boot, /\b(drop\s+(table|database)|truncate)\b/i);
  assert.doesNotMatch(boot, /\bdelete\s+from\b/i);
});
