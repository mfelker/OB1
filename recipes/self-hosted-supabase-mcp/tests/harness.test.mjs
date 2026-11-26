/**
 * harness.test.mjs: self-checks for tests/helpers/harness.mjs (H1–H3).
 * Structural, not behaviors of the recipe: they make sure a red elsewhere
 * comes from the recipe, not from a broken harness.
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { makeCheckout, PIN, stubCalls } from "./helpers/harness.mjs";

test("H1 makeCheckout copies the recipe, adds the integration marker, and commits a clean tree", () => {
  const co = makeCheckout();
  try {
    assert.ok(existsSync(join(co.recipe, "metadata.json")));
    assert.ok(!existsSync(join(co.recipe, "tests")));
    assert.ok(existsSync(join(co.root, "integrations", "self-hosted-llm-mcp")));
    const st = spawnSync("git", ["status", "--porcelain"], { cwd: co.root, encoding: "utf8" });
    assert.equal(st.stdout, "");
  } finally { co.cleanup(); }
});

test("H2 the stub git builds the stand-in clone and reports its tag", () => {
  const co = makeCheckout();
  try {
    const env = { PATH: co.bin, STUB_LOG: co.log };
    const dest = join(co.recipe, "supabase");
    const c = spawnSync("git", ["clone", "--depth", "1", "--branch", PIN, "https://example.invalid/x", dest], { env, encoding: "utf8" });
    assert.equal(c.status, 0, c.stderr);
    assert.ok(existsSync(join(dest, "docker", ".env.example")));
    assert.ok(existsSync(join(dest, "docker", "utils", "generate-keys.sh")));
    assert.ok(readFileSync(join(dest, "docker", "docker-compose.yml"), "utf8").includes("api-gw"));
    const d = spawnSync("git", ["-C", dest, "describe", "--tags", "--exact-match"], { env, encoding: "utf8" });
    assert.equal(d.stdout.trim(), PIN);
    assert.ok(stubCalls(co).some((l) => l.startsWith("git clone")));
  } finally { co.cleanup(); }
});

test("H3 hidden tools are not on the checkout's PATH; kept tools are", () => {
  const co = makeCheckout({ hide: ["docker", "openssl"] });
  try {
    const env = { PATH: co.bin };
    const has = (cmd) => spawnSync("/bin/sh", ["-c", `command -v ${cmd}`], { env }).status === 0;
    assert.equal(has("docker"), false);
    assert.equal(has("openssl"), false);
    assert.equal(has("git"), true);
    assert.equal(has("sed"), true);
    assert.equal(has("kubectl"), false);
  } finally { co.cleanup(); }
});
