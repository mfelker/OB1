#!/usr/bin/env node
// Aggregate folder results into the required fork-ci-verdict check (contracts/cli.md).
import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { cliArgs } from '../lib/args.mjs';
import { computeVerdict } from '../lib/verdict.mjs';
import { renderReport } from '../lib/report.mjs';

const args = cliArgs('verdict');

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const detect = existsSync(args.detect) ? readJson(args.detect) : null;
const results = existsSync(args.results)
  ? readdirSync(args.results).filter(f => f.endsWith('.json')).map(f => readJson(join(args.results, f))).filter(Boolean)
  : [];

const verdict = computeVerdict({
  detect,
  results,
  jobs: {
    detect: args['detect-result'],
    test: args['test-result'],
    testSql: args['test-sql-result'],
    selfTest: args['self-test-result'],
  },
});

const md = renderReport(verdict, results, detect);
appendFileSync(args.summary, md);
process.stdout.write(md);
process.exit(verdict.conclusion === 'success' ? 0 : 1);
