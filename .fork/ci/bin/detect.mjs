#!/usr/bin/env node
// Determine changed contribution folders and emit the test matrix (contracts/cli.md).
// Folders with tests/verify.sql go to sql_matrix (Postgres service job); others to matrix.
import { cliArgs } from '../lib/args.mjs';
import { changedFiles, folderStatus, GitError } from '../lib/changes.mjs';
import { mapPaths } from '../lib/paths.mjs';
import { originOf, upstreamBase } from '../lib/origin.mjs';
import { scanRuntimes } from '../lib/runtimes.mjs';
import { join } from 'node:path';

const args = cliArgs('detect');
const cwd = process.cwd();
try {
  const files = changedFiles(cwd, args);
  const { folders, skipped } = mapPaths(files);
  const headRef = args.event === 'pull_request' ? 'HEAD' : args.after;
  const base = upstreamBase(cwd, headRef, args['upstream-ref']);
  if (!base) process.stderr.write(`warning: ${args['upstream-ref']} unavailable; treating all folders as fork-origin (strict)\n`);
  const include = [];
  const sqlInclude = [];
  const removed = [];
  for (const f of folders) {
    if (folderStatus(cwd, headRef, f.path) === 'removed') {
      removed.push(f.path);
      continue;
    }
    const origin = originOf(cwd, headRef, args['upstream-ref'], f.path, base);
    const needsPostgres = scanRuntimes(join(cwd, f.path), f.path).some(rt => rt.kind === 'sql' && rt.testFiles.length > 0);
    const entry = { path: f.path, mode: origin === 'upstream' ? 'advisory' : 'strict', origin, needsPostgres };
    (needsPostgres ? sqlInclude : include).push(entry);
  }
  process.stdout.write(`${JSON.stringify({
    has_folders: include.length > 0,
    matrix: { include },
    has_sql: sqlInclude.length > 0,
    sql_matrix: { include: sqlInclude },
    removed,
    skipped,
  })}\n`);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(err instanceof GitError ? 3 : 1);
}
