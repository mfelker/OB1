---
feature: 003-tdd-extension
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # first match in the template stack; its fork staged-PR section NOT applied (lane is fork feature)
verified_at: 3e9562b
behaviors: 56 # A1-A16 + U1-U40
proven: 40
likely: 0
test_after: 6
no_test: 10
not_applicable: 0
high_smells: 0
high_findings: 8
criteria_total: 13 # acceptance scenarios: US1 AS1-3, US2 AS1-4, US3 AS1-3, US4 AS1-2, US5 AS1
criteria_covered: 6 # by an executable test through the real entry point; the other 7 have manual evidence only
mutation_score: unmeasured # no mutation tool in the profile; 40 deliberate mutants, 29 caught (72.5%), scope: feature-changed files in .fork/ci plus the rubric override and .fork/README.md
mutants_survived: 11 # all re-run against the full suite; 7 inside DONE behaviors or FR-016 wiring (HIGH), 4 outside the listed behavior text (MED)
suite: 151 passed, 0 failed, 6.6 s # node --test .fork/ci/test/ (Node 26.13.0); profile suite exit 0, tests=151 pass=151 fail=0 → sql-unverified, 6.9 s
---

# TDD Verification: Adopt the spec-kit-tdd extension for enforced TDD

**Verdict: FAIL.** Seven of the 13 acceptance scenarios have no executable test. They are US1 AS1–3, US3 AS1–3 and US5 AS1 (A7–A12 and A15, all still `PENDING`). Their post-merge evidence is real, but it was observed by hand and can't be re-run.

Three other conditions each produce `FAIL` on their own:

- **Six permanent `TEST_AFTER` behaviors**: A3–A6, U29 and U32.
- **Two `DONE` behaviors with no test**: A1 and A2.
- **Seven surviving mutants that matter.** Each sits inside a `DONE` behavior, or in FR-016's credential-blanking wiring. Every one survives the full 151-test suite:
  - U9: a subdirectory of a work tree is accepted.
  - U23: a non-zero exit with passing counts is reported as a pass.
  - U32: a substring match is accepted as a literal comparison.
  - U40: the owner check, and the check in the reuse path, are both unpinned.
  - FR-016: the CLI's `childEnv` wiring for `single`, `file` and `suite` is unpinned.

The last group is new since the pre-merge audit (`426fd6a`). It is also the only group that remediation can still clear.

**What holds up:**

- The cycle log never contradicts the history.
- Every `PROVEN` behavior has a recorded red and a commit that adds the test and the source together.
- No existing test was weakened.
- The suite is fast and deterministic.
- The post-merge evidence (smoke, calibration, CI summary) checks out when vetted.

**Independence.** This audit ran from cold context. It was not written by the session that wrote the tests. A read-only fresh-context subagent ran the smell pass, and I opened every line it cited before using it.

**Fork section: inert (A12).**

- The plan's Lane is `fork feature` (`plan.md:22`). `node .fork/ci/bin/tdd.mjs where` reports `"lane":"fork"`, tree `/Users/mfelker/Projects/ob1`, folder `.fork/ci`.
- The rubric's `<!-- fork: staged-pr evidence -->` section applies only when the Lane says `staged upstream PR`. So no S1–S4 rule was used, and no behavior was classed `NOT_APPLICABLE` through S4.
- Every behavior was classified with the base `PROVEN` / `LIKELY` / `TEST_AFTER` / `NO_TEST` / `NOT_APPLICABLE` table.

## Standard and templates resolved

- **Quality rubric**: `.specify/templates/overrides/tdd-test-quality-rubric.md`.
  - It is the first match in the stack. The override exists, and there is no `.specify/presets/` directory.
  - Outside its fork section it is byte-identical to `.specify/extensions/tdd/templates/tdd-test-quality-rubric.md`. I checked this with `diff`; U35 pins it too.
- **Test list format**: `.specify/extensions/tdd/templates/tdd-test-list-template.md`. There is no override and no preset, so the extension copy is used. `grep -i -E 'fork|lane|staged'` finds no match in it, so it has no lane-specific section.
- **Lane-specific section**: present only in the rubric override (the staged-PR evidence rules S1–S4 and the S4-before-S2 order). It was not applied (see above).
- **Task constraint**: the caller limited writes to this report. The skill's Phase 7 append to `tasks.md` was therefore not done. Remediation is listed under [Remediation](#remediation-not-appended-to-tasksmd) instead.

## Preflight

- **Profile**: `.specify/memory/tdd-profile.md`, read in full, including:
  - its Conventions section;
  - the unit exemplar `.fork/ci/test/runtimes.test.mjs`;
  - the helpers `.fork/ci/test/fixtures.mjs` and `.fork/ci/test/helpers/{folder,git-fixture}.mjs`.

  There is no coverage tool and no mutation tool.
