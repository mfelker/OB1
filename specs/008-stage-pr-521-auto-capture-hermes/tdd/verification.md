---
feature: 008-stage-pr-521-auto-capture-hermes
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1, staged-PR rules S1–S4
verified_at: 4e490c2 # fork main (spec folder); tests audited on stage branch at 2c22e41
behaviors: 53
proven: 0
likely: 0
test_after: 53 # rule S2, add-only PR; owner waiver 2026-11-27 (plan Complexity Tracking)
no_test: 0
high_smells: 0
criteria_total: 11 # automatable acceptance scenarios US2.1–8, US3.1–3; 11 process criteria are checked by tasks T025–T036
criteria_covered: 11
mutation_score: null # no mutation tool; deliberate mutants: 27/34 caught (scope: capture-hermes-session.mjs)
mutants_survived: 7 # Q4 equivalent on APFS (unmeasured on Linux); Q5, R1, R2 untested contract fields; N6, Q3, R3 unspecified or out of scope
suite: 53 passed, 0 failed, 0 skipped, 4.5–4.6s (env -i, Node 26.13.0)
---

# TDD Verification: Stage upstream PR #521 (auto-capture Hermes adapter), third audit

**Verdict: FAIL.** The verdict rests on one reason only: all 53 behaviors are `TEST_AFTER`, because the PR adds the whole folder and no base-red can exist. The owner waived this before the loop (plan Complexity Tracking). By the rubric, `TEST_AFTER` is a `FAIL` condition, and this report does not convert the waiver into a pass.

**No HIGH finding remains.** Every HIGH from the first and second audits is cleared, and the independent smell pass found none. What remains are MED gaps:

- two payload fields the data model defines but no test pins (`source_type`, `auto_execute`);
- the starting `attempt_count` of a new queue entry;
- queue ordering that this machine's filesystem cannot exercise;
- U40's accepted real-clock dependency.

**Independence.** The session that wrote and remediated these tests also ran this audit, so it is not independent. A fresh-context subagent ran the smell pass without seeing the earlier reports, and every line it cited was opened and checked. It raised R1, R2 and R3 by reasoning; the auditor then ran them as mutants (all three survive).

**Process note.** The auditor's mutant run overlapped the subagent's read-only suite runs. The subagent saw mutant Q4 in the file at 09:02. It discarded that probe and re-ran on the clean file. The subagent never modified the subject, so the mutant results stand. Future audits should run mutants only after the smell pass finishes.

## Test-first evidence

The lane is `staged upstream PR #521`, so rules S1 to S4 apply:

- **S4 does not apply.** The PR base `238df6c` has no `skills/auto-capture-hermes/` folder.
- **S1 is unreachable.** No cycle claims an S1 red, so there is no S3 finding.

| Behavior | Class | Evidence |
| --- | --- | --- |
| A1–A11, U1–U40 (51) | TEST_AFTER (S2) | Cycles 1–51 (`5e5853b`, `6bcefef`); later corrections in cycles 52–60 (`b13ca53`, `7cd5290`, `6cfc4ac`, `1e16541`, `2c22e41`). Every test commit lands after the author's `b9cbd68`. |
| U41 | TEST_AFTER (S2) | Cycle 54, `dfb0d57`; detection mutant M7 recorded |
| U42 | TEST_AFTER (S2) | Cycle 56, `1652c3a`; detection mutants N7 and N7b recorded |

**History versus cycle log.** They agree:

- The stage branch is the author's 3 commits, then 9 fork commits that touch only `capture-hermes-session.test.mjs` and `test-support/*`.
- The author's 4 files are byte-identical to `b9cbd68`, and nothing outside the folder changed (also re-checked by T025 at `4e490c2`).
- Cycles 52–61 name the same commits as the history.

**Changes to existing tests since the second audit** (`dfb0d57..2c22e41`, every removed line reviewed):

