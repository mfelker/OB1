/** createSupabaseStore (T017, T018, T038, T048, T062): supabase-js over the fake fetch. No network. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { createSupabaseStore } from "../src/store.ts";
import { loadSettings } from "../src/settings.ts";
import type { AttachmentRow, Settings, Store } from "../src/types.ts";
import { FakeFetch } from "./helpers/fake_fetch.ts";
import { envGetter, SERVICE_ROLE_KEY, SUPABASE_URL } from "./helpers/env.ts";

const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

function setup(overrides: Record<string, string | undefined> = {}): { store: Store; ff: FakeFetch; settings: Settings } {
  const ff = new FakeFetch();
  const settings = settingsWith(overrides);
  return { store: createSupabaseStore(SUPABASE_URL, SERVICE_ROLE_KEY, settings, ff.fetch), ff, settings };
}

/** The whole row an attachment RPC or table read returns (data-model.md). */
export function attachmentRow(overrides: Partial<AttachmentRow> = {}): AttachmentRow {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    parent_thought_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    parent_created_here: false,
    file_name: "manual.pdf",
    declared_type: "application/pdf",
    declared_size: 1234,
    expected_kind: null,
    actual_type: null,
    actual_size: null,
    page_count: null,
    content_hash: null,
    storage_path: "attachments/11111111-2222-3333-4444-555555555555/manual.pdf",
    sensitivity_tier: "personal",
    state: "pending_upload",
    state_reason: null,
    last_rebuild_error: null,
    caption_model: null,
    derived_count: 0,
    upload_deadline: "2026-01-01T01:00:00+00:00",
    page_token_hash: null,
    busy_op: null,
    busy_until: null,
    busy_token: null,
    created_at: "2026-01-01T00:00:00+00:00",
    updated_at: "2026-01-01T00:00:00+00:00",
    processed_at: null,
    ...overrides,
  };
}

Deno.test("U69 thoughtExists is true for an existing id and false for an unknown one", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${REST}/thoughts*`, (req) => ({
    body: req.url.includes("id=eq.known-id") ? [{ id: "known-id" }] : [],
  }));
  assertEquals(await store.thoughtExists("known-id"), { data: true });
  assertEquals(await store.thoughtExists("unknown-id"), { data: false });
  assertEquals(ff.requests[0].headers["apikey"], SERVICE_ROLE_KEY);
});

Deno.test("U70 matchThoughts sends the embedding and limit to the base match_thoughts and maps the reply to ThoughtMatch", async () => {
  const { store, ff } = setup();
  const long = "x".repeat(200);
  ff.on("POST", `${REST}/rpc/match_thoughts`, {
    body: [
      { id: "t1", content: `First line\nsecond line`, metadata: {}, similarity: 0.9, created_at: "2026-02-03T04:05:06+00:00" },
      { id: "t2", content: long, metadata: {}, similarity: 0.8, created_at: "2026-02-04T00:00:00+00:00" },
    ],
  });
  const embedding = [0.1, 0.2, 0.3];
  const result = await store.matchThoughts(embedding, 5);
  assertEquals(result, {
    data: [
      { id: "t1", first_line: "First line", captured: "2026-02-03T04:05:06+00:00" },
      { id: "t2", first_line: "x".repeat(120), captured: "2026-02-04T00:00:00+00:00" },
    ],
  });
  const body = ff.requests[0].body as Record<string, unknown>;
  assertEquals(body.query_embedding, embedding);
  assertEquals(body.match_count, 5);
  assertEquals(body.match_threshold, 0);
});

Deno.test("U71 findThoughtsExact sends the text as an RPC parameter, never inside a filter string", async () => {
  const { store, ff } = setup();
  ff.on("POST", `${REST}/rpc/attachment_find_thoughts_exact`, {
    body: [{ id: "t1", first_line: "Furnace filters, 50%", captured: "2026-02-03T04:05:06+00:00" }],
  });
  const text = "50%, (a) it's),or.eq.x";
  const result = await store.findThoughtsExact(text, 7);
  assertEquals(result, { data: [{ id: "t1", first_line: "Furnace filters, 50%", captured: "2026-02-03T04:05:06+00:00" }] });
  assertEquals(ff.requests.length, 1);
  assertEquals(ff.requests[0].method, "POST");
  assertEquals(ff.requests[0].body, { p_text: text, p_limit: 7 });
  assertEquals(ff.requests[0].url.includes("50%"), false);
});

Deno.test("U72 embeddingDimension returns the dimension function's number", async () => {
  const { store, ff } = setup();
  ff.on("POST", `${REST}/rpc/attachment_embedding_dimension`, { body: 1536 });
  assertEquals(await store.embeddingDimension(), { data: 1536 });
});

Deno.test("U73 claim maps a refused claim to busy and a success to a token", async () => {
  const { store, ff } = setup();
  ff.on("POST", `${REST}/rpc/attachment_claim`, { body: { token: "tok-1" } }, { body: { busy: "rebuild" } });
  assertEquals(await store.claim("att-1", "finish", 410), { data: { token: "tok-1" } });
  assertEquals(ff.requests[0].body, { p_id: "att-1", p_op: "finish", p_seconds: 410 });
  assertEquals(await store.claim("att-1", "remove", 410), { data: { busy: "rebuild" } });
});

const ATT_ID = "11111111-2222-3333-4444-555555555555";

Deno.test("U74 getAttachment with a full id returns the row", async () => {
  const { store, ff } = setup();
  const row = attachmentRow();
  ff.on("GET", `${REST}/thought_attachments*`, { body: [row] });
  assertEquals(await store.getAttachment(ATT_ID), { data: row });
  assertEquals(ff.requests[0].url.includes(`id=eq.${ATT_ID}`), true);
});

Deno.test("U75 getAttachment with an 8-character short id returns the row when exactly one matches", async () => {
  const { store, ff } = setup();
  const row = attachmentRow();
  ff.on("GET", `${REST}/thought_attachments*`, { body: [row] });
  assertEquals(await store.getAttachment("11111111"), { data: row });
  const url = decodeURIComponent(ff.requests[0].url);
  assertEquals(url.includes("id=gte.11111111-0000-0000-0000-000000000000"), true);
  assertEquals(url.includes("id=lte.11111111-ffff-ffff-ffff-ffffffffffff"), true);
});

Deno.test("U76 getAttachment with a short id that matches two rows returns ambiguous", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${REST}/thought_attachments*`, {
    body: [attachmentRow(), attachmentRow({ id: "11111111-9999-3333-4444-555555555555" })],
  });
  assertEquals(await store.getAttachment("11111111"), { data: "ambiguous" });
});

