/**
 * acceptance.test.mjs: outer loop (A1–A4, A6–A9) for recipes/self-hosted-supabase-mcp.
 *
 * Each test drives the recipe through its real entry points: `sh setup.sh`,
 * `docker compose config` on the real compose files, and init/create-bucket.sh.
 * Only outside programs are stubbed (git, docker inside setup, curl) and the
 * Supabase clone is a stand-in (tests/helpers/harness.mjs). A running stack is
 * the live acceptance run, not these tests. A5 is tests/verify.sql.
 *
 * Tests still waiting for their units are `todo` (reported, not failing the
 * run) until the commit that makes them pass; RUN_TODO=1 runs them for real.
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  makeCheckout, runSetup, readEnv, envPath, stubCalls, makeBucketEnv, realDocker, compose,
  SUPABASE_KEYS, MODEL_SETTINGS, examplePlaceholder,
} from "./helpers/harness.mjs";

const todo = process.env.RUN_TODO !== "1";
const DOCKER = realDocker();
const noDocker = DOCKER ? false : "docker is not on PATH";
const ALWAYS_ON = ["api-gw", "db", "functions", "ob1-init", "rest", "storage"];
const services = (stdout) => stdout.split("\n").filter(Boolean).sort();

test("A1 after setup, the default service set is exactly the always-on set", { skip: noDocker }, () => {
  const co = makeCheckout();
  try {
    assert.equal(runSetup(co).code, 0);
    const r = compose(co, ["config", "--services"]);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(services(r.stdout), ALWAYS_ON);
  } finally { co.cleanup(); }
});

test("A2 a second setup run reports every piece already present and leaves .env byte-identical", { todo }, () => {
  const co = makeCheckout();
  try {
    assert.equal(runSetup(co).code, 0);
    const before = readFileSync(envPath(co));
    const r = runSetup(co);
    assert.equal(r.code, 0, r.out);
    for (const piece of ["clone", "secrets", "model-settings"]) {
      assert.match(r.out, new RegExp(`${piece}: already present`));
    }
    assert.match(r.out, /function-link: present/);
    assert.deepEqual(readFileSync(envPath(co)), before);
  } finally { co.cleanup(); }
});

test("A3 an interrupted setup is completed by the next run, keeping every key", { todo }, () => {
  const co = makeCheckout();
  try {
    assert.equal(runSetup(co).code, 0);
    const full = readEnv(envPath(co));
    const kept = readFileSync(envPath(co), "utf8").split("\n")
      .filter((l) => !MODEL_SETTINGS.some((k) => l.startsWith(`${k}=`))).join("\n");
    writeFileSync(envPath(co), kept);
    const r = runSetup(co);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /model-settings: completed/);
    assert.match(r.out, /secrets: already present/);
    const after = readEnv(envPath(co));
    for (const k of MODEL_SETTINGS) assert.ok(after.has(k), `${k} restored`);
    for (const k of [...SUPABASE_KEYS, "MCP_ACCESS_KEY"]) assert.equal(after.get(k), full.get(k), `${k} kept`);
  } finally { co.cleanup(); }
});

test("A4 a fresh setup generates every key, prints none, and leaves the checkout clean", { todo }, () => {
  const co = makeCheckout();
  try {
    const r = runSetup(co);
    assert.equal(r.code, 0, r.out);
    const env = readEnv(envPath(co));
    for (const k of SUPABASE_KEYS) {
      assert.ok(env.get(k), `${k} set`);
      assert.notEqual(env.get(k), examplePlaceholder(k), `${k} generated`);
    }
    assert.ok(env.get("MCP_ACCESS_KEY"), "MCP_ACCESS_KEY set");
    for (const [k, v] of env) if (v && v.length >= 16) assert.ok(!r.out.includes(v), `${k} not printed`);
    const st = spawnSync("git", ["status", "--porcelain"], { cwd: co.root, encoding: "utf8" });
    assert.equal(st.stdout, "");
  } finally { co.cleanup(); }
});

test("A6 creating the bucket twice leaves exactly one private ob1-files bucket", () => {
  const b = makeBucketEnv();
  try {
    const env = { STUB_CURL_MODE: "stateful", SERVICE_ROLE_KEY: "test-service-role-not-real" };
    assert.equal(b.run(env).code, 0);
    assert.equal(b.run(env).code, 0);
    const buckets = b.buckets();
    assert.equal(buckets.length, 1);
    assert.equal(buckets[0].id, "ob1-files");
    assert.equal(buckets[0].public, false);
  } finally { b.cleanup(); }
});

test("A7 with the ui profile the set adds exactly studio and meta", { todo, skip: noDocker }, () => {
  const co = makeCheckout();
  try {
    assert.equal(runSetup(co).code, 0);
    const r = compose(co, ["--profile", "ui", "config", "--services"]);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(services(r.stdout), [...ALWAYS_ON, "meta", "studio"].sort());
  } finally { co.cleanup(); }
});

test("A8 functions mounts the checkout's 004 folder read-only and receives the key and model settings", { todo, skip: noDocker }, () => {
  const co = makeCheckout();
  try {
    assert.equal(runSetup(co).code, 0);
    const text = readFileSync(envPath(co), "utf8")
      .replace(/^EMBEDDING_MODEL=.*$/m, "EMBEDDING_MODEL=test-embed")
      .replace(/^CHAT_MODEL=.*$/m, "CHAT_MODEL=test-chat");
    writeFileSync(envPath(co), text);
    const r = compose(co, ["config", "--format", "json"]);
    assert.equal(r.code, 0, r.stderr);
    const fn = JSON.parse(r.stdout).services.functions;
    const mount = fn.volumes.find((v) => v.target === "/home/deno/functions/self-hosted-llm-mcp");
    assert.ok(mount, "004 mount present");
    assert.equal(mount.source, join(co.root, "integrations", "self-hosted-llm-mcp"));
    assert.equal(mount.read_only, true);
    const env = readEnv(envPath(co));
    assert.equal(fn.environment.MCP_ACCESS_KEY, env.get("MCP_ACCESS_KEY"));
    assert.equal(fn.environment.EMBEDDING_MODEL, "test-embed");
    assert.equal(fn.environment.CHAT_MODEL, "test-chat");
  } finally { co.cleanup(); }
});

test("A9 setup completes with only docker, git, openssl and POSIX tools available", { todo }, () => {
  const co = makeCheckout();
  try {
    const r = runSetup(co);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /function-link: present/);
    const programs = new Set(stubCalls(co).map((l) => l.split(" ")[0]));
    for (const p of programs) assert.ok(["git", "docker"].includes(p), `unexpected program ${p}`);
  } finally { co.cleanup(); }
});
