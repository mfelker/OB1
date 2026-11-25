const allow = rule => ({ allowed: true, rule });
const deny = rule => ({ allowed: false, rule, reason: '', suggestion: '' });

// Every proper ancestor folder of a POSIX path, outermost first: 'a/b/c.md' -> ['a', 'a/b'].
const ancestors = relPath => {
  const parts = relPath.split('/').slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
};

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  if (input.branch !== 'main') return allow('D2');
  if (input.mergeInProgress) return allow('D3');
  if (input.upstream?.files.has(input.relPath)) return deny('D4');
  if (input.upstream === null) return deny('D7');
  if (ancestors(input.relPath).some(dir => input.upstream?.dirs.has(dir))) return deny('D8');
  return allow('D9');
}
