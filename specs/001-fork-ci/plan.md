# Implementation Plan: Fork CI (per-folder test enforcement)

**Branch**: `fork/fork-ci` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-fork-ci/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a fork-only GitHub Actions workflow, **Fork CI**, that enforces constitution Principle IV on fork `main`. Upstream CI runs no contribution tests, so this fills that gap. For every PR into `main` and every push to `main` it:

1. Works out which contribution folders changed.
2. Classifies each folder by runtime: Deno, Node, Python, or SQL.
3. Decides **strict** vs **advisory** mode by comparing the folder's content against upstream.
4. Runs each runtime's tests in an isolated matrix job, with no credentials.
5. Aggregates the results into one `fork-ci-verdict` check with a per-folder report.

All logic is dependency-free Node (`node:test`-tested) under `.fork/ci/`. A repo ruleset makes the verdict required for PR merges, and post-push bypass detection covers local merges. Details are in [research.md](research.md), R1–R13.

## Lane

**Lane**: fork feature
**Branch / Base**: `fork/fork-ci` from fork `main`
**Contribution folder**: N/A. Fork infrastructure lives in `.fork/ci/` plus `.github/workflows/fork-ci.yml`.
**Worktree** *(upstream-bound / staged)*: N/A. This is a fork feature, so it runs in the canonical checkout `/Users/mfelker/Projects/ob1`.

## Technical Context

**Language/Version**: Node.js 26 (ES modules, `.mjs`) for fork-ci logic; workflow in GitHub Actions YAML; SQL bootstrap for Postgres (pgvector image `pg17`)

