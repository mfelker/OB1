// Per-runtime commands for the TDD adapter (data-model RuntimeCommand; research R4, R5).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, sep } from 'node:path';
import { scanRuntimes, SQL_VERIFY, TEST_PATTERNS } from './runtimes.mjs';
import { TargetError } from './tdd-target.mjs';

const inside = (dir, path) => path === dir || path.startsWith(`${dir}${sep}`);

/** Resolve the `file` argument to a real absolute path inside the target tree (R4, adapter A15/A16). */
export function resolveFile(file, target) {
  const candidates = isAbsolute(file)
    ? [file]
    : [join(target.tree, target.folder, file), join(target.tree, file), join(target.repoRoot, file)];
  const hit = candidates.find(c => existsSync(c));
  if (hit === undefined) throw new TargetError(`file not found: ${file}`);
  const real = realpathSync(hit);
  if (!inside(realpathSync(target.tree), real)) throw new TargetError(`${file} is outside the target tree ${target.tree}`);
  return real;
}

/** The scanRuntimes entry of the target folder that owns `fileAbs` as a test file (R4, adapter A6). */
export function runtimeFor(fileAbs, target) {
  const tree = realpathSync(target.tree);
  const rel = relative(tree, fileAbs).split(sep).join('/');
  const owner = scanRuntimes(join(tree, target.folder), target.folder)
    .find(rt => rel.startsWith(`${rt.root}/`) && rt.testFiles.includes(rel.slice(rt.root.length + 1)));
  if (owner) return owner;
  const patterns = [...Object.entries(TEST_PATTERNS).map(([kind, rx]) => `${kind} ${rx.source}`), `sql ${SQL_VERIFY}`].join('; ');
  throw new TargetError(`${rel} is not a test file of any runtime in ${target.folder} (patterns: ${patterns})`);
}

/** The RuntimeCommand for `single`/`file` on one test file (data-model RuntimeCommand; R5). */
export function buildCommand({ op, runtime, tree, file, name }) {
  const cwd = join(tree, runtime.root);
  const rel = relative(cwd, file).split(sep).join('/');
  const base = { op, cwd, unsupported: null };
  if (runtime.kind === 'python') {
    const venv = pythonVenv(cwd);
    const argv = [join(venv.dir, 'bin', 'python'), '-m', 'pytest', '-q', ...(op === 'single' ? ['-k', name] : []), rel];
    return { ...base, kind: 'python', argv, venv, countParser: pytestCounts };
  }
  if (runtime.kind === 'sql') {
    const unsupported = op === 'single' ? `${SQL_VERIFY} is one script, no named tests; use \`file\`` : null;
    return { ...base, kind: 'sql', argv: runtime.command, countParser: sqlCounts, unsupported };
  }
  if (runtime.kind === 'node-script') return nodeScriptCommand(base, cwd, rel, op, name);
  if (runtime.kind === 'deno') {
    const argv = [...runtime.command, ...(op === 'single' ? ['--filter', name] : []), rel];
    return { ...base, kind: 'deno', argv, countParser: denoCounts };
  }
  if (!USES_NODE_TEST.test(readFileSync(file, 'utf8'))) {
    const argv = [process.execPath, '--test', '--test-reporter=spec', rel];
    return { ...base, kind: 'plain-script', argv, countParser: nodeCounts, unsupported: op === 'single' ? 'plain script, no named tests; use `file`' : null };
  }
  const argv = [process.execPath, '--test', '--test-isolation=none', '--test-reporter=spec'];
  if (op === 'single') argv.push(`--test-name-pattern=^${escapeRegex(name)}$`);
  argv.push(rel);
  return { ...base, kind: 'node-test', argv, countParser: nodeCounts };
}

