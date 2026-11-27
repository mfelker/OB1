---
feature: 007-thought-attachments
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is "upstream-bound feature", so the staged-PR S1–S4 rules do not apply and the base classes are used
verified_at: 9aacf86 # worktree .worktrees/contrib-thought-attachments, branch contrib/mfelker/thought-attachments; re-audit of ff4bfc1..HEAD (26 commits, linear, no merges) on top of the full range upstream/main..HEAD
behaviors: 440 # DONE rows (377 U + 63 A); U14 DROPPED; L1–L7 live rows not on the loop
proven: 300 # 298 from the previous audit + U378, U379
likely: 140 # 130 from the previous audit + U368–U377 (first run passed against unchanged code; red shown by a recorded deliberate mutant, or inherited from the split parent row)
test_after: 0
no_test: 0
high_smells: 1 # finding 2 (re-implemented expectation, U85); finding 1 is a surviving mutant inside DONE U378/U379
criteria_total: 41 # US1.1–US5.4 (21) + SC-001–SC-020 (20)
criteria_covered: 37 # end to end through createApp(...).fetch; 4 are live-only GAPs (US3.3, SC-004, SC-006, SC-008), partly evidenced by the in-progress Cloud run
mutation_score: 77 # 37 of 48 hand mutants killed; scope: the 5 previous survivors, 16 fresh mutants on T101's bodyReason (src/vision.ts, src/embeddings.ts), 24 regression mutants on code whose tests the remediation changed, 3 SQL; no tool (profile mutation: null)
mutants_survived: 11 # 4 inside DONE U378/U379 (HIGH), 1 behind a re-implemented expectation (HIGH), 6 unpinned paths of bodyReason (MED); none equivalent
suite: "Deno 389 passed, 0 failed, 0 ignored, 1.9 s wall; verify.sql passed twice on a fresh bootstrapped database; fork-ci strict preview: pass (deno pass, sql pass, 3.0 s)"
---

# TDD Verification: Thought attachments (files linked to thoughts)

**Verdict: FAIL.** The most decisive reason is a surviving mutant inside the new DONE behaviors U378 and U379. Their tests say an HTTP error keeps the status and the provider's `error.message`, "never other body fields". But a `bodyReason` that keeps the whole `error` object, or adds its `code`, passes all 389 tests. A second HIGH finding: U85 seeds its "existing" thought with the same fingerprint expression `attachment_insert_note` uses. So changing `schema.sql:266` from `'UTF8'` to `'LATIN1'` passes `verify.sql`.

The verdict is the same with or without recorded exceptions. `plan.md` Complexity Tracking records three deviations, and none of them is a test exception.

The remediation itself is real:

- All five survivors from the previous audit are now killed, each by its own new or strengthened test.
- Every previous HIGH smell is cleared, except finding 9, which is cleared for `write_derived` but not for `insert_note` (finding 2 here).
- No existing test was weakened.
- Every new row U368–U379 resolves to a real, running test.

The four live-only criteria are GAPs, per the owner's rule, and are not HIGH.

This re-audit was run cold. Its author wrote none of the tests. Every claim in the previous report, `tasks.md`, the test list and the cycle log was checked against history and the files. Every mutant was applied to a copy of the folder, confirmed applied by `diff`, and restored byte for byte (`cmp`). After the last mutant, the copy was identical to the worktree (`diff -r`).

## Previous audit (FAIL at `ff4bfc1`), in brief

The previous audit found:

- 1 surviving mutant inside DONE behaviors (M04, U280 and A62).
- 10 groups of HIGH smells (findings 2–11).
- 14 MED findings and 6 LOW findings.
- Mutation 37 of 42 (88%).

The remediation was T086–T099, plus the live-run fix T101. T100 (the LOW findings) is still open. Each item's status today is in "Previous findings, re-graded" below.

## How the evidence was gathered

- **Suite.**
  - `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` gave 389 passed, 0 failed, 0 ignored, in 1.9 s wall (Deno 2.9.8).
  - `verify.sql` ran twice on a fresh database (`reaudit007_fresh`, bootstrapped from `.fork/ci/sql/bootstrap.sql`): exit 0 both times. Run 1 printed no U50 skip notice, so U50 asserted.
  - fork-ci `run-folder.mjs --mode strict --origin fork` gave `pass` (deno pass, sql pass).
