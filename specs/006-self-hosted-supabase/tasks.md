---

description: "Task list for spec 006: lean self-hosted Supabase recipe"
---

# Tasks: Lean self-hosted Supabase for Open Brain

**Input**: Design documents from `specs/006-self-hosted-supabase/`

**Prerequisites**: plan.md, spec.md, research.md (R1–R13), data-model.md, contracts/setup-and-stack.md (C1–C4), quickstart.md (V1–V12)

**Tests**: MANDATORY (constitution Principle IV, NON-NEGOTIABLE). This is the upstream-bound lane: write each test first and confirm it FAILS. README-only tasks are docs, covered by the documentation gates and the live quickstart.

**TDD loop** (spec-kit-tdd; see `.fork/README.md` "TDD workflow"): after `/speckit-tasks`, the `after_tasks` hook (`tdd.plan`) adds the `[U#]`/`[A#]` markers and reorders the test tasks, writing `tdd/test-list.md`. `/speckit-implement` then drives every marked behavior through the loop via the mandatory `before_implement` hook, recording each red in `tdd/cycle-log.md`, and ticks the marked tasks itself. **Never tick a marked task by hand**; unmarked tasks are ticked when done.

**Organization**: tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependencies)
- **[Story]**: which user story the task belongs to (US1, US2, US3)

## Path Conventions

- `W` = `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-supabase` (plan **Worktree**)
- `F` = `W/recipes/self-hosted-supabase-mcp`, the one contribution folder. Every source path below is under `F`.
- `M` = `/Users/mfelker/Projects/ob1` (fork `main`). `specs/` and `.fork/` are edited only here, never on the `contrib/` branch.
- **Live runs never happen inside `F`.** `setup.sh` clones Supabase's files into `F/supabase/`, which local fork-ci and TDD scans would pick up (plan "Notes for `/speckit-tasks`"). Live runs use a scratch checkout of the branch: `S` = `/Users/mfelker/Projects/ob1-006-live` (`git worktree add`, removed after each run).

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: the branch, the worktree, the empty folder and the test harness.

- [X] T001 In `M`:
  1. `git fetch upstream`; confirm `upstream/main` (was `238df6c` at planning).
  2. `git worktree add .worktrees/contrib-self-hosted-supabase -b contrib/mfelker/self-hosted-supabase upstream/main`.
  3. In `W`: `git merge --no-ff contrib/mfelker/self-hosted-llm -m "[integrations] Base: merge self-hosted-llm (stacked until #533 merges)"`.
  4. Record that merge commit's SHA in plan.md Lane; T047 needs it.
  5. Check that `node M/.fork/ci/bin/tdd.mjs where` resolves `W`.
- [X] T002 Scaffold `F/` from `W/recipes/_template/`: `F/README.md` (headings only) and `F/metadata.json` (draft), plus `F/.gitignore` containing `supabase/` (plan Constraints; R11).
- [X] T003 [P] Test harness in `F/tests/helpers/`. It must:
  - make a temporary copy of `F` inside a temporary git repo that also holds `integrations/self-hosted-llm-mcp/` (an empty marker folder is enough);
  - put stub `git` and `docker` executables first on `PATH`;
  - build a fixture "clone" at `<tmp>/F/supabase/docker/` with a `.env.example` (placeholder values) and a stub `utils/generate-keys.sh` that edits `.env` in its working directory, like the real one (R6), and can be told to fail.

  The fixture is a minimal stand-in, never a copy of Supabase's files (FR-001).
- [X] T004 [P] Fixture compose file `F/tests/fixtures/compose/docker-compose.yml`: the 11 service names and the dependency links of the official `v0.8.5` file (research R1, R2; spec VP-001), each with a tiny public image and no other settings. Not a copy of Supabase's file.
- [X] T050 [A1] [A2] [A3] [A4] [A6] [A7] [A8] [A9] Open the outer loop: write A1–A4 and A6–A9 from `tdd/test-list.md` **first**, in `F/tests/acceptance.test.mjs` as `node:test` todo tests, driving the real `setup.sh`, `docker compose config` on the real compose files, and `init/create-bucket.sh`, with only external programs stubbed (T003) and the fixture clone (T004). Docker-dependent ones (A1, A7, A8) are skipped with `node:test`'s skip when `docker` is absent. Record each red (todo flag removed) in `tdd/cycle-log.md` before committing the todo form. A5 is opened by T006 (`tests/verify.sql`).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the canonical schema file, which every story's database depends on.

