---
feature: 003-tdd-extension
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # resolved first in the template stack; its fork section was NOT applied (lane is fork feature)
verified_at: e9290e3
behaviors: 53
proven: 37
likely: 0
test_after: 6
no_test: 10
high_smells: 0
criteria_total: 13
criteria_covered: 6
mutation_score: unmeasured # no mutation tool in the profile; 19 deliberate mutants, 16 caught, scope: feature-changed files in .fork/ci
mutants_survived: 3 # all non-equivalent, all inside DONE behaviors (U21, U37)
suite: 147 passed, 0 failed, 4.8s
---

# TDD Verification: Adopt the spec-kit-tdd extension for enforced TDD

**Verdict: FAIL.** 7 of the 13 acceptance scenarios have no test (A7–A12 and A15 are PENDING). That alone fails the rubric. Three other conditions each fail it independently:

- 6 behaviors are `TEST_AFTER`: A3–A6, U29 and U32.
- 2 DONE behaviors are `NO_TEST`: A1 and A2.
- 3 deliberate mutants survive inside DONE behaviors: U21 and U37.

Clearing any one of these still leaves a FAIL.

Most of the work is sound:

- 37 behaviors are `PROVEN`: one commit adds the test and the source together, and the cycle log records a red for it.
- The cycle log never contradicts the history.
- No pre-existing test was weakened.
- The suite is fast and deterministic.
- The six logged mutant reds for the first-run behaviors replay exactly as recorded.

Audit independence: this audit ran in a fresh-context subagent that did not write the tests. It re-read every test and source file it cites. The verify command was followed by hand, because the extension is not installed in the fork-`main` checkout.

**Fork override: inert.** The plan's Lane is `fork feature` (`plan.md:22`). `standard:` resolved to `.specify/templates/overrides/tdd-test-quality-rubric.md`, the first match in the template stack. Its `<!-- fork: staged-pr evidence -->` section applies only when the Lane says `staged upstream PR`, so rules S1–S4 were not applied. Every behavior was classified with the base `PROVEN` / `LIKELY` / `TEST_AFTER` / `NO_TEST` / `NOT_APPLICABLE` table. Outside that section, the override is byte-identical to the installed base: U35 pins this, and the suite passes.

## Preflight

- Profile: `.specify/memory/tdd-profile.md`, read in full, including its conventions, the exemplar (`.fork/ci/test/runtimes.test.mjs`) and its helpers (`.fork/ci/test/fixtures.mjs`, `.fork/ci/test/helpers/{folder,git-fixture}.mjs`). There is no coverage tool and no mutation tool.
- Feature: `specs/003-tdd-extension`, named by the caller. `.specify/feature.json` and `node .fork/ci/bin/tdd.mjs where` resolve to the same feature, with tree W and folder `.fork/ci`.
- Suite:
  - `node --test .fork/ci/test/` gave 147 passed and 0 failed, in 4.83 s wall (Node 26.13.0).
  - The profile's `node .fork/ci/bin/tdd.mjs suite` printed `tests=147 pass=147 fail=0 → sql-unverified` and exited 0, in 4.92 s.
  - The baseline was 101 at `d83711a` (cycle-log.md:9). The feature adds 46 tests, and no failure predates it.
- History range: `f03182c..e9290e3` (merge-base with `main`).
  - The four streams were merged with `--no-ff`: adapter `26a9b50`, overrides `8e42fe4`, advisory `7646012`, docs `b6e2ee6`.
  - Every cycle commit sits on its own stream branch, so the order of test and source is visible per commit. Nothing was squashed.

## Test-first evidence

Reading the classes against the history:

- A cycle commit that adds the test and its source together, with a recorded red, is `PROVEN`.
- A test committed after the commit that already contains the code satisfying it is `TEST_AFTER`, under the rubric's criterion "history shows the source change landing in an earlier commit than its test".
- A behavior with no executable test is `NO_TEST`.

