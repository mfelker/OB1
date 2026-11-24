---

description: "Task list for Fork CI (per-folder test enforcement)"
---

# Tasks: Fork CI (per-folder test enforcement)

**Input**: Design documents from `/specs/001-fork-ci/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: MANDATORY (constitution Principle IV, NON-NEGOTIABLE). Each test task is written first and must **fail** (run red) before its implementation task. Run tests with `node --test .fork/ci/test/`.

**Organization**: Tasks are grouped by user story (spec.md US1–US4). Lane enforcement (FR-012) and SQL verification (FR-011) are cross-cutting phases after the stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Lane: **fork feature**. `<ROOT>` = `/Users/mfelker/Projects/ob1` (the fork-`main` checkout, on branch `fork/fork-ci`). All paths below are relative to `<ROOT>`.
- Only fork-only paths are created or edited: `.fork/ci/**`, `.fork/README.md`, `.github/workflows/fork-ci.yml` (new file). **No upstream-tracked file is touched** (FR-009, SC-006).
- Logic: `.fork/ci/lib/*.mjs` · CLIs: `.fork/ci/bin/*.mjs` · Tests: `.fork/ci/test/*.test.mjs` · Fixtures: `.fork/ci/test/fixtures/` · Test helpers: `.fork/ci/test/helpers/`
- Constrained fields are cited as `data-model.md` `Entity.field`; contracts as `contracts/<file>`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory layout, test helpers and fixtures used by every story

- [ ] T001 Create the directory layout `.fork/ci/{lib,bin,sql,test/fixtures,test/helpers}` and a stub `.fork/ci/README.md` stating purpose, layout (per plan.md Project Structure), and the test command `node --test .fork/ci/test/`
- [ ] T002 [P] Write the smoke test `.fork/ci/test/git-fixture.test.mjs` first (it must fail), then create the temp-git-repo helper `.fork/ci/test/helpers/git-fixture.mjs` exporting `makeRepo()`, `writeFiles(repo, map)`, `commit(repo, msg) → sha`, `branch()`, `merge(repo, ref, {noFf, message})`, `addRemoteRef(repo, name, sha)` using `node:child_process` + `fs.mkdtemp`, until the smoke test passes
- [ ] T003 [P] Create the fixture folder trees under `.fork/ci/test/fixtures/` (used as file maps by tests): `deno-tested/` (`deno.json`, `index.ts`, `index_test.ts`), `deno-untested/`, `node-script/` (`package.json` with a `test` script + `src/__tests__/a.test.ts`), `node-plain/` (`lib/x.js`, `lib/__tests__/x.test.js` using `node:test`), `node-plain-failing/`, `node-plain-slow/` (test sleeps 5 s), `python-tested/` (`imp.py`, `tests/test_imp.py`), `mixed-server/` (`deno.json`, `package.json` test script, `index.ts`, `test-stateless.mjs`), `nested-plugin/` (`plugin/package.json` + test), `docs-only/` (`README.md`, `metadata.json`, `skill.md`), `tests-no-runner/` (`a.ts`, `a.test.ts`, no `deno.json` or `package.json`), `config-only/` (`vite.config.ts`, `README.md`), `sql-only/` (`schema.sql`), `sql-verify/` (`schema.sql`, `tests/verify.sql`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Path mapping, diff computation, CLI arg contract, the workflow skeleton, and the GitHub-behavior spike

**⚠️ CRITICAL**: No user story work can begin until this phase is complete, and the spike (T011) must confirm R4, R9 and R11 before Phase 7 touches `main`

- [ ] T004 [P] Write failing tests `.fork/ci/test/paths.test.mjs`: path → folder mapping for all 7 categories and `server` (`data-model.md` `Changed Folder.path`, `Changed Folder.category`); fork-only paths (`.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`), `_template/`, and other paths (`docs/`, `.github/`, root files) are dropped and counted (`contracts/cli.md` `skipped`)
- [ ] T005 [P] Write failing tests `.fork/ci/test/changes.test.mjs` using `git-fixture.mjs`: PR mode diffs `base...head` from the merge-base (fork `main` ahead of the branch base does not leak in); push mode `before..after`; all-zero `before` falls back to `after~1..after`; changed paths are grouped per folder as `data-model.md` `Changed Folder.changedFiles`; a folder deleted at head yields `data-model.md` `Changed Folder.status` = `removed`
- [ ] T006 [P] Write failing tests `.fork/ci/test/args.test.mjs`: argument parsing for `detect`, `run-folder`, `verdict` per `contracts/cli.md`; missing or invalid args → exit code `2` with a usage message
- [ ] T007 Implement `.fork/ci/lib/paths.mjs` until T004 passes
- [ ] T008 Implement `.fork/ci/lib/changes.mjs` (git via `child_process.execFileSync`, git error → exit `3`) until T005 passes
- [ ] T009 Implement `.fork/ci/lib/args.mjs` and stub CLIs `.fork/ci/bin/detect.mjs`, `.fork/ci/bin/run-folder.mjs`, `.fork/ci/bin/verdict.mjs` (stubs honor the arg contract; `run-folder` writes a minimal result and exits non-zero when a `SPIKE_FAIL` file exists in the folder, which is used only by the spike) until T006 passes
- [ ] T010 Create the workflow skeleton `.github/workflows/fork-ci.yml` per `contracts/check.md`:
  - triggers `pull_request` + `push` on `main` **and temporarily `spike/fork-ci-*`**, plus `workflow_dispatch`; no path filters
  - `permissions: contents: read`; concurrency
  - jobs `detect`, `test` (matrix, `fail-fast: false`, `timeout-minutes: 20`, `if: has_folders == 'true'`) and `fork-ci-verdict` (`if: always()`, reading `needs.*.result`)
  - every checkout uses `fetch-depth: 0`, `persist-credentials: false`
  - toolchain pins per research R12 (Node 26, Python 3.13, Deno v2.9.x)
- [ ] T011 **Owner-approved spike** (quickstart.md §4), using a throwaway ruleset on `refs/heads/spike/fork-ci-*` only:
  - push `spike/fork-ci-base`
  - open PRs (a) cut from `upstream/main`, (b) containing a `SPIKE_FAIL` marker, (c) fork-only edits
  - direct-push to the base
  - record the observed behavior for R4 (the workflow and `.fork/ci` are present on the merge ref), R9 (a skipped or failing `test` job with the always-run verdict; an empty matrix) and R11 (the bypass message on push; merge button disabled; the bypass checkbox; `actor_id` of the admin role) in a new "Spike results" section of `specs/001-fork-ci/research.md`
  - delete the spike ruleset and the scratch PR branches, but **keep `spike/fork-ci-base`**, because T026, T038, T044 and T053 validate against it (T055 removes it). **Stop and amend research if any assumption fails.**

**Checkpoint**: Foundation ready and GitHub behavior confirmed. User story work can begin.

---

## Phase 3: User Story 1 - Changed code is tested before it lands (Priority: P1) 🎯 MVP

**Goal**: Each changed folder's tests run with the right runner, and a per-folder + overall verdict is reported

**Independent Test**: A scratch PR that changes a folder with passing tests and a folder with a failing test shows one ✅, one ❌, and an overall ❌ naming the failing folder

### Tests for User Story 1 (MANDATORY) ⚠️

> **Write these tests FIRST and make sure they FAIL before implementation**

- [ ] T012 [P] [US1] Write failing tests `.fork/ci/test/runtimes.test.mjs`. Using the fixtures from T003, check the detection of the `deno`, `node-script`, `node-plain` and `python` runtimes:
  - `data-model.md` `Runtime.kind`, `Runtime.root` (nested `plugin/` root), `Runtime.codeFiles` (with `*.d.ts` and `*.config.*` excluded; `.svelte` counted), `Runtime.testFiles` (patterns per research R8, including `*.spec.*`), `Runtime.command`
  - the deno argv includes `--node-modules-dir=none --no-prompt --allow-env --allow-read` and **no** `--allow-net`
- [ ] T013 [P] [US1] Write failing tests `.fork/ci/test/exec.test.mjs`: a command runner with a timeout that returns `{code, timedOut, durationMs, tail}`; `tail` is the last 60 lines; a timeout kills the process tree
- [ ] T014 [P] [US1] Write failing tests `.fork/ci/test/run-folder.test.mjs` (integration):
  - `node-plain` passes → `data-model.md` `Folder Result.outcome` `pass`; `node-plain-failing` → `fail`; `node-plain-slow` with `--timeout-sec 1` → `timeout`; a broken install → `setup`
  - `python-tested` and `deno-tested` run when `python3`/`pytest` and `deno` are available; skipped with a note locally, but when `CI=true` a missing toolchain is a **test failure**, not a skip
  - every result validates against `contracts/result.schema.json` (minimal required/enum validator in the test)
  - `Folder Result.runtimes` is populated
- [ ] T015 [P] [US1] Write failing tests `.fork/ci/test/verdict.test.mjs`:
  - outcome precedence `timeout > setup > fail > no-tests > sql-unverified > pass > exempt` (`data-model.md` `Folder Result.outcome`)
  - `data-model.md` `Check Verdict.conclusion` rules: detect not success → failure; strict fail → failure; a strict matrix folder with no result file → listed in `Check Verdict.missing` and failure; all pass → success
  - `Check Verdict.failing` and `Check Verdict.counts` are populated
- [ ] T016 [P] [US1] Write failing tests `.fork/ci/test/report.test.mjs`: the job-summary Markdown matches the `contracts/check.md` Report section (header with conclusion, table columns Folder/Mode/Origin/Outcome/Runtimes/Reason, removed/skipped line); every non-pass row has a reason category (SC-007)
- [ ] T017 [P] [US1] Write failing tests `.fork/ci/test/detect.test.mjs` (integration with `git-fixture.mjs`): stdout JSON shape per `contracts/cli.md` (`has_folders`, `matrix.include[]` entries `{path, mode, origin, needsPostgres}`, `removed`, `skipped`); two changed folders → two matrix entries

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement `.fork/ci/lib/runtimes.mjs` (folder scan excluding `node_modules/`; runtime and command selection per research R8) until T012 passes
- [ ] T019 [P] [US1] Implement `.fork/ci/lib/exec.mjs` (`spawn` with `detached` process group, kill on timeout, tail capture) until T013 passes
- [ ] T020 [US1] Implement `.fork/ci/bin/run-folder.mjs`, replacing the stub; remove the `SPIKE_FAIL` behavior:
  - per runtime: install (`npm install --no-audit --no-fund` / `pip install -r requirements.txt` + `pytest`) then test, inside `Runtime.root`
  - map exit codes to outcomes per the `data-model.md` *Folder Result* runtime outcome rules
  - fill `data-model.md` `Folder Result.path` (plus mode and origin, copied from the matrix entry), `Folder Result.reason` and `Folder Result.durationMs`
  - always write `--out` and exit 0
  - run until T014 passes
- [ ] T021 [P] [US1] Implement `.fork/ci/lib/verdict.mjs` until T015 passes
- [ ] T022 [P] [US1] Implement `.fork/ci/lib/report.mjs` until T016 passes
- [ ] T023 [US1] Implement `.fork/ci/bin/detect.mjs`, replacing the stub: `paths` + `changes` + `runtimes` → matrix; for now every folder is `origin: fork`, `mode: strict` (origin arrives in US4) and `needsPostgres: false` (SQL arrives in Phase 8); run until T017 passes
- [ ] T024 [US1] Implement `.fork/ci/bin/verdict.mjs`, replacing the stub: read the detect JSON and `result-*.json`, carry `removed` into `data-model.md` `Check Verdict.removed`, compute the verdict, write `--summary`, exit 0/1
- [ ] T025 [US1] Complete the `test` and `fork-ci-verdict` jobs in `.github/workflows/fork-ci.yml`:
  - `test`: set up Node/Python/Deno, run `run-folder.mjs` per matrix entry, upload `result-<slug>` with `actions/upload-artifact@v4`
  - `fork-ci-verdict`: download all results with `actions/download-artifact@v4`, run `verdict.mjs` with `--detect-result ${{ needs.detect.result }} --test-result ${{ needs.test.result }} --test-sql-result skipped --self-test-result skipped` (the literal `skipped` values are replaced by real `needs.*.result` in T037 and T052, once those jobs exist), write `$GITHUB_STEP_SUMMARY`
- [ ] T026 [US1] Validate with quickstart.md §1–§3 locally (`recipes/vercel-neon-telegram` → pass), then with scratch PRs to `spike/fork-ci-base`:
  - a PR touching 3 code folders: record the wall-clock time from PR open to `fork-ci-verdict` result in `research.md` Spike results; it must be under 10 minutes (SC-003)
  - break one Vitest assertion in `recipes/vercel-neon-telegram` → overall ❌ naming it
  - revert → ✅

**Checkpoint**: The MVP works. Changed folders with tests are run and judged.

---

## Phase 4: User Story 2 - Untested code is caught (Priority: P1)

**Goal**: Strict folders whose code runtimes lack tests fail with a clear reason; docs-only folders are exempt

**Independent Test**: Changing a code file in a folder without tests fails with "no tests for <runtime> code"

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T027 [P] [US2] Add failing cases to `.fork/ci/test/runtimes.test.mjs` and `.fork/ci/test/run-folder.test.mjs`:
  - `deno-untested` → `no-tests`, reason "no tests for deno code"
  - `mixed-server` → `node-script` runtime `pass`, `deno` runtime `no-tests`, folder `no-tests` (research R7, amended FR-006; `data-model.md` `Folder Result.runtimes`)
  - `docs-only` and `config-only` → `exempt` (`data-model.md` `Runtime.codeFiles` empty)
  - `tests-no-runner` → `setup`, reason "tests found but no runner configured"
- [ ] T028 [P] [US2] Add failing cases to `.fork/ci/test/report.test.mjs`: `no-tests` rows show the runtime name; `exempt` rows show "docs-only"

### Implementation for User Story 2

- [ ] T029 [US2] Extend `.fork/ci/lib/runtimes.mjs` and `.fork/ci/bin/run-folder.mjs` with the per-runtime strict rule, exemption, and the no-runner `setup` outcome until T027 passes
- [ ] T030 [US2] Extend `.fork/ci/lib/report.mjs` until T028 passes
- [ ] T031 [US2] Validate: `node .fork/ci/bin/run-folder.mjs --path server --mode strict --origin fork --out /tmp/s.json` → `no-tests` with the deno reason (quickstart.md §3)

**Checkpoint**: US1 + US2 enforce strict TDD for owner changes.

---

## Phase 5: User Story 3 - Fork-only changes don't produce false failures (Priority: P2)

**Goal**: Changes touching only fork-only or non-contribution paths pass fast; fork-ci tests itself

**Independent Test**: A PR editing only `specs/` and `.fork/` passes in under 1 minute with 0 folders tested

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T032 [P] [US3] Add failing cases to `.fork/ci/test/detect.test.mjs`: only fork-only paths → `has_folders: false`, empty `matrix.include`, correct `skipped.forkOnly`; fork-only paths plus one folder → exactly that folder
- [ ] T033 [P] [US3] Add failing cases to `.fork/ci/test/verdict.test.mjs`: detect `success` + test `skipped` + 0 folders → `success`; detect `success` + test `skipped` + ≥1 folder → `failure`; self-test `failure` → `failure`
- [ ] T034 [P] [US3] Write failing tests `.fork/ci/test/self-test-needed.test.mjs`: returns true iff the changed paths include `.fork/ci/**` or `.github/workflows/fork-ci.yml`

### Implementation for User Story 3

- [ ] T035 [US3] Make `.fork/ci/bin/detect.mjs` and `.fork/ci/lib/verdict.mjs` pass T032–T033 (`--self-test-result`, already specified in `contracts/cli.md`)
- [ ] T036 [US3] Implement `.fork/ci/lib/self-test-needed.mjs` + `.fork/ci/bin/self-test-needed.mjs` until T034 passes
- [ ] T037 [US3] Add the `self-test` job to `.github/workflows/fork-ci.yml`:
  - compute "needed" with `self-test-needed.mjs` (inside the job, not a path filter)
  - set up the same toolchain as the `test` job (Node 26, Python 3.13 + `pytest`, Deno v2.9.x) so the Python and Deno integration tests really run, with `CI=true`
  - when needed, run `node --test .fork/ci/test/` and a pinned `actionlint` downloaded at runtime
  - feed its result into `fork-ci-verdict`
- [ ] T038 [US3] Validate: scratch PR to `spike/fork-ci-base` editing only `specs/001-fork-ci/quickstart.md` → ✅ in under 1 minute, 0 folders (SC-004); a PR changing `.fork/ci/lib/paths.mjs` runs `self-test`

**Checkpoint**: No false failures; fork-ci's own TDD is enforced in CI.

---

## Phase 6: User Story 4 - Upstream syncs are handled predictably (Priority: P2)

**Goal**: Folders whose content comes only from upstream are evaluated in advisory mode and never fail the verdict

**Independent Test**: A sync PR bringing changes to an untested upstream folder shows ⚠️ "untested (from upstream)" and an overall ✅

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T039 [P] [US4] Write failing tests `.fork/ci/test/origin.test.mjs` with `git-fixture.mjs` repos holding an `upstream` ref. Each case checks `data-model.md` `Changed Folder.origin` and `Changed Folder.mode` (research R6 table):
  - (a) sync merged locally → upstream/advisory
  - (b) sync via PR merge ref → upstream/advisory
  - (c) `contrib/` cut from a newer upstream: the untouched upstream folder is upstream/advisory and the owner's folder is fork/strict
  - (d) staged PR folder → fork/strict
  - (e) sync touching a fork-modified folder → fork/strict
  - (f) removed folder → `removed`
- [ ] T040 [P] [US4] Add failing cases to `.fork/ci/test/verdict.test.mjs` and `.fork/ci/test/report.test.mjs`: advisory `fail`/`no-tests`/`missing` never fail the verdict and land in `data-model.md` `Check Verdict.advisories`; report rows show "(from upstream)" (SC-008)

### Implementation for User Story 4

- [ ] T041 [US4] Implement `.fork/ci/lib/origin.mjs` (`git merge-base HEAD <upstream-ref>`, `git rev-parse <rev>:<folder>` comparison) until T039 passes
- [ ] T042 [US4] Wire origin into `.fork/ci/bin/detect.mjs` (`--upstream-ref`), and add an upstream fetch step to the `detect` job in `.github/workflows/fork-ci.yml`: `git fetch --no-tags https://github.com/NateBJones-Projects/OB1.git main:refs/remotes/upstream/main` (no credentials)
- [ ] T043 [US4] Extend `.fork/ci/lib/verdict.mjs` and `.fork/ci/lib/report.mjs` for advisory handling until T040 passes
- [ ] T044 [US4] Validate: scratch `sync/upstream-test` PR to `spike/fork-ci-base` that merges an upstream commit touching an untested folder → ⚠️ advisory row, overall ✅

**Checkpoint**: All four user stories work independently.

---

## Phase 7: Lane Enforcement (FR-012, cross-cutting)

**Purpose**: Make `stage/`/`contrib/` changes land through fork PRs, and flag local-merge bypasses

- [ ] T045 [P] Write failing tests `.fork/ci/test/bypass.test.mjs` with `git-fixture.mjs` covering the research R11 rule. Results go into `data-model.md` `Check Verdict.bypasses`:
  - **flagged**: a local merge of a branch cut from the upstream ref (or a PR head), with the default message *and* with a custom message such as `[fork] Stage upstream PR #12`
  - **not flagged**: a merge whose committer is `GitHub <noreply@github.com>` (a PR merge); a sync merge whose second parent is on the upstream ref; a local merge of a branch cut from fork `main` (`fork/` lane); a non-merge commit
  - `branch` is filled from a `Merge branch '…'` message when present, otherwise `unknown`
- [ ] T046 Implement `.fork/ci/lib/bypass.mjs` (research R11 rule), add `--bypass-range` and `--upstream-ref` handling to `.fork/ci/bin/verdict.mjs` (bypasses → failure, report line per `contracts/check.md`), and on `push` events in `.github/workflows/fork-ci.yml` give the `fork-ci-verdict` job a full-history checkout plus the credential-free upstream fetch and pass `${{ github.event.before }}..${{ github.event.after }}`, until T045 passes
- [ ] T047 Update `.fork/README.md`:
  - `stage/` and `contrib/` now land with `gh pr create -R mfelker/OB1 --base main` and merge after `fork-ci-verdict` passes, replacing the local `--no-ff` merge for those lanes
  - keep the local merge for `fork/` and syncs
  - document the optional `sync/upstream-<date>` PR, the fork-ci outcome meanings, and the ruleset

---

## Phase 8: SQL Verification (FR-011, cross-cutting)

**Purpose**: Run `tests/verify.sql` against a throwaway Postgres + pgvector when a folder provides one; otherwise report `sql-unverified` as advisory

- [ ] T048 [P] Add failing cases to `.fork/ci/test/runtimes.test.mjs` and `.fork/ci/test/detect.test.mjs`:
  - `sql-only` → `sql` runtime with `sql-unverified` (advisory even in strict mode)
  - `sql-verify` → `data-model.md` `Changed Folder.needsPostgres` = true and a `Runtime.kind` `sql` command of `psql -v ON_ERROR_STOP=1 -f tests/verify.sql` run in the folder
- [ ] T049 [P] Write failing tests `.fork/ci/test/bootstrap-drift.test.mjs`: the column list of `create table thoughts` parsed from `docs/01-getting-started.md` (read-only) equals the one in `.fork/ci/sql/bootstrap.sql`
- [ ] T050 Write `.fork/ci/sql/bootstrap.sql`: roles `anon`/`authenticated`/`service_role` (guarded with `DO` blocks), the `auth` schema with an `auth.uid()` stub, `create extension if not exists vector`, and the core `thoughts` table + indexes + `match_thoughts` copied from `docs/01-getting-started.md` with a provenance comment; no DROP/TRUNCATE/DELETE. Run until T049 passes
- [ ] T051 Implement the `sql` runtime in `.fork/ci/lib/runtimes.mjs` and `.fork/ci/bin/run-folder.mjs` (apply `bootstrap.sql`, then `tests/verify.sql`, with the `PG*` env from the job) until T048 passes
- [ ] T052 Have `.fork/ci/bin/detect.mjs` emit `sql_matrix` and `has_sql` (per `contracts/cli.md`), and add the `test-sql` job (per `contracts/check.md`) with a `pgvector/pgvector:pg17` service (throwaway literal password, not a secret) to `.github/workflows/fork-ci.yml`; pass `--test-sql-result` to `verdict.mjs`
- [ ] T053 Validate: scratch PR adding `.fork/ci/test/fixtures/sql-verify`-style `tests/verify.sql` with a failing assertion to a copy folder under `schemas/` on `spike/fork-ci-base` → ❌ `fail`; fix → ✅; SQL-only change without a verify script → ⚠️ `sql-unverified`

---

## Phase N: Gate Self-Check & Landing

**Purpose**: Pass every constitution Quality Gate, then land the feature and switch on enforcement

- [ ] T054 Refactor `.fork/ci/lib/*.mjs` and `.fork/ci/bin/*.mjs` with `node --test .fork/ci/test/` green throughout
- [ ] T055 Remove the temporary `spike/fork-ci-*` trigger pattern from `.github/workflows/fork-ci.yml`; delete any remaining spike branches and spike rulesets (owner-confirmed)
- [ ] T056 [P] Complete `.fork/ci/README.md`: outcomes and reason categories, strict vs advisory, the `tests/verify.sql` convention with an example, local commands, the toolchain pins
- [ ] T057 [P] Security and scope check: `grep -n 'secrets\.' .github/workflows/fork-ci.yml` returns nothing (SC-005); `git diff --stat upstream/main...fork/fork-ci` lists only fork-only paths (SC-006); no `pull_request_target`
- [ ] T058 [P] `markdownlint-cli2 --config .github/.markdownlint.jsonc ".fork/**/*.md" "specs/001-fork-ci/**/*.md"` and `actionlint .github/workflows/fork-ci.yml` pass
- [ ] T059 Run the quickstart.md §1–§3 validation once more; all expected outcomes hold
- [ ] T060 Land: open PR `fork/fork-ci` → `main` on the fork, so fork-ci verifies its own merge.
  - **Record test evidence in the PR description** (constitution Quality Gate 1): the `node --test .fork/ci/test/` pass/fail summary, the `actionlint` result, and the link to the green `fork-ci-verdict` run
  - the upstream **OB1 PR Gate** will be red on this PR, because its allowed-path list excludes `.fork/` and `specs/`; that is expected and advisory on fork-only PRs (constitution, Fork CI policy). Only `fork-ci-verdict` decides whether to merge
  - merge when `fork-ci-verdict` is green
