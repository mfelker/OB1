// Temp git repositories for fork-ci tests. Zero dependencies.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const OWNER = { name: 'Fork Owner', email: 'owner@example.test' };

function identityEnv(author = OWNER, committer = OWNER) {
  return {
    GIT_AUTHOR_NAME: author.name,
    GIT_AUTHOR_EMAIL: author.email,
    GIT_COMMITTER_NAME: committer.name,
    GIT_COMMITTER_EMAIL: committer.email,
  };
}

/** Run git in the repo and return trimmed stdout. */
export function git(repo, args, env = {}) {
  return execFileSync('git', args, {
    cwd: repo.dir,
    encoding: 'utf8',
    env: { ...process.env, ...identityEnv(), GIT_CONFIG_NOSYSTEM: '1', HOME: repo.dir, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** Create an empty repo whose initial branch is `main`. */
export function makeRepo() {
  const repo = { dir: mkdtempSync(join(tmpdir(), 'fork-ci-')) };
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  return repo;
}

/** Write files from a { path: content } map; a null content deletes the file. */
export function writeFiles(repo, map) {
  for (const [rel, content] of Object.entries(map)) {
    const abs = join(repo.dir, rel);
    if (content === null) {
      rmSync(abs, { force: true });
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

/** Stage everything and commit; returns the new sha. */
export function commit(repo, message, { author, committer } = {}) {
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-q', '--allow-empty', '-m', message], identityEnv(author, committer));
  return git(repo, ['rev-parse', 'HEAD']);
}

export function branch(repo, name, from = 'HEAD') {
  git(repo, ['branch', name, from]);
}

export function checkout(repo, ref) {
  git(repo, ['checkout', '-q', ref]);
}

/** Merge `ref` into the current branch; returns the resulting HEAD sha. */
export function merge(repo, ref, { noFf = false, message, committer } = {}) {
  const args = ['merge', '-q'];
  if (noFf) args.push('--no-ff');
  if (message) args.push('-m', message);
  else args.push('--no-edit');
  args.push(ref);
  git(repo, args, identityEnv(OWNER, committer));
  return git(repo, ['rev-parse', 'HEAD']);
}

/** Point refs/remotes/<name> at sha (simulates a fetched remote branch). */
export function addRemoteRef(repo, name, sha) {
  git(repo, ['update-ref', `refs/remotes/${name}`, sha]);
}
