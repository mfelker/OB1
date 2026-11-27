/**
 * Outer loop (T012): every acceptance behavior A1–A63 of tdd/test-list.md, as
 * `todo` tests. Each drives the composed app, `createApp(input).fetch`, through
 * the MCP route and the page routes, with the fake store (database and Storage),
 * the real embedding and vision clients over the fake fetch, `loadSettings` over
 * tests/helpers/env.ts and the fake clock. Assertions are on observable results:
 * MCP results, page-route status and JSON, the store's rows and objects, and the
 * fake fetch's request log.
 *
 * Stream A flips each `todo(` to `Deno.test(` in the commit that turns it green
 * (T033, T046, T051, T059, T065). Run the reds with RUN_TODO=1.
 *
 * Field names are those the contracts name (`attachment_id`, `upload`,
 * `page_link`, `state`, `reason`, `derived_count`, `caption`, `page_count`,
 * `download_link`, `last_rebuild_error`, `caption_model`, `id`, `first_line`,
 * `captured`, `expected_kind`, `accepted_types`, `caps`). Where a contract names
 * a value but not its key (a short id, the curl line, a page route's upload
 * link, a record in a list), the tests look the value up wherever it sits in the
 * result, so they don't fix a name the contracts left open.
 */
// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals, assertMatch, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createApp } from "../src/app.ts";
import { createEmbeddingClient } from "../src/embeddings.ts";
import { loadSettings } from "../src/settings.ts";
import type { AppInput, AttachmentRow, Deps, FetchApp, Settings } from "../src/types.ts";
import { createVisionClient } from "../src/vision.ts";
import { Clock } from "./helpers/clock.ts";
import {
  BRAIN_KEY,
  EMBEDDING_API_BASE,
  envGetter,
  SECRET_VALUES,
  SUPABASE_URL,
  VISION_API_BASE,
  VISION_MODEL,
} from "./helpers/env.ts";
import { chatReply, embeddingResponder, FakeFetch, type Handler, vectorFor } from "./helpers/fake_fetch.ts";
import { FakeStore, type FakeThought, shortId } from "./helpers/fake_store.ts";
import { corruptPdf, heicBytes, jpegBytes, scannedPdf, textPdf } from "./helpers/fixtures.ts";
import { FUNCTION_URL, mcpCall } from "./helpers/mcp.ts";
import { todo } from "./helpers/todo.ts";

// ---------------------------------------------------------------- constants

const MB = 1_048_576;
const EMBEDDINGS_URL = `${EMBEDDING_API_BASE}/embeddings`;
const VISION_URL = `${VISION_API_BASE}/chat/completions`;
const CAPTION = "A grey metal garage shelf with three boxed furnace filters on the middle level.";
const LAN = "http://192.168.1.20:8000";
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const SHARE_AS_JPEG = /share it as JPEG/i;

/** A three-page manual whose facts each sit on a known page (A1, A2). */
const MANUAL_PAGES = [
  "Dishwasher DW-500 service manual. The replacement filter part number is DWF-1138.",
  "Maintenance. Run the descaler cycle every 90 days to keep the heater clean.",
  "Troubleshooting. Error code E24 means the drain hose is blocked or kinked.",
];
const MANUAL_FACTS = [
  { fact: "part number is DWF-1138", page: 1 },
  { fact: "descaler cycle every 90 days", page: 2 },
  { fact: "Error code E24 means the drain hose is blocked", page: 3 },
];

// ---------------------------------------------------------------- the world

interface WorldOptions {
  /** Environment overrides over tests/helpers/env.ts (`undefined` unsets). */
  env?: Record<string, string | undefined>;
  /** Reuse a store (and its clock) from an earlier world, e.g. to change a setting between calls. */
  store?: FakeStore;
  /** Handlers for the embeddings route (default: a 1536-number vector per input). */
  embeddings?: Handler[];
  /** Handlers for the vision route (default: the scripted caption by VISION_MODEL). */
  vision?: Handler[];
}

interface World {
  app: FetchApp;
  store: FakeStore;
  clock: Clock;
  net: FakeFetch;
  settings: Settings;
}

/** Deterministic `Deps.randomBytes`: every call returns new bytes. */
function counterBytes(): (n: number) => Uint8Array {
  let next = 1;
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = (next++ * 131 + i * 17) & 0xff;
    return out;
  };
}

/** The composed app over fakes, with settings loaded from the test environment. */
function world(opts: WorldOptions = {}): World {
  const loaded = loadSettings(envGetter(opts.env));
  if (!loaded.ok) throw new Error(`test setup: settings problems ${JSON.stringify(loaded.problems)}`);
  const settings = loaded.settings;
  const store = opts.store ?? new FakeStore({ clock: new Clock(), bucket: settings.attachmentsBucket });
  const net = new FakeFetch();
  net.on("POST", EMBEDDINGS_URL, ...(opts.embeddings ?? [embeddingResponder(1536)]));
  net.on("POST", VISION_URL, ...(opts.vision ?? [() => chatReply(CAPTION, settings.visionModel)]));
  const deps: Deps = {
    settings,
    store,
    embeddings: createEmbeddingClient(settings, net.fetch),
    vision: createVisionClient(settings, net.fetch),
    now: store.clock.now,
    randomBytes: counterBytes(),
  };
  const input: AppInput = { ok: true, deps };
  return { app: createApp(input), store, clock: store.clock, net, settings };
}

// ---------------------------------------------------------------- calling the app

interface ToolResult {
  isError: boolean;
  text: string;
  sc: any;
  /** The JSON-RPC error, when the call was refused before reaching a tool. */
  rpcError?: any;
}

/** `tools/call` through the MCP route. `key` defaults to the brain key; `null` sends none. */
async function tool(w: { app: FetchApp }, name: string, args: Record<string, unknown>, key: string | null = BRAIN_KEY) {
  const { message } = await mcpCall(w.app.fetch, "tools/call", { name, arguments: args }, key ?? undefined);
  if (!message) throw new Error(`no JSON-RPC reply to ${name}`);
  if (message.error) return { isError: true, text: "", sc: {}, rpcError: message.error } as ToolResult;
  const result = message.result as any;
  const text = (result.content ?? []).map((c: any) => c.text ?? "").join("\n");
  return { isError: result.isError === true, text, sc: result.structuredContent ?? {} } as ToolResult;
}