- [ ] T061 **Owner step**: apply the `main` ruleset requiring `fork-ci-verdict` with the admin bypass (quickstart.md §5, using the `actor_id` confirmed in T011)
- [ ] T062 Run the quickstart.md §6 end-to-end table on `main` and record the results in `specs/001-fork-ci/checklists/requirements.md` notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; **blocks all stories**. T011 (spike) needs T010
- **US1 (Phase 3)**: depends on Phase 2. **MVP**
- **US2 (Phase 4)**: depends on US1 (extends `runtimes`/`run-folder`/`report`)
- **US3 (Phase 5)**: depends on US1 (`detect`/`verdict`); independent of US2
- **US4 (Phase 6)**: depends on US1; independent of US2/US3
- **Lane enforcement (Phase 7)**: depends on US1 (`verdict.mjs`)
- **SQL (Phase 8)**: depends on US1 + US2 (runtime model)
- **Landing (Phase N)**: depends on all of the above; T061 requires T060 (fork-ci on `main` first) and T011 (confirmed `actor_id`)

### User Story Dependencies

- **US1 (P1)**: after Foundational; no story dependencies
- **US2 (P1)**: after US1, same files, so sequential
- **US3 (P2)** and **US4 (P2)**: after US1. Their new modules (`self-test-needed`, `origin`) can be written in parallel, but both edit `bin/detect.mjs` and `lib/verdict.mjs`, so their wiring tasks (T035, T042, T043) and Phase 7's T046 run **sequentially**

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- `lib/` modules before `bin/` wiring before workflow YAML
- Validate on `spike/fork-ci-base` before moving on