Deno.test("U77 getAttachment with an unknown id returns not_found", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${REST}/thought_attachments*`, { body: [] });
  assertEquals(await store.getAttachment(ATT_ID), { data: "not_found" });
  assertEquals(await store.getAttachment("deadbeef"), { data: "not_found" });
});

Deno.test("U78 a database error maps to { error } whose text contains no service-role key", async () => {
  const { store, ff } = setup();
  const leaky = { status: 500, body: { message: `permission denied for key ${SERVICE_ROLE_KEY}`, code: "42501", details: SERVICE_ROLE_KEY, hint: null } };
  ff.on("POST", `${REST}/rpc/attachment_claim`, leaky);
  ff.on("GET", `${REST}/thoughts*`, leaky);
  ff.on("GET", `${REST}/thought_attachments*`, leaky);
  const results = [
    await store.claim("att-1", "finish", 410),
    await store.thoughtExists("t1"),
    await store.getAttachment(ATT_ID),
  ];
  for (const r of results) {
    if (!("error" in r)) throw new Error(`expected an error result, got ${JSON.stringify(r)}`);
    assertEquals(r.error.includes(SERVICE_ROLE_KEY), false);
    assertEquals(r.error.length > 0, true);
  }
});

const PARENT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const HASH = "sha256:" + "ab".repeat(32);

Deno.test("U315 findByHash returns the non-refused attachment on that parent with that hash", async () => {
  const { store, ff } = setup();
  const row = attachmentRow({ state: "processed", content_hash: HASH });
  ff.on("GET", `${REST}/thought_attachments*`, { body: [row] });
  assertEquals(await store.findByHash(PARENT, HASH), { data: row });
  const url = decodeURIComponent(ff.requests[0].url);
  assertEquals(url.includes(`parent_thought_id=eq.${PARENT}`), true);
  assertEquals(url.includes(`content_hash=eq.${HASH}`), true);
  assertEquals(url.includes("state=neq.refused"), true);
});

Deno.test("U316 findByHash returns null when the only attachment with that hash on that parent is refused", async () => {
  const { store, ff } = setup();
  const refused = attachmentRow({ state: "refused", content_hash: HASH });
  // a database that honours the filters it is sent
  ff.on("GET", `${REST}/thought_attachments*`, (req) => {
    const url = decodeURIComponent(req.url);
    return { body: url.includes("state=neq.refused") ? [] : [refused] };
  });
  assertEquals(await store.findByHash(PARENT, HASH), { data: null });
});

Deno.test("U317 findByHash returns null when the hash belongs only to an attachment of another parent", async () => {
  const { store, ff } = setup();
  const other = attachmentRow({ parent_thought_id: "99999999-bbbb-cccc-dddd-eeeeeeeeeeee", state: "processed", content_hash: HASH });
  ff.on("GET", `${REST}/thought_attachments*`, (req) => {
    // a database that honours the parent filter it is sent: no filter returns the row
    const filter = new URL(req.url).searchParams.get("parent_thought_id");
    return { body: filter === null || filter === `eq.${other.parent_thought_id}` ? [other] : [] };
  });
  assertEquals(await store.findByHash(PARENT, HASH), { data: null });
});

/** A database over one row that honours the equality and deadline filters findPending sends. */
function pendingDb(row: AttachmentRow): (req: { url: string }) => { body: AttachmentRow[] } {
  return (req) => {
    const p = new URL(req.url).searchParams;
    const eq = (col: string, value: unknown) => p.get(col) === null || p.get(col) === `eq.${value}`;
    const after = p.get("upload_deadline");
    const live = after === null || (after.startsWith("gt.") && new Date(row.upload_deadline) > new Date(after.slice(3)));
    const hit = eq("parent_thought_id", row.parent_thought_id) && eq("file_name", row.file_name) &&
      eq("declared_type", row.declared_type) && eq("declared_size", row.declared_size) && eq("state", row.state) && live;
    return { body: hit ? [row] : [] };
  };
}

Deno.test("U318 findPending returns the pending_upload row with that name, type and size while now is before its deadline", async () => {
  const { store, ff } = setup();
  const row = attachmentRow({ upload_deadline: "2026-01-01T01:00:00.000Z" });
  ff.on("GET", `${REST}/thought_attachments*`, pendingDb(row));
  const now = new Date("2026-01-01T00:59:59.000Z");
  assertEquals(await store.findPending(PARENT, "manual.pdf", "application/pdf", 1234, now), { data: row });
  const url = decodeURIComponent(ff.requests[0].url);
  assertEquals(url.includes("state=eq.pending_upload"), true);
  assertEquals(url.includes("file_name=eq.manual.pdf"), true);
  assertEquals(url.includes("declared_type=eq.application/pdf"), true);
  assertEquals(url.includes("declared_size=eq.1234"), true);
});

Deno.test("U319 findPending returns null for that row once now is past its deadline", async () => {
  const { store, ff } = setup();
  const row = attachmentRow({ upload_deadline: "2026-01-01T01:00:00.000Z" });
  ff.on("GET", `${REST}/thought_attachments*`, pendingDb(row));
  assertEquals(await store.findPending(PARENT, "manual.pdf", "application/pdf", 1234, new Date("2026-01-01T01:00:00.000Z")), { data: null });
  assertEquals(await store.findPending(PARENT, "manual.pdf", "application/pdf", 1234, new Date("2026-01-01T01:00:01.000Z")), { data: null });
});

Deno.test("U88 insertNote, attachmentForPageToken and consumePageToken map the RPC replies to { id, created }, the row and a boolean", async () => {
  const { store, ff } = setup();
  const row = attachmentRow({ page_token_hash: "sha256:tokenhash" });
  ff.on("POST", `${REST}/rpc/attachment_insert_note`, { body: { id: "note-1", created: true } });
  ff.on("POST", `${REST}/rpc/attachment_by_page_token`, { body: [row] }, { body: [] });
  ff.on("POST", `${REST}/rpc/attachment_consume_page_token`, { body: true }, { body: false });

  assertEquals(await store.insertNote("a note", [0.5, 0.25], { type: "observation" }), { data: { id: "note-1", created: true } });
  assertEquals(ff.requests[0].body, { p_content: "a note", p_embedding: "[0.5,0.25]", p_metadata: { type: "observation" } });

  assertEquals(await store.attachmentForPageToken("sha256:tokenhash"), { data: row });
  assertEquals(ff.requests[1].body, { p_hash: "sha256:tokenhash" });
  assertEquals(await store.attachmentForPageToken("sha256:other"), { data: null });

  assertEquals(await store.consumePageToken(ATT_ID, "sha256:tokenhash"), { data: true });
  assertEquals(ff.requests[3].body, { p_id: ATT_ID, p_hash: "sha256:tokenhash" });
  assertEquals(await store.consumePageToken(ATT_ID, "sha256:tokenhash"), { data: false });
});

const BUCKET_PATH = `attachments/${ATT_ID}/manual.pdf`;

Deno.test("U79 signUpload targets ATTACHMENTS_BUCKET at attachments/<id>/<file_name> and returns Storage's URL unchanged", async () => {
  const { store, ff } = setup({ ATTACHMENTS_BUCKET: "custom-files" });
  const signed = `/object/upload/sign/custom-files/${BUCKET_PATH}?token=signed-token-1`;
  ff.on("POST", `${STORAGE}/object/upload/sign/custom-files/${BUCKET_PATH}`, { body: { url: signed } });
  assertEquals(await store.signUpload(BUCKET_PATH), { data: { url: `${STORAGE}${signed}`, token: "signed-token-1" } });
  assertEquals(ff.requests.length, 1);
  assertEquals(ff.requests[0].method, "POST");
});

Deno.test("U80 objectInfo returns the object's size and creation time, and null when there is no object", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${STORAGE}/object/info/ob1-files/${BUCKET_PATH}`,
    { body: { id: "o1", name: BUCKET_PATH, bucket_id: "ob1-files", size: 4321, content_type: "application/pdf", created_at: "2026-01-01T00:30:00.000Z" } });
  ff.on("GET", `${STORAGE}/object/info/ob1-files/attachments/none/missing.pdf`,
    { status: 404, body: { statusCode: "404", error: "not_found", message: "Object not found" } });
  assertEquals(await store.objectInfo(BUCKET_PATH), { data: { size: 4321, createdAt: "2026-01-01T00:30:00.000Z" } });
  assertEquals(await store.objectInfo("attachments/none/missing.pdf"), { data: null });
});

