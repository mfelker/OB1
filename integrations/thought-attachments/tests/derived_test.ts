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
