// In-memory fixture folders: { relativePath: content }.
// Written into temp dirs at test time so their sample test files are never
// discovered by `node --test`, Deno, or the upstream gate.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const nodeTestPass = `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('ok', () => assert.equal(1 + 1, 2));\n`;
const nodeTestFail = `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('fails', () => assert.equal(1 + 1, 3));\n`;
const nodeTestSlow = `import { test } from 'node:test';\ntest('slow', async () => { await new Promise(r => setTimeout(r, 5000)); });\n`;

export const fixtures = {
  'deno-tested': {
    'deno.json': '{ "imports": {} }\n',
    'index.ts': 'export function add(a: number, b: number): number { return a + b; }\n',
    'index_test.ts': 'import { add } from "./index.ts";\nDeno.test("add", () => { if (add(1, 2) !== 3) throw new Error("bad"); });\n',
  },
  'deno-untested': {
    'deno.json': '{ "imports": {} }\n',
    'index.ts': 'export const x = 1;\n',
  },
  'node-script': {
    'package.json': JSON.stringify({ name: 'fx-node-script', private: true, type: 'module', scripts: { test: 'node --test src/__tests__/' } }, null, 2),
    'src/a.mjs': 'export const a = 1;\n',
    'src/__tests__/a.test.mjs': nodeTestPass,
  },
  'node-plain': {
    'lib/x.js': 'module.exports = 1;\n',
    'lib/__tests__/x.test.mjs': nodeTestPass,
  },
  'node-plain-failing': {
    'lib/x.js': 'module.exports = 1;\n',
    'lib/__tests__/x.test.mjs': nodeTestFail,
  },
  'node-plain-slow': {
    'lib/x.js': 'module.exports = 1;\n',
    'lib/__tests__/x.test.mjs': nodeTestSlow,
  },
  'python-tested': {
    'imp.py': 'def double(x):\n    return x * 2\n',
    'tests/test_imp.py': 'import sys, os\nsys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))\nfrom imp import double\n\ndef test_double():\n    assert double(2) == 4\n',
  },
  'mixed-server': {
    'deno.json': '{ "imports": {} }\n',
    'package.json': JSON.stringify({ name: 'fx-mixed', private: true, type: 'module', scripts: { test: 'node test-stateless.mjs' } }, null, 2),
    'index.ts': 'export const handler = () => "ok";\n',
    'test-stateless.mjs': "console.log('stateless ok');\n",
  },
  'nested-plugin': {
    'README.md': '# nested\n',
    'plugin/package.json': JSON.stringify({ name: 'fx-plugin', private: true, type: 'module', scripts: { test: 'node --test test/' } }, null, 2),
    'plugin/index.mjs': 'export const p = 1;\n',
    'plugin/test/p.test.mjs': nodeTestPass,
  },
  'docs-only': {
    'README.md': '# Docs only\n',
    'metadata.json': '{ "name": "docs" }\n',
    'skill.md': 'A plain-text skill.\n',
  },
  'tests-no-runner': {
    'a.ts': 'export const a = 1;\n',
    'a.test.ts': 'import { a } from "./a.ts";\n',
  },
  'config-only': {
    'vite.config.ts': 'export default {};\n',
    'README.md': '# config only\n',
  },
  'sql-only': {
    'schema.sql': 'create table if not exists demo (id int primary key);\n',
  },
  'sql-verify': {
    'schema.sql': 'create table if not exists demo (id int primary key);\n',
    'tests/verify.sql': "\\ir ../schema.sql\ndo $$ begin\n  if to_regclass('public.demo') is null then raise exception 'demo missing'; end if;\nend $$;\n",
  },
  // A node test that needs the SQL bootstrap (e.g. it runs psql itself). PSQL_LOG is written by
  // the test's stub psql; the node test passes only if bootstrap.sql was applied before it ran.
  'sql-verify-node': {
    'schema.sql': 'create table if not exists demo (id int primary key);\n',
    'tests/verify.sql': '\\ir ../schema.sql\n',
    'tests/needs-bootstrap.test.mjs': [
      "import { test } from 'node:test';",
      "import assert from 'node:assert/strict';",
      "import { readFileSync, existsSync } from 'node:fs';",
      "test('bootstrap applied before node tests', () => {",
      "  const log = process.env.PSQL_LOG;",
      "  assert.ok(existsSync(log) && readFileSync(log, 'utf8').includes('bootstrap.sql'), 'bootstrap.sql not yet applied');",
      '});',
      '',
    ].join('\n'),
  },
};

/** Return the file map of a fixture placed under `prefix` (e.g. "recipes/x"). */
export function fixtureFiles(name, prefix) {
  const fx = fixtures[name];
  if (!fx) throw new Error(`unknown fixture ${name}`);
  return Object.fromEntries(Object.entries(fx).map(([p, c]) => [prefix ? `${prefix}/${p}` : p, c]));
}

/** Materialise a fixture into a fresh temp dir; returns the folder path. */
export function materialize(name) {
  const dir = mkdtempSync(join(tmpdir(), `fork-ci-fx-${name}-`));
  for (const [rel, content] of Object.entries(fixtures[name])) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}
