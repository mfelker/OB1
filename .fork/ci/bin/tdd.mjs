#!/usr/bin/env node
// TDD adapter: run the active feature's tests in its plan's worktree and folder (contracts/tdd-adapter-cli.md).
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFolder, resolveTarget, TargetError } from '../lib/tdd-target.mjs';
import { buildCommand, resolveFile, runtimeFor, suiteCounts } from '../lib/tdd-commands.mjs';
import { childEnv } from '../lib/tdd-env.mjs';
import { scanRuntimes } from '../lib/runtimes.mjs';

const BIN_DIR = dirname(fileURLToPath(import.meta.url));
const RUN_FOLDER = join(BIN_DIR, 'run-folder.mjs');
const REPO_ROOT = realpathSync(resolve(BIN_DIR, '..', '..', '..'));
// pytest's "no tests collected"; every other runtime's zero-match exits 0.
const ZERO_EXIT = { python: 5 };

/** Run argv, streaming stdout/stderr live while capturing all of it (nothing is truncated). */
function run(argv, { cwd, env }) {
  return new Promise(done => {
    let output = '';
    const child = spawn(argv[0], argv.slice(1), { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', d => { output += d; process.stdout.write(d); });
    child.stderr.on('data', d => { output += d; process.stderr.write(d); });
    child.on('error', err => done({ code: 127, output: `${output}${err.message}\n`, notFound: err.code === 'ENOENT' }));
    child.on('close', (code, signal) => done({ code: code ?? (signal ? 137 : 1), output }));
  });
}

/** Create or refresh the cached pytest venv when its requirements stamp is stale (R5). */
async function ensureVenv(venv, cwd, env) {
  const stamp = join(venv.dir, '.fork-tdd-stamp');
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === venv.requirementsHash) return true;
  rmSync(venv.dir, { recursive: true, force: true });
  if ((await run(['python3', '-m', 'venv', venv.dir], { cwd, env })).code !== 0) return false;
  const pip = [join(venv.dir, 'bin', 'python'), '-m', 'pip', 'install', '-q', 'pytest'];
  if (venv.requirements) pip.push('-r', venv.requirements);
  if ((await run(pip, { cwd, env })).code !== 0) return false;
  writeFileSync(stamp, venv.requirementsHash);
  return true;
}

/** `feature=<featureDir rel> folder=<folder>`, so a run against the wrong feature is visible (R2). */
const label = t => `feature=${relative(t.repoRoot, t.featureDir).split(sep).join('/')} folder=${t.folder}`;

function where() {
  const target = resolveTarget({ repoRoot: REPO_ROOT, env: process.env });
  const runtimes = target.folderExists
    ? scanRuntimes(join(target.tree, target.folder), target.folder).map(({ kind, root, testFiles }) => ({ kind, root, testFiles }))
    : [];
  process.stdout.write(`${JSON.stringify({ ...target, runtimes })}\n`);
  return 0;
}

/** [exit, result] for a run's counts: never a pass without a clean exit and at least one test. */
function outcome(counts, code, kind, op, name) {
  if (counts === null) return [1, 'fail: test counts unreadable'];
  if (counts.failed > 0) return [1, 'fail'];
  if (counts.tests === 0 && (code === 0 || ZERO_EXIT[kind] === code)) {
    return [3, op === 'single' ? `no tests matched "${name}"` : 'no tests matched'];
  }
  if (code !== 0 || counts.tests === 0) return [1, `fail (exit ${code})`];
  return [0, 'pass'];
}

/** `single <file> <name>` / `file <file>`: exit 0 pass, 1 fail, 3 zero tests, 4 unsupported. */
async function runTests(op, file, name) {
  const target = requireFolder(resolveTarget({ repoRoot: REPO_ROOT, env: process.env }));
  const fileAbs = resolveFile(file, target);
  const runtime = runtimeFor(fileAbs, target);
  const cmd = buildCommand({ op, runtime, tree: realpathSync(target.tree), file: fileAbs, name });
  if (cmd.unsupported) {
    process.stderr.write(`tdd: ${op} unsupported for ${cmd.kind}: ${cmd.unsupported}\n`);
    return 4;
  }
  let env = childEnv(process.env);
  if (cmd.venv) {
    if (!(await ensureVenv(cmd.venv, cmd.cwd, env))) {
      process.stdout.write(`[tdd] ${op} ${cmd.kind} ${label(target)}: → fail: python venv setup failed\n`);
      return 1;
    }
    env = { ...env, VIRTUAL_ENV: cmd.venv.dir, PATH: `${join(cmd.venv.dir, 'bin')}${delimiter}${env.PATH ?? ''}` };
  }
  const r = await run(cmd.argv, { cwd: cmd.cwd, env });
  const counts = r.notFound ? null : cmd.countParser(r.output, r.code);
  const [exit, result] = r.notFound ? [1, `fail: runner not found: ${cmd.argv[0]}`] : outcome(counts, r.code, cmd.kind, op, name);
  const n = counts ?? { tests: '?', passed: '?', failed: '?' };
  process.stdout.write(`[tdd] ${op} ${cmd.kind} ${label(target)}: tests=${n.tests} pass=${n.passed} fail=${n.failed} → ${result}\n`);
  return exit;
}

// run-folder outcome → [exit, summary] (data-model SuiteResult; R6).
const SUITE = {
  pass: [0, 'pass'],
  'sql-unverified': [0, 'sql-unverified'],
  'no-tests': [0, 'empty baseline: no tests yet'],
  exempt: [0, 'empty baseline: docs-only'],
};

const LOCKFILES = new Set(['package-lock.json', 'deno.lock']);

/** Tracked lockfiles under the folder with no uncommitted change (R6). */
function cleanLockfiles(tree, folder) {
  const git = args => execFileSync('git', args, { cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const tracked = git(['ls-files', '-z', '--', folder]).split('\0').filter(f => LOCKFILES.has(f.slice(f.lastIndexOf('/') + 1)));
    const dirty = new Set(git(['diff', '--name-only', '-z', 'HEAD', '--', folder]).split('\0'));
    return tracked.filter(f => !dirty.has(f));
  } catch {
    return []; // not a git checkout: nothing to restore
  }
}

/** Restore the lockfiles that were clean before the run and changed during it (adapter A21). */
function restoreLockfiles(tree, wereClean) {
  for (const file of wereClean) {
    try {
      execFileSync('git', ['diff', '--quiet', 'HEAD', '--', file], { cwd: tree, stdio: 'ignore' });
    } catch {
      execFileSync('git', ['checkout', 'HEAD', '--', file], { cwd: tree, stdio: 'ignore' });
      process.stdout.write(`[tdd] restored ${file}\n`);
    }
  }
}

/** `suite`: delegate to run-folder in the target tree, with childEnv; an empty baseline is green. */
async function suite() {
  const target = resolveTarget({ repoRoot: REPO_ROOT, env: process.env });
  if (!target.folderExists) {
    process.stdout.write(`[tdd] suite ${label(target)} → empty baseline: folder does not exist yet\n`);
    return 0;
  }
  const out = join(mkdtempSync(join(tmpdir(), 'fork-tdd-suite-')), 'result.json');
  const argv = [process.execPath, RUN_FOLDER, '--path', target.folder, '--mode', 'strict', '--origin', 'fork', '--out', out];
  const wereClean = cleanLockfiles(target.tree, target.folder);
  await run(argv, { cwd: target.tree, env: childEnv(process.env) });
  restoreLockfiles(target.tree, wereClean);
  let result;
  try {
    result = JSON.parse(readFileSync(out, 'utf8'));
  } catch {
    process.stdout.write(`[tdd] suite ${label(target)} → setup: run-folder wrote no result\n`);
    return 1;
  }
  for (const rt of result.runtimes) process.stdout.write(`[tdd] suite ${rt.kind} ${rt.root}: ${rt.outcome} (${rt.reason})\n`);
  if (result.outcome === 'sql-unverified') process.stdout.write('[tdd] sql unverified (advisory)\n');
  const [exit, summary] = SUITE[result.outcome] ?? [1, `${result.outcome}: ${result.reason}`];
  process.stdout.write(`[tdd] suite ${label(target)}${suiteCounts(result.runtimes)} → ${summary}\n`);
  return exit;
}

const USAGE = 'usage: tdd.mjs where | single <file> <name> | file <file> | suite';
const MIN_NODE = 26;

/** A usage or version error: one line on stderr, exit 2. */
class UsageError extends Error {}

function parseArgs([op, ...rest]) {
  if (op === undefined) throw new UsageError('missing subcommand');
  if (op === 'single' && rest.length < 2) throw new UsageError('single needs <file> <name>');
  if (op === 'file' && rest.length < 1) throw new UsageError('file needs <file>');
  if (!['where', 'single', 'file', 'suite'].includes(op)) throw new UsageError(`unknown subcommand "${op}"`);
  return { op, file: rest[0], name: rest[1] };
}

async function main(argv) {
  try {
    const major = Number(process.versions.node.split('.')[0]);
    if (major < MIN_NODE) throw new TargetError(`requires Node >= ${MIN_NODE} (found ${process.versions.node})`);
    const { op, file, name } = parseArgs(argv);
    if (op === 'where') return where();
    if (op === 'suite') return await suite();
    return await runTests(op, file, name);
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`tdd: ${err.message}; ${USAGE}\n`);
      return 2;
    }
    if (err instanceof TargetError) {
      process.stderr.write(`tdd: ${err.message}\n`);
      return 2;
    }
    throw err;
  }
}

process.exitCode = await main(process.argv.slice(2));
