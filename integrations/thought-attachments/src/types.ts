/**
 * Shared seams for thought-attachments (spec 007, tasks.md "Seams").
 * Every stream codes against these types; behavior comes from the contracts
 * and data-model.md. Owned by the integrator: a stream that needs a change
 * stops and reports instead of editing this file.
 */

/** Reads one environment variable (Deno.env.get in production). */
export type GetEnv = (name: string) => string | undefined;

/** One field per row of contracts/settings.md. */
export interface Settings {
  /** MCP_ACCESS_KEY (required). */
  mcpAccessKey: string;
  /** EMBEDDING_API_BASE. */
  embeddingApiBase: string;
  /** EMBEDDING_API_KEY, falling back to OPENROUTER_API_KEY. */
  embeddingApiKey: string | undefined;
  /** EMBEDDING_MODEL. */
  embeddingModel: string;
  /** EMBEDDING_BATCH_SIZE. */
  embeddingBatchSize: number;
  /** VISION_API_BASE (unset: vision is not configured). */
  visionApiBase: string | undefined;
  /** VISION_API_KEY. */
  visionApiKey: string | undefined;
  /** VISION_MODEL. */
  visionModel: string | undefined;
  /** ATTACHMENTS_BUCKET. */
  attachmentsBucket: string;
  /** MAX_IMAGE_MB (decimals allowed). */
  maxImageMb: number;
  /** MAX_PDF_MB (decimals allowed). */
  maxPdfMb: number;
  /** MAX_PDF_PAGES. */
  maxPdfPages: number;
  /** PASSAGE_MAX_CHARS. */
  passageMaxChars: number;
  /** SCANNED_MIN_CHARS_PER_PAGE. */
  scannedMinCharsPerPage: number;
  /** UPLOAD_LINK_MINUTES. */
  uploadLinkMinutes: number;
  /** DOWNLOAD_LINK_SECONDS. */
  downloadLinkSeconds: number;
  /** BUSY_SECONDS. */
  busySeconds: number;
  /** PUBLIC_BASE_URL, falling back to SUPABASE_PUBLIC_URL, then SUPABASE_URL. */
  publicBaseUrl: string;
  /** UPLOAD_PAGE_URL. */
  uploadPageUrl: string;
}

export type SettingsResult =
  | { ok: true; settings: Settings }
  | { ok: false; problems: { setting: string; reason: string }[] };

export type AcceptedType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

export type AttachmentState =
  | "pending_upload"
  | "processed"
  | "scanned"
  | "not_captioned"
  | "failed"
  | "refused";

export type BusyOp = "finish" | "rebuild" | "remove";

export type SensitivityTier = "standard" | "personal" | "restricted";

export type ExpectedKind = "photo" | "pdf";

