// Spec 005 outer loop (A1–A9): the Principle V guards through their real entry points.
// Written first as `todo` (recorded reds, T029); stream G flips each to a plain test in the
// commit that makes it pass (T012, T015).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addRemoteRef, branch, checkout, commit, git, makeRepo, writeFiles } from './helpers/git-fixture.mjs';

const CI = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(CI, '..', '..');
const OUTER = { todo: 'outer loop: red until stream G implements the guard CLI (T012, T015)' };

// Files upstream owns in every fixture: top-level, in a content folder, and inside the
// upstream folders that also hold fork-only zones (.claude/, .github/).
const UPSTREAM = {
  'CLAUDE.md': '# upstream\n',
  'docs/guide.md': '# guide\n',
  'recipes/a/README.md': '# a\n',
  '.claude/skills/review-pr.md': '# review\n',
  '.github/workflows/ci.yml': 'name: ci\n',
};

/** The PreToolUse command string exactly as .claude/settings.json registers it. */
function hookCommand() {
  const path = join(ROOT, '.claude', 'settings.json');
  assert.ok(existsSync(path), '.claude/settings.json does not exist yet');
  const entries = JSON.parse(readFileSync(path, 'utf8')).hooks?.PreToolUse ?? [];
  const command = entries.flatMap(e => e.hooks ?? []).find(h => h.type === 'command')?.command;
  assert.ok(command, 'no PreToolUse command hook in .claude/settings.json');
  return command;
}

/**
 * A temp repo on `main`: upstream content committed and pointed to by `upstream/main`,
 * plus a copy of this worktree's guard (bin, lib) and git hooks, committed as fork tooling.
 */
function guardRepo() {
  const repo = makeRepo();
  repo.dir = realpathSync(repo.dir);
  writeFiles(repo, UPSTREAM);
  addRemoteRef(repo, 'upstream/main', commit(repo, 'upstream content'));
  for (const sub of ['bin', 'lib']) cpSync(join(CI, sub), join(repo.dir, '.fork/ci', sub), { recursive: true });
  if (existsSync(join(ROOT, '.fork/githooks'))) {
    cpSync(join(ROOT, '.fork/githooks'), join(repo.dir, '.fork/githooks'), { recursive: true });
    chmodSync(join(repo.dir, '.fork/githooks/pre-commit'), 0o755);
  }
  commit(repo, 'fork tooling');
  return repo;
}

/** Run the registered hook command for one tool call; `cwd` is the session's working directory. */
function runHook(repo, filePath, { tool = 'Write', cwd = repo.dir } = {}) {
  const { NODE_TEST_CONTEXT: _n, ...env } = process.env;
  const input = { hook_event_name: 'PreToolUse', tool_name: tool, cwd, tool_input: { file_path: filePath, content: 'x\n' } };
  return spawnSync('sh', ['-c', hookCommand()], {
    cwd, input: JSON.stringify(input), encoding: 'utf8', env: { ...env, CLAUDE_PROJECT_DIR: repo.dir },
  });
}

/** The deny reason from a hook run, asserting the documented PreToolUse deny shape. */
function denyReason(r) {
  assert.equal(r.status, 0, `hook must exit 0; stderr: ${r.stderr}`);
  assert.ok(r.stdout.trim(), 'hook printed no decision');
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  assert.equal(out?.hookEventName, 'PreToolUse');
  assert.equal(out.permissionDecision, 'deny');
  return out.permissionDecisionReason;
}

function assertAllowed(r, label) {
  assert.equal(r.status, 0, `${label}: hook must exit 0; stderr: ${r.stderr}`);
  assert.equal(r.stdout, '', `${label}: an allowed write prints no decision`);
}

