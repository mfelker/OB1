/** Phone page routes (T042, T043): contracts/upload-page.md, FR-001..FR-003, FR-024, T005 Q5. */
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { pageRoutes } from "../src/page_routes.ts";
import { loadSettings } from "../src/settings.ts";
import type { AttachmentRow, Deps, FinishOutcome, Services } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { envGetter, PUBLIC_BASE_URL, SUPABASE_URL } from "./helpers/env.ts";
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
