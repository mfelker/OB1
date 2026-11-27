/** The seven MCP tools (contracts/mcp-tools.md). Finishing is reached only through the injected `services.finish`. */
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import type { Deps, Services } from "./types.ts";

type Hints = { readOnlyHint: boolean; destructiveHint?: boolean; openWorldHint?: boolean };

const READ_ONLY: Hints = { readOnlyHint: true };

const TOOLS: [string, Hints][] = [
  ["find_thought", READ_ONLY],
  ["attach_file", { readOnlyHint: false, destructiveHint: false, openWorldHint: true }],
  ["finish_attachment", { readOnlyHint: false, destructiveHint: true, openWorldHint: true }],
  ["get_attachment", READ_ONLY],
  ["list_attachments", READ_ONLY],
  ["remove_attachment", { readOnlyHint: false, destructiveHint: true, openWorldHint: false }],
  ["find_orphan_attachments", READ_ONLY],
];

export function buildServer(_deps: Deps, _services: Services): McpServer {
  const server = new McpServer({ name: "thought-attachments", version: "0.1.0" });
  for (const [name, annotations] of TOOLS) {
    server.registerTool(name, { description: name, annotations }, () => ({ content: [{ type: "text" as const, text: "" }] }));
  }
  return server;
}
