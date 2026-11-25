---
feature: 005-principle-v-guard
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is `fork feature`, so its staged-PR section did not apply
verified_at: fbf3eb6
behaviors: 49
proven: 43
likely: 0
test_after: 6
no_test: 0
high_smells: 0
criteria_total: 11
criteria_covered: 11
mutation_score: 100 # scope: 7 changed source/wiring files, 36 hand-made mutants, 36 killed, no tool (profile mutation: null)
mutants_survived: 0
suite: 201 passed, 0 failed, 0 skipped, 0 todo, 7.4s (node --test .fork/ci/test/ from W, macOS)
---

# TDD Verification: Principle V guard for the fork-main checkout (re-audit)

**Verdict: FAIL.** The rubric makes any `TEST_AFTER` behavior a `FAIL`, and six behaviors are `TEST_AFTER`: U25 and U26 (covered by the owner exception, which the rubric has no mechanism to honor) and U33, U36, U37, U38 (not covered by the exception). Test strength is now clean: all three previous survivors are killed and no mutant survives.

Independence: the auditor did not write these tests. Every test and source file was re-read from W at `fbf3eb6`. Lane is `fork feature` (`plan.md:13`): no lane-specific section applied. The rubric's "staged upstream PR" section is conditional on that lane, and the override file's only change from the base rubric is that section.

## What changed since the previous report (`819da12`)

- Stream F (`685ce44`, `9b234ca`, `4e223b6`, `2ef1b76`, `e6dafcf`): U31-U35 and the case-variant bypass fix.
- Stream H (`bc850e5`, `8696a93`, `6ed2379`, `db129dc`): U36-U38 and strengthened A7-A9.
- `plan.md:91-99` Complexity Tracking records the owner exception for U25 and U26.

## Test-first evidence

History is not squashed: one cycle per commit, streams merged `--no-ff`, so ordering is verifiable. The acceptance file `c2a4ea9` predates all CLI source (`22a59fb`).

I corroborated the new reds from history: U31, U32, U34 and U35 each change the test file and the source in one commit (`685ce44`, `9b234ca`, `2ef1b76`, `e6dafcf`), and the cycle log quotes a real failure for each (`'Docs/new.md'` vs `'docs/new.md'`; `actual: true`/`expected: false` on `claude.md`; `ran once` with `actual: 3, expected: 1`; `blocked reading stdin`). `4e223b6` (U33) and `bc850e5`, `8696a93`, `6ed2379` (U36-U38) change only test files and the cycle-log fragment.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| U1-U30, A1-A11 | PROVEN | Unchanged from the previous report (test and source in one commit with a recorded red; A2, A4, A5, A7, A8, A9 are the "weak shared red" case, now backed by strengthened tests). |
| U31 | PROVEN | red `actual: 'Docs/new.md'`; test and `principle-v-paths.mjs` change in `685ce44` |
| U32 | PROVEN | red `actual: true` / `expected: false`; test and `principle-v.mjs` in `9b234ca` |
| U34 | PROVEN | red `actual: 3, expected: 1`; test and CLI in `2ef1b76` |
| U35 | PROVEN | red `blocked reading stdin`; test and CLI in `e6dafcf` |
| U25 | TEST_AFTER | log "red: not observed"; behavior (dynamic `import()` in the top-level `try`) landed in `22a59fb`, before the test commit `1133ecd` (test-only commit) |
| U26 | TEST_AFTER | log "red: not observed"; `--no-renames` landed in `34be6cf`, before the test commit `4568300` (test-only) |
| U33 | TEST_AFTER | log "red: first-run pass"; the behavior was delivered by U31 (`685ce44`) and U32 (`9b234ca`), before the test-only commit `4e223b6`. The log's "both-layer mutant" red is a mutant, not a red against a missing behavior. Not covered by the owner exception. |
| U36 | TEST_AFTER | "red = audit mutant M13"; D4-before-D5 ordering existed in `principle-v.mjs` long before `bc850e5` (test-only). Not covered by the exception. |
| U37 | TEST_AFTER | "red = audit mutant M06"; zone prefixes were already narrow; `8696a93` is test-only. Not covered by the exception. |
| U38 | TEST_AFTER | "red = audit mutant M10"; outermost-folder `.find` already existed; `6ed2379` is test-only. Not covered by the exception. |

