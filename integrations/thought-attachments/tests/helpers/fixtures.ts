/**
 * Test files generated at test time (research R15). No binary fixture is
 * committed: PDFs come from pdf-lib, images are minimal byte headers (PNG is a
 * complete, valid 1-colour image so pdf-lib can embed it).
 */
import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";

const enc = new TextEncoder();

/** A text PDF with one page per entry. Lines split on `\n`. Text must be WinAnsi (Latin-1 plus a few marks such as `–`). */
export async function textPdf(pageTexts: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pageTexts) {
    const page = doc.addPage([612, 792]);
    page.drawText(text, { x: 50, y: 740, size: 11, font, lineHeight: 14, maxWidth: 512 });
  }
  return await doc.save({ useObjectStreams: false });
}

/** An image-only PDF (a "scanned" manual): each page carries a picture and no text layer. */
export async function scannedPdf(pages = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(await pngBytes(8, 8));
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([612, 792]);
    page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  }
  return await doc.save({ useObjectStreams: false });
}

/** Bytes that start like a PDF and are not one. */
export function corruptPdf(): Uint8Array {
  return enc.encode("%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >>\nthis is not a valid pdf body\n%%EOF\n");
}

/** `size` bytes, each `fill`. */
export function bytesOfSize(size: number, fill = 0x41): Uint8Array {
  return new Uint8Array(size).fill(fill);
}

/** `header` padded with zero bytes to `size` (never shorter than the header). */
function padded(header: number[], size?: number): Uint8Array {
  const out = new Uint8Array(Math.max(header.length, size ?? header.length));
  out.set(header);
  return out;
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** A JPEG/JFIF header (SOI + APP0). */
export function jpegBytes(size?: number): Uint8Array {
  return padded([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...ascii("JFIF"), 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00], size);
}

/** A WebP header (RIFF … WEBP VP8 ). */
export function webpBytes(size?: number): Uint8Array {
  const total = Math.max(size ?? 30, 30);
  const riffSize = total - 8;
  return padded([
    ...ascii("RIFF"),
    riffSize & 0xff,
    (riffSize >> 8) & 0xff,
    (riffSize >> 16) & 0xff,
    (riffSize >> 24) & 0xff,
    ...ascii("WEBPVP8 "),
  ], total);
}

/** A HEIC header (ftyp box, brand heic). */
export function heicBytes(size?: number): Uint8Array {
  return padded([0x00, 0x00, 0x00, 0x18, ...ascii("ftypheic"), 0x00, 0x00, 0x00, 0x00, ...ascii("mif1heic")], size);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function be32(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function chunk(type: string, data: Uint8Array): number[] {
  const typed = new Uint8Array([...ascii(type), ...data]);
  return [...be32(data.length), ...typed, ...be32(crc32(typed))];
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** A valid grey RGB PNG of `width` × `height`, padded with trailing zero bytes to `size` when given. */
export async function pngBytes(width = 1, height = 1, size?: number): Promise<Uint8Array> {
  const ihdr = new Uint8Array([...be32(width), ...be32(height), 8, 2, 0, 0, 0]);
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) raw.fill(0x80, y * (1 + width * 3) + 1, (y + 1) * (1 + width * 3));
  const bytes = [
    ...PNG_SIGNATURE,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", await zlib(raw)),
    ...chunk("IEND", new Uint8Array()),
  ];
  return padded(bytes, size);
}

/** `sha256:<hex>` of the bytes, as `content_hash` stores it. */
export async function contentHash(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return "sha256:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