- **History of the remediation (`ff4bfc1..HEAD`).**
  - The range has 26 commits, linear, with no merges.
  - Twenty-four commits change only test files.
  - `8441b05` (U378) and `9aacf86` (U379) each change one source file together with its test, as a per-cycle commit should.
  - The cycle log's integrator note says "only test files changed" up to `f9bb8cd`. That is true.
- **Red replay.**
  - U378: `src/vision.ts` taken from `8441b05^`, with HEAD's tests, gave the logged red, `AssertionError: vision endpoint answered HTTP 400: {"error":{"message":"ob1-test/x …","code":400},"user_id":"user_acct123"}`.
  - U379: `src/embeddings.ts` taken from `9aacf86^` gave the logged `… HTTP 404 …` red.
  - U368, U369, U370, U371 and U377 were added against unchanged code. The audit re-ran each logged mutant (below), and each new test fails as logged.
  - U372–U376 are splits of U88, U298, U83 and U52. The audit's own mutants N372–N374 show that U372, U373 and U374 each fail alone.
- **Existing tests weakened?** Every removed assertion line in `ff4bfc1..HEAD` was read. None was weakened:
  - **U351's set-key half, `19144da`.** It asserted that a wrong key and a missing key each get `-32001`. U295 and U296 assert the same through the same `createApp` key check.
  - **U353's failed-state half.** It is identical to U331, which has the same set-up and asserts state `failed` and the reason "the run did not finish".
  - **U291's blank API-address line.** It moved to U346, in a stricter form (`['var API_ADDRESS = "";']`, where U346's old check was a regex).
  - **U88, U298, U83 and U52 (the splits, `88a06ce`).** Every assertion was kept, and indexed `requests[n]` became whole-list comparisons.
  - **The roulette conversions (`c52f349`).** Every value and expectation is kept, now under named keys.
  - **U267's removed line.** It was the void clone check that finding 11 asked to drop.
  - **The committed state.** There is no skip, `only` or `ignore`, no test exclusion, and no threshold change.
- **tasks.md versus the test list.**
  - T086–T099 and T101 are ticked, and every behavior they name is DONE.
  - T100 (the LOW findings) and the live and landing tasks (T076–T081, T083–T085) are unticked. None of them carries a unit-behavior marker.
  - No ticked task lacks evidence.
- **Test-list references.** Every DONE row's `file::title` was resolved against the files. All resolve except U88 (finding 4).

## Test-first evidence

| Class | Count | Behaviors | Evidence |
| --- | --- | --- | --- |
| PROVEN | 63 | A1–A63 | Unchanged from the previous audit (the T012 stub reds; see finding 12 on their quality). |
| PROVEN | 197 | Deno U behaviors with a recorded assertion or stub red | Unchanged from the previous audit, which replayed every one. |
| PROVEN | 38 | SQL U behaviors with a real red, plus U367 | Unchanged from the previous audit. |
| PROVEN | 2 | U378, U379 | The red is recorded, and the audit replayed it against the prior source. The test and the source land in one per-cycle commit (`8441b05`, `9aacf86`). |
| LIKELY | 130 | the previous audit's list (U4 … U351) | Unchanged: the first run passed, and the red is a recorded deliberate mutant. |
| LIKELY | 5 | U368, U369, U370, U371, U377 | The test was added against unchanged code, so its first run passed. The red is a recorded mutant (M04, M03, S6, M15, and the `deleteObject` error mutant), and the audit re-ran M04, M03, S6 and M15: each fails exactly the new test. |
| LIKELY | 5 | U372, U373, U374, U375, U376 | These are splits of U88, U298, U83 and U52. Their assertions predate them, and no red is recorded under the new ids; the red evidence is the parent rows'. The audit's mutants N372–N374 fail U372, U373 and U374. U375 and U376 test the in-test scanners, so no source mutant applies. |
| TEST_AFTER | 0 | | |
| NO_TEST | 0 | | Every DONE row's test exists and runs. U88's listed title is stale (finding 4), but a U88 test exists and runs. |

