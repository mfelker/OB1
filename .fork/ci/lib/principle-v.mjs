const allow = rule => ({ allowed: true, rule });
const deny = rule => ({ allowed: false, rule, reason: '', suggestion: '' });

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  if (input.branch !== 'main') return allow('D2');
  if (input.mergeInProgress) return allow('D3');
  if (input.upstream?.files.has(input.relPath)) return deny('D4');
  return allow('D9');
}
