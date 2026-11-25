# Implementation Plan: Stage upstream PR #532 (atomizer Anthropic default model)

**Branch**: `stage/pr-532-atomizer-default` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-stage-pr-532-atomizer-default/spec.md`

## Summary

Land upstream PR #532 (one commit, `8bebd778241a`, which changes the atomizer's Anthropic default
model from the retiring `claude-sonnet-4-5` to `claude-sonnet-5-5`) on fork `main` ahead of
upstream, before the 2026-11-30 retirement. The author's commit is kept unchanged. The fork adds:

1. Credential-free `node --test` tests in `recipes/atomizer/` that stub `globalThis.fetch`
   and check the model in the outgoing request (default, explicit override, unchanged OpenRouter
   default). These tests go red against the pre-PR `lib/atomize-text.mjs`.
2. A clean skip in the live sanity script `test-atomize.mjs` when the selected provider has no
   key. Today fork-ci picks the script up as a test, and it fails without credentials (baseline
   preview: strict `fail`, `tests failed (exit 1)`, from `test-atomize.mjs` alone).

The change lands through a fork PR merged with a merge commit after `fork-ci-verdict` passes in
strict mode. It is recorded in `.fork/staged-prs.md`, and the tests are offered upstream.

## Lane

**Lane**: staged upstream PR #532
**Branch / Base**: `stage/pr-532-atomizer-default` from `refs/pull/532/head` (`8bebd77`); the PR's merge-base is `238df6c` = current `upstream/main`
**Contribution folder**: `recipes/atomizer/`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default`. Every source path in this plan and in tasks.md is rooted here. Spec-kit commands still run from the fork-`main` checkout (`/Users/mfelker/Projects/ob1`).

## Technical Context

**Language/Version**: Node.js ESM (`.mjs`). The recipe states Node 18+; fork-ci runs Node 26 (`actions/setup-node`, `node-version: '26'`); local is v26.13.0

**Primary Dependencies**: none. No `package.json`: the recipe uses only Node built-ins and global `fetch`

**Storage**: N/A (no SQL, no schema change)

**AI Gateway**: Anthropic Messages API / OpenRouter, both stubbed in tests (no live calls)

**Testing**: `node --test` (fork-ci runtime `node-plain`, which picks up basenames `*.test.mjs` / `test-*.mjs`)

**Target Platform**: local script recipe

**Project Type**: recipe

**Constraints**: No secrets in files; no network in tests; author's commit unrewritten; `metadata.json` and README untouched; test code must run on **Node 18.18+** (`node:test`, `node:assert/strict`, `node:child_process`; `--import` preload needs 18.18+)

**Scale/Scope**: 1 library default + 1 script edit + 1 test file + 1 preload helper

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes.*

- [x] **I. Additive-only data**: no SQL or data changes.
- [x] **II. Remote MCP only**: not an MCP change; no local MCP server is introduced.
- [x] **III. Contribution contract**: the existing folder keeps its README and `metadata.json` unchanged. No new folder.
- [x] **IV. Test-First**:
  - Runner: `node --test`; tests live inside `recipes/atomizer/`.
  - The staged-PR rule applies: tests must be written and green before merge.
  - The fork's own new code (the FR-007 skip) is red-green: its test is committed first and fails, then the skip is added.
  - No live credentials.
- [x] **V. Lane separation**: the staging branch carries only `recipes/atomizer/` and no fork-only paths. One upstream-tracked file the PR didn't touch is edited (`test-atomize.mjs`); see Complexity Tracking.
- [x] **VI. Security, content & licensing**: no secrets (tests use the dummy key `test-key-not-real`); no binaries; no dependencies.
- [x] **VII. Sync discipline**: fork `main` contains `upstream/main` (`238df6c`), which is the PR's merge-base. This is its own spec-kit feature, with a ledger row (FR-010).

## Project Structure

### Documentation (this feature)

```text
specs/002-stage-pr-532-atomizer-default/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R8
├── data-model.md        # Phase 1: model-selection rules + ledger row
├── quickstart.md        # Phase 1: validation run guide
├── contracts/
│   ├── atomize-text-model-defaults.md   # atomizeText → outgoing request model
│   └── test-atomize-cli.md              # test-atomize.mjs skip/live contract
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output
```

### Source Code (worktree root)

```text
recipes/atomizer/
├── lib/atomize-text.mjs            # author's commit 8bebd77 (unchanged by the fork)
├── test-atomize.mjs                # fork edit: clean skip without a key (FR-007)
├── atomize-text.test.mjs           # NEW: model-default tests + test-atomize CLI tests
└── test-support/fetch-stub.mjs     # NEW: --import preload that stubs fetch (not a test file)
```

**Structure Decision**:
- Put the test file at the folder root, next to `test-atomize.mjs`, as `atomize-text.test.mjs`. That basename matches fork-ci's `node-plain` pattern (`.fork/ci/lib/runtimes.mjs`: `*.test.mjs` or `test-*.mjs`). The constitution's Testing Standards table lists `test-*.mjs` and `__tests__/*.test.js` as examples for plain Node; a root-level `*.test.mjs` is a third form that fork-ci accepts. It was chosen over `test-atomize-text.mjs`, which is easily confused with the live script.
- Name the preload helper `fetch-stub.mjs` so it doesn't match a test pattern, and keep it in `test-support/` so it is never run as a test (see research R4).

### Commit sequence (on the staging branch)

1. `8bebd77`: the author's commit, as-is.
2. `[recipes] Tests for #532: atomizer model defaults`. Model-default tests plus the CLI-skip tests: the defaults are green; the skip tests are red, which is the red step for the fork's new code.
3. `[recipes] atomizer: test-atomize skips cleanly without a provider key`. All tests green.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Edits upstream-tracked `recipes/atomizer/test-atomize.mjs`, which PR #532 doesn't touch (Principle V) | fork-ci treats `test-*.mjs` as a test, and the script exits 1 without credentials, so the strict verdict for `recipes/atomizer/` can never pass in CI (baseline preview: `fail`). The clarified spec chose this edit (FR-007, Q1 option C). | Renaming the script would change upstream's documented README usage. An exclusion list in fork-ci is the deferred "manual scripts" fork feature (out of scope). Leaving it red blocks the merge (FR-008). The edit is small (only the two missing-key branches change) and is offered upstream (FR-011). |
