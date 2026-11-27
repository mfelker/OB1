---
feature: 007-thought-attachments
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is "upstream-bound feature", so the staged-PR S1–S4 rules do not apply and the base classes are used
verified_at: ff4bfc1 # worktree .worktrees/contrib-thought-attachments, branch contrib/mfelker/thought-attachments, range upstream/main..HEAD (453 commits, 65 first-parent)
behaviors: 428 # DONE rows (365 U + 63 A); U14 DROPPED; L1–L7 live rows not on the loop
proven: 298
likely: 130 # first run passed, red shown by a recorded deliberate mutant; the code came from an earlier cycle
test_after: 0
no_test: 0
high_smells: 10 # grouped findings 2–11 below; finding 1 is a surviving mutant
criteria_total: 41 # US1.1–US5.4 (21) + SC-001–SC-020 (20)
criteria_covered: 37 # end to end through createApp(...).fetch; 4 are live-only GAPs (US3.3, SC-004, SC-006, SC-008)
mutation_score: 88 # 37 of 42 hand mutants killed; scope: 13 changed source files (src/*.ts, schema.sql), no tool (profile mutation: null)
mutants_survived: 5 # 1 non-equivalent inside a DONE behavior (HIGH), 1 equivalent at the boundary, 3 unpinned boundaries
suite: "Deno 378 passed, 0 failed, 0 ignored, 2.3 s wall; verify.sql passed twice on a fresh bootstrapped database; fork-ci strict preview: pass (3.9 s)"
---

# TDD Verification: Thought attachments (files linked to thoughts)

**Verdict: FAIL.** The most decisive reason is a surviving mutant inside a DONE behavior. With `src/page_routes.ts:103` changed so that a busy `/page/finish` uses up the page token, all 378 tests still pass, yet U280 and A62 claim that a busy refusal leaves the token valid. Ten groups of HIGH test smells add to that, mostly vacuous assertions in the acceptance tests and conditional logic in the tests.

The test-first discipline itself is strong:

- No behavior is TEST_AFTER.
- Every claimed red was found in history in the right order.
- A replay of every Deno red at its own cycle commit reproduced the claimed outcome in all 308 Deno cycles.
- No existing test was weakened.
- Every automatable criterion has an acceptance test through the real entry point.

The four live-only criteria are GAPs, per the owner's rule, and are not HIGH.

This audit was run cold. Its author wrote none of the tests. The smell pass was delegated to three fresh-context agents, and every finding they cited was re-opened and checked before it went into this report.

## How the evidence was gathered

- **Suite (Phase 0).**
  - `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` gave 378 passed, 0 failed, 0 ignored, in 2.3 s wall.
  - `verify.sql` ran twice on a fresh database (`audit007_fresh`, bootstrapped from `.fork/ci/sql/bootstrap.sql`): exit 0 both times.
  - fork-ci `run-folder.mjs --mode strict --origin fork` gave `pass`.
  - Baseline: the cycle log's cycle-0 baseline is an empty folder, so no failure predates the feature.
- **History.**
  - Every non-merge commit in `upstream/main..HEAD` was indexed for the test names it adds (`"<id> …"` and `-- U<n>:` blocks).
  - Every cycle-log entry's SHAs were resolved against the branch.
  - Results: all SHAs resolve, and every DONE behavior has a cycle-log entry and a commit. For every behavior, the test is introduced at or before the commit its entry claims. The one exception is U367, a deliberate extension of U34's column list in `be151ad`.
  - Renames were followed: UQ1–UQ5 became U357–U361 (`0b10510`), and U232b and P1 became U362 and U363 (`4a18c39`).
