// Changed files for a PR or a push (research R3; data-model Changed Folder.changedFiles/status).
import { execFileSync } from 'node:child_process';

export const ZERO_SHA = '0000000000000000000000000000000000000000';

export class GitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GitError';
    this.exitCode = 3;
  }
}

export function runGit(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    throw new GitError(`git ${args.join(' ')} failed: ${(err.stderr || err.message || '').toString().trim()}`);
  }
}

function lines(out) {
  return out ? out.split('\n').filter(Boolean) : [];
}

function hasParent(cwd, sha) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${sha}^`], { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * List changed paths (sorted, unique).
 * PR:   base...head (from the merge-base)
 * push: before..after; zero `before` → after~1..after; root commit → all its files.
 */
export function changedFiles(cwd, { event, base, head, before, after }) {
  let out;
  if (event === 'pull_request') {
    out = runGit(cwd, ['diff', '--name-only', '--no-renames', `${base}...${head}`]);
  } else {
    const isZero = !before || /^0+$/.test(before);
    if (isZero && !hasParent(cwd, after)) {
      out = runGit(cwd, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', after]);
    } else {
      const from = isZero ? `${after}~1` : before;
      out = runGit(cwd, ['diff', '--name-only', '--no-renames', `${from}..${after}`]);
    }
  }
  return [...new Set(lines(out))].sort();
}

/** 'present' if the folder exists in the tree at `ref`, else 'removed'. */
export function folderStatus(cwd, ref, folder) {
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}:${folder}`], { cwd, stdio: 'ignore' });
    return 'present';
  } catch {
    return 'removed';
  }
}
