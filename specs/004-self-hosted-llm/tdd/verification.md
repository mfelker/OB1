---
feature: 004-self-hosted-llm
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # rubric graded against
verified_at: 8fcda29 # contrib/mfelker/self-hosted-llm (code); fork main ed35b3a (artifacts)
behaviors: 229
proven: 130
likely: 0
test_after: 99
no_test: 0
high_smells: 9 # 7 smells + 2 surviving deliberate mutants inside DONE behaviors
criteria_total: 24 # US1.1–US3.2 (8) + SC-001–SC-016 (16)
criteria_covered: 19 # end to end; SC-001, SC-005, SC-006, SC-007, SC-013 are manual/process (T043, T046, T048)
mutation_score: 86 # deliberate mutants, 12 of 14 caught; no mutation tool in the profile
mutants_survived: 2 # M3 (U56), M6 (U140), both judged real
suite: 238 passed, 0 failed, 0 ignored, ~1s
---

# TDD Verification: Self-hosted LLM backend for Open Brain

**Verdict: FAIL.** 99 of 229 behaviors are `TEST_AFTER` (their tests passed on the first run because an earlier cycle had already implemented them), and 9 `HIGH` findings remain. Two of those are surviving mutants inside `DONE` behaviors: U56's Matryoshka retry branch and U140's R6 merged-row guard.

The rest is strong:

- No existing test was weakened anywhere in the range.
- Every automatable acceptance criterion has an end-to-end test.
- 12 of 14 deliberate mutants were caught.
- The suite is isolated and fast.

**Independence.** This audit was not fully independent. The integrator that audited also orchestrated the streams, wrote the setup tasks, and ran U195's cycle. To offset that, the smell pass was delegated to three fresh-context Sonnet agents, and every HIGH they reported was re-opened at its cited line before inclusion: 9 kept, 6 downgraded with reasons.

## Test-first evidence

**Method.** Classified mechanically from three sources:

- the folded `tdd/cycle-log.md`: per-behavior red lines, with first-run passes detected from the entry text;
- `git log -S '"<id> '` over `contrib/mfelker/self-hosted-llm`: the commit where each test name first appears;
- `merge-base --is-ancestor`: every logged commit exists on the branch, and every test appears in or before its cycle commit.

**Results.**

- **PROVEN 130:** all 24 acceptance behaviors and 106 unit behaviors.
- **TEST_AFTER 99:** the first-run passes. Each carries a recorded mutant check, which proves the test is load-bearing but not that it came first. Under the rubric, the source landed in an earlier commit than the test.
  - U156, U160 and U161's mutants were run by the integrator at merge.
  - U60's commit was amended, but it is a first-run pass and therefore `TEST_AFTER` regardless.

**Discrepancies between sources.** None found: every logged SHA is on the branch, and no test appears after its logged commit.

**Existing tests.** No test was weakened. A scan of every removed line in `tests/` over `238df6c..8fcda29` found no assertion, skip, ignore or filter removed or loosened, other than the 24 deliberate `todo(` → `Deno.test(` flips. No coverage or mutation threshold exists to lower.

