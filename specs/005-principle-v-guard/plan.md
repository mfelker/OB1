# Implementation Plan: Principle V guard for the fork-main checkout

**Branch**: `fork/principle-v-guard` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-principle-v-guard/spec.md`

## Summary

One pure rule, `decide()`, says whether a change to a path in a checkout is allowed under constitution Principle V. Two thin guards call it: a Claude Code `PreToolUse` hook (agent file writes) and a versioned git `pre-commit` hook (staged changes). Both live in fork-only paths, are driven test-first in `.fork/ci/`, and point grill-with-docs' knowledge base at `.fork/domain-knowledge/`, which `.fork/README.md` designates as canonical.

## Lane

**Lane**: fork feature
**Branch / Base**: `fork/principle-v-guard` from fork `main`
**Contribution folder**: `.fork/ci`
**Worktree**: none (fork-`main` checkout). Merged in PR #19 (`bb41dd4`); the integration worktree `/Users/mfelker/Projects/ob1/.worktrees/fork-principle-v-guard` has been removed. Spec-kit commands run from the fork-`main` checkout

Other paths this feature writes (all fork-only, FR-013): `.fork/githooks/pre-commit`, `.claude/settings.json`, `.fork/README.md`, `.fork/ci/README.md`, `.fork/ci/lib/self-test-needed.mjs` (so CI self-tests changes to the new paths).

## Technical Context

**Language/Version**: Node 26 ES modules (same as the rest of `.fork/ci`), POSIX `sh` for the one-line git hook

**Primary Dependencies**: none beyond Node's standard library and the `git` CLI; reuses `.fork/ci/lib` conventions

**Storage**: N/A (reads the local `upstream/main` ref; writes nothing)

**AI Gateway**: none

**Testing**: `node --test .fork/ci/test/`, run through the TDD adapter (`node .fork/ci/bin/tdd.mjs single|file|suite`); temp repos via `.fork/ci/test/helpers/git-fixture.mjs` (`makeRepo`, `addRemoteRef`, `merge`)

**Target Platform**: the owner's macOS checkout (Claude Code hooks, git hooks) and fork CI (`self-test`)

**Project Type**: fork tooling (not an upstream category)

**Constraints**: no secrets; fork-only paths only; the agent guard runs on every agent write, so it must stay fast (one `git ls-tree` per call is acceptable; see research R4); fail closed (FR-006, FR-011)

**Scale/Scope**: one repository, ~2,000 upstream files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Additive-only data**: no database change.
- [x] **II. Remote MCP only**: no MCP server; Claude Code hooks are client-side tooling, not an MCP transport.
- [x] **III. Contribution contract**: N/A for a fork feature (no upstream category folder). Fork docs updated instead (`.fork/README.md`, `.fork/ci/README.md`).
- [x] **IV. Test-First**: runner `node --test`; tests in `.fork/ci/test/`; fork lane, red-green-refactor with every red in `tdd/cycle-log.md`, driven by the mandatory `before_implement` hook (`speckit.tdd.run`), which stays enabled. Gate 1 needs `tdd.verify` PASS or PASS_WITH_GAPS before merge (no exemption for this feature).
- [x] **V. Lane separation**: fork feature on `fork/principle-v-guard` from fork `main`; every touched path is fork-only (`.fork/`, `specs/`, `.claude/settings.json` is not in upstream). The feature itself enforces this principle.
- [x] **VI. Security, content & licensing**: no secrets, no binaries, stdlib only.
- [x] **VII. Sync discipline**: N/A for a fork feature beyond branching from current fork `main`.

Post-design re-check (after Phase 1): unchanged, all pass. The only upstream folder the feature writes into is `.claude/`, via `.claude/settings.json`, a path upstream does not have, which is exactly the fork-only-zone case the rule permits (FR-003).

## Project Structure

### Documentation (this feature)

```text
specs/005-principle-v-guard/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── rule.md          # decide() inputs/outputs and the decision table
│   └── guards.md        # the two guard CLIs and their wiring
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (worktree root)

