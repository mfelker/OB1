---
feature: 006-self-hosted-supabase
verdict: FAIL # rubric as written (no waiver mechanism); PASS_WITH_GAPS with the owner exceptions T066 + T073 honored
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # rubric graded against; lane upstream-bound, so the staged-PR section did not apply
verified_at: 9744cd2 # contrib/mfelker/self-hosted-supabase (worktree .worktrees/contrib-self-hosted-supabase); artifacts at fork main 79a9092; second re-audit T044 after remediation T073-T080
behaviors: 62
proven: 42
likely: 1
test_after: 19 # all 19 under the owner exception (T066: 17, plan.md:126; T073: U54, U55, plan.md:127)
no_test: 0
high_smells: 0
criteria_total: 22 # US1.1-1.6, US2.1-2.3, US3.1-3.3, SC-001-SC-010; SC-011 withdrawn
criteria_covered: 11 # by an automated test at the recipe's real entry point; the other 11 (now incl. SC-010) by the recorded Mac and Linux live runs only
mutation_score: 93 # deliberate mutants, no tool: 14 of 15 caught by the behavior's own test; product-code mutants 14 of 14
mutants_survived: 1 # G6, a harness mutant (SETUP_SHELL reverted to /bin/sh); no product-code survivor; none inside a DONE behavior
suite: 60 passed, 0 failed, 0 skipped, 13.3s wall (adapter suite, node-plain 59 + sql 1, with the copy-per-call psql wrapper and container ob1-006-pgtest)
---

# TDD Verification: Lean self-hosted Supabase for Open Brain (second re-audit, T044)

**Verdict: FAIL (rubric as written).** The only reason: 19 behaviors are `TEST_AFTER`, and the rubric has no waiver mechanism. All 19 are covered by recorded owner exceptions (T066 and T073).

**Verdict with the T066 and T073 exceptions honored: PASS_WITH_GAPS.** This holds while the 11 criteria covered only by live runs are read as a gap, as the previous report read them. Spec 003's stricter reading would grade them HIGH. See the exceptions section.

- 0 HIGH smells.
- No weakened or skipped existing test.
- Every acceptance criterion has a test or recorded live evidence. SC-010 now has both runs.
- No mutant survives inside a `DONE` behavior.

The gaps that remain are listed individually:

- mutation by hand only, with no tool, and coverage unavailable;
- U34 is `LIKELY` (amended commit);
- 11 criteria are covered only by the recorded Mac and Linux live runs;
- one LOW harness survivor (G6, Finding 2).

**Verdict without any exception: FAIL**, for the same reason: 19 `TEST_AFTER`.

**What Phase 10 fixed, re-checked here rather than taken from the log.**

- Every survivor the previous report named now fails its own test. F13 fails U36. F9 fails A9 and 24 tests under dash. F21 fails U54 and U12. F20 fails U55. F1+M16 fails U54. F1 alone now fails U54 too; it was judged equivalent last time.
- T075 holds. Through a size-changing edit, a restore and a pass, the host and container sha256 of `db/ob1-schema.sql` matched at every step, with no container restart.
- SC-010 is met. `evidence/linux/` holds a recorded V1–V9, V11 and V12 run on Debian 13, Compose v5.8.0 and dash. The README names both runs.

**Independence.** This re-audit ran from cold context. The auditor wrote none of the code or tests.

- Read in full: `tests/helpers/harness.mjs`, `tests/harness.test.mjs`, `setup.sh` and `init/create-bucket.sh`. The rest of `c963653..9744cd2` was read as the diff plus the surrounding tests: `compose.test.mjs` (header, `ENV_VALUES`, U24, U35, U36), `create-bucket.test.mjs` (U47–U52, U55), `setup.test.mjs` (U12, U54) and `lean.override.yml:38-56`.
- The smell pass on the 6 changed files was done directly, not delegated.
- Each mutant was restored by copying back a pre-mutation file (`cp -p`), never with `git`. The restore was verified with `cmp` and an empty `git status --short`, and a green adapter suite (60/60) followed before the next mutant.

## The owner exceptions, judged against the rubric as written

`plan.md:126` (T066, 17 behaviors) and `plan.md:127` (T073, U54 and U55) record the accepted `TEST_AFTER` behaviors, with mutant evidence.

