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

const BLANK_LINE = 'var API_ADDRESS = "";';

/** The page with its API-address line filled in. */
function withAddress(address: string): string {
  const source = readPageSource();
  if (!source.includes(BLANK_LINE)) throw new Error("the API-address line is not in its blank form");
  return source.replace(BLANK_LINE, `var API_ADDRESS = "${address}";`);
}

Deno.test("U282 with its API-address line filled in, every request goes to that address, never to one taken from the link", async () => {
  const api = "https://static.example.test/functions/v1/thought-attachments";
  const f = new FakeFetch().on("POST", `${api}/page/info`, { body: INFO });
  await loadPage({
    href: `${PAGE_AT}?api=https://evil.example.test#t=tok&api=https://evil.example.test&base=https://evil.example.test`,
    fetch: f.fetch,
    html: withAddress(api),
  });
  assertEquals(f.requests.map((r) => r.url), [`${api}/page/info`]);
  assertEquals(f.unmatched, []);
});

const PICK = { name: "receipt.jpg", type: "image/jpeg", size: 2048 };
const REFUSAL = { code: "too_large", message: "The file is 20000000 bytes, over the cap of 10485760 bytes." };

Deno.test("U283 with its API-address line blank, every request goes to the address the page was served from", async () => {
  const f = net().on("POST", `${BASE}/page/start`, { status: 400, body: REFUSAL });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  assertEquals(f.requests.map((r) => r.url), [`${BASE}/page/info`, `${BASE}/page/start`]);
  assertEquals(f.requests[1].body, { token: "tok", ...PICK });
});
