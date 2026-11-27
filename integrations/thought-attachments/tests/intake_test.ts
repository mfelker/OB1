/** Intake checks (T020, T035, T053): declared and actual file details. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { baseName, checkActual, checkDeclared, sniffType } from "../src/intake.ts";
import { loadSettings } from "../src/settings.ts";
import type { AcceptedType, AttachmentRow, Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";
import { heicBytes, jpegBytes, pngBytes, textPdf, webpBytes } from "./helpers/fixtures.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("expected ok settings: " + JSON.stringify(result.problems));
  return result.settings;
}

const IMAGE_CAP = 10_485_760;
const PDF_CAP = 26_214_400;

Deno.test("U113 baseName drops POSIX directory parts", () => {
  assertEquals(baseName("/Users/a/b/manual.pdf"), "manual.pdf");
});

Deno.test("U114 baseName drops Windows directory parts and the drive", () => {
  assertEquals(baseName("C:\\Users\\a\\manual.pdf"), "manual.pdf");
});

Deno.test("U115 baseName removes control characters", () => {
  assertEquals(baseName("man\u0000ual\n\t.pdf\u007f"), "manual.pdf");
});

Deno.test("U116 checkDeclared accepts each of the four accepted types within its cap", () => {
  const s = settingsWith();
  for (const type of ["application/pdf", "image/jpeg", "image/png", "image/webp"]) {
    assertEquals(checkDeclared({ name: "file", type, size: 1000 }, s), null, type);
  }
});

Deno.test("U117 checkDeclared refuses any other type, naming the accepted types", () => {
  const refusal = checkDeclared({ name: "a.zip", type: "application/zip", size: 1000 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "unsupported_type");
  for (const name of ["PDF", "JPEG", "PNG", "WebP"]) assertStringIncludes(refusal.message, name);
});

Deno.test("U119 an image declared one byte over the image cap is refused, naming the cap and the declared size", () => {
  const refusal = checkDeclared({ name: "a.jpg", type: "image/jpeg", size: IMAGE_CAP + 1 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "too_large");
  assertStringIncludes(refusal.message, "10485760");
  assertStringIncludes(refusal.message, "10485761");
});

Deno.test("U118 an image declared at exactly the image cap is accepted", () => {
  assertEquals(checkDeclared({ name: "a.jpg", type: "image/jpeg", size: IMAGE_CAP }, settingsWith()), null);
});

Deno.test("U120 a PDF declared at exactly the PDF cap is accepted", () => {
  assertEquals(checkDeclared({ name: "a.pdf", type: "application/pdf", size: PDF_CAP }, settingsWith()), null);
});

Deno.test("U121 a PDF declared one byte over the PDF cap is refused, naming the cap and the declared size", () => {
  const refusal = checkDeclared({ name: "a.pdf", type: "application/pdf", size: PDF_CAP + 1 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "too_large");
  assertStringIncludes(refusal.message, "26214400");
  assertStringIncludes(refusal.message, "26214401");
});

Deno.test("U320 with MAX_IMAGE_MB=2.5 an image at 2,621,440 bytes is accepted and one byte more is refused", () => {
  const s = settingsWith({ MAX_IMAGE_MB: "2.5" });
  assertEquals(checkDeclared({ name: "a.png", type: "image/png", size: 2_621_440 }, s), null);
  const refusal = checkDeclared({ name: "a.png", type: "image/png", size: 2_621_441 }, s);
  assert(refusal !== null);
  assertStringIncludes(refusal.message, "2621440");
});

Deno.test("U141 a HEIC declared type is refused with share it as JPEG and the steps on iPhone and Android", () => {
  for (const type of ["image/heic", "image/heif"]) {
    const refusal = checkDeclared({ name: "photo", type, size: 1000 }, settingsWith());
    assert(refusal !== null, type);
    assertEquals(refusal.code, "heic");
    assertStringIncludes(refusal.message, "share it as JPEG");
    assertStringIncludes(refusal.message, "iPhone");
    assertStringIncludes(refusal.message, "Android");
  }
});

Deno.test("U142 a file name ending .heic or .heif, in any case, gets the same refusal whatever the declared type", () => {
  for (const name of ["a.heic", "B.HEIC", "c.Heif", "d.heif"]) {
    const refusal = checkDeclared({ name, type: "image/jpeg", size: 1000 }, settingsWith());
    assert(refusal !== null, name);
    assertEquals(refusal.code, "heic");
  }
});

Deno.test("U143 sniffType identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes", async () => {
  assertEquals(sniffType(await textPdf(["hello"])), "application/pdf");
  assertEquals(sniffType(jpegBytes()), "image/jpeg");
  assertEquals(sniffType(await pngBytes()), "image/png");
  assertEquals(sniffType(webpBytes()), "image/webp");
  assertEquals(sniffType(heicBytes()), "image/heic");
});

Deno.test("U144 sniffType returns null for any other bytes and for empty input", () => {
  assertEquals(sniffType(new Uint8Array()), null);
  assertEquals(sniffType(new TextEncoder().encode("PK\u0003\u0004 zip archive")), null);
  assertEquals(sniffType(new TextEncoder().encode("plain text, not a file")), null);
});

/** A pending attachment declared as `type` and `size`. `page_count` is what the finisher read from the stored PDF. */
function rowFor(type: AcceptedType, size: number, pageCount: number | null = null): AttachmentRow {
  return {
    id: "a1b2c3d4-0000-4000-8000-000000000000",
    parent_thought_id: "11111111-1111-4111-8111-111111111111",
    parent_created_here: false,
    file_name: "file",
    declared_type: type,
    declared_size: size,
    expected_kind: null,
    actual_type: null,
    actual_size: null,
    page_count: pageCount,
    content_hash: null,
    storage_path: "attachments/a1b2c3d4-0000-4000-8000-000000000000/file",
    sensitivity_tier: "personal",
    state: "pending_upload",
    state_reason: null,
    last_rebuild_error: null,
    caption_model: null,
    derived_count: 0,
    upload_deadline: "2026-11-27T13:00:00.000Z",
    page_token_hash: null,
    busy_op: null,
    busy_until: null,
    busy_token: null,
    created_at: "2026-11-27T12:00:00.000Z",
    updated_at: "2026-11-27T12:00:00.000Z",
    processed_at: null,
  };
}

