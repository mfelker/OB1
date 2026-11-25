---
feature: 005-principle-v-guard
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is `fork feature`, so its staged-PR section did not apply
verified_at: 5d5ce08
behaviors: 41
proven: 39
likely: 0
test_after: 2
no_test: 0
high_smells: 0
criteria_total: 11
criteria_covered: 11
mutation_score: 94 # scope: the 7 changed source/wiring files, 47 hand-made mutants, 44 killed, no tool (profile mutation: null)
mutants_survived: 3 # none equivalent; all inside DONE behaviors
suite: 193 passed, 0 failed, 0 todo, 5.3s (node --test .fork/ci/test/ from W)
---

# TDD Verification: Principle V guard for the fork-main checkout

**Verdict: FAIL.** Three non-equivalent mutants survive inside behaviors marked `DONE` (U8/U5, U9, U10), and two behaviors (U25, U26) have no red and their source landed before their tests. Ordering discipline otherwise holds and every acceptance criterion has an end-to-end test.

Independence: the auditor did not write these tests. All test and source files were re-read from W at `5d5ce08`. Lane is `fork feature`: no lane-specific section of the rubric or playbook applied (the "staged upstream PR" sections are conditional on that lane and were skipped).

## Test-first evidence

History: four stream branches merged `--no-ff`, one cycle per commit with test and source in the same commit. The acceptance file `c2a4ea9` (A1 to A9, as `todo`) is an ancestor of every flip commit and of the first CLI source (`22a59fb`). Not squashed, so ordering is verifiable.

Corroboration I ran myself (test file taken at the commit, source at its parent): U5 `b0d6260`, U10 `28be22b`, U21 `dc3f58d`, U23 `f3db841`, U27 `50f43cd`, A6 `34be6cf`, A3 `3d24446`, A1 `22a59fb` each fail with the failure the cycle log quotes. The committed acceptance file at `c2a4ea9` run alone gives `todo 9`, `fail 0`, with `.claude/settings.json does not exist yet` / `.fork/githooks/pre-commit does not exist yet`, as logged. U25 `1133ecd` and U26 `4568300` both PASS against their parent's source, confirming the log's "not observed" red.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| U1-U11 | PROVEN | cycle-log red per cycle; test and `.fork/ci/lib/principle-v.mjs` change in one commit (`b6d855f`, `74642c0`, `f7abd81`, `4a729dc`, `b0d6260`, `10c29c5`, `21fed79`, `c2285c6`, `fc4f852`, `28be22b`, `cc635d9`) |
| U12-U21 | PROVEN | same shape for `principle-v-paths.mjs` (`7916204`, `a635e90`, `f0f50f9`, `14870e1`, `cbad0ca`, `e585a4e`, `b62d065`, `1d3da8a`, `b9f5c6b`, `dc3f58d`) |
| U22, U23, U24, U27 | PROVEN | red recorded; test and CLI change in `659ed67`, `f3db841`, `6bdf930`, `50f43cd` |
| U28-U30 | PROVEN | red recorded; test and wiring in one commit (`c07b76e`, `c2ae20e`, `a5b6cce`) |
| A1, A3, A6 | PROVEN | red at T029 (`c2a4ea9`) plus a second pre-change red in the flip cycle; test flipped in the commit that adds the CLI behavior (`22a59fb`, `3d24446`, `34be6cf`) |
| A2, A4, A5, A7, A8, A9 | PROVEN (weak red) | test file predates all CLI source (`c2a4ea9` before `22a59fb`); red recorded once at T029 as the shared "CLI module not found" failure; flip commits (`3b847a7`, `389bb7b`, `f54be77`, `ca85dfb`, `fc31859`, `3133a58`) change only the test, because earlier source already made them pass. See finding 6 |
| A10, A11 | PROVEN | red recorded; test and README change in one commit (`321583b`, `e5780a8`) |
| U25 | TEST_AFTER | log: "red: not observed"; the behavior (dynamic `import()` inside the top-level `try`) landed in `22a59fb`, before the test commit `1133ecd`; test passes against `1133ecd^` |
| U26 | TEST_AFTER | log: "red: not observed"; `--no-renames` landed in `34be6cf`, before the test commit `4568300`; test passes against `4568300^` |

