# Quickstart: validating thought attachments (spec 007)

The live acceptance runs, one on Supabase Cloud and one on spec 006's self-hosted stack (SC-006). Tool behaviour is in [contracts/mcp-tools.md](contracts/mcp-tools.md), the page in [contracts/upload-page.md](contracts/upload-page.md), settings in [contracts/settings.md](contracts/settings.md) and fields in [data-model.md](data-model.md). This guide only says what to run and what to see.

## Prerequisites

- A working Open Brain: a Cloud project following `docs/01-getting-started.md`, or the 006 stack running.
- The brain's `MCP_ACCESS_KEY`, its embedding settings and a vision model: Ollama `qwen2.5vl:7b` on the host for self-hosted, or an OpenRouter vision model for Cloud.
- A phone. For self-hosted it must be on the same Wi-Fi, or on the tailnet (`PUBLIC_BASE_URL` set to an address it reaches; research R6).
- Samples, none committed:
  - a real service manual PDF of 50 pages or fewer, with a text layer;
  - one scanned PDF;
  - 5 storage photos;
  - a 40 MB file to use as a fake JPEG.
- The sample question list for SC-001 and SC-002, written before the run.

## Setup

1. Run `integrations/thought-attachments/schema.sql`: in the SQL editor on Cloud, through 006's `psql` route on self-hosted. Its verification query shows the table, grants, RLS and the private bucket.
2. Set the settings, then deploy:
   - **Cloud**: `supabase functions deploy thought-attachments --no-verify-jwt`. Then set the API address in `upload-page.html`, publish that file to a static host, and set `UPLOAD_PAGE_URL`.
   - **Self-hosted**: add the `docker-compose.override.yml` snippet from the README (R14), then `docker compose up -d --force-recreate functions`.
3. Add the connector in the AI client: the function URL with `?key=`.

## Scenarios

| # | Do | See | Verifies |
|---|----|-----|----------|
| 1 | Capture a thought with the core connector, then ask the AI to find it with `find_thought` | Its id is among the matches | SC-009 |
| 2 | Attach the manual to that thought with the command upload, then finish | `processed`, N passages; core search for each sample question returns its passage within 10 results, with the source line visible | SC-001, SC-012 |
| 3 | Ask the AI to fetch the manual by the short id shown in a search result | The download is byte-identical to the original (compare hashes); the same link fails after 10 minutes | SC-003, SC-012 |
| 4 | "The filters are on this shelf" with a new photo: the AI starts with `note`; open the page link on the phone and take a photo with the default camera | The page shows the caption; core search for the object finds the caption, and also the note | SC-002, SC-008, SC-010, SC-011 |
| 5 | Attach the scanned PDF | `scanned`; no passages | FR-010 |
| 6 | Upload the 40 MB file declared as a 4 MB JPEG | `refused` with the actual size; the file is gone; the orphan check lists it | SC-013 |
| 7 | Stop the vision model, finish a photo, start it again, finish again | `not_captioned`, then `processed` with one caption | SC-015 |
| 8 | Finish from the page and from the AI at once | One is refused as busy; one caption | SC-014 |
| 9 | Open a page link 65 minutes after it was made | The "expired" message; the orphan check lists it | SC-017 |
| 10 | Remove the manual's attachment without confirm, then with confirm | Dry run lists N passages; then search no longer returns them and the parent thought is unchanged | User Story 5, SC-020 |
| 11 | Core `list_thoughts` with type `observation`, and `thought_stats` | No passages listed; passages counted under `reference` | SC-016 |
| 12 | On Cloud only: time each finish for the real manual and the largest photo | No `546`; record the compute and wall time in `evidence/` | SC-004 |
| 13 | Query every derived thought and attachment row from the run | No signed link, key, token or absolute path | SC-007 |

## Clean-up

Remove the sample attachments through `remove_attachment`. On a throwaway project, delete the project afterwards.
