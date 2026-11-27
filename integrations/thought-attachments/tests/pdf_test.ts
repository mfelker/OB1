/** PDF reading (T021, T054): page count, per-page text, scanned detection, unreadable files. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { isScanned, openPdf } from "../src/pdf.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";
import { corruptPdf, textPdf } from "./helpers/fixtures.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("expected ok settings: " + JSON.stringify(result.problems));
  return result.settings;
}

Deno.test("U122 openPdf of a 3-page fixture reports pageCount 3", async () => {
  const result = await openPdf(await textPdf(["one", "two", "three"]));
  assert("data" in result);
  assertEquals(result.data.pageCount, 3);
});

Deno.test("U123 pageTexts returns each page's text in page order", async () => {
  const result = await openPdf(await textPdf(["alpha first page", "bravo second page", "charlie third page"]));
  assert("data" in result);
  const texts = await result.data.pageTexts();
  assertEquals(texts.length, 3);
  assertEquals(texts.map((t) => t.trim()), ["alpha first page", "bravo second page", "charlie third page"]);
});

Deno.test("U156 isScanned is true when the average non-space characters per page is one under SCANNED_MIN_CHARS_PER_PAGE", () => {
  const s = settingsWith(); // default 20 per page
  assertEquals(isScanned(["a".repeat(19), "b".repeat(19)], s), true);
  assertEquals(isScanned(["a".repeat(10), "b".repeat(29)], s), true); // 39 over 2 pages = 19.5
});

Deno.test("U157 isScanned is false at exactly SCANNED_MIN_CHARS_PER_PAGE", () => {
  assertEquals(isScanned(["a".repeat(20), "b".repeat(20)], settingsWith()), false);
  assertEquals(isScanned(["a".repeat(10), "b".repeat(30)], settingsWith()), false);
  assertEquals(isScanned(["a".repeat(5)], settingsWith({ SCANNED_MIN_CHARS_PER_PAGE: "5" })), false);
});

Deno.test("U158 whitespace-only page text counts as zero characters", () => {
  assertEquals(isScanned([" \n\t ".repeat(50), "  ".repeat(40)], settingsWith()), true);
  assertEquals(isScanned([" \n ".repeat(50) + "x".repeat(20)], settingsWith()), false);
});

Deno.test("U159 openPdf of corrupt bytes returns an error with a readable reason, without throwing", async () => {
  for (const bytes of [corruptPdf(), new Uint8Array(), new TextEncoder().encode("not a pdf at all")]) {
    const result = await openPdf(bytes);
    assert("error" in result);
    assertStringIncludes(result.error, "could not be read");
  }
});

/** A hand-written PDF with a standard-handler /Encrypt entry that needs a password: no binary file, no pdf-lib. */
function encryptedPdf(): Uint8Array {
  const hex = (digit: string) => "<" + digit.repeat(32) + ">";
  return new TextEncoder().encode(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj
4 0 obj << /Filter /Standard /V 1 /R 2 /O ${hex("ab")} /U ${hex("cd")} /P -4 >> endobj
trailer << /Root 1 0 R /Size 5 /Encrypt 4 0 R /ID [<00112233445566778899aabbccddeeff> <00112233445566778899aabbccddeeff>] >>
%%EOF
`);
}

Deno.test("U160 openPdf of an encrypted PDF returns an error with a readable reason", async () => {
  const result = await openPdf(encryptedPdf());
  assert("error" in result);
  assertStringIncludes(result.error, "password");
});
