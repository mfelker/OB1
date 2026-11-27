# Implementation Plan: Stage upstream PR #521 (auto-capture Hermes adapter)

**Branch**: `stage/pr-521-auto-capture-hermes` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-stage-pr-521-auto-capture-hermes/spec.md`

## Summary

Land upstream PR #521 on fork `main` ahead of upstream. The PR adds the Hermes Agent adapter for the auto-capture skill: 3 commits by eazene, head `b9cbd68fb989`, 4 new files in `skills/auto-capture-hermes/`. The author's commits stay unchanged. The fork adds one thing: credential-free `node --test` tests inside the folder. Each test builds a synthetic Hermes `state.db`, runs the adapter as a child process with a clean environment, and checks the payload, the capture log, the session state and the retry queue. Delivery is tested against a local stand-in for the Open Brain ingest endpoint on `127.0.0.1`.

Without tests, fork-ci's strict verdict for the folder is `no-tests` (baseline in `evidence/baseline/run-folder-head.json`), which blocks the merge. A dry-run probe of the unmodified script against a synthetic store already behaves as the spec describes (`evidence/baseline/dry-run-probe.txt`).

The PR only adds files, so no behavior exists at the PR base and a red at the base can only be "file not found". Rubric rule S3 calls that an invalid red. The owner decided on 2026-11-27 to accept `TEST_AFTER` for this feature and change no fork rules (see Complexity Tracking).

The work lands through a fork PR merged with a merge commit after `fork-ci-verdict` passes in strict mode. It is recorded in `.fork/staged-prs.md`, and the tests are offered upstream on #521.

## Lane

**Lane**: staged upstream PR #521
**Branch / Base**: `stage/pr-521-auto-capture-hermes` from `refs/pull/521/head` (`b9cbd68`); the PR's merge-base is `238df6c` = current `upstream/main`, already contained in fork `main`
**Contribution folder**: `skills/auto-capture-hermes`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-521-auto-capture-hermes` — created 2026-11-27, `rerere.enabled=true`. Every source path in this plan and in tasks.md is rooted here. Spec-kit commands still run from the fork-`main` checkout (`/Users/mfelker/Projects/ob1`).

### Branch map

| Branch / checkout | Holds | Never holds |
|---|---|---|
| fork `main` (`/Users/mfelker/Projects/ob1`) | `specs/008-…/` (spec, plan, tasks, `tdd/`, `evidence/`), later the ledger row in `.fork/staged-prs.md` | any file under `skills/auto-capture-hermes/` until the fork PR merges |
| `stage/pr-521-auto-capture-hermes` (worktree above) | the author's 3 commits + the fork's test commits, all inside `skills/auto-capture-hermes/` | `.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`, files outside the folder |
| `origin/stage/pr-521-auto-capture-hermes` | the pushed stage branch, head of the fork PR | — |
| upstream `NateBJones-Projects/OB1` | nothing from this feature except one comment on #521 (FR-018) | pushes, branches or PRs from the fork |

Fork `main` is 0 commits behind `upstream/main`, so no sync is needed before staging (Principle VII). If upstream moves before landing, sync fork `main` first (merge, never rebase). The stage branch is not rebased: the PR adds only a new folder, so the fork PR merges cleanly onto any later fork `main`.

## Technical Context

**Language/Version**: Node.js ESM (`.mjs`). The skill states Node 18+ (22.5+ for `node:sqlite`); fork-ci runs Node 26 (`actions/setup-node`, `node-version: '26'`); local is v26.13.0

**Primary Dependencies**: none. No `package.json`; Node built-ins only (`node:test`, `node:assert/strict`, `node:child_process`, `node:http`, `node:fs`, `node:os`, `node:sqlite` for building fixtures)

**Storage**: Hermes `state.db` (SQLite) is read-only input. Tests build a synthetic one per test in a temporary directory. No Supabase or SQL changes

**AI Gateway**: none (the ingest endpoint is replaced by a local stand-in in tests)

**Testing**: `node --test` (fork-ci runtime `node-plain`, which picks up basenames `*.test.mjs` / `test-*.mjs`)

**Target Platform**: local script run by Hermes Agent shell hooks

**Project Type**: skill (with a script)

**Constraints**: No secrets in files; no network beyond `127.0.0.1` in tests; every child process gets a constructed environment (no inherited `SUPABASE_URL`/`MCP_ACCESS_KEY`, `HOME` set to a temp dir); author's commits and files unchanged; tests finish in < 30 s (SC-004)

