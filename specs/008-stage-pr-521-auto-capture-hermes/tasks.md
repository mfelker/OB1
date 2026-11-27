---

description: "Tasks for staging upstream PR #521 (auto-capture Hermes adapter)"
---

# Tasks: Stage upstream PR #521 (auto-capture Hermes adapter)

**Input**: Design documents from `specs/008-stage-pr-521-auto-capture-hermes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY (constitution Principle IV). Staged lane: the tests cover the PR's behavior and must be green before the merge into fork `main`. **Exception (plan Complexity Tracking, owner decision 2026-11-27)**: PR #521 only adds files, so no valid base-red exists. Behaviors are graded `TEST_AFTER`, and no fork rule changes.

**TDD loop**: the `after_tasks` hook (`tdd.plan`) adds the `[U#]`/`[A#]` markers and writes `tdd/test-list.md`. `/speckit-implement` drives each marked behavior through the loop (`before_implement`, mandatory) and ticks the marked tasks itself. **Never tick a marked task by hand**; unmarked tasks are ticked when done.

**Owner-only actions**: `git push`, `gh pr create`, `gh pr merge` and the upstream comment are outward-facing. Prepare the exact command, then hand it to the owner or get explicit approval in the session.

## Path Conventions

- `M` = `/Users/mfelker/Projects/ob1` (fork-`main` checkout: specs, ledger, spec-kit commands)
- `W` = `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-521-auto-capture-hermes` (stage branch `stage/pr-521-auto-capture-hermes`)
- `F` = `W/skills/auto-capture-hermes` (the only folder the stage branch may change)
- `S` = `M/specs/008-stage-pr-521-auto-capture-hermes`, evidence in `S/evidence/`
- The author's four files (`README.md`, `SKILL.md`, `metadata.json`, `capture-hermes-session.mjs` in `F`) are **never edited** (plan, research R9).
- Every test child process runs with a constructed environment (research R5). No test reads the owner's `~/.hermes`, `SUPABASE_URL` or `MCP_ACCESS_KEY`.

---

## Phase 1: Setup

**Purpose**: Confirm the branches are where the plan says (plan § Branch map).

- [X] T001 Verify the stage worktree and branch (quickstart §0) in `W`:
  - `git -C W rev-parse --abbrev-ref HEAD` is `stage/pr-521-auto-capture-hermes`.
  - `git -C W log --oneline 238df6c..HEAD` lists exactly `b9cbd68`, `5cf07c0`, `f1f4536`.
  - `git -C W config rerere.enabled` is `true`.
  - `gh pr view 521 -R NateBJones-Projects/OB1 --json headRefOid,state` still shows head `b9cbd68fb989…` and state `OPEN`. If the head moved, re-fetch per quickstart §0 and update the plan's Lane SHA before continuing. If the PR is merged, stop and switch to the sync path (spec Edge Cases).
  - `git -C M log --oneline main..upstream/main` is empty after `git -C M fetch upstream`. If not, sync fork `main` first (merge, never rebase) and record it here.

---

## Phase 2: Foundational (test infrastructure; blocks all stories)

**Purpose**: The helpers every test uses. They are not tests themselves (plan Structure Decision).

- [X] T002 [P] Create `F/test-support/hermes-store.mjs` (research R4, data-model.md § Hermes session store). It exports a builder that writes a fresh `state.db` into a temp directory, with the `sessions` and `messages` columns listed in data-model.md, and helpers to add a session and a sequence of messages (role, content, `_compressed_summary`, order by insertion). It uses `node:sqlite` and falls back to the `sqlite3` CLI. When neither is available it reports that, so the suite can skip with a visible reason.
- [X] T003 [P] Create `F/test-support/run-adapter.mjs` (research R5, R7):
  - `runAdapter({ args, stdin, env })`: runs `process.execPath F/capture-hermes-session.mjs …` with an environment built only from `PATH`, `HOME` (temp), `HERMES_HOME`/`OB_HERMES_STATE_DB`, `OB_CAPTURE_ROOT` (temp) and the given extras; returns `{ code, stdout, stderr }` plus readers for the capture log, session state files and the retry queue (`data/capture-retry-queue/`, `dead/`).
  - `startIngestStub(statuses)`: an `http` server on `127.0.0.1:0` that records method, path, `x-brain-key` and the JSON body of each request, and answers with the given statuses in order (default 200 `{ "job_id": "job-1" }`); returns its URL and the recorded requests, and closes cleanly.
- [X] T004 Create `F/capture-hermes-session.test.mjs` with imports, a per-test temp-directory fixture (removed after each test) and the skip-with-reason guard from T002. No cases yet. `node --test capture-hermes-session.test.mjs` runs 0 tests and exits 0. Commit T002–T004 on the stage branch as `[skills] auto-capture-hermes: test support (synthetic Hermes store, adapter runner)`.

**Checkpoint**: helpers ready; story tests can be added.

---

## Phase 3: User Story 2 - Capture behavior proven by credential-free tests (P1) 🎯 MVP

**Goal**: Every capture rule in contracts/capture-cli.md and data-model.md § Capture payload has a passing test.

**Independent Test**: `cd F && env -i PATH="$PATH" HOME="$(mktemp -d)" node --test capture-hermes-session.test.mjs` passes with no credentials, no Hermes install and no network beyond loopback.

US2 goes before US1 because US1's check is only meaningful once the tests exist on the branch.

### Tests for User Story 2 (MANDATORY) ⚠️

> Staged lane: written against the author's code and green at the head. No base-red is possible (Complexity Tracking). Each test must fail if its behavior were removed (worthless-test rule).

- [X] T005 [US2] [A2] [U1] [U2] [U3] [U4] [U5] Turn filtering and order (FR-008, spec US2 scenario 2): a session with user/assistant prose, an assistant row with empty content, an assistant row with `_compressed_summary = 1`, plus `tool` and `session_meta` rows. `--dry-run --session <id>`: the payload `text` contains only the prose turns, in insertion order, labelled `[user]` / `[assistant]`; none of the excluded contents appear. Order follows insertion even when timestamps are out of order (U4); a message whose content is a JSON array of typed parts appears as its concatenated text parts (U5).
- [X] T006 [US2] [A3] [U6] [U8] Cron turns (FR-009, scenario 3): a `[Cronjob …]` user row appears labelled `[user:cron]`, and the header `Turns:` counts only real user turns. A session with 2 real user turns + 1 cron turn is skipped as `skipped:too_short` (U8). A user message that mentions `[Cronjob` but doesn't start with it is a real, counted `[user]` turn (U6).
- [X] T007 [US2] [A4] [U7] [U9] Short-session skip (FR-010, scenario 4): fewer real user turns than the threshold → exit 0, no payload on stdout, log disposition `skipped:too_short`. Exactly 3 real user turns (the default threshold) is captured (U7). With `OB_CAPTURE_MIN_USER_TURNS=1` a 1-turn session is captured (U9).
- [X] T008 [US2] [A5] [U10] [U11] [U12] [U13] Subagent skips (FR-010, scenario 5): `parent_session_id` set → `skipped:subagent`; title starting `Subagent:` → `skipped:subagent`; a title containing `Subagent:` later in the text is captured (U12). With a subagent session newer than a top-level one, `--latest` picks the top-level one.
- [X] T009 [US2] [U14] [U15] Payload shape (data-model.md § Capture payload, `text`, `source_label`, `source_type`, `auto_execute`): the header has Project (basename of `cwd`), Session, `Source: hermes:<source>`, Title; the body is wrapped in `<thought_content>`; a literal `<thought_content>` inside a turn is escaped.
- [X] T010 [US2] [A6] [U16] [U17] Size limit (FR-011, scenario 6; data-model.md § Capture payload `text`): with `OB_CAPTURE_MAX_CHARS=3000` and long turns, `text.length ≤ 3000`, the first and last turns' text are present, and the truncation marker appears between them (U17). A transcript that fits the limit is sent whole with no marker (U16).
- [X] T011 [US2] [A7] [U18] [U19] Import key (FR-012, scenario 7; data-model.md § Capture payload `import_key`): two dry-runs of the same session give the same key, matching `hermes:<id>:<8 hex>`; changing one message's content changes the key.
- [X] T012 [US2] [A1] [U20] Dry-run sends nothing (FR-013, scenario 1): with an ingest stub running and `SUPABASE_URL`/`MCP_ACCESS_KEY` pointing at it, `--dry-run` prints the payload, the stub records 0 requests, the log shows `dry_run:chars_<n>`, and no session state file is written.
- [X] T013 [US2] [A8] [U21] [U22] Missing configuration (FR-014, scenario 8): no `.env.local` and no address/key env → exit 0, log `error:missing_env`, a running stub records 0 requests. The same holds with only the address set (U21) and with only the key set (U22).
- [X] T014 [US2] [U23] Config from `.env.local` (contracts/capture-cli.md Inputs): `SUPABASE_URL`/`MCP_ACCESS_KEY` written only to `OB_CAPTURE_ROOT/.env.local` (pointing at the stub) → exactly 1 request is received with that key.
- [X] T015 [US2] [U24] Session lookup (INV-2 in tdd/test-list.md): `--session` with an unknown id → exit 0, log `skipped:no_session`. Prefix matching is out of scope (test list).
- [X] T016 [US2] [U35] [U36] [U37] [U38] [U39] Hook mode (contracts/capture-cli.md, hook rows) with `OB_CAPTURE_SYNC=1` and the stub returning 200: stdin with no `session_id` → `skipped:no_session_id:<event>`; event `on_tool_call` → `skipped:event_on_tool_call`; `on_session_finalize` → 1 request, the session state has `captured_at` and `ingest_ref` `job-1` (data-model.md § Session state), stdout is `{}`; a second fire → `skipped:already_captured` and still 1 request in total. Unparseable stdin → exit 0, stdout `{}` (U37).

### Verification for User Story 2

- [X] T017 [US2] Run the Independent Test command above and save the output to `S/evidence/us2-node-test.txt`. Every case passes (or is `todo` naming a defect, research R9); the run takes < 30 s (SC-004). For every `todo`, add an entry to `S/evidence/defects.md` (behavior, reproduction, expected vs actual) for the #521 comment.
- [X] T039 [US2] Outer loop for US2: `node .fork/ci/bin/tdd.mjs file capture-hermes-session.test.mjs` shows acceptance behaviors A1–A8 green. US2 isn't complete until they are (tdd/test-list.md).

**Checkpoint**: the capture rules are proven; fork-ci would now see tests.

---

## Phase 4: User Story 3 - Resilient, idempotent delivery (P2)

**Goal**: contracts/ingest-request.md holds against a loopback stand-in.

**Independent Test**: the delivery cases below pass with the stub only; no request leaves `127.0.0.1`.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T018 [US3] [A9] [U25] [U26] Request contract (Story 3 scenario 1; contracts/ingest-request.md § Request): stub 200 → exactly 1 `POST` to `/functions/v1/open-brain-rest/ingest` (also when `SUPABASE_URL` has a trailing slash), header `x-brain-key` equals the key, body equals the dry-run payload of the same session; log `captured:job-1`. A 2xx answer with a non-JSON body is logged `captured:unknown` (U26).
- [X] T019 [US3] [A10] [U27] [U28] Temporary failure then recovery (scenario 2; data-model.md § Retry queue entry): stub 503 → log `error:fetch:…`, 1 queue file with `attempt_count: 1` and the payload. A second capture of another session with the stub answering 200, 200 → the queued payload is sent first, then the new one, and the queue is empty. Repeat the first half with 429 (U27) and with 500 (U28) to show both are queued.
- [X] T020 [US3] [A11] [U29] Permanent failure (scenario 3): stub 401 → log ends `:permanent`, no queue file. The same with 400 (U29).
- [X] T021 [US3] [U31] [U32] [U33] [U34] Queue exhaustion (data-model.md § Retry queue entry `attempt_count`; each run below also captures a fresh session so the queue is processed): a queued entry with `attempt_count: 3` and the stub answering 503 stays queued with `attempt_count: 4` (U31); one with `attempt_count: 4` moves to `dead/` (U32); a queued entry answered with 401 moves to `dead/` at once (U33); with 4 queued entries and the stub answering 200, one run resends the 3 oldest and leaves the newest queued (U34).
- [X] T022 [US3] [U30] Connection failure: `SUPABASE_URL` pointing at a closed loopback port → exit 0, payload queued.
- [X] T023 [US3] [U40] Debounce supersession (research R8): `OB_CAPTURE_DEBOUNCE_MS=300`, no `OB_CAPTURE_SYNC`, two `on_session_end` fires for the same session in quick succession, the stub answering 200. Poll the log for up to 5 s: one `skipped:superseded`, one `captured:job-1`, and the stub received exactly 1 request.

### Verification for User Story 3

- [X] T024 [US3] Run the full suite as in T017 and save the output to `S/evidence/us3-node-test.txt`: all pass (or `todo` with a defect entry), < 30 s in total.
- [X] T040 [US3] Outer loop for US3: the same file run shows A9–A11 green. US3 isn't complete until they are.

**Checkpoint**: all behavior tests done.

---

## Phase 5: Gate Self-Check (before the fork PR)

- [X] T025 [P] Lane hygiene in `W` (FR-004, quickstart §0): `git diff --stat upstream/main...HEAD` lists only paths under `skills/auto-capture-hermes/`; `git diff --quiet b9cbd68 HEAD -- <the author's four files>` succeeds (SC-001); the branch has no `.specify/`, `specs/`, `.fork/`; every fork commit title starts `[skills]` (FR-003).
- [X] T026 [P] fork-ci preview (quickstart §2): `run-folder` strict on `skills/auto-capture-hermes` gives `pass`, saved to `S/evidence/run-folder-final.json`; `git -C W status --short` is clean (SC-005).
- [X] T027 [P] Scan the stage diff (Principle VI): no secrets (only `test-key-not-real` and loopback URLs), no binaries or `.db` files committed, no profanity, no network host other than `127.0.0.1` in the tests.
- [X] T028 [P] Upstream gate self-check against `F` on the stage branch (research R10): `metadata.json` validates (`npx --yes -p ajv-cli@5 -p ajv-formats ajv validate --spec=draft2020 -c ajv-formats -s .github/metadata.schema.json -d skills/auto-capture-hermes/metadata.json` from `W` prints `valid`); `SKILL.md` present; `skills/auto-capture/` exists and README links to it; markdownlint per CONTRIBUTING.md passes on the author's docs. A gate failure in the author's files is recorded in `S/evidence/defects.md` for the #521 comment, not fixed here.
- [X] T029 TDD audit: from `M`, with `.specify/feature.json` pointing at 008, run `/speckit-tdd-verify`; it writes `S/tdd/verification.md`. Expected: test-first graded `TEST_AFTER` (waived by the owner, plan Complexity Tracking); no other HIGH finding. Fix any test-smell findings in the tests (never in the author's files) and re-run. Commit `S/tdd/` on `M` as `[fork] Spec 008: …`.

---

## Phase 6: User Story 1 + User Story 4 - Land and record the staged PR (P1/P2)

**Goal**: the adapter and its tests are on fork `main` with the author's commits intact (US1), and the staging is recorded (US4).

**Independent Test**: quickstart §5 checks all pass, and the ledger has one `#521` row.

- [ ] T030 [US1] **Owner-only.** Push and open the fork PR from `W` (FR-005, FR-006):
  `git push -u origin stage/pr-521-auto-capture-hermes`, then
  `gh pr create -R mfelker/OB1 --base main --head stage/pr-521-auto-capture-hermes --title "[skills] Add auto-capture-hermes adapter (staged #521)"`. The body states: staged from upstream #521 at `b9cbd68`, the fork test commits, spec folder `specs/008-stage-pr-521-auto-capture-hermes/`, the TEST_AFTER exception; and ends with the "Generated with Claude Code" line only (no session link).
- [ ] T031 [US1] Wait until `gh pr checks <fork PR> -R mfelker/OB1` shows `fork-ci-verdict` and `OB1 Review` green. If one fails, fix it on the stage branch (tests only) and re-run T025–T028.
- [ ] T032 [US1] Confirm `gh pr diff <fork PR> -R mfelker/OB1 --name-only` lists only `skills/auto-capture-hermes/` paths (spec US1 scenario 3).

## Merge (gate: T001–T032 all `[X]`, both checks green, owner has waived Gate 1 test-first)

- [ ] T033 [US1] **Owner-only.** `gh pr merge <fork PR> -R mfelker/OB1 --merge` (merge commit; never squash or rebase; FR-002, FR-005).
- [ ] T034 [US1] Post-merge checks on `M` (quickstart §5, SC-001, SC-002): `git -C M pull --ff-only`; `git merge-base --is-ancestor b9cbd68 main`; `git diff --stat HEAD^1 HEAD` lists only `skills/auto-capture-hermes/`; the author's four files on `main` are identical to `b9cbd68`.

## Phase 7: Post-merge recording (US4)

- [ ] T035 [US4] Add the `#521` row to `M/.fork/staged-prs.md`, filling every column from data-model.md § Ledger row (head SHA, test commit SHAs, merge date, fork PR link and merge SHA, status `staged`; Notes: TEST_AFTER by owner decision, any defects from `S/evidence/defects.md`). Commit on `M` with `S` updates as `[fork] Spec 008: ledger row for staged #521` (SC-006).
- [ ] T036 [US4] **Ask the owner first (outward-facing).** Comment on upstream #521 (`gh pr comment 521 -R NateBJones-Projects/OB1`): thanks, the fork's credential-free tests (link the test commit(s) on `mfelker/OB1`), how to run them, and any defects from `S/evidence/defects.md`. End with the "Generated with Claude Code" line only. Record the comment link in the ledger Notes (FR-018).
- [ ] T037 Clean up from `M`: `git worktree remove .worktrees/stage-pr-521-auto-capture-hermes` (keep the local branch until upstream resolves #521). Tick T033–T037 and commit on `M`.
- [ ] T038 [P] Optional live check (quickstart §6), only if the owner runs Hermes Agent: save the output under `S/evidence/live/`.

---

## Dependencies & Execution Order

- **T001** → **T002, T003** (parallel) → **T004** → US2 (**T005–T017, T039**) → US3 (**T018–T024, T040**) → gates (**T025–T028** parallel, then **T029**) → **T030 → T031 → T032 → T033 → T034** → **T035 → T036 → T037**. **T038** is any time after T034.
- All test tasks T005–T023 edit the same file (`capture-hermes-session.test.mjs`), so they are sequential (no `[P]`). The loop runs them one behavior at a time.
- US3 depends on US2 only through the shared helpers and file. US1 and US4 can't start until all pre-merge tasks are done (Principle VII: no merge until the feature's tasks are complete and `fork-ci-verdict` passes).

## Parallel Example

```bash
# Phase 2 helpers (different files):
Task: "Create F/test-support/hermes-store.mjs"
Task: "Create F/test-support/run-adapter.mjs"
# Phase 5 gates (read-only checks):
Task: "Lane hygiene (T025)"  Task: "fork-ci preview (T026)"  Task: "Diff scan (T027)"  Task: "Upstream gate self-check (T028)"
```

## Implementation Strategy

1. **MVP**: Phases 1–3. With US2 green, the folder passes fork-ci strict, which is the merge blocker today (`evidence/baseline/run-folder-head.json`: `no-tests`).
2. Add US3 (delivery and debounce), then the gates, then land (US1) and record (US4).
3. If upstream merges #521 at any point before T033, stop. Sync upstream instead, keep the tests as a fork follow-up (ledger status `upstreamed`), and drop T030–T034.

## Notes

- Fork test commits go on `W`; `specs/` and `.fork/` changes go on `M`. Never cross them (Principle V).
- `.specify/feature.json` is shared with the other session working in `M`. Point it at 008 only while running 008's spec-kit commands, then back to 007.
- A defect found by a test → `todo` + `S/evidence/defects.md` + the #521 comment. Never patch the author's file without a new Complexity Tracking row and owner approval.

---

## Phase 8: TDD remediation (from `S/tdd/verification.md`, audit at `07375aa` / stage `6bcefef`)

**The verdict is FAIL. Pre-merge work is not done until T041–T043 are cleared.** Do them on `W` (tests only; never the author's four files), re-run T024–T028, and re-run `/speckit-tdd-verify` before T030. Every behavior stays `TEST_AFTER` under the owner's waiver, and no task here can change that (add-only PR, no base exists).

Proof command for each task, run from `W/skills/auto-capture-hermes`: `env -i PATH="$PATH" HOME="$TMPDIR" node --test --test-name-pattern="<test name>" capture-hermes-session.test.mjs`. Each strengthened assertion must also be shown to fail against a temporary mutant of the author's script, which is then restored and checked with `git diff --quiet`, as the loop did.

- [X] T041 [US2] Finding 1 (HIGH): in `F/capture-hermes-session.test.mjs:195–198` (A8) and `:368–370` (U22), replace the stub-request check (which can't fail, because the child never gets the stub's address) with `assert.deepEqual(queueEntries(sandbox), [])` and `assert.deepEqual(dispositions(sandbox), ["error:missing_env"])`. Done when both tests pass, and both fail against a mutant that disables the missing-config guard (the loop's A8 detection mutant).
- [X] T042 [US2] Finding 2 (HIGH): in `F/capture-hermes-session.test.mjs:420` (U38), replace `assert.ok(state.captured_at)` with checks that it is an ISO-8601 string and that `Date.parse` lies between a time taken before the run and a time taken after it. Done when U38 passes, and fails against a mutant setting `captured_at: true` at `capture-hermes-session.mjs:259`.
- [X] T043 [US2] [U41] Finding 3 (HIGH): add behavior **U41** to `S/tdd/test-list.md` (traces FR-011): a body exactly at the budget is sent whole with no marker, and one character over carries the marker. Add its test to `F/capture-hermes-session.test.mjs`, deriving `OB_CAPTURE_MAX_CHARS` from the fixture so that body length equals budget exactly. Done when U41 passes, and fails against audit mutant M7 (`text.length <= budget` → `<` at `capture-hermes-session.mjs:475`). Add a cycle-log entry.
- [X] T044 [US3] Finding 4 (MED): A11 (`:481`) and U29 (`:515`) must also assert that the disposition starts with `error:HTTP 401` or `error:HTTP 400` respectively. Done when both pass and fail against a mutant logging another status.
- [X] T045 [US2] Finding 5 (MED): split U17's ordering check (`:333`) into labelled assertions that `FIRST-TURN` and `LAST-TURN` are both present (`>= 0`) and the marker lies between them. Done when U17 passes and fails against a mutant that drops the head slice.
- [X] T046 [P] Findings 6–8 (MED): name the stub reply (`JOB_ID`, passed explicitly at `:421`, `:457`, `:570`). Derive the A6/U16/U17 limits from the `longConversation` size (`:178`, `:323`, `:330`). Make U17's marker check structural rather than exact-wording (`:103`). Done when the suite is 51+ pass, 0 fail.
- [X] T047 [P] Findings 9–10 (MED): in U40 (`:565`), state the debounce versus `waitFor` timeout margin in a comment. Update the U40 row of `S/tdd/test-list.md` and research R8 from 300 ms to 1000 ms, with the cycle-log note as the reason. Done when the list and the test agree.

## Phase 9: TDD remediation (second audit, `S/tdd/verification.md` at `1da0b44` / stage `dfb0d57`)

**The verdict is still FAIL. Pre-merge work is not done until T048 is cleared.** T044–T047 from Phase 8 are still open and still apply (findings 3–8 of the second audit). Do these tasks on `W` (tests only), then re-run T024–T028 and `/speckit-tdd-verify` before T030. TEST_AFTER for every behavior stays under the owner's waiver.

Proof command, from `W/skills/auto-capture-hermes`: `env -i PATH="$PATH" HOME="$TMPDIR" node --test --test-name-pattern="<test name>" capture-hermes-session.test.mjs`. Each strengthened or added test must also fail against the named mutant of the author's script, which is then restored and checked with `git diff --quiet`.

- [X] T048 [US2] [U13] Finding 1 (HIGH): in `F/capture-hermes-session.test.mjs:299–305`, seed two top-level sessions with user turns (older and newer) and a still-newer subagent, and assert the header names the **newer** top-level session. Done when U13 passes, and fails against mutant N5 (`DESC LIMIT 1\`,\n    [],` → `ASC …` in `findLatestSession`, `capture-hermes-session.mjs:300`), while still failing against N4 (parent filter dropped).
- [X] T049 [US3] [U42] Finding 2 (MED): add behavior **U42** to `S/tdd/test-list.md` (traces FR-015): a non-JSON queue entry is moved to `dead/`, and the valid entries behind it are resent in the same run. Add its test. Done when U42 passes, and fails against mutant N7 (`fs.renameSync(filePath, path.join(RETRY_DEAD_DIR, file));\n      continue;` → `continue;` at `capture-hermes-session.mjs:532`). Add a cycle-log entry.
- [X] T050 [P] Finding 8 (MED): update the A8 and U22 rows of `S/tdd/test-list.md` to describe what they now observe (exactly `error:missing_env` logged, empty retry queue, no stand-in). Done when the rows and the tests at `:192–201` and `:382–388` agree. The U40 row stays with T047.
- [X] T051 [P] Finding 9 (LOW): decide on quoted `.env.local` values (`capture-hermes-session.mjs:603`). Either add them to "Out of scope" in `S/tdd/test-list.md` with the reason (undocumented; README shows unquoted values), or add a behavior and test that fails against mutant N6. Done when the list records the decision.

## Phase 10: TDD remediation (third audit, `S/tdd/verification.md` at `4e490c2` / stage `2c22e41`)

**The verdict is FAIL on the waived test-first grade only: 53 TEST_AFTER, owner waiver, plan Complexity Tracking. No HIGH finding remains**, so nothing below blocks T030. The owner decides whether T052–T054 land before the fork PR or as a follow-up. Do them on `W` (tests only), then re-run T024–T028.

Proof command, from `W/skills/auto-capture-hermes`: `env -i PATH="$PATH" HOME="$TMPDIR" node --test --test-name-pattern="<test name>" capture-hermes-session.test.mjs`. Each must also fail against the named mutant (restored afterwards, `git diff --quiet` clean).

- [X] T052 [US2] Finding 1 (MED): in A1 (`F/capture-hermes-session.test.mjs:139–149`), assert `payload.source_type === "hermes_ambient"` and `payload.auto_execute === true` (data-model § Capture payload). Done when A1 passes and fails against mutants R1 and R2 (`capture-hermes-session.mjs:228–229`).
- [X] T053 [US3] Finding 2 (MED): after a 503 (U27 or A10), assert the new queue entry has `attempt_count === 1` (contracts/ingest-request.md:18; data-model.md:32). Done when the test passes and fails against mutant Q5 (`attempt_count: 1,` → `0,` at `capture-hermes-session.mjs:556`).
- [ ] T054 [US3] Finding 3 (MED): measure U34 on Linux. Run the suite, and U34 under mutant Q4 (`.sort()` removed at `capture-hermes-session.mjs:522`), on Linux: fork CI after T030, or a throwaway Linux container. If Q4 survives there too, make U34's fixture distinguish directory order from name order (for example 10 or more entries created out of name order). Done when the Linux result is recorded in the cycle log.
- [ ] T055 [P] Finding 6 (LOW): decide on config precedence (`.env.local` over the environment, `capture-hermes-session.mjs:242–243`). Either add it to "Out of scope" in `S/tdd/test-list.md` (undocumented), or add a behavior and test that fails against mutant Q3. Done when the list records the decision.
- [ ] T056 [P] Findings 5, 7 (LOW): give U20 (`:397–401`) a positive control (a `dry_run:` line logged, or the payload printed). Add the exact-fit remark (40-character allowance for a 39-character wrapper) to the T036 comment draft notes. Done when U20 fails against Q2 and still passes on the real script.
