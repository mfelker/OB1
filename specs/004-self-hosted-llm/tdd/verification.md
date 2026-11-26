---
feature: 004-self-hosted-llm
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # rubric graded against; lane upstream-bound, staged-PR section did not apply
verified_at: 2d7f60b # contrib/mfelker/self-hosted-llm; artifacts at fork main 1448d77
behaviors: 230
proven: 130
likely: 0
test_after: 100 # 99 under the owner exception (T057), 1 (U206) not covered
no_test: 0
high_smells: 0
criteria_total: 24
criteria_covered: 19 # end to end; SC-001/005/006/007/013 are manual or process checks (T043, T046, T048)
mutation_score: 100 # 21 deliberate mutants (14 high-risk re-run + 7 remediation-specific), 21 caught; no mutation tool
mutants_survived: 0
suite: 241 passed, 0 failed, 0 ignored, ~1s
---

# TDD Verification: Self-hosted LLM backend for Open Brain (re-audit, T061)

**Verdict: FAIL.** The rubric makes any `TEST_AFTER` behavior a `FAIL`, and 100 behaviors are `TEST_AFTER`:

- **99 are covered by the owner exception** recorded in `plan.md` Complexity Tracking (task T057). The rubric has no mechanism to honor that exception, the same reading spec 005's re-audit applied.
- **U206 is not covered by it**: the new behavior added for Finding 2, which passed on its first run.

Test strength is now clean:

- all 9 previous HIGH findings are resolved;
- 0 HIGH smells remain;
- every deliberate mutant is caught, including both former survivors.

**Independence.** As before, the auditor also orchestrated the work. The remediated tests were re-read by a fresh-context Sonnet reviewer, every mutant was re-applied by the integrator at `2d7f60b`, and the mechanical evidence pipeline was re-run unchanged.

## What changed since the previous report (`8fcda29`)

- **Findings 1–9 (HIGH): all resolved.** The fresh reviewer reports RESOLVED for each, and no assertion was weakened (each removed line was replaced by an equal or stronger one). Proof per finding:
  - M3 now fails U56;
  - M6 now fails U206;
  - U52 and U171 have no `if` or loop deciding what to assert;
  - U101 iterates `CORE_TOOLS` and checks the count;
  - A2 asserts Result 1 at 100.0% and Result 2 at 70.0% (a reversed sort fails it);
  - A7 asserts the exact `model_not_found` sentence against a body without the model name (an unmapped 404 fails it);
  - U187 asserts 200 plus the six tools (an authorized 500 fails it);
  - U199 truly unsets the key (a lenient check when unset fails it).
- **Finding 10 (MED): resolved.** U117's loop is bounded (about 2 s plus a 5 s race with a cleared timer), and a sequential-await mutant fails in about 3 s instead of hanging.
- **Findings 11–20 (MED): carried forward unchanged.** Their tests were not touched; tasks T059 and T060 remain open.
- **New behavior U206**, which takes the suite from 238 to 241 tests. The test list's 230 behaviors are all `DONE`, and `tasks.md` agrees with it.

## Test-first evidence

The method is unchanged from the previous report: the cycle log's red lines, `git log -S` for each test name's first commit, and `merge-base` ordering.

