---
feature: 008-stage-pr-521-auto-capture-hermes
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1, staged-PR rules S1–S4
verified_at: 07375aa # fork main (spec folder); tests audited on stage branch at 6bcefef
behaviors: 51
proven: 0
likely: 0
test_after: 51 # rule S2, add-only PR; owner waiver 2026-11-27 (plan Complexity Tracking)
no_test: 0
high_smells: 2 # findings 1 and 2 (3 locations)
criteria_total: 11 # automatable acceptance scenarios US2.1–8, US3.1–3; 11 process criteria are checked by tasks T025–T036
criteria_covered: 11
mutation_score: null # no mutation tool; deliberate mutants: audit sample 13/14 caught, loop detection checks 51/51
mutants_survived: 1 # inside DONE behavior U16 (finding 3)
suite: 51 passed, 0 failed, 0 skipped, 4.1s (env -i, Node 26.13.0, run 2x by the auditor, 3x by the smell reviewer)
---

# TDD Verification: Stage upstream PR #521 (auto-capture Hermes adapter)

**Verdict: FAIL.** All 51 behaviors are `TEST_AFTER`. The PR adds the whole folder, so no base-red could exist; the owner waived this before the loop. Leaving the waiver aside, three findings still block a pass: two assertions that cannot fail (A8/U22 "nothing is sent", U38 `captured_at`), and one deliberate mutant that survives at the truncation boundary (U16).

Within the waiver the suite is otherwise strong:

- Every test drives the real script as a child process, against a real SQLite store and a loopback stand-in.
- No developer environment reaches the tests.
- The suite runs in about 4 s.
- 13 of the 14 mutants the auditor designed independently were caught, most of them at boundaries.

The three findings are small test edits; remediation tasks T041 to T043 cover them.

**Independence.** The session that wrote these tests ran this audit, so it is not independent. To compensate:

- It re-read every file cold.
- A fresh-context subagent ran the smell pass, and every line it cited was opened and checked before inclusion.
- The mutant sample was designed apart from the loop's own detection mutants.

## Test-first evidence

The lane is `staged upstream PR #521` (plan.md), so rules S1 to S4 apply:

- **S4 does not apply.** The PR base `238df6c` (merge-base with `upstream/main`) has no `skills/auto-capture-hermes/` folder, so the PR changed the code behind every behavior.
- **S1 is unreachable.** Every cycle records `red: none possible (add-only PR …)`. A red run at the base could only say "file not found", which S3 rejects as invalid.
- **S2 therefore applies to all 51 behaviors.** No cycle claims an S1 red, so there is no false claim and no S3 finding.

| Behavior | Class | Evidence |
| --- | --- | --- |
| A1–A8, U1–U24, U35–U39 (37) | TEST_AFTER (S2) | Cycles 1–37: no base-red (add-only), head green; a detection mutant is recorded per cycle, which is not S1 credit. Test commit `5e5853b` lands after the author's `b9cbd68`. |
| A9–A11, U25–U34, U40 (14) | TEST_AFTER (S2) | Cycles 38–51: same pattern; test commit `6bcefef`. |

**History versus cycle log.** They agree:

- The stage branch is `f1f4536` → `5cf07c0` → `b9cbd68` (author), then `6e3ad8d` (test support), `5e5853b` (37 tests) and `6bcefef` (14 tests).
- The test commits touch only `capture-hermes-session.test.mjs` and `test-support/*`.
- `git diff --quiet b9cbd68 HEAD` holds for the author's four files, and nothing outside the folder changed.
- The log says tests were committed per story rather than per cycle; the history matches that.

**Existing tests.** There were none in the folder before this feature, so none could have been weakened, skipped, renamed or filtered. No config or threshold changed.

**`tasks.md` versus the test list.** All 51 behavior ids are `DONE`. Every ticked task carrying a behavior marker maps to a `DONE` behavior, and no open task carries a marker.

**Detection evidence (loop).** The loop recorded 51 detection mutants, one per test, all caught. In `evidence/detection/results-us2.json` and `results-us3.json` every entry has `redExit=1`, `restoredClean=true` and `greenExit=0`. These mutants were designed by the loop session for each test, so they show that each test can fail. They are not an independent strength measure; that is the auditor's sample below.

## Findings