**tasks.md vs the test list.** Consistent. Every task carrying a `[U#]`/`[A#]` marker is `[X]`, and all 229 behaviors are `DONE`.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| A1 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `46441dc` |
| A2 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `367b0e6` |
| A3 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `eb10acb` |
| A4 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `4c92ede` |
| A5 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `23d3c62` |
| A6 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `c8a1cd4` |
| A7 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `17f1a91` |
| A8 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `a4d5ce3` |
| A9 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `8b46b60` |
| A10 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `fd2d317` |
| A11 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `3c4d089` |
| A12 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `55980a3` |
| A13 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `8d308ef` |
| A14 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `ed8a17a` |
| A15 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `cb463b1` |
| A16 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `0cb9b80` |
| A17 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `132b097` |
| A18 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `25b5048` |
| A19 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `c4eb12d` |
| A20 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `805b321` |
| A21 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `2a7315d` |
| A22 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `48a7367` |
| A23 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `32041e5` |
| A24 | PROVEN | red recorded at T006 (`99577b2`, before any source); flipped green in `a954827` |
| U1 | PROVEN | red recorded; test first appears in `944d7c3`, cycle commit `944d7c3` |
| U2 | PROVEN | red recorded; test first appears in `b60b2e3`, cycle commit `b60b2e3` |
| U3 | PROVEN | red recorded; test first appears in `c76a40f`, cycle commit `c76a40f` |
| U4 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `7525a90` |
| U5 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `f12865f` |
| U6 | PROVEN | red recorded; test first appears in `4ab18cd`, cycle commit `4ab18cd` |
| U7 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `86809f3` |
| U8 | PROVEN | red recorded; test first appears in `9d8c050`, cycle commit `9d8c050` |
| U9 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `54bf42e` |
| U10 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `400fe3f` |
| U11 | PROVEN | red recorded; test first appears in `a571cae`, cycle commit `a571cae` |
| U12 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `65f4ddc` |
| U13 | PROVEN | red recorded; test first appears in `62122b0`, cycle commit `62122b0` |
| U14 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `b143745` |
| U15 | PROVEN | red recorded; test first appears in `3643eb6`, cycle commit `3643eb6` |
| U16 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `601a3ae` |
| U17 | PROVEN | red recorded; test first appears in `97505e8`, cycle commit `97505e8` |
| U18 | PROVEN | red recorded; test first appears in `58ea0c5`, cycle commit `58ea0c5` |
| U19 | PROVEN | red recorded; test first appears in `9e2009c`, cycle commit `9e2009c` |
| U20 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `c588950` |
| U21 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `2289b14` |
| U22 | PROVEN | red recorded; test first appears in `14aa0dc`, cycle commit `14aa0dc` |
| U23 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `a1bf9a0` |
| U24 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `19c2f66` |
| U25 | PROVEN | red recorded; test first appears in `5e2579d`, cycle commit `5e2579d` |
| U26 | PROVEN | red recorded; test first appears in `195b3f5`, cycle commit `195b3f5` |
| U27 | PROVEN | red recorded; test first appears in `fd51d73`, cycle commit `fd51d73` |
| U28 | PROVEN | red recorded; test first appears in `4f9f844`, cycle commit `4f9f844` |
| U29 | PROVEN | red recorded; test first appears in `69f3a50`, cycle commit `69f3a50` |
| U30 | PROVEN | red recorded; test first appears in `20a0d98`, cycle commit `20a0d98` |
| U31 | PROVEN | red recorded; test first appears in `1357819`, cycle commit `1357819` |
| U32 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `129ca5d` |
| U33 | PROVEN | red recorded; test first appears in `0c769f4`, cycle commit `0c769f4` |
| U34 | PROVEN | red recorded; test first appears in `5e2bcaf`, cycle commit `5e2bcaf` |
| U35 | PROVEN | red recorded; test first appears in `5bd4d3c`, cycle commit `5bd4d3c` |
| U36 | PROVEN | red recorded; test first appears in `c9a4212`, cycle commit `c9a4212` |
| U37 | PROVEN | red recorded; test first appears in `854ddf3`, cycle commit `854ddf3` |
| U38 | PROVEN | red recorded; test first appears in `6351ee7`, cycle commit `6351ee7` |
| U39 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `4b35fc1` |
| U40 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `d10b92f` |
| U41 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `4a94a6e` |
| U42 | PROVEN | red recorded; test first appears in `5b14838`, cycle commit `5b14838` |
| U43 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `e955330` |
| U44 | PROVEN | red recorded; test first appears in `3a67b6a`, cycle commit `3a67b6a` |
| U45 | PROVEN | red recorded; test first appears in `e344db7`, cycle commit `e344db7` |
| U46 | PROVEN | red recorded; test first appears in `fe7a776`, cycle commit `fe7a776` |
| U47 | PROVEN | red recorded; test first appears in `74221f4`, cycle commit `74221f4` |
| U48 | PROVEN | red recorded; test first appears in `ca3cc1c`, cycle commit `ca3cc1c` |
| U49 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `3bf751a` |
| U50 | PROVEN | red recorded; test first appears in `74d7e0b`, cycle commit `74d7e0b` |
| U51 | PROVEN | red recorded; test first appears in `254a4ac`, cycle commit `254a4ac` |
| U52 | PROVEN | red recorded; test first appears in `1cc3324`, cycle commit `1cc3324` |
| U53 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `cc1da3b` |
| U54 | PROVEN | red recorded; test first appears in `dfba06f`, cycle commit `dfba06f` |
| U55 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `2c1e315` |
| U56 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `6eaa99b` |
| U57 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `95167e8` |
| U58 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `339fd98` |
| U59 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `128c50f` |
| U60 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `cd8d6ca` |
| U61 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `869780e` |
| U62 | PROVEN | red recorded; test first appears in `0e66367`, cycle commit `0e66367` |
| U63 | PROVEN | red recorded; test first appears in `97fe82b`, cycle commit `97fe82b` |
| U64 | PROVEN | red recorded; test first appears in `d8e3f25`, cycle commit `d8e3f25` |
| U65 | PROVEN | red recorded; test first appears in `7e503f6`, cycle commit `7e503f6` |
| U66 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `f45db3b` |
| U67 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `02ca108` |
| U68 | PROVEN | red recorded; test first appears in `8591df9`, cycle commit `8591df9` |
| U69 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `6dcb393` |
| U70 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `930d951` |
| U71 | PROVEN | red recorded; test first appears in `9af493c`, cycle commit `9af493c` |
| U72 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `4c2a39c` |
| U73 | PROVEN | red recorded; test first appears in `57cc342`, cycle commit `57cc342` |
| U74 | PROVEN | red recorded; test first appears in `63be553`, cycle commit `63be553` |
| U75 | PROVEN | red recorded; test first appears in `f507cc6`, cycle commit `f507cc6` |
| U76 | PROVEN | red recorded; test first appears in `2573f28`, cycle commit `2573f28` |
| U77 | PROVEN | red recorded; test first appears in `c98cc1b`, cycle commit `c98cc1b` |
| U78 | PROVEN | red recorded; test first appears in `0545352`, cycle commit `0545352` |
| U79 | PROVEN | red recorded; test first appears in `40e412c`, cycle commit `40e412c` |
| U80 | PROVEN | red recorded; test first appears in `4a009d1`, cycle commit `4a009d1` |
| U81 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `a99818a` |
| U82 | PROVEN | red recorded; test first appears in `242d87f`, cycle commit `242d87f` |
| U83 | PROVEN | red recorded; test first appears in `3c4b97e`, cycle commit `3c4b97e` |
| U84 | PROVEN | red recorded; test first appears in `44bb73d`, cycle commit `44bb73d` |
| U85 | PROVEN | red recorded; test first appears in `90f4b52`, cycle commit `90f4b52` |
| U86 | PROVEN | red recorded; test first appears in `c622ac7`, cycle commit `c622ac7` |
| U87 | PROVEN | red recorded; test first appears in `2d03c03`, cycle commit `2d03c03` |
| U88 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `790431f` |
| U89 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `4ead6fb` |
| U90 | PROVEN | red recorded; test first appears in `b3c1da3`, cycle commit `b3c1da3` |
| U91 | PROVEN | red recorded; test first appears in `bbbe43d`, cycle commit `bbbe43d` |
| U92 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `cd79f69` |
| U93 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `9b1cf43` |
| U94 | PROVEN | red recorded; test first appears in `c25e7f5`, cycle commit `c25e7f5` |
| U95 | PROVEN | red recorded; test first appears in `e9b666a`, cycle commit `e9b666a` |
| U96 | PROVEN | red recorded; test first appears in `cc9114a`, cycle commit `cc9114a` |
| U97 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `a79a903` |
| U98 | PROVEN | red recorded; test first appears in `fc43911`, cycle commit `fc43911` |
| U99 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `d2387d0` |
| U100 | PROVEN | red recorded; test first appears in `ebbf9c5`, cycle commit `ebbf9c5` |
| U101 | PROVEN | red recorded; test first appears in `ce3cbaf`, cycle commit `ce3cbaf` |
| U102 | PROVEN | red recorded; test first appears in `9b0ce47`, cycle commit `9b0ce47` |
| U103 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `dcf7373` |
| U104 | PROVEN | red recorded; test first appears in `a479538`, cycle commit `a479538` |
| U105 | PROVEN | red recorded; test first appears in `242318f`, cycle commit `242318f` |
| U106 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `bbf20b8` |
| U107 | PROVEN | red recorded; test first appears in `136255a`, cycle commit `136255a` |
| U108 | PROVEN | red recorded; test first appears in `6b8db3d`, cycle commit `6b8db3d` |
| U109 | PROVEN | red recorded; test first appears in `eb29564`, cycle commit `eb29564` |
| U110 | PROVEN | red recorded; test first appears in `c8016bc`, cycle commit `c8016bc` |
| U111 | PROVEN | red recorded; test first appears in `1d59424`, cycle commit `1d59424` |
| U112 | PROVEN | red recorded; test first appears in `ff2ed37`, cycle commit `ff2ed37` |
| U113 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `ccf8248` |
| U114 | PROVEN | red recorded; test first appears in `73c7afa`, cycle commit `73c7afa` |
| U115 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `ab73cbd` |
| U116 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `21124ea` |
| U117 | PROVEN | red recorded; test first appears in `fda4748`, cycle commit `fda4748` |
| U118 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `bf832f9` |
| U119 | PROVEN | red recorded; test first appears in `2b60f64`, cycle commit `2b60f64` |
| U120 | PROVEN | red recorded; test first appears in `e2b6b9c`, cycle commit `e2b6b9c` |
| U121 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `86ad90f` |
| U122 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `354adf4` |
| U123 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `af29d2a` |
| U124 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `185e13f` |
| U125 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `99acc6f` |
| U126 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `c307201` |
| U127 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `c8f56c6` |
| U128 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `e6a9926` |
| U129 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `93fe4e7` |
| U130 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `5f2e4a1` |
| U131 | PROVEN | red recorded; test first appears in `e6246c0`, cycle commit `e6246c0` |
| U132 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `26b8e36` |
| U133 | PROVEN | red recorded; test first appears in `56e3fcb`, cycle commit `56e3fcb` |
| U134 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `08e387f` |
| U135 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `7ca2eb6` |
| U136 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `f722680` |
| U137 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `dece3bd` |
| U138 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `0f6101a` |
| U139 | PROVEN | red recorded; test first appears in `c9c7189`, cycle commit `c9c7189` |
| U140 | PROVEN | red recorded; test first appears in `55023ed`, cycle commit `55023ed` |
| U141 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `2ceeb5e` |
| U142 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `ed6e5fa` |
| U143 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `93f5fc1` |
| U144 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `7228307` |
| U145 | PROVEN | red recorded; test first appears in `a36fe25`, cycle commit `a36fe25` |
| U146 | PROVEN | red recorded; test first appears in `b323794`, cycle commit `b323794` |
| U147 | PROVEN | red recorded; test first appears in `de288ae`, cycle commit `de288ae` |
| U148 | PROVEN | red recorded; test first appears in `3516c4c`, cycle commit `3516c4c` |
| U149 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `41bc566` |
| U150 | PROVEN | red recorded; test first appears in `33a731c`, cycle commit `33a731c` |
| U151 | PROVEN | red recorded; test first appears in `030e720`, cycle commit `030e720` |
| U152 | PROVEN | red recorded; test first appears in `7ef18fe`, cycle commit `7ef18fe` |
| U153 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `d71692c` |
| U154 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `5de4f21` |
| U155 | PROVEN | red recorded; test first appears in `3064d77`, cycle commit `3064d77` |
| U156 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `828a130` |
| U157 | PROVEN | red recorded; test first appears in `144dc3a`, cycle commit `144dc3a` |
| U158 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `6b83a78` |
| U159 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `8a76caf` |
| U160 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `73ccffe` |
| U161 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `138c09a` |
| U162 | PROVEN | red recorded; test first appears in `d4fdfb2`, cycle commit `d4fdfb2` |
| U163 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `9f15e74` |
| U164 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `6e2bdd5` |
| U165 | PROVEN | red recorded; test first appears in `917bb07`, cycle commit `917bb07` |
| U166 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `2308d0f` |
| U167 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `bb29aaf` |
| U168 | PROVEN | red recorded; test first appears in `2a37871`, cycle commit `2a37871` |
| U169 | PROVEN | red recorded; test first appears in `0b54725`, cycle commit `0b54725` |
| U170 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `ef35494` |
| U171 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `1606bd8` |
| U172 | PROVEN | red recorded; test first appears in `502c045`, cycle commit `502c045` |
| U173 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `5d8941a` |
| U174 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `3b278d0` |
| U175 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `25b0380` |
| U176 | PROVEN | red recorded; test first appears in `acd44a7`, cycle commit `acd44a7` |
| U177 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `3968ac0` |
| U178 | PROVEN | red recorded; test first appears in `f6263a0`, cycle commit `f6263a0` |
| U179 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `7e010f9` |
| U180 | PROVEN | red recorded; test first appears in `da8d806`, cycle commit `da8d806` |
| U181 | PROVEN | red recorded; test first appears in `cb7055e`, cycle commit `cb7055e` |
| U182 | PROVEN | red recorded; test first appears in `502eae8`, cycle commit `502eae8` |
| U183 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `200b404` |
| U184 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `2ea6e5c` |
| U185 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `96b4721` |
| U186 | PROVEN | red recorded; test first appears in `f5ede72`, cycle commit `f5ede72` |
| U187 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `31e1e96` |
| U188 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `0f72b97` |
| U189 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `0f72b97` |
| U190 | PROVEN | red recorded; test first appears in `ba8c9d9`, cycle commit `ba8c9d9` |
| U191 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `cb6f03f` |
| U192 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `60ddf69` |
| U193 | PROVEN | red recorded; test first appears in `b154eb7`, cycle commit `b154eb7` |
| U194 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `409f7f6` |
| U195 | PROVEN | red recorded; test first appears in `aa4f940`, cycle commit `aa4f940` |
| U196 | PROVEN | red recorded; test first appears in `70ade4e`, cycle commit `70ade4e` |
| U197 | PROVEN | red recorded; test first appears in `776df2e`, cycle commit `776df2e` |
| U198 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `66c6c35` |
| U199 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `66c6c35` |
| U200 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `66c6c35` |
| U201 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `8de4015` |
| U202 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `dbea45c` |
| U203 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `a359bd1` |
| U204 | TEST_AFTER | passed on first run (behavior already implemented by an earlier cycle); mutant-verified; commit `a359bd1` |
| U205 | PROVEN | red recorded; test first appears in `ae38281`, cycle commit `ae38281` |

