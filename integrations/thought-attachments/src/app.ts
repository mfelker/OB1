/** The composed function (tasks T031, T032, T045): the MCP route behind the brain key, and the page routes. */
import { Hono } from "npm:hono@4.9.2";
import { StreamableHTTPTransport } from "npm:@hono/mcp@0.1.1";
import { createEmbeddingClient } from "./embeddings.ts";
import { createFinisher } from "./finish.ts";
import { loadSettings } from "./settings.ts";
import { createSupabaseStore } from "./store.ts";
import { pageRoutes } from "./page_routes.ts";
import { buildServer } from "./tools.ts";
import { createVisionClient } from "./vision.ts";
import type { AppInput, FetchApp } from "./types.ts";

// The core server's CORS headers (W/server/index.ts), so a client that reaches the core connector reaches this one.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-brain-key, accept, mcp-session-id, mcp-protocol-version, last-event-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

// The core server's authorization error (W/server/index.ts): a JSON-RPC envelope at HTTP 200, so strict
// MCP hosts keep the connection instead of treating it as a transport fault.
const JSON_RPC_UNAUTHORIZED_CODE = -32001;
const UNAUTHORIZED_MESSAGE = "Unauthorized: missing or invalid authentication.";

/** Compares two strings in time that depends only on their lengths, never on where they first differ. */
function sameKey(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i];
  return diff === 0;
}

/** The JSON-RPC id of a request body, or null when there is none. */
async function jsonRpcId(request: Request): Promise<string | number | null> {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "DELETE") return null;
  try {
    const parsed = JSON.parse(await request.text());
    const id = parsed?.id;
    return typeof id === "string" || typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}

async function unauthorized(request: Request): Promise<Response> {
  const body = {
    jsonrpc: "2.0",
    error: { code: JSON_RPC_UNAUTHORIZED_CODE, message: UNAUTHORIZED_MESSAGE },
    id: await jsonRpcId(request),
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/** The named settings error (T005 Q3): which setting and what it must be, never its value (FR-009). */
function settingsError(problems: { setting: string; reason: string }[]): string {
  return problems.map((p) => `setting ${p.setting} is invalid: ${p.reason}`).join("; ");
}

/** With settings that are not ok, every request gets the named error and nothing else happens. */
function settingsErrorApp(problems: { setting: string; reason: string }[]): FetchApp {
  const message = settingsError(problems);
  return {
    fetch: async (request) => {
      const body = { jsonrpc: "2.0", error: { code: -32000, message }, id: await jsonRpcId(request) };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    },
  };
}

/** The function's own path: `/functions/v1` (Cloud and the self-hosted gateway) and its name are optional prefixes. */
function withLocalPath(request: Request): Request {
  const url = new URL(request.url);
  const local = url.pathname.replace(/^\/functions\/v1(?=\/|$)/, "").replace(/^\/thought-attachments(?=\/|$)/, "");
  if (local === url.pathname) return request;
  url.pathname = local || "/";
  return new Request(url, request);
}

/** The phone page, served unchanged (R5, T005 Q6). */
const UPLOAD_PAGE = new URL("../upload-page.html", import.meta.url);

/** Answers every MCP call and page route with the named settings error when `input.ok` is false (T005 Q3). */
export function createApp(input: AppInput): FetchApp {
  if (!input.ok) return settingsErrorApp(input.problems);
  const deps = input.deps;
  const services = createFinisher(deps);
  const app = new Hono();

  app.get("/upload", async (c) => c.body(await Deno.readFile(UPLOAD_PAGE), 200, { "Content-Type": "text/html; charset=utf-8" }));

  // The page routes take only the page token and answer CORS for the page's origin, so they sit before the key check.
  app.route("/", pageRoutes(deps, services));

  app.options("*", (c) => c.text("ok", 200, corsHeaders));

  app.all("*", async (c) => {
    const given = c.req.header("x-brain-key") || new URL(c.req.url).searchParams.get("key");
    if (!given || !sameKey(given, deps.settings.mcpAccessKey)) return await unauthorized(c.req.raw);
    // As the core server does: Claude Desktop connectors don't send the Accept header that
    // StreamableHTTPTransport requires, so a request without it gets a patched one.
    if (!c.req.header("accept")?.includes("text/event-stream")) {
      const headers = new Headers(c.req.raw.headers);
      headers.set("Accept", "application/json, text/event-stream");
      const patched = new Request(c.req.raw.url, {
        method: c.req.raw.method,
        headers,
        body: c.req.raw.body,
        // @ts-ignore -- duplex is required for a streaming body in Deno
        duplex: "half",
      });
      Object.defineProperty(c.req, "raw", { value: patched, writable: true });
    }

    const server = buildServer(deps, services);
    const transport = new StreamableHTTPTransport();
    await server.connect(transport);
    const response = await transport.handleRequest(c);
    if (!response) return c.json({ error: "No response from MCP transport" }, 500, corsHeaders);
    response.headers.delete("mcp-session-id");
    for (const [k, v] of Object.entries(corsHeaders)) response.headers.set(k, v);
    return response;
  });

  return { fetch: async (request) => await app.fetch(withLocalPath(request)) };
}

/** The real dependencies from the environment; settings that are not ok give `{ ok: false, problems }` (T005 Q3). */
export function productionDeps(): AppInput {
  const loaded = loadSettings((name) => Deno.env.get(name));
  if (!loaded.ok) return { ok: false, problems: loaded.problems };
  const settings = loaded.settings;
  // Late-bound, so the global fetch in force at call time is the one used.
  const fetch: typeof globalThis.fetch = (input, init) => globalThis.fetch(input, init);
  return {
    ok: true,
    deps: {
      settings,
      store: createSupabaseStore(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        settings,
        fetch,
      ),
      embeddings: createEmbeddingClient(settings, fetch),
      vision: createVisionClient(settings, fetch),
      now: () => new Date(),
      randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
    },
  };
}