- **Results:** 130 `PROVEN`, 100 `TEST_AFTER`, no discrepancies between sources.
- **Weakened existing tests:** none in `238df6c..2d7f60b`. The remediation diff's removed lines are restructurings (loop bodies split into straight lines, A2's and A7's weaker assertions replaced by exact ones), each confirmed equal or stronger by the reviewer.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| A1 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `46441dc` |
| A2 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `367b0e6` |
| A3 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `eb10acb` |
| A4 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `4c92ede` |
| A5 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `23d3c62` |
| A6 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `c8a1cd4` |
| A7 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `17f1a91` |
| A8 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `a4d5ce3` |
| A9 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `8b46b60` |
| A10 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `fd2d317` |
| A11 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `3c4d089` |
| A12 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `55980a3` |
| A13 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `8d308ef` |
| A14 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `ed8a17a` |
| A15 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `cb463b1` |
| A16 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `0cb9b80` |
| A17 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `132b097` |
| A18 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `25b5048` |
| A19 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `c4eb12d` |
| A20 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `805b321` |
| A21 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `2a7315d` |
| A22 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `48a7367` |
| A23 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `32041e5` |
| A24 | PROVEN | red recorded at T006 (`99577b2`, before any source); green `a954827` |
| U1 | PROVEN | red recorded; test first in `944d7c3`, cycle `944d7c3` |
| U2 | PROVEN | red recorded; test first in `b60b2e3`, cycle `b60b2e3` |
| U3 | PROVEN | red recorded; test first in `c76a40f`, cycle `c76a40f` |
| U4 | TEST_AFTER | first-run pass, mutant-verified; `7525a90`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U5 | TEST_AFTER | first-run pass, mutant-verified; `f12865f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U6 | PROVEN | red recorded; test first in `4ab18cd`, cycle `4ab18cd` |
| U7 | TEST_AFTER | first-run pass, mutant-verified; `86809f3`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U8 | PROVEN | red recorded; test first in `9d8c050`, cycle `9d8c050` |
| U9 | TEST_AFTER | first-run pass, mutant-verified; `54bf42e`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U10 | TEST_AFTER | first-run pass, mutant-verified; `400fe3f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U11 | PROVEN | red recorded; test first in `a571cae`, cycle `a571cae` |
| U12 | TEST_AFTER | first-run pass, mutant-verified; `65f4ddc`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U13 | PROVEN | red recorded; test first in `62122b0`, cycle `62122b0` |
| U14 | TEST_AFTER | first-run pass, mutant-verified; `b143745`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U15 | PROVEN | red recorded; test first in `3643eb6`, cycle `3643eb6` |
| U16 | TEST_AFTER | first-run pass, mutant-verified; `601a3ae`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U17 | PROVEN | red recorded; test first in `97505e8`, cycle `97505e8` |
| U18 | PROVEN | red recorded; test first in `58ea0c5`, cycle `58ea0c5` |
| U19 | PROVEN | red recorded; test first in `9e2009c`, cycle `9e2009c` |
| U20 | TEST_AFTER | first-run pass, mutant-verified; `c588950`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U21 | TEST_AFTER | first-run pass, mutant-verified; `2289b14`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U22 | PROVEN | red recorded; test first in `14aa0dc`, cycle `14aa0dc` |
| U23 | TEST_AFTER | first-run pass, mutant-verified; `a1bf9a0`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U24 | TEST_AFTER | first-run pass, mutant-verified; `19c2f66`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U25 | PROVEN | red recorded; test first in `5e2579d`, cycle `5e2579d` |
| U26 | PROVEN | red recorded; test first in `195b3f5`, cycle `195b3f5` |
| U27 | PROVEN | red recorded; test first in `fd51d73`, cycle `fd51d73` |
| U28 | PROVEN | red recorded; test first in `4f9f844`, cycle `4f9f844` |
| U29 | PROVEN | red recorded; test first in `69f3a50`, cycle `69f3a50` |
| U30 | PROVEN | red recorded; test first in `20a0d98`, cycle `20a0d98` |
| U31 | PROVEN | red recorded; test first in `1357819`, cycle `1357819` |
| U32 | TEST_AFTER | first-run pass, mutant-verified; `129ca5d`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U33 | PROVEN | red recorded; test first in `0c769f4`, cycle `0c769f4` |
| U34 | PROVEN | red recorded; test first in `5e2bcaf`, cycle `5e2bcaf` |
| U35 | PROVEN | red recorded; test first in `5bd4d3c`, cycle `5bd4d3c` |
| U36 | PROVEN | red recorded; test first in `c9a4212`, cycle `c9a4212` |
| U37 | PROVEN | red recorded; test first in `854ddf3`, cycle `854ddf3` |
| U38 | PROVEN | red recorded; test first in `6351ee7`, cycle `6351ee7` |
| U39 | TEST_AFTER | first-run pass, mutant-verified; `4b35fc1`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U40 | TEST_AFTER | first-run pass, mutant-verified; `d10b92f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U41 | TEST_AFTER | first-run pass, mutant-verified; `4a94a6e`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U42 | PROVEN | red recorded; test first in `5b14838`, cycle `5b14838` |
| U43 | TEST_AFTER | first-run pass, mutant-verified; `e955330`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U44 | PROVEN | red recorded; test first in `3a67b6a`, cycle `3a67b6a` |
| U45 | PROVEN | red recorded; test first in `e344db7`, cycle `e344db7` |
| U46 | PROVEN | red recorded; test first in `fe7a776`, cycle `fe7a776` |
| U47 | PROVEN | red recorded; test first in `74221f4`, cycle `74221f4` |
| U48 | PROVEN | red recorded; test first in `ca3cc1c`, cycle `ca3cc1c` |
| U49 | TEST_AFTER | first-run pass, mutant-verified; `3bf751a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U50 | PROVEN | red recorded; test first in `74d7e0b`, cycle `74d7e0b` |
| U51 | PROVEN | red recorded; test first in `254a4ac`, cycle `254a4ac` |
| U52 | PROVEN | red recorded; test first in `1cc3324`, cycle `1cc3324` |
| U53 | TEST_AFTER | first-run pass, mutant-verified; `cc1da3b`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U54 | PROVEN | red recorded; test first in `dfba06f`, cycle `dfba06f` |
| U55 | TEST_AFTER | first-run pass, mutant-verified; `2c1e315`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U56 | TEST_AFTER | first-run pass, mutant-verified; `6eaa99b`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U57 | TEST_AFTER | first-run pass, mutant-verified; `95167e8`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U58 | TEST_AFTER | first-run pass, mutant-verified; `339fd98`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U59 | TEST_AFTER | first-run pass, mutant-verified; `128c50f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U60 | TEST_AFTER | first-run pass, mutant-verified; `cd8d6ca`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U61 | TEST_AFTER | first-run pass, mutant-verified; `869780e`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U62 | PROVEN | red recorded; test first in `0e66367`, cycle `0e66367` |
| U63 | PROVEN | red recorded; test first in `97fe82b`, cycle `97fe82b` |
| U64 | PROVEN | red recorded; test first in `d8e3f25`, cycle `d8e3f25` |
| U65 | PROVEN | red recorded; test first in `7e503f6`, cycle `7e503f6` |
| U66 | TEST_AFTER | first-run pass, mutant-verified; `f45db3b`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U67 | TEST_AFTER | first-run pass, mutant-verified; `02ca108`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U68 | PROVEN | red recorded; test first in `8591df9`, cycle `8591df9` |
| U69 | TEST_AFTER | first-run pass, mutant-verified; `6dcb393`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U70 | TEST_AFTER | first-run pass, mutant-verified; `930d951`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U71 | PROVEN | red recorded; test first in `9af493c`, cycle `9af493c` |
| U72 | TEST_AFTER | first-run pass, mutant-verified; `4c2a39c`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U73 | PROVEN | red recorded; test first in `57cc342`, cycle `57cc342` |
| U74 | PROVEN | red recorded; test first in `63be553`, cycle `63be553` |
| U75 | PROVEN | red recorded; test first in `f507cc6`, cycle `f507cc6` |
| U76 | PROVEN | red recorded; test first in `2573f28`, cycle `2573f28` |
| U77 | PROVEN | red recorded; test first in `c98cc1b`, cycle `c98cc1b` |
| U78 | PROVEN | red recorded; test first in `0545352`, cycle `0545352` |
| U79 | PROVEN | red recorded; test first in `40e412c`, cycle `40e412c` |
| U80 | PROVEN | red recorded; test first in `4a009d1`, cycle `4a009d1` |
| U81 | TEST_AFTER | first-run pass, mutant-verified; `a99818a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U82 | PROVEN | red recorded; test first in `242d87f`, cycle `242d87f` |
| U83 | PROVEN | red recorded; test first in `3c4b97e`, cycle `3c4b97e` |
| U84 | PROVEN | red recorded; test first in `44bb73d`, cycle `44bb73d` |
| U85 | PROVEN | red recorded; test first in `90f4b52`, cycle `90f4b52` |
| U86 | PROVEN | red recorded; test first in `c622ac7`, cycle `c622ac7` |
| U87 | PROVEN | red recorded; test first in `2d03c03`, cycle `2d03c03` |
| U88 | TEST_AFTER | first-run pass, mutant-verified; `790431f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U89 | TEST_AFTER | first-run pass, mutant-verified; `4ead6fb`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U90 | PROVEN | red recorded; test first in `b3c1da3`, cycle `b3c1da3` |
| U91 | PROVEN | red recorded; test first in `bbbe43d`, cycle `bbbe43d` |
| U92 | TEST_AFTER | first-run pass, mutant-verified; `cd79f69`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U93 | TEST_AFTER | first-run pass, mutant-verified; `9b1cf43`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U94 | PROVEN | red recorded; test first in `c25e7f5`, cycle `c25e7f5` |
| U95 | PROVEN | red recorded; test first in `e9b666a`, cycle `e9b666a` |
| U96 | PROVEN | red recorded; test first in `cc9114a`, cycle `cc9114a` |
| U97 | TEST_AFTER | first-run pass, mutant-verified; `a79a903`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U98 | PROVEN | red recorded; test first in `fc43911`, cycle `fc43911` |
| U99 | TEST_AFTER | first-run pass, mutant-verified; `d2387d0`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U100 | PROVEN | red recorded; test first in `ebbf9c5`, cycle `ebbf9c5` |
| U101 | PROVEN | red recorded; test first in `ce3cbaf`, cycle `ce3cbaf` |
| U102 | PROVEN | red recorded; test first in `9b0ce47`, cycle `9b0ce47` |
| U103 | TEST_AFTER | first-run pass, mutant-verified; `dcf7373`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U104 | PROVEN | red recorded; test first in `a479538`, cycle `a479538` |
| U105 | PROVEN | red recorded; test first in `242318f`, cycle `242318f` |
| U106 | TEST_AFTER | first-run pass, mutant-verified; `bbf20b8`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U107 | PROVEN | red recorded; test first in `136255a`, cycle `136255a` |
| U108 | PROVEN | red recorded; test first in `6b8db3d`, cycle `6b8db3d` |
| U109 | PROVEN | red recorded; test first in `eb29564`, cycle `eb29564` |
| U110 | PROVEN | red recorded; test first in `c8016bc`, cycle `c8016bc` |
| U111 | PROVEN | red recorded; test first in `1d59424`, cycle `1d59424` |
| U112 | PROVEN | red recorded; test first in `ff2ed37`, cycle `ff2ed37` |
| U113 | TEST_AFTER | first-run pass, mutant-verified; `ccf8248`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U114 | PROVEN | red recorded; test first in `73c7afa`, cycle `73c7afa` |
| U115 | TEST_AFTER | first-run pass, mutant-verified; `ab73cbd`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U116 | TEST_AFTER | first-run pass, mutant-verified; `21124ea`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U117 | PROVEN | red recorded; test first in `fda4748`, cycle `fda4748` |
| U118 | TEST_AFTER | first-run pass, mutant-verified; `bf832f9`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U119 | PROVEN | red recorded; test first in `2b60f64`, cycle `2b60f64` |
| U120 | PROVEN | red recorded; test first in `e2b6b9c`, cycle `e2b6b9c` |
| U121 | TEST_AFTER | first-run pass, mutant-verified; `86ad90f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U122 | TEST_AFTER | first-run pass, mutant-verified; `354adf4`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U123 | TEST_AFTER | first-run pass, mutant-verified; `af29d2a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U124 | TEST_AFTER | first-run pass, mutant-verified; `185e13f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U125 | TEST_AFTER | first-run pass, mutant-verified; `99acc6f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U126 | TEST_AFTER | first-run pass, mutant-verified; `c307201`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U127 | TEST_AFTER | first-run pass, mutant-verified; `c8f56c6`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U128 | TEST_AFTER | first-run pass, mutant-verified; `e6a9926`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U129 | TEST_AFTER | first-run pass, mutant-verified; `93fe4e7`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U130 | TEST_AFTER | first-run pass, mutant-verified; `5f2e4a1`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U131 | PROVEN | red recorded; test first in `e6246c0`, cycle `e6246c0` |
| U132 | TEST_AFTER | first-run pass, mutant-verified; `26b8e36`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U133 | PROVEN | red recorded; test first in `56e3fcb`, cycle `56e3fcb` |
| U134 | TEST_AFTER | first-run pass, mutant-verified; `08e387f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U135 | TEST_AFTER | first-run pass, mutant-verified; `7ca2eb6`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U136 | TEST_AFTER | first-run pass, mutant-verified; `f722680`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U137 | TEST_AFTER | first-run pass, mutant-verified; `dece3bd`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U138 | TEST_AFTER | first-run pass, mutant-verified; `0f6101a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U139 | PROVEN | red recorded; test first in `c9c7189`, cycle `c9c7189` |
| U140 | PROVEN | red recorded; test first in `55023ed`, cycle `55023ed` |
| U141 | TEST_AFTER | first-run pass, mutant-verified; `2ceeb5e`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U142 | TEST_AFTER | first-run pass, mutant-verified; `ed6e5fa`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U143 | TEST_AFTER | first-run pass, mutant-verified; `93f5fc1`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U144 | TEST_AFTER | first-run pass, mutant-verified; `7228307`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U145 | PROVEN | red recorded; test first in `a36fe25`, cycle `a36fe25` |
| U146 | PROVEN | red recorded; test first in `b323794`, cycle `b323794` |
| U147 | PROVEN | red recorded; test first in `de288ae`, cycle `de288ae` |
| U148 | PROVEN | red recorded; test first in `3516c4c`, cycle `3516c4c` |
| U149 | TEST_AFTER | first-run pass, mutant-verified; `41bc566`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U150 | PROVEN | red recorded; test first in `33a731c`, cycle `33a731c` |
| U151 | PROVEN | red recorded; test first in `030e720`, cycle `030e720` |
| U152 | PROVEN | red recorded; test first in `7ef18fe`, cycle `7ef18fe` |
| U153 | TEST_AFTER | first-run pass, mutant-verified; `d71692c`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U154 | TEST_AFTER | first-run pass, mutant-verified; `5de4f21`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U155 | PROVEN | red recorded; test first in `3064d77`, cycle `3064d77` |
| U156 | TEST_AFTER | first-run pass, mutant-verified; `828a130`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U157 | PROVEN | red recorded; test first in `144dc3a`, cycle `144dc3a` |
| U158 | TEST_AFTER | first-run pass, mutant-verified; `6b83a78`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U159 | TEST_AFTER | first-run pass, mutant-verified; `8a76caf`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U160 | TEST_AFTER | first-run pass, mutant-verified; `73ccffe`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U161 | TEST_AFTER | first-run pass, mutant-verified; `138c09a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U162 | PROVEN | red recorded; test first in `d4fdfb2`, cycle `d4fdfb2` |
| U163 | TEST_AFTER | first-run pass, mutant-verified; `9f15e74`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U164 | TEST_AFTER | first-run pass, mutant-verified; `6e2bdd5`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U165 | PROVEN | red recorded; test first in `917bb07`, cycle `917bb07` |
| U166 | TEST_AFTER | first-run pass, mutant-verified; `2308d0f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U167 | TEST_AFTER | first-run pass, mutant-verified; `bb29aaf`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U168 | PROVEN | red recorded; test first in `2a37871`, cycle `2a37871` |
| U169 | PROVEN | red recorded; test first in `0b54725`, cycle `0b54725` |
| U170 | TEST_AFTER | first-run pass, mutant-verified; `ef35494`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U171 | TEST_AFTER | first-run pass, mutant-verified; `1606bd8`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U172 | PROVEN | red recorded; test first in `502c045`, cycle `502c045` |
| U173 | TEST_AFTER | first-run pass, mutant-verified; `5d8941a`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U174 | TEST_AFTER | first-run pass, mutant-verified; `3b278d0`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U175 | TEST_AFTER | first-run pass, mutant-verified; `25b0380`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U176 | PROVEN | red recorded; test first in `acd44a7`, cycle `acd44a7` |
| U177 | TEST_AFTER | first-run pass, mutant-verified; `3968ac0`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U178 | PROVEN | red recorded; test first in `f6263a0`, cycle `f6263a0` |
| U179 | TEST_AFTER | first-run pass, mutant-verified; `7e010f9`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U180 | PROVEN | red recorded; test first in `da8d806`, cycle `da8d806` |
| U181 | PROVEN | red recorded; test first in `cb7055e`, cycle `cb7055e` |
| U182 | PROVEN | red recorded; test first in `502eae8`, cycle `502eae8` |
| U183 | TEST_AFTER | first-run pass, mutant-verified; `200b404`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U184 | TEST_AFTER | first-run pass, mutant-verified; `2ea6e5c`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U185 | TEST_AFTER | first-run pass, mutant-verified; `96b4721`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U186 | PROVEN | red recorded; test first in `f5ede72`, cycle `f5ede72` |
| U187 | TEST_AFTER | first-run pass, mutant-verified; `31e1e96`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U188 | TEST_AFTER | first-run pass, mutant-verified; `0f72b97`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U189 | TEST_AFTER | first-run pass, mutant-verified; `0f72b97`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U190 | PROVEN | red recorded; test first in `ba8c9d9`, cycle `ba8c9d9` |
| U191 | TEST_AFTER | first-run pass, mutant-verified; `cb6f03f`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U192 | TEST_AFTER | first-run pass, mutant-verified; `60ddf69`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U193 | PROVEN | red recorded; test first in `b154eb7`, cycle `b154eb7` |
| U194 | TEST_AFTER | first-run pass, mutant-verified; `409f7f6`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U195 | PROVEN | red recorded; test first in `aa4f940`, cycle `aa4f940` |
| U196 | PROVEN | red recorded; test first in `70ade4e`, cycle `70ade4e` |
| U197 | PROVEN | red recorded; test first in `776df2e`, cycle `776df2e` |
| U198 | TEST_AFTER | first-run pass, mutant-verified; `66c6c35`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U199 | TEST_AFTER | first-run pass, mutant-verified; `66c6c35`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U200 | TEST_AFTER | first-run pass, mutant-verified; `66c6c35`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U201 | TEST_AFTER | first-run pass, mutant-verified; `8de4015`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U202 | TEST_AFTER | first-run pass, mutant-verified; `dbea45c`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U203 | TEST_AFTER | first-run pass, mutant-verified; `a359bd1`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U204 | TEST_AFTER | first-run pass, mutant-verified; `a359bd1`; covered by the T057 owner exception (`plan.md` Complexity Tracking) |
| U205 | PROVEN | red recorded; test first in `ae38281`, cycle `ae38281` |
| U206 | TEST_AFTER | new at audit remediation; first-run pass, mutant M6 caught; `da0576b`. **Not covered** by the T057 exception |

## Findings

| # | Severity | Finding | Evidence |
| - | -------- | ------- | -------- |
| 1 | MED | Carried forward: U155 tries 2 of 7 failing checks (previous Finding 11). | `tests/setup_check_test.ts:131-147` |
| 2 | MED | Carried forward: re-implemented expectations in U196 (`runSetupCheck` as oracle) and the `title()` restatement of core (previous Finding 12). | `tests/app_test.ts:246-256`; `tests/tools_test.ts:129-134` |
| 3 | MED | Carried forward: real-clock dependence in U175, U78, and the 50 ms default `timeoutMs` (previous Finding 13). | `tests/setup_check_test.ts:418-430`; `tests/thought_store_test.ts:136-151`; `tests/model_client_test.ts:15` |
| 4 | MED | Carried forward: U145 has no per-path positive control (previous Finding 14). | `tests/tools_test.ts:680-704` |
| 5 | MED | Carried forward: fragment assertions (U123, U125–U127, U132, U133; U82/U98 `"error" in r`) (previous Finding 15). | `tests/tools_test.ts`; `tests/thought_store_test.ts:202,394` |
| 6 | MED | Carried forward: supabase-js wire-detail coupling in the store tests (previous Finding 16). | `tests/thought_store_test.ts` |
| 7 | MED | Carried forward: U194 source-text match; U193 global mutation (previous Finding 17). | `tests/app_test.ts:187-224` |
| 8 | MED | Carried forward: `EMB === CHAT` base in model tests; U47 embed-only; U64 trim on `http_error` only (previous Finding 18). | `tests/model_client_test.ts` |
| 9 | MED | Carried forward: harness self-test gaps (previous Finding 19). | `tests/helpers/helpers_test.ts` |
| 10 | MED | Carried forward: FR-002 has no trace (previous Finding 20). | `tdd/test-list.md` |
| 11 | LOW | New: two tests are both named `U56 …`. The older one's title still says "vLLM Matryoshka 400" while its fixture contains "dimensions", so `--filter "/^U56 /"` runs both. | `tests/model_client_test.ts:~357,~376` |
| 12 | LOW | New: duplicated setup in U52's three blocks, U171's `count` helper, U206 vs U140, and U187's local `CORE_TOOLS` copy. A2's expected percentages reuse the source's `toFixed(1)` format. | per reviewer |
| 13 | LOW | Carried forward: previous Finding 21's LOW items. | various |

No credentials were found. No file contained instructions to the auditor.

## Mutation results

There is no mutation tool, so deliberate mutants were run in the throwaway tree at `2d7f60b`, each applied alone and restored, with the suite green afterwards (241/241) and `git status` clean.

| Mutant | Behavior | Survived | Judgment |
| ------ | -------- | -------- | -------- |
| M1 chat key always inherits | U4 | No | |
| M2 `!==` → `>` on 1536 | U52, A8 | No | |
| M3 drop `matryoshka` from the retry trigger | U56 | No | **was a survivor**; now caught |
| M4 no server-text redaction | U62, U64 | No | |
| M5 ignore embedding failure | U127–U129, A6–A8 | No | |
| M6 drop `createdAt === updatedAt` (R6) | U206 | No | **was a survivor**; now caught |
| M7 no reply redaction | U145 | No | |
| M8 config gate bypassed | U120, U121, A11, A18 | No | |
| M9 any key accepted | U185, U187, A22 | No | |
| M10 setup check always 200 | U196, A9 | No | |
| M11 count = total | U176, A14 | No | |
| M12 `ok: true` | U155, A9 | No | |
| M13 drop `embedding is null` filter | U91 | No | |
| M14 extracted spread last | U32 | No | |
| fake store sort reversed | A2 | No | integrator re-run |
| 404 not mapped to `model_not_found` | A7 | No | integrator re-run |
| lenient check when the key is unset | U199 | No | integrator re-run |
| authorized MCP requests return 500 | U187 | No | remediation agent's run |
| one tool not registered | U101 | No | remediation agent's run |
| sequential embed then chat | U117 | No | integrator re-run; failed in 3.0 s, no hang |
| extra `/models` call | U171 | No | remediation agent's run |

That is 21 mutants on sampled high-risk behaviors, not an exhaustive mutation run.

## Traceability

Unchanged from the previous report.

- Every user-story scenario and every automatable success criterion has an end-to-end acceptance test (A1–A24). A2 and A7 now discriminate.
- **Deferred to manual or process checks:** SC-001, SC-007 and SC-013 (T046); SC-005 (T048, passed); SC-006 (T043, real gate at PR).
- **FR without tests:** FR-012, FR-017, FR-019, FR-021, FR-022 (README, docs gates); FR-013 (contract, T043); FR-002 (no trace; Finding 10).
- **Tests tracing to nothing:** none.

## What was not audited

- **The smell pass covered only the remediated tests.** Unchanged tests carry their previous findings forward without a fresh re-read.
- **Live behavior:** a real model server, Supabase Cloud, a self-hosted stack (T046).
- **R6's Postgres premise** (T045; Docker was unavailable), and the fake store's fidelity to `upsert_thought`. A2's ranking is the fake store's ordering, not the `match_thoughts` RPC's.
- **Mutation:** 21 sampled mutants, no tool, no exhaustive run.
- **Performance and the README's executable accuracy.**
