/**
 * schema-drift.test.mjs: db/ob1-schema.sql must stay the docs/01 schema (U38–U40).
 *
 * The recipe keeps a copy of docs/01-getting-started.md's SQL so Postgres can run
 * it on first boot. These tests fail as soon as the copy and docs/01 diverge.
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SCHEMA = readFileSync(fileURLToPath(new URL("../db/ob1-schema.sql", import.meta.url)), "utf8");
const DOCS01 = readFileSync(fileURLToPath(new URL("../../../docs/01-getting-started.md", import.meta.url)), "utf8");
const DOCS01_BLOCKS = [...DOCS01.matchAll(/^```sql\n([\s\S]*?)^```/gm)].map((m) => m[1].trim());

test("U38 the schema file contains docs/01's five SQL blocks verbatim and in order", () => {
  assert.equal(DOCS01_BLOCKS.length, 5, "docs/01 has five SQL blocks");
  let from = 0;
  for (const [i, block] of DOCS01_BLOCKS.entries()) {
    const at = SCHEMA.indexOf(block, from);
    assert.notEqual(at, -1, `docs/01 SQL block ${i + 1} missing or out of order`);
    from = at + block.length;
  }
});

/** SQL statements of the file, without comment lines, in order. */
const statements = () => SCHEMA.split("\n").filter((l) => !l.startsWith("--")).join("\n")
  .split(";").map((s) => s.trim()).filter(Boolean);

test("U39 the schema file's first two statements enable vector and switch to the postgres role", () => {
  const [first, second] = statements();
  assert.equal(first, "create extension if not exists vector");
  assert.equal(second, "set role postgres");
});

test("U40 the schema file's last statement switches back from the postgres role", () => {
  assert.equal(statements().at(-1), "reset role");
});
