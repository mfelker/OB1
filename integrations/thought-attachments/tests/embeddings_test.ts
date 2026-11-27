/** embeddings (T024): research R3, contracts/settings.md, FR-007, FR-009, FR-011. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createEmbeddingClient } from "../src/embeddings.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { EMBEDDING_API_BASE, EMBEDDING_API_KEY, EMBEDDING_MODEL, envGetter } from "./helpers/env.ts";
import { embeddingResponder, FakeFetch, vectorFor } from "./helpers/fake_fetch.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings, got problems: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

const URL_ = `${EMBEDDING_API_BASE}/embeddings`;

function texts(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `text ${i}`);
}

Deno.test("U161 embed sends POST <EMBEDDING_API_BASE>/embeddings with the model and an array input", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(["alpha", "beta"]);
  assert("data" in out);
  assertEquals(ff.requests.length, 1);
  assertEquals(ff.requests[0].method, "POST");
  assertEquals(ff.requests[0].url, URL_);
  assertEquals(ff.requests[0].body, { model: EMBEDDING_MODEL, input: ["alpha", "beta"] });
});

Deno.test("U162 64 texts at the default batch size go in one request", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(texts(64));
  assert("data" in out);
  assertEquals(ff.requests.length, 1);
  assertEquals((ff.requests[0].body as { input: string[] }).input.length, 64);
});

Deno.test("U163 65 texts at the default batch size go in two requests, 64 then 1", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(texts(65));
  assert("data" in out);
  assertEquals(ff.requests.map((r) => (r.body as { input: string[] }).input.length), [64, 1]);
});

Deno.test("U164 with batch size 1 each text goes in its own request", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith({ EMBEDDING_BATCH_SIZE: "1" }), ff.fetch);
  const out = await client.embed(texts(3));
  assert("data" in out);
  assertEquals(ff.requests.map((r) => (r.body as { input: string[] }).input), [["text 0"], ["text 1"], ["text 2"]]);
});

Deno.test("U165 each request carries Authorization Bearer with the configured embedding key", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith({ EMBEDDING_BATCH_SIZE: "2" }), ff.fetch);
  const out = await client.embed(texts(3));
  assert("data" in out);
  assertEquals(ff.requests.length, 2);
  for (const r of ff.requests) assertEquals(r.headers["authorization"], `Bearer ${EMBEDDING_API_KEY}`);
});

Deno.test("U166 the vectors come back in input order across batches", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8));
  const client = createEmbeddingClient(settingsWith({ EMBEDDING_BATCH_SIZE: "2" }), ff.fetch);
  const input = texts(5);
  const out = await client.embed(input);
  assertEquals(out, { data: input.map((t) => vectorFor(t, 8)) });
});

Deno.test("U167 an unreachable endpoint fails the call with a reason naming it unreachable", async () => {
  const ff = new FakeFetch().on("POST", URL_, { networkError: "connection refused" });
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(["alpha"]);
  assert("error" in out);
  assertStringIncludes(out.error, "unreachable");
  assertStringIncludes(out.error, EMBEDDING_API_BASE);
});

Deno.test("U168 a non-2xx status fails the call with the status in the reason", async () => {
  const ff = new FakeFetch().on("POST", URL_, { status: 503, body: "upstream down" });
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(["alpha"]);
  assert("error" in out);
  assertStringIncludes(out.error, "503");
});

Deno.test("U169 a malformed body (no data, or a different vector count) fails the call", async () => {
  for (const body of [{ object: "list" }, "not json", { data: [{ embedding: [1, 2] }] }]) {
    const ff = new FakeFetch().on("POST", URL_, { status: 200, body });
    const client = createEmbeddingClient(settingsWith(), ff.fetch);
    const out = await client.embed(["alpha", "beta"]);
    assert("error" in out, `expected an error for ${JSON.stringify(body)}`);
    assertStringIncludes(out.error, "malformed");
  }
});

Deno.test("U170 a failure in a later batch fails the whole call with no partial vectors", async () => {
  const ff = new FakeFetch().on("POST", URL_, embeddingResponder(8), { status: 500, body: "boom" });
  const client = createEmbeddingClient(settingsWith({ EMBEDDING_BATCH_SIZE: "2" }), ff.fetch);
  const out = await client.embed(texts(4));
  assertEquals(ff.requests.length, 2);
  assert("error" in out);
  assert(!("data" in out));
  assertStringIncludes(out.error, "500");
});

Deno.test("U171 a key value in a server's error body is redacted from the reason", async () => {
  const body = `invalid api key ${EMBEDDING_API_KEY} for this account`;
  const ff = new FakeFetch().on("POST", URL_, { status: 401, body });
  const client = createEmbeddingClient(settingsWith(), ff.fetch);
  const out = await client.embed(["alpha"]);
  assert("error" in out);
  assertStringIncludes(out.error, "401");
  assert(!out.error.includes(EMBEDDING_API_KEY), out.error);
});