/** `git commit` with the repo's own hooks; returns the spawn result. */
function gitCommit(repo, dir, message, extra = []) {
  const { NODE_TEST_CONTEXT: _n, ...env } = process.env;
  return spawnSync('git', ['commit', '-q', ...extra, '-m', message], {
    cwd: dir, encoding: 'utf8',
    env: { ...env, HOME: repo.dir, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Fork Owner', GIT_AUTHOR_EMAIL: 'owner@example.test', GIT_COMMITTER_NAME: 'Fork Owner', GIT_COMMITTER_EMAIL: 'owner@example.test' },
  });
}

function enableCommitGuard(repo) {
  assert.ok(existsSync(join(repo.dir, '.fork/githooks/pre-commit')), '.fork/githooks/pre-commit does not exist yet');
  git(repo, ['config', 'core.hooksPath', '.fork/githooks']);
}

/** A linked worktree of `repo` on a new branch, outside the repo directory. */
function linkedWorktree(repo, name) {
  const dir = join(realpathSync(mkdtempSync(join(tmpdir(), 'fork-pvg-wt-'))), 'wt');
  git(repo, ['worktree', 'add', '-q', '-b', name, dir]);
  return dir;
}

// ── US1: the agent guard ────────────────────────────────────────────────────

test('A1 agent guard refuses a Write to a file that exists upstream, naming Principle V and the upstream-bound route', () => {
  const repo = guardRepo();
  const reason = denyReason(runHook(repo, join(repo.dir, 'CLAUDE.md')));
  assert.match(reason, /CLAUDE\.md/);
  assert.match(reason, /Principle V/);
  assert.match(reason, /file exists in upstream\/main/);
  assert.match(reason, /upstream-bound worktree/);
});

test('A2 agent guard refuses docs/domain_knowledge/CONTEXT.md and points to .fork/domain-knowledge/', OUTER, () => {
  const repo = guardRepo();
  const reason = denyReason(runHook(repo, join(repo.dir, 'docs/domain_knowledge/CONTEXT.md')));
  assert.match(reason, /docs\/domain_knowledge\/CONTEXT\.md/);
  assert.match(reason, /\.fork\/domain-knowledge\//);
});

test('A3 agent guard allows every fork-only root and zone', () => {
  const repo = guardRepo();
  for (const rel of ['.fork/notes.md', '.specify/memory/x.md', 'specs/006-x/spec.md', '.worktrees/scratch.md',
    '.claude/settings.json', '.claude/skills/speckit-x/SKILL.md', '.github/workflows/fork-ci.yml']) {
    assertAllowed(runHook(repo, join(repo.dir, rel), { tool: 'Edit' }), rel);
  }
});

test('A4 agent guard allows an upstream path in a linked worktree on another branch, from a main-checkout session', OUTER, () => {
  const repo = guardRepo();
  const wt = linkedWorktree(repo, 'contrib/owner/x');
  assertAllowed(runHook(repo, join(wt, 'CLAUDE.md'), { cwd: repo.dir }), 'worktree CLAUDE.md');
});

test('A5 agent guard allows editing an upstream file while a merge is in progress on main', OUTER, () => {
  const repo = guardRepo();
  branch(repo, 'incoming');
  checkout(repo, 'incoming');
  writeFiles(repo, { 'CLAUDE.md': '# incoming\n' });
  commit(repo, 'incoming change');
  checkout(repo, 'main');
  git(repo, ['merge', '--no-commit', '--no-ff', 'incoming']);
  assertAllowed(runHook(repo, join(repo.dir, 'CLAUDE.md'), { tool: 'Edit' }), 'merge in progress');
});

// ── US2: the commit guard ───────────────────────────────────────────────────

test('A6 commit guard refuses a commit on main that stages upstream paths, listing each with its reason', OUTER, () => {
  const repo = guardRepo();
  enableCommitGuard(repo);
  writeFiles(repo, { 'CLAUDE.md': '# changed\n', 'docs/new.md': '# new\n', '.fork/ok.md': 'fine\n' });
  git(repo, ['add', '-A']);
  const r = gitCommit(repo, repo.dir, 'stray upstream edits');
  assert.notEqual(r.status, 0, 'commit must be refused');
  assert.match(r.stderr, /principle-v-guard: commit refused \(constitution Principle V\)/);
  assert.match(r.stderr, /CLAUDE\.md: .*file exists in upstream\/main/);
  assert.match(r.stderr, /docs\/new\.md: .*inside upstream folder docs\//);
  assert.doesNotMatch(r.stderr, /\.fork\/ok\.md/);
  assert.match(r.stderr, /--no-verify/);
});

test('A7 commit guard allows a commit on main that stages only fork-only paths', OUTER, () => {
  const repo = guardRepo();
  enableCommitGuard(repo);
  writeFiles(repo, { '.fork/notes.md': 'n\n', 'specs/006-x/spec.md': '# s\n' });
  git(repo, ['add', '-A']);
  const r = gitCommit(repo, repo.dir, 'fork-only work');
  assert.equal(r.status, 0, r.stderr);
});

test('A8 commit guard allows committing a conflicted merge that touches upstream files', OUTER, () => {
  const repo = guardRepo();
  enableCommitGuard(repo);
  branch(repo, 'incoming');
  checkout(repo, 'incoming');
  writeFiles(repo, { 'CLAUDE.md': '# incoming\n' });
  commit(repo, 'incoming change', {});
  checkout(repo, 'main');
  writeFiles(repo, { 'CLAUDE.md': '# fork side\n' });
  git(repo, ['-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-am', 'fork side']);
  const m = spawnSync('git', ['merge', 'incoming'], { cwd: repo.dir, encoding: 'utf8', env: { ...process.env, HOME: repo.dir } });
  assert.notEqual(m.status, 0, 'fixture: the merge must conflict');
  writeFiles(repo, { 'CLAUDE.md': '# resolved\n' });
  git(repo, ['add', 'CLAUDE.md']);
  const r = gitCommit(repo, repo.dir, 'merge incoming', ['--no-edit']);
  assert.equal(r.status, 0, r.stderr);
});

test('A9 commit guard allows a commit staging upstream files in a linked worktree on another branch', OUTER, () => {
  const repo = guardRepo();
  enableCommitGuard(repo);
  const wt = linkedWorktree(repo, 'contrib/owner/y');
  writeFileSync(join(wt, 'CLAUDE.md'), '# upstream-bound change\n');
  spawnSync('git', ['add', 'CLAUDE.md'], { cwd: wt });
  const r = gitCommit(repo, wt, 'upstream-bound edit');
  assert.equal(r.status, 0, r.stderr);
});
