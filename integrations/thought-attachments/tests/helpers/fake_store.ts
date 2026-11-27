/**
 * An in-memory `Store` that models the database semantics data-model.md and
 * research R9/R10/R16/R17 state, so acceptance tests can rely on them:
 *
 * - thoughts carry `content_fingerprint` with upsert_thought's normalisation
 *   (VP-004: sha256 hex of lower(trim(collapse whitespace))), unique table-wide;
 * - a vector column of a fixed dimension: a vector of another length is an error;
 * - attachments follow `thought_attachments`, including the unique
 *   (parent_thought_id, content_hash) index over non-refused rows;
 * - claims expire by the injected clock, and writes in a claim's name need its
 *   unexpired token;
 * - `writeDerived` and `removeAttachment` are all-or-nothing, and a
 *   fingerprint conflict is an error, never a merge;
 * - the FR-016 note exception on removal;
 * - Storage objects carry bytes and `createdAt`.
 *
 * It records every call; any method can be made to fail (always or once),
 * overridden, or held until released. The same rules are asserted against
 * real SQL by stream Q, so a drifting fake shows up as a disagreement.
 */
import type {
  AcceptedType,
  AttachmentRow,
  BusyOp,
  Declaration,
  DerivedRow,
  NewAttachment,
  OrphanReason,
  R,
  StatePatch,
  Store,
  ThoughtMatch,
} from "../../src/types.ts";
import { Clock } from "./clock.ts";
import { SUPABASE_URL } from "./env.ts";

export interface FakeThought {
  id: string;
  content: string;
  content_fingerprint: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** The attachment that owns this derived thought (null for any other thought). */
  attachment_id: string | null;
}

export interface FakeObject {
  bytes: Uint8Array;
  createdAt: string;
}

export type Method = keyof Store;

/** upsert_thought's normalisation before hashing: lower(trim(regexp_replace(content, '\s+', ' ', 'g'))). */
export function normaliseForFingerprint(content: string): string {
  return content.replace(/\s+/g, " ").trim().toLowerCase();
}

