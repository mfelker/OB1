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

test('U29 .fork/githooks/pre-commit is an executable sh script that execs the staged guard', () => {
  const text = readRequired('.fork', 'githooks', 'pre-commit');
  assert.ok(statSync(path('.fork', 'githooks', 'pre-commit')).mode & 0o100, 'pre-commit must be executable');
  assert.ok(text.startsWith('#!/bin/sh\n'), 'first line must be #!/bin/sh');
  assert.ok(
    text.split('\n').includes('exec node "$(git rev-parse --show-toplevel)/.fork/ci/bin/principle-v-guard.mjs" --staged'),
    'must exec the guard with --staged from the top-level',
  );
});

/** Whitespace-collapsed text of the section whose heading starts with `heading`, up to the next heading of the same or higher level. */
function section(text, heading) {
  const level = /^#+/.exec(heading)[0].length;
  const lines = text.split('\n');
  const start = lines.findIndex(l => l.startsWith(heading));
  if (start < 0) return null;
  const rest = lines.slice(start);
  const next = rest.findIndex((l, i) => i > 0 && /^#+ /.test(l) && /^#+/.exec(l)[0].length <= level);
  return (next < 0 ? rest : rest.slice(0, next)).join('\n').replace(/\s+/g, ' ');
}

test('A10 .fork/README.md names .fork/domain-knowledge/ as the grill knowledge root with its layout', () => {
  const sec = section(readRequired('.fork', 'README.md'), '## Domain knowledge');
  assert.ok(sec, 'a "## Domain knowledge" section is required in .fork/README.md');
  assert.match(sec, /\.fork\/domain-knowledge\//, 'must name .fork/domain-knowledge/');
  assert.match(sec, /\/speckit-grill-with-docs/, 'must name /speckit-grill-with-docs');
  assert.match(sec, /canonical/i, 'must call it the canonical knowledge root');
  assert.match(sec, /CONTEXT\.md/, 'layout must list CONTEXT.md');
  assert.match(sec, /topic documents?/i, 'layout must list topic documents');
  assert.match(sec, /adr\//, 'layout must list adr/');
});

test('A11 .fork/README.md has a Principle V guard section covering both guards and how to enable them', () => {
  const sec = section(readRequired('.fork', 'README.md'), '## Principle V guard');
  assert.ok(sec, 'a "## Principle V guard" section is required in .fork/README.md');
  assert.match(sec, /Principle V/, 'must name Principle V');
  assert.match(sec, /PreToolUse/, 'must describe the agent guard (PreToolUse hook)');
  assert.match(sec, /\.claude\/settings\.json/, 'must name the agent guard wiring');
  assert.match(sec, /pre-commit/, 'must describe the commit guard (pre-commit hook)');
  assert.match(sec, /\.fork\/githooks/, 'must name the commit guard wiring');
  assert.match(sec, /allow/i, 'must say what is allowed');
  assert.match(sec, /refus|den(y|ie)/i, 'must say what is refused');
  assert.match(sec, /merge/i, 'must state the merge exception');
  assert.match(sec, /--no-verify/, 'must name the --no-verify bypass');
  assert.match(sec, /git config core\.hooksPath \.fork\/githooks/, 'must give the enable command');
});
