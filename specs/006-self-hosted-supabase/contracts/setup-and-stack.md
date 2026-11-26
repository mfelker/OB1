# Contract: setup step and stack commands (spec 006)

The observable interface of `recipes/self-hosted-supabase-mcp/`. It states behavior only. How each behavior is implemented is left to the TDD cycles (see the plan template's note on contracts).

## C1. `sh setup.sh`

Run from the recipe folder. No arguments.

| Situation | Exit | Output (one line per piece; exact wording free, piece name and state fixed) |
|-----------|------|------------------------------------------------------------------------------|
| Docker Compose below 2.24, or missing | non-zero | names the required version and the version found; nothing is created |
| `docker`, `git` or `openssl` missing | non-zero | names the missing tool; nothing is created |
| fresh folder | 0 | `clone`, `secrets`, `model-settings` reported **completed**; `function-link` **present** |
| second run, nothing changed | 0 | every piece **already present** (Story 1, scenario 4) |
| earlier run stopped after `secrets` | 0 | `clone`, `secrets` **already present**; the rest **completed**; every existing key unchanged (Story 1, scenario 6) |
| `.env` missing one generated key | 0 | `secrets` **completed**; the missing key added, all others unchanged |
| clone at a different tag than the pin | non-zero | names both tags and the documented way to change the pin; nothing is changed |
| `integrations/self-hosted-llm-mcp` absent from the checkout | non-zero | says the checkout lacks 004's folder |

Invariants:

- No generated key in `.env` equals its `.env.example` value (FR-002).
- No file outside the ignored `supabase/` folder is created or changed (FR-019).
- No secret value is printed to the terminal.

## C2. Stack commands (from the recipe folder)

| Command | Observable result |
|---------|-------------------|
| `docker compose up -d` | exactly `db`, `rest`, `api-gw`, `functions`, `storage` running and healthy, plus `ob1-init` exited 0; no `auth`, `realtime`, `supavisor`, `studio`, `meta` or `imgproxy` (FR-004, SC-006) |
| `docker compose --profile ui up -d` | adds `studio` and `meta`; always-on services keep running (FR-005) |
| `docker compose --profile ui stop studio meta` | only those two stop; the MCP tools keep working (Story 3, scenario 3) |
| `docker compose up -d --force-recreate functions` | 004's function picks up changed settings (spec 004 README) |
| `docker compose down` | everything stops; database and files kept |
| `docker compose exec db pg_dump -U postgres postgres > backup.sql` | a database dump (FR-020) |

## C3. Endpoints (gateway, `http://<host>:8000`)

| Path | Auth | Result |
|------|------|--------|
| `/functions/v1/self-hosted-llm-mcp` | `x-brain-key` header or `?key=` (`MCP_ACCESS_KEY`) | spec 004's six tools (SC-003) |
| `/functions/v1/self-hosted-llm-mcp/setup-check` | same | spec 004's setup check: 200 when every check passes |
| `/storage/v1/object/ob1-files/<name>` | service-role key | upload and download, byte-identical (SC-005) |
| same, no credentials, anon key or `/object/public/...` | — | refused (storage-api answers 400, R3) |
| `/` (Studio, `ui` profile only) | dashboard basic auth | 401 without it; Studio with it (Story 3) |

## C4. Model server settings (owner-filled, spec 004 names)

| Route | `EMBEDDING_API_BASE` / `CHAT_API_BASE` |
|-------|----------------------------------------|
| Server on the host (default) | `http://host.docker.internal:<port>/v1` on both macOS and Linux (R12) |
| Docker Model Runner (bundled option) | `http://model-runner.docker.internal/engines/v1`; embedding role only if R5 shows 1536 (FR-017) |
