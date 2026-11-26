/**
 * compose.test.mjs: unit tests U24-U36 for docker-compose.yml + lean.override.yml.
 *
 * Each test builds a temporary checkout holding a copy of this recipe folder and a
 * stand-in Supabase clone (tests/fixtures/compose), then reads the result of the real
 * `docker compose config`. No container is ever started. Without docker the tests are
 * skipped by node:test (reported as skipped, never as passed).
 *
 * Run: node --test tests/compose.test.mjs   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeCheckout, writeFixtureClone, realDocker, compose, MODEL_SETTINGS } from "./helpers/harness.mjs";

const skip = realDocker() ? false : "docker is not on PATH";

/** Model settings and access key the stand-in `.env` carries (test values). */
const ENV_VALUES = {
  MCP_ACCESS_KEY: "test-access-key",
  EMBEDDING_API_BASE: "http://host.docker.internal:11434/v1",
  EMBEDDING_API_KEY: "test-embed-key",
  EMBEDDING_MODEL: "test-embed-model",
  CHAT_API_BASE: "http://host.docker.internal:11434/v1",
  CHAT_API_KEY: "test-chat-key",
  CHAT_MODEL: "test-chat-model",
  FETCH_TIMEOUT_MS: "12345",
};
void MODEL_SETTINGS;

/** A checkout with the stand-in clone and a `.env` (copy of `.env.example` plus the model settings). */
function stack() {
  const co = makeCheckout();
  const clone = join(co.recipe, "supabase");
  writeFixtureClone(clone);
  const docker = join(clone, "docker");
  const extra = Object.entries(ENV_VALUES).map(([k, v]) => `${k}=${v}`).join("\n");
  writeFileSync(join(docker, ".env"), `${readFileSync(join(docker, ".env.example"), "utf8")}\n${extra}\n`);
  return co;
}

/** Run `docker compose <args>` in a fresh stack and clean up. Returns stdout; fails the test on a non-zero exit. */
function run(args) {
  const co = stack();
  try {
    const r = compose(co, args);
    assert.equal(r.code, 0, r.stderr);
    return { stdout: r.stdout, co };
  } finally { co.cleanup(); }
}

const services = (args = []) => run([...args, "config", "--services"]).stdout.split("\n").filter(Boolean).sort();

test("U24 the default service set is exactly api-gw db functions ob1-init rest storage", { skip }, () => {
  assert.deepEqual(services(), ["api-gw", "db", "functions", "ob1-init", "rest", "storage"]);
});