- T073's row matches the previous report's Finding 1 exactly. It names U54 and U55, and gives their mutants: M16, F2 and F3 for U54, F20 for U55.
- This audit re-ran M16 and F20 against the strengthened tests, and both still fail them.
- The rubric defines no waiver, so under it the 19 stay `TEST_AFTER` and the verdict stays `FAIL`. Specs 004 (`bb5649d`) and 005 recorded `verdict: FAIL` the same way.
- Every other condition for `PASS_WITH_GAPS` now holds, but under one reading carried from the previous report: the 11 criteria covered only by recorded live runs count as a gap, not as untested. Spec 003's audit graded manual-only criteria HIGH (`specs/003-tdd-extension/tdd/verification.md:148`, Finding 1). Under that stricter reading, those 11 are verdict reasons too, and the verdict stays `FAIL` even with the exceptions honored.
- The owner's Gate 1 decision therefore rests on two things: accepting the recorded exception, and accepting the live runs as the tests for those 11 criteria.

## Test-first evidence

Phase 10 added no behavior ids and no source change. `git diff --stat c963653..9744cd2` touches only:

- `tests/compose.test.mjs` (+1);
- `tests/create-bucket.test.mjs` (U55 split out);
- `tests/harness.test.mjs` (+1);
- `tests/helpers/harness.mjs` (the stub message, `SETUP_SHELL`);
- `tests/setup.test.mjs` (+4);
- `README.md` (1 line).

Every row therefore keeps its previous class.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| A1–A4, A6–A9 | PROVEN | red at T050 (`6052532`) before any source; later strengthenings are test only |
| A5 | TEST_AFTER | T066 exception |
| U1–U9, U11, U12, U14–U18, U20, U21 | PROVEN | reds recorded (earlier audits). U12 strengthened at `8ef2bf6` (test only: `typeof r.code`, "setup reached key generation") |
| U10, U13, U19, U22, U25–U29, U41–U46, U51 | TEST_AFTER | T066 exception. U51 kept all its own assertions when U55 was split out (`83540b9`) |
| U24, U30–U33, U35, U36 | PROVEN | stream C reds. U36 strengthened at `bfacd22` (test only: `init.image`) |
| U34 | LIKELY | amended commit `e9789ed` → `5729d95` (recorded by T071) |
| U38–U40, U47–U50, U52, U53 | PROVEN | reds recorded |
| U54 | TEST_AFTER | T073 exception. Strengthened at `8ef2bf6` (build folder under `TMPDIR`, `typeof r.code`) |
| U55 | TEST_AFTER | T073 exception. Own test since `83540b9` |

**Existing tests changed in `c963653..9744cd2`, checked for weakening: none weakened.**

- **U51** (`tests/create-bucket.test.mjs:56-67`).
  - Removed: the `STORAGE_URL` override sub-case.
  - Added back as test U55 (`:69-77`), which also asserts `reqs.length === 1`, where the old sub-case did not.
  - U51's default-address assertions are unchanged.
  - Net: same assertions, now separately selectable.
- **U12** (`tests/setup.test.mjs:156,158`) and **U54** (`:321,323`): assertions only added.
- **H1** (`tests/harness.test.mjs:22`): `st.status === 0` added.
- **Harness.**
  - The stub generator's failure line gained `in $(pwd)`, with a leading space (`helpers/harness.mjs:68`). The only tests that read it are U12 and U54, which match the new text.
  - `runSetup` now spawns `/bin/dash` where present (`:193`). That is stricter than `/bin/sh` on macOS: F9 and G5 now fail.
- **Skips and exclusions:** none. The suite reports 0 skipped, and no test file was renamed.

**`tasks.md` against the test list.**

- All 62 behaviors are `DONE`, and T073–T080 and T038 are ticked.
- Each ticked task's "done when" was re-checked: T078 (F13), T079 (F20, and U55's single run selects exactly 1 test), T076 and T080 (F21, F1+M16), T077 (F9), T075 (hash sequence), T074 and T038 (evidence files).
- T044 is correctly unticked.

## Findings

Ordered by severity. "Own test" means the behavior's test run alone through `tdd.mjs single`.