- **Feature**: `check-prerequisites.sh --json --paths-only` returns `FEATURE_DIR …/specs/003-tdd-extension`. `.specify/feature.json` was not changed.
- **Suite**:
  - `node --test .fork/ci/test/` gives 151 passed, 0 failed, 6.6 s wall.
  - `node .fork/ci/bin/tdd.mjs suite` exits 0 with `tests=151 pass=151 fail=0 → sql-unverified`, 6.9 s wall.
  - Baseline: 101 tests at `d83711a` (`cycle-log.md:9`). No failure predates the feature, and none is inside it.
- **History range**: `43e898a..3e9562b`, which takes in PR #16 (`6a4e195`) and PR #17 (`90cf00d`).
  - All four stream merges (`26a9b50`, `8e42fe4`, `7646012`, `b6e2ee6`) and both PR merges are clean. `git show --cc` prints no conflict resolutions.
  - Nothing was squashed. Every cycle commit is visible.
- **Lane hygiene (FR-015)**: `git diff --name-only 43e898a HEAD` lists no path outside `.specify/`, `.fork/`, `specs/`, `.claude/skills/speckit-*` and `.github/workflows/fork-*`.

## Test-first evidence

Classes follow the base table:

- **`PROVEN`**: a red is recorded in the cycle log, and one commit adds the test with its source.
- **`TEST_AFTER`**: the test landed in a commit after the code that satisfies it.
- **`NO_TEST`**: there is no re-runnable test and no recorded red. Vetted manual evidence is listed beside the class, but it does not change the class.

| Behavior | Class | Evidence |
| --- | --- | --- |
| A1 | NO_TEST | No executable test. The `test` column points to `evidence/r1-verify.md`, a manual hash record. No red is recorded. |
| A2 | NO_TEST | No executable test. `cycle-log.md:339` reads "red: n/a for a document". The profile's Verification record (`f40c89d`) is the evidence. |
| A3 | TEST_AFTER | Test-only commit `21d2a1b`. The code it covers landed earlier: U5 `82a2fe8`, U9 `08ed34b`, U24 `56db46d`. The logged red is a deliberate mutant (`cycle-log.md:283-284`). |
| A4 | TEST_AFTER | Test-only commit `1009717`, after U14, U15 and U23. Mutant red at `cycle-log.md:293-294`. My M18 (the same false-green guard) is caught by A4. |
| A5 | TEST_AFTER | Test-only commit `dcaf663`, after U6 `b6b61fd`. Mutant red at `cycle-log.md:303-304`. |
| A6 | TEST_AFTER | Test-only commit `2962db5`, after U11 `0c24e82` and U13 `a3dacc9`. Mutant red at `cycle-log.md:313-314`. |
| A7, A8, A9 | NO_TEST | `PENDING`, with no test (`test-list.md:28-30`). Vetted evidence: `evidence/smoke.md` (`80b7985`) records A8 stopping, and A7/A9 driving one cycle. Its cycle commit `9ff5bd4` still exists as an object, but no branch contains it (`fork/tdd-smoke` was deleted). It shows `sum.mjs` and `sum.test.mjs` added together. The record is a one-off manual observation. |
| A10 | NO_TEST | `PENDING`. Vetted evidence: `calibration/staged-fixture/tdd/verification.md` (`3e9562b`) classes C1 and K4 `PROVEN` by S1, with reproduced base-reds. This supports US3 AS1. |
| A11 | NO_TEST | `PENDING`. The row as worded is stale (finding 13). The fixture now classes C3 `NOT_APPLICABLE` by S4, and K2 (fixture U4) `TEST_AFTER` by S2. K2 is what supports US3 AS2. |
| A12 | NO_TEST | `PENDING`. Its evidence is this report: the fork section stayed inert. |
| A13 | PROVEN | Red at `cycle-log.md:464-465`. `1d4ff90` adds `tdd-docs.test.mjs` and `constitution.md` together. |
| A14 | PROVEN | Red at `cycle-log.md:473-474`. `d7478f1` adds the test and `.fork/README.md` together. Two assertions are weak (finding 10). |
| A15 | NO_TEST | `PENDING`. Vetted evidence: `specs/002-stage-pr-532-atomizer-default/tdd/verification.md` gives `BLOCKED` with the reason "no test list". The fixture report exists. |
| A16 | NO_TEST | `PENDING`. Vetted evidence: the PR #16 `fork-ci-verdict` job log (run `45631585606`) shows `## Fork CI verdict: ✅ success` and `\| specs/003-tdd-extension \| ✅ \| ✅ \| ❌ FAIL \|`. The verdict was unchanged by the FAIL row. The evidence isn't recorded in the repository. U34 covers it at unit level. |
| U1–U3 | PROVEN | Reds at `cycle-log.md:24-25`, `33-34`, `42-43`. `adb3068`, `1421f3b` and `8fdfda0` each add test and source together. |
| U4 | PROVEN | Red at `cycle-log.md:51-52`, re-observed; `:50` notes the test was drafted by an earlier session. `8530e1a` adds test and source together. |
| U5–U11 | PROVEN | Reds at `cycle-log.md:60-117`. `82a2fe8`, `b6b61fd`, `b0dffbc`, `7d504c2`, `08ed34b`, `11eafb3` and `0c24e82` each add test and source together. U9 has a surviving mutant (finding 8). |
| U12–U20 | PROVEN | Reds at `cycle-log.md:126-205`. `07db776`, `a3dacc9` (also exports `TEST_PATTERNS` from `lib/runtimes.mjs`; visibility only), `2f635bc`, `b20e2fd`, `d2b140f`, `1c283eb`, `ba630a7`, `dcf09c3` and `cc602f0` each add test and source together. |
| U21 | PROVEN | Red at `cycle-log.md:214-215`, `5f32911`. It was strengthened in `1c2df30` with a mutant red (`:496`). |
| U22–U27 | PROVEN | Reds at `cycle-log.md:224-274`. `7bc1d36`, `9777c3a`, `56db46d`, `ec3f8c6`, `a2a39da` and `df3fba2` each add test and source together. For U26, the red was re-observed against the pre-U26 CLI after a draft case was fixed (`:264`, `:267`). U23 has a surviving mutant (finding 6). |
| U28 | PROVEN | Red at `cycle-log.md:403-404`, `eebd275`. |
| U29 | TEST_AFTER | Test-only commit `02b4fd4`, after U28's scan in `eebd275`. `cycle-log.md:417` admits it. Mutant red at `:412-413`. |
| U30, U31 | PROVEN | Reds at `cycle-log.md:394-395` and `385-386`. `a63299b` and `063c7a1`. |
| U32 | TEST_AFTER | Test-only commit `bb44e34`, after `eebd275`. `cycle-log.md:427` admits it. A mutant survives (finding 7). |
| U33 | PROVEN | Red at `cycle-log.md:432-433` (2 failed). `4f95dc0`. The third U33 test is an invariant guard that was green before (`:437`). |
| U34 | PROVEN | Red at `cycle-log.md:442-443`. `0f1f437` adds test, bin and workflow env together. |
| U35 | PROVEN | Red at `cycle-log.md:370-371` ("override file missing"). `c77f3e4`. The test's own phrase regexes were loosened before its first green and never committed weaker (`:373`). |
| U36 | PROVEN | Red at `cycle-log.md:452-453`. `e932952`. It supersedes one existing assertion (see below). |
| U37 | PROVEN | Red at `cycle-log.md:484-485`. `b4227e1`. The unit test was added in `1c2df30` against mutants. |
| U38 | PROVEN | Red at `cycle-log.md:506-507`. `f0f3d58` adds the test and the override edit together. |
| U39 | PROVEN | Red at `cycle-log.md:515-516`. `3b66939`. |
| U40 | PROVEN | Red at `cycle-log.md:525-526` (stub returning `true`). `9a4f1b2`. Two mutants survive (finding 5). |