/** POST a page route (no brain key unless `headers` adds one). */
async function page(
  w: { app: FetchApp },
  route: "start" | "info" | "finish",
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = await w.app.fetch(
    new Request(`${FUNCTION_URL}/page/${route}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
  const raw = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }
  return { status: response.status, json, raw };
}

// ---------------------------------------------------------------- reading results

/** Every string anywhere inside `value`. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

/** The first object anywhere inside `value` that has a property equal to `wanted`. */
function recordWith(value: unknown, wanted: unknown): any {
  if (Array.isArray(value)) {
    for (const v of value) {
      const hit = recordWith(v, wanted);
      if (hit) return hit;
    }
  } else if (value && typeof value === "object") {
    if (Object.values(value).some((v) => v === wanted)) return value;
    for (const v of Object.values(value)) {
      const hit = recordWith(v, wanted);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** True when `value` (deeply) holds `wanted` as a property value. */
const holds = (value: unknown, wanted: unknown) => recordWith(value, wanted) !== undefined;

/** A tool result's text plus every string in its structured content, for message checks. */
const said = (r: ToolResult) => [r.text, ...strings(r.sc)].join("\n");

/** A page route's whole body. */
const pageSaid = (r: { raw: string }) => r.raw;

/** The signed Storage upload link inside a result, if any. */
const uploadLinkIn = (value: unknown) => strings(value).find((s) => s.includes("/storage/v1/object/upload/sign/"));

/** The page token in a page link's fragment. */
const tokenOf = (pageLink: string) => pageLink.split("#t=")[1];

/** Derived thoughts of an attachment, by their metadata (data-model.md "Derived thought"). */
const derivedOf = (w: World, attachmentId: string): FakeThought[] =>
  w.store.thoughts.filter((t) => t.metadata.attachment_id === attachmentId);

const row = (w: World, id: string): AttachmentRow | undefined => w.store.attachment(id);

/** Everything a call could change, for "changes nothing" checks. */
function snapshot(w: World) {
  return structuredClone({
    thoughts: w.store.thoughts,
    attachments: w.store.attachments,
    objects: [...w.store.objects.entries()].map(([path, o]) => [path, o.bytes.length, o.createdAt]),
    signedUploads: w.store.signedUploads.length,
    signedDownloads: w.store.signedDownloads.length,
  });
}

/** Poll until `cond` holds (for calls held at a fake boundary). */
async function until(cond: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 2000; i++) {
    if (cond()) return;
    await new Promise((r) => setTimeout(r, 1));
  }
  throw new Error(`timed out waiting for ${what}`);
}

// ---------------------------------------------------------------- flows

/** An owner thought, stored with an embedding as the core capture stores one. */
const ownerThought = (w: World, content: string, embedding = vectorFor(content)) =>
  w.store.seedThought({ content, embedding });

/** Upload bytes to a signed upload link, as Storage would receive them (the link's token names the path). */
function put(w: World, uploadUrl: string, bytes: Uint8Array): void {
  const token = new URL(uploadUrl).searchParams.get("token");
  const signed = w.store.signedUploads.find((s) => s.token === token);
  if (!signed) throw new Error(`no signed upload link with token ${token}`);
  w.store.putObject(signed.path, bytes);
}

/** `attach_file` for a command upload; fails the test unless it succeeds. */
async function attachCommand(w: World, parentId: string, name: string, type: string, bytes: Uint8Array | number) {
  const size = typeof bytes === "number" ? bytes : bytes.length;
  const r = await tool(w, "attach_file", {
    thought_id: parentId,
    file_name: name,
    declared_type: type,
    declared_size: size,
  });
  assert(!r.isError, `attach_file refused: ${said(r)}`);
  return { id: r.sc.attachment_id as string, upload: r.sc.upload, pageLink: r.sc.page_link as string, r };
}

/** `attach_file` for a phone upload (no file details); fails the test unless it succeeds. */
async function attachPhone(w: World, args: Record<string, unknown>) {
  const r = await tool(w, "attach_file", args);
  assert(!r.isError, `attach_file refused: ${said(r)}`);
  return { id: r.sc.attachment_id as string, token: tokenOf(r.sc.page_link), pageLink: r.sc.page_link as string, r };
}

const finish = (w: World, id: string, rebuild = false) =>
  tool(w, "finish_attachment", rebuild ? { attachment_id: id, rebuild: true } : { attachment_id: id });

/** Attach, upload and finish a command upload; returns the attachment id and the finish result. */
async function uploadAndFinish(w: World, parentId: string, name: string, type: string, bytes: Uint8Array) {
  const a = await attachCommand(w, parentId, name, type, bytes);
  put(w, a.upload.url, bytes);
  return { id: a.id, done: await finish(w, a.id) };
}

/** A processed photo on a fresh owner thought. */
async function processedPhoto(w: World) {
  const parent = await ownerThought(w, "The garage shelf by the side door");
  const { id, done } = await uploadAndFinish(w, parent.id, "shelf.jpg", "image/jpeg", jpegBytes(4096));
  assertEquals(done.sc.state, "processed", `setup: photo not processed: ${said(done)}`);
  return { parent, id };
}

/** The source line pattern of a derived thought (FR-025). */
const SOURCE_LINE = /^From (.+), (?:pages? (\d+)(?:–(\d+))?|photo) \(attachment ([0-9a-f]{8})\)$/;

// ============================================================== User Story 1

Deno.test(
  "A1 a 3-page text PDF attached, uploaded and finished is stored, processed with page_count 3, with N passages naming the attachment and parent",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const pdf = await textPdf(MANUAL_PAGES);
    const { id, done } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", pdf);
    const r = row(w, id)!;
    const passages = derivedOf(w, id);
    assertEquals(
      {
        result: { state: done.sc.state, page_count: done.sc.page_count },
        row: { state: r.state, page_count: r.page_count, derived_count: r.derived_count },
        stored: w.store.objects.get(r.storage_path!)?.bytes.length,
        parents: passages.map((t) => t.metadata.parent_thought_id),
      },
      {
        result: { state: "processed", page_count: 3 },
        row: { state: "processed", page_count: 3, derived_count: passages.length },
        stored: pdf.length,
        parents: passages.map(() => parent.id),
      },
    );
    assert(passages.length >= 1, "no passage thoughts");
  },
);

Deno.test(
  "A2 every listed fact is in a passage whose source line names the file, a page range including its page and the short id, with an embedding of the brain's dimension",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    const passages = derivedOf(w, id);
    for (const { fact, page } of MANUAL_FACTS) {
      const hit = passages.find((t) => t.content.includes(fact));
      assert(hit, `no passage holds "${fact}"`);
      const m = hit.content.split("\n")[0].match(SOURCE_LINE);
      assert(m, `not a source line: ${hit.content.split("\n")[0]}`);
      const first = Number(m[2]);
      const last = m[3] ? Number(m[3]) : first;
      assertEquals(
        { file: m[1], short: m[4], pageInRange: first <= page && page <= last, dims: hit.embedding?.length },
        { file: "manual.pdf", short: shortId(id), pageInRange: true, dims: 1536 },
      );
    }
  },
);

Deno.test(
  "A3 attach_file with the same name, type and size while the first is pending creates no second row and returns the existing id",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const first = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
    const again = await tool(w, "attach_file", {
      thought_id: parent.id,
      file_name: "manual.pdf",
      declared_type: "application/pdf",
      declared_size: 4096,
    });
    assertEquals(
      {
        points_to_first: holds(again.sc, first.id) || said(again).includes(shortId(first.id)),
        rows: w.store.attachments.length,
      },
      { points_to_first: true, rows: 1 },
    );
  },
);

Deno.test(
  "A4 the same bytes finished on a second attachment of the same parent end refused naming the first's short id, with its object deleted and the first unchanged",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const pdf = await textPdf(MANUAL_PAGES);
    const first = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", pdf);
    assertEquals(first.done.sc.state, "processed");
    const firstBefore = structuredClone({ row: row(w, first.id), passages: derivedOf(w, first.id) });
    const second = await uploadAndFinish(w, parent.id, "manual-copy.pdf", "application/pdf", pdf);
    const r2 = row(w, second.id)!;
    assertEquals(
      {
        state: second.done.sc.state,
        names_first: said(second.done).includes(`already attached to this thought as ${shortId(first.id)}`),
        object: w.store.objects.has(r2.storage_path!),
        derived: derivedOf(w, second.id).length,
        first: { row: row(w, first.id), passages: derivedOf(w, first.id) },
      },
      { state: "refused", names_first: true, object: false, derived: 0, first: firstBefore },
    );
  },
);

Deno.test(
  "A5 an owner thought whose text equals a passage's body is unchanged after finishing, and the passage is its own row with the attachment's metadata",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const body = MANUAL_PAGES[1];
    const owner = await ownerThought(w, body);
    const ownerBefore = structuredClone(owner);
    const { id } = await uploadAndFinish(w, parent.id, "page.pdf", "application/pdf", await textPdf([body]));
    const passage = derivedOf(w, id).find((t) => t.content.includes(body));
    assertEquals(
      { owner: w.store.thought(owner.id), separate: passage !== undefined && passage.id !== owner.id },
      { owner: ownerBefore, separate: true },
    );
  },
);

Deno.test(
  "A6 find_thought (meaning) finds a thought stored as the core stores it, with first line and date, and attach_file accepts its id",
  async () => {
    const w = world();
    const query = "where are the spare furnace filters";
    const target = await ownerThought(w, "The spare furnace filters are on the garage shelf", vectorFor(query));
    for (let i = 0; i < 7; i++) await ownerThought(w, `Unrelated note number ${i}`);
    const found = await tool(w, "find_thought", { query });
    const match = recordWith(found.sc, target.id);
    assert(match, `target not among the matches: ${said(found)}`);
    assertEquals({ first_line: match.first_line, captured: String(match.captured).slice(0, 10) }, {
      first_line: "The spare furnace filters are on the garage shelf",
      captured: target.created_at.slice(0, 10),
    });
    await attachCommand(w, target.id, "shelf.jpg", "image/jpeg", 4096);
  },
);

Deno.test(
  "A7 the short id read from a passage's source line, given to get_attachment, returns that attachment and a download link",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    const short = derivedOf(w, id)[0].content.split("\n")[0].match(SOURCE_LINE)?.[4];
    assert(short, "no short id in the source line");
    const got = await tool(w, "get_attachment", { attachment_id: short });
    assertEquals(
      { isError: got.isError, same: holds(got.sc, id) || said(got).includes(id), link: typeof got.sc.download_link },
      { isError: false, same: true, link: "string" },
    );
  },
);

Deno.test(
  "A8 the same PDF on two thoughts gives two disjoint passage sets, and a confirmed removal of one leaves the other's row and passages",
  async () => {
    const w = world();
    const pdf = await textPdf(MANUAL_PAGES);
    const a = await ownerThought(w, "Kitchen dishwasher DW-500");
    const b = await ownerThought(w, "Holiday cottage dishwasher, same model");
    const one = await uploadAndFinish(w, a.id, "manual.pdf", "application/pdf", pdf);
    const two = await uploadAndFinish(w, b.id, "manual.pdf", "application/pdf", pdf);
    const ids = (id: string) => derivedOf(w, id).map((t) => t.id);
    assertEquals(ids(one.id).filter((x) => ids(two.id).includes(x)), []);
    assert(ids(one.id).length > 0 && ids(two.id).length > 0, "a passage set is empty");
    const keep = structuredClone({ row: row(w, two.id), passages: derivedOf(w, two.id) });
    const removed = await tool(w, "remove_attachment", { attachment_id: one.id, confirm: true });
    assertEquals({ ok: !removed.isError, two: { row: row(w, two.id), passages: derivedOf(w, two.id) } }, {
      ok: true,
      two: keep,
    });
  },
);

Deno.test(
  "A9 every passage of a processed PDF has type reference and topics attachment and the base name, and none is an observation",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    const passages = derivedOf(w, id);
    assert(passages.length > 0, "no passages");
    assertEquals(
      passages.map((t) => ({ type: t.metadata.type, topics: t.metadata.topics })),
      passages.map(() => ({ type: "reference", topics: ["attachment", "manual.pdf"] })),
    );
  },
);

Deno.test("A10 an MCP request with no key or a wrong key gets an authorization error and changes nothing", async () => {
  const w = world();
  const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
  const before = snapshot(w);
  const args = {
    thought_id: parent.id,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 4096,
  };
  const none = await tool(w, "attach_file", args, null);
  const wrong = await tool(w, "attach_file", args, "not-the-brain-key");
  // The core server's authorization error: a JSON-RPC error with code -32001 (W/server/index.ts, INV-4).
  assertEquals({ codes: [none.rpcError?.code, wrong.rpcError?.code], after: snapshot(w) }, {
    codes: [-32001, -32001],
    after: before,
  });
});

Deno.test("A11 tools/list returns exactly the seven tools with the contract's annotations", async () => {
  const w = world();
  const { message } = await mcpCall(w.app.fetch, "tools/list", {}, BRAIN_KEY);
  const tools = ((message?.result as any)?.tools ?? []) as any[];
  const hints = Object.fromEntries(
    tools.map((t) => [t.name, {
      readOnlyHint: t.annotations?.readOnlyHint,
      ...(t.annotations?.readOnlyHint ? {} : {
        destructiveHint: t.annotations?.destructiveHint,
        openWorldHint: t.annotations?.openWorldHint,
      }),
    }]),
  );
  assertEquals(hints, {
    find_thought: { readOnlyHint: true },
    attach_file: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    finish_attachment: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    get_attachment: { readOnlyHint: true },
    list_attachments: { readOnlyHint: true },
    remove_attachment: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    find_orphan_attachments: { readOnlyHint: true },
  });
});

Deno.test("A12 attach_file with an unknown thought_id is refused, and no row, link or note is created", async () => {
  const w = world();
  await ownerThought(w, "Kitchen dishwasher DW-500");
  const before = snapshot(w);
  const r = await tool(w, "attach_file", {
    thought_id: "00000000-0000-4000-9000-0000000000ff",
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 4096,
  });
  assertEquals({ isError: r.isError, after: snapshot(w) }, { isError: true, after: before });
});

Deno.test(
  "A53 /page/start or /page/finish carrying the brain key but no valid page token gets 410 and changes nothing",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const before = snapshot(w);
    const key = { "x-brain-key": BRAIN_KEY };
    const start = await page(w, "start", { name: "shelf.jpg", type: "image/jpeg", size: 4096 }, key);
    const startBad = await page(w, "start", {
      token: "not-a-page-token",
      name: "shelf.jpg",
      type: "image/jpeg",
      size: 4096,
    }, key);
    const fin = await page(w, "finish", {}, key);
    const finBad = await page(w, "finish", { token: "not-a-page-token" }, key);
    assertEquals({ statuses: [start.status, startBad.status, fin.status, finBad.status], after: snapshot(w) }, {
      statuses: [410, 410, 410, 410],
      after: before,
    });
  },
);

Deno.test(
  "A57 attach_file for the same file after the first's deadline passed unused creates a new attachment, and the orphan check still lists the first",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const first = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
    w.clock.advanceMinutes(61);
    const second = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
    const orphans = await tool(w, "find_orphan_attachments", {});
    assertEquals({ newId: second.id !== first.id, listed: holds(orphans.sc, first.id) }, { newId: true, listed: true });
  },
);

Deno.test(
  "A59 an owner thought equal to an attachment's whole derived content makes the finish fail naming the conflict, with that thought unchanged and no derived thought",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const bytes = jpegBytes(4096);
    const a = await attachCommand(w, parent.id, "shelf.jpg", "image/jpeg", bytes);
    const owner = await ownerThought(w, `From shelf.jpg, photo (attachment ${shortId(a.id)})\n${CAPTION}`);
    const ownerBefore = structuredClone(owner);
    put(w, a.upload.url, bytes);
    const done = await finish(w, a.id);
    assertMatch(said(done), /conflict|already exists|same text|identical/i);
    assertEquals(
      { state: done.sc.state, owner: w.store.thought(owner.id), derived: derivedOf(w, a.id).length },
      { state: "failed", owner: ownerBefore, derived: 0 },
    );
  },
);

// ============================================================== User Story 2

Deno.test(
  "A13 a JPEG finished with a configured vision model gives one caption thought with its source line, the row processed, and caption_model and extractor_model equal to VISION_MODEL",
  async () => {
    const w = world();
    const { id } = await processedPhoto(w);
    const captions = derivedOf(w, id);
    assertEquals(
      {
        count: captions.length,
        firstLine: captions[0]?.content.split("\n")[0],
        state: row(w, id)?.state,
        caption_model: row(w, id)?.caption_model,
        extractor_model: (captions[0]?.metadata.provenance as any)?.extractor_model,
      },
      {
        count: 1,
        firstLine: `From shelf.jpg, photo (attachment ${shortId(id)})`,
        state: "processed",
        caption_model: VISION_MODEL,
        extractor_model: VISION_MODEL,
      },
    );
  },
);

Deno.test(
  "A14 with only the page token, /page/start, the PUT and /page/finish finish the photo, and a second start and finish with that token each get 410",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const bytes = jpegBytes(4096);
    const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: bytes.length });
    const link = uploadLinkIn(start.json);
    assert(start.status === 200 && link, `no upload link: ${start.status} ${start.raw}`);
    put(w, link, bytes);
    const done = await page(w, "finish", { token });
    const again = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: bytes.length });
    const againFinish = await page(w, "finish", { token });
    assertEquals(
      { finished: [done.status, done.json?.state, row(w, id)?.state], again: [again.status, againFinish.status] },
      { finished: [200, "processed", "processed"], again: [410, 410] },
    );
  },
);

Deno.test(
  "A15 attach_file with a HEIC declared type is refused with the share-it-as-JPEG message, and no row or link is created",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const before = snapshot(w);
    const r = await tool(w, "attach_file", {
      thought_id: parent.id,
      file_name: "IMG_0412.HEIC",
      declared_type: "image/heic",
      declared_size: 4096,
    });
    assertMatch(said(r), SHARE_AS_JPEG);
    assertEquals({ isError: r.isError, after: snapshot(w) }, { isError: true, after: before });
  },
);

Deno.test(
  "A16 /page/start with a picked HEIC file is refused with the share-it-as-JPEG message and returns no upload link",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const signedBefore = w.store.signedUploads.length;
    const start = await page(w, "start", { token, name: "IMG_0412.HEIC", type: "image/heic", size: 4096 });
    assertMatch(pageSaid(start), SHARE_AS_JPEG);
    assertEquals({ link: uploadLinkIn(start.json), signed: w.store.signedUploads.length }, {
      link: undefined,
      signed: signedBefore,
    });
  },
);

Deno.test(
  "A17 HEIC bytes uploaded under a JPEG declaration are refused at finishing with the share-it-as-JPEG message, the object deleted and the row refused",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const bytes = heicBytes(4096);
    const { id, done } = await uploadAndFinish(w, parent.id, "shelf.jpg", "image/jpeg", bytes);
    assertMatch(said(done), SHARE_AS_JPEG);
    assertEquals({ state: row(w, id)?.state, object: w.store.objects.has(row(w, id)!.storage_path!) }, {
      state: "refused",
      object: false,
    });
  },
);

Deno.test(
  "A18 attach_file with note and no thought id creates one observation thought with an embedding of the brain's dimension, as the attachment's parent created here",
  async () => {
    const w = world();
    const note = "The spare furnace filters are on this shelf";
    const { id } = await attachPhone(w, { note, expected_kind: "photo" });
    const notes = w.store.thoughts.filter((t) => t.content === note);
    const r = row(w, id)!;
    assertEquals(
      {
        count: notes.length,
        type: notes[0]?.metadata.type,
        source: notes[0]?.metadata.source,
        dims: notes[0]?.embedding?.length,
        parent: r.parent_thought_id === notes[0]?.id,
        createdHere: r.parent_created_here,
      },
      { count: 1, type: "observation", source: "thought-attachments", dims: 1536, parent: true, createdHere: true },
    );
  },
);

Deno.test(
  "A19 after a page upload, /page/finish alone returns processed with the caption, and the caption thought exists",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const bytes = jpegBytes(4096);
    const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: bytes.length });
    put(w, uploadLinkIn(start.json)!, bytes);
    const done = await page(w, "finish", { token });
    assertEquals(
      {
        state: done.json?.state,
        caption: done.json?.caption,
        captions: derivedOf(w, id).map((t) => t.content.split("\n")[1]),
      },
      { state: "processed", caption: CAPTION, captions: [CAPTION] },
    );
  },
);

Deno.test(
  "A20 a page token for attachment X never signs an upload for Y nor finishes Y; Y's row and object are unchanged",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const x = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const y = await attachCommand(w, parent.id, "box.jpg", "image/jpeg", jpegBytes(2048));
    put(w, y.upload.url, jpegBytes(2048));
    const yBefore = structuredClone({
      row: row(w, y.id),
      object: w.store.objects.get(row(w, y.id)!.storage_path!)?.bytes.length,
    });
    const signedBefore = w.store.signedUploads.length;
    const start = await page(w, "start", { token: x.token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
    put(w, uploadLinkIn(start.json)!, jpegBytes(4096));
    await page(w, "finish", { token: x.token });
    const newPaths = w.store.signedUploads.slice(signedBefore).map((s) => s.path);
    assertEquals(
      {
        signedOnlyX: newPaths.length > 0 && newPaths.every((p) => p.startsWith(`attachments/${x.id}/`)),
        x: row(w, x.id)?.state,
        y: { row: row(w, y.id), object: w.store.objects.get(row(w, y.id)!.storage_path!)?.bytes.length },
      },
      { signedOnlyX: true, x: "processed", y: yBefore },
    );
  },
);

Deno.test(
  "A21 with VISION_* unset a finished photo stays stored and fetchable, is not_captioned with the reason, and has no caption thought",
  async () => {
    const w = world({ env: { VISION_API_BASE: undefined, VISION_API_KEY: undefined, VISION_MODEL: undefined } });
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, done } = await uploadAndFinish(w, parent.id, "shelf.jpg", "image/jpeg", jpegBytes(4096));
    const got = await tool(w, "get_attachment", { attachment_id: id });
    assert((row(w, id)?.state_reason ?? "").length > 0, "no reason recorded");
    assertEquals(
      {
        state: done.sc.state,
        stored: w.store.objects.has(row(w, id)!.storage_path!),
        link: typeof got.sc.download_link,
        captions: derivedOf(w, id).length,
        visionCalls: w.net.requestsTo(VISION_URL).length,
      },
      { state: "not_captioned", stored: true, link: "string", captions: 0, visionCalls: 0 },
    );
  },
);

Deno.test(
  "A22 with the vision endpoint answering 500 a finished photo is not_captioned with that reason and has no caption thought",
  async () => {
    const w = world({ vision: [{ status: 500, body: { error: "model crashed" } }] });
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, done } = await uploadAndFinish(w, parent.id, "shelf.jpg", "image/jpeg", jpegBytes(4096));
    assertMatch(row(w, id)?.state_reason ?? "", /500/);
    assertEquals({ state: done.sc.state, captions: derivedOf(w, id).length }, { state: "not_captioned", captions: 0 });
  },
);

Deno.test(
  "A23 a not_captioned photo finished again after the vision model is back ends processed with exactly one caption thought",
  async () => {
    const w = world({ vision: [{ status: 500 }, () => chatReply(CAPTION, VISION_MODEL)] });
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, done } = await uploadAndFinish(w, parent.id, "shelf.jpg", "image/jpeg", jpegBytes(4096));
    assertEquals(done.sc.state, "not_captioned");
    const again = await finish(w, id);
    assertEquals({ state: again.sc.state, captions: derivedOf(w, id).length }, { state: "processed", captions: 1 });
  },
);

Deno.test(
  "A24 a processed photo rebuilt with a different VISION_MODEL ends with exactly one caption thought, written by the new model",
  async () => {
    const w = world();
    const { id } = await processedPhoto(w);
    const NEW_MODEL = "test/vision-model-2";
    const w2 = world({ store: w.store, env: { VISION_MODEL: NEW_MODEL } });
    const rebuilt = await finish(w2, id, true);
    const captions = derivedOf(w2, id);
    assertEquals(
      {
        state: rebuilt.sc.state,
        count: captions.length,
        extractor: (captions[0]?.metadata.provenance as any)?.extractor_model,
        caption_model: row(w2, id)?.caption_model,
      },
      { state: "processed", count: 1, extractor: NEW_MODEL, caption_model: NEW_MODEL },
    );
  },
);

Deno.test(
  "A25 a rebuild that fails because the vision endpoint is down keeps the old caption thought, stays processed and reports last_rebuild_error",
  async () => {
    const w = world({ vision: [() => chatReply(CAPTION, VISION_MODEL), { status: 503 }] });
    const { id } = await processedPhoto(w);
    const old = structuredClone(derivedOf(w, id));
    const rebuilt = await finish(w, id, true);
    assert(
      typeof rebuilt.sc.last_rebuild_error === "string" && rebuilt.sc.last_rebuild_error.length > 0,
      said(rebuilt),
    );
    assertEquals({ state: row(w, id)?.state, captions: derivedOf(w, id) }, { state: "processed", captions: old });
  },
);

Deno.test(
  "A26 with a LAN PUBLIC_BASE_URL every returned link starts with it and none carries the internal origin; page_link defaults to the function's upload page",
  async () => {
    const w = world({ env: { PUBLIC_BASE_URL: LAN, UPLOAD_PAGE_URL: undefined } });
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const a = await attachCommand(w, parent.id, "shelf.jpg", "image/jpeg", 4096);
    const curl = strings(a.r.sc).find((s) => s.startsWith("curl "));
    const start = await page(w, "start", {
      token: tokenOf(a.pageLink),
      name: "shelf.jpg",
      type: "image/jpeg",
      size: 4096,
    });
    const pageUpload = uploadLinkIn(start.json);
    assertEquals(
      {
        upload: a.upload.url.startsWith(`${LAN}/`),
        curl: !!curl && curl.includes(`'${LAN}/`),
        page_link: a.pageLink.startsWith(`${LAN}/functions/v1/thought-attachments/upload#t=`),
        page_upload: !!pageUpload && pageUpload.startsWith(`${LAN}/`),
        internal: [...strings(a.r.sc), a.r.text, start.raw].filter((s) => s.includes(SUPABASE_URL)),
      },
      { upload: true, curl: true, page_link: true, page_upload: true, internal: [] },
    );
  },
);

