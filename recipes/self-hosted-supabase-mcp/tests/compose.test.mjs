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

test("U25 with --profile ui the set adds exactly studio and meta", { skip }, () => {
  const base = services();
  const ui = services(["--profile", "ui"]);
  assert.deepEqual(ui.filter((s) => !base.includes(s)), ["meta", "studio"]);
  assert.deepEqual(base.filter((s) => !ui.includes(s)), []);
});

test("U26 with --profile images the set adds exactly imgproxy", { skip }, () => {
  const base = services();
  const images = services(["--profile", "images"]);
  assert.deepEqual(images.filter((s) => !base.includes(s)), ["imgproxy"]);
  assert.deepEqual(base.filter((s) => !images.includes(s)), []);
});

test("U27 auth, realtime and supavisor are in none of the default, ui or images sets", { skip }, () => {
  const all = [...services(), ...services(["--profile", "ui"]), ...services(["--profile", "images"])];
  for (const never of ["auth", "realtime", "supavisor"]) assert.ok(!all.includes(never), `${never} must not start`);
});

/** The `services` map of `docker compose config --format json`. */
const configIn = (args = []) => {
  const { stdout, co } = run([...args, "config", "--format", "json"]);
  return { services: JSON.parse(stdout).services, root: co.root };
};
const config = (args = []) => configIn(args).services;

test("U28 api-gw has no depends_on entry for studio", { skip }, () => {
  const gw = config(["--profile", "ui"])["api-gw"];
  assert.ok(!Object.keys(gw.depends_on ?? {}).includes("studio"), JSON.stringify(gw.depends_on));
});

test("U29 storage depends on exactly db (service_healthy) and rest", { skip }, () => {
  const deps = config()["storage"].depends_on;
  assert.deepEqual(Object.keys(deps).sort(), ["db", "rest"]);
  assert.equal(deps.db.condition, "service_healthy");
});

test("U30 storage has ENABLE_IMAGE_TRANSFORMATION set to \"false\"", { skip }, () => {
  assert.equal(config()["storage"].environment.ENABLE_IMAGE_TRANSFORMATION, "false");
});

test("U31 storage has exactly one volume: the named volume ob1-storage at /var/lib/storage", { skip }, () => {
  const vols = config()["storage"].volumes;
  assert.equal(vols.length, 1, JSON.stringify(vols));
  assert.equal(vols[0].type, "volume");
  assert.equal(vols[0].source, "ob1-storage");
  assert.equal(vols[0].target, "/var/lib/storage");
});

test("U32 functions mounts integrations/self-hosted-llm-mcp read-only at /home/deno/functions/self-hosted-llm-mcp", { skip }, () => {
  const { services, root } = configIn();
  const mount = services["functions"].volumes.find((v) => v.target === "/home/deno/functions/self-hosted-llm-mcp");
  assert.ok(mount, "no mount at the target");
  assert.equal(mount.type, "bind");
  assert.equal(mount.source, join(root, "integrations", "self-hosted-llm-mcp"));
  assert.equal(mount.read_only, true);
});

test("U33 functions receives the access key and model settings from .env", { skip }, () => {
  const env = config()["functions"].environment;
  for (const [k, v] of Object.entries(ENV_VALUES)) assert.equal(env[k], v, k);
});

test("U34 functions maps host.docker.internal to host-gateway", { skip }, () => {
  assert.deepEqual(config()["functions"].extra_hosts, ["host.docker.internal=host-gateway"]);
});
