---
feature: 007-thought-attachments # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 41 # US1 scenarios 1–4, US2 1–7, US3 1–3, US4 1–3, US5 1–4 (21), plus SC-001 to SC-020 (20), overlapping; 63 automated A behaviors (A54–A63 added at the 54fcf51 refresh), 7 live rows (see "Live acceptance")
planned_at: 9d20be9 # short SHA the list was derived from (fork main)
updated_at: 54fcf51 # short SHA of the last change to this file (refresh after T005 and the settled edge cases)
suite_baseline: green # empty: the worktree and integrations/thought-attachments/ don't exist yet (T001); the suite command exited 2 ("worktree not found") and 0 tests ran
---

# Test List: Thought attachments (files linked to thoughts)

## How this list keeps every red real

- **No acceptance runner** is in the profile (`acceptance: null`). The outer loop is an **integration test against the composed app, not an end-to-end test**. It lives in `integrations/thought-attachments/tests/acceptance_test.ts` and drives `createApp(input).fetch(new Request(…))` (an `AppInput` built from `loadSettings`) through the function's real request entry point: the MCP route and the page routes. It uses `FakeStore` (database and Storage), the real embedding and vision clients over `fake_fetch`, `loadSettings` over `tests/helpers/env.ts`, and the fake clock (tasks T012). Anything that needs a real Cloud project, the real core connector, the self-hosted stack or a real phone is in **Live acceptance** below. Those rows are not on the loop.
- **Outer loop first**: T012 writes every A behavior (A1–A63) as `todo(...)` tests, records each red with `RUN_TODO=1`, and the stream A flip tasks (T033, T046, T051, T059, T065) turn each one into a plain `Deno.test` in the commit that makes it green. T012 carries every A marker, so it is ticked last, when all of them are `DONE` (spec 006's T050 precedent).
- **Behavior ids prefix every test name** (`"U7 …"`, `"A3 …"`). Streams select one test with `--filter "/^<id> /"`. The slashes are required, and a run that reports `0 passed | 0 failed` is never evidence.
- **Order**: inner tables are grouped by the component file that owns them, in wave and stream order (integrator, then Q, X, E, then N, T, P, then A). Each stream has a contiguous id range, and inside it the ids follow that stream's task order in `tasks.md`. Ids appended by a refresh (U308 onward, A54 onward) sit after U307 and A53, one contiguous run per component, in the table next to the rows of the task that carries them. A stream takes its behaviors task by task in `tasks.md` order, and inside a task in id order, so an appended id runs with its task, not after the stream's original range. No U id is shared by tasks of two different streams.
- **SQL behaviors** are assertion blocks in `tests/verify.sql`, each added red first and run as a whole file (no single-test mode for SQL; tasks.md "SQL behaviors").
- **Both sides of a boundary** are separate rows. A rule with one tested side pins nothing.
- **Proxy for "the core search finds it"**: the core connector cannot run under fakes. Wherever a criterion says the core search finds a thought (SC-009, SC-010, SC-012, US1.2), the automated row asserts what the core search depends on: an ordinary `thoughts` row with the expected content and an embedding of the brain's dimension, produced by the configured embedding model. The real search is in the live runs (L1, L2, and quickstart scenarios 1, 2 and 4 in T076 and T077).
- **No BLOCKED rows remain.** T005's six answers (spec Clarifications, "implementation, T005") and the settled spec Edge Cases were applied by the refresh at 54fcf51. Every former BLOCKED row is now `PENDING` with the answered rule, except U14, which is `DROPPED`. A `DROPPED` row stays as the record of what was decided and needs no test. T008 still carries the `[U14]` marker, because a refresh never removes task text.
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
| A1 | With an existing thought and a 3-page text PDF within the caps, `attach_file` (thought id, name, type, size), a `PUT` of the bytes to the returned upload link, then `finish_attachment` leave the object stored, the row `processed` with `page_count` 3 and `derived_count` N ≥ 1, and N new thoughts whose metadata names the attachment and the parent | US1.1, FR-001, FR-004, FR-005 | example | DONE | `tests/acceptance_test.ts::A1 a 3-page text PDF attached, uploaded and finished is stored, processed with page_count 3, with N passages naming the attachment and parent` |
| A2 | For a sample PDF whose listed facts each sit on a known page, every fact is inside a passage thought whose first line is `From <base name>, pages a–b (attachment <short id>)` with a range that includes that page, and which has an embedding of the brain's dimension (findability within 10 results is live: L1) | US1.2, SC-001, FR-025, FR-007 | example | DONE | `tests/acceptance_test.ts::A2 every listed fact is in a passage whose source line names the file, a page range including its page and the short id, with an embedding of the brain's dimension` |
| A3 | `attach_file` with the same file name, type and size while the first attachment is still `pending_upload` on that parent creates no second row and returns the existing attachment's id | US1.3, FR-012 | example | DONE | `tests/acceptance_test.ts::A3 attach_file with the same name, type and size while the first is pending creates no second row and returns the existing id` |
| A4 | The same bytes uploaded to a second attachment on the same parent and finished after the first is `processed` end the second `refused` with "already attached to this thought as <first short id>": its object is deleted, it has no derived thought, and the first attachment and its passages are unchanged (T005 Q4) | US1.3, FR-012 | example | DONE | `tests/acceptance_test.ts::A4 the same bytes finished on a second attachment of the same parent end refused naming the first's short id, with its object deleted and the first unchanged` |
| A5 | An owner thought whose text equals a passage's body is unchanged after the PDF is finished (content, metadata, embedding), and the passage is saved as a separate row carrying the attachment's metadata | US1.4, FR-022 | example | DONE | `tests/acceptance_test.ts::A5 an owner thought whose text equals a passage's body is unchanged after finishing, and the passage is its own row with the attachment's metadata` |
| A6 | A thought stored as the core capture stores it is found by `find_thought` (meaning mode) with words from it; its id is among the matches, with its first line and date; `attach_file` with that id succeeds | SC-009, FR-023 | example | DONE | `tests/acceptance_test.ts::A6 find_thought (meaning) finds a thought stored as the core stores it, with first line and date, and attach_file accepts its id` |
| A7 | The short id read from a passage's source line, given to `get_attachment`, returns that attachment and a download link | SC-012, FR-025, FR-014 | example | DONE | `tests/acceptance_test.ts::A7 the short id read from a passage's source line, given to get_attachment, returns that attachment and a download link` |
| A8 | The same PDF attached to two thoughts and finished twice gives two attachments with two disjoint passage sets; a confirmed removal of one leaves the other's row and every one of its passages | SC-012, FR-022, edge case "same file attached to two different thoughts" | example | DONE | `tests/acceptance_test.ts::A8 the same PDF on two thoughts gives two disjoint passage sets, and a confirmed removal of one leaves the other's row and passages` |
| A9 | After a PDF is processed, every passage has `metadata.type` `reference` and `topics` `["attachment", "<base name>"]`, and none has type `observation` | SC-016, FR-028 | example | DONE | `tests/acceptance_test.ts::A9 every passage of a processed PDF has type reference and topics attachment and the base name, and none is an observation` |
| A10 | An MCP request with no key, or a wrong key, gets an authorization error, and no store row or Storage object changes | FR-018 | example | DONE | `tests/acceptance_test.ts::A10 an MCP request with no key or a wrong key gets an authorization error and changes nothing` |
| A11 | `tools/list` returns exactly `find_thought`, `attach_file`, `finish_attachment`, `get_attachment`, `list_attachments`, `remove_attachment` and `find_orphan_attachments`, with the contract's annotations | INV-1 | example | DONE | `tests/acceptance_test.ts::A11 tools/list returns exactly the seven tools with the contract's annotations` |
| A12 | `attach_file` with an unknown `thought_id` is refused, and no row, link or note is created | FR-001, FR-016, edge case "parent thought does not exist" | example | DONE | `tests/acceptance_test.ts::A12 attach_file with an unknown thought_id is refused, and no row, link or note is created` |
| A53 | A request to `/page/start` or `/page/finish` that carries the brain key but no valid page token gets `410`, and no row or object changes (the page routes refuse the brain key) | FR-018, FR-002 | example | DONE | `tests/acceptance_test.ts::A53 /page/start or /page/finish carrying the brain key but no valid page token gets 410 and changes nothing` |
| A57 | `attach_file` with the same file name, type and size as a first attachment on that parent whose upload deadline passed unused (61 minutes later by the clock) creates a new attachment with a new id, and `find_orphan_attachments` still lists the first | FR-012, FR-021, edge case "pending upload past its deadline no longer counts as pending" | example | DONE | `tests/acceptance_test.ts::A57 attach_file for the same file after the first's deadline passed unused creates a new attachment, and the orphan check still lists the first` |
| A59 | An owner thought whose text equals an attachment's whole derived content, source line included (written after `attach_file`, from its short id), makes the finish end `failed` with a reason naming the conflict; that thought is unchanged and no derived thought exists | FR-022, US1.4, edge case "existing thought's text equals a derived thought's entire text" | example | DONE | `tests/acceptance_test.ts::A59 an owner thought equal to an attachment's whole derived content makes the finish fail naming the conflict, with that thought unchanged and no derived thought` |

### User Story 2 (flip task T046)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A13 | A JPEG within the cap, finished with a configured (faked) vision model, gives exactly one caption thought starting `From shelf.jpg, photo (attachment <short id>)`, the row `processed`, and `caption_model` and `provenance.extractor_model` both equal to `VISION_MODEL` | US2.1, SC-002, FR-006, FR-008 | example | DONE | `tests/acceptance_test.ts::A13 a JPEG finished with a configured vision model gives one caption thought with its source line, the row processed, and caption_model and extractor_model equal to VISION_MODEL` |
| A14 | With only the page link's token and no brain key, `/page/start` returns an upload link, the `PUT` succeeds, `/page/finish` finishes, and afterwards a second `/page/start` and a second `/page/finish` with that token each get `410` | US2.2, FR-002, FR-024, edge case "upload page opened twice" | example | DONE | `tests/acceptance_test.ts::A14 with only the page token, /page/start, the PUT and /page/finish finish the photo, and a second start and finish with that token each get 410` |
| A15 | `attach_file` with a HEIC declared type is refused before upload with the "share it as JPEG" message, and no row or link is created | US2.3, FR-003 | example | DONE | `tests/acceptance_test.ts::A15 attach_file with a HEIC declared type is refused with the share-it-as-JPEG message, and no row or link is created` |
| A16 | `/page/start` with a picked HEIC file is refused with the "share it as JPEG" message, and no upload link is returned | US2.3, FR-003 | example | DONE | `tests/acceptance_test.ts::A16 /page/start with a picked HEIC file is refused with the share-it-as-JPEG message and returns no upload link` |
| A17 | HEIC bytes uploaded under a JPEG declaration are refused at finishing with the "share it as JPEG" message and the phone steps; the stored object is deleted and the row is `refused` (the real-phone half is live: L7) | US2.4, FR-004 | example | DONE | `tests/acceptance_test.ts::A17 HEIC bytes uploaded under a JPEG declaration are refused at finishing with the share-it-as-JPEG message, the object deleted and the row refused` |
| A18 | `attach_file` with `note` and no thought id creates exactly one new thought with that text, metadata type `observation` and source `thought-attachments`, and an embedding of the brain's dimension; it is the attachment's parent, with `parent_created_here` true | US2.5, SC-010, FR-001 | example | DONE | `tests/acceptance_test.ts::A18 attach_file with note and no thought id creates one observation thought with an embedding of the brain's dimension, as the attachment's parent created here` |
| A19 | After a page upload, `/page/finish` with no MCP call returns the outcome `processed` with the caption, and the caption thought exists | US2.6, SC-011, FR-024 | example | DONE | `tests/acceptance_test.ts::A19 after a page upload, /page/finish alone returns processed with the caption, and the caption thought exists` |
| A20 | A page token for attachment X, used on `/page/start` and `/page/finish`, never signs an upload for attachment Y nor finishes it; Y's row and object are unchanged | SC-011, FR-024 | example | DONE | `tests/acceptance_test.ts::A20 a page token for attachment X never signs an upload for Y nor finishes Y; Y's row and object are unchanged` |
| A21 | With `VISION_*` unset, a finished photo stays stored and fetchable, the row is `not_captioned` with the reason, and no caption thought exists | US2.7, FR-006 | example | DONE | `tests/acceptance_test.ts::A21 with VISION_* unset a finished photo stays stored and fetchable, is not_captioned with the reason, and has no caption thought` |
| A22 | With the vision endpoint answering 500, a finished photo is `not_captioned` with that reason, and no caption thought exists | US2.7, FR-006 | example | DONE | `tests/acceptance_test.ts::A22 with the vision endpoint answering 500 a finished photo is not_captioned with that reason and has no caption thought` |
| A23 | A `not_captioned` photo finished again after the vision model is back ends `processed` with exactly one caption thought | SC-015, FR-027 | example | DONE | `tests/acceptance_test.ts::A23 a not_captioned photo finished again after the vision model is back ends processed with exactly one caption thought` |
| A24 | A `processed` photo rebuilt (`rebuild: true`) with a different `VISION_MODEL` ends with exactly one caption thought, written by the new model | SC-015, FR-027 | example | DONE | `tests/acceptance_test.ts::A24 a processed photo rebuilt with a different VISION_MODEL ends with exactly one caption thought, written by the new model` |
| A25 | A `processed` photo whose rebuild fails because the vision endpoint is down keeps exactly its old caption thought, stays `processed`, and the result reports `last_rebuild_error` with the reason | SC-018, FR-027 | example | DONE | `tests/acceptance_test.ts::A25 a rebuild that fails because the vision endpoint is down keeps the old caption thought, stays processed and reports last_rebuild_error` |
| A26 | With `PUBLIC_BASE_URL` set to a LAN address, the `upload.url`, the `curl` line and the `/page/start` upload link all start with it, and none contains the internal `SUPABASE_URL` origin; with `UPLOAD_PAGE_URL` unset, `page_link` starts with `<PUBLIC_BASE_URL>/functions/v1/thought-attachments/upload#t=` (T005 Q2) | FR-002, FR-019 | example | DONE | `tests/acceptance_test.ts::A26 with a LAN PUBLIC_BASE_URL every returned link starts with it and none carries the internal origin; page_link defaults to the function's upload page` |
| A58 | After a failed rebuild (as in A25), a rebuild with the vision endpoint back ends with exactly one caption thought, by the configured model, and `get_attachment` reports no `last_rebuild_error` | FR-027, SC-018, edge case "successful rebuild clears the previous last rebuild failed note" | example | DONE | `tests/acceptance_test.ts::A58 after a failed rebuild, a rebuild with the vision endpoint back ends with one caption thought by the configured model and no last_rebuild_error` |
| A60 | With only the page token, `/page/info` returns the expected kind `photo` that the attach call named, the accepted types and the size caps; no row or object changes, and `/page/start` with the same token then still returns an upload link | FR-002, edge case "before a file is picked, the upload page shows the expected kind" | example | DONE | `tests/acceptance_test.ts::A60 with only the page token, /page/info returns the expected kind, accepted types and caps, changes nothing, and /page/start still returns an upload link` |
| A61 | `/page/finish` before any `PUT` returns "no file uploaded yet" and leaves the token usable: after a `PUT`, a second `/page/finish` with it finishes the attachment, and a third gets `410` (T005 Q5) | FR-024, edge case "upload link expires before the client uploads" | example | DONE | `tests/acceptance_test.ts::A61 /page/finish before any PUT says no file uploaded yet and keeps the token: after a PUT a second finish finishes it, and a third gets 410` |

### User Story 3 (flip task T051)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A27 | `get_attachment` on a processed attachment returns its name, type, size and state, and a download link signed for 600 seconds, with that lifetime stated in the result | US3.1, FR-014, SC-003 | example | DONE | `tests/acceptance_test.ts::A27 get_attachment on a processed attachment returns name, type, size and state, and a download link signed for 600 seconds with that lifetime stated` |
| A28 | `list_attachments` for a thought with two attachments in different states returns both, each with name, type, size, state and `derived_count` | US3.2, FR-015 | example | DONE | `tests/acceptance_test.ts::A28 list_attachments for a thought with two attachments in different states returns both with name, type, size, state and derived_count` |
| A29 | `get_attachment` on a `pending_upload` and on a `refused` attachment returns no download link | SC-003, FR-014 | example | DONE | `tests/acceptance_test.ts::A29 get_attachment on a pending_upload and on a refused attachment returns no download link` |

### User Story 4 (flip task T059)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A30 | `attach_file` for a PDF declared over `MAX_PDF_MB` is refused before upload, naming the limit and the declared size; no row and no link | US4.1, FR-003, SC-005 | example | DONE | `tests/acceptance_test.ts::A30 attach_file for a PDF declared over MAX_PDF_MB is refused naming the limit and the declared size, with no row and no link` |
| A31 | An uploaded PDF with `MAX_PDF_PAGES` + 1 pages is refused at finishing: object deleted, row `refused` with the page count, a message naming the planned background processing, and zero derived thoughts | US4.1, FR-004, FR-013, SC-005 | example | DONE | `tests/acceptance_test.ts::A31 an uploaded PDF over MAX_PDF_PAGES is refused at finishing with the page count and the planned background processing, object deleted and no derived thought` |
| A32 | A 40 MB upload declared as a 4 MB JPEG is refused at finishing: object deleted, row `refused` with the actual size, zero derived thoughts, and `find_orphan_attachments` lists it | SC-013, US4.1, FR-004, SC-005 | example | DONE | `tests/acceptance_test.ts::A32 a 40 MB upload declared as a 4 MB JPEG is refused at finishing with the actual size, object deleted, no derived thought, and listed as an orphan` |
| A33 | A text-less PDF ends `scanned` with zero passages, the result says text search won't cover it yet, and `get_attachment` still returns a download link | US4.2, FR-010, SC-005 | example | DONE | `tests/acceptance_test.ts::A33 a text-less PDF ends scanned with no passages, says text search won't cover it yet, and still has a download link` |
| A34 | When the embedding endpoint fails on the second batch, no derived thought from the attempt remains and the row is `failed` with the reason; finishing again after the endpoint recovers ends `processed` | US4.3, FR-011, SC-005 | example | DONE | `tests/acceptance_test.ts::A34 when embeddings fail on the second batch no derived thought remains and the row is failed; finishing again after recovery ends processed` |
| A35 | A file declared `image/png` whose uploaded bytes are a JPEG of the declared size is refused at finishing, naming the actual type | FR-004, edge case "declares one type or size but uploads another" | example | DONE | `tests/acceptance_test.ts::A35 a file declared image/png whose bytes are a JPEG of that size is refused at finishing naming the actual type` |
| A36 | Corrupt bytes declared as a PDF end `failed` with a readable reason; the file is still fetchable, and there are zero passages | FR-011, edge case "encrypted or corrupt", SC-005 | example | DONE | `tests/acceptance_test.ts::A36 corrupt bytes declared as a PDF end failed with a readable reason, the file still fetchable and no passages` |
| A37 | `finish_attachment` before any upload returns "no file uploaded yet", and the row stays `pending_upload` | FR-001, edge case "upload link expires before the client uploads" | example | DONE | `tests/acceptance_test.ts::A37 finish_attachment before any upload says no file uploaded yet and the row stays pending_upload` |
| A38 | `finish_attachment` after the upload deadline, with no upload, returns "upload window expired", and the row is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | DONE | `tests/acceptance_test.ts::A38 finish_attachment after the upload deadline with no upload says upload window expired and leaves the row unchanged` |
| A39 | When the embedding endpoint returns 768-number vectors for a 1536-dimension brain, finishing ends `failed` naming both lengths, with zero derived thoughts | FR-007, edge case "vectors of a different length", SC-005 | example | DONE | `tests/acceptance_test.ts::A39 768-number vectors for a 1536-dimension brain make finishing fail naming both lengths, with no derived thought` |
| A40 | While a photo finish is held at the vision call, a second `finish_attachment` and a confirmed `remove_attachment` on it each return busy naming finishing, and nothing changes | SC-014, FR-026, edge case "page and the AI finish the same attachment" | example | DONE | `tests/acceptance_test.ts::A40 while a photo finish is held at the vision call, a second finish and a confirmed remove each return busy naming finishing, and nothing changes` |
| A41 | After that finish completes, a repeat `finish_attachment` returns the existing outcome with no new derived thought and no embedding or vision request | SC-014, FR-012 | example | DONE | `tests/acceptance_test.ts::A41 after that finish completes, a repeat finish returns the existing outcome with no new derived thought and no embedding or vision request` |
| A42 | After that, a confirmed `remove_attachment` succeeds | SC-014, FR-016 | example | DONE | `tests/acceptance_test.ts::A42 after that, a confirmed remove_attachment succeeds` |
| A43 | With default settings, `/page/start` 20 minutes after `attach_file` returns an upload link | SC-017, FR-001 | example | DONE | `tests/acceptance_test.ts::A43 with default settings /page/start 20 minutes after attach_file returns an upload link` |
| A44 | `/page/start` 65 minutes after `attach_file` gets `410` with the expired message, and `find_orphan_attachments` lists that pending attachment | SC-017, FR-021, edge case "after its expiry" | example | DONE | `tests/acceptance_test.ts::A44 /page/start 65 minutes after attach_file gets 410 with the expired message, and the orphan check lists that pending attachment` |
| A45 | After a simulated killed finish (claim taken, never released), a finish before `BUSY_SECONDS` is busy; one after it proceeds, finds no derived thought left from the killed run, and ends `processed` | SC-019, FR-026 | example | DONE | `tests/acceptance_test.ts::A45 after a killed finish, a finish before BUSY_SECONDS is busy, and one after it proceeds with no leftover derived thought and ends processed` |
| A54 | With `MAX_PDF_PAGES=abc` in the environment, an `attach_file` call (with the correct key) and a `/page/start` each answer "setting MAX_PDF_PAGES is invalid: must be a positive whole number"; no row, link or object is created, and no response contains `abc` (T005 Q3) | FR-017, FR-009 | example | DONE | `tests/acceptance_test.ts::A54 with MAX_PDF_PAGES=abc, attach_file and /page/start each answer the named settings error, create nothing and never echo abc` |
| A55 | After a simulated killed finish whose claim expired by the clock, `get_attachment` reports state `failed` with "the run did not finish", before any further finish | FR-026, SC-019, edge case "finish whose busy mark expired before it reported back" | example | DONE | `tests/acceptance_test.ts::A55 after a killed finish whose claim expired, get_attachment reports failed with the run did not finish, before any further finish` |
| A62 | A `/page/finish` refused as busy (an MCP finish of the same photo held at the vision call) leaves the token valid; once the held finish completes, a `/page/finish` with the same token returns `processed`, and a further one gets `410` (T005 Q5) | FR-024, FR-026, edge case "page and the AI finish the same attachment" | example | DONE | `tests/acceptance_test.ts::A62 a /page/finish refused as busy leaves the token valid; once the held finish completes, /page/finish returns processed, and a further one gets 410` |
| A63 | With default settings, `attach_file` for a JPEG declared at exactly 10,485,760 bytes returns an upload link, and one declared at 10,485,761 bytes is refused, naming the limit and the declared size | FR-003, US4.1, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/acceptance_test.ts::A63 a JPEG declared at exactly 10,485,760 bytes gets an upload link, and one at 10,485,761 bytes is refused naming the limit and the declared size` |

### User Story 5 (flip task T065)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A46 | A confirmed removal of a processed attachment deletes its object, row and every derived thought; `get_attachment` then reports not found; the parent thought and its other attachment are unchanged | US5.1, FR-016 | example | DONE | `tests/acceptance_test.ts::A46 a confirmed removal deletes the object, row and every derived thought; get_attachment then says not found; the parent and its other attachment are unchanged` |
| A47 | A removal without `confirm` deletes nothing and lists the file and its derived-thought count | US5.2, FR-016 | example | DONE | `tests/acceptance_test.ts::A47 a removal without confirm deletes nothing and lists the file and its derived-thought count` |
| A48 | An attachment whose parent thought was deleted outside the integration is listed by `find_orphan_attachments` with its file name and derived count, and a confirmed removal removes it | US5.3, FR-021 | example | DONE | `tests/acceptance_test.ts::A48 an attachment whose parent was deleted elsewhere is listed as an orphan with its file name and derived count, and a confirmed removal removes it` |
| A49 | An attachment started with `note` whose link expired unused is listed as an orphan, and its confirmed removal removes the note too | US5.4, SC-020, FR-016 | example | DONE | `tests/acceptance_test.ts::A49 an attachment started with note whose link expired unused is an orphan, and its confirmed removal removes the note too` |
| A50 | The same, with a second processed attachment pointing to that note: the note stays | US5.4, SC-020, FR-016 | example | DONE | `tests/acceptance_test.ts::A50 the same, with a second processed attachment pointing to that note: the note stays` |
| A51 | `attach_file` with `note` and a HEIC declared type saves no thought and makes no embedding request | SC-020, FR-003 | example | DONE | `tests/acceptance_test.ts::A51 attach_file with note and a HEIC declared type saves no thought and makes no embedding request` |
| A52 | After a full run (command upload, page upload, finish, rebuild, a refusal, and a file name given with an absolute path), no `thoughts` row or attachment row holds a signed URL, the MCP key, the service-role key, a page token or an absolute path | SC-007, FR-009, edge case "personal or path information" | example | DONE | `tests/acceptance_test.ts::A52 after a full run no thought or attachment row holds a signed URL, a key, a page token or an absolute path` |
| A56 | A confirmed removal whose record deletion fails (injected in the fake store) after the stored file was deleted leaves the attachment listed by `list_attachments`; a repeat confirmed removal then succeeds, removes the row and every derived thought, and treats the missing file as removed | FR-016, edge case "removal deletes the stored file first and then the records" | example | DONE | `tests/acceptance_test.ts::A56 a confirmed removal whose record deletion fails after the file was deleted leaves it listed; a repeat confirmed removal succeeds and treats the missing file as removed` |

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
| U1 | With its variable unset, each documented default applies: `EMBEDDING_API_BASE` `https://openrouter.ai/api/v1`, `EMBEDDING_MODEL` `openai/text-embedding-3-small`, `EMBEDDING_BATCH_SIZE` 64, `ATTACHMENTS_BUCKET` `ob1-files`, `MAX_IMAGE_MB` 10, `MAX_PDF_MB` 25, `MAX_PDF_PAGES` 50, `PASSAGE_MAX_CHARS` 1500, `SCANNED_MIN_CHARS_PER_PAGE` 20, `UPLOAD_LINK_MINUTES` 60, `DOWNLOAD_LINK_SECONDS` 600 | FR-017 | example | DONE | `tests/settings_test.ts::U1 each documented default applies when its variable is unset` |
| U2 | A set variable overrides its default (for example `MAX_PDF_PAGES=30` gives 30, `ATTACHMENTS_BUCKET=files` gives `files`) | FR-017 | example | DONE | `tests/settings_test.ts::U2 a set variable overrides its default` |
| U3 | With `EMBEDDING_API_KEY` unset, the embedding key is `OPENROUTER_API_KEY`'s value | FR-007 | example | DONE | `tests/settings_test.ts::U3 with EMBEDDING_API_KEY unset the embedding key is OPENROUTER_API_KEY` |
| U4 | With both set, `EMBEDDING_API_KEY` wins over `OPENROUTER_API_KEY` | FR-007 | example | DONE | `tests/settings_test.ts::U4 with both set EMBEDDING_API_KEY wins over OPENROUTER_API_KEY` |
| U5 | With `PUBLIC_BASE_URL` unset, the public base is `SUPABASE_PUBLIC_URL` | FR-002, FR-019 | example | DONE | `tests/settings_test.ts::U5 with PUBLIC_BASE_URL unset the public base is SUPABASE_PUBLIC_URL` |
| U6 | With `PUBLIC_BASE_URL` and `SUPABASE_PUBLIC_URL` unset, the public base is `SUPABASE_URL` | FR-002, FR-019 | example | DONE | `tests/settings_test.ts::U6 with PUBLIC_BASE_URL and SUPABASE_PUBLIC_URL unset the public base is SUPABASE_URL` |
| U7 | A set `PUBLIC_BASE_URL` wins over both fallbacks | FR-002 | example | DONE | `tests/settings_test.ts::U7 a set PUBLIC_BASE_URL wins over both fallbacks` |
| U8 | With `MCP_ACCESS_KEY` unset, the result is `{ ok: false }` with a problem naming `MCP_ACCESS_KEY` | FR-018 | example | DONE | `tests/settings_test.ts::U8 with MCP_ACCESS_KEY unset the result is not ok, with a problem naming MCP_ACCESS_KEY` |
| U9 | With `VISION_API_BASE` unset, or `VISION_MODEL` unset (each alone), vision is not configured | FR-006 | example | DONE | `tests/settings_test.ts::U9 with VISION_API_BASE or VISION_MODEL unset (each alone) vision is not configured` |
| U10 | With `VISION_API_BASE` and `VISION_MODEL` set and `VISION_API_KEY` unset, vision is configured | FR-006 | example | DONE | `tests/settings_test.ts::U10 with VISION_API_BASE and VISION_MODEL set and VISION_API_KEY unset vision is configured` |
| U11 | No setting's value appears in any problem's reason | FR-009 | example | DONE | `tests/settings_test.ts::U11 no setting's value appears in any problem's reason` |
| U12 | A set `BUSY_SECONDS` is used as given | FR-026, FR-017 | example | DONE | `tests/settings_test.ts::U12 a set BUSY_SECONDS is used as given` |
| U13 | With `BUSY_SECONDS` unset, the busy expiry is 410 seconds on every platform, whatever `SUPABASE_URL` or any other variable says (T005 Q1) | FR-026, FR-017 | example | DONE | `tests/settings_test.ts::U13 with BUSY_SECONDS unset the busy expiry is 410 seconds on every platform` |
| U14 | With `BUSY_SECONDS` unset elsewhere, the busy expiry is 410 seconds | FR-026, FR-017 | example | DROPPED (T005 Q1 removed the per-platform default; U13 now covers the single 410-second default) | |
| U15 | A set `UPLOAD_PAGE_URL` is used as given | FR-002 | example | DONE | `tests/settings_test.ts::U15 a set UPLOAD_PAGE_URL is used as given` |
| U16 | With `UPLOAD_PAGE_URL` unset, the page address is the public base plus `/functions/v1/thought-attachments/upload` (`PUBLIC_BASE_URL=https://brain.example` gives `https://brain.example/functions/v1/thought-attachments/upload`) (T005 Q2) | FR-002, FR-019 | example | DONE | `tests/settings_test.ts::U16 with UPLOAD_PAGE_URL unset the page address is the public base plus the function's upload path` |
| U17 | A non-numeric value for a numeric setting (`MAX_PDF_PAGES=abc`) gives `{ ok: false }` with a problem naming `MAX_PDF_PAGES` and what it must be ("must be a positive whole number") (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U17 a non-numeric value for a numeric setting is a problem naming it and what it must be` |
| U18 | A zero or negative value for a whole-number setting (`MAX_PDF_PAGES=0`, `MAX_PDF_PAGES=-1`) gives a problem naming `MAX_PDF_PAGES` (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U18 a zero or negative value for a whole-number setting is a problem naming it` |
| U19 | A decimal MB cap is accepted as given (`MAX_IMAGE_MB=2.5` gives 2.5, with no problem) (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U19 a decimal MB cap is accepted as given` |
| U308 | A decimal value for a whole-number setting (`MAX_PDF_PAGES=2.5`, `BUSY_SECONDS=1.5`) gives a problem naming that setting ("must be a positive whole number") (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U308 a decimal value for a whole-number setting is a problem naming it` |
| U309 | A non-numeric, zero or negative MB cap (`MAX_PDF_MB=abc`, `MAX_IMAGE_MB=0`, `MAX_IMAGE_MB=-1`) gives a problem naming that setting and what it must be (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U309 a non-numeric, zero or negative MB cap is a problem naming it and what it must be` |
| U310 | Each other numeric setting (`EMBEDDING_BATCH_SIZE`, `PASSAGE_MAX_CHARS`, `SCANNED_MIN_CHARS_PER_PAGE`, `UPLOAD_LINK_MINUTES`, `DOWNLOAD_LINK_SECONDS`, `BUSY_SECONDS`) set to `abc` gives a problem naming that setting (T005 Q3) | FR-017 | example | DONE | `tests/settings_test.ts::U310 each other numeric setting set to abc is a problem naming it` |

#### `src/links.ts` (T009)

Test file: `tests/links_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U20 | `publicUrl` replaces a signed link's internal origin (`SUPABASE_URL`, for example `http://api-gw:8000`) with `PUBLIC_BASE_URL` and keeps its path and query exactly | FR-002, FR-019 | example | DONE | `tests/links_test.ts::U20 publicUrl replaces a signed link's internal origin with PUBLIC_BASE_URL and keeps its path and query` |
| U21 | `publicUrl` returns the link unchanged when `PUBLIC_BASE_URL` is already its origin (Cloud) | FR-019 | example | DONE | `tests/links_test.ts::U21 publicUrl returns the link unchanged when PUBLIC_BASE_URL is already its origin` |
| U22 | `pageLink` is `UPLOAD_PAGE_URL` + `#t=` + the token, and the token appears nowhere before the `#` | FR-002 | example | DONE | `tests/links_test.ts::U22 pageLink is UPLOAD_PAGE_URL then #t= then the token, with the token nowhere before the #` |
| U23 | `curlLine` is a `PUT` to the upload URL that carries every returned header and the given file path | FR-002 | example | DONE | `tests/links_test.ts::U23 curlLine is a PUT to the upload URL carrying every returned header and the given file path` |
| U24 | `curlLine` contains neither the MCP access key nor the service-role key | FR-002, FR-018 | example | DONE | `tests/links_test.ts::U24 curlLine contains neither the MCP access key nor the service-role key` |

#### `tests/helpers/fake_store.ts` (T011, fake fidelity)

Test file: `tests/helpers/fake_store_test.ts`. The acceptance tests rely on these database semantics. Stream Q asserts the same rules against real SQL (U53–U112), so a fake that drifts shows up as a disagreement.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U25 | A claim while another unexpired claim exists returns `{ busy }` naming the holder's operation | FR-026 | example | DONE | `tests/helpers/fake_store_test.ts::U25 a claim while another unexpired claim exists returns busy naming the holder's operation` |
| U26 | A claim after the holder's expiry, by the injected clock, succeeds with a new token | FR-026 | example | DONE | `tests/helpers/fake_store_test.ts::U26 a claim after the holder's expiry by the injected clock succeeds with a new token` |
| U27 | `writeDerived` or `setState` with a stale or foreign claim token returns an error and changes nothing | FR-026 | example | DONE | `tests/helpers/fake_store_test.ts::U27 writeDerived or setState with a stale or foreign claim token returns an error and changes nothing` |
| U28 | `writeDerived` failing partway leaves the previous derived set and state unchanged | FR-011, FR-027 | example | DONE | `tests/helpers/fake_store_test.ts::U28 writeDerived failing partway leaves the previous derived set and state unchanged` |
| U29 | A `writeDerived` row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged (never a merge) | FR-022 | example | DONE | `tests/helpers/fake_store_test.ts::U29 a writeDerived row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged` |
| U30 | `removeAttachment` removes only that attachment's derived thoughts and its row | FR-016, FR-022 | example | DONE | `tests/helpers/fake_store_test.ts::U30 removeAttachment removes only that attachment's derived thoughts and its row` |
| U31 | `removeAttachment` removes the parent note only under FR-016's exception | FR-016 | example | DONE | `tests/helpers/fake_store_test.ts::U31 removeAttachment removes the parent note only under FR-016's exception` |
| U32 | `orphans` lists a row whose parent is gone, an expired `pending_upload` row and a `refused` row, each with why | FR-021 | example | DONE | `tests/helpers/fake_store_test.ts::U32 orphans lists a row whose parent is gone, an expired pending_upload row and a refused row, each with why` |
| U33 | `insertNote` with a fingerprint that already exists returns that thought's id with `created: false` and leaves it unchanged | FR-001, FR-016 | example | DONE | `tests/helpers/fake_store_test.ts::U33 insertNote with a fingerprint that already exists returns that thought's id with created false and leaves it unchanged` |
| U311 | `findPending` returns a `pending_upload` row with the same parent, name, type and size whose `upload_deadline` is one second after the given `now` | FR-012 | example | DONE | `tests/helpers/fake_store_test.ts::U311 findPending returns a matching pending_upload whose deadline is one second after now` |
| U312 | `findPending` returns `null` for such a row whose `upload_deadline` is one second before `now` | FR-012, FR-021, edge case "pending upload past its deadline no longer counts as pending" | example | DONE | `tests/helpers/fake_store_test.ts::U312 findPending returns null for such a row whose deadline is one second before now` |
| U313 | `findByHash` returns a non-refused attachment on that parent with that `content_hash`, and `null` when the only match is `refused` or is on another parent (T005 Q4) | FR-012 | example | DONE | `tests/helpers/fake_store_test.ts::U313 findByHash returns a non-refused attachment on that parent with that hash, and null when the only match is refused or on another parent` |
| U355 | An empty or blank `MCP_ACCESS_KEY` counts as unset: settings are not ok, naming `MCP_ACCESS_KEY` | FR-018, contracts/settings.md `MCP_ACCESS_KEY` | example | DONE | `tests/settings_test.ts::U355 an empty or blank MCP_ACCESS_KEY counts as unset: the result is not ok, naming MCP_ACCESS_KEY` |
| U356 | A trailing slash on `PUBLIC_BASE_URL` is dropped, so the default page address has no double slash | R6, contracts/settings.md `UPLOAD_PAGE_URL` | example | DONE | `tests/settings_test.ts::U356 a trailing slash on PUBLIC_BASE_URL is dropped, so the default page address has no double slash` |

### Stream Q: data (wave 1, `ta-data`)

#### `schema.sql` (T014, T015, T016, T038, T055, T061)

Test file: `tests/verify.sql` (one assertion block per behavior), except U52.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U34 | `thought_attachments` has every column of `data-model.md` with its type, default and not-null rule, and `parent_thought_id` has no foreign key | FR-020, FR-016 | example | DONE | `tests/verify.sql` (U34 block) |
| U35 | `declared_type` accepts each of `application/pdf`, `image/jpeg`, `image/png` and `image/webp`, and rejects any other value | FR-003 | example | DONE | `tests/verify.sql` (U35 block) |
| U36 | `expected_kind` accepts `photo`, `pdf` and empty, and rejects any other value | FR-001 | example | DONE | `tests/verify.sql` (U36 block) |
| U37 | `sensitivity_tier` accepts `standard`, `personal` and `restricted`, defaults to `personal`, and rejects any other value | FR-008 | example | DONE | `tests/verify.sql` (U37 block) |
| U38 | `state` accepts the six states of `data-model.md` and rejects any other value | FR-004 | example | DONE | `tests/verify.sql` (U38 block) |
| U39 | `busy_op` accepts `finish`, `rebuild` and `remove`, and rejects any other value | FR-026 | example | DONE | `tests/verify.sql` (U39 block) |
| U40 | An update to a row advances its `updated_at` through the trigger | FR-020 | example | DONE | `tests/verify.sql` (U40 block) |
| U41 | Indexes on `parent_thought_id` and on `content_hash` exist | FR-020 | example | DONE | `tests/verify.sql` (U41 block) |
| U42 | A second non-`refused` row with the same `parent_thought_id` and `content_hash` is rejected by the unique index | FR-012 | example | DONE | `tests/verify.sql` (U42 block) |
| U43 | A `refused` row with the same parent and `content_hash` doesn't block a new row (the index excludes `refused`) | FR-004, SC-013 | example | DONE | `tests/verify.sql` (U43 block) |
| U44 | Two rows on the same parent with no `content_hash` yet are both allowed (the index covers only set hashes) | FR-012 | example | DONE | `tests/verify.sql` (U44 block) |
| U45 | RLS is enabled on `thought_attachments`, with no policy for `anon` or `authenticated` | FR-018 | example | DONE | `tests/verify.sql` (U45 block) |
| U46 | `service_role` has select, insert, update and delete on `thought_attachments` | FR-020 | example | DONE | `tests/verify.sql` (U46 block) |
| U47 | On a `thoughts` table without `content_fingerprint`, the file adds the column and `idx_thoughts_fingerprint` | FR-020 | example | DONE | `tests/verify.sql` (U47 block) |
| U48 | On a `thoughts` table that already has them, the file adds no second column or index (the index count on `thoughts` is unchanged) | FR-020 | example | DONE | `tests/verify.sql` (U48 block) |
| U49 | With a minimal stub `storage` schema that `tests/verify.sql` creates before including `schema.sql` (a `storage.buckets` table with only the columns `schema.sql` writes), the `ATTACHMENTS_BUCKET` bucket (`ob1-files`) row exists, is not public, and allows exactly the four accepted MIME types (and, if `schema.sql` writes `file_size_limit`, it is null). U50's no-storage run comes earlier in the file, before the stub exists | FR-018, FR-020 | example | DONE | `tests/verify.sql` (U49 block) |
| U50 | Where no `storage` schema exists, the file runs without error and skips the bucket (asserted before `tests/verify.sql` creates the U49 stub) | FR-019, FR-020 | example | DONE | `tests/verify.sql` (U50 block) |
| U51 | Running the whole file twice on the same database raises nothing and leaves one of each object | FR-020 | example | DONE | `tests/verify.sql` (U51 block) |
| U52 | Neither `schema.sql` nor `tests/verify.sql` contains `DROP`, `TRUNCATE` or an unqualified `DELETE` (a static scan in `tests/schema_drift_test.ts`) | INV-2, FR-016 | example | DONE | `tests/schema_drift_test.ts::U52 neither schema.sql nor tests/verify.sql contains DROP, TRUNCATE or an unqualified DELETE` |
| U53 | The write-derived function, with the caller's unexpired claim token, inserts the given rows | FR-011, FR-026 | example | DONE | `tests/verify.sql` (U53 block) |
| U54 | The write-derived function with a matching token whose `busy_until` has passed is refused, and writes nothing | FR-026 | example | DONE | `tests/verify.sql` (U54 block) |
| U55 | Inserted rows' `content_fingerprint` equals the expression of `W/docs/01-getting-started.md` step 2.6 applied to their content | FR-022, FR-012 | example | DONE | `tests/verify.sql` (U55 block) |
| U56 | A row whose fingerprint equals an existing owner thought's raises, and that thought's content and metadata are unchanged | FR-022, US1.4 | example | DONE | `tests/verify.sql` (U56 block) |
| U57 | A write replaces the attachment's previous derived set and sets its state fields and `derived_count` in the same call | FR-027, FR-011 | example | DONE | `tests/verify.sql` (U57 block) |
| U58 | A write that fails partway (its second row conflicts) leaves the previous set, state and `derived_count` | FR-011, FR-027 | example | DONE | `tests/verify.sql` (U58 block) |
| U59 | A write for one attachment leaves another attachment's derived thoughts untouched | FR-022 | example | DONE | `tests/verify.sql` (U59 block) |
| U60 | Setting `content_hash` on a second non-`refused` attachment of a parent to the hash another non-`refused` attachment of that parent already holds raises (the unique index of `data-model.md`) and changes nothing; the finish avoids reaching it by refusing first (U188) | FR-012, US1.3 | example | DONE | `tests/verify.sql` (U60 block) |
| U61 | A claim while an unexpired claim exists is refused and returns the running `busy_op` | FR-026 | example | DONE | `tests/verify.sql` (U61 block) |
| U62 | A claim after `busy_until` succeeds, with a `busy_token` different from the previous one | FR-026 | example | DONE | `tests/verify.sql` (U62 block) |
| U63 | A claim on one attachment doesn't block a claim on another | FR-026 | example | DONE | `tests/verify.sql` (U63 block) |
| U64 | Release with the holder's token clears the claim, so an immediate claim succeeds | FR-026 | example | DONE | `tests/verify.sql` (U64 block) |
| U65 | Release with another token leaves the claim in place | FR-026 | example | DONE | `tests/verify.sql` (U65 block) |
| U66 | The dimension function returns 1536 on fork-ci's bootstrap (`vector(1536)`) | FR-007 | example | DONE | `tests/verify.sql` (U66 block) |
| U67 | The exact-text find returns id, first line and capture date for a thought whose content contains the query | FR-023 | example | DONE | `tests/verify.sql` (U67 block) |
| U68 | A query containing `%`, `,`, `)` and `'` matches only content that contains those characters literally (no wildcard, no injected filter) | FR-023 | example | DONE | `tests/verify.sql` (U68 block) |
| U314 | The exact-text find ignores letter case: `FURNACE Filters` finds a thought containing `furnace filters`, and a thought without the text in any case is not returned | FR-023, edge case "exact-text lookup finds thoughts containing the given text, ignoring letter case" | example | DONE | `tests/verify.sql` (U314 block) |
| U84 | Inserting a note whose text is new adds a thought with the note's content and `data-model.md` "Parent note" metadata, and reports it as created | FR-001 | example | DONE | `tests/verify.sql` (U84 block) |
| U85 | Inserting a note whose fingerprint exists returns that thought's id as not created, and leaves it unchanged | FR-001, FR-016 | example | DONE | `tests/verify.sql` (U85 block) |
| U86 | The page-token lookup finds a row by `page_token_hash` only | FR-002, FR-024 | example | DONE | `tests/verify.sql` (U86 block) |
| U87 | Consuming a page token succeeds once and clears the hash; a second consume fails | FR-002, FR-024 | example | DONE | `tests/verify.sql` (U87 block) |
| U93 | A write or set-state with an old token, after a newer claim took over, is refused and changes nothing | FR-026, SC-019 | example | DONE | `tests/verify.sql` (U93 block) |
| U94 | A set-state under a valid claim records `state` and `state_reason` and leaves the derived thoughts | FR-004, FR-010 | example | DONE | `tests/verify.sql` (U94 block) |
| U95 | Remove under a valid claim deletes that attachment's derived thoughts and its row, scoped by its id, in one transaction | FR-016 | example | DONE | `tests/verify.sql` (U95 block) |
| U96 | Remove leaves the parent thought, and another attachment of the same file on another thought with all its derived thoughts | FR-016, FR-022, SC-012 | example | DONE | `tests/verify.sql` (U96 block) |
| U97 | Remove without a valid claim is refused and deletes nothing | FR-026 | example | DONE | `tests/verify.sql` (U97 block) |
| U98 | Remove deletes the parent note when `parent_created_here` is true, the attachment ended `refused`, and no other attachment points to the note | FR-016, SC-020 | example | DONE | `tests/verify.sql` (U98 block) |
| U99 | Remove deletes the parent note when `parent_created_here` is true, the attachment is `pending_upload` past its deadline, and no other attachment points to the note | FR-016, SC-020 | example | DONE | `tests/verify.sql` (U99 block) |
| U100 | Remove keeps the note when another attachment points to it | FR-016, SC-020 | example | DONE | `tests/verify.sql` (U100 block) |
| U101 | Remove keeps the parent when `parent_created_here` is false | FR-016 | example | DONE | `tests/verify.sql` (U101 block) |
| U102 | Remove keeps the note when the attachment is `processed` | FR-016 | example | DONE | `tests/verify.sql` (U102 block) |
| U103 | Remove keeps the note when the attachment is `pending_upload` before its deadline | FR-016 | example | DONE | `tests/verify.sql` (U103 block) |
| U104 | The preview reports the same derived count and note flag the remove would, and deletes nothing | FR-016, US5.2 | example | DONE | `tests/verify.sql` (U104 block) |
| U105 | Orphans lists a row whose parent thought is gone, with why and `derived_count` | FR-021 | example | DONE | `tests/verify.sql` (U105 block) |
| U106 | Orphans lists a `pending_upload` row past its `upload_deadline` | FR-021, SC-017 | example | DONE | `tests/verify.sql` (U106 block) |
| U107 | Orphans omits a `pending_upload` row before its `upload_deadline` | FR-021, SC-017 | example | DONE | `tests/verify.sql` (U107 block) |
| U108 | Orphans lists a `refused` row | FR-021, SC-013 | example | DONE | `tests/verify.sql` (U108 block) |
| U109 | Orphans omits a `processed` row whose parent exists | FR-021 | example | DONE | `tests/verify.sql` (U109 block) |

#### `src/store.ts` (T017, T018, T038, T048, T062)

Test file: `tests/store_test.ts` (supabase-js over the fake fetch).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U69 | `thoughtExists` is true for an existing id and false for an unknown one | FR-001 | example | DONE | `tests/store_test.ts::U69 thoughtExists is true for an existing id and false for an unknown one` |
| U70 | `matchThoughts` sends the embedding and limit to the base `match_thoughts` and maps the reply to `ThoughtMatch` | FR-023 | example | DONE | `tests/store_test.ts::U70 matchThoughts sends the embedding and limit to the base match_thoughts and maps the reply to ThoughtMatch` |
| U71 | `findThoughtsExact` sends the text as an RPC parameter, never inside a filter string | FR-023 | example | DONE | `tests/store_test.ts::U71 findThoughtsExact sends the text as an RPC parameter, never inside a filter string` |
| U72 | `embeddingDimension` returns the dimension function's number | FR-007 | example | DONE | `tests/store_test.ts::U72 embeddingDimension returns the dimension function's number` |
| U73 | `claim` maps a refused claim to `{ busy: op }` and a success to `{ token }` | FR-026 | example | DONE | `tests/store_test.ts::U73 claim maps a refused claim to busy and a success to a token` |
| U74 | `getAttachment` with a full id returns the row | FR-015 | example | DONE | `tests/store_test.ts::U74 getAttachment with a full id returns the row` |
| U75 | `getAttachment` with an 8-character short id returns the row when exactly one matches | FR-025 | example | DONE | `tests/store_test.ts::U75 getAttachment with an 8-character short id returns the row when exactly one matches` |
| U76 | `getAttachment` with a short id that matches two rows returns `ambiguous` | FR-025 | example | DONE | `tests/store_test.ts::U76 getAttachment with a short id that matches two rows returns ambiguous` |
| U77 | `getAttachment` with an unknown id returns `not_found` | FR-014 | example | DONE | `tests/store_test.ts::U77 getAttachment with an unknown id returns not_found` |
| U78 | A database error maps to `{ error }` whose text contains no service-role key | FR-009 | example | DONE | `tests/store_test.ts::U78 a database error maps to { error } whose text contains no service-role key` |
| U79 | `signUpload` targets `ATTACHMENTS_BUCKET` at `attachments/<id>/<file_name>` and returns Storage's URL unchanged | FR-001, FR-018 | example | DONE | `tests/store_test.ts::U79 signUpload targets ATTACHMENTS_BUCKET at attachments/<id>/<file_name> and returns Storage's URL unchanged` |
| U80 | `objectInfo` returns the object's size and creation time, and `null` when there is no object | FR-004 | example | DONE | `tests/store_test.ts::U80 objectInfo returns the object's size and creation time, and null when there is no object` |
| U81 | `download` returns the stored bytes | FR-004 | example | DONE | `tests/store_test.ts::U81 download returns the stored bytes` |
| U82 | `deleteObject` deletes that path and no other | FR-004, FR-016 | example | DONE | `tests/store_test.ts::U82 deleteObject deletes that path and no other` |
| U88 | `insertNote` maps the RPC reply to `{ id, created }` | FR-001, FR-024 | example | DONE | `tests/store_test.ts::U88 insertNote maps the RPC reply to { id, created }` |
| U89 | `signDownload` passes the path and the seconds to Storage and returns the signed URL | FR-014 | example | DONE | `tests/store_test.ts::U89 signDownload passes the path and the seconds to Storage and returns the signed URL` |
| U90 | `listByParent` returns that parent's attachments only | FR-015 | example | DONE | `tests/store_test.ts::U90 listByParent returns that parent's attachments only` |
| U91 | `attachmentForDerived` returns the attachment named by the thought's `metadata.attachment_id` | FR-015 | example | DONE | `tests/store_test.ts::U91 attachmentForDerived returns the attachment named by the thought's metadata.attachment_id` |
| U92 | `attachmentForDerived` on a thought without `attachment_id` returns `null` | FR-015 | example | DONE | `tests/store_test.ts::U92 attachmentForDerived on a thought without attachment_id returns null` |
| U110 | `removalPreview` maps the preview reply to `{ derived, noteWouldGo }` | FR-016 | example | DONE | `tests/store_test.ts::U110 removalPreview maps the preview reply to { derived, noteWouldGo }` |
| U111 | `removeAttachment` passes the claim token and maps the reply to `{ derived, noteRemoved }` | FR-016 | example | DONE | `tests/store_test.ts::U111 removeAttachment passes the claim token and maps the reply to { derived, noteRemoved }` |
| U112 | `orphans` passes the current time and maps the reply to `{ row, why }[]` | FR-021 | example | DONE | `tests/store_test.ts::U112 orphans passes the current time and maps the reply to { row, why }[]` |
| U315 | `findByHash(parentId, contentHash)` returns the non-`refused` attachment on that parent with that hash (T005 Q4) | FR-012 | example | DONE | `tests/store_test.ts::U315 findByHash returns the non-refused attachment on that parent with that hash` |
| U316 | `findByHash` returns `null` when the only attachment with that hash on that parent is `refused` | FR-012, FR-004 | example | DONE | `tests/store_test.ts::U316 findByHash returns null when the only attachment with that hash on that parent is refused` |
| U317 | `findByHash` returns `null` when the hash belongs only to an attachment of another parent | FR-012, edge case "same file attached to two different thoughts" | example | DONE | `tests/store_test.ts::U317 findByHash returns null when the hash belongs only to an attachment of another parent` |
| U318 | `findPending(parentId, name, type, size, now)` returns the `pending_upload` row with that name, type and size on that parent while `now` is before its `upload_deadline` | FR-012 | example | DONE | `tests/store_test.ts::U318 findPending returns the pending_upload row with that name, type and size while now is before its deadline` |
| U319 | `findPending` returns `null` for that row once `now` is past its `upload_deadline` | FR-012, FR-021, edge case "pending upload past its deadline no longer counts as pending" | example | DONE | `tests/store_test.ts::U319 findPending returns null for that row once now is past its deadline` |

#### `tests/schema_drift_test.ts` (T019; `src/store.ts` against `schema.sql`)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U83 | Every RPC name and named parameter that `src/store.ts` sends exists in `schema.sql`, or is the base `match_thoughts` | INV-3 | example | DONE | `tests/schema_drift_test.ts::U83 every RPC name and named parameter that src/store.ts sends exists in schema.sql, or is the base match_thoughts` |
| U357 | `createAttachment` inserts a `pending_upload` row with the given fields and returns it | FR-001, data-model.md `thought_attachments` | example | DONE | `tests/store_test.ts::U357 createAttachment inserts a pending_upload row with the given fields and returns it` |
| U358 | `setDeclaration` updates the declared fields of that attachment only | FR-001, FR-002, data-model.md `thought_attachments.declared_type` | example | DONE | `tests/store_test.ts::U358 setDeclaration updates the declared fields of that attachment only and returns the row` |
| U359 | `release` passes the claim token | FR-026, R10 | example | DONE | `tests/store_test.ts::U359 release passes the claim token` |
| U360 | `writeDerived` sends the rows (content, metadata, embedding) and the state patch under the claim token | FR-011, FR-027, R9 | example | DONE | `tests/store_test.ts::U360 writeDerived sends the rows (content, metadata, embedding) and the state patch under the claim token` |
| U361 | `setState` sends the patch under the claim token and returns the row | FR-026, data-model.md states | example | DONE | `tests/store_test.ts::U361 setState sends the patch under the claim token and returns the row` |
| U367 | `thought_attachments.declared_by_page` is boolean, not null, default false, and is added to an earlier install | data-model.md `thought_attachments.declared_by_page` | example | DONE | `tests/verify.sql` (U34 block, column list) |

### Stream X: files (wave 1, `ta-files`)

#### `src/intake.ts` (T020, T035, T053)

Test file: `tests/intake_test.ts`. "The cap" means the cap's byte value, with 1 MB = 1,048,576 bytes (spec edge case): the default image cap is 10,485,760 bytes and the default PDF cap 26,214,400.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U113 | `baseName` drops POSIX directory parts (`/Users/a/b/manual.pdf` gives `manual.pdf`) | FR-009, edge case "personal or path information" | example | DONE | `tests/intake_test.ts::U113 baseName drops POSIX directory parts` |
| U114 | `baseName` drops Windows directory parts and the drive (`C:\Users\a\manual.pdf` gives `manual.pdf`) | FR-009, edge case "personal or path information" | example | DONE | `tests/intake_test.ts::U114 baseName drops Windows directory parts and the drive` |
| U115 | `baseName` removes control characters | FR-009 | example | DONE | `tests/intake_test.ts::U115 baseName removes control characters` |
| U116 | `checkDeclared` accepts each of the four accepted types within its cap | FR-003 | example | DONE | `tests/intake_test.ts::U116 checkDeclared accepts each of the four accepted types within its cap` |
| U117 | `checkDeclared` refuses any other type (for example `application/zip`), naming the accepted types | FR-003 | example | DONE | `tests/intake_test.ts::U117 checkDeclared refuses any other type, naming the accepted types` |
| U118 | An image declared at exactly the image cap (10,485,760 bytes by default) is accepted | FR-003, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/intake_test.ts::U118 an image declared at exactly the image cap is accepted` |
| U119 | An image declared one byte over the image cap (10,485,761 bytes by default) is refused, naming the cap and the declared size | FR-003, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/intake_test.ts::U119 an image declared one byte over the image cap is refused, naming the cap and the declared size` |
| U120 | A PDF declared at exactly the PDF cap (26,214,400 bytes by default) is accepted | FR-003, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/intake_test.ts::U120 a PDF declared at exactly the PDF cap is accepted` |
| U121 | A PDF declared one byte over the PDF cap (26,214,401 bytes by default) is refused, naming the cap and the declared size | FR-003, US4.1, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/intake_test.ts::U121 a PDF declared one byte over the PDF cap is refused, naming the cap and the declared size` |
| U320 | With `MAX_IMAGE_MB=2.5`, an image declared at 2,621,440 bytes is accepted and one declared at 2,621,441 bytes is refused (T005 Q3) | FR-003, FR-017, edge case "size caps count 1 MB as 1,048,576 bytes" | example | DONE | `tests/intake_test.ts::U320 with MAX_IMAGE_MB=2.5 an image at 2,621,440 bytes is accepted and one byte more is refused` |
| U141 | A HEIC declared type (`image/heic`, `image/heif`) is refused with "share it as JPEG" and the steps on iPhone and Android | FR-003, US2.3 | example | DONE | `tests/intake_test.ts::U141 a HEIC declared type is refused with share it as JPEG and the steps on iPhone and Android` |
| U142 | A file name ending `.heic` or `.heif`, in any case, is refused with the same message whatever the declared type | FR-003, US2.3 | example | DONE | `tests/intake_test.ts::U142 a file name ending .heic or .heif, in any case, gets the same refusal whatever the declared type` |
| U143 | `sniffType` identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes | FR-004 | example | DONE | `tests/intake_test.ts::U143 sniffType identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes` |
| U144 | `sniffType` returns `null` for any other bytes and for empty input | FR-004 | example | DONE | `tests/intake_test.ts::U144 sniffType returns null for any other bytes and for empty input` |
| U148 | `checkActual` accepts a file whose sniffed type and exact size equal the declaration and are within the caps | FR-004 | example | DONE | `tests/intake_test.ts::U148 checkActual accepts a file whose sniffed type and exact size equal the declaration, within the caps` |
| U149 | `checkActual` refuses a sniffed type that differs from the declared one, naming the actual type | FR-004, edge case "declares one type or size but uploads another" | example | DONE | `tests/intake_test.ts::U149 checkActual refuses a sniffed type that differs from the declared one, naming the actual type` |
| U150 | `checkActual` refuses an actual size one byte different from the declared one, naming the actual size | FR-004, SC-013 | example | DONE | `tests/intake_test.ts::U150 checkActual refuses an actual size one byte different from the declared one, naming the actual size` |
| U151 | `checkActual` accepts a PDF of exactly `MAX_PDF_PAGES` pages | FR-004, FR-013 | example | DONE | `tests/intake_test.ts::U151 checkActual accepts a PDF of exactly MAX_PDF_PAGES pages` |
| U152 | `checkActual` refuses a PDF of `MAX_PDF_PAGES` + 1 pages, naming `MAX_PDF_PAGES`, the actual page count and the planned background processing | FR-013, US4.1 | example | DONE | `tests/intake_test.ts::U152 checkActual refuses a PDF of MAX_PDF_PAGES + 1 pages, naming MAX_PDF_PAGES, the page count and background processing` |
| U153 | `checkActual` refuses an actual size over its type's cap, naming the cap and the actual size, and for a PDF also the planned background processing | FR-004, FR-013, US4.1 | example | DONE | `tests/intake_test.ts::U153 checkActual refuses an actual size over its type's cap, naming cap and size, and for a PDF the planned background processing` |
| U154 | `checkActual` refuses HEIC bytes with the "share it as JPEG" message, whatever was declared | FR-004, US2.4 | example | DONE | `tests/intake_test.ts::U154 checkActual refuses HEIC bytes with the share it as JPEG message, whatever was declared` |
| U155 | `checkActual` refuses bytes `sniffType` doesn't recognise as a type that isn't accepted | FR-004 | example | DONE | `tests/intake_test.ts::U155 checkActual refuses bytes sniffType does not recognise as a type that is not accepted` |

#### `src/pdf.ts` (T021, T054)

Test file: `tests/pdf_test.ts` (fixtures generated with `pdf-lib` at test time).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U122 | `openPdf` of a 3-page fixture reports `pageCount` 3 | FR-004, FR-013 | example | DONE | `tests/pdf_test.ts::U122 openPdf of a 3-page fixture reports pageCount 3` |
| U123 | `pageTexts` returns each page's text in page order | FR-005 | example | DONE | `tests/pdf_test.ts::U123 pageTexts returns each page's text in page order` |
| U156 | `isScanned` is true when the average of non-space characters per page is one under `SCANNED_MIN_CHARS_PER_PAGE` | FR-010 | example | DONE | `tests/pdf_test.ts::U156 isScanned is true when the average non-space characters per page is one under SCANNED_MIN_CHARS_PER_PAGE` |
| U157 | `isScanned` is false at exactly `SCANNED_MIN_CHARS_PER_PAGE` | FR-010 | example | DONE | `tests/pdf_test.ts::U157 isScanned is false at exactly SCANNED_MIN_CHARS_PER_PAGE` |
| U158 | Whitespace-only page text counts as zero characters | FR-010 | example | DONE | `tests/pdf_test.ts::U158 whitespace-only page text counts as zero characters` |
| U159 | `openPdf` of corrupt bytes returns `{ error }` with a readable reason, without throwing | FR-011, edge case "encrypted or corrupt" | example | DONE | `tests/pdf_test.ts::U159 openPdf of corrupt bytes returns an error with a readable reason, without throwing` |
| U160 | `openPdf` of an encrypted PDF returns `{ error }` with a readable reason (only if an encrypted fixture can be generated without a committed binary; `pdf-lib` cannot encrypt. Otherwise this becomes `DROPPED` here and is checked live in T077) | FR-011, edge case "encrypted or corrupt" | example | DONE | `tests/pdf_test.ts::U160 openPdf of an encrypted PDF returns an error with a readable reason` |

#### `src/passages.ts` (T022)

Test file: `tests/passages_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U124 | Every passage, source line included, is at most `PASSAGE_MAX_CHARS` | FR-005, FR-025 | example | DONE | `tests/passages_test.ts::U124 every passage, source line included, is at most PASSAGE_MAX_CHARS` |
| U125 | Text that fits in exactly `PASSAGE_MAX_CHARS` with its source line is one passage | FR-005, FR-025 | example | DONE | `tests/passages_test.ts::U125 text that fits in exactly PASSAGE_MAX_CHARS with its source line is one passage` |
| U126 | Text one character longer than that is two passages | FR-005, FR-025 | example | DONE | `tests/passages_test.ts::U126 text one character longer than that is two passages` |
| U127 | Passages keep reading order, and together their bodies contain all of the page text, whitespace aside (sampled on fixtures; no property library in the profile) | FR-005 | example | DONE | `tests/passages_test.ts::U127 passages keep reading order and together contain all of the page text, whitespace aside` |
| U128 | A passage within one page records that page as both ends of its range | FR-005 | example | DONE | `tests/passages_test.ts::U128 a passage within one page records that page as both ends of its range` |
| U129 | A passage that crosses a page boundary records both pages | FR-005 | example | DONE | `tests/passages_test.ts::U129 a passage that crosses a page boundary records both pages` |
| U130 | A run of non-space text longer than the maximum is split into passages that are each within it | FR-005, edge case "very long passage" | example | DONE | `tests/passages_test.ts::U130 a run of non-space text longer than the maximum is split into passages that are each within it` |

#### `src/derived.ts` (T023, T036)

Test file: `tests/derived_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U131 | `sourceLine` for a passage on pages 12–13 is `From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)` (data-model.md example) | FR-025 | example | DONE | `tests/derived_test.ts::U131 sourceLine for a passage on pages 12–13 is the data-model example` |
| U132 | The short id in a source line is the first 8 hex characters of the attachment id | FR-025 | example | DONE | `tests/derived_test.ts::U132 the short id in a source line is the first 8 hex characters of the attachment id` |
| U133 | `fingerprint` equals the normalisation of `W/docs/01-getting-started.md` step 2.6 for content with surrounding whitespace, capitals and runs of whitespace | FR-012, FR-022 | example | DONE | `tests/derived_test.ts::U133 fingerprint equals upsert_thought's normalisation: collapse whitespace runs, trim, lowercase, sha256 hex` |
| U134 | A passage row's content is the source line, a line break, then the passage text | FR-025 | example | DONE | `tests/derived_test.ts::U134 a passage row's content is the source line, a line break, then the passage text` |
| U135 | A passage row's metadata carries the ingestion contract fields: `source` and `source_type` `local_document`, `source_label` the base name, `importer_name` `thought-attachments`, `importer_version`, `imported_at` (ISO 8601 UTC from the injected clock), `input_hash` the attachment's `content_hash`, `content_fingerprint` `sha256:` plus the fingerprint, and `sensitivity_tier` | FR-008 | example | DONE | `tests/derived_test.ts::U135 a passage row's metadata carries the ingestion contract fields` |
| U136 | A passage row's metadata has `type` `reference` and `topics` `["attachment", "<base name>"]` | FR-028 | example | DONE | `tests/derived_test.ts::U136 a passage row's metadata has type reference and topics [attachment, base name]` |
| U137 | A passage row's `provenance` is `deterministic_conversion` with `source_locator` (`pages 12–13`), `artifact` (the base name) and `review_status` `unreviewed` | FR-008 | example | DONE | `tests/derived_test.ts::U137 a passage row's provenance is deterministic_conversion with locator, artifact and review status` |
| U138 | A passage row's metadata has `attachment_id` and `parent_thought_id` | FR-008, FR-015 | example | DONE | `tests/derived_test.ts::U138 a passage row's metadata has attachment_id and parent_thought_id` |
| U139 | An attachment with tier `restricted` gives metadata with `sensitivity_tier` `restricted` | FR-008 | example | DONE | `tests/derived_test.ts::U139 an attachment with tier restricted gives metadata with sensitivity_tier restricted` |
| U140 | The metadata contains no URL, no token and no absolute path, even when built from a file name that held a path | FR-009 | example | DONE | `tests/derived_test.ts::U140 the metadata contains no URL, token or absolute path, even from a file name that held a path` |
| U321 | `sourceLine` for a passage on page 12 only is `From dishwasher-manual.pdf, page 12 (attachment a1b2c3d4)`, never `pages 12–12` | FR-025, edge case "a passage from one page names it as page 12" | example | DONE | `tests/derived_test.ts::U321 a passage on page 12 only is named page 12, never pages 12–12` |
| U145 | A caption row's content is `From shelf.jpg, photo (attachment 9f8e7d6c)`, a line break, then the caption | FR-025, FR-006 | example | DONE | `tests/derived_test.ts::U145 a caption row's content is the source line with photo, a line break, then the caption` |
| U146 | A caption row's `provenance` is `llm_extraction` with `source_locator` `photo` and `extractor_model` the model | FR-008, FR-006 | example | DONE | `tests/derived_test.ts::U146 a caption row's provenance is llm_extraction with locator photo and the extractor model` |
| U147 | `noteMetadata` is `{ type: "observation", source: "thought-attachments", source_type: "thought_attachments_note", imported_at }` | FR-001 | example | DONE | `tests/derived_test.ts::U147 noteMetadata is type observation, source thought-attachments, the note source type and imported_at` |
| U350 | `passageRow` for a passage on page 12 only records `provenance.source_locator` `page 12`; a passage over pages 12–13 records `pages 12–13` | FR-008, FR-025, data-model.md derived thought `provenance` | example | DONE | `tests/derived_test.ts::U350 passageRow records provenance.source_locator page 12 for one page and pages 12–13 across two` |

### Stream E: model clients (wave 1, `ta-models`)

#### `src/embeddings.ts` (T024)

Test file: `tests/embeddings_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U161 | `embed` sends `POST <EMBEDDING_API_BASE>/embeddings` with `EMBEDDING_MODEL` and an array input | FR-007 | example | DONE | `tests/embeddings_test.ts::U161 embed sends POST <EMBEDDING_API_BASE>/embeddings with the model and an array input` |
| U162 | 64 texts at the default batch size go in one request | FR-007 | example | DONE | `tests/embeddings_test.ts::U162 64 texts at the default batch size go in one request` |
| U163 | 65 texts at the default batch size go in two requests (64, then 1) | FR-007 | example | DONE | `tests/embeddings_test.ts::U163 65 texts at the default batch size go in two requests, 64 then 1` |
| U164 | With batch size 1, each text goes in its own request | FR-007 | example | DONE | `tests/embeddings_test.ts::U164 with batch size 1 each text goes in its own request` |
| U165 | Each request carries `Authorization: Bearer` with the configured embedding key | FR-007 | example | DONE | `tests/embeddings_test.ts::U165 each request carries Authorization Bearer with the configured embedding key` |
| U166 | The vectors come back in input order across batches | FR-007 | example | DONE | `tests/embeddings_test.ts::U166 the vectors come back in input order across batches` |
| U167 | An unreachable endpoint fails the call with a reason naming it unreachable | FR-011 | example | DONE | `tests/embeddings_test.ts::U167 an unreachable endpoint fails the call with a reason naming it unreachable` |
| U168 | A non-2xx status fails the call with the status in the reason | FR-011 | example | DONE | `tests/embeddings_test.ts::U168 a non-2xx status fails the call with the status in the reason` |
| U169 | A malformed body (no data, or a vector count different from the inputs) fails the call | FR-011 | example | DONE | `tests/embeddings_test.ts::U169 a malformed body (no data, or a different vector count) fails the call` |
| U170 | A failure in a later batch fails the whole call, with no partial vectors returned | FR-011 | example | DONE | `tests/embeddings_test.ts::U170 a failure in a later batch fails the whole call with no partial vectors` |
| U171 | A key value that appears in a server's error body is redacted from the reason | FR-009 | example | DONE | `tests/embeddings_test.ts::U171 a key value in a server's error body is redacted from the reason` |

#### `src/vision.ts` (T037)

Test file: `tests/vision_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U172 | `configured` is false when `VISION_API_BASE` or `VISION_MODEL` is unset | FR-006 | example | DONE | `tests/vision_test.ts::U172 configured is false when VISION_API_BASE or VISION_MODEL is unset` |
| U173 | `caption` sends `POST <VISION_API_BASE>/chat/completions` with `VISION_MODEL` and the image as a `data:<type>;base64,…` URL of its real type | FR-006 | example | DONE | `tests/vision_test.ts::U173 caption posts to <VISION_API_BASE>/chat/completions with the model and the image as a data URL of its real type` |
| U174 | The prompt asks for the visible objects, places, labels and text | FR-006 | example | DONE | `tests/vision_test.ts::U174 the prompt asks for the visible objects, places, labels and text` |
| U175 | With `VISION_API_KEY` set, the request carries it as a bearer token | FR-006 | example | DONE | `tests/vision_test.ts::U175 with VISION_API_KEY set the request carries it as a bearer token` |
| U176 | With `VISION_API_KEY` unset, the request has no `Authorization` header | FR-006 | example | DONE | `tests/vision_test.ts::U176 with VISION_API_KEY unset the request has no Authorization header` |
| U177 | A successful reply gives the caption text and the model | FR-006, FR-008 | example | DONE | `tests/vision_test.ts::U177 a successful reply gives the caption text and the configured model` |
| U178 | An unreachable endpoint fails with a reason | FR-006 | example | DONE | `tests/vision_test.ts::U178 an unreachable endpoint fails with a reason` |
| U179 | A non-2xx status fails with the status in the reason | FR-006 | example | DONE | `tests/vision_test.ts::U179 a non-2xx status fails with the status in the reason` |
| U180 | An empty or whitespace-only caption fails with a reason | FR-006 | example | DONE | `tests/vision_test.ts::U180 an empty or whitespace-only caption fails with a reason` |
| U181 | A key value in an error is redacted | FR-009 | example | DONE | `tests/vision_test.ts::U181 a key value in an error is redacted` |

### Stream N: finishing (wave 2, `ta-finish`)

#### `src/finish.ts` (T025, T026, T039, T040, T056, T057, T058)

Test file: `tests/finish_test.ts` (the real X and E modules, `FakeStore`, `fake_fetch`, fake clock).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U182 | A pending PDF with a matching upload ends `processed`, with `derived_count` equal to the passage count and `page_count` set | FR-005, US1.1 | example | DONE | `tests/finish_test.ts::U182 a pending PDF with a matching upload ends processed, with derived_count equal to the passage count and page_count set` |
| U183 | Finishing sets `actual_type`, `actual_size`, `page_count`, `content_hash` (`sha256:<hex>` of the stored bytes) and `processed_at` | FR-004, FR-008 | example | DONE | `tests/finish_test.ts::U183 finishing sets actual_type, actual_size, page_count, content_hash and processed_at` |
| U184 | Every derived row's `input_hash` equals the attachment's `content_hash` | FR-008 | example | DONE | `tests/finish_test.ts::U184 every derived row's input_hash equals the attachment's content_hash` |
| U185 | After a `processed` finish, a new claim on the attachment succeeds at once (the claim was released) | FR-026 | example | DONE | `tests/finish_test.ts::U185 after a processed finish, a new claim on the attachment succeeds at once` |
| U186 | An owner thought equal to a passage's body is unchanged after the finish | FR-022, US1.4 | example | DONE | `tests/finish_test.ts::U186 an owner thought equal to a passage's body is unchanged after the finish` |
| U187 | A plain finish on `processed` returns the existing outcome with no embedding or vision request and no write (it never rebuilds) | FR-012, FR-027 | example | DONE | `tests/finish_test.ts::U187 a plain finish on processed returns the existing outcome with no embedding or vision request and no write` |
| U188 | When `findByHash` returns another non-refused attachment on the same parent for the uploaded bytes' `content_hash`, the finish ends `refused` with "already attached to this thought as <its short id>", deletes the stored object and writes no derived thought (T005 Q4) | FR-012, US1.3 | example | DONE | `tests/finish_test.ts::U188 bytes already on another attachment of the parent end refused, naming its short id, with the copy deleted` |
| U322 | When the only attachment on the parent with those bytes is `refused`, the finish is not refused for them and ends `processed` | FR-012, FR-004 | example | DONE | `tests/finish_test.ts::U322 when the only attachment with those bytes is refused, the finish is not refused for them` |
| U323 | The same bytes on an attachment of another parent don't refuse the finish (it ends `processed`) | FR-012, edge case "same file attached to two different thoughts" | example | DONE | `tests/finish_test.ts::U323 the same bytes on an attachment of another parent don't refuse the finish` |
| U324 | A first attachment with those bytes in state `failed` still counts: the second ends `refused`, naming it (T005 Q4) | FR-012 | example | DONE | `tests/finish_test.ts::U324 a first attachment with those bytes in state failed still counts: the second ends refused, naming it` |
| U325 | Finishing a `failed` attachment again, or rebuilding a `processed` one, whose bytes `findByHash` reports only as that attachment itself, is not refused as a duplicate | FR-012, FR-027 | example | DONE | `tests/finish_test.ts::U325 finishing a failed attachment again, or rebuilding a processed one, is not refused as a duplicate of itself` |
| U189 | A photo with a caption gives one derived thought, `processed`, and `caption_model` set | FR-006, US2.1 | example | DONE | `tests/finish_test.ts::U189 a photo with a caption gives one derived thought, processed, with caption_model set` |
| U190 | A 300-character caption is returned whole in the outcome | FR-024 | example | DONE | `tests/finish_test.ts::U190 a 300-character caption is returned whole in the outcome` |
| U191 | A 301-character caption is returned as its first 300 characters, while the derived thought keeps the full caption | FR-024, FR-006 | example | DONE | `tests/finish_test.ts::U191 a 301-character caption is returned as its first 300 characters, while the derived thought keeps the full caption` |
| U192 | With vision not configured, the photo ends `not_captioned` with the reason, the object is kept, and there is no derived thought | FR-006, US2.7 | example | DONE | `tests/finish_test.ts::U192 with vision not configured, the photo ends not_captioned with the reason, the object is kept, and there is no derived thought` |
| U193 | With the vision call failing, the photo ends `not_captioned` with the vision error's reason, and the object is kept | FR-006, US2.7 | example | DONE | `tests/finish_test.ts::U193 with the vision call failing, the photo ends not_captioned with the vision error's reason, and the object is kept` |
| U194 | A `not_captioned` photo finished again with vision working ends `processed` with one caption | FR-027, SC-015 | example | DONE | `tests/finish_test.ts::U194 a not_captioned photo finished again with vision working ends processed with one caption` |
| U195 | `rebuild: true` on a `processed` photo gives exactly one caption, by the newly configured model, and updates `caption_model` | FR-027, SC-015 | example | DONE | `tests/finish_test.ts::U195 rebuild on a processed photo gives exactly one caption by the newly configured model and updates caption_model` |
| U196 | `rebuild: true` on a `processed` PDF replaces the passage set, and `derived_count` equals the new count | FR-027 | example | DONE | `tests/finish_test.ts::U196 rebuild on a processed PDF replaces the passage set, and derived_count equals the new count` |
| U197 | A failed rebuild keeps the old set and `processed`, and the outcome and row carry `last_rebuild_error` with the reason | FR-027, SC-018 | example | DONE | `tests/finish_test.ts::U197 a failed rebuild keeps the old set and processed, and the outcome and row carry last_rebuild_error with the reason` |
| U326 | A successful rebuild after a failed one clears `last_rebuild_error` in the row and reports none in the outcome | FR-027, edge case "a successful rebuild clears the previous last rebuild failed note" | example | DONE | `tests/finish_test.ts::U326 a successful rebuild after a failed one clears last_rebuild_error in the row and reports none in the outcome` |
| U198 | When `checkActual` refuses, the object is deleted, the row is `refused` with the actual values, and no derived thought is written | FR-004, SC-013 | example | DONE | `tests/finish_test.ts::U198 when checkActual refuses, the object is deleted, the row is refused with the actual values, and no derived thought is written` |
| U199 | An object created after `upload_deadline` is refused and deleted | FR-004, FR-001 | example | DONE | `tests/finish_test.ts::U199 an object created after upload_deadline is refused and deleted` |
| U200 | An object created exactly at `upload_deadline` is not refused for its timing | FR-004, FR-001 | example | DONE | `tests/finish_test.ts::U200 an object created exactly at upload_deadline is not refused for its timing` |
| U201 | Finishing a `refused` attachment is refused, and nothing changes | FR-004 | example | DONE | `tests/finish_test.ts::U201 finishing a refused attachment is refused, and nothing changes` |
| U202 | With no object before the deadline, the outcome is "no file uploaded yet", and the state is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | DONE | `tests/finish_test.ts::U202 with no object before the deadline, the outcome is 'no file uploaded yet' and the state is unchanged` |
| U203 | With no object after the deadline, the outcome is "upload window expired", and the state is unchanged | FR-001, edge case "upload link expires before the client uploads" | example | DONE | `tests/finish_test.ts::U203 with no object after the deadline, the outcome is 'upload window expired' and the state is unchanged` |
| U204 | After a refused or no-file outcome, a new claim succeeds at once | FR-026 | example | DONE | `tests/finish_test.ts::U204 after a refused or no-file outcome, a new claim succeeds at once` |
| U205 | A text-less PDF ends `scanned` with the reason and "text search won't cover it yet", no passages, and the object kept | FR-010, US4.2 | example | DONE | `tests/finish_test.ts::U205 a text-less PDF ends scanned with the reason and 'text search won't cover it yet', no passages, and the object kept` |
| U206 | A `scanned` PDF finished again after `SCANNED_MIN_CHARS_PER_PAGE` is lowered below its text ends `processed` | FR-027 | example | DONE | `tests/finish_test.ts::U206 a scanned PDF finished again after SCANNED_MIN_CHARS_PER_PAGE is lowered below its text ends processed` |
| U207 | A `scanned` PDF finished again with unchanged settings stays `scanned`, with no passages | FR-027, FR-010 | example | DONE | `tests/finish_test.ts::U207 a scanned PDF finished again with unchanged settings stays scanned, with no passages` |
| U208 | A corrupt PDF ends `failed` with the reason, the object kept, and no passages | FR-011, edge case "encrypted or corrupt" | example | DONE | `tests/finish_test.ts::U208 a corrupt PDF ends failed with the reason, the object kept, and no passages` |
| U209 | An embedding failure partway ends `failed` with the reason, and no derived thought from the attempt remains | FR-011, US4.3 | example | DONE | `tests/finish_test.ts::U209 an embedding failure partway ends failed with the reason, and no derived thought from the attempt remains` |
| U210 | A vector length different from `embeddingDimension()` ends `failed` naming both lengths, with no derived thought | FR-007, edge case "vectors of a different length" | example | DONE | `tests/finish_test.ts::U210 a vector length different from embeddingDimension() ends failed naming both lengths, with no derived thought` |
| U211 | A `failed` attachment finished again with the services working ends `processed` | FR-011, FR-027 | example | DONE | `tests/finish_test.ts::U211 a failed attachment finished again with the services working ends processed` |
| U327 | When `writeDerived` reports a fingerprint conflict with an existing thought (one whose text equals a whole derived content, source line included), the finish ends `failed` with a reason naming the conflict, writes no derived thought and leaves that thought unchanged | FR-022, FR-011, edge case "existing thought's text equals a derived thought's entire text" | example | DONE | `tests/finish_test.ts::U327 a fingerprint conflict with an existing thought ends failed naming the conflict, writes no derived thought and leaves that thought unchanged` |
| U212 | A finish while another finish, rebuild or remove holds an unexpired claim returns busy naming that operation, and changes nothing | FR-026, SC-014 | example | DONE | `tests/finish_test.ts::U212 a finish while another finish, rebuild or remove holds an unexpired claim returns busy naming that operation, and changes nothing` |
| U213 | One second before `BUSY_SECONDS` has passed, the finish is still busy | FR-026 | example | DONE | `tests/finish_test.ts::U213 one second before BUSY_SECONDS has passed, the finish is still busy` |
| U214 | Once `BUSY_SECONDS` has passed by the clock, the next finish proceeds and completes | FR-026, SC-019 | example | DONE | `tests/finish_test.ts::U214 once BUSY_SECONDS has passed by the clock, the next finish proceeds and completes` |
| U215 | After a killed rebuild (its claim never released) has expired, the attachment is `processed` with its old derived set | FR-026, FR-027 | example | DONE | `tests/finish_test.ts::U215 after a killed rebuild has expired, the attachment is processed with its old derived set` |
| U216 | A finish whose claim expired and was taken over has its write refused, and the newer run's result stands | FR-026 | example | DONE | `tests/finish_test.ts::U216 a finish whose claim expired and was taken over has its write refused, and the newer run's result stands` |

### Stream T: tools (wave 2, `ta-tools`)

#### `src/tools.ts` (T027, T028, T029, T030, T041, T049, T050, T063, T064)

Test file: `tests/tools_test.ts` (`inMemoryClient`; `services.finish` scripted).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U217 | `tools/list` returns exactly the seven tool names | INV-1 | example | DONE | `tests/tools_test.ts::U217 tools/list returns exactly the seven tool names` |
| U218 | Each tool's `readOnlyHint`, `destructiveHint` and `openWorldHint` match the contract | INV-1 | example | DONE | `tests/tools_test.ts::U218 each tool's readOnlyHint, destructiveHint and openWorldHint match the contract` |
| U219 | Each tool's input schema and defaults match the contract (`find_thought` `mode` `meaning` and `limit` 5; `remove_attachment` `confirm` false; `finish_attachment` optional `rebuild`; `attach_file`'s fields) | INV-1 | example | DONE | `tests/tools_test.ts::U219 each tool's input schema and defaults match the contract` |
| U220 | `find_thought` in `meaning` mode (the default) embeds the query and returns `matchThoughts`' matches | FR-023 | example | DONE | `tests/tools_test.ts::U220 find_thought in meaning mode embeds the query and returns matchThoughts' matches` |
| U221 | `find_thought` in `exact` mode returns `findThoughtsExact`'s matches, with no embedding request | FR-023 | example | DONE | `tests/tools_test.ts::U221 find_thought in exact mode returns findThoughtsExact's matches, with no embedding request` |
| U222 | `find_thought` with no `limit` asks for 5 matches | FR-023 | example | DONE | `tests/tools_test.ts::U222 find_thought with no limit asks for 5 matches` |
| U223 | `find_thought` with `limit` 20 asks for 20 | FR-023 | example | DONE | `tests/tools_test.ts::U223 find_thought with limit 20 asks for 20 matches` |
| U224 | A 120-character first line is returned whole | FR-023 | example | DONE | `tests/tools_test.ts::U224 find_thought returns a 120-character first line whole` |
| U225 | A 121-character first line is cut to 120 characters | FR-023 | example | DONE | `tests/tools_test.ts::U225 find_thought cuts a 121-character first line to 120 characters` |
| U226 | `first_line` is the content up to its first line break | FR-023 | example | DONE | `tests/tools_test.ts::U226 find_thought's first_line is the content up to its first line break` |
| U227 | Each match has `id`, `first_line` and `captured` | FR-023, SC-009 | example | DONE | `tests/tools_test.ts::U227 each find_thought match has id, first_line and captured` |
| U228 | No match gives "no matching thought" | FR-023 | example | DONE | `tests/tools_test.ts::U228 find_thought with no match says no matching thought` |
| U328 | `find_thought` with `limit` 21 asks for 20 (a larger value is reduced to 20) | FR-023, edge case "a lookup asking for more than 20 matches gets 20" | example | DONE | `tests/tools_test.ts::U328 find_thought with limit 21 asks for 20 matches` |
| U229 | `attach_file` with an unknown `thought_id` is refused, with no row, link or note | FR-001, FR-016 | example | DONE | `tests/tools_test.ts::U229 attach_file with an unknown thought_id is refused, with no row, link or note` |
| U230 | `attach_file` with both `thought_id` and `note` is refused, and nothing is created | FR-001 | example | DONE | `tests/tools_test.ts::U230 attach_file with both thought_id and note is refused, and nothing is created` |
| U231 | `attach_file` with neither is refused, and nothing is created | FR-001 | example | DONE | `tests/tools_test.ts::U231 attach_file with neither thought_id nor note is refused, and nothing is created` |
| U232 | A `checkDeclared` refusal returns its message, with no row and no link | FR-003 | example | DONE | `tests/tools_test.ts::U232 a checkDeclared refusal returns its message, with no row and no link` |
| U233 | The same name, type and size already pending on the parent, with its upload deadline not yet passed, returns that attachment, with no new row | FR-012, US1.3 | example | DONE | `tests/tools_test.ts::U233 the same name, type and size pending on the parent returns that attachment, with no new row` |
| U234 | The same name and type with a different size on the parent creates a new attachment | FR-012 | example | DONE | `tests/tools_test.ts::U234 the same name and type with a different size on the parent creates a new attachment` |
| U235 | A successful start writes a row with the parent, the base name, the declared type and size, tier `personal` by default, `storage_path` `attachments/<id>/<name>` and state `pending_upload` | FR-001 | example | DONE | `tests/tools_test.ts::U235 a successful start writes a row with the parent, base name, declared type and size, tier personal, storage_path and state pending_upload` |
| U236 | `upload_deadline` is the injected now plus `UPLOAD_LINK_MINUTES` | FR-001 | example | DONE | `tests/tools_test.ts::U236 upload_deadline is the injected now plus UPLOAD_LINK_MINUTES` |
| U237 | The stored `page_token_hash` is the SHA-256 of the token in `page_link`, and the raw token appears nowhere in the row | FR-002, FR-009 | example | DONE | `tests/tools_test.ts::U237 the stored page_token_hash is the SHA-256 of the token in page_link, and the raw token is in no row` |
| U238 | The result has `attachment_id`, its short id, `parent_thought_id`, whether the parent was created now, `upload_deadline`, `upload` (`url`, `method: "PUT"`, `headers`), the `curl` line, `page_link` and `limits` | FR-001, FR-002 | example | DONE | `tests/tools_test.ts::U238 the attach_file result has the ids, deadline, upload, curl line, page link and limits` |
| U239 | `upload.url` is the signed link passed through `publicUrl` | FR-002 | example | DONE | `tests/tools_test.ts::U239 upload.url is the signed link passed through publicUrl` |
| U240 | A given `sensitivity_tier` of `restricted` is stored on the row | FR-008 | example | DONE | `tests/tools_test.ts::U240 a given sensitivity_tier of restricted is stored on the row` |
| U329 | The same name, type and size pending on the parent but past its upload deadline doesn't count: a new attachment is created | FR-012, FR-021, edge case "pending upload past its deadline no longer counts as pending" | example | DONE | `tests/tools_test.ts::U329 the same file pending on the parent but past its upload deadline creates a new attachment` |
| U330 | `attach_file` with only some of `file_name`, `declared_type` and `declared_size` (name only; name and type; size only) is refused with "give all three, or none for a phone upload", and nothing is created | FR-001, edge case "starting an attachment with only some of the file name, type and size is refused" | example | DONE | `tests/tools_test.ts::U330 attach_file with only some of file_name, declared_type and declared_size is refused, and nothing is created` |
| U241 | `finish_attachment` passes the id and `rebuild` to `services.finish` and returns the result text with the structured `state`, `reason`, `derived_count`, `caption` and `page_count` | FR-027, FR-005 | example | DONE | `tests/tools_test.ts::U241 finish_attachment passes the id and rebuild to services.finish and returns the structured outcome` |
| U242 | A busy outcome gives "busy (…), try again shortly" naming the running operation as finishing, rebuilding or removing | FR-026 | example | DONE | `tests/tools_test.ts::U242 a busy outcome says busy, naming the running operation as finishing, rebuilding or removing` |
| U243 | Every tool that takes `attachment_id` accepts the short id, and reports "not found" and "ambiguous" errors | FR-025, FR-014 | example | DONE | `tests/tools_test.ts::U243 every tool taking attachment_id accepts the short id and reports not found and ambiguous` |
| U244 | `attach_file` with `note` embeds the text and saves it through `insertNote` as the parent, with `parent_created_here` true when it was created | FR-001, SC-010 | example | DONE | `tests/tools_test.ts::U244 attach_file with note embeds the text and saves it through insertNote as the parent, created here` |
| U245 | `note` text that matches an existing thought makes that thought the parent with `parent_created_here` false, and the result says "attached to your existing thought" | FR-001, FR-016 | example | DONE | `tests/tools_test.ts::U245 note text matching an existing thought makes it the parent, not created here, and says attached to your existing thought` |
| U246 | `note` with a HEIC declaration saves no note and makes no embedding request | FR-003, SC-020 | example | DONE | `tests/tools_test.ts::U246 note with a HEIC declaration saves no note and makes no embedding request` |
| U247 | `note` with an over-cap declaration saves no note | FR-003 | example | DONE | `tests/tools_test.ts::U247 note with an over-cap declaration saves no note` |
| U248 | A phone-upload start without file details writes a row with no declaration, carrying `expected_kind` when given | FR-001 | example | DONE | `tests/tools_test.ts::U248 a phone-upload start without file details writes a row with no declaration, carrying expected_kind` |
| U249 | An `expected_kind` other than `photo` or `pdf` is refused | FR-001 | example | DONE | `tests/tools_test.ts::U249 an expected_kind other than photo or pdf is refused` |
| U250 | `get_attachment` returns file name, type, size, page count, state, reason, `derived_count`, `caption_model` and parent id | FR-014 | example | DONE | `tests/tools_test.ts::U250 get_attachment returns file name, type, size, page count, state, reason, derived_count, caption_model and parent id` |
| U251 | For a stored file (`processed`, `scanned`, `not_captioned` or `failed`), `get_attachment` returns a `download_link` through `publicUrl`, signed for `DOWNLOAD_LINK_SECONDS`, with that lifetime stated | FR-014, SC-003 | example | DONE | `tests/tools_test.ts::U251 get_attachment gives a stored file a download link through publicUrl, signed for DOWNLOAD_LINK_SECONDS, with the lifetime stated` |
| U252 | `get_attachment` on `pending_upload` returns no `download_link` | FR-014, SC-003 | example | DONE | `tests/tools_test.ts::U252 get_attachment on pending_upload returns no download_link` |
| U253 | `get_attachment` on `refused` returns no `download_link` | FR-014, SC-003 | example | DONE | `tests/tools_test.ts::U253 get_attachment on refused returns no download_link` |
| U331 | `get_attachment` on an attachment whose `finish` claim is one second past `busy_until`, never released, reports state `failed` with the reason "the run did not finish" | FR-026, edge case "finish whose busy mark expired before it reported back" | example | DONE | `tests/tools_test.ts::U331 get_attachment on a finish claim one second past busy_until, never released, reports failed: the run did not finish` |
| U332 | One second before that `busy_until`, `get_attachment` reports the stored state | FR-026 | example | DONE | `tests/tools_test.ts::U332 one second before busy_until get_attachment reports the stored state` |
| U333 | An attachment whose `rebuild` claim expired unreleased reports `processed` (a cut-off rebuild keeps its old derived thoughts) | FR-026, FR-027 | example | DONE | `tests/tools_test.ts::U333 a rebuild claim that expired unreleased reads processed, keeping its derived thoughts, with the cut-off noted` |
| U254 | `list_attachments` with `thought_id` returns each attachment's id, short id, file name, type, size, state and `derived_count` | FR-015, US3.2 | example | DONE | `tests/tools_test.ts::U254 list_attachments with thought_id returns each attachment's id, short id, file name, type, size, state and derived_count` |
| U255 | `list_attachments` with `derived_thought_id` returns the attachment that owns it | FR-015 | example | DONE | `tests/tools_test.ts::U255 list_attachments with derived_thought_id returns the attachment that owns it` |
| U256 | `list_attachments` with both or neither input is refused | FR-015 | example | DONE | `tests/tools_test.ts::U256 list_attachments with both or neither input is refused` |
| U257 | `list_attachments` with the id of a thought no attachment owns says not found | FR-015 | example | DONE | `tests/tools_test.ts::U257 list_attachments with the id of a thought no attachment owns says not found` |
| U334 | `list_attachments` reports an attachment whose `finish` claim expired unreleased as `failed` | FR-026, FR-015, edge case "finish whose busy mark expired before it reported back" | example | DONE | `tests/tools_test.ts::U334 list_attachments reports an attachment whose finish claim expired unreleased as failed` |
| U258 | `remove_attachment` without `confirm` deletes nothing and lists the file, the derived count and, when it would go, the parent note | FR-016, US5.2 | example | DONE | `tests/tools_test.ts::U258 remove_attachment without confirm deletes nothing and lists the file, the derived count and the parent note that would go` |
| U259 | `remove_attachment` with `confirm` deletes the stored file, removes through the store and releases the claim, and the result names what went | FR-016, US5.1 | example | DONE | `tests/tools_test.ts::U259 remove_attachment with confirm claims, deletes the stored file, removes through the store, releases, and names what went` |
| U260 | `remove_attachment` while busy is refused with the busy message and deletes nothing | FR-026, SC-014 | example | DONE | `tests/tools_test.ts::U260 remove_attachment while busy is refused with the busy message and deletes nothing` |
| U335 | When the store's removal fails after the stored file was deleted, `remove_attachment` reports the failure, and the attachment is still listed by `list_attachments` | FR-016, edge case "removal deletes the stored file first and then the records" | example | DONE | `tests/tools_test.ts::U335 when the store's removal fails after the file was deleted, remove_attachment reports it and the attachment is still listed` |
| U336 | A confirmed removal whose stored file is already missing succeeds: the rows go, and the result treats the file as removed | FR-016, edge case "removal deletes the stored file first and then the records" | example | DONE | `tests/tools_test.ts::U336 a confirmed removal whose stored file is already missing succeeds, and a repeat after a failed removal succeeds` |
| U261 | `find_orphan_attachments` lists each orphan's id, file name, why it is listed and `derived_count` | FR-021, US5.3 | example | DONE | `tests/tools_test.ts::U261 find_orphan_attachments lists each orphan's id, file name, why it is listed and derived_count` |
| U353 | `get_attachment` on an attachment whose finish was cut off (claim expired unreleased) reports `failed` "the run did not finish" and, because its file is stored, includes a download link | FR-026, FR-014, data-model.md states | example | DONE | `tests/tools_test.ts::U353 a cut-off finish (read as failed, U331) still gets a download link for its stored file` |
| U354 | `remove_attachment` with confirm on an attachment whose earlier remove was cut off (claim expired unreleased) proceeds and removes it; the cut-off remove itself left the attachment as it was | FR-016, FR-026, data-model.md states | example | DONE | `tests/tools_test.ts::U354 a confirmed remove proceeds on an attachment whose earlier remove was cut off, which left it as it was` |
| U362 | `attach_file` passes an intake refusal's `code` through unchanged in its result | FR-003, tasks.md Seams (refusal codes) | example | DONE | `tests/tools_test.ts::U362 attach_file passes the refusal code through` |

### Stream P: phone page (wave 2, `ta-page`)

#### `src/page_routes.ts` (T042, T043)

Test file: `tests/page_routes_test.ts` (`services.finish` scripted).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U262 | `/page/start` with a valid, unused token and no declaration records the picked base name, type and exact size, and returns a signed upload link through `publicUrl` | FR-001, FR-002 | example | DONE | `tests/page_routes_test.ts::U262 /page/start with a valid token and no declaration records the base name, type and size and returns a signed link through publicUrl` |
| U263 | `/page/start` whose pick matches the attach call's declaration confirms it and returns a link | FR-001 | example | DONE | `tests/page_routes_test.ts::U263 /page/start whose pick matches the attach call's declaration confirms it and returns a link` |
| U264 | `/page/start` whose pick doesn't match the attach call's declaration is refused, with no link (literal reading of "confirms they match") | FR-001, FR-004 | example | DONE | `tests/page_routes_test.ts::U264 /page/start whose pick doesn't match the attach call's declaration is refused, with no link` |
| U265 | A picked HEIC file is refused with the "share it as JPEG" message, with no link | FR-003, US2.3 | example | DONE | `tests/page_routes_test.ts::U265 a picked HEIC file is refused with the share-as-JPEG message, with no link` |
| U266 | A picked type outside the four is refused with `attach_file`'s message, with no link | FR-003 | example | DONE | `tests/page_routes_test.ts::U266 a picked type outside the four is refused with attach_file's message, with no link` |
| U267 | A pick whose kind differs from `expected_kind` (a PDF when `photo` is expected, or the reverse) is refused | FR-001 | example | DONE | `tests/page_routes_test.ts::U267 a pick whose kind differs from expected_kind is refused, a PDF for a photo and the reverse` |
| U268 | A picked size over its cap is refused, naming the cap and the size | FR-003 | example | DONE | `tests/page_routes_test.ts::U268 a picked size over its cap is refused, naming the cap and the size` |
| U269 | A second `/page/start` replaces the declaration and returns a new link | FR-002 | example | DONE | `tests/page_routes_test.ts::U269 a second /page/start replaces the declaration and returns a new link` |
| U270 | An unknown token gets `410` with "This link has expired or was already used. Ask your assistant for a new one" | FR-002 | example | DONE | `tests/page_routes_test.ts::U270 an unknown token gets 410 with the expired message` |
| U271 | A used token gets `410` with the same message | FR-002, edge case "upload page opened twice" | example | DONE | `tests/page_routes_test.ts::U271 a used token gets 410 with the same message` |
| U272 | A token one second after `upload_deadline` gets `410` | FR-001, SC-017 | example | DONE | `tests/page_routes_test.ts::U272 a token one second after upload_deadline gets 410` |
| U273 | A token one second before `upload_deadline` is accepted | FR-001, SC-017 | example | DONE | `tests/page_routes_test.ts::U273 a token one second before upload_deadline is accepted` |
| U274 | The page routes need no brain key, and a request carrying the brain key without a valid token gets `410` | FR-002, FR-018 | example | DONE | `tests/page_routes_test.ts::U274 the page routes need no brain key, and a brain key without a valid token gets 410` |
| U275 | CORS allows the origin of `UPLOAD_PAGE_URL`, and gives no allow-origin to any other origin | FR-002 | example | DONE | `tests/page_routes_test.ts::U275 CORS allows the origin of UPLOAD_PAGE_URL and gives no allow-origin to any other origin` |
| U276 | CORS allows the same origin when the page is served by the function | FR-002 | example | DONE | `tests/page_routes_test.ts::U276 CORS allows the same origin when the page is served by the function` |
| U337 | `/page/info` with a valid, unused, unexpired token returns the expected kind the attach call named, the four accepted types and the size caps, and changes no row or object | FR-002, edge case "before a file is picked, the upload page shows the expected kind" | example | DONE | `tests/page_routes_test.ts::U337 /page/info returns the expected kind, the four accepted types and the caps, and changes nothing` |
| U338 | `/page/info` for an attachment started with no expected kind returns no expected kind, with the accepted types and the caps | FR-002 | example | DONE | `tests/page_routes_test.ts::U338 /page/info for an attachment started with no expected kind returns no expected kind` |
| U339 | `/page/info` with an unknown, used or expired token gets `410` with the expired message | FR-002 | example | DONE | `tests/page_routes_test.ts::U339 /page/info with an unknown, used or expired token gets 410 with the expired message` |
| U277 | `/page/finish` with a valid token finishes only its own attachment through `services.finish`, returns the outcome as JSON, and uses the token up once finishing reaches an outcome (here `processed`) | FR-024, SC-011 | example | DONE | `tests/page_routes_test.ts::U277 /page/finish finishes only its own attachment, returns the outcome as JSON and uses the token up` |
| U278 | A second `/page/finish` with the same token, after a `processed` outcome, gets `410` | FR-024 | example | DONE | `tests/page_routes_test.ts::U278 a second /page/finish with the same token, after processed, gets 410` |
| U279 | A token for attachment X never finishes attachment Y: `services.finish` is never called with Y, and Y is unchanged | FR-024, SC-011 | example | DONE | `tests/page_routes_test.ts::U279 a token for attachment X never finishes attachment Y` |
| U280 | A `/page/finish` refused as busy returns the busy outcome and leaves the token valid: a later `/page/finish` with it, once the claim is gone, finishes the attachment (T005 Q5) | FR-024, FR-026 | example | DONE | `tests/page_routes_test.ts::U280 a /page/finish refused as busy returns the busy outcome and leaves the token valid` |
| U340 | `/page/finish` whose outcome is "no file uploaded yet" returns it and leaves the token valid: `/page/start` and `/page/finish` still accept it (T005 Q5) | FR-024 | example | DONE | `tests/page_routes_test.ts::U340 a /page/finish with no file uploaded yet returns it and leaves the token valid` |
| U341 | `/page/finish` whose outcome is `refused` uses the token up, so a second call gets `410` (every finishing outcome counts, not only `processed`) (T005 Q5) | FR-024 | example | DONE | `tests/page_routes_test.ts::U341 a /page/finish whose outcome is refused uses the token up` |

#### `upload-page.html` (T044)

Test file: `tests/page_script_test.ts`, with `tests/helpers/page_dom.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U281 | The page reads its token only from the `#t=` fragment; a token in the query string is ignored | FR-002 | example | DONE | `tests/page_script_test.ts::U281 the page reads its token only from the #t= fragment; a token in the query string is ignored` |
| U282 | With its API-address line filled in, every request goes to that address, never to an address taken from the link (T005 Q6) | FR-002 | example | DONE | `tests/page_script_test.ts::U282 with its API-address line filled in, every request goes to that address, never to one taken from the link` |
| U283 | With its API-address line blank, every request goes to the address the page was served from: served at `…/functions/v1/thought-attachments/upload`, it calls `…/functions/v1/thought-attachments/page/start` (T005 Q6) | FR-002 | example | DONE | `tests/page_script_test.ts::U283 with its API-address line blank, every request goes to the address the page was served from` |
| U284 | The file input accepts exactly `image/jpeg,image/png,image/webp,application/pdf` and one file | FR-002 | example | DONE | `tests/page_script_test.ts::U284 the file input accepts exactly the four types and one file` |
| U285 | The page shows the accepted types | FR-002 | example | DONE | `tests/page_script_test.ts::U285 the page shows the accepted types` |
| U286 | A refusal from `/page/start` is shown, and no `PUT` happens | FR-003 | example | DONE | `tests/page_script_test.ts::U286 a refusal from /page/start is shown, and no PUT happens` |
| U287 | Upload progress is shown during the `PUT` | FR-002 | example | DONE | `tests/page_script_test.ts::U287 upload progress is shown during the PUT` |
| U288 | The page `PUT`s the one file to the returned link, then calls `/page/finish` | FR-024 | example | DONE | `tests/page_script_test.ts::U288 the page PUTs the one file to the returned link, then calls /page/finish` |
| U289 | Each outcome shows its text from contracts/upload-page.md "What the owner sees" ("Captioned: …" with the first 300 characters, "Saved N passages", "Scanned PDF: text search won't cover it yet", "Not captioned: <reason>", "Refused: <reason>", "Failed: <reason>") | FR-024, SC-011 | example | DONE | `tests/page_script_test.ts::U289 each outcome shows its text from the contract` |
| U290 | A `410` shows the expired message | FR-002, SC-017 | example | DONE | `tests/page_script_test.ts::U290 a 410 shows the expired message, from info, start and finish` |
| U291 | The file contains no key, no token and no project address other than its API-address setting | FR-002, FR-009 | example | DONE | `tests/page_script_test.ts::U291 the file contains no key, no token and no project address other than its API-address setting` |
| U292 | The file loads no external script or style | FR-002 | example | DONE | `tests/page_script_test.ts::U292 the file loads no external script or style` |
| U342 | Before any pick, the page sends `{ token }` to `/page/info` and shows the expected kind (when one is returned) and the size limit it returns | FR-002, edge case "before a file is picked, the upload page shows the expected kind" | example | DONE | `tests/page_script_test.ts::U342 before any pick, the page sends { token } to /page/info and shows the expected kind and the size limit` |
| U343 | When `/page/finish` answers busy or "no file uploaded yet", the page shows "Waiting…" and calls `/page/finish` again 10 seconds later (injected timer) (T005 Q5) | FR-024 | example | DONE | `tests/page_script_test.ts::U343 when /page/finish answers busy or no file yet, the page shows Waiting… and calls it again 10 seconds later` |
| U344 | 9 seconds after such an answer, the page has not called `/page/finish` again | FR-024 | example | DONE | `tests/page_script_test.ts::U344 9 seconds after a busy answer, the page has not called /page/finish again` |
| U345 | When a retried `/page/finish` gets `410`, the page shows the expired message and stops retrying | FR-024, SC-017 | example | DONE | `tests/page_script_test.ts::U345 when a retried /page/finish gets 410, the page shows the expired message and stops retrying` |
| U346 | The repository's `upload-page.html` has its API-address line blank (T005 Q6) | FR-002 | example | DONE | `tests/page_script_test.ts::U346 the repository's upload-page.html has its API-address line blank` |
| U352 | `/page/info` returns exactly `{ expected_kind, accepted_types, caps: { image_bytes, pdf_bytes, pdf_pages } }`, with `image_bytes` equal to `MAX_IMAGE_MB` × 1,048,576 (example: 10 → 10485760) | FR-002, contracts/upload-page.md `/page/info` | example | DONE | `tests/page_routes_test.ts::U352 /page/info returns exactly expected_kind, accepted_types and caps, with image_bytes at MAX_IMAGE_MB times 1048576` |
| U363 | A failed upload or an unreachable server shows "Failed:" on the page and does not call finish | FR-002, FR-024, contracts/upload-page.md | example | DONE | `tests/page_script_test.ts::U363 a failed upload or an unreachable server shows Failed, and /page/finish is not called` |
| U365 | A second pick on a fresh instance (a new isolate) replaces a page-made declaration instead of refusing it | FR-002, contracts/upload-page.md (a second `/page/start` replaces) | example | DONE | `tests/page_routes_test.ts::U365 a second pick on a fresh instance (a new isolate) replaces a page-made declaration instead of refusing it` |
| U366 | The declaration `/page/start` sends to the store carries `declared_by_page: true` | FR-002, data-model.md `thought_attachments.declared_by_page` | example | DONE | `tests/page_routes_test.ts::U366 the declaration /page/start sends to the store carries declared_by_page: true, so the real store persists the flag` |

### Stream A: app and entry (wave 3, `ta-app`)

#### `src/app.ts` and `index.ts` (T031, T032, T045)

Test files: `tests/app_test.ts` (U293–U301, U305–U307, U347–U349) and `tests/imports_test.ts` (U302–U304).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U293 | The correct key in `x-brain-key` lets an MCP `initialize` succeed | FR-018 | example | DONE | `tests/app_test.ts::U293 the correct key in x-brain-key lets an MCP initialize succeed` |
| U294 | The correct key as `?key=` lets an MCP `initialize` succeed | FR-018 | example | DONE | `tests/app_test.ts::U294 the correct key as ?key= lets an MCP initialize succeed` |
| U295 | A wrong key gets an authorization error, and the store is never called | FR-018 | example | DONE | `tests/app_test.ts::U295 a wrong key gets an authorization error, and the store is never called` |
| U296 | A missing key gets an authorization error | FR-018 | example | DONE | `tests/app_test.ts::U296 a missing key gets an authorization error` |
| U297 | With an empty configured key, every MCP request is refused | FR-018 | example | DONE | `tests/app_test.ts::U297 with an empty configured key, every MCP request is refused` |
| U298 | An `OPTIONS` preflight gets the CORS headers that `W/server/index.ts` sends | INV-4 | example | DONE | `tests/app_test.ts::U298 an OPTIONS preflight gets the CORS headers the core server sends, with no key` |
| U299 | An MCP request is handled with the same `Accept` treatment as `W/server/index.ts` | INV-4 | example | DONE | `tests/app_test.ts::U299 an MCP request with no event-stream Accept header is handled, as the core server patches it` |
| U300 | `productionDeps()` with settings that aren't `ok` returns `{ ok: false, problems }` naming the problem settings and no values, without throwing (T005 Q3) | FR-017, FR-009 | example | DONE | `tests/app_test.ts::U300 productionDeps with settings that are not ok returns ok false, naming the settings and no values, without throwing` |
| U301 | `productionDeps`' store sends its requests to `SUPABASE_URL` with the service-role key (stubbed `globalThis.fetch`) | FR-019 | example | DONE | `tests/app_test.ts::U301 productionDeps' store sends its requests to SUPABASE_URL with the service-role key` |
| U302 | `index.ts` is the one-line entry `Deno.serve(createApp(productionDeps()).fetch)` | FR-019 | example | DONE | `tests/imports_test.ts::U302 index.ts is the one-line entry` |
| U303 | No `.ts` file outside `tests/` has a bare import specifier | FR-019 | example | DONE | `tests/imports_test.ts::U303 no .ts file outside tests/ has a bare import specifier` |
| U304 | No `.ts` file outside `tests/` imports `pdf-lib` | INV-5 | example | DONE | `tests/imports_test.ts::U304 no .ts file outside tests/ imports pdf-lib` |
| U305 | `GET /upload` returns 200 with `text/html`, with no brain key | FR-002 | example | DONE | `tests/app_test.ts::U305 GET /upload returns 200 with text/html, with no brain key` |
| U306 | The `GET /upload` body is `upload-page.html` byte for byte, with its API-address line still blank (T005 Q6) | FR-002 | example | DONE | `tests/app_test.ts::U306 the GET /upload body is upload-page.html byte for byte, its API-address line still blank, with or without /functions/v1` |
| U307 | `/page/start` through `createApp` with no brain key is not refused by the key check | FR-002 | example | DONE | `tests/app_test.ts::U307 /page/start through createApp with no brain key is not refused by the key check` |
| U347 | `createApp({ ok: false, problems })` answers an MCP `tools/call` (sent with the correct key) with the named settings error, for example "setting MAX_PDF_PAGES is invalid: must be a positive whole number", and does nothing else (T005 Q3) | FR-017 | example | DONE | `tests/app_test.ts::U347 createApp with settings not ok answers an MCP tools/call with the named settings error and nothing else` |
| U348 | That error names the setting and what it must be, never the value given (`MAX_PDF_PAGES=abc` gives no `abc`) | FR-009, FR-017 | example | DONE | `tests/app_test.ts::U348 the settings error names the setting and what it must be, never the value given` |
| U349 | `createApp({ ok: false, problems })` answers `/page/info`, `/page/start` and `/page/finish` with the same named error, with no brain key needed, and does nothing else (T005 Q3) | FR-017, FR-002 | example | DONE | `tests/app_test.ts::U349 createApp with settings not ok answers /page/info, /page/start and /page/finish with the named error, no brain key needed` |
| U351 | With `MCP_ACCESS_KEY` set, a call with a missing or wrong key gets an authorization error; with `MCP_ACCESS_KEY` unset, `productionDeps()` gives `ok: false` and every call, even one with no key, gets the named settings error instead | FR-018, FR-017, contracts/settings.md `MCP_ACCESS_KEY` | example | DONE | `tests/app_test.ts::U351 with MCP_ACCESS_KEY unset, productionDeps is not ok and every call, even with no key, gets the named settings error` |

### Audit remediation and live findings (integrator, after T081)

| id | behavior | traces | kind | state | test |
|----|----------|--------|------|-------|------|
| U368 | a /page/finish busy behind a live finish claim on a not_captioned or failed attachment leaves the token valid | FR-002, FR-024 | example | DONE | `tests/page_routes_test.ts::U368 a /page/finish busy behind a live finish claim on a not_captioned or failed attachment leaves the token valid` |
| U369 | a token at exactly upload_deadline gets 410 | FR-002, FR-024 | example | DONE | `tests/page_routes_test.ts::U369 a token at exactly upload_deadline gets 410` |
| U370 | orphans lists a pending_upload row at exactly its upload_deadline (the deadline instant is past it) (SQL block) | FR-021 | example | DONE | `tests/verify.sql::U370 orphans lists a pending_upload row at exactly its upload_deadline (the deadline instant is past it) (SQL block)` |
| U371 | with no object at exactly the deadline, the outcome is 'upload window expired' and the state is unchanged | FR-002, FR-024 | example | DONE | `tests/finish_test.ts::U371 with no object at exactly the deadline, the outcome is 'upload window expired' and the state is unchanged` |
| U372 | attachmentForPageToken maps the RPC reply to the row, or null when it is empty | FR-002, FR-024 | example | DONE | `tests/store_test.ts::U372 attachmentForPageToken maps the RPC reply to the row, or null when it is empty` |
| U373 | consumePageToken maps the RPC reply to a boolean | FR-002, FR-024 | example | DONE | `tests/store_test.ts::U373 consumePageToken maps the RPC reply to a boolean` |
| U374 | an MCP reply and a refused MCP request carry the CORS headers the core server sends | INV-4 | example | DONE | `tests/app_test.ts::U374 an MCP reply and a refused MCP request carry the CORS headers the core server sends` |
| U375 | the drift checker flags an unknown parameter and an undefined function | INV-3 | example | DONE | `tests/schema_drift_test.ts::U375 the drift checker flags an unknown parameter and an undefined function` |
| U376 | the guard-rail scan flags DROP, TRUNCATE and an unqualified DELETE, and ignores comments | INV-2, FR-016 | example | DONE | `tests/schema_drift_test.ts::U376 the guard-rail scan flags DROP, TRUNCATE and an unqualified DELETE, and ignores comments` |
| U377 | deleteObject on a missing object succeeds: Storage answers 200 with an empty list | FR-016 | example | DONE | `tests/store_test.ts::U377 deleteObject on a missing object succeeds: Storage answers 200 with an empty list` |
| U378 | an HTTP error keeps the status and the provider's error.message, never other body fields such as an account id | FR-009, T101 | example | DONE | `tests/vision_test.ts::U378 an HTTP error keeps the status and the provider's error.message, never other body fields such as an account id` |
| U379 | an HTTP error keeps the status and the provider's error.message, never other body fields such as an account id | FR-009, T101 | example | DONE | `tests/embeddings_test.ts::U379 an HTTP error keeps the status and the provider's error.message, never other body fields such as an account id` |
| U380 | a non-JSON HTTP error body keeps its text in the reason | FR-009, T104 | example | DONE | `tests/vision_test.ts::U380 a non-JSON HTTP error body keeps its text in the reason` |
| U381 | an HTTP error body longer than 300 characters is cut to its first 300 | FR-009, T104 | example | DONE | `tests/vision_test.ts::U381 an HTTP error body longer than 300 characters is cut to its first 300` |
| U382 | a JSON error body whose error.message is not a string gives { error } with the body text, without throwing | FR-009, T104 | example | DONE | `tests/vision_test.ts::U382 a JSON error body whose error.message is not a string gives { error } with the body text, without throwing` |
| U383 | a non-JSON HTTP error body keeps its text in the reason | FR-009, T104 | example | DONE | `tests/embeddings_test.ts::U383 a non-JSON HTTP error body keeps its text in the reason` |
| U384 | an HTTP error body longer than 300 characters is cut to its first 300 | FR-009, T104 | example | DONE | `tests/embeddings_test.ts::U384 an HTTP error body longer than 300 characters is cut to its first 300` |
| U385 | a JSON error body whose error.message is not a string gives { error } with the body text, without throwing | FR-009, T104 | example | DONE | `tests/embeddings_test.ts::U385 a JSON error body whose error.message is not a string gives { error } with the body text, without throwing` |

## Invariants and edge cases still to place

None of the twelve items listed here at efe0f28 is left. They were settled as spec Edge Cases (commit bfd1430; the `/page/finish`-before-upload item by T005 Q5) and placed at the 54fcf51 refresh:

- **Bytes in an MB** (1 MB = 1,048,576 bytes): U118–U121 (reworded), U320, A63.
- **The page's header before a pick** (`POST /page/info`, token only): U337–U339, U342, A60.
- **A single-page source line** (`page 12`): U321.
- **`find_thought` `limit` above 20** (reduced to 20): U328.
- **Exact-text matching** (ignores letter case): U314; U67 reworded.
- **An expired `pending_upload`** (no longer counts as pending): U311, U312, U318, U319, U329, A57; U233 reworded.
- **A cut-off finish** (reads as `failed`, "the run did not finish"): U331–U334, A55.
- **A successful rebuild after a failed one** (clears `last_rebuild_error`): U326, A58.
- **Removal partway** (file first, then records; a repeat succeeds): U335, U336, A56.
- **`/page/finish` before any upload** (token stays valid; the page retries every 10 s): U340, U343–U345, A61.
- **An owner thought equal to a full derived content** (the finish fails, naming the conflict): U327, A59.
- **Partial file details in `attach_file`** (refused): U330.

The four points that were still open after the 54fcf51 refresh were decided in the contracts (`data-model.md` states and provenance, contracts/settings.md `MCP_ACCESS_KEY`, contracts/upload-page.md `/page/info`) and placed by the integrator as U350 (single-page locator), U351 (settings error versus key check), U352 (`/page/info` shape, caps in bytes) and U353–U354 (cut-off finish and remove by kind; a stored `failed` file keeps its download link).

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