## Findings

Ordered by severity. Paths are relative to `integrations/thought-attachments/`.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **Surviving mutants inside DONE U378 and U379.** Both tests are named "never other body fields", but they check only that the top-level `user_id` is absent. Two mutants pass all 389 tests in both files: B5, `return JSON.stringify(parsed.error)`, which keeps `code` and any nested `error.metadata`, and B6, which appends `{"code":…}` to the message. OpenRouter's error bodies carry `error.metadata`, so this is the privacy path T101 exists for. Each test should compare the whole reason with `assertEquals` (for example `"vision endpoint answered HTTP 400: ob1-test/x is not a valid model ID"`), and add a body whose nested `error` fields carry an identifier. | `tests/vision_test.ts:192-200` (U378), `tests/embeddings_test.ts:176-184` (U379); code `src/vision.ts:83-92`, `src/embeddings.ts:80-89` |
| 2 | HIGH | **Re-implemented expectation: U85 seeds the existing thought with the code's own fingerprint expression.** `encode(sha256(convert_to(lower(trim(regexp_replace(txt,…))),'UTF8')),'hex')` is the same expression as `attachment_insert_note` at `schema.sql:266`, and the text is ASCII, so they agree whatever the expression is. U84 checks the stored fingerprint only for `is null`. Mutant S10 (`schema.sql:266` `'UTF8'` to `'LATIN1'`) passes `verify.sql` on a fresh database. Previous finding 9 named `schema.sql:187,266`, but T094 pinned only line 187 (U55, which S9 now kills). U84 or U85 should assert a literal hex digest for a fixed non-ASCII note text, for example U55's text and digest. | `tests/verify.sql:639` (U85), `:628-630` (U84); code `schema.sql:266` |
| 3 | MED | **`bodyReason`'s other paths are unpinned (6 survivors, 3 per client).** B4 drops a non-JSON error body's text (`return ""`). B7 lifts the 300-character bound to 30,000. B8 accepts a non-string `error.message`, which then makes `redact()` throw instead of returning `{ error }`. U179, U168, U181 and U171 assert only the status, or only the absence of the key. The cycle log says the fallback path is kept "so U179 and U181 still pass", but neither test reads the body text. T101 also asks for a "bounded length". | `src/vision.ts:63,83-92`, `src/embeddings.ts:39,80-89`; `tests/vision_test.ts:143-154,176-190`; `tests/embeddings_test.ts:125-134,165-174` |
| 4 | MED | **Stale test-list row.** U88's `test` column names `U88 insertNote, attachmentForPageToken and consumePageToken map the RPC replies to …`, but that title no longer exists: `88a06ce` renamed the test to `U88 insertNote maps the RPC reply to { id, created }`. The row's behavior text still claims all three methods. The rubric grades a reference to a missing test as HIGH because that overstates coverage. Here a U88 test exists and runs, and U372 and U373 cover the other two methods, so no coverage is overstated. It is graded MED: bookkeeping that misleads a reader. | `specs/007-thought-attachments/tdd/test-list.md:293`; `tests/store_test.ts:241` |
| 5 | MED | **Residual from previous finding 25: the fake store's busy and claim boundaries.** U377 now pins what `deleteObject` gives for an absent object, against a modelled Storage reply (200 with `[]`). The busy and claim boundaries that U212, U214, U260 and U354 rely on are still decided in `tests/helpers/fake_store.ts`, not in `src/finish.ts`. The SQL side pins them (U62, U54). No TypeScript test runs the real store against Postgres. The cycle log says so itself. | `tests/helpers/fake_store.ts` (claim logic); `tests/store_test.ts:306` (U377) |
| 6 | MED | **The outer-loop reds can't tell the tests apart (previous finding 14, historical).** All 63 A reds are the same stub error. This can't be fixed after the fact. The acceptance layer now carries real strength: in this audit, A tests killed R21, H3a–H3d, H10a, R05, R25 and R32. | `specs/…/tdd/cycle-log.md` (T012 entries) |
| 7 | LOW | **Cycle log corrupted when folded (previous finding 26, unchanged).** Eleven quoted lines still contain the literal words "a semicolon and a space": 2 of them are also in stream A's `cycle-log.d/a.md`, and the other 9 were added by the fold. T100 is open. | `tdd/cycle-log.md:514,543,648,787,838,867,949,1000,1024,2109,2132` |
| 8 | LOW | **Remediation rows trace to a task, not to the spec.** U368–U377 give `T081 audit remediation (tasks T086–T099)` as their `traces`, so a criterion-to-test map can't reach them. Their natural traces are FR-002 and FR-024 (U368, U369, U371–U373), FR-021 (U370), INV-4 (U374), INV-3 (U375), INV-2 and FR-016 (U376), and FR-016 (U377). | `tdd/test-list.md:646-655` |
| 9 | LOW | **U249 asserts zod's exact wording.** `"Invalid option: expected one of"` is the validation library's text, not the feature's. An SDK or zod upgrade could break it with no behavior change. `isError` and the `expected_kind` path are the feature's facts. | `tests/tools_test.ts:592-601` |
| 10 | LOW | **SQL reds that are a missing function; process slips; duplicated setup; stale header and dead helper; framework under test.** These are previous findings 27–31, all unchanged. T100 covers 29–31. `settingsWith` is still copied in 10 files, `tests/acceptance_test.ts:10-11` still describes todo flips, `tests/helpers/todo.ts` is still unimported, and H1–H4 are still unlabelled. | as in the previous report |

