/** The composed app (T031, T045): key check, CORS and Accept as the core server, settings errors, routing. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createApp, productionDeps } from "../src/app.ts";
import { loadSettings } from "../src/settings.ts";
import { UPLOAD_PAGE_HTML } from "../src/upload_page.ts";
import type { Deps, FetchApp, Settings } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { baseEnv, BRAIN_KEY, envGetter, SERVICE_ROLE_KEY, SUPABASE_URL } from "./helpers/env.ts";
import { FakeFetch } from "./helpers/fake_fetch.ts";
import { FakeStore } from "./helpers/fake_store.ts";
import { FUNCTION_URL, mcpCall, parseMessage } from "./helpers/mcp.ts";

const INIT = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "app-test", version: "1.0.0" },
};

function rig(
  env: Record<string, string | undefined> = {},
  tweak: Partial<Settings> = {},
): { app: FetchApp; store: FakeStore; deps: Deps } {
  const loaded = loadSettings(envGetter(env));
  if (!loaded.ok) throw new Error("test setup: settings");
  const store = new FakeStore({ clock: new Clock() });
  const deps: Deps = {
    settings: { ...loaded.settings, ...tweak },
    store,
    embeddings: { embed: () => Promise.resolve({ error: "unused" }) },
    vision: { configured: false, caption: () => Promise.resolve({ error: "unused" }) },
    now: store.clock.now,
    randomBytes: (n) => new Uint8Array(n).fill(7),
  };
  return { app: createApp({ ok: true, deps }), store, deps };
}

Deno.test("U293 the correct key in x-brain-key lets an MCP initialize succeed", async () => {
  const { app } = rig();
  const { message } = await mcpCall(app.fetch, "initialize", INIT, BRAIN_KEY);
  assertEquals((message?.result as { serverInfo?: { name?: string } })?.serverInfo?.name !== undefined, true);
  assertEquals(message?.error, undefined);
});

Deno.test("U294 the correct key as ?key= lets an MCP initialize succeed", async () => {
  const { app } = rig();
  const { message } = await mcpCall(app.fetch, "initialize", INIT, BRAIN_KEY, { via: "query" });
  assertEquals(message?.error, undefined);
  assert((message?.result as { serverInfo?: unknown })?.serverInfo !== undefined, "no serverInfo");
});

/** The core server's authorization error (W/server/index.ts): a JSON-RPC error, code -32001, echoing the request id. */
const UNAUTHORIZED = { code: -32001, message: "Unauthorized: missing or invalid authentication." };

Deno.test("U295 a wrong key gets an authorization error, and the store is never called", async () => {
  const { app, store } = rig();
  const { message } = await mcpCall(app.fetch, "tools/call", {
    name: "list_attachments",
    arguments: { thought_id: "00000001-0000-4000-9000-000000000000" },
  }, "not-the-brain-key", { id: 41 });
  assertEquals({ error: message?.error, id: message?.id, calls: store.callNames() }, {
    error: UNAUTHORIZED,
    id: 41,
    calls: [],
  });
});

/** BRAIN_KEY with one byte changed: same length, so only a byte-by-byte compare can tell it apart. */
function sameLengthWrongKeys(): Record<string, string> {
  const swap = (i: number) => BRAIN_KEY.slice(0, i) + (BRAIN_KEY[i] === "X" ? "Y" : "X") + BRAIN_KEY.slice(i + 1);
  return {
    first: swap(0),
    middle: swap(Math.floor(BRAIN_KEY.length / 2)),
    last: swap(BRAIN_KEY.length - 1),
  };
}

