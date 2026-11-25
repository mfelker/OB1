import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BASE_DIR = join(ROOT, '.specify', 'extensions', 'tdd', 'templates');
const OVERRIDE_DIR = join(ROOT, '.specify', 'templates', 'overrides');
const NAMES = ['tdd-test-quality-rubric.md', 'tdd-loop-playbook.md'];

// Header: an HTML comment block at byte 0 (data-model OverrideFile).
const HEADER = /^<!-- fork-override\nbase: (.+)\nbase_sha256: ([0-9a-f]{64})\n-->\n/;
// Fork section: start delimiter through end delimiter plus the blank line after it.
const SECTION = /<!-- fork: staged-pr evidence -->\n[\s\S]*?\n<!-- \/fork -->\n\n/g;

for (const name of NAMES) {
  test(`U35 ${name} override pins its base and adds only the fork section`, () => {
    const overridePath = join(OVERRIDE_DIR, name);
    assert.ok(existsSync(overridePath), `override file missing: ${overridePath}`);
    const base = readFileSync(join(BASE_DIR, name));
    const text = readFileSync(overridePath, 'utf8');

    const header = HEADER.exec(text);
    assert.ok(header, 'override header missing or malformed');
    assert.equal(header[1], 'spec-kit-tdd 2.0.1');
    assert.equal(header[2], createHash('sha256').update(base).digest('hex'), 'base_sha256 drifted from installed base');

    const body = text.slice(header[0].length);
    const sections = body.match(SECTION) ?? [];
    assert.equal(sections.length, 1, 'exactly one fork section expected');
    assert.equal(body.split('<!-- fork:').length - 1, 1, 'stray fork start delimiter');
    assert.equal(body.split('<!-- /fork -->').length - 1, 1, 'stray fork end delimiter');
    assert.match(sections[0], /applies\s+only\s+when[\s\S]*`staged upstream PR`/);
    assert.match(sections[0], /does\s+not\s+apply/);

    assert.equal(body.replace(SECTION, ''), base.toString('utf8'), 'override diverges from base outside the fork section');
  });
}

test('U38 rubric override: S4 (code the PR did not change) takes precedence over S2', () => {
  const text = readFileSync(join(OVERRIDE_DIR, 'tdd-test-quality-rubric.md'), 'utf8');
  const [section] = text.match(SECTION) ?? [];
  assert.ok(section, 'fork section missing');
  assert.match(section, /S4\s+takes\s+precedence\s+over\s+S2/, 'fork section must state that S4 wins over S2');
});
