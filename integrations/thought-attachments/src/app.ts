/** The composed function (tasks T031, T032, T045): the MCP route behind the brain key, and the page routes. */
import { Hono } from "npm:hono@4.9.2";
import { StreamableHTTPTransport } from "npm:@hono/mcp@0.1.1";
import { createFinisher } from "./finish.ts";
import { buildServer } from "./tools.ts";
import type { AppInput, FetchApp } from "./types.ts";

/** Answers every MCP call and page route with the named settings error when `input.ok` is false (T005 Q3). */
export function createApp(input: AppInput): FetchApp {
  if (!input.ok) throw new Error("not implemented");
  const deps = input.deps;
  const services = createFinisher(deps);
  const app = new Hono();

  app.all("*", async (c) => {
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
