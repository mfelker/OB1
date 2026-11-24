#!/usr/bin/env node
// STUB (T009): real path mapping; every folder strict/fork, no runtimes yet.
// Replaced test-first in T023.
import { cliArgs } from '../lib/args.mjs';
import { changedFiles, folderStatus, GitError } from '../lib/changes.mjs';
import { mapPaths } from '../lib/paths.mjs';

const args = cliArgs('detect');
const cwd = process.cwd();
try {
  const files = changedFiles(cwd, args);
  const { folders, skipped } = mapPaths(files);
  const ref = args.event === 'pull_request' ? 'HEAD' : args.after;
  const include = [];
  const removed = [];
  for (const f of folders) {
    if (folderStatus(cwd, ref, f.path) === 'removed') removed.push(f.path);
    else include.push({ path: f.path, mode: 'strict', origin: 'fork', needsPostgres: false });
  }
  process.stdout.write(`${JSON.stringify({
    has_folders: include.length > 0,
    matrix: { include },
    has_sql: false,
    sql_matrix: { include: [] },
    removed,
    skipped,
  })}\n`);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(err instanceof GitError ? 3 : 1);
}
