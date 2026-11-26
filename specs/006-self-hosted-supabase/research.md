# Research: Lean self-hosted Supabase for Open Brain (spec 006)

Phase 0 for [plan.md](plan.md). Each item has a Decision, the evidence behind it, and the alternatives that were considered. R1 to R4 settle FR-012. Live probes ran on 2026-11-26 on the owner's Mac (Docker Desktop 4.96.2, Compose v5.6.1) against the official stack T046 left at `supabase/supabase` `a522111`, through a throwaway overlay in the job's temp folder. The stack was torn down afterwards.

## R1: Pin a release tag, not a commit

- **Decision**: Pin `self-hosted/v0.8.5` (tag object `9c6c936`, commit `0ee83da`). The setup step clones that tag shallowly.
- **Evidence**: Upstream Supabase publishes self-hosted releases as `self-hosted/v*` tags, and its own `docker/setup.sh` clones "the latest self-hosted release tag" by default. `v0.8.5`'s `docker-compose.yml` uses the images T046 verified: `postgres:17.6.1.136`, `postgrest:v14.18`, `edge-runtime:v1.79.2`, `envoy:v1.39.6`. Its service list matches VP-001, with one difference: `storage` also depends on `rest`.
- **Alternatives**: `a522111`, a moving `master` commit with no release meaning, was rejected. `HEAD` was rejected because it isn't reproducible.

## R2: Select services with profiles and `!reset` in an `include:` override

- **Decision**: The recipe's `docker-compose.yml` has one `include:` entry whose `path` is a list: the cloned `supabase/docker/docker-compose.yml`, then the recipe's `lean.override.yml`, with `env_file` set to the cloned `.env`. The override:
  - resets `api-gw`'s `depends_on` (`!reset {}`);
  - puts `studio` and `meta` in profile `ui`;
  - puts `imgproxy` in profile `images`;
  - puts `auth`, `realtime` and `supavisor` in profile `never`.
- **Evidence** (probe): `docker compose config --services` gives `api-gw db functions rest storage` by default, and adds `meta studio` with `--profile ui`. `api-gw`'s `depends_on` comes back `None`. A plain `docker compose up -d` then starts exactly those five services, all healthy.
- **Minimum Compose**: `include:` needs v2.20. `!reset` and `!override` need v2.24. The setup step's version check (spec edge case) uses **2.24**.
- **Alternatives**:
  - `docker compose up -d --no-deps <list>` was rejected: the owner has to remember the list, and a plain `up` would start everything.
  - Editing the cloned file was rejected: it breaks FR-001 and pin updates.
  - Copying Supabase's file into the recipe is forbidden by FR-001.

## R3: Storage needs neither `auth` nor `imgproxy`, but it needs a named volume

- **Decision**:
  - `storage` runs in the always-on set without `auth` and without `imgproxy`.
  - The override sets `ENABLE_IMAGE_TRANSFORMATION: "false"` and replaces `storage`'s `depends_on` with `db` (healthy) and `rest` (started).
  - It replaces `storage`'s volume with a **named volume**, `ob1-storage:/var/lib/storage`.
  - `imgproxy` stays available under profile `images`, so planned spec 007 can enable transformations for photo thumbnails.
- **Evidence** (probe, service-role key through the gateway on `:8000`, with `auth` not running):
  - Creating `ob1-files` as a private bucket: 200. Creating it again: 400 with `BucketAlreadyExists`.
  - With the official **bind mount** `volumes/storage`, every upload failed with **500**, logged as `ENOTSUP: The file system does not support extended attributes` from `fs-xattr` in `FileBackend.setFileMetadata`. Docker Desktop's macOS file sharing doesn't support extended attributes.
  - With a named volume: upload 200; download 200 and byte-identical (300 KB random file); requests with no credentials, with the anon key, or to the public URL were all refused (400); the file was still identical after `restart storage`.
  - With `imgproxy` stopped: upload and download still 200, byte-identical.
