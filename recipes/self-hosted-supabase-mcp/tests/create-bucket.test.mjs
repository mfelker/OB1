/**
 * create-bucket.test.mjs: behaviors of init/create-bucket.sh (U47–U52), per spec 006 research R9.
 *
 * Each test runs the real `sh init/create-bucket.sh` with a stub curl on PATH (tests/helpers/harness.mjs).
 *
 * Run: node --test tests/   (from recipes/self-hosted-supabase-mcp/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBucketEnv } from "./helpers/harness.mjs";

const KEY = "test-service-role-key-abc123";

test("U47 storage answers 200: exit 0 and the output says the bucket is ready", () => {
  const env = makeBucketEnv();
  try {
    const r = env.run({ SERVICE_ROLE_KEY: KEY, STUB_CURL_MODE: "fixed", STUB_CURL_STATUS: "200", STUB_CURL_BODY: '{"name":"ob1-files"}' });
    assert.equal(r.code, 0);
    assert.match(r.out, /ob1-files.*ready/i);
  } finally { env.cleanup(); }
});

test("U48 storage answers 400 BucketAlreadyExists: exit 0, bucket left as is", () => {
  const env = makeBucketEnv();
  try {
    const body = '{"statusCode":"409","error":"Duplicate","message":"The resource already exists","code":"BucketAlreadyExists"}';
    const r = env.run({ SERVICE_ROLE_KEY: KEY, STUB_CURL_MODE: "fixed", STUB_CURL_STATUS: "400", STUB_CURL_BODY: body });
    assert.equal(r.code, 0);
    assert.match(r.out, /ob1-files.*already/i);
  } finally { env.cleanup(); }
});