Deno.test(
  "A58 after a failed rebuild, a rebuild with the vision endpoint back ends with one caption thought by the configured model and no last_rebuild_error",
  async () => {
    const w = world({
      vision: [
        () => chatReply(CAPTION, VISION_MODEL),
        { status: 503 },
        () => chatReply("A tidier shelf.", VISION_MODEL),
      ],
    });
    const { id } = await processedPhoto(w);
    await finish(w, id, true);
    const rebuilt = await finish(w, id, true);
    const got = await tool(w, "get_attachment", { attachment_id: id });
    const captions = derivedOf(w, id);
    assertEquals(
      {
        state: rebuilt.sc.state,
        count: captions.length,
        by: (captions[0]?.metadata.provenance as any)?.extractor_model,
        body: captions[0]?.content.split("\n")[1],
        last_rebuild_error: got.sc.last_rebuild_error ?? null,
      },
      { state: "processed", count: 1, by: VISION_MODEL, body: "A tidier shelf.", last_rebuild_error: null },
    );
  },
);

todo(
  "A60 with only the page token, /page/info returns the expected kind, accepted types and caps, changes nothing, and /page/start still returns an upload link",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const before = snapshot(w);
    const info = await page(w, "info", { token });
    const after = snapshot(w);
    const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
    assertEquals(
      {
        status: info.status,
        info: {
          expected_kind: info.json?.expected_kind,
          accepted_types: [...(info.json?.accepted_types ?? [])].sort(),
          caps: info.json?.caps,
        },
        unchanged: after,
        startLink: typeof uploadLinkIn(start.json),
      },
      {
        status: 200,
        info: {
          expected_kind: "photo",
          accepted_types: ACCEPTED_TYPES,
          caps: { image_bytes: 10 * MB, pdf_bytes: 25 * MB, pdf_pages: 50 },
        },
        unchanged: before,
        startLink: "string",
      },
    );
  },
);

