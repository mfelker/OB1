// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { AcceptedType, AttachmentRow, DeclaredFile, Refusal, Settings } from "./types.ts";

const ACCEPTED: AcceptedType[] = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function baseName(name: string): string {
  return (name.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f]/g, "");
}

export const HEIC_REFUSAL: Refusal = {
  code: "heic",
  message: "HEIC photos are not accepted: share it as JPEG. " +
    "On iPhone, open Settings > Camera > Formats and choose Most Compatible, or pick the photo in Photos, tap Share and choose Options > Most Compatible. " +
    "On Android, choose JPEG in the camera settings, or share the photo from the gallery as JPEG.",
};

export function checkDeclared(decl: DeclaredFile, settings: Settings): Refusal | null {
  if (decl.type === "image/heic" || decl.type === "image/heif") return HEIC_REFUSAL;
  if (!ACCEPTED.includes(decl.type as AcceptedType)) {
    return { code: "unsupported_type", message: "Accepted types are PDF, JPEG, PNG and WebP. Got " + decl.type + "." };
  }
  const cap = Math.floor((decl.type === "application/pdf" ? settings.maxPdfMb : settings.maxImageMb) * 1024 * 1024);
  if (decl.size > cap) {
    return { code: "too_large", message: "The file is " + decl.size + " bytes, over the cap of " + cap + " bytes." };
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