const USES_NODE_TEST = /(from\s*|require\(\s*|import\(\s*)['"]node:test['"]/;

/** The last value of a `ℹ <label> N` summary line, or undefined. */
const lastCount = (output, label) => {
  const all = [...output.matchAll(new RegExp(`^ℹ ${label} (\\d+)\\s*$`, 'gm'))];
  return all.length ? Number(all.at(-1)[1]) : undefined;
};

/** node --test spec reporter: the last `ℹ tests/pass/fail N` lines; null when any is missing. */
function nodeCounts(output) {
  const [tests, passed, failed] = ['tests', 'pass', 'fail'].map(l => lastCount(output, l));
  return [tests, passed, failed].includes(undefined) ? null : { tests, passed, failed };
}

/** vitest / jest from the root's package.json (test script or dependencies); null for any other runner. */
function nodeScriptRunner(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const script = pkg.scripts?.test ?? '';
  return ['vitest', 'jest'].find(r => script.includes(r) || r in deps) ?? null;
}

function nodeScriptCommand(base, cwd, rel, op, name) {
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  const runner = nodeScriptRunner(pkg);
  const nameArgs = op === 'single' ? ['-t', name] : [];
  if (runner === 'vitest') return { ...base, kind: 'node-script', argv: ['npx', 'vitest', 'run', rel, ...nameArgs], countParser: vitestCounts };
  if (runner === 'jest') return { ...base, kind: 'node-script', argv: ['npx', 'jest', rel, ...nameArgs], countParser: jestCounts };
  return {
    ...base,
    kind: 'node-script',
    argv: ['npm', 'test', '--', rel],
    countParser: nodeCounts,
    unsupported: op === 'single' ? `test runner "${pkg.scripts.test}" has no single-test filter; use \`file\`` : null,
  };
}

/** A runner summary: `zero` text means no tests; otherwise the last line matching `lineRx`; skipped tests not counted. */
function summaryCounts(output, zero, lineRx) {
  const text = output.replace(ANSI, '');
  if (zero.test(text)) return { tests: 0, passed: 0, failed: 0 };
  const line = text.split('\n').reverse().find(l => lineRx.test(l));
  if (!line) return null;
  const [passed, failed] = [countOf(line, 'passed'), countOf(line, 'failed')];
  return { tests: passed + failed, passed, failed };
}

/** vitest: the last `Tests  … (N)` line; "No test files found" is zero. */
const vitestCounts = output => summaryCounts(output, /No test files found/, /^\s*Tests\s+.*\(\d+\)\s*$/);

/** jest: the last `Tests: … N total` line; "No tests found" is zero. */
const jestCounts = output => summaryCounts(output, /No tests found/, /^\s*Tests:\s+.*\d+ total/);

/** psql verify: one script, so exit 0 is one pass and anything else one failure. */
const sqlCounts = (output, exitCode) => (exitCode === 0 ? { tests: 1, passed: 1, failed: 0 } : { tests: 1, passed: 0, failed: 1 });

/** The number before `word` in a summary line (0 when absent). */
const countOf = (line, word) => Number(new RegExp(`(\\d+) ${word}`).exec(line)?.[1] ?? 0);

const ANSI = /\u001b\[[0-9;]*m/g;

/** deno test: the last `N passed | M failed` summary; "No test modules found" is zero. */
function denoCounts(output) {
  const text = output.replace(ANSI, '');
  if (/No test modules found/.test(text)) return { tests: 0, passed: 0, failed: 0 };
  const all = [...text.matchAll(/(\d+) passed \| (\d+) failed/g)];
  if (!all.length) return null;
  const [passed, failed] = all.at(-1).slice(1).map(Number);
  return { tests: passed + failed, passed, failed };
}

const sha1 = text => createHash('sha1').update(text).digest('hex');

/** The cached venv for a python runtime root, in the per-user cache: keyed by its path; rebuilt when the requirements hash changes (R5). */
function pythonVenv(cwd) {
  const reqPath = join(cwd, 'requirements.txt');
  const requirements = existsSync(reqPath) ? 'requirements.txt' : null;
  const requirementsHash = sha1(requirements ? readFileSync(reqPath, 'utf8') : '');
  // Per-user cache, never the shared temp dir: a predictable path there could be pre-created by another user.
  const cache = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
  return { dir: join(cache, 'fork-tdd', `venv-${sha1(cwd)}`), requirements, requirementsHash };
}

/** pytest -q: exit 5 is "no tests collected"; otherwise the last summary's passed / failed + error counts. */
function pytestCounts(output, exitCode) {
  if (exitCode === 5) return { tests: 0, passed: 0, failed: 0 };
  const line = output.split('\n').reverse().find(l => / in [\d.]+s/.test(l) && /\d+ (passed|failed|error)/.test(l));
  if (!line) return null;
  const n = word => countOf(line, word);
  const passed = n('passed');
  const failed = n('failed') + n('error');
  return { tests: passed + failed, passed, failed };
}

/** Escape the regex metacharacters \\ ^ $ . * + ? ( ) [ ] { } | so the name matches literally. */
export const escapeRegex = s => s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

/** Count parsers for run-folder's runtime kinds (`suite`); node-script's runner is unknown there, so it has none. */
const SUITE_COUNT_PARSERS = { 'node-plain': nodeCounts, deno: denoCounts, python: pytestCounts, sql: sqlCounts };

/**
 * `: tests=N pass=N fail=N` summed over the runtimes whose tests ran (pass or fail), parsed from
 * run-folder's output excerpts; `?` when any of them can't be parsed; '' when none ran.
 */
export function suiteCounts(runtimes) {
  const ran = runtimes.filter(rt => rt.outcome === 'pass' || rt.outcome === 'fail');
  if (!ran.length) return '';
  const parsed = ran.map(rt => SUITE_COUNT_PARSERS[rt.kind]?.(rt.outputExcerpt ?? '', rt.outcome === 'pass' ? 0 : 1) ?? null);
  if (parsed.includes(null)) return ': tests=? pass=? fail=?';
  const sum = key => parsed.reduce((n, c) => n + c[key], 0);
  return `: tests=${sum('tests')} pass=${sum('passed')} fail=${sum('failed')}`;
}
