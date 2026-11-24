// Folder scan → runtimes (research R7/R8; data-model Runtime.kind/root/codeFiles/testFiles/command).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, posix } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', '.venv', 'venv', '.deno']);
const CODE_EXT = /\.(ts|tsx|js|mjs|cjs|py|svelte)$/;
const NOT_CODE = [/\.d\.ts$/, /\.config\.(js|mjs|cjs|ts)$/];
const TEST_PATTERNS = {
  deno: /(_test|\.test|\.spec)\.(ts|tsx|js|mjs)$/,
  'node-script': /(\.(test|spec)\.(ts|tsx|js|mjs|cjs)$)|(^test-[^/]*\.mjs$)/,
  'node-plain': /(\.(test|spec)\.(ts|tsx|js|mjs|cjs)$)|(^test-[^/]*\.mjs$)/,
  python: /(^test_[^/]*\.py$)|(_test\.py$)/,
};
const NODE_RUNNABLE = /\.(js|mjs|cjs)$/;
const NPM_DEFAULT_TEST = /no test specified/;

const basename = p => p.slice(p.lastIndexOf('/') + 1);

/** Recursively list files (posix paths relative to dir), skipping dependency/cache dirs. */
export function listFiles(dir, rel = '') {
  const out = [];
  for (const ent of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) out.push(...listFiles(dir, r));
    } else if (ent.isFile()) {
      out.push(r);
    }
  }
  return out;
}

function hasTestScript(pkgPath) {
  try {
    const t = JSON.parse(readFileSync(pkgPath, 'utf8'))?.scripts?.test;
    return typeof t === 'string' && t.trim() !== '' && !NPM_DEFAULT_TEST.test(t);
  } catch {
    return false;
  }
}

const depth = d => (d === '' ? 0 : d.split('/').length);
const contains = (rootDir, file) => rootDir === '' || file.startsWith(`${rootDir}/`);

/**
 * Scan one contribution folder into runtimes.
 * @param {string} folderAbs absolute folder path
 * @param {string} folderRel repo-relative folder path (e.g. "recipes/x")
 */
export function scanRuntimes(folderAbs, folderRel) {
  const files = listFiles(folderAbs);
  const dirsOf = name => files.filter(f => basename(f) === name).map(f => posix.dirname(f)).map(d => (d === '.' ? '' : d));
  const denoRoots = new Set([...dirsOf('deno.json'), ...dirsOf('deno.jsonc')]);
  const nodeRoots = new Set(dirsOf('package.json').filter(d => hasTestScript(join(folderAbs, d, 'package.json'))));
  const allRoots = [...new Set([...denoRoots, ...nodeRoots])].sort((a, b) => depth(b) - depth(a));

  const buckets = new Map(); // key kind|rootDir → { kind, rootDir, files[] }
  const add = (kind, rootDir, file) => {
    const key = `${kind}|${rootDir}`;
    if (!buckets.has(key)) buckets.set(key, { kind, rootDir, files: [] });
    buckets.get(key).files.push(file);
  };

  for (const f of files) {
    if (!CODE_EXT.test(f)) continue;
    if (f.endsWith('.py')) { add('python', '', f); continue; }
    const rootDir = allRoots.find(r => contains(r, f));
    if (rootDir === undefined) { add('node-plain', '', f); continue; }
    const isDeno = denoRoots.has(rootDir);
    const isNode = nodeRoots.has(rootDir);
    if (isDeno && isNode) add(/\.(ts|tsx)$/.test(f) ? 'deno' : 'node-script', rootDir, f);
    else add(isDeno ? 'deno' : 'node-script', rootDir, f);
  }

  const runtimes = [];
  for (const { kind, rootDir, files: owned } of buckets.values()) {
    const local = owned.map(f => (rootDir === '' ? f : f.slice(rootDir.length + 1)));
    const testFiles = local.filter(f => TEST_PATTERNS[kind].test(basename(f))).sort();
    const codeFiles = local.filter(f => !testFiles.includes(f) && !NOT_CODE.some(rx => rx.test(f))).sort();
    if (codeFiles.length === 0 && testFiles.length === 0) continue;
    runtimes.push({
      kind,
      root: rootDir === '' ? folderRel : `${folderRel}/${rootDir}`,
      codeFiles,
      testFiles,
      command: commandFor(kind, testFiles),
    });
  }
  return runtimes.sort((a, b) => a.kind.localeCompare(b.kind) || a.root.localeCompare(b.root));
}

function commandFor(kind, testFiles) {
  switch (kind) {
    case 'deno':
      return ['deno', 'test', '--node-modules-dir=none', '--no-prompt', '--allow-env', '--allow-read'];
    case 'node-script':
      return ['npm', 'test'];
    case 'node-plain': {
      const runnable = testFiles.filter(f => NODE_RUNNABLE.test(f));
      return runnable.length ? ['node', '--test', ...runnable] : null;
    }
    case 'python':
      return ['python', '-m', 'pytest', '-q'];
    default:
      return null;
  }
}

export function hasRequirements(rootAbs) {
  return existsSync(join(rootAbs, 'requirements.txt'));
}
