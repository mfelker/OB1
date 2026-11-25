// Unit behaviors of the Principle V guard CLI (spec 005, U22-U27): spawn the CLI like the hook runner does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addRemoteRef, commit, makeRepo, writeFiles } from './helpers/git-fixture.mjs';

const CI = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A temp repo on `main` with upstream content at `upstream/main` and a copy of the guard (bin, lib). */
function guardRepo() {
  const repo = makeRepo();
  repo.dir = realpathSync(repo.dir);
  writeFiles(repo, { 'CLAUDE.md': '# upstream\n', 'docs/guide.md': '# guide\n' });
  addRemoteRef(repo, 'upstream/main', commit(repo, 'upstream content'));
  for (const sub of ['bin', 'lib']) cpSync(join(CI, sub), join(repo.dir, '.fork/ci', sub), { recursive: true });
  commit(repo, 'fork tooling');
  return repo;
}

/** Run `principle-v-guard.mjs <mode>` from the repo copy with `input` (string or object) on stdin. */
function guard(repo, mode, input, cwd = repo.dir) {
  const { NODE_TEST_CONTEXT: _n, ...env } = process.env;
  return spawnSync(process.execPath, [join(repo.dir, '.fork/ci/bin/principle-v-guard.mjs'), mode], {
    cwd, env, encoding: 'utf8', input: typeof input === 'string' ? input : JSON.stringify(input),
  });
}

/** The deny reason from a hook run, asserting exit 0 and the PreToolUse deny shape. */
function denyReason(r) {
  assert.equal(r.status, 0, `hook must exit 0; stderr: ${r.stderr}`);
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  assert.equal(out?.hookEventName, 'PreToolUse');
  assert.equal(out.permissionDecision, 'deny');
  return out.permissionDecisionReason;
}

test('U22 --hook reads tool_input.notebook_path when there is no file_path, resolving a relative path against the input cwd', () => {
  const repo = guardRepo();
  const reason = denyReason(guard(repo, '--hook', {
    hook_event_name: 'PreToolUse', tool_name: 'NotebookEdit', cwd: join(repo.dir, 'docs'), tool_input: { notebook_path: '../CLAUDE.md' },
  }));
  assert.match(reason, /^CLAUDE\.md: constitution Principle V/);
});

const failedReason = r => {
  const reason = denyReason(r);
  assert.match(reason, /^principle-v-guard failed: /);
  assert.match(reason, /The write was refused; fix the guard or run it by hand: node \.fork\/ci\/bin\/principle-v-guard\.mjs --hook/);
  return reason;
};

test('U23 --hook with unparseable stdin prints the principle-v-guard failed deny and exits 0', () => {
  failedReason(guard(guardRepo(), '--hook', 'not json'));
});

test('U24 --hook for a matched tool with no target path prints the principle-v-guard failed deny and exits 0', () => {
  const repo = guardRepo();
  const reason = failedReason(guard(repo, '--hook', { hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: repo.dir, tool_input: { content: 'x' } }));
  assert.match(reason, /no target path/);
});

test('U25 --hook whose rule library fails to load prints the principle-v-guard failed deny and exits 0', () => {
  const repo = guardRepo();
  writeFileSync(join(repo.dir, '.fork/ci/lib/principle-v.mjs'), 'export const decide = ;\n');
  const reason = failedReason(guard(repo, '--hook', {
    hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: repo.dir, tool_input: { file_path: join(repo.dir, 'CLAUDE.md') },
  }));
  assert.match(reason, /Unexpected token/);
});
