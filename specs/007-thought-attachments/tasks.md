---

description: "Tasks for thought attachments (spec 007), structured for parallel Sonnet-class stream agents coordinated by an integrator"
---

# Tasks: Thought attachments (files linked to thoughts)

**Input**: Design documents from `specs/007-thought-attachments/`

**Prerequisites**: plan.md, spec.md (US1–US5, FR-001–FR-028, SC-001–SC-020), research.md (R1–R17), data-model.md, contracts/mcp-tools.md, contracts/upload-page.md, contracts/settings.md, quickstart.md (scenarios 1–13)

**Tests**: MANDATORY (constitution Principle IV, upstream-bound lane: red-green-refactor). This feature runs through the installed spec-kit-tdd loop:

- After this file is written, the `after_tasks` hook (`tdd.plan`) writes `tdd/test-list.md` and adds the `[U#]`/`[A#]` behavior markers to these tasks. **Never tick a marked task by hand.** The integrator ticks it when all of its behaviors are `DONE`.
- One behavior per cycle:
  1. Write the test first, named with its behavior id prefix (`"U7 …"`, `"A3 …"`).
  2. **Watch it fail for the right reason**, and record the decisive failure line.
  3. Make the smallest change that turns it green.
  4. Run the full suite.
  5. Refactor.
- Never commit on red. Commit at green, with test and implementation together, one cycle per commit. Never weaken a test.
- A test that passes on its first run gets a deliberate mutant (the playbook rule), and that is recorded.
- **Streams run `deno test` directly in their own worktree**, from `integrations/thought-attachments/`:
  - single: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. The slashes are required: an unslashed filter is a literal substring, matches **zero tests and still exits ok**. Every single run must report exactly `1 passed` or `1 failed`. A `0 passed | 0 failed` run proves nothing and is never recorded.
  - full: the same command without `--filter`.

  These are fork-ci's flags. There is **no `--allow-net`**, so Storage, the database, embeddings and vision are always injected fakes (research R15). Streams never use `tdd.mjs`, which resolves the plan's Worktree `W` rather than the stream's tree. The integrator uses the profile commands in `W`.
- **SQL behaviors** live in `tests/verify.sql`. `tdd.mjs single` doesn't support SQL (exit 4), so a SQL cycle adds one assertion block and runs the whole file with `psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` from the folder, through the local SQL runtime set up by T004 (spec 006's T069 recipe). Record the decisive `ERROR:` or `raise exception` line as the red.

**Single writers**:

- `tasks.md`, `tdd/test-list.md` and `tdd/cycle-log.md` live only on fork `main` (`M`), never on a `contrib/` branch (Principle V). Only the integrator (the main session) edits them.
- Each stream appends its cycle entries to **`M/specs/007-thought-attachments/tdd/cycle-log.d/<stream>.md`**, an absolute path outside its worktree. That is the only `M` file a stream writes, and it reports which behaviors are `DONE`.

**Stream agents**: each stream is one Sonnet subagent (`Agent` with `model: "sonnet"`). Its brief contains:

- its worktree, branch and task IDs
- the TDD rules above, the single-writer rule and the **Seams** section
- the contract, data-model and research sections its tasks cite

A stream edits only the files listed for it in the ownership table. It never edits `src/types.ts`, `src/settings.ts`, `src/links.ts`, `deno.json` or `tests/helpers/*` (except a helper the table gives it). If a seam must change, the stream stops and reports to the integrator.

**Rules every stream brief must repeat**:

- **Working directory**: the shell resets to `M` after every tool call. Start every command with `cd <stream worktree> &&`, or use `git -C <stream worktree>`. **Never run git in `M`.** The stream writes its `cycle-log.d/<stream>.md` with the file tools and never stages or commits it.
- **Design documents are read-only, at absolute paths**: the stream worktree has no `specs/`. Every citation here (`data-model.md` …, `contracts/…`, `research.md` R…, `tdd/test-list.md`) means `/Users/mfelker/Projects/ob1/specs/007-thought-attachments/<file>`.
- **Commit messages**: `[integrations] <behavior id>: <short description>`. These commits go into the upstream PR, so a stream branch never uses `[fork]`.
- **No live services, no secrets**: never call a real endpoint, never write a real key, and use only the placeholder values from `tests/helpers/env.ts`.
- **Contracts state behavior, not implementation**: build only what a failing test demands.

## Path Conventions

- `M` = `/Users/mfelker/Projects/ob1`: the fork-`main` checkout. Every `/speckit-*` command and every `specs/` edit happens here.
- `W` = `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`: the integration worktree on `contrib/mfelker/thought-attachments`, cut from `upstream/main` (plan **Worktree**). It is the only branch that becomes the upstream PR.
- `F` = `W/integrations/thought-attachments`: the contribution folder. **Inside a stream, `F` means that stream's own copy**: `/Users/mfelker/Projects/ob1/.worktrees/ta-<stream>/integrations/thought-attachments`.
- Stream worktrees: `/Users/mfelker/Projects/ob1/.worktrees/ta-<stream>` on local branches `contrib/mfelker/thought-attachments-<stream>`, cut from `contrib/mfelker/thought-attachments`. Use a hyphen, never `/<stream>`: a ref can't be both a branch and a directory.
- Core parity reference: `W/server/index.ts` and `W/docs/01-getting-started.md` (upstream at T001).

## Streams and file ownership

All paths are relative to `F`.

| Stream | Worktree | Wave | Owns (and only these) |
|--------|----------|------|------------------------|
| Q (data: SQL + adapter) | `ta-data` | 1 | `schema.sql`, `tests/verify.sql`, `src/store.ts`, `tests/store_test.ts`, `tests/schema_drift_test.ts` |
| X (files: intake + extraction + derived content) | `ta-files` | 1 | `src/intake.ts`, `src/pdf.ts`, `src/passages.ts`, `src/derived.ts`, `tests/intake_test.ts`, `tests/pdf_test.ts`, `tests/passages_test.ts`, `tests/derived_test.ts` |
| E (model clients) | `ta-models` | 1 | `src/embeddings.ts`, `src/vision.ts`, `tests/embeddings_test.ts`, `tests/vision_test.ts` |
| D (docs) | `ta-docs` | 1 | `README.md` |
| N (finishing) | `ta-finish` | 2, after Q, X and E merge | `src/finish.ts`, `tests/finish_test.ts` |
| T (tools) | `ta-tools` | 2, after Q, X and E merge | `src/tools.ts`, `tests/tools_test.ts` |
| P (phone page) | `ta-page` | 2, after Q, X and E merge | `upload-page.html`, `src/page_routes.ts`, `tests/page_routes_test.ts`, `tests/page_script_test.ts`, `tests/helpers/page_dom.ts` |
| A (app + entry) | `ta-app` | 3, after N, T and P merge | `src/app.ts`, `index.ts`, `tests/app_test.ts`, `tests/imports_test.ts`, `tests/acceptance_test.ts` (only to flip `todo` → `Deno.test`) |

- Each stream also writes `M/specs/007-thought-attachments/tdd/cycle-log.d/<stream>.md`.
- Wave 1 runs four agents at once, wave 2 three, and wave 3 one, because `createApp` composes everything.
- **Why Q owns both SQL and its TypeScript caller**: the database function names, parameters and return shapes are then a private detail of one stream. `tests/schema_drift_test.ts` (deno, `--allow-read`) checks every RPC name and parameter that `src/store.ts` sends against `schema.sql`, so a mismatch fails in CI rather than on the live run.
- N, T and P run in parallel because tools and page routes reach finishing only through the injected `Services.finish` (Seams). Their tests use a scripted finish; A composes the real one.
- D runs in wave 1 because the README depends only on the design documents. The live runs fill in its "Tested with" values later (T080).
- The integrator owns `deno.json`, `metadata.json`, `src/types.ts`, `src/settings.ts`, `src/links.ts`, `tests/settings_test.ts`, `tests/links_test.ts`, `tests/helpers/*` (except `page_dom.ts`) and the todo form of `tests/acceptance_test.ts`.

## Seams (written by the integrator in T006–T011, frozen during the waves)

> **As built (T006 `a9a734d`, T007 `1b23b46`, T010 `d8e30fe`):** `F/src/types.ts` is now the authoritative seam. It adds to the list below:
> - `DerivedRow.embedding: number[]` (FR-007);
> - the types `NewAttachment`, `Declaration`, `OrphanReason`, `SensitivityTier`, `ExpectedKind`, `FetchApp`, `UploadInstructions`, `DeclaredFile`, `PdfDoc` and `Passage`;
> - concrete parameters where this list says `…`.
>
> Conventions: `Settings` fields are camelCase, and `AttachmentRow` fields are snake_case (data-model.md). `findByHash` may return the caller's own row, so callers compare ids. The store returns rows as stored; **the reading layer** (stream T's tools and stream N's finisher) reports an expired `finish` claim as `failed` "the run did not finish", from `busy_op` and `busy_until` (data-model.md states). `unpdf` is pinned at 2.2.2 (`10c67a7`), because 2.2.3 was inside Deno 2.9.8's 24-hour minimum dependency age.
>
> **From stream X (merged `bf285d9`), binding on wave 2:**
> - **Refusal `code` values** used by `intake.ts`: `unsupported_type`, `too_large`, `heic`, `wrong_type`, `wrong_size` and `too_many_pages`. Tools and page routes pass them through unchanged.
> - `checkActual(row, bytes, info, settings)` reads `row.page_count` and skips the page check when it is null, so **the finisher (stream N) sets `page_count` from `openPdf` before calling `checkActual`**.
> - `importer_version` is the constant `"0.1.0"`, matching `metadata.json`; bump both together.
> - `fingerprint` uses JS `\s` and `toLowerCase`; stream Q's SQL normalisation test (T015) is the cross-check.

Streams code against these. The signatures are the only shared contract. Behavior comes from the cited contract and data-model sections.