Ordered by severity. File paths are relative to `skills/auto-capture-hermes/` on the stage branch (`6bcefef`).

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **Vacuous assertion (cannot fail).** A8 and U22 assert `stub.requests.length === 0`, but the child is never given the stand-in's address: A8 passes no env, U22 passes only `MCP_ACCESS_KEY`, and no `.env.local` is written. "Nothing is sent" holds by construction, whatever the adapter does. The tests still prove exit 0 and the `error:missing_env` log line, so FR-014's logging half is covered and the "sends nothing" half is not. U21 is sound because it does pass `stub.url`. **Should assert:** `queueEntries(sandbox)` deep-equals `[]` (an attempted send to a missing address would fail and be queued), and `dispositions(sandbox)` deep-equals `["error:missing_env"]` exactly. | `capture-hermes-session.test.mjs:195,198` (A8); `:368,370` (U22) |
| 2 | HIGH | **Vacuous assertion (truthiness).** U38 asserts `assert.ok(state.captured_at)`, so any truthy value passes. data-model and contracts define it as the capture timestamp. U39 pins the behavior that depends on the field, which limits the impact. **Should assert:** an ISO-8601 string whose `Date.parse` falls between a time taken before the run and a time taken after it. | `capture-hermes-session.test.mjs:420` |
| 3 | HIGH | **Surviving mutant inside a DONE behavior.** Mutant M7 changes `text.length <= budget` to `<` in `truncateMiddle`. With it, a body of exactly the budget is truncated (marker inserted) when it fits and should be sent whole. No test failed. U16 ("a transcript within the limit is sent whole") uses about 8.3k characters against a 20,000 limit, nowhere near the boundary, and U17 and A6 test only well over the limit. The real-world window is one character, but the rubric's severity is fixed, and the test list's own quality bar asks for both sides of every boundary. **Should assert:** a new boundary behavior (FR-011). With `OB_CAPTURE_MAX_CHARS` chosen so the body length equals the budget exactly, the text is sent whole with no marker; one character over, it carries the marker. | Mutant M7 below; `capture-hermes-session.mjs:475`; test `capture-hermes-session.test.mjs:322–327` |
| 4 | MED | **Permanent-failure checks don't pin the status.** A11 and U29 check only `d.endsWith(":permanent")`, so a misclassified status (for example the wrong code logged) still passes. **Should assert:** the disposition starts with `error:HTTP 401` (A11) or `error:HTTP 400` (U29) and ends with `:permanent`. | `:481` (A11), `:515` (U29) |
| 5 | MED | **Half-vacuous ordering check in U17.** `marker > text.indexOf("FIRST-TURN") && marker < text.indexOf("LAST-TURN")` passes if FIRST-TURN is missing (`-1`). It sits in one unlabelled `assert.ok`, so a failure doesn't say which side broke. A6 covers the dropped first turn, which limits this to MED. **Should assert:** both indexes are `>= 0`, as separate labelled assertions. | `:333` |
| 6 | MED | **Mystery guest / magic value `"job-1"`.** It comes from `startIngestStub`'s hidden default response, and nothing in the tests shows that. **Should:** pass the response explicitly with a named `JOB_ID` constant. | `:421` (U38), `:457` (A9), `:570` (U40); `test-support/run-adapter.mjs:141` |
| 7 | MED | **Magic values carry the boundary.** `longConversation(4, 1000)` against limits `"3000"` and `"20000"`. Which side of the limit each test lands on depends on unstated arithmetic, so a fixture change could silently flip U16 or A6. **Should:** name and derive the limits from the fixture size. | `:178–179` (A6), `:323–324` (U16), `:330–331` (U17) |
| 8 | MED | **Implementation coupled: exact marker wording.** `TRUNCATION_MARKER` copies the script's sentence, but data-model only says "a marker". A wording change fails U17 with behavior intact, and U16's absence check would pass regardless; its turn count still protects it. **Should:** have U17 assert structure, or a looser pattern. | `:103`, used at `:325`, `:332` |
| 9 | MED | **Non-deterministic: real clock and detached workers (accepted by design, R8).** U40 uses a real 1000 ms debounce and polls rather than sleeps, so it is not a sleepy test. It passed 5/5 in the loop, plus 5 auditor and smell-reviewer runs. If it fails partway, untracked detached workers can outlive the sandbox. **Should:** state the relation between the debounce and the `waitFor` timeout in the test. | `:562–573`; `test-support/run-adapter.mjs:179–187` |
| 10 | MED | **Test list out of step with the test.** The U40 row (and research R8) say `OB_CAPTURE_DEBOUNCE_MS=300`, but the test uses `1000`. The cycle-log note explains why; the list wasn't updated. | `tdd/test-list.md` U40 row; `capture-hermes-session.test.mjs:565` |
| 11 | LOW | **Thin failure output.** About 15 tests use `assert.ok(dispositions(sandbox).includes("<exact>"))`. These are exact-element checks, not vacuous, but a failure prints the expression rather than the log, and extra error lines go unnoticed. Use `deepEqual` on the full dispositions where a run has a single outcome. | e.g. `:166`, `:174`, `:197`, `:361`, `:369`, `:498` |
| 12 | LOW | **The suite can skip as a whole and still look green.** Without `node:sqlite` and the `sqlite3` CLI, all 51 tests skip, and fork-ci would see skips rather than a failure. 0 were skipped on the target runtime (Node 26). | `:38` |

