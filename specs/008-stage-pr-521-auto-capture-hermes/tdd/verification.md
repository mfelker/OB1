---
feature: 008-stage-pr-521-auto-capture-hermes
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1, staged-PR rules S1–S4
verified_at: 1da0b44 # fork main (spec folder); tests audited on stage branch at dfb0d57
behaviors: 52
proven: 0
likely: 0
test_after: 52 # rule S2, add-only PR; owner waiver 2026-11-27 (plan Complexity Tracking)
no_test: 0
high_smells: 1 # finding 1 (U13), also a surviving mutant
criteria_total: 11 # automatable acceptance scenarios US2.1–8, US3.1–3; 11 process criteria are checked by tasks T025–T036
criteria_covered: 11
mutation_score: null # no mutation tool; deliberate mutants: 20/23 caught (scope: capture-hermes-session.mjs)
mutants_survived: 3 # N5 inside DONE U13 (HIGH); N6, N7 on behaviors not on the list
suite: 52 passed, 0 failed, 0 skipped, 4.4–4.6s (env -i, Node 26.13.0)
---

# TDD Verification: Stage upstream PR #521 (auto-capture Hermes adapter), second audit

**Verdict: FAIL.** All 52 behaviors are `TEST_AFTER`. The PR adds the whole folder, so no base-red could exist; the owner waived this before the loop. Leaving the waiver aside, one HIGH finding still blocks a pass: U13 claims `--latest` picks the *newest* top-level session, but its fixture has only one top-level session, so "pick the oldest" passes too.

The three HIGH findings from the first audit (at `4ad3e3f`) are cleared, by stage commits `b13ca53` and `dfb0d57`:

| Finding | Shown by |
| --- | --- |
| A8 and U22 "nothing is sent" could not fail | Fall-through mutant N1 is now caught by A8, U21 and U22 |
| U38 accepted any truthy `captured_at` | N2 is now caught |
| The size-limit boundary was unpinned | M7 is now caught by the new U41 |

**Independence.** The session that wrote and remediated these tests also ran this audit, so it is not independent. To compensate:

- A fresh-context subagent ran the smell pass without seeing the previous report. It independently raised the U13 gap, which matches mutant N5.
- Every line it cited was opened and checked.
- Every file was re-read cold.

## Test-first evidence

The lane is `staged upstream PR #521`, so rules S1 to S4 apply:

- **S4 does not apply.** The PR base `238df6c` has no `skills/auto-capture-hermes/` folder.
- **S1 is unreachable.** A red run at the base could only say "file not found", which S3 rejects. No cycle claims an S1 red, so there is no S3 finding.

| Behavior | Class | Evidence |
| --- | --- | --- |
| A1–A8, U1–U24, U35–U39 (37) | TEST_AFTER (S2) | Cycles 1–37, plus 52 (A8, U22) and 53 (U38); test commits `5e5853b` and `b13ca53` land after the author's `b9cbd68` |
| A9–A11, U25–U34, U40 (14) | TEST_AFTER (S2) | Cycles 38–51; test commit `6bcefef` |
| U41 (1) | TEST_AFTER (S2) | Cycle 54; test commit `dfb0d57`; detection mutant M7 recorded |

**History versus cycle log.** They agree:

- The stage branch is `f1f4536` → `5cf07c0` → `b9cbd68` (author), then `6e3ad8d`, `5e5853b`, `6bcefef`, `b13ca53` and `dfb0d57`, all touching only `capture-hermes-session.test.mjs` and `test-support/*`.
- The author's four files are unchanged since `b9cbd68` (`git diff --quiet`), and nothing outside the folder changed.
- Cycles 52–54 name `b13ca53` and `dfb0d57`, which match the history.

**Changes to tests that already existed** (`6bcefef..dfb0d57`), each with its before and after:

| Test | Before | After | Judgment |
| --- | --- | --- | --- |
| A8 (`:192–201`) | started a stand-in; `assert.ok(dispositions.includes("error:missing_env"))`; `assert.equal(stub.requests.length, 0)` | no stand-in; `deepEqual(dispositions, ["error:missing_env"])`; `deepEqual(queueEntries, [])` | **Not a weakening.** The removed check could not fail, because the child never had the address. Mutant N1 passed the old test and fails the new one (cycle 52, and N1 below). |
| U22 (`:382–388`) | same as A8 | same as A8 | Not a weakening (same evidence). |
| U38 (`:430–445`) | `assert.ok(state.captured_at)` | ISO-8601 `assert.match`, plus `Date.parse` between before and after times | Strengthened: mutant N2 passed the old test and fails the new one. |

No test was skipped, renamed or filtered, and no config or threshold changed.

**`tasks.md` versus the test list.** All 52 behavior ids are `DONE`. T043 carries `[U41]` and is ticked, and U41 is `DONE`. No open task carries a marker.

## Findings

Ordered by severity. Paths are relative to `skills/auto-capture-hermes/` on the stage branch at `dfb0d57`. "Open task" means a task from the first audit that is still unticked.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **U13 can't tell newest from oldest (vacuous for its claim, and a surviving mutant).** It seeds one top-level session (`session-1`) and one newer subagent. With a single top-level candidate, the `ORDER BY … DESC` in `findLatestSession` is never exercised: mutant N5 (`DESC` → `ASC`, pick the oldest) passes. Only the "exclude subagents" half is pinned (N4 is caught). **Should assert:** two top-level sessions with user turns (older and newer) plus a still-newer subagent, with the header naming the newer top-level session. | test `capture-hermes-session.test.mjs:299–305`; subject `capture-hermes-session.mjs:300`; test-list U13 row |
| 2 | MED | **Untested robustness rule tied to FR-015.** An unreadable queue entry is moved to `dead/`. With mutant N7 (left in place) nothing fails. A corrupt entry would then sort first and take up a retry slot on every run, so the retry queue could stall. Not on the test list. **Should:** add a behavior (traces FR-015): a seeded non-JSON queue entry moves to `dead/` and the valid entries behind it are resent. | `capture-hermes-session.mjs:531–534` |
| 3 | MED | **Permanent-failure checks don't pin the status** (unchanged from the first audit, open task T044). They check only `endsWith(":permanent")`; the contract form is `error:HTTP <status>…:permanent`. | `:503` (A11), `:537` (U29) |
| 4 | MED | **U17's ordering check is half-vacuous** (open task T045). If FIRST-TURN is missing, `indexOf` gives `-1` and the first comparison passes. It sits in one unlabelled `assert.ok`. A6 covers the dropped first turn. | `:335` |
| 5 | MED | **Mystery guest `"job-1"`** (open task T046). It comes from `startIngestStub`'s hidden default reply. | `:443` (U38), `:479` (A9), `:592` (U40); `test-support/run-adapter.mjs:141` |
| 6 | MED | **Implementation coupled: exact marker wording** (open task T046). `TRUNCATION_MARKER` copies the script's sentence, but data-model specifies only "a marker". | `:103`; used in U16, U17, U41 |
| 7 | MED | **U40 depends on the real clock and scheduling** (open task T047). It needs the second fire to land inside the 1000 ms debounce. It polls rather than sleeps and has passed every run so far, but the margin isn't stated, and it takes about 27% of suite time. | `:584–595` |
| 8 | MED | **The test list doesn't match the tests.** The A8 row still says "a running stand-in receives 0 requests", the U22 row says "0 requests", and the U40 row says `DEBOUNCE_MS=300` (open task T047). The tests are sound; the rows are stale and overstate what A8 and U22 now observe. | `tdd/test-list.md:47`, `:95`, `:123` |
| 9 | LOW | **Quoted `.env.local` values are untested.** Mutant N6 (quote stripping removed) passes. The README shows only unquoted values, so this is an undocumented convenience. Either test it or list it as out of scope, as was done for `--session` prefix matching. | `capture-hermes-session.mjs:603`; README `:67–71` |
| 10 | LOW | **Thin failure output** from `assert.ok(dispositions(sandbox).includes(…))` (exact-element checks, not vacuous). And if SQLite is missing, the whole suite can skip and still look green (`:38`). | e.g. `:166`, `:174`, `:479` |