for (const [id, via] of [["U386", "header"], ["U387", "query"]] as const) {
  Deno.test(`${id} a same-length key differing only in the first, a middle or the last byte (${via}) gets an authorization error, and the store is never called`, async () => {
    const keys = sameLengthWrongKeys();
    for (const key of Object.values(keys)) assertEquals(key.length, BRAIN_KEY.length);
    const seen: Record<string, unknown> = {};
    for (const [where, key] of Object.entries(keys)) {
      const { app, store } = rig();
      const { message } = await mcpCall(app.fetch, "tools/call", {
        name: "list_attachments",
        arguments: { thought_id: "00000001-0000-4000-9000-000000000000" },
      }, key, { id: 42, ...(via === "query" ? { via: "query" as const } : {}) });
      seen[where] = { error: message?.error, id: message?.id, calls: store.callNames() };
    }
    const want = { error: UNAUTHORIZED, id: 42, calls: [] };
    assertEquals(seen, { first: want, middle: want, last: want });
  });
}

Deno.test("U296 a missing key gets an authorization error", async () => {
  const { app, store } = rig();
  const { message } = await mcpCall(app.fetch, "tools/list", {}, undefined, { id: "k" });
  assertEquals({ error: message?.error, id: message?.id, result: message?.result, calls: store.callNames() }, {
    error: UNAUTHORIZED,
    id: "k",
    result: undefined,
    calls: [],
  });
});

Deno.test("U297 with an empty configured key, every MCP request is refused", async () => {
  const { app, store } = rig({}, { mcpAccessKey: "" });
  const replies = [
    await mcpCall(app.fetch, "initialize", INIT, undefined),
    await mcpCall(app.fetch, "initialize", INIT, ""),
    await mcpCall(app.fetch, "initialize", INIT, "", { via: "query" }),
    await mcpCall(app.fetch, "tools/list", {}, BRAIN_KEY),
  ];
  assertEquals({ codes: replies.map((r) => (r.message?.error as { code?: number })?.code), calls: store.callNames() }, {
    codes: [-32001, -32001, -32001, -32001],
    calls: [],
  });
});

/** The core server's CORS headers (W/server/index.ts), for the MCP route. */
const CORE_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, x-brain-key, accept, mcp-session-id, mcp-protocol-version, last-event-id",
  "access-control-allow-methods": "GET, POST, OPTIONS, DELETE",
};

const corsOf = (r: Response) => Object.fromEntries(Object.keys(CORE_CORS).map((k) => [k, r.headers.get(k)]));

Deno.test("U298 an OPTIONS preflight gets the CORS headers the core server sends, with no key", async () => {
  const { app, store } = rig();
  const preflight = await app.fetch(new Request(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { origin: "https://claude.ai", "access-control-request-method": "POST" },
  }));
  assertEquals(
    { status: preflight.status, body: await preflight.text(), preflight: corsOf(preflight), calls: store.callNames() },
    { status: 200, body: "ok", preflight: CORE_CORS, calls: [] },
  );
});

Deno.test("U374 an MCP reply and a refused MCP request carry the CORS headers the core server sends", async () => {
  const { app } = rig();
  const { response } = await mcpCall(app.fetch, "tools/list", {}, BRAIN_KEY);
  const refused = await mcpCall(app.fetch, "tools/list", {}, "wrong");
  assertEquals({ reply: corsOf(response), refused: corsOf(refused.response) }, { reply: CORE_CORS, refused: CORE_CORS });
});

Deno.test("U299 an MCP request with no event-stream Accept header is handled, as the core server patches it", async () => {
  const { app } = rig();
  const response = await app.fetch(new Request(FUNCTION_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-brain-key": BRAIN_KEY },
    body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "initialize", params: INIT }),
  }));
  const message = await parseMessage(response);
  assertEquals({ status: response.status, error: message?.error, id: message?.id }, { status: 200, error: undefined, id: 9 });
  assert((message?.result as { serverInfo?: unknown })?.serverInfo !== undefined, "no serverInfo");
});

/** createApp over settings that are not ok (T005 Q3). */
function brokenApp(env: Record<string, string | undefined>): FetchApp {
  const loaded = loadSettings(envGetter(env));
  if (loaded.ok) throw new Error("test setup: settings should not be ok");
  return createApp({ ok: false, problems: loaded.problems });
}

