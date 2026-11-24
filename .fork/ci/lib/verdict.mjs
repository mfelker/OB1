// Aggregate folder results into the check verdict (data-model Check Verdict; research R9).

const ORDER = ['exempt', 'pass', 'sql-unverified', 'no-tests', 'fail', 'setup', 'timeout'];
const BAD = new Set(['fail', 'no-tests', 'setup', 'timeout']);

/** Worst outcome by precedence: timeout > setup > fail > no-tests > sql-unverified > pass > exempt. */
export function worstOutcome(outcomes) {
  return outcomes.reduce((w, o) => (ORDER.indexOf(o) > ORDER.indexOf(w) ? o : w), 'exempt');
}

/**
 * @param {{detect: object|null, results: object[], jobs: {detect:string, test:string, testSql:string, selfTest:string}}} input
 */
export function computeVerdict({ detect, results, jobs }) {
  const expected = detect
    ? [...detect.matrix.include, ...(detect.sql_matrix?.include ?? [])].map(e => e.path)
    : [];
  const seen = new Set(results.map(r => r.path));
  const missing = expected.filter(p => !seen.has(p)).sort();

  const counts = {};
  for (const r of results) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
  if (missing.length) counts.timeout = (counts.timeout ?? 0) + missing.length;

  const failing = [...results.filter(r => BAD.has(r.outcome)).map(r => r.path), ...missing].sort();
  const ok = jobs.detect === 'success' && detect !== null && failing.length === 0;

  return {
    conclusion: ok ? 'success' : 'failure',
    counts,
    failing,
    advisories: [],
    missing,
    removed: detect?.removed ?? [],
    bypasses: [],
  };
}
