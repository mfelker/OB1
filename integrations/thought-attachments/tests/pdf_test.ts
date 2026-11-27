/** PDF reading (T021, T054): page count, per-page text, scanned detection, unreadable files. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.19";
import { isScanned, openPdf } from "../src/pdf.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";
import { textPdf } from "./helpers/fixtures.ts";

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
