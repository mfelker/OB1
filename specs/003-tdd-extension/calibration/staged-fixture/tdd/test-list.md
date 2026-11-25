---
feature: staged-fixture # calibration fixture under specs/003-tdd-extension/calibration/
loop: inside-out # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 4 # acceptance criteria found in spec.md
planned_at: 80b7985 # short SHA the list was derived from
updated_at: 9a4f1b2 # short SHA of the last change to this file
suite_baseline: green # green | red | unknown, at planning time
---

# Test List: calibration fixture (staged lane, PR #532)

`loop: inside-out`: each behavior is observed at `atomizeText` or the `test-atomize.mjs` CLI, the recipe's own entry points. The tests already exist at the PR head (staged lane), so the red evidence is the override's base-red procedure.

## Inner loop: unit behaviors

### `recipes/atomizer/lib/atomize-text.mjs`

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1  | `atomizeText` with provider anthropic and no model sends `claude-sonnet-5-5` | US1 AS1, FR-001 (C1) | example | DONE | `recipes/atomizer/atomize-text.test.mjs::C1 anthropic default model is claude-sonnet-5-5` |
| U2  | The CLI with `--provider=anthropic` and a key requests `claude-sonnet-5-5` and exits 0 | US1 AS2, FR-001 (K4) | example | DONE | `recipes/atomizer/atomize-text.test.mjs::K4 anthropic CLI with key requests the default model (stubbed)` |
| U3  | `atomizeText` with provider openrouter and no model sends `anthropic/claude-sonnet-4.5` | US2 AS1, FR-002 (C3) | characterization | BASELINE | `recipes/atomizer/atomize-text.test.mjs::C3 openrouter default model is unchanged` |
| U4  | The CLI with `--provider=anthropic` and no key prints a skip line and exits 0 | US3 AS1, FR-003 (K2) | example | DONE | `recipes/atomizer/atomize-text.test.mjs::K2 anthropic CLI without a key skips with exit 0` |

## Out of scope

- C2, C4–C6, K1, K3 and the network guard: covered by spec 002; this fixture needs two base-red behaviors and two deliberate controls (K2 for S2, C3 for S4).

## Verification commands

Copied verbatim from `.specify/memory/tdd-profile.md` at planning time:

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}`
- Full suite: `node .fork/ci/bin/tdd.mjs suite`