todo(
  "A61 /page/finish before any PUT says no file uploaded yet and keeps the token: after a PUT a second finish finishes it, and a third gets 410",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
    const early = await page(w, "finish", { token });
    assertMatch(pageSaid(early), /no file uploaded yet/i);
    put(w, uploadLinkIn(start.json)!, jpegBytes(4096));
    const done = await page(w, "finish", { token });
    const third = await page(w, "finish", { token });
    assertEquals({ early: early.status !== 410, done: [done.json?.state, row(w, id)?.state], third: third.status }, {
      early: true,
      done: ["processed", "processed"],
      third: 410,
    });
  },
);

// ============================================================== User Story 3

todo(
  "A27 get_attachment on a processed attachment returns name, type, size and state, and a download link signed for 600 seconds with that lifetime stated",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const pdf = await textPdf(MANUAL_PAGES);
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", pdf);
    const got = await tool(w, "get_attachment", { attachment_id: id });
    assertMatch(said(got), /600 seconds|10 minutes/);
    assertEquals(
      {
        name: holds(got.sc, "manual.pdf"),
        type: holds(got.sc, "application/pdf"),
        size: holds(got.sc, pdf.length),
        state: holds(got.sc, "processed"),
        link: typeof got.sc.download_link,
        seconds: w.store.signedDownloads.at(-1)?.seconds,
      },
      { name: true, type: true, size: true, state: true, link: "string", seconds: 600 },
    );
  },
);

