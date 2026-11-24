#!/usr/bin/env node
// Print "true" when the change touches .fork/ci/** or the fork-ci workflow (contracts/cli.md).
import { cliArgs } from '../lib/args.mjs';
import { changedFiles, GitError } from '../lib/changes.mjs';
import { selfTestNeeded } from '../lib/self-test-needed.mjs';

const args = cliArgs('self-test-needed');
try {
  process.stdout.write(`${selfTestNeeded(changedFiles(process.cwd(), args))}\n`);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(err instanceof GitError ? 3 : 1);
}
