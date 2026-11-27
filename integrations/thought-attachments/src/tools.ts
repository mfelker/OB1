/** The seven MCP tools (contracts/mcp-tools.md). Finishing is reached only through the injected `services.finish`. */
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import { z } from "npm:zod@4.1.13";
import { baseName, checkDeclared } from "./intake.ts";
import { noteMetadata } from "./derived.ts";
import { curlLine, pageLink, publicUrl } from "./links.ts";
import type { AcceptedType, AttachmentRow, BusyOp, SensitivityTier, Deps, Services, Settings, UploadInstructions } from "./types.ts";

type Hints = { readOnlyHint: boolean; destructiveHint?: boolean; openWorldHint?: boolean };

const READ_ONLY: Hints = { readOnlyHint: true };

const MAX_MATCHES = 20;
const FIRST_LINE_CHARS = 120;

const ONE_PARENT = "Give exactly one of thought_id or note.";

/** The first 8 hex characters of an attachment id (FR-025). */
const shortId = (id: string) => id.replace(/-/g, "").slice(0, 8).toLowerCase();

/** The size (and, for a PDF, page) cap for a type. */
function limitsFor(settings: Settings, type: string): { max_bytes: number; max_pages?: number } {
  if (type === "application/pdf") {
    return { max_bytes: Math.floor(settings.maxPdfMb * 1024 * 1024), max_pages: settings.maxPdfPages };
  }
  return { max_bytes: Math.floor(settings.maxImageMb * 1024 * 1024) };
}

