import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../lib/principle-v.mjs';

const upstream = {
  files: new Set(['CLAUDE.md', 'docs/01-getting-started.md']),
  dirs: new Set(['docs', 'recipes', '.claude', '.github', '.github/workflows']),
};
const base = { relPath: 'CLAUDE.md', branch: 'main', mergeInProgress: false, upstream };
const run = over => decide({ ...base, ...over });

test('U1 D1: relPath null is allowed', () => {
  const d = run({ relPath: null });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D1');
});

test('U2 D2: a branch other than main (or detached HEAD) is allowed; main is not covered by D2', () => {
  for (const branch of ['feature/x', 'fork/principle-v-guard', 'HEAD']) {
    const d = run({ branch });
    assert.equal(d.allowed, true, branch);
    assert.equal(d.rule, 'D2', branch);
  }
  assert.notEqual(run({ branch: 'main' }).rule, 'D2');
});

test('U3 D3: mergeInProgress on main is allowed', () => {
  const d = run({ mergeInProgress: true });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D3');
});

test('U4 D9: a new top-level path upstream does not have is allowed', () => {
  const d = run({ relPath: 'NOTES.md' });
  assert.equal(d.allowed, true);
  assert.equal(d.rule, 'D9');
});

test('U5 D4: a file that exists upstream is denied', () => {
  const d = run({ relPath: 'CLAUDE.md' });
  assert.equal(d.allowed, false);
  assert.equal(d.rule, 'D4');
});

test('U6 D8: a new file inside an upstream folder is denied; a sibling top-level path is not', () => {
  for (const relPath of ['docs/x.md', 'docs/a/b/c.md']) {
    const d = run({ relPath });
    assert.equal(d.allowed, false, relPath);
    assert.equal(d.rule, 'D8', relPath);
  }
  const sibling = run({ relPath: 'docsx.md' });
  assert.equal(sibling.allowed, true);
  assert.equal(sibling.rule, 'D9');
});

test('U7 D7: with upstream null, a non-fork path is denied', () => {
  const d = run({ relPath: 'NOTES.md', upstream: null });
  assert.equal(d.allowed, false);
  assert.equal(d.rule, 'D7');
});

test('U8 D5: each fork-only root is allowed, even with upstream null; .forkx is not a root', () => {
  const dirs = new Set(['.fork', '.specify', 'specs', '.worktrees']);
  for (const relPath of ['.fork/ci/x.mjs', '.specify/memory/c.md', 'specs/005/spec.md', '.worktrees/w/a.md']) {
    for (const up of [null, { files: new Set(), dirs }]) {
      const d = run({ relPath, upstream: up });
      assert.equal(d.allowed, true, relPath);
      assert.equal(d.rule, 'D5', relPath);
    }
  }
  const notRoot = run({ relPath: '.forkx/a', upstream: null });
  assert.equal(notRoot.allowed, false);
  assert.equal(notRoot.rule, 'D7');
});

test('U9 D6: fork-only zones are allowed inside upstream folders; look-alikes and upstream files in a zone are denied', () => {
  for (const relPath of ['.claude/settings.json', '.claude/skills/speckit-x/SKILL.md', '.github/workflows/fork-ci.yml']) {
    const d = run({ relPath });
    assert.equal(d.allowed, true, relPath);
    assert.equal(d.rule, 'D6', relPath);
    assert.equal(run({ relPath, upstream: null }).rule, 'D6', `${relPath} with upstream null`);
  }
  for (const relPath of ['.claude/settings.local.json', '.github/workflows/forked.yml']) {
    const d = run({ relPath });
    assert.equal(d.allowed, false, relPath);
    assert.equal(d.rule, 'D8', relPath);
  }
  const inZoneUpstream = run({
    relPath: '.claude/settings.json',
    upstream: { files: new Set(['.claude/settings.json']), dirs: upstream.dirs },
  });
  assert.equal(inZoneUpstream.allowed, false);
  assert.equal(inZoneUpstream.rule, 'D4');
});

test('U10 messages: D4, D8 and D7 reasons match the contract', () => {
  const d4 = run({ relPath: 'CLAUDE.md' });
  assert.equal(d4.reason, 'CLAUDE.md: constitution Principle V reserves this path for upstream (file exists in upstream/main).');
  const d8 = run({ relPath: 'docs/a/b/c.md' });
  assert.equal(d8.reason, 'docs/a/b/c.md: constitution Principle V reserves this path for upstream (inside upstream folder docs/).');
  const d7 = run({ relPath: 'NOTES.md', upstream: null });
  assert.equal(d7.reason, 'NOTES.md: constitution Principle V reserves this path for upstream (upstream/main is unavailable; run git fetch upstream).');
});

test('U11 messages: suggestion names .fork/domain-knowledge/ under docs/domain_knowledge/, else the upstream-bound text', () => {
  const knowledge = 'Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md).';
  const generic = 'Make this change in an upstream-bound worktree (contrib/mfelker/<desc> from upstream/main) or a staged PR, not on fork main.';
  const withDomain = { files: new Set(), dirs: new Set(['docs', 'docs/domain_knowledge', 'docs/domain_knowledge_x']) };
  assert.equal(run({ relPath: 'docs/domain_knowledge/CONTEXT.md', upstream: withDomain }).suggestion, knowledge);
  assert.equal(run({ relPath: 'docs/domain_knowledge/a/b.md', upstream: null }).suggestion, knowledge);
  assert.equal(run({ relPath: 'docs/domain_knowledge_x/a.md', upstream: withDomain }).suggestion, generic);
  assert.equal(run({ relPath: 'CLAUDE.md' }).suggestion, generic);
  assert.equal(run({ relPath: 'docs/x.md' }).suggestion, generic);
});

test('U32 D4/D8: upstream matches are case-insensitive; D5 and D6 stay exact-case', () => {
  const d4 = run({ relPath: 'claude.md' });
  assert.equal(d4.allowed, false);
  assert.equal(d4.rule, 'D4');
  assert.match(d4.reason, /^claude\.md: constitution Principle V/);
  const d8 = run({ relPath: 'Docs/x.md' });
  assert.equal(d8.allowed, false);
  assert.equal(d8.rule, 'D8');
  assert.match(d8.reason, /^Docs\/x\.md: constitution Principle V/);
  assert.equal(d8.suggestion, run({ relPath: 'docs/x.md' }).suggestion);
  // Fork-only roots and zones are exact-case: a case variant is not a fork path (it reaches D9 or is denied).
  assert.equal(run({ relPath: 'Specs/x.md' }).rule, 'D9');
  assert.equal(run({ relPath: 'SPECS/x.md', upstream: null }).rule, 'D7');
  assert.equal(run({ relPath: '.Claude/settings.json' }).allowed, false);
  assert.equal(run({ relPath: '.claude/Settings.json' }).allowed, false);
});