For U25 and U26 the log substitutes deliberate mutants (the playbook's remedy for a first-run pass) and I re-ran equivalent mutants (M29, M30, M31 below; all killed). That shows the tests have teeth. It does not show the test came first, and the rubric says "no red recorded" is `TEST_AFTER`, so I fail closed.

Existing tests: the only change to a pre-existing test or source file is `.fork/ci/test/self-test-needed.test.mjs` (+7 lines, one new test U30; no assertion removed or loosened) and `.fork/ci/lib/self-test-needed.mjs` (two constants extended). No skips, no config exclusions, no thresholds exist or were lowered. No weakened existing test.

`tasks.md` against the list: every behavioral task (T004-T017, T029) is `[X]` and every one of its behaviors is `DONE`; no inverse mismatch. T018 (docs only) ticked, no behavior. T021-T028 are open, as expected before this audit (T023 is this audit).

## Findings

| #   | Severity | Finding | Evidence |
| --- | -------- | ------- | -------- |
| 1 | HIGH | **Surviving mutant M13**: D5 evaluated before D4 (a fork-only root now allows a file that exists in `upstream/main`) passes the whole suite. FR-003 and rule.md say the exact upstream file stays protected "unless the exact file exists"; only the zone case (D6) has that test (U9), the root case (D5) does not. | `.fork/ci/lib/principle-v.mjs:31-32`; U8 at `.fork/ci/test/principle-v.test.mjs:62-74` only uses `files: new Set()` |
| 2 | HIGH | **Surviving mutant M06**: widening the zone `.claude/skills/speckit-` to `.claude/skills/` survives. A new `.claude/skills/other/SKILL.md` would be allowed on fork main, against FR-003. U9's look-alikes are only `.claude/settings.local.json` and `.github/workflows/forked.yml`. | `.fork/ci/lib/principle-v.mjs:5`; U9 at `.fork/ci/test/principle-v.test.mjs:76-94` |
| 3 | HIGH (by rubric; low user impact) | **Surviving mutant M10**: naming the innermost instead of the outermost upstream folder in the D8 reason survives. rule.md "Interpretations" requires the outermost. U10's fixture has a single upstream folder in the chain (`dirs` holds only `docs`), so it cannot tell them apart. | `.fork/ci/lib/principle-v.mjs:35`; U10 at `.fork/ci/test/principle-v.test.mjs:96-103`, fixture `:5-8` |
| 4 | HIGH (rubric: `TEST_AFTER`) | U25 and U26 have no recorded red and their source landed in an earlier commit than their test. Mutants are recorded but are not a red. | cycle-log.md "Cycle: U25" and "Cycle: U26"; `22a59fb`, `34be6cf` precede `1133ecd`, `4568300` |
| 5 | MED | A7 never fails under any of the 47 mutants. Its staged paths (`.fork/notes.md`, `specs/006-x/spec.md`) sit in directories the fixture's upstream does not have, so D9 allows them even with the fork-root rule removed (M05/X2 were caught only by U8). A7, A8, A9 assert only `status === 0`, so each would also pass if the hook were not running; only A6 proves the hook is active. A3's root cases have the same property (its zone cases do discriminate: X1 caught by A3). | `.fork/ci/test/principle-v-guard.acceptance.test.mjs:158-165`, `:119-122` |
| 6 | MED | A2, A4, A5, A7, A8, A9 share one red (CLI module missing, recorded once at T029 with temporary wiring). It proves the tests failed before the CLI existed but does not show each failing for its own reason. Mutants M03, M17, M33, M44 do kill A4, A5, A8, A9 and X1/M24 kill A2, so strength is fine; A7 is the exception (finding 5). | cycle-log.md "Outer loop opened", "Cycle: A2/A4/A5/A7/A8/A9" |
| 7 | MED | Spec edge cases reach only unit tests, not the CLI entry point: missing `upstream/main` (FR-006, D7), symlink and `..` forms (FR-010), detached HEAD. Acceptance criteria are all covered end to end; these are requirements and edge cases. `M19`, `X3`, `M14` are killed at unit level. | U7, U12-U16, U21; no `A` test names them |
| 8 | LOW | Duplicated setup: `guardRepo`, `denyReason` and a hook runner are written twice with small differences. The profile's helpers (`git-fixture.mjs`) are used, but no shared guard helper exists. | `.fork/ci/test/principle-v-guard.test.mjs:13-38` vs `.fork/ci/test/principle-v-guard.acceptance.test.mjs:40-71` |
| 9 | LOW | A10/A11 match loose words in whitespace-collapsed prose (`/allow/i`, `/merge/i`, `/refus\|den(y\|ie)/i`); M43 (changing the enable command) is caught, but a rewrite that keeps the words and drops the meaning passes. | `.fork/ci/test/principle-v-docs.test.mjs:66-72` |
| 10 | LOW | `test-list.md` frontmatter `updated_at: 14c447a` is stale; the last change to the file is `b30ffbc`. | `specs/005-principle-v-guard/tdd/test-list.md:7` |
| 11 | LOW | `--staged` runs `git ls-tree -r upstream/main` and three more git calls once per staged path (`decideFor` per path). Correct, but the cost grows with the commit size, and the feature measures performance once by hand (quickstart section 5), not by a test. Not assessed. | `.fork/ci/bin/principle-v-guard.mjs:14-20, 41-43` |

Smell pass (rubric catalogue, all new or changed test files): no assertion-free, tautological, doubled-subject, over-mocked, vacuous, conditional, snapshot or skipped tests. Loops in U2, U6, U8, U9, U14, U19 are data tables with a per-iteration label, not conditional assertions. No `todo` or skip remains (suite: `todo 0`, `skipped 0`). Style matches the exemplar (`node:test`, `node:assert/strict`, one `test()` per behavior, temp repos from `helpers/git-fixture.mjs`). Properties: tests use temp repos and no network; the suite takes 5.3 s; failure messages carry labels; no sleeps or clocks. Tests assert observable outputs (deny JSON, stderr, exit codes) rather than internals.

## Mutation results

No mutation tool (profile `mutation: null`). 47 deliberate mutants, each applied alone to a fresh copy from `git archive HEAD` in `/tmp/pvg-audit` (never in W or M), whole suite run per mutant. Scope: `.fork/ci/lib/principle-v.mjs`, `principle-v-paths.mjs`, `.fork/ci/bin/principle-v-guard.mjs`, `.fork/ci/lib/self-test-needed.mjs`, `.claude/settings.json`, `.fork/githooks/pre-commit`, `.fork/README.md`. This is a sample of the highest-risk rules, not exhaustive. Pristine copy suite green (193/193) before the run.

Killed 44 of 47 (score 94 percent of the sample). Killing tests in brackets.

| Mutant | Survived | Judgment |
| ------ | -------- | -------- |
| M06 `speckit-` zone prefix widened to `.claude/skills/` (`principle-v.mjs:5`) | **Yes** | Not equivalent: a new non-speckit skill file would be allowed. Finding 2 |
| M10 D8 names innermost folder (`principle-v.mjs:35`) | **Yes** | Not equivalent: contract-specified message. Finding 3 |
| M13 D5 evaluated before D4 (`principle-v.mjs:31-32`) | **Yes** | Not equivalent: FR-003 exact-upstream-file exception for fork roots. Finding 1 |
| M01 drop D1 [U1]; M02 detached HEAD denied [U2]; M03 drop D3 [A5, A8, U3]; M04 drop D4 [A1, A6, U5, U9-U11, U22, U26]; M05 drop `specs` root [U8]; M07 `fork-` prefix loosened [U9]; M08 settings equality loosened [U9]; M09 D8 immediate parent only [A2, U6, U10]; M11 knowledge prefix without slash [U11]; M12 D7 before D5 [U8, U9]; M44 D2 denies [A4, A8, A9, U2]; X1 drop D6 [A3, U9]; X2 drop D5 [U8]; X3 D7 allows [U7, U8, U10, U11] | No | Caught |
| M14 drop realpath [U14, U15]; M15 root from cwd [U13, U16]; M16 detached label [U17]; M17 merge always false [A5, A8, U18]; M18 dirs immediate parent only [U20]; M19 upstream failure fails open [U21]; M20 root itself not null [U16]; M21 no work-tree guard [U19] | No | Caught |
| M22 drop notebook_path [U22]; M23 hook fails open [U23, U24, U25]; M24 drop suggestion [A1, A2]; M25 staged no exit code [A6, U26]; M26 staged failure exit 0 [U27]; M27 no `--no-verify` note [A6]; M28 no header [A6]; M32 only first staged path [A6, U26]; M33 staged ignores merge state [A4, A5, A8, A9]; M34 hook ignores input cwd [U22]; M35 hook exits 2 on deny [A1, A2, U22]; M36 staged flag mismatch [A6, U26, U27] | No | Caught |
| M29 U25 static import [U25, U27]; M30 drop `--no-renames` [U26]; M31 `--diff-filter=AM` [U26] | No | Caught: U25 and U26 have teeth, but this does not repair their ordering (finding 4) |
| M37 drop settings.json trigger [U30]; M38 drop githooks trigger [U30]; M39 pre-commit runs `--hook` [U29, A6]; M40 timeout [U28]; M41 matcher drops NotebookEdit [U28]; M42 pre-commit not executable [U29]; M43 README enable command changed [A11] | No | Caught |

All mutants lived only in the scratch copy; W was not touched, so no restore was needed there. The scratch pristine copy was re-extracted per mutant.

Coverage: not available (profile `coverage: null`); not run.

## Traceability

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1 AS1 (upstream file refused, names rule and route) | A1, U5, U10, U11 | Yes (A1 runs the `.claude/settings.json` command) |
| US1 AS2 (`docs/domain_knowledge/` redirect) | A2, U11 | Yes |
| US1 AS3 (fork-only roots and zones allowed) | A3, U8, U9 | Yes (zone cases discriminate; root cases do not, finding 5) |
| US1 AS4 (other-branch worktree allowed) | A4, U2, U13 | Yes |
| US1 AS5 (merge in progress allowed) | A5, U3, U18 | Yes |
| US2 AS1 (commit refused, every path listed) | A6, U26 | Yes (real `git commit` through the hook) |
| US2 AS2 (fork-only commit succeeds) | A7 | Yes, but weak (finding 5) |
| US2 AS3 (merge commit succeeds) | A8, U3 | Yes |
| US2 AS4 (other-branch worktree commit succeeds) | A9, U2 | Yes |
| US3 AS1 (runbook names `.fork/domain-knowledge/`) | A10 | Yes (reads the real README) |
| US3 AS2 (one documented enable command) | A11 (A6-A9 also use the same command) | Yes |

Every criterion has a test; every `traces` target in the list exists and runs (`todo 0`, 193 pass). Functional requirements FR-001 to FR-013 each map to at least one test (FR-006, FR-010 and the detached-HEAD edge only at unit level: finding 7). SC-004 (a real `/speckit-grill-with-docs` session) and SC-005 (a real upstream merge with no bypass) are behavioral and covered only by A5/A8 as proxies. Tests tracing to nothing: none (U28-U30 trace to FR-007, FR-009, FR-013).

## What was not audited

- Mutation was a hand-made sample of 47 mutants on the feature's changed files; no tool, no mutation score comparable across runs. Behaviors not mutated: U4, U12 (partly), U15, U19 other branches, README layout wording (A10), `.fork/ci/README.md` content.
- Coverage was not measured (profile has none).
- Performance and load (the `--staged` per-path git calls, finding 11) were not assessed beyond the 5.3 s suite.
- Live behavior in Claude Code (the real PreToolUse payload for `MultiEdit` and `NotebookEdit`, research R1; quickstart sections 3 and 4; tasks T022, T028) is outside the automated tests and was not exercised.
- No `tasks.md` remediation section was appended: this audit's only permitted write was this file. The remediation below must be turned into tasks by the integrator.
- Windows paths and non-POSIX shells were not considered; the hook script is POSIX `sh`.

## Remediation (for the integrator; not applied)

Blocking, clear before PASS:

1. Finding 1: add a unit test beside U8 in `.fork/ci/test/principle-v.test.mjs` where `upstream.files` contains a path under each fork-only root (for example `specs/x.md`) and expect `D4`. Proof: `node --test --test-name-pattern="^U8 " .fork/ci/test/principle-v.test.mjs` passes, and with `principle-v.mjs:31-32` swapped it fails.
2. Finding 2: extend U9 with `.claude/skills/other/SKILL.md` and `.github/workflows/ci2.yml` (allowed zone look-alikes that must be `D8`). Proof: the test fails with `'.claude/skills/speckit-'` widened to `'.claude/skills/'`.
3. Finding 3: give U10 a fixture with nested upstream folders (`docs` and `docs/a`) and assert `inside upstream folder docs/`. Proof: fails with `.find` changed to `.findLast`.
4. Finding 4: the test-first evidence for U25 and U26 cannot be recovered after the fact. Either record the deviation as an owner-accepted exception in the cycle log and in a reviewed fork override of the rubric (a distinct class for "behavior pre-existed, test killed a recorded mutant"), or accept `FAIL` on those two. Do not rewrite history. The same pattern is likely again in this fork (the stub-first plan makes first-run passes common), so the override is worth deciding once.

Non-blocking:

5. Finding 5: make A7 fail when fork roots are not allowed (give the fixture's `upstream/main` a file under `specs/` or `.fork/`, or add a staged `.claude/settings.json`), and assert in A7 to A9 that the hook ran (for example, a positive marker or pairing each allow with a deny in the same repo).
6. Finding 7: add one CLI-level test for `upstream/main` missing (exit message tells the owner to fetch) and one detached-HEAD case.
7. Findings 8-10: share one guard test helper; tighten A11 to the sentence-level facts; refresh `updated_at` in `test-list.md`.
8. Re-run `/speckit-tdd-verify` on 005 after items 1-4; expected verdict `PASS_WITH_GAPS` at best (mutation unmeasured by a tool, coverage unavailable).