No credential was found: `tests/helpers/env.ts` holds only `*-placeholder` values. No repository content tried to give the auditor instructions.

### Previous findings, re-graded

| Prev # | Was | Now | Evidence today |
| --- | --- | --- | --- |
| 1 | HIGH survivor M04 | **Cleared** | M04 fails only U368 (`tests/page_routes_test.ts`, the `not_captioned` and `failed` rows with a live claim). |
| 2 | HIGH links `typeof` | **Cleared** | A7, A21, A27, A33, A36 and A63 compare with `downloadLinkFor` and `uploadLinkFor`, which find the fake store's signing of the row's own path. R21 (no public-base rewrite) fails 13 tests, 7 of them acceptance tests. |
| 3 | HIGH vague reason | **Cleared** | A21, A25, A34 and A36 match the specific cause. Reason-swap mutants H3a–H3d each fail an A test and a U test. |
| 4 | HIGH `importer_version` | **Cleared** | U135 equals `metadata.json`'s `version`. H4 (`"0.1.1"`) fails U135. |
| 5 | HIGH `?? row.id` | **Cleared** | U243 asserts the row each tool resolved (finish id, `get_attachment` name, `remove_attachment` preview argument). No fallback remains. R25 also fails U243. |
| 6 | HIGH A11 conditional | **Cleared** | The whole `annotations` objects are compared. H6 (`find_thought` destructive) fails A11. |
| 7 | HIGH U249 try/catch | **Cleared** (LOW coupling left: finding 9) | There is no `catch`. It asserts `isError` and text naming `expected_kind`. |
| 8 | HIGH U50 silent skip | **Cleared** (the prescribed notice option) | The skip on a real `storage` schema now raises `NOTICE U50: SKIPPED …`. Under fork-ci's bootstrap it asserts: no notice in this audit's run. |
| 9 | HIGH U55 re-implemented | **Partly cleared** | U55 pins a literal digest, so S9 (`:187` to LATIN1) fails U55. Line 266 (`insert_note`) is still unpinned: finding 2. |
| 10 | HIGH production helpers as oracle | **Cleared** | The `tools_test` imports of `curlLine`, `pageLink`, `publicUrl` and `noteMetadata` are gone, replaced by literals. H10a and H10b fail U244, U147 and A18, and U23 and U238. |
| 11 | HIGH void clone checks | **Cleared** | U339 re-reads `r.store.attachment(late.id)` and compares the hash. U267's void line was dropped. |
| 12 | MED M11 equivalent | **Cleared** | U210 asserts the feature's exact message and no `writeDerived` call. A type-valid M11 (`v.length !== v.length`) fails U210. |
| 13 | MED boundaries | **Cleared** | M03 fails U369, S6 fails U370 (`verify.sql`, `ERROR: U370: <NULL>`), and M15 fails U371. |
| 14 | MED outer-loop reds | Historical (finding 6) | |
| 15 | MED no positive control | **Cleared** | U303 and U304 assert known files and specifiers, and flag planted offenders. |
| 16 | MED `>= 1` counts | **Cleared** | U182, U206 and U214 assert 1. U184's `>= 1` stays, as its loop guard, which is acceptable. |
| 17 | MED U47 first-run-only | **Cleared** | It runs in a rolled-back scratch schema. With `schema.sql:107-110` commented out, U47 fails on a database where `verify.sql` already ran (`ERROR: U47: thoughts.content_fingerprint was not added`). |
| 18 | MED sleepy | **Cleared** | `settle()` waits until every page is quiet, bounded at 1000 turns, and fails rather than returning. H6 and H7 wait on their condition. |
| 19 | MED random ids | **Cleared** | `seededBytes()`. `getRandomValues` is gone from `tools_test`. |
| 20 | MED eager | **Cleared** (bookkeeping left: finding 4) | U372–U376 split out. |
| 21 | MED magic values | **Cleared** | `busySeconds ± 1`, with U213's 410 commented as the default pin. `STORE_RPCS` is an exact list. |
| 22 | MED bypassed utility | **Cleared** | `jpegBytes` and `pngBytes`, `shortId`, and `FakeFetch` in U301. |
| 23 | MED redundant | **Cleared** | The halves were removed, and each removed check is still made elsewhere (see "Existing tests weakened?"). |
| 24 | MED roulette | **Cleared** | The facts are compared as labelled objects. |
| 25 | MED fake-store semantics | Partly cleared (finding 5) | U377 was added. The busy boundaries still rest on the fake. |
| 26–31 | LOW | Unchanged (findings 7, 10) | T100 is open. |

