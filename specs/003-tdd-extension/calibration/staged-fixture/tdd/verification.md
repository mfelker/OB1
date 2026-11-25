---
feature: staged-fixture # specs/003-tdd-extension/calibration/staged-fixture
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; fork staged-PR section applied
verified_at: 58b0567 # worktree stage/pr-532-atomizer-default HEAD; fork-main checkout HEAD 90cf00d
pr_base: 238df6c # git merge-base HEAD upstream/main
lane: staged upstream PR #532
behaviors: 4
proven: 2
likely: 0
test_after: 1
no_test: 0
not_applicable: 1
high_smells: 2
high_findings_total: 3
criteria_total: 4
criteria_covered: 4
mutation_score: unmeasured # no mutation tool; 6 deliberate mutants, 6 killed, 0 survivors in a DONE behavior
mutants_survived: 0
suite: 12 passed, 0 failed, 0.55s # node .fork/ci/bin/tdd.mjs suite, Node 26.13.0
---

# TDD Verification: calibration fixture (staged lane, PR #532)

**Verdict: FAIL.** U4 (K2, CLI skips without a key) is `TEST_AFTER` by rule S2: the PR changed its code
(`58b0567`, `recipes/atomizer/test-atomize.mjs:47-50`) and the cycle log records only a head green, no base-red.

U1 and U2 are `PROVEN` by rule S1, and I reproduced both base-reds. U3 is `NOT_APPLICABLE` by rule S4,
because its code is the same at the base and the head. Every acceptance criterion has a test through a real
entry point. All six deliberate mutants were killed. Three further `HIGH` findings stand on their own and
would also produce a `FAIL`:
- an existing glob-matched test, `test-atomize.mjs`, now always passes without asserting anything under the
  adapter;
- a tautological network-guard test;
- `T003` is ticked although its behavior is `BASELINE`.

This audit was run from cold context by an agent that did not write these tests.

## Standard and templates resolved

- Rubric: `.specify/templates/overrides/tdd-test-quality-rubric.md`. It is the first match in the stack: an
  override exists, there is no `.specify/presets/` directory, and the extension copy was not used.
- Test list template: `.specify/extensions/tdd/templates/tdd-test-list-template.md`. There is no override and no
  preset, so the extension copy is used.