## Findings

Ordered by severity. The HIGH rows were vetted line by line by the integrator.

| # | Severity | Finding | Evidence |
| - | -------- | ------- | -------- |
| 1 | HIGH | Surviving mutant M3: removing `matryoshka` from the retry trigger (`/dimension\|matryoshka/i` → `/dimension/i`) passes U56. Both of its "Matryoshka" fixtures also contain "dimension(s)". The test list's U56 names a bare `does not support Matryoshka embeddings` body, which is never sent. | `tests/model_client_test.ts:357-358`; `lib/model_client.ts:105` |
| 2 | HIGH | Surviving mutant M6: dropping `createdAt === updatedAt` from R6's delete decision passes all R6 tests (U137–U144). U140 seeds the merged row **with** an embedding, so the case that motivated option C (a pre-existing row lacking an embedding) never runs. Under the mutant, that case would get the wrong message ("may be saved" instead of "already in your brain"). | `tests/tools_test.ts:621-634`; `lib/tools.ts:232` |
| 3 | HIGH | Conditional logic: U171 loops over two envs and an `if` picks which counts to assert. | `tests/setup_check_test.ts:357-371` |
| 4 | HIGH | Conditional logic: U52's loop has `if (!r.ok)` gating the `kind` assertion. | `tests/model_client_test.ts:303-308` |
| 5 | HIGH | Loop over the *returned* tools: U101 asserts nothing if `listTools` returns fewer tools, and never checks that each core tool is present. | `tests/tools_test.ts:118` |
| 6 | HIGH | A2 does not prove "top result". The other thought sits on an orthogonal axis and is filtered by the 0.5 threshold, so only one result exists and "Result 1" is trivially true. | `tests/acceptance_test.ts:79-91` |
| 7 | HIGH | A7 does not discriminate. The fake's 404 body itself contains the model name, so a mis-classified `http_error` message (which echoes server text) also passes `assertStringIncludes(r.text, EMB_MODEL)`. | `tests/acceptance_test.ts:166-176` |
| 8 | HIGH | Vacuous negative assertion: U187's "accepted" cases assert only `!isRefused(...)`, so a 500 or a 404 passes. | `tests/app_test.ts:116-126` |
| 9 | HIGH | U199 never exercises its precondition. `{...MODEL_ENV, ...{}}` still carries `MCP_ACCESS_KEY` (`app_test.ts:227`), so "unset" is untested and only the empty-string case runs. | `tests/app_test.ts:285-293` |
| 10 | MED | Unbounded `while (!settled)` polling loop with real 10 ms/5 ms timers. It can hang the suite. | `tests/tools_test.ts:315,321` (U117) |
| 11 | MED | U155 "any single failed check makes ok false" tries only 2 of the 7 checks. | `tests/setup_check_test.ts:131-147` |
| 12 | MED | Re-implemented expectation: U196's expected body is `runSetupCheck()` on equivalent deps. Separately, the `title()` helper restates core's `thoughtTitle` for U102/U112 (the oracle is the parity source, so MED, not HIGH). | `tests/app_test.ts:246-256`; `tests/tools_test.ts:129-134` |
| 13 | MED | Real-clock dependence: U175 (wall-clock 250–850 ms window), U78 (`Date.now()` with ±2 h slack), and a 50 ms default `timeoutMs` for every model-client test (U43, U44, U60). | `tests/setup_check_test.ts:418-430`; `tests/thought_store_test.ts:136-151`; `tests/model_client_test.ts:15` |
| 14 | MED | U145 secrets test has no positive control per path. It asserts only absence, so a path whose echo never reaches the reply passes vacuously. Mutant M7 shows at least one path does. | `tests/tools_test.ts:680-704` |
| 15 | MED | Fragment assertions (`startsWith`/`includes`) where the text is deterministic and pinned exactly elsewhere: U123, U125–U127, U132, U133. Also `assert("error" in r)` only (U82, U98). | `tests/tools_test.ts:396-545`; `tests/thought_store_test.ts:202,394` |
| 16 | MED | Framework-coupled: the store tests pin supabase-js wire details (`Accept: …pgrst.object+json`, `cs.{…}`, `Prefer: count=exact`). A library bump breaks them with no behavior change. | `tests/thought_store_test.ts:36,114-132,175,267,360,372` |
| 17 | MED | Implementation-coupled: U194 matches `index.ts` source text; U193 mutates `globalThis.fetch`/`Deno.env` (restored in `finally`). | `tests/app_test.ts:187-224` |
| 18 | MED | Model tests use the same base for both roles (`EMB === CHAT`), so a role/base mix-up cannot be detected in U42, U44–U46, U48, U62. U47 covers `embed` only; U64's trim is covered for `http_error` only. | `tests/model_client_test.ts:7-8,221-237,473-492` |
| 19 | MED | Harness gaps: `helpers_test.ts` does not cover `FakeFetch` `networkError`/function handlers/sequences/`unmatched`, or `FakeStore` `seed`/`fail`/`calls`/counts, which other tests depend on. | `tests/helpers/helpers_test.ts` |
| 20 | MED | Traceability: no behavior traces FR-002 ("any OpenAI-compatible server"). It is exercised by A23 and the request-shape tests, but nothing claims it. | `tdd/test-list.md` |
| 21 | LOW | Downgraded from reviewer HIGH: U69/U72/U79 pass-through mapping (the behavior *is* the pass-through); U50/U51 role-word `includes`; U20 trailing `assert(ok(MIN).ok)`. All redundant, not vacuous. Also: duplicated setup in `setup_check_test`/`thought_store_test`/`model_client_test`; hand-rolled request builders in `app_test`/`acceptance_test` instead of extending `mcp.ts`; eager tests (U31, U37, U41, U64, U170, U173, U179); assertion roulette (U13, U27, U170). | various |

