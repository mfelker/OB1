/**
 * verify-rerun.test.mjs: tests/verify.sql can run again on the same Postgres (U46).
 *
 * fork-ci's TDD loop re-runs verify.sql against one Postgres many times, and the
 * guard rails forbid DROP DATABASE, so every run must use a new scratch database.
 * Needs psql and a reachable Postgres (PG* environment variables); skipped otherwise.
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const FOLDER = fileURLToPath(new URL("..", import.meta.url));
const psql = (args) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-X", "-q", ...args], { cwd: FOLDER, encoding: "utf8" });
const reachable = psql(["-c", "select 1"]).status === 0;

test("U46 verify.sql runs twice on the same Postgres and contains no DROP", { skip: reachable ? false : "no reachable Postgres" }, () => {
  assert.doesNotMatch(readFileSync(new URL("./verify.sql", import.meta.url), "utf8"), /\bdrop\b/i);
  for (const run of [1, 2]) {
    const r = psql(["-f", "tests/verify.sql"]);
    assert.equal(r.status, 0, `run ${run}: ${r.stderr}`);
  }
});
