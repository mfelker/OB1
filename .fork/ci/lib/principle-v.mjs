const allow = rule => ({ allowed: true, rule });

export function decide(input) {
  if (input.relPath === null) return allow('D1');
  return { allowed: false, rule: 'stub', reason: '', suggestion: '' };
}
