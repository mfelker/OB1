# Contract: MCP tools

Served at the integration's function URL over MCP's streamable HTTP. Every call needs the brain's `MCP_ACCESS_KEY` (as `x-brain-key` or `?key=`); a missing or wrong key gets an authorization error and changes nothing (FR-018). This contract states observable behaviour only. Results are text for the AI, plus the structured fields named below.

An attachment id may be given in full or as the 8-character short id shown in source lines (FR-025). An unknown or ambiguous id gets a "not found" or "ambiguous" error.

## `find_thought` (read-only)

- **Input**: `query` (text); `mode`: `meaning` (default) or `exact`; `limit` (default 5, at most 20).
- **Result**: the matches, each with `id`, `first_line` (up to 120 characters) and `captured` (a date). An empty result says "no matching thought".
- **Annotations**: `readOnlyHint: true`.
- **Covers**: FR-023, SC-009.

## `attach_file`

- **Input**: exactly one of `thought_id` or `note` (text); for a command upload, `file_name`, `declared_type` and `declared_size` (exact bytes); for a phone upload these may be omitted, with an optional `expected_kind` (`photo` or `pdf`), and the page declares the picked file instead (contracts/upload-page.md); optional `sensitivity_tier`.
- **Refusals**, before any note is saved or any link is made (FR-003), each changing nothing:
  - a type outside PDF, JPEG, PNG and WebP. HEIC names, or a HEIC declared type, get "share it as JPEG", with the steps to do that;
  - a size over the cap for its type, naming the cap and the declared size;
  - an unknown `thought_id`;
  - both or neither of `thought_id` and `note`;
  - the same file name, type and size already pending on that parent. The result points to it.
  - The type and size checks apply to the details given here; when they are omitted, the page's declaration is checked the same way before any upload.
- **Note text that already exists** as a thought makes that thought the parent; the result says "attached to your existing thought" (R17).
- **Result**:
  - `attachment_id` and its short id;
  - `parent_thought_id`, and whether the parent was created now;
  - `upload_deadline`;
  - `upload` = `{ url, method: "PUT", headers }` for a client that can run commands, plus a ready-to-run `curl` line;
  - `page_link` (the phone page, with the one-time token in the `#fragment`);
  - `limits` for the type.
  - Every link uses `PUBLIC_BASE_URL` (R6).
- **Annotations**: `readOnlyHint: false`, `destructiveHint: false`, `openWorldHint: true`. With `note`, it calls the embedding model.
- **Covers**: FR-001, FR-002, FR-003, FR-023, SC-010, SC-020.

## `finish_attachment`

- **Input**: `attachment_id`; optional `rebuild: true`.
- **Behaviour**, observable from the result:
  - **Busy**: if another finish, rebuild or remove holds an unexpired claim, it is refused at once with "busy (finishing / rebuilding / removing), try again shortly" and changes nothing (FR-026).
  - **No file**: if the upload is missing, it returns "no file uploaded yet" (or "upload window expired" after the deadline); the state is unchanged.
  - **Checks**: the stored file's real type and exact size equal the declaration (from the attach call or the page), its page count is within the cap, and its upload time is before the deadline (FR-004, R8). On failure the file is deleted, the state becomes `refused` with the actual values, and nothing else is written (FR-004, SC-013).
  - **PDF with text**: passages are written as derived thoughts with source lines, and the state becomes `processed`, with a passage count (FR-005, FR-025, FR-028).
  - **PDF without text**: the state becomes `scanned`, with no passages, and the result says text search won't cover it yet (FR-010).
  - **Photo**: the caption is written as a derived thought and the state becomes `processed`. If the vision model fails or isn't set, the state becomes `not_captioned` with the reason (FR-006, User Story 2 #7).
  - **Failure**: on an embedding failure or a dimension mismatch, no derived thoughts from the attempt remain, and the state becomes `failed` with the reason (FR-007, FR-011).
  - **Repeat**: a plain finish on `processed` returns the existing outcome unchanged (FR-012, SC-014), and one on `refused` is refused (FR-004).
  - **Rebuild**: `rebuild: true` on `processed` replaces the derived set only if the new set is complete; otherwise it keeps the old set and reports `last_rebuild_error` (FR-027, SC-015, SC-018).
- **Result**: `state`, `reason`, `derived_count`, `caption` (photos, the first 300 characters), `page_count`.
- **Annotations**: `readOnlyHint: false`, `destructiveHint: true` (rebuild replaces), `openWorldHint: true`.
- **Covers**: FR-004–FR-013, FR-022, FR-025–FR-028.

## `get_attachment` (read-only)

- **Input**: `attachment_id`.
- **Result**: file name, type, size, page count, state, reason, `derived_count`, `caption_model`, parent id, plus a `download_link` valid for `DOWNLOAD_LINK_SECONDS` (default 600) when the file is stored. There is no link for `pending_upload` or `refused`.
- **Annotations**: `readOnlyHint: true`.
- **Covers**: FR-014, SC-003, SC-012.

## `list_attachments` (read-only)

- **Input**: exactly one of `thought_id`, or `derived_thought_id` (the attachment behind a search result).
- **Result**: each attachment's id, short id, file name, type, size, state and `derived_count`.
- **Annotations**: `readOnlyHint: true`.
- **Covers**: FR-015, User Story 3 #2.

## `remove_attachment`

- **Input**: `attachment_id`; `confirm` (boolean, default false).
- **Without confirm**: deletes nothing and lists exactly what would go: the file, N derived thoughts and, under the FR-016 exception, the parent note (User Story 5 #2).
- **With confirm**: the file, the record and its derived thoughts are deleted, plus the parent note when the FR-016 exception applies. Other thoughts are untouched (FR-016, FR-022, SC-020). If busy, it is refused as in `finish_attachment`.
- **Annotations**: `readOnlyHint: false`, `destructiveHint: true`, `openWorldHint: false`.
- **Covers**: FR-016, User Story 5.

## `find_orphan_attachments` (read-only)

- **Result**: the attachments whose parent thought is gone, `pending_upload` rows past their deadline, and `refused` rows. Each has its id, file name, why it is listed, and `derived_count`.
- **Annotations**: `readOnlyHint: true`.
- **Covers**: FR-021, SC-013, SC-017.
