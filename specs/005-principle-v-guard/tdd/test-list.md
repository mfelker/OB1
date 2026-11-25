---
feature: 005-principle-v-guard # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 11 # acceptance criteria found in spec.md
planned_at: 92977db # short SHA the list was derived from
updated_at: 14c447a # short SHA of the last change to this file
suite_baseline: green # green | red | unknown, at planning time
---

# Test List: Principle V guard for the fork-main checkout

## How this list keeps every red real (read before starting a stream)

The rubric grades a behavior `PROVEN` only when its red is recorded **and** its test file changes in the same commit as, or before, the source that makes it pass. 003 lost `PROVEN` on acceptance tests written after their units. This list avoids that:

- **Outer loop, CLI (A1–A9)**: the integrator writes these nine tests first, before any stream starts, as `node:test` `todo` tests in `.fork/ci/test/principle-v-guard.acceptance.test.mjs`, runs them, records each red (a failing `todo` reports `✖ … # TODO` without failing the suite), and commits the file (task T029). Stream G turns each `todo` into a plain `test` in the commit that makes it green. The test file therefore predates the CLI source.
- **Outer loop, runbook (A10–A11)**: written first by stream W in the same commit as the runbook change; they are red until `.fork/README.md` has the sections.
- **Inner loop**: cycle order is fixed per component (the order of the rows below) so each new test fails before its change. `decide()` starts as a stub that denies everything, so the allow rows go red first. Behaviors that would otherwise pass on their first run were merged into one row.
- A test that still passes on its first run gets a deliberate mutant check, and the cycle entry says so. That is a deviation to report, not the plan.

## Outer loop: acceptance behaviors

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1  | On a `main` checkout, the agent guard (run exactly as `.claude/settings.json` invokes it) refuses a `Write` to a file that exists upstream, printing the `PreToolUse` deny JSON whose reason names Principle V and the upstream-bound/staged route | US1 AS1, FR-005, FR-007 | example | DONE | cycle-log.md `A1`, commit `22a59fb` |
| A2  | The agent guard refuses a `Write` to `docs/domain_knowledge/CONTEXT.md` with a reason naming `.fork/domain-knowledge/` | US1 AS2, FR-005 | example | DONE | cycle-log.md `A2`, commit `3b847a7` |
| A3  | The agent guard allows writes under each fork-only root and zone: exit 0, no output | US1 AS3, FR-003 | example | DONE | cycle-log.md `A3`, commit `3d24446` |
| A4  | The agent guard allows a write to an upstream path inside a linked worktree on another branch, even when the session `cwd` is the `main` checkout | US1 AS4, FR-004 | example | DONE | cycle-log.md `A4`, commit `389bb7b` |
| A5  | The agent guard allows a write to an upstream file while a merge is in progress on `main` | US1 AS5, FR-004 | example | DONE | cycle-log.md `A5`, commit `f54be77` |
| A6  | On `main` with `core.hooksPath` at `.fork/githooks`, `git commit` with a staged upstream file fails; stderr has the header, one line per protected path with reason and suggestion, and the `--no-verify` note | US2 AS1, FR-008 | example | DONE | cycle-log.md `A6`, commit `34be6cf` |
| A7  | On `main`, a commit that stages only fork-only paths succeeds | US2 AS2 | example | DONE | cycle-log.md `A7`, commit `ca85dfb` |
| A8  | On `main`, committing a conflicted merge that touches upstream files succeeds | US2 AS3, FR-004 | example | DONE | cycle-log.md `A8`, commit `fc31859` |
| A9  | In a linked worktree on another branch, a commit staging upstream files succeeds | US2 AS4, FR-004 | example | DONE | cycle-log.md `A9`, commit `3133a58` |
| A10 | `.fork/README.md` names `.fork/domain-knowledge/` as the canonical knowledge root for `/speckit-grill-with-docs`, with its layout (`CONTEXT.md`, topic documents, `adr/`) | US3 AS1, FR-012 | example | DONE | cycle-log.md `A10`, commit `321583b` |
| A11 | `.fork/README.md` has a Principle V guard section covering both guards, the merge exception, `--no-verify`, and the enable command `git config core.hooksPath .fork/githooks` | US3 AS2, FR-009, FR-012 | example | DONE | cycle-log.md `A11`, commit `e5780a8` |