const PAGES_INVALID = "setting MAX_PDF_PAGES is invalid: must be a positive whole number";

Deno.test("U347 createApp with settings not ok answers an MCP tools/call with the named settings error and nothing else", async () => {
  const app = brokenApp({ MAX_PDF_PAGES: "abc" });
  const { message } = await mcpCall(app.fetch, "tools/call", {
    name: "find_thought",
    arguments: { query: "furnace filters" },
  }, BRAIN_KEY, { id: 5 });
  assertEquals(
    { message: (message?.error as { message?: string })?.message, id: message?.id, result: message?.result },
    { message: PAGES_INVALID, id: 5, result: undefined },
  );
});

Deno.test("U348 the settings error names the setting and what it must be, never the value given", async () => {
  const app = brokenApp({ MAX_PDF_PAGES: "abc", MAX_IMAGE_MB: "-3.5" });
  const { response } = await mcpCall(app.fetch, "tools/call", { name: "find_thought", arguments: { query: "x" } }, BRAIN_KEY);
  const text = await response.text();
  assertStringIncludes(text, PAGES_INVALID);
  assertStringIncludes(text, "setting MAX_IMAGE_MB is invalid: must be a positive number");
  assertEquals([text.includes("abc"), text.includes("-3.5")], [false, false]);
});

// ---------------------------------------------------------------- productionDeps (T032)

/** Run `fn` with the process environment set to `env` exactly (for the names given), then restore it. */
async function withEnv<T>(env: Record<string, string | undefined>, fn: () => T | Promise<T>): Promise<T> {
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, Deno.env.get(k)]));
  const apply = (e: Record<string, string | undefined>) => {
    for (const [k, v] of Object.entries(e)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v);
  };
  apply(env);
  try {
    return await fn();
  } finally {
    apply(saved);
  }
}

Deno.test("U300 productionDeps with settings that are not ok returns ok false, naming the settings and no values, without throwing", async () => {
  const input = await withEnv({ ...baseEnv(), MAX_PDF_PAGES: "abc", MCP_ACCESS_KEY: undefined }, () => productionDeps());
  assertEquals(input, {
    ok: false,
    problems: [
      { setting: "MCP_ACCESS_KEY", reason: "must be set" },
      { setting: "MAX_PDF_PAGES", reason: "must be a positive whole number" },
    ],
  });
});

Deno.test("U301 productionDeps' store sends its requests to SUPABASE_URL with the service-role key", async () => {
  const net = new FakeFetch().on("POST", `${SUPABASE_URL}/rest/v1/rpc/attachment_embedding_dimension`, { body: 1536 });
  const realFetch = globalThis.fetch;
  globalThis.fetch = net.fetch;
  try {
    const input = await withEnv(baseEnv(), () => productionDeps());
    assert(input.ok, "productionDeps should be ok over the baseline environment");
    assertEquals(await input.deps.store.embeddingDimension(), { data: 1536 });
  } finally {
    globalThis.fetch = realFetch;
  }
  assertEquals(net.unmatched, []);
  assertEquals(
    net.requests.map((r) => ({ url: r.url, apikey: r.headers["apikey"], auth: r.headers["authorization"] })),
    [{
      url: `${SUPABASE_URL}/rest/v1/rpc/attachment_embedding_dimension`,
      apikey: SERVICE_ROLE_KEY,
      auth: `Bearer ${SERVICE_ROLE_KEY}`,
    }],
  );
});

