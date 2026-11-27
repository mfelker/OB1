/** PDF reading (T021, T054): page count, per-page text, scanned detection, unreadable files. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.19";
import { openPdf } from "../src/pdf.ts";
import { textPdf } from "./helpers/fixtures.ts";

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
