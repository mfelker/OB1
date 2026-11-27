# Research: Thought attachments (spec 007)

Each item records the decision, why, and what else was considered. "Probed" means run during planning, with evidence under `evidence/`. "Read" means taken from a primary source.

## R1: Inline processing fits Supabase Cloud's limits at the default caps (probed)

- **Decision**: keep the spec's defaults (PDFs ≤ 25 MB and ≤ 50 pages; images ≤ 10 MB) as configurable settings. The binding limit is Cloud's **2 s of CPU per request**; wall time (150 s on Free, 400 s on paid plans) and memory (256 MB) are not binding at these caps.
- **Evidence** (`evidence/spike/cloud-results.txt`): on a Free-plan project (us-east-2) running unpdf, chunking to 1,500 characters, SHA-256 per passage and simulated handling of 1536-number embeddings:
  - dense 50 pages (350 passages): 0.81–0.95 s warm;
  - 50 pages padded to 24.3 MB: 0.92–1.02 s warm, 2.0 s cold;
  - 100 pages (700 passages): 1.62 s, with one `546 WORKER_RESOURCE_LIMIT` in 3 runs;
  - 10 pages: 0.18–0.20 s.
  The same code ran about 3× faster on the owner's Mac.
- **Reading**:
  - CPU follows text volume, not file size; `unpdf` never decodes the padding or images when extracting text. A dense 50-page PDF uses about half the CPU budget, leaving room for the database write.
  - The sample pages are deliberately dense (about 10,000 characters each), so real manuals cost less.
- **Not measured**: real embedding calls (the spike simulated their CPU-side JSON work), the database write, a real vision call, and a real image-heavy manual. **SC-004 is evidenced, not met.** It is checked again on the live Cloud run with a real manual and real models (tasks).
- **Alternatives**:
  - a cap on extracted characters instead of pages. Rejected: it can only be known after the CPU has been spent extracting, while the page count is known after opening the file (3–97 ms).
  - 100 pages. Rejected: it is at the limit (R1 evidence).

## R2: PDF text with `unpdf` 2.2.3 (probed)

- **Decision**: use `npm:unpdf@2.2.3` (MIT): open the document, read its page count before extraction (for the cap), then extract text per page.
- **Why**: runs unchanged on the Cloud runtime and on the self-hosted `edge-runtime:v1.79.2` (both probed); it bundles a serverless pdf.js; its license is compatible with FSL-1.1-MIT.
- **Scanned detection**: a PDF whose extracted text averages under a small number of non-space characters per page (a setting, default 20) is `scanned` (FR-010).
- **Alternatives**: `punpdf` (a fork with better reading order), deferred until real manuals show the reading order hurts search; a hand-rolled pdf.js build, more upkeep for no gain.

## R3: Embeddings match the brain and are sent in batches

- **Decision**:
  - An OpenAI-compatible `/embeddings` endpoint, configured with the **same setting names spec 004 and 006 use**: `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`. When they are unset, the core Cloud defaults apply: OpenRouter, `openai/text-embedding-3-small` and `OPENROUTER_API_KEY` (read: upstream `server/index.ts`, ~line 54).
  - Passages are embedded in batches, an array input of up to `EMBEDDING_BATCH_SIZE` (default 64).
  - Before writing, the integration compares the returned vector length with the dimension of `thoughts.embedding`, read from the database (FR-007).
- **Why**:
  - 350 passages sent one request each would spend most of the wall time on round trips;
  - batching is part of the OpenAI embeddings interface;
  - reading the column's dimension catches a brain built at a different size, such as 768.
- **Unverified**: that OpenRouter's embeddings route accepts an array input; the core sends one input per request. It is checked on the live Cloud run. The fallback is a batch size of 1 (a setting), slower but correct.

## R4: Captions from an OpenAI-compatible vision endpoint

- **Decision**:
  - `VISION_API_BASE`, `VISION_API_KEY` and `VISION_MODEL`, a chat-completions request with the image as a base64 `data:` URL.
  - README defaults: self-hosted Ollama `qwen2.5vl:7b`; Cloud, any OpenRouter vision model the owner chooses.
  - The prompt asks for a plain description of visible objects, places, labels and text that helps later search.
- **Why**:
  - Ollama documents base64 `image_url` data URLs on its OpenAI-compatible API (read: docs.ollama.com/api/openai), as do vLLM and others;
  - a data URL needs no network path from the model server back to Storage (R6);
  - a 10 MB image encodes to a 13.3 MB request in about 70 ms on Cloud (probed).
