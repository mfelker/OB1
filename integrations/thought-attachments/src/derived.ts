// Stub: throws until its stream replaces it (tasks.md "Seams").
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

export async function passageRow(
  row: AttachmentRow,
  passage: Passage,
  embedding: number[],
  now: Date,
): Promise<DerivedRow> {
  const content = sourceLine(row.file_name ?? "", locatorFor(passage.pages), row.id.slice(0, 8)) + "\n" + passage.text;
  const hash = await fingerprint(content);
  const metadata = {
    source: "local_document",
    source_type: "local_document",
    source_label: row.file_name,
    importer_name: "thought-attachments",
    importer_version: IMPORTER_VERSION,
    imported_at: now.toISOString(),
    input_hash: row.content_hash,
    content_fingerprint: "sha256:" + hash,
    sensitivity_tier: row.sensitivity_tier,
    type: "reference",
    topics: ["attachment", row.file_name],
    provenance: {
      method: "deterministic_conversion",
      source_locator: locatorFor(passage.pages),
      artifact: row.file_name,
      review_status: "unreviewed",
    },
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
  throw new Error("not implemented");
}

/** Metadata of a parent note created by attaching (data-model.md). */
export function noteMetadata(now: Date): Record<string, unknown> {
  throw new Error("not implemented");
}