todo(
  "A28 list_attachments for a thought with two attachments in different states returns both with name, type, size, state and derived_count",
  async () => {
    const w = world();
    const { parent, id: photo } = await processedPhoto(w);
    const pending = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
    const list = await tool(w, "list_attachments", { thought_id: parent.id });
    const pick = (id: string) => {
      const rec = recordWith(list.sc, id) ?? {};
      return {
        derived_count: rec.derived_count,
        values: [holds(rec, row(w, id)!.file_name), holds(rec, row(w, id)!.state)],
      };
    };
    assertEquals({ photo: pick(photo), pending: pick(pending.id) }, {
      photo: { derived_count: 1, values: [true, true] },
      pending: { derived_count: 0, values: [true, true] },
    });
    assert(holds(recordWith(list.sc, photo), "image/jpeg") && holds(recordWith(list.sc, photo), 4096), said(list));
    assert(
      holds(recordWith(list.sc, pending.id), "application/pdf") && holds(recordWith(list.sc, pending.id), 4096),
      said(list),
    );
  },
);

todo("A29 get_attachment on a pending_upload and on a refused attachment returns no download link", async () => {
  const w = world();
  const parent = await ownerThought(w, "The garage shelf by the side door");
  const pending = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
  const refused = await uploadAndFinish(w, parent.id, "shelf.png", "image/png", jpegBytes(4096));
  assertEquals(refused.done.sc.state, "refused");
  const a = await tool(w, "get_attachment", { attachment_id: pending.id });
  const b = await tool(w, "get_attachment", { attachment_id: refused.id });
  assertEquals({
    links: [a.sc.download_link ?? null, b.sc.download_link ?? null],
    signed: w.store.signedDownloads.length,
  }, {
    links: [null, null],
    signed: 0,
  });
});