- **Unverified**: `qwen2.5vl:7b` on Ollama with this exact request, checked on the live self-hosted run.
- **Alternatives**: a signed Storage URL as `image_url`, which needs the model server to reach Storage and fails for host Ollama on 006 behind `localhost`; reusing the chat model, rejected in the Q4 decision.

## R5: Where the phone upload page lives (probed and read; owner decision)

- **Decision**: one static file, `upload-page.html`, in the integration folder.
  - **Self-hosted**: the function serves it itself.
  - **Cloud**: the owner publishes it once to any static host, and the integration hands out that address (`UPLOAD_PAGE_URL`).
- **Evidence**:
  - The self-hosted runtime serves `text/html`, XHTML and SVG unchanged (probed against the runtime directly, not through 006's gateway; the gateway check is part of the self-hosted live run).
  - Cloud rewrites a `GET` returning `text/html` to `text/plain`; since 2024-10-02 it allows XHTML only with the paid Custom Domain add-on, and the same applies to Storage (read: supabase.com/docs/guides/functions/http-methods; supabase.com/changelog/29633).
- **Safety**:
  - The page carries no secrets. The one-time token travels in the link's `#fragment`, which browsers never send to the page's host.
  - The page's API address is **fixed in the published file**, never taken from the link, so a crafted link cannot send a photo elsewhere.
  - The page's routes accept only a valid token, and answer CORS only for the configured page origin.
- **Alternatives**: requiring a custom domain on Cloud (a monthly cost for phone upload); an SVG page (undocumented, and Supabase closes these one by one).

## R6: Links must use an address the phone can reach (read and probed)

- **Decision**: a setting `PUBLIC_BASE_URL`. Every signed link and page link the integration returns is rewritten from the internal Supabase address to it. When unset, `SUPABASE_PUBLIC_URL` is used, then `SUPABASE_URL`.
- **Why**:
  - Self-hosted functions see `SUPABASE_URL=http://api-gw:8000` (internal), and `SUPABASE_PUBLIC_URL` defaults to `http://localhost:8000`, which 006's setup leaves unchanged (read: official `docker/docker-compose.yml` and `.env.example` at `self-hosted/v0.8.5`).
  - A phone given `localhost` reaches itself.
  - The owner's iPhone reached the Mac at its tailnet address, but its LAN address hung under Tailscale (probed).
  - On Cloud, `SUPABASE_URL` is already public, so no setting is needed.
- **README**: on 006, set `PUBLIC_BASE_URL` to an address the phone can reach (the Mac's LAN or tailnet address); remote access beyond that is fork issue #29.

## R7: Phone photos arrive as JPEG (probed on the owner's iPhone)

- **Decision**:
  - The page's file input accepts `image/jpeg,image/png,image/webp,application/pdf`.
  - The integration identifies the type from the file's first bytes, never from its name or declared type, and refuses HEIC with the "share as JPEG" message (FR-003, FR-004).
- **Evidence** (`evidence/phone-format/`): with the camera set to High Efficiency (HEIC), iOS Safari delivered real JPEG bytes for all three `accept` variants, including `image/*`.
- **Consequence**: SC-008's photo taken with the phone's default camera settings works without conversion code. Android and future iOS behaviour stay covered by content sniffing.

## R8: The 60-minute upload window is the integration's own

- **Decision**: each attachment records an upload deadline (default 60 minutes, FR-001):
  - a signed upload link is created only while that deadline has not passed;
  - finishing refuses an object that Storage recorded as created after the deadline.
  - The page's token is a random value with its own deadline, stored only as a hash.
- **Why**: Storage's signed upload links are always valid for 2 hours and cannot be shortened (read: supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl), so the direct-command link would otherwise outlive the 60 minutes.

## R9: Derived thoughts are written all-or-nothing, never merged

- **Decision**:
  - Derived thoughts are written by the integration's own database function in **one transaction**. It inserts rows into `thoughts` with the same normalised `content_fingerprint` as the base `upsert_thought`, and a conflict is an error, never a merge.
  - A rebuild deletes the attachment's old derived thoughts (scoped by attachment id) and inserts the new set in that same transaction.
- **Why**:
  - the base `upsert_thought` merges metadata into any existing row with the same fingerprint (VP-004), which would break FR-022;
  - the source line (FR-025) makes derived text unique, so a conflict signals a real problem;
  - one transaction gives FR-011 (nothing left from a failed attempt) and Round 2 Q1 (old thoughts kept until the new set is complete).
- **Alternatives**: one `upsert_thought` call per passage (merges, and is not atomic); writing through PostgREST row by row (not atomic).

## R10: One operation at a time through an expiring busy mark

- **Decision**:
  - Finish and remove first claim the attachment with a single conditional update that sets an operation name and an expiry, and that succeeds only if no unexpired claim exists (FR-026).
  - The expiry defaults to **160 s**: just over Cloud Free's 150 s wall clock and the self-hosted 150 s idle timeout. Paid-plan Cloud owners raise it to 410 s.
- **Why**: a conditional update is atomic in Postgres without holding locks across a long call; an expired claim makes a killed run recoverable (Round 2, Q2).

## R11: The thought lookup is safe from filter injection

- **Decision**:
  - `find_thought` searches by meaning through the base `match_thoughts` function (with the brain's embedding);
  - it searches by exact text through the integration's own database function, which takes the text as a parameter.
  - It returns id, first line and capture date (FR-023).
- **Why**: building a PostgREST filter string from user text is the injection class reported upstream for the CRM and household extensions (upstream PR 411); a parameter avoids it.

## R12: One bucket, default `ob1-files`

- **Decision**:
  - Use the bucket named by `ATTACHMENTS_BUCKET`, default `ob1-files`: the private bucket spec 006 already creates for this feature (006 FR-009).
  - Setup creates it if missing, as **private**, limited to the accepted MIME types and the largest size cap.
  - Files are stored under `attachments/<attachment id>/<base name>`.
- **How**: `schema.sql` inserts the bucket row into `storage.buckets` with `on conflict do nothing`, and only when the `storage` schema exists. Fork CI's test database has no `storage` schema, so `verify.sql` checks the bucket only when it exists.
- **Why**: on 006 the bucket exists, and on Cloud setup creates it; one name everywhere keeps 008's backups simple.

## R13: Access

- **Decision**:
  - The MCP route accepts the brain's `MCP_ACCESS_KEY`, as the `x-brain-key` header or `?key=` (as the core does), compared in constant time (as upstream `smart-ingest` does).
  - The page routes accept only a page token.
  - Deploy with `--no-verify-jwt`, as the core does (`docs/01-getting-started.md` ~line 470).
- **Why**: the same key model as the core keeps one secret per brain (FR-018); the page cannot hold the brain key (FR-002).

## R14: Running on spec 006's stack

- **Decision**:
  - The README's self-hosted path adds the integration with the owner's own `docker-compose.override.yml` next to 006's recipe. It mounts `integrations/thought-attachments` into the functions service and passes 007's settings.
  - This is the pattern 006's README already documents for extra functions (README line 169).
  - No 006 file changes on 007's branch (constitution Principle V).
- **Why**: 006 passes only the settings it lists to functions, so new settings need an override. Folding the mount into 006's recipe is a later 006 change.

## R15: Tests run with no network

- **Decision**:
  - Deno tests in `integrations/thought-attachments/tests/` call the app's request handler directly, with Storage, embeddings, vision and the database replaced by fakes.
  - SQL behaviour (the table, grants, RLS, the write, claim and lookup functions) is checked by `tests/verify.sql` on fork CI's throwaway Postgres with pgvector.
  - Small sample PDFs are generated at test time with `pdf-lib` (MIT), so no binary fixtures are committed.
- **Why**: fork CI runs `deno test` without network permission and SQL through `tests/verify.sql` after `bootstrap.sql` (read: `.fork/ci/README.md`).

## R16: The duplicate rule needs the core's `content_fingerprint` step

- **Decision**:
  - `schema.sql` adds `thoughts.content_fingerprint` and its partial unique index with `if not exists`, exactly as core guide step 2.6 does (`docs/01-getting-started.md` ~lines 191–196). This is a no-op on a brain that already followed the guide.
  - The integration's write function (R9) relies on that index.
- **Why**: fork CI's `bootstrap.sql` creates `thoughts` without that column (read: `.fork/ci/sql/bootstrap.sql`), and some brains may predate step 2.6. Adding a column is allowed by constitution Principle I and CLAUDE.md. Existing columns are never altered.