- Lane section: the rubric's `<!-- fork: staged-pr evidence -->` section (lines 62-88) applies, because
  `plan.md` has `**Lane**: staged upstream PR #532`. `node .fork/ci/bin/tdd.mjs where` confirms lane `staged`,
  tree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default` and folder `recipes/atomizer`.
- Rule order: I followed the override's stated order, "S4 takes precedence over S2" (rubric line 84). For each
  behavior I first diffed its source between base `238df6c` and head `58b0567` to test S4. I applied S2 or S3
  only to behaviors whose code the PR changed, and S1 where a base-red is recorded.

## Test-first evidence

The git history, read alone, shows source first: `8bebd77` (lib), then `cfbfe76` (tests), then `58b0567`
(CLI). That is expected on the staged lane. The override replaces history ordering with a base-red at the PR
base plus a green at the head.

| Behavior | Class | Rule | Evidence |
| -------- | ----- | ---- | -------- |
| U1 (C1) | PROVEN | S1 | The PR changed the code: `8bebd77` moves `lib/atomize-text.mjs:252` from `claude-sonnet-4-5` to `claude-sonnet-5-5`. Cycle 1 records the command, base `238df6c`, the decisive line (`actual: 'claude-sonnet-4-5'` / `expected: 'claude-sonnet-5-5'`) and a head green. I reproduced it: `single … "C1 …"` with base lib gives `tests=1 pass=0 fail=1 → fail`, exit=1, with the same actual and expected; at head the suite is green. |
| U2 (K4) | PROVEN | S1 | The PR changed the code (same default, reached through the CLI). Cycle 2 records the command, the base, the decisive line (`actual: '[fetch-stub] api.anthropic.com model=claude-sonnet-4-5\n'` against `/…model=claude-sonnet-5-5/`) and a head green. I reproduced it: exit=1, `→ fail`, the same failure line. |
| U3 (C3) | NOT_APPLICABLE | S4 | The code is unchanged. `git diff 238df6c HEAD -- recipes/atomizer/lib/atomize-text.mjs` has `openrouterModel` (`lib/atomize-text.mjs:254`, and line 205 where it is used) only on context lines. C3 passes at the base lib: `tests=1 pass=1 fail=0 → pass`, exit=0. S4 was checked first, so S2 is not applied. The test list records U3 as `characterization` / `BASELINE`, which matches. |
| U4 (K2) | TEST_AFTER | S2 | S4 does not apply: `58b0567` changes the anthropic no-key branch at `test-atomize.mjs:47-50` from `console.error(…requires…)` + `exit(1)` to `console.log("skipped: …")` + `exit(0)`. Cycle 4 records no red ("none recorded, deliberately"), only a head green, so S2 applies and fails closed. The missing S1 elements are the base SHA, the red command and the decisive failure line. My own base reproduction (below) does not upgrade the class, because the class is graded on recorded evidence. |

Observation for U4: a valid base-red is obtainable but was not recorded. With `test-atomize.mjs` checked out
at `238df6c`, `single … "K2 anthropic CLI without a key skips with exit 0"` gives exit=1, `tests=1 pass=0
fail=1 → fail`, decisive line `actual: 1, expected: 0` (message `--provider=anthropic requires
ANTHROPIC_API_KEY …`). That failure is the missing behavior, so recording it would satisfy S1.

### Existing tests changed by the range

`git diff 238df6c HEAD --stat` touches four files. `atomize-text.test.mjs` and `test-support/fetch-stub.mjs`
are new. `lib/atomize-text.mjs` is source. `test-atomize.mjs` existed at the base and matches the profile's
`test_glob` (`**/test-*.mjs`), and `where` lists it in `testFiles`, so it is an existing test that the range
changed:

- Before (`238df6c`): with no key for the selected provider, it printed `--provider=<p> requires <VAR> …` to
  stderr and exited 1, so the runner reported a failure.
- After (`58b0567`, `test-atomize.mjs:47-56`): it prints `skipped: no API key for <p> …` to stdout and exits 0.
- Effect: the adapter blanks every `*_API_KEY` (profile, Notes), so in the committed state this file always
  takes the skip path. The runner counts it as a pass, not a skip: `file recipes/atomizer/test-atomize.mjs`
  reports `tests=1 pass=1`, `skipped 0`. It contributes 1 of the suite's 12 passes and asserts nothing.
- Justification given: the commit message, and FR-003/K2, which make the skip the specified behavior. Per the
  rubric this is reported whatever the reason. The behavior itself is properly asserted by K2. The finding is
  that a glob-matched "test" now always reports green without checking anything (Finding 2).

There are no other removed or loosened assertions, skip markers, config exclusions or threshold changes. The
repository has no coverage or mutation thresholds.

### tasks.md against the test list

| Task | Box | Behavior state | Judgment |
| ---- | --- | -------------- | -------- |
| T001 | [X] | U1 DONE | consistent |
| T002 | [X] | U2 DONE | consistent |
| T003 | [X] | U3 BASELINE | **mismatch**. The verify skill says a ticked task whose behavior is not `DONE` is a `HIGH` finding, and `speckit-tdd-run` (`.claude/skills/speckit-tdd-run/SKILL.md:272-274`) says never to tick a task whose behavior is `BASELINE`. Mitigation: the characterization evidence exists (I reproduced the base green). See Finding 3. |
| T004 | [X] | U4 DONE | consistent with the list. The list's `DONE` rests on a head green only (see U4). |

## Findings

Ordered by severity.

| # | Severity | Finding | Evidence | Should be |
| - | -------- | ------- | -------- | --------- |
| 1 | HIGH (blocking) | U4 is `TEST_AFTER` under S2. The code changed between the base and the head, and there is no base-red in the cycle log. | `test-atomize.mjs:47-50` (`58b0567`); cycle-log Cycle 4 "red: none recorded" | A Cycle 4 entry that records the base-red procedure for K2: the command, base `238df6c`, the decisive line `actual: 1 / expected: 0`, and a head green. |
| 2 | HIGH | Weakened existing test, and an always-skipped test in the committed state: `test-atomize.mjs` (glob-matched) went from exit 1 to exit 0 without a key. Under the adapter, where keys are always blank, it always passes and asserts nothing. | `test-atomize.mjs:47-56`; `tdd.mjs file recipes/atomizer/test-atomize.mjs` → `tests=1 pass=1`, `skipped 0` | The script reports as skipped rather than passed (for example, the runner sees a skip), or it is excluded from `test_glob` discovery as a live sanity script, so the suite count does not include a green that verifies nothing. The owner should decide which, because FR-003 mandates exit 0. |
| 3 | HIGH | `T003` is ticked `[X]` while U3 is `BASELINE`. This is a completion claim that the lifecycle rules forbid. | `tasks.md:5` (T003); `tdd/test-list.md` U3 row; `.claude/skills/speckit-tdd-run/SKILL.md:272-274` | `T003` unticked, or reworded through the planning step so that a characterization task is not tracked as an implementation checkbox. Practical risk is low: `/speckit-implement` would skip it, and no implementation is needed. |
| 4 | HIGH (smell: Tautological assertion) | `network guard: the test stub refuses any other host` asserts that the test's own `beforeEach` stub throws for an unknown host. That is exactly what `atomize-text.test.mjs:48` configured. It proves nothing about `atomizeText` or the CLI. | `recipes/atomizer/atomize-text.test.mjs:132-134` (stub at `:45-54`) | Assert the property against the subject. For example, record every URL `atomizeText` requests and assert the list equals the expected provider endpoint, or rely on the stub's throw inside the behavior tests. Outside the fixture's U1-U4 scope, but in a new test file, so it is graded. |
| 5 | MED (smell: Eager test) | `C5` checks two providers' missing-key guards in one test, so it has two reasons to fail. | `atomize-text.test.mjs:121-125` | Split into one test per provider. Outside U1-U4 scope. |
| 6 | LOW | The cycle-log header attributes the PR's source change only to `8bebd77`. The range has a second source commit, `58b0567` (`test-atomize.mjs`), by a different author from `8bebd77`, with a fork session trailer. Cycle 4 acknowledges it later. | `tdd/cycle-log.md` header; `git log 238df6c..HEAD` | The header names both source commits, and says whether `58b0567` is part of upstream PR #532 or a fork addition on the staging branch. |
| 7 | LOW | The section comments in the test file cite spec 002's ids (`FR-002, FR-003`, `FR-007`), not this fixture's (`FR-001`-`FR-003`). K2 sits under a "US2" banner, but it is US3 here. | `atomize-text.test.mjs:74,101,136` | Informational: the file belongs to spec 002, and this fixture re-describes it. No change required in the PR. |
| 8 | LOW | `spec.md` says the fixture "re-describes three behaviors", but the test list has four (U1-U4). | `spec.md` line 6; `tdd/test-list.md` | Make the count consistent. |
| 9 | INFO | Cycle 3's original entry calls C3 a `TEST_AFTER` (S2) control. A later "Correction" entry reclassifies it as S4 (`BASELINE`), which agrees with this audit. The log is append-only, so the superseded text remains. | `tdd/cycle-log.md` Cycle 3 and Correction | None. |

Smell pass coverage:
- Files graded: all three glob-matched test files in the range: `atomize-text.test.mjs` (11 tests), the
  helper `test-support/fetch-stub.mjs` (as its support module), and `test-atomize.mjs`.
- Repository-relative items:
  - The profile's node-plain exemplar is `recipes/atomizer/atomize-text.test.mjs`, the audited file itself, so
    `Foreign style` cannot be judged independently. The folder had no prior tests to compare against.
  - The recorded helpers (`.fork/ci/test/fixtures.mjs`, `.fork/ci/test/helpers/folder.mjs`,
    `git-fixture.mjs`) build runtime-detection fixture folders and temp git repos for `.fork/ci`. They do not
    apply to atomizer tests, so there is no `Bypassed test utility`.
  - There is no `Framework under test` finding beyond #4, and no `Redundant test`: C1 (in-process) and K4
    (CLI) cover one criterion at two levels.
- U1-U4 tests individually:
  - Each asserts a specific value (`model`, exit code, an anchored stdout or stderr regex). There are no
    vacuous or truthiness checks and no conditional assertions.
  - Determinism holds. `loadEnv` gives `process.env` precedence over `.env.local`
    (`lib/entity-resolver.mjs:433-437`), and K2 and K4 set the keys explicitly, so a local `.env.local` cannot
    change their outcome. K4 also runs under a preload stub that throws for any other host.
  - Speed is fine: the whole suite takes 0.55 s.

## Mutation results

There is no mutation tool (profile: `mutation: null`), so I used deliberate mutants. Each was applied singly in
the worktree and the behavior's test was run with `node .fork/ci/bin/tdd.mjs single`. The file was then
restored with `git checkout HEAD -- <file>`, the suite was re-run (`tests=12 pass=12 fail=0 → pass` after
every restore), and `git status --short --untracked-files=no` was confirmed empty.

| Mutant | Behavior | Test run | Survived | Judgment |
| ------ | -------- | -------- | -------- | -------- |
| M1 `lib/atomize-text.mjs:252` default `claude-sonnet-5-5` → `claude-sonnet-5-0` | U1 | C1 | No | Caught (`actual: 'claude-sonnet-5-0'`). |
| M2 `lib/atomize-text.mjs:159` `model: anthropicModel` → `model: "claude-sonnet-5-5"` | U1 (C2) | C1, then C2 | C1: yes · C2: no | Equivalent with respect to U1, because the default value is still sent, so this is not a U1 survivor. It is killed by C2 (`actual: 'claude-sonnet-5-5'`, expected the explicit model). |
| M3 `test-atomize.mjs:63` CLI forces `anthropicModel: "claude-sonnet-4-5"` | U2 | K4 | No | Caught (stderr `model=claude-sonnet-4-5`). |
| M4 `test-atomize.mjs:49` skip branch `exit(0)` → `exit(1)` | U4 | K2 | No | Caught (`actual: 1`). |
| M5 `test-atomize.mjs:48` skip message names `openrouter` instead of `anthropic` | U4 | K2 | No | Caught (regex `/skipped: no API key for anthropic/` failed). |
| M6 `lib/atomize-text.mjs:254` OpenRouter default → `anthropic/claude-sonnet-5-5` | U3 | C3 | No | Caught (`actual: 'anthropic/claude-sonnet-5-5'`). |

Summary: 4 behaviors sampled (all of U1-U4), 6 distinct mutants, 6 killed, 0 survivors inside a `DONE`
behavior. The base-reds for U1, U2 and U4, reproduced above, act as three more natural mutants and were all
caught. Coverage is unavailable (`coverage: null`).

## Traceability

| Criterion | Behaviors / tests | Exists and runs | End to end |
| --------- | ----------------- | --------------- | ---------- |
| US1 AS1 (C1), FR-001 | U1 `atomize-text.test.mjs::C1 anthropic default model is claude-sonnet-5-5` (`:76`) | Yes (suite green) | Yes. Real `atomizeText`; only the network (`fetch`) is stubbed. |
| US1 AS2 (K4), FR-001 | U2 `::K4 anthropic CLI with key requests the default model (stubbed)` (`:94`) | Yes | Yes. Spawns the real CLI with a fetch preload. |
| US2 AS1 (C3), FR-002 | U3 `::C3 openrouter default model is unchanged` (`:103`) | Yes | Yes. Real `atomizeText`, fetch stubbed. |
| US3 AS1 (K2), FR-003 | U4 `::K2 anthropic CLI without a key skips with exit 0` (`:145`) | Yes | Yes. Real CLI, no doubles. |

Untested criteria: none. Tests that trace to nothing in this fixture: C2, C4, C5, C6, the network guard, K1,
K3, and the `test-atomize.mjs` script entry. The test list's "Out of scope" section declares these as covered
by spec 002, so they are not undocumented requirements here.

## Remediation

These tasks are listed here only. By the auditor's instructions for this run, `tasks.md`, the test list, the
cycle log and all tests and source were left untouched, and no remediation section was appended. **The
feature is not done until R1 is cleared.** R2 and R3 are also `HIGH`.

- R1 (Finding 1, blocking): append a Cycle 4 base-red entry for K2 to `tdd/cycle-log.md`. Run it with
  `git -C <tree> checkout 238df6c -- recipes/atomizer/test-atomize.mjs` and then
  `node .fork/ci/bin/tdd.mjs single recipes/atomizer/atomize-text.test.mjs "K2 anthropic CLI without a key skips with exit 0"`.
  Expect exit 1 with `actual: 1 / expected: 0`. Restore with `checkout HEAD --` and record the head green.
  Done when this audit re-classifies U4 as `PROVEN` (S1). As a calibration fixture, U4 is a deliberate S2
  control, so the maintainer may instead accept this `FAIL` as the expected calibration outcome.
- R2 (Finding 2): decide how the live sanity script `recipes/atomizer/test-atomize.mjs` (`:47-56`) is
  reported when it skips. Done when
  `node .fork/ci/bin/tdd.mjs file recipes/atomizer/test-atomize.mjs` no longer reports a pass that verifies
  nothing, or when the script is excluded from discovery by a documented rule. This affects upstream PR
  content, so it is the PR owner's call.
- R3 (Finding 3): untick `T003` in `tasks.md`, or re-plan it as a non-checkbox characterization note. Done
  when every `[X]` maps to a `DONE` behavior.
- R4 (Finding 4): replace `atomize-text.test.mjs:132-134` with an assertion on the subject's requested URLs.
  Done when the test fails under a mutant that sends `atomizeText` to a wrong host. This is spec 002's test,
  so route it there.
- R5 (Finding 5): split `C5` (`atomize-text.test.mjs:121-125`) into one test per provider (spec 002).
- R6-R7 (Findings 6 and 8): correct the cycle-log header's source-commit attribution, and the behavior count
  in `spec.md`.

## What was not audited

- Mutation was by 6 hand-made mutants on U1-U4 only, scoped to `lib/atomize-text.mjs` and
  `test-atomize.mjs`. It was not a tool run and it is not exhaustive. Other code in `lib/atomize-text.mjs`
  (the claude-cli path, the prompt, parsing, timeouts) was not mutated.
- Coverage: no tool is configured, so it was not measured.
- Tests outside U1-U4 (C2, C4-C6, K1, K3, the network guard) were graded for smells only. Their test-first
  evidence belongs to spec 002 and was not classified here.
- Whether `58b0567` is part of upstream PR #532 or a fork-only commit on the staging branch was not checked
  against GitHub.
- Live-provider behavior (real Anthropic or OpenRouter calls), performance and load: no criterion, not
  assessed.
- The other atomizer scripts (`atomize-packs.mjs`, `audit-gmail-pipeline.mjs`, and so on) are not in the
  range and were not assessed.
