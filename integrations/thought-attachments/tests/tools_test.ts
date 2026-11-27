/** tools (T027-T030, T041, T049, T050, T063, T064): contracts/mcp-tools.md, driven through the MCP client over an in-memory transport. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { buildServer } from "../src/tools.ts";
import { noteMetadata } from "../src/derived.ts";
import { curlLine, pageLink, publicUrl } from "../src/links.ts";
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

Deno.test("U226 find_thought's first_line is the content up to its first line break", async () => {
  const h = await harness();
  storeReturns(h, "Garage shelf\nthree boxes of filters");
  const out = await call(h, "find_thought", { query: "x", mode: "exact" });
  assertEquals((out.data.matches as { first_line: string }[])[0].first_line, "Garage shelf");
});

Deno.test("U227 each find_thought match has id, first_line and captured", async () => {
  const h = await harness();
  const a = await seed(h, "first thought\nmore", null, "2026-03-01T10:00:00.000Z");
  const out = await call(h, "find_thought", { query: "thought", mode: "exact" });
  assertEquals(out.data.matches, [{ id: a.id, first_line: "first thought", captured: "2026-03-01T10:00:00.000Z" }]);
  assertStringIncludes(out.text, a.id);
  assertStringIncludes(out.text, "2026-03-01");
});

Deno.test("U228 find_thought with no match says no matching thought", async () => {
  const h = await harness();
  const out = await call(h, "find_thought", { query: "nothing like this", mode: "exact" });
  assertStringIncludes(out.text, "no matching thought");
  assertEquals(out.data.matches, []);
  assertEquals(out.isError, false);
});

// ---------- attach_file (T029, T041) ----------

const PDF = { file_name: "manual.pdf", declared_type: "application/pdf", declared_size: 1000 };
const NOTHING_CREATED: string[] = ["createAttachment", "insertNote", "signUpload", "embeddingDimension"];

function assertNothingCreated(h: H) {
  assertEquals(h.store.attachments, []);
  assertEquals(h.store.callNames().filter((m) => NOTHING_CREATED.includes(m)), []);
  assertEquals(h.embeddings.calls, []);
}

Deno.test("U229 attach_file with an unknown thought_id is refused, with no row, link or note", async () => {
  const h = await harness();
  const out = await call(h, "attach_file", { thought_id: "00000000-0000-4000-9000-00000000dead", ...PDF });
  assertEquals(out.isError, true);
  assertStringIncludes(out.text, "no thought");
  assertNothingCreated(h);
  assertEquals(h.store.thoughts, []);
});

Deno.test("U230 attach_file with both thought_id and note is refused, and nothing is created", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const out = await call(h, "attach_file", { thought_id: parent.id, note: "a new note", ...PDF });
  assertEquals(out.isError, true);
  assertStringIncludes(out.text, "exactly one");
  assertNothingCreated(h);
  assertEquals(h.store.thoughts.length, 1);
});

Deno.test("U231 attach_file with neither thought_id nor note is refused, and nothing is created", async () => {
  const h = await harness();
  const out = await call(h, "attach_file", { ...PDF });
  assertEquals(out.isError, true);
  assertStringIncludes(out.text, "exactly one");
  assertNothingCreated(h);
});

Deno.test("U232 a checkDeclared refusal returns its message, with no row and no link", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const heic = await call(h, "attach_file", {
    thought_id: parent.id,
    file_name: "IMG_1.heic",
    declared_type: "image/heic",
    declared_size: 1000,
  });
  assertEquals(heic.isError, true);
  assertStringIncludes(heic.text, "share it as JPEG");
  const big = await call(h, "attach_file", { thought_id: parent.id, ...PDF, declared_size: 26 * 1024 * 1024 });
  assertEquals(big.isError, true);
  assertStringIncludes(big.text, String(26 * 1024 * 1024));
  const odd = await call(h, "attach_file", { thought_id: parent.id, file_name: "a.txt", declared_type: "text/plain", declared_size: 5 });
  assertEquals(odd.isError, true);
  assertStringIncludes(odd.text, "PDF, JPEG, PNG and WebP");
  assertNothingCreated(h);
});

Deno.test("U233 the same name, type and size pending on the parent returns that attachment, with no new row", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const pending = h.store.seedAttachment({
    parent_thought_id: parent.id,
    ...{ file_name: "manual.pdf", declared_type: "application/pdf", declared_size: 1000 },
    upload_deadline: new Date(h.clock.now().getTime() + 60_000).toISOString(),
  });
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  assertEquals(out.isError, false);
  assertEquals(out.data.attachment_id, pending.id);
  assertEquals(out.data.short_id, pending.id.replace(/-/g, "").slice(0, 8));
  assertStringIncludes(out.text, "already pending");
  assertStringIncludes(out.text, pending.id);
  assertEquals(h.store.attachments.length, 1);
  assertEquals(h.store.callNames().filter((m) => m === "createAttachment" || m === "signUpload"), []);
});

Deno.test("U235 a successful start writes a row with the parent, base name, declared type and size, tier personal, storage_path and state pending_upload", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF, file_name: "docs/manual.pdf" });
  assertEquals(out.isError, false);
  assertEquals(h.store.attachments.length, 1);
  const row = h.store.attachments[0];
  assertEquals(out.data.attachment_id, row.id);
  assertEquals(row.parent_thought_id, parent.id);
  assertEquals(row.parent_created_here, false);
  assertEquals(row.file_name, "manual.pdf");
  assertEquals(row.declared_type, "application/pdf");
  assertEquals(row.declared_size, 1000);
  assertEquals(row.sensitivity_tier, "personal");
  assertEquals(row.storage_path, `attachments/${row.id}/manual.pdf`);
  assertEquals(row.state, "pending_upload");
});

Deno.test("U234 the same name and type with a different size on the parent creates a new attachment", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const pending = h.store.seedAttachment({
    parent_thought_id: parent.id,
    ...{ file_name: "manual.pdf", declared_type: "application/pdf", declared_size: 1000 },
    upload_deadline: new Date(h.clock.now().getTime() + 60_000).toISOString(),
  });
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF, declared_size: 2000 });
  assertEquals(out.isError, false);
  assertEquals(h.store.attachments.length, 2);
  assert(out.data.attachment_id !== pending.id);
  assertEquals(h.store.attachment(out.data.attachment_id as string)?.declared_size, 2000);
});

Deno.test("U236 upload_deadline is the injected now plus UPLOAD_LINK_MINUTES", async () => {
  const h = await harness({ UPLOAD_LINK_MINUTES: "20" });
  const parent = await seed(h, "dishwasher");
  await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  assertEquals(h.store.attachments[0].upload_deadline, new Date(h.clock.now().getTime() + 20 * 60_000).toISOString());
});

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.test("U237 the stored page_token_hash is the SHA-256 of the token in page_link, and the raw token is in no row", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  const link = out.data.page_link as string;
  assertStringIncludes(link, "#t=");
  const token = link.split("#t=")[1];
  assert(token.length >= 32);
  const row = h.store.attachments[0];
  assertEquals(row.page_token_hash, await sha256Hex(token));
  assert(!JSON.stringify(h.store.attachments).includes(token));
  assert(!JSON.stringify(h.store.thoughts).includes(token));
});

Deno.test("U238 the attach_file result has the ids, deadline, upload, curl line, page link and limits", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  const row = h.store.attachments[0];
  const d = out.data;
  assertEquals(d.attachment_id, row.id);
  assertEquals(d.short_id, row.id.replace(/-/g, "").slice(0, 8));
  assertEquals(d.parent_thought_id, parent.id);
  assertEquals(d.parent_created_here, false);
  assertEquals(d.upload_deadline, row.upload_deadline);
  const upload = d.upload as { url: string; method: string; headers: Record<string, string> };
  assertEquals(upload.method, "PUT");
  assertEquals(upload.headers, { "content-type": "application/pdf", "x-upsert": "false" });
  assertEquals(d.curl, curlLine({ url: upload.url, method: "PUT", headers: upload.headers }, "manual.pdf"));
  assertEquals(d.page_link, pageLink(h.settings, (d.page_link as string).split("#t=")[1]));
  assertEquals(d.limits, { max_bytes: 25 * 1024 * 1024, max_pages: 50 });
  assertStringIncludes(out.text, String(d.short_id));
  assertStringIncludes(out.text, upload.url);
});

Deno.test("U239 upload.url is the signed link passed through publicUrl", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  const signed = h.store.signedUploads[0];
  const url = (out.data.upload as { url: string }).url;
  assert(signed.url.startsWith("http://supabase.internal:8000/"));
  assertEquals(url, publicUrl(h.settings, signed.url));
  assert(url.startsWith("https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/"));
});

Deno.test("U240 a given sensitivity_tier of restricted is stored on the row", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  await call(h, "attach_file", { thought_id: parent.id, ...PDF, sensitivity_tier: "restricted" });
  assertEquals(h.store.attachments[0].sensitivity_tier, "restricted");
});

Deno.test("U329 the same file pending on the parent but past its upload deadline creates a new attachment", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const expired = h.store.seedAttachment({
    parent_thought_id: parent.id,
    ...{ file_name: "manual.pdf", declared_type: "application/pdf", declared_size: 1000 },
    upload_deadline: new Date(h.clock.now().getTime() + 60_000).toISOString(),
  });
  h.clock.advanceSeconds(61);
  const out = await call(h, "attach_file", { thought_id: parent.id, ...PDF });
  assertEquals(out.isError, false);
  assertEquals(h.store.attachments.length, 2);
  assert(out.data.attachment_id !== expired.id);
});

Deno.test("U330 attach_file with only some of file_name, declared_type and declared_size is refused, and nothing is created", async () => {
  const h = await harness();
  const parent = await seed(h, "dishwasher");
  const partial = [
    { file_name: "manual.pdf" },
    { file_name: "manual.pdf", declared_type: "application/pdf" },
    { declared_size: 1000 },
  ];
  for (const details of partial) {
    const out = await call(h, "attach_file", { thought_id: parent.id, ...details });
    assertEquals(out.isError, true, JSON.stringify(details));
    assertStringIncludes(out.text, "give all three, or none for a phone upload");
  }
  assertNothingCreated(h);
});

// ---------- finish_attachment (T030) ----------

async function pendingRow(h: H, fields: Record<string, unknown> = {}) {
  const parent = await seed(h, "dishwasher " + h.store.thoughts.length);
  return h.store.seedAttachment({
    parent_thought_id: parent.id,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 1000,
    storage_path: "attachments/x/manual.pdf",
    ...fields,
  });
}

Deno.test("U241 finish_attachment passes the id and rebuild to services.finish and returns the structured outcome", async () => {
  const h = await harness();
  const row = await pendingRow(h);
  h.finish.outcome = { state: "processed", derived_count: 7, page_count: 12, caption: "a shelf", reason: "all good" };
  const out = await call(h, "finish_attachment", { attachment_id: row.id, rebuild: true });
  assertEquals(h.finish.calls, [{ id: row.id, opts: { rebuild: true } }]);
  assertEquals(out.isError, false);
  assertEquals(out.data, { state: "processed", derived_count: 7, page_count: 12, caption: "a shelf", reason: "all good" });
  assertStringIncludes(out.text, "processed");
  assertStringIncludes(out.text, "7");
});

Deno.test("U242 a busy outcome says busy, naming the running operation as finishing, rebuilding or removing", async () => {
  const h = await harness();
  const row = await pendingRow(h);
  const expected = { finish: "finishing", rebuild: "rebuilding", remove: "removing" } as const;
  for (const [op, word] of Object.entries(expected)) {
    h.finish.outcome = { state: "pending_upload", derived_count: 0, busy: op as "finish" };
    const out = await call(h, "finish_attachment", { attachment_id: row.id });
    assertEquals(out.text, `busy (${word}), try again shortly`);
    assertEquals(out.isError, true);
    assertEquals(out.data.busy, op);
  }
});

// ---------- attach_file: note and phone upload (T041) ----------

Deno.test("U244 attach_file with note embeds the text and saves it through insertNote as the parent, created here", async () => {
  const h = await harness();
  const out = await call(h, "attach_file", { note: "Furnace filters live on the garage shelf", ...PDF });
  assertEquals(out.isError, false);
  assertEquals(h.embeddings.calls, [["Furnace filters live on the garage shelf"]]);
  assertEquals(h.store.thoughts.length, 1);
  const note = h.store.thoughts[0];
  assertEquals(note.content, "Furnace filters live on the garage shelf");
  assertEquals(note.embedding, VEC);
  assertEquals(note.metadata, noteMetadata(h.clock.now()));
  const row = h.store.attachments[0];
  assertEquals(row.parent_thought_id, note.id);
  assertEquals(row.parent_created_here, true);
  assertEquals(out.data.parent_thought_id, note.id);
  assertEquals(out.data.parent_created_here, true);
});

Deno.test("U245 note text matching an existing thought makes it the parent, not created here, and says attached to your existing thought", async () => {
  const h = await harness();
  const existing = await seed(h, "Furnace filters live on the garage shelf");
  const out = await call(h, "attach_file", { note: "  furnace FILTERS live on the garage   shelf ", ...PDF });
  assertEquals(out.isError, false);
  assertEquals(h.store.thoughts.length, 1);
  assertEquals(out.data.parent_thought_id, existing.id);
  assertEquals(out.data.parent_created_here, false);
  assertEquals(h.store.attachments[0].parent_created_here, false);
  assertStringIncludes(out.text, "attached to your existing thought");
});

Deno.test("U246 note with a HEIC declaration saves no note and makes no embedding request", async () => {
  const h = await harness();
  const out = await call(h, "attach_file", {
    note: "Photo of the shelf",
    file_name: "IMG_0001.HEIC",
    declared_type: "image/heic",
    declared_size: 2000,
  });
  assertEquals(out.isError, true);
  assertStringIncludes(out.text, "share it as JPEG");
  assertEquals(h.store.thoughts, []);
  assertNothingCreated(h);
});
