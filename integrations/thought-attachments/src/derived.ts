// Stub: throws until its stream replaces it (tasks.md "Seams").
import { baseName } from "./intake.ts";
import type { AttachmentRow, DerivedRow, Passage } from "./types.ts";

/** The integration's version, as in `metadata.json`. */
const IMPORTER_VERSION = "0.1.0";

/** `From <file>, <locator> (attachment <short id>)` (FR-025). */
export function sourceLine(fileName: string, locator: string, shortId: string): string {
  return "From " + fileName + ", " + locator + " (attachment " + shortId + ")";
}

/** upsert_thought's fingerprint of a thought's content (VP-004). */
export async function fingerprint(content: string): Promise<string> {
  const normalised = content.replace(/\s+/g, " ").trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalised));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function passageRow(
  row: AttachmentRow,
  passage: Passage,
  embedding: number[],
  now: Date,
): Promise<DerivedRow> {
  return derivedRow(row, locatorFor(passage.pages), passage.text, {
    method: "deterministic_conversion",
    source_locator: locatorFor(passage.pages),
  }, embedding, now);
}

/** The row shared by passages and captions: source line, fingerprint and the data-model metadata. */
async function derivedRow(
  row: AttachmentRow,
  locator: string,
  body: string,
  provenance: Record<string, unknown>,
  embedding: number[],
  now: Date,
): Promise<DerivedRow> {
  const fileName = baseName(row.file_name ?? "");
  const content = sourceLine(fileName, locator, row.id.slice(0, 8)) + "\n" + body;
  const hash = await fingerprint(content);
  const metadata = {
    source: "local_document",
    source_type: "local_document",
    source_label: fileName,
    importer_name: "thought-attachments",
    importer_version: IMPORTER_VERSION,
    imported_at: now.toISOString(),
    input_hash: row.content_hash,
    content_fingerprint: "sha256:" + hash,
    sensitivity_tier: row.sensitivity_tier,
    type: "reference",
    topics: ["attachment", fileName],
    provenance: { ...provenance, artifact: fileName, review_status: "unreviewed" },
    attachment_id: row.id,
    parent_thought_id: row.parent_thought_id,
  };
  return { content, fingerprint: hash, metadata, embedding };
}

/** `page 12` for one page, `pages 12–13` across pages (data-model.md). */
function locatorFor([first, last]: [number, number]): string {
  return first === last ? "page " + first : "pages " + first + "–" + last;
}

export function captionRow(
  row: AttachmentRow,
  caption: { text: string; model: string },
  embedding: number[],
  now: Date,
): Promise<DerivedRow> {
  return derivedRow(row, "photo", caption.text, {
    method: "llm_extraction",
    source_locator: "photo",
    extractor_model: caption.model,
  }, embedding, now);
}

/** Metadata of a parent note created by attaching (data-model.md). */
export function noteMetadata(now: Date): Record<string, unknown> {
  return {
    type: "observation",
    source: "thought-attachments",
    source_type: "thought_attachments_note",
    imported_at: now.toISOString(),
  };
}