const toHex = (bytes: Uint8Array) => [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");

async function sha256Hex(text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}

/** A random v4 uuid from the injected random source. */
function newId(deps: Deps): string {
  const b = deps.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = toHex(b);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const PARTIAL_DETAILS = "Only some of file_name, declared_type and declared_size were given: give all three, or none for a phone upload.";

const RUNNING: Record<BusyOp, string> = { finish: "finishing", rebuild: "rebuilding", remove: "removing" };

/** A refusal because another finish, rebuild or remove holds the claim (FR-026). */
function busyReply(op: BusyOp) {
  return reply(`busy (${RUNNING[op]}), try again shortly`, { busy: op }, true);
}

interface AttachArgs {
  thought_id?: string;
  note?: string;
  file_name?: string;
  declared_type?: string;
  declared_size?: number;
  sensitivity_tier?: SensitivityTier;
}

/** `attach_file`: validates, finds or makes the parent, then records the pending attachment and its links. */
async function attachFile(deps: Deps, args: AttachArgs) {
  const { thought_id, note, file_name, declared_type, declared_size, sensitivity_tier } = args;
  if ((thought_id === undefined) === (note === undefined)) return fail(ONE_PARENT);
  const given = [file_name, declared_type, declared_size].filter((v) => v !== undefined).length;
  if (given > 0 && given < 3) return fail(PARTIAL_DETAILS);
  if (file_name !== undefined && declared_type !== undefined && declared_size !== undefined) {
    const refusal = checkDeclared({ name: baseName(file_name), type: declared_type, size: declared_size }, deps.settings);
    if (refusal) return fail(refusal.message);
  }
  let parentId: string;
  let parentCreated = false;
  if (thought_id !== undefined) {
    const exists = await deps.store.thoughtExists(thought_id);
    if ("error" in exists) return fail(exists.error);
    if (!exists.data) return fail("There is no thought with that thought_id.");
    parentId = thought_id;
  } else {
    const embedded = await deps.embeddings.embed([note as string]);
    if ("error" in embedded) return fail(embedded.error);
    const saved = await deps.store.insertNote(note as string, embedded.data[0], noteMetadata(deps.now()));
    if ("error" in saved) return fail(saved.error);
    parentId = saved.data.id;
    parentCreated = saved.data.created;
  }
  if (file_name !== undefined && declared_type !== undefined && declared_size !== undefined) {
    const pending = await deps.store.findPending(
      parentId,
      baseName(file_name),
      declared_type as AcceptedType,
      declared_size,
      deps.now(),
    );
    if ("error" in pending) return fail(pending.error);
    if (pending.data) {
      const row = pending.data;
      return reply(
        `This file is already pending as attachment ${row.id} (short id ${shortId(row.id)}); upload deadline ${row.upload_deadline}.`,
        {
          attachment_id: row.id,
          short_id: shortId(row.id),
          parent_thought_id: row.parent_thought_id,
          upload_deadline: row.upload_deadline,
        },
      );
    }
  }
  const id = newId(deps);
  const pageToken = toHex(deps.randomBytes(32));
  const name = baseName(file_name ?? "");
  const storagePath = `attachments/${id}/${name}`;
  const signed = await deps.store.signUpload(storagePath);
  if ("error" in signed) return fail(signed.error);
  const upload: UploadInstructions = {
    url: publicUrl(deps.settings, signed.data.url),
    method: "PUT",
    headers: { "content-type": declared_type as string, "x-upsert": "false" },
  };
  const created = await deps.store.createAttachment({
    id,
    parent_thought_id: parentId,
    parent_created_here: parentCreated,
    file_name: name,
    declared_type: declared_type as AcceptedType,
    declared_size,
    sensitivity_tier,
    storage_path: storagePath,
    upload_deadline: new Date(deps.now().getTime() + deps.settings.uploadLinkMinutes * 60_000).toISOString(),
    page_token_hash: await sha256Hex(pageToken),
  });
  if ("error" in created) return fail(created.error);
  const row = created.data;
  const data = {
    attachment_id: row.id,
    short_id: shortId(row.id),
    parent_thought_id: row.parent_thought_id,
    parent_created_here: row.parent_created_here,
    upload_deadline: row.upload_deadline,
    upload,
    curl: curlLine(upload, name),
    page_link: pageLink(deps.settings, pageToken),
    limits: limitsFor(deps.settings, declared_type as string),
  };
  return reply(
    [
      `Attachment ${row.id} (short id ${data.short_id}) started on thought ${row.parent_thought_id}${
        note !== undefined && !parentCreated ? ", attached to your existing thought" : ""
      }.`,
      `Upload before ${row.upload_deadline}, with a command:`,
      data.curl,
      `or on a phone: ${data.page_link}`,
    ].join("\n"),
    data,
  );
}

/** An attachment by full or short id, or the "not found" / "ambiguous" failure to return. */
async function resolveAttachment(
  deps: Deps,
  id: string,
): Promise<{ row: AttachmentRow } | { failure: ReturnType<typeof fail> }> {
  const found = await deps.store.getAttachment(id);
  if ("error" in found) return { failure: fail(found.error) };
  if (found.data === "not_found") return { failure: fail(`Attachment not found: ${id}.`) };
  if (found.data === "ambiguous") return { failure: fail(`Ambiguous attachment id: ${id} matches more than one attachment; use the full id.`) };
  return { row: found.data };
}

const NOT_YET = () => ({ content: [{ type: "text" as const, text: "" }] });

/** A tool result: the text for the AI, plus the structured fields. */
function reply(text: string, data: Record<string, unknown> = {}, isError = false) {
  return { content: [{ type: "text" as const, text }], structuredContent: data, ...(isError ? { isError: true } : {}) };
}

const fail = (message: string) => reply(message, { error: message }, true);

export function buildServer(deps: Deps, services: Services): McpServer {
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
    const matches = found.data.map((m) => ({ ...m, first_line: m.first_line.split(/\r?\n/)[0].slice(0, FIRST_LINE_CHARS) }));
    if (matches.length === 0) return reply("no matching thought", { matches });
    const lines = matches.map((m) => `${m.id}  ${m.captured.slice(0, 10)}  ${m.first_line}`);
    return reply(lines.join("\n"), { matches });
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
  }, (args) => attachFile(deps, args));

  server.registerTool("finish_attachment", {
    description: "Finish an uploaded attachment: check it, extract its text or caption and make it searchable.",
    inputSchema: { attachment_id: z.string(), rebuild: z.boolean().optional() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  }, async ({ attachment_id, rebuild }) => {
    const found = await resolveAttachment(deps, attachment_id);
    if ("failure" in found) return found.failure;
    const outcome = await services.finish(found.row.id, { rebuild });
    if (outcome.busy) return busyReply(outcome.busy);
    const lines = [`State: ${outcome.state}.`, `Derived thoughts: ${outcome.derived_count}.`];
    if (outcome.reason) lines.push(`Reason: ${outcome.reason}`);
    if (outcome.page_count !== undefined) lines.push(`Pages: ${outcome.page_count}.`);
    if (outcome.caption) lines.push(`Caption: ${outcome.caption}`);
    return reply(lines.join("\n"), { ...outcome });
  });

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
