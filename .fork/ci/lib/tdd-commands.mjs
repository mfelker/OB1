// Per-runtime commands for the TDD adapter (data-model RuntimeCommand; research R4, R5).
import { existsSync, readFileSync, realpathSync } from 'node:fs';
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

/** Escape the regex metacharacters \\ ^ $ . * + ? ( ) [ ] { } | so the name matches literally. */
export const escapeRegex = s => s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
