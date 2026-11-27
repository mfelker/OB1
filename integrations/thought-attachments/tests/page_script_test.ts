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

Deno.test("U284 the file input accepts exactly the four types and one file", async () => {
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: net().fetch });
  const input = page.el("file");
  assertEquals([input.getAttribute("type"), input.getAttribute("accept"), input.hasAttribute("multiple")], [
    "file",
    "image/jpeg,image/png,image/webp,application/pdf",
    false,
  ]);
});

Deno.test("U285 the page shows the accepted types", async () => {
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: net().fetch });
  const types = page.text("types");
  for (const word of ["JPEG", "PNG", "WebP", "PDF"]) assertStringIncludes(types, word);
});

Deno.test("U286 a refusal from /page/start is shown, and no PUT happens", async () => {
  const f = net().on("POST", `${BASE}/page/start`, { status: 400, body: REFUSAL });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick({ name: "big.jpg", type: "image/jpeg", size: 20_000_000 });
  await settle();
  assertStringIncludes(page.text("status"), REFUSAL.message);
  assertEquals(f.requests.filter((r) => r.method === "PUT"), []);
  assertEquals(f.requests.map((r) => r.url.slice(BASE.length)), ["/page/info", "/page/start"]);
});

const SIGNED = "https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/a1/receipt.jpg?token=signed";
const UPLOAD = { upload: { url: SIGNED, method: "PUT", headers: { "content-type": "image/jpeg", "x-upsert": "true" } } };

Deno.test("U287 upload progress is shown during the PUT", async () => {
  const f = net().on("POST", `${BASE}/page/start`, { body: UPLOAD }).on("PUT", SIGNED, { hold: { status: 200, body: {} } });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  assertEquals(f.heldCount, 1);
  assertStringIncludes(page.text("status"), "Uploading");
  assertEquals(page.el("progress").hidden, false);
});

const PROCESSED = { state: "processed", derived_count: 1, caption: "A receipt on a desk" };

Deno.test("U288 the page PUTs the one file to the returned link, then calls /page/finish", async () => {
  const f = net()
    .on("POST", `${BASE}/page/start`, { body: UPLOAD })
    .on("PUT", SIGNED, { status: 200, body: {} })
    .on("POST", `${BASE}/page/finish`, { body: PROCESSED });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  assertEquals(f.requests.map((r) => `${r.method} ${r.url.slice(BASE.length)}`), [
    "POST /page/info",
    "POST /page/start",
    `PUT ${SIGNED.slice(BASE.length)}`,
    "POST /page/finish",
  ]);
  const put = f.requests[2];
  assertEquals([put.headers["content-type"], put.headers["x-upsert"], (put.body as string).length], ["image/jpeg", "true", PICK.size]);
  assertEquals(f.requests[3].body, { token: "tok" });
});

/** Load the page, pick a file, and let it upload and finish with `outcome`. */
async function finishWith(outcome: unknown) {
  const f = net()
    .on("POST", `${BASE}/page/start`, { body: UPLOAD })
    .on("PUT", SIGNED, { status: 200, body: {} })
    .on("POST", `${BASE}/page/finish`, { body: outcome });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  return { page, f };
}

Deno.test("U289 each outcome shows its text from the contract", async () => {
  const long = "x".repeat(400);
  const cases: [unknown, string][] = [
    [{ state: "processed", derived_count: 1, caption: long }, "Captioned: " + "x".repeat(300)],
    [{ state: "processed", derived_count: 12, page_count: 9 }, "Saved 12 passages"],
    [{ state: "scanned", derived_count: 0, page_count: 3 }, "Scanned PDF: text search won't cover it yet"],
    [{ state: "not_captioned", derived_count: 0, reason: "the vision model is not configured" }, "Not captioned: the vision model is not configured"],
    [{ state: "refused", derived_count: 0, reason: "The file is image/png, not the declared image/jpeg." }, "Refused: The file is image/png, not the declared image/jpeg."],
    [{ state: "failed", derived_count: 0, reason: "embedding service unavailable" }, "Failed: embedding service unavailable"],
  ];
  for (const [outcome, expected] of cases) {
    const { page } = await finishWith(outcome);
    assertEquals(page.text("status"), expected);
  }
});

Deno.test("U290 a 410 shows the expired message, from info, start and finish", async () => {
  const gone = { status: 410, body: { error: EXPIRED } };
  const onInfo = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: new FakeFetch().on("POST", `${BASE}/page/info`, gone).fetch });
  const onStart = await loadPage({
    href: `${PAGE_AT}#t=tok`,
    fetch: net().on("POST", `${BASE}/page/start`, gone).fetch,
  });
  await onStart.pick(PICK);
  await settle();
  const { page: onFinish } = await (async () => {
    const f = net()
      .on("POST", `${BASE}/page/start`, { body: UPLOAD })
      .on("PUT", SIGNED, { status: 200, body: {} })
      .on("POST", `${BASE}/page/finish`, gone);
    const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
    await page.pick(PICK);
    await settle();
    return { page };
  })();
  assertEquals([onInfo.text("status"), onStart.text("status"), onFinish.text("status")], [EXPIRED, EXPIRED, EXPIRED]);
});