## Inner loop: unit behaviors

### `.fork/ci/lib/principle-v.mjs` (stream R; rows in cycle order; start from a stub `decide()` that returns a deny)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1  | D1: `relPath: null` is allowed, rule `D1` | FR-010 | example | DONE | cycle-log.md `U1`, commit `b6d855f` |
| U2  | D2: a branch other than `main` (including `HEAD` when detached) is allowed; `main` itself is not covered by D2 | FR-004 | example | DONE | cycle-log.md `U2`, commit `74642c0` |
| U3  | D3: `mergeInProgress: true` is allowed on `main` | FR-004 | example | DONE | cycle-log.md `U3`, commit `f7abd81` |
| U4  | D9: a new top-level path upstream does not have (`NOTES.md`) is allowed | FR-002 (boundary) | example | DONE | cycle-log.md `U4`, commit `4a729dc` |
| U5  | D4: a file that exists in `upstream.files` (`CLAUDE.md`) is denied, rule `D4` | FR-002 | example | DONE | cycle-log.md `U5`, commit `b0d6260` |
| U6  | D8: a new file inside an upstream folder is denied (`docs/x.md`, and nested `docs/a/b/c.md`); a sibling top-level path (`docsx.md`) is not | FR-002 | example | DONE | cycle-log.md `U6`, commit `10c29c5` |
| U7  | D7: with `upstream: null`, a non-fork path is denied, rule `D7` | FR-006 | example | DONE | cycle-log.md `U7`, commit `21fed79` |
| U8  | D5: each fork-only root (`.fork/`, `.specify/`, `specs/`, `.worktrees/`) is allowed even with `upstream: null`; `.forkx/a` is not a root | FR-003, FR-006 | example | DONE | cycle-log.md `U8`, commit `c2285c6` |
| U9  | D6: `.claude/settings.json`, `.claude/skills/speckit-x/SKILL.md` and `.github/workflows/fork-ci.yml` are allowed inside upstream folders; `.claude/settings.local.json` and `.github/workflows/forked.yml` are not; and a zone path that exists in `upstream.files` is still denied (D4 before D6) | FR-003 | example | DONE | cycle-log.md `U9`, commit `fc4f852` |
| U10 | Deny reasons match contracts/rule.md for D4 (`file exists in upstream/main`), D8 (`inside upstream folder <dir>/`) and D7 (`upstream/main is unavailable; run git fetch upstream`) | FR-005, FR-006 | example | DONE | cycle-log.md `U10`, commit `28be22b` |
| U11 | Suggestions: under `docs/domain_knowledge/` → the `.fork/domain-knowledge/` text; anything else (including `docs/domain_knowledge_x/`) → the upstream-bound/staged text | FR-005 | example | DONE | cycle-log.md `U11`, commit `cc635d9` |

### `.fork/ci/lib/principle-v-paths.mjs` (stream P; rows in cycle order)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U12 | `repoRelative`: a relative path, its absolute form and a `..` form give the same `relPath` (first cycle may take `root` from `cwd`) | FR-010 | example | DONE | cycle-log.md `U12`, commit `7916204` |
| U13 | `repoRelative`: `root` is the git top-level of the path's own checkout, so a path in a linked worktree reports the worktree when `cwd` is the main checkout | FR-004, research R3 | example | DONE | cycle-log.md `U13`, commit `a635e90` |
| U14 | `repoRelative`: a path through a symlinked directory gives the same `relPath` as the real path | FR-010 | example | DONE | cycle-log.md `U14`, commit `f0f50f9` |
| U15 | `repoRelative`: a file not yet created resolves through its nearest existing ancestor | FR-010 | example | DONE | cycle-log.md `U15`, commit `14870e1` |
| U16 | `repoRelative`: a path outside every checkout, or the root itself, gives `relPath: null` | FR-010 | example | DONE | cycle-log.md `U16`, commit `cbad0ca` |
| U17 | `checkoutState`: `branch` is the branch name, or `HEAD` when detached | FR-004 | example | DONE | cycle-log.md `U17`, commit `e585a4e` |
| U18 | `checkoutState`: `mergeInProgress` is true while `MERGE_HEAD` exists, false otherwise | FR-004 | example | DONE | cycle-log.md `U18`, commit `b62d065` |
| U19 | `checkoutState` throws `GuardError` for a directory that is not a git work tree | FR-011 | example | DONE | cycle-log.md `U19`, commit `1d3da8a` |
| U20 | `upstreamPaths`: `files` from `upstream/main`, and `dirs` holding every proper ancestor of every file | FR-002 | example | DONE | cycle-log.md `U20`, commit `b9f5c6b` |
| U21 | `upstreamPaths` returns `null` when `upstream/main` does not exist | FR-006 | example | DONE | cycle-log.md `U21`, commit `dc3f58d` |

