# Spec 007 live self-hosted run (T077), 2026-11-27

The stack is a fresh spec 006 stack (`recipes/self-hosted-supabase-mcp`, `self-hosted/v0.8.5`) in a scratch worktree of fork `main`, with 007's folder copied in. The `thought-attachments.env` and `docker-compose.override.yml` files were written exactly as 007's README says. Host: Apple M4 Max, 48 GB, with Ollama 0.40.18 on the GPU. Models: `qwen3-embedding:4b` (embeddings) and `qwen3-vl:8b` (vision). No key values are recorded here.

| Step | Result | Verifies |
|------|--------|----------|
| `setup.sh` | clone, secrets and model settings completed | 006 recipe |
| `schema.sql` through 006's `psql` route | 27 columns, RLS on, 15 functions, one `idx_thoughts_fingerprint`; reuses 006's private `ob1-files` | FR-020, R12, R16 |
| `SUPABASE_PUBLIC_URL` as left by 006 | `http://localhost:8000`, as R6 predicted; 007's `PUBLIC_BASE_URL` was set to the Mac's tailnet address | R6 |
| `tools/list` through api-gw | 7 tools | FR-018, T045 |
| **Bug 1 (T121):** `attach_file` with a note | `expected 1536 dimensions, not 2560`: 007 never sent `dimensions`. Fixed test-first (U395–U399); live after the fix: the note was created | FR-007, FR-019 |
| **Bug 2 (T122):** `GET …/thought-attachments/upload` | HTTP 500 `NotFound …/sb-compile-edge-runtime/…/upload-page.html`: the runtime compiles the function without non-imported files. Fixed test-first (U400–U402); live after the fix: 200 `text/html`, byte-identical to `upload-page.html` | R5, FR-002 |
| Page flow from the Mac (`/page/info`, `/page/start`, PUT, `/page/finish`) | info 200 with kind and caps in bytes; start 200 with a link on the tailnet address; PUT 200 | FR-002, FR-024 |
| `/page/finish` with `qwen3-vl:8b` on a 2.4 MB, roughly 12 MP photo | **504 after 150 s** (the gateway idle timeout). The attachment stayed `pending_upload` and the token stayed valid, which is correct (T005 Q5, FR-011) | known limitation |
| Measurement (Ollama `/api/chat`) | Generation 60–82 tok/s; the photo becomes **11,865 vision tokens** at 168 tok/s, so about 70 s on the image alone. Recorded on fork issues 26 and 31 | R1, R4 |
| **Skipped: SC-008 self-hosted half (a real phone)** | The owner's current Wi-Fi blocks the tailnet, so a phone could not reach the stack. Recorded as a GAP | SC-008 |
| Not run on self-hosted | the manual and SC-001 (run on Cloud), and scenario 11 (core list and stats: this stack's core function is not mounted in the scratch run) | GAP |
