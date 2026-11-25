// Per-runtime commands for the TDD adapter (data-model RuntimeCommand; research R4, R5).
import { existsSync, realpathSync } from 'node:fs';
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
