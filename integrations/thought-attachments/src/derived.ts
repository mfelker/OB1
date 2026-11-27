// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { AttachmentRow, DerivedRow, Passage } from "./types.ts";

/** `From <file>, <locator> (attachment <short id>)` (FR-025). */
export function sourceLine(fileName: string, locator: string, shortId: string): string {
  return "From " + fileName + ", " + locator + " (attachment " + shortId + ")";
}

/** upsert_thought's fingerprint of a thought's content (VP-004). */
export function fingerprint(content: string): Promise<string> {
  throw new Error("not implemented");
}

export function passageRow(
  row: AttachmentRow,
  passage: Passage,
  embedding: number[],
  now: Date,
): Promise<DerivedRow> {
  throw new Error("not implemented");
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
