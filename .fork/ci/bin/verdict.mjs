#!/usr/bin/env node
// STUB (T009) for the GitHub-behavior spike: minimal aggregation.
// Replaced test-first in T024.
import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { cliArgs } from '../lib/args.mjs';

const args = cliArgs('verdict');
const detect = existsSync(args.detect) ? JSON.parse(readFileSync(args.detect, 'utf8')) : null;
const results = existsSync(args.results)
  ? readdirSync(args.results).filter(f => /^result.*\.json$/.test(f) || f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(args.results, f), 'utf8')))
  : [];
const expected = detect ? detect.matrix.include.map(e => e.path) : [];
const missing = expected.filter(p => !results.some(r => r.path === p));
const failing = results.filter(r => r.mode === 'strict' && r.outcome !== 'pass').map(r => r.path);

let ok = args['detect-result'] === 'success' && detect !== null;
if (ok && expected.length === 0) ok = true;
else if (ok) ok = missing.length === 0 && failing.length === 0;

const lines = [
  `## Fork CI verdict (stub): ${ok ? '✅ success' : '❌ failure'}`,
  '',
  `detect=${args['detect-result']} test=${args['test-result']} folders=${expected.length} results=${results.length}`,
  missing.length ? `Missing results: ${missing.join(', ')}` : '',
  failing.length ? `Failing: ${failing.join(', ')}` : '',
].filter(Boolean);
appendFileSync(args.summary, `${lines.join('\n')}\n`);
process.stdout.write(`${lines.join('\n')}\n`);
process.exit(ok ? 0 : 1);
