/** Phone page routes (T042, T043): contracts/upload-page.md, FR-001..FR-003, FR-024, T005 Q5. */
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { pageRoutes } from "../src/page_routes.ts";
import { loadSettings } from "../src/settings.ts";
import type { AttachmentRow, Deps, FinishOutcome, Services } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { BRAIN_KEY, envGetter, PUBLIC_BASE_URL, SUPABASE_URL } from "./helpers/env.ts";
import { FakeStore } from "./helpers/fake_store.ts";

const PAGE = "https://pages.example.test/ob1/upload-page.html";
const TOKEN = "page-token-for-x";
const PARENT = "00000001-0000-4000-9000-000000000000";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Rig {
  clock: Clock;
  store: FakeStore;
  deps: Deps;
  finishCalls: string[];
  outcomes: FinishOutcome[];
  app: ReturnType<typeof pageRoutes>;
  seed(fields?: Partial<AttachmentRow>, token?: string): Promise<AttachmentRow>;
  post(path: string, body: unknown, headers?: Record<string, string>): Promise<Response>;
}

function rig(env: Record<string, string | undefined> = {}): Rig {
  const clock = new Clock();
  const store = new FakeStore({ clock });
  const loaded = loadSettings(envGetter({ UPLOAD_PAGE_URL: PAGE, ...env }));
  if (!loaded.ok) throw new Error("settings");
  const deps: Deps = {
    settings: loaded.settings,
    store,
    embeddings: { embed: () => Promise.resolve({ error: "unused" }) },
    vision: { configured: false, caption: () => Promise.resolve({ error: "unused" }) },
    now: clock.now,
    randomBytes: (n) => new Uint8Array(n).fill(7),
  };
  const finishCalls: string[] = [];
  const outcomes: FinishOutcome[] = [];
  const services: Services = {
    finish: (id) => {
      finishCalls.push(id);
      return Promise.resolve(outcomes.shift() ?? { state: "processed", derived_count: 1 });
    },
  };
  const app = pageRoutes(deps, services);
  return {
    clock,
    store,
    deps,
    finishCalls,
    outcomes,
    app,
    async seed(fields = {}, token = TOKEN) {
      return store.seedAttachment({
        parent_thought_id: PARENT,
        page_token_hash: await sha256Hex(token),
        ...fields,
      });
    },
    post(path, body, headers = {}) {
      return Promise.resolve(app.request(`https://fn.example.test${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      }));
    },
  };
}

const PICK = { name: "receipt.jpg", type: "image/jpeg", size: 2048 };

Deno.test("U262 /page/start with a valid token and no declaration records the base name, type and size and returns a signed link through publicUrl", async () => {
  const r = await rig();
  const row = await r.seed();
  const res = await r.post("/page/start", { token: TOKEN, ...PICK, name: "C:\\photos\\receipt.jpg" });
  const body = await res.json();
  const stored = r.store.attachment(row.id)!;
  assertEquals(
    [res.status, stored.file_name, stored.declared_type, stored.declared_size, body.upload.method],
    [200, "receipt.jpg", "image/jpeg", 2048, "PUT"],
  );
  assertEquals(body.upload.url, r.store.signedUploads[0].url.replace(SUPABASE_URL, PUBLIC_BASE_URL));
  assertEquals(r.store.signedUploads[0].path, stored.storage_path);
  assertStringIncludes(stored.storage_path!, `attachments/${row.id}/receipt.jpg`);
});

const DECLARED = {
  file_name: "receipt.jpg",
  declared_type: "image/jpeg" as const,
  declared_size: 2048,
  storage_path: "attachments/a0000001-0000-4000-8000-000000000000/receipt.jpg",
};

Deno.test("U263 /page/start whose pick matches the attach call's declaration confirms it and returns a link", async () => {
  const r = await rig();
  const row = await r.seed(DECLARED);
  const res = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals([res.status, r.store.attachment(row.id)!.storage_path, r.store.signedUploads.length], [200, DECLARED.storage_path, 1]);
  assertEquals(r.store.signedUploads[0].path, DECLARED.storage_path);
});

Deno.test("U264 /page/start whose pick doesn't match the attach call's declaration is refused, with no link", async () => {
  const r = await rig();
  const row = await r.seed(DECLARED);
  const wrongSize = await r.post("/page/start", { token: TOKEN, ...PICK, size: 4096 });
  const wrongType = await r.post("/page/start", { token: TOKEN, ...PICK, type: "image/png" });
  assertEquals(
    [wrongSize.status, (await wrongSize.json()).code, wrongType.status, (await wrongType.json()).code],
    [400, "wrong_size", 400, "wrong_type"],
  );
  assertEquals([r.store.signedUploads.length, r.store.attachment(row.id)!.declared_size], [0, 2048]);
});

Deno.test("U265 a picked HEIC file is refused with the share-as-JPEG message, with no link", async () => {
  const r = await rig();
  const row = await r.seed();
  const res = await r.post("/page/start", { token: TOKEN, name: "IMG_1.HEIC", type: "image/heic", size: 100 });
  const body = await res.json();
  assertEquals([res.status, body.code], [400, "heic"]);
  assertStringIncludes(body.message, "JPEG");
  assertEquals([r.store.signedUploads.length, r.store.attachment(row.id)!.declared_type], [0, null]);
});

Deno.test("U266 a picked type outside the four is refused with attach_file's message, with no link", async () => {
  const r = await rig();
  const row = await r.seed();
  const res = await r.post("/page/start", { token: TOKEN, name: "notes.txt", type: "text/plain", size: 100 });
  const body = await res.json();
  assertEquals([res.status, body.code], [400, "unsupported_type"]);
  assertStringIncludes(body.message, "Accepted types are PDF, JPEG, PNG and WebP");
  assertEquals([r.store.signedUploads.length, r.store.attachment(row.id)!.declared_type], [0, null]);
});

Deno.test("U268 a picked size over its cap is refused, naming the cap and the size", async () => {
  const r = await rig({ MAX_IMAGE_MB: "1" });
  const row = await r.seed();
  const res = await r.post("/page/start", { token: TOKEN, ...PICK, size: 2_000_000 });
  const body = await res.json();
  assertEquals([res.status, body.code], [400, "too_large"]);
  assertStringIncludes(body.message, "2000000");
  assertStringIncludes(body.message, "1048576");
  assertEquals([r.store.signedUploads.length, r.store.attachment(row.id)!.declared_size], [0, null]);
});

Deno.test("U267 a pick whose kind differs from expected_kind is refused, a PDF for a photo and the reverse", async () => {
  const r = await rig();
  const photo = await r.seed({ expected_kind: "photo" });
  const pdf = await r.seed({ expected_kind: "pdf" }, "token-for-pdf");
  const pdfForPhoto = await r.post("/page/start", { token: TOKEN, name: "a.pdf", type: "application/pdf", size: 10 });
  const photoForPdf = await r.post("/page/start", { token: "token-for-pdf", ...PICK });
  const okPhoto = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals(
    [pdfForPhoto.status, (await pdfForPhoto.json()).code, photoForPdf.status, (await photoForPdf.json()).code, okPhoto.status],
    [400, "wrong_type", 400, "wrong_type", 200],
  );
  assertEquals([r.store.attachment(pdf.id)!.declared_type, r.store.signedUploads.length, photo.expected_kind], [null, 1, "photo"]);
});

Deno.test("U269 a second /page/start replaces the declaration and returns a new link", async () => {
  const r = await rig();
  const row = await r.seed();
  const first = await r.post("/page/start", { token: TOKEN, name: "a.jpg", type: "image/jpeg", size: 100 });
  const second = await r.post("/page/start", { token: TOKEN, name: "b.png", type: "image/png", size: 200 });
  const stored = r.store.attachment(row.id)!;
  assertEquals([first.status, second.status], [200, 200]);
  assertEquals([stored.file_name, stored.declared_type, stored.declared_size], ["b.png", "image/png", 200]);
  assertEquals(r.store.signedUploads.map((s) => s.path), [`attachments/${row.id}/a.jpg`, `attachments/${row.id}/b.png`]);
  assertEquals(stored.storage_path, `attachments/${row.id}/b.png`);
});

const EXPIRED = "This link has expired or was already used. Ask your assistant for a new one";

Deno.test("U270 an unknown token gets 410 with the expired message", async () => {
  const r = await rig();
  const row = await r.seed();
  const unknown = await r.post("/page/start", { token: "no-such-token", ...PICK });
  const missing = await r.post("/page/start", { ...PICK });
  assertEquals([unknown.status, (await unknown.json()).error, missing.status, (await missing.json()).error], [410, EXPIRED, 410, EXPIRED]);
  assertEquals([r.store.signedUploads.length, r.store.attachment(row.id)!.declared_type], [0, null]);
});

Deno.test("U271 a used token gets 410 with the same message", async () => {
  const r = await rig();
  const row = await r.seed();
  await r.store.consumePageToken(row.id, await sha256Hex(TOKEN));
  const res = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals([res.status, (await res.json()).error], [410, EXPIRED]);
  assertEquals(r.store.signedUploads.length, 0);
});

Deno.test("U272 a token one second after upload_deadline gets 410", async () => {
  const r = await rig();
  const row = await r.seed();
  r.clock.set(new Date(new Date(row.upload_deadline).getTime() + 1000));
  const res = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals([res.status, (await res.json()).error], [410, EXPIRED]);
  assertEquals(r.store.signedUploads.length, 0);
});

Deno.test("U273 a token one second before upload_deadline is accepted", async () => {
  const r = await rig();
  const row = await r.seed();
  r.clock.set(new Date(new Date(row.upload_deadline).getTime() - 1000));
  const res = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals([res.status, r.store.signedUploads.length], [200, 1]);
});

Deno.test("U274 the page routes need no brain key, and a brain key without a valid token gets 410", async () => {
  const r = await rig();
  const row = await r.seed();
  const keyHeaders = { "x-brain-key": BRAIN_KEY, authorization: `Bearer ${BRAIN_KEY}` };
  const keyOnly = await r.post("/page/start", { ...PICK }, keyHeaders);
  const keyAsToken = await r.post("/page/start", { token: BRAIN_KEY, ...PICK }, keyHeaders);
  const noKey = await r.post("/page/start", { token: TOKEN, ...PICK });
  assertEquals([keyOnly.status, keyAsToken.status, noKey.status], [410, 410, 200]);
  assertEquals(r.store.attachment(row.id)!.declared_size, 2048);
});

Deno.test("U275 CORS allows the origin of UPLOAD_PAGE_URL and gives no allow-origin to any other origin", async () => {
  const r = await rig();
  await r.seed();
  const ok = await r.post("/page/start", { token: TOKEN, ...PICK }, { origin: "https://pages.example.test" });
  const other = await r.post("/page/start", { token: TOKEN, ...PICK }, { origin: "https://evil.example.test" });
  const none = await r.post("/page/start", { token: TOKEN, ...PICK });
  const preflight = await r.app.request("https://fn.example.test/page/start", {
    method: "OPTIONS",
    headers: { origin: "https://pages.example.test", "access-control-request-method": "POST" },
  });
  const badPreflight = await r.app.request("https://fn.example.test/page/start", {
    method: "OPTIONS",
    headers: { origin: "https://evil.example.test", "access-control-request-method": "POST" },
  });
  assertEquals(
    [
      ok.headers.get("access-control-allow-origin"),
      other.headers.get("access-control-allow-origin"),
      none.headers.get("access-control-allow-origin"),
      preflight.headers.get("access-control-allow-origin"),
      badPreflight.headers.get("access-control-allow-origin"),
    ],
    ["https://pages.example.test", null, null, "https://pages.example.test", null],
  );
  assertStringIncludes(preflight.headers.get("access-control-allow-headers") ?? "", "content-type");
});