**⚠️ CRITICAL**: no user story work starts before this phase is complete.

- [X] T005 [P] [U38] [U39] [U40] Test `F/tests/schema-drift.test.mjs`. It extracts the five ```` ```sql ```` blocks from `W/docs/01-getting-started.md` and asserts that `F/db/ob1-schema.sql` contains them verbatim and in order. It also asserts the file:
  - starts with `create extension if not exists vector;` then `set role postgres;`;
  - ends with `reset role;` (research R7; data-model.md Schema objects).
- [X] T006 [P] [U41] [U42] [U43] [U44] [U45] [U46] Test `F/tests/verify.sql` (fork-ci SQL runtime): create a scratch database with a **unique name per run** and **no DROP**; in it, create `auth.role()` as fork-ci's bootstrap does; apply `../db/ob1-schema.sql`; then `RAISE EXCEPTION` unless:
  - `thoughts.embedding` is `vector(1536)`;
  - `match_thoughts` and `upsert_thought` exist;
  - `service_role` has INSERT on `thoughts`;
  - RLS is on;
  - `thoughts` is owned by `postgres`.

  (research R7; FR-006, FR-011; data-model.md Schema objects)
- [X] T007 [U38] [U39] [U40] [U41] [U42] [U43] [U44] [U45] [U46] Create `F/db/ob1-schema.sql` so that T005 and T006 pass (research R7; FR-006).
- [X] T008 Early gate run (plan Notes): run the OB1 gate's review checks locally over `F` with the upstream title `[recipes] Lean self-hosted Supabase for Open Brain`. Confirm "No credentials" and "SQL safety" pass (README and metadata may still fail at this point). Record the result in the T008 line in `M`. **Done 2026-11-26 at `92d04ce`** (13 files changed against the 004 merge `062b573`): 14 of 15 rules pass, including "No credentials" and "SQL safety" on the schema, `verify.sql` and the tests' stand-in placeholder keys. The only failure is "README completeness", expected for the skeleton README.

- [X] T051 [A5] Outer loop: A5 green. `tests/verify.sql` passes as a whole against a fresh Postgres (FR-006, FR-011).

**Checkpoint**: schema ready and verified.

---

## Phase 3: User Story 1 - Run my own Open Brain on my own machine (Priority: P1) 🎯 MVP

**Goal**: one setup command and one start command give a brain whose six MCP tools work, with data on the owner's machine and no Kubernetes.

**Independent Test**: quickstart V1–V4, V6, V8 (on the Mac in `S`).

### Tests for User Story 1 (MANDATORY) ⚠️

> Write these tests FIRST and make sure they FAIL. The `[U#]`/`[A#]` markers are added by the `after_tasks` hook.

`setup.sh` behaviors, in `F/tests/setup.test.mjs`, one test per contract row (contracts/setup-and-stack.md C1; data-model.md Setup piece):

- [X] T009 [P] [US1] [U1] [U2] [U3] Missing `docker`, `git` or `openssl` → non-zero exit naming the tool; nothing created.
- [X] T010 [P] [US1] [U4] [U5] [U21] Fresh folder → the stub `git` sees a shallow clone of tag `self-hosted/v0.8.5` (R1). The output reports `clone`, `secrets` and `model-settings` completed and `function-link` present (data-model.md Setup piece).
- [X] T011 [P] [US1] [U8] [U9] [U10] [U11] [U19] Fresh folder → `supabase/docker/.env` holds the generated keys and none equals its `.env.example` value; `MCP_ACCESS_KEY` is 64 hex characters; the blank model-setting names are present; no key value appears in stdout or stderr (FR-002; data-model.md Secrets file.MCP_ACCESS_KEY, Secrets file.EMBEDDING_*/CHAT_*).
- [X] T012 [P] [US1] [U12] [U13] Generation fails partway (the stub `generate-keys.sh` exits non-zero) → non-zero exit and **no** `.env` left behind; the next run completes `secrets` (R6; Story 1, scenario 6).
- [X] T013 [P] [US1] [U16] Second run with nothing changed → every piece "already present", exit 0, and `.env` byte-identical (Story 1, scenario 4; SC-007).
- [X] T014 [P] [US1] [U14] [U15] `.env` without `MCP_ACCESS_KEY` or without the model-setting names → only those are added; every other line is unchanged (C1).
- [X] T015 [P] [US1] [U17] [U18] `.env` missing a Supabase key, or one at its example value → non-zero exit naming the key; `.env` unchanged (R6; C1).
- [X] T016 [P] [US1] [U6] Clone at another tag → non-zero exit naming both tags; nothing changed (spec edge case; C1).
- [X] T017 [P] [US1] [U7] `docker compose config -q` fails (stub `docker`) → non-zero exit naming the version found and the tested versions (R2; C1).
- [X] T018 [P] [US1] [U20] Checkout without `integrations/self-hosted-llm-mcp/` → non-zero exit saying 004's folder is missing (data-model.md Setup piece.function-link).
- [X] T019 [P] [US1] [U22] After a fresh run, `git status --porcelain` in the temporary repo shows nothing: everything setup wrote is under the ignored `supabase/` (FR-019; contract C1 invariants).

Stack configuration, in `F/tests/compose.test.mjs`. Each test runs `docker compose config` on the real `F/docker-compose.yml` with the clone replaced by the T004 fixture. With no `docker`, each test is **skipped with `node:test`'s skip**, never passed (R10):

- [X] T020 [P] [US1] [U24] [U27] The default service set is exactly `api-gw db functions ob1-init rest storage`. `auth`, `realtime`, `supavisor`, `studio`, `meta` and `imgproxy` are absent (FR-004; data-model.md Service sets.always-on).
- [X] T021 [P] [US1] [U28] [U29] [U30] `api-gw` has no dependency on `studio`; `storage` depends only on `db` (healthy) and `rest`, and has `ENABLE_IMAGE_TRANSFORMATION` `"false"` (R2, R3).
- [X] T022 [P] [US1] [U32] [U33] [U34] `functions` mounts the repo's `integrations/self-hosted-llm-mcp` read-only at `/home/deno/functions/self-hosted-llm-mcp`, resolved from the relative path. It passes `MCP_ACCESS_KEY`, `EMBEDDING_*`, `CHAT_*` and `FETCH_TIMEOUT_MS`, and maps `host.docker.internal` to `host-gateway` (R8, R12; FR-007, FR-008).
- [X] T023 [P] [US1] [U35] `db` mounts `F/db/ob1-schema.sql` read-only at `/docker-entrypoint-initdb.d/migrations/99-ob1-schema.sql`, and the official mounts are still present (R7).

### Implementation for User Story 1

- [X] T024 [US1] [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] [U10] [U11] [U12] [U13] [U14] [U15] [U16] [U17] [U18] [U19] [U20] [U21] [U22] `F/setup.sh` (POSIX `sh`), driven by T009–T019 (contract C1; data-model.md Setup piece, Secrets file).
- [X] T025 [US1] [U24] [U27] [U28] [U29] [U30] [U32] [U33] [U34] [U35] `F/docker-compose.yml` (`include:` with path list and `env_file`) and `F/lean.override.yml`, driven by T020–T023 (R2, R3, R7, R8, R12).
- [X] T060 [US1] [U53] Added mid-loop after the advisor review: an empty `.env` left by an interrupted Compose check is treated as absent and completed (`F/setup.sh`, `F/tests/setup.test.mjs`).
- [X] T026 [US1] README for Story 1 in `F/README.md`. It must cover:
  - **What it does**, with positioning against `recipes/local-brain-no-mcp` and `integrations/kubernetes-deployment` (FR-015) and the services left out and their costs (FR-014).
  - **Prerequisites**: Docker with a recent Compose (tested v5.6.1), `git`, `openssl`, a model server meeting spec 004's requirements (link `../../integrations/self-hosted-llm-mcp/`).
  - **Steps**: setup → fill the model settings in `supabase/docker/.env` (host route through `http://host.docker.internal:<port>/v1`, C4) → `docker compose up -d` → the setup check `curl` → `claude mcp add --transport http …?key=…` (read `MCP_ACCESS_KEY` from `.env`).
  - A `psql` route through `docker compose exec db psql -U postgres` for any SQL Editor step in other OB1 docs (FR-013).
  - The JWT warning (FR-016) and local and LAN access only (FR-018).
  - Recreate rather than restart after setting changes (R8).
  - Adding more OB1 functions next to 004's (FR-021).
  - Stop, remove, data locations, and the dump command (FR-020).
  - **Expected outcome**; a link to `docs/05-tool-audit.md`.
- [X] T027 [US1] `F/metadata.json` complete: category `recipes`; requires Docker, git, openssl; `estimated_time` is a placeholder until T037 (SC-001). **Done at `f578677`; `estimated_time` "45 minutes" stays a placeholder until T037 measures it.**

- [X] T052 [US1] [A1] Outer loop: A1 green, flipped from todo in the commit that makes it pass (US1.1, FR-004).
- [X] T053 [US1] [A2] Outer loop: A2 green (US1.4).
- [X] T054 [US1] [A3] Outer loop: A3 green (US1.6).
- [X] T055 [US1] [A4] Outer loop: A4 green (FR-002, FR-019).
- [X] T056 [US1] [A8] Outer loop: A8 green (FR-007, FR-008).
- [X] T057 [US1] [A9] Outer loop: A9 green (SC-002).

**Checkpoint**: Story 1 is complete in code and docs; it's proven live in T037.

---

## Phase 4: User Story 2 - Storage ready for files (Priority: P2)

**Goal**: a private `ob1-files` bucket that verifiably stores and returns files, on a named volume.

**Independent Test**: quickstart V5, V8 (files part).

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T028 [P] [US2] [U31] [U36] In `F/tests/compose.test.mjs`: `storage` uses the named volume `ob1-storage` at `/var/lib/storage`, with no bind mount there. `ob1-init` depends on `storage` being healthy, never restarts, and gets the service-role key (R3, R9; data-model.md Storage.Files, Storage.Bucket).
- [X] T029 [P] [US2] [U47] [U48] [U49] [U50] [U51] [U52] In `F/tests/create-bucket.test.mjs`: run `F/init/create-bucket.sh` with a stub `curl` on `PATH`. Create answers 200 → exit 0 and "ready". Create answers 400 with `BucketAlreadyExists` → exit 0. Any other failure → non-zero, with the status in the output. The request asks for a **private** bucket named `ob1-files`. The key is never printed (FR-009; data-model.md Storage.Bucket).

### Implementation for User Story 2

- [X] T030 [US2] [U31] [U36] [U47] [U48] [U49] [U50] [U51] [U52] `F/init/create-bucket.sh`, mounted into `ob1-init` by `F/lean.override.yml`, driven by T028 and T029 (R9).
- [X] T031 [US2] README storage section in `F/README.md`:
  - the storage check (upload a file to `ob1-files` with the service-role key, download it, `cmp`, then show a request without credentials refused) (FR-011; Story 2);
  - files live in the Docker volume `ob1-storage`, and **`docker compose down -v` deletes them** (R3; FR-020);
  - the `images` profile exists for later image transformations and enables nothing by itself (plan Notes).

- [X] T058 [US2] [A6] Outer loop: A6 green (US2.1, FR-009).

**Checkpoint**: Story 2 is complete in code and docs; it's proven live in T037.

---

## Phase 5: User Story 3 - Web UI only when I want it (Priority: P3)

**Goal**: Studio as an opt-in add-on.

**Independent Test**: quickstart V7.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T032 [P] [US3] [U25] [U26] In `F/tests/compose.test.mjs`: with `--profile ui` the set adds exactly `studio` and `meta`. With `--profile images` it adds exactly `imgproxy` (FR-005; data-model.md Service sets.ui, Service sets.images).

### Implementation for User Story 3

- [X] T033 [US3] [U25] [U26] Profiles in `F/lean.override.yml`, driven by T032 (R2).
- [X] T034 [US3] README UI section in `F/README.md`: start and stop commands (contract C2), the dashboard user and password from `.env`, the Studio URL `http://localhost:8000`. Add what starting the UI does while the stack is stopped once T037 records it (OS-009). **Done at `f578677`, except the OS-009 sentence, which waits for T037.**

- [X] T059 [US3] [A7] Outer loop: A7 green (US3.1, FR-005).

**Checkpoint**: all three stories are complete in code and docs.

---

## Phase 6: Bundled model server (Docker Model Runner) — FR-017, SC-011 [US1]

- [X] T035 [US1] **Ask the owner first: it changes a Docker Desktop setting.** R5 probe on the Mac:
  1. `docker desktop enable model-runner`.
  2. `docker model pull` a chat model and an embedding model from DMR's catalog.
  3. POST `/engines/v1/embeddings` with `dimensions: 1536`, then record the vector length, the model names, and whether Metal is used.
  4. Check whether DMR's port is reachable from another machine on the LAN (OS-010).

  Record the results in `M/specs/006-self-hosted-supabase/research.md` R5, with evidence in `M/specs/006-self-hosted-supabase/evidence/dmr/`. **Done 2026-11-26:** embeddings come back at 2560 whatever `dimensions` says, so DMR is chat-only; chat on Metal works; reachable from containers; not reachable from the LAN (OS-010).
- [X] T036 [US1] (Superseded after the live run: the section was added at `c29d91c`, then removed at `85866d6` by owner decision; the README now says Docker Model Runner is not supported.) README section "Bundled model server (Docker Model Runner)" in `F/README.md`, following T035:
  - enable DMR, then `docker model pull` per model (manual, FR-017);
  - `CHAT_API_BASE` (and `EMBEDDING_API_BASE` only if T035 shows 1536) = `http://model-runner.docker.internal/engines/v1` (C4);
  - otherwise, the chat-only fallback with embeddings through the host route.

---

## Phase 7: Live acceptance (SC-010)

- [ ] T037 **Mac run** in scratch checkout `S`. Follow quickstart V1–V12, including V10 (DMR) per T035 and V8's reboot (the owner reboots). Evidence goes in `M/specs/006-self-hosted-supabase/evidence/mac/`, with no key values. Record:
  - elapsed setup time (SC-001), which then goes into `F/metadata.json` `estimated_time` and the README;
  - OS-009's result, which then goes into T034's README text.

  Remove `S` afterwards.
- [ ] T038 **Linux run** (SC-010) on a Linux machine the owner provides: V1–V9, V11, V12, plus V10 if DMR is installed there. Record the Compose version (R2) and whether `host-gateway` works (R12). Evidence goes in `M/specs/006-self-hosted-supabase/evidence/linux/`. Update the README's "Tested with" table for both runs.

---

## Phase 8: Gate self-check & landing

**Purpose**: pass every constitution Quality Gate, then land in the lane.

- [ ] T039 Refactor with all tests green (red-green-REFACTOR).
- [ ] T040 [P] `F/metadata.json` validates against `W/.github/metadata.schema.json`.
- [ ] T041 [P] `markdownlint-cli2 --config .github/.markdownlint.jsonc "recipes/self-hosted-supabase-mcp/**/*.md"` in `W`.
- [ ] T042 [P] README check: Prerequisites, numbered steps, Expected Outcome, every relative link resolves (in `W`, where 004's folder exists), and the `docs/05-tool-audit.md` link.
- [ ] T043 [P] Secret, binary, profanity and SQL-safety scan of `F`, plus the OB1 gate's review checks run locally with the upstream title (all rules; SC-008).
- [ ] T044 TDD audit: `/speckit-tdd-verify` writes `M/specs/006-self-hosted-supabase/tdd/verification.md` with verdict PASS or PASS_WITH_GAPS (Quality Gate 1).
- [ ] T045 Scope check: `git -C W diff --stat main...HEAD`, run against fork `main`, which has 004, lists only `recipes/self-hosted-supabase-mcp/`.
- [ ] T046 **Fork landing, asking the owner before each push or PR.**
  1. `git -C W push -u origin contrib/mfelker/self-hosted-supabase`.
  2. `gh pr create -R mfelker/OB1 --base main --head contrib/mfelker/self-hosted-supabase --title "[recipes] Lean self-hosted Supabase for Open Brain (fork landing)"`. The `[category]` title is required by the gate's PR-format rule; the body ends with the "Generated with Claude Code" line only.
  3. When `fork-ci-verdict` and `OB1 Review` are green, the **owner** merges with `--merge`.
  4. Add the ledger row in `M/.fork/staged-prs.md`, kind `own`, upstream PR "to be opened".
- [ ] T047 **After upstream #533 merges**:
  1. `git -C W rebase --onto upstream/main <T001 merge commit>`.
  2. `git diff --stat upstream/main...HEAD` lists only `recipes/self-hosted-supabase-mcp/` (Principle V).
  3. Re-run all tests and T042's link check.
  4. Record the old-to-new SHA mapping in `tdd/cycle-log.md` (plan Notes).
- [ ] T048 **Upstream PR, after T038 and T047. Ask the owner first.** `gh pr create -R NateBJones-Projects/OB1 --head mfelker:contrib/mfelker/self-hosted-supabase --title "[recipes] Lean self-hosted Supabase for Open Brain"`, with the body from `.github/PULL_REQUEST_TEMPLATE.md` (Recipe), ending with the "Generated with Claude Code" line only. Update the ledger row.
- [ ] T049 After the upstream PR merges or closes: remove `W` and the local branch, and reconcile the ledger.

---

## Dependencies & Execution Order

- **Setup (T001–T004)**, then **T050** (outer loop opened as todo tests) → **Foundational (T005–T008, T051)** → stories.
- Each story ends with its outer-loop tasks: US1 T052–T057, US2 T058, US3 T059. The story isn't complete until they're green.
- **US1 (T009–T027)** is the MVP. T024 depends on T009–T019; T025 on T020–T023.
- **US2 (T028–T031)** needs T025's override file; it's otherwise independent of US1's setup work.
- **US3 (T032–T034)** needs T025.
- **DMR (T035–T036)**: T035 waits for the owner's OK; T036 follows it.
- **Live (T037–T038)** needs US1–US3 and T036. T038 needs a Linux machine.
- **Landing**: T039–T045 → T046 (fork) → T047 (after #533) → T048 (after T038 and T047) → T049.

### Parallel Opportunities

- T003 and T004.
- T005 and T006.
- All of T009–T023 are separate tests in two files (`setup.test.mjs` and `compose.test.mjs`), written in parallel and driven one at a time by the TDD loop.
- T028 and T029; T040–T043.

## Parallel Example: User Story 1

```bash
Task: "Setup test: fresh folder clones the pin and reports pieces (T010) in F/tests/setup.test.mjs"
Task: "Compose test: default service set is exactly the always-on set (T020) in F/tests/compose.test.mjs"
```

## Implementation Strategy

- **MVP = Phase 1, Phase 2 and US1 (T001–T027, T050–T057).** At that point setup works, the stack starts lean, and spec 004's six tools are served. Validate with quickstart V1–V4 in `S` before going further.
- Then add US2 (Storage) and US3 (UI). Then do DMR, the live runs, and landing.
- Upstream timing: the fork lands first (T046). The upstream PR waits for #533 (T047) and the Linux run (T048).

## Notes

- Test-first for every behavior; the reds are recorded in `M/specs/006-self-hosted-supabase/tdd/cycle-log.md`.
- No test uses the network, live credentials, or real Supabase files: stubbed `git`, `docker` and `curl`, the fixture clone and the fixture compose file (Principle IV; R10).
- Commit in `W` with `[recipes]` prefixes; spec and ledger updates go on `M` with `[fork]` prefixes.
