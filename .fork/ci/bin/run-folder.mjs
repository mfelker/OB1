#!/usr/bin/env node
// STUB (T009) for the GitHub-behavior spike: writes a minimal result.
// A SPIKE_FAIL file in the folder makes it write `fail` and exit 1 (to exercise
// failing-job semantics, research R9). Replaced test-first in T020.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cliArgs } from '../lib/args.mjs';

const args = cliArgs('run-folder');
const spikeFail = existsSync(join(process.cwd(), args.path, 'SPIKE_FAIL'));
const result = {
  path: args.path,
  mode: args.mode,
  origin: args.origin,
  outcome: spikeFail ? 'fail' : 'pass',
  reason: spikeFail ? 'SPIKE_FAIL marker (stub)' : 'stub: no tests run yet',
  runtimes: [],
  durationMs: 0,
};
writeFileSync(args.out, `${JSON.stringify(result, null, 2)}\n`);
process.exit(spikeFail ? 1 : 0);
