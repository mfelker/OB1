---
feature: 003-tdd-extension
loop: inside-out
profile: .specify/memory/tdd-profile.md
spec_criteria: 13
planned_at: d83711a
updated_at: b4227e1
suite_baseline: green
---

# Test List: Adopt the spec-kit-tdd extension for enforced TDD

Written by hand, under the extension's format (research R11): the extension can't plan its own installation.

- **Loop**: `inside-out`. The adapter is internal tooling, so units are driven first and the acceptance behaviors close each stream through the CLI entry point. A7–A12, A15 and A16 are post-merge or on-PR checks (tasks T028–T032).
- **Scope**: the 13 acceptance scenarios in `spec.md` map to A3–A15. A1, A2 and A16 trace to FR-001, FR-009 and SC-007.

## Outer loop: acceptance behaviors

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1  | The installed extension is byte-identical to tag `v2.0.1` | FR-001 | example | DONE | `specs/003-tdd-extension/evidence/r1-verify.md` (T004–T005) |
| A2  | Profile commands were each run before being recorded (single, zero-match, file, suite) | FR-009 | example | DONE | cycle-log.md `A2`, commit `f40c89d` |
| A3  | `suite` for a feature whose plan names a real git worktree runs that worktree's folder | US2 AS1, FR-004 | example | DONE | covered by U5, U9, U24; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `A3`, commit `21d2a1b` |
| A4  | The profile's `single` command run as written exits 3 for a name that matches nothing | US2 AS2, FR-006 | example | DONE | covered by U14, U15, U23; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `A4`, commit `1009717` |
| A5  | A fork feature with Worktree `none` uses the repo-root checkout | US2 AS3 | example | DONE | covered by U6; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `A5`, commit `dcaf663` |
| A6  | A missing folder or no detectable runtime fails explicitly | US2 AS4, FR-007 | example | DONE | covered by U11, U13; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `A6`, commit `2962db5` |
| A7  | `/speckit-implement` drives the behavior through the loop before anything else | US1 AS1, FR-002 | example | PENDING | |
| A8  | With no test list, `/speckit-implement` stops | US1 AS2 | example | PENDING | |
| A9  | The cycle log records the test, red command, failure line, green and commit | US1 AS3 | example | PENDING | |
| A10 | Calibration fixture C1/K4 with a real base-red classify `PROVEN` | US3 AS1, FR-010 | example | PENDING | |
| A11 | Calibration fixture C3 without a base-red classifies `TEST_AFTER` | US3 AS2 | example | PENDING | |
| A12 | The fork-lane audit of 003 applies the base rules (the fork section stays inert) | US3 AS3 | example | PENDING | |
| A13 | Principle IV names the cycle log as red evidence, the staged base-red rule and the mandatory hook | US4 AS1, FR-011 | example | DONE | cycle-log.md `A13`, commit `1d4ff90` |
| A14 | The runbook TDD workflow covers the test list, the loop, the audit before merge, and disabling the hook | US4 AS2, FR-012 | example | DONE | cycle-log.md `A14`, commit `d7478f1` |
| A15 | Calibration reports exist for 002 (`BLOCKED`, with reason) and for the fixture | US5 AS1, FR-013 | example | PENDING | |
| A16 | The fork PR's verdict summary shows the 003 TDD status row with the verdict unchanged | FR-014, SC-007 | example | PENDING | |

## Inner loop: unit behaviors

### `.fork/ci/lib/tdd-target.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1  | `SPECIFY_FEATURE_DIRECTORY` wins over `.specify/feature.json` | FR-004 | example | DONE | cycle-log.md `U1`, commit `adb3068` |
| U2  | `feature.json` `feature_directory` is used when there's no env | FR-004 | example | DONE | cycle-log.md `U2`, commit `1421f3b` |
| U3  | Neither present gives "no active feature" | FR-007 | example | DONE | cycle-log.md `U3`, commit `8fdfda0` |
| U4  | Lane grammar: fork / upstream-bound / staged; a placeholder or unknown value is an error | FR-004, FR-007 | example | DONE | cycle-log.md `U4`, commit `8530e1a` |
| U5  | A backticked absolute Worktree path becomes `tree` | FR-004 | example | DONE | cycle-log.md `U5`, commit `82a2fe8` |
| U6  | Worktree `none…` gives `repoRoot` | FR-004 | example | DONE | cycle-log.md `U6`, commit `b6b61fd` |
| U7  | A Worktree placeholder or non-absolute token is an error | FR-007 | example | DONE | cycle-log.md `U7`, commit `b0dffbc` |
| U8  | A missing Worktree line gives `repoRoot` for fork; staged / upstream-bound give an error | FR-007 | example | DONE | cycle-log.md `U8`, commit `7d504c2` |
| U9  | A Worktree not on disk, or not a git work tree, is an error | FR-007 | example | DONE | cycle-log.md `U9`, commit `08ed34b` |
| U10 | Contribution folder grammar: placeholder; `N/A` checked before backticks; trailing `/` stripped; a leading `/` or `..` rejected | FR-004, FR-007 | example | DONE | cycle-log.md `U10`, commit `11eafb3` |
| U11 | `folderExists:false` is allowed for `suite` only; other ops get "folder not found" | FR-007, FR-017 | example | DONE | cycle-log.md `U11`, commit `0c24e82` |