// ============================================================== User Story 4

todo(
  "A30 attach_file for a PDF declared over MAX_PDF_MB is refused naming the limit and the declared size, with no row and no link",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const before = snapshot(w);
    const declared = 25 * MB + 1;
    const r = await tool(w, "attach_file", {
      thought_id: parent.id,
      file_name: "big.pdf",
      declared_type: "application/pdf",
      declared_size: declared,
    });
    assertMatch(said(r), /25 ?MB|26,?214,?400/);
    assertMatch(said(r), /26,?214,?401/);
    assertEquals({ isError: r.isError, after: snapshot(w) }, { isError: true, after: before });
  },
);

todo(
  "A31 an uploaded PDF over MAX_PDF_PAGES is refused at finishing with the page count and the planned background processing, object deleted and no derived thought",
  async () => {
    const w = world({ env: { MAX_PDF_PAGES: "3" } });
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id, done } = await uploadAndFinish(
      w,
      parent.id,
      "long.pdf",
      "application/pdf",
      await textPdf([...MANUAL_PAGES, "Index."]),
    );
    assertMatch(said(done), /background/i);
    assertEquals(
      {
        state: row(w, id)?.state,
        pages: row(w, id)?.page_count,
        object: w.store.objects.has(row(w, id)!.storage_path!),
        derived: derivedOf(w, id).length,
      },
      { state: "refused", pages: 4, object: false, derived: 0 },
    );
  },
);

todo(
  "A32 a 40 MB upload declared as a 4 MB JPEG is refused at finishing with the actual size, object deleted, no derived thought, and listed as an orphan",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const a = await attachCommand(w, parent.id, "shelf.jpg", "image/jpeg", 4 * MB);
    put(w, a.upload.url, jpegBytes(40 * MB));
    const done = await finish(w, a.id);
    const orphans = await tool(w, "find_orphan_attachments", {});
    assertEquals(
      {
        state: done.sc.state,
        actual: row(w, a.id)?.actual_size,
        object: w.store.objects.has(row(w, a.id)!.storage_path!),
        derived: derivedOf(w, a.id).length,
        orphan: holds(orphans.sc, a.id),
      },
      { state: "refused", actual: 40 * MB, object: false, derived: 0, orphan: true },
    );
  },
);

todo(
  "A33 a text-less PDF ends scanned with no passages, says text search won't cover it yet, and still has a download link",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id, done } = await uploadAndFinish(w, parent.id, "scan.pdf", "application/pdf", await scannedPdf(2));
    assertMatch(said(done), /text search won.t cover it yet/i);
    const got = await tool(w, "get_attachment", { attachment_id: id });
    assertEquals({ state: done.sc.state, passages: derivedOf(w, id).length, link: typeof got.sc.download_link }, {
      state: "scanned",
      passages: 0,
      link: "string",
    });
  },
);

todo(
  "A34 when embeddings fail on the second batch no derived thought remains and the row is failed; finishing again after recovery ends processed",
  async () => {
    const pages = MANUAL_PAGES.map((p) => `${p} ${"More detail on this step follows here. ".repeat(3)}`);
    const w = world({
      env: { EMBEDDING_BATCH_SIZE: "1", PASSAGE_MAX_CHARS: "300" },
      embeddings: [
        embeddingResponder(1536),
        { status: 500, body: { error: "upstream down" } },
        embeddingResponder(1536),
      ],
    });
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id, done } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(pages));
    assert((row(w, id)?.state_reason ?? "").length > 0, "no failure reason");
    const failed = { state: done.sc.state, derived: derivedOf(w, id).length };
    const again = await finish(w, id);
    assertEquals({ failed, again: again.sc.state, derived: derivedOf(w, id).length > 1 }, {
      failed: { state: "failed", derived: 0 },
      again: "processed",
      derived: true,
    });
  },
);

todo(
  "A35 a file declared image/png whose bytes are a JPEG of that size is refused at finishing naming the actual type",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { done } = await uploadAndFinish(w, parent.id, "shelf.png", "image/png", jpegBytes(4096));
    assertStringIncludes(said(done), "image/jpeg");
    assertEquals(done.sc.state, "refused");
  },
);

todo(
  "A36 corrupt bytes declared as a PDF end failed with a readable reason, the file still fetchable and no passages",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id, done } = await uploadAndFinish(w, parent.id, "broken.pdf", "application/pdf", corruptPdf());
    const got = await tool(w, "get_attachment", { attachment_id: id });
    assert(typeof done.sc.reason === "string" && done.sc.reason.length > 0, said(done));
    assertEquals({ state: done.sc.state, link: typeof got.sc.download_link, passages: derivedOf(w, id).length }, {
      state: "failed",
      link: "string",
      passages: 0,
    });
  },
);

todo("A37 finish_attachment before any upload says no file uploaded yet and the row stays pending_upload", async () => {
  const w = world();
  const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
  const a = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
  const done = await finish(w, a.id);
  assertMatch(said(done), /no file uploaded yet/i);
  assertEquals(row(w, a.id)?.state, "pending_upload");
});

todo(
  "A38 finish_attachment after the upload deadline with no upload says upload window expired and leaves the row unchanged",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const a = await attachCommand(w, parent.id, "manual.pdf", "application/pdf", 4096);
    w.clock.advanceMinutes(61);
    const before = structuredClone(row(w, a.id));
    const done = await finish(w, a.id);
    assertMatch(said(done), /upload window expired/i);
    assertEquals(row(w, a.id), before);
  },
);

