#!/usr/bin/env node
// TDD adapter: run the active feature's tests in its plan's worktree and folder (contracts/tdd-adapter-cli.md).
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFolder, resolveTarget, TargetError } from '../lib/tdd-target.mjs';
import { buildCommand, resolveFile, runtimeFor } from '../lib/tdd-commands.mjs';
import { childEnv } from '../lib/tdd-env.mjs';
import { scanRuntimes } from '../lib/runtimes.mjs';

const REPO_ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
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

function where() {
  const target = resolveTarget({ repoRoot: REPO_ROOT, env: process.env });
  const runtimes = target.folderExists
    ? scanRuntimes(join(target.tree, target.folder), target.folder).map(({ kind, root, testFiles }) => ({ kind, root, testFiles }))
    : [];
  process.stdout.write(`${JSON.stringify({ ...target, runtimes })}\n`);
  return 0;
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
      process.stdout.write(`[tdd] ${op} ${cmd.kind}: → fail: python venv setup failed\n`);
      return 1;
    }
    env = { ...env, VIRTUAL_ENV: cmd.venv.dir, PATH: `${join(cmd.venv.dir, 'bin')}${delimiter}${env.PATH ?? ''}` };
  }
  const r = await run(cmd.argv, { cwd: cmd.cwd, env });
  const counts = r.notFound ? null : cmd.countParser(r.output, r.code);
  let exit; let result;
  if (r.notFound) { exit = 1; result = `fail: runner not found: ${cmd.argv[0]}`; }
  else if (counts === null) { exit = 1; result = 'fail: test counts unreadable'; }
  else if (counts.failed > 0) { exit = 1; result = 'fail'; }
  else if (counts.tests === 0 && (r.code === 0 || ZERO_EXIT[cmd.kind] === r.code)) {
    exit = 3; result = op === 'single' ? `no tests matched "${name}"` : 'no tests matched';
  }
  else if (r.code !== 0 || counts.tests === 0) { exit = 1; result = `fail (exit ${r.code})`; }
  else { exit = 0; result = 'pass'; }
  const n = counts ?? { tests: '?', passed: '?', failed: '?' };
  process.stdout.write(`[tdd] ${op} ${cmd.kind}: tests=${n.tests} pass=${n.passed} fail=${n.failed} → ${result}\n`);
  return exit;
}

async function main(argv) {
  const [op, ...rest] = argv;
  try {
    if (op === 'where') return where();
    if (op === 'single') return await runTests('single', rest[0], rest[1]);
    if (op === 'file') return await runTests('file', rest[0]);
    return 0;
  } catch (err) {
    if (err instanceof TargetError) {
      process.stderr.write(`tdd: ${err.message}\n`);
      return 2;
    }
    throw err;
  }
}

process.exitCode = await main(process.argv.slice(2));
