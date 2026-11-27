/** PDF reading (T021, T054): page count, per-page text, scanned detection, unreadable files. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.19";
import { openPdf } from "../src/pdf.ts";
import { textPdf } from "./helpers/fixtures.ts";

Deno.test("U122 openPdf of a 3-page fixture reports pageCount 3", async () => {
  const result = await openPdf(await textPdf(["one", "two", "three"]));
  assert("data" in result);
  assertEquals(result.data.pageCount, 3);
});
