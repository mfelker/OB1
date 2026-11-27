# Data model: Thought attachments (spec 007)

Terms follow `.fork/domain-knowledge/CONTEXT.md` (attachment, parent thought, derived thought, source line). Everything here is additive (constitution Principle I). The core `thoughts` table gains only `content_fingerprint`, and only where it is missing (research R16).

## Table `thought_attachments`

One row per file.

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid, primary key | Generated. Its short form (the first 8 hex characters) appears in source lines and is accepted wherever an attachment id is (FR-025). |
| `parent_thought_id` | uuid, not null | Must exist in `thoughts` when the attachment starts (FR-001, FR-016). It has **no foreign key**: a parent deleted elsewhere leaves an orphan for FR-021 rather than cascading. |
| `parent_created_here` | boolean, not null, default false | True only when starting this attachment inserted the parent note. A note matching an existing thought leaves it false (Round 3, Q1; R17). |
| `file_name` | text | Base name only. Path parts and control characters are stripped (spec edge case, FR-009). Empty until declared. |
| `declared_type` | text | One of `application/pdf`, `image/jpeg`, `image/png`, `image/webp`. Set by the attach call (command upload) or by the page's declaration (phone upload); empty until then. |
| `declared_size` | bigint | Exact bytes. At most the cap for its type (FR-003). Set like `declared_type`. |
| `expected_kind` | text | `photo` or `pdf` when the AI named one for a phone upload; the page's declaration must agree. |
| `actual_type`, `actual_size`, `page_count` | text, bigint, int | Set at finishing from the stored file (FR-004). `page_count` is set for PDFs only. |
| `content_hash` | text | `sha256:<hex>` of the stored bytes. It is the `input_hash` of every derived thought (FR-008). |
| `storage_path` | text | `attachments/<id>/<file_name>` in the configured bucket (R12), set when the file is declared. Never a signed link (FR-009). |
| `sensitivity_tier` | text, not null, default `personal` | `standard`, `personal` or `restricted` (spec Assumptions). |
| `state` | text, not null | See the state machine below. |
| `state_reason` | text | Readable cause for `scanned`, `not_captioned`, `failed` and `refused`. |
| `last_rebuild_error` | text | Set when a rebuild fails; the state stays `processed` (Round 2, Q1). |
| `caption_model` | text | The vision model that wrote the current caption (FR-006). |
| `derived_count` | int, not null, default 0 | The number of derived thoughts this attachment owns. |
| `upload_deadline` | timestamptz, not null | When the attachment started, plus the upload link lifetime (default 60 minutes; R8). |
| `page_token_hash` | text | SHA-256 of the one-time page token, cleared once that token is used (FR-002, FR-024). |
| `busy_op`, `busy_until`, `busy_token` | text, timestamptz, text | The claim for FR-026. `busy_op` is `finish`, `rebuild` or `remove`. The writes in the claim's name succeed only with the matching unexpired `busy_token` (R10). |
| `created_at`, `updated_at`, `processed_at` | timestamptz | `updated_at` is maintained by a trigger. |

**Indexes**: `parent_thought_id`; `content_hash`; a unique `(parent_thought_id, content_hash)` index where `content_hash` is set and `state` is not `refused`. That unique index refuses the same file on the same parent twice (FR-012); a refused record never blocks a new try.

**Access**: RLS is enabled with no policies for `anon` or `authenticated`. `service_role` gets select, insert, update and delete, per `CONTRIBUTING.md`. The same applies to any table this feature adds.

## States

```text
pending_upload ──finish──▶ processed | scanned | not_captioned | failed | refused
failed ──finish──▶ (as above)            not_captioned ──finish──▶ processed | not_captioned | failed
scanned ──finish──▶ scanned | processed  processed ──finish (plain)──▶ processed (no change)
processed ──rebuild──▶ processed (new derived set, or old set kept and last_rebuild_error set)
any state ──remove (confirmed)──▶ deleted (row, file and derived thoughts gone)
pending_upload past upload_deadline ──▶ listed by the orphan check (state unchanged)
```

- `refused` is final; finishing it again is refused (FR-004).
- A busy claim past `busy_until` counts as failed. Its partial derived thoughts never exist, because writes happen in one transaction (R9), so the next operation proceeds (FR-026).

## Derived thought (rows in `thoughts`)

`content` is the source line, a line break, then the passage or caption. Examples:

```text
From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)
To clean the filter, twist the cylinder counter-clockwise …
```

```text
From shelf.jpg, photo (attachment 9f8e7d6c)
A grey metal garage shelf with three boxed furnace filters on the middle level …
```

`content_fingerprint` uses the same normalisation as the base `upsert_thought` (VP-004). `embedding` is the brain's model, at the brain's dimension (FR-007).

`metadata`:

| Key | Value |
|-----|-------|
| `source`, `source_type` | `local_document` |
| `source_label` | The file's base name |
| `importer_name`, `importer_version` | `thought-attachments`, the integration's version |
| `imported_at` | ISO 8601 UTC |
| `input_hash` | The attachment's `content_hash` |
| `content_fingerprint` | `sha256:` plus the thought's fingerprint |
| `sensitivity_tier` | The attachment's tier |
| `type` | `reference` (FR-028; ADR 0001) |
| `topics` | `["attachment", "<file base name>"]` |
| `provenance` | `{ method: "deterministic_conversion" \| "llm_extraction", source_locator: "pages 12–13" \| "photo", artifact: "<file base name>", extractor_model?: "<vision model>", review_status: "unreviewed" }` |
| `attachment_id`, `parent_thought_id` | Links back (FR-008, FR-015) |

Never stored: signed links, keys, tokens or absolute paths (FR-009, SC-007).

## Parent note created by attaching (rows in `thoughts`)

`content` is the note text. `metadata` is `{ type: "observation", source: "thought-attachments", source_type: "thought_attachments_note", imported_at }`. It is embedded with the brain's model (FR-001). It is removed only under the one exception in FR-016.

## Database functions (observable behaviour)

| Function | Does | Requirements |
|----------|------|--------------|
| Claim and release an attachment | Claims only if no unexpired claim exists and returns a claim token; returns the running operation when refused | FR-026, R10 |
| Write derived thoughts | Only with the caller's unexpired claim token: replaces the attachment's derived set and updates its state in one transaction; a fingerprint conflict raises an error, never merges | FR-011, FR-022, FR-027, R9, R10 |
| Remove an attachment | Deletes its derived thoughts and its row (and the parent note under the FR-016 exception), all scoped by the attachment's id, in one transaction | FR-016, SC-020 |
| Find a thought by exact text | Parameterised text match returning id, first line and date | FR-023, R11 |
| The brain's embedding dimension | Reads the dimension of `thoughts.embedding` | FR-007, R3 |
| Orphans | Attachments whose parent is gone, expired `pending_upload` rows, and `refused` rows | FR-021 |