**Smells checked and not found:** assertion free, tautological, re-implemented expectation, doubled subject, over-mocked collaborators (only HTTP is a stand-in; SQLite and the filesystem are real), self-approving snapshot, conditional logic (the loops at `:310`, `:501` and `:553` iterate fixed literals and always assert), empty or always-skipped, assertion roulette (A9's 6 asserts are exact equalities with diffs), eager test, sleepy test, redundant test (the acceptance/unit pairs are double-loop by design), foreign style (matches the `recipes/atomizer` node-plain exemplar), bypassed test utility (the profile's `.fork/ci/test` helpers build fork-tooling fixtures and can't be imported from an upstream `skills/` folder), framework under test, duplicated setup, unclear name.

**No secrets.** `test-key-not-real` is a dummy value, and the only host is `127.0.0.1`. No repository content tried to instruct the auditor.

**Suite properties:**

- **Isolated:** each test gets its own temp sandbox and a constructed child env.
- **Fast:** about 4.1 s, with U40 about 1.2 s.
- **Deterministic:** yes, except U40's real clock and a negligible port-reuse race in U30's `closedPortUrl`.
- **Refactor-insensitive:** black-box through the CLI against contract strings, except the marker wording (finding 8) and `readState` copying the script's file-name rule.

## Mutation results

There is no mutation tool (profile `mutation: null`), so this section uses deliberate mutants. The auditor designed **14 mutants** independently of the loop's 51 and aimed them at boundaries and acceptance-critical rules.

Each mutant was applied alone to `capture-hermes-session.mjs`. The **whole test file** ran under `env -i`, then the script was restored and confirmed byte-identical (`git diff --quiet`: true for all 14). After the last restore the suite was green again: 51 pass, 0 fail. The harness and mutant set are in the session scratchpad. They are not committed, since the auditor may write only this file and `tasks.md`.

| Mutant | Change (in `capture-hermes-session.mjs`) | Behavior | Survived | Judgment |
| --- | --- | --- | --- | --- |
| M1 | `status >= 500` → `> 500` | U28 | No | Caught by U28; the 500 boundary is pinned |
| M2 | `status === 429` → `=== 428` | U27 | No | Caught by U27 |
| M3 | `attempt_count >= RETRY_MAX_ATTEMPTS` → `>` | U32 | No | Caught by U32; the fifth-attempt boundary is pinned (U31 pins the fourth) |
| M4 | `RETRY_BATCH_SIZE = 3` → `2` | U34 | No | Caught by U34 |
| M5 | `userTurns < MIN_USER_TURNS` → `<=` | U7 | No | Caught by U7 and 36 others (every 3-turn fixture) |
| M6 | closing-tag escape removed | U15 | No | Caught by U15 |
| **M7** | `text.length <= budget` → `<` | **U16** | **Yes** | **Not equivalent:** a body of exactly the budget gets truncated. Finding 3 (HIGH) |
| M8 | head share `0.6` → `1` (tail dropped) | A6, U17 | No | Caught by A6 and U17 |
| M9 | `/^Subagent:/` unanchored | U12 | No | Caught by U12 |
| M10 | `/^\[Cronjob\b/` unanchored | U6 | No | Caught by U6 |
| M11 | import-key hash 8 → 7 hex | U18 | No | Caught by U18 |
| M12 | wrapper allowance `- 40` → `- 0` | A6 | No | Caught by A6; the over-limit text exceeds the limit |
| M13 | typed-parts detection skips `[{` arrays | U5 | No | Caught by U5 |
| M14 | `"unknown"` ref fallback → `"none"` | U26 | No | Caught by U26 |

Audit sample: **13 of 14 caught (93%)**, scoped to the one source file the feature covers. Not sampled: `--latest` lookup SQL, `.env.local` parsing edge cases, hook event filtering, lock and state-file writes, the `sqlite3` CLI fallback (out of scope), and log formatting. Loop detection checks: 51 of 51, one targeted mutant per test.

**Redundant guards in the author's code.** There are two empty-content filters and two "already captured" checks. With either copy removed the behavior still holds, so single-site mutants there are equivalent. The loop needed two-site mutants for U1 and U39. This is a note for the author, not a defect.

## Traceability

| Criterion | Tests | End to end |
| --- | --- | --- |
| US2.1 (FR-013 dry-run, header, key) | A1, U14, U20 | Yes |
| US2.2 (FR-008 turn filtering) | A2, U1–U5 | Yes |
| US2.3 (FR-009 cron) | A3, U6, U8 | Yes |
| US2.4 (FR-010 too short) | A4, U7–U9 | Yes |
| US2.5 (FR-010 subagent) | A5, U10–U13 | Yes |
| US2.6 (FR-011 size limit) | A6, U16, U17 | Yes; exact boundary unpinned (finding 3) |
| US2.7 (FR-012 stable key) | A7, U18, U19 | Yes |
| US2.8 (FR-014 missing config) | A8, U21–U23, U24 | Yes for logging and exit 0; "sends nothing" vacuous in A8/U22 (finding 1), sound in U21 |
| US3.1 (FR-015 success) | A9, U25, U26 | Yes |
| US3.2 (FR-015 temporary failure) | A10, U27, U28, U30–U32, U34 | Yes |
| US3.3 (FR-015 permanent failure) | A11, U29, U33 | Yes; status not pinned (finding 4) |
| INV-1 (wrapper escape) | U15 | Yes |
| INV-2 (always exit 0 / `{}`) | U24, U30, U35, U37 | Yes |
| INV-3 (capture once, end events only) | U36, U38–U40 | Yes |

Every `traces` value resolves to an existing, running test: all 51 names were matched in the TAP output, 0 skipped.

**Untested criteria:** none among the automatable ones.

**Process criteria checked by tasks, not tests:**

- Fork-PR checks: US1.1–3 and SC-001/002/005, via T025, T031, T032 and T034.
- Ledger and upstream comment: US4.1–2 and SC-006, via T035 and T036.

Of these, T025–T028 are done and the rest are open.

**SC-003's clause "the suite fails at the PR base"** can't be met as written. There is no folder at the base, which is the waived TEST_AFTER case.

**SC-004's "0 requests leaving the machine"** holds by construction: a constructed env, loopback URLs only, and the adapter given only the stand-in's address. No network guard asserts it.

**Tests tracing to nothing:** none.

## What was not audited

- **Ordering of test and code.** It cannot be established for an add-only PR. Every behavior is TEST_AFTER under the owner's waiver; this report records the waiver and does not convert it into a pass.
- **Mutation coverage.** A sample of 14 mutants in one file, not a tool run. The unsampled areas are listed under Mutation results.
- **Line and branch coverage.** Not measured (profile `coverage: null`).
- **Wall-clock defaults** (120 s debounce, 5 s finalize delay, hard timeouts) and the `sqlite3` CLI fallback. Both are out of scope in the test list and untested.
- **The author's docs** (`README.md`, `SKILL.md`): gate-checked by T028, not graded here.
- **Behavior against a real Hermes install or a real Open Brain endpoint.** Optional, T038.
- **CI behavior.** Not yet run on GitHub: T031 depends on the owner's push in T030. The local fork-ci strict `pass` and gate 15/15 come from the implement phase (`evidence/run-folder-final.json`, `evidence/gate-review-local.txt`), not from this audit.
- **Feature resolution.** `.specify/feature.json` points at 007, which belongs to the other session working in this checkout. This audit was run as the after-implement hook for 008 and resolved `FEATURE_DIR` directly to `specs/008-stage-pr-521-auto-capture-hermes`, leaving `feature.json` untouched.
