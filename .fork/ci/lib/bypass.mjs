// Lane-bypass detection on pushes to main (spec FR-012; research R11).
// For each first-parent merge commit M (parents P1, P2) in the pushed range:
//   1. committer GitHub <noreply@github.com>       → merged via PR       → ok
//   2. P2 is an ancestor of the upstream ref        → upstream sync       → ok
//   3. merge-base(P1, P2) is an ancestor of upstream → upstream-based branch
//      (stage/ or contrib/) merged locally          → lane-bypass
//   4. otherwise (branch cut from fork main, i.e. fork/) → ok
import { execFileSync } from 'node:child_process';

const GITHUB_COMMITTER = 'noreply@github.com';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function ok(cwd, args) {
  try {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const isAncestor = (cwd, a, b) => ok(cwd, ['merge-base', '--is-ancestor', a, b]);

function mergesInRange(cwd, range) {
  const [before, after] = range.split('..');
  if (/^0+$/.test(before)) {
    const parents = git(cwd, ['rev-list', '--parents', '-n', '1', after]).split(' ');
    return parents.length > 2 ? [after] : [];
  }
  const out = git(cwd, ['rev-list', '--first-parent', '--merges', `${before}..${after}`]);
  return out ? out.split('\n') : [];
}

/** @returns {{sha:string, branch:string}[]} */
export function findBypasses(cwd, range, upstreamRef) {
  if (!ok(cwd, ['rev-parse', '--verify', '--quiet', upstreamRef])) return [];
  const findings = [];
  for (const sha of mergesInRange(cwd, range)) {
    const [committer, subject] = git(cwd, ['log', '-1', '--format=%ce%n%s', sha]).split('\n');
    if (committer === GITHUB_COMMITTER) continue;
    const [, p1, p2] = git(cwd, ['rev-list', '--parents', '-n', '1', sha]).split(' ');
    if (isAncestor(cwd, p2, upstreamRef)) continue;
    let base;
    try {
      base = git(cwd, ['merge-base', p1, p2]);
    } catch {
      continue;
    }
    if (!isAncestor(cwd, base, upstreamRef)) continue;
    const m = /^Merge branch '([^']+)'/.exec(subject ?? '');
    findings.push({ sha, branch: m ? m[1] : 'unknown' });
  }
  return findings;
}
