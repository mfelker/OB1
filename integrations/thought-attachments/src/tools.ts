/** The seven MCP tools (contracts/mcp-tools.md). Finishing is reached only through the injected `services.finish`. */
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import type { Deps, Services } from "./types.ts";

const TOOL_NAMES = [
  "find_thought",
  "attach_file",
  "finish_attachment",
  "get_attachment",
  "list_attachments",
  "remove_attachment",
  "find_orphan_attachments",
];

export function buildServer(_deps: Deps, _services: Services): McpServer {
  const server = new McpServer({ name: "thought-attachments", version: "0.1.0" });
  for (const name of TOOL_NAMES) {
    server.registerTool(name, { description: name }, () => ({ content: [{ type: "text" as const, text: "" }] }));
  }
  return server;
}