| Test | Before | After | Judgment |
| --- | --- | --- | --- |
| U13 (`:317–328`) | one top-level session; header `includes("Session: session-1")` | older and newer top-level sessions plus a newer subagent; exact `Session: session-3` | Strengthened: mutant N5 is now caught |
| A11, U29 (`:536`, `:572`) | `some(d => d.endsWith(":permanent"))` | exactly one line matching `/^error:HTTP 401:.*:permanent$/` (400 for U29) | Strengthened: mutant P1 is now caught |
| U17 (`:355–365`) | one combined `assert.ok` | four labelled assertions | Strengthened: mutant P2 is now caught |
| U16 (`:347–353`) | marker absent, and 8 turns | exact contents of all 8 turns, and marker absent | Strengthened |
| A9 (`:497–510`) | `includes("captured:job-1")` | the last log line equals `captured:${JOB_ID}` | Strengthened |
| `TRUNCATION_MARKER` (`:112`) | the exact sentence `"[... transcript truncated to fit capture size limit ...]"` | `/truncated/i` | **A loosened predicate.** It is now insensitive to the marker's wording, which no contract specifies (data-model: "a marker"). No behavior-level detection was lost: Q1 (marker text removed) is caught by U17 and U41, and M7, M8, M12 and P2 are still caught. Recorded as a deliberate decoupling. The owner may overrule. |
| A6, U17 limit | `"3000"` | `LIMIT_OVER_LONG` (= 4000, derived from the fixture) | Still well over the 8305-character capture; M8 and M12 still caught |
| U40 (`:631–647`) | literal debounce, default `waitFor` | named `DEBOUNCE_MS`, timeout `DEBOUNCE_MS * 5` (the same 5000 ms) | Structural only |

No test was skipped, renamed or filtered, and no config or threshold changed.

**`tasks.md` versus the test list.** All 53 behavior ids are `DONE`. No ticked task carries a marker for a behavior that isn't `DONE`, and no open task carries a marker.

## Findings

Ordered by severity. Paths are relative to `skills/auto-capture-hermes/` on the stage branch at `2c22e41`.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | MED | **Two contract fields of the payload are untested.** `source_type: "hermes_ambient"` and `auto_execute: true` (data-model § Capture payload) are asserted nowhere. A9 compares the sent body with the dry-run body, so both would be wrong together. Mutants R1 (`source_type` changed) and R2 (`auto_execute: false`) both survive. Not inside a `DONE` claim: US2.1 and A1 name only the turns, label and key. **Should assert:** A1 pins both fields. | `capture-hermes-session.mjs:228–229`; A1 `:139–149` |
| 2 | MED | **The starting `attempt_count` of a new queue entry is untested.** The contract moves an entry to `dead/` at 5 attempts. If a new entry starts at 0 (mutant Q5), a payload gets 6 attempts, and nothing fails: U31 and U32 seed their own counts, and A10, U27, U28 and U30 don't read the field. **Should assert:** after a 503 (U27 or A10), the queued entry has `attempt_count === 1`. | `capture-hermes-session.mjs:556`; contracts/ingest-request.md:18; data-model.md:32 |
| 3 | MED | **Queue ordering is unmeasured where it matters.** Mutant Q4 (no `.sort()` before taking the batch of 3) survives U34. On this machine (APFS), `readdirSync` returned `1-a … 4-d` in name order whichever order the files were created in, so the mutant has no visible effect here; it is equivalent on this platform. Fork CI runs on Linux, where directory order is not name order. Judged MED rather than HIGH because no test can observe it on APFS, but it is **unmeasured, not passing**. **Should:** run U34 with mutant Q4 on Linux (CI or a throwaway Linux container), ideally with more entries so directory order and name order are certain to differ. | `capture-hermes-session.mjs:522`; U34 `:608–615` |
| 4 | MED | **U40 depends on the real clock** (accepted by design, research R8). Its margin is now stated (`DEBOUNCE_MS = 1000`; two Node start-ups take about 150 ms). If it ever fails it fails closed (the `waitFor` timeout), but detached workers can outlive `afterEach`. No task: accepted and documented. | `:631–647` |
| 5 | LOW | **A transcript that fits the limit exactly is trimmed.** The budget reserves 40 characters for a 39-character wrapper. data-model's "total ≤ `OB_CAPTURE_MAX_CHARS`" holds, so this is not a defect against any requirement. U41 deliberately tests ±1 and says nothing about equality, so mutant R3 (`- 40` → `- 39`) survives. Record it for the #521 comment (T036) as a remark. The subagent recommended a failing `todo` test for exact fit; the auditor disagrees, because the spec does not require exact fit to be sent whole. | `capture-hermes-session.mjs:468`; cycle-log remediation notes |
| 6 | LOW | **Config precedence is undocumented and untested.** `.env.local` values override environment variables (`env.X \|\| process.env.X`). Mutant Q3 (environment wins) survives. SKILL.md says only ".env.local … (or set them in the environment)". Either list it as out of scope or pin it with a test. | `capture-hermes-session.mjs:242–243` |
| 7 | LOW | **U20 asserts only an absence.** `stateFiles == []` kills Q2 (the `DRY_RUN` guard removed), so it isn't vacuous. But it would also pass if the run stopped early for an unrelated reason. A positive control, such as a payload printed or a `dry_run:` line logged, would make it specific. | `:397–401` |
| 8 | LOW | **Thin failure output.** About 15 `assert.ok(dispositions(sandbox).includes(…))` or `headerOf(…).includes(…)` checks print the expression, not the actual log. These are exact-element checks, not vacuous. | e.g. A3 `:176`, A4 `:184`, U7 `:279`, U35 `:441`, U39 `:481` |