### `.fork/ci/bin/principle-v-guard.mjs` (stream G; after A1–A9 are flipped as the CLI grows)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U22 | `--hook` reads `tool_input.notebook_path` when there is no `file_path`, and resolves a relative path against the input `cwd` | FR-007, research R1 | example | DONE | cycle-log.md `U22`, commit `659ed67` |
| U23 | `--hook` with unparseable stdin prints the deny JSON with reason starting `principle-v-guard failed:` and exits 0 | FR-011 | example | DONE | cycle-log.md `U23`, commit `f3db841` |
| U24 | `--hook` for a matched tool with no target path prints the `principle-v-guard failed:` deny and exits 0 | FR-011 | example | DONE | cycle-log.md `U24`, commit `6bdf930` |
| U25 | `--hook` whose rule library fails to load prints the `principle-v-guard failed:` deny and exits 0 (never a non-zero exit, which would let the write through) | FR-011, research R1 | example | DONE | cycle-log.md `U25`, commit `1133ecd` (first-run pass; behavior landed in A1 `22a59fb`; mutant-verified) |
| U26 | `--staged` lists staged deletions and both sides of a rename | FR-008, research R6 | example | DONE | cycle-log.md `U26`, commit `4568300` (first-run pass; behavior landed in A6 `34be6cf`; mutant-verified) |
| U27 | `--staged` on a guard failure exits 1 with `principle-v-guard failed:` | FR-011 | example | DONE | cycle-log.md `U27`, commit `50f43cd` |

### Wiring (stream W)

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U28 | `.claude/settings.json` has exactly one `PreToolUse` entry, matcher `Write\|Edit\|MultiEdit\|NotebookEdit`, one `command` hook running `node "$CLAUDE_PROJECT_DIR/.fork/ci/bin/principle-v-guard.mjs" --hook` with `timeout: 30` | FR-007 | example | DONE | cycle-log.md `U28`, commit `c07b76e` |
| U29 | `.fork/githooks/pre-commit` is executable, starts `#!/bin/sh`, and `exec`s the guard with `--staged` from the top-level | FR-009 | example | DONE | cycle-log.md `U29`, commit `c2ae20e` |
| U30 | `selfTestNeeded` is true for `.fork/githooks/` paths and `.claude/settings.json`; existing triggers unchanged | FR-013 (CI coverage) | example | DONE | cycle-log.md `U30`, commit `a5b6cce` |

## Invariants and edge cases still to place

None. Spec edge cases map to: missing upstream → U7, U8, U21; path forms → U12–U16; outside the repository → U1, U16; exact upstream file in a zone → U9; detached HEAD → U2, U17; malformed input and guard crash → U23–U25, U27; commit guard not enabled → A11 (documented).

## Out of scope

- Shell-command writes by the agent: not intercepted (spec Assumptions); the commit guard is the backstop.
- `--no-verify` bypass: deliberate owner override, documented, not tested as a failure.
- Fetching `upstream`: the rule reads the local ref only (research R2).
- Performance: measured once in quickstart §5, not a test (research R4).

## Verification commands

Copied verbatim from `.specify/memory/tdd-profile.md` at planning time, so this file is readable on its own:

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}`
- Full suite: `node .fork/ci/bin/tdd.mjs suite`
- Coverage: none (profile `coverage: null`)
- Mutation: none (profile `mutation: null`)

Stream agents work in their own worktrees and run `node --test` there instead (tasks.md, "Tests"): the adapter targets the plan's Worktree.
