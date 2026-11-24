// Upstream vs fork origin of a changed folder (spec FR-010; research R6).
// A folder is upstream-origin when its tree at `head` is identical to its tree at
// U = merge-base(head, upstreamRef). Anything else (including errors) is fork-origin,
// so the safe default is strict.
import { execFileSync } from 'node:child_process';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function treeOf(cwd, rev, folder) {
  try {
    return git(cwd, ['rev-parse', '--verify', '--quiet', `${rev}:${folder}`]);
  } catch {
    return null;
  }
}

/** Merge-base of head and the upstream ref, or null when unavailable. */
export function upstreamBase(cwd, head, upstreamRef) {
  try {
    return git(cwd, ['merge-base', head, upstreamRef]);
  } catch {
    return null;
  }
}

/** @returns {'upstream'|'fork'} */
export function originOf(cwd, head, upstreamRef, folder, base = upstreamBase(cwd, head, upstreamRef)) {
  if (!base) return 'fork';
  const atHead = treeOf(cwd, head, folder);
  const atBase = treeOf(cwd, base, folder);
  return atHead !== null && atHead === atBase ? 'upstream' : 'fork';
}
