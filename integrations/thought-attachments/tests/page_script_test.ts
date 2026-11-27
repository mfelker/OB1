/** The phone page's inline script (T044): contracts/upload-page.md, FR-002, FR-003, FR-024, T005 Q5 and Q6. */
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { FakeFetch } from "./helpers/fake_fetch.ts";
import { loadPage, readPageSource, settle } from "./helpers/page_dom.ts";

const BASE = "https://brain.example.test/functions/v1/thought-attachments";
const PAGE_AT = `${BASE}/upload`;
const EXPIRED = "This link has expired or was already used. Ask your assistant for a new one";
const INFO = { expected_kind: null, accepted_types: ["image/jpeg", "image/png", "image/webp", "application/pdf"], caps: { image_bytes: 10485760, pdf_bytes: 20971520, pdf_pages: 50 } };

function net(): FakeFetch {
  return new FakeFetch().on("POST", `${BASE}/page/info`, { body: INFO });
}

Deno.test("U281 the page reads its token only from the #t= fragment; a token in the query string is ignored", async () => {
  const fromFragment = net();
  await loadPage({ href: `${PAGE_AT}?t=query-token#t=fragment-token`, fetch: fromFragment.fetch });
  assertEquals(fromFragment.requests.map((r) => r.body), [{ token: "fragment-token" }]);

  const queryOnly = net();
  const page = await loadPage({ href: `${PAGE_AT}?t=query-token`, fetch: queryOnly.fetch });
  assertEquals(queryOnly.requests.length, 0);
  assertStringIncludes(page.text("status"), "expired");
});