- **Imports**: every source file uses a full `npm:`/`jsr:` specifier, never a bare name. The self-hosted router ignores a function's own `deno.json` import map (spec 004 `research.md` R10). `deno.json` stays for Cloud bundling and for fork-ci's deno detection.
- `src/types.ts`:
  - `GetEnv = (name: string) => string | undefined`
  - `Settings`: one field per row of contracts/settings.md. `SettingsResult = { ok: true; settings: Settings } | { ok: false; problems: { setting: string; reason: string }[] }`
  - `AcceptedType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp"`. `AttachmentState = "pending_upload" | "processed" | "scanned" | "not_captioned" | "failed" | "refused"`. `BusyOp = "finish" | "rebuild" | "remove"`
  - `AttachmentRow`: one field per `data-model.md` `thought_attachments` column
  - `R<T> = { data: T } | { error: string }`. `Refusal = { code: string; message: string }`
  - `ThoughtMatch { id; first_line; captured }`
  - `DerivedRow { content; fingerprint; metadata }`. `StatePatch`: the subset of `AttachmentRow` that finishing sets
  - `Store`, every method async and returning `R<…>`:
    - thoughts: `thoughtExists(id)`, `insertNote(content, embedding, metadata) → { id; created }`, `matchThoughts(embedding, limit) → ThoughtMatch[]`, `findThoughtsExact(text, limit) → ThoughtMatch[]`, `embeddingDimension() → number`
    - attachments: `createAttachment(fields) → AttachmentRow`, `getAttachment(idOrShortId) → AttachmentRow | "not_found" | "ambiguous"`, `findPending(parentId, name, type, size, now) → AttachmentRow | null` (an expired `pending_upload` doesn't count), `findByHash(parentId, contentHash) → AttachmentRow | null` (a non-refused attachment with those bytes, T005 Q4), `setDeclaration(id, decl)`, `listByParent(parentId)`, `attachmentForDerived(thoughtId)`, `orphans(now) → { row; why }[]`, `attachmentForPageToken(hash)`, `consumePageToken(id, hash) → boolean`
    - claims and writes: `claim(id, op, seconds) → { token } | { busy: BusyOp }`, `release(id, token)`, `writeDerived(id, token, rows: DerivedRow[], patch: StatePatch)`, `setState(id, token, patch)`, `removalPreview(id) → { derived; noteWouldGo }`, `removeAttachment(id, token) → { derived; noteRemoved }`
    - Storage: `signUpload(path) → { url; token }`, `objectInfo(path) → { size; createdAt } | null`, `download(path) → Uint8Array`, `deleteObject(path)`, `signDownload(path, seconds) → string`
  - `EmbeddingClient { embed(texts: string[]): Promise<R<number[][]>> }`. `VisionClient { configured: boolean; caption(bytes, type): Promise<R<{ text; model }>> }`
  - `FinishOutcome { state; reason?; derived_count; caption?; page_count?; busy?: BusyOp; last_rebuild_error? }`. `Services { finish(id, opts: { rebuild?: boolean }): Promise<FinishOutcome> }`
  - `Deps { settings; store; embeddings; vision; now: () => Date; randomBytes: (n: number) => Uint8Array }`
  - `AppInput = { ok: true; deps: Deps } | { ok: false; problems: { setting: string; reason: string }[] }`. `createApp(input)` answers every MCP call and page route with the named settings error when `ok` is false (T005 Q3), and `productionDeps()` returns an `AppInput`.
- Stub exports (each throws `new Error("not implemented")` until its stream replaces it):
  - `settings.ts`: `loadSettings(getEnv)`. `links.ts`: `publicUrl(settings, url)`, `pageLink(settings, token)`, `curlLine(upload, filePath)`
  - `intake.ts`: `baseName(name)`, `checkDeclared(decl, settings)`, `sniffType(bytes)`, `checkActual(row, bytes, info, settings)`
  - `pdf.ts`: `openPdf(bytes)` → `R<{ pageCount; pageTexts(): Promise<string[]> }>`, `isScanned(pageTexts, settings)`
  - `passages.ts`: `toPassages(pageTexts, sourceLineFor, settings)` → `{ text; pages: [number, number] }[]`
  - `derived.ts`: `sourceLine(fileName, locator, shortId)`, `fingerprint(content)`, `passageRow(…)`, `captionRow(…)`, `noteMetadata(now)`
  - `embeddings.ts`: `createEmbeddingClient(settings, fetch)`. `vision.ts`: `createVisionClient(settings, fetch)`
  - `store.ts`: `createSupabaseStore(url, serviceRoleKey, settings, fetch)`
  - `finish.ts`: `createFinisher(deps)` → `Services`
  - `tools.ts`: `buildServer(deps, services)`. `page_routes.ts`: `pageRoutes(deps, services)` (a Hono sub-app)
  - `app.ts`: `createApp(input: AppInput)`, `productionDeps(): AppInput`
- `tests/helpers/` (integrator):
  - `fake_fetch.ts`: a scripted `fetch`. Routes are keyed by method and URL. It records every request (URL, method, headers, parsed body). A route can reply with a status and body, throw a network error, hang until its `AbortSignal` fires, or hold its reply until released. It also has embedding and vision responders: a deterministic vector of a chosen length per input text, and a scripted caption.
  - `fake_store.ts`: an in-memory `Store`.
    - Thought rows carry `content_fingerprint` with `upsert_thought`'s normalisation (VP-004) and a unique fingerprint.
    - Attachment rows follow data-model.md. Claims expire by the injected clock and check the claim token.
    - `writeDerived` and `removeAttachment` are all-or-nothing, and a fingerprint conflict is an error, never a merge.
    - Storage objects carry bytes and `createdAt`.
    - It records calls. Failure can be injected per method, and a method can be held until released.
  - `clock.ts`: a settable clock for `Deps.now`.
  - `fixtures.ts`: text PDFs with given page texts, generated with `pdf-lib` at test time (R15); an image-only PDF (scanned); corrupt PDF bytes; minimal JPEG, PNG, WebP and HEIC byte headers; buffers of a chosen size. No binary fixture is committed.
  - `env.ts`: a baseline environment with placeholder values only.
  - `mcp.ts`: `mcpCall(fetchFn, method, params, key)` (a JSON-RPC `Request` for `app.fetch`) and `inMemoryClient(server)` (the SDK `Client` over `InMemoryTransport`).
  - `todo.ts`: `todo(name, fn)` registers `Deno.test({ name, ignore: Deno.env.get("RUN_TODO") !== "1", fn })`. Reds are recorded with `RUN_TODO=1`.

---

## Phase 1: Setup (integrator, in `M` then `W`)

**Purpose**: the branch, the worktree, the empty folder and the local SQL runtime.

- [X] T001 In `M`, create `W`:
  1. `git fetch upstream`. Note `upstream/main`'s SHA (`238df6c` at planning).
  2. `git worktree add .worktrees/contrib-thought-attachments -b contrib/mfelker/thought-attachments upstream/main`. Do **not** use the `speckit.worktree.create` hook (plan Complexity Tracking).
  3. If upstream moved past `238df6c`, check that `W/server/index.ts` (VP-001–VP-003), `W/server/deno.json`, `W/docs/01-getting-started.md` step 2.6 (VP-004, R16), `W/docs/ingestion-metadata-contract.md` and `W/integrations/_template/` are unchanged. Also search `W` for any new attachment or file feature (plan Lane). If anything changed, stop and re-plan.
- [X] T002 In `M`, confirm `specs/007-thought-attachments/tdd/test-list.md` and the baseline `tdd/cycle-log.md` exist (written by the `after_tasks` hook). Create `specs/007-thought-attachments/tdd/cycle-log.d/.gitkeep`, then commit on fork `main` (`[fork] Spec 007: test list`).
- [X] T003 Scaffold `F` from `W/integrations/_template/`:
  - `F/metadata.json` with real values: name, description, `category: "integrations"`, author `mfelker`, `requires.open_brain: true`, `requires.services` (Supabase Storage, an embedding endpoint, a vision endpoint), tags, difficulty, a placeholder `estimated_time` until T080, dates. Validate it against `W/.github/metadata.schema.json`.
  - `F/README.md`: section headings only (stream D fills it).
  - `F/deno.json`: the five `server/deno.json` imports at the same versions, plus `unpdf` 2.2.3, `pdf-lib` 1.17.1 and **exact** versions of `@std/encoding` and `@std/assert` (chosen: `@std/encoding` 1.0.11 and `@std/assert` 1.0.19; scaffold commit `415ccf9`); `"lock": false`; a `test` task with fork-ci's flags (plan Technical Context).

  Commit in `W`: `[integrations] Scaffold thought-attachments`.
- [X] T004 Local SQL runtime, per spec 006's T069 recipe (`M/specs/006-self-hosted-supabase/tdd/cycle-log.md`, "T069 Finding 9"):
  - container `ob1-007-pgtest` from `pgvector/pgvector:pg17`, no bind mount
  - a `psql` wrapper outside the repo that copies the caller's directory into the container on every call
  - `.fork/ci/sql/bootstrap.sql` applied once

  Record the recipe, including the wrapper's path, at the top of `M/specs/007-thought-attachments/tdd/cycle-log.md`, so stream Q's brief can point to it. Then check `node M/.fork/ci/bin/tdd.mjs where` resolves `W` and `F`.

---

## Phase 2: Foundational (integrator, blocking)

**Purpose**: seams, settings, links, fakes and the outer loop. **No stream starts before T013.**

- [X] T005 Owner decisions, **asked one question at a time** (say how many remain). Record each answer in `M/specs/007-thought-attachments/spec.md` Clarifications and the contract it affects, then commit on fork `main`. Each one must be answered before the task named, and all six before T013:
  1. Before T008: how `BUSY_SECONDS` picks "160 on Supabase Cloud, 410 elsewhere" (contracts/settings.md), with no platform signal named.
  2. Before T008: how `UPLOAD_PAGE_URL`'s default `<function URL>/upload` is built (from `PUBLIC_BASE_URL` plus `/functions/v1/<name>`?), and the function's name.
  3. Before T008: whether a bad setting value (`MAX_PDF_PAGES=abc`, `0`) is a named error or falls back to the default, and whether the MB caps accept decimals.
  4. Before T013 (it affects T015 and T026): the `finish_attachment` outcome when the uploaded bytes duplicate another attachment's `content_hash` on the same parent, where the unique index of `data-model.md` `thought_attachments.content_hash` refuses the second one (US1 #3, FR-012).
  5. Before T013 (it affects T043): whether `/page/finish` uses up its token when finishing is refused as busy. If it does, the page can't retry, which conflicts with "retries" in FR-026 and quickstart scenario 8.
  6. Before T013 (it affects T044 and stream D's T047): how the copy of `upload-page.html` that the function serves on self-hosted gets its API address, given that the address is "written in the file" (R5).
- [X] T006 Write the seams in `F/src/types.ts` and the throwing stubs in `F/src/{settings,links,intake,pdf,passages,derived,embeddings,vision,store,finish,tools,page_routes,app}.ts`, exactly as listed under **Seams**. Write `F/index.ts` as the one-line entry, `Deno.serve(createApp(productionDeps()).fetch)`. Use full specifiers only. Run `deno check` on every file, then commit.
- [X] T007 Write `F/tests/helpers/{fake_fetch,fake_store,clock,fixtures,env,mcp,todo}.ts` per **Seams**. Commit.
- [X] T008 [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] [U10] [U11] [U12] [U13] [U15] [U16] [U17] [U18] [U19] [U308] [U309] [U310] [U355] [U356] Tests first in `F/tests/settings_test.ts`, then `loadSettings(getEnv)` in `F/src/settings.ts`, covering every row of contracts/settings.md:
  - each default
  - `EMBEDDING_API_KEY` falls back to `OPENROUTER_API_KEY` (R3)
  - `PUBLIC_BASE_URL` falls back to `SUPABASE_PUBLIC_URL`, then `SUPABASE_URL` (R6)
  - `BUSY_SECONDS` per T005.1, and bad values per T005.3
  - `MCP_ACCESS_KEY` is required
  - `VISION_*` unset means vision is not configured (FR-006)
  - no setting value appears in any problem's reason (FR-009)

  FR-017, R10, R13.
- [X] T009 [U20] [U21] [U22] [U23] [U24] Tests first in `F/tests/links_test.ts`, then `F/src/links.ts`:
  - `publicUrl` rewrites the internal Supabase origin of a signed link to `PUBLIC_BASE_URL` and keeps its path and query (R6)
  - `pageLink` is `UPLOAD_PAGE_URL#t=<token>`, with the token only in the fragment (contracts/upload-page.md "The link")
  - `curlLine` is a ready-to-run `PUT` with the returned headers (FR-002a) and contains no brain key
- [X] T010 Harness proof in `F/tests/helpers/helpers_test.ts`, under **fork-ci's exact flags**, before any stream builds on it:
  - every npm and jsr import loads
  - `unpdf` reads the page count and the per-page text of a `pdf-lib`-generated 3-page PDF (R2, R15)
  - `crypto.subtle` SHA-256 of a buffer
  - supabase-js `createClient(url, key, { global: { fetch: fake } })` sends an RPC and a Storage `createSignedUploadUrl` request to the fake fetch
  - a throwaway `McpServer` behind Hono and `StreamableHTTPTransport` answers `initialize`, `tools/list` and `tools/call` through `app.fetch` via `mcpCall`, and `inMemoryClient` lists the same tool
  - the fake fetch's hang-until-abort and hold modes
  - `--filter "/^<name> /"` on this file runs exactly one test

  Commit.
- [X] T011 [U25] [U26] [U27] [U28] [U29] [U30] [U31] [U32] [U33] [U311] [U312] [U313] Fake-store self-tests in `F/tests/helpers/fake_store_test.ts`. The fake re-implements database semantics that acceptance tests rely on, so each rule gets its own test:
  - a claim is refused while unexpired, naming the running operation
  - a claim succeeds after its expiry by the clock
  - a write with a stale or foreign claim token is refused
  - `writeDerived` failing partway leaves the old set and state unchanged
  - a fingerprint conflict with an existing thought is an error and leaves that thought unchanged
  - `removeAttachment` removes only that attachment's rows, plus the note under the FR-016 exception
  - `orphans` lists a gone parent, an expired `pending_upload` and a `refused` row
  - `insertNote` with an existing fingerprint returns `created: false` (R17)

  The same rules are asserted against real SQL by stream Q (T015, T016, T038, T055, T061), so a fake that drifts shows up as a disagreement. Commit.
- [X] T012 [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] [A10] [A11] [A12] [A13] [A14] [A15] [A16] [A17] [A18] [A19] [A20] [A21] [A22] [A23] [A24] [A25] [A26] [A27] [A28] [A29] [A30] [A31] [A32] [A33] [A34] [A35] [A36] [A37] [A38] [A39] [A40] [A41] [A42] [A43] [A44] [A45] [A46] [A47] [A48] [A49] [A50] [A51] [A52] [A53] [A54] [A55] [A56] [A57] [A58] [A59] [A60] [A61] [A62] [A63] Outer loop first: write `F/tests/acceptance_test.ts` with every `[A#]` behavior from `tdd/test-list.md` as a `todo(...)` test. Each drives `createApp(input).fetch(new Request(…))` with `FakeStore`, the real embedding and vision clients over `fake_fetch`, `loadSettings` over `env.ts` and the fake clock. Each asserts the full observable result: JSON-RPC result text and structured fields, page-route status and JSON, fake-store rows and objects, and the fake-fetch request log. The acceptance set, by story:
  - **US1**: scenarios 1–4, SC-001 (each listed sample fact is in a passage whose source line names the file, page range and short id; the findability half is live), SC-009, SC-012, SC-016.
  - **US2**: scenarios 1–3 and 5–7, SC-002 (caption half), SC-010, SC-011, SC-015, SC-018; US2 #4's HEIC bytes refused with the "share as JPEG" message.
  - **US3**: scenarios 1–2, SC-003 (link lifetime and no link for `pending_upload`/`refused`; byte identity and real expiry are live).
  - **US4**: scenarios 1–3, SC-005, SC-013, SC-014, SC-017 (+20 min accepted, +65 min refused by the clock), SC-019; the edge cases "declared one type, uploaded another", "corrupt PDF", "no file uploaded", "dimension mismatch".
  - **US5**: scenarios 1–4, SC-020.
  - **Cross-cutting**: SC-007 (no signed link, key, token or absolute path in any fake row after a full run); FR-018 (wrong or missing key refused; page routes refuse the brain key); `tools/list` returns the 7 tools.

  Run with `RUN_TODO=1` and record each red (test name and decisive failure line) in `M/specs/007-thought-attachments/tdd/cycle-log.md`. Confirm the default run is green (all ignored). Commit in `W` (`[integrations] Acceptance tests as todo`) and in `M` (`[fork] Spec 007: acceptance reds`).
- [X] T013 From `M`, create the wave-1 stream worktrees: `git worktree add .worktrees/ta-<s> -b contrib/mfelker/thought-attachments-<s> contrib/mfelker/thought-attachments` for `s` ∈ {data, files, models, docs}. Brief and launch streams Q, X, E and D in one message (see **Parallel Example**).

**Checkpoint**: test list committed on `M`; the owner decisions recorded; seams, settings, links, fakes, harness proof and acceptance todos committed on `W`; four wave-1 worktrees exist.

---

## Phase 3: User Story 1 - Attach a service manual and find it later (Priority: P1) 🎯 MVP

**Goal**: a text-layer PDF attached to a thought becomes passage thoughts that the unchanged core search finds.

**Independent Test**: the US1 acceptance tests pass through `createApp`. Live: quickstart scenarios 1–3.

### Stream Q: data (`ta-data`, wave 1)

- [X] T014 [P] [US1] [U34] [U35] [U36] [U37] [U38] [U39] [U40] [U41] [U42] [U43] [U44] [U45] [U46] [U47] [U48] [U49] [U50] [U51] [U52] [U367] Tests first in `F/tests/verify.sql`, then `F/schema.sql` (fork-ci SQL runtime, after `bootstrap.sql`). Assert:
  - the table `thought_attachments` with every column, type, default and not-null rule of `data-model.md` `thought_attachments` (`thought_attachments.id`, `thought_attachments.parent_thought_id` with **no** foreign key, `thought_attachments.parent_created_here`, `thought_attachments.file_name`, `thought_attachments.declared_type`, `thought_attachments.declared_size`, `thought_attachments.expected_kind`, `thought_attachments.actual_type`, `thought_attachments.actual_size`, `thought_attachments.page_count`, `thought_attachments.content_hash`, `thought_attachments.storage_path`, `thought_attachments.sensitivity_tier`, `thought_attachments.state`, `thought_attachments.state_reason`, `thought_attachments.last_rebuild_error`, `thought_attachments.caption_model`, `thought_attachments.derived_count`, `thought_attachments.upload_deadline`, `thought_attachments.page_token_hash`, `thought_attachments.busy_op`, `thought_attachments.busy_until`, `thought_attachments.busy_token`, `thought_attachments.created_at`, `thought_attachments.updated_at` with its trigger, `thought_attachments.processed_at`)
  - the value rules that data-model.md states for `thought_attachments.declared_type`, `thought_attachments.expected_kind`, `thought_attachments.sensitivity_tier`, `thought_attachments.state` and `thought_attachments.busy_op`
  - the indexes on `parent_thought_id` and `content_hash`, and the partial unique `(parent_thought_id, content_hash)` index that excludes `refused` (FR-012)
  - RLS on with no `anon`/`authenticated` policy, and `service_role` select, insert, update and delete (FR-018, FR-020)
  - `thoughts.content_fingerprint` and `idx_thoughts_fingerprint` added only if missing, with no second index on a brain that has them (R16; `data-model.md` `Derived thought.content_fingerprint`)
  - when a `storage` schema exists, the bucket `ATTACHMENTS_BUCKET` (`ob1-files`) is private, limited to the four accepted MIME types and has no size limit of its own (R12); skipped when the schema is absent
  - the whole file runs twice on the same database
  - no `DROP`, `TRUNCATE` or unqualified `DELETE` in either file (CLAUDE.md guard rails)
- [X] T015 [P] [US1] [U53] [U54] [U55] [U56] [U57] [U58] [U59] [U60] Tests first in `F/tests/verify.sql`, then the write-derived function in `F/schema.sql` (`data-model.md` "Database functions"; R9, R10):
  - it succeeds only with the caller's unexpired claim token
  - it inserts rows with `upsert_thought`'s fingerprint normalisation (fork-ci's bootstrap has no `upsert_thought`, so the test compares against the expression in `docs/01-getting-started.md` step 2.6)
  - a fingerprint conflict raises, and the existing thought (an owner thought with identical text) is unchanged (US1 #4, FR-022)
  - it replaces the attachment's previous derived set and sets the state fields and `thought_attachments.derived_count` in one transaction
  - a failure partway leaves the old set (FR-011, FR-027)
  - the duplicate-content outcome per T005.4
- [X] T016 [P] [US1] [U61] [U62] [U63] [U64] [U65] [U66] [U67] [U68] [U314] Tests first in `F/tests/verify.sql`, then the claim and release, dimension and exact-text functions in `F/schema.sql`:
  - a claim is refused while unexpired, returning the running `thought_attachments.busy_op`
  - a claim succeeds after `thought_attachments.busy_until`, with a new `thought_attachments.busy_token` (FR-026, R10)
  - the dimension function returns `vector(1536)`'s 1536 on fork-ci's bootstrap (FR-007, R3)
  - the exact-text find takes the text as a parameter: a query containing `%`, `,`, `)` and `'` matches literally, and the function returns id, first line and date (FR-023, R11)
- [X] T017 [P] [US1] [U69] [U70] [U71] [U72] [U73] [U74] [U75] [U76] [U77] [U78] [U315] [U316] [U317] [U318] [U319] [U357] [U358] [U359] [U360] [U361] Tests first in `F/tests/store_test.ts`, then the database half of `createSupabaseStore` in `F/src/store.ts`: supabase-js with the fake fetch injected; each thought, attachment and claim method from **Seams** sends its RPC or PostgREST request; errors map to `{ error }` with no key in the text (FR-009). `matchThoughts` calls the base `match_thoughts` (R11). `getAttachment` accepts the 8-character short id and reports `not_found` and `ambiguous` (contracts/mcp-tools.md; `data-model.md` `thought_attachments.id`).
- [X] T018 [P] [US1] [U79] [U80] [U81] [U82] Tests first in `F/tests/store_test.ts`, then the Storage half of `F/src/store.ts`: `signUpload`, `objectInfo` (size and creation time), `download` and `deleteObject` on the bucket `ATTACHMENTS_BUCKET` at `attachments/<id>/<file_name>` (`data-model.md` `thought_attachments.storage_path`; R12). `signUpload`'s URL comes back unchanged; rewriting is `links.ts`'s job.
- [X] T019 [P] [US1] [U83] Tests first in `F/tests/schema_drift_test.ts`: every RPC name and named parameter that `F/src/store.ts` sends exists in `F/schema.sql` (read with `--allow-read`).

### Stream X: files (`ta-files`, wave 1)

- [X] T020 [P] [US1] [U113] [U114] [U115] [U116] [U117] [U118] [U119] [U120] [U121] [U320] Tests first in `F/tests/intake_test.ts`, then `baseName` and `checkDeclared` in `F/src/intake.ts`:
  - `baseName` keeps only the base name, without path parts or control characters (`data-model.md` `thought_attachments.file_name`; spec edge case; FR-009)
  - `checkDeclared` refuses a type outside the four accepted types (`data-model.md` `thought_attachments.declared_type`) and a size over the cap for its type, naming the cap and the declared size (`data-model.md` `thought_attachments.declared_size`; `MAX_IMAGE_MB`, `MAX_PDF_MB`; FR-003)
- [X] T021 [P] [US1] [U122] [U123] Tests first in `F/tests/pdf_test.ts`, then `openPdf` in `F/src/pdf.ts` with `unpdf` (R2): the page count is available before any text is extracted (R1), and per-page text comes back in page order for `pdf-lib` fixtures.
- [X] T022 [P] [US1] [U124] [U125] [U126] [U127] [U128] [U129] [U130] Tests first in `F/tests/passages_test.ts`, then `toPassages` in `F/src/passages.ts`:
  - every passage, its source line included, is at most `PASSAGE_MAX_CHARS` (FR-005, FR-025)
  - passages keep reading order and cover all the text
  - each records the page range it spans, including a passage that crosses a page boundary
  - a single over-long run of text is still split
- [X] T023 [P] [US1] [U131] [U132] [U133] [U134] [U135] [U136] [U137] [U138] [U139] [U140] [U321] [U350] Tests first in `F/tests/derived_test.ts`, then `sourceLine`, `fingerprint` and `passageRow` in `F/src/derived.ts`:
  - the source line has the format of the data-model examples, with the page range and the short id (`data-model.md` `Derived thought.content`; FR-025)
  - `fingerprint` equals `upsert_thought`'s normalisation (VP-004; `data-model.md` `Derived thought.content_fingerprint`)
  - the metadata has every key of `data-model.md` `Derived thought.metadata`: `Derived thought.metadata.source`, `Derived thought.metadata.source_type`, `Derived thought.metadata.source_label`, `Derived thought.metadata.importer_name`, `Derived thought.metadata.importer_version`, `Derived thought.metadata.imported_at`, `Derived thought.metadata.input_hash`, `Derived thought.metadata.content_fingerprint`, `Derived thought.metadata.sensitivity_tier`, `Derived thought.metadata.type` (`reference`), `Derived thought.metadata.topics`, `Derived thought.metadata.provenance` (`deterministic_conversion`, `source_locator`, `artifact`, `review_status`), `Derived thought.metadata.attachment_id` and `Derived thought.metadata.parent_thought_id` (FR-008, FR-028)
  - no signed link, token or absolute path can enter the metadata (FR-009)

### Stream E: model clients (`ta-models`, wave 1)

- [X] T024 [P] [US1] [U161] [U162] [U163] [U164] [U165] [U166] [U167] [U168] [U169] [U170] [U171] Tests first in `F/tests/embeddings_test.ts`, then `createEmbeddingClient` in `F/src/embeddings.ts` (R3; contracts/settings.md):
  - `POST <EMBEDDING_API_BASE>/embeddings` with `EMBEDDING_MODEL` and an array input of at most `EMBEDDING_BATCH_SIZE` texts; with `1`, one text per request
  - `Authorization: Bearer` with `EMBEDDING_API_KEY` (or its fallback)
  - vectors come back in input order across batches
  - an unreachable server, a non-2xx status or a malformed body fails the whole call with a reason naming the cause
  - any key value in an error is redacted (FR-009)

### Stream N: finishing (`ta-finish`, wave 2)

- [X] T025 [P] [US1] [U182] [U183] [U184] [U185] [U186] Tests first in `F/tests/finish_test.ts`, then the PDF path of `createFinisher` in `F/src/finish.ts`, using the merged X and E modules with `FakeStore` and `fake_fetch` (contracts/mcp-tools.md `finish_attachment`):
  - claim → verify the stored file → extract → embed → write → `processed`, with `derived_count` and `page_count`
  - `thought_attachments.actual_type`, `thought_attachments.actual_size`, `thought_attachments.page_count`, `thought_attachments.content_hash` (`sha256:<hex>`, the `input_hash`) and `thought_attachments.processed_at` set
  - the claim is released on every exit
  - an existing owner thought with the same text as a passage is untouched (US1 #4, FR-022)
- [X] T026 [P] [US1] [U187] [U188] [U322] [U323] [U324] [U325] Tests first in `F/tests/finish_test.ts`, then repeat finishes in `F/src/finish.ts`: a plain finish on `processed` returns the existing outcome with no embedding call and no write (FR-012); the duplicate-content outcome per T005.4 (US1 #3).

### Stream T: tools (`ta-tools`, wave 2)

- [X] T027 [P] [US1] [U217] [U218] [U219] Tests first in `F/tests/tools_test.ts`, then tool registration in `F/src/tools.ts`: `tools/list` returns exactly `find_thought`, `attach_file`, `finish_attachment`, `get_attachment`, `list_attachments`, `remove_attachment` and `find_orphan_attachments`, each with the input schema, defaults and annotations of contracts/mcp-tools.md.
- [X] T028 [P] [US1] [U220] [U221] [U222] [U223] [U224] [U225] [U226] [U227] [U228] [U328] Tests first in `F/tests/tools_test.ts`, then `find_thought` in `F/src/tools.ts`: `meaning` (default) embeds the query and calls `matchThoughts`, `exact` calls `findThoughtsExact`; `limit` defaults to 5 and is at most 20; each match has `id`, `first_line` (at most 120 characters) and `captured`; an empty result says "no matching thought" (FR-023, SC-009, R11).
- [X] T029 [P] [US1] [U229] [U230] [U231] [U232] [U233] [U234] [U235] [U236] [U237] [U238] [U239] [U240] [U329] [U330] [U362] Tests first in `F/tests/tools_test.ts`, then, in `F/src/tools.ts`, `attach_file` with `thought_id` and the command-upload details. Refusals, each before any row, note or link (FR-003, contracts/mcp-tools.md): an unknown `thought_id`; both or neither of `thought_id` and `note`; `checkDeclared`'s refusals; the same name, type and size already pending, with its deadline not passed, on the parent (pointing to it); only some of the three file details (spec Edge Cases). On success:
  - a row with `thought_attachments.parent_thought_id`, `thought_attachments.file_name`, `thought_attachments.declared_type`, `thought_attachments.declared_size`, `thought_attachments.sensitivity_tier` (default `personal`), `thought_attachments.storage_path`, `thought_attachments.upload_deadline` (now + `UPLOAD_LINK_MINUTES`; R8), `thought_attachments.page_token_hash` (a hash only, never the token) and `thought_attachments.state` `pending_upload`
  - a result with `attachment_id` and its short id, `parent_thought_id`, `upload_deadline`, `upload { url, method: "PUT", headers }` through `publicUrl`, the `curl` line, `page_link` and `limits` (FR-001, FR-002, R6)
- [X] T030 [P] [US1] [U241] [U242] [U243] Tests first in `F/tests/tools_test.ts`, then, in `F/src/tools.ts`, `finish_attachment` over `services.finish` (scripted in this stream's tests): `attachment_id` and optional `rebuild`; the result text and the structured `state`, `reason`, `derived_count`, `caption`, `page_count`; the busy message "busy (finishing / rebuilding / removing), try again shortly" (FR-026).

### Stream A: app and entry (`ta-app`, wave 3)

- [X] T031 [US1] [U293] [U294] [U295] [U296] [U297] [U298] [U299] [U347] [U348] [U351] Tests first in `F/tests/app_test.ts`, then `createApp(input)` in `F/src/app.ts`:
  - the MCP route accepts `MCP_ACCESS_KEY` from `x-brain-key` or `?key=`, compared in constant time
  - a missing or wrong key gets an authorization error and changes nothing, and an unset key refuses everything (FR-018, R13)
  - CORS and the Accept-header handling as the core does (`W/server/index.ts`)
  - it composes `createFinisher`, `buildServer` and `pageRoutes`
- [X] T032 [US1] [U300] [U301] [U302] [U303] [U304] Tests first in `F/tests/imports_test.ts`, then `productionDeps()` in `F/src/app.ts`:
  - `loadSettings(Deno.env.get)`; when settings are not `ok`, `productionDeps()` returns `{ ok: false, problems }` so `createApp` answers every call and page route with the named error (T005 Q3), and nothing else starts
  - `createSupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, …)` and the real clients over `globalThis.fetch`
  - `index.ts` stays the one-line entry
  - the test reads every `.ts` file outside `tests/` and fails on a bare import specifier (004 R10) or any `pdf-lib` import (R15)
- [X] T033 [US1] [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] [A10] [A11] [A12] [A53] [A57] [A59] Flip the US1 acceptance tests in `F/tests/acceptance_test.ts` from `todo` to `Deno.test`, one per green commit, including the 7-tool `tools/list` and wrong-key cases.

### Stream D: docs (`ta-docs`, wave 1)

- [X] T034 [P] [US1] Write `F/README.md` per the spec's README Contract (docs only; gated by markdownlint, the link check and the live runs). Sections:
  - **What it does**
  - a link to `../../docs/05-tool-audit.md`
  - **Prerequisites** (both platforms)
  - a credential tracker (names only)
  - **Configure**: a table of every setting in contracts/settings.md
  - **Set up the database**: `schema.sql` in the SQL editor on Cloud, or through 006's `psql` route on self-hosted, plus the verification query (R12, R16)
  - **Deploy to Supabase Cloud**: `supabase functions deploy thought-attachments --no-verify-jwt` and `supabase secrets set` (R13)
  - **Deploy on spec 006's stack**: a `docker-compose.override.yml` that mounts the folder into `functions` and passes 007's settings, then `docker compose up -d --force-recreate functions` (R14); no 006 file changes
  - **Connect your AI client**: the URL with `?key=`
  - **Attach a manual**: `find_thought`, `attach_file`, the `curl` upload, `finish_attachment`, then search with the core connector
  - **Expected outcome**
  - links to `docs/ingestion-metadata-contract.md`, `docs/01-getting-started.md` and `../../recipes/self-hosted-supabase-mcp/`
  - a **"Tested with"** table whose value cells read `pending verification` until T080

**Checkpoint**: US1 works end to end through `createApp` with fakes.

---

## Phase 4: User Story 2 - Photograph where something is stored (Priority: P1)

**Goal**: a phone photo, uploaded through the one-time page, becomes a searchable caption.

**Independent Test**: the US2 acceptance tests pass. Live: quickstart scenarios 4, 7 and 8 (SC-008 is live-only).

### Stream X: files (`ta-files`, wave 1)

- [X] T035 [P] [US2] [U141] [U142] [U143] [U144] Tests first in `F/tests/intake_test.ts`, then HEIC handling and `sniffType` in `F/src/intake.ts`:
  - a HEIC name or declared type gets "share it as JPEG", with the steps on iPhone and Android (FR-003, US2 #3 and #4)
  - `sniffType` identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes, never from a name or declared type (R7), and returns `null` for anything else
- [X] T036 [P] [US2] [U145] [U146] [U147] Tests first in `F/tests/derived_test.ts`, then `captionRow` and `noteMetadata` in `F/src/derived.ts`:
  - the caption's source line uses "photo" (FR-025), and `data-model.md` `Derived thought.metadata.provenance` has `method: "llm_extraction"`, `source_locator: "photo"` and `extractor_model` (FR-006, FR-008)
  - `noteMetadata` gives `data-model.md` `Parent note.metadata` (`type: "observation"`, `source: "thought-attachments"`, `source_type: "thought_attachments_note"`, `imported_at`; FR-001)

### Stream E: model clients (`ta-models`, wave 1)

- [X] T037 [P] [US2] [U172] [U173] [U174] [U175] [U176] [U177] [U178] [U179] [U180] [U181] Tests first in `F/tests/vision_test.ts`, then `createVisionClient` in `F/src/vision.ts` (R4):
  - `configured` is false when `VISION_API_BASE` or `VISION_MODEL` is unset
  - `POST <VISION_API_BASE>/chat/completions` with `VISION_MODEL`, the image as a base64 `data:` URL of its real type, and a prompt asking for visible objects, places, labels and text
  - `VISION_API_KEY` as a bearer token only when set
  - the result has the caption text and the model
  - an unreachable server, a non-2xx status or an empty caption fails with a reason
  - keys are redacted (FR-009)

### Stream Q: data (`ta-data`, wave 1)

- [X] T038 [P] [US2] [U84] [U85] [U86] [U87] [U88] Tests first in `F/tests/verify.sql` and `F/tests/store_test.ts`, then note insertion and page tokens in `F/schema.sql` and `F/src/store.ts`:
  - `insertNote` inserts a new thought with `data-model.md` `Parent note.content` and `Parent note.metadata` and returns `created: true`
  - a note whose fingerprint exists returns that thought with `created: false`, unchanged (R17; `data-model.md` `thought_attachments.parent_created_here`)
  - `attachmentForPageToken` finds a row by `thought_attachments.page_token_hash` only
  - `consumePageToken` clears it once and fails a second time (FR-002, FR-024)

### Stream N: finishing (`ta-finish`, wave 2)

- [X] T039 [P] [US2] [U189] [U190] [U191] [U192] [U193] [U194] Tests first in `F/tests/finish_test.ts`, then the photo path in `F/src/finish.ts`:
  - a caption becomes one derived thought, the state becomes `processed`, and `thought_attachments.caption_model` is set (FR-006, US2 #1)
  - with vision not configured or failing: `not_captioned` with the reason in `thought_attachments.state_reason`, the file kept, no caption (US2 #7)
  - `not_captioned` finished again writes the caption (SC-015)
- [X] T040 [P] [US2] [U187] [U195] [U196] [U197] [U326] Tests first in `F/tests/finish_test.ts`, then rebuilds in `F/src/finish.ts` (FR-027):
  - `rebuild: true` on a `processed` photo replaces the caption with exactly one caption by the newly configured model (SC-015)
  - a failed rebuild keeps the old set and `processed`, and sets `thought_attachments.last_rebuild_error` with the reason (SC-018)
  - a plain finish never rebuilds

### Stream T: tools (`ta-tools`, wave 2)

- [X] T041 [P] [US2] [U244] [U245] [U246] [U247] [U248] [U249] Tests first in `F/tests/tools_test.ts`, then `attach_file`'s `note` and phone-upload paths in `F/src/tools.ts`:
  - `note` embeds the text and saves it through `insertNote` as the parent; `parent_created_here` follows `created`, and an existing note gets "attached to your existing thought" (FR-001, R17, SC-010)
  - a HEIC or over-cap declaration with `note` saves no thought (FR-003, SC-020)
  - with the file details omitted, the row has no declaration and carries `thought_attachments.expected_kind` when given (planning clarification)

### Stream P: phone page (`ta-page`, wave 2)

- [X] T042 [P] [US2] [U262] [U263] [U264] [U265] [U266] [U267] [U268] [U269] [U270] [U271] [U272] [U273] [U274] [U275] [U276] [U337] [U338] [U339] [U352] [U365] [U366] Tests first in `F/tests/page_routes_test.ts`, then `POST /page/info` (token only: expected kind, accepted types, caps; changes nothing) and `POST /page/start` in `F/src/page_routes.ts` (contracts/upload-page.md):
  - a valid, unused token before `thought_attachments.upload_deadline` records the picked name, type and exact size as the declaration, or confirms they match the one the attach call gave
  - it refuses HEIC, other types, an `expected_kind` mismatch or an over-cap size, with `attach_file`'s messages, before any link is made
  - otherwise it returns a fresh signed upload link through `publicUrl`
  - a second `/page/start` replaces the declaration
  - an invalid, used or expired token gets `410` with "This link has expired or was already used. Ask your assistant for a new one"
  - a brain key is neither needed nor accepted, and CORS allows only the `UPLOAD_PAGE_URL` origin (or same-origin)
- [X] T043 [P] [US2] [U277] [U278] [U279] [U280] [U340] [U341] Tests first in `F/tests/page_routes_test.ts`, then `POST /page/finish` in `F/src/page_routes.ts`: it finishes **only** its own attachment and uses up the token only when finishing reaches an outcome (busy and no-file leave it valid, T005 Q5) through `services.finish`, returning the outcome as JSON; a second call gets `410`; a token for another attachment changes nothing (FR-024, SC-011); busy handling per T005.5.
- [X] T044 [P] [US2] [U281] [U282] [U283] [U284] [U285] [U286] [U287] [U288] [U289] [U290] [U291] [U292] [U342] [U343] [U344] [U345] [U346] [U363] Tests first in `F/tests/page_script_test.ts` (with `F/tests/helpers/page_dom.ts`, a minimal DOM, `location` and `fetch` stand-in that runs the file's inline script), then `F/upload-page.html`:
  - it reads the token only from the fragment and calls only the API address fixed in the file, per T005.6 (R5)
  - the file input accepts `image/jpeg,image/png,image/webp,application/pdf` (R7)
  - it shows the expected kind, accepted types and size limit
  - a refusal from `/page/start` shows before any upload
  - it `PUT`s the one file to the returned link, then calls `/page/finish` and shows each outcome text of contracts/upload-page.md "What the owner sees"
  - a `410` shows the expired message
  - the file contains no key, token or project address other than its API-address setting
  - it has no external script or style

### Stream A: app (`ta-app`, wave 3)

- [X] T045 [US2] [U305] [U306] [U307] [U349] Tests first in `F/tests/app_test.ts`, then `GET /upload` in `F/src/app.ts`: it serves `upload-page.html` unchanged as `text/html` for the self-hosted path (R5), and mounts the page routes outside the brain-key check.
- [X] T046 [US2] [A13] [A14] [A15] [A16] [A17] [A18] [A19] [A20] [A21] [A22] [A23] [A24] [A25] [A26] [A58] [A60] [A61] Flip the US2 acceptance tests in `F/tests/acceptance_test.ts`, one per green commit.

### Stream D: docs (`ta-docs`, wave 1)

- [X] T047 [P] [US2] In `F/README.md`, add:
  - **Upload from your phone**: on self-hosted, `PUBLIC_BASE_URL` set to an address the phone reaches (LAN or tailnet), with the same-network limit until fork issue #29 (R6)
  - **On Supabase Cloud, publish the page once**: set the API address in `upload-page.html`, publish it to any free static host, set `UPLOAD_PAGE_URL`, and why (Cloud serves HTML as plain text; R5)
  - **Vision model**: `VISION_*` for Ollama `qwen2.5vl:7b` or an OpenRouter vision model (R4)
  - HEIC and "share as JPEG" (R7)
  - starting with a note

**Checkpoint**: US1 and US2 both work through `createApp`.

---

## Phase 5: User Story 3 - Get the original file back (Priority: P2)

**Goal**: the AI gets an attachment's details and a short-lived download link, by attachment or by parent thought.

**Independent Test**: the US3 acceptance tests pass. Live: quickstart scenario 3.

### Stream Q: data (`ta-data`, wave 1)

- [X] T048 [P] [US3] [U89] [U90] [U91] [U92] Tests first in `F/tests/store_test.ts` (and `F/tests/verify.sql` for any SQL used), then `signDownload(path, seconds)`, `listByParent` and `attachmentForDerived` in `F/src/store.ts`. `attachmentForDerived` resolves through `data-model.md` `Derived thought.metadata.attachment_id` (FR-015).

### Stream T: tools (`ta-tools`, wave 2)

- [X] T049 [P] [US3] [U243] [U250] [U251] [U252] [U253] [U331] [U332] [U333] [U353] Tests first in `F/tests/tools_test.ts`, then `get_attachment` in `F/src/tools.ts`:
  - it accepts a full or short id, with "not found" and "ambiguous" errors
  - it returns file name, type, size, page count, state, reason, `derived_count`, `caption_model` and parent id
  - it gives a `download_link` valid for `DOWNLOAD_LINK_SECONDS`, through `publicUrl` and with the lifetime stated, only when the file is stored; never for `pending_upload` or `refused` (FR-014, SC-003, SC-012)
- [X] T050 [P] [US3] [U254] [U255] [U256] [U257] [U334] Tests first in `F/tests/tools_test.ts`, then `list_attachments` in `F/src/tools.ts`: exactly one of `thought_id` or `derived_thought_id`; each attachment's id, short id, file name, type, size, state and `derived_count` (FR-015, US3 #2).

### Stream A: app (`ta-app`, wave 3)

- [X] T051 [US3] [A27] [A28] [A29] Flip the US3 acceptance tests in `F/tests/acceptance_test.ts`, one per green commit.

### Stream D: docs (`ta-docs`, wave 1)

- [X] T052 [P] [US3] In `F/README.md`, add **Get a file back**: `get_attachment` by the short id in a search result's source line, `list_attachments`, and the 10-minute link lifetime (FR-014).

---

## Phase 6: User Story 4 - Clear limits and honest failure (Priority: P2)

**Goal**: every refusal and failure names its cause and leaves no half-written data. Finish and remove run one at a time.

**Independent Test**: the US4 acceptance tests pass. Live: quickstart scenarios 5, 6, 7, 8, 9 and 12.

### Stream X: files (`ta-files`, wave 1)

- [X] T053 [P] [US4] [U148] [U149] [U150] [U151] [U152] [U153] [U154] [U155] Tests first in `F/tests/intake_test.ts`, then `checkActual` in `F/src/intake.ts` (FR-004, FR-013):
  - it refuses when the sniffed type or the exact size differs from the declaration, or when the size or page count is over its cap
  - the reason names the actual type, size or page count (`data-model.md` `thought_attachments.actual_type`, `thought_attachments.actual_size`, `thought_attachments.page_count`)
  - a page-cap refusal names `MAX_PDF_PAGES` and the planned background processing (fork issue #26)
  - HEIC bytes get the "share as JPEG" message (US2 #4)
- [X] T054 [P] [US4] [U156] [U157] [U158] [U159] [U160] Tests first in `F/tests/pdf_test.ts`, then in `F/src/pdf.ts`:
  - `isScanned` is true below `SCANNED_MIN_CHARS_PER_PAGE` non-space characters per page on average (R2, FR-010)
  - corrupt bytes fail `openPdf` with a readable reason (spec edge case)
  - an encrypted fixture, if one can be generated without a committed binary (`pdf-lib` cannot encrypt); otherwise the encrypted case is a live check in T077

### Stream Q: data (`ta-data`, wave 1)

- [X] T055 [P] [US4] [U43] [U93] [U94] Tests first in `F/tests/verify.sql`, then in `F/schema.sql`:
  - a write or state change with a stale token, after a newer claim took over, is refused and changes nothing (R10, SC-019)
  - a `refused` row does not block a new attachment of the same content on the same parent (`data-model.md` `thought_attachments.content_hash` index; SC-013)
  - a set-state under a valid claim records `thought_attachments.state` and `thought_attachments.state_reason` without touching derived thoughts

### Stream N: finishing (`ta-finish`, wave 2)

- [X] T056 [P] [US4] [U198] [U199] [U200] [U201] [U202] [U203] [U204] Tests first in `F/tests/finish_test.ts`, then refusals in `F/src/finish.ts` (FR-004, SC-013):
  - on `checkActual`'s refusal, or an object created after `thought_attachments.upload_deadline` (R8), the file is deleted at once, the state becomes `refused` with the actual values, and no derived thoughts are written
  - finishing `refused` again is refused
  - no object gives "no file uploaded yet", or "upload window expired" after the deadline, with the state unchanged
- [X] T057 [P] [US4] [U205] [U206] [U207] [U208] [U209] [U210] [U211] [U327] Tests first in `F/tests/finish_test.ts`, then failures in `F/src/finish.ts`:
  - a text-less PDF ends `scanned` with "text search won't cover it yet" and no passages, and `scanned` finished again re-checks (FR-010, US4 #2)
  - a corrupt PDF ends `failed` with the reason
  - an embedding failure partway, or a vector length different from `embeddingDimension()`, ends `failed` with no derived thoughts from that attempt, and a later finish succeeds (`data-model.md` `Derived thought.embedding`; FR-007, FR-011, US4 #3, SC-005)
- [X] T058 [P] [US4] [U212] [U213] [U214] [U215] [U216] Tests first in `F/tests/finish_test.ts`, then the claim in `F/src/finish.ts` (FR-026, R10):
  - a finish while another finish, rebuild or remove holds an unexpired claim returns `busy` with the running operation and changes nothing (SC-014)
  - once `BUSY_SECONDS` has passed by the clock, the next finish proceeds and completes (SC-019)
  - a cut-off rebuild keeps the old set

### Stream A: app (`ta-app`, wave 3)

- [X] T059 [US4] [A30] [A31] [A32] [A33] [A34] [A35] [A36] [A37] [A38] [A39] [A40] [A41] [A42] [A43] [A44] [A45] [A54] [A55] [A62] [A63] Flip the US4 acceptance tests in `F/tests/acceptance_test.ts`, one per green commit, including SC-014's held-vision concurrency case and SC-017's +20 and +65 minute cases.

### Stream D: docs (`ta-docs`, wave 1)

- [X] T060 [P] [US4] In `F/README.md`, add **Limits** (the caps and why: Cloud's 2 s CPU budget, R1), **Troubleshooting** (one entry per refusal and failure in contracts/mcp-tools.md, including busy, scanned with OCR deferred to fork issue #30, an embedding size mismatch, and `EMBEDDING_BATCH_SIZE=1` if the endpoint rejects batches, R3) and **Known limitations** (fork issues #26, #30, #31 and #32).

---

## Phase 7: User Story 5 - Remove an attachment (Priority: P3)

**Goal**: confirmed removal deletes the file, the record and its derived thoughts, and never the owner's own thoughts.

**Independent Test**: the US5 acceptance tests pass. Live: quickstart scenario 10, plus T078's note-exception check.

### Stream Q: data (`ta-data`, wave 1)

- [X] T061 [P] [US5] [U95] [U96] [U97] [U98] [U99] [U100] [U101] [U102] [U103] [U104] [U105] [U106] [U107] [U108] [U109] Tests first in `F/tests/verify.sql`, then the remove, preview and orphan functions in `F/schema.sql`:
  - remove deletes only that attachment's derived thoughts and its row, scoped by its id, in one transaction, under a valid claim; the parent and another attachment of the same PDF on another thought keep everything (FR-016, FR-022, SC-012)
  - the parent note goes too only when `thought_attachments.parent_created_here` is true, the attachment ended `refused` or expired without an upload, and no other attachment points to it (FR-016, SC-020)
  - the preview reports the same counts and deletes nothing
  - orphans lists a parent gone, `pending_upload` past `thought_attachments.upload_deadline` and `refused`, each with why and `derived_count` (FR-021)
- [X] T062 [P] [US5] [U110] [U111] [U112] Tests first in `F/tests/store_test.ts`, then `removalPreview`, `removeAttachment` and `orphans` in `F/src/store.ts`.

### Stream T: tools (`ta-tools`, wave 2)

- [X] T063 [P] [US5] [U243] [U258] [U259] [U260] [U335] [U336] [U354] Tests first in `F/tests/tools_test.ts`, then `remove_attachment` in `F/src/tools.ts`: Removal order and retry follow contracts/mcp-tools.md `remove_attachment` (file first, then records in one transaction; a repeat remove succeeds when the file is already gone).
  - without `confirm`, nothing is deleted, and the result lists the file, N derived thoughts and the parent note when it would go (US5 #2)
  - with `confirm`, it claims, deletes the stored file, removes through the store and releases (US5 #1, #4)
  - while busy, it is refused as in `finish_attachment` (SC-014)
- [X] T064 [P] [US5] [U261] Tests first in `F/tests/tools_test.ts`, then `find_orphan_attachments` in `F/src/tools.ts`: each orphan's id, file name, why it is listed and `derived_count` (FR-021, US5 #3, SC-013, SC-017).

### Stream A: app (`ta-app`, wave 3)

- [X] T065 [US5] [A46] [A47] [A48] [A49] [A50] [A51] [A52] [A56] Flip the US5 acceptance tests and the cross-cutting SC-007 test in `F/tests/acceptance_test.ts`, one per green commit. Afterwards `RUN_TODO=1` runs no ignored test.

### Stream D: docs (`ta-docs`, wave 1)

- [X] T066 [P] [US5] In `F/README.md`, add **Remove an attachment** (dry run, then `confirm`; what goes and what never does) and **Orphan check**.

---

## Phase 8: Integration, live runs, gates and landing (integrator)

- [X] T067 Merge each stream into `W` only after verifying it yourself:
  - check out each of its commits in a throwaway worktree and run the full deno suite there (and `verify.sql` for Q)
  - `git diff --name-only` touches only its owned files
  - re-apply a sample of its recorded mutants (at least one per task) and confirm each fails
  - any remediation names the mutant it kills

  Merge with `git -C W merge --no-ff contrib/mfelker/thought-attachments-<s>`. All of wave 1 (Q, X, E, D) merges before wave 2 starts; N, T and P before wave 3 starts. Create each wave's worktrees from the updated `contrib/mfelker/thought-attachments` and launch its streams in one message.
- [X] T068 Early gate run right after Q merges (spec 006's T008 precedent): run the OB1 gate's review checks (`W/.github/workflows/ob1-gate-v2.yml`) locally over `F`, with the upstream title. Confirm "No credentials" and "SQL safety" pass, and that R16's guarded `ADD COLUMN` passes rule 5. Record the result in T068's line in `M`.
- [X] T069 After each merge, fold `M/specs/007-thought-attachments/tdd/cycle-log.d/*.md` into `tdd/cycle-log.md` in behavior order. Tick the tasks whose behaviors are all `DONE`, then commit on fork `main`.
- [X] T070 Refactor with the full suite green in `W`: `deno check` and `deno lint` on `F`; `grep -rn "not implemented" F` is empty; `RUN_TODO=1` runs no ignored test.
- [X] T071 [P] `F/metadata.json` validates against `W/.github/metadata.schema.json`.
- [X] T072 [P] `npx markdownlint-cli2 --config .github/.markdownlint.jsonc "integrations/thought-attachments/**/*.md"` in `W`.
- [X] T073 [P] README check of `F/README.md`: Prerequisites, numbered steps for both platforms, Expected outcome; every relative link resolves in `W`; the `docs/05-tool-audit.md` link is present.
- [X] T074 [P] Scan `F` for secrets, binaries over 1 MB, profanity and SQL safety, and check that no file is fork-only. Then run all the OB1 gate's review checks locally with the upstream title (spec 006's T043 precedent).
- [X] T075 [P] Fork-ci preview from `W`'s root, with T004's `psql` wrapper on `PATH`: `node ../../.fork/ci/bin/run-folder.mjs --path integrations/thought-attachments --mode strict --origin fork --out "$TMPDIR/r.json"`. Both the deno and sql runtimes pass.
- [ ] T076 **Owner-run live Cloud run** (owner present; the Supabase CLI gets `--yes` only with the owner's consent), from a scratch checkout of `W`, never inside `F`. Run quickstart scenarios 1–13 on a Cloud project. Evidence goes in `M/specs/007-thought-attachments/evidence/cloud/` with no key values. Record:
  - **SC-004 re-measure** (scenario 12): the compute and wall time of each finish for a real 50-page-or-fewer manual and the largest photo, with no `546`. If a finish fails, lower the default caps test-first in `F/src/settings.ts` and `F/tests/settings_test.ts`, update the README, and record the measured values (FR-017, R1).
  - **R3**: whether OpenRouter's embeddings route accepts an array input. If not, change `EMBEDDING_BATCH_SIZE`'s default test-first, or document `1`.
  - **R5**: the page published to a static host and `UPLOAD_PAGE_URL` set; SC-008's default-camera photo from the phone, off-network.
  - SC-001 and SC-002 pass/fail per sample question and photo (lists written before the run), SC-003, SC-007, SC-009 through SC-017.
- [ ] T077 **Owner-run live self-hosted run** on spec 006's stack, from a scratch checkout. Use the README's `docker-compose.override.yml` (R14) and `PUBLIC_BASE_URL` set to the Mac's LAN or tailnet address (R6). Run quickstart scenarios 1–11 and 13. Evidence goes in `M/specs/007-thought-attachments/evidence/self-hosted/`. Record:
  - **R4**: Ollama `qwen2.5vl:7b` captions a photo sent as a `data:` URL
  - **R5**: 006's gateway serves `GET /upload` as `text/html`, unchanged
  - SC-008 with the phone on the same network
  - an encrypted PDF ends `failed` with a readable reason (spec edge case), if T054 couldn't cover it
- [ ] T078 Live checks the quickstart lacks, in both runs, with the evidence next to T076 and T077:
  - **SC-020**: start with a `note`, let the link expire unused, remove it, and see the note gone; repeat with a second, processed attachment on the note and see the note stay (quickstart scenario 10 only removes a processed manual)
  - **SC-018**: a rebuild with the vision model stopped keeps the old caption
- [ ] T079 SC-006 and SC-007 across both runs: the same behavior, differing only in settings (FR-019), and a query over every derived thought and attachment row finds no signed link, key, token or absolute path. Record the comparison in `M/specs/007-thought-attachments/evidence/sc-006-007.md`.
- [ ] T080 Replace the README's `pending verification` cells in `F/README.md` with the recorded values (platform, runtime, models, measured SC-004 times), and set `F/metadata.json` `estimated_time` from the runs. Re-run T071–T074.
- [ ] T081 **Cold-context TDD audit**: launch a fresh agent with no conversation context to run `/speckit-tdd-verify` in `M`. It writes `M/specs/007-thought-attachments/tdd/verification.md` with a verdict of PASS or PASS_WITH_GAPS (Quality Gate 1). The live-only criteria (SC-004, SC-006, SC-008, and the live halves of SC-001, SC-002 and SC-003) are named for an owner ruling, as in spec 006's T044. Remediation tasks it writes are appended as a new phase and done before T083.
- [X] T082 Scope check: `git -C W diff --stat upstream/main...HEAD` lists only `integrations/thought-attachments/`, with no `specs/`, `.specify/` or `.fork/` (Principle V).
- [ ] T083 **Fork landing, asking the owner before each push or PR**:
  1. `git -C W push -u origin contrib/mfelker/thought-attachments`.
  2. `gh pr create -R mfelker/OB1 --base main --head contrib/mfelker/thought-attachments --title "[integrations] Thought attachments (fork landing)"`. The body follows `W/.github/PULL_REQUEST_TEMPLATE.md` and ends with the "Generated with Claude Code" line only.
  3. When `fork-ci-verdict` and `OB1 Review` are green, the **owner** merges with `--merge`.
  4. Add the ledger row in `M/.fork/staged-prs.md`, kind `own`, upstream PR "to be opened".
- [ ] T084 **Upstream PR, after T083. Ask the owner first.** `gh pr create -R NateBJones-Projects/OB1 --head mfelker:contrib/mfelker/thought-attachments --title "[integrations] Thought attachments: files linked to thoughts"`, with the body from `W/.github/PULL_REQUEST_TEMPLATE.md`, ending with the "Generated with Claude Code" line only. Update the ledger row in `M/.fork/staged-prs.md`.
- [ ] T085 Cleanup:
  - after T083 merges: remove the eight `ta-*` worktrees and their local branches (`git worktree remove`, after checking `git status --short` is clean), the scratch checkouts, and the `ob1-007-pgtest` container
  - after the upstream PR merges or closes: remove `W` and its local branch, and reconcile the ledger

---

## Success criteria coverage

| SC | Deno acceptance (T012) | `verify.sql` | Live (quickstart #, task) | Notes |
|----|------------------------|--------------|---------------------------|-------|
| SC-001 | passages with source lines | — | 2, T076/T077 | findability is live |
| SC-002 | caption written | — | 4, T076/T077 | findability is live |
| SC-003 | link lifetime; no link when not stored | — | 3, T076/T077 | byte identity and real expiry are live |
| SC-004 | — | — | 12, T076 | **live-only**; evidenced, not met (R1) |
| SC-005 | yes | T015 | 5–7 | |
| SC-006 | — | — | both runs, T079 | **live-only** |
| SC-007 | yes | — | 13, T079 | |
| SC-008 | — | — | 4, T076/T077 | **live-only** (phone) |
| SC-009 | yes | T016 | 1 | |
| SC-010 | yes | T038 | 4 | |
| SC-011 | yes | T038 | 4 | |
| SC-012 | yes | T061 | 2, 3 | |
| SC-013 | yes | T055, T061 | 6 | |
| SC-014 | yes | T016 | 8 | |
| SC-015 | yes | T015 | 7 | |
| SC-016 | yes | — | 11 | |
| SC-017 | yes | T061 | 9 | |
| SC-018 | yes | T015 | T078 | not in quickstart |
| SC-019 | yes | T016, T055 | — | simulated only |
| SC-020 | yes | T061 | T078 | quickstart 10 doesn't exercise it |

---

## Dependencies & Execution Order

### Phase and wave dependencies

```text
T001 → T002 → T003 → T004 → T005 (all six questions) → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013
   wave 1 (parallel): Q[T014–T019, T038, T048, T055, T061, T062]  X[T020–T023, T035, T036, T053, T054]
                      E[T024, T037]  D[T034, T047, T052, T060, T066]
   → T067 (merge Q, X, E, D) → T068 (early gate) → T069
   wave 2 (parallel): N[T025, T026, T039, T040, T056–T058]  T[T027–T030, T041, T049, T050, T063, T064]
                      P[T042–T044]
   → T067 (merge N, T, P) → T069
   wave 3: A[T031–T033, T045, T046, T051, T059, T065]
   → T067 (merge A) → T069 → T070 → T071 ∥ T072 ∥ T073 ∥ T074 ∥ T075
   → T076 ∥ T077 (owner) → T078 → T079 → T080 → T081 → T082 → T083 → T084 → T085
```

- **Why these waves**: N, T and P call the real Q, X and E modules (only Storage, the database and the model servers are faked), so they wait for wave 1. A composes N, T and P. D depends only on the design documents.
- **User stories vs waves**: streams own files, not stories, so each wave contributes to several stories. Stories complete in priority order at wave 3: US1 at T033, US2 at T046, US3 at T051, US4 at T059 and US5 at T065.
- **Within a stream**: tasks run in their listed order, which matches the test-list order once `tdd.plan` adds markers. One behavior per commit.
- **Owner-gated**: T005 (decisions), T076–T078 (live runs), every push and PR (T083, T084), and any Supabase CLI `--yes`.

### Parallel Opportunities

- Wave 1: four Sonnet agents at once (Q, X, E, D).
- Wave 2: three Sonnet agents at once (N, T, P).
- The integrator gates T071–T075 can run in parallel. The two live runs T076 and T077 are independent of each other.

## Parallel Example: Wave 1

```text
Agent(model: "sonnet", description: "Stream Q data", prompt: <brief: worktree /Users/mfelker/Projects/ob1/.worktrees/ta-data, branch contrib/mfelker/thought-attachments-data, tasks T014–T019 T038 T048 T055 T061 T062, TDD rules, single-writer rule, Seams, the SQL runtime recipe from tdd/cycle-log.md (T004), data-model.md (table, states, functions), research R9 R10 R11 R12 R16 R17, T005.4 answer, log to M/specs/007-thought-attachments/tdd/cycle-log.d/data.md>)
Agent(model: "sonnet", description: "Stream X files", prompt: <… ta-files, T020–T023 T035 T036 T053 T054, data-model.md derived thought and parent note, contracts/mcp-tools.md refusals, research R1 R2 R7 R15 …>)
Agent(model: "sonnet", description: "Stream E model clients", prompt: <… ta-models, T024 T037, contracts/settings.md, research R3 R4 …>)
Agent(model: "sonnet", description: "Stream D README", prompt: <… ta-docs, T034 T047 T052 T060 T066, spec README Contract, contracts/*, research R1 R3 R4 R5 R6 R7 R12 R13 R14 R16 …>)
```

## Parallel Example: Wave 2

```text
Agent(model: "sonnet", description: "Stream N finishing", prompt: <… ta-finish, T025 T026 T039 T040 T056–T058, contracts/mcp-tools.md finish_attachment, data-model.md states, research R8 R9 R10, T005.4 answer …>)
Agent(model: "sonnet", description: "Stream T tools", prompt: <… ta-tools, T027–T030 T041 T049 T050 T063 T064, contracts/mcp-tools.md, research R6 R11 R17 …>)
Agent(model: "sonnet", description: "Stream P phone page", prompt: <… ta-page, T042–T044, contracts/upload-page.md, research R5 R7, T005.5 and T005.6 answers …>)
```

## Implementation Strategy

### MVP (User Story 1)

Setup → Foundational → wave 1 limited to Q's T014–T019, X's T020–T023, T035 (`sniffType`) and T053 (`checkActual`), and E's T024 → wave 2 limited to N's T025–T026 and T's T027–T030 → wave 3 limited to T031–T033. The result attaches a PDF by command upload and writes searchable passages. **Stop and validate** with quickstart scenarios 1–3 before the phone path.

### Incremental delivery

Every merge keeps the suite green: stubs throw, and acceptance tests stay `todo` until flipped. So `W` is always shippable as far as it goes. The fork PR opens only after T080 fills the README's "Tested with" table and T081's audit passes.

## Notes

- `[P]` = parallel with the other streams of its wave (different files). Tasks inside one stream run in order.
- Never tick a `[U#]`/`[A#]`-marked task by hand.
- Streams write nothing in `M` except their own `cycle-log.d/<stream>.md`. The Principle V guard allows that path on fork `main`.
- Lessons applied from specs 004–006:
  - the outer loop opens first (T012)
  - the shared seams and fakes land before any stream, and the fakes get their own self-tests (T011)
  - the integrator verifies every stream before merging, re-applying mutants (T067)
  - contracts state behavior, not implementation, so behavior is built test-first inside streams
  - the only prescribed structure is the seams

## Phase 9: TDD remediation

Source: `tdd/verification.md` (verdict **FAIL** at `ff4bfc1`). **The feature is not done until T086–T096 are cleared and a fresh `/speckit-tdd-verify` reports PASS or PASS_WITH_GAPS.** T081 depends on this phase. Each task is a test change in `W` made red-first where it adds a behavior. `F` = `W/integrations/thought-attachments`. Suite: from `F`, `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/`; SQL: `verify.sql` on a fresh bootstrapped database.

- [ ] T086 Finding 1 (HIGH, surviving mutant in U280/A62): add a test where a `not_captioned` or `failed` attachment has a live finish claim. A `/page/finish` with its page token answers busy, and the token is accepted afterwards. Prove it red by dropping `outcome.busy === undefined &&` from `src/page_routes.ts:103`, then restore. Done when that mutant fails the new test and the suite is green.
- [ ] T087 Finding 2 (HIGH): in `tests/acceptance_test.ts:426,759,954,1081,1133,1366` (A7, A21, A27, A33, A36, A63), replace `typeof … === "string"` link checks with exact assertions: the fake store's signed URL rewritten to `PUBLIC_BASE_URL`, and for A63 the signed upload token. Done when mutant M21 (`src/links.ts:9` returning `url`) and a mutant signing the wrong path each fail an A test.
- [ ] T088 Finding 3 (HIGH): in `tests/acceptance_test.ts:754,819-822,1103,1132` (A21, A25, A34, A36), assert the specific reason, as A22 does: vision not configured, vision endpoint unavailable, the embedding failure, and an unreadable PDF. Done when the suite is green and each assertion fails under a mutant that swaps the reason text.
- [ ] T089 Finding 4 (HIGH): `tests/derived_test.ts:90-91` (U135) asserts `importer_version` equals `F/metadata.json`'s `version`. Done when changing `IMPORTER_VERSION` in `src/derived.ts` fails U135.
- [ ] T090 Finding 5 (HIGH): `tests/tools_test.ts:931` (U243) drops the `?? row.id` fallback and asserts the resolved row for each tool, for example with distinct file names, or with the argument `remove_attachment` previews. Done when resolving the short id to the wrong row fails U243 for `remove_attachment`.
- [ ] T091 Finding 6 (HIGH): `tests/acceptance_test.ts:491-499` (A11) compares each tool's whole `annotations` object, with no conditional spread. Done when marking `find_thought` `destructiveHint: true` in `src/tools.ts` fails A11.
- [ ] T092 Finding 7 (HIGH): `tests/tools_test.ts:554-561` (U249) asserts the SDK's actual refusal (`isError` and text naming `expected_kind`), with no `try/catch`. Done when the suite is green and the test has no `catch`.
- [ ] T093 Finding 8 (HIGH): `tests/verify.sql:24-26` (U50) no longer returns silently. Either raise a notice naming the skip, or prove the no-storage path in a scratch schema. Done with `verify.sql` passing twice on a fresh database.
- [ ] T094 Finding 9 (HIGH): `tests/verify.sql:376` (U55) asserts a literal hex digest for a fixed content string, not the schema's own expression. Done when changing the fingerprint expression in `schema.sql:187` fails U55.
- [ ] T095 Finding 10 (HIGH): `tests/tools_test.ts:382-383,396,488,614,691` (U238, U239, U244, U251, U353) assert literal expected strings and objects, not `curlLine`, `pageLink`, `publicUrl` or `noteMetadata` outputs. Done when the suite is green and `grep -nE 'curlLine\(|pageLink\(|publicUrl\(|noteMetadata\(' tests/tools_test.ts` returns no assertion line.
- [ ] T096 Finding 11 (HIGH): `tests/page_routes_test.ts:309` (U339) re-reads the store's row and compares its hash with `sha256Hex("late-token")`. Drop the seeded-clone check at `:162` (U267). Done with the suite green.
- [ ] T097 Findings 12 and 13 (MED): add exact-boundary tests.
  - `wrongLength`'s own message (`src/finish.ts:155`), with U210's `"8"` replaced by the full message.
  - A page token at exactly `upload_deadline` (`src/page_routes.ts:49`), after first deciding whether the page and `src/finish.ts:108` should agree at that instant.
  - An orphan at exactly the deadline (`schema.sql:386`).
  - The expired wording at exactly the deadline (`src/finish.ts:94`).

  Done when mutants M03, M11, M15 and S6 from the report each fail a test.
- [ ] T098 Findings 15–17 (MED):
  - Positive controls in `tests/imports_test.ts` (U303, U304).
  - A literal passage count in `tests/finish_test.ts:93-94` (U182).
  - U47 (`tests/verify.sql:240-247`) proves the add against a recorded pre-run state.

  Done when an emptied `sourceFiles()` fails U303 and U304, and a passage-split mutant fails U182.
- [ ] T099 Findings 18–25 (MED):
  - Replace `settle()`'s fixed yields with condition waits, and the H6/H7 sleeps.
  - Fixed random bytes in `tests/tools_test.ts:55`.
  - Split U88, U298, U83 and U52.
  - Name the `busySeconds` ±1 literals.
  - Use `pngBytes()`, `shortId` and `FakeFetch` where hand-rolled.
  - Remove the redundant halves (U353, U346, the U351 set-key half).
  - Label or split the roulette assertions.
  - Add a store test for `storage.remove` on a missing object.

  Done when the suite is green, and `grep -n 'setTimeout(r, 5)' tests/helpers/helpers_test.ts` and `grep -n getRandomValues tests/tools_test.ts` return nothing.
- [ ] T100 Findings 26–31 (LOW):
  - Restore the eleven corrupted red quotes in `tdd/cycle-log.md` from the stream logs (see the report's line list).
  - Move `settingsWith`, the `AttachmentRow` factory and `sha256Hex` into `tests/helpers/`.
  - Update `tests/acceptance_test.ts:10-11` and remove or justify `tests/helpers/todo.ts`.
  - Label H1–H4 as harness smoke tests.

  Done when `grep -c 'a semicolon and a space' tdd/cycle-log.md` returns 0 and the suite is green.
