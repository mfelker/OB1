/**
 * The Supabase-backed Store (spec 007 seams): PostgREST and RPC calls for the database half, the Storage
 * API for the file half. supabase-js runs over the injected `fetch`, so tests never touch a network.
 * Stream Q owns this file and schema.sql together: tests/schema_drift_test.ts checks every RPC name and
 * parameter sent here against schema.sql.
 */
import { createClient } from "@supabase/supabase-js";
import type { AttachmentRow, BusyOp, OrphanReason, R, Settings, Store, ThoughtMatch } from "./types.ts";

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
    insertNote(content, embedding, metadata) {
      return rpc<{ id: string; created: boolean }>("attachment_insert_note", {
        p_content: content,
        p_embedding: `[${embedding.join(",")}]`,
        p_metadata: metadata,
      });
    },
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
    async listByParent(parentId) {
      const { data, error } = await db.from("thought_attachments").select("*")
        .eq("parent_thought_id", parentId).order("created_at", { ascending: true });
      if (error) return { error: scrub(error.message) };
      return { data: (data ?? []) as AttachmentRow[] };
    },
    async attachmentForDerived(thoughtId) {
      const { data, error } = await db.from("thoughts").select("metadata").eq("id", thoughtId).limit(1);
      if (error) return { error: scrub(error.message) };
      const attachmentId = (data as { metadata: { attachment_id?: string } | null }[] | null)?.[0]?.metadata?.attachment_id;
      if (!attachmentId) return { data: null };
      const { data: rows, error: rowError } = await db.from("thought_attachments").select("*").eq("id", attachmentId).limit(1);
      if (rowError) return { error: scrub(rowError.message) };
      return { data: ((rows ?? []) as AttachmentRow[])[0] ?? null };
    },
    async orphans(now) {
      const r = await rpc<{ attachment: AttachmentRow; why: OrphanReason }[]>("attachment_orphans", { p_now: now.toISOString() });
      if ("error" in r) return r;
      return { data: r.data.map((o) => ({ row: o.attachment, why: o.why })) };
    },
    async attachmentForPageToken(hash) {
      const r = await rpc<AttachmentRow[]>("attachment_by_page_token", { p_hash: hash });
      return "error" in r ? r : { data: r.data[0] ?? null };
    },
    consumePageToken(id, hash) {
      return rpc<boolean>("attachment_consume_page_token", { p_id: id, p_hash: hash });
    },
    claim(id, op, seconds) {
      return rpc<{ token: string } | { busy: BusyOp }>("attachment_claim", { p_id: id, p_op: op, p_seconds: seconds });
    },
    release: notYet,
    writeDerived: notYet,
    setState: notYet,
    removalPreview(id) {
      return rpc<{ derived: number; noteWouldGo: boolean }>("attachment_removal_preview", { p_id: id });
    },
    removeAttachment(id, token) {
      return rpc<{ derived: number; noteRemoved: boolean }>("attachment_remove", { p_id: id, p_token: token });
    },
    async signUpload(path) {
      const { data, error } = await db.storage.from(settings.attachmentsBucket).createSignedUploadUrl(path);
      if (error) return { error: scrub(error.message) };
      return { data: { url: data.signedUrl, token: data.token } };
    },
    async objectInfo(path) {
      const { data, error } = await db.storage.from(settings.attachmentsBucket).info(path);
      if (error) {
        const status = Number((error as { status?: number; statusCode?: string }).status ?? (error as { statusCode?: string }).statusCode);
        if (status === 404 || /not found/i.test(error.message)) return { data: null };
        return { error: scrub(error.message) };
      }
      return { data: { size: data.size as number, createdAt: data.createdAt as string } };
    },
    async download(path) {
      const { data, error } = await db.storage.from(settings.attachmentsBucket).download(path);
      if (error) return { error: scrub(error.message) };
      return { data: new Uint8Array(await data.arrayBuffer()) };
    },
    async deleteObject(path) {
      const { error } = await db.storage.from(settings.attachmentsBucket).remove([path]);
      if (error) return { error: scrub(error.message) };
      return { data: null };
    },
    async signDownload(path, seconds) {
      const { data, error } = await db.storage.from(settings.attachmentsBucket).createSignedUrl(path, seconds);
      if (error) return { error: scrub(error.message) };
      return { data: data.signedUrl };
    },
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