**Smells checked and not found:** assertion free, tautological, re-implemented expectation (U41 measures the subject's output at a high limit and probes ±1, so it doesn't recompute the budget), doubled subject, over-mocked collaborators, self-approving snapshot, conditional logic, empty or always-skipped, assertion roulette, eager test, sleepy test, redundant test (the acceptance/unit pairs are double-loop by design), foreign style (matches the `recipes/atomizer` exemplar), bypassed test utility (the fork's `.fork/ci/test` helpers can't be used from an upstream folder), framework under test, duplicated setup, unclear name.

The A6/U16/U17 size constants, which the first audit flagged, are now backed by U41's measured boundary. They are no longer listed as a finding; T046 still covers naming them.

**No secrets.** `test-key-not-real` at `test-support/run-adapter.mjs:19` is a placeholder, and the only host is `127.0.0.1`. No repository content tried to instruct the auditor.

**Suite properties:**

- **Isolated:** each test gets its own sandbox and a constructed env.
- **Fast:** 4.4–4.6 s; U40 takes about 1.2 s.
- **Deterministic:** yes, except U40 (finding 7) and a negligible port-reuse window in U30. U38's clock use is bracketed between before and after times.
- **Refactor-insensitive:** black-box through the CLI against contract strings, except the marker wording and `readState` copying the safe-name rule.

## Mutation results

There is no mutation tool, so this section uses deliberate mutants: **23 in total**.

- **M1–M14** are re-runs of the first audit's set.
- **N1–N9** are new, aimed at the remediated tests and at areas the first sample didn't reach.

Each mutant was applied alone to `capture-hermes-session.mjs`. The whole test file ran under `env -i`, then the script was restored and confirmed byte-identical (`git diff --quiet`: true for all 23). After the last restore the suite was green again: 52 pass, 0 fail. The harness is in the session scratchpad and not committed, since the auditor writes only this file and `tasks.md`.

| Mutant | Change | Behavior | Survived | Judgment |
| --- | --- | --- | --- | --- |
| M1 | `status >= 500` → `> 500` | U28 | No | Caught by U28 |
| M2 | `=== 429` → `=== 428` | U27 | No | Caught by U27 |
| M3 | `attempt_count >= MAX` → `>` | U32 | No | Caught by U32 |
| M4 | `RETRY_BATCH_SIZE` 3 → 2 | U34 | No | Caught by U34 |
| M5 | `userTurns < MIN` → `<=` | U7 | No | Caught by 37 tests |
| M6 | closing-tag escape removed | U15 | No | Caught by U15 |
| M7 | `text.length <= budget` → `<` | U16 / U41 | **No** (survived before) | Now caught by U41: first-audit finding 3 cleared |
| M8 | head share 0.6 → 1 | A6, U17 | No | Caught |
| M9 | `/^Subagent:/` unanchored | U12 | No | Caught |
| M10 | `/^\[Cronjob\b/` unanchored | U6 | No | Caught |
| M11 | key hash 8 → 7 hex | U18 | No | Caught |
| M12 | wrapper allowance `- 40` → `- 0` | A6 | No | Caught by A6 and U41 |
| M13 | typed-parts detection skips arrays | U5 | No | Caught |
| M14 | `"unknown"` ref → `"none"` | U26 | No | Caught |
| N1 | missing-config guard logs, then falls through | A8, U22 | No | Caught by A8, U21, U22: first-audit finding 1 cleared |
| N2 | `captured_at: true` | U38 | No | Caught: first-audit finding 2 cleared |
| N3 | `on_session_finalize` not accepted | U38, INV-3 | No | Caught by U38 and U39 |
| N4 | `--latest` drops the parent filter | U13 | No | Caught by U13 |
| **N5** | `--latest` orders `ASC` (oldest) | **U13** | **Yes** | **Not equivalent:** a real user with several sessions gets the oldest. Finding 1 (HIGH) |
| N6 | `.env.local` quote stripping removed | none listed | Yes | Undocumented convenience. Finding 9 (LOW) |
| N7 | unreadable queue entry left in place | none listed | Yes | Real FR-015 risk (retry slot held forever). Finding 2 (MED) |
| N8 | permanent error no longer dead-letters a queued entry | U33 | No | Caught |
| N9 | project name = full `cwd` | U14, A1 | No | Caught |