Deno.test("U81 download returns the stored bytes", async () => {
  const { store, ff } = setup();
  const bytes = new Uint8Array([37, 80, 68, 70, 0, 255, 1]);
  ff.on("GET", `${STORAGE}/object/ob1-files/${BUCKET_PATH}`, { body: bytes, headers: { "content-type": "application/pdf" } });
  const r = await store.download(BUCKET_PATH);
  if (!("data" in r)) throw new Error(JSON.stringify(r));
  assertEquals([...r.data], [...bytes]);
});

Deno.test("U82 deleteObject deletes that path and no other", async () => {
  const { store, ff } = setup();
  ff.on("DELETE", `${STORAGE}/object/ob1-files`, { body: [{ name: BUCKET_PATH }] });
  assertEquals(await store.deleteObject(BUCKET_PATH), { data: null });
  assertEquals(ff.requests.length, 1);
  assertEquals(ff.requests[0].body, { prefixes: [BUCKET_PATH] });
});

Deno.test("U89 signDownload passes the path and the seconds to Storage and returns the signed URL", async () => {
  const { store, ff } = setup();
  const signed = `/object/sign/ob1-files/${BUCKET_PATH}?token=dl-token`;
  ff.on("POST", `${STORAGE}/object/sign/ob1-files/${BUCKET_PATH}`, { body: { signedURL: signed } });
  assertEquals(await store.signDownload(BUCKET_PATH, 300), { data: `${STORAGE}${signed}` });
  assertEquals(ff.requests[0].body, { expiresIn: 300 });
});

