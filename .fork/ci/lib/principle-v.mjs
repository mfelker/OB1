const FORK_ROOTS = new Set(['.fork', '.specify', 'specs', '.worktrees']);

const isForkZone = relPath =>
  relPath === '.claude/settings.json' ||
  relPath.startsWith('.claude/skills/speckit-') ||
  relPath.startsWith('.github/workflows/fork-');

const allow = rule => ({ allowed: true, rule });
const KNOWLEDGE_SUGGESTION =
  'Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md).';
const UPSTREAM_BOUND_SUGGESTION =
  'Make this change in an upstream-bound worktree (contrib/mfelker/<desc> from upstream/main) or a staged PR, not on fork main.';

const deny = (rule, relPath, why) => ({
  allowed: false,
  rule,
  reason: `${relPath}: constitution Principle V reserves this path for upstream (${why}).`,
  suggestion: relPath.startsWith('docs/domain_knowledge/') ? KNOWLEDGE_SUGGESTION : UPSTREAM_BOUND_SUGGESTION,
});

// Every proper ancestor folder of a POSIX path, outermost first: 'a/b/c.md' -> ['a', 'a/b'].
const ancestors = relPath => {
  const parts = relPath.split('/').slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
};

// Case-insensitive views of the upstream sets (case-insensitive filesystems resolve case variants to the
// upstream path), cached per upstream object. Dirs map lower-case -> upstream spelling for the message.
const folded = new WeakMap();
const foldedUpstream = upstream => {
  if (!folded.has(upstream)) {
    folded.set(upstream, {
      files: new Set([...upstream.files].map(f => f.toLowerCase())),
      dirs: new Map([...upstream.dirs].map(d => [d.toLowerCase(), d])),
    });
  }
  return folded.get(upstream);
};

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  if (input.branch !== 'main') return allow('D2');
  if (input.mergeInProgress) return allow('D3');
  const lower = input.upstream ? foldedUpstream(input.upstream) : null;
  if (lower?.files.has(input.relPath.toLowerCase())) return deny('D4', input.relPath, 'file exists in upstream/main');
  if (FORK_ROOTS.has(input.relPath.split('/')[0])) return allow('D5');
  if (isForkZone(input.relPath)) return allow('D6');
  if (input.upstream === null) return deny('D7', input.relPath, 'upstream/main is unavailable; run git fetch upstream');
  const upstreamDir = ancestors(input.relPath.toLowerCase()).map(dir => lower.dirs.get(dir)).find(Boolean);
  if (upstreamDir) return deny('D8', input.relPath, `inside upstream folder ${upstreamDir}/`);
  return allow('D9');
}