| Behavior | Class | Evidence |
| --- | --- | --- |
| A1 | NO_TEST | No executable test. `test` points to `evidence/r1-verify.md`, a manual hash-comparison record. No red is recorded; cycle-log.md:11 says only "installed and verified (A1)". Spot check: `git hash-object` of the installed rubric gives `e0ec7eb49df1` and of `speckit.tdd.verify.md` gives `074492a07252`, matching the record. Even so, no test exists. |
| A2 | NO_TEST | No executable test. cycle-log.md:339 reads "red: n/a for a document". The evidence is the profile's Verification record (`f40c89d`). |
| A3 | TEST_AFTER | Test-only commit `21d2a1b`. The code it covers landed earlier: U5 `82a2fe8`, U9 `08ed34b`, U24 `56db46d`. The red is a deliberate mutant (cycle-log.md:283–284), replayed and caught here (M1). |
| A4 | TEST_AFTER | Test-only commit `1009717`, after U14 `2f635bc`, U15 `b20e2fd` and U23 `9777c3a`. Mutant red at cycle-log.md:293–294, replayed (M2). |
| A5 | TEST_AFTER | Test-only commit `dcaf663`, after U6 `b6b61fd`. Mutant red at cycle-log.md:303–304, replayed (M3). |
| A6 | TEST_AFTER | Test-only commit `2962db5`, after U11 `0c24e82` and U13 `a3dacc9`. Mutant red at cycle-log.md:313–314, replayed (M4). |
| A7–A12 | NO_TEST | PENDING, with an empty test column (test-list.md:28–33). These are post-merge or on-PR checks (T030–T032). |
| A13 | PROVEN | Red at cycle-log.md:464–465. `1d4ff90` adds `tdd-docs.test.mjs` and `constitution.md` together. |
| A14 | PROVEN | Red at cycle-log.md:473–474. `d7478f1` adds the test and `.fork/README.md` together. |
| A15, A16 | NO_TEST | PENDING, with an empty test column (test-list.md:36–37). |
| U1–U3 | PROVEN | Reds at cycle-log.md:24–25, 33–34 and 42–43. `adb3068`, `1421f3b` and `8fdfda0` each add test and source together. |
| U4 | PROVEN | Red at cycle-log.md:51–52, re-observed; cycle-log.md:50 says the test was written by a previous session. `8530e1a` adds test and source together. |
| U5–U11 | PROVEN | Reds at cycle-log.md:60–117. `82a2fe8`, `b6b61fd`, `b0dffbc`, `7d504c2`, `08ed34b`, `11eafb3` and `0c24e82` each add test and source together. |
| U12–U20 | PROVEN | Reds at cycle-log.md:126–205. `07db776`, `a3dacc9`, `2f635bc`, `b20e2fd`, `d2b140f`, `1c283eb`, `ba630a7`, `dcf09c3` and `cc602f0` each add test and source together. |
| U21 | PROVEN | Red at cycle-log.md:214–215. `5f32911`. A mutant survives, though (F4). |
| U22–U27 | PROVEN | Reds at cycle-log.md:224–274. `7bc1d36`, `9777c3a`, `56db46d`, `ec3f8c6`, `a2a39da` and `df3fba2` each add test and source together. |
| U28 | PROVEN | Red at cycle-log.md:403–404. `eebd275`. |
| U29 | TEST_AFTER | Test-only commit `02b4fd4`, after U28's scan in `eebd275`. cycle-log.md:417 calls it "test-after relative to U28's implementation". Mutant red replayed (M5). |
| U30, U31 | PROVEN | Reds at cycle-log.md:394–395 and 385–386. `a63299b` and `063c7a1`. |
| U32 | TEST_AFTER | Test-only commit `bb44e34`, after the literal `===` compare in `eebd275`. cycle-log.md:427 says "test-after". Mutant red replayed (M6). |
| U33 | PROVEN | Red at cycle-log.md:432–433, with 2 failed and 1 passed. `4f95dc0`. The third test, `report.test.mjs:124`, is an invariant guard that passed before the change (cycle-log.md:437). |
| U34 | PROVEN | Red at cycle-log.md:442–443. `0f1f437`. |
| U35 | PROVEN | Red at cycle-log.md:370–371 ("override file missing"; the missing file is the deliverable, so the red is valid). `c77f3e4`. |
| U36 | PROVEN | Red at cycle-log.md:452–453. `e932952`. |
| U37 | PROVEN | Red at cycle-log.md:484–485. `b4227e1` adds test and source together. Two mutants survive, though (F5, F6). |

