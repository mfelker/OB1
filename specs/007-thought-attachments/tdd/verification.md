---
feature: 007-thought-attachments
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is "upstream-bound feature", so the staged-PR S1–S4 rules do not apply and the base classes are used
verified_at: 293dee50 # worktree .worktrees/contrib-thought-attachments, branch contrib/mfelker/thought-attachments; re-audit of 9aacf86..HEAD (3 commits, test files only) on top of the full range upstream/main..HEAD
behaviors: 446 # DONE rows (383 U + 63 A); U14 DROPPED; L1–L7 live rows not on the loop
proven: 300 # unchanged from the previous audit
likely: 146 # 140 from the previous audit + U380–U385 (added against unchanged code; red is a recorded mutant, re-run here)
test_after: 0
no_test: 0
high_smells: 4 # findings 1–4: each is a surviving mutant inside a DONE behavior (finding 2 is also a vacuous NULL comparison)
criteria_total: 41 # US1.1–US5.4 (21) + SC-001–SC-020 (20)
criteria_covered: 37 # end to end through createApp(...).fetch; 4 are live-only GAPs (US3.3, SC-004, SC-006, SC-008)
mutation_score: 74 # 75 of 102 hand mutants killed (79% of the 95 judged non-equivalent); scope: the 11 previous survivors, 74 fresh mutants over src/*.ts and upload-page.html, 17 fresh SQL mutants on schema.sql; no tool (profile mutation: null)
mutants_survived: 27 # 7 judged equivalent; 11 inside DONE behaviors (HIGH, findings 1–4); 7 on unpinned paths (MED, findings 5–8); 2 cosmetic (LOW, finding 12)
suite: "Deno 395 passed, 0 failed, 0 ignored, 1.9 s wall (Deno 2.9.8); verify.sql passed twice on a fresh bootstrapped database, with no U50 skip notice; fork-ci strict preview: pass (deno pass, sql pass, 3.0 s)"
---

# TDD Verification: Thought attachments (files linked to thoughts)

**Verdict: FAIL.** The most decisive reason is a surviving mutant inside the DONE key-check behaviors U295 and A10 (FR-018). If `sameKey` in `src/app.ts:31` stops comparing bytes, so that it compares only the lengths, all 395 tests still pass. Under that mutant, any MCP key of the right length is accepted. Every wrong-key test uses a key of a different length.

The verdict is the same with or without recorded exceptions. `plan.md` Complexity Tracking records three deviations, and none of them is a test exception.

The T102–T107 remediation is real:

- All 11 previous survivors are killed, each by the new or strengthened test named in its task:
  - B4–B8 in both `src/vision.ts` and `src/embeddings.ts`.
  - S10 in `schema.sql:266`.
- Both previous HIGH findings are cleared, and so are the MED and LOW findings that T105–T107 named.
- No existing test was weakened.

The new FAIL comes from the wider fresh sample this audit ran over code that the earlier audits did not mutate. It found four groups of survivors inside DONE behaviors (findings 1–4), and four unpinned paths (findings 5–8).

The live-only criteria are GAPs, per the owner's rule, not HIGH.

This re-audit was run cold. Its author wrote none of the tests. Every claim in the previous report, `tasks.md`, the test list, the cycle log and the Cloud evidence was checked against history and the files. Every mutant was applied to a copy of the folder under the scratch directory. A script confirmed each edit (the copy differed from the worktree, and the `diff` was recorded), ran the suite, and restored the file. `filecmp` then checked the restored file byte for byte against the worktree. After the last mutant, `diff -r` between the copy and the worktree was empty. The worktree was never edited.

## Previous audits, in brief

- **`ff4bfc1`: FAIL.** 1 survivor inside a DONE behavior and 10 groups of HIGH smells. The remediation was T086–T099 and T101.
- **`9aacf86`: FAIL.** There were two HIGH findings:
  - B5 and B6 survived inside U378 and U379.
  - U85 re-implemented the fingerprint, so S10 survived.

  There were also 4 MED findings, including the unpinned B4, B7 and B8 and the stale U88 row, and LOW findings: corrupted cycle-log quotes, task-only traces, U249's zod wording, and findings 27–31. Mutation scored 37 of 48. The remediation was T102–T107, plus the cycle-log part of T100.