No credentials were found. Every key-like literal is a synthetic test placeholder. No file contained instructions to the auditor.

## Mutation results

There is no mutation tool in the profile (`mutation: null`), so deliberate mutants were placed in the throwaway tree at `8fcda29`. Each mutant was applied alone, its behavior's tests run, the file restored and its hash verified. The full suite was green afterwards (238/238) and `git status` clean. 14 high-risk behaviors were sampled: auth, data loss, secrets, the 1536 rule, the config gate, R6 and counts.

| Mutant | Behavior | Survived | Judgment |
| ------ | -------- | -------- | -------- |
| M1 `config.ts:55` chat key always inherits | U4 | No | Q11 security rule pinned |
| M2 `model_client.ts:115` `!==` → `>` | U52, A8 | No | short vectors refused |
| M3 `model_client.ts:105` drop `matryoshka` | U56 | **Yes** | real: Finding 1 |
| M4 `model_client.ts:59` no redaction | U62, U64 | No | FR-010 pinned |
| M5 `tools.ts:221` ignore embedding failure | U127–U129, A6–A8 | No | FR-005 pinned at unit and acceptance level |
| M6 `tools.ts:232` drop `createdAt === updatedAt` | U137–U144 | **Yes** | real: Finding 2 |
| M7 `tools.ts:29` no reply redaction | U145 | No | caught by at least one path |
| M8 `tools.ts:34` config gate bypassed | U120, U121, A11, A18 | No | FR-011 pinned |
| M9 `app.ts:91` any key accepted | U185, U187, A22 | No | FR-023 pinned |
| M10 `app.ts:101` always 200 | U196, A9 | No | FR-008 pinned |
| M11 `setup_check.ts:78` count = total | U176, A14 | No | FR-016 pinned |
| M12 `setup_check.ts:94` `ok: true` | U155, A9 | No | caught (but see Finding 11) |
| M13 `thought_store.ts:93` drop `embedding is null` | U91 | No | R6 DB filter pinned |
| M14 `metadata.ts:27` extracted spread last | U32 | No | FR-024 override protection pinned |