Totals: 40 `PROVEN`, 6 `TEST_AFTER`, 10 `NO_TEST`, 0 `LIKELY`, 0 `NOT_APPLICABLE`, for 56 behaviors.

### Existing tests changed by the range

- **`.fork/ci/test/self-test-needed.test.mjs:17`** (`e932952`).
  - Before: `selfTestNeeded(['specs/001/spec.md', '.fork/README.md', 'recipes/a/index.ts'])` → `false`.
  - After: `selfTestNeeded(['specs/001/spec.md', 'recipes/a/index.ts'])` → `false`.
  - Judgment: **superseded, not weakened.** U36 deliberately makes `.fork/README.md` trigger the self-test, and re-pins it as `true` at `:27`. It also pins the near-misses `.fork/README.md.bak` and `docs/.fork/README.md` as `false` (`:34-35`). The test still asserts a fork-only path (`specs/001/spec.md`) is `false`. The cycle log records the deviation (`cycle-log.md:457`).
- **`tdd-cli.test.mjs`, U27 and A3** (`b4227e1`): the exact pre-count `suite` line became `…: tests=1 pass=1 fail=0 → pass` (`:194`, `:231`). That is more specific, not less. It is behavior-driven by U37 and recorded at `cycle-log.md:489`.
- **`tdd-commands.test.mjs`, U18** (`3b66939`): the expected venv dir moved from `tmpdir()` to the `expectedVenv` helper (`:147`), following U39's behavior change. The other U18 assertions are unchanged. Recorded at `cycle-log.md:520`.
- Nothing else changed: no skip markers, no config exclusions, and no threshold changes (the repo has none).

