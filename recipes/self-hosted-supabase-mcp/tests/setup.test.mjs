/**
 * setup.test.mjs: behaviors of setup.sh (U1–U22), per spec 006 contract C1.
 *
 * Each test runs the real `sh setup.sh` in a temporary checkout whose PATH holds
 * only POSIX tools plus stub git and docker (tests/helpers/harness.mjs).
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { makeCheckout, runSetup, stubCalls, PIN, readEnv, envPath, SUPABASE_KEYS, MODEL_SETTINGS, examplePlaceholder } from "./helpers/harness.mjs";

test("U1 without docker on PATH setup fails naming docker and creates nothing", () => {
  const co = makeCheckout({ hide: ["docker"] });
  try {
    const r = runSetup(co);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /\bdocker\b/);
    assert.equal(existsSync(join(co.recipe, "supabase")), false);
  } finally { co.cleanup(); }
});

test("U2 without git on PATH setup fails naming git and creates nothing", () => {
  const co = makeCheckout({ hide: ["git"] });
  try {
    const r = runSetup(co);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /\bgit\b/);
    assert.equal(existsSync(join(co.recipe, "supabase")), false);
  } finally { co.cleanup(); }
});

test("U3 without openssl on PATH setup fails naming openssl and creates nothing", () => {
  const co = makeCheckout({ hide: ["openssl"] });
  try {
    const r = runSetup(co);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /\bopenssl\b/);
    assert.equal(existsSync(join(co.recipe, "supabase")), false);
  } finally { co.cleanup(); }
});

test("U4 on a fresh folder setup makes a shallow clone of the pinned tag into supabase/", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    const clone = stubCalls(co).find((l) => l.startsWith("git clone"));
    assert.ok(clone, "a git clone call");
    const args = clone.split(" ");
    assert.equal(args[args.indexOf("--depth") + 1], "1");
    assert.equal(args[args.indexOf("--branch") + 1], PIN);
    assert.equal(args.at(-1), join(co.recipe, "supabase"));
  } finally { co.cleanup(); }
});

test("U5 with the clone already present at the pin setup makes no clone call and reports it present", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    const before = stubCalls(co).filter((l) => l.startsWith("git clone")).length;
    const r = runSetup(co);
    assert.equal(stubCalls(co).filter((l) => l.startsWith("git clone")).length, before);
    assert.match(r.out, /clone: already present/);
  } finally { co.cleanup(); }
});

/** Every file under dir with its contents, for "nothing changed" checks. */
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p); else out[p] = readFileSync(p, "utf8");
    }
  };
  walk(dir);
  return out;
}

test("U6 with the clone at another tag setup fails naming both tags and changes nothing", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    const clone = join(co.recipe, "supabase");
    writeFileSync(join(clone, ".git", "stub-tag"), "self-hosted/v0.8.4\n");
    const before = snapshot(clone);
    const r = runSetup(co);
    assert.notEqual(r.code, 0);
    assert.ok(r.out.includes("self-hosted/v0.8.4"), "names the clone's tag");
    assert.ok(r.out.includes(PIN), "names the pinned tag");
    assert.deepEqual(snapshot(clone), before);
  } finally { co.cleanup(); }
});

test("U7 when Compose cannot read the recipe setup fails naming the versions and creates no .env", () => {
  const co = makeCheckout();
  try {
    const r = runSetup(co, { STUB_COMPOSE_CONFIG_EXIT: "1", STUB_COMPOSE_VERSION: "2.19.0" });
    assert.notEqual(r.code, 0);
    assert.ok(r.out.includes("2.19.0"), "names the version found");
    assert.ok(r.out.includes("5.6.1"), "names the tested version");
    assert.equal(existsSync(join(co.recipe, "supabase", "docker", ".env")), false);
  } finally { co.cleanup(); }
});

test("U8 on a fresh folder .env holds every generated key and none keeps its .env.example value", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    assert.ok(existsSync(envPath(co)), ".env created");
    const env = readEnv(envPath(co));
    for (const k of SUPABASE_KEYS) {
      assert.ok(env.get(k), `${k} present`);
      assert.notEqual(env.get(k), examplePlaceholder(k), `${k} generated`);
    }
  } finally { co.cleanup(); }
});

test("U9 on a fresh folder MCP_ACCESS_KEY is exactly 64 lowercase hex characters", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    assert.match(readEnv(envPath(co)).get("MCP_ACCESS_KEY") ?? "", /^[0-9a-f]{64}$/);
  } finally { co.cleanup(); }
});

test("U10 two fresh setups produce two different MCP access keys", () => {
  const a = makeCheckout();
  const b = makeCheckout();
  try {
    runSetup(a);
    runSetup(b);
    const ka = readEnv(envPath(a)).get("MCP_ACCESS_KEY");
    const kb = readEnv(envPath(b)).get("MCP_ACCESS_KEY");
    assert.ok(ka && kb, "both keys generated");
    assert.notEqual(ka, kb);
  } finally { a.cleanup(); b.cleanup(); }
});

test("U11 on a fresh folder .env holds every model setting name, blank", () => {
  const co = makeCheckout();
  try {
    runSetup(co);
    const env = readEnv(envPath(co));
    for (const k of MODEL_SETTINGS) assert.equal(env.get(k), "", `${k} present and blank`);
  } finally { co.cleanup(); }
});

test("U12 when key generation fails setup fails and leaves no .env or temporary file in supabase/docker", () => {
  const co = makeCheckout();
  try {
    const r = runSetup(co, { STUB_GENKEYS_FAIL: "1" });
    assert.notEqual(r.code, 0);
    assert.equal(existsSync(envPath(co)), false, "no .env");
    const left = readdirSync(join(co.recipe, "supabase", "docker")).sort();
    assert.deepEqual(left, [".env.example", "docker-compose.yml", "utils"]);
  } finally { co.cleanup(); }
});
