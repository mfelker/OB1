/** The seven MCP tools (contracts/mcp-tools.md). Finishing is reached only through the injected `services.finish`. */
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js";
import { z } from "npm:zod@4.1.13";
import { baseName, checkDeclared } from "./intake.ts";
import { noteMetadata } from "./derived.ts";
import { curlLine, pageLink, publicUrl } from "./links.ts";
import type { AcceptedType, AttachmentRow, BusyOp, ExpectedKind, SensitivityTier, Deps, Services, Settings, UploadInstructions } from "./types.ts";

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

/** Every cap, for a phone upload whose type is not known yet (as `/page/info` shows them). */
function allLimits(settings: Settings) {
  return {
    image_bytes: Math.floor(settings.maxImageMb * 1024 * 1024),
    pdf_bytes: Math.floor(settings.maxPdfMb * 1024 * 1024),
    pdf_pages: settings.maxPdfPages,
  };
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
  expected_kind?: ExpectedKind;
  sensitivity_tier?: SensitivityTier;
}

/** `attach_file`: validates, finds or makes the parent, then records the pending attachment and its links. */
async function attachFile(deps: Deps, args: AttachArgs) {
  const { thought_id, note, file_name, declared_type, declared_size, expected_kind, sensitivity_tier } = args;
  if ((thought_id === undefined) === (note === undefined)) return fail(ONE_PARENT);
  const given = [file_name, declared_type, declared_size].filter((v) => v !== undefined).length;
  if (given > 0 && given < 3) return fail(PARTIAL_DETAILS);
  // A command upload gives all three details; a phone upload gives none (the page declares the file).
  const file = given === 3
    ? { name: baseName(file_name as string), type: declared_type as AcceptedType, size: declared_size as number }
    : null;
  if (file) {
    const refusal = checkDeclared(file, deps.settings);
    if (refusal) return fail(refusal.message, refusal.code);
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
  if (file) {
    const pending = await deps.store.findPending(parentId, file.name, file.type, file.size, deps.now());
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
  let upload: UploadInstructions | undefined;
  let storagePath: string | null = null;
  if (file) {
    storagePath = `attachments/${id}/${file.name}`;
    const signed = await deps.store.signUpload(storagePath);
    if ("error" in signed) return fail(signed.error);
    upload = {
      url: publicUrl(deps.settings, signed.data.url),
      method: "PUT",
      headers: { "content-type": file.type, "x-upsert": "false" },
    };
  }
  const created = await deps.store.createAttachment({
    id,
    parent_thought_id: parentId,
    parent_created_here: parentCreated,
    file_name: file?.name ?? null,
    declared_type: file?.type ?? null,
    declared_size: file?.size ?? null,
    expected_kind,
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
    ...(upload && file ? { upload, curl: curlLine(upload, file.name) } : {}),
    page_link: pageLink(deps.settings, pageToken),
    limits: file ? limitsFor(deps.settings, file.type) : allLimits(deps.settings),
  };
  return reply(
    [
      `Attachment ${row.id} (short id ${data.short_id}) started on thought ${row.parent_thought_id}${
        note !== undefined && !parentCreated ? ", attached to your existing thought" : ""
      }.`,
      `Upload before ${row.upload_deadline}.`,
      ...(data.curl ? ["With a command:", data.curl] : []),
      `On a phone: ${data.page_link}`,
    ].join("\n"),
    data,
  );
}

const DID_NOT_FINISH = "the run did not finish";

/**
 * How a row reads once a claim has expired unreleased (data-model.md states, FR-026). The store returns rows as stored;
 * this is the reading layer. A cut-off finish reads as `failed`; a cut-off rebuild keeps its old derived set.
 */
function asReported(row: AttachmentRow, now: Date): AttachmentRow {
  const expired = row.busy_op !== null && row.busy_until !== null && new Date(row.busy_until).getTime() <= now.getTime();
  if (!expired) return row;
  if (row.busy_op === "finish") return { ...row, state: "failed", state_reason: DID_NOT_FINISH };
  if (row.busy_op === "rebuild") return { ...row, last_rebuild_error: DID_NOT_FINISH };
  return row;
}

/** One attachment as `list_attachments` shows it. */
function summary(row: AttachmentRow) {
  return {
    attachment_id: row.id,
    short_id: shortId(row.id),
    file_name: row.file_name,
    type: row.actual_type ?? row.declared_type,
    size: row.actual_size ?? row.declared_size,
    state: row.state,
    derived_count: row.derived_count,
  };
}

/** An attachment by full or short id, or the "not found" / "ambiguous" failure to return. */
async function resolveAttachment(
  deps: Deps,
  id: string,
): Promise<{ row: AttachmentRow } | { failure: ReturnType<typeof fail> }> {
  const found = await deps.store.getAttachment(id);
  if ("error" in found) return { failure: fail(found.error) };
  if (found.data === "not_found") return { failure: fail(`Attachment not found: ${id}.`) };
  if (found.data === "ambiguous") return { failure: fail(`Attachment id ${id} is ambiguous: it matches more than one attachment; use the full id.`) };
  return { row: found.data };
}

/** A tool result: the text for the AI, plus the structured fields. */
function reply(text: string, data: Record<string, unknown> = {}, isError = false) {
  return { content: [{ type: "text" as const, text }], structuredContent: data, ...(isError ? { isError: true } : {}) };
}

const fail = (message: string, code?: string) => reply(message, { error: message, ...(code ? { code } : {}) }, true);

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
  }, async ({ attachment_id }) => {
    const found = await resolveAttachment(deps, attachment_id);
    if ("failure" in found) return found.failure;
    const row = asReported(found.row, deps.now());
    const data = {
      attachment_id: row.id,
      short_id: shortId(row.id),
      file_name: row.file_name,
      type: row.actual_type ?? row.declared_type,
      size: row.actual_size ?? row.declared_size,
      page_count: row.page_count,
      state: row.state,
      reason: row.state_reason,
      derived_count: row.derived_count,
      caption_model: row.caption_model,
      last_rebuild_error: row.last_rebuild_error,
      parent_thought_id: row.parent_thought_id,
    };
    const lines = [
      `${data.file_name} (${data.type}, ${data.size} bytes) - attachment ${row.id}, thought ${data.parent_thought_id}`,
      `State: ${data.state}${data.reason ? ` (${data.reason})` : ""}. Derived thoughts: ${data.derived_count}.`,
    ];
    if (data.page_count !== null) lines.push(`Pages: ${data.page_count}.`);
    if (data.caption_model) lines.push(`Caption model: ${data.caption_model}.`);
    if (data.last_rebuild_error) lines.push(`Last rebuild error: ${data.last_rebuild_error}.`);
    const seconds = deps.settings.downloadLinkSeconds;
    const stored = row.storage_path && row.state !== "pending_upload" && row.state !== "refused";
    const signed = stored ? await deps.store.signDownload(row.storage_path as string, seconds) : null;
    if (signed && "data" in signed) {
      const download_link = publicUrl(deps.settings, signed.data);
      lines.push(`Download link (valid for ${seconds} seconds): ${download_link}`);
      return reply(lines.join("\n"), { ...data, download_link, download_link_seconds: seconds });
    }
    return reply(lines.join("\n"), data);
  });

  server.registerTool("list_attachments", {
    description: "List the attachments of a thought, or the attachment behind a derived thought.",
    inputSchema: { thought_id: z.string().optional(), derived_thought_id: z.string().optional() },
    annotations: READ_ONLY,
  }, async ({ thought_id, derived_thought_id }) => {
    if ((thought_id === undefined) === (derived_thought_id === undefined)) {
      return fail("Give exactly one of thought_id or derived_thought_id.");
    }
    let rows: AttachmentRow[];
    if (derived_thought_id !== undefined) {
      const owner = await deps.store.attachmentForDerived(derived_thought_id);
      if ("error" in owner) return fail(owner.error);
      rows = owner.data ? [owner.data] : [];
    } else {
      const listed = await deps.store.listByParent(thought_id as string);
      if ("error" in listed) return fail(listed.error);
      rows = listed.data;
    }
    const attachments = rows.map((row) => summary(asReported(row, deps.now())));
    if (attachments.length === 0) return reply("not found: no attachment belongs to that thought", { attachments });
    const lines = attachments.map((a) =>
      `${a.attachment_id} (${a.short_id})  ${a.file_name}  ${a.type}  ${a.size} bytes  ${a.state}  ${a.derived_count} derived thoughts`
    );
    return reply(lines.join("\n"), { attachments });
  });

  server.registerTool("remove_attachment", {
    description: "Remove an attachment with its file and derived thoughts. Without confirm, only shows what would go.",
    inputSchema: { attachment_id: z.string(), confirm: z.boolean().default(false) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, async ({ attachment_id, confirm }) => {
    const found = await resolveAttachment(deps, attachment_id);
    if ("failure" in found) return found.failure;
    const row = found.row;
    if (!confirm) {
      const preview = await deps.store.removalPreview(row.id);
      if ("error" in preview) return fail(preview.error);
      const data = { confirm, file: row.file_name, derived_thoughts: preview.data.derived, parent_note: preview.data.noteWouldGo };
      const lines = [
        `Would remove the file ${row.file_name}, ${data.derived_thoughts} derived thoughts` + (data.parent_note ? " and the parent note" : "") + ".",
        "Nothing was deleted. Call again with confirm true to remove it.",
      ];
      return reply(lines.join("\n"), data);
    }
    const claimed = await deps.store.claim(row.id, "remove", deps.settings.busySeconds);
    if ("error" in claimed) return fail(claimed.error);
    if ("busy" in claimed.data) return busyReply(claimed.data.busy);
    const token = claimed.data.token;
    try {
      if (row.storage_path) {
        const deleted = await deps.store.deleteObject(row.storage_path);
        if ("error" in deleted) return fail(deleted.error);
      }
      const removed = await deps.store.removeAttachment(row.id, token);
      if ("error" in removed) return fail(removed.error);
      const data = {
        confirm,
        removed: true,
        file: row.file_name,
        derived_thoughts: removed.data.derived,
        parent_note: removed.data.noteRemoved,
      };
      return reply(
        `Removed the file ${row.file_name} and ${data.derived_thoughts} derived thoughts` + (data.parent_note ? " and the parent note" : "") + ".",
        data,
      );
    } finally {
      await deps.store.release(row.id, token);
    }
  });

  server.registerTool("find_orphan_attachments", {
    description: "List attachments whose parent is gone, uploads that expired, and refused files.",
    annotations: READ_ONLY,
  }, async () => {
    const found = await deps.store.orphans(deps.now());
    if ("error" in found) return fail(found.error);
    const orphans = found.data.map(({ row, why }) => ({
      attachment_id: row.id,
      short_id: shortId(row.id),
      file_name: row.file_name,
      why,
      derived_count: row.derived_count,
    }));
    const lines = orphans.map((o) => `${o.attachment_id} (${o.short_id})  ${o.file_name}  ${o.why}  ${o.derived_count} derived thoughts`);
    return reply(lines.join("\n"), { orphans });
  });

  return server;
}