| # | Severity | Finding | Evidence |
| - | -------- | ------- | -------- |
| 1 | HIGH (verdict, owner-excepted) | **19 behaviors are `TEST_AFTER`.** All of them are under the recorded owner exceptions; the rubric has no waiver. No test-side change can clear this. Only re-driving the behaviors red-first could, and the owner declined that twice (T066, T073). | `plan.md:126-127`; `tdd/test-list.md` |
| 2 | LOW | **Nothing pins the harness's dash choice.** Mutant G6 reverts `SETUP_SHELL` to `"/bin/sh"`, and the whole suite stays green (59/59 node). The F9 and G5 kills therefore rest on one unguarded harness line. On a host without `/bin/dash`, the harness falls back silently to `/bin/sh`, which on macOS is bash.<br><br>Related: `makeBucketEnv` still runs `create-bucket.sh` under `/bin/sh`, so on macOS its bashisms are not caught either. That script runs under the curl image's `sh` in production. | `tests/helpers/harness.mjs:193,281`; `tests/harness.test.mjs` (no check of either) |
| 3 | LOW | **90 leftover `/tmp/ob1-setup.*` folders from before this audit.** They are dated 2026-11-26 19:30–19:35, and each holds a stub `.env.old` (4 also hold a `.env`). The values are `openssl rand` stand-ins from the stub generator, not real keys, so no rotation is needed.<br><br>That window falls inside the previous audit: `c963653` was committed at 19:15, the audit's scratch files are dated 19:27–19:44, and its report `4ce8bbd` at 19:51. Ninety is three trap-defeating suite runs of 30 setup runs each, which fits that audit's M16, F2 and F3. The origin is likely, not proven. Nothing in the procedure checks for these leaks. This audit removed only the folders its own mutants leaked (32 `tmp.*` under `$TMPDIR` and 30 under `/tmp`, matched by creation time and listed in `reaudit2/leaked*.txt`), and left the earlier ones in place. | `ls -ldT /tmp/ob1-setup.*`; `/Users/mfelker/.claude/jobs/4ac8d127/tmp/reaudit/` timestamps |
| 4 | LOW | **The suite's SQL bootstrap reads a container copy, not the host file.** `run-folder.mjs:54` passes `bootstrap.sql` as an absolute host path. The wrapper copies only `$PWD` (the recipe folder), so that path resolves to the copy left by the one-time manual bootstrap step (`cycle-log.md`, T069 recipe step 3). It matches the host file today (sha256 `fe6825ad…` on both sides). It would go stale only if fork-ci's `bootstrap.sql` changed, which is not a feature file. | `.fork/ci/bin/run-folder.mjs:13,54`; `/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin/psql` |
| 5 | LOW (note) | **`test-list.md` `updated_at: 0d73f53` names the change before the last one** (`86adb88`). A file cannot hold the SHA of the commit that writes it, so this field is off by one by construction. The previous report's Finding 13 can only be met this way. | `tdd/test-list.md:7` |

The previous report's Findings 1, 3–11 and 13 are resolved, with the exception extended to cover Finding 1. Finding 2 is now Finding 1.

Finding 12 (process) was re-checked: the four Phase 10 code commits are 49 s to 2 min apart (19:54:29 to 19:58:10). That is plausible for one strengthened assertion each plus a 13 s suite. Every claimed mutant kill was re-run here regardless.

No credentials were found in the changed files or in `evidence/linux/`. Scanned for long tokens and JWT shapes, the only hits were commit, image-digest and volume names. No repository content attempted to instruct the auditor.

**Properties.**

- **Speed:** the suite takes 13.3 s.
- **Determinism:** no sleeps. Each test uses its own temp checkout. The SQL runtime now copies files per call, so T075's staleness risk is gone for feature files (see Finding 4 for fork-ci's own file).
- **Specific failures:** messages name the key, image or address involved. U54 prints the setup output on failure.

## Mutation results

There is no mutation tool (profile `mutation: null`), so deliberate mutants were used. The procedure for each mutant (`reaudit2/mut.sh`):

- `cp -p` the file to scratch, apply one `perl` edit, and confirm the file differs.
- Run each named test through `tdd.mjs single`. A kill requires `tests=1 fail=1` plus the decisive assertion.
- Run `node --test tests/` with the mutant applied.
- Restore by copy, check with `cmp`, confirm `git status --short` is empty, then run the adapter suite (60/60 after every mutant; after M10, once at the end of the T075 sequence).
- Check leaked temp folders and remove the audit's own.

Logs are in `/Users/mfelker/.claude/jobs/4ac8d127/tmp/reaudit2/`.

**Previous survivors and Phase 10's named mutants, re-run:**