Deno.test("U291 the file contains no key, no token and no project address other than its API-address setting", () => {
  const source = readPageSource();
  assertEquals(source.match(/https?:\/\//g), null);
  assertEquals(source.match(/supabase|x-brain|service_role|apikey|bearer|authorization|eyJ[A-Za-z0-9]/gi), null);
  assertEquals(source.match(/#t=[A-Za-z0-9_-]{8,}/g), null);
  const blank = source.split("\n").filter((l) => /API_ADDRESS\s*=/.test(l));
  assertEquals(blank, ['var API_ADDRESS = "";']);
});

Deno.test("U292 the file loads no external script or style", () => {
  const source = readPageSource();
  assertEquals(source.match(/<script[^>]*\ssrc\s*=/gi), null);
  assertEquals(source.match(/<link\b/gi), null);
  assertEquals(source.match(/@import|url\(/gi), null);
  assertEquals(source.match(/<(img|iframe|object|embed|audio|video|source)\b/gi), null);
});

Deno.test("U342 before any pick, the page sends { token } to /page/info and shows the expected kind and the size limit", async () => {
  const asked = new FakeFetch().on("POST", `${BASE}/page/info`, {
    body: { ...INFO, expected_kind: "photo", caps: { image_bytes: 10485760, pdf_bytes: 7864320, pdf_pages: 30 } },
  });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: asked.fetch });
  assertEquals(asked.requests.map((r) => [r.url.slice(BASE.length), r.body]), [["/page/info", { token: "tok" }]]);
  assertStringIncludes(page.text("expected"), "photo");
  assertEquals(page.el("expected").hidden, false);
  const limit = page.text("limit");
  for (const part of ["10 MB", "7.5 MB", "30 pages"]) assertStringIncludes(limit, part);

  const none = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: net().fetch });
  assertEquals([none.text("expected"), none.el("expected").hidden], ["", true]);
});

const BUSY = { state: "pending_upload", derived_count: 0, busy: "finish" };
const NO_FILE = { state: "pending_upload", derived_count: 0, reason: "no file uploaded yet" };

function retrying(...answers: unknown[]) {
  const finish = answers.map((body) => ({ body }));
  const f = net()
    .on("POST", `${BASE}/page/start`, { body: UPLOAD })
    .on("PUT", SIGNED, { status: 200, body: {} })
    .on("POST", `${BASE}/page/finish`, ...finish);
  return f;
}

const finishCalls = (f: FakeFetch) => f.requests.filter((r) => r.url.endsWith("/page/finish")).length;

Deno.test("U343 when /page/finish answers busy or no file yet, the page shows Waiting… and calls it again 10 seconds later", async () => {
  for (const first of [BUSY, NO_FILE]) {
    const f = retrying(first, PROCESSED);
    const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
    await page.pick(PICK);
    await settle();
    assertEquals([page.text("status"), finishCalls(f)], ["Waiting…", 1]);
    await page.advance(10_000);
    assertEquals([finishCalls(f), page.text("status")], [2, "Captioned: A receipt on a desk"]);
  }
});

Deno.test("U344 9 seconds after a busy answer, the page has not called /page/finish again", async () => {
  const f = retrying(BUSY, PROCESSED);
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  await page.advance(9_000);
  assertEquals([finishCalls(f), page.text("status")], [1, "Waiting…"]);
});

Deno.test("U345 when a retried /page/finish gets 410, the page shows the expired message and stops retrying", async () => {
  const f = net()
    .on("POST", `${BASE}/page/start`, { body: UPLOAD })
    .on("PUT", SIGNED, { status: 200, body: {} })
    .on("POST", `${BASE}/page/finish`, { body: BUSY }, { status: 410, body: { error: EXPIRED } });
  const page = await loadPage({ href: `${PAGE_AT}#t=tok`, fetch: f.fetch });
  await page.pick(PICK);
  await settle();
  await page.advance(10_000);
  assertEquals([page.text("status"), finishCalls(f), page.pendingTimers], [EXPIRED, 2, 0]);
  await page.advance(120_000);
  assertEquals(finishCalls(f), 2);
});

Deno.test("U346 the repository's upload-page.html has its API-address line blank", () => {
  const lines = readPageSource().split("\n").filter((l) => /\bAPI_ADDRESS\b\s*=/.test(l));
  assertEquals(lines.length, 1);
  assertEquals(/=\s*(""|'')\s*;/.test(lines[0]), true);
});