Totals: 53 behaviors. 37 `PROVEN`, 0 `LIKELY`, 6 `TEST_AFTER`, 10 `NO_TEST`, 0 `NOT_APPLICABLE`.

**On the "covered by …" annotations for A3–A6, U29 and U32** (test-list.md:24–27, 93, 96). The playbook's "Test passes on first run" row (`tdd-loop-playbook.md:113`) says to "mark the list item covered and move on". The rubric has no class for a covered behavior, and the test-list template has no `covered` state; these rows are recorded as `DONE`. The rubric's test-first table is what grades. Under it, a test whose subject was committed earlier is `TEST_AFTER`, and a mutant red does not change that. A mutant red proves the test can fail; it does not prove the test came first.

The six mutant reds are real: M1–M6 replay them on a snapshot of HEAD, and every one is caught. So these tests are not worthless. Their units (U5, U6, U9, U11, U13–U15, U23, U24, U28) are all `PROVEN`.

Whether an inside-out acceptance test over PROVEN units should count as test-first is a standards question for the owner (F2). The audit does not answer it.

**Cycle log against history.** No contradictions were found:

- Every logged mutant line reference matches its own commit: `21d2a1b:tdd-target.mjs:53`, `1009717:tdd.mjs:80`, `dcaf663:tdd-target.mjs:50`, `2962db5:tdd-target.mjs:100`, `02b4fd4:tdd-status.mjs:55` and `bb44e34:tdd-status.mjs:54`.
- The A3–A6, U29 and U32 commits contain no source changes.
- The suite counts logged per stream add up: 101 + 31 + 2 + 10 + 2 = 146, and U37 makes 147.
- The adapter stream's line-reference corrections (cycle-log.md:349–363) are recorded as a new entry. The earlier entries were not edited.

**Existing tests.** Over the whole range, `git diff f03182c HEAD -- .fork/ci/test/` removes exactly one line from a pre-existing test. Three cases deserved a read:

- **Removed line, `e932952`**: `self-test-needed.test.mjs:17`. It went from `selfTestNeeded(['specs/001/spec.md', '.fork/README.md', 'recipes/a/index.ts']) → false` to `selfTestNeeded(['specs/001/spec.md', 'recipes/a/index.ts']) → false`.
  - Judgment: a legitimate behavior change with its own list item, not a weakening. U36 (FR-010–FR-012) makes `.fork/README.md` trigger self-test, and `self-test-needed.test.mjs:22–28` now asserts `true` for it. A near-miss negative, `.fork/README.md.bak`, is still asserted `false`.
- **`b4227e1`** changed the expected `suite` summary lines in U27 (`tdd-cli.test.mjs:194`) and A3 (`tdd-cli.test.mjs:231`). The strings gained `: tests=1 pass=1 fail=0`, which makes them stricter, not looser.
- **`21d2a1b`** added `describe` to the import line of the in-test fixture strings `PASS`, `FAIL`, `noisy` and `dirtying`. It is cosmetic, and no assertion changed.

No skips, `.only`, `todo`, config exclusions or threshold changes were found.

**tasks.md against the test list.** Every ticked task's behavior ids are `DONE`. Two small issues:

- U37 is in the Behavior Map (tasks.md:73), but no task carries `[U37]`.
- T024, whose remediation U37 is, is still unticked.

No ticked task claims a behavior that is not `DONE`.

## Findings

