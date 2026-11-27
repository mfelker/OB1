/** finish_attachment's engine (T025 and later): claim, verify, extract, embed, write (contracts/mcp-tools.md). */
import { checkActual, sniffType } from "./intake.ts";
import { captionRow, passageRow, sourceLine } from "./derived.ts";
import { toPassages } from "./passages.ts";
import { openPdf } from "./pdf.ts";
import type { AcceptedType, AttachmentRow, Deps, FinishOutcome, Services, StatePatch } from "./types.ts";

/** `sha256:<hex>` of the bytes, as `content_hash` stores it. */
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return "sha256:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createFinisher(deps: Deps): Services {
  const { store, settings } = deps;

  async function finish(id: string, opts: { rebuild?: boolean }): Promise<FinishOutcome> {
    const got = await store.getAttachment(id);
    if ("error" in got || typeof got.data === "string") throw new Error("attachment not found");
    const row = got.data;
    const rebuild = opts.rebuild === true && row.state === "processed";
    const claim = await store.claim(row.id, rebuild ? "rebuild" : "finish", settings.busySeconds);
    if ("error" in claim || !("token" in claim.data)) throw new Error("claim failed");
    const token = claim.data.token;
    try {
      return await run(row, token, rebuild);
    } finally {
      await store.release(row.id, token);
    }
  }

  /** The outcome a stored row reports (what a plain repeat finish returns). */
  function outcomeOf(row: AttachmentRow): FinishOutcome {
    const out: FinishOutcome = { state: row.state, derived_count: row.derived_count };
    if (row.state_reason) out.reason = row.state_reason;
    if (row.page_count !== null) out.page_count = row.page_count;
    if (row.last_rebuild_error) out.last_rebuild_error = row.last_rebuild_error;
    return out;
  }

  /** The file is deleted at once and the attachment ends `refused` (FR-004). */
  async function refuse(row: AttachmentRow, token: string, reason: string, actual: StatePatch): Promise<FinishOutcome> {
    await store.deleteObject(row.storage_path as string);
    const set = await store.setState(row.id, token, { ...actual, state: "refused", state_reason: reason });
    if ("error" in set) throw new Error(set.error);
    return { state: "refused", reason, derived_count: 0 };
  }

  async function run(row: AttachmentRow, token: string, rebuild: boolean): Promise<FinishOutcome> {
    if (row.state === "processed" && !rebuild) return outcomeOf(row);
    const path = row.storage_path as string;
    const info = await store.objectInfo(path);
    if ("error" in info || info.data === null) throw new Error("no object");
    const file = await store.download(path);
    if ("error" in file) throw new Error(file.error);
    const bytes = file.data;
    const hash = await sha256(bytes);
    const twin = await store.findByHash(row.parent_thought_id, hash);
    if ("error" in twin) throw new Error(twin.error);
    if (twin.data && twin.data.id !== row.id) {
      return await refuse(
        row,
        token,
        "already attached to this thought as " + twin.data.id.replace(/-/g, "").slice(0, 8),
        { actual_type: sniffType(bytes), actual_size: info.data.size },
      );
    }
    const actual: StatePatch = {
      actual_type: sniffType(bytes),
      actual_size: info.data.size,
      content_hash: hash,
    };
    const stored = { ...row, content_hash: hash };
    return actual.actual_type === "application/pdf"
      ? await pdfPath(stored, token, bytes, actual)
      : await photoPath(stored, token, bytes, actual, rebuild);
  }

  async function pdfPath(row: AttachmentRow, token: string, bytes: Uint8Array, actual: StatePatch): Promise<FinishOutcome> {
    const pdf = await openPdf(bytes);
    if ("error" in pdf) throw new Error(pdf.error);
    const pageTexts = await pdf.data.pageTexts();
    const shortId = row.id.slice(0, 8);
    const name = row.file_name as string;
    const passages = toPassages(
      pageTexts,
      (pages) => sourceLine(name, pages[0] === pages[1] ? "page " + pages[0] : "pages " + pages[0] + "–" + pages[1], shortId),
      settings,
    );
    const embedded = await deps.embeddings.embed(passages.map((p) => p.text));
    if ("error" in embedded) throw new Error(embedded.error);
    const now = deps.now();
    const rows = await Promise.all(passages.map((p, i) => passageRow(row, p, embedded.data[i], now)));
    const patch: StatePatch = {
      ...actual,
      state: "processed",
      page_count: pdf.data.pageCount,
      processed_at: now.toISOString(),
    };
    const written = await store.writeDerived(row.id, token, rows, patch);
    if ("error" in written) throw new Error(written.error);
    return { state: "processed", derived_count: rows.length, page_count: pdf.data.pageCount };
  }

  /** A failed rebuild keeps the old set and the `processed` state, and reports why (FR-027). */
  async function rebuildFailed(row: AttachmentRow, token: string, reason: string): Promise<FinishOutcome> {
    const set = await store.setState(row.id, token, { last_rebuild_error: reason });
    if ("error" in set) throw new Error(set.error);
    return outcomeOf(set.data);
  }

  /** The file is kept, with no caption, so a later finish can caption it (FR-006). */
  async function notCaptioned(
    row: AttachmentRow,
    token: string,
    actual: StatePatch,
    rebuild: boolean,
    reason: string,
  ): Promise<FinishOutcome> {
    if (rebuild) return await rebuildFailed(row, token, reason);
    const set = await store.setState(row.id, token, { ...actual, state: "not_captioned", state_reason: reason });
    if ("error" in set) throw new Error(set.error);
    return { state: "not_captioned", reason, derived_count: 0 };
  }

  async function photoPath(row: AttachmentRow, token: string, bytes: Uint8Array, actual: StatePatch, rebuild: boolean): Promise<FinishOutcome> {
    if (!deps.vision.configured) {
      return await notCaptioned(row, token, actual, rebuild, "vision is not configured (set VISION_API_BASE and VISION_MODEL)");
    }
    const caption = await deps.vision.caption(bytes, row.declared_type as AcceptedType);
    if ("error" in caption) return await notCaptioned(row, token, actual, rebuild, caption.error);
    const embedded = await deps.embeddings.embed([caption.data.text]);
    if ("error" in embedded) throw new Error(embedded.error);
    const now = deps.now();
    const derived = await captionRow(row, caption.data, embedded.data[0], now);
    const patch: StatePatch = {
      ...actual,
      state: "processed",
      state_reason: null,
      caption_model: caption.data.model,
      processed_at: now.toISOString(),
    };
    const written = await store.writeDerived(row.id, token, [derived], patch);
    if ("error" in written) throw new Error(written.error);
    return { state: "processed", derived_count: 1, caption: caption.data.text.slice(0, 300) };
  }

  return { finish };
}