## How the evidence was gathered

- **Suite.**
  - The Deno suite gave 395 passed, 0 failed, 0 ignored, in 1.86 s wall.
  - `verify.sql` ran twice on a fresh database (`rb007_fresh`, bootstrapped from `.fork/ci/sql/bootstrap.sql`), with exit 0 both times. A separate fresh run (`rb007_u50`) printed no `U50: SKIPPED` notice, so U50 asserted.
  - The fork-ci strict preview gave `pass` (deno pass, sql pass, 3022 ms).
- **History of the remediation (`9aacf86..HEAD`).** There are three commits, linear, and each changes test files only:
  - `2cee598` (T102): U378 and U379.
  - `c1322ed` (T104): U380–U385.
  - `293dee5` (T103): U84 and U85 in `verify.sql`.

  No source file changed after `9aacf86`, so the code deployed for T107 is HEAD's code.
- **Red replay.** Each remediation red is a recorded mutant against unchanged code. The audit re-ran every one at HEAD:
  - B5 and B6 fail U378 (vision) and U379 (embeddings).
  - B4 fails U380–U382 and U383–U385.
  - B7 fails U381 and U384.
  - B8 fails U382 and U385.
  - S10 fails `verify.sql` with `U84: fingerprint is 79712381…, want the literal digest`.

  These match the cycle-log entries (`tdd/cycle-log.md:2534-2580`). Both literal digests in U84 and U85 were recomputed independently with `shasum -a 256` over the normalised UTF-8 text, and they match. The LATIN1 digest the log quotes also matches `iconv … | shasum`.
- **Existing tests weakened?** Every removed line in `9aacf86..HEAD` was read. None was weakened:
  - U378 and U379: `assertStringIncludes` (twice) and `!includes("user_acct123")` became one whole-string `assertEquals`.
  - U84: `t.content_fingerprint is null` became `is distinct from '<literal>'`.
  - U85: the seeded `encode(sha256(…))` expression became a literal.

  There is no skip, `only` or `ignore`, and no threshold or exclusion change.
- **tasks.md versus the test list.**
  - T102–T107 are ticked, and U378–U385, U84 and U85 are DONE.
  - T100 is unticked, correctly. Its cycle-log part is done: `grep -c 'a semicolon and a space'` returns 0 in `cycle-log.md` and in every `cycle-log.d/*.md`, and the restored lines in fork commit `4ce0a86` read correctly. The helper, header, `todo.ts` and H-label parts are still open.
  - No ticked task lacks evidence, except that T107's done-condition is half met (see Traceability).
- **Test-list references.** A script resolved every DONE row's `file::title` against the `Deno.test("…")` titles, and every `verify.sql` "(Uxx block)" against its `-- Uxx` header. All 446 resolve. U367 names the U34 block, which exists. U88's row now reads `U88 insertNote maps the RPC reply to { id, created }`, and that test exists. No test title is duplicated. The only test ids not on the list are H1–H7, the harness proofs.

## Test-first evidence

| Class | Count | Behaviors | Evidence |
| --- | --- | --- | --- |
| PROVEN | 300 | A1–A63; 197 Deno U; 38 SQL U and U367; U378, U379 | Unchanged from the previous audits. U378 and U379 keep their T101 reds (`8441b05`, `9aacf86`). T102 strengthened them, and the B5 and B6 reds were re-run here. |
| LIKELY | 140 | the previous audits' list (U4 … U351, U368–U377) | Unchanged. |
| LIKELY | 6 | U380, U381, U382, U383, U384, U385 | Added in `c1322ed` against unchanged code, so the first run passed. The red is a recorded mutant (B4, B7, B8), and each was re-run here. |
| TEST_AFTER | 0 | | |
| NO_TEST | 0 | | Every DONE row's test exists and runs. |

