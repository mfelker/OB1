# Data model: Lean self-hosted Supabase for Open Brain (spec 006)

006 adds no new database objects beyond `docs/01`'s canonical schema and one storage bucket. Its "data" is mostly local state on the owner's machine. Paths are relative to `recipes/self-hosted-supabase-mcp/`.

## Setup piece

One unit of setup state, checked and completed on its own (FR-003).

| Piece | Present when | Completed by | Report line |
|-------|--------------|--------------|-------------|
| `clone` | `supabase/docker/docker-compose.yml` exists and the clone is at the pinned tag | shallow clone of the pin (R1) | `clone: completed` / `clone: already present` |
| `secrets` | `supabase/docker/.env` exists and holds every generated key, including `MCP_ACCESS_KEY` | copy `.env.example`, generate the Supabase keys (R6), append `MCP_ACCESS_KEY`; any key that's missing is generated **without changing the keys already there** | `secrets: completed` / `secrets: already present` |
| `model-settings` | `.env` has the model setting names (values may be blank) | append the blank names (`EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL`, `FETCH_TIMEOUT_MS`) | `model-settings: completed` / `model-settings: already present` |
| `function-link` | 004's folder exists at the repo path the override mounts (R8) | nothing to create: if it's missing, setup fails and says the checkout lacks `integrations/self-hosted-llm-mcp` | `function-link: present` / error |

Rules:

- A piece that is present is never rewritten. In particular, no existing key in `.env` changes value (FR-002, FR-003, SC-007).
- Running setup twice in a row reports every piece as already present (Story 1, scenario 4).
- A pin mismatch (the clone at another tag) is reported and left alone. Changing the pin is a documented, owner-run step (spec edge case).

## Service sets

| Set | Services | How started | Spec |
|-----|----------|-------------|------|
| always-on | `db`, `rest`, `api-gw`, `functions`, `storage` (plus the one-shot `ob1-init`, which exits after creating the bucket) | `docker compose up -d` | FR-004 |
| `ui` | `studio`, `meta` | `docker compose --profile ui up -d` / `docker compose --profile ui stop studio meta` | FR-005 |
| `images` | `imgproxy` | `docker compose --profile images up -d` (for planned 007) | FR-004, R3 |
| never | `auth`, `realtime`, `supavisor` | not started by any documented command | FR-004 |
| bundled model server | Docker Model Runner (outside Compose) | the owner enables it, then runs `docker model pull` | FR-017 |

## Secrets file (`supabase/docker/.env`)

| Key group | Source | Owner edits? |
|-----------|--------|--------------|
| `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD`, other Supabase keys | Supabase's `utils/generate-keys.sh` (R6) | no |
| `DASHBOARD_USERNAME`, ports, URLs | `.env.example` defaults | optional (ports, edge case) |
| `MCP_ACCESS_KEY` | 64 hex characters, generated (FR-002) | no; read it to connect clients |
| `EMBEDDING_*`, `CHAT_*`, `FETCH_TIMEOUT_MS` | blank names, appended | yes: spec 004's settings (FR-008) |

The file never leaves the ignored clone folder (FR-002, FR-019). No value from `.env.example` survives for any generated key (spec edge case "Secrets").

## Schema objects (first boot only)

`db/ob1-schema.sql` = `create extension if not exists vector;` + `docs/01`'s five SQL blocks, verbatim (R7):

- `thoughts` (`embedding vector(1536)`, indexes, `updated_at` trigger)
- `match_thoughts(...)`
- RLS on `thoughts` + policy "Service role full access"
- `grant select, insert, update, delete on table public.thoughts to service_role`
- `upsert_thought(p_content, p_payload)`

It runs only when the database's data directory is empty (FR-006). Touches `thoughts`? It **creates** it exactly as `docs/01` does; it never alters it (Principle I).

## Storage

| Object | Rule |
|--------|------|
| Bucket `ob1-files` | private; created by `ob1-init` on the first start, and an existing one is left as is (FR-009, R9) |
| Files | named Docker volume `ob1-storage` (R3); survive restarts and reboots (FR-010) |
| Access | service-role key only. No credentials, the anon key, or the public URL are refused (SC-005) |

## Persistent locations (FR-020)

| Data | Location | Removed by |
|------|----------|-----------|
| database | `supabase/docker/volumes/db/data` (bind mount) | deleting that folder, after `docker compose down` |
| files | Docker volume `ob1-storage` | `docker compose down -v` (only the named volumes; the bind-mounted database stays) |
| secrets | `supabase/docker/.env` | deleting the clone folder |