Judgment call on U36-U38: they are test strengthening of rows U8, U9 and U10 that was prompted by the previous audit, and the cycle log says so honestly ("red = audit mutant", "no production change"). Under the rubric as written, a mutant is not a red and the source predates the test, which is the same shape the previous report and the owner exception treat as `TEST_AFTER` for U25 and U26. I applied that reading consistently. If the owner prefers to model them as amendments to U8, U9 and U10 instead of new behaviors, the count falls to 3 (U25, U26, U33), and the verdict is still `FAIL`.

Existing tests: the only pre-existing test and source changes are `self-test-needed.test.mjs` (+7 lines, new U30, nothing removed) and `self-test-needed.mjs` (two constants extended), as before. Since `819da12`, `db129dc` edited the committed A7-A9: the removed lines are only function signatures and call sites that gained a `trace`/`extraUpstream` argument. Every assertion is kept and two are added (`assertGuardRan`). That strengthens them; it does not weaken them. No skips, exclusions or thresholds were added or lowered. No weakened existing test.

`tasks.md` against the list: T030 `[X]` with U31-U35 `DONE`, consistent. T031 `[ ]` while U36-U38 are `DONE`: the milder inverse (finding 4). Every other behavioral task is `[X]` with its behaviors `DONE`.

## The owner exception, judged against the rubric as written

`plan.md:97` records U25 and U26 as `TEST_AFTER` accepted by the owner. I verified its factual claims: both behaviors landed in `22a59fb` and `34be6cf` before tests `1133ecd` and `4568300`; both tests are mutant-verified (re-killed below by M29, M30, M31b). The claims are accurate.

Effect on the verdict: none under the rubric. The verdict table says "any `TEST_AFTER` or `NO_TEST` behavior" is `FAIL`. The rubric defines no waiver and no "pre-existing, mutant-verified" class, and the plan's own text records that such a class "was declined". `plan.md` cannot change the standard it is graded against; only a reviewed rubric override can. So U25 and U26 stay `TEST_AFTER` and keep the verdict at `FAIL`, which the exception itself says ("stay `TEST_AFTER`"). The exception also does not reach U33 and U36-U38, which it does not name and which fail on their own.

What would change the verdict: clearing the exception's scope is not enough. A rubric override that adds a class for "behavior pre-existed, test killed a recorded mutant" would have to cover U25, U26, U33 and U36-U38 alike. Even then the best verdict is `PASS_WITH_GAPS` (mutation by hand, no coverage tool, new class used six times).

## Findings

| #   | Severity | Finding | Evidence |
| --- | -------- | ------- | -------- |
| 1 | HIGH (rubric: `TEST_AFTER`, verdict-blocking) | Six behaviors have no red recorded for a missing behavior and their source predates their test: U25, U26 (exception), U33, U36, U37, U38 (no exception). Mutants are recorded for each and all are killed, so the tests have teeth; the ordering cannot be recovered. | cycle-log.md "Cycle: U25" (`:342`), "U26" (`:391`), "U33" (`:438`), "U36-U38" (`:470-498`); `1133ecd`, `4568300`, `4e223b6`, `bc850e5`, `8696a93`, `6ed2379` are test-only |
| 2 | MED | U31 and U33 skip on a case-sensitive filesystem. CI runs on `ubuntu-latest` (`.github/workflows/fork-ci.yml:30`), so there the path-layer half of the F1 case-bypass fix (`realpathSync.native`) has no test; only U32 (rule layer, injected paths) runs. The skip is explicit and has a reason, and here (macOS) both ran with `skipped 0`, so I do not grade it as the HIGH "always skipped" or "conditional logic" smell. If the owner reads it as HIGH the verdict is unchanged. | `.fork/ci/test/principle-v-paths.test.mjs:129`; `.fork/ci/test/principle-v-guard.test.mjs:102` |
| 3 | MED (carried) | Spec edge cases still reach only unit tests, not the CLI: missing `upstream/main` (D7), detached HEAD, symlink and `..` forms. No `A` test names them. All are killed at unit level (M07, M19, M14). | `.fork/ci/test/principle-v.test.mjs:56`; `principle-v-paths.test.mjs:17-58`; no CLI test of D7 |
| 4 | LOW | T031 is `[ ]` while U36-U38 are `DONE`; `/speckit-implement` would redo them. T031's text also waits on "re-run T023" (this audit), so the box cannot honestly be ticked until the verdict is settled. | `specs/005-principle-v-guard/tasks.md:136` |
| 5 | LOW | `test-list.md` frontmatter `updated_at: fb5a296` is stale; the last commit touching it is `fbf3eb6`. | `specs/005-principle-v-guard/tdd/test-list.md:6` |
| 6 | LOW (carried) | Duplicated setup: `guardRepo` and the hook runner are written in both `principle-v-guard.test.mjs:14-39` and `principle-v-guard.acceptance.test.mjs:40-71`; `denyReason` twice. No shared guard helper exists, though the profile's `git-fixture.mjs` is used. | as cited |
| 7 | LOW (carried) | A11 matches loose words (`/allow/i`, `/merge/i`, `/refus\|den(y\|ie)/i`) in whitespace-collapsed prose. | `.fork/ci/test/principle-v-docs.test.mjs:66-72` |