### `.fork/ci/lib/tdd-commands.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U12 | File resolution order (folder, tree, repo root), then the inside-tree check after every resolution | FR-007 | example | DONE | cycle-log.md `U12`, commit `07db776` |
| U13 | A file no runtime owns is rejected, naming the patterns | FR-005 | example | DONE | cycle-log.md `U13`, commit `a3dacc9` |
| U14 | node-test argv (`--test-isolation=none --test-reporter=spec`, anchored escaped name as one element) and `cwd` = tree + runtime root | FR-005, FR-006 | example | DONE | cycle-log.md `U14`, commit `2f635bc` |
| U15 | node count parser: `tests 0` is zero-match; unparseable output gives `null` | FR-006 | example | DONE | cycle-log.md `U15`, commit `b20e2fd` |
| U16 | A plain `test-*.mjs` script is `plain-script`: `single` unsupported, `file` under process isolation | FR-005, FR-006 | example | DONE | cycle-log.md `U16`, commit `d2b140f` |
| U17 | deno argv from `runtime.command` plus `--filter`; the `0 passed` parser | FR-005, FR-006 | example | DONE | cycle-log.md `U17`, commit `1c283eb` |
| U18 | python cached venv keyed by tree + root and the requirements hash; `-k`; exit 5 is zero-match | FR-005, FR-006 | example | DONE | cycle-log.md `U18`, commit `ba630a7` |
| U19 | node-script vitest/jest `single`; other runners unsupported | FR-005 | example | DONE | cycle-log.md `U19`, commit `dcf09c3` |
| U20 | sql `file` gives the psql verify argv; `single` is unsupported | FR-005 | example | DONE | cycle-log.md `U20`, commit `cc602f0` |

### `.fork/ci/lib/tdd-env.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U21 | `childEnv`: `NODE_TEST_CONTEXT` removed; credential vars set to `""`; others kept | FR-016 | example | DONE | cycle-log.md `U21`, commit `5f32911` |

### `.fork/ci/bin/tdd.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U22 | `where` prints the JSON, including `featureDir` and `folderExists` | FR-004 | example | DONE | cycle-log.md `U22`, commit `7bc1d36` |
| U23 | `single`/`file` end to end: pass 0, fail 1, zero-match 3; output streamed in full | FR-006 | example | DONE | cycle-log.md `U23`, commit `9777c3a` |
| U24 | `suite` exit mapping, including the empty baseline | FR-017 | example | DONE | cycle-log.md `U24`, commit `56db46d` |
| U25 | `suite` restores a lockfile it modified that was clean before | FR-015 | example | DONE | cycle-log.md `U25`, commit `ec3f8c6` |
| U26 | Usage, target and Node < 26 errors exit 2 with a single-line message | FR-007 | example | DONE | cycle-log.md `U26`, commit `a2a39da` |
| U27 | The summary line names `feature=` and `folder=` | FR-007 | example | DONE | cycle-log.md `U27`, commit `df3fba2` |

### `.fork/ci/lib/tdd-status.mjs`, `lib/report.mjs`, `bin/verdict.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U28 | `tddStatus` per-feature fields and verdict values, including missing and unreadable | FR-014 | example | DONE | cycle-log.md `U28`, commit `eebd275` |
| U29 | Several specs naming the same branch give one entry each | FR-014 | example | DONE | covered by U28; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `U29`, commit `02b4fd4` |
| U30 | No spec names the branch gives `linked:false` | FR-014 | example | DONE | cycle-log.md `U30`, commit `a63299b` |
| U31 | Empty headRef (push) gives `null` | FR-014 | example | DONE | cycle-log.md `U31`, commit `063c7a1` |
| U32 | The branch is compared literally | FR-014 | example | DONE | covered by U28; passed on first run, verified with a deliberate mutant (playbook); cycle-log.md `U32`, commit `bb44e34` |
| U33 | `renderReport` renders T1–T10 with escaped pipes; no section for `null` | FR-014 | example | DONE | cycle-log.md `U33`, commit `4f95dc0` |
| U34 | `bin/verdict.mjs`: same conclusion and exit for every status; a throw renders the T10 line | FR-014 | example | DONE | cycle-log.md `U34`, commit `0f1f437` |

### `.fork/ci/lib/self-test-needed.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U36 | `selfTestNeeded` fires for overrides, the installed tdd extension, the constitution and `.fork/README.md` | FR-010, FR-011, FR-012 | example | DONE | cycle-log.md `U36`, commit `e932952` |

### `.specify/templates/overrides/`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U35 | The installed base hash equals `base_sha256`, and stripping the header and fork section reproduces the base | FR-010 | example | DONE | cycle-log.md `U35`, commit `c77f3e4` |
| U37 | `suite`'s summary line reports `tests=`/`pass=`/`fail=` summed over the runtimes that ran (`?` when unparseable) | US2 AS1, FR-004 | example | DONE | cycle-log.md `U37` (T024 remediation H2) |

## Invariants and edge cases still to place

- None. All spec edge cases map to a behavior above or to a stated assumption.

## Out of scope

- Retrofitting specs 001 and 002 with test lists: spec Assumptions. 002 is read only for calibration (A15).
- The fork-ci "manual scripts" mechanism: a separate feature (spec 002, Q1 option C). FR-016 covers the credential risk.
- Making the advisory TDD status blocking: a later follow-up (FR-014, Q1 option B).
- Mutation testing: no tool in the stack. The audit uses deliberate mutants.

## Verification commands

The profile doesn't exist yet when this list is written (see the cycle log deviation). These are the planned profile commands (contracts/tdd-profile.md); until T014 records them, cycles use the direct runner.

- Single test: `node .fork/ci/bin/tdd.mjs single <file> "<name>"` (until T014: `node --test --test-isolation=none --test-reporter=spec --test-name-pattern="<name>" <file>`)
- File: `node .fork/ci/bin/tdd.mjs file <file>`
- Full suite: `node .fork/ci/bin/tdd.mjs suite` (until T014: `node --test .fork/ci/test/`)
- Coverage and mutation: none
