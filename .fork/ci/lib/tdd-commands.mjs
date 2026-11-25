// Per-runtime commands for the TDD adapter (data-model RuntimeCommand; research R4, R5).
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, join, sep } from 'node:path';
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
