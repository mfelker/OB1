const FORK_ROOTS = new Set(['.fork', '.specify', 'specs', '.worktrees']);

const isForkZone = relPath =>
  relPath === '.claude/settings.json' ||
  relPath.startsWith('.claude/skills/speckit-') ||
  relPath.startsWith('.github/workflows/fork-');

const allow = rule => ({ allowed: true, rule });
const deny = (rule, relPath, why) => ({
  allowed: false,
  rule,
  reason: `${relPath}: constitution Principle V reserves this path for upstream (${why}).`,
  suggestion: '',
});

// Every proper ancestor folder of a POSIX path, outermost first: 'a/b/c.md' -> ['a', 'a/b'].
const ancestors = relPath => {
  const parts = relPath.split('/').slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
};

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  if (input.branch !== 'main') return allow('D2');
  if (input.mergeInProgress) return allow('D3');
  if (input.upstream?.files.has(input.relPath)) return deny('D4', input.relPath, 'file exists in upstream/main');
  if (FORK_ROOTS.has(input.relPath.split('/')[0])) return allow('D5');
  if (isForkZone(input.relPath)) return allow('D6');
  if (input.upstream === null) return deny('D7', input.relPath, 'upstream/main is unavailable; run git fetch upstream');
  const upstreamDir = ancestors(input.relPath).find(dir => input.upstream.dirs.has(dir));
  if (upstreamDir) return deny('D8', input.relPath, `inside upstream folder ${upstreamDir}/`);
  return allow('D9');
}