```text
.fork/ci/
├── lib/principle-v.mjs          # decide(): the pure rule
├── lib/principle-v-paths.mjs    # repoRelative(), checkoutState(), upstreamPaths(), GuardError (git/fs I/O)
├── bin/principle-v-guard.mjs    # --hook (PreToolUse JSON in/out) | --staged (pre-commit)
├── test/principle-v.test.mjs    # rule
├── test/principle-v-paths.test.mjs  # helpers, in temp repos
├── test/principle-v-guard.test.mjs  # both guards end to end in temp repos
└── lib/self-test-needed.mjs     # + .fork/githooks/, .claude/settings.json triggers
.fork/githooks/pre-commit        # sh: exec node <root>/.fork/ci/bin/principle-v-guard.mjs --staged
.claude/settings.json            # PreToolUse matcher Write|Edit|MultiEdit|NotebookEdit -> guard --hook
.fork/README.md                  # knowledge root designation; guards; enabling core.hooksPath
.fork/ci/README.md               # bin/principle-v-guard.mjs reference
```

**Structure Decision**: fork tooling inside `.fork/ci/` (rule, CLI, tests), with the two thin integration points (`.fork/githooks/pre-commit`, `.claude/settings.json`) outside it because their locations are fixed by git and Claude Code.

## Complexity Tracking

One owner-accepted Gate 1 exception (2026-11-25), plus trade-offs.

**Gate 1 outcome (owner decision, 2026-11-25)**: the final re-audit (`tdd/verification.md`, `516f306`, at `fbf3eb6`) is **FAIL** on six `TEST_AFTER` behaviors, with 43 of 49 `PROVEN`, 0 of 36 mutants surviving and 11 of 11 acceptance criteria covered end to end. The owner accepted all six and merges 005 with that FAIL recorded, without changing the rubric:

- **U25, U26**: behavior prescribed by the contract landed in A1 (`22a59fb`) and A6 (`34be6cf`) before their tests (row below).
- **U33**: end-to-end confirmation of the case fix; U31 and U32 had already delivered the behavior, so the test passed on first run (both-layer mutant recorded).
- **U36, U37, U38**: tests added after the first audit to kill its surviving mutants M13, M06, M10 on correct, existing code. A test written to catch a mutant of existing code always post-dates that code, so this rubric grades it `TEST_AFTER`. Accepted knowingly: future audits that end in test strengthening will meet the same result.

| Exception | Why | Simpler alternative rejected because |
|-----------|-----|--------------------------------------|
| **U25 and U26 are `TEST_AFTER`** (`tdd/verification.md`): their behavior (the dynamic `import()` inside the top-level `try`, and `--no-renames`) landed in the A1 (`22a59fb`) and A6 (`34be6cf`) commits, before their tests (`1133ecd`, `4568300`). Both tests are mutant-verified. | Root cause: `contracts/guards.md` prescribed both implementation details, so the stream built them up front instead of as the smallest change for their own cycles. The owner accepted these two as `TEST_AFTER` for 005; every other behavior must be `PROVEN`, and Gate 1 is otherwise held. | Rewriting history to fake the order is dishonest; a fork-wide rubric class for "pre-existing, mutant-verified" was declined as a broader governance change. |

Process fix: the plan template now warns that contracts must not prescribe behavior-bearing implementation details ahead of their tests.

- **Settings file inside an upstream folder**: `.claude/settings.json` sits in `.claude/`, which upstream has (for `skills/review-pr.md`). The path itself does not exist upstream, so it is fork-only content under Principle V, and the rule's fork-only zones list (FR-003) makes that explicit.
- **`core.hooksPath` is per clone**: git does not version hook enablement. The runbook gives the one command; the agent guard still applies when a clone has not run it (spec edge case).