/** upsert_thought's `content_fingerprint`: sha256 hex of the normalised content. */
export async function fingerprintOf(content: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normaliseForFingerprint(content)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The first 8 hex characters of an attachment id (FR-025). */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

const hex8 = (n: number) => (n >>> 0).toString(16).padStart(8, "0");

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

class DbError extends Error {}

export interface FakeStoreOptions {
  clock?: Clock;
  /** The dimension of `thoughts.embedding` (default 1536). */
  dimension?: number;
  /** The bucket in signed links (default `ob1-files`). */
  bucket?: string;
  /** The internal Supabase origin in signed links (default env.ts SUPABASE_URL). */
  origin?: string;
}

export const FINGERPRINT_CONFLICT =
  'duplicate key value violates unique constraint "idx_thoughts_fingerprint"';
export const HASH_CONFLICT =
  'duplicate key value violates unique constraint "thought_attachments_parent_hash_key"';
export const STALE_CLAIM = "claim token is stale or foreign";
export const NOT_FOUND = "attachment not found";

export class FakeStore implements Store {
  readonly clock: Clock;
  dimension: number;
  readonly bucket: string;
  readonly origin: string;

  thoughts: FakeThought[] = [];
  attachments: AttachmentRow[] = [];
  readonly objects = new Map<string, FakeObject>();
  /** Signed upload links handed out, in order. */
  readonly signedUploads: { path: string; url: string; token: string }[] = [];
  /** Signed download links handed out, in order. */
  readonly signedDownloads: { path: string; url: string; seconds: number }[] = [];

  readonly calls: Array<{ method: Method; args: unknown[] }> = [];
  /** Methods listed here return `{ error: <message> }` on every call (after recording it). */
  fail: Partial<Record<Method, string>> = {};
  /** Replace any method's behavior for one test (the call is still recorded; wins over `fail`). */
  override: Partial<Store> = {};
  /** When set, `writeDerived` fails after inserting this many rows, and its transaction rolls back. */
  failDerivedAfter: number | null = null;

  private failOnce = new Map<Method, string[]>();
  private holds = new Map<Method, Array<() => void>>();
  private nextThought = 1;
  private nextAttachment = 0xa0000001;
  private nextToken = 1;

  constructor(opts: FakeStoreOptions = {}) {
    this.clock = opts.clock ?? new Clock();
    this.dimension = opts.dimension ?? 1536;
    this.bucket = opts.bucket ?? "ob1-files";
    this.origin = opts.origin ?? SUPABASE_URL;
  }

  // ---------- test controls ----------

  /** The next call of `method` returns `{ error: message }` (queues if called repeatedly). */
  failNext(method: Method, message: string): void {
    const q = this.failOnce.get(method) ?? [];
    q.push(message);
    this.failOnce.set(method, q);
  }

  /** Calls of `method` wait (before doing anything) until the returned release function is called. */
  hold(method: Method): () => void {
    if (!this.holds.has(method)) this.holds.set(method, []);
    return () => {
      const waiting = this.holds.get(method) ?? [];
      this.holds.delete(method);
      for (const go of waiting) go();
    };
  }

  /** Number of calls of `method` currently held. */
  heldCount(method: Method): number {
    return this.holds.get(method)?.length ?? 0;
  }

  /** The names of recorded calls, in order. */
  callNames(): Method[] {
    return this.calls.map((c) => c.method);
  }

  /** Add an existing thought (as if captured elsewhere). */
  async seedThought(
    t: { content: string; id?: string; embedding?: number[] | null; metadata?: Record<string, unknown>; created_at?: string },
  ): Promise<FakeThought> {
    const fp = await fingerprintOf(t.content);
    if (this.thoughts.some((x) => x.content_fingerprint === fp)) throw new Error(FINGERPRINT_CONFLICT);
    const ts = t.created_at ?? this.clock.iso();
    const row: FakeThought = {
      id: t.id ?? this.newThoughtId(),
      content: t.content,
      content_fingerprint: fp,
      embedding: t.embedding ?? null,
      metadata: t.metadata ?? {},
      created_at: ts,
      updated_at: ts,
      attachment_id: null,
    };
    this.thoughts.push(row);
    return row;
  }

  /** Add an attachment row directly (defaults as `createAttachment`). */
  seedAttachment(fields: Partial<AttachmentRow> & { parent_thought_id: string }): AttachmentRow {
    const row: AttachmentRow = { ...this.defaults(fields.parent_thought_id), ...fields };
    this.attachments.push(row);
    return structuredClone(row);
  }

  /** Simulate a client uploading bytes to a path (as the signed upload link would). */
  putObject(path: string, bytes: Uint8Array, createdAt?: string): void {
    this.objects.set(path, { bytes: bytes.slice(), createdAt: createdAt ?? this.clock.iso() });
  }

  thought(id: string): FakeThought | undefined {
    return this.thoughts.find((t) => t.id === id);
  }

  attachment(id: string): AttachmentRow | undefined {
    return this.attachments.find((a) => a.id === id);
  }

  /** The derived thoughts an attachment owns. */
  derivedOf(attachmentId: string): FakeThought[] {
    return this.thoughts.filter((t) => t.attachment_id === attachmentId);
  }

  // ---------- plumbing ----------

  private newThoughtId(): string {
    return `${hex8(this.nextThought++)}-0000-4000-9000-000000000000`;
  }

  private newAttachmentId(): string {
    return `${hex8(this.nextAttachment++)}-0000-4000-8000-000000000000`;
  }

  private defaults(parent: string): AttachmentRow {
    const now = this.clock.now();
    return {
      id: this.newAttachmentId(),
      parent_thought_id: parent,
      parent_created_here: false,
      file_name: null,
      declared_type: null,
      declared_size: null,
      declared_by_page: false,
      expected_kind: null,
      actual_type: null,
      actual_size: null,
      page_count: null,
      content_hash: null,
      storage_path: null,
      sensitivity_tier: "personal",
      state: "pending_upload",
      state_reason: null,
      last_rebuild_error: null,
      caption_model: null,
      derived_count: 0,
      upload_deadline: new Date(now.getTime() + 60 * 60_000).toISOString(),
      page_token_hash: null,
      busy_op: null,
      busy_until: null,
      busy_token: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      processed_at: null,
    };
  }

  private async run<T>(method: Method, args: unknown[], body: () => T | Promise<T>): Promise<R<T>> {
    this.calls.push({ method, args });
    const waiting = this.holds.get(method);
    if (waiting) await new Promise<void>((go) => waiting.push(go));
    const o = this.override[method] as ((...a: unknown[]) => Promise<R<T>>) | undefined;
    if (o) return await o(...args);
    const once = this.failOnce.get(method);
    if (once?.length) return { error: once.shift() as string };
    const msg = this.fail[method];
    if (msg !== undefined) return { error: msg };
    try {
      return { data: await body() };
    } catch (e) {
      if (e instanceof DbError) return { error: e.message };
      throw e;
    }
  }

  /** Run `fn` as one transaction: any error restores thoughts and attachments as they were. */
  private transaction<T>(fn: () => T): T {
    const thoughts = structuredClone(this.thoughts);
    const attachments = structuredClone(this.attachments);
    try {
      return fn();
    } catch (e) {
      this.thoughts = thoughts;
      this.attachments = attachments;
      throw e;
    }
  }

  private mustGet(id: string): AttachmentRow {
    const row = this.attachment(id);
    if (!row) throw new DbError(NOT_FOUND);
    return row;
  }

  private checkClaim(row: AttachmentRow, token: string): void {
    const now = this.clock.now().getTime();
    if (row.busy_token !== token || row.busy_until === null || new Date(row.busy_until).getTime() <= now) {
      throw new DbError(STALE_CLAIM);
    }
  }

  private checkDimension(v: number[]): void {
    if (v.length !== this.dimension) throw new DbError(`expected ${this.dimension} dimensions, not ${v.length}`);
  }

  /** The unique (parent_thought_id, content_hash) index over non-refused rows. */
  private checkHashIndex(row: AttachmentRow): void {
    if (row.content_hash === null || row.state === "refused") return;
    const clash = this.attachments.some((a) =>
      a.id !== row.id && a.parent_thought_id === row.parent_thought_id && a.content_hash === row.content_hash &&
      a.state !== "refused"
    );
    if (clash) throw new DbError(HASH_CONFLICT);
  }

  private applyPatch(row: AttachmentRow, patch: StatePatch): void {
    Object.assign(row, patch);
    row.updated_at = this.clock.iso();
    this.checkHashIndex(row);
  }

  /** FR-016's exception: the parent note goes with this attachment. */
  private noteWouldGo(row: AttachmentRow): boolean {
    const now = this.clock.now().getTime();
    const ended = row.state === "refused" ||
      (row.state === "pending_upload" && new Date(row.upload_deadline).getTime() <= now);
    return ended && row.parent_created_here && !!this.thought(row.parent_thought_id) &&
      !this.attachments.some((a) => a.id !== row.id && a.parent_thought_id === row.parent_thought_id);
  }

  private match(t: FakeThought): ThoughtMatch {
    return { id: t.id, first_line: t.content.split("\n")[0].slice(0, 120), captured: t.created_at };
  }

  private storageUrl(kind: "upload/sign" | "sign", path: string, token: string): string {
    return `${this.origin}/storage/v1/object/${kind}/${this.bucket}/${path}?token=${token}`;
  }

  // ---------- thoughts ----------

  thoughtExists(id: string): Promise<R<boolean>> {
    return this.run("thoughtExists", [id], () => !!this.thought(id));
  }

  insertNote(
    content: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<R<{ id: string; created: boolean }>> {
    return this.run("insertNote", [content, embedding, metadata], async () => {
      this.checkDimension(embedding);
      const fp = await fingerprintOf(content);
      const existing = this.thoughts.find((t) => t.content_fingerprint === fp);
      if (existing) return { id: existing.id, created: false };
      const ts = this.clock.iso();
      const row: FakeThought = {
        id: this.newThoughtId(),
        content,
        content_fingerprint: fp,
        embedding: [...embedding],
        metadata: structuredClone(metadata),
        created_at: ts,
        updated_at: ts,
        attachment_id: null,
      };
      this.thoughts.push(row);
      return { id: row.id, created: true };
    });
  }

  matchThoughts(embedding: number[], limit: number): Promise<R<ThoughtMatch[]>> {
    return this.run("matchThoughts", [embedding, limit], () => {
      this.checkDimension(embedding);
      return this.thoughts
        .filter((t) => t.embedding !== null)
        .map((t) => ({ t, s: cosine(embedding, t.embedding as number[]) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map(({ t }) => this.match(t));
    });
  }

  findThoughtsExact(text: string, limit: number): Promise<R<ThoughtMatch[]>> {
    return this.run("findThoughtsExact", [text, limit], () => {
      const needle = text.toLowerCase();
      return this.thoughts
        .filter((t) => t.content.toLowerCase().includes(needle))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, Math.min(limit, 20))
        .map((t) => this.match(t));
    });
  }

  embeddingDimension(): Promise<R<number>> {
    return this.run("embeddingDimension", [], () => this.dimension);
  }

  // ---------- attachments ----------

  createAttachment(fields: NewAttachment): Promise<R<AttachmentRow>> {
    return this.run("createAttachment", [fields], () => {
      if (fields.id && this.attachment(fields.id)) {
        throw new DbError('duplicate key value violates unique constraint "thought_attachments_pkey"');
      }
      const base = this.defaults(fields.parent_thought_id);
      const row: AttachmentRow = {
        ...base,
        id: fields.id ?? base.id,
        parent_created_here: fields.parent_created_here,
        file_name: fields.file_name ?? null,
        declared_type: fields.declared_type ?? null,
        declared_size: fields.declared_size ?? null,
        declared_by_page: false,
        expected_kind: fields.expected_kind ?? null,
        storage_path: fields.storage_path ?? null,
        sensitivity_tier: fields.sensitivity_tier ?? "personal",
        upload_deadline: fields.upload_deadline,
        page_token_hash: fields.page_token_hash ?? null,
      };
      this.attachments.push(row);
      return structuredClone(row);
    });
  }

  getAttachment(idOrShortId: string): Promise<R<AttachmentRow | "not_found" | "ambiguous">> {
    return this.run("getAttachment", [idOrShortId], () => {
      const key = idOrShortId.trim().toLowerCase();
      const exact = this.attachments.find((a) => a.id === key);
      if (exact) return structuredClone(exact);
      if (!/^[0-9a-f]{8}$/.test(key)) return "not_found" as const;
      const hits = this.attachments.filter((a) => shortId(a.id) === key);
      if (hits.length === 0) return "not_found" as const;
      if (hits.length > 1) return "ambiguous" as const;
      return structuredClone(hits[0]);
    });
  }

  findPending(
    parentId: string,
    name: string,
    type: AcceptedType,
    size: number,
    now: Date,
  ): Promise<R<AttachmentRow | null>> {
    return this.run("findPending", [parentId, name, type, size, now], () => {
      const hit = this.attachments.find((a) =>
        a.state === "pending_upload" && a.parent_thought_id === parentId && a.file_name === name &&
        a.declared_type === type && a.declared_size === size && new Date(a.upload_deadline).getTime() > now.getTime()
      );
      return hit ? structuredClone(hit) : null;
    });
  }

  findByHash(parentId: string, contentHash: string): Promise<R<AttachmentRow | null>> {
    return this.run("findByHash", [parentId, contentHash], () => {
      const hit = this.attachments.find((a) =>
        a.parent_thought_id === parentId && a.content_hash === contentHash && a.state !== "refused"
      );
      return hit ? structuredClone(hit) : null;
    });
  }

  setDeclaration(id: string, decl: Declaration): Promise<R<AttachmentRow>> {
    return this.run("setDeclaration", [id, decl], () => {
      const row = this.mustGet(id);
      Object.assign(row, decl);
      row.declared_by_page = true;
      row.updated_at = this.clock.iso();
      return structuredClone(row);
    });
  }

  listByParent(parentId: string): Promise<R<AttachmentRow[]>> {
    return this.run("listByParent", [parentId], () =>
      this.attachments
        .filter((a) => a.parent_thought_id === parentId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((a) => structuredClone(a)));
  }

  attachmentForDerived(thoughtId: string): Promise<R<AttachmentRow | null>> {
    return this.run("attachmentForDerived", [thoughtId], () => {
      const owner = this.thought(thoughtId)?.attachment_id;
      const row = owner ? this.attachment(owner) : undefined;
      return row ? structuredClone(row) : null;
    });
  }

  orphans(now: Date): Promise<R<{ row: AttachmentRow; why: OrphanReason }[]>> {
    return this.run("orphans", [now], () => {
      const out: { row: AttachmentRow; why: OrphanReason }[] = [];
      for (const a of this.attachments) {
        let why: OrphanReason | null = null;
        if (!this.thought(a.parent_thought_id)) why = "parent_gone";
        else if (a.state === "refused") why = "refused";
        else if (a.state === "pending_upload" && new Date(a.upload_deadline).getTime() <= now.getTime()) {
          why = "upload_expired";
        }
        if (why) out.push({ row: structuredClone(a), why });
      }
      return out;
    });
  }

  attachmentForPageToken(hash: string): Promise<R<AttachmentRow | null>> {
    return this.run("attachmentForPageToken", [hash], () => {
      const hit = this.attachments.find((a) => a.page_token_hash !== null && a.page_token_hash === hash);
      return hit ? structuredClone(hit) : null;
    });
  }

  consumePageToken(id: string, hash: string): Promise<R<boolean>> {
    return this.run("consumePageToken", [id, hash], () => {
      const row = this.attachment(id);
      if (!row || row.page_token_hash === null || row.page_token_hash !== hash) return false;
      row.page_token_hash = null;
      row.updated_at = this.clock.iso();
      return true;
    });
  }

  // ---------- claims and writes ----------

  claim(id: string, op: BusyOp, seconds: number): Promise<R<{ token: string } | { busy: BusyOp }>> {
    return this.run("claim", [id, op, seconds], () => {
      const row = this.mustGet(id);
      const now = this.clock.now().getTime();
      if (row.busy_until !== null && row.busy_op !== null && new Date(row.busy_until).getTime() > now) {
        return { busy: row.busy_op };
      }
      const token = `claim-${this.nextToken++}`;
      row.busy_op = op;
      row.busy_until = new Date(now + seconds * 1000).toISOString();
      row.busy_token = token;
      return { token };
    });
  }

  release(id: string, token: string): Promise<R<null>> {
    return this.run("release", [id, token], () => {
      const row = this.attachment(id);
      if (row && row.busy_token === token) {
        row.busy_op = null;
        row.busy_until = null;
        row.busy_token = null;
      }
      return null;
    });
  }

  writeDerived(id: string, token: string, rows: DerivedRow[], patch: StatePatch): Promise<R<AttachmentRow>> {
    return this.run("writeDerived", [id, token, rows, patch], async () => {
      const fps = await Promise.all(rows.map((r) => fingerprintOf(r.content)));
      return this.transaction(() => {
        const row = this.mustGet(id);
        this.checkClaim(row, token);
        this.thoughts = this.thoughts.filter((t) => t.attachment_id !== id);
        const ts = this.clock.iso();
        rows.forEach((r, i) => {
          if (this.failDerivedAfter !== null && i >= this.failDerivedAfter) {
            throw new DbError("injected failure partway through writeDerived");
          }
          this.checkDimension(r.embedding);
          if (this.thoughts.some((t) => t.content_fingerprint === fps[i])) throw new DbError(FINGERPRINT_CONFLICT);
          this.thoughts.push({
            id: this.newThoughtId(),
            content: r.content,
            content_fingerprint: fps[i],
            embedding: [...r.embedding],
            metadata: structuredClone(r.metadata),
            created_at: ts,
            updated_at: ts,
            attachment_id: id,
          });
        });
        this.applyPatch(row, { ...patch, derived_count: rows.length });
        return structuredClone(row);
      });
    });
  }

  setState(id: string, token: string, patch: StatePatch): Promise<R<AttachmentRow>> {
    return this.run("setState", [id, token, patch], () =>
      this.transaction(() => {
        const row = this.mustGet(id);
        this.checkClaim(row, token);
        this.applyPatch(row, patch);
        return structuredClone(row);
      }));
  }

  removalPreview(id: string): Promise<R<{ derived: number; noteWouldGo: boolean }>> {
    return this.run("removalPreview", [id], () => {
      const row = this.mustGet(id);
      return { derived: this.derivedOf(id).length, noteWouldGo: this.noteWouldGo(row) };
    });
  }

  removeAttachment(id: string, token: string): Promise<R<{ derived: number; noteRemoved: boolean }>> {
    return this.run("removeAttachment", [id, token], () =>
      this.transaction(() => {
        const row = this.mustGet(id);
        this.checkClaim(row, token);
        const derived = this.derivedOf(id).length;
        const noteRemoved = this.noteWouldGo(row);
        this.thoughts = this.thoughts.filter((t) =>
          t.attachment_id !== id && !(noteRemoved && t.id === row.parent_thought_id)
        );
        this.attachments = this.attachments.filter((a) => a.id !== id);
        return { derived, noteRemoved };
      }));
  }

  // ---------- Storage ----------

  signUpload(path: string): Promise<R<{ url: string; token: string }>> {
    return this.run("signUpload", [path], () => {
      const token = `upload-${this.nextToken++}`;
      const url = this.storageUrl("upload/sign", path, token);
      this.signedUploads.push({ path, url, token });
      return { url, token };
    });
  }

  objectInfo(path: string): Promise<R<{ size: number; createdAt: string } | null>> {
    return this.run("objectInfo", [path], () => {
      const o = this.objects.get(path);
      return o ? { size: o.bytes.length, createdAt: o.createdAt } : null;
    });
  }

  download(path: string): Promise<R<Uint8Array>> {
    return this.run("download", [path], () => {
      const o = this.objects.get(path);
      if (!o) throw new DbError("Object not found");
      return o.bytes.slice();
    });
  }

  deleteObject(path: string): Promise<R<null>> {
    return this.run("deleteObject", [path], () => {
      this.objects.delete(path);
      return null;
    });
  }

  signDownload(path: string, seconds: number): Promise<R<string>> {
    return this.run("signDownload", [path, seconds], () => {
      if (!this.objects.has(path)) throw new DbError("Object not found");
      const url = this.storageUrl("sign", path, `download-${this.nextToken++}`);
      this.signedDownloads.push({ path, url, seconds });
      return url;
    });
  }
}