Ordered by severity. "Blocking" marks a rubric FAIL trigger.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| F1 | HIGH, blocking | 7 of the 13 acceptance scenarios have no test: US1 AS1–3, US3 AS1–3 and US5 AS1 (behaviors A7–A12 and A15). The rubric fails "any acceptance criterion without a test". These are planned as post-merge checks (T030–T032), but the rubric has no way to defer a criterion. | `spec.md:37–39, 70–72, 101`; `test-list.md:28–33, 36` |
| F2 | HIGH, blocking | 6 behaviors are `TEST_AFTER`: A3–A6, U29 and U32. Each test landed in a test-only commit after the code it checks. The only red is a deliberate mutant, which shows the test can fail but not that it came first. The "covered by …" annotation follows the playbook, but the rubric has no class for it. | `21d2a1b`, `1009717`, `dcaf663`, `2962db5`, `02b4fd4`, `bb44e34`; `test-list.md:24–27, 93, 96`; cycle-log.md:283, 293, 303, 313, 412, 422 |
| F3 | HIGH, blocking | A1 and A2 are `DONE` but have no executable test and no recorded red. The evidence for each is a document. | `test-list.md:22–23`; `evidence/r1-verify.md`; cycle-log.md:339 |
| F4 | HIGH, blocking | Surviving mutant M7 in U21 (DONE): dropping the `$` anchor from `CREDENTIAL_SUFFIX` survives, so U21 doesn't pin "ending in" (FR-016). The "kept" names `TOKENIZER_MODEL`, `SECRET_SAUCE_DIR` and `API_KEY_FILE` never contain `_TOKEN`, `_SECRET` or `_API_KEY` mid-name, so a matcher that ignores the end of the name passes. The mutant over-blanks, so it fails safe and the practical risk is low; the rubric still fixes the severity at HIGH. | `.fork/ci/lib/tdd-env.mjs:4`; `.fork/ci/test/tdd-env.test.mjs:18–20, 29–31` |
| F5 | HIGH, blocking | Surviving mutant M8 in U37 (DONE): replacing the unparseable-counts branch `': tests=? pass=? fail=?'` with invented zeros survives. U37 claims "`?` when unparseable" (test-list.md:111), but no fixture produces unparseable output. | `.fork/ci/bin/tdd.mjs:135`; `.fork/ci/test/tdd-cli.test.mjs:199–209` |
| F6 | HIGH, blocking | Surviving mutant M9 in U37 (DONE): replacing the cross-runtime sum with the first runtime's counts survives. Every U37 fixture runs one runtime, so "summed over the runtimes that ran" is not pinned. | `.fork/ci/bin/tdd.mjs:136`; `.fork/ci/test/tdd-cli.test.mjs:201, 204` |
| F7 | MED | Partial traceability for US4 AS2. The scenario is about following "Stage an upstream PR", but A14 asserts only on the `## TDD workflow` section. The runbook's stage steps do mention the test list, the loop and the audit (`.fork/README.md:183, 185–187, 197`), but no test pins them, so they could drift unnoticed. | `spec.md:87`; `.fork/ci/test/tdd-docs.test.mjs:42` |
| F8 | MED | Implementation coupled (prose regexes). The doc tests match exact phrasings: during A13 the constitution sentence was reworded until a regex matched (cycle-log.md:466). Some keyword checks are loose enough to pass on any mention, for example `/advisory/i` and `/reason/i`. | `.fork/ci/test/tdd-docs.test.mjs:29, 31, 35, 52, 54` |
| F9 | MED | Bypassed test utility. A git identity env, `gitIn` and `commitAll`/`addWorktree` are hand-rolled even though `helpers/git-fixture.mjs` provides `git`, `makeRepo` and `commit`. | `.fork/ci/test/tdd-target.test.mjs:89–100`; `.fork/ci/test/tdd-cli.test.mjs:135–143`; `.fork/ci/test/helpers/git-fixture.mjs:19–34, 50–54` |
| F10 | MED | Foreign style: `import` statements in the middle of the file, after existing tests. Neither the exemplar nor the rest of the suite does this. | `.fork/ci/test/verdict.test.mjs:125–129` |
| F11 | MED | Eager tests: one test per list row bundles several observable results. U33's test covers contract rows T1–T10 with comment-only labels, and U23 covers exit codes 0, 1, 3 and 4 plus streaming. A failure points to a line rather than a named behavior. | `.fork/ci/test/report.test.mjs:90`; `.fork/ci/test/tdd-cli.test.mjs:76` |
| F12 | LOW | Duplicated setup: five near-identical "temp dir from a `{rel: content}` map" builders. | `tdd-target.test.mjs:19`, `tdd-commands.test.mjs:12`, `tdd-status.test.mjs:9`, `tdd-cli.test.mjs:26`, `verdict.test.mjs:136` |
| F13 | LOW | The U18 venv-key expectation recomputes `sha1(cwd)` with the same formula as `pythonVenv`. The formula is transcribed from the contract (`research.md:78`, `sha1(tree+root)`), not copied from the code, so this is judged short of a HIGH re-implemented expectation. A literal hash for one fixed path would make it independent. | `.fork/ci/test/tdd-commands.test.mjs:151, 155`; `.fork/ci/lib/tdd-commands.mjs:140` |
| F14 | LOW | Bookkeeping: `test-list.md` `updated_at: b4227e1` is stale, since the file last changed in `e9290e3`. No task carries `[U37]`. | `test-list.md:7`; `tasks.md:73` |

