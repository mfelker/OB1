import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupFolder } from './helpers/folder.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = join(HERE, '..', 'bin', 'run-folder.mjs');
const SCHEMA = JSON.parse(readFileSync(join(HERE, '..', '..', '..', 'specs', '001-fork-ci', 'contracts', 'result.schema.json'), 'utf8'));
const IN_CI = process.env.CI === 'true';

function have(cmd, args = ['--version']) {
  return spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
}

/** Minimal validator for the result schema: required keys, enums, no extras. */
function validate(result) {
  const check = (obj, schema, where) => {
    for (const k of schema.required) assert.ok(k in obj, `${where}: missing ${k}`);
    for (const k of Object.keys(obj)) assert.ok(k in schema.properties, `${where}: extra key ${k}`);
    for (const [k, p] of Object.entries(schema.properties)) {
      if (p.enum && k in obj) assert.ok(p.enum.includes(obj[k]), `${where}: ${k}=${obj[k]}`);
    }
  };
  check(result, SCHEMA, 'result');
  for (const rt of result.runtimes) check(rt, SCHEMA.properties.runtimes.items, 'runtime');
}

function runFolder(fixture, { mode = 'strict', origin = 'fork', timeoutSec, path, env } = {}) {
  const f = setupFolder(fixture, path);
  const out = join(mkdtempSync(join(tmpdir(), 'fork-ci-out-')), 'r.json');
  const args = [BIN, '--path', f.path, '--mode', mode, '--origin', origin, '--out', out];
  if (timeoutSec) args.push('--timeout-sec', String(timeoutSec));
  const p = spawnSync(process.execPath, args, { cwd: f.root, encoding: 'utf8', env: env ?? process.env });
  assert.equal(p.status, 0, `run-folder exits 0 once a result is written\n${p.stderr}`);
  const result = JSON.parse(readFileSync(out, 'utf8'));
  validate(result);
  return result;
}

test('passing node-plain tests → pass', () => {
  const r = runFolder('node-plain');
  assert.equal(r.outcome, 'pass');
  assert.equal(r.path, 'recipes/fx');
  assert.equal(r.runtimes[0].kind, 'node-plain');
  assert.equal(r.runtimes[0].outcome, 'pass');
});

test('failing tests → fail with output excerpt', () => {
  const r = runFolder('node-plain-failing');
  assert.equal(r.outcome, 'fail');
  assert.match(r.runtimes[0].outputExcerpt, /fail/i);
});

test('slow tests past --timeout-sec → timeout', () => {
  const r = runFolder('node-plain-slow', { timeoutSec: 1 });
  assert.equal(r.outcome, 'timeout');
});

test('node-script with an uninstallable dependency → setup', () => {
  const f = setupFolder('node-script');
  const pkg = JSON.parse(readFileSync(join(f.abs, 'package.json'), 'utf8'));
  pkg.dependencies = { 'fork-ci-definitely-not-a-real-package-zz9': '1.0.0' };
  writeFileSync(join(f.abs, 'package.json'), JSON.stringify(pkg));
  const out = join(mkdtempSync(join(tmpdir(), 'fork-ci-out-')), 'r.json');
  const p = spawnSync(process.execPath, [BIN, '--path', f.path, '--mode', 'strict', '--origin', 'fork', '--out', out], { cwd: f.root, encoding: 'utf8' });
  assert.equal(p.status, 0);
  const r = JSON.parse(readFileSync(out, 'utf8'));
  validate(r);
  assert.equal(r.outcome, 'setup');
});

test('node-script with passing tests → pass', () => {
  assert.equal(runFolder('node-script').outcome, 'pass');
});

const pythonOk = have('python3') ;
test('python-tested → pass (pytest in a throwaway venv)', { skip: !pythonOk && !IN_CI && 'python3 not available' }, () => {
  assert.ok(pythonOk, 'python3 is required in CI');
  const r = runFolder('python-tested');
  assert.equal(r.runtimes[0].kind, 'python');
  assert.equal(r.outcome, 'pass', r.runtimes[0].outputExcerpt);
});

const denoOk = have('deno');
test('deno-tested → pass', { skip: !denoOk && !IN_CI && 'deno not available' }, () => {
  assert.ok(denoOk, 'deno is required in CI');
  const r = runFolder('deno-tested');
  assert.equal(r.outcome, 'pass', r.runtimes[0].outputExcerpt);
});

// ---- US2: untested code is caught (T027) ----

test('US2: deno code without tests → no-tests naming the runtime', () => {
  const r = runFolder('deno-untested');
  assert.equal(r.outcome, 'no-tests');
  assert.equal(r.reason, 'no tests for deno code');
  assert.equal(r.runtimes[0].reason, 'no tests for deno code');
});

test('US2: mixed server-like folder → node passes, deno untested, folder no-tests', () => {
  const r = runFolder('mixed-server', { path: 'server' });
  const kind = k => r.runtimes.find(x => x.kind === k);
  assert.equal(kind('node-script').outcome, 'pass');
  assert.equal(kind('deno').outcome, 'no-tests');
  assert.equal(r.outcome, 'no-tests');
  assert.equal(r.reason, 'no tests for deno code');
});

test('US2: docs-only and config-only folders are exempt (docs-only)', () => {
  for (const fx of ['docs-only', 'config-only']) {
    const r = runFolder(fx);
    assert.equal(r.outcome, 'exempt', fx);
    assert.deepEqual(r.runtimes, [], fx);
    assert.equal(r.reason, 'docs-only (no executable code)', fx);
  }
});

test('US2: test files with no applicable runner → setup with a clear reason', () => {
  const r = runFolder('tests-no-runner');
  assert.equal(r.outcome, 'setup');
  assert.equal(r.reason, 'tests found but no runner configured');
});

// ---- SQL (T048) ----

test('SQL: SQL-only folder without verify script → sql-unverified even in strict mode', () => {
  const r = runFolder('sql-only');
  assert.equal(r.outcome, 'sql-unverified');
  assert.equal(r.reason, 'SQL unverified (no tests/verify.sql)');
  assert.equal(r.runtimes[0].kind, 'sql');
});

test('SQL: the bootstrap is applied before any runtime runs, so node tests that use Postgres see its roles', () => {
  // Stub psql: logs every call and succeeds, so no real Postgres is needed.
  const bin = mkdtempSync(join(tmpdir(), 'fork-ci-psql-'));
  const log = join(bin, 'psql.log');
  writeFileSync(join(bin, 'psql'), '#!/bin/sh\necho "$*" >> "$PSQL_LOG"\n', { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, PSQL_LOG: log };
  const r = runFolder('sql-verify-node', { env });
  const node = r.runtimes.find(rt => rt.kind === 'node-plain');
  assert.equal(node.outcome, 'pass', node.outputExcerpt);
  assert.equal(r.runtimes.find(rt => rt.kind === 'sql').outcome, 'pass');
  const calls = readFileSync(log, 'utf8').trim().split('\n');
  assert.equal(calls.filter(c => c.includes('bootstrap.sql')).length, 1, `bootstrap applied exactly once:\n${calls.join('\n')}`);
});
