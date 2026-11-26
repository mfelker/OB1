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
import { existsSync } from "node:fs";
import { join } from "node:path";
import { makeCheckout, runSetup } from "./helpers/harness.mjs";

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