Sample: **20 of 23 caught**. One survivor lies inside a `DONE` behavior.

**Not sampled:** `--session` prefix lookup (out of scope), lock and state-file write races, log line formatting, the `sqlite3` CLI fallback (out of scope), and `fetchWithTimeout` timeouts. The loop's own 51 detection mutants (one per test, all caught) remain in `evidence/detection/`; U41 adds M7 in cycle 54.

## Traceability

| Criterion | Tests | End to end |
| --- | --- | --- |
| US2.1 (FR-013) | A1, U14, U20 | Yes |
| US2.2 (FR-008) | A2, U1–U5 | Yes |
| US2.3 (FR-009) | A3, U6, U8 | Yes |
| US2.4 (FR-010) | A4, U7–U9 | Yes |
| US2.5 (FR-010) | A5, U10–U13 | Yes for exclusion; U13's "newest" unpinned (finding 1) |
| US2.6 (FR-011) | A6, U16, U17, U41 | Yes; boundary now pinned |
| US2.7 (FR-012) | A7, U18, U19 | Yes |
| US2.8 (FR-014) | A8, U21–U24 | Yes |
| US3.1 (FR-015) | A9, U25, U26 | Yes |
| US3.2 (FR-015) | A10, U27, U28, U30–U32, U34 | Yes; unreadable-entry handling untested (finding 2) |
| US3.3 (FR-015) | A11, U29, U33 | Yes; status not pinned (finding 3) |
| INV-1 / INV-2 / INV-3 | U15 / U24, U30, U35, U37 / U36, U38–U40 | Yes |

All 52 `test` values resolve to tests that ran (52 `ok` lines, 0 skipped).

**Untested criteria:** none among the automatable ones. The process criteria (US1, US4, SC-001/002/005/006) are checked by tasks T025–T036; T025–T028 are done and the rest are open.

**SC-003's clause "fails at the PR base"** can't be met, because there is no folder at the base; this is the waived case. **SC-004's "0 off-machine requests"** holds by construction, and no network guard asserts it.

**Tests tracing to nothing:** none.

## What was not audited

- **Ordering of test and code.** It cannot exist for an add-only PR. All 52 behaviors are TEST_AFTER under the owner's waiver; this report records the waiver and does not convert it into a pass.
- **Mutation coverage.** A sample of 23 mutants in one file, not a tool run. Unsampled areas are listed above.
- **Line and branch coverage.** Not measured (profile `coverage: null`).
- **Wall-clock defaults** (120 s debounce, 5 s finalize delay) and the `sqlite3` CLI fallback: out of scope per the test list.
- **The pre-merge checks** (fork-ci strict, the OB1 gate: T024–T028) have not been re-run since `b13ca53` and `dfb0d57`. The recorded passes predate those commits.
- **CI on GitHub** (T031): needs the owner's push (T030).
- **The author's docs**, and behavior against real Hermes or a real Open Brain endpoint (T038).
- **Feature resolution.** `.specify/feature.json` points at 007, which belongs to the other session in this checkout. This audit resolved `FEATURE_DIR` directly to `specs/008-stage-pr-521-auto-capture-hermes` and left `feature.json` untouched.