## Mutation results

There is no mutation tool (the profile has `mutation: null`), so 48 hand mutants were run. Each was applied to a copy of the folder under the scratch directory. The applied edit was shown by `diff` before the run. Each Deno mutant ran the whole Deno suite. Each SQL mutant ran `verify.sql` on its own fresh, bootstrapped database, which was then dropped; S11 ran on the persistent `reaudit007_fresh`, which was also dropped at the end. Each mutant was restored and checked with `cmp`. After the last mutant, `diff -r` between the copy and the worktree was empty. R25 and R06 do not type-check, so they ran with `--no-check`.

**Score: 37 of 48 killed (77%).** The sample is deliberately dense on T101's new 12-line function, which accounts for 10 of the 11 survivors. It is not comparable to the previous 88% (a different sample) and it is not exhaustive.

**The previous survivors, each re-run against the current code:**

| Mutant | Change | Survived | Caught by |
| --- | --- | --- | --- |
| M04 | `src/page_routes.ts:103` drops `outcome.busy === undefined &&` | No | U368 |
| M11 | `src/finish.ts:155` `v.length !== dimension.data` to `v.length !== v.length` | No | U210 |
| M03 | `src/page_routes.ts:49` `>=` to `>` | No | U369 |
| S6 | `schema.sql:388` orphan `upload_deadline <= p_now` to `<` | No | U370 |
| M15 | `src/finish.ts:94` expired-wording `>=` to `>` | No | U371 |

The previous report's line for S6 was `schema.sql:386`. The code is at `:388` today, and its text is unchanged.

**Fresh mutants on T101's `bodyReason`**, applied to `src/vision.ts` (v) and `src/embeddings.ts` (e) separately:

| Mutant | Change | v | e | Judgment |
| --- | --- | --- | --- | --- |
| B1 | keep the whole body text even when `error.message` is a string | killed (U378) | killed (U379) | |
| B2 | read `parsed.message` instead of `parsed.error.message` | killed (U378) | killed (U379) | |
| B3 | drop `redact()` around the reason | killed (U181) | killed (U171) | |
| B4 | the fallback returns `""` instead of the body text | **survived** | **survived** | Not equivalent: a non-JSON provider error loses its text. Finding 3. |
| B5 | return `JSON.stringify(parsed.error)` | **survived** | **survived** | **Not equivalent, inside DONE U378 and U379** ("never other body fields"). Finding 1. |
| B6 | the message plus `{"code":…}` | **survived** | **survived** | **Not equivalent, inside DONE U378 and U379.** Finding 1. |
| B7 | the reason bound `.slice(0, 300)` becomes `.slice(0, 30000)` | **survived** | **survived** | Not equivalent: an unbounded reason. Finding 3. |
| B8 | `typeof message === "string"` becomes `message !== undefined` | **survived** | **survived** | Not equivalent: a non-string message makes `redact()` throw. Finding 3. |

**Regression mutants**, on code whose tests the remediation rewrote or split, and confirmations of the re-graded HIGH findings:

| Mutant | Change | Survived | Caught by |
| --- | --- | --- | --- |
| R01 | `src/app.ts:30` key compare ignores length | No | U297 |
| R02 | `src/app.ts:109` `?key=` not read | No | U294 |
| R05 | `src/page_routes.ts:103` "no file yet" consumes the token | No | A61, U340 |
| R06 | `src/page_routes.ts:78` expected kind not enforced | No | U267 |
| R21 | `src/links.ts:9` no public-base rewrite | No | A7, A21, A26, A27, A33, A36, A63, U20, U238, U239, U251, U262, U353 |
| R22 | `src/store.ts:74` short-id range collapsed | No | U75 |
| R23 | `src/store.ts:87` `.gt` to `.gte` deadline | No | U318 |
| R24 | `src/vision.ts:16` no key redaction | No | U181 |
| R25 | `src/tools.ts:347` remove without confirm deletes | No | A47, U243, U258 |
| R28 | `src/tools.ts:227` lookup limit uncapped | No | U328 |
| R29 | `src/tools.ts:303` download link for `refused` | No | U253 |
| R32 | `src/settings.ts:42` download default 900 | No | A27, U1 |
| R40 | `src/store.ts:173` removes `path + ".x"` | No | U82, U377 |
| N372 | `src/store.ts:124` takes `data[1]` | No | U372 |
| N373 | `src/store.ts:127` sends `p_hash: id` | No | U373 |
| N374 | `src/app.ts` drops the reply CORS loop | No | U374 |
| H3a | `src/finish.ts:162` `pdf.error` replaced | No | A36, U208 |
| H3b | `src/finish.ts:237` not-configured text replaced | No | A21, U192 |
| H3c | `src/finish.ts:182` `embedded.error` replaced | No | A34, U209 |
| H3d | `src/finish.ts:240` `caption.error` replaced | No | A22, A25, U193, U197 |
| H4 | `src/derived.ts:6` `IMPORTER_VERSION = "0.1.1"` | No | U135 |
| H6 | `src/tools.ts:225` `find_thought` `destructiveHint: true` | No | A11 |
| H10a | `src/derived.ts:84` note type `reference` | No | A18, U147, U244 |
| H10b | `src/links.ts:20` `-T` to `--upload-file` | No | U23, U238 |
| S9 | `schema.sql:187` write_derived fingerprint `'UTF8'` to `'LATIN1'` | No | U55 |
| S10 | `schema.sql:266` insert_note fingerprint `'UTF8'` to `'LATIN1'` | **Yes** | none: re-implemented expectation in U85, and U84 checks only non-null (finding 2) |
| S11 | `schema.sql:107-110` fingerprint column and index commented out, persistent database | No | U47 |

Coverage: not measured (the profile has `coverage: null`).

## Traceability

The criteria are the 21 user-story scenarios and SC-001 to SC-020. The end-to-end entry point is `createApp(...).fetch(new Request(...))`, over the MCP route and the page routes, with FakeStore, the real embedding and vision clients over FakeFetch, and the fake clock. The remediation added no acceptance test, so the criterion-to-A-test map is the previous report's. Every listed A test was confirmed to exist and run in this audit's suite. The table shows only the criteria whose status changed or that the live run now evidences.