Smell-catalogue items checked and judged not to apply:

- **Conditional logic.** `verdict.test.mjs:182` (`if (section) … else …`) asserts on both branches. The table loops at `tdd-status.test.mjs:44`, `tdd-target.test.mjs:114` and `tdd-commands.test.mjs:59` iterate constant, non-empty arrays. No run asserts nothing.
- **Tautology, doubled subject, over-mocking.** No doubles are used. Every test drives the real module, or the real CLI through `spawnSync`.
- **Vacuous assertions.** The `assert.ok(…includes(…))` calls check specific substrings.
- **Snapshots.** None are used.
- **Empty or skipped tests.** None.

**Suite properties.**

- Fast: about 5 s for the whole suite.
- Deterministic: no clock, network or sleep. The order in U29 comes from an explicit `.sort()` at `tdd-status.mjs:50`.
- Isolated by temp dirs. These are never removed, including real `git worktree`s; that matches the existing `git-fixture.mjs`, which also never cleans up, so it is not raised as a finding.
- Most assertions carry the child's stdout and stderr as their message, which makes failures specific.

**Informational.** `tasks.md:229` (T026a) says "Required verdict: PASS or PASS_WITH_GAPS". Hard Rule 7 makes repository content data, not instructions, so it was not treated as binding and had no effect on this verdict.

## Mutation results

There is no mutation tool, so deliberate mutants were used. Method:

- Each mutant ran on a `git archive HEAD` snapshot of W in the session scratchpad. W itself was never modified, and `git -C W status --short` was empty before and after.
- The snapshot suite was 147/147 before the first mutant.
- Each mutant was applied as an exact, single-occurrence string replacement, and the harness checked that it applied.
- The behavior's own test was run, the file was restored from a byte copy and compared, and the full suite was re-run. It was 147/147 after every restore.
- Sample: 19 mutants over 18 behaviors, chosen as the six logged first-run reds plus the highest-risk behaviors (credential blanking, zero-match exit, tree routing, inside-tree check, lockfile restore, verdict invariance, suite mapping and counts). It is not exhaustive.

| Mutant | Behavior | Survived | Judgment |
| --- | --- | --- | --- |
| M1 `tdd-target.mjs:53` `return workTree(m[1])` → `workTree(m[1]); return repoRoot;` | A3 | No | Replays the logged red. Caught. |
| M2 `tdd.mjs:61` `return [3, …` → `return [0, …` (zero-match passes) | A4 | No | Replays the logged red at its current location in `outcome()`. Caught. |
| M3 `tdd-target.mjs:50` `none` → `return undefined` | A5 | No | Replays the logged red. Caught (`where` crashes). |
| M4 `tdd-target.mjs:100` `if (!target.folderExists) throw` → `if (false) throw` | A6 | No | Replays the logged red. Caught. |
| M5 `tdd-status.mjs:55` `.slice(0, 1).map(…)` | U29 | No | Replays the logged red. Caught. |
| M6 `tdd-status.mjs:54` `=== headRef` → `new RegExp(^headRef$)` | U32 | No | Replays the logged red. Caught. |
| M7 `tdd-env.mjs:4` suffix regex without `$` | U21 | **Yes** | Not equivalent: over-blanks names like `GH_TOKEN_PATH`. **HIGH (F4).** |
| M8 `tdd.mjs:135` `?` branch → `tests=0 pass=0 fail=0` | U37 | **Yes** | Not equivalent: invents zero counts, which U37 says never happens. **HIGH (F5).** |
| M9 `tdd.mjs:136` sum → `parsed[0][key]` | U37 | **Yes** | Not equivalent: wrong once two runtimes run. **HIGH (F6).** |
| M10 `tdd-commands.mjs:19` inside-tree guard → `if (false)` | U12 | No | Caught. |
| M11 `tdd.mjs:121` lockfile `git checkout` removed | U25 | No | Caught. |
| M12 `verdict.mjs:53` exit also fails on a TDD `FAIL` | U34 | No | Caught (`success/FAIL`). |
| M13 `verdict.mjs:44–47` `try/catch` → `try/finally` (throw escapes) | U34 | No | Caught (`success/throws`). |
| M14 `tdd.mjs:97` `no-tests` → exit 1 | U24 | No | Caught. |
| M15 `tdd-status.mjs:22` frontmatter end check removed | U28 | No | Caught (body `verdict:` read). |
| M16 `tdd-commands.mjs:74` missing counts → 0 instead of `null` | U15 | No | Caught. |
| M17 `tdd-target.mjs:46` missing Worktree → `repoRoot` for every lane | U8 | No | Caught. |
| M18 `tdd-target.mjs:73` `..` check dropped | U10 | No | Caught. |
| M19 `tdd.mjs:183` Node floor 26 → 20 | U26 | No | Caught. |

