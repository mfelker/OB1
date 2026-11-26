# Quickstart: validating spec 006 end to end

The live acceptance run (SC-010): first on the owner's Mac, then on Linux before the upstream PR. Record each step's output under `specs/006-self-hosted-supabase/evidence/<run>/`, with no key values. Commands run from `recipes/self-hosted-supabase-mcp/` in the worktree checkout.

**Prerequisites**: Docker with Compose 2.24 or newer, `git`, `openssl`. A model server reachable from containers (Ollama on the host with `qwen3-embedding:4b` and `llama3.1:8b`, the pair T046 tested). Note the start time for SC-001.

| # | Step | Expected (contract / spec) |
|---|------|----------------------------|
| V1 | `sh setup.sh` | pieces reported completed (C1); `.env` exists inside `supabase/docker/`; `git status` in the worktree is clean (FR-019) |
| V2 | Fill the model settings in `supabase/docker/.env`; `docker compose up -d` | exactly the always-on set healthy, `ob1-init` exited 0 (C2, SC-006); `docker compose ps` saved |
| V3 | `curl` the setup check with the key | 200, every check passes (Story 1, scenario 2; SC-003) |
| V4 | `claude mcp add --transport http …?key=…`; list tools, capture, search reworded | six tools; capture stored with 1536 numbers; search returns it first (Story 1, scenario 3); elapsed time since the start recorded (SC-001) |
| V5 | Storage check from the README: upload a PDF and a photo to `ob1-files`, download, `cmp`; try without credentials | identical; refused (Story 2; SC-005) |
| V6 | `sh setup.sh` again; then simulate an interrupted run (delete one piece, such as the model-settings lines) and re-run | all "already present"; then the missing piece "completed", keys unchanged (`sha256` of key lines before and after) (Story 1, scenarios 4 and 6; SC-007) |
| V7 | `docker compose --profile ui up -d`; open `http://localhost:8000` with the dashboard password; see `thoughts` and `ob1-files`; then `--profile ui stop studio meta`; re-run V3 | Story 3; SC-006. Also record what `--profile ui up` does while the stack is stopped (OS-009) |
| V8 | `docker compose down`, then `up -d`; then reboot the machine; repeat V3, the V4 search, and the V5 download | thoughts and files intact (Story 1, scenario 5; Story 2, scenario 3; SC-004) |
| V9 | Put a second minimal function next to 004's (a throwaway in a scratch mount), recreate `functions`, call it, then re-run V3 | both answer (SC-009); remove it afterwards |
| V10 | (owner-approved) enable Docker Model Runner, `docker model pull` the chat model (and an embedding model), point `CHAT_API_BASE` (and `EMBEDDING_API_BASE` if R5 is 1536) at it, recreate `functions`, then V3 and a V4 capture | setup check passes; GPU (Metal) use visible in DMR's status or logs (SC-011, R5); OS-010 checked: is DMR's port reachable from another LAN machine? |
| V11 | Run the upstream gate's review checks locally with the upstream PR title (as for #533) | all rules pass (SC-008) |
| V12 | `docker compose exec db pg_dump -U postgres postgres > backup.sql` | a non-empty dump containing `thoughts` (FR-020) |

Teardown after the run: `docker compose --profile ui --profile images down`. Add `-v` only to discard the files volume. The database bind mount is removed by deleting `supabase/`.
