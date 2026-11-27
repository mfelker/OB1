/**
 * harness.test.mjs: self-checks for tests/helpers/harness.mjs (H1–H5).
 * Structural, not behaviors of the recipe: they make sure a red elsewhere
 * comes from the recipe, not from a broken harness.
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { makeCheckout, makeBucketEnv, PIN, runSetup, stubCalls } from "./helpers/harness.mjs";

test("H1 makeCheckout copies the recipe, adds the integration marker, and commits a clean tree", () => {
  const co = makeCheckout();
  try {
    assert.ok(existsSync(join(co.recipe, "metadata.json")));
    assert.ok(!existsSync(join(co.recipe, "tests")));
    assert.ok(existsSync(join(co.root, "integrations", "self-hosted-llm-mcp")));
    const st = spawnSync("git", ["status", "--porcelain"], { cwd: co.root, encoding: "utf8" });
    assert.equal(st.status, 0, st.stderr);
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

// H4/H5: the recipe's scripts must run under a strict POSIX sh. On macOS /bin/sh is bash, which
// accepts bashisms that Debian and Ubuntu's sh (dash) rejects, so the harness runs them under dash
// where it exists. A bashism script must fail through each runner.
const BASHISM = '#!/bin/sh\nif [[ "a" == "a" ]]; then echo bashism-accepted; fi\n';
const noDash = !existsSync("/bin/dash") && "no /bin/dash on this host";

test("H4 runSetup runs setup.sh under a strict POSIX sh, so a bashism fails", { skip: noDash }, () => {
  const co = makeCheckout();
  try {
    writeFileSync(join(co.recipe, "setup.sh"), BASHISM);
    const r = runSetup(co);
    assert.doesNotMatch(r.stdout, /bashism-accepted/);
  } finally { co.cleanup(); }
});

test("H5 the bucket environment runs its script under a strict POSIX sh, so a bashism fails", { skip: noDash }, () => {
  const dir = mkdtempSync(join(tmpdir(), "ob1-006-h5-"));
  const script = join(dir, "bashism.sh");
  writeFileSync(script, BASHISM);
  const b = makeBucketEnv({ script });
  try {
    const r = b.run();
    assert.doesNotMatch(r.stdout, /bashism-accepted/);
  } finally { b.cleanup(); rmSync(dir, { recursive: true, force: true }); }
});
