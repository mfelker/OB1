---
feature: 007-thought-attachments
verdict: PASS_WITH_GAPS # integrator addendum (owner rule 2026-11-27): the final audit's one HIGH (N21) was killed by U394; MED/LOW survivors are recorded follow-ups T118–T120 (plan Complexity Tracking). The audit itself graded FAIL before U394.
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # fork override of spec-kit-tdd 2.0.1; lane is "upstream-bound feature", so the staged-PR S1–S4 rules do not apply and the base classes are used
verified_at: a6168ba1 # worktree .worktrees/contrib-thought-attachments, branch contrib/mfelker/thought-attachments; final scoped re-audit of 293dee5..HEAD (8 commits, test files only) on top of the full range upstream/main..HEAD
behaviors: 454 # DONE rows (391 U + 63 A); U14 DROPPED; L1–L7 live rows not on the loop
proven: 300 # unchanged from the previous audits
likely: 154 # 146 from the previous audit + U386–U393 (added against unchanged code; each red is a recorded mutant, re-run here)
test_after: 0
no_test: 0
high_smells: 1 # finding 1: a surviving mutant inside DONE U262 (fresh mutant N21)
criteria_total: 41 # US1.1–US5.4 (21) + SC-001–SC-020 (20)
criteria_covered: 37 # end to end through createApp(...).fetch; 4 are live-only GAPs (US3.3, SC-004, SC-006, SC-008)
mutation_score: 84 # 46 of 55 hand mutants killed (85% of the 54 judged non-equivalent); scope: the 18 previous survivors (all killed) + 37 fresh mutants (28 Deno over src/*.ts and upload-page.html, 9 SQL on schema.sql); no tool (profile mutation: null)
mutants_survived: 9 # 1 equivalent (N10); 1 inside a DONE behavior (HIGH, finding 1); 3 on unpinned SQL paths (MED, findings 2–3); 4 minor (LOW, finding 6)
suite: "Deno 402 passed, 0 failed, 0 ignored, 2.6 s wall (Deno 2.9.8); verify.sql passed twice on a fresh bootstrapped database (rc007_fresh2), exit 0 both runs, no U50 skip notice; fork-ci strict preview: pass (deno pass, sql pass)"
---

# TDD Verification: Thought attachments (files linked to thoughts)

**Verdict: FAIL.** The most decisive reason is one fresh surviving mutant inside the DONE behavior U262 (FR-001, FR-002). If `src/page_routes.ts:78` drops `row.expected_kind !== null &&`, a phone upload started with no expected kind refuses every PDF pick ("The assistant expected a photo"), and all 402 tests still pass. U262 claims that `/page/start` with a valid token and no declaration records the picked type and returns a link. Its row is seeded with no expected kind, but every test of `/page/start` that succeeds picks a photo. No test anywhere picks a PDF on the page, except U267's mismatch case.

The T108–T115 remediation is real, and it is complete for what it targeted:

- All 18 previous survivors are killed, each by the test its task named (table below): P6, P6b, P6c, Q10, Q15, Q8, F3–F3e, K18, G1, G2, G3, K15, Q14 and K14.
- All four previous HIGH findings and the four previous MED mutant findings (5–8) are cleared.
- No existing test was weakened. The eight commits change test files only, and `verify.sql`'s sweep replaced 27 `<>` comparisons with `is distinct from`, with no loosening.

The new FAIL comes from the fresh sample of 37 mutants, all on code that no earlier audit mutated. Apart from finding 1, the fresh survivors are MED or LOW items (findings 2–6), which the owner may record as follow-ups.

The live-only criteria are GAPs, per the owner's rule, not HIGH. `plan.md` Complexity Tracking records three deviations, and none of them is a test exception, so the verdict is the same with or without them.

This re-audit was run cold. Its author wrote none of the tests. The claims in `tasks.md`, the test list, `cycle-log.md` and `cycle-log.d/*.md` were checked against history and the files. Every mutant was applied to a copy of the folder at `<scratch>/reaudit007c/ta`, one at a time, by a script that:

- confirmed the edit (the old text's count dropped, or the new text was present, plus a `grep -c` and the `diff`);
- ran the suite (Deno) or `verify.sql` twice on its own fresh, bootstrapped and then dropped database (SQL);
- restored the file and checked it byte for byte against the worktree with `filecmp`.

After the last mutant, `diff -r` between the copy and the worktree was empty. The worktree was never edited. One `grep -c` printed nothing (N7, because its pattern starts with `-T`, which grep read as an option). The `diff` and the count check confirmed that edit.

## Previous audits, in brief

- **`ff4bfc1`: FAIL.** 1 survivor inside a DONE behavior, 10 groups of HIGH smells. Remediation T086–T099, T101.
- **`9aacf86`: FAIL.** B5 and B6 survived inside U378 and U379, and U85 re-implemented the fingerprint (S10). Remediation T102–T107.
- **`293dee5`: FAIL.** Four HIGH findings: P6–P6c (same-length key), Q10 and Q15 (NULL-unsafe SQL asserts), Q8 (case), F3–F3e (sniff near misses). Four MED findings: K18, G2, G3, K15 and Q14 (boundaries), G1, K14. Score 75 of 102. Remediation T108–T115; T116 (LOW) left open.

## How the evidence was gathered

- **Suite.** Deno: 402 passed, 0 failed, 0 ignored, 2.6 s wall. `verify.sql` twice on a fresh database bootstrapped from `.fork/ci/sql/bootstrap.sql`: exit 0 both times, and no `SKIPPED` notice. Fork-ci strict preview: `pass` ("all tests passed").
- **History of the remediation (`293dee5..HEAD`).** Eight commits, linear, each changing test files only:
  - `a272273` (T108): U386, U387 in `tests/app_test.ts`.
  - `2c81b5b` (T109): `verify.sql`, U57, U94 and a file-wide sweep.
  - `6965a0e` (T110): U314.
  - `1016627` (T111): U144.
  - `6f923a9` (T112): U388.
  - `4915667` (T113): U389–U392.
  - `8856099` (T114): U393.
  - `a6168ba` (T115): U244.

  No source file changed after `9aacf86`.
- **Existing tests weakened?** Every removed line in `293dee5..HEAD` was read. None was weakened:
  - The `verify.sql` sweep turned each `<>` on a nullable value into `is distinct from`. U61 also gained `row_.busy_until is null or`.
  - The remaining `<>` in `verify.sql` (lines 283–285, 332–338, 369, 386, 436, 464, 591, 668, 738, 757–758, 775 and 860) all compare `count(*)` results, which are never NULL.
  - U314's content and query changed from lower-case content to mixed case on both sides. That is stronger.

  There is no skip, `only` or `ignore`, and no threshold or exclusion change.
- **Red replay.** No remediation commit changed source, so each red is a recorded mutant against unchanged code. The audit re-ran every one at HEAD (table below). Each fails exactly the test the cycle log names (`tdd/cycle-log.md:2582-2710`). The log's own correction stands: K18 was a missing test, not a production bug.
- **tasks.md versus the test list.** T108–T115 are ticked, and their rows (U386–U393, plus U57, U94, U314, U144 and U244) are DONE. T100 and T116 are unticked, correctly: `grep -l 'Stub: throws' src` still lists `derived.ts`, `intake.ts`, `passages.ts` and `pdf.ts`. No ticked task lacks evidence.
- **Test-list references (scope item 4).** A script resolved all 454 DONE rows against the `Deno.test` titles and the `-- Uxx` headers in `verify.sql`. 451 resolve literally. The other three:
  - **U367** names "the U34 block, column list". That block exists.
  - **U386 and U387** are generated by the loop at `tests/app_test.ts:77`, so their row titles are paraphrases, not literal titles. The generated tests are `U386 a same-length key differing only in the first, a middle or the last byte (header) …` and `U387 … (query) …`. Each was run alone with `--filter "/^U386 /"` and `--filter "/^U387 /"`, and passed (1 passed, 401 filtered out). LOW (finding 7).

  U392 is the `-- U392` block at `tests/verify.sql:809`, and it ran: Q14 fails there. U388–U391 and U393 also ran alone, and passed.

## Test-first evidence

| Class | Count | Behaviors | Evidence |
| --- | --- | --- | --- |
| PROVEN | 300 | as in the previous audits | Unchanged. |
| LIKELY | 146 | as in the previous audits | Unchanged. U57, U94, U314, U144 and U244 were strengthened, and they keep their earlier class. Each one's recorded mutant red (Q15, Q10, Q8, F3–F3e, K14) was re-run here. |
| LIKELY | 8 | U386, U387, U388, U389, U390, U391, U392, U393 | Added against unchanged code, so the first run passed. Each red is a recorded mutant (P6–P6c, K18, G2, G3, K15, Q14, G1), and each was re-run here. |
| TEST_AFTER | 0 | | |
| NO_TEST | 0 | | Every DONE row's test exists and runs. |

## Findings

Ordered by severity. Paths are relative to `integrations/thought-attachments/`.

### (a) HIGH

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | HIGH | **A phone PDF upload with no expected kind is untested, so a surviving mutant sits inside U262.** N21 drops `row.expected_kind !== null &&` from the kind check. With no expected kind, `(type === "application/pdf") !== (null === "pdf")` is then true for every PDF, and `/page/start` answers 400 `wrong_type`, "The assistant expected a photo (JPEG, PNG or WebP), but the picked file is application/pdf." All 402 tests pass. A throwaway probe on the scratch copy confirmed it: the same request returns 200 on the real code and 400 under N21. FR-001 makes the expected kind optional for a phone upload, so the mutant would break phone PDF uploads for every attach call that doesn't name a kind. U262 seeds a row with no expected kind but picks only `receipt.jpg`. U267 picks a PDF only against `expected_kind: "photo"`. A14, A60 and the other A tests attach with `expected_kind: "photo"`. This is graded the way the previous audit graded U314, U295 and U144: the row's claim isn't limited to photos, and the mutant breaks it for an input the test never sends. | `src/page_routes.ts:78`; `tests/page_routes_test.ts:79-88` (U262), `:146-155` (U267); `test-list.md:561` |

### (b) New MED and LOW items (owner: record as follow-ups)

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 2 | MED | **The SQL claim boundaries at exactly `busy_until` are unpinned.** S1 (`attachment_require_claim`, `busy_until <= now()` to `<`) and S2 (`attachment_claim`, `busy_until <= now()` to `<`) each pass `verify.sql` twice on a fresh database. U54 uses a claim whose `busy_until` "has passed", and U62 claims "after" `busy_until`. Neither sets `busy_until = now()`, though `now()` is fixed inside one transaction, as U392 shows. The TypeScript side of this boundary is now pinned (U389–U391 on `FakeStore`, G3 on `finish.ts:71`). The real store's side is not, which is the earlier finding 6 class applied to the two remaining SQL comparisons. | `schema.sql:139`, `:210`; `tests/verify.sql` U54, U62 |
| 3 | MED | **The SQL exact-text find's 120-character first-line cut is unpinned.** S8 (`left(…, 120)` to `100`) survives. U224 and U225 pin 120 at the tool layer on `FakeStore` only, and U67 and U68 seed short lines. In production the mutant would return 100-character first lines, which contradicts U224. This is the residual `FakeStore` versus SQL gap (finding 4), with a concrete survivor. | `schema.sql:251`; `tests/verify.sql` U67 |
| 4 | MED | **Residual, unchanged: the busy and claim decisions the TypeScript tests rely on live in `tests/helpers/fake_store.ts`.** No TypeScript test runs the real store against Postgres. Findings 2 and 3 are this gap's survivors in this audit. | `tests/helpers/fake_store.ts` |
| 5 | MED | **Historical, unchanged: the 63 outer-loop A reds are the same stub error.** This can't be fixed after the fact. | `tdd/cycle-log.md` (T012 entries) |
| 6 | LOW | **Four minor fresh survivors.**<br>N15: `finish.ts:155` `!==` to `<`. Vectors longer than the brain's dimension skip the feature's own check. The store then refuses the write with `expected 1536 dimensions, not N`, so the finish still ends `failed` with both lengths named and no derived thought, which is U210's claim. Only the message wording differs, and U210's comment says the feature's own check should fire. Judged near-equivalent; only shorter vectors are tested (A39, U210).<br>N12: `intake.ts:38` adds the PDF background-processing note to a photo's size refusal. U153 doesn't claim the note is absent for photos, and the note itself says "for larger PDFs".<br>N24: `store.ts:25` returns `""` instead of `"database error"` for an empty message. No row claims the fallback.<br>S5: `schema.sql:254` `desc` to `asc`. No contract or row fixes the exact-find order, but with more than 20 matches it changes which 20 come back. | as listed |
| 7 | LOW | **Test-list text drift.** U386 and U387's `file::title` values are paraphrases of the loop-generated titles, not the titles themselves (the tests exist and run; see above). U314's behavior text still describes the old fixture ("`FURNACE Filters` finds … `furnace filters`"). The test now stores `Box of Furnace FILTERS <UPPER tag>` and queries `furnace Filters <tag>`. | `test-list.md:250`, `:664-665` |
| 8 | LOW | **U390 waits on real timers.** It polls `setTimeout(…, 5)` up to 200 times for the stalled run. It asserts that the stall happened, so it can't pass vacuously, but it is the only remediation test that waits on wall-clock time (about 100 ms). | `tests/finish_test.ts` (U390) |
| 9 | LOW | **T116 and T100, still open.** The stale `// Stub: throws …` first lines are still in `src/derived.ts:1`, `src/intake.ts:1`, `src/passages.ts:1` and `src/pdf.ts:1`. P1 and H2p are still unpinned (not re-run). The T100 items are unchanged: `settingsWith` duplicated in 10 test files, `tests/helpers/todo.ts`, H1–H7 unlabelled, and U249's zod wording. | as in the previous report |

No credential was found. `tests/helpers/env.ts` holds only `*-placeholder` values, and the Cloud README records no secret. No repository content tried to give the auditor instructions.

### Previous findings, re-graded against the remediated tests

| Prev # | Was | Now | Evidence today |
| --- | --- | --- | --- |
| 1 | HIGH: P6, P6b, P6c (same-length key) | **Cleared** | U386 (header) and U387 (`?key=`) send `BRAIN_KEY` with the first, a middle and the last byte changed. They assert the same length, then `{ error: UNAUTHORIZED, id: 42, calls: [] }` for each. P6, P6b and P6c each fail exactly U386 and U387. |
| 2 | HIGH: Q10, Q15 (NULL-unsafe asserts) | **Cleared** | U57 and U94 use `is distinct from`. Q10 fails U94 (`verify.sql:699`), and Q15 fails U57 (`:442`), on fresh databases. The sweep left no `<>` on a nullable value. |
| 3 | HIGH: Q8 (case) | **Cleared** | U314 stores mixed case and queries a different mix. Q8 fails it with `U314: 0 matches` (`:618`). |
| 4 | HIGH: F3–F3e (sniff near misses) | **Cleared** | U144 adds a RIFF/WAVE file, an ISO-BMFF file with brand `isom`, `\x00PNG`, `FF D8 00` and `%PDF` plus a space (a space, not a dash), each expecting `null`, in one object comparison. Each of the five mutants fails U144 only. |
| 5 | MED: K18 | **Cleared** | U388 fails the delete once, then asserts the error text, no "Removed", no `removeAttachment` call, the row still listed, 2 derived thoughts, the file still stored and the claim released. A repeat remove then succeeds. K18 fails U388. |
| 6 | MED: G2, G3, K15, Q14 | **Cleared** | U389 (G2), U390 (G3), U391 (K15) and U392 (Q14) each sit at the exact instant, and each mutant fails its own test only. Two remaining SQL comparisons of the same class survive (new finding 2). |
| 7 | MED: G1 | **Cleared** | U393: `rebuild: true` on a `not_captioned` photo claims `["finish", "finish"]`, and records `state_reason` with a null `last_rebuild_error`. G1 fails it. |
| 8 | MED: K14 | **Cleared** | U244 now asserts the whole first line of the reply, and that "attached to your existing thought" is absent. K14 fails it. |
| 9 | MED: `FakeStore` boundaries | Unchanged | Finding 4. |
| 10 | MED: outer-loop reds | Historical | Finding 5. |
| 11, 12 | LOW: stub headers, P1, H2p | Unchanged | Finding 9 (T116 open). |
| 13 | LOW: T100 items | Unchanged | Finding 9. |

## Mutation results

There is no mutation tool (the profile has `mutation: null`), so these are hand mutants. Deno mutants ran the whole suite; N13 ran with `--no-check`. Each SQL mutant ran `verify.sql` on its own fresh, bootstrapped database (`rc007_<id>`, dropped afterwards), and ran a second time if the first run passed.

**Score: 46 of 55 killed (84%).** One survivor (N10) is equivalent, which gives 46 of 54 non-equivalent mutants killed (85%). The previous survivors account for 18 of the 55 and were all killed. The fresh sample alone scores 28 of 37 (28 of 36 non-equivalent). It is a sample, not exhaustive, and it isn't comparable to earlier scores, which came from different samples.

**Previous survivors, each re-run at HEAD (scope item 1):**

| Mutant | Change | Result (failing tests) |
| --- | --- | --- |
| P6 | `app.ts:31` loop to `b.length - 1` | killed (U386, U387) |
| P6b | `app.ts:31` loop from `1` | killed (U386, U387) |
| P6c | `app.ts:31` `diff \|= ((a[i] ?? 0) ^ b[i]) & 0` | killed (U386, U387) |
| Q10 | `schema.sql:156` `state_reason = t.state_reason` | killed (U94, `verify.sql:699`) |
| Q15 | `schema.sql:158` `caption_model = t.caption_model` | killed (U57, `verify.sql:442`) |
| Q8 | `schema.sql:253` `position(lower(p_text) in t.content)` | killed (U314, `verify.sql:618`) |
| F3 | `intake.ts:47` drop `bytes[0] === 0x89` | killed (U144) |
| F3b | `intake.ts:46` drop `bytes[2] === 0xff` | killed (U144) |
| F3c | `intake.ts:48` drop `"WEBP"` | killed (U144) |
| F3d | `intake.ts:49` drop the HEIC brand list | killed (U144) |
| F3e | `intake.ts:45` `%PDF-` to `%PDF` | killed (U144) |
| K18 | `tools.ts:364` drop the `deleteObject` error check | killed (U388) |
| G1 | `finish.ts:30` rebuild regardless of state | killed (U393) |
| G2 | `finish.ts:60` `<=` to `<` | killed (U389) |
| G3 | `finish.ts:71` `>` to `>=` | killed (U390) |
| K15 | `tools.ts:176` `<=` to `<` | killed (U391) |
| Q14 | `schema.sql:324` `upload_deadline <= now()` to `<` | killed (U392, `verify.sql:816`) |
| K14 | `tools.ts:159` drop `!parentCreated` | killed (U244) |

**Fresh mutants, `src/*.ts` and `upload-page.html` (scope item 3).**

| Mutant | Change | Result |
| --- | --- | --- |
| N1 | `vision.ts:16` no key redaction | killed (U181) |
| N2 | `vision.ts:32` no `authorization` header | killed (U175) |
| N3 | `vision.ts:44` data URL always `image/jpeg` | killed (U173) |
| N4 | `embeddings.ts:53` no vector-count check | killed (U169) |
| N5 | `embeddings.ts:66` batch size + 1 | killed (U163, U164, U165) |
| N6 | `embeddings.ts:11` no key redaction | killed (U171) |
| N7 | `links.ts:20` file path not shell-quoted | killed (U23, U238) |
| N8 | `derived.ts:51` `input_hash: null` | killed (U135, U184) |
| N9 | `derived.ts:53` tier always `personal` | killed (U139) |
| N10 | `passages.ts:28` `>` to `>=` | survived, **equivalent**: at exactly `room` characters the piece is pushed one step earlier with the same text and pages, and the empty remainder is never pushed |
| N11 | `pdf.ts:24` whitespace counted | killed (U158) |
| **N12** | `intake.ts:38` background note on every size refusal | **survived**: finding 6 (LOW) |
| N13 | `intake.ts:66` actual-versus-declared type check off (`--no-check`) | killed (A29, A35, A52, U149, U198) |
| N14 | `finish.ts:94` `>=` to `>` (expired upload wording) | killed (U371) |
| **N15** | `finish.ts:155` `!==` to `<` | **survived**, near-equivalent: finding 6 (LOW) |
| N16 | `finish.ts:197` no `page_count` in the PDF outcome | killed (A1, U182, U187) |
| N17 | `finish.ts:190` PDF success keeps the old `state_reason` | killed (U206, U211) |
| N18 | `finish.ts:251` photo success keeps `last_rebuild_error` | killed (A58, U326) |
| N19 | `page_routes.ts:49` deadline `>=` to `>` | killed (U369) |
| N20 | `page_routes.ts:103` token consumed on `pending_upload` | killed (A61, U340) |
| **N21** | `page_routes.ts:78` drop `row.expected_kind !== null &&` | **survived**: finding 1 (HIGH) |
| N22 | `tools.ts:227` no cap of 20 | killed (U328) |
| N23 | `tools.ts:303` download link for `refused` | killed (U253) |
| **N24** | `store.ts:25` no `"database error"` fallback | **survived**: finding 6 (LOW) |
| N25 | `app.ts:41` numeric JSON-RPC ids dropped | killed (U295, U347, U386, U387) |
| N26 | `upload-page.html:121` refusal shown without its message | killed (U286) |
| N27 | `upload-page.html:81` `not_captioned` shown as "Failed" | killed (U289) |
| N28 | `upload-page.html:70` a failed `PUT` goes on to finish | killed (U363) |

**Fresh SQL mutants, `schema.sql` (scope item 3).**

| Mutant | Change | Result |
| --- | --- | --- |
| **S1** | `:139` `require_claim` `busy_until <= now()` to `<` | **survived (both runs)**: finding 2 |
| **S2** | `:210` `attachment_claim` `busy_until <= now()` to `<` | **survived (both runs)**: finding 2 |
| S3 | `:187` write-derived fingerprint not lowered | killed (U55, `verify.sql:403`) |
| S4 | `:189` no `attachment_id` in derived metadata | killed (U53, `verify.sql:370`) |
| **S5** | `:254` exact find oldest first | **survived (both runs)**: finding 6 |
| S6 | `:298` consume leaves the hash | killed (U87, `verify.sql:685`) |
| S7 | `:164` `processed_at` never patched | killed (U57, `verify.sql:442`) |
| **S8** | `:251` first line cut at 100 | **survived (both runs)**: finding 3 |
| S9 | `:100` the unique pair index covers refused rows | killed (`verify.sql:205`, a duplicate-key error on a refused twin) |

Coverage: not measured (the profile has `coverage: null`).

## Traceability

The criteria are the 21 user-story scenarios and SC-001 to SC-020. The end-to-end entry point is `createApp(...).fetch(new Request(...))` over the MCP and page routes, with `FakeStore`, the real clients over `FakeFetch`, and the fake clock. The remediation added no acceptance test, so the criterion-to-A-test map is unchanged from the previous report. Every listed A test exists and ran. Only the criteria whose status this audit changes, or that the live run evidences, are shown.

| Criterion | Automated, end to end | Live evidence (`evidence/cloud/README.md`) | Status |
| --- | --- | --- | --- |
| FR-018 (A10) | A10, U295, U296, **U386, U387** | Cloud: a wrong key gives `-32001` | Covered, now **strong** (previous finding 1 cleared) |
| FR-023 (exact find, case) | A-level `find_thought` tests; U314 in SQL | Cloud: `find_thought` by meaning | Covered, now strong for case. The SQL 120-character cut is weak (finding 3). |
| FR-004 (type check) | A31, A32, U143–U155 | Cloud scenario 6 | Covered, now strong (U144 near misses) |
| FR-016 (remove) | A56, U335, U336, **U388** | Cloud scenario 10 | Covered, including a failed file delete |
| FR-001, FR-002 (phone upload, optional expected kind) | A14, A60, U262, U267 | Cloud: a phone photo only | Covered for photos. A PDF picked on the page with no expected kind is **untested** (finding 1). |
| FR-009 (T101, T107) | U378–U385 | T107: `last_rebuild_error` with no `user_id` | Credited. The live `state_reason` half: **GAP** (minor, unchanged). |
| SC-017, FR-021 | A43, A44, U369–U371 | **Scenario 9**: an expired phone attachment listed `upload_expired`, and the spent page token gets `410` | Covered, with live evidence |
| US1.2, SC-001 | A2 | 8 of 8 in the top 10 | Covered |
| SC-002 | A13 | One photo captioned; no per-photo search recorded | Live search half: **GAP** |
| SC-003 | A27, A29 | PDF SHA-256-identical; the download link's expiry not exercised | Download-expiry half: **GAP** |
| **US3.3** | none | The link works for 600 s; a use after expiry is not recorded | **GAP** (live only) |
| **SC-004** | none | Cloud Free: 25 pages in 2.6 s; not at the default caps | **GAP**, partly evidenced |
| **SC-006** | none | The self-hosted run (T077) is pending | **GAP** |
| SC-007 | A52 | One caption row scanned; T079 not done | Live half: **GAP** |
| **SC-008** | none | Cloud half evidenced (a default-camera photo); self-hosted half pending | **GAP**, Cloud half evidenced |
| Others (SC-009–SC-015, SC-018, US2.2, US2.4, US5.1–US5.2, FR-012, FR-026) | as before | Cloud scenarios 1–8 and 10, and T107, match the automated outcomes. Scenario 11 is N/A on Cloud. | Covered |

- **Untested criteria:** none among the automatable ones. US3.3, SC-004, SC-006 and SC-008, and the live halves above, are owner-run **GAPs**, not HIGH, per the owner's rule. T077 (self-hosted) is pending.
- **Tests tracing to nothing:** H1–H7, which are harness proofs and still unlabelled (finding 9).
- **Caveat on "end to end":** the acceptance tests run on `FakeStore`, and the SQL functions are verified only by `verify.sql`. Findings 2 and 3 are SQL survivors that no TypeScript test can see.

## What was not audited

- **Live behavior.** The Cloud run was credited only for what its README records. Nothing in it was re-executed. The self-hosted run (T077) is pending.
- **Mutation.** This was a scoped sample: the 18 previous survivors and 37 fresh mutants.
  - The earlier audits' killed mutants were not re-run.
  - `src/types.ts`, `index.ts` and the test helpers got no mutant.
  - `upload-page.html` got three fresh mutants.
  - P1 and H2p (LOW, T116) were not re-run.
- **Smell pass.** Only the eight remediation commits' test changes were read line by line: U386, U387, U388–U393, U144, U244, U314 and the `verify.sql` sweep. Files graded by earlier audits were not re-graded. Their weaknesses were looked for through mutants.
- **Red replay.** No remediation commit changed source. Each red was checked by re-running its logged mutant against HEAD. The older SQL reds were not replayed.
- **Coverage.** Not measured; there is no tool.
- **Performance and load.** Not assessed beyond suite wall time (2.6 s Deno; `verify.sql` well under 1 s).
- **README, metadata.json and documentation.** Out of scope for this rubric.

## Integrator addendum (after this audit, at `4044fdeb`)

- **T117 is done.** U394 kills N21. The red was recorded under the mutant and the green on the restored code; suite 403 passed (cycle log, "Cycle U394").
- **Targeted recheck:** N21 is killed. N10, N12, N15, N24, S1, S2, S5 and S8 still survive, as graded here (MED/LOW only).
- **Outcome under the owner's rule:** no HIGH finding remains, so T081 closes as **PASS_WITH_GAPS**. The MED/LOW survivors are recorded follow-ups (T118–T120; `plan.md` Complexity Tracking). The GAPs are the live-only criteria pending the self-hosted run (T077).