### tasks.md against the test list

- Ticked tasks with markers (T005, T008–T019, T032a) all map to `DONE` behaviors.
- T028, T030, T031 and T032 are unticked, and their behaviors (A7–A12, A15, A16) are `PENDING`. That is consistent.
- **T029 is unticked (`tasks.md:238`)**, but its work happened: PR #16 merged, and `plan.md` Worktree is set to none (`9c31c00`). It is an unmarked task, so this is a bookkeeping gap, not a completion claim (finding 16).

## Findings

Ordered by severity. "Survives" means against the full `node --test .fork/ci/test/` suite, in a scratch copy (`git archive HEAD`), restored and re-verified green after each mutant.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | 7 of 13 acceptance scenarios have no executable test: US1 AS1–3 (A7–A9), US3 AS1–3 (A10–A12) and US5 AS1 (A15). Their evidence is real but manual and one-off. | `test-list.md:28-36`. Evidence: `evidence/smoke.md`; `calibration/staged-fixture/tdd/verification.md`; `specs/002-…/tdd/verification.md`; this report |
| 2 | HIGH | 6 behaviors are permanently `TEST_AFTER`: A3–A6, U29, U32. Each is a test-only commit after the code it covers. Mutant reds are logged in place of pre-implementation reds. | `21d2a1b`, `1009717`, `dcaf663`, `2962db5`, `02b4fd4`, `bb44e34` |
| 3 | HIGH | A1 and A2 are `DONE` with no executable test; the evidence is documents only. | `test-list.md:22-23`; `cycle-log.md:339` |
| 4 | HIGH | **FR-016 wiring is untested.** Swapping `childEnv(process.env)` for the raw env survives, in both `single`/`file` (M25, `bin/tdd.mjs:78`) and `suite` (M24, `bin/tdd.mjs:138`). Only the `childEnv` unit is pinned (U21). The spec's Testing Requirements name "credential blanking for every child". The `tdd()` test helper strips `NODE_TEST_CONTEXT` from the child env itself (`tdd-cli.test.mjs:51`), so even that removal is unproven end to end. | `bin/tdd.mjs:78`, `:138`; `tdd-cli.test.mjs` (no test asserts the child's env) |
| 5 | HIGH | **U40's reuse guard is half pinned.** Two mutants survive. M13 drops the owner check `st.uid === process.getuid()` (`lib/tdd-commands.mjs:182`), which is in U40's listed text. M21 drops `privateDir(venv.dir) &&` from the reuse path in `ensureVenv` (`bin/tdd.mjs:34`), so a planted dir with a matching stamp is reused. `cycle-log.md:530` admits the wiring is not exercised. | `tdd-commands.test.mjs:260-280`; `bin/tdd.mjs:32-43` |
| 6 | HIGH | **U23 false green.** Dropping `code !== 0 \|\|` (`bin/tdd.mjs:64`) survives. A run whose counts show passes but whose process exits non-zero is reported `→ pass`, exit 0. That breaks the docstring's "never a pass without a clean exit" (`:57`) and U23's "pass 0, fail 1". | `bin/tdd.mjs:57-66`; `tdd-cli.test.mjs:76` |
| 7 | HIGH | **U32 is not pinned as an exact comparison.** Replacing `=== headRef` with `.includes(headRef)` (`lib/tdd-status.mjs:54`) survives. No case has a head ref that is a substring of another spec's branch, such as `fork/a` against `fork/abc`, or `fork/tdd` against `fork/tdd-extension`. | `tdd-status.test.mjs:64-75` |
| 8 | HIGH | **U9's top-level rule is unpinned.** Replacing `realpathSync(top) === real` with `top` (`lib/tdd-target.mjs:61`) survives, so a subdirectory of a work tree is accepted as the tree. `cycle-log.md:100` and the docstring (`:56`) both state the top-level rule. U9's cases are only "never created" and "plain temp dir with no `.git`". | `tdd-target.test.mjs:140-146` |
| 9 | MED | **Bypassed test utility, plus an isolation defect.** Several files hand-roll what `helpers/git-fixture.mjs` and `fixtures.mjs` provide:<br>• `{rel: content}` writers: `fixtureRepo` (`tdd-target.test.mjs:18`), `tempTree` (`tdd-commands.test.mjs:11`), `tree` (`tdd-status.test.mjs:8`), `writeMap` (`tdd-cli.test.mjs:25`), `verdictRoot` (`verdict.test.mjs:136`).<br>• Git environments: `GIT_ENV`/`gitIn` (`tdd-target.test.mjs:89-90`, `tdd-cli.test.mjs:135-136`).<br>These spread the host `process.env` without `HOME`. `git-fixture.mjs:23` sets `HOME: repo.dir`, so the host `~/.gitconfig` (hooks, templates, signing) leaks into these fixtures. | as cited |
| 10 | MED | **Weak docs assertions in A14.**<br>• `/advisory/i` (`tdd-docs.test.mjs:52`): with "It never changes `fork-ci-verdict`" rewritten to "It can fail `fork-ci-verdict`", the test still passes (M37).<br>• `/reason/i` (`:54`): with the reason requirement replaced by "no reason is required", the test still passes (M38).<br>Deleting the line outright is caught, so these are under-specified rather than vacuous. A14's listed text doesn't include these two claims, so this is MED. Similar: `/does\s+not\s+apply/` (`tdd-overrides.test.mjs:36`), which is backed by the stronger `:35`. | M37, M38 |
| 11 | MED | **Host-dependent U29 order check.** Dropping `.sort()` (`lib/tdd-status.mjs:50`) survives on this macOS/APFS host (M40), because `readdir` already returns the fixture in sorted order. Reversing the order is caught (M39). Ordering is in the test name but not in U29's listed text. | `tdd-status.test.mjs:53-62` |
| 12 | MED | **U19's dependency-only detection is untested.** Dropping `\|\| r in deps` (`lib/tdd-commands.mjs:81`) survives (M36): both vitest and jest fixtures also name the runner in the test script. `cycle-log.md:196` claims detection by script or dependency. | `tdd-commands.test.mjs:184-210` |
| 13 | MED | **Test list out of date.**<br>• A11's text "fixture C3 without a base-red classifies `TEST_AFTER`" (`test-list.md:32`; Behavior Map `tasks.md:87`) contradicts the current fixture: C3 is the S4 control (`NOT_APPLICABLE`), and K2 is the S2 control (`TEST_AFTER`).<br>• The frontmatter `updated_at: b4227e1` (`test-list.md:7`) predates U38–U40.<br>• U25 traces to FR-015 (`test-list.md:84`). Lockfile restore isn't FR-015's fork-only-paths rule.<br>• FR-003, FR-008 and FR-015 have no behavior. | as cited |
| 14 | MED | **Eager tests and assertion roulette.** One test covers several behaviors, with mostly unlabelled assertions, so the first failure hides the rest:<br>• U3, U4, U7, U8, U10, U11 (`tdd-target.test.mjs:63, 77, 120, 133, 147, 161`)<br>• U12, U14, U17, U18, U19, U20 (`tdd-commands.test.mjs:33, 72, 123, 149, 184, 212`)<br>• U21 (`tdd-env.test.mjs:7`)<br>• U23, U24, U26 (`tdd-cli.test.mjs:76, 111, 164`)<br>• U33 T1–T10 in one test (`report.test.mjs:90`)<br>• U34, 18 runs (`verdict.test.mjs:160`) | as cited |
| 15 | MED | **Redundant same-level pins.** The summary-line format is pinned by U23, U24, U27 and U37 (`tdd-cli.test.mjs:87`, `:97`, `:115`, `:190-194`, `:203`), so one format bug fails four tests. The venv-dir derivation is pinned by U18 and U39 (`tdd-commands.test.mjs:154`, `:250-253`). | as cited |
| 16 | LOW | T029 is done (PR #16 merged, `9c31c00`) but unticked. | `tasks.md:238` |
| 17 | LOW | **Re-implemented expectation (partial; not graded HIGH).** `expectedVenv` and `sha1` (`tdd-commands.test.mjs:144`, `:147`) restate the contract formula `<cache>/fork-tdd/venv-<sha1(cwd)>`. The inputs are built independently, and U39 pins a literal XDG path (`:250`). Changing the key or the cache root is caught (M15). The only bug both copies would share is in Node's `crypto`. | as cited |
| 18 | LOW | **Conditional assertion.** `if (section) assert.match(...) else assert.doesNotMatch(...)` (`verdict.test.mjs:181`): both branches assert, so it doesn't meet the catalogue's "some runs assert nothing". | as cited |
| 19 | LOW | **Foreign style.**<br>• `tdd-docs.test.mjs:14` exports a helper from a test file.<br>• `verdict.test.mjs:125-130` puts imports mid-file.<br>• `plan()` and `throwsTarget` are duplicated across `tdd-target`, `tdd-cli` and `tdd-commands`.<br>• Fixture temp dirs are never removed. | as cited |

No `HIGH` smells from the catalogue were confirmed. The subagent proposed two, and I downgraded both after reading the cited lines:

- **Re-implemented expectation**: finding 17.
- **Vacuous docs regexes**: finding 10. Absence of the word is caught; only a negated statement passes.

No credentials were found: `tdd-env.test.mjs:12-14` uses obvious `fake-*` placeholder values. No repository content tried to instruct the auditor.

**Suite properties**:

- The suite is fast: 6.6 s for 151 tests. Six tests are over 1 s: U23 1.2 s, the acceptance block 1.4 s, U34 1.4 s, and three pre-existing ones.
- It was deterministic over 4 full runs.
- It depends on the host in three places: U18 and U39 read `XDG_CACHE_HOME`/`homedir()`; U29's order check depends on the host's `readdir` order; and the git fixtures read the host `~/.gitconfig` (finding 9).

## Mutation results

There is no mutation tool, so I used deliberate mutants, one at a time, in a scratch copy (`git archive HEAD`):

1. Apply one mutant with an exact-string replace, asserted to match exactly once.
2. Run the owning test file.
3. Run `git checkout --` to restore, and confirm `git status` is clean.
4. Re-run the full suite and confirm it is green (151/151 every time).

Every survivor was then re-run against the full suite, and it still survived.

The triage rule for survivors is applied to all of them:

- **HIGH**: the unpinned case falls inside the behavior's text as listed in `test-list.md`, or inside a spec requirement whose Testing Requirements name it explicitly (FR-016, "credential blanking for every child"). M3 counts under this rule: U9 lists "not a git work tree", and a subdirectory is not a work tree's root.
- **MED**: the case is claimed only in a cycle-log note, a test name or task text, and not in the listed behavior. That covers M36 (`cycle-log.md:196`), M37 and M38 (A14's test name and T019 mention the advisory status and the reason, but A14's listed text does not), and M40 ("sorted" appears only in the test name). The sample covers every feature-changed source file in `.fork/ci`, plus the rubric override and `.fork/README.md`. It is a sample, not exhaustive: roughly 1–3 mutants per behavior, weighted to FR-006, FR-007, FR-014 and FR-016.

| Mutant | Behavior | Survived | Judgment |
| --- | --- | --- | --- |
| M1 `tdd-target.mjs:81` env and feature.json priority swapped | U1 | No | caught by U1 |
| M2 `:50` `/^none/i` → `/^none/` | U6 | No | caught |
| M3 `:61` top-level equality → any work tree | U9 | **Yes** | finding 8 |
| M4 `:73` drop the `..` check | U10 | No | caught |
| M5 `:46` missing Worktree → repoRoot for every lane | U8 | No | caught |
| M6 `:69` drop the `N/A` check | U10 | No | caught |
| M7 `tdd-commands.mjs:19` drop the inside-tree check | U12 | No | caught |
| M8 `:15` tree before folder | U12 | No | caught |
| M9 `:157` `\|` not escaped | U14 | No | caught |
| M10 `:58` drop the `$` anchor | U14 | No | caught |
| M11 `:68` first count instead of last | U15 | No | caught |
| M12 `:147` pytest zero exit 5 → 4 | U18 | No | caught |
| M13 `:182` drop the uid check | U40 | **Yes** | finding 5 |
| M14 `:182` `0o022` → `0o002` | U40 | No | caught |
| M15 `:141` ignore `XDG_CACHE_HOME` | U39 | No | caught |
| M16 `tdd-env.mjs:13` named vars not blanked | U21 | No | caught |
| M17 `:4` drop `_SECRET` | U21 | No | caught |
| M18 `bin/tdd.mjs:61` zero-match needs a runtime-specific exit | U23, A4 | No | caught by U23 and A4 |
| M19 `:64` drop `code !== 0` | U23 | **Yes** | finding 6 |
| M20 `:122` lockfile not restored | U25 | No | caught |
| M21 `:34` reuse without `privateDir` | U40 | **Yes** | finding 5 |
| M22 `:171` no Node version check | U26 | No | caught |
| M23 `:99` `exempt` → exit 1 | U24 | No | caught |
| M24 `:138` suite child gets the raw env | FR-016 | **Yes** | finding 4 |
| M25 `:78` single/file child gets the raw env | FR-016 | **Yes** | finding 4 |
| M26 `tdd-status.mjs:24` accept any verdict string | U28 | No | caught |
| M27 `:20` no frontmatter check | U28 | No | caught |
| M28 `report.mjs` (`tddSection`) `f.dir` not escaped | U33 | No | caught |
| M29 `bin/verdict.mjs` remove the `catch` | U34 | No | caught |
| M30 `self-test-needed.mjs:6` drop `.fork/README.md` | U36 | No | caught |
| M31 rubric override: one word changed outside the fork section | U35 | No | caught |
| M32 rubric override: rule order reversed | U38 | No | caught |
| M33 `tdd-commands.mjs:170` `?` branch removed | U37 | No | caught |
| M34 `tdd-status.mjs:54` `===` → `.includes` | U32 | **Yes** | finding 7 |
| M35 `tdd-commands.mjs:63` every file uses `node:test` | U16 | No | caught |
| M36 `:81` drop dependency detection | U19 | **Yes** | finding 12 (outside the listed text) |
| M37 `.fork/README.md` "never changes" → "can fail" `fork-ci-verdict` | A14 | **Yes** | finding 10 |
| M38 `.fork/README.md` reason requirement → "no reason is required" | A14 | **Yes** | finding 10 |
| M39 `tdd-status.mjs:50` `.sort()` → `.reverse()` | U29 | No | caught |
| M40 `:50` drop `.sort()` | U29 | **Yes** | finding 11 (host-dependent) |

Result: 40 mutants, 29 caught, 11 survived. None is equivalent. 7 sit inside a `DONE` behavior's listed text or in FR-016 wiring (findings 4–8). 4 are outside the listed text (findings 10–12).

The six logged mutant reds for A3–A6, U29 and U32 were not replayed individually this run. M18 independently corroborates A4.

## Traceability

| Criterion | Behaviors and tests | End to end |
| --- | --- | --- |
| US1 AS1 | A7 (`PENDING`), FR-002 | No executable test. Manual: `evidence/smoke.md` |
| US1 AS2 | A8 (`PENDING`) | No executable test. Manual: `evidence/smoke.md` |
| US1 AS3 | A9 (`PENDING`) | No executable test. Manual: `evidence/smoke.md` |
| US2 AS1 | A3 (`tdd-cli.test.mjs:226`), U5, U9, U24, U37 | Yes: spawned CLI over a real `git worktree` |
| US2 AS2 | A4 (`:243`), U14, U15, U23 | Yes: profile string run through a shell |
| US2 AS3 | A5 (`:252`), U6 | Yes |
| US2 AS4 | A6 (`:262`), U11, U13 | Yes |
| US3 AS1 | A10 (`PENDING`) | No executable test. Manual: fixture report (C1 and K4 `PROVEN` by S1) |
| US3 AS2 | A11 (`PENDING`, stale wording) | No executable test. Manual: fixture K2 `TEST_AFTER` by S2 |
| US3 AS3 | A12 (`PENDING`) | No executable test. Manual: this report, fork section inert |
| US4 AS1 | A13 (`tdd-docs.test.mjs:25`) | Yes: reads the real constitution |
| US4 AS2 | A14 (`tdd-docs.test.mjs:41`) | Yes, with weak assertions (finding 10) |
| US5 AS1 | A15 (`PENDING`) | No executable test. Manual: the 002 `BLOCKED` report and the fixture report |

Functional requirements:

- **FR-001** (A1) and **FR-009** (A2): document evidence only.
- **FR-002** (A7): manual.
- **FR-003**: no behavior. Checked here: `.specify/extensions.yml` registers `after_tasks`, `before_implement` (`optional: false`), `after_implement` and `after_converge`.
- **FR-004 to FR-007**: unit tests and end to end.
- **FR-008**: no behavior; it is a meta requirement.
- **FR-010**: U35 and U38, plus the fixture.
- **FR-011** and **FR-012**: A13, A14, U36.
- **FR-013**: A15.
- **FR-014**: U28–U34. Also seen on the real PR #16 summary.
- **FR-015**: no behavior. U25's trace is a mis-trace. Checked here: the diff has fork-only paths.
- **FR-016**: U21, U39 and U40 are unit tests only. The CLI wiring is unpinned (finding 4).
- **FR-017**: U24, end to end.

Untested acceptance criteria: 7 (above). Tests tracing to nothing: none.

## What was not audited

- **Mutation**: no tool. 40 hand mutants were sampled, not the full mutant space. `run-folder.mjs` (shared with fork-ci, unchanged by 003) was out of scope.
- **Logged mutant reds**: the six for A3–A6, U29 and U32 were not individually replayed this run. The pre-merge audit `426fd6a` replayed them.
- **Python and Deno end-to-end paths of the adapter**: hand-run only (`cycle-log.md:237`, `:530`), not in the suite. Python and Deno were not exercised here.
- **Coverage**: no coverage tool in the profile; branch coverage is unmeasured.
- **Prompt-only artifacts**: the playbook override, and the extension's commands and skills (`.specify/extensions/tdd/**`), were not graded as tests. Only their byte pins (U35, U38) were.
- **Calibration fixture and the 002 report**: their contents were vetted for what A10, A11 and A15 claim. They were not re-audited. Their own findings belong to those reports.
- **CI**: actionlint and the `fork-ci.yml` change were not run locally. CI's `self-test` passed on PR #16.
- **Performance, load and concurrency** of the adapter: no criterion, no test, not assessed.

## Remediation (not appended to tasks.md)

`tasks.md` was left unchanged at the caller's instruction. The feature is not done under Gate 1 until the blocking findings are cleared or are covered by the recorded bootstrap exemption. Findings 1–3 are what `plan.md` Complexity Tracking exempts; findings 4–8 are not covered by it.

Unless stated otherwise, each change is proven by applying the named mutant in a scratch copy and seeing `node --test .fork/ci/test/` go red, then seeing it green again after restoring.

1. **Finding 4 (HIGH).** Add a `tdd-cli.test.mjs` test, for example "FR-016 every adapter child sees blanked credentials".
   - Use a fixture test that asserts `process.env.OPENAI_API_KEY === ''`, `process.env.MY_API_KEY === ''` and `!('NODE_TEST_CONTEXT' in process.env)`.
   - Run it through `single`, `file` and `suite`, spawning the adapter with those variables set to non-empty fake values and `NODE_TEST_CONTEXT` present.
   - Proven by M24 (`bin/tdd.mjs:138`) and M25 (`:78`).
2. **Finding 5 (HIGH).**
   - Make the uid injectable, for example `privateDir(path, uid = process.getuid())`, and add a case where a dir owned by another uid is `false`. Proven by M13.
   - Extract `ensureVenv`'s reuse decision into a testable function, and test that a group-writable dir with a matching stamp is not reused. Proven by M21 (`bin/tdd.mjs:34`).
3. **Finding 6 (HIGH).** Add a U23 case whose test passes and whose process then exits non-zero (for example `process.exitCode = 1` after the test). Expect exit 1, `→ fail (exit 1)`. Proven by M19 (`bin/tdd.mjs:64`).
4. **Finding 7 (HIGH).** In U32 (`tdd-status.test.mjs:64`), add `dirs('fork/a')` → `[]` with spec branch `fork/abc` present. Proven by M34 (`lib/tdd-status.mjs:54`).
5. **Finding 8 (HIGH).** In U9 (`tdd-target.test.mjs:140`), add a Worktree that names a subdirectory of a real work tree, expecting `worktree not found: <path>`. Proven by M3 (`lib/tdd-target.mjs:61`).
6. **Finding 3 (HIGH).** Make A1 and A2 executable.
   - A1: a test that hashes every file under `.specify/extensions/tdd/{commands,templates}` and compares the hashes with the blob SHAs recorded from tag `v2.0.1`.
   - A2: a test that reads the profile's `single`, `file` and `suite` strings and runs them, including the zero-match case expecting exit 3. A4 already covers the `single` string.
   - Proven with `node .fork/ci/bin/tdd.mjs file .fork/ci/test/<new file>`. Otherwise, the owner records them as accepted document evidence.
7. **Finding 1 (HIGH), owner decision.** Either automate the post-merge checks or record A7–A12 and A15 as manual-evidence rows with a stated reason.
   - Automation examples: a test that the 002 report's frontmatter has `verdict: BLOCKED`, and that the fixture report classes C1 and K4 `PROVEN` and K2 `TEST_AFTER`.
   - Then update the test list states. Re-running `/speckit-tdd-verify` shows the result.
8. **Finding 2 (HIGH).** It can't be remediated retroactively. Keep the bootstrap exemption as recorded.
9. **Finding 10 (MED).** In `tdd-docs.test.mjs:52`, pin `` /never changes `fork-ci-verdict`/ ``. In `:54`, pin `/without a reason violates Principle IV/` or equivalent wording. Proven by M37 and M38 against `.fork/README.md`.
10. **Finding 11 (MED).** Create the U29 fixture specs with names whose creation order differs from sorted order, and make the order assertion explicit, or drop "sorted" from the test name. Proven by M40 on a filesystem that returns `readdir` unsorted, or by stubbing the scan order.
11. **Finding 12 (MED).** Add a U19 fixture whose test script is generic (`npm run t`) but which has `vitest` in `devDependencies`. Proven by M36 (`lib/tdd-commands.mjs:81`).
12. **Finding 9 (MED).** Route the hand-rolled git calls through `helpers/git-fixture.mjs` `git()`/`makeRepo()`, or set `HOME` in `GIT_ENV` (`tdd-target.test.mjs:89`, `tdd-cli.test.mjs:135`). Reuse `writeFiles`/`materialize` for the `{rel: content}` writers. Proven by the suite staying green with `HOME` pointed at an empty dir.
13. **Finding 13 (MED).**
    - Reword A11 (`test-list.md:32`) and its Behavior Map row (`tasks.md:87`) to "fixture K2 without base-red classifies `TEST_AFTER`; C3 is the S4 control".
    - Bump `updated_at`.
    - Re-trace U25 off FR-015.
    - Add behaviors, or explicit out-of-scope notes, for FR-003, FR-008 and FR-015.
14. **Findings 14–19 (LOW, MED).**
    - Tick T029.
    - Split eager tests per behavior, or label their assertions.
    - Collapse the redundant summary-line pins into U27.
    - Move `verdict.test.mjs:125-130` imports to the top of the file.
    - Move the `section`, `plan` and `throwsTarget` helpers into `.fork/ci/test/helpers/`.
