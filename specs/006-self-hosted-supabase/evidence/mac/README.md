# T037: Mac live acceptance run (SC-010, macOS half), 2026-11-26

**When and where**: the owner's Mac (Apple M4 Max, 48 GB), Docker Desktop 4.96.2, Compose v5.6.1, Ollama 0.40.18 on the host (`qwen3-embedding:4b`, `llama3.1:8b`). Branch `contrib/mfelker/self-hosted-supabase` at `c29d91c`, in a scratch checkout (`/Users/mfelker/Projects/ob1-006-live`, removed afterwards), following quickstart.md V1–V12. No key value appears in any file here.

| Step | Criterion | Result | File |
|------|-----------|--------|------|
| V1 | Story 1 setup, FR-002, FR-019 | `clone`, `secrets`, `model-settings` completed, `function-link` present, exit 0; checkout `git status` clean | `01-setup.txt` |
| V2 | US1.1, FR-004, SC-006, FR-006 | exactly `db rest api-gw functions storage` healthy, `ob1-init` exited 0 (`bucket ob1-files is ready`); schema init ran | `02-start.txt` |
| V3 | US1.2, SC-003 | setup check `ok: true`, all 7 checks pass | `03-setup-check.txt` |
| V4 | US1.3, SC-003, SC-001 | Claude Code `claude mcp add` → **✔ Connected**; 6 tools; capture stored at 1536 with `embedding_model`; reworded search → result 1 (73.5%); 112 s from V1 start | `04-mcp-round-trip.txt` |
| V5 | Story 2, SC-005, FR-009 | 1.9 MB PDF and 4.7 MB photo: upload 200, download byte-identical; no credentials and public URL → 400; bucket private. Overwriting an existing name is refused unless `x-upsert: true` (added to the README) | `05-storage.txt` |
| V6 | US1.4, US1.6, SC-007 | re-run: all `already present`; simulated interrupted run: `model-settings: completed`; key-line hash identical across all three runs | `06-rerun-resume.txt` |
| V7 | Story 3, SC-006, OS-009 | UI add-on: Studio 401 without login, 200 with it, lists `thoughts` and `ob1-files`; stops alone, tools still work. OS-009: starting only `studio meta` while stopped also starts `db` but not the gateway (README now says so) | `07-ui-addon.txt` |
| V8 | US1.5, US2.3, SC-004 | `down` + `up`: thoughts and files intact. **Docker Desktop restart** (owner's choice instead of a full Mac reboot): the five services came back by themselves (`restart: unless-stopped`); thoughts, PDF and photo intact; setup check ok; reworded search finds the thought | `08-persistence.txt` |
| V9 | SC-009, FR-021 | a second throwaway function (scratch override outside the repo) answered next to 004's; 004's setup check ok | `09-second-function.txt` |
| V10 | SC-011 | **failed**: with chat on Docker Model Runner the setup check failed `chat_metadata`. DMR ignores JSON mode (prose 3/3; Ollama returns JSON), and its 131072-token context next to Ollama's models exhausted Metal memory. Owner decision: drop DMR (FR-017 and SC-011 amended) | `10-dmr-chat.txt` |
| V11 | SC-008 | OB1 gate review checks with the upstream title: all 15 rules pass | `11-gate.txt` |
| V12 | FR-020 | `pg_dump` via `docker compose exec`: dump with `CREATE TABLE public.thoughts` and the stored rows | `12-dump.txt` |
| SC-001 | timing | about 2 minutes once images are downloaded; the first start pulls about 5.3 GB of images (stored size). Now in the README; `metadata.json` `estimated_time` "30 minutes" | `11-timing.txt` |

**Teardown**: `docker compose --profile ui --profile images down -v`; Claude Code connector `ob1-006-live` removed; scratch checkout removed. Docker Model Runner stays enabled with two models pulled (owner may disable it under Docker Desktop → Settings → AI, and remove the models with `docker model rm`).

**Not covered here**: a full Mac reboot (the owner chose the Docker Desktop restart), and the Linux half of SC-010 (T038).
