/** The composed function (tasks T031, T032, T045): the MCP route behind the brain key, and the page routes. */
import { Hono } from "npm:hono@4.9.2";
import { StreamableHTTPTransport } from "npm:@hono/mcp@0.1.1";
import { createFinisher } from "./finish.ts";
import { buildServer } from "./tools.ts";
import type { AppInput, FetchApp } from "./types.ts";

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
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

/** Answers every MCP call and page route with the named settings error when `input.ok` is false (T005 Q3). */
export function createApp(input: AppInput): FetchApp {
  if (!input.ok) throw new Error("not implemented");
  const deps = input.deps;
  const services = createFinisher(deps);
  const app = new Hono();

  app.all("*", async (c) => {
    const given = c.req.header("x-brain-key") || new URL(c.req.url).searchParams.get("key");
    if (!given || !sameKey(given, deps.settings.mcpAccessKey)) return await unauthorized(c.req.raw);
    const server = buildServer(deps, services);
    const transport = new StreamableHTTPTransport();
    await server.connect(transport);
    const response = await transport.handleRequest(c);
    if (!response) return c.json({ error: "No response from MCP transport" }, 500);
    return response;
  });

  return { fetch: async (request) => await app.fetch(request) };
}

export function productionDeps(): AppInput {
  throw new Error("not implemented");
}