**Primary Dependencies**: None at runtime (Node standard library only: `node:child_process`, `node:fs`, `node:path`). CI actions: `actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`, `denoland/setup-deno@v2`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`

**Storage**: None persistent. A throwaway Postgres + pgvector service container is used only by SQL verification jobs.

**AI Gateway**: none

**Testing**: `node --test .fork/ci/test/` (`node:test` + `node:assert/strict`, the same stack as upstream's `.github/scripts/gate-context.test.cjs`); `actionlint` for the workflow file; scratch-PR spike for GitHub behavior (R4, R9, R11)

**Target Platform**: GitHub-hosted `ubuntu-latest` runners on `mfelker/OB1`

**Project Type**: fork CI infrastructure (not an OB1 contribution category)

**Constraints**: No secrets or `GITHUB_TOKEN` use in test jobs (FR-008); `permissions: contents: read`; `persist-credentials: false`; never `pull_request_target`; no upstream-tracked file modified (FR-009); no workflow-level path filters (R9); fork-only-path changes finish in under 1 minute (SC-004); typical PR (≤3 folders) finishes in under 10 minutes (SC-003)

**Scale/Scope**: One owner. Typically 1–10 changed folders per run, up to all 64 code folders on a large sync (the matrix limit of 256 is not a concern).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Additive-only data**: no schema changes. The SQL bootstrap runs only in a throwaway CI database and contains no DROP, TRUNCATE or DELETE.
- [x] **II. Remote MCP only**: N/A. No MCP server is added.
- [x] **III. Contribution contract**: N/A. This is fork infrastructure, not a contribution folder, so it intentionally has no `metadata.json`. It is documented in `.fork/README.md` and `.fork/ci/README.md`.
- [x] **IV. Test-First**: fork-ci's own logic is built red-green-refactor with `node:test` and fixture repos (R13). The self-test job runs those tests in CI. No live credentials are used.
- [x] **V. Lane separation**: fork lane, branch `fork/fork-ci` from fork `main`. All files are fork-only (`.fork/ci/**`, `.github/workflows/fork-ci.yml`, which is a new file name). No upstream-tracked file is edited (SC-006).
- [x] **VI. Security, content & licensing**: read-only token, no secrets, no binaries, no new dependencies. `actionlint` is downloaded in CI, not committed.
- [x] **VII. Sync discipline**: implements FR-010 origin detection. The runbook update (stage/contrib via fork PR) and the ledger stay consistent with Principle VII.

**Post-design re-check (after Phase 1)**: all gates still pass. Two items to note:

- The ruleset (R11) is a repo setting, applied as a user-run step, not as a file change.
- `bootstrap.sql` copies core DDL from `docs/01-getting-started.md`. The duplication is justified in Complexity Tracking, and drift is caught by a self-test.

## Project Structure

### Documentation (this feature)

```text
specs/001-fork-ci/
├── plan.md              # This file
├── research.md          # Phase 0 decisions R1–R13 + spec amendments
├── data-model.md        # Changed Folder, Runtime, Folder Result, Check Verdict
├── quickstart.md        # Validation scenarios, including the ruleset spike
├── contracts/
│   ├── cli.md           # .fork/ci/bin/* command contracts (args, stdout JSON, exit codes)
│   ├── result.schema.json   # per-folder result artifact
│   └── check.md         # workflow triggers, jobs, required check name, report format
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks), not created here
```

### Source Code (repository root)

```text
.github/workflows/
└── fork-ci.yml                  # NEW fork-only file: detect → test (matrix) → fork-ci-verdict; self-test

.fork/ci/
├── README.md                    # how fork-ci works, outcomes, conventions (tests/verify.sql)
├── lib/
│   ├── paths.mjs                # path → folder mapping, fork-only/template filtering (FR-002/003)
│   ├── changes.mjs              # changed files for PR (base...head) and push (before..after) (R3)
│   ├── runtimes.mjs             # folder scan → runtimes, code vs tests, runner commands (FR-004/005, R7/R8)
│   ├── origin.mjs               # strict vs advisory via tree compare vs merge-base(HEAD, upstream) (FR-010, R6)
│   ├── verdict.mjs              # aggregate results → verdict, missing-result = timeout (FR-007, R9)
│   ├── report.mjs               # job-summary markdown table (SC-007)
│   └── bypass.mjs               # lane-bypass detection on pushes (FR-012, R11)
├── bin/
│   ├── detect.mjs               # emits matrix JSON + has_folders
│   ├── run-folder.mjs           # runs one folder's runtimes with timeouts, writes result JSON
│   └── verdict.mjs              # reads results, writes summary, sets exit code
├── sql/
│   └── bootstrap.sql            # Supabase role stubs + vector + core thoughts DDL (R10)
└── test/
    ├── *.test.mjs               # one per lib module + bin integration tests
    └── fixtures/                # fixture folders + helpers that build temp git repos

.fork/README.md                  # UPDATED: stage/contrib land via fork PR; ruleset; fork-ci outcomes
```

**Structure Decision**: Fork-only infrastructure. The workflow file has to live in `.github/workflows/`, under a new `fork-` name; everything else lives under `.fork/ci/`. Logic sits in small pure-ish `lib/` modules so it can be unit-tested; `bin/` scripts are thin wrappers the workflow calls.

## Implementation Phasing (for /speckit-tasks)

| Order | Story | Scope |
|-------|-------|-------|
| 0 | Spike | Scratch PR + throwaway-pattern ruleset to verify R4, R9 and R11 GitHub behavior (user-approved settings change) |
| 1 | US1 (P1) | paths, changes, runtimes (deno/node/python), run-folder, verdict, report, workflow detect/test/verdict |
| 2 | US2 (P1) | "no tests found" per runtime, docs-only exemption, "tests but no runner" setup failure |
| 3 | US3 (P2) | fork-only-only fast path, empty-matrix verdict, self-test job + actionlint |
| 4 | US4 (P2) | origin detection (upstream fetch, tree compare), advisory mode in verdict/report |
| 5 | Lane enforcement | bypass detection on push, ruleset applied to `main` (user step), runbook update in `.fork/README.md` |
| 6 | SQL (P3) | `tests/verify.sql` convention, Postgres service job, `bootstrap.sql` + drift self-test |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `.fork/ci/sql/bootstrap.sql` duplicates core DDL from `docs/01-getting-started.md` | SQL verification needs the core `thoughts` table in a throwaway DB | Extracting the SQL from the Markdown at runtime breaks silently when the doc's formatting changes; a self-test that diffs column lists catches drift instead |
| Repo ruleset with owner bypass instead of hard blocking | Syncs and `fork/` merges must push to `main` directly (Q3 C) | Hard blocking with no bypass rejects direct pushes and breaks the sync runbook (R11) |
