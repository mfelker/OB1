#!/usr/bin/env node
// Run every runtime of one contribution folder and always write a result (contracts/cli.md).
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { cliArgs } from '../lib/args.mjs';
import { scanRuntimes } from '../lib/runtimes.mjs';
import { runCommand } from '../lib/exec.mjs';
import { worstOutcome } from '../lib/verdict.mjs';

const MAX_EXCERPT = 20_000;
const args = cliArgs('run-folder');
const repoRoot = process.cwd();
const timeoutSec = Number(args['timeout-sec']);
const started = Date.now();

// Clean environment for the folder's own test runners. NODE_TEST_CONTEXT is set by an
// enclosing `node --test` (e.g. fork-ci's self-test); a nested `node --test` that
// inherits it switches to child-reporting mode and misreports its exit status.
const { NODE_TEST_CONTEXT: _ignored, ...BASE_ENV } = process.env;

function excerpt(text) {
  return text.length > MAX_EXCERPT ? text.slice(-MAX_EXCERPT) : text;
}

async function step(argv, cwd, env) {
  return runCommand(argv, { cwd, timeoutSec, env });
}

/** Install dependencies for a runtime; returns { env } or { failure: runtimeResult }. */
async function install(rt, rootAbs) {
  if (rt.kind === 'node-script') {
    const r = await step(['npm', 'install', '--no-audit', '--no-fund', '--loglevel=error'], rootAbs, BASE_ENV);
    if (r.timedOut) return { failure: { outcome: 'timeout', reason: 'npm install timed out', r } };
    if (r.code !== 0) return { failure: { outcome: 'setup', reason: 'npm install failed', r } };
    return { env: BASE_ENV };
  }
  if (rt.kind === 'python') {
    const venv = mkdtempSync(join(tmpdir(), 'fork-ci-venv-'));
    const mk = await step(['python3', '-m', 'venv', venv], rootAbs, BASE_ENV);
    if (mk.code !== 0) return { failure: { outcome: 'setup', reason: 'python venv creation failed', r: mk } };
    const env = { ...BASE_ENV, VIRTUAL_ENV: venv, PATH: `${join(venv, 'bin')}${delimiter}${process.env.PATH}` };
    const pipArgs = ['python', '-m', 'pip', 'install', '-q', 'pytest'];
    if (existsSync(join(rootAbs, 'requirements.txt'))) pipArgs.push('-r', 'requirements.txt');
    const pip = await step(pipArgs, rootAbs, env);
    if (pip.timedOut) return { failure: { outcome: 'timeout', reason: 'pip install timed out', r: pip } };
    if (pip.code !== 0) return { failure: { outcome: 'setup', reason: 'pip install failed', r: pip } };
    return { env };
  }
  return { env: BASE_ENV };
}

async function runRuntime(rt) {
  const rootAbs = join(repoRoot, rt.root);
  const base = { kind: rt.kind, root: rt.root };
  if (rt.testFiles.length === 0) {
    return { ...base, outcome: 'no-tests', reason: 'no tests', durationMs: 0 };
  }
  if (!rt.command) {
    return { ...base, outcome: 'setup', reason: 'no runner', durationMs: 0 };
  }
  const t0 = Date.now();
  const inst = await install(rt, rootAbs);
  if (inst.failure) {
    const { outcome, reason, r } = inst.failure;
    return { ...base, outcome, reason, durationMs: Date.now() - t0, outputExcerpt: excerpt(r.tail) };
  }
  const r = await step(rt.command, rootAbs, inst.env);
  let outcome; let reason;
  if (r.timedOut) { outcome = 'timeout'; reason = `tests exceeded ${timeoutSec}s`; }
  else if (r.notFound) { outcome = 'setup'; reason = `runner not found: ${rt.command[0]}`; }
  else if (r.code === 0) { outcome = 'pass'; reason = 'tests passed'; }
  else if (rt.kind === 'python' && r.code === 5) { outcome = 'no-tests'; reason = 'pytest collected no tests'; }
  else { outcome = 'fail'; reason = `tests failed (exit ${r.code})`; }
  return { ...base, outcome, reason, durationMs: Date.now() - t0, outputExcerpt: excerpt(r.tail) };
}

async function main() {
  let runtimes = [];
  let rtResults = [];
  let outcome; let reason;
  try {
    runtimes = scanRuntimes(join(repoRoot, args.path), args.path);
    for (const rt of runtimes) rtResults.push(await runRuntime(rt));
    outcome = rtResults.length ? worstOutcome(rtResults.map(r => r.outcome)) : 'exempt';
    reason = outcome === 'pass' ? 'all tests passed'
      : outcome === 'exempt' ? 'no executable code'
        : rtResults.find(r => r.outcome === outcome).reason;
  } catch (err) {
    outcome = 'setup';
    reason = `run-folder error: ${err.message}`;
    rtResults = [];
  }
  const result = {
    path: args.path,
    mode: args.mode,
    origin: args.origin,
    outcome,
    reason,
    runtimes: rtResults,
    durationMs: Date.now() - started,
  };
  writeFileSync(args.out, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${args.path}: ${outcome} (${reason})\n`);
}

await main();
