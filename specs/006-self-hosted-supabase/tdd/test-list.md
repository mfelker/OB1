---
feature: 006-self-hosted-supabase # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 20 # Story 1 scenarios 1–6, Story 2 scenarios 1–3, Story 3 scenarios 1–3, SC-001 to SC-011 (overlapping); 9 automatable, the rest live (see "Live acceptance")
planned_at: e86a3d4 # short SHA the list was derived from (fork main)
updated_at: e86a3d4 # short SHA of the last change to this file
suite_baseline: green # empty: recipes/self-hosted-supabase-mcp and its worktree don't exist yet (T001), 0 tests
---

# Test List: Lean self-hosted Supabase for Open Brain

## How this list keeps every red real

- **No acceptance runner** is in the profile (`acceptance: null`). The outer loop runs at the highest level the repository can test without a running stack: the real `setup.sh`, `docker compose config` on the real `docker-compose.yml` and `lean.override.yml`, the real `create-bucket.sh`, and the real schema file in a scratch Postgres. External programs are stubbed (`git`, `docker`, `curl`, Supabase's `generate-keys.sh`), and the Supabase clone and its compose file are fixtures (T003, T004; plan R10). Everything that needs a running stack is the **live acceptance** (quickstart V1–V12, tasks T037–T038). It is listed below but is not part of the loop.
- **Outer loop first**: A1–A9 are written before any unit work as `todo` tests (`test.todo`, or `test(..., { todo: true })`, so the file runs and reports them as todo), in `tests/acceptance.test.mjs`. A5 is the whole `tests/verify.sql`. The red is recorded with the todo flag removed, and each is flipped to a plain `test` in the commit that turns it green (T050, T051–T059).
- **Behavior ids prefix every test name** (`"U12 …"`, `"A3 …"`), so `node .fork/ci/bin/tdd.mjs single <file> "<name>"` selects exactly one test. A run reporting 0 tests is not evidence (adapter exit 3).
- **Docker-dependent tests** (compose behaviors and A1, A7, A8) are marked **skipped with `node:test`'s skip** when `docker` isn't on `PATH`, never passed. A skipped test is not a green.
- A test that passes on its first run gets a deliberate mutant check, and its cycle entry says so (004 precedent).
- **The SQL runtime** has no single-test mode: U41–U46 are assertions inside `tests/verify.sql`, each added red-first, run with `tdd.mjs file tests/verify.sql`.

## Outer loop: acceptance behaviors

Test file: `recipes/self-hosted-supabase-mcp/tests/acceptance.test.mjs`, except A5.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1 | After `setup.sh` on a fresh copy, `docker compose config --services` on the recipe lists exactly `api-gw db functions ob1-init rest storage`, and none of `auth`, `realtime`, `supavisor`, `studio`, `meta`, `imgproxy` | US1.1, FR-004, SC-006 | example | PENDING | `tests/acceptance.test.mjs::A1` |
| A2 | Running `setup.sh` a second time exits 0, reports every piece already present, and leaves `supabase/docker/.env` byte-identical | US1.4, FR-003, SC-007 | example | PENDING | `tests/acceptance.test.mjs::A2` |
| A3 | A setup run interrupted after the secrets were written (model-setting lines removed afterwards) is completed by the next run: the missing lines are added, every key line keeps its value, and that piece is reported completed while the secrets are reported already present | US1.6, FR-003, SC-007 | example | PENDING | `tests/acceptance.test.mjs::A3` |
| A4 | After a fresh `setup.sh`: no generated key equals its `.env.example` value, `MCP_ACCESS_KEY` is set, no key value was printed, and `git status --porcelain` in the checkout is empty | FR-002, FR-019, edge case "Secrets" | example | PENDING | `tests/acceptance.test.mjs::A4` |
| A5 | Applying `db/ob1-schema.sql` to an empty scratch database gives `thoughts` with `embedding vector(1536)`, `match_thoughts`, `upsert_thought`, INSERT for `service_role`, RLS on, all owned by `postgres` | FR-006, FR-011, US1.3 (stored 1536 embedding) | example | DONE | `tests/verify.sql (no whole-file red; U41–U45 mutants)` |
| A6 | Running `create-bucket.sh` twice against a storage stand-in that remembers buckets exits 0 both times, and leaves exactly one bucket `ob1-files`, private | US2.1, FR-009 | example | PENDING | `tests/acceptance.test.mjs::A6` |
| A7 | After `setup.sh`, the recipe's service set with `--profile ui` is the default set plus exactly `studio` and `meta` | US3.1, US3.2, FR-005, SC-006 | example | PENDING | `tests/acceptance.test.mjs::A7` |
| A8 | After `setup.sh`, the composed `functions` service mounts the checkout's `integrations/self-hosted-llm-mcp` read-only and receives `MCP_ACCESS_KEY` and the model settings from `.env` | FR-007, FR-008, SC-003 (config prerequisite) | example | PENDING | `tests/acceptance.test.mjs::A8` |
| A9 | `setup.sh` completes on a fresh copy with only `docker`, `git`, `openssl` and POSIX tools on `PATH` (no Kubernetes or other tooling) | SC-002 | example | PENDING | `tests/acceptance.test.mjs::A9` |

## Inner loop: unit behaviors

Rows are in cycle order per component. Behaviors marked "both sides" are tested at each listed input in one test.

### `recipes/self-hosted-supabase-mcp/setup.sh` (contract C1; data-model.md Setup piece, Secrets file)

Test file: `tests/setup.test.mjs`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1 | With no `docker` on `PATH`: non-zero exit, the message names `docker`, and no `supabase/` folder is created | C1, FR-019 | example | PENDING | `tests/setup.test.mjs::U1` |
| U2 | With no `git` on `PATH`: non-zero exit naming `git`; no `supabase/` folder | C1 | example | PENDING | `tests/setup.test.mjs::U2` |
| U3 | With no `openssl` on `PATH`: non-zero exit naming `openssl`; no `supabase/` folder | C1 | example | PENDING | `tests/setup.test.mjs::U3` |
| U4 | On a fresh folder it invokes a shallow clone of tag `self-hosted/v0.8.5` into `supabase/` (the stub `git` log shows `clone`, `--depth 1`, `--branch self-hosted/v0.8.5`) | FR-001, R1 | example | PENDING | `tests/setup.test.mjs::U4` |
| U5 | With the clone already present at the pin, it makes no clone call and reports `clone: already present` | FR-003 | example | PENDING | `tests/setup.test.mjs::U5` |
| U6 | With the clone at another tag: non-zero exit, the message names both tags and how to change the pin, and nothing in `supabase/` changes | edge case "pinned commit", C1 | example | PENDING | `tests/setup.test.mjs::U6` |
| U7 | When `docker compose config -q` on the recipe fails: non-zero exit, the message names the Compose version found and the tested version, and no `.env` is created | edge case "Compose", R2, C1 | example | PENDING | `tests/setup.test.mjs::U7` |
| U8 | On a fresh folder `.env` is created from `.env.example` with the generator's keys, and every generated key differs from its `.env.example` value | FR-002, R6 | example | PENDING | `tests/setup.test.mjs::U8` |
| U9 | `MCP_ACCESS_KEY` in the new `.env` is exactly 64 lowercase hex characters | FR-002, data-model.md Secrets file.MCP_ACCESS_KEY | example | PENDING | `tests/setup.test.mjs::U9` |
| U10 | Two fresh setups produce two different `MCP_ACCESS_KEY` values | FR-002 | example | PENDING | `tests/setup.test.mjs::U10` |
| U11 | The new `.env` holds the blank names `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL`, `FETCH_TIMEOUT_MS` | FR-008, data-model.md Secrets file.EMBEDDING_*/CHAT_* | example | PENDING | `tests/setup.test.mjs::U11` |
| U12 | When the key generator fails: non-zero exit, no `.env` in `supabase/docker/`, and no leftover temporary file there | R6, US1.6 | example | PENDING | `tests/setup.test.mjs::U12` |
| U13 | After a U12 failure, the next run (generator now working) completes `secrets` | R6, US1.6 | example | PENDING | `tests/setup.test.mjs::U13` |
| U14 | `.env` without `MCP_ACCESS_KEY`: only an `MCP_ACCESS_KEY` line is added; every other line is byte-identical; `secrets: completed` | C1, FR-003 | example | PENDING | `tests/setup.test.mjs::U14` |
| U15 | `.env` missing some model-setting names: only the missing names are added (both sides: one missing, all missing); `model-settings: completed` | C1, FR-003 | example | PENDING | `tests/setup.test.mjs::U15` |
| U16 | `.env` complete: byte-identical after the run, and `secrets` and `model-settings` report already present | US1.4, FR-003 | example | PENDING | `tests/setup.test.mjs::U16` |
| U17 | `.env` missing a Supabase key (`JWT_SECRET`): non-zero exit naming it; `.env` unchanged | R6, C1 | example | PENDING | `tests/setup.test.mjs::U17` |
| U18 | `.env` with a Supabase key still at its `.env.example` value (`SERVICE_ROLE_KEY`): non-zero exit naming it; `.env` unchanged (other side of U16) | FR-002, R6, C1 | example | PENDING | `tests/setup.test.mjs::U18` |
| U19 | No value of any key from the new `.env` appears in stdout or stderr of a fresh run | C1 invariant | example | PENDING | `tests/setup.test.mjs::U19` |
| U20 | Without `integrations/self-hosted-llm-mcp/` in the checkout: non-zero exit saying 004's folder is missing; with it: `function-link: present` (both sides) | FR-007, data-model.md Setup piece.function-link | example | PENDING | `tests/setup.test.mjs::U20` |
| U21 | A fresh run reports `clone: completed`, `secrets: completed`, `model-settings: completed`, `function-link: present` and exits 0 | C1, US1.1 | example | PENDING | `tests/setup.test.mjs::U21` |
| U22 | After a fresh run, `git status --porcelain` in the checkout is empty (everything written is under the ignored `supabase/`) | FR-019 | example | PENDING | `tests/setup.test.mjs::U22` |

### `recipes/self-hosted-supabase-mcp/docker-compose.yml` + `lean.override.yml` (contract C2; R2, R3, R7, R8, R12)

Test file: `tests/compose.test.mjs`. Uses `docker compose config` against the T004 fixture clone; skipped with `node:test`'s skip without `docker`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U24 | The default service set is exactly `api-gw db functions ob1-init rest storage` | FR-004, data-model.md Service sets.always-on | example | PENDING | `tests/compose.test.mjs::U24` |
| U25 | With `--profile ui` the set adds exactly `studio` and `meta` | FR-005, data-model.md Service sets.ui | example | PENDING | `tests/compose.test.mjs::U25` |
| U26 | With `--profile images` the set adds exactly `imgproxy` | R3, data-model.md Service sets.images | example | PENDING | `tests/compose.test.mjs::U26` |
| U27 | `auth`, `realtime` and `supavisor` appear in neither the default, the `ui` nor the `images` set | FR-004, data-model.md Service sets.never | example | PENDING | `tests/compose.test.mjs::U27` |
| U28 | `api-gw` has no `depends_on` entry for `studio` | R2, FR-004 | example | PENDING | `tests/compose.test.mjs::U28` |
| U29 | `storage` depends on exactly `db` (condition `service_healthy`) and `rest` | R3 | example | PENDING | `tests/compose.test.mjs::U29` |
| U30 | `storage` has `ENABLE_IMAGE_TRANSFORMATION` set to `"false"` | R3 | example | PENDING | `tests/compose.test.mjs::U30` |
| U31 | `storage` has exactly one volume, the named volume `ob1-storage` at `/var/lib/storage` (no bind mount there) | R3, FR-010, data-model.md Storage.Files | example | PENDING | `tests/compose.test.mjs::U31` |
| U32 | `functions` mounts the checkout's `integrations/self-hosted-llm-mcp` (resolved absolute path) read-only at `/home/deno/functions/self-hosted-llm-mcp` | FR-007, R8 | example | PENDING | `tests/compose.test.mjs::U32` |
| U33 | `functions` receives `MCP_ACCESS_KEY`, `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL`, `FETCH_TIMEOUT_MS` with the values in `.env` | FR-008, R8 | example | PENDING | `tests/compose.test.mjs::U33` |
| U34 | `functions` maps `host.docker.internal` to `host-gateway` | R12, C4 | example | PENDING | `tests/compose.test.mjs::U34` |
| U35 | `db` mounts `db/ob1-schema.sql` read-only at `/docker-entrypoint-initdb.d/migrations/99-ob1-schema.sql`, and the fixture's own `db` mounts are still present | FR-006, R7 | example | PENDING | `tests/compose.test.mjs::U35` |
| U36 | `ob1-init` depends on `storage` with condition `service_healthy`, has `restart: "no"`, mounts `init/create-bucket.sh`, and receives `SERVICE_ROLE_KEY` | FR-009, R9 | example | PENDING | `tests/compose.test.mjs::U36` |

### `recipes/self-hosted-supabase-mcp/db/ob1-schema.sql` (R7; data-model.md Schema objects)

Test files: `tests/schema-drift.test.mjs` (U38–U40) and `tests/verify.sql` (U41–U46).

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U38 | The file contains `docs/01-getting-started.md`'s five ```` ```sql ```` blocks verbatim and in order | FR-006, R7 | example | DONE | `tests/schema-drift.test.mjs::U38` |
| U39 | The file's first two statements are `create extension if not exists vector;` and `set role postgres;` | R7 | example | DONE | `tests/schema-drift.test.mjs::U39` |
| U40 | The file's last statement is `reset role;` | R7 | example | DONE | `tests/schema-drift.test.mjs::U40` |
| U41 | In a scratch database, `thoughts.embedding` is `vector(1536)` | FR-006 | example | DONE | `tests/verify.sql (assertion U41; mutant-proven)` |
| U42 | `match_thoughts` and `upsert_thought` exist | FR-006 | example | DONE | `tests/verify.sql (assertion U42; mutant-proven)` |
| U43 | `service_role` has INSERT on `public.thoughts` | FR-006, VP-007 | example | DONE | `tests/verify.sql (assertion U43; mutant-proven)` |
| U44 | Row level security is enabled on `thoughts` | FR-006 | example | DONE | `tests/verify.sql (assertion U44; mutant-proven)` |
| U45 | `thoughts`, `match_thoughts` and `upsert_thought` are owned by `postgres` | R7, FR-021 | example | DONE | `tests/verify.sql (assertion U45; mutant-proven)` |
| U46 | Running `tests/verify.sql` twice against the same Postgres succeeds both times, with no DROP statement in the file (unique scratch database per run) | R7, guard rails | example | DONE | `tests/verify-rerun.test.mjs::U46 (mutant-proven)` |

### `recipes/self-hosted-supabase-mcp/init/create-bucket.sh` (R9; data-model.md Storage.Bucket)

Test file: `tests/create-bucket.test.mjs`, with a stub `curl` on `PATH`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U47 | Storage answers 200 → exit 0, and the output says the bucket is ready | FR-009 | example | PENDING | `tests/create-bucket.test.mjs::U47` |
| U48 | Storage answers 400 with `BucketAlreadyExists` → exit 0 (bucket left as is) | FR-009, R9 | example | PENDING | `tests/create-bucket.test.mjs::U48` |
| U49 | Storage answers 400 with any other error → non-zero exit, with the status and error in the output (other side of U48) | R9 | example | PENDING | `tests/create-bucket.test.mjs::U49` |
| U50 | Storage answers 500, or can't be reached → non-zero exit naming the failure | R9 | example | PENDING | `tests/create-bucket.test.mjs::U50` |
| U51 | The request is a POST to the storage service's `/bucket` with body `id` and `name` `ob1-files`, `public` false | FR-009, data-model.md Storage.Bucket | example | PENDING | `tests/create-bucket.test.mjs::U51` |
| U52 | The request carries `apikey` and `Authorization: Bearer` with `SERVICE_ROLE_KEY` from the environment, and the key never appears in the output | FR-009, data-model.md Storage.Access | example | PENDING | `tests/create-bucket.test.mjs::U52` |

## Live acceptance (manual, not on the loop)

Criteria that need a running stack, a real MCP client, a reboot or a second OS. Each is run in quickstart.md, with evidence under `evidence/mac/` and `evidence/linux/` (tasks T037, T038, T035):

| criterion | quickstart | task |
| --------- | ---------- | ---- |
| US1.1 (healthy), US1.2, SC-003 setup check passes | V2, V3 | T037 |
| US1.3, SC-003 six tools, capture at 1536, reworded search first | V4 | T037 |
| US1.5, SC-004 thoughts survive restart and reboot | V8 | T037 |
| US2.1–US2.3, SC-005 upload, download, refusal, persistence | V5, V8 | T037 |
| US3.1–US3.3 UI add-on opens, shows table and bucket, stops alone | V7 | T037 |
| SC-001 README alone, elapsed time recorded | V1–V4 | T037 |
| SC-008 gate review checks, all rules | V11 | T043 |
| SC-009 second function next to 004's | V9 | T037 |
| SC-010 Mac run and Linux run | all | T037, T038 |
| SC-011 Docker Model Runner on the Mac GPU | V10 | T035, T037 |

## Invariants and edge cases still to place

- None. Port conflicts (spec edge case) are Docker's own start-time error; the README names the port setting (FR-020 text, T026). That's docs, not a behavior of the recipe's code.

## Out of scope

- README content (FR-013 to FR-016, FR-018, FR-020, FR-021 wording): docs gates (markdownlint, link check, README sections) and the live run, not unit tests (constitution Principle IV, docs-only exemption).
- Spec 004's tools and setup check: already covered by 004's 253 tests; 006 only mounts the function.
- Migration, backups beyond the dump command, attachments, remote access, multi-backend model image: spec OS-001, OS-002, OS-005, OS-007, OS-008.
- Docker Model Runner's own behavior: the live probe T035 (R5); there's no code of the recipe's own to test.

## Verification commands

From `.specify/memory/tdd-profile.md` (run from `M`, acting on the plan's Worktree):

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}` (for `tests/verify.sql`, needs Postgres reachable through the `PG*` environment variables, as fork-ci provides)
- Full suite: `node .fork/ci/bin/tdd.mjs suite`
- Todo acceptance reds: run the A tests with the todo flag removed locally, and record the failure lines before committing the todo form.