Previous findings 1-3 (survivors) and 5-6 (weak A7-A9) are resolved; see mutation results. Previous finding 11 (per-path git calls in `--staged`) is resolved by U34 (M34 killed).

Smell pass (rubric catalogue, all new or changed test files): no assertion-free, tautological, doubled-subject, over-mocked, vacuous, snapshot, always-skipped or empty tests. The loops in U2, U6, U8, U9, U32, U36, U37 and U35 are labelled data tables. U34 and the A7-A9 `gitTrace` preload use a `git` shim and a `--require` preload to observe real child processes and then run them unchanged; they test real behavior and are not doubles of the subject. U35 uses an async spawn with a 3 s kill timer, which is a bounded wait on a condition, not a sleep. Style matches the exemplar (`node:test`, `node:assert/strict`, one `test()` per behavior, temp repos from `helpers/git-fixture.mjs`). Suite 7.4 s, no network, no clock or random.

## Mutation results

No mutation tool (profile `mutation: null`). 36 deliberate mutants, each applied alone to a fresh copy from `git -C W archive HEAD` in `/tmp/pvg-ra-copy` (never in W or M), whole suite (201 tests) run per mutant, pristine file restored after each. Pristine copy 201/201 before the run and again after the last mutant. Scope: `.fork/ci/lib/principle-v.mjs`, `principle-v-paths.mjs`, `.fork/ci/bin/principle-v-guard.mjs`, `.fork/ci/lib/self-test-needed.mjs`, `.claude/settings.json`. This is a sample targeted at the previous survivors, U31-U38 and the highest-risk rules, not exhaustive. Not comparable to the previous run's 47-mutant set.

Killed 36 of 36. Survivors: none.

| Mutant | Survived | Killed by |
| ------ | -------- | --------- |
| M13 D5 evaluated before D4 (previous survivor) | No | U36 |
| M06 `.claude/skills/speckit-` widened to `.claude/skills/` (previous survivor) | No | U37 |
| M06b `.github/workflows/fork-` widened to `.github/workflows/` | No | U37, U9 |
| M10 D8 names innermost folder (`.findLast`) (previous survivor) | No | U38 |
| M31 `realpathSync.native` reverted | No | U31, U33 |
| M32a D4 exact-case | No | U32 |
| M32b D8 exact-case | No | U32 |
| M32c D5 case-insensitive | No | U32 |
| M32d D6 case-insensitive | No | U32 |
| M32e D8 reason uses lowered folder name | No | U32 |
| M33 both layers case-blind (M31 + M32a + M32b) | No | U31, U32, U33 |
| M34 `--staged` rebuilds context per path | No | U34 |
| M35a usage exits 0 | No | U35 |
| M35b unknown mode falls into `--hook` (reads stdin) | No | U35 |
| M35c usage on stdout | No | U35 |
| M35d prefix match on mode (`--stage`) | No | U35 |
| MA `--staged` exits 0 without running | No | A6, A7, A8, A9, U26, U27, U34 |
| MB drop D5 | No | A7, U8 |
| M01 drop D1; M03 drop D3; M04 drop D4; M07 D7 allows | No | U1; A5, A8, U3; 11 tests incl. A1, A6, U36; 14 tests incl. A1-A9 |
| M09 D8 immediate parent only; M11 knowledge prefix w/o slash | No | A2, U6, U10, U37, U38; U11 |
| M17 merge never in progress; M19 upstream failure fails open; M14 drop realpath | No | A5, A8, U18; U21; U14, U15, U31, U33 |
| M23 hook fails open; M29 static import in CLI; M22 drop notebook_path | No | 18 tests; U25, U27; U22 |
| M30 drop `--no-renames`; M31b `--diff-filter=AM`; M26 staged failure exit 0; M27 no `--no-verify` note | No | U26; U26; U27; A6 |
| M38 drop githooks self-test trigger; M41 matcher drops NotebookEdit | No | U30; U28 |

