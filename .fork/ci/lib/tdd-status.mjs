// Advisory TDD artifact status for the PR's linked feature(s) (contracts/fork-ci-tdd-status.md;
// spec 003 FR-014, research R9). Never feeds computeVerdict.
//
// Real read errors (unreadable specs/, a spec.md that is a directory) propagate on purpose:
// bin/verdict.mjs catches them and renders the one-line T10 advisory.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const VERDICTS = new Set(['PASS', 'PASS_WITH_GAPS', 'FAIL', 'BLOCKED']);
const BRANCH_LINE = /^\*\*Feature Branch\*\*:\s*`([^`]*)`/m;

/** The backticked `**Feature Branch**` value of a spec, or null. */
function featureBranch(specText) {
  return specText.match(BRANCH_LINE)?.[1] ?? null;
}

/** `verdict:` from the report's leading `---` frontmatter only; `unreadable` when absent or invalid. */
function reportVerdict(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return 'unreadable';
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break;
    const m = line.match(/^verdict:\s*([^\s#]*)/);
    if (m) return VERDICTS.has(m[1]) ? m[1] : 'unreadable';
  }
  return 'unreadable';
}

function featureStatus(rootDir, name) {
  const tdd = join(rootDir, 'specs', name, 'tdd');
  const reportPath = join(tdd, 'verification.md');
  const verification = existsSync(reportPath);
  return {
    dir: `specs/${name}`,
    cycleLog: existsSync(join(tdd, 'cycle-log.md')),
    verification,
    verdict: verification ? reportVerdict(readFileSync(reportPath, 'utf8')) : 'missing',
  };
}

/**
 * @param {string} rootDir repo root containing specs/
 * @param {string} headRef PR head branch; empty on push events
 * @returns {null|{headRef:string, features:object[], linked:boolean, error:null}}
 */
export function tddStatus(rootDir, headRef) {
  if (!headRef) return null;
  const specsDir = join(rootDir, 'specs');
  const names = existsSync(specsDir)
    ? readdirSync(specsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()
    : [];
  const features = names
    .filter(name => existsSync(join(specsDir, name, 'spec.md')))
    .filter(name => featureBranch(readFileSync(join(specsDir, name, 'spec.md'), 'utf8')) === headRef)
    .map(name => featureStatus(rootDir, name));
  return { headRef, features, linked: features.length > 0, error: null };
}
