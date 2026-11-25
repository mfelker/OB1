#!/usr/bin/env node
// Principle V guard CLI (spec 005, contracts/guards.md). Modes: --hook (agent), --staged (commit).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const lib = async name => import(new URL(`../lib/${name}`, import.meta.url));

const denyJson = reason =>
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const { decide } = await lib('principle-v.mjs');
  const { repoRelative, checkoutState, upstreamPaths } = await lib('principle-v-paths.mjs');
  const target = input.tool_input.file_path;
  const { root, relPath } = repoRelative(target, input.cwd);
  const state = relPath === null ? { branch: 'HEAD', mergeInProgress: false } : checkoutState(root);
  const upstream = relPath === null ? null : upstreamPaths(root);
  const d = decide({ relPath, ...state, upstream });
  console.log(denyJson(`${d.reason} ${d.suggestion}`));
} catch (e) {
  console.log(denyJson(`principle-v-guard failed: ${e.message}`));
}
