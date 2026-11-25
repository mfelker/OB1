#!/usr/bin/env node
// Principle V guard CLI (spec 005, contracts/guards.md). Modes: --hook (agent), --staged (commit).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const lib = async name => import(new URL(`../lib/${name}`, import.meta.url));

const REFUSED = 'The write was refused; fix the guard or run it by hand: node .fork/ci/bin/principle-v-guard.mjs --hook';

const denyJson = reason =>
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });

/** Checkout state and upstream sets for the checkout at `root`: once per hook call or commit, not per path. */
async function checkoutContext(root) {
  const { checkoutState, upstreamPaths } = await lib('principle-v-paths.mjs');
  return { ...checkoutState(root), upstream: upstreamPaths(root) };
}

/** Decide one repo-relative path (null relPath: outside every checkout) against a checkoutContext. */
async function decideWith(relPath, context) {
  const { decide } = await lib('principle-v.mjs');
  return decide({ relPath, ...context });
}

async function hook() {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    const { repoRelative } = await lib('principle-v-paths.mjs');
    const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
    if (typeof target !== 'string' || target === '') throw new Error('no target path in tool_input (file_path or notebook_path)');
    const { root, relPath } = repoRelative(target, input.cwd);
    const d = await decideWith(relPath, relPath === null ? { branch: 'HEAD', mergeInProgress: false, upstream: null } : await checkoutContext(root));
    if (!d.allowed) console.log(denyJson(`${d.reason} ${d.suggestion}`));
  } catch (e) {
    console.log(denyJson(`principle-v-guard failed: ${e.message}. ${REFUSED}`));
  }
}

async function staged() {
  const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const root = git(['rev-parse', '--show-toplevel']).trim();
  const paths = git(['diff', '--cached', '--name-only', '-z', '--no-renames']).split('\0').filter(Boolean);
  const lines = [];
  const context = paths.length === 0 ? null : await checkoutContext(root);
  for (const relPath of paths) {
    const d = await decideWith(relPath, context);
    if (!d.allowed) lines.push(`  ${d.reason} ${d.suggestion}`);
  }
  if (lines.length === 0) return;
  console.error(['principle-v-guard: commit refused (constitution Principle V)', ...lines, 'Bypass deliberately with git commit --no-verify.'].join('\n'));
  process.exitCode = 1;
}

async function stagedGuarded() {
  try {
    await staged();
  } catch (e) {
    console.error(`principle-v-guard failed: ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[2] === '--staged') await stagedGuarded();
else await hook();
