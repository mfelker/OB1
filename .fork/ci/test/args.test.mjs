import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCli, UsageError } from '../lib/args.mjs';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin');

test('detect: pull_request requires --base and --head', () => {
  assert.throws(() => parseCli('detect', ['--event', 'pull_request', '--upstream-ref', 'u']), UsageError);
  const a = parseCli('detect', ['--event', 'pull_request', '--base', 'b', '--head', 'h', '--upstream-ref', 'u']);
  assert.deepEqual(a, { event: 'pull_request', base: 'b', head: 'h', 'upstream-ref': 'u' });
});

test('detect: push requires --before and --after; event must be valid', () => {
  assert.throws(() => parseCli('detect', ['--event', 'push', '--upstream-ref', 'u']), UsageError);
  assert.throws(() => parseCli('detect', ['--event', 'tag', '--upstream-ref', 'u']), UsageError);
  assert.equal(parseCli('detect', ['--event', 'push', '--before', 'x', '--after', 'y', '--upstream-ref', 'u']).after, 'y');
});

test('run-folder: validates mode/origin enums and defaults timeout', () => {
  const ok = ['--path', 'recipes/a', '--mode', 'strict', '--origin', 'fork', '--out', 'r.json'];
  assert.equal(parseCli('run-folder', ok)['timeout-sec'], '600');
  assert.throws(() => parseCli('run-folder', ['--path', 'recipes/a', '--mode', 'lax', '--origin', 'fork', '--out', 'r']), UsageError);
  assert.throws(() => parseCli('run-folder', ['--path', 'recipes/a', '--mode', 'strict', '--origin', 'fork']), UsageError);
});

test('verdict: job results must be valid; --upstream-ref required with --bypass-range', () => {
  const base = ['--detect', 'd.json', '--results', 'r', '--detect-result', 'success', '--test-result', 'skipped',
    '--test-sql-result', 'skipped', '--self-test-result', 'skipped', '--summary', 's.md'];
  assert.equal(parseCli('verdict', base)['test-result'], 'skipped');
  assert.throws(() => parseCli('verdict', base.map(a => (a === 'skipped' ? 'meh' : a))), UsageError);
  assert.throws(() => parseCli('verdict', [...base, '--bypass-range', 'a..b']), UsageError);
  assert.equal(parseCli('verdict', [...base, '--bypass-range', 'a..b', '--upstream-ref', 'u'])['bypass-range'], 'a..b');
});

test('unknown options are usage errors', () => {
  assert.throws(() => parseCli('detect', ['--nope', 'x']), UsageError);
});

for (const name of ['detect', 'run-folder', 'verdict']) {
  test(`bin/${name}.mjs exits 2 with a usage message on bad args`, () => {
    const r = spawnSync(process.execPath, [join(BIN, `${name}.mjs`)], { encoding: 'utf8' });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /usage/i);
  });
}