| Criterion | Automated, end to end | Live evidence (`evidence/cloud/README.md`, T076 in progress, code `ff4bfc1`) | Status |
| --- | --- | --- | --- |
| US1.2, SC-001 | A2 | Cloud: 8 of 8 questions on the FT-710 manual found their passage in the top 10 | Covered. The Cloud live half is evidenced; self-hosted is not required by SC-001. |
| SC-002 | A13 | Cloud: one phone photo captioned. No per-photo search result recorded | Live search half: **GAP** |
| SC-003 | A27, A29 | Cloud: PDF SHA-256-identical, photo size equal. Expiry not exercised | Byte identity evidenced on Cloud. "Every expired link is refused": **GAP** |
| **US3.3** | none | "The link works for 600 s", but a use after expiry is not recorded | **GAP** (live only) |
| **SC-004** | none | Cloud Free: a 25-page, 679 KB PDF finished in 2.6 s, and a 2.4 MB photo finished, with no 546. Neither is at the default caps (50 pages, 25 MB; photo 10 MB) | **GAP**, partly evidenced |
| **SC-006** | none | Self-hosted run (T077) not done | **GAP** |
| SC-007 | A52 | Cloud: one caption row scanned. "Every record from the live runs" (T079) not done | Live half: **GAP** |
| **SC-008** | none | Cloud: a default-camera phone photo uploaded through the page and captioned. Self-hosted half not done | **GAP**, Cloud half evidenced |
| US2.2, US2.4 | A14, A17 | Cloud: a real phone through the page, no app, no shell | Covered. The Cloud live half is evidenced. |
| SC-009–SC-015, SC-018, US5.1–US5.2, FR-012, FR-026 | as before | Cloud: scenarios 2, 3, 5–8 and 10 match the automated outcomes | Covered (corroborated live) |
| FR-009 (T101) | U378, U379 (unit; finding 1) | The finding came from Cloud scenario 7 at `ff4bfc1`. The fix (`9aacf86`) was redeployed, but scenario 7 has not been re-run on it | Live re-check: **GAP** |

- **Untested criteria:** none among the automatable ones. US3.3, SC-004, SC-006 and SC-008, and the live halves noted above, are owner-run checks. Per the owner's ruling, they are **GAPs, not HIGH**. T077 (self-hosted) has not run, and T076, T078 and T079 are in progress or open.
- **Tests tracing to nothing:**
  - H1–H7 are harness proofs (finding 10).
  - U368–U377 trace to a task id rather than a spec id (finding 8). Each asserts behavior that belongs to an existing FR or INV.
- **Caveat on "end to end":** the acceptance tests run on `FakeStore`. The SQL functions are verified only by `verify.sql`, and the store-to-SQL contract rests on `schema_drift_test.ts` (U83, now an exact RPC list) and the store's request-shape tests.

## What was not audited

- **Live behavior.** The self-hosted run (T077) has not happened. The Cloud run (T076) is in progress, and was credited only for what its README records. The README's rows were taken as the owner's record; nothing in them was re-executed.
- **Mutation.** This was a sample of 48 hand mutants, not a tool run. Of the previous audit's 37 killed mutants, 12 were re-run here (R01–R32). The other 25 were not re-run; most of them are in code whose tests the remediation did not rewrite. `src/types.ts`, `index.ts`, `upload-page.html` and the test helpers got no mutant. The page script was exercised only through its own tests.
- **Red replay.** Only U378 and U379 were replayed from history. The other remediation reds were checked by re-running the logged mutants against HEAD, not at their own commits. The 58 older SQL reds were not replayed, as before.
- **Coverage.** Not measured; there is no tool.
- **The fake store's fidelity** to the real database and Storage: judged only where findings 2 and 5 name it.
- **Performance and load.** Not assessed beyond suite wall time (1.9 s Deno; `verify.sql` under 1 s).
- **README, metadata.json and documentation.** Out of scope for this rubric.