### Parallel Opportunities

- T002, T003 in parallel; T004–T006 in parallel
- US1 tests T012–T017 all in parallel; then T018, T019, T021, T022 in parallel
- After US1: the test tasks T032–T034, T039–T040, T045 and the new modules T036, T041 can proceed in parallel; the shared-file wiring T035 → T042 → T043 → T046 is sequential
- Phase N: T056–T058 in parallel

---

## Parallel Example: User Story 1

```bash
# All US1 tests together (each must fail first):
Task: "runtimes.test.mjs in .fork/ci/test/"
Task: "exec.test.mjs in .fork/ci/test/"
Task: "run-folder.test.mjs in .fork/ci/test/"
Task: "verdict.test.mjs in .fork/ci/test/"
Task: "report.test.mjs in .fork/ci/test/"
Task: "detect.test.mjs in .fork/ci/test/"

# Then independent lib modules together:
Task: "Implement .fork/ci/lib/runtimes.mjs"
Task: "Implement .fork/ci/lib/exec.mjs"
Task: "Implement .fork/ci/lib/verdict.mjs"
Task: "Implement .fork/ci/lib/report.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational, including the **spike (T011)**
2. Phase 3 US1 → changed folders with tests are run and judged
3. **STOP and VALIDATE** on `spike/fork-ci-base` (T026)

### Incremental Delivery

1. MVP (US1) → run tests that exist
2. Add US2 → strict TDD: untested code fails
3. Add US3 → no false failures; fork-ci self-tests
4. Add US4 → syncs are advisory and predictable
5. Add Phase 7 → lane enforcement; add Phase 8 → SQL verification
6. Phase N → land via PR, then enable the ruleset on `main`

### Parallel Team Strategy

A single owner, possibly with parallel agents: after US1, parallel worktrees only for the independent tests and new modules (see Parallel Opportunities); the `detect.mjs`/`verdict.mjs` wiring stays on `fork/fork-ci` in one worktree, following the CLAUDE.md worktree rules.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- Verify tests fail before implementing; commit tests and implementation separately (`[fork] Test …` / `[fork] …`)
- The GitHub-settings steps (T011, T055 cleanup, T061) are **owner-approved actions**: confirm before running
- Never edit upstream-tracked files; if a task seems to require one, stop and revisit the plan