16 of 19 were caught. All 3 survivors fall inside DONE behaviors.

## Traceability

| Criterion | Tests | End to end |
| --- | --- | --- |
| US1 AS1 (FR-002) | none (A7 PENDING) | No |
| US1 AS2 | none (A8 PENDING) | No |
| US1 AS3 | none (A9 PENDING) | No |
| US2 AS1 (FR-004) | A3 `tdd-cli.test.mjs:226`; U5, U9, U24, U37 | Yes. The real CLI on a real `git worktree`, where the wrong tree's test fails. |
| US2 AS2 (FR-006) | A4 `tdd-cli.test.mjs:243`; U14, U15, U23 | Yes. The profile string is run through a shell. |
| US2 AS3 | A5 `tdd-cli.test.mjs:252`; U6, U8 | Yes. The `single` and `where` commands only. |
| US2 AS4 (FR-007) | A6 `tdd-cli.test.mjs:262`; U10, U11, U13, U26 | Yes. Note: FR-017 makes `suite` on a missing or docs-only folder green, so AS4's "any command" holds only for `single` and `file`. That is spec-consistent. |
| US3 AS1 (FR-010) | none (A10 PENDING). U35 pins the override text, not the classification. | No |
| US3 AS2 | none (A11 PENDING) | No |
| US3 AS3 | none (A12 PENDING) | No |
| US4 AS1 (FR-011) | A13 `tdd-docs.test.mjs:25` | Yes. Reads the real constitution. |
| US4 AS2 (FR-012) | A14 `tdd-docs.test.mjs:41` | Partial. The "Stage an upstream PR" steps are not asserted (F7). |
| US5 AS1 (FR-013) | none (A15 PENDING) | No |

- Untested criteria: 7 (US1 AS1–3, US3 AS1–3, US5 AS1).
- Requirements with no test, beyond those: FR-001 (A1 has a document only), FR-003 (hook registration is recorded only in `evidence/r1-verify.md`), FR-008 (a process requirement, evidenced by this audit) and FR-015 (lane hygiene is task T025, with no test). FR-009 has A2, which is document-only. SC-007 and FR-014 have A16 PENDING.
- Every `traces` entry that names a test points at one that exists and runs. No test traces to nothing: the pre-existing fork-ci tests are outside this feature's list.

## What was not audited

- **Mutation**: no mutation tool exists. 19 deliberate mutants over 18 behaviors were run; the other DONE behaviors were not mutated: U1–U7, U9, U11, U13, U14, U16–U20, U22, U23, U27, U30, U31, U33, U35, U36, A13 and A14.
- **Coverage**: no coverage tool is configured, so line and branch coverage were not measured.
- **Python, deno, vitest/jest and SQL `single`/`file` execution**: only the argv and count parsers are unit-tested (U17–U20). Running them for real is hand-recorded only (cycle-log.md:237) and was not re-run.
- **Workflow and docs changes**:
  - The `.github/workflows/fork-ci.yml` `HEAD_REF` line was not exercised. actionlint is not installed locally (cycle-log.md:447).
  - `.fork/ci/README.md`, `.specify/templates/plan-template.md` and `.specify/templates/tasks-template.md` (`81256ba`) are covered by no test and were not graded.
