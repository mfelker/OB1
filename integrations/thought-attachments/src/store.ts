/**
 * The Supabase-backed Store (spec 007 seams): PostgREST and RPC calls for the database half, the Storage
 * API for the file half. supabase-js runs over the injected `fetch`, so tests never touch a network.
 * Stream Q owns this file and schema.sql together: tests/schema_drift_test.ts checks every RPC name and
 * parameter sent here against schema.sql.
 */
import { createClient } from "@supabase/supabase-js";
import type { AttachmentRow, BusyOp, R, Settings, Store, ThoughtMatch } from "./types.ts";

const notYet = (): Promise<never> => Promise.reject(new Error("not implemented"));

export function createSupabaseStore(
  url: string,
  serviceRoleKey: string,
  settings: Settings,
  fetch: typeof globalThis.fetch,
): Store {
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
  void settings;

  /** An error text with the service-role key removed (FR-009). */
  function scrub(message: string): string {
    const text = serviceRoleKey ? message.split(serviceRoleKey).join("[key]") : message;
    return text || "database error";
  }

  /** One RPC: the reply data on success, `{ error }` otherwise. */
  async function rpc<T>(name: string, args: Record<string, unknown>): Promise<R<T>> {
    const { data, error } = await db.rpc(name, args);
    if (error) return { error: scrub(error.message) };
    return { data: data as T };
  }

  const store: Store = {
    async thoughtExists(id) {
      const { data, error } = await db.from("thoughts").select("id").eq("id", id).limit(1);
      if (error) return { error: scrub(error.message) };
      return { data: (data ?? []).length > 0 };
    },
    insertNote: notYet,
    async matchThoughts(embedding, limit) {
      const r = await rpc<{ id: string; content: string; created_at: string }[]>("match_thoughts", {
        query_embedding: embedding,
        match_threshold: 0,
        match_count: limit,
      });
      if ("error" in r) return r;
      return { data: r.data.map((t): ThoughtMatch => ({ id: t.id, first_line: t.content.split("\n")[0].slice(0, 120), captured: t.created_at })) };
    },
    findThoughtsExact(text, limit) {
      return rpc<ThoughtMatch[]>("attachment_find_thoughts_exact", { p_text: text, p_limit: limit });
    },
    embeddingDimension() {
      return rpc<number>("attachment_embedding_dimension", {});
    },
    createAttachment: notYet,
    async getAttachment(idOrShortId) {
      let query = db.from("thought_attachments").select("*");
      if (/^[0-9a-f]{8}$/i.test(idOrShortId)) {
        const prefix = idOrShortId.toLowerCase();
        query = query.gte("id", `${prefix}-0000-0000-0000-000000000000`).lte("id", `${prefix}-ffff-ffff-ffff-ffffffffffff`);
      } else {
        query = query.eq("id", idOrShortId);
      }
      const { data, error } = await query.limit(2);
      if (error) return { error: scrub(error.message) };
      const rows = (data ?? []) as AttachmentRow[];
      if (rows.length > 1) return { data: "ambiguous" };
      return { data: rows[0] ?? "not_found" };
    },
    async findPending(parentId, name, type, size, now) {
      const { data, error } = await db.from("thought_attachments").select("*")
        .eq("parent_thought_id", parentId).eq("file_name", name).eq("declared_type", type).eq("declared_size", size)
        .eq("state", "pending_upload").gt("upload_deadline", now.toISOString()).limit(1);
      if (error) return { error: scrub(error.message) };
      return { data: ((data ?? []) as AttachmentRow[])[0] ?? null };
    },
    async findByHash(parentId, contentHash) {
      const { data, error } = await db.from("thought_attachments").select("*")
        .eq("parent_thought_id", parentId).eq("content_hash", contentHash).neq("state", "refused").limit(1);
      if (error) return { error: scrub(error.message) };
      return { data: ((data ?? []) as AttachmentRow[])[0] ?? null };
    },
    setDeclaration: notYet,
    listByParent: notYet,
    attachmentForDerived: notYet,
    orphans: notYet,
    attachmentForPageToken: notYet,
    consumePageToken: notYet,
    claim(id, op, seconds) {
      return rpc<{ token: string } | { busy: BusyOp }>("attachment_claim", { p_id: id, p_op: op, p_seconds: seconds });
    },
    release: notYet,
    writeDerived: notYet,
    setState: notYet,
    removalPreview: notYet,
    removeAttachment: notYet,
    signUpload: notYet,
    objectInfo: notYet,
    download: notYet,
    deleteObject: notYet,
    signDownload: notYet,
  };

  // A thrown error (a network failure, say) also becomes { error }, with the key removed.
  const guarded: Record<string, unknown> = {};
  for (const [name, method] of Object.entries(store)) {
    guarded[name] = async (...args: unknown[]) => {
      try {
        return await (method as (...a: unknown[]) => Promise<unknown>)(...args);
      } catch (e) {
        return { error: scrub(e instanceof Error ? e.message : String(e)) };
      }
    };
  }
  return guarded as unknown as Store;
}