todo(
  "A39 768-number vectors for a 1536-dimension brain make finishing fail naming both lengths, with no derived thought",
  async () => {
    const w = world({ embeddings: [embeddingResponder(768)] });
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id, done } = await uploadAndFinish(
      w,
      parent.id,
      "manual.pdf",
      "application/pdf",
      await textPdf(MANUAL_PAGES),
    );
    assertMatch(said(done), /768/);
    assertMatch(said(done), /1536/);
    assertEquals({ state: done.sc.state, derived: derivedOf(w, id).length }, { state: "failed", derived: 0 });
  },
);

/** A photo whose finish is held at the vision call; `release()` lets it complete. */
async function heldPhotoFinish() {
  const w = world({ vision: [{ hold: chatReply(CAPTION, VISION_MODEL) }, () => chatReply(CAPTION, VISION_MODEL)] });
  const parent = await ownerThought(w, "The garage shelf by the side door");
  const { id, token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
  const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
  put(w, uploadLinkIn(start.json)!, jpegBytes(4096));
  const running = finish(w, id);
  await until(() => w.net.heldCount === 1, "the finish to reach the vision call");
  const release = async () => {
    w.net.release();
    return await running;
  };
  return { w, id, token, release };
}

todo(
  "A40 while a photo finish is held at the vision call, a second finish and a confirmed remove each return busy naming finishing, and nothing changes",
  async () => {
    const { w, id, release } = await heldPhotoFinish();
    try {
      const before = snapshot(w);
      const second = await finish(w, id);
      const remove = await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
      assertMatch(said(second), /busy.*finishing/i);
      assertMatch(said(remove), /busy.*finishing/i);
      assertEquals(snapshot(w), before);
    } finally {
      await release();
    }
  },
);

todo(
  "A41 after that finish completes, a repeat finish returns the existing outcome with no new derived thought and no embedding or vision request",
  async () => {
    const { w, id, release } = await heldPhotoFinish();
    const first = await release();
    const requests = w.net.requests.length;
    const derived = structuredClone(derivedOf(w, id));
    const repeat = await finish(w, id);
    assertEquals(
      {
        state: repeat.sc.state,
        count: repeat.sc.derived_count,
        derived: derivedOf(w, id),
        requests: w.net.requests.length,
      },
      { state: first.sc.state, count: 1, derived, requests },
    );
  },
);

todo("A42 after that, a confirmed remove_attachment succeeds", async () => {
  const { w, id, release } = await heldPhotoFinish();
  await release();
  const removed = await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
  assertEquals({ isError: removed.isError, row: row(w, id), derived: derivedOf(w, id).length }, {
    isError: false,
    row: undefined,
    derived: 0,
  });
});

todo("A43 with default settings /page/start 20 minutes after attach_file returns an upload link", async () => {
  const w = world();
  const parent = await ownerThought(w, "The garage shelf by the side door");
  const { token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
  w.clock.advanceMinutes(20);
  const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
  assertEquals({ status: start.status, link: typeof uploadLinkIn(start.json) }, { status: 200, link: "string" });
});

todo(
  "A44 /page/start 65 minutes after attach_file gets 410 with the expired message, and the orphan check lists that pending attachment",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const { id, token } = await attachPhone(w, { thought_id: parent.id, expected_kind: "photo" });
    w.clock.advanceMinutes(65);
    const start = await page(w, "start", { token, name: "shelf.jpg", type: "image/jpeg", size: 4096 });
    assertMatch(pageSaid(start), /expired or was already used/i);
    const orphans = await tool(w, "find_orphan_attachments", {});
    assertEquals({ status: start.status, listed: holds(orphans.sc, id) }, { status: 410, listed: true });
  },
);

todo(
  "A45 after a killed finish, a finish before BUSY_SECONDS is busy, and one after it proceeds with no leftover derived thought and ends processed",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const bytes = jpegBytes(4096);
    const a = await attachCommand(w, parent.id, "shelf.jpg", "image/jpeg", bytes);
    put(w, a.upload.url, bytes);
    await w.store.claim(a.id, "finish", w.settings.busySeconds); // the killed run: claimed, never released
    w.clock.advanceSeconds(w.settings.busySeconds - 1);
    const early = await finish(w, a.id);
    assertMatch(said(early), /busy/i);
    w.clock.advanceSeconds(2);
    const later = await finish(w, a.id);
    assertEquals({ state: later.sc.state, derived: derivedOf(w, a.id).length, count: later.sc.derived_count }, {
      state: "processed",
      derived: 1,
      count: 1,
    });
  },
);

todo(
  "A54 with MAX_PDF_PAGES=abc, attach_file and /page/start each answer the named settings error, create nothing and never echo abc",
  async () => {
    const loaded = loadSettings(envGetter({ MAX_PDF_PAGES: "abc" }));
    assert(!loaded.ok, "test setup: MAX_PDF_PAGES=abc should be a settings problem");
    const app = createApp({ ok: false, problems: loaded.problems });
    const message = "setting MAX_PDF_PAGES is invalid: must be a positive whole number";
    const call = await mcpCall(app.fetch, "tools/call", {
      name: "attach_file",
      arguments: { note: "A shelf", file_name: "shelf.jpg", declared_type: "image/jpeg", declared_size: 4096 },
    }, BRAIN_KEY);
    const callText = await call.response.text();
    const start = await page({ app }, "start", { token: "any", name: "shelf.jpg", type: "image/jpeg", size: 4096 });
    assertStringIncludes(callText, message);
    assertStringIncludes(start.raw, message);
    assertEquals([callText.includes("abc"), start.raw.includes("abc")], [false, false]);
  },
);

todo(
  "A55 after a killed finish whose claim expired, get_attachment reports failed with the run did not finish, before any further finish",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const bytes = jpegBytes(4096);
    const a = await attachCommand(w, parent.id, "shelf.jpg", "image/jpeg", bytes);
    put(w, a.upload.url, bytes);
    await w.store.claim(a.id, "finish", w.settings.busySeconds);
    w.clock.advanceSeconds(w.settings.busySeconds + 1);
    const got = await tool(w, "get_attachment", { attachment_id: a.id });
    assertMatch(said(got), /the run did not finish/i);
    assert(holds(got.sc, "failed"), `state is not failed: ${said(got)}`);
  },
);

todo(
  "A62 a /page/finish refused as busy leaves the token valid; once the held finish completes, /page/finish returns processed, and a further one gets 410",
  async () => {
    const { w, token, release } = await heldPhotoFinish();
    let busy;
    try {
      busy = await page(w, "finish", { token });
    } finally {
      await release();
    }
    assertMatch(pageSaid(busy), /busy/i);
    const done = await page(w, "finish", { token });
    const after = await page(w, "finish", { token });
    assertEquals({ busy: busy.status !== 410, done: [done.status, done.json?.state], after: after.status }, {
      busy: true,
      done: [200, "processed"],
      after: 410,
    });
  },
);

