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
  if (decl.type === "image/heic" || decl.type === "image/heif" || /\.(heic|heif)$/i.test(decl.name)) {
    return HEIC_REFUSAL;
  }
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
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ascii(1, 4) === "PNG" && bytes[0] === 0x89) return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(ascii(8, 12))) {
    return "image/heic";
  }
  return null;
}

export function checkActual(
  row: AttachmentRow,
  bytes: Uint8Array,
  info: { size: number; createdAt: string },
  settings: Settings,
): Refusal | null {
  return null;
}
