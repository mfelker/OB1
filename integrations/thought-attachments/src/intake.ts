// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { AcceptedType, AttachmentRow, DeclaredFile, Refusal, Settings } from "./types.ts";

const ACCEPTED: AcceptedType[] = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function baseName(name: string): string {
  return (name.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f]/g, "");
}

export function checkDeclared(decl: DeclaredFile, settings: Settings): Refusal | null {
  if (!ACCEPTED.includes(decl.type as AcceptedType)) {
    return { code: "unsupported_type", message: "Accepted types are PDF, JPEG, PNG and WebP. Got " + decl.type + "." };
  }
  return null;
}

/** The type the bytes actually are, from their header; null when unrecognised. */
export function sniffType(bytes: Uint8Array): AcceptedType | "image/heic" | null {
  throw new Error("not implemented");
}

export function checkActual(
  row: AttachmentRow,
  bytes: Uint8Array,
  info: { size: number; createdAt: string },
  settings: Settings,
): Refusal | null {
  throw new Error("not implemented");
}