/** `size` bytes that start like a PDF. */
function pdfLike(size: number): Uint8Array {
  const out = new Uint8Array(size);
  out.set(new TextEncoder().encode("%PDF-1.7\n"));
  return out;
}

const info = (size: number) => ({ size, createdAt: "2026-11-27T12:10:00.000Z" });

Deno.test("U148 checkActual accepts a file whose sniffed type and exact size equal the declaration, within the caps", () => {
  const bytes = jpegBytes(5000);
  assertEquals(checkActual(rowFor("image/jpeg", 5000), bytes, info(5000), settingsWith()), null);
});

Deno.test("U149 checkActual refuses a sniffed type that differs from the declared one, naming the actual type", () => {
  const refusal = checkActual(rowFor("image/jpeg", 5000), webpBytes(5000), info(5000), settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "wrong_type");
  assertStringIncludes(refusal.message, "image/webp");
});

Deno.test("U150 checkActual refuses an actual size one byte different from the declared one, naming the actual size", () => {
  for (const actual of [4999, 5001]) {
    const refusal = checkActual(rowFor("image/jpeg", 5000), jpegBytes(actual), info(actual), settingsWith());
    assert(refusal !== null, String(actual));
    assertEquals(refusal.code, "wrong_size");
    assertStringIncludes(refusal.message, String(actual));
  }
});

Deno.test("U153 checkActual refuses an actual size over its type's cap, naming cap and size, and for a PDF the planned background processing", () => {
  const img = checkActual(rowFor("image/jpeg", IMAGE_CAP + 1), jpegBytes(IMAGE_CAP + 1), info(IMAGE_CAP + 1), settingsWith());
  assert(img !== null);
  assertEquals(img.code, "too_large");
  assertStringIncludes(img.message, "10485760");
  assertStringIncludes(img.message, "10485761");
  const pdf = checkActual(rowFor("application/pdf", PDF_CAP + 1), pdfLike(PDF_CAP + 1), info(PDF_CAP + 1), settingsWith());
  assert(pdf !== null);
  assertEquals(pdf.code, "too_large");
  assertStringIncludes(pdf.message, "26214400");
  assertStringIncludes(pdf.message, "26214401");
  assertStringIncludes(pdf.message.toLowerCase(), "background processing");
});

Deno.test("U154 checkActual refuses HEIC bytes with the share it as JPEG message, whatever was declared", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const) {
    const refusal = checkActual(rowFor(type, 5000), heicBytes(5000), info(5000), settingsWith());
    assert(refusal !== null, type);
    assertEquals(refusal.code, "heic");
    assertStringIncludes(refusal.message, "share it as JPEG");
  }
});

Deno.test("U155 checkActual refuses bytes sniffType does not recognise as a type that is not accepted", () => {
  const bytes = new TextEncoder().encode("PK zip archive bytes");
  const refusal = checkActual(rowFor("image/jpeg", bytes.length), bytes, info(bytes.length), settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "unsupported_type");
  assertStringIncludes(refusal.message, "PDF, JPEG, PNG and WebP");
});

Deno.test("U152 checkActual refuses a PDF of MAX_PDF_PAGES + 1 pages, naming MAX_PDF_PAGES, the page count and background processing", () => {
  const s = settingsWith();
  const refusal = checkActual(rowFor("application/pdf", 5000, 51), pdfLike(5000), info(5000), s);
  assert(refusal !== null);
  assertEquals(refusal.code, "too_many_pages");
  assertStringIncludes(refusal.message, "MAX_PDF_PAGES");
  assertStringIncludes(refusal.message, "50");
  assertStringIncludes(refusal.message, "51");
  assertStringIncludes(refusal.message.toLowerCase(), "background processing");
});

Deno.test("U151 checkActual accepts a PDF of exactly MAX_PDF_PAGES pages", () => {
  assertEquals(checkActual(rowFor("application/pdf", 5000, 50), pdfLike(5000), info(5000), settingsWith()), null);
  assertEquals(checkActual(rowFor("application/pdf", 5000, 7), pdfLike(5000), info(5000), settingsWith({ MAX_PDF_PAGES: "7" })), null);
});
