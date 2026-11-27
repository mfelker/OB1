/** tools (T027-T030, T041, T049, T050, T063, T064): contracts/mcp-tools.md, driven through the MCP client over an in-memory transport. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { buildServer } from "../src/tools.ts";
import { loadSettings } from "../src/settings.ts";
import type { EmbeddingClient, FinishOutcome, R, Services, Settings } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { envGetter } from "./helpers/env.ts";
import { FakeStore } from "./helpers/fake_store.ts";
import { inMemoryClient } from "./helpers/mcp.ts";

const DIM = 4;
const VEC = [1, 0, 0, 0];

class FakeEmbeddings implements EmbeddingClient {
  calls: string[][] = [];
  error: string | null = null;
  vector = VEC;
  embed(texts: string[]): Promise<R<number[][]>> {
    this.calls.push(texts);
    if (this.error !== null) return Promise.resolve({ error: this.error });
    return Promise.resolve({ data: texts.map(() => [...this.vector]) });
  }
}

class ScriptedFinish {
  calls: { id: string; opts: { rebuild?: boolean } }[] = [];
  outcome: FinishOutcome = { state: "processed", derived_count: 0 };
  finish: Services["finish"] = (id, opts) => {
    this.calls.push({ id, opts });
    return Promise.resolve(this.outcome);
  };
}

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("bad settings: " + JSON.stringify(result.problems));
  return result.settings;
}

async function harness(overrides: Record<string, string | undefined> = {}) {
  const clock = new Clock();
  const store = new FakeStore({ clock, dimension: DIM });
  const embeddings = new FakeEmbeddings();
  const finish = new ScriptedFinish();
  const settings = settingsWith(overrides);
  const server = buildServer(
    {
      settings,
      store,
      embeddings,
      vision: { configured: false, caption: () => Promise.resolve({ error: "none" }) },
      now: clock.now,
      randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
    },
    { finish: finish.finish },
  );
  const client = await inMemoryClient(server);
  return { clock, store, embeddings, finish, settings, client };
}

type H = Awaited<ReturnType<typeof harness>>;

async function call(h: H, name: string, args: Record<string, unknown> = {}) {
  const result = await h.client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  return {
    text: content.map((c) => c.text).join("\n"),
    data: (result.structuredContent ?? {}) as Record<string, unknown>,
    isError: result.isError === true,
  };
}

const TOOL_NAMES = [
  "attach_file",
  "find_orphan_attachments",
  "find_thought",
  "finish_attachment",
  "get_attachment",
  "list_attachments",
  "remove_attachment",
];

Deno.test("U217 tools/list returns exactly the seven tool names", async () => {
  const h = await harness();
  const { tools } = await h.client.listTools();
  assertEquals(tools.map((t) => t.name).sort(), TOOL_NAMES);
});

Deno.test("U218 each tool's readOnlyHint, destructiveHint and openWorldHint match the contract", async () => {
  const h = await harness();
  const { tools } = await h.client.listTools();
  const hints = (name: string) => tools.find((t) => t.name === name)?.annotations;
  for (const readOnly of ["find_thought", "get_attachment", "list_attachments", "find_orphan_attachments"]) {
    assertEquals(hints(readOnly)?.readOnlyHint, true, readOnly);
  }
  const attach = hints("attach_file");
  assertEquals([attach?.readOnlyHint, attach?.destructiveHint, attach?.openWorldHint], [false, false, true]);
  const finish = hints("finish_attachment");
  assertEquals([finish?.readOnlyHint, finish?.destructiveHint, finish?.openWorldHint], [false, true, true]);
  const remove = hints("remove_attachment");
  assertEquals([remove?.readOnlyHint, remove?.destructiveHint, remove?.openWorldHint], [false, true, false]);
});

interface JsonSchema {
  properties?: Record<string, { type?: string; default?: unknown; enum?: unknown[]; maximum?: number }>;
  required?: string[];
}

Deno.test("U219 each tool's input schema and defaults match the contract", async () => {
  const h = await harness();
  const { tools } = await h.client.listTools();
  const schema = (name: string) => tools.find((t) => t.name === name)?.inputSchema as JsonSchema;
  const find = schema("find_thought");
  assertEquals(find.required, ["query"]);
  assertEquals(find.properties?.mode?.enum, ["meaning", "exact"]);
  assertEquals(find.properties?.mode?.default, "meaning");
  assertEquals(find.properties?.limit?.default, 5);
  assertEquals(Object.keys(schema("attach_file").properties ?? {}).sort(), [
    "declared_size",
    "declared_type",
    "expected_kind",
    "file_name",
    "note",
    "sensitivity_tier",
    "thought_id",
  ]);
  assertEquals(schema("attach_file").required ?? [], []);
  assertEquals(schema("attach_file").properties?.expected_kind?.enum, ["photo", "pdf"]);
  assertEquals(schema("attach_file").properties?.sensitivity_tier?.enum, ["standard", "personal", "restricted"]);
  const finish = schema("finish_attachment");
  assertEquals(finish.required, ["attachment_id"]);
  assertEquals(Object.keys(finish.properties ?? {}).sort(), ["attachment_id", "rebuild"]);
  assertEquals(schema("get_attachment").required, ["attachment_id"]);
  assertEquals(Object.keys(schema("list_attachments").properties ?? {}).sort(), ["derived_thought_id", "thought_id"]);
  assertEquals(schema("list_attachments").required ?? [], []);
  const remove = schema("remove_attachment");
  assertEquals(remove.required, ["attachment_id"]);
  assertEquals(remove.properties?.confirm?.default, false);
  assertEquals(Object.keys(schema("find_orphan_attachments").properties ?? {}), []);
});

// ---------- find_thought (T028) ----------

async function seed(h: H, content: string, embedding: number[] | null = null, created_at?: string) {
  return await h.store.seedThought({ content, embedding, created_at });
}

Deno.test("U220 find_thought in meaning mode embeds the query and returns matchThoughts' matches", async () => {
  const h = await harness();
  const near = await seed(h, "furnace filters", [1, 0, 0, 0]);
  await seed(h, "tax records", [0, 1, 0, 0]);
  h.embeddings.vector = [1, 0, 0, 0];
  const out = await call(h, "find_thought", { query: "where are the filters", limit: 1 });
  assertEquals(h.embeddings.calls, [["where are the filters"]]);
  assertEquals(out.data.matches, [{ id: near.id, first_line: "furnace filters", captured: near.created_at }]);
});

Deno.test("U221 find_thought in exact mode returns findThoughtsExact's matches, with no embedding request", async () => {
  const h = await harness();
  const hit = await seed(h, "Furnace FILTERS are on the shelf");
  await seed(h, "tax records");
  const out = await call(h, "find_thought", { query: "furnace filters", mode: "exact" });
  assertEquals(h.embeddings.calls, []);
  assertEquals(out.data.matches, [{ id: hit.id, first_line: "Furnace FILTERS are on the shelf", captured: hit.created_at }]);
});

Deno.test("U222 find_thought with no limit asks for 5 matches", async () => {
  const h = await harness();
  await call(h, "find_thought", { query: "filters", mode: "exact" });
  assertEquals(h.store.calls.find((c) => c.method === "findThoughtsExact")?.args, ["filters", 5]);
});

Deno.test("U223 find_thought with limit 20 asks for 20 matches", async () => {
  const h = await harness();
  await call(h, "find_thought", { query: "filters", mode: "exact", limit: 20 });
  assertEquals(h.store.calls.find((c) => c.method === "findThoughtsExact")?.args, ["filters", 20]);
});

Deno.test("U328 find_thought with limit 21 asks for 20 matches", async () => {
  const h = await harness();
  await call(h, "find_thought", { query: "filters", mode: "exact", limit: 21 });
  await call(h, "find_thought", { query: "filters", limit: 500 });
  assertEquals(h.store.calls.find((c) => c.method === "findThoughtsExact")?.args, ["filters", 20]);
  assertEquals(h.store.calls.find((c) => c.method === "matchThoughts")?.args[1], 20);
});

/** Makes the store report one match with this raw first line (as a store that did not trim it would). */
function storeReturns(h: H, first_line: string) {
  const match = { id: "t-1", first_line, captured: "2026-01-01T00:00:00.000Z" };
  h.store.override.findThoughtsExact = () => Promise.resolve({ data: [match] });
}

Deno.test("U225 find_thought cuts a 121-character first line to 120 characters", async () => {
  const h = await harness();
  storeReturns(h, "x".repeat(121));
  const out = await call(h, "find_thought", { query: "x", mode: "exact" });
  assertEquals((out.data.matches as { first_line: string }[])[0].first_line, "x".repeat(120));
});

Deno.test("U224 find_thought returns a 120-character first line whole", async () => {
  const h = await harness();
  storeReturns(h, "x".repeat(120));
  const out = await call(h, "find_thought", { query: "x", mode: "exact" });
  assertEquals((out.data.matches as { first_line: string }[])[0].first_line, "x".repeat(120));
});
