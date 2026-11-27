/** The composed app (T031, T045): key check, CORS and Accept as the core server, settings errors, routing. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createApp } from "../src/app.ts";
import { loadSettings } from "../src/settings.ts";
import type { Deps, FetchApp, Settings } from "../src/types.ts";
import { Clock } from "./helpers/clock.ts";
import { BRAIN_KEY, envGetter } from "./helpers/env.ts";
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
  const { response } = await mcpCall(app.fetch, "tools/list", {}, BRAIN_KEY);
  const refused = await mcpCall(app.fetch, "tools/list", {}, "wrong");
  assertEquals(
    {
      status: preflight.status,
      body: await preflight.text(),
      preflight: corsOf(preflight),
      reply: corsOf(response),
      refused: corsOf(refused.response),
      calls: store.callNames(),
    },
    { status: 200, body: "ok", preflight: CORE_CORS, reply: CORE_CORS, refused: CORE_CORS, calls: [] },
  );
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