U84 and U85 keep their earlier class. T103 strengthened them, and S10 is their recorded and re-run red.

## Findings

Ordered by severity. Paths are relative to `integrations/thought-attachments/`.

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **The key check is not tested against a same-length wrong key.** U295 sends `not-the-brain-key` (17 characters, where the key is 26), U296 sends none, and A10 also sends a different length. So `sameKey` could compare only lengths and pass all 395 tests. Three mutants survive: P6 skips the last byte, P6b skips the first byte, and P6c (`diff \|= … & 0`) compares no bytes at all, so any 26-character key is accepted. This is FR-018's authorization path. U295 (or a new row) should also send `BRAIN_KEY` with its last character changed, and again with its first character changed, by header and by `?key=`, and expect `-32001` with no store call. | `src/app.ts:27-33`; `tests/app_test.ts:53-64` (U295), `:66` (U296); `tests/acceptance_test.ts:485` (A10) |
| 2 | HIGH | **NULL-unsafe assertions in `verify.sql`, so two DONE patch behaviors pass when nothing is written.** U94 checks `r.state_reason <> 'the run did not finish'`. U57 checks `r.caption_model <> 'vision-x'`, plus `page_count`, `content_hash`, `actual_type` and `actual_size` the same way. When the column stays NULL, `<>` is NULL and no exception is raised. Two mutants pass `verify.sql` twice on fresh databases: Q10 (`attachment_apply_patch` never sets `state_reason`) and Q15 (it never sets `caption_model`). Q10 means no refusal or failure reason is ever stored in a real database. The TypeScript suite can't catch it, because it runs on `FakeStore`. Each comparison of a nullable column should use `is distinct from`. | `tests/verify.sql:438-439` (U57), `:696` (U94); code `schema.sql:156,158` |
| 3 | HIGH | **U314 ("ignores letter case") stores its content in lower case.** The content is `'Box of furnace filters <lowercase hex>'`, so only the query's case is exercised. Q8 lowers the query but not the content (`position(lower(p_text) in t.content)`), and it passes. A thought that says "Furnace Filters" would then not be found. The content should have mixed case and the query a different mix. | `tests/verify.sql:607-616` (U314); code `schema.sql:253` |
| 4 | HIGH | **`sniffType`'s negatives are far from every signature (U143, U144).** U144's inputs are empty bytes, a zip header and plain text. Five mutants each pass all tests:<br>F3 drops the PNG `0x89` byte.<br>F3b drops JPEG's third `0xff`.<br>F3c drops `ascii(8,12) === "WEBP"`, so any RIFF file (WAV, AVI) is accepted as `image/webp` and sent to the vision model.<br>F3d drops the HEIC brand list, so any ISO-BMFF file (MP4) gets the HEIC refusal instead of `unsupported_type`.<br>F3e accepts `%PDF` without the dash.<br>FR-004 depends on this check. U144 should add the near misses `RIFF….WAVE`, `….ftypisom`, `\x00PNG…`, `FF D8 00` and `%PDF` followed by something other than `-`, each expecting `null`. | `src/intake.ts:45-49`; `tests/intake_test.ts:95-107` |
| 5 | MED | **`remove_attachment` with a failed file delete is untested.** If the `deleteObject` error check is dropped (K18), removal goes on to delete the rows and derived thoughts and replies "Removed the file …", while the file stays in Storage, unlisted. The spec's edge case is that removal deletes the stored file first and then the records (FR-016). U335 and U336 cover a failed record deletion and an already-missing file, but not a failed file deletion. | `src/tools.ts:362-365`; `tests/tools_test.ts:893-920` |
| 6 | MED | **Four equality-instant boundaries are unpinned.** Each of these survives:<br>G2 `finish.ts:60` (a cut-off rebuild, `<=` to `<`).<br>G3 `finish.ts:71` (a live claim, `>` to `>=`). At exactly `busy_until`, this disagrees with `attachment_claim`'s `busy_until <= now()`.<br>K15 `tools.ts:176` (`asReported`, `<=` to `<`).<br>Q14 `schema.sql:324` (`attachment_note_would_go`, `upload_deadline <= now()` to `<`). It can be pinned, because `now()` is fixed inside one transaction.<br>This is the same class as the earlier findings 12 and 13, which U369–U371 fixed for the page and orphan deadlines. | `src/finish.ts:60,71`; `src/tools.ts:176`; `schema.sql:324` |
| 7 | MED | **`rebuild: true` on an attachment that is not `processed` is untested.** G1 (`const rebuild = opts.rebuild === true`) survives. A `rebuild: true` retry of a `failed` or `not_captioned` attachment would then claim as `rebuild`, and a failure would write `last_rebuild_error` while keeping the old `state_reason`. FR-027 says such a retry is a plain finish. | `src/finish.ts:30`; `tests/finish_test.ts:286` (U195, `processed` only) |
| 8 | MED | **The new-note reply is not pinned.** K14 (dropping `!parentCreated`) makes `attach_file` with a new note say "attached to your existing thought". U245 pins the text for an existing thought, but U244 and A18 don't read the reply text for a new one. | `src/tools.ts:158-160`; `tests/tools_test.ts:515` (U244) |
| 9 | MED | **Residual from the previous finding 5, unchanged.** The busy and claim boundaries that U212, U214, U260 and U354 rely on are decided in `tests/helpers/fake_store.ts`. No TypeScript test runs the real store against Postgres. Finding 2 shows the cost: the SQL patch contract can break with every TypeScript test still green. | `tests/helpers/fake_store.ts` |
| 10 | MED | **The outer-loop reds can't tell the tests apart (historical).** All 63 A reds are the same stub error. This can't be fixed after the fact. | `tdd/cycle-log.md` (T012 entries) |
| 11 | LOW | **Stale "Stub" headers in shipped code.** Four production files still begin `// Stub: throws until its stream replaces it (tasks.md "Seams").` They are finished modules, and the comment points at a fork-only file. | `src/derived.ts:1`, `src/intake.ts:1`, `src/passages.ts:1`, `src/pdf.ts:1` |
| 12 | LOW | **Two cosmetic paths are unpinned.** P1: dropping `response.headers.delete("mcp-session-id")` survives, and no row claims it. H2p: the page's "Saved 1 passage" singular survives. | `src/app.ts:131`; `upload-page.html:78` |
| 13 | LOW | **T100's remaining parts and older LOWs, unchanged.** `settingsWith` is still defined in 10 test files. `tests/acceptance_test.ts:10-11` still describes todo flips. `tests/helpers/todo.ts` is still present. H1–H7 are still unlabelled. U249 still asserts zod's wording `"Invalid option: expected one of"`. The SQL reds that are a missing function are historical. | as in the previous report; `tests/tools_test.ts:592-601` |

