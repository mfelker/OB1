# T046 (self-hosted half) and T045: local live verification

**When and where.** Run 2026-11-26 on the owner's laptop (Apple M4 Max, 48 GB), using:

- the **official Supabase Docker Compose stack** (`supabase/supabase` `docker/` at `a522111`), started with only `db`, `rest`, `api-gw` (Envoy) and `functions`;
- the `docs/01` schema at `vector(1536)`;
- Ollama 0.40.18 on the host (`qwen3-embedding:4b`, `llama3.1:8b`), reached from the containers at `http://host.docker.internal:11434/v1`;
- function code from `contrib/mfelker/self-hosted-llm` @ `f09a3a4`, deployed per the README's self-hosted steps.

Raw output is in the numbered files in this folder. No key value appears in any of them.

| Criterion | Result | File |
|-----------|--------|------|
| FR-014: `npm:` imports resolve under the stack's shared import map | The first request was answered, with no resolution error | `02-setup-check.json` |
| FR-017 / R1: `qwen3-embedding:4b` returns 1536 via `dimensions` | 1536, unit length; 2560 (native) without it | `00-environment.txt` and the README table |
| R3: Ollama `/v1` rejects `dimensions` above the native size | HTTP 400 `dimensions 1536 exceeds embedding length 768`; retried, then refused naming both sizes | `05-failure-modes.txt` |
| SC-009: setup check | 401 without the key; 200 with every check passing; 503 for a 768 model | `01`, `02`, `05` |
| SC-015: authentication | `?key=` lists the six tools; a wrong key gets `-32001` | `03-mcp-round-trip.txt` |
| SC-002 / SC-004 / US1 | Capture, exact search (Result 1 at 100.0%), paraphrase search, list and stats all succeed | `03-mcp-round-trip.txt` |
| FR-015 / FR-024: stored rows | 1536 dims, `embedding_model`, `enrichment_status: complete`, `source: mcp` | `04-db-and-r6-premise.txt` |
| **T045**: R6 premise on real Postgres | After the insert, `created_at = updated_at` to the microsecond; after the duplicate, `created_at < updated_at` | `04-db-and-r6-premise.txt` |
| SC-014: key over `http://` | 200 and `ok`, with one `key_over_http` warning per role | `05-failure-modes.txt` |
| SC-003 / SC-008 / SC-011 / SC-012 / US2.3 | Each as specified; no row stored except the fallback (details below) | `05-failure-modes.txt` |
| SC-015 / SC-004 with a real MCP client | Claude Code (`claude mcp add --transport http`, `?key=`): capture, then a reworded search returns it first at 93.4% | `07-real-mcp-client.txt` |
| SC-016 / SC-010 | The fallback row was repaired to `complete` (same id); 3 legacy rows give `other_model: 3` | `06-sc010-sc016.txt` |

The failure scenarios behind the SC-003 / SC-008 / SC-011 / SC-012 / US2.3 row:

- unreachable model server;
- blank `EMBEDDING_API_BASE`;
- a 1 ms timeout;
- blank `CHAT_MODEL`, checked on all six tools;
- an unknown chat model, which saves the thought with fallback metadata.

**Not covered here (still pending):**

- The Supabase Cloud half: SC-007's Cloud side; SC-013 (the Cloud reachability failure, then the HTTPS-plus-key fix that is FR-019's worked example); the Cloud deploy steps (FR-022); and the Supabase CLI version row.
- SC-001 (setup in 30 minutes using the README alone) was not timed.

**README corrections found by this run** (committed `e765921`):

- The stack pins `COMPOSE_FILE`, so an overlay must be registered with `sh run.sh config add`.
- `docker compose restart` keeps the old environment; the container must be recreated instead.
- The default gateway is now Envoy, which needs no key on `/functions/v1/`.
- A model server on the same host is reached at `host.docker.internal`.