| Mutant | Own test | Caught | Suite (node, 59) | Decisive line |
| ------ | -------- | ------ | ---------------- | ------------- |
| F13 `lean.override.yml:44` image → `alpine:3.20.3` | U36 | Yes | 1 fail | `ob1-init uses the pinned curl image … actual: 'alpine:3.20.3'` |
| F9 `setup.sh:53` `[ … ]` → `[[ … ]]` | A9 | Yes | 24 fail | `clone: completed … actual: 1` (under `/bin/dash`, which exists here) |
| F21 `exit 1` before `setup.sh:54` | U54 | Yes | 24 fail | `key generation ran in a build folder under TMPDIR` |
| F21 (same) | U12 | Yes | as above | `setup reached key generation` |
| F20 `create-bucket.sh:3` `STORAGE_URL` hard-coded | U55 | Yes | 1 fail | `actual: 'http://storage:5000/bucket'` |
| F1+M16 `setup.sh:54-55` `mktemp -d` without template and no trap | U54 | Yes | 1 fail | `key generation ran in a build folder under TMPDIR` (32 leaked `tmp.*` folders removed) |
| F1 `setup.sh:54` `mktemp -d` without template, trap intact | U54 | Yes (was equivalent last audit) | 1 fail | output shows `generate-keys failed in /var/folders/…/T/tmp.…`: macOS `mktemp -d` ignores `TMPDIR` |
| M16 `setup.sh:55` trap removed | U54 | Yes | 1 fail | `strictly deep-equal` on the `TMPDIR` listing (30 leaked `/tmp/ob1-setup.*` folders removed) |
| M10 `db/ob1-schema.sql` `vector(1536)` → `vector(768)` (the T075 sequence) | U41 (`file tests/verify.sql`) | Yes | n/a | `ERROR: U41 thoughts.embedding is not vector(1536)`; host and container sha256 equal at each step (`1ab23bb8…`/3694 B → `a3d4812b…`/3692 B → `1ab23bb8…`/3694 B); container `StartedAt` unchanged |