**Scale/Scope**: 1 test file + 2 test-support helpers; about 20 behaviors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: passes, with one recorded exception (IV, Complexity Tracking).*

- [x] **I. Additive-only data**: no SQL or Open Brain data changes; the adapter only reads Hermes's own store.
- [x] **II. Remote MCP only**: no MCP server. The adapter is a local hook script that posts to the remote REST ingest Edge Function (`open-brain-rest`), which matches the rule.
- [x] **III. Contribution contract**: new folder `skills/auto-capture-hermes/` with `README.md`, `metadata.json` and `SKILL.md`, as the upstream gate requires for skills. `requires_skills: auto-capture` exists on fork `main` and is linked in the README. Verified by running the upstream gate before landing (quickstart §4).
- [x] **IV. Test-First**: runner `node --test`; tests live inside the folder; staged-lane rule: tests green before merge; no live credentials. The `before_implement` TDD hook stays **enabled**. **Exception**: no valid base-red is possible for files the PR adds, so behaviors are graded `TEST_AFTER` (Complexity Tracking).
- [x] **V. Lane separation**: the stage branch touches only `skills/auto-capture-hermes/` and carries no fork-only paths. No upstream-tracked file is edited on fork `main`. No edits to the author's files at all.
- [x] **VI. Security, content & licensing**: no secrets (tests use the dummy key `test-key-not-real` and a loopback URL); no binaries (fixtures are built at test time, nothing `.db` is committed); no dependencies.
- [x] **VII. Sync discipline**: fork `main` contains the PR's merge-base `238df6c`. This is its own spec-kit feature (not batched with #515). Fetched from `refs/pull/521/head`; landed by a merge-commit fork PR; ledger row (FR-017).

## Project Structure

### Documentation (this feature)

```text
specs/008-stage-pr-521-auto-capture-hermes/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10
├── data-model.md        # Phase 1: Hermes store fixture, payload, state, queue, log, ledger row
├── quickstart.md        # Phase 1: validation and landing run guide
├── contracts/
│   ├── capture-cli.md       # adapter invocation modes → observable outcomes
│   └── ingest-request.md    # what reaches the ingest endpoint, and how responses are handled
├── evidence/baseline/   # run-folder-head.json (no-tests), dry-run-probe.txt
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output
```

### Source Code (worktree root)

```text
skills/auto-capture-hermes/
├── README.md                          # author (unchanged)
├── SKILL.md                           # author (unchanged)
├── metadata.json                      # author (unchanged)
├── capture-hermes-session.mjs         # author (unchanged)
├── capture-hermes-session.test.mjs    # NEW: all behavior tests
└── test-support/
    ├── hermes-store.mjs               # NEW: builds a synthetic state.db (not a test file)
    └── run-adapter.mjs                # NEW: runs the adapter with a clean env; stand-in ingest server
```

**Structure Decision**:
- One test file at the folder root, `capture-hermes-session.test.mjs`. It matches fork-ci's `node-plain` pattern (`*.test.mjs`) and mirrors the script's name.
- The helpers sit in `test-support/` with names that match no test pattern, so fork-ci and `node --test` never run them as tests (same pattern as spec 002's `test-support/fetch-stub.mjs`).

### Commit sequence (on the stage branch)

1. `f1f4536`, `5cf07c0`, `b9cbd68`: the author's commits, as-is.
2. `[skills] auto-capture-hermes: test support (synthetic Hermes store, adapter runner)`.
3. One or more `[skills] auto-capture-hermes: tests for …` commits, one per cycle or story, as `speckit.tdd.run` records them in `specs/008-…/tdd/cycle-log.md` on fork `main`.

No commit touches the author's four files. If a test exposes a defect in the adapter, the test is kept and marked `todo` with the defect named, the defect is reported on #521, and the adapter stays unchanged (spec Assumptions). A fork-only fix would need its own Complexity Tracking row first.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle IV staged base-red: every behavior is graded `TEST_AFTER` (rubric S2/S3), not `PROVEN` | PR #521 only **adds** files. At the PR base `capture-hermes-session.mjs` does not exist, so the only possible base-red is "file not found", which rubric S3 rejects as an invalid red. The owner chose on 2026-11-27 to accept `TEST_AFTER` and change no fork rules. | (a) A "removal red" rule S5 in the fork's staged override and rubric: declined by the owner for this feature. (b) A separate fork feature to add that rule first: declined, it would delay staging. The `before_implement` TDD hook stays enabled. The loop still runs each behavior and records a head green, and the audit verdict for this feature is expected to be FAIL on test-first and is waived by the owner at merge (Gate 1 is owner-checked). |
