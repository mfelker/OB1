# Spec 007 live Cloud run (T076), in progress

The project is `ob1-selfhosted-llm-test` (Supabase Cloud, Free plan, us-east-2), with the owner present and consenting. The code is `contrib/mfelker/thought-attachments` at `ff4bfc1`, from a scratch checkout. Secrets were set by the owner; no values are recorded here.

| Step | Result | Verifies |
|------|--------|----------|
| `schema.sql` applied with `supabase db query --remote` | 27 columns, RLS on, 15 `attachment_*` functions, `ob1-files` private, one `idx_thoughts_fingerprint` (the R16 guarded step was a no-op) | FR-020, R12, R16 |
| Deploy `thought-attachments` with `--no-verify-jwt` | "Deployed Functions." | R13, T005 Q2 |
| Calls before the secrets were set | MCP: JSON-RPC `-32000` "setting MCP_ACCESS_KEY is invalid: must be set". `/page/info`: `400 settings_invalid`. Both were routed through the `/functions/v1/thought-attachments` prefix | T005 Q3, U351, T045 |
| `tools/list` with the key; with a wrong key | 7 tools; `-32001` | FR-018, A10 |
| `attach_file` with note text | Parent note created (`parent_created_here: true`); phone limits returned in bytes | SC-010, FR-001 |
| `find_thought` by meaning ("where are the furnace filters kept") | Found the note | SC-009, FR-023 |
| Phone page served from a non-Supabase origin (the Mac's tailnet address, plain static file with its API line filled in) | Page loaded, showed the kind and limit, uploaded, finished by itself: "Captioned" | R5, FR-002, FR-024, SC-011 |
| Phone photo taken with the default camera (High Efficiency) | Stored as `image/jpeg`, 2,457,278 bytes. `processed`, 1 caption thought, model `openai/gpt-4o-mini` | R7, SC-008, SC-002 (caption half) |
| Caption thought | Source line `From image.jpg, photo (attachment 1d15831d)`. Metadata: `local_document`, type `reference`, topics `attachment` and `image.jpg`, `input_hash` sha256, tier `personal`, provenance `llm_extraction` with `extractor_model` | FR-008, FR-025, FR-028 |
| `get_attachment` and download | The link works for 600 s and returns 2,457,278 bytes starting `ffd8ff` | FR-014, SC-003 (size; the phone original was not compared) |
| SC-007 scan of the caption row | No signed link, key, token or absolute path | SC-007 |
| Scenario 2: a real manual, Yaesu FT-710 CAT Operation Reference Manual (public PDF, 678,912 bytes, 25 pages, text layer), command upload | `processed`; 35 passage thoughts; source lines like `From FT-710_CAT_OM.pdf, pages 4–5 (attachment a180e7a5)` and the single-page `page 12` | FR-005, FR-025, U321 |
| SC-004 timing on Cloud Free | Finish wall time **2.6 s** for 25 pages: extraction, 35 passages, embeddings and the database write. No 546 | SC-004 (real manual, real models) |
| R3: OpenRouter embeddings with array input | All 35 embeddings went in one batched request and succeeded, so the batch-size-1 fallback is not needed | R3 (was unverified) |
| SC-001, 8 plain-English questions answered only by the manual, through `find_thought` (`match_thoughts`, limit 10) | **8 of 8** expected passages within the top 10 (ranks 1, 2, 1, 2, 1, 1, 1, 2) | SC-001 |
| Scenario 3: fetch by short id `a180e7a5` | Download is SHA-256-identical to the original (`fdf62b8a…`) | SC-003, SC-012 |
| Scenario 5: a scanned PDF (image-only page built from the phone photo) | `scanned`, 0 passages, reason says text search won't cover it | FR-010 |
| Scenario 6: 15 MB of random bytes declared as a 4 MB JPEG | `refused`: "not an accepted type" (the type check runs first); listed by the orphan check | FR-004, FR-021 |
| SC-013: 15 MB with a real JPEG header, declared 4 MB | `refused`: "The file is 15728640 bytes, not the declared 4194304."; the stored copy is gone (Storage 400) | SC-013 |
| Scenario 8: two simultaneous `finish_attachment` calls | One `processed` (35), the other refused at once: "busy (finishing), try again shortly". The final count is 35, not 70 | SC-014, FR-026 |
| T005 Q4 (bonus): the same photo bytes on the same thought | `refused`: "already attached to this thought as 1d15831d" | FR-012, T005 Q4 |
| Scenario 7 with `VISION_MODEL` set to a missing model (owner-approved, then restored) | Photo rebuild: stays `processed`, old caption kept, `last_rebuild_error` set (SC-018). New photo: `not_captioned`, 0 captions | SC-018, SC-015 |
| Scenario 7 recovery, with `VISION_MODEL` restored | New photo re-finish: `processed`, 1 caption. Rebuild of the first photo: succeeds and clears `last_rebuild_error` | SC-015, FR-027 |
| **Finding (privacy, remediation)** | A vision error reason stores the provider's raw body, including the OpenRouter account's `user_id`, in `last_rebuild_error` and `state_reason`, and shows it in tool results. It isn't a key, but it is an account identifier. Fix: keep the HTTP status and the provider's message only | FR-009 |
| Scenario 10: `remove_attachment` on the scenario-8 copy | Dry run: "Would remove the file FT-710_copy.pdf, 35 derived thoughts. Nothing was deleted.", with 35 still present. Confirmed: 0 passages, no row, file gone (Storage 400), parent note byte-identical, and `get_attachment` then answers "not found" | FR-016, User Story 5 #1–#2 |