- **Red replay (independent of the log).** Each of the 308 Deno U cycles was replayed in a throwaway detached worktree: tests from the cycle commit, the rest of the folder from that commit's parent.
  - 197 cycles failed as the log says: 194 plus U181, U198 and U243, whose entries also mention an extra mutant.
  - U365 failed at type check. Its test adds `declared_by_page` to a row literal before the type had the field, which is a valid compile-level red.
  - All 110 cycles the log records as "first run passed, mutant" did pass against the prior code, so those claims are true.
  - The 58 SQL cycles were not replayed. Their order rests on history (one commit per row).
- **tasks.md versus the test list.**
  - Results: 76 of 85 tasks are ticked. No ticked task has a behavior that isn't DONE, and every unticked task (T076–T081, T083–T085) is a live, audit or landing task with no unit-behavior marker.
  - Every DONE id appears in some task's marker.
- **Existing tests weakened?** Every commit that removes a test line containing an assertion was inspected.
  - `bf238f7` (U181) is a `deno fmt` reflow. The normalised assertion multiset only grew: 21 to 23 in `vision_test.ts` and 30 to 30 in `embeddings_test.ts`.
  - `2a9f445` (U205) lengthens fixture text, and its assertion is strengthened to match.
  - `be151ad` (U367) extends U34's expected column list.
  - No skip, `only`, `ignore`, test exclusion or threshold change exists in the committed state. `deno.json` excludes only the lint rule `no-import-prefix`, a deliberate choice recorded in T070.

## Test-first evidence

| Class | Count | Behaviors | Evidence |
| --- | --- | --- | --- |
| PROVEN | 63 | A1–A63 | Recorded red `RUN_TODO=1 … acceptance_test.ts` gave 63 failed (`Error: not implemented`), with the todo tests in `a5b1c87` before any source. Each flip commit (`23e9e3f` … `c4e3a83`) changes only `todo(` to `Deno.test(`. See finding 14 on the quality of these reds. |
| PROVEN | 197 | Deno U behaviors whose red is an assertion failure or stub error | Red recorded in the cycle log, and the test and green source land in one per-cycle commit. Every one of these reds was reproduced by the audit's replay (U365 at type check). |
| PROVEN | 38 | SQL U behaviors with a real red, plus U367 | Red recorded (an `ERROR: U<n>: …` line or a missing function), with one commit per row. Not replayed. |
| LIKELY | 130 | U4, U7, U10, U11, U13, U15, U19, U310, U21, U24, U25, U26, U27, U28, U29, U30, U31, U32, U33, U311, U312, U313, U44, U48, U50, U51, U52, U55, U56, U58, U59, U60, U63, U68, U93, U96, U97, U100, U101, U102, U103, U107, U109, U92, U316, U317, U319, U83, U118, U120, U121, U320, U144, U151, U157, U125, U126, U127, U129, U132, U139, U321, U146, U350, U162, U164, U166, U170, U176, U185, U186, U322, U323, U324, U325, U190, U196, U200, U204, U207, U211, U213, U214, U222, U223, U224, U227, U234, U236, U239, U329, U246, U247, U249, U253, U332, U334, U260, U335, U336, U353, U354, U263, U266, U268, U271, U273, U274, U276, U338, U339, U278, U279, U341, U282, U284, U291, U292, U344, U345, U346, U352, U294, U296, U297, U302, U304, U306, U348, U351 | The test passed on its first run, because an earlier cycle's code already gave the behavior. The red is a recorded deliberate mutant, the playbook's sanctioned response. The replay confirmed each Deno one passed against the prior code. History shows the code before the test, so ordering can't be PROVEN; it is classed LIKELY rather than TEST_AFTER because the playbook prescribes this path. |
| TEST_AFTER | 0 | | |
| NO_TEST | 0 | | Every DONE row's named test exists and runs. The three that look missing to a name search are U43 and U44 (blocks at `verify.sql:193,205`) and U367 (inside U34's column list, `verify.sql:36`). |

## Findings

