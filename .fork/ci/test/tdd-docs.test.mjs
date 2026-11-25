import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/**
 * The text of the section whose heading line starts with `heading`, up to the
 * next heading of the same or a higher level (or the end of the file), with
 * whitespace collapsed so hard-wrapped sentences match as one line.
 */
export function section(text, heading) {
  const level = /^#+/.exec(heading)[0].length;
  const start = text.split('\n').findIndex(l => l.startsWith(heading));
  if (start < 0) return null;
  const lines = text.split('\n').slice(start);
  const next = lines.findIndex((l, i) => i > 0 && /^#+ /.test(l) && /^#+/.exec(l)[0].length <= level);
  return (next < 0 ? lines : lines.slice(0, next)).join('\n').replace(/\s+/g, ' ');
}

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

test('A13 constitution Principle IV names the cycle log, the staged base-red rule and the hook', () => {
  const iv = section(read('.specify', 'memory', 'constitution.md'), '### IV.');
  assert.ok(iv, 'Principle IV section not found');
  assert.match(iv, /tdd\/cycle-log\.md/, 'Principle IV must name tdd/cycle-log.md as the red evidence');
  assert.match(iv, /fork features? and upstream-bound[^.]*cycle-log|cycle-log[^.]*fork[^.]*upstream-bound/i,
    'Principle IV must tie the cycle log to the fork and upstream-bound lanes');
  assert.match(iv, /red[^.]*\bPR base\b|\bPR base\b[^.]*red/i, 'Principle IV must state the staged base-red rule (red at the PR base)');
  assert.match(iv, /merge-base/, 'Principle IV must say how the PR base is found (merge-base)');
  assert.match(iv, /green at the (PR )?head/i, 'Principle IV must require green at the PR head');
  assert.match(iv, /\.specify\/templates\/overrides\//, 'Principle IV must point to the staged override');
  assert.match(iv, /mandatory[^.]*before_implement|before_implement[^.]*mandatory/i,
    'Principle IV must name the mandatory before_implement hook as enforcement');
  assert.match(iv, /enabled: false/, 'Principle IV must say disabling the hook needs enabled: false');
  assert.match(iv, /reason[^.]*plan|plan[^.]*reason/i, 'Principle IV must require a stated reason in the plan');
});