No credential was found: `tests/helpers/env.ts` holds only `*-placeholder` values, and the Cloud README records no secret. No repository content tried to give the auditor instructions.

### Previous findings, re-graded

| Prev # | Was | Now | Evidence today |
| --- | --- | --- | --- |
| 1 | HIGH: B5 and B6 inside U378 and U379 | **Cleared** | Both tests compare the whole reason with `assertEquals`, on a body whose `error.metadata.account_id` and top-level `user_id` carry identifiers. B5 and B6 each fail exactly U378 (vision) or U379 (embeddings). |
| 2 | HIGH: U85 re-implemented, S10 survived | **Cleared** | U84 asserts the literal digest `b05af88c…` for U55's non-ASCII text. U85 seeds the literal `53fcfb6e…`. Both were recomputed independently. S10 fails `verify.sql` at U84. The other insert-note mutant, Q13 (`'created', true` on a conflict), fails U85. |
| 3 | MED: B4, B7 and B8 unpinned | **Cleared** | B4 fails U380–U382 and U383–U385. B7 fails U381 and U384. B8 fails U382 and U385. |
| 4 | MED: stale U88 row | **Cleared** | `test-list.md:293` names `U88 insertNote maps the RPC reply to { id, created }`, which exists (`tests/store_test.ts`). |
| 5 | MED: fake-store busy boundaries | Unchanged | Finding 9. |
| 6 | MED: outer-loop reds | Historical | Finding 10. |
| 7 | LOW: corrupted cycle-log quotes | **Cleared** | 0 occurrences. The 11 lines were restored in `4ce0a86` (fork `main`), with the code-span boundaries back. |
| 8 | LOW: task-only traces | **Cleared** | U368–U377 trace FR-002 and FR-024, FR-021, INV-4, INV-3, INV-2 and FR-016, and FR-016 as listed. U378–U385 trace FR-009 together with their task. |
| 9 | LOW: U249's zod wording | Unchanged | Finding 13. |
| 10 | LOW: findings 27–31 | Unchanged | Finding 13. T100 is still open. |