todo(
  "A63 a JPEG declared at exactly 10,485,760 bytes gets an upload link, and one at 10,485,761 bytes is refused naming the limit and the declared size",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "The garage shelf by the side door");
    const at = await tool(w, "attach_file", {
      thought_id: parent.id,
      file_name: "a.jpg",
      declared_type: "image/jpeg",
      declared_size: 10 * MB,
    });
    const over = await tool(w, "attach_file", {
      thought_id: parent.id,
      file_name: "b.jpg",
      declared_type: "image/jpeg",
      declared_size: 10 * MB + 1,
    });
    assertMatch(said(over), /10 ?MB|10,?485,?760/);
    assertMatch(said(over), /10,?485,?761/);
    assertEquals({ at: [at.isError, typeof at.sc.upload?.url], over: over.isError }, {
      at: [false, "string"],
      over: true,
    });
  },
);

// ============================================================== User Story 5

todo(
  "A46 a confirmed removal deletes the object, row and every derived thought; get_attachment then says not found; the parent and its other attachment are unchanged",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    const other = await uploadAndFinish(w, parent.id, "front.jpg", "image/jpeg", jpegBytes(4096));
    const path = row(w, id)!.storage_path!;
    const keep = structuredClone({
      parent: w.store.thought(parent.id),
      other: row(w, other.id),
      otherDerived: derivedOf(w, other.id),
    });
    const removed = await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
    const got = await tool(w, "get_attachment", { attachment_id: id });
    assertMatch(said(got), /not found/i);
    assertEquals(
      {
        ok: !removed.isError,
        gone: [w.store.objects.has(path), row(w, id), derivedOf(w, id).length],
        keep: { parent: w.store.thought(parent.id), other: row(w, other.id), otherDerived: derivedOf(w, other.id) },
      },
      { ok: true, gone: [false, undefined, 0], keep },
    );
  },
);

todo("A47 a removal without confirm deletes nothing and lists the file and its derived-thought count", async () => {
  const w = world();
  const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
  const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
  const count = derivedOf(w, id).length;
  const before = snapshot(w);
  const preview = await tool(w, "remove_attachment", { attachment_id: id });
  assertStringIncludes(said(preview), "manual.pdf");
  assertMatch(said(preview), new RegExp(`\\b${count} derived`));
  assertEquals(snapshot(w), before);
});

todo(
  "A48 an attachment whose parent was deleted elsewhere is listed as an orphan with its file name and derived count, and a confirmed removal removes it",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    const count = derivedOf(w, id).length;
    w.store.thoughts = w.store.thoughts.filter((t) => t.id !== parent.id); // deleted outside the integration
    const orphans = await tool(w, "find_orphan_attachments", {});
    const rec = recordWith(orphans.sc, id);
    assertEquals({ name: holds(rec, "manual.pdf"), derived_count: rec?.derived_count }, {
      name: true,
      derived_count: count,
    });
    await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
    assertEquals({ row: row(w, id), derived: derivedOf(w, id).length }, { row: undefined, derived: 0 });
  },
);

todo(
  "A49 an attachment started with note whose link expired unused is an orphan, and its confirmed removal removes the note too",
  async () => {
    const w = world();
    const note = "The spare furnace filters are on this shelf";
    const { id } = await attachPhone(w, { note, expected_kind: "photo" });
    const noteId = row(w, id)!.parent_thought_id;
    w.clock.advanceMinutes(61);
    const orphans = await tool(w, "find_orphan_attachments", {});
    assert(holds(orphans.sc, id), `not listed: ${said(orphans)}`);
    await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
    assertEquals({ row: row(w, id), note: w.store.thought(noteId) }, { row: undefined, note: undefined });
  },
);

todo("A50 the same, with a second processed attachment pointing to that note: the note stays", async () => {
  const w = world();
  const note = "The spare furnace filters are on this shelf";
  const { id } = await attachPhone(w, { note, expected_kind: "photo" });
  const noteId = row(w, id)!.parent_thought_id;
  const second = await uploadAndFinish(w, noteId, "shelf.jpg", "image/jpeg", jpegBytes(4096));
  assertEquals(second.done.sc.state, "processed");
  w.clock.advanceMinutes(61);
  await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
  assertEquals({ row: row(w, id), note: w.store.thought(noteId)?.content }, { row: undefined, note });
});

todo("A51 attach_file with note and a HEIC declared type saves no thought and makes no embedding request", async () => {
  const w = world();
  const before = snapshot(w);
  const r = await tool(w, "attach_file", {
    note: "The spare furnace filters are on this shelf",
    file_name: "IMG_0412.HEIC",
    declared_type: "image/heic",
    declared_size: 4096,
  });
  assertEquals({ isError: r.isError, after: snapshot(w), embeddings: w.net.requestsTo(EMBEDDINGS_URL).length }, {
    isError: true,
    after: before,
    embeddings: 0,
  });
});

todo(
  "A52 after a full run no thought or attachment row holds a signed URL, a key, a page token or an absolute path",
  async () => {
    const w = world({ vision: [() => chatReply(CAPTION, VISION_MODEL)] });
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const tokens: string[] = [];
    // command upload with an absolute-path file name, finished, then rebuilt
    const pdf = await textPdf(MANUAL_PAGES);
    const cmd = await attachCommand(w, parent.id, "/Users/owner/Documents/manual.pdf", "application/pdf", pdf);
    tokens.push(tokenOf(cmd.pageLink));
    put(w, cmd.upload.url, pdf);
    await finish(w, cmd.id);
    await finish(w, cmd.id, true);
    // page upload of a photo, finished from the page
    const phone = await attachPhone(w, { note: "Photo of the garage shelf", expected_kind: "photo" });
    tokens.push(phone.token);
    const start = await page(w, "start", {
      token: phone.token,
      name: "C:\\Users\\owner\\shelf.jpg",
      type: "image/jpeg",
      size: 4096,
    });
    put(w, uploadLinkIn(start.json)!, jpegBytes(4096));
    await page(w, "finish", { token: phone.token });
    // a refusal
    const bad = await uploadAndFinish(w, parent.id, "shelf.png", "image/png", jpegBytes(4096));
    assertEquals(bad.done.sc.state, "refused");
    const stored = JSON.stringify({
      thoughts: w.store.thoughts.map((t) => [t.content, t.metadata]),
      rows: w.store.attachments,
    });
    const forbidden = [
      ...SECRET_VALUES,
      ...tokens,
      "/storage/v1/object/",
      "token=",
      "/Users/owner",
      "C:\\\\Users",
    ];
    assertEquals(forbidden.filter((f) => stored.includes(f)), []);
  },
);

todo(
  "A56 a confirmed removal whose record deletion fails after the file was deleted leaves it listed; a repeat confirmed removal succeeds and treats the missing file as removed",
  async () => {
    const w = world();
    const parent = await ownerThought(w, "Kitchen dishwasher DW-500");
    const { id } = await uploadAndFinish(w, parent.id, "manual.pdf", "application/pdf", await textPdf(MANUAL_PAGES));
    w.store.failNext("removeAttachment", "connection reset during delete");
    await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
    const listed = await tool(w, "list_attachments", { thought_id: parent.id });
    assert(holds(listed.sc, id), `not listed after the failed removal: ${said(listed)}`);
    const again = await tool(w, "remove_attachment", { attachment_id: id, confirm: true });
    assertEquals({ ok: !again.isError, row: row(w, id), derived: derivedOf(w, id).length }, {
      ok: true,
      row: undefined,
      derived: 0,
    });
  },
);