- **Post-merge behaviors**: A7–A12, A15 and A16 can run only after the merge or on the PR. They are absent, not assessed.
- **Lane hygiene and secret scan**: T025 was not run by this audit. No credential-shaped values were seen in the tests that were read; `tdd-env.test.mjs` uses `fake-*` values.
- **Performance**: the suite is about 5 s. No performance criterion exists.

## Recommended remediation

Not appended to `tasks.md`: the caller restricted this audit to writing this report only. On this FAIL, the feature is not done until F1–F6 are cleared or the owner changes the standard.

1. **F4, U21.**
   - Change: in `.fork/ci/test/tdd-env.test.mjs`, add kept names in which the credential suffix appears mid-name, for example `GH_TOKEN_PATH`, `MY_API_KEY_FILE` and `WEBHOOK_SECRET_NAME`, and assert each is unchanged.
   - Done when: mutant M7 (remove `$` at `tdd-env.mjs:4`) fails `node .fork/ci/bin/tdd.mjs single .fork/ci/test/tdd-env.test.mjs "U21 childEnv: NODE_TEST_CONTEXT removed; credential vars set to \"\"; others kept"`.
2. **F5 and F6, U37.**
   - Change: make `suiteCounts` testable, either by moving it to a lib module or by exporting it. Then add tests in `.fork/ci/test/` for:
     - two runtimes that both ran (for example node-plain 2/2 plus python 1/0), expecting `: tests=3 pass=3 fail=0`;
     - one runtime whose `outputExcerpt` has no summary, expecting `: tests=? pass=? fail=?`.
   - Done when: mutants M8 and M9 fail the new tests. Re-run `node .fork/ci/bin/tdd.mjs suite`.
3. **F1, the untested criteria (owner decision).**
   - Option (a): accept FAIL pre-merge and re-audit at T032, after T030 and T031 give A7–A12 and A15 their tests. This means changing T026a's gate.
   - Option (b): add a fork-section rule to the rubric override that scopes a pre-merge audit to criteria marked post-merge. This is a standards change, and U35's drift pin would need the section.
   - Option (c): automate the parts that can be automated now. For example, a lint test that every `## Cycle:` entry in a cycle log has `test`, `red`, `green` and `commit` lines (US1 AS3).
4. **F2, test-after acceptance behaviors (owner decision).**
   - Option (a): accept `TEST_AFTER` for A3–A6, U29 and U32.
   - Option (b): add a class to the fork's rubric override for an acceptance behavior that is closed over `PROVEN` units and whose own test has a verified mutant red. This is a standards change, applied to every lane.
   - Option (c): following the playbook's "mark covered and move on", drop them as separate list rows and record their tests as checks under the `PROVEN` units they cover.
   - Note: new history cannot be produced for these six.
5. **F3, A1 and A2 (owner decision, or tests).**
   - Option (a): add a test that hashes each installed `.specify/extensions/tdd/` file and compares it with the blob ids pinned in `evidence/r1-verify.md`.
   - Option (b): move A1 and A2 off the behavior list into a checklist, since they are verification records rather than behaviors.
6. **F7.** Extend `tdd-docs.test.mjs` with a test over `section(readme, '## Stage an upstream PR')` that asserts it names `tdd-plan`, the loop step and `tdd-verify` before merge. Done when `node .fork/ci/bin/tdd.mjs file .fork/ci/test/tdd-docs.test.mjs` passes, and fails when step 5's verify sentence is removed.
7. **F8–F14.**
   - F9 and F12: switch the git and temp-tree setup to `helpers/git-fixture.mjs`, and add a worktree helper there.
   - F10: move the `verdict.test.mjs` imports to the top of the file.
   - F11: split the U23 and U33 tests per contract row.
   - F13: pin one literal sha1 in U18.
   - F14: set `test-list.md` `updated_at` and add a `[U37]` task line.
   - Done when the suite stays green at 147 or more.
