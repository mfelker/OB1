/** Derived thought rows (T023, T036): source lines, fingerprints, metadata. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { captionRow, fingerprint, noteMetadata, passageRow, sourceLine } from "../src/derived.ts";
import type { AttachmentRow } from "../src/types.ts";

const ID = "a1b2c3d4-0000-4000-8000-000000000000";
const PARENT = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-27T12:34:56.789Z");

/** A processed-in-progress attachment of `fileName`. */
function rowFor(fileName = "dishwasher-manual.pdf", overrides: Partial<AttachmentRow> = {}): AttachmentRow {
  return {
    id: ID,
    parent_thought_id: PARENT,
    parent_created_here: false,
    file_name: fileName,
    declared_type: "application/pdf",
    declared_size: 5000,
    expected_kind: null,
    actual_type: "application/pdf",
    actual_size: 5000,
    page_count: 20,
    content_hash: "sha256:" + "ab".repeat(32),
    storage_path: `attachments/${ID}/${fileName}`,
    sensitivity_tier: "personal",
    state: "pending_upload",
    state_reason: null,
    last_rebuild_error: null,
    caption_model: null,
    derived_count: 0,
    upload_deadline: "2026-11-27T13:00:00.000Z",
    page_token_hash: null,
    busy_op: "finish",
    busy_until: "2026-11-27T12:40:00.000Z",
    busy_token: "claim-token",
    created_at: "2026-11-27T12:00:00.000Z",
    updated_at: "2026-11-27T12:00:00.000Z",
    processed_at: null,
    ...overrides,
  };
}

Deno.test("U131 sourceLine for a passage on pages 12–13 is the data-model example", () => {
  assertEquals(
    sourceLine("dishwasher-manual.pdf", "pages 12–13", "a1b2c3d4"),
    "From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)",
  );
});

Deno.test("U133 fingerprint equals upsert_thought's normalisation: collapse whitespace runs, trim, lowercase, sha256 hex", async () => {
  const hex = async (s: string) =>
    [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
      .map((b) => b.toString(16).padStart(2, "0")).join("");
  assertEquals(await fingerprint("  Hello \n\tWORLD   again  "), await hex("hello world again"));
  assertEquals(await fingerprint("hello world again"), await fingerprint("HELLO\n\nWorld  AGAIN\n"));
  assertEquals(await fingerprint("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

const EMBEDDING = [0.1, 0.2, 0.3];
const passage = (text: string, pages: [number, number]) => ({ text, pages });

Deno.test("U134 a passage row's content is the source line, a line break, then the passage text", async () => {
  const row = await passageRow(rowFor(), passage("To clean the filter, twist the cylinder.", [12, 13]), EMBEDDING, NOW);
  assertEquals(
    row.content,
    "From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)\nTo clean the filter, twist the cylinder.",
  );
  assertEquals(row.embedding, EMBEDDING);
  assertEquals(row.fingerprint, await fingerprint(row.content));
});

Deno.test("U132 the short id in a source line is the first 8 hex characters of the attachment id", async () => {
  const row = await passageRow(rowFor("a.pdf", { id: "0f1e2d3c-4b5a-4697-8a9b-c0d1e2f30415" }), passage("text", [1, 1]), EMBEDDING, NOW);
  assertStringIncludes(row.content.split("\n")[0], "(attachment 0f1e2d3c)");
  assert(!row.content.includes("4b5a"));
});

Deno.test("U321 a passage on page 12 only is named page 12, never pages 12–12", async () => {
  const row = await passageRow(rowFor(), passage("text", [12, 12]), EMBEDDING, NOW);
  assertEquals(row.content.split("\n")[0], "From dishwasher-manual.pdf, page 12 (attachment a1b2c3d4)");
});

Deno.test("U135 a passage row's metadata carries the ingestion contract fields", async () => {
  const row = await passageRow(rowFor(), passage("text", [12, 13]), EMBEDDING, NOW);
  const m = row.metadata;
  assertEquals(m.source, "local_document");
  assertEquals(m.source_type, "local_document");
  assertEquals(m.source_label, "dishwasher-manual.pdf");
  assertEquals(m.importer_name, "thought-attachments");
  assertEquals(typeof m.importer_version, "string");
  assert((m.importer_version as string).length > 0);
  assertEquals(m.imported_at, "2026-11-27T12:34:56.789Z");
  assertEquals(m.input_hash, "sha256:" + "ab".repeat(32));
  assertEquals(m.content_fingerprint, "sha256:" + row.fingerprint);
  assertEquals(m.sensitivity_tier, "personal");
});

Deno.test("U136 a passage row's metadata has type reference and topics [attachment, base name]", async () => {
  const row = await passageRow(rowFor(), passage("text", [1, 1]), EMBEDDING, NOW);
  assertEquals(row.metadata.type, "reference");
  assertEquals(row.metadata.topics, ["attachment", "dishwasher-manual.pdf"]);
});

Deno.test("U137 a passage row's provenance is deterministic_conversion with locator, artifact and review status", async () => {
  const row = await passageRow(rowFor(), passage("text", [12, 13]), EMBEDDING, NOW);
  assertEquals(row.metadata.provenance, {
    method: "deterministic_conversion",
    source_locator: "pages 12–13",
    artifact: "dishwasher-manual.pdf",
    review_status: "unreviewed",
  });
});

Deno.test("U138 a passage row's metadata has attachment_id and parent_thought_id", async () => {
  const row = await passageRow(rowFor(), passage("text", [1, 1]), EMBEDDING, NOW);
  assertEquals(row.metadata.attachment_id, ID);
  assertEquals(row.metadata.parent_thought_id, PARENT);
});

Deno.test("U350 passageRow records provenance.source_locator page 12 for one page and pages 12–13 across two", async () => {
  const one = await passageRow(rowFor(), passage("text", [12, 12]), EMBEDDING, NOW);
  assertEquals((one.metadata.provenance as { source_locator: string }).source_locator, "page 12");
  const two = await passageRow(rowFor(), passage("text", [12, 13]), EMBEDDING, NOW);
  assertEquals((two.metadata.provenance as { source_locator: string }).source_locator, "pages 12–13");
});

Deno.test("U139 an attachment with tier restricted gives metadata with sensitivity_tier restricted", async () => {
  const row = await passageRow(rowFor("a.pdf", { sensitivity_tier: "restricted" }), passage("text", [1, 1]), EMBEDDING, NOW);
  assertEquals(row.metadata.sensitivity_tier, "restricted");
});

Deno.test("U140 the metadata contains no URL, token or absolute path, even from a file name that held a path", async () => {
  const dirty = rowFor("/Users/mfelker/private/dishwasher-manual.pdf", {
    page_token_hash: "page-token-hash-value",
    storage_path: "attachments/" + ID + "/https://signed.example.test/object?token=abc",
  });
  const row = await passageRow(dirty, passage("text", [1, 2]), EMBEDDING, NOW);
  const json = JSON.stringify(row.metadata);
  for (const forbidden of ["/Users", "mfelker", "private", "http", "token", "claim-token", "attachments/"]) {
    assert(!json.includes(forbidden), `metadata holds "${forbidden}": ${json}`);
  }
  assertEquals(row.metadata.source_label, "dishwasher-manual.pdf");
  assertEquals(row.metadata.topics, ["attachment", "dishwasher-manual.pdf"]);
  assertStringIncludes(row.content, "From dishwasher-manual.pdf,");
});
