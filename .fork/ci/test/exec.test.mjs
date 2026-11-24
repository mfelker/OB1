import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../lib/exec.mjs';

test('captures exit code and output', async () => {
  const r = await runCommand(['node', '-e', 'console.log("hi"); process.exit(3)'], { cwd: process.cwd(), timeoutSec: 10 });
  assert.equal(r.code, 3);
  assert.equal(r.timedOut, false);
  assert.match(r.tail, /hi/);
  assert.ok(Number.isInteger(r.durationMs));
});

test('tail keeps only the last 60 lines', async () => {
  const r = await runCommand(['node', '-e', 'for (let i = 1; i <= 100; i++) console.log("line" + i)'], { cwd: process.cwd(), timeoutSec: 10 });
  const ls = r.tail.trim().split('\n');
  assert.equal(ls.length, 60);
  assert.equal(ls[0], 'line41');
  assert.equal(ls.at(-1), 'line100');
});

test('timeout kills the whole process tree and reports timedOut', async () => {
  const start = Date.now();
  const r = await runCommand(['sh', '-c', 'sleep 30 & wait'], { cwd: process.cwd(), timeoutSec: 1 });
  assert.equal(r.timedOut, true);
  assert.ok(Date.now() - start < 5000, 'returned promptly');
});

test('a missing executable is reported as a non-zero code, not a throw', async () => {
  const r = await runCommand(['fork-ci-no-such-binary'], { cwd: process.cwd(), timeoutSec: 5 });
  assert.notEqual(r.code, 0);
  assert.equal(r.notFound, true);
});
