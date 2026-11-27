/** embeddings (T024): research R3, contracts/settings.md, FR-007, FR-009, FR-011. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.19";
import { createEmbeddingClient } from "../src/embeddings.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { EMBEDDING_API_BASE, EMBEDDING_API_KEY, EMBEDDING_MODEL, envGetter } from "./helpers/env.ts";
import { embeddingResponder, FakeFetch } from "./helpers/fake_fetch.ts";

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