Deno.test("U90 listByParent returns that parent's attachments only", async () => {
  const { store, ff } = setup();
  const a = attachmentRow();
  const b = attachmentRow({ id: "22222222-2222-3333-4444-555555555555", created_at: "2026-01-02T00:00:00+00:00" });
  const elsewhere = attachmentRow({ id: "33333333-2222-3333-4444-555555555555", parent_thought_id: "99999999-bbbb-cccc-dddd-eeeeeeeeeeee" });
  ff.on("GET", `${REST}/thought_attachments*`, (req) => {
    const filter = new URL(req.url).searchParams.get("parent_thought_id");
    return { body: [a, b, elsewhere].filter((r) => filter === null || filter === `eq.${r.parent_thought_id}`) };
  });
  assertEquals(await store.listByParent(PARENT), { data: [a, b] });
  assertEquals(new URL(ff.requests[0].url).searchParams.get("order"), "created_at.asc");
});

Deno.test("U91 attachmentForDerived returns the attachment named by the thought's metadata.attachment_id", async () => {
  const { store, ff } = setup();
  const row = attachmentRow({ state: "processed" });
  ff.on("GET", `${REST}/thoughts*`, { body: [{ id: "derived-1", metadata: { attachment_id: ATT_ID, type: "reference" } }] });
  ff.on("GET", `${REST}/thought_attachments*`, { body: [row] });
  assertEquals(await store.attachmentForDerived("derived-1"), { data: row });
  assertEquals(ff.requests[0].url.includes("id=eq.derived-1"), true);
  assertEquals(ff.requests[1].url.includes(`id=eq.${ATT_ID}`), true);
});

Deno.test("U92 attachmentForDerived on a thought without attachment_id returns null", async () => {
  const { store, ff } = setup();
  ff.on("GET", `${REST}/thoughts*`, { body: [{ id: "owner-1", metadata: { type: "idea" } }] }, { body: [{ id: "owner-2", metadata: null }] }, { body: [] });
  assertEquals(await store.attachmentForDerived("owner-1"), { data: null });
  assertEquals(await store.attachmentForDerived("owner-2"), { data: null });
  assertEquals(await store.attachmentForDerived("gone"), { data: null });
  assertEquals(ff.requests.length, 3); // no attachment lookup was made
});
