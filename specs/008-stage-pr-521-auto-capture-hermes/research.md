# Research: Stage upstream PR #521 (auto-capture Hermes adapter)

Phase 0 decisions. Evidence is in `evidence/baseline/` unless noted otherwise.

## R1. Where the work happens, and how it lands

- **Decision**: Fetch `refs/pull/521/head` into the local branch `stage/pr-521-auto-capture-hermes` and work in the worktree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-521-auto-capture-hermes` (both created 2026-11-27, head `b9cbd68`). Push the branch to `origin`, open a fork PR into `mfelker/OB1` `main`, and merge it with a merge commit.
- **Rationale**: This follows constitution Lanes & Branching and Principle VII, and `.fork/README.md` "Stage an upstream PR" steps 2–5. The PR's merge-base `238df6c` equals `upstream/main`, and fork `main` is 0 commits behind it, so no sync is needed first. The PR adds only one folder, so the merge cannot conflict and the stage branch never needs a rebase.
- **Alternatives considered**: the worktree extension's after-specify worktree (cut from fork `main`; it would put fork history into the stage branch, so it was declined); `git merge --no-ff` of the PR head straight onto fork `main` (bypasses fork-ci and review; constitution v1.2.0 requires a fork PR).

## R2. How fork-ci sees the folder

- **Decision**: Add tests that fork-ci's `node-plain` runtime runs. The new `.mjs` files go in a folder with no `package.json`.
- **Rationale**: `.fork/ci/lib/runtimes.mjs` puts `capture-hermes-session.mjs` in `node-plain` and runs `node --test <files matching *.test.mjs | test-*.mjs>`. Today the run gives `no-tests (no tests for node code)` (`run-folder-head.json`), and `no-tests` is a failing outcome in strict mode (`lib/verdict.mjs` `BAD`).
- **Alternatives considered**: advisory mode (not allowed for `stage/` → `main` PRs, which run strict); a `package.json` with a test script (adds an upstream-visible file the author didn't write, for no gain).

## R3. Test-first evidence on an add-only PR

- **Decision**: Accept `TEST_AFTER` for every behavior (owner, 2026-11-27). Change no fork rules. Record the exception in plan Complexity Tracking.
- **Rationale**: The staged base-red procedure (`.specify/templates/overrides/tdd-loop-playbook.md`) checks out the PR's files at the base. All four files are new, so at the base the adapter is missing and every red is "file not found", which rubric rule S3 calls an invalid red. This is the first staged PR that adds a whole folder.
- **Alternatives considered**: a new "removal red" rubric rule S5 (temporarily remove one behavior's lines at the head); doing that rule change as its own fork feature first. The owner declined both. Even without credit, the loop still runs each behavior with a recorded head green. As the worthless-test rule requires, each test is written so that it would fail if its behavior were removed. The cycle log can note such a check without claiming S1.

## R4. Synthetic Hermes store

- **Decision**: `test-support/hermes-store.mjs` builds a fresh `state.db` per test in `fs.mkdtempSync` using `node:sqlite`. It has only the columns the adapter reads: `sessions` (the 14 `SESSION_COLUMNS`) and `messages` (`id`, `session_id`, `role`, `content`, `timestamp`, `_compressed_summary`). If `node:sqlite` is missing, it uses the `sqlite3` CLI. If neither is available, the suite skips with an explicit reason (spec edge case).
- **Rationale**: Nothing binary is committed (Principle VI). It mirrors the schema the author documents in `SKILL.md`. The probe (`dry-run-probe.txt`) shows the unmodified adapter reads such a store correctly.
- **Alternatives considered**: a committed `.db` fixture (binary, opaque in review); a real Hermes install (not available in CI).

## R5. Driving the adapter

- **Decision**: Black-box. Run the adapter as a child process (`process.execPath capture-hermes-session.mjs …`) through `test-support/run-adapter.mjs`. The env is built from scratch: `PATH`, `HOME`=temp, `HERMES_HOME`/`OB_HERMES_STATE_DB`=fixture, `OB_CAPTURE_ROOT`=temp, plus per-test settings. Then check stdout, exit code, `logs/ambient-capture-hermes.log`, `state/sessions/*.json`, and `data/capture-retry-queue/`. In-process imports are used only for the two pure exports (`isSubagentSession`, `formatTranscript`), where that is simpler.
- **Rationale**: The adapter reads all configuration into module constants at import time, so in-process tests would freeze one config per process. A child process also tests the real entry point, its exit code, and the "never break Hermes" promise (exit 0 on errors). A constructed env stops the owner's shell `SUPABASE_URL`/`MCP_ACCESS_KEY` from leaking in, which could otherwise send a real capture (spec edge case).
- **Alternatives considered**: adding test seams to the author's script (changes upstream code; rejected by spec Assumptions); `--import` preloads stubbing `fetch` (works for delivery, but a real loopback server checks the full HTTP contract, R7).

## R6. Which behaviors, and how each is triggered

| Behavior (FR) | Trigger |
|---|---|
| Turn filter + order (FR-008) | fixture with empty assistant rows, `_compressed_summary = 1` rows, `tool`/`session_meta` rows; `--dry-run --session <id>` |
| Cron label + threshold (FR-009) | `[Cronjob …]` user rows; header `Turns:` and the `user:cron` label |
| Short / subagent skips (FR-010) | 2 real user turns (+ cron); `parent_session_id` set; title `Subagent: …`; `--latest` skips subagents |
| Size limit (FR-011) | `OB_CAPTURE_MAX_CHARS` small (e.g. 3000) with long turns; text ≤ limit, first and last turns kept, truncation marker present |
| Import key (FR-012) | same session twice → same key; changed content → different key; format `hermes:<id>:<8 hex>` |
| Dry-run (FR-013) | stand-in server running and configured: 0 requests received |
| Missing config (FR-014) | no `.env.local`, no env vars: exit 0, log `error:missing_env`, 0 requests |
| Delivery outcomes (FR-015) | stand-in answers 200 / 503 / 429 / 401; then a second run to drain the queue |
| Hook mode | stdin JSON with `OB_CAPTURE_SYNC=1`: non-target event skipped, missing session id skipped, capture records `captured_at`, a second fire logs `already_captured`, stdout `{}` |
| `.env.local` config | `SUPABASE_URL`/`MCP_ACCESS_KEY` read from `<OB_CAPTURE_ROOT>/.env.local` |

## R7. Stand-in ingest endpoint

- **Decision**: A `node:http` server on `127.0.0.1:0` inside the test process. It records method, path, `x-brain-key` header and JSON body, and answers with a status the test chooses (a queue of statuses for multi-request runs). The adapter gets `SUPABASE_URL=http://127.0.0.1:<port>`. Tests check the path `/functions/v1/open-brain-rest/ingest`.
- **Rationale**: This checks the real request the adapter sends, with no network beyond loopback (SC-004).
- **Alternatives considered**: stubbing `fetch` (skips URL building and headers).

## R8. Hook timing (debounce, finalize delay, hard timeout)

- **Decision**: Cover the timing logic deterministically. Hook-mode tests use `OB_CAPTURE_SYNC=1`, which captures in-process. One test covers **supersession**: two `on_session_end` fires with `OB_CAPTURE_DEBOUNCE_MS=300`, then poll the log (up to 5 s). The earlier detached worker must log `skipped:superseded`, and exactly one request must reach the stand-in. Wall-clock defaults (120 s debounce, 5 s finalize, hard timeouts) are not tested.
- **Rationale**: Supersession is what makes "captured once when idle" true, and it is checkable with short, adapter-supported delays. Testing the real defaults would break the 30-second limit (SC-004).
- **Alternatives considered**: no timing coverage (leaves the debounce claim unproven); fake timers (impossible across a detached child process).

## R9. If a test exposes a defect in the adapter

- **Decision**: Keep the test, mark it `{ todo: '<defect>' }` so the suite stays green, report the defect on #521, and record it in the cycle log and the ledger notes. Do not patch the author's file.
- **Rationale**: This follows spec Assumptions and Principle V: a fork-only behavior change needs a Complexity Tracking row, and every fork patch is a future merge conflict.
- **Alternatives considered**: fixing it in the fork (allowed only with a new Complexity Tracking row and owner approval).

## R10. Upstream gate on the fork PR

- **Decision**: Run `ob1-gate-v2` checks on the fork PR as usual. Expect: one contribution folder (`skills/auto-capture-hermes`), a skill file present (`SKILL.md`), the `requires_skills: auto-capture` dependency present and linked, and the title `[skills] …`.
- **Rationale**: These rules are in `.github/workflows/ob1-gate-v2.yml` (rules 6, 10, PR format). Test files inside the folder stay within the one-folder scope rule.
- **Alternatives considered**: none.