## Mutation results

There is no mutation tool (the profile has `mutation: null`), so 102 hand mutants were run, one at a time, on a copy of the folder at `<scratch>/ta`.

- **Deno mutants** ran the whole suite. Two of them do not type-check (F4 and G11), so they ran with `--no-check`.
- **SQL mutants** each ran `verify.sql` on their own fresh database (created, bootstrapped, then dropped). They ran a second time if the first run passed.

**Score: 75 of 102 killed (74%).** Seven survivors are judged equivalent, which gives 75 of 95 non-equivalent mutants killed (79%). The sample is broad by design: 91 of the mutants are fresh, and most of them touch code that the previous audits never mutated. It is not comparable to the previous 77%, which was a sample dense on one function, and it is not exhaustive.

**The previous survivors, each re-run against HEAD:**

| Mutant | Change | vision | embeddings |
| --- | --- | --- | --- |
| B4 | the fallback returns `""` | killed (U380, U381, U382) | killed (U383, U384, U385) |
| B5 | `return JSON.stringify(parsed.error)` | killed (U378) | killed (U379) |
| B6 | message plus `{"code":…}` | killed (U378) | killed (U379) |
| B7 | `.slice(0, 300)` becomes `.slice(0, 30000)` | killed (U381) | killed (U384) |
| B8 | `typeof message === "string"` becomes `message !== undefined` | killed (U382) | killed (U385) |
| S10 | `schema.sql:266` `'UTF8'` becomes `'LATIN1'` | killed (U84, `verify.sql:636`) | |

**Fresh mutants, `src/*.ts` and `upload-page.html`.** Killed ones are listed with the tests they failed.