- **Consequences**:
  - Storage files live in the Docker volume `ob1-storage`, not in a host folder (FR-020's README text, and the backup note in OS-005). The database stays in the bind mount `volumes/db/data`, which T046 proved works.
  - "Refused" means storage-api answers **400** ("not found" for the caller) rather than 401/403. SC-005 and Story 2 scenario 2 check for a refusal, not a particular status code.
- **Alternatives**:
  - Keeping the bind mount was rejected: it fails on macOS.
  - The S3 backend (MinIO or RustFS from `docker-compose.s3.yml`) was rejected: it means another service, against "lean".

## R4: Studio works without `auth`

- **Decision**: The `ui` profile is `studio` plus `meta`. The gateway's basic auth (`DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`) protects it.
- **Evidence** (probe, `--profile ui`): all 7 services healthy. `/` without credentials returns 401; with basic auth it returns 200. Studio's API `/api/platform/pg-meta/default/tables?included_schemas=public` lists `thoughts`, and `/api/platform/storage/default/buckets` lists `ob1-files`.
- **Open (OS-009)**: `docker compose --profile ui up -d studio meta` while the always-on services are stopped would start `meta`'s dependency `db` as well. Not probed; quickstart step V7 records the result.

## R5: Docker Model Runner and 1536-number embeddings: verified in a task, not here

- **Decision**: The check is the owner-approved task T0-DMR (see tasks). It runs `docker desktop enable model-runner`, which changes a Docker Desktop setting on the owner's Mac. It then pulls an embedding model, posts `/engines/v1/embeddings` with `dimensions: 1536`, and records the vector length. If the result isn't 1536 numbers, the README tells the reader to use DMR for the chat role only (FR-017).
- **Evidence so far**: VP-011 (Docker docs): DMR is OpenAI-compatible, containers reach it at `model-runner.docker.internal/engines/v1`, and it uses Metal on Apple Silicon. Whether it honors `dimensions`, and which embedding models it offers, isn't documented in what was read.
- **Why not here**: enabling DMR is a setting change on the owner's machine. The plan phase doesn't make it without the owner.

## R6: Secrets come from Supabase's own generator, plus one OB1 key

- **Decision**:
  - When `.env` is absent, the setup step copies the clone's `.env.example` to `.env` and runs the clone's `utils/generate-keys.sh --update-env` (needs `openssl`). That writes `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD` and the other keys.
  - The setup step then appends `MCP_ACCESS_KEY` (64 hex characters from `openssl rand`) and blank model settings, which the owner fills in.
  - Every piece is skipped if it's already present (FR-003).
- **Evidence**: `generate-keys.sh` at `a522111` prints and, with `--update-env`, writes all of those keys. Symmetric (legacy) keys are what `storage` checks (`AUTH_JWT_SECRET`, R3 probe).
- **Alternatives**: `local-brain-no-mcp`'s own Python JWT code was rejected: it adds a `python3` prerequisite and duplicates Supabase's generator.

## R7: The `docs/01` schema is a verbatim copy, guarded by a drift test

- **Decision**:
  - The recipe ships `db/ob1-schema.sql`: `create extension if not exists vector;` followed by `docs/01-getting-started.md`'s five SQL blocks, verbatim and in order (table and indexes, `match_thoughts`, RLS and policy, GRANT, `upsert_thought`).
  - The override mounts it into the `db` service's first-boot init directory, so it runs only on an empty data directory (FR-006).
  - A Node test extracts the five blocks from `docs/01` and fails if the file stops containing them in order.
  - `tests/verify.sql` creates a scratch database, applies the file there, and asserts the objects exist with `vector(1536)`. A scratch database is needed because fork-ci's bootstrap already creates a `thoughts` table in the default one. The scratch database also gets fork-ci's `auth.role()` helper.
- **Evidence**:
  - `docs/01` turns on pgvector in the dashboard ("Database → Extensions"), so no block creates the extension.
  - Its blocks aren't idempotent (`create table thoughts`, `create policy`), which is fine for a first-boot init.
  - fork-ci's SQL runtime runs `tests/verify.sql` with `psql -v ON_ERROR_STOP=1` from the folder, after `.fork/ci/sql/bootstrap.sql` (roles `anon`, `authenticated`, `service_role`; `auth.role()`; `thoughts`).
- **Mount path, probed**: `/docker-entrypoint-initdb.d/migrations/99-ob1-schema.sql`.
  - A fresh `db` (scratch named data volume, official `a522111` image, file built as above from `docs/01`, 109 lines) logged `migrate.sh: running …/migrations/99-ob1-schema.sql` with no error.
  - It then had: `thoughts.embedding` as `vector(1536)`, `match_thoughts` and `upsert_thought`, `service_role` holding INSERT on `thoughts`, RLS on, and `vector` in schema `public`.
  - Compose merges `db`'s volume list by target, so the OB1 file is added and the official mounts stay.
  - On a non-empty data directory the file doesn't run, which is what FR-006 asks for.
- **Alternatives**:
  - Extracting SQL from `docs/01` at setup time was rejected: it's fragile and needs a Markdown parser on the host.
  - Applying the schema with `psql` after start was rejected: it's a second "first start" step for the owner to run.

## R8: 004's function by reference, through an extra bind mount

- **Decision**: The override adds a read-only volume to `functions`: the repo's `integrations/self-hosted-llm-mcp` mounted at `/home/deno/functions/self-hosted-llm-mcp`. The path is relative to the included project directory (`supabase/docker`), so it's `../../../../integrations/self-hosted-llm-mcp`. The override also passes `MCP_ACCESS_KEY`, `EMBEDDING_*`, `CHAT_*` and `FETCH_TIMEOUT_MS` from `.env` into `functions`, as T046's `docker-compose.ob1-llm.yml` did.
- **Evidence**:
  - The official `functions` service reads functions from `/home/deno/functions` (VP-010) and already passes `SUPABASE_URL` and the service-role key.
  - T046 deployed 004 by copying it into `volumes/functions/`. FR-007 forbids copying, and a symlink inside a bind mount would point outside the container.
- **Consequence**: changes to 004's code reach the stack after `docker compose up -d --force-recreate functions`. A plain restart keeps the old environment (spec 004 README).
- **Alternatives**: copying (rejected by FR-007) or a symlink (broken inside the container).

## R9: Create the bucket with a one-shot init service at start

- **Decision**:
  - A one-shot service, `ob1-init`, in the override runs after `storage` is healthy. It creates the private bucket `ob1-files` through the gateway with the service-role key, treats `BucketAlreadyExists` as success, and exits 0.
  - It runs on every `docker compose up`, so the bucket exists from the first start and is never changed afterwards (FR-009).
  - It uses a small pinned `curl` image. That's not a Supabase service and not a long-running one, so FR-004's always-on set is unchanged.
- **Evidence**: R3 probe: create returns 200 the first time and `BucketAlreadyExists` after that.
- **Interpretation to confirm with the owner**: FR-009 says "created on first setup". The bucket needs Storage running, so it's created on the **first start** after setup. Re-running setup never touches it.
- **Alternatives**:
  - A setup step that starts the stack itself was rejected: it blurs setup and start.
  - A SQL insert into `storage.buckets` at database init was rejected: storage-api creates its schema on its own first start, after database init.

## R10: The setup step is POSIX shell, tested with `node --test`

- **Decision**:
  - `setup.sh` is POSIX `sh` plus `git`, `openssl` and `docker`, matching the official `setup.sh` and `local-brain-no-mcp` (no Node or Python for readers).
  - Tests are `tests/*.test.mjs`, run with `node --test`. They run `setup.sh` in a temp copy of the folder with stub `git` and `docker` on `PATH`, plus a fixture "clone" that is a minimal stand-in, not a copy of Supabase's files.
  - A second group of tests runs `docker compose config` on the real override against a fixture compose file with the same service names and dependency links (no network). Those are skipped when `docker` is absent.
- **Evidence**:
  - fork-ci's runtime scan treats `.sh` as non-code and runs `tests/*.test.mjs` as the `node-plain` runtime (`.fork/ci/lib/runtimes.mjs`).
  - Any `.sql` file needs `tests/verify.sql`, or the folder gets "SQL unverified" (`.fork/ci/bin/run-folder.mjs`).
  - The constitution's Testing Standards table lists `node --test` for plain scripts.
- **Alternatives**:
  - A Node or Deno setup script was rejected: it adds a host prerequisite.
  - bats was rejected: no precedent in the repo and not in the fork-ci profiles.

## R11: Where things live

- **Decision**:
  - The clone goes to `recipes/self-hosted-supabase-mcp/supabase/`, ignored by the recipe's own `.gitignore`.
  - Secrets go to `supabase/docker/.env`, inside that ignored clone.
  - The database is the bind mount `supabase/docker/volumes/db/data`; files are the Docker volume `ob1-storage` (R3).
  - The README's dump command is `docker compose exec db pg_dump -U postgres postgres > backup.sql` (VP-009, because there's no host port).
- **Evidence**: `local-brain-no-mcp` clones into its own folder. The recipe can't edit the root `.gitignore` (gate rule 12).

## R12: Linux and the bundled model server

- **Decision**:
  - On Linux the README points `EMBEDDING_API_BASE` and `CHAT_API_BASE` at the host through `host.docker.internal`. The override adds `extra_hosts: ["host.docker.internal:host-gateway"]` to `functions`, so the same address works on Linux.
  - DMR on Linux, which is Docker CE's `docker-model-plugin`, is exercised in the Linux live run (SC-010) only if the run's machine has it. Otherwise the README marks DMR on Linux as untested.
- **Evidence**: on Docker Desktop, `host.docker.internal` resolves by default (T046). On Linux Engine it needs `host-gateway`, which is standard Compose. That part is general Docker knowledge, to be confirmed in the Linux live run.
