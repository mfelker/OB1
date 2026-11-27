/** The seven MCP tools (contracts/mcp-tools.md). Finishing is reached only through the injected `services.finish`. */
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import { z } from "npm:zod@4.1.13";
import type { Deps, Services } from "./types.ts";

type Hints = { readOnlyHint: boolean; destructiveHint?: boolean; openWorldHint?: boolean };

const READ_ONLY: Hints = { readOnlyHint: true };

const MAX_MATCHES = 20;

const NOT_YET = () => ({ content: [{ type: "text" as const, text: "" }] });

/** A tool result: the text for the AI, plus the structured fields. */
function reply(text: string, data: Record<string, unknown> = {}, isError = false) {
  return { content: [{ type: "text" as const, text }], structuredContent: data, ...(isError ? { isError: true } : {}) };
}

const fail = (message: string) => reply(message, { error: message }, true);

export function buildServer(deps: Deps, _services: Services): McpServer {
  const server = new McpServer({ name: "thought-attachments", version: "0.1.0" });

  server.registerTool("find_thought", {
    description: "Find a thought by meaning or by exact text, to attach a file to it.",
    inputSchema: {
      query: z.string(),
      mode: z.enum(["meaning", "exact"]).default("meaning"),
      limit: z.number().int().positive().default(5),
    },
    annotations: READ_ONLY,
  }, async ({ query, mode, limit: asked }) => {
    const limit = Math.min(asked, MAX_MATCHES);
    let found;
    if (mode === "exact") {
      found = await deps.store.findThoughtsExact(query, limit);
    } else {
      const embedded = await deps.embeddings.embed([query]);
      if ("error" in embedded) return fail(embedded.error);
      found = await deps.store.matchThoughts(embedded.data[0], limit);
    }
    if ("error" in found) return fail(found.error);
    return reply(JSON.stringify(found.data), { matches: found.data });
  });

  server.registerTool("attach_file", {
    description: "Start attaching a file to a thought, or to a new note.",
    inputSchema: {
      thought_id: z.string().optional(),
      note: z.string().optional(),
      file_name: z.string().optional(),
      declared_type: z.string().optional(),
      declared_size: z.number().int().optional(),
      expected_kind: z.enum(["photo", "pdf"]).optional(),
      sensitivity_tier: z.enum(["standard", "personal", "restricted"]).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, NOT_YET);

  server.registerTool("finish_attachment", {
    description: "Finish an uploaded attachment: check it, extract its text or caption and make it searchable.",
    inputSchema: { attachment_id: z.string(), rebuild: z.boolean().optional() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  }, NOT_YET);

  server.registerTool("get_attachment", {
    description: "Show an attachment's details and a short-lived download link.",
    inputSchema: { attachment_id: z.string() },
    annotations: READ_ONLY,
  }, NOT_YET);

  server.registerTool("list_attachments", {
    description: "List the attachments of a thought, or the attachment behind a derived thought.",
    inputSchema: { thought_id: z.string().optional(), derived_thought_id: z.string().optional() },
    annotations: READ_ONLY,
  }, NOT_YET);

  server.registerTool("remove_attachment", {
    description: "Remove an attachment with its file and derived thoughts. Without confirm, only shows what would go.",
    inputSchema: { attachment_id: z.string(), confirm: z.boolean().default(false) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, NOT_YET);

  server.registerTool("find_orphan_attachments", {
    description: "List attachments whose parent is gone, uploads that expired, and refused files.",
    annotations: READ_ONLY,
  }, NOT_YET);

  return server;
}