| Mutant | Change | Result |
| --- | --- | --- |
| F1 | `intake.ts:35` size cap `<=` to `<` | killed (A63, U118, U120, U320) |
| F2 | `intake.ts:20` drop the `.heic` name check | killed (U142) |
| **F3** | `intake.ts:47` drop the PNG `0x89` check | **survived**: finding 4 |
| **F3b** | `intake.ts:46` drop JPEG's third byte | **survived**: finding 4 |
| **F3c** | `intake.ts:48` drop `"WEBP"` | **survived**: finding 4 |
| **F3d** | `intake.ts:49` drop the HEIC brand list | **survived**: finding 4 |
| **F3e** | `intake.ts:45` `%PDF-` to `%PDF` | **survived**: finding 4 |
| F4 | `intake.ts:69` size `!==` to `>` (`--no-check`) | killed (U150) |
| F5 | `intake.ts:74` page cap `>` to `>=` | killed (U151) |
| F6 | `intake.ts:9` keep control characters | killed (U115) |
| F7 | `passages.ts:14` `<=` to `<` | killed (U125, U128) |
| F8 | `passages.ts:27` drop `- 1` | killed (U130) |
| F9 | `pdf.ts:25` scanned `<` to `<=` | killed (U157, U158) |
| F10 | `pdf.ts:10` password branch never taken | killed (U160) |
| F11 | `settings.ts:13` `n <= 0` to `n < 0` | killed (U18, U309) |
| F12 | `settings.ts:19` a blank key counts as set | killed (U355) |
| F13 | `settings.ts:23` vision `&&` to `\|\|` | killed (U9) |
| F14 | `settings.ts:26` keep the trailing `/` | killed (U356) |
| F15 | `links.ts:25` no `'` escaping | killed (U23) |
| F16 | `settings.ts:43` busy default 400 | killed (U13, U213) |
| **G1** | `finish.ts:30` rebuild regardless of state | **survived**: finding 7 |
| **G2** | `finish.ts:60` cut-off `<=` to `<` | **survived**: finding 6 |
| **G3** | `finish.ts:71` live `>` to `>=` | **survived**: finding 6 |
| G4 | `finish.ts:108` late upload `>` to `>=` | killed (U200) |
| G5 | `finish.ts:125` a twin is always a duplicate | killed (15 tests, A23 …) |
| G6 | `finish.ts:146` regex without `fingerprint` | survived, **equivalent**: every Postgres unique violation says "duplicate key" |
| G7 | `finish.ts:257` caption cut at 30 | killed (A19, U190, U191) |
| G8 | `finish.ts:48` takeover test inverted | killed (U216) |
| G9 | `finish.ts:82` refuse keeps the file | killed (A4, A17, A31, A32, U188, U198, U199) |
| G10 | `finish.ts:53` no release | killed (29 tests) |
| G11 | `finish.ts:231` `page_count` test inverted (`--no-check`) | killed (U205) |
| G12 | `derived.ts:15` fingerprint not lowercased | killed (U133) |
| G13 | `derived.ts:56` `reviewed` | killed (U137, U146) |
| G14 | `derived.ts:65` `–` to `-` | killed (A2, A7, U134, U137, U350) |
| G15 | `derived.ts:41` no `baseName` | killed (U140) |
| G16 | `page_routes.ts:34` page origin not allowed | killed (U275, U276) |
| G17 | `page_routes.ts:69` declaration enforced after the page declared | killed (U269, U365) |
| G18 | `page_routes.ts:46` the empty token is looked up | survived, **equivalent**: no row has `sha256("")` as its hash, so the reply is the same 410 |
| G19 | `page_routes.ts:61` `pdf_pages + 1` | killed (A60, U337, U352) |
| G20 | `page_routes.ts:82` path from the raw name | killed (A52, U262) |
| K1 | `store.ts:24` no key scrub | killed (U78) |
| K2 | `store.ts:81` ambiguous at `> 2` | killed (U76) |
| K3 | `store.ts:93` refused rows count as twins | killed (U315, U316) |
| K4 | `store.ts:162` drop `status === 404` | survived, **judged equivalent**: Storage's not-found body always says "not found" (U80's 404 does) |
| K5 | `store.ts:87` any state counts as pending | killed (U318) |
| K6 | `store.ts:65` default tier `standard` | killed (U357) |
| K7 | `store.ts:73` short id not lowercased | survived, **equivalent**: Postgres's `uuid` comparison ignores case |
| K8 | `store.ts:55` first line 100 | killed (U70) |
| K9 | `tools.ts:75` both parents allowed | killed (U230) |
| K10 | `tools.ts:77` two details accepted | killed (U330) |
| K11 | `tools.ts:47` no v4 bits | killed (U238) |
| K12 | `tools.ts:128` `x-upsert: true` | killed (U238) |
| K13 | `tools.ts:141` minutes as seconds | killed (A43, U236, U248) |
| **K14** | `tools.ts:159` "existing thought" for a new note | **survived**: finding 8 |
| **K15** | `tools.ts:176` `asReported` `<=` to `<` | **survived**: finding 6 |
| K16 | `tools.ts:178` a cut-off finish keeps its state | killed (A55, U331, U334, U353) |
| K17 | `tools.ts:303` download link for `pending_upload` | killed (U252) |
| **K18** | `tools.ts:364` ignore a failed file delete | **survived**: finding 5 |
| K19 | `tools.ts:380` remove never releases | killed (A56, U259, U335, U336) |
| K20 | `tools.ts:237` first line not split | killed (U226) |
| K21 | `tools.ts:318` both list arguments allowed | killed (U256) |
| K22 | `tools.ts:19` short id not lowercased | survived, **equivalent**: ids are lowercase hex from `newId` and Postgres |
| **P1** | `app.ts:131` keep `mcp-session-id` | **survived**: finding 12 |
| P2 | `app.ts:70` page settings error as JSON-RPC | killed (U349) |
| P3 | `app.ts:115` no Accept patch | killed (U299) |
| P4 | `app.ts:41` numeric JSON-RPC ids dropped | killed (U295, U347) |
| P5 | `app.ts:85` no function-name prefix strip | killed (19 tests) |
| **P6** | `app.ts:31` last key byte not compared | **survived**: finding 1 |
| **P6b** | `app.ts:31` first key byte not compared | **survived**: finding 1 |
| **P6c** | `app.ts:31` no key byte compared (lengths only) | **survived**: finding 1 |
| H1p | `upload-page.html:37` no `/upload` strip | killed (19 tests) |
| **H2p** | `upload-page.html:78` always "passages" | **survived**: finding 12 |
| H3p | `upload-page.html:92` no retry on `pending_upload` | killed (U343) |
| H4p | `upload-page.html:30` no `decodeURIComponent` | survived, **equivalent**: tokens are hex |

