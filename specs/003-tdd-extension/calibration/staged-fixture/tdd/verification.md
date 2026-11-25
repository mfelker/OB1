---
feature: specs/003-tdd-extension/calibration/staged-fixture
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; staged-PR section applied (plan Lane: staged upstream PR #532)
test_list_template: .specify/extensions/tdd/templates/tdd-test-list-template.md # no override or preset exists
verified_at: de2f9eb # fork-main HEAD (spec-kit artifacts); code under test at worktree head 58b0567, PR base 238df6c
lane: staged
tree: /Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default
folder: recipes/atomizer
behaviors: 3
proven: 2
likely: 0
test_after: 0
no_test: 0
not_applicable: 1
high_smells: 1
criteria_total: 3 # acceptance scenarios US1-AS1, US1-AS2, US2-AS1 (FR-001, FR-002)
criteria_covered: 3
mutation_score: unmeasured # no mutation tool in profile; 3 deliberate mutants, 3 caught
mutants_survived: 0
suite: 12 passed, 0 failed, 0.55s wall (node .fork/ci/bin/tdd.mjs suite, Node 26.13.0)
---

# TDD Verification: calibration fixture (staged lane, PR #532)

**Verdict: FAIL.** The PR turned the pre-existing test file `recipes/atomizer/test-atomize.mjs` (matched by the profile's `test_glob`, counted by the suite) from a hard failure into an unconditional `skipped` exit 0, so under this repository's runner, which always blanks keys, it can only ever report a pass while asserting nothing (Finding 1, HIGH: always-skipped / weakened existing test).

The fixture's own behaviors are sound: U1 and U2 are `PROVEN` by reproduced base-reds (S1), every acceptance criterion has a test through a real entry point, and all three deliberate mutants were caught. U3 does not classify the way the fixture's cycle log and the override contract expect (S2, `TEST_AFTER`): the PR did not change the OpenRouter default, the test passes at the base, and rule S4 makes it `NOT_APPLICABLE` (Finding 2). Had U3 been graded by S2 instead, the verdict would also be `FAIL`, so Finding 2 does not decide the verdict; Finding 1 does.

Audit independence: this audit was run by a fresh agent that did not write the tests, the cycle log, or the fixture.

## Test-first evidence

Staged lane rules (override rubric, fork section). PR base `238df6c` (`git merge-base HEAD upstream/main`), head `58b0567`. History, observed: source `8bebd77` (lib/atomize-text.mjs) lands before tests `cfbfe76` (atomize-text.test.mjs, test-support/fetch-stub.mjs); that ordering is test-after by base rules and is excused only by the staged rule, which replaces history ordering with base-red evidence.

| Behavior | Class            | Rule | Evidence |
| -------- | ---------------- | ---- | -------- |
| U1 (C1)  | `PROVEN`         | S1   | Cycle 1 records command, base `238df6c`, decisive line `actual: 'claude-sonnet-4-5'` / `expected: 'claude-sonnet-5-5'`, head green. Reproduced by this audit: base copy of `lib/atomize-text.mjs` gives `tests=1 pass=0 fail=1 → fail` with the same actual/expected; head gives pass. Failure is the missing behavior (the default value, `lib/atomize-text.mjs:252`). |
| U2 (K4)  | `PROVEN`         | S1   | Cycle 2 records command, base, decisive line `actual: '[fetch-stub] api.anthropic.com model=claude-sonnet-4-5\n'` against `/...model=claude-sonnet-5-5/`, head green. Reproduced identically by this audit. Failure is the behavior, not setup. |
| U3 (C3)  | `NOT_APPLICABLE` | S4   | No base-red recorded (cycle 3, deliberate). But the PR's diff of `lib/atomize-text.mjs` (238df6c..58b0567) touches only the Anthropic default (lines 28, 240, 252); `openrouterModel = "anthropic/claude-sonnet-4.5"` (`lib/atomize-text.mjs:254`) and `atomizeViaOpenRouter` (`:189`ff) are unchanged. This audit ran C3 against the base copy: `tests=1 pass=1 fail=0 → pass`. Code unchanged at base → S4, characterization. S2 also matches literally, but every S4 case matches S2 (unchanged code can never produce a base-red), so S4 is the specific rule. See Finding 2. |

Exit codes of the reproduced runs were not captured (zsh `PIPESTATUS`); the adapter summary lines (`fail=1 → fail` / `pass=1 → pass`) were observed.

### Existing tests changed by the PR

Diff range `238df6c..58b0567` (3 commits, 4 files). Only one pre-existing test file was touched: `recipes/atomizer/test-atomize.mjs` (commit `58b0567`). No config, threshold, filter or skip-marker changes. See Finding 1.

### tasks.md against the test list

T001 [U1], T002 [U2], T003 [U3] are ticked `[X]`; all three behaviors are `DONE` on the list. Consistent, no unearned ticks. (U3's state should be `BASELINE`, see Finding 2.)

## Findings

| #   | Severity | Finding | Evidence |
| --- | -------- | ------- | -------- |
| 1   | HIGH | **Existing test made always-skipped, reported as pass.** `test-atomize.mjs` matches `test_glob` (`**/test-*.mjs`), `tdd.mjs where` lists it as a test file, and the suite counts it (12 = 11 in `atomize-text.test.mjs` + 1). Before: missing key → `console.error(...)`, `process.exit(1)`. After: `console.log("skipped: ...")`, `process.exit(0)`. The adapter blanks every `*_API_KEY` for every child, so in this repository the script can only take the skip path. Observed: base copy under `node .fork/ci/bin/tdd.mjs file recipes/atomizer/test-atomize.mjs` → `tests=1 pass=0 fail=1 → fail`; head → prints `skipped: no API key for openrouter ...`, `tests=1 pass=1 fail=0 → pass`. It asserts nothing and inflates the pass count. Mitigation (not an excuse): its live path is exercised with a stub by K3/K4 and its skip path by K1/K2 in `atomize-text.test.mjs`. Should: either report as skipped (a skip signal fork-ci/the adapter counts as skip, not pass), or be declared non-test/exempt in the profile and fork-ci with that decision recorded, not silently counted green. | `recipes/atomizer/test-atomize.mjs:47-50, 53-56` (head); base `238df6c:recipes/atomizer/test-atomize.mjs:48-49, 54-55`; commit `58b0567` |
| 2   | MED | **Calibration control does not exercise S2; U3 is mislabelled.** The fixture means U3 as the "head green, no base-red → `TEST_AFTER`" control (cycle-log cycle 3; tasks.md T003; contract `specs/003-tdd-extension/contracts/staged-evidence-override.md:36` expects "C3 as S2 → TEST_AFTER"). But C3's code is unchanged by the PR and the test passes at the base, so the resolved rubric's S4 governs. The test list records U3 as `kind: example`, `state: DONE` where S4 calls for characterization / `BASELINE`. Per the contract's own line 37, "any other result is a fork-integration gap": the S2 path is currently unvalidated by this fixture, and the S2/S4 overlap has no stated precedence in the rubric. Should: pick a control whose code the PR did change (e.g. C2, explicit Anthropic model passthrough, if its code path differs at base — or another behavior with a real code change) with no base-red recorded; and/or state S4-over-S2 precedence in the rubric override and contract. | `specs/003-tdd-extension/calibration/staged-fixture/tdd/test-list.md` U3 row; `tdd/cycle-log.md` cycle 3; `lib/atomize-text.mjs:254` (unchanged since base) |
| 3   | MED | **Test exercises the test's own stub.** `network guard: the test stub refuses any other host` asserts only that the in-file `globalThis.fetch` replacement rejects unknown hosts; no feature code runs (Framework under test / test infrastructure under test). Outside this fixture's three behaviors; traces to nothing in this fixture's spec. | `recipes/atomizer/atomize-text.test.mjs:132-134` |
| 4   | LOW | Spec cross-references drift: the test file's section comments cite FR-002/FR-003 (US1) and FR-003/FR-004/FR-005/FR-007 (US2), which are spec 002's ids; this fixture's spec has FR-001/FR-002. Harmless here, but traces should be read through the test list, not these comments. | `recipes/atomizer/atomize-text.test.mjs:74, 101, 136` |

Smell pass on U1/U2/U3 tests (`atomize-text.test.mjs:76-82, 94-99, 103-109`): no HIGH smells. Assertions are on specific values (model string, URL, call count, atoms), not truthiness; the only double is `fetch` at the network boundary, so the subject runs for real; no conditional logic; deterministic (no clock, randomness, or network; subprocess with 15 s timeout in K4). C1/C3 carry four unlabelled assertions each, but all pin one behavior and `node:assert` diffs identify the failing one, so not reported as roulette. Style matches the profile's node-plain exemplar (which is this file). Suite is fast (0.55 s).

## Mutation results

No mutation tool (`mutation: null` in profile). Deliberate mutants, one at a time, each restored with `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs` and the full suite re-run green (12/12) after each.

| Mutant | Behavior | Test run | Survived | Judgment |
| ------ | -------- | -------- | -------- | -------- |
| M1 `lib/atomize-text.mjs:252` default `"claude-sonnet-5-5"` → `"claude-sonnet-5-4"` | U1, U2 | C1, K4 | No (both fail) | Default value pinned at library and CLI level |
| M2 `lib/atomize-text.mjs:159` `model: anthropicModel` → `model: "claude-sonnet-4-5"` (drop the wiring) | U1, U2 | C1, K4 | No (both fail) | Wiring from option to request body pinned |
| M3 `lib/atomize-text.mjs:254` openrouter default → `"anthropic/claude-sonnet-5-5"` | U3 | C3 | No (fails) | Unchanged-default guard works as a regression pin |

Sampled: all 3 behaviors, 3 mutants. Not exhaustive; no mutants on `test-atomize.mjs`.

## Traceability

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1-AS1 / FR-001 (C1) | U1 `atomize-text.test.mjs::C1 anthropic default model is claude-sonnet-5-5` (`:76`) | Yes: public `atomizeText`, fetch doubled at the network boundary only |
| US1-AS2 / FR-001 (K4) | U2 `atomize-text.test.mjs::K4 anthropic CLI with key requests the default model (stubbed)` (`:94`) | Yes: spawns the real CLI `test-atomize.mjs` with a fetch-stub preload |
| US2-AS1 / FR-002 (C3) | U3 `atomize-text.test.mjs::C3 openrouter default model is unchanged` (`:103`) | Yes: public `atomizeText` |

All three claimed tests exist and pass individually via `tdd.mjs single`. Untested criteria: none. Tests tracing to nothing in this fixture: C2, C4–C6, K1–K3 (declared out of scope, covered by spec 002), `network guard` (Finding 3), and `test-atomize.mjs` as a standalone test (Finding 1).

## What was not audited

- Coverage: `coverage: null` in the profile; not measured.
- Mutation by tool: none available; deliberate-mutant sample only (3 mutants, `lib/atomize-text.mjs` only).
- Behaviors C2, C4–C6, K1–K3 and the network guard were out of this fixture's test list; only smell-checked where noted, not graded for test-first evidence.
- `test-support/fetch-stub.mjs` was read but not mutated.
- The live (real-network) path of `test-atomize.mjs` was not exercised; the adapter blanks keys by design.
- Performance, security, and the remaining atomizer recipe files were out of scope.
- The cycle log's baseline claim "12/12 at head" was reproduced; no base-suite baseline was recorded by the cycle log (this audit observed `test-atomize.mjs` red at base, so the base suite was not green).

## Remediation (listed, not applied)

Per the audit's instructions, `tasks.md` was not modified (`--no-tasks` equivalent). Suggested tasks, in order:

1. (Finding 1, blocking) Decide how `recipes/atomizer/test-atomize.mjs` is counted: make its no-key path report as a skip that fork-ci and `tdd.mjs` count as skipped rather than passed, or record it as an exempt live script in the profile and fork-ci. Done when `node .fork/ci/bin/tdd.mjs suite` no longer reports it as a pass with blanked keys. Note this touches upstream PR #532's code; it may be a fork-adapter change instead.
2. (Finding 2) Replace the U3 control with a behavior whose code the PR changed and record no base-red for it, or reclassify U3 as `characterization`/`BASELINE`; and state S4-over-S2 precedence in `.specify/templates/overrides/tdd-test-quality-rubric.md` and the override contract. Done when re-running `speckit-tdd-verify` on the fixture yields one `TEST_AFTER` via S2.
3. (Finding 3) Move or relabel the `network guard` test as test-infrastructure, or drop it. Verify with `node .fork/ci/bin/tdd.mjs file recipes/atomizer/atomize-text.test.mjs`.

Worktree state after audit: `git -C /Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default status --short --untracked-files=no` empty.
