#!/usr/bin/env node
// Determine changed contribution folders and emit the test matrix (contracts/cli.md).
// Origin/mode arrive in US4 (T042) and SQL routing in Phase 8 (T052).
import { cliArgs } from '../lib/args.mjs';
import { changedFiles, folderStatus, GitError } from '../lib/changes.mjs';
import { mapPaths } from '../lib/paths.mjs';

const args = cliArgs('detect');
const cwd = process.cwd();
try {
  const files = changedFiles(cwd, args);
  const { folders, skipped } = mapPaths(files);
  const headRef = args.event === 'pull_request' ? 'HEAD' : args.after;
  const include = [];
  const removed = [];
  for (const f of folders) {
    if (folderStatus(cwd, headRef, f.path) === 'removed') {
      removed.push(f.path);
      continue;
    }
    include.push({ path: f.path, mode: 'strict', origin: 'fork', needsPostgres: false });
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