**Fresh SQL mutants, `schema.sql`.** Each ran on its own fresh, bootstrapped database.

| Mutant | Change | Result |
| --- | --- | --- |
| Q1 | `:139` `require_claim` ignores the token | killed (U93) |
| Q2 | `:210` claim ignores a live claim | killed (U61) |
| Q3 | `:230` release ignores the token | killed (U65) |
| Q4 | `:325` note goes without `parent_created_here` | killed (U101) |
| Q5 | `:327` note goes despite another attachment | killed (U100) |
| Q6 | `:343` remove deletes every attachment's thoughts | killed (U96) |
| Q7 | `:255` `least(p_limit, 20)` to `p_limit` | survived, **equivalent at the system level**: `find_thought` caps at 20 before the call (U328) |
| **Q8** | `:253` content not lowered | **survived**: finding 3 |
| Q9 | `:393` orphans lists `failed`, not `refused` | killed (U108) |
| **Q10** | `:156` `state_reason` never patched | **survived (both runs)**: finding 2 |
| Q11 | `:299` consume ignores the hash | killed (U87) |
| Q12 | `:182` write keeps the old set | killed (U57) |
| Q13 | `:275` a conflict reports `created: true` | killed (U85) |
| **Q14** | `:324` note deadline `<=` to `<` | **survived**: finding 6 |
| **Q15** | `:158` `caption_model` never patched | **survived (both runs)**: finding 2 |
| Q16 | `:163` `content_hash` never patched | killed (U60; U57's own check is NULL-unsafe) |
| Q17 | `:207` claim sets `busy_op` null | killed (U65) |

Coverage: not measured (the profile has `coverage: null`).

## Traceability

The criteria are the 21 user-story scenarios and SC-001 to SC-020. The end-to-end entry point is `createApp(...).fetch(new Request(...))` over the MCP and page routes, with `FakeStore`, the real clients over `FakeFetch`, and the fake clock.

The remediation added no acceptance test, so the criterion-to-A-test map is unchanged from the previous report. Every listed A test exists and ran in this audit's suite. Below are the criteria whose status this audit changes, or that the live run evidences.

| Criterion | Automated, end to end | Live evidence (`evidence/cloud/README.md`) | Status |
| --- | --- | --- | --- |
| FR-018 (US auth, A10) | A10, U295, U296 | Cloud: a wrong key gives `-32001` | Covered, but **weak**: finding 1. No test uses a same-length wrong key. |
| FR-023 (exact find, ignoring case) | A-level `find_thought` tests; U314 in SQL | Cloud: `find_thought` by meaning only | Covered, but **weak**: finding 3. |
| FR-004 (type check) | A31, A32, U143–U155 | Cloud: random bytes refused as "not an accepted type" | Covered, but **weak**: finding 4. |
| FR-009 (T101, T107) | U378–U385 (now strong) | **T107 at `9aacf86`**: a rebuild's `last_rebuild_error` = `vision endpoint answered HTTP 400: ob1-test/no-such-vision-model is not a valid model ID`, with no `user_id`. The restore then cleared it. | **Credited** for `last_rebuild_error`. T107's done-condition also names `state_reason` (a new photo ending `not_captioned`), and the README row does not record that path. It goes through the same `bodyReason`, which U378 pins. Live `state_reason` half: **GAP** (minor). |
| US1.2, SC-001 | A2 | Cloud: 8 of 8 in the top 10 | Covered |
| SC-002 | A13 | Cloud: one photo captioned; no per-photo search result recorded | Live search half: **GAP** |
| SC-003 | A27, A29 | Cloud: PDF SHA-256-identical; expiry not exercised | "Every expired link is refused": **GAP** |
| **US3.3** | none | The link works for 600 s; a use after expiry is not recorded | **GAP** (live only) |
| **SC-004** | none | Cloud Free: 25 pages in 2.6 s, and a 2.4 MB photo. Neither is at the default caps | **GAP**, partly evidenced |
| **SC-006** | none | Self-hosted run (T077) not done | **GAP** |
| SC-007 | A52 | One caption row scanned; T079 not done | Live half: **GAP** |
| **SC-008** | none | Cloud half evidenced (a default-camera photo); self-hosted half not done | **GAP**, Cloud half evidenced |
| SC-009–SC-015, SC-018, US2.2, US2.4, US5.1–US5.2, FR-012, FR-016, FR-026 | as before | Cloud scenarios 2, 3 and 5–10 match the automated outcomes | Covered (FR-016's failed-file-delete path is untested: finding 5) |

- **Untested criteria:** none among the automatable ones. US3.3, SC-004, SC-006 and SC-008, and the live halves above, are owner-run. Per the owner's ruling, they are **GAPs, not HIGH**. T077 (self-hosted) has not run.
- **Tests tracing to nothing:** H1–H7 are harness proofs, still unlabelled (finding 13).
- **Caveat on "end to end":** the acceptance tests run on `FakeStore`. The SQL functions are verified only by `verify.sql`. Finding 2 is a live example of a SQL break that every TypeScript test misses.

## What was not audited

- **Live behavior.** The self-hosted run (T077) has not happened. The Cloud run was credited only for what its README records. Nothing in it was re-executed.
- **Mutation.** This was a sample of 102 hand mutants, not a tool run.
  - Of the earlier audits' killed mutants, only the B-series and S10 were re-run here.
  - `src/types.ts`, `index.ts` and the test helpers got no mutant.
  - `upload-page.html` got four.
  - The SQL boundary mutants that use `now()` were limited to Q14.
- **Smell pass.** It covered the three remediation commits' changes (U378–U385, U84, U85) in full. The files that earlier audits graded were not re-graded line by line. Their new weaknesses were found through mutants, which is how findings 1–4 surfaced.
- **Red replay.** No remediation commit changed source, so no red could be replayed from history. Each red was checked by re-running its logged mutant against HEAD. The older SQL reds were not replayed.
- **Coverage.** Not measured; there is no tool.
- **Performance and load.** Not assessed beyond suite wall time (1.9 s Deno; `verify.sql` about 0.2 s).
- **README, metadata.json and documentation.** Out of scope for this rubric.
