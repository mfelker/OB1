---
feature: 007-thought-attachments # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 41 # US1 scenarios 1–4, US2 1–7, US3 1–3, US4 1–3, US5 1–4 (21), plus SC-001 to SC-020 (20), overlapping; 53 automated A behaviors, 7 live rows (see "Live acceptance")
planned_at: 9d20be9 # short SHA the list was derived from (fork main)
updated_at: 9d20be9 # short SHA of the last change to this file
suite_baseline: green # empty: the worktree and integrations/thought-attachments/ don't exist yet (T001); the suite command exited 2 ("worktree not found") and 0 tests ran
---

# Test List: Thought attachments (files linked to thoughts)

## How this list keeps every red real

- **No acceptance runner** is in the profile (`acceptance: null`). The outer loop is an **integration test against the composed app, not an end-to-end test**. It lives in `integrations/thought-attachments/tests/acceptance_test.ts` and drives `createApp(deps).fetch(new Request(…))` through the function's real request entry point: the MCP route and the page routes. It uses `FakeStore` (database and Storage), the real embedding and vision clients over `fake_fetch`, `loadSettings` over `tests/helpers/env.ts`, and the fake clock (tasks T012). Anything that needs a real Cloud project, the real core connector, the self-hosted stack or a real phone is in **Live acceptance** below. Those rows are not on the loop.
- **Outer loop first**: T012 writes A1–A53 as `todo(...)` tests, records each red with `RUN_TODO=1`, and the stream A flip tasks (T033, T046, T051, T059, T065) turn each one into a plain `Deno.test` in the commit that makes it green. T012 carries every A marker, so it is ticked last, when all of them are `DONE` (spec 006's T050 precedent).
- **Behavior ids prefix every test name** (`"U7 …"`, `"A3 …"`). Streams select one test with `--filter "/^<id> /"`. The slashes are required, and a run that reports `0 passed | 0 failed` is never evidence.
- **Order**: inner tables are grouped by the component file that owns them, in wave and stream order (integrator, then Q, X, E, then N, T, P, then A). Each stream has a contiguous id range, and inside it the ids follow that stream's task order in `tasks.md`. A stream takes its behaviors in id order, not table order. No U id is shared by tasks of two different streams.
- **SQL behaviors** are assertion blocks in `tests/verify.sql`, each added red first and run as a whole file (no single-test mode for SQL; tasks.md "SQL behaviors").
- **Both sides of a boundary** are separate rows. A rule with one tested side pins nothing.
- **Proxy for "the core search finds it"**: the core connector cannot run under fakes. Wherever a criterion says the core search finds a thought (SC-009, SC-010, SC-012, US1.2), the automated row asserts what the core search depends on: an ordinary `thoughts` row with the expected content and an embedding of the brain's dimension, produced by the configured embedding model. The real search is in the live runs (L1, L2, and quickstart scenarios 1, 2 and 4 in T076 and T077).
- **BLOCKED rows** wait on an owner answer in T005. Each names its T005 item. After T005, the integrator updates them to `PENDING` with the answered rule (re-run `/speckit-tdd-plan`, which refreshes the list and keeps every id).
- **`kind: live` rows** (Live acceptance) are a fork convention for owner-gated live runs, not a test tool. `/speckit-tdd-run` skips them. They carry no task marker; T076–T079 hold their evidence. Per the owner's earlier ruling, an audit counts a criterion covered only by them as a GAP, not HIGH.

## Trace ids

`traces` values are spec ids: `FR-…` and `SC-…`, then scenarios as `US<story>.<scenario>` (for example `US1.3` is User Story 1, acceptance scenario 3) and spec edge cases as `edge case "<words from the bullet>"`. Invariants recorded here:

- **INV-1**: the connector exposes exactly the seven tools of the spec's "MCP Tool Surface", with the names, input fields, defaults and annotations that `contracts/mcp-tools.md` settles. Rationale: the spec calls the names provisional and leaves them to planning, and the contract is where planning settled them.
- **INV-2**: no SQL file contains `DROP`, `TRUNCATE` or an unqualified `DELETE`. Rationale: CLAUDE.md guard rails and constitution Principle I. FR-016 requires the same for deletes ("never an unscoped delete").
- **INV-3**: every RPC name and named parameter that `src/store.ts` sends exists in `schema.sql`. Rationale: plan and tasks.md, "a mismatch fails in CI rather than on the live run".
- **INV-4**: the MCP route's CORS and `Accept` handling match the core server (`W/server/index.ts`), so a client that reaches the core connector reaches this one. Rationale: spec Assumptions ("a second connector next to the core one"), tasks T031.
- **INV-5**: `pdf-lib` is a test-only dependency (plan Primary Dependencies, "in tests only"). Rationale: no generated-fixture library ships in the function.

## Outer loop: acceptance behaviors

Test file: `integrations/thought-attachments/tests/acceptance_test.ts` (integration test against the composed app; see above).

### User Story 1 (flip task T033)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1 | With an existing thought and a 3-page text PDF within the caps, `attach_file` (thought id, name, type, size), a `PUT` of the bytes to the returned upload link, then `finish_attachment` leave the object stored, the row `processed` with `page_count` 3 and `derived_count` N ≥ 1, and N new thoughts whose metadata names the attachment and the parent | US1.1, FR-001, FR-004, FR-005 | example | PENDING | |
| A2 | For a sample PDF whose listed facts each sit on a known page, every fact is inside a passage thought whose first line is `From <base name>, pages a–b (attachment <short id>)` with a range that includes that page, and which has an embedding of the brain's dimension (findability within 10 results is live: L1) | US1.2, SC-001, FR-025, FR-007 | example | PENDING | |
| A3 | `attach_file` with the same file name, type and size while the first attachment is still `pending_upload` on that parent creates no second row and returns the existing attachment's id | US1.3, FR-012 | example | PENDING | |
| A4 | The same bytes uploaded to a second attachment on the same parent and finished after the first is `processed` create no duplicate passages and point the owner to the existing attachment | US1.3, FR-012 | example | BLOCKED (T005 item 4: the finish outcome when the unique `(parent_thought_id, content_hash)` index refuses the second one) | |
| A5 | An owner thought whose text equals a passage's body is unchanged after the PDF is finished (content, metadata, embedding), and the passage is saved as a separate row carrying the attachment's metadata | US1.4, FR-022 | example | PENDING | |
| A6 | A thought stored as the core capture stores it is found by `find_thought` (meaning mode) with words from it; its id is among the matches, with its first line and date; `attach_file` with that id succeeds | SC-009, FR-023 | example | PENDING | |
| A7 | The short id read from a passage's source line, given to `get_attachment`, returns that attachment and a download link | SC-012, FR-025, FR-014 | example | PENDING | |
| A8 | The same PDF attached to two thoughts and finished twice gives two attachments with two disjoint passage sets; a confirmed removal of one leaves the other's row and every one of its passages | SC-012, FR-022, edge case "same file attached to two different thoughts" | example | PENDING | |
| A9 | After a PDF is processed, every passage has `metadata.type` `reference` and `topics` `["attachment", "<base name>"]`, and none has type `observation` | SC-016, FR-028 | example | PENDING | |
| A10 | An MCP request with no key, or a wrong key, gets an authorization error, and no store row or Storage object changes | FR-018 | example | PENDING | |
| A11 | `tools/list` returns exactly `find_thought`, `attach_file`, `finish_attachment`, `get_attachment`, `list_attachments`, `remove_attachment` and `find_orphan_attachments`, with the contract's annotations | INV-1 | example | PENDING | |
| A12 | `attach_file` with an unknown `thought_id` is refused, and no row, link or note is created | FR-001, FR-016, edge case "parent thought does not exist" | example | PENDING | |
| A53 | A request to `/page/start` or `/page/finish` that carries the brain key but no valid page token gets `410`, and no row or object changes (the page routes refuse the brain key) | FR-018, FR-002 | example | PENDING | |

### User Story 2 (flip task T046)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A13 | A JPEG within the cap, finished with a configured (faked) vision model, gives exactly one caption thought starting `From shelf.jpg, photo (attachment <short id>)`, the row `processed`, and `caption_model` and `provenance.extractor_model` both equal to `VISION_MODEL` | US2.1, SC-002, FR-006, FR-008 | example | PENDING | |
| A14 | With only the page link's token and no brain key, `/page/start` returns an upload link, the `PUT` succeeds, `/page/finish` finishes, and afterwards a second `/page/start` and a second `/page/finish` with that token each get `410` | US2.2, FR-002, FR-024, edge case "upload page opened twice" | example | PENDING | |
| A15 | `attach_file` with a HEIC declared type is refused before upload with the "share it as JPEG" message, and no row or link is created | US2.3, FR-003 | example | PENDING | |
| A16 | `/page/start` with a picked HEIC file is refused with the "share it as JPEG" message, and no upload link is returned | US2.3, FR-003 | example | PENDING | |
| A17 | HEIC bytes uploaded under a JPEG declaration are refused at finishing with the "share it as JPEG" message and the phone steps; the stored object is deleted and the row is `refused` (the real-phone half is live: L7) | US2.4, FR-004 | example | PENDING | |
| A18 | `attach_file` with `note` and no thought id creates exactly one new thought with that text, metadata type `observation` and source `thought-attachments`, and an embedding of the brain's dimension; it is the attachment's parent, with `parent_created_here` true | US2.5, SC-010, FR-001 | example | PENDING | |
| A19 | After a page upload, `/page/finish` with no MCP call returns the outcome `processed` with the caption, and the caption thought exists | US2.6, SC-011, FR-024 | example | PENDING | |
| A20 | A page token for attachment X, used on `/page/start` and `/page/finish`, never signs an upload for attachment Y nor finishes it; Y's row and object are unchanged | SC-011, FR-024 | example | PENDING | |
| A21 | With `VISION_*` unset, a finished photo stays stored and fetchable, the row is `not_captioned` with the reason, and no caption thought exists | US2.7, FR-006 | example | PENDING | |
| A22 | With the vision endpoint answering 500, a finished photo is `not_captioned` with that reason, and no caption thought exists | US2.7, FR-006 | example | PENDING | |
| A23 | A `not_captioned` photo finished again after the vision model is back ends `processed` with exactly one caption thought | SC-015, FR-027 | example | PENDING | |
| A24 | A `processed` photo rebuilt (`rebuild: true`) with a different `VISION_MODEL` ends with exactly one caption thought, written by the new model | SC-015, FR-027 | example | PENDING | |
| A25 | A `processed` photo whose rebuild fails because the vision endpoint is down keeps exactly its old caption thought, stays `processed`, and the result reports `last_rebuild_error` with the reason | SC-018, FR-027 | example | PENDING | |
| A26 | With `PUBLIC_BASE_URL` set to a LAN address, the `upload.url`, the `curl` line and the `/page/start` upload link all start with it, and none contains the internal `SUPABASE_URL` origin | FR-002, FR-019 | example | PENDING | |

### User Story 3 (flip task T051)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A27 | `get_attachment` on a processed attachment returns its name, type, size and state, and a download link signed for 600 seconds, with that lifetime stated in the result | US3.1, FR-014, SC-003 | example | PENDING | |
| A28 | `list_attachments` for a thought with two attachments in different states returns both, each with name, type, size, state and `derived_count` | US3.2, FR-015 | example | PENDING | |
| A29 | `get_attachment` on a `pending_upload` and on a `refused` attachment returns no download link | SC-003, FR-014 | example | PENDING | |

### User Story 4 (flip task T059)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A30 | `attach_file` for a PDF declared over `MAX_PDF_MB` is refused before upload, naming the limit and the declared size; no row and no link | US4.1, FR-003, SC-005 | example | PENDING | |
| A31 | An uploaded PDF with `MAX_PDF_PAGES` + 1 pages is refused at finishing: object deleted, row `refused` with the page count, a message naming the planned background processing, and zero derived thoughts | US4.1, FR-004, FR-013, SC-005 | example | PENDING | |
| A32 | A 40 MB upload declared as a 4 MB JPEG is refused at finishing: object deleted, row `refused` with the actual size, zero derived thoughts, and `find_orphan_attachments` lists it | SC-013, US4.1, FR-004, SC-005 | example | PENDING | |
| A33 | A text-less PDF ends `scanned` with zero passages, the result says text search won't cover it yet, and `get_attachment` still returns a download link | US4.2, FR-010, SC-005 | example | PENDING | |
| A34 | When the embedding endpoint fails on the second batch, no derived thought from the attempt remains and the row is `failed` with the reason; finishing again after the endpoint recovers ends `processed` | US4.3, FR-011, SC-005 | example | PENDING | |
| A35 | A file declared `image/png` whose uploaded bytes are a JPEG of the declared size is refused at finishing, naming the actual type | FR-004, edge case "declares one type or size but uploads another" | example | PENDING | |
| A36 | Corrupt bytes declared as a PDF end `failed` with a readable reason; the file is still fetchable, and there are zero passages | FR-011, edge case "encrypted or corrupt", SC-005 | example | PENDING | |
| A37 | `finish_attachment` before any upload returns "no file uploaded yet", and the row stays `pending_upload` | FR-001, edge case "upload link expires before the client uploads" | example | PENDING | |
| A38 | `finish_attachment` after the upload deadline, with no upload, returns "upload window expired", and the row is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | PENDING | |
| A39 | When the embedding endpoint returns 768-number vectors for a 1536-dimension brain, finishing ends `failed` naming both lengths, with zero derived thoughts | FR-007, edge case "vectors of a different length", SC-005 | example | PENDING | |
| A40 | While a photo finish is held at the vision call, a second `finish_attachment` and a confirmed `remove_attachment` on it each return busy naming finishing, and nothing changes | SC-014, FR-026, edge case "page and the AI finish the same attachment" | example | PENDING | |
| A41 | After that finish completes, a repeat `finish_attachment` returns the existing outcome with no new derived thought and no embedding or vision request | SC-014, FR-012 | example | PENDING | |
| A42 | After that, a confirmed `remove_attachment` succeeds | SC-014, FR-016 | example | PENDING | |
| A43 | With default settings, `/page/start` 20 minutes after `attach_file` returns an upload link | SC-017, FR-001 | example | PENDING | |
| A44 | `/page/start` 65 minutes after `attach_file` gets `410` with the expired message, and `find_orphan_attachments` lists that pending attachment | SC-017, FR-021, edge case "after its expiry" | example | PENDING | |
| A45 | After a simulated killed finish (claim taken, never released), a finish before `BUSY_SECONDS` is busy; one after it proceeds, finds no derived thought left from the killed run, and ends `processed` | SC-019, FR-026 | example | PENDING | |

### User Story 5 (flip task T065)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A46 | A confirmed removal of a processed attachment deletes its object, row and every derived thought; `get_attachment` then reports not found; the parent thought and its other attachment are unchanged | US5.1, FR-016 | example | PENDING | |
| A47 | A removal without `confirm` deletes nothing and lists the file and its derived-thought count | US5.2, FR-016 | example | PENDING | |
| A48 | An attachment whose parent thought was deleted outside the integration is listed by `find_orphan_attachments` with its file name and derived count, and a confirmed removal removes it | US5.3, FR-021 | example | PENDING | |
| A49 | An attachment started with `note` whose link expired unused is listed as an orphan, and its confirmed removal removes the note too | US5.4, SC-020, FR-016 | example | PENDING | |
| A50 | The same, with a second processed attachment pointing to that note: the note stays | US5.4, SC-020, FR-016 | example | PENDING | |
| A51 | `attach_file` with `note` and a HEIC declared type saves no thought and makes no embedding request | SC-020, FR-003 | example | PENDING | |
| A52 | After a full run (command upload, page upload, finish, rebuild, a refusal, and a file name given with an absolute path), no `thoughts` row or attachment row holds a signed URL, the MCP key, the service-role key, a page token or an absolute path | SC-007, FR-009, edge case "personal or path information" | example | PENDING | |

## Live acceptance (owner-gated, not on the loop)

`kind: live`. These need a real Cloud project, spec 006's stack, the real core connector or a real phone. They are run in quickstart.md by the owner, with evidence under `evidence/cloud/`, `evidence/self-hosted/` and `evidence/sc-006-007.md`. They are not automated, and they carry no task marker: the integrator ticks T076–T079 on evidence.

| id | criterion and observable result | traces | kind | quickstart | task |
| -- | ------------------------------- | ------ | ---- | ---------- | ---- |
| L1 | Every listed sample question returns its expected passage within the core `search_thoughts` default 10 results (pass/fail per question) | SC-001, US1.2 | live | 2 | T076, T077 |
| L2 | A search naming each sample photo's stored object returns its caption within 10 results (pass/fail per photo) | SC-002 | live | 4 | T076, T077 |
| L3 | A file fetched through its download link is byte-identical to the original (hashes compared), and the same link is refused after its expiry | SC-003, US3.3 | live | 3 | T076, T077 |
| L4 | On Cloud, a PDF at the default page and size caps and an image at the default size cap each finish in one call with no `546`; the measured compute and wall time are recorded, and the defaults are lowered test-first if not | SC-004, FR-017 | live | 12 | T076 |
| L5 | The attach, search and fetch flow for one PDF and one photo behaves identically on Cloud and on 006's stack, differing only in settings | SC-006, FR-019 | live | all | T079 |
| L6 | A query over every derived thought and attachment row from both live runs finds no signed link, key, token or absolute path | SC-007, FR-009 | live | 13 | T079 |
| L7 | On both platforms, a photo taken with the phone's default camera settings, uploaded through the page with no app and no shell, ends captioned and searchable | SC-008, US2.2, US2.4, FR-002 | live | 4 | T076, T077 |

## Inner loop: unit behaviors

### Integrator (Phase 2)

#### `src/settings.ts` (T008)

Test file: `tests/settings_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1 | With its variable unset, each documented default applies: `EMBEDDING_API_BASE` `https://openrouter.ai/api/v1`, `EMBEDDING_MODEL` `openai/text-embedding-3-small`, `EMBEDDING_BATCH_SIZE` 64, `ATTACHMENTS_BUCKET` `ob1-files`, `MAX_IMAGE_MB` 10, `MAX_PDF_MB` 25, `MAX_PDF_PAGES` 50, `PASSAGE_MAX_CHARS` 1500, `SCANNED_MIN_CHARS_PER_PAGE` 20, `UPLOAD_LINK_MINUTES` 60, `DOWNLOAD_LINK_SECONDS` 600 | FR-017 | example | PENDING | |
| U2 | A set variable overrides its default (for example `MAX_PDF_PAGES=30` gives 30, `ATTACHMENTS_BUCKET=files` gives `files`) | FR-017 | example | PENDING | |
| U3 | With `EMBEDDING_API_KEY` unset, the embedding key is `OPENROUTER_API_KEY`'s value | FR-007 | example | PENDING | |
| U4 | With both set, `EMBEDDING_API_KEY` wins over `OPENROUTER_API_KEY` | FR-007 | example | PENDING | |
| U5 | With `PUBLIC_BASE_URL` unset, the public base is `SUPABASE_PUBLIC_URL` | FR-002, FR-019 | example | PENDING | |
| U6 | With `PUBLIC_BASE_URL` and `SUPABASE_PUBLIC_URL` unset, the public base is `SUPABASE_URL` | FR-002, FR-019 | example | PENDING | |
| U7 | A set `PUBLIC_BASE_URL` wins over both fallbacks | FR-002 | example | PENDING | |
| U8 | With `MCP_ACCESS_KEY` unset, the result is `{ ok: false }` with a problem naming `MCP_ACCESS_KEY` | FR-018 | example | PENDING | |
| U9 | With `VISION_API_BASE` unset, or `VISION_MODEL` unset (each alone), vision is not configured | FR-006 | example | PENDING | |
| U10 | With `VISION_API_BASE` and `VISION_MODEL` set and `VISION_API_KEY` unset, vision is configured | FR-006 | example | PENDING | |
| U11 | No setting's value appears in any problem's reason | FR-009 | example | PENDING | |
| U12 | A set `BUSY_SECONDS` is used as given | FR-026, FR-017 | example | PENDING | |
| U13 | With `BUSY_SECONDS` unset on Supabase Cloud, the busy expiry is 160 seconds | FR-026, FR-017 | example | BLOCKED (T005 item 1: which platform signal picks Cloud) | |
| U14 | With `BUSY_SECONDS` unset elsewhere, the busy expiry is 410 seconds | FR-026, FR-017 | example | BLOCKED (T005 item 1) | |
| U15 | A set `UPLOAD_PAGE_URL` is used as given | FR-002 | example | PENDING | |
| U16 | With `UPLOAD_PAGE_URL` unset, the page address is the default `<function URL>/upload` | FR-002 | example | BLOCKED (T005 item 2: how the function URL and the function's name are built) | |
| U17 | A non-numeric value for a numeric setting (`MAX_PDF_PAGES=abc`) gives the answered outcome (a named problem, or the default) | FR-017 | example | BLOCKED (T005 item 3) | |
| U18 | A zero or negative value for a numeric setting (`MAX_PDF_PAGES=0`) gives the answered outcome | FR-017 | example | BLOCKED (T005 item 3) | |
| U19 | A decimal MB cap (`MAX_IMAGE_MB=2.5`) gives the answered outcome | FR-017 | example | BLOCKED (T005 item 3: whether the MB caps accept decimals) | |

#### `src/links.ts` (T009)

Test file: `tests/links_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U20 | `publicUrl` replaces a signed link's internal origin (`SUPABASE_URL`, for example `http://api-gw:8000`) with `PUBLIC_BASE_URL` and keeps its path and query exactly | FR-002, FR-019 | example | PENDING | |
| U21 | `publicUrl` returns the link unchanged when `PUBLIC_BASE_URL` is already its origin (Cloud) | FR-019 | example | PENDING | |
| U22 | `pageLink` is `UPLOAD_PAGE_URL` + `#t=` + the token, and the token appears nowhere before the `#` | FR-002 | example | PENDING | |
| U23 | `curlLine` is a `PUT` to the upload URL that carries every returned header and the given file path | FR-002 | example | PENDING | |
| U24 | `curlLine` contains neither the MCP access key nor the service-role key | FR-002, FR-018 | example | PENDING | |

#### `tests/helpers/fake_store.ts` (T011, fake fidelity)

Test file: `tests/helpers/fake_store_test.ts`. The acceptance tests rely on these database semantics. Stream Q asserts the same rules against real SQL (U53–U112), so a fake that drifts shows up as a disagreement.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U25 | A claim while another unexpired claim exists returns `{ busy }` naming the holder's operation | FR-026 | example | PENDING | |
| U26 | A claim after the holder's expiry, by the injected clock, succeeds with a new token | FR-026 | example | PENDING | |
| U27 | `writeDerived` or `setState` with a stale or foreign claim token returns an error and changes nothing | FR-026 | example | PENDING | |
| U28 | `writeDerived` failing partway leaves the previous derived set and state unchanged | FR-011, FR-027 | example | PENDING | |
| U29 | A `writeDerived` row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged (never a merge) | FR-022 | example | PENDING | |
| U30 | `removeAttachment` removes only that attachment's derived thoughts and its row | FR-016, FR-022 | example | PENDING | |
| U31 | `removeAttachment` removes the parent note only under FR-016's exception | FR-016 | example | PENDING | |
| U32 | `orphans` lists a row whose parent is gone, an expired `pending_upload` row and a `refused` row, each with why | FR-021 | example | PENDING | |
| U33 | `insertNote` with a fingerprint that already exists returns that thought's id with `created: false` and leaves it unchanged | FR-001, FR-016 | example | PENDING | |

### Stream Q: data (wave 1, `ta-data`)

#### `schema.sql` (T014, T015, T016, T038, T055, T061)

Test file: `tests/verify.sql` (one assertion block per behavior), except U52.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U34 | `thought_attachments` has every column of `data-model.md` with its type, default and not-null rule, and `parent_thought_id` has no foreign key | FR-020, FR-016 | example | PENDING | |
| U35 | `declared_type` accepts each of `application/pdf`, `image/jpeg`, `image/png` and `image/webp`, and rejects any other value | FR-003 | example | PENDING | |
| U36 | `expected_kind` accepts `photo`, `pdf` and empty, and rejects any other value | FR-001 | example | PENDING | |
| U37 | `sensitivity_tier` accepts `standard`, `personal` and `restricted`, defaults to `personal`, and rejects any other value | FR-008 | example | PENDING | |
| U38 | `state` accepts the six states of `data-model.md` and rejects any other value | FR-004 | example | PENDING | |
| U39 | `busy_op` accepts `finish`, `rebuild` and `remove`, and rejects any other value | FR-026 | example | PENDING | |
| U40 | An update to a row advances its `updated_at` through the trigger | FR-020 | example | PENDING | |
| U41 | Indexes on `parent_thought_id` and on `content_hash` exist | FR-020 | example | PENDING | |
| U42 | A second non-`refused` row with the same `parent_thought_id` and `content_hash` is rejected by the unique index | FR-012 | example | PENDING | |
| U43 | A `refused` row with the same parent and `content_hash` doesn't block a new row (the index excludes `refused`) | FR-004, SC-013 | example | PENDING | |
| U44 | Two rows on the same parent with no `content_hash` yet are both allowed (the index covers only set hashes) | FR-012 | example | PENDING | |
| U45 | RLS is enabled on `thought_attachments`, with no policy for `anon` or `authenticated` | FR-018 | example | PENDING | |
| U46 | `service_role` has select, insert, update and delete on `thought_attachments` | FR-020 | example | PENDING | |
| U47 | On a `thoughts` table without `content_fingerprint`, the file adds the column and `idx_thoughts_fingerprint` | FR-020 | example | PENDING | |
| U48 | On a `thoughts` table that already has them, the file adds no second column or index (the index count on `thoughts` is unchanged) | FR-020 | example | PENDING | |
| U49 | Where a `storage` schema exists, the `ATTACHMENTS_BUCKET` bucket (`ob1-files`) is private, allows exactly the four accepted MIME types and has no size limit of its own | FR-018, FR-020 | example | BLOCKED (not a T005 item: no test database here has a `storage` schema, because fork-ci's bootstrap creates none and R12 makes the check conditional; the spec's Testing Requirements still ask for an executable private-bucket test. Owner to choose a runnable target, or accept the live runs) | |
| U50 | Where no `storage` schema exists, the file runs without error and skips the bucket | FR-019, FR-020 | example | PENDING | |
| U51 | Running the whole file twice on the same database raises nothing and leaves one of each object | FR-020 | example | PENDING | |
| U52 | Neither `schema.sql` nor `tests/verify.sql` contains `DROP`, `TRUNCATE` or an unqualified `DELETE` (a static scan in `tests/schema_drift_test.ts`) | INV-2, FR-016 | example | PENDING | |
| U53 | The write-derived function, with the caller's unexpired claim token, inserts the given rows | FR-011, FR-026 | example | PENDING | |
| U54 | The write-derived function with a matching token whose `busy_until` has passed is refused, and writes nothing | FR-026 | example | PENDING | |
| U55 | Inserted rows' `content_fingerprint` equals the expression of `W/docs/01-getting-started.md` step 2.6 applied to their content | FR-022, FR-012 | example | PENDING | |
| U56 | A row whose fingerprint equals an existing owner thought's raises, and that thought's content and metadata are unchanged | FR-022, US1.4 | example | PENDING | |
| U57 | A write replaces the attachment's previous derived set and sets its state fields and `derived_count` in the same call | FR-027, FR-011 | example | PENDING | |
| U58 | A write that fails partway (its second row conflicts) leaves the previous set, state and `derived_count` | FR-011, FR-027 | example | PENDING | |
| U59 | A write for one attachment leaves another attachment's derived thoughts untouched | FR-022 | example | PENDING | |
| U60 | The write-derived function's outcome for bytes that duplicate another attachment's `content_hash` on the same parent | FR-012, US1.3 | example | BLOCKED (T005 item 4) | |
| U61 | A claim while an unexpired claim exists is refused and returns the running `busy_op` | FR-026 | example | PENDING | |
| U62 | A claim after `busy_until` succeeds, with a `busy_token` different from the previous one | FR-026 | example | PENDING | |
| U63 | A claim on one attachment doesn't block a claim on another | FR-026 | example | PENDING | |
| U64 | Release with the holder's token clears the claim, so an immediate claim succeeds | FR-026 | example | PENDING | |
| U65 | Release with another token leaves the claim in place | FR-026 | example | PENDING | |
| U66 | The dimension function returns 1536 on fork-ci's bootstrap (`vector(1536)`) | FR-007 | example | PENDING | |
| U67 | The exact-text find returns id, first line and capture date for a thought whose content contains the query as given | FR-023 | example | PENDING | |
| U68 | A query containing `%`, `,`, `)` and `'` matches only content that contains those characters literally (no wildcard, no injected filter) | FR-023 | example | PENDING | |
| U84 | Inserting a note whose text is new adds a thought with the note's content and `data-model.md` "Parent note" metadata, and reports it as created | FR-001 | example | PENDING | |
| U85 | Inserting a note whose fingerprint exists returns that thought's id as not created, and leaves it unchanged | FR-001, FR-016 | example | PENDING | |
| U86 | The page-token lookup finds a row by `page_token_hash` only | FR-002, FR-024 | example | PENDING | |
| U87 | Consuming a page token succeeds once and clears the hash; a second consume fails | FR-002, FR-024 | example | PENDING | |
| U93 | A write or set-state with an old token, after a newer claim took over, is refused and changes nothing | FR-026, SC-019 | example | PENDING | |
| U94 | A set-state under a valid claim records `state` and `state_reason` and leaves the derived thoughts | FR-004, FR-010 | example | PENDING | |
| U95 | Remove under a valid claim deletes that attachment's derived thoughts and its row, scoped by its id, in one transaction | FR-016 | example | PENDING | |
| U96 | Remove leaves the parent thought, and another attachment of the same file on another thought with all its derived thoughts | FR-016, FR-022, SC-012 | example | PENDING | |
| U97 | Remove without a valid claim is refused and deletes nothing | FR-026 | example | PENDING | |
| U98 | Remove deletes the parent note when `parent_created_here` is true, the attachment ended `refused`, and no other attachment points to the note | FR-016, SC-020 | example | PENDING | |
| U99 | Remove deletes the parent note when `parent_created_here` is true, the attachment is `pending_upload` past its deadline, and no other attachment points to the note | FR-016, SC-020 | example | PENDING | |
| U100 | Remove keeps the note when another attachment points to it | FR-016, SC-020 | example | PENDING | |
| U101 | Remove keeps the parent when `parent_created_here` is false | FR-016 | example | PENDING | |
| U102 | Remove keeps the note when the attachment is `processed` | FR-016 | example | PENDING | |
| U103 | Remove keeps the note when the attachment is `pending_upload` before its deadline | FR-016 | example | PENDING | |
| U104 | The preview reports the same derived count and note flag the remove would, and deletes nothing | FR-016, US5.2 | example | PENDING | |
| U105 | Orphans lists a row whose parent thought is gone, with why and `derived_count` | FR-021 | example | PENDING | |
| U106 | Orphans lists a `pending_upload` row past its `upload_deadline` | FR-021, SC-017 | example | PENDING | |
| U107 | Orphans omits a `pending_upload` row before its `upload_deadline` | FR-021, SC-017 | example | PENDING | |
| U108 | Orphans lists a `refused` row | FR-021, SC-013 | example | PENDING | |
| U109 | Orphans omits a `processed` row whose parent exists | FR-021 | example | PENDING | |

#### `src/store.ts` (T017, T018, T038, T048, T062)

Test file: `tests/store_test.ts` (supabase-js over the fake fetch).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U69 | `thoughtExists` is true for an existing id and false for an unknown one | FR-001 | example | PENDING | |
| U70 | `matchThoughts` sends the embedding and limit to the base `match_thoughts` and maps the reply to `ThoughtMatch` | FR-023 | example | PENDING | |
| U71 | `findThoughtsExact` sends the text as an RPC parameter, never inside a filter string | FR-023 | example | PENDING | |
| U72 | `embeddingDimension` returns the dimension function's number | FR-007 | example | PENDING | |
| U73 | `claim` maps a refused claim to `{ busy: op }` and a success to `{ token }` | FR-026 | example | PENDING | |
| U74 | `getAttachment` with a full id returns the row | FR-015 | example | PENDING | |
| U75 | `getAttachment` with an 8-character short id returns the row when exactly one matches | FR-025 | example | PENDING | |
| U76 | `getAttachment` with a short id that matches two rows returns `ambiguous` | FR-025 | example | PENDING | |
| U77 | `getAttachment` with an unknown id returns `not_found` | FR-014 | example | PENDING | |
| U78 | A database error maps to `{ error }` whose text contains no service-role key | FR-009 | example | PENDING | |
| U79 | `signUpload` targets `ATTACHMENTS_BUCKET` at `attachments/<id>/<file_name>` and returns Storage's URL unchanged | FR-001, FR-018 | example | PENDING | |
| U80 | `objectInfo` returns the object's size and creation time, and `null` when there is no object | FR-004 | example | PENDING | |
| U81 | `download` returns the stored bytes | FR-004 | example | PENDING | |
| U82 | `deleteObject` deletes that path and no other | FR-004, FR-016 | example | PENDING | |
| U88 | `insertNote`, `attachmentForPageToken` and `consumePageToken` map the RPC replies to `{ id, created }`, the row and a boolean | FR-001, FR-024 | example | PENDING | |
| U89 | `signDownload` passes the path and the seconds to Storage and returns the signed URL | FR-014 | example | PENDING | |
| U90 | `listByParent` returns that parent's attachments only | FR-015 | example | PENDING | |
| U91 | `attachmentForDerived` returns the attachment named by the thought's `metadata.attachment_id` | FR-015 | example | PENDING | |
| U92 | `attachmentForDerived` on a thought without `attachment_id` returns `null` | FR-015 | example | PENDING | |
| U110 | `removalPreview` maps the preview reply to `{ derived, noteWouldGo }` | FR-016 | example | PENDING | |
| U111 | `removeAttachment` passes the claim token and maps the reply to `{ derived, noteRemoved }` | FR-016 | example | PENDING | |
| U112 | `orphans` passes the current time and maps the reply to `{ row, why }[]` | FR-021 | example | PENDING | |

#### `tests/schema_drift_test.ts` (T019; `src/store.ts` against `schema.sql`)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U83 | Every RPC name and named parameter that `src/store.ts` sends exists in `schema.sql`, or is the base `match_thoughts` | INV-3 | example | PENDING | |

### Stream X: files (wave 1, `ta-files`)

#### `src/intake.ts` (T020, T035, T053)

Test file: `tests/intake_test.ts`. "The cap" means the cap's byte value; how many bytes an MB is stays unplaced (see below).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U113 | `baseName` drops POSIX directory parts (`/Users/a/b/manual.pdf` gives `manual.pdf`) | FR-009, edge case "personal or path information" | example | PENDING | |
| U114 | `baseName` drops Windows directory parts and the drive (`C:\Users\a\manual.pdf` gives `manual.pdf`) | FR-009, edge case "personal or path information" | example | PENDING | |
| U115 | `baseName` removes control characters | FR-009 | example | PENDING | |
| U116 | `checkDeclared` accepts each of the four accepted types within its cap | FR-003 | example | PENDING | |
| U117 | `checkDeclared` refuses any other type (for example `application/zip`), naming the accepted types | FR-003 | example | PENDING | |
| U118 | An image declared at exactly the image cap is accepted | FR-003 | example | PENDING | |
| U119 | An image declared one byte over the image cap is refused, naming the cap and the declared size | FR-003 | example | PENDING | |
| U120 | A PDF declared at exactly the PDF cap is accepted | FR-003 | example | PENDING | |
| U121 | A PDF declared one byte over the PDF cap is refused, naming the cap and the declared size | FR-003, US4.1 | example | PENDING | |
| U141 | A HEIC declared type (`image/heic`, `image/heif`) is refused with "share it as JPEG" and the steps on iPhone and Android | FR-003, US2.3 | example | PENDING | |
| U142 | A file name ending `.heic` or `.heif`, in any case, is refused with the same message whatever the declared type | FR-003, US2.3 | example | PENDING | |
| U143 | `sniffType` identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes | FR-004 | example | PENDING | |
| U144 | `sniffType` returns `null` for any other bytes and for empty input | FR-004 | example | PENDING | |
| U148 | `checkActual` accepts a file whose sniffed type and exact size equal the declaration and are within the caps | FR-004 | example | PENDING | |
| U149 | `checkActual` refuses a sniffed type that differs from the declared one, naming the actual type | FR-004, edge case "declares one type or size but uploads another" | example | PENDING | |
| U150 | `checkActual` refuses an actual size one byte different from the declared one, naming the actual size | FR-004, SC-013 | example | PENDING | |
| U151 | `checkActual` accepts a PDF of exactly `MAX_PDF_PAGES` pages | FR-004, FR-013 | example | PENDING | |
| U152 | `checkActual` refuses a PDF of `MAX_PDF_PAGES` + 1 pages, naming `MAX_PDF_PAGES`, the actual page count and the planned background processing | FR-013, US4.1 | example | PENDING | |
| U153 | `checkActual` refuses an actual size over its type's cap, naming the cap and the actual size, and for a PDF also the planned background processing | FR-004, FR-013, US4.1 | example | PENDING | |
| U154 | `checkActual` refuses HEIC bytes with the "share it as JPEG" message, whatever was declared | FR-004, US2.4 | example | PENDING | |
| U155 | `checkActual` refuses bytes `sniffType` doesn't recognise as a type that isn't accepted | FR-004 | example | PENDING | |

#### `src/pdf.ts` (T021, T054)

Test file: `tests/pdf_test.ts` (fixtures generated with `pdf-lib` at test time).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U122 | `openPdf` of a 3-page fixture reports `pageCount` 3 | FR-004, FR-013 | example | PENDING | |
| U123 | `pageTexts` returns each page's text in page order | FR-005 | example | PENDING | |
| U156 | `isScanned` is true when the average of non-space characters per page is one under `SCANNED_MIN_CHARS_PER_PAGE` | FR-010 | example | PENDING | |
| U157 | `isScanned` is false at exactly `SCANNED_MIN_CHARS_PER_PAGE` | FR-010 | example | PENDING | |
| U158 | Whitespace-only page text counts as zero characters | FR-010 | example | PENDING | |
| U159 | `openPdf` of corrupt bytes returns `{ error }` with a readable reason, without throwing | FR-011, edge case "encrypted or corrupt" | example | PENDING | |
| U160 | `openPdf` of an encrypted PDF returns `{ error }` with a readable reason (only if an encrypted fixture can be generated without a committed binary; `pdf-lib` cannot encrypt. Otherwise this becomes `DROPPED` here and is checked live in T077) | FR-011, edge case "encrypted or corrupt" | example | PENDING | |

#### `src/passages.ts` (T022)

Test file: `tests/passages_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U124 | Every passage, source line included, is at most `PASSAGE_MAX_CHARS` | FR-005, FR-025 | example | PENDING | |
| U125 | Text that fits in exactly `PASSAGE_MAX_CHARS` with its source line is one passage | FR-005, FR-025 | example | PENDING | |
| U126 | Text one character longer than that is two passages | FR-005, FR-025 | example | PENDING | |
| U127 | Passages keep reading order, and together their bodies contain all of the page text, whitespace aside (sampled on fixtures; no property library in the profile) | FR-005 | example | PENDING | |
| U128 | A passage within one page records that page as both ends of its range | FR-005 | example | PENDING | |
| U129 | A passage that crosses a page boundary records both pages | FR-005 | example | PENDING | |
| U130 | A run of non-space text longer than the maximum is split into passages that are each within it | FR-005, edge case "very long passage" | example | PENDING | |

#### `src/derived.ts` (T023, T036)

Test file: `tests/derived_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U131 | `sourceLine` for a passage on pages 12–13 is `From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)` (data-model.md example) | FR-025 | example | PENDING | |
| U132 | The short id in a source line is the first 8 hex characters of the attachment id | FR-025 | example | PENDING | |
| U133 | `fingerprint` equals the normalisation of `W/docs/01-getting-started.md` step 2.6 for content with surrounding whitespace, capitals and runs of whitespace | FR-012, FR-022 | example | PENDING | |
| U134 | A passage row's content is the source line, a line break, then the passage text | FR-025 | example | PENDING | |
| U135 | A passage row's metadata carries the ingestion contract fields: `source` and `source_type` `local_document`, `source_label` the base name, `importer_name` `thought-attachments`, `importer_version`, `imported_at` (ISO 8601 UTC from the injected clock), `input_hash` the attachment's `content_hash`, `content_fingerprint` `sha256:` plus the fingerprint, and `sensitivity_tier` | FR-008 | example | PENDING | |
| U136 | A passage row's metadata has `type` `reference` and `topics` `["attachment", "<base name>"]` | FR-028 | example | PENDING | |
| U137 | A passage row's `provenance` is `deterministic_conversion` with `source_locator` (`pages 12–13`), `artifact` (the base name) and `review_status` `unreviewed` | FR-008 | example | PENDING | |
| U138 | A passage row's metadata has `attachment_id` and `parent_thought_id` | FR-008, FR-015 | example | PENDING | |
| U139 | An attachment with tier `restricted` gives metadata with `sensitivity_tier` `restricted` | FR-008 | example | PENDING | |
| U140 | The metadata contains no URL, no token and no absolute path, even when built from a file name that held a path | FR-009 | example | PENDING | |
| U145 | A caption row's content is `From shelf.jpg, photo (attachment 9f8e7d6c)`, a line break, then the caption | FR-025, FR-006 | example | PENDING | |
| U146 | A caption row's `provenance` is `llm_extraction` with `source_locator` `photo` and `extractor_model` the model | FR-008, FR-006 | example | PENDING | |
| U147 | `noteMetadata` is `{ type: "observation", source: "thought-attachments", source_type: "thought_attachments_note", imported_at }` | FR-001 | example | PENDING | |

### Stream E: model clients (wave 1, `ta-models`)

#### `src/embeddings.ts` (T024)

Test file: `tests/embeddings_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U161 | `embed` sends `POST <EMBEDDING_API_BASE>/embeddings` with `EMBEDDING_MODEL` and an array input | FR-007 | example | PENDING | |
| U162 | 64 texts at the default batch size go in one request | FR-007 | example | PENDING | |
| U163 | 65 texts at the default batch size go in two requests (64, then 1) | FR-007 | example | PENDING | |
| U164 | With batch size 1, each text goes in its own request | FR-007 | example | PENDING | |
| U165 | Each request carries `Authorization: Bearer` with the configured embedding key | FR-007 | example | PENDING | |
| U166 | The vectors come back in input order across batches | FR-007 | example | PENDING | |
| U167 | An unreachable endpoint fails the call with a reason naming it unreachable | FR-011 | example | PENDING | |
| U168 | A non-2xx status fails the call with the status in the reason | FR-011 | example | PENDING | |
| U169 | A malformed body (no data, or a vector count different from the inputs) fails the call | FR-011 | example | PENDING | |
| U170 | A failure in a later batch fails the whole call, with no partial vectors returned | FR-011 | example | PENDING | |
| U171 | A key value that appears in a server's error body is redacted from the reason | FR-009 | example | PENDING | |

#### `src/vision.ts` (T037)

Test file: `tests/vision_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U172 | `configured` is false when `VISION_API_BASE` or `VISION_MODEL` is unset | FR-006 | example | PENDING | |
| U173 | `caption` sends `POST <VISION_API_BASE>/chat/completions` with `VISION_MODEL` and the image as a `data:<type>;base64,…` URL of its real type | FR-006 | example | PENDING | |
| U174 | The prompt asks for the visible objects, places, labels and text | FR-006 | example | PENDING | |
| U175 | With `VISION_API_KEY` set, the request carries it as a bearer token | FR-006 | example | PENDING | |
| U176 | With `VISION_API_KEY` unset, the request has no `Authorization` header | FR-006 | example | PENDING | |
| U177 | A successful reply gives the caption text and the model | FR-006, FR-008 | example | PENDING | |
| U178 | An unreachable endpoint fails with a reason | FR-006 | example | PENDING | |
| U179 | A non-2xx status fails with the status in the reason | FR-006 | example | PENDING | |
| U180 | An empty or whitespace-only caption fails with a reason | FR-006 | example | PENDING | |
| U181 | A key value in an error is redacted | FR-009 | example | PENDING | |

### Stream N: finishing (wave 2, `ta-finish`)

#### `src/finish.ts` (T025, T026, T039, T040, T056, T057, T058)

Test file: `tests/finish_test.ts` (the real X and E modules, `FakeStore`, `fake_fetch`, fake clock).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U182 | A pending PDF with a matching upload ends `processed`, with `derived_count` equal to the passage count and `page_count` set | FR-005, US1.1 | example | PENDING | |
| U183 | Finishing sets `actual_type`, `actual_size`, `page_count`, `content_hash` (`sha256:<hex>` of the stored bytes) and `processed_at` | FR-004, FR-008 | example | PENDING | |
| U184 | Every derived row's `input_hash` equals the attachment's `content_hash` | FR-008 | example | PENDING | |
| U185 | After a `processed` finish, a new claim on the attachment succeeds at once (the claim was released) | FR-026 | example | PENDING | |
| U186 | An owner thought equal to a passage's body is unchanged after the finish | FR-022, US1.4 | example | PENDING | |
| U187 | A plain finish on `processed` returns the existing outcome with no embedding or vision request and no write (it never rebuilds) | FR-012, FR-027 | example | PENDING | |
| U188 | The finish outcome when the uploaded bytes duplicate another attachment's `content_hash` on the same parent | FR-012, US1.3 | example | BLOCKED (T005 item 4) | |
| U189 | A photo with a caption gives one derived thought, `processed`, and `caption_model` set | FR-006, US2.1 | example | PENDING | |
| U190 | A 300-character caption is returned whole in the outcome | FR-024 | example | PENDING | |
| U191 | A 301-character caption is returned as its first 300 characters, while the derived thought keeps the full caption | FR-024, FR-006 | example | PENDING | |
| U192 | With vision not configured, the photo ends `not_captioned` with the reason, the object is kept, and there is no derived thought | FR-006, US2.7 | example | PENDING | |
| U193 | With the vision call failing, the photo ends `not_captioned` with the vision error's reason, and the object is kept | FR-006, US2.7 | example | PENDING | |
| U194 | A `not_captioned` photo finished again with vision working ends `processed` with one caption | FR-027, SC-015 | example | PENDING | |
| U195 | `rebuild: true` on a `processed` photo gives exactly one caption, by the newly configured model, and updates `caption_model` | FR-027, SC-015 | example | PENDING | |
| U196 | `rebuild: true` on a `processed` PDF replaces the passage set, and `derived_count` equals the new count | FR-027 | example | PENDING | |
| U197 | A failed rebuild keeps the old set and `processed`, and the outcome and row carry `last_rebuild_error` with the reason | FR-027, SC-018 | example | PENDING | |
| U198 | When `checkActual` refuses, the object is deleted, the row is `refused` with the actual values, and no derived thought is written | FR-004, SC-013 | example | PENDING | |
| U199 | An object created after `upload_deadline` is refused and deleted | FR-004, FR-001 | example | PENDING | |
| U200 | An object created exactly at `upload_deadline` is not refused for its timing | FR-004, FR-001 | example | PENDING | |
| U201 | Finishing a `refused` attachment is refused, and nothing changes | FR-004 | example | PENDING | |
| U202 | With no object before the deadline, the outcome is "no file uploaded yet", and the state is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | PENDING | |
| U203 | With no object after the deadline, the outcome is "upload window expired", and the state is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | PENDING | |
| U204 | After a refused or no-file outcome, a new claim succeeds at once | FR-026 | example | PENDING | |
| U205 | A text-less PDF ends `scanned` with the reason and "text search won't cover it yet", no passages, and the object kept | FR-010, US4.2 | example | PENDING | |
| U206 | A `scanned` PDF finished again after `SCANNED_MIN_CHARS_PER_PAGE` is lowered below its text ends `processed` | FR-027 | example | PENDING | |
| U207 | A `scanned` PDF finished again with unchanged settings stays `scanned`, with no passages | FR-027, FR-010 | example | PENDING | |
| U208 | A corrupt PDF ends `failed` with the reason, the object kept, and no passages | FR-011, edge case "encrypted or corrupt" | example | PENDING | |
| U209 | An embedding failure partway ends `failed` with the reason, and no derived thought from the attempt remains | FR-011, US4.3 | example | PENDING | |
| U210 | A vector length different from `embeddingDimension()` ends `failed` naming both lengths, with no derived thought | FR-007, edge case "vectors of a different length" | example | PENDING | |
| U211 | A `failed` attachment finished again with the services working ends `processed` | FR-011, FR-027 | example | PENDING | |
| U212 | A finish while another finish, rebuild or remove holds an unexpired claim returns busy naming that operation, and changes nothing | FR-026, SC-014 | example | PENDING | |
| U213 | One second before `BUSY_SECONDS` has passed, the finish is still busy | FR-026 | example | PENDING | |
| U214 | Once `BUSY_SECONDS` has passed by the clock, the next finish proceeds and completes | FR-026, SC-019 | example | PENDING | |
| U215 | After a killed rebuild (its claim never released) has expired, the attachment is `processed` with its old derived set | FR-026, FR-027 | example | PENDING | |
| U216 | A finish whose claim expired and was taken over has its write refused, and the newer run's result stands | FR-026 | example | PENDING | |

### Stream T: tools (wave 2, `ta-tools`)

#### `src/tools.ts` (T027, T028, T029, T030, T041, T049, T050, T063, T064)

Test file: `tests/tools_test.ts` (`inMemoryClient`; `services.finish` scripted).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U217 | `tools/list` returns exactly the seven tool names | INV-1 | example | PENDING | |
| U218 | Each tool's `readOnlyHint`, `destructiveHint` and `openWorldHint` match the contract | INV-1 | example | PENDING | |
| U219 | Each tool's input schema and defaults match the contract (`find_thought` `mode` `meaning` and `limit` 5; `remove_attachment` `confirm` false; `finish_attachment` optional `rebuild`; `attach_file`'s fields) | INV-1 | example | PENDING | |
| U220 | `find_thought` in `meaning` mode (the default) embeds the query and returns `matchThoughts`' matches | FR-023 | example | PENDING | |
| U221 | `find_thought` in `exact` mode returns `findThoughtsExact`'s matches, with no embedding request | FR-023 | example | PENDING | |
| U222 | `find_thought` with no `limit` asks for 5 matches | FR-023 | example | PENDING | |
| U223 | `find_thought` with `limit` 20 asks for 20 | FR-023 | example | PENDING | |
| U224 | A 120-character first line is returned whole | FR-023 | example | PENDING | |
| U225 | A 121-character first line is cut to 120 characters | FR-023 | example | PENDING | |
| U226 | `first_line` is the content up to its first line break | FR-023 | example | PENDING | |
| U227 | Each match has `id`, `first_line` and `captured` | FR-023, SC-009 | example | PENDING | |
| U228 | No match gives "no matching thought" | FR-023 | example | PENDING | |
| U229 | `attach_file` with an unknown `thought_id` is refused, with no row, link or note | FR-001, FR-016 | example | PENDING | |
| U230 | `attach_file` with both `thought_id` and `note` is refused, and nothing is created | FR-001 | example | PENDING | |
| U231 | `attach_file` with neither is refused, and nothing is created | FR-001 | example | PENDING | |
| U232 | A `checkDeclared` refusal returns its message, with no row and no link | FR-003 | example | PENDING | |
| U233 | The same name, type and size already pending on the parent returns that attachment, with no new row | FR-012, US1.3 | example | PENDING | |
| U234 | The same name and type with a different size on the parent creates a new attachment | FR-012 | example | PENDING | |
| U235 | A successful start writes a row with the parent, the base name, the declared type and size, tier `personal` by default, `storage_path` `attachments/<id>/<name>` and state `pending_upload` | FR-001 | example | PENDING | |
| U236 | `upload_deadline` is the injected now plus `UPLOAD_LINK_MINUTES` | FR-001 | example | PENDING | |
| U237 | The stored `page_token_hash` is the SHA-256 of the token in `page_link`, and the raw token appears nowhere in the row | FR-002, FR-009 | example | PENDING | |
| U238 | The result has `attachment_id`, its short id, `parent_thought_id`, whether the parent was created now, `upload_deadline`, `upload` (`url`, `method: "PUT"`, `headers`), the `curl` line, `page_link` and `limits` | FR-001, FR-002 | example | PENDING | |
| U239 | `upload.url` is the signed link passed through `publicUrl` | FR-002 | example | PENDING | |
| U240 | A given `sensitivity_tier` of `restricted` is stored on the row | FR-008 | example | PENDING | |
| U241 | `finish_attachment` passes the id and `rebuild` to `services.finish` and returns the result text with the structured `state`, `reason`, `derived_count`, `caption` and `page_count` | FR-027, FR-005 | example | PENDING | |
| U242 | A busy outcome gives "busy (…), try again shortly" naming the running operation as finishing, rebuilding or removing | FR-026 | example | PENDING | |
| U243 | Every tool that takes `attachment_id` accepts the short id, and reports "not found" and "ambiguous" errors | FR-025, FR-014 | example | PENDING | |
| U244 | `attach_file` with `note` embeds the text and saves it through `insertNote` as the parent, with `parent_created_here` true when it was created | FR-001, SC-010 | example | PENDING | |
| U245 | `note` text that matches an existing thought makes that thought the parent with `parent_created_here` false, and the result says "attached to your existing thought" | FR-001, FR-016 | example | PENDING | |
| U246 | `note` with a HEIC declaration saves no note and makes no embedding request | FR-003, SC-020 | example | PENDING | |
| U247 | `note` with an over-cap declaration saves no note | FR-003 | example | PENDING | |
| U248 | A phone-upload start without file details writes a row with no declaration, carrying `expected_kind` when given | FR-001 | example | PENDING | |
| U249 | An `expected_kind` other than `photo` or `pdf` is refused | FR-001 | example | PENDING | |
| U250 | `get_attachment` returns file name, type, size, page count, state, reason, `derived_count`, `caption_model` and parent id | FR-014 | example | PENDING | |
| U251 | For a stored file (`processed`, `scanned`, `not_captioned` or `failed`), `get_attachment` returns a `download_link` through `publicUrl`, signed for `DOWNLOAD_LINK_SECONDS`, with that lifetime stated | FR-014, SC-003 | example | PENDING | |
| U252 | `get_attachment` on `pending_upload` returns no `download_link` | FR-014, SC-003 | example | PENDING | |
| U253 | `get_attachment` on `refused` returns no `download_link` | FR-014, SC-003 | example | PENDING | |
| U254 | `list_attachments` with `thought_id` returns each attachment's id, short id, file name, type, size, state and `derived_count` | FR-015, US3.2 | example | PENDING | |
| U255 | `list_attachments` with `derived_thought_id` returns the attachment that owns it | FR-015 | example | PENDING | |
| U256 | `list_attachments` with both or neither input is refused | FR-015 | example | PENDING | |
| U257 | `list_attachments` with the id of a thought no attachment owns says not found | FR-015 | example | PENDING | |
| U258 | `remove_attachment` without `confirm` deletes nothing and lists the file, the derived count and, when it would go, the parent note | FR-016, US5.2 | example | PENDING | |
| U259 | `remove_attachment` with `confirm` deletes the stored file, removes through the store and releases the claim, and the result names what went | FR-016, US5.1 | example | PENDING | |
| U260 | `remove_attachment` while busy is refused with the busy message and deletes nothing | FR-026, SC-014 | example | PENDING | |
| U261 | `find_orphan_attachments` lists each orphan's id, file name, why it is listed and `derived_count` | FR-021, US5.3 | example | PENDING | |

### Stream P: phone page (wave 2, `ta-page`)

#### `src/page_routes.ts` (T042, T043)

Test file: `tests/page_routes_test.ts` (`services.finish` scripted).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U262 | `/page/start` with a valid, unused token and no declaration records the picked base name, type and exact size, and returns a signed upload link through `publicUrl` | FR-001, FR-002 | example | PENDING | |
| U263 | `/page/start` whose pick matches the attach call's declaration confirms it and returns a link | FR-001 | example | PENDING | |
| U264 | `/page/start` whose pick doesn't match the attach call's declaration is refused, with no link (literal reading of "confirms they match") | FR-001, FR-004 | example | PENDING | |
| U265 | A picked HEIC file is refused with the "share it as JPEG" message, with no link | FR-003, US2.3 | example | PENDING | |
| U266 | A picked type outside the four is refused with `attach_file`'s message, with no link | FR-003 | example | PENDING | |
| U267 | A pick whose kind differs from `expected_kind` (a PDF when `photo` is expected, or the reverse) is refused | FR-001 | example | PENDING | |
| U268 | A picked size over its cap is refused, naming the cap and the size | FR-003 | example | PENDING | |
| U269 | A second `/page/start` replaces the declaration and returns a new link | FR-002 | example | PENDING | |
| U270 | An unknown token gets `410` with "This link has expired or was already used. Ask your assistant for a new one" | FR-002 | example | PENDING | |
| U271 | A used token gets `410` with the same message | FR-002, edge case "upload page opened twice" | example | PENDING | |
| U272 | A token one second after `upload_deadline` gets `410` | FR-001, SC-017 | example | PENDING | |
| U273 | A token one second before `upload_deadline` is accepted | FR-001, SC-017 | example | PENDING | |
| U274 | The page routes need no brain key, and a request carrying the brain key without a valid token gets `410` | FR-002, FR-018 | example | PENDING | |
| U275 | CORS allows the origin of `UPLOAD_PAGE_URL`, and gives no allow-origin to any other origin | FR-002 | example | PENDING | |
| U276 | CORS allows the same origin when the page is served by the function | FR-002 | example | PENDING | |
| U277 | `/page/finish` with a valid token uses it up, finishes only its own attachment through `services.finish`, and returns the outcome as JSON | FR-024, SC-011 | example | PENDING | |
| U278 | A second `/page/finish` with the same token gets `410` | FR-024 | example | PENDING | |
| U279 | A token for attachment X never finishes attachment Y: `services.finish` is never called with Y, and Y is unchanged | FR-024, SC-011 | example | PENDING | |
| U280 | `/page/finish` refused as busy follows the answered rule on whether its token is used up | FR-024, FR-026 | example | BLOCKED (T005 item 5) | |

#### `upload-page.html` (T044)

Test file: `tests/page_script_test.ts`, with `tests/helpers/page_dom.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U281 | The page reads its token only from the `#t=` fragment; a token in the query string is ignored | FR-002 | example | PENDING | |
| U282 | Every request goes to the API address fixed in the file, never to an address taken from the link | FR-002 | example | PENDING | |
| U283 | The copy the function serves on self-hosted gets its API address by the answered rule | FR-002 | example | BLOCKED (T005 item 6) | |
| U284 | The file input accepts exactly `image/jpeg,image/png,image/webp,application/pdf` and one file | FR-002 | example | PENDING | |
| U285 | The page shows the accepted types | FR-002 | example | PENDING | |
| U286 | A refusal from `/page/start` is shown, and no `PUT` happens | FR-003 | example | PENDING | |
| U287 | Upload progress is shown during the `PUT` | FR-002 | example | PENDING | |
| U288 | The page `PUT`s the one file to the returned link, then calls `/page/finish` | FR-024 | example | PENDING | |
| U289 | Each outcome shows its text from contracts/upload-page.md "What the owner sees" ("Captioned: …" with the first 300 characters, "Saved N passages", "Scanned PDF: text search won't cover it yet", "Not captioned: <reason>", "Refused: <reason>", "Failed: <reason>") | FR-024, SC-011 | example | PENDING | |
| U290 | A `410` shows the expired message | FR-002, SC-017 | example | PENDING | |
| U291 | The file contains no key, no token and no project address other than its API-address setting | FR-002, FR-009 | example | PENDING | |
| U292 | The file loads no external script or style | FR-002 | example | PENDING | |

### Stream A: app and entry (wave 3, `ta-app`)

#### `src/app.ts` and `index.ts` (T031, T032, T045)

Test files: `tests/app_test.ts` (U293–U301, U305–U307) and `tests/imports_test.ts` (U302–U304).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U293 | The correct key in `x-brain-key` lets an MCP `initialize` succeed | FR-018 | example | PENDING | |
| U294 | The correct key as `?key=` lets an MCP `initialize` succeed | FR-018 | example | PENDING | |
| U295 | A wrong key gets an authorization error, and the store is never called | FR-018 | example | PENDING | |
| U296 | A missing key gets an authorization error | FR-018 | example | PENDING | |
| U297 | With an empty configured key, every MCP request is refused | FR-018 | example | PENDING | |
| U298 | An `OPTIONS` preflight gets the CORS headers that `W/server/index.ts` sends | INV-4 | example | PENDING | |
| U299 | An MCP request is handled with the same `Accept` treatment as `W/server/index.ts` | INV-4 | example | PENDING | |
| U300 | `productionDeps` with settings that aren't `ok` refuses to start, naming the problem settings and no values | FR-017, FR-009 | example | PENDING | |
| U301 | `productionDeps`' store sends its requests to `SUPABASE_URL` with the service-role key (stubbed `globalThis.fetch`) | FR-019 | example | PENDING | |
| U302 | `index.ts` is the one-line entry `Deno.serve(createApp(productionDeps()).fetch)` | FR-019 | example | PENDING | |
| U303 | No `.ts` file outside `tests/` has a bare import specifier | FR-019 | example | PENDING | |
| U304 | No `.ts` file outside `tests/` imports `pdf-lib` | INV-5 | example | PENDING | |
| U305 | `GET /upload` returns 200 with `text/html`, with no brain key | FR-002 | example | PENDING | |
| U306 | The `GET /upload` body follows the answered rule (unchanged `upload-page.html`, or the file with its API address set) | FR-002 | example | BLOCKED (T005 item 6) | |
| U307 | `/page/start` through `createApp` with no brain key is not refused by the key check | FR-002 | example | PENDING | |

## Invariants and edge cases still to place

Each needs a decision the spec and contracts don't make. None has a numbered row, so no test encodes an invented answer. Each must become a row (or be dropped with a reason) before the feature is done.

- **Bytes in an MB.** `MAX_IMAGE_MB` and `MAX_PDF_MB` never say whether 1 MB is 1,000,000 or 1,048,576 bytes. U118–U121 and U153 test "at the cap" and "one byte over" against whatever byte value is chosen. This sits next to T005 item 3 (decimals).
- **The page's header before a pick.** contracts/upload-page.md "What the owner sees" item 1 shows the expected kind and the size limit before any file is picked. But the only routes take a picked file (`/page/start`) or finish (`/page/finish`), so nothing supplies them first. U285 covers only the accepted types, which are static.
- **A single-page source line.** data-model.md shows only `pages 12–13`. The text for a passage on one page (`page 12`, or `pages 12–12`) is not set.
- **`find_thought` `limit` above 20.** "At most 20" doesn't say whether 21 is clamped to 20 or refused.
- **Exact-text matching.** U67 takes the literal reading, "contains the query as given". Case sensitivity is not stated.
- **An expired `pending_upload` and the duplicate-pending rule.** The edge case says "a new link can be requested" after expiry, but `attach_file` points to "the same file name, type and size already pending on that parent". Whether an expired pending row still counts as pending is not stated.
- **"A cut-off finish counts as `failed`" (FR-026).** It's unclear whether the row is stored as `failed` after the claim expires (for example as seen by `get_attachment`), or only treated as failed by the next finish. U214 and A45 test the next finish proceeding.
- **A successful rebuild after a failed one.** It's unclear whether it clears `last_rebuild_error`.
- **Removal partway.** Removing deletes the stored file and then the rows, and the outcome is not stated when the row removal fails after the file is gone.
- **`/page/finish` before any upload.** The token is "used up, then finishes", so a "no file uploaded yet" outcome would strand the page. This is the same question as T005 item 5, but for the no-file outcome.
- **An owner thought equal to a full derived content.** An owner thought whose text equals a passage's whole content, source line included, makes the write raise, so the finish fails. US1.4 says the passage is saved as its own thought, which is then impossible. FR-025 argues this only for derived thoughts of different attachments.
- **Partial file details in `attach_file`.** It's not stated what happens when some, but not all, of `file_name`, `declared_type` and `declared_size` are given.

## Out of scope

- **`README.md`** (stream D: T034, T047, T052, T060, T066). It is docs-only and exempt from unit tests (constitution Principle IV). It is gated by markdownlint, the link check and the README sections (T072, T073), and filled from the live runs (T080).
- **Constant-time key comparison (T031).** It isn't observable as a behavior in a deterministic test, so it is checked in review and the audit.
- **Setup, scaffolding, seams, helpers and the harness proof** (T001–T004, T006, T007, T010). These are structure, not behavior, and they carry no marker. `T010`'s harness checks prove the test infrastructure, not the feature.
- **Live research checks** (R3 OpenRouter batch input, R4 Ollama `qwen2.5vl:7b` with a data URL, R5 006's gateway serving `text/html`). These are planning premises checked in T076 and T077, not spec criteria. If one fails, the setting or default changes test-first (T076).
- **Deferred by the spec, as fork issues**: background or resumable processing (#26), OCR (#30), thumbnails (#31), and more kinds of thought (#32). Also deferred: Word, spreadsheet and slide formats, HEIC conversion, editing attachments and a dashboard view.
- **The core connector's tools** (`search_thoughts`, `list_thoughts`, `thought_stats`, `capture_thought`). They are unchanged by this feature, so the automated rows test what those tools read (see "Proxy" above), and the tools themselves run in the live runs.
- **Spec 006's folder.** It isn't edited (R14).

## Verification commands

Copied verbatim from `.specify/memory/tdd-profile.md` (integrator, run from `M`, acting on the plan's Worktree):

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}`
- Full suite: `node .fork/ci/bin/tdd.mjs suite`
- Coverage: none (`coverage: null`)
- Mutation: none (`mutation: null`); the audit applies deliberate mutants instead

Stream commands, from `tasks.md` (run inside the stream's own worktree, from `integrations/thought-attachments/`; streams never use `tdd.mjs`):

- Single: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/` (must report exactly `1 passed` or `1 failed`)
- Full: the same command without `--filter`
- Acceptance reds: the same, with `RUN_TODO=1`
- SQL: `psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` through T004's local SQL runtime (the decisive `ERROR:` or `raise exception` line is the red)