Ordered by severity. Paths are relative to `integrations/thought-attachments/`.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **Surviving mutant inside DONE behaviors U280 and A62.** Dropping `outcome.busy === undefined &&` from `reachedOutcome` lets a busy `/page/finish` consume the page token, and all 378 tests pass. Every busy test runs while the row is still `pending_upload`, so the `state !== "pending_upload"` clause hides the busy clause. The mutant is not equivalent: after an MCP finish leaves a photo `not_captioned` or `failed`, a `/page/finish` that is busy behind an MCP retry would burn the token. Add a test where the row is `not_captioned` or `failed` with a live claim, and assert the token is still accepted afterwards. | `src/page_routes.ts:103`; tests `tests/page_routes_test.ts` (U280), `tests/acceptance_test.ts` (A62) |
| 2 | HIGH | **Vacuous assertion: links checked only as `typeof === "string"`.** An empty link, or one for the wrong object or origin, passes. A27 reads the 600 s from `signedDownloads.at(-1)` but never ties the returned link to that signing. These should assert the exact link (the fake store's signed URL rewritten to `PUBLIC_BASE_URL`) and, for A63, the signed upload token. | `tests/acceptance_test.ts:426` (A7), `:759` (A21), `:954` (A27), `:1081` (A33), `:1133` (A36), `:1366` (A63) |
| 3 | HIGH | **Vacuous assertion: "with the reason" checked as a non-empty string.** Any text passes, including the wrong cause. These should assert the specific cause, as A22 does with `/500/`: vision not configured (A21), the vision endpoint unavailable (A25), the embedding failure (A34), and an unreadable PDF (A36). | `tests/acceptance_test.ts:754` (A21), `:819-822` (A25), `:1103` (A34), `:1132` (A36) |
| 4 | HIGH | **Vacuous assertion: `importer_version` checked as any non-empty string.** FR-008 requires the importer version, and the code pins `IMPORTER_VERSION`. The test should assert equality with `metadata.json`'s `version`. | `tests/derived_test.ts:90-91` (U135) |
| 5 | HIGH | **Vacuous assertion: a fallback compares a value with itself.** `assertEquals(ok.data.attachment_id ?? row.id, row.id)`: neither `finish_attachment`'s scripted outcome nor `remove_attachment`'s preview carries `attachment_id`, so for `remove_attachment` nothing checks which row the short id resolved to. The test should assert the resolved row per tool, for example with distinct file names, or with the `removalPreview` argument. | `tests/tools_test.ts:931` (U243) |
| 6 | HIGH | **Conditional logic in the test.** The expected annotations are built with `...(t.annotations?.readOnlyHint ? {} : {…})`, so the four read-only tools never have `destructiveHint` or `openWorldHint` compared. A read-only tool marked destructive would pass. The test should assert each tool's whole `annotations` object. | `tests/acceptance_test.ts:491-499` (A11) |
| 7 | HIGH | **Conditional logic in the test.** A `try/catch` sets `refused = true` on any thrown exception, so an unrelated TypeError counts as the refusal. The test should assert the one outcome the SDK gives (`isError` plus text naming `expected_kind`). | `tests/tools_test.ts:554-561` (U249) |
| 8 | HIGH | **Conditional logic in the test.** U50 returns early, asserting nothing, whenever a real `storage` schema exists. It does assert under fork-ci's bootstrap, so the gap is only on a real Supabase database, but the skip is silent. It should raise a notice that it skipped, or prove the no-storage path in a scratch schema. | `tests/verify.sql:24-26` (U50) |
| 9 | HIGH | **Re-implemented expectation.** U55's expected `content_fingerprint` is the same `encode(sha256(convert_to(lower(trim(regexp_replace(…))))))` expression that `schema.sql:187,266` uses, so both would be wrong together. The TypeScript side is anchored by a literal SHA in U133, but the SQL side is not. The test should assert a literal hex digest for a fixed content string. | `tests/verify.sql:376` (U55) |
| 10 | HIGH | **Re-implemented expectation: production helpers used as the oracle.** If the helper is wrong, test and code are wrong together. The risk is reduced: `links_test` U20–U24 and `derived_test` U147 pin these formats with literals, and `:397` and `:615` add literal prefix checks. These should assert literal strings or objects. | `tests/tools_test.ts:382-383` (U238, `curlLine`, `pageLink`), `:396` (U239, `publicUrl`), `:614` (U251), `:691` (U353), `:488` (U244, `noteMetadata`) |
| 11 | HIGH | **Tautological assertion: checks on the seeded fixture clone, not on the store.** `late.page_token_hash !== null` and `photo.expected_kind === "photo"` read the object returned by `seedAttachment`, so they can never fail. Each test's main assertion is sound, and only these lines are void. They should re-read `r.store.attachment(id)`, or drop the line. | `tests/page_routes_test.ts:309` (U339), `:162` (U267) |
| 12 | MED | **Surviving mutant, equivalent at the observable boundary.** With `wrongLength` disabled, A39 and U210 still pass, because the fake store (like pgvector) rejects a wrong-length vector with a message naming both lengths, and finishing still ends `failed` with no derived thought. The feature's own check is therefore never isolated by a test. U210's `assertStringIncludes(reason, "8")` also matches any 8. The test should assert the feature's exact message ("returned vectors of length 8, but this brain's vectors have length 1536"). | `src/finish.ts:155`; `tests/finish_test.ts:570`; `tests/acceptance_test.ts:1176-1177` |
| 13 | MED | **Unpinned boundaries (surviving mutants).** In each case the tests pin ±1 s or a far-off time, never the exact instant. These need tests at exactly `upload_deadline`. Note that `src/finish.ts:108` treats an upload at exactly the deadline as on time (pinned by U200), so the page and the finisher disagree at that instant. | (a) `src/page_routes.ts:49`: `>=` to `>` lets a page token work at exactly `upload_deadline` (U272 and U273 test ±1 s). (b) `schema.sql:386`: orphan `upload_deadline <= p_now` to `<` survives (U106, U107). (c) `src/finish.ts:94`: the "upload window expired" versus "no file uploaded yet" wording at the exact deadline (U203). |
| 14 | MED | **The outer-loop reds can't tell the tests apart.** All 63 acceptance reds are the same `Error: not implemented` from `createEmbeddingClient`, raised in the world's setup before any test's own assertion runs. The integrator's note at T012 concedes this, and stream A confirms all 63 passed under `RUN_TODO=1` before any flip. This is a valid red under the playbook (a stub the test drives), but it never shows an acceptance assertion failing. In this audit, 20 of the 34 Deno mutants (M01–M04, M06, M08, M09, M11, M15–M17, M20, M22–M24, M26, M28–M31) were caught by no acceptance test. Four of those (M03, M04, M11, M15) were caught by no test at all. The unit layer carries most of the strength. | `specs/…/tdd/cycle-log.md:351-425`, `:2195` |
| 15 | MED | **No positive control in the import scans.** `assertEquals(offenders, [])` also passes if `sourceFiles()` returns nothing or the specifier regexes stop matching. The tests should assert that a known specifier is found, and that a planted offender is flagged (as U83 and U52 do). | `tests/imports_test.ts:35-41` (U304), `:43-51` (U303) |
| 16 | MED | **Vacuous count: `derived.length >= 1`.** It is paired with `out.derived_count === derived.length`, but both come from the same array in `finish.ts:186-197`, so a wrong passage split passes. The test should assert the literal passage count for the two-page fixture. | `tests/finish_test.ts:93-94` (U182); same pattern at `:503` and `:709` |
| 17 | MED | **Non-deterministic: U47 passes on every run after the first.** On the persistent test database it passes even if `schema.sql` stops adding the column and index. It should record the pre-run state and assert the add. | `tests/verify.sql:240-247` (U47) |
| 18 | MED | **Sleepy test.** These use fixed waits instead of waiting on a condition: `settle()` is five real `setTimeout(0)` yields, so negative checks ("no PUT", "no finish", "no retry") depend on scheduling; H6 and H7 sleep 5 ms. The bounded polls in `finish_test.ts:631,681` wait on a condition and are acceptable. | `tests/helpers/page_dom.ts:58-60` (all page_script tests, including the negatives at `page_script_test.ts:81,233,265`); `tests/helpers/helpers_test.ts:141,162` (H6, H7) |
| 19 | MED | **Non-deterministic: real random ids.** `crypto.getRandomValues` makes ids differ on every run, so a failure can't be reproduced. finish_test and page_routes_test use fixed bytes. | `tests/tools_test.ts:55` |
| 20 | MED | **Eager tests.** U88 covers three store methods and indexes `ff.requests[0]`, `[1]` and `[3]` by position. U298 is named for the OPTIONS preflight but also pins reply CORS. U83 and U52 mix repository checks with scanner self-checks. | `tests/store_test.ts:241-258`; `tests/app_test.ts:106-117`; `tests/schema_drift_test.ts:74-89,103-112` |
| 21 | MED | **Magic values.** The literals 409, 410 and 411 stand for `busySeconds` ±1 (U214 at `:700-704` shows the derived form), and `calls.length >= 13` is an unexplained floor. | `tests/finish_test.ts:613,640-641,653,655,683` (U212, U213, U215, U216); `tests/schema_drift_test.ts:79` |
| 22 | MED | **Bypassed test utility.** | (a) `tests/vision_test.ts:32`: hand-rolled JPEG bytes, then captioned as `image/png` in U173 (`:60`), contradicting the test name; `fixtures.pngBytes()` exists. (b) `tests/tools_test.ts:302,375,590,719,909,925`: hand-derived short ids, where `shortId` is exported from `fake_store.ts:68`. (c) `tests/app_test.ts:191-197` (U301): a hand-rolled fetch recorder, where `FakeFetch` exists. |
| 23 | MED | **Redundant tests at the same level.** | U331 and U353 (`tests/tools_test.ts:653-661`, `:683-689`); U291 and U346 (`tests/page_script_test.ts:174-175`, `:250-254`); U351's set-key half versus U295 and U296 (`tests/app_test.ts:220,225`) |
| 24 | MED | **Assertion roulette and tuple-packed assertions.** Ten or more unlabelled `assertEquals` per test, or tuples mixing status, code and store facts, so a failure doesn't say which fact broke. | `tests/tools_test.ts:314-324` (U235), `:374-386` (U238), `:589-601` (U250); `tests/page_routes_test.ts:85-86,104,114-115,159-162,184,221,350,362,399-400` |
| 25 | MED | **Untested fake-store semantics stand in for the real store.** U336's "file already missing" half passes only because `FakeStore.deleteObject` succeeds on an absent path, and no store test pins what `storage.remove([path])` does for a missing object. Busy and claim boundaries (U212, U214, U260, U354) are decided in `fake_store.ts:525`, not in `finish.ts`. | `tests/tools_test.ts:867-881`; `tests/helpers/fake_store.ts:525,637-641` |
| 26 | LOW | **Cycle log corrupted when folded.** Eleven quoted red lines in the folded log contain the literal words "a semicolon and a space" in place of `;` plus a space. Two of them are already in stream A's own log; the other nine are absent from their stream logs, so the fold added them. Some quoted reds are therefore not verbatim. | `cycle-log.md:514,543,648,787,838,867,949,1000,1024,2109,2132` |
| 27 | LOW | **SQL reds that are a missing function.** Twelve SQL rows record `No function matches …` as their red, with no stub-then-assertion red. The playbook allows a symbol error only with a minimal stub and the resulting assertion failure recorded. | `cycle-log.md:937-976` (U53, U61, U64, U66, U67, U84, U86, U87, U94, U95, U104, U105) |
| 28 | LOW | **Process slips: two or three tests in one commit.** Self-reported in the log. Each has its own recorded mutant red. | `172b106` (U120, U121, U320), `e15ed15` (U125, U126), `4074fd4` (U132, U321), `aac8732` (U139, U350) |
| 29 | LOW | **Duplicated setup.** `settingsWith` is copied in 10 files, an `AttachmentRow` literal in 3, `sha256Hex` in 3 test files, and the pending-row literal and FakeFetch chain are repeated. | `tests/{store,settings,intake,embeddings,vision,passages,pdf,links,tools,finish}_test.ts` (`settingsWith`); `store_test.ts:25`, `intake_test.ts:110`, `derived_test.ts:11`; `app_test.ts:258`, `page_routes_test.ts:14`, `tools_test.ts:349` |
| 30 | LOW | **Stale comment and dead helper.** The header still describes todo flips, and `tests/helpers/todo.ts` is no longer imported by any test. | `tests/acceptance_test.ts:10-11`; `tests/helpers/todo.ts` |
| 31 | LOW | **Framework under test.** H1–H4 (the T010 harness proofs) assert library behavior (imports are functions, unpdf, `crypto.subtle`, supabase-js routing). They trace to no criterion, and are acceptable only as labelled harness smoke tests. | `tests/helpers/helpers_test.ts:44-106` |

No credential was found: `tests/helpers/env.ts` holds only `*-placeholder` values. No repository content tried to give the auditor instructions.

## Mutation results

There is no mutation tool (profile `mutation: null`), so 42 hand mutants were run. Each was applied to a copy of the folder under the scratch directory, and the applied edit was checked by diff before the run. Each Deno mutant ran the whole Deno suite. Each SQL mutant ran `verify.sql` on its own fresh, bootstrapped database. Each was restored byte for byte (`cmp`). The copy was then identical to the worktree (`diff -r`), and its suite was green (378 passed). Three mutants (M06, M10, M16) did not type-check and were run with `--no-check`.

Score: **37 of 42 killed (88%)**. The scope was `src/{app,page_routes,finish,intake,derived,links,store,vision,tools,pdf,embeddings,settings}.ts` and `schema.sql`. The sample was weighted to auth, token scoping, data loss, refusal, all-or-nothing writes, claims and boundaries. It is not exhaustive.

| Mutant | Change | Survived | Caught by | Judgment |
| --- | --- | --- | --- | --- |
| M01 | `app.ts:30` key compare ignores length | No | U297 | |
| M02 | `app.ts:109` `?key=` not read | No | U294 | |
| M03 | `page_routes.ts:49` `>=` to `>` (token valid at the exact deadline) | **Yes** | none | Unpinned boundary (finding 13a) |
| M04 | `page_routes.ts:103` busy outcome consumes the token | **Yes** | none | **Not equivalent, inside DONE U280/A62 (finding 1)** |
| M05 | `page_routes.ts:103` "no file yet" consumes the token | No | A61, U340 | |
| M06 | `page_routes.ts:78` expected kind not enforced | No | U267 | |
| M07 | `page_routes.ts:77` page declaration not checked | No | A16, U265, U266, U268 | |
| M08 | `finish.ts:23` refused attachment can be finished | No | U201 | |
| M09 | `finish.ts:108` `>` to `>=` (upload at the deadline) | No | U200 | |
| M10 | `finish.ts:125` same-bytes twin not refused | No | A4, U188, U324 | |
| M11 | `finish.ts:155` vector length never wrong | **Yes** | none | Equivalent at the boundary, because the store rejects it the same way (finding 12) |
| M12 | `finish.ts:227` failed rebuild drops `processed` | No | A25, U197, U326 | |
| M13 | `finish.ts:53` claim never released | No | 28 tests | |
| M14 | `finish.ts:89` plain repeat re-extracts | No | A41, U187, U215 | |
| M15 | `finish.ts:94` expired-message boundary | **Yes** | none | Unpinned boundary, wording only (finding 13c) |
| M16 | `intake.ts:69` smaller-than-declared accepted | No | U150 | |
| M17 | `intake.ts:74` page cap `>` to `>=` | No | U151 | |
| M18 | `intake.ts:66` real type not compared | No | A29, A35, A52, U149, U198 | |
| M19 | `derived.ts:54` type `observation` | No | A9, U136, U146 | |
| M20 | `derived.ts:51` `input_hash` null | No | U135, U184 | |
| M21 | `links.ts:9` no public-base rewrite | No | A26, U20, U239, U251, U262 | |
| M22 | `store.ts:74` short-id range collapsed | No | U75 | |
| M23 | `store.ts:87` `.gt` to `.gte` deadline | No | U318 | |
| M24 | `vision.ts:16` no key redaction | No | U181 | |
| M25 | `tools.ts:347` remove deletes without confirm | No | A47, U243, U258 | |
| M26 | `tools.ts:141` window 61 minutes | No | U236, U248 | |
| M27 | `tools.ts:84` note path skips the declared check | No | A51, U246, U247 | |
| M28 | `tools.ts:227` lookup limit uncapped | No | U328 | |
| M29 | `tools.ts:303` download link for `refused` | No | U253 | |
| M30 | `pdf.ts:25` scanned `<` to `<=` | No | U157, U158 | |
| M31 | `embeddings.ts:69` batch size + 1 | No | U163, U164, U166 | |
| M32 | `settings.ts:42` download default 900 | No | A27, U1 | |
| M33 | `derived.ts:57` no `attachment_id` | No | 17 tests | |
| M34 | `finish.ts:82` refused file not deleted | No | A4, A17, A31, A32, U188, U198, U199 | |
| S1 | `schema.sql:182` write_derived keeps the old set | No | U57 | |
| S2 | `schema.sql:100` unique index excludes `failed` not `refused` | No | U43 | |
| S3 | `schema.sql:346` note never removed | No | U98 | |
| S4 | `schema.sql:253` exact lookup case-sensitive | No | U314 | |
| S5 | `schema.sql:299` consume ignores the hash | No | U87 | |
| S6 | `schema.sql:386` orphan `<=` to `<` | **Yes** | none | Unpinned boundary (finding 13b) |
| S7 | `schema.sql:210` expired claim never re-granted | No | U62 | |
| S8 | `schema.sql:139` expired claim still writes | No | U54 | |

Coverage: not measured (profile `coverage: null`).

## Traceability

Criteria are the 21 user-story scenarios and SC-001 to SC-020. The end-to-end entry point is `createApp(...).fetch(new Request(...))` (MCP route and page routes) with FakeStore, the real embedding and vision clients over FakeFetch, and the fake clock. Every listed test was confirmed to exist and run.

| Criterion | Acceptance tests (A) | Unit rows | Live rows | End to end |
| --- | --- | --- | --- | --- |
| US1.1 | A1 | 1 | | Yes |
| US1.2 | A2 | 0 | L1 | Yes (search-ranking half live: GAP) |
| US1.3 | A3, A4 | 3 | | Yes |
| US1.4 | A5, A59 | 2 | | Yes |
| US2.1 | A13 | 1 | | Yes |
| US2.2 | A14 | 0 | L7 | Yes (real phone: GAP) |
| US2.3 | A15, A16 | 3 | | Yes |
| US2.4 | A17 | 1 | L7 | Yes (real phone: GAP) |
| US2.5 | A18 | 0 | | Yes |
| US2.6 | A19 | 0 | | Yes |
| US2.7 | A21, A22 | 2 | | Yes |
| US3.1 | A27 | 0 | | Yes (link only typed: finding 2) |
| US3.2 | A28 | 1 | | Yes |
| **US3.3** | none | 0 | L3 | **GAP**: Storage enforces expiry, so this is live only |
| US4.1 | A30, A31, A32, A63 | 3 | | Yes |
| US4.2 | A33 | 1 | | Yes |
| US4.3 | A34 | 1 | | Yes (reason vacuous: finding 3) |
| US5.1 | A46 | 1 | | Yes |
| US5.2 | A47 | 2 | | Yes |
| US5.3 | A48 | 1 | | Yes |
| US5.4 | A49, A50 | 0 | | Yes |
| SC-001 | A2 | 0 | L1 | Yes (live half GAP) |
| SC-002 | A13 | 0 | L2 | Yes (live half GAP) |
| SC-003 | A27, A29 | 3 | L3 | Yes (byte-identity and expiry live half GAP) |
| **SC-004** | none | 0 | L4 | **GAP** (Cloud compute, live only) |
| SC-005 | A30–A34, A36, A39 | 0 | | Yes |
| **SC-006** | none | 0 | L5 | **GAP** (both platforms, live only) |
| SC-007 | A52 | 0 | L6 | Yes (live half GAP) |
| **SC-008** | none | 0 | L7 | **GAP** (real phone, live only) |
| SC-009 | A6 | 1 | | Yes (core search is a proxy, so the real search is in L-runs) |
| SC-010 | A18 | 1 | | Yes |
| SC-011 | A19, A20 | 3 | | Yes |
| SC-012 | A7, A8 | 1 | | Yes |
| SC-013 | A32 | 4 | | Yes |
| SC-014 | A40, A41, A42 | 2 | | Yes |
| SC-015 | A23, A24 | 2 | | Yes |
| SC-016 | A9 | 0 | | Yes |
| SC-017 | A43, A44 | 6 | | Yes |
| SC-018 | A25, A58 | 1 | | Yes |
| SC-019 | A45, A55 | 2 | | Yes |
| SC-020 | A49, A50, A51 | 4 | | Yes |

- **Untested criteria:** none among the automatable ones. Four criteria (US3.3, SC-004, SC-006, SC-008) and the live halves of SC-001, SC-002, SC-003 and SC-007 (rows L1–L7) are owner-run live checks. Tasks T076–T080 haven't run, so these are **GAPs, not HIGH**, per the owner's ruling.
- **Functional requirements:** every FR-001 to FR-028 traces to at least one test. FR-020 (idempotent setup and grants) is covered only by `verify.sql`, which runs `schema.sql` itself, so that is its real entry point.
- **Tests tracing to nothing:** H1–H7 (the T010 harness proofs in `tests/helpers/helpers_test.ts`). They are harness checks, not feature behavior (finding 31).
- **Caveat on "end to end":** the acceptance tests run on `FakeStore`, so the SQL functions are verified only by `verify.sql`. The store-to-SQL contract rests on `schema_drift_test.ts` (U83, U52) and the store's request-shape tests. No test runs the TypeScript store against the real Postgres functions; that is the live runs' job.

## What was not audited

- **Live behavior:** search ranking, real Storage expiry and byte identity, Cloud CPU limits, the self-hosted stack, the real phone (T076–T080 haven't run).
- **Mutation:** 42 hand mutants, sampled toward high-risk behaviors, not a tool run. Of the files, `src/types.ts`, `index.ts` and `upload-page.html` got no mutant. The page script was exercised only through its own tests.
- **SQL red replay:** the 58 SQL cycles' reds were not replayed (each needs a database per commit). Their order rests on history plus the log.
- **The A reds:** not replayed (they are the T012 stub reds, by construction).
- **Coverage:** not measured; there is no tool.
- **The fake store's fidelity to the real database and Storage:** judged only where a finding names it (findings 12 and 25). There was no systematic comparison.
- **Performance and load:** not assessed beyond suite wall time (2.3 s Deno; verify.sql under 1 s).
- **README, metadata.json and documentation:** out of scope for this rubric.
