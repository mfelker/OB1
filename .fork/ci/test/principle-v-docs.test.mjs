import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const path = (...p) => join(ROOT, ...p);

function readRequired(...p) {
  assert.ok(existsSync(path(...p)), `${p.join('/')} does not exist`);
  return readFileSync(path(...p), 'utf8');
}

test('U28 .claude/settings.json registers the PreToolUse guard', () => {
  const settings = JSON.parse(readRequired('.claude', 'settings.json'));
  const entries = settings.hooks?.PreToolUse;
  assert.ok(Array.isArray(entries), 'hooks.PreToolUse must be an array');
  assert.equal(entries.length, 1, 'exactly one PreToolUse entry');
  assert.equal(entries[0].matcher, 'Write|Edit|MultiEdit|NotebookEdit');
  assert.equal(entries[0].hooks.length, 1, 'exactly one hook in the entry');
  const [hook] = entries[0].hooks;
  assert.equal(hook.type, 'command');
  assert.equal(hook.command, 'node "$CLAUDE_PROJECT_DIR/.fork/ci/bin/principle-v-guard.mjs" --hook');
  assert.equal(hook.timeout, 30);
});
