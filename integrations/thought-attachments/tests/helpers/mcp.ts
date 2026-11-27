/** Helpers for driving the MCP layer in tests, with no network. */
import { Client } from "npm:@modelcontextprotocol/sdk@1.24.3/client/index.js";
import { InMemoryTransport } from "npm:@modelcontextprotocol/sdk@1.24.3/inMemory.js";
import type { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";

/** The function's address as a request reaches it (the gateway strips `/functions/v1`). */
export const FUNCTION_URL = "http://localhost/thought-attachments";

export interface McpCallOptions {
  /** Where to present the key (default: the x-brain-key header). */
  via?: "header" | "query";
  /** Request URL (default FUNCTION_URL). */
  url?: string;
  /** JSON-RPC id (default 1). */
  id?: string | number | null;
}

export interface McpCallResult {
  status: number;
  response: Response;
  /** The JSON-RPC message (parsed from JSON or from the last SSE `data:` line). */
  message: Record<string, unknown> | null;
}

/** POST one JSON-RPC request to a Fetch-API handler (`app.fetch`) and parse the reply. `key` omitted means no key. */
export async function mcpCall(
  fetchFn: (req: Request) => Response | Promise<Response>,
  method: string,
  params: Record<string, unknown> = {},
  key?: string,
  opts: McpCallOptions = {},
): Promise<McpCallResult> {
  const url = new URL(opts.url ?? FUNCTION_URL);
  const headers = new Headers({
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  });
  if (key !== undefined) {
    if (opts.via === "query") url.searchParams.set("key", key);
    else headers.set("x-brain-key", key);
  }
  const body = JSON.stringify({ jsonrpc: "2.0", id: opts.id === undefined ? 1 : opts.id, method, params });
  const response = await fetchFn(new Request(url, { method: "POST", headers, body }));
  return { status: response.status, response, message: await parseMessage(response.clone()) };
}

/** Parse a JSON or SSE (`data:` lines) response body into the last JSON-RPC message. */
export async function parseMessage(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) {
    const data = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    return data.length ? JSON.parse(data[data.length - 1]) : null;
  }
  return JSON.parse(text);
}

/** Connect an SDK Client to a server over an in-memory transport pair. */
export async function inMemoryClient(server: McpServer): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}