**Smells checked and not found:** assertion free, tautological, re-implemented expectation (U41 measures the subject's output; A9 compares to the dry run by definition of US3.1), doubled subject, over-mocked collaborators, vacuous assertion (every "0 requests" check gives the child the stub's address; A8 and U22 assert the exact log plus an empty queue), self-approving snapshot, conditional logic, empty or always-skipped, implementation coupled (only contract strings and paths), assertion roulette, eager test, magic values (limits derived; U13 timestamps explained), mystery guest (`JOB_ID` now explicit), sleepy test, redundant test, foreign style, bypassed test utility (the `.fork/ci` helpers don't apply to an upstream folder), framework under test, duplicated setup, unclear name.

**Claims versus fixtures.** Every id's fixture now distinguishes its behavior:

- U13: two top-level sessions.
- U31 and U32: either side of the retry cap.
- U7 and U8: either side of the threshold.
- U33: starts at attempt 1, so only the permanent path can dead-letter it.

**No secrets.** `test-key-not-real` is a placeholder, and the only host is `127.0.0.1`. No repository content tried to instruct the auditor.

**Suite properties:**

- **Isolated:** fresh sandbox, constructed env and own stub per test.
- **Fast:** 4.5–4.6 s; U40 is about 1.2 s, every other test 70–120 ms.
- **Deterministic:** yes, except U40 and a negligible port-reuse window in U30.
- **Refactor-insensitive:** black-box through the CLI against the contracts.

## Mutation results

There is no mutation tool, so this section uses deliberate mutants: **34 in total**.

- 26 from earlier rounds, re-run here.
- Q1–Q5: new.
- R1–R3: raised by the subagent's reasoning and run by the auditor.

Each mutant was applied alone to `capture-hermes-session.mjs`. The whole test file ran under `env -i`, then the script was restored and confirmed byte-identical (`git diff --quiet`: true for all 34). The suite was green again afterwards: 53 pass, 0 fail.

| Mutant | Change | Behavior | Survived | Judgment |
| --- | --- | --- | --- | --- |
| M1–M14 | boundaries and rules (retry status, dead-letter cap, batch size, threshold, escape, truncation, regex anchors, key length, wrapper, typed parts, ref fallback) | U5–U34, A6 | No | All caught; M7 by U41 |
| N1–N5, N7–N9, N7b | config fall-through, `captured_at`, finalize event, `--latest` filter and order, corrupt queue entry (2 forms), permanent dead-letter, project basename | A8, U13, U14, U22, U33, U38, U42 | No | All caught |
| P1, P2 | wrong logged status; head slice dropped | A11, U29, U17 | No | Caught |
| Q1 | marker text removed | U17, U41 | No | Caught: the looser marker pattern lost no detection |
| Q2 | dry run writes session state | U20 | No | Caught |
| N6 | `.env.local` quote stripping removed | none (out of scope) | Yes | Out of scope by T051 decision |
| **Q3** | environment overrides `.env.local` | none | Yes | Unspecified precedence. Finding 6 (LOW) |
| **Q4** | queue not sorted before the batch | U34 | Yes | Equivalent on APFS (readdir is already name-ordered); unmeasured on Linux. Finding 3 (MED) |
| **Q5** | new queue entry starts at `attempt_count: 0` | none (contract) | Yes | Untested contract field. Finding 2 (MED) |
| **R1** | `source_type` changed | none (data-model) | Yes | Untested contract field. Finding 1 (MED) |
| **R2** | `auto_execute: false` | none (data-model) | Yes | Untested contract field. Finding 1 (MED) |
| **R3** | wrapper allowance `- 40` → `- 39` | none (exact fit unspecified) | Yes | Changes only the exact-fit case, which the spec doesn't specify. Finding 5 (LOW) |

Sample: **27 of 34 caught**. None of the 7 survivors lies inside a `DONE` behavior's stated claim, except Q4 in U34, which is equivalent on the audit platform (finding 3).

**Not sampled:** lock and state-file write races, `fetchWithTimeout` timeouts, log line formatting, `--session` prefix lookup and the `sqlite3` fallback (both out of scope), and the deferred-worker spawn arguments.

## Traceability

| Criterion | Tests | End to end |
| --- | --- | --- |
| US2.1 (FR-013) | A1, U14, U20 | Yes; `source_type` and `auto_execute` (data-model only) unpinned (finding 1) |
| US2.2 (FR-008) | A2, U1–U5 | Yes |
| US2.3 (FR-009) | A3, U6, U8 | Yes |
| US2.4 (FR-010) | A4, U7–U9 | Yes |
| US2.5 (FR-010) | A5, U10–U13 | Yes |
| US2.6 (FR-011) | A6, U16, U17, U41 | Yes |
| US2.7 (FR-012) | A7, U18, U19 | Yes |
| US2.8 (FR-014) | A8, U21–U24 | Yes |
| US3.1 (FR-015) | A9, U25, U26 | Yes |
| US3.2 (FR-015) | A10, U27, U28, U30–U32, U34, U42 | Yes; starting attempt count (finding 2) and Linux ordering (finding 3) open |
| US3.3 (FR-015) | A11, U29, U33 | Yes |
| INV-1 / INV-2 / INV-3 | U15 / U24, U30, U35, U37 / U36, U38–U40 | Yes |

All 53 `test` values resolve to tests that ran (53 `ok`, 0 skipped).

**Untested criteria:** none among the automatable ones. The process criteria (US1, US4, SC-001/002/005/006) are checked by tasks T025–T036; T025–T028 were re-run at `4e490c2` and pass, and the rest are open.

**SC-003's "fails at the PR base"** can't be met, because there is no folder at the base; this is the waived case. **SC-004's "0 off-machine requests"** holds by construction.

**Tests tracing to nothing:** none.

## What was not audited

- **Ordering of test and code.** It cannot exist for an add-only PR. All 53 behaviors are TEST_AFTER under the owner's waiver; this report records the waiver and does not convert it into a pass.
- **Behavior on Linux.** The suite and every mutant ran on macOS (APFS) only. Q4 needs a Linux run, and fork CI (T031) will be the first.
- **Mutation coverage.** A sample of 34 mutants in one file, not a tool run. Unsampled areas are listed above.
- **Line and branch coverage.** Not measured (profile `coverage: null`).
- **Wall-clock defaults** (120 s debounce, 5 s finalize) and the `sqlite3` CLI fallback: out of scope per the test list.
- **The author's docs**, and behavior against real Hermes or a real Open Brain endpoint (T038).
- **CI on GitHub** (T031): needs the owner's push (T030).
- **Feature resolution.** `.specify/feature.json` points at 007, which belongs to the other session in this checkout. This audit resolved `FEATURE_DIR` directly to `specs/008-stage-pr-521-auto-capture-hermes` and left `feature.json` untouched.