// With MCP_ACCESS_KEY set, a missing or wrong key is unauthorized: U295 and U296.
Deno.test("U351 with MCP_ACCESS_KEY unset, productionDeps is not ok and every call, even with no key, gets the named settings error", async () => {
  const unset = await withEnv({ ...baseEnv(), MCP_ACCESS_KEY: undefined }, () => productionDeps());
  const errorOf = async (input: ReturnType<typeof productionDeps>, key?: string) =>
    (await mcpCall(createApp(input).fetch, "tools/list", {}, key)).message?.error as { code: number; message: string };
  const missingKeyMessage = "setting MCP_ACCESS_KEY is invalid: must be set";
  assertEquals(
    {
      unsetOk: unset.ok,
      unset: [(await errorOf(unset))?.message, (await errorOf(unset, "wrong"))?.message, (await errorOf(unset, BRAIN_KEY))?.message],
    },
    {
      unsetOk: false,
      unset: [missingKeyMessage, missingKeyMessage, missingKeyMessage],
    },
  );
});

// ---------------------------------------------------------------- the page and its routes (T045)

Deno.test("U305 GET /upload returns 200 with text/html, with no brain key", async () => {
  const { app, store } = rig();
  const response = await app.fetch(new Request(`${FUNCTION_URL}/upload`));
  await response.body?.cancel();
  assertEquals(
    { status: response.status, type: response.headers.get("content-type")?.split(";")[0], calls: store.callNames() },
    { status: 200, type: "text/html", calls: [] },
  );
});

Deno.test("U306 the GET /upload body is upload-page.html byte for byte, its API-address line still blank, with or without /functions/v1", async () => {
  const { app } = rig();
  const file = await Deno.readFile(new URL("../upload-page.html", import.meta.url));
  const bodies: Uint8Array[] = [];
  for (const path of ["/thought-attachments/upload", "/functions/v1/thought-attachments/upload"]) {
    bodies.push(new Uint8Array(await (await app.fetch(new Request(`http://localhost${path}`))).arrayBuffer()));
  }
  const text = new TextDecoder().decode(bodies[0]);
  assertEquals({ same: bodies.map((b) => b.length === file.length && b.every((x, i) => x === file[i])), blank: text.includes('var API_ADDRESS = "";') }, {
    same: [true, true],
    blank: true,
  });
});

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.test("U307 /page/start through createApp with no brain key is not refused by the key check", async () => {
  const { app, store } = rig();
  const parent = await store.seedThought({ content: "The garage shelf" });
  const row = await store.seedAttachment({
    parent_thought_id: parent.id,
    page_token_hash: await sha256Hex("page-token-u307"),
    expected_kind: "photo",
  });
  const response = await app.fetch(new Request(`${FUNCTION_URL}/page/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "page-token-u307", name: "shelf.jpg", type: "image/jpeg", size: 4096 }),
  }));
  const json = await response.json();
  assertEquals(
    { status: response.status, method: json.upload?.method, declared: store.attachment(row.id)?.file_name },
    { status: 200, method: "PUT", declared: "shelf.jpg" },
  );
});

Deno.test("U349 createApp with settings not ok answers /page/info, /page/start and /page/finish with the named error, no brain key needed", async () => {
  const app = brokenApp({ MAX_PDF_PAGES: "abc" });
  const answers = [];
  for (const route of ["info", "start", "finish"]) {
    const response = await app.fetch(new Request(`${FUNCTION_URL}/page/${route}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "any", name: "shelf.jpg", type: "image/jpeg", size: 4096 }),
    }));
    answers.push({ status: response.status, message: (await response.json()).message });
  }
  // A 400 with { code, message } is what the page shows as "Refused: <message>" (upload-page.html).
  assertEquals(answers, [1, 2, 3].map(() => ({ status: 400, message: PAGES_INVALID })));
});

Deno.test("U401 GET /upload serves exactly the src/upload_page.ts HTML as text/html", async () => {
  const { app } = rig();
  const response = await app.fetch(new Request(`${FUNCTION_URL}/upload`));
  assertEquals(
    { status: response.status, type: response.headers.get("content-type")?.split(";")[0].trim(), body: await response.text() },
    { status: 200, type: "text/html", body: UPLOAD_PAGE_HTML },
  );
});
