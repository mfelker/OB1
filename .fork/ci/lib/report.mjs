// Job-summary Markdown report (contracts/check.md "Report"; spec SC-007).

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function icon(outcome, mode) {
  if (outcome === 'pass') return '✅';
  if (outcome === 'exempt') return '➖';
  if (outcome === 'sql-unverified') return '⚠️';
  return mode === 'advisory' ? '⚠️' : '❌';
}

function runtimeCell(runtimes) {
  if (!runtimes || runtimes.length === 0) return '—';
  return runtimes.map(rt => `${rt.kind} ${icon(rt.outcome, 'strict')}`).join(', ');
}

/**
 * @param {object} verdict  computeVerdict() output
 * @param {object[]} results folder results
 * @param {object|null} detect detect.mjs output (for skipped counts and matrix modes)
 */
export function renderReport(verdict, results, detect) {
  const head = `## Fork CI verdict: ${verdict.conclusion === 'success' ? '✅ success' : '❌ failure'}`;
  const lines = [head, ''];

  const matrix = [...(detect?.matrix?.include ?? []), ...(detect?.sql_matrix?.include ?? [])];
  const rows = [...results]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(r => `| ${esc(r.path)} | ${r.mode} | ${r.origin} | ${icon(r.outcome, r.mode)} ${r.outcome} | ${runtimeCell(r.runtimes)} | ${esc(r.reason)} |`);
  for (const p of verdict.missing ?? []) {
    const m = matrix.find(e => e.path === p);
    rows.push(`| ${esc(p)} | ${m?.mode ?? '—'} | ${m?.origin ?? '—'} | ${icon('timeout', m?.mode)} timeout | — | no result (job lost or timed out) |`);
  }

  if (rows.length === 0) {
    lines.push('No contribution folders changed.');
  } else {
    lines.push('| Folder | Mode | Origin | Outcome | Runtimes | Reason |');
    lines.push('|--------|------|--------|---------|----------|--------|');
    lines.push(...rows);
  }

  const footer = [];
  if (verdict.removed?.length) footer.push(`Removed: ${verdict.removed.map(esc).join(', ')}`);
  const sk = detect?.skipped;
  if (sk) footer.push(`Skipped paths: ${sk.forkOnly} fork-only, ${sk.template} template, ${sk.other} other`);
  if (footer.length) lines.push('', footer.join(' · '));

  for (const b of verdict.bypasses ?? []) {
    lines.push('', `Lane bypass: ${b.sha} merged ${esc(b.branch)} without a PR`);
  }
  return `${lines.join('\n')}\n`;
}
