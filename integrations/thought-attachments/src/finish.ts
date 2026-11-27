/** finish_attachment's engine (T025 and later): claim, verify, extract, embed, write (contracts/mcp-tools.md). */
import { checkActual, sniffType } from "./intake.ts";
import { passageRow, sourceLine } from "./derived.ts";
import { toPassages } from "./passages.ts";
import { openPdf } from "./pdf.ts";
import type { AttachmentRow, Deps, FinishOutcome, Services, StatePatch } from "./types.ts";

/** `sha256:<hex>` of the bytes, as `content_hash` stores it. */
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return "sha256:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createFinisher(deps: Deps): Services {
  const { store, settings } = deps;

  async function finish(id: string, _opts: { rebuild?: boolean }): Promise<FinishOutcome> {
    const got = await store.getAttachment(id);
    if ("error" in got || typeof got.data === "string") throw new Error("attachment not found");
    const row = got.data;
    const claim = await store.claim(row.id, "finish", settings.busySeconds);
    if ("error" in claim || !("token" in claim.data)) throw new Error("claim failed");
    const token = claim.data.token;
    try {
      return await run(row, token);
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

  async function run(row: AttachmentRow, token: string): Promise<FinishOutcome> {
    if (row.state === "processed") return outcomeOf(row);
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
    const rows = await Promise.all(passages.map((p, i) => passageRow({ ...row, content_hash: hash }, p, embedded.data[i], now)));
    const patch = {
      state: "processed" as const,
      actual_type: sniffType(bytes),
      actual_size: info.data.size,
      page_count: pdf.data.pageCount,
      content_hash: hash,
      processed_at: now.toISOString(),
    };
    const written = await store.writeDerived(row.id, token, rows, patch);
    if ("error" in written) throw new Error(written.error);
    return { state: "processed", derived_count: rows.length, page_count: pdf.data.pageCount };
  }

  return { finish };
}