These 14 are a sample, not exhaustive. Not sampled: the timeout path (removing the abort would hang rather than fail), listing/parsing, CORS, and routing edge cases.

## Traceability

| Criterion | Tests (from `traces`) | End to end |
| --------- | --------------------- | ---------- |
| US1.1 | A1, + units | Yes |
| US1.2 / SC-004 | A2, A3 | Yes (A2 weak: Finding 6) |
| US1.3 | A4 | Yes |
| US2.1 | A6 | Yes |
| US2.2 | A8, A9 | Yes |
| US2.3 | A10 | Yes |
| US3.1 / SC-010 | A14 | Yes |
| US3.2 | A23 | Yes |
| SC-002 | A5 | Yes |
| SC-003 | A6, A7, A8 | Yes (A7 weak: Finding 7) |
| SC-008 | A11 | Yes |
| SC-009 | A9, A12, A13 | Yes |
| SC-011 | A15, A16 | Yes |
| SC-012 | A17, A18 | Yes |
| SC-014 | A19, A20 | Yes |
| SC-015 | A21, A22 | Yes |
| SC-016 | A24 | Yes |
| SC-001, SC-007, SC-013 | none (manual, quickstart §3–§4) | Deferred to T046 |
| SC-005 | scope check | T048 (passed) |
| SC-006 | gate | T043 (self-check passed; real gate at PR) |

**Functional requirements with no test:**

- FR-012, FR-017, FR-019, FR-021, FR-022 and the FR-023 wording: README content, covered by docs gates and manual §6 (declared out of scope in the test list).
- FR-013: the contribution contract, checked by T043.
- FR-002: no trace; see Finding 20.

**Tests tracing to nothing:** none. The helper self-tests H1–H9 are harness checks, not behaviors.

## What was not audited

- **Live behavior:** a real model server, Supabase Cloud, a self-hosted stack. All tests use fakes, so FR-014 portability and SC-001/007/013 await T046.
- **R6's Postgres premise:** that `created_at = updated_at` holds only on insert in real Postgres (T045, Docker unavailable). The fake store models it; that is unproven against Postgres.
- **The fake store's fidelity** to `docs/01`'s `upsert_thought` SQL, beyond the integrator's reading.
- **Mutation:** limited to 14 sampled behaviors. No mutation tool was run.
- **Performance and load:** no criterion, no test.
- **The README's accuracy:** linted and gate-checked only, not executed.