**Fresh mutants** (this auditor's), aimed at each Phase 10 assertion by a route the remediation did not test:

| Mutant | Own test | Survived | Judgment |
| ------ | -------- | -------- | -------- |
| G1 `lean.override.yml:44` tag → `curlimages/curl:latest` (unpinned) | U36 | No | the pin, not just the image name, is asserted |
| G2 `setup.sh:57` generator call → `(cd "$build" && false)` | U12, U54 | No (both) | early failure without the generator is distinguished from a generator failure; suite 24 fail |
| G3 `setup.sh:54` template hard-coded to `/tmp/ob1-setup.XXXXXX`, trap intact | U54 | No | ignoring `TMPDIR` is caught |
| G4 `create-bucket.sh:5` request URL hard-coded, `STORAGE_URL` assignment intact | U55 | No | a different route from F20 |
| G5 `setup.sh:31` `=` → `==` (a second bashism, re-run path) | A2, U16 | No (both) | dash: `[: self-hosted/v0.8.5: unexpected operator`; suite 10 fail |
| G6 `tests/helpers/harness.mjs:193` `SETUP_SHELL = "/bin/sh"` | none (U4 run) | **Yes** (suite too) | harness mutant, not product code; Finding 2 (LOW) |
| G7 `create-bucket.sh:5` `/bucket` → `/buckets` | U51, U55 | No (both) | U51 kept its address check after the split |

**Score.**

- 15 mutants were run: 7 named mutants re-run (F13, F9, F21, F20, F1+M16, F1, M16), M10, and 7 fresh (G1–G7).
- 14 were caught by the behavior's own test (93%). All 14 product-code mutants were caught.
- The one survivor, G6, sits in the test harness. It is not inside any `DONE` behavior, and it would ship no product bug. It only weakens the bashism guard (Finding 2).
- The sample was risk-based: secret hygiene on failure, the compose pin, the bucket address, and POSIX portability. It is not exhaustive. Coverage is unavailable (profile `coverage: null`).

## Traceability

"Yes" means an automated test drives the real entry point: `setup.sh`, `docker compose config` on the real compose files, `create-bucket.sh`, or the schema in Postgres. "Live" means only the recorded runs cover it: Mac at `c29d91c` (`evidence/mac/`, T037) and Linux at `0c357be` (`evidence/linux/`, T038).

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1.1 exactly always-on running and healthy | A1, U24, U27; V2 (Mac, Linux) | Yes (config); healthy is live |
| US1.2 setup check passes | V3 | Live |
| US1.3 six tools, 1536 capture, reworded search | A5/U41, A8, U33; V4 | Partial; the round trip is live |
| US1.4 re-run keeps secrets | A2, U16 | Yes |
| US1.5 thoughts survive restart | V8 (Linux: full CT reboot) | Live |
| US1.6 interrupted run completed | A3, U12, U13, U14, U53, U54 | Yes |
| US2.1 private bucket, byte-identical round trip | A6, U47–U52, U55; V5 | Partial; the round trip is live |
| US2.2 refused without credentials | V5 | Live |
| US2.3 files survive restart | U31; V8 | Live |
| US3.1 UI absent by default | A1, A7, U24 | Yes |
| US3.2 UI opens behind the password | A7, U25; V7 | Partial |
| US3.3 UI stops alone, tools keep working | V7 | Live |
| SC-001 README alone, time recorded | V1–V4, `mac/11-timing.txt`, Linux 855 s | Live |
| SC-002 Docker and Compose only | A9, H3; setup tests under dash | Yes (no `node` on `PATH`; bashisms now caught on macOS) |
| SC-003 six tools and setup check on first start | A8, U33; V3, V4 | Partial |
| SC-004 survive restart and reboot | V8 | Live |
| SC-005 byte-identical, unauthenticated refused | V5 | Live |
| SC-006 exact sets, UI add and remove | A1, A7, U24–U27 | Yes (config) |
| SC-007 re-run changes nothing | A2, A3, U16, U53 | Yes |
| SC-008 gate checks | V11 (Mac and Linux, 15 of 15 on Linux) | Live (T043 open) |
| SC-009 second function | V9 | Live |
| SC-010 Mac and Linux runs, README names both | `evidence/mac/`, `evidence/linux/`, `README.md:37` | Live; **now covered** |
| SC-011 | withdrawn | n/a |

**SC-010 notes** (none blocks this criterion):

- The Mac run predates one source line: `setup.sh:54`'s `mktemp` template (`3a0ee07`). The Linux run includes it. Between `0c357be` and `9744cd2`, only the README changed.
- On Linux, the model server and the MCP client were on the Mac, reached through an SSH tunnel. The README records this, and the stack's side of `host.docker.internal` is exercised either way (R12 probe 200).
- The host was an unprivileged LXC container with nesting, not a VM or bare metal.
- T038 asked for a "Tested with" table. The README has a single prerequisites sentence naming both runs. SC-010's own wording ("names both as tested") is met.

**Summary.**

- Every `traces` value points at a test that exists and runs (60/60, 0 skipped). U55 now has its own test.
- Untested criteria: none.
- 11 criteria are covered only by recorded live runs, by design of the test list. The previous report's reading still applies: that is a gap, not a verdict reason.
- Tests tracing to nothing: H1–H3 (harness self-checks).

## What was not audited

- **The live runs** were taken from `evidence/mac/` and `evidence/linux/` as written, after a read and a token scan. Nothing ran against a real stack, real images, a model server or an MCP client.
- **Mutation was a sample of 15 hand-made mutants**, not a tool run.
  - No mutants were applied to the README, `metadata.json`, `docker-compose.yml`, the fixture compose file, or the rest of the harness.
  - Earlier audits' killed mutants (M1–M18 and F2–F19, except those re-run above) were not re-run. Their code is unchanged since `c963653`.
- **Test files not read in full**: `setup.test.mjs`, `acceptance.test.mjs` and most of `compose.test.mjs`. Only the regions Phase 10 changed, and the tests around them, were smell-checked. The rest is unchanged since the previous audit.
- **Unchanged behaviors' classifications** were carried from the previous audits' per-commit evidence. Phase 10 changed only tests.
- **fork-ci on GitHub runners** was not checked: whether it runs this folder's Docker-gated tests, U46, and the SQL verify.
- **Coverage**: no tool in the profile.
- **README content, gate rules and markdownlint** (T040–T043): docs gates, out of scope for this rubric.
- **Performance, concurrency and Windows**: no criterion, not assessed.
- **Audit side effects.**
  - Container `ob1-006-pgtest` was not restarted. Each `verify.sql` run left a scratch database, by design.
  - The temp folders this audit's mutants leaked were removed. The remediation session's earlier leftovers were left in place (Finding 3).
  - The worktree was left clean at `9744cd2`.