Previous survivors M13, M06 and M10 are now killed, by U36, U37 and U38. The strengthened A7-A9 kill MA (they passed against the equivalent mutant before) and MB (A7 now depends on D5). Two points of strength worth noting: M32 and M33 show that the rule layer (U32) and the path layer (U31) each carry the case fix, and U33 only fails when the path layer is reverted (M31, M33), exactly as the cycle log reports. M29, M30 and M31b re-confirm U25 and U26 have teeth; that does not repair their ordering (finding 1).

Coverage: not available (profile `coverage: null`); not run.

## Traceability

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1 AS1 (upstream file refused, names rule and route) | A1, U5, U10, U11, U33 | Yes (A1 runs the registered `.claude/settings.json` command) |
| US1 AS2 (`docs/domain_knowledge/` redirect) | A2, U11 | Yes |
| US1 AS3 (fork-only roots and zones allowed) | A3, U8, U9, U36, U37 | Yes |
| US1 AS4 (other-branch worktree allowed) | A4, U2, U13 | Yes |
| US1 AS5 (merge in progress allowed) | A5, U3, U18 | Yes |
| US2 AS1 (commit refused, every path listed) | A6, U26, U34 | Yes (real `git commit` through the hook) |
| US2 AS2 (fork-only commit succeeds) | A7 | Yes; A7 now fails without D5 (MB) and without the hook running (MA) |
| US2 AS3 (merge commit succeeds) | A8, U3 | Yes |
| US2 AS4 (other-branch worktree commit succeeds) | A9, U2 | Yes |
| US3 AS1 (runbook names `.fork/domain-knowledge/`) | A10 | Yes |
| US3 AS2 (one documented enable command) | A11 (A6-A9 use the same command) | Yes |

Every criterion has an end-to-end test; every `traces` target in the list exists and runs (201 pass, 0 todo, 0 skipped). FR-010 case-variant forms: U31, U32, U33. Untested criteria: none. Tests tracing to nothing: none (U31-U38 trace to FR-002, FR-003, FR-005, FR-010, SC-001 and the analyze and audit findings).

## What was not audited

- Mutation was a hand-made sample of 36 mutants on the feature's changed files; no tool, no score comparable across runs. Not mutated: U4, U12, U15 (partly), U19, U20, A10, `.fork/ci/README.md`, the `.fork/githooks/pre-commit` text.
- Coverage was not measured (profile has none).
- Behavior on a case-sensitive filesystem (Linux CI): U31 and U33 skip there and I could not run them in that mode; this is finding 2.
- Performance beyond the 7.4 s suite and the call-count check in U34 was not assessed.
- Live behavior in Claude Code (real PreToolUse payload for `MultiEdit` and `NotebookEdit`, research R1; quickstart sections 3 and 4; tasks T022, T028) is outside the automated tests and was not exercised.
- No `tasks.md` remediation section was appended: this audit's only permitted write was this file. The remediation below must be turned into tasks by the integrator.
- Windows paths and non-POSIX shells were not considered.

## Remediation (for the integrator; not applied)

Blocking, clear before any verdict above `FAIL`:

1. Finding 1: the ordering of U25, U26, U33, U36, U37 and U38 cannot be recovered. Do not rewrite history. Choose one: (a) adopt a reviewed fork rubric override (`.specify/templates/overrides/tdd-test-quality-rubric.md`) with an explicit class for "behavior pre-existed, test killed a recorded mutant", scoped to named ids, then re-run this audit; or (b) fold U36-U38 into U8, U9 and U10 as amendments (they are strengthenings of those rows) and keep U25, U26 and U33 as `TEST_AFTER` accepted exceptions, with the verdict recorded as `FAIL` and explicitly owner-waived in the PR. Even under (a), expect `PASS_WITH_GAPS` at best.

Non-blocking:

1. Finding 2: add a case-insensitivity test that does not depend on the host filesystem (for example, mock `realpathSync.native` output through a fixture directory on a case-insensitive volume, or assert the path-layer contract in a test that runs on Linux CI), or record in `plan.md` that the path-layer fix is verified only on macOS. Proof: the Linux CI run reports U31 and U33 as run, not skipped.
2. Finding 3: add one CLI-level test for a missing `upstream/main` (reason says to fetch) and one for detached HEAD. Proof: `node --test --test-name-pattern="^A1[2-9]" ...` passes, and fails with M19.
3. Finding 4: tick T031 once finding 1 is settled. Finding 5: set `updated_at` in `test-list.md` to the current SHA. Findings 6-7: share one guard test helper; tighten A11 to sentence-level facts.
4. Re-run `/speckit-tdd-verify` on 005 after the finding 1 decision.
