const allow = rule => ({ allowed: true, rule });

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  if (input.branch !== 'main') return allow('D2');
  if (input.mergeInProgress) return allow('D3');
  return { allowed: false, rule: 'stub', reason: '', suggestion: '' };
}