/** One field per data-model.md `thought_attachments` column. Timestamps are ISO 8601 strings. */
export interface AttachmentRow {
  id: string;
  parent_thought_id: string;
  parent_created_here: boolean;
  file_name: string | null;
  declared_type: AcceptedType | null;
  declared_size: number | null;
  expected_kind: ExpectedKind | null;
  actual_type: string | null;
  actual_size: number | null;
  page_count: number | null;
  content_hash: string | null;
  storage_path: string | null;
  sensitivity_tier: SensitivityTier;
  state: AttachmentState;
  state_reason: string | null;
  last_rebuild_error: string | null;
  caption_model: string | null;
  derived_count: number;
  upload_deadline: string;
  page_token_hash: string | null;
  busy_op: BusyOp | null;
  busy_until: string | null;
  busy_token: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

/** The fields given when an attachment starts (`createAttachment`). The store generates `id` when it is omitted. */
export interface NewAttachment {
  id?: string;
  parent_thought_id: string;
  parent_created_here: boolean;
  file_name?: string | null;
  declared_type?: AcceptedType | null;
  declared_size?: number | null;
  expected_kind?: ExpectedKind | null;
  storage_path?: string | null;
  sensitivity_tier?: SensitivityTier;
  upload_deadline: string;
  page_token_hash?: string | null;
}

/** The declaration of a file (attach call or the page's `/page/start`). */
export interface Declaration {
  file_name: string;
  declared_type: AcceptedType;
  declared_size: number;
  storage_path: string;
}

export type R<T> = { data: T } | { error: string };

export type Refusal = { code: string; message: string };

export interface ThoughtMatch {
  id: string;
  /** Up to 120 characters. */
  first_line: string;
  /** When the thought was captured (ISO 8601). */
  captured: string;
}

/** One derived thought to write (data-model.md "Derived thought"). */
export interface DerivedRow {
  content: string;
  fingerprint: string;
  metadata: Record<string, unknown>;
  /** The brain's model, at the brain's dimension (FR-007). */
  embedding: number[];
}

/** The subset of `AttachmentRow` that finishing sets. */
export type StatePatch = Partial<
  Pick<
    AttachmentRow,
    | "state"
    | "state_reason"
    | "last_rebuild_error"
    | "caption_model"
    | "derived_count"
    | "actual_type"
    | "actual_size"
    | "page_count"
    | "content_hash"
    | "processed_at"
  >
>;

export type OrphanReason = "parent_gone" | "upload_expired" | "refused";

export interface Store {
  // thoughts
  thoughtExists(id: string): Promise<R<boolean>>;
  insertNote(
    content: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<R<{ id: string; created: boolean }>>;
  matchThoughts(embedding: number[], limit: number): Promise<R<ThoughtMatch[]>>;
  findThoughtsExact(text: string, limit: number): Promise<R<ThoughtMatch[]>>;
  embeddingDimension(): Promise<R<number>>;

  // attachments
  createAttachment(fields: NewAttachment): Promise<R<AttachmentRow>>;
  getAttachment(idOrShortId: string): Promise<R<AttachmentRow | "not_found" | "ambiguous">>;
  /** A `pending_upload` on that parent with that name, type and size; an expired one (deadline <= now) doesn't count. */
  findPending(
    parentId: string,
    name: string,
    type: AcceptedType,
    size: number,
    now: Date,
  ): Promise<R<AttachmentRow | null>>;
  /** A non-refused attachment on that parent with those bytes (T005 Q4). */
  findByHash(parentId: string, contentHash: string): Promise<R<AttachmentRow | null>>;
  setDeclaration(id: string, decl: Declaration): Promise<R<AttachmentRow>>;
  listByParent(parentId: string): Promise<R<AttachmentRow[]>>;
  attachmentForDerived(thoughtId: string): Promise<R<AttachmentRow | null>>;
  orphans(now: Date): Promise<R<{ row: AttachmentRow; why: OrphanReason }[]>>;
  attachmentForPageToken(hash: string): Promise<R<AttachmentRow | null>>;
  consumePageToken(id: string, hash: string): Promise<R<boolean>>;

  // claims and writes
  claim(id: string, op: BusyOp, seconds: number): Promise<R<{ token: string } | { busy: BusyOp }>>;
  release(id: string, token: string): Promise<R<null>>;
  writeDerived(id: string, token: string, rows: DerivedRow[], patch: StatePatch): Promise<R<AttachmentRow>>;
  setState(id: string, token: string, patch: StatePatch): Promise<R<AttachmentRow>>;
  removalPreview(id: string): Promise<R<{ derived: number; noteWouldGo: boolean }>>;
  removeAttachment(id: string, token: string): Promise<R<{ derived: number; noteRemoved: boolean }>>;

  // Storage
  signUpload(path: string): Promise<R<{ url: string; token: string }>>;
  objectInfo(path: string): Promise<R<{ size: number; createdAt: string } | null>>;
  download(path: string): Promise<R<Uint8Array>>;
  deleteObject(path: string): Promise<R<null>>;
  signDownload(path: string, seconds: number): Promise<R<string>>;
}

export interface EmbeddingClient {
  embed(texts: string[]): Promise<R<number[][]>>;
}

export interface VisionClient {
  configured: boolean;
  caption(bytes: Uint8Array, type: AcceptedType): Promise<R<{ text: string; model: string }>>;
}

export interface FinishOutcome {
  state: AttachmentState;
  reason?: string;
  derived_count: number;
  caption?: string;
  page_count?: number;
  busy?: BusyOp;
  last_rebuild_error?: string;
}

export interface Services {
  finish(id: string, opts: { rebuild?: boolean }): Promise<FinishOutcome>;
}

export interface Deps {
  settings: Settings;
  store: Store;
  embeddings: EmbeddingClient;
  vision: VisionClient;
  now: () => Date;
  randomBytes: (n: number) => Uint8Array;
}

export type AppInput =
  | { ok: true; deps: Deps }
  | { ok: false; problems: { setting: string; reason: string }[] };

/** What `createApp` returns: a Fetch-API handler for `Deno.serve`. */
export interface FetchApp {
  fetch(request: Request): Promise<Response>;
}

/** The command-upload instructions returned by `attach_file` (contracts/mcp-tools.md). */
export interface UploadInstructions {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
}

/** A file's details as declared, before validation. */
export interface DeclaredFile {
  name: string;
  type: string;
  size: number;
}

/** An opened PDF (`openPdf`). */
export interface PdfDoc {
  pageCount: number;
  pageTexts(): Promise<string[]>;
}

/** One passage of a PDF, with its first and last page (1-based). */
export interface Passage {
  text: string;
  pages: [number, number];
}
