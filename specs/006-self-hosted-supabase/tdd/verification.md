---
feature: 006-self-hosted-supabase
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # rubric graded against; lane upstream-bound, so the staged-PR section did not apply
verified_at: c963653 # contrib/mfelker/self-hosted-supabase (worktree .worktrees/contrib-self-hosted-supabase); artifacts at fork main b20c1f4; re-audit T044 after remediation T061-T072
behaviors: 62
proven: 42
likely: 1
test_after: 19 # 17 under the owner exception (T066, plan.md:126); U54 and U55 not covered by it
no_test: 0
high_smells: 0
criteria_total: 22 # US1.1-1.6, US2.1-2.3, US3.1-3.3, SC-001-SC-010; SC-011 withdrawn
criteria_covered: 11 # by an automated test at the recipe's real entry point; 10 more only by the recorded Mac live run; SC-010 (Linux half) by nothing
mutation_score: 89 # deliberate mutants, no tool: 24 of 27 non-equivalent caught by the behavior's own test; 28 run, 1 equivalent
mutants_survived: 4 # F1 (equivalent), F9, F13, F21; F13 breaks FR-009, which U36 traces (HIGH); 3 survive the local suite (F1, F9, F13); F9 is caught under dash
suite: 59 passed, 0 failed, 0 skipped, ~13s wall (adapter suite, node-plain + sql, with the test-only psql wrapper and container ob1-006-pgtest)
---

# TDD Verification: Lean self-hosted Supabase for Open Brain (re-audit, T044)

**Verdict: FAIL.** The rubric makes any `TEST_AFTER` behavior a `FAIL`. The two behaviors added in remediation, U54 and U55, are `TEST_AFTER`, and the owner exception does not name them.

**Verdict with the T066 exception honored: still FAIL.**

- U54 and U55 fall outside the exception.
- Fresh mutant F13 survives U36 and breaks FR-009, which U36 traces (HIGH).
- SC-010's Linux half (T038) has no test and no recorded run.

The best verdict would be `PASS_WITH_GAPS`, and only if all of these hold:

- the exception is extended to U54 and U55;
- U36 is made to catch F13;
- T038 passes;
- the owner accepts the recorded live runs as the tests for ten live-only criteria.

The remaining gaps would then be:

- mutation by hand only, with no tool;
- no coverage tool;
- U34 graded `LIKELY`;
- ten criteria covered only by the recorded live run.

**Verdict without any exception: FAIL** (19 `TEST_AFTER`).

**What remediation fixed.**

- All five previous HIGH smells are resolved, and 0 HIGH smells remain.
- Every surviving mutant from the previous audit (M6, M7, M15, M16, M18) now fails the behavior's own test and the suite.
- 15 of the 19 fresh mutants were caught by their own test.

One fresh survivor, F13, is HIGH (Finding 4). It changes the `ob1-init` image, which breaks FR-009, and FR-009 is what U36 traces. It is the same case as the previous audit's M7.

**Independence.** This re-audit ran from cold context. The auditor wrote none of the code or tests.

- Every changed test and source file, the harness, and every other test file were re-read at `c963653`.
- The smell pass was done directly, not delegated.
- Every JavaScript-runtime mutant was applied, observed, restored with `git checkout`, checked clean, and followed by a green adapter suite (59/59) before the next mutant.
- The one SQL mutant (M10) was followed only by `file tests/verify.sql`, and that run read stale content (Finding 5). After the container restart, the host and container hashes matched and the final suite was 59/59.

## The owner exception, judged against the rubric as written

`plan.md:126` (Complexity Tracking, task T066) accepts 17 behaviors as `TEST_AFTER`: U10, U13, U19, U22, U25–U29, U41–U46, U51 and A5. Its factual claims were checked and hold:

- each is a first-run pass on behavior that an earlier cycle built;
- each has a mutant record;
- the five behaviors whose tests let a mutant through (U13, U33, U36, U53, A9) were strengthened and now kill those mutants. This audit re-ran those mutants (below).

The rubric defines no waiver, so under it the 17 stay `TEST_AFTER` and keep the verdict at `FAIL`. Specs 004 and 005 read their exceptions the same way. The exception also does not reach U54 or U55, which it does not name.

## Test-first evidence

Method:

- The cycle log's remediation section (`tdd/cycle-log.md:399-472`) was read against `git log --stat 11285c0..c963653`.
- The new behaviors were re-run at their own commits, from `git archive` extracts in a temporary folder; no branch was switched.
- Rows unchanged since the previous audit keep its classification. Their evidence was not re-derived beyond spot checks, and the earlier table (git history of this file) has the per-commit detail.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| A1, A2, A3, A4, A6, A7, A8, A9 | PROVEN | red at T050 (`6052532`, `not implemented` stubs) before any source; A4 and A9 strengthened at `751bd3b`, `c9d27a5`, `137bafb` (test only, each re-proven against a named mutant) |
| A5 | TEST_AFTER | no whole-file red; under the T066 exception |
| U1–U9, U11, U12, U14–U18, U20, U21 | PROVEN | reds recorded, test and source in the same commit (previous audit's table) |
| U10, U13, U19, U22 | TEST_AFTER | first-run passes; under the exception. U13, U19, U22 strengthened in remediation (test-only commits `c610659`, `751bd3b`, `c9d27a5`) |
| U24, U30–U33, U35, U36 | PROVEN | stream C reds; U33 and U36 strengthened at `f5051ce` and `eb06260` (test only) |
| U25–U29 | TEST_AFTER | first-run passes; under the exception. U29 strengthened at `c9d27a5` |
| U34 | LIKELY | amended commit (`e9789ed` → `5729d95`); the log now records it (T071) |
| U38–U40, U47–U50, U52, U53 | PROVEN | reds recorded (previous audit) |
| U41–U46, U51 | TEST_AFTER | first-run passes; under the exception |
| **U54** | **TEST_AFTER, not under the exception** | The test was committed alone at `9e6374b`. Re-run at that commit (archive extract) it **passes against the unfixed `setup.sh`**: `✔ U54 … ℹ pass 1 ℹ fail 0`. The source change `3a0ee07` (`mktemp -d "${TMPDIR:-/tmp}/…"`) made the test able to see a leftover. It did not create the cleanup behavior, which already existed (`trap … EXIT`). The only failure ever recorded comes from mutant M16. The log says so honestly (`cycle-log.md:443`). |
| **U55** | **TEST_AFTER, not under the exception** | Row added by T072 (`test-list.md:72`). It is the second half of U51's test (`create-bucket.test.mjs:66-70`), added at `723f218`, after its source `STORAGE_URL="${STORAGE_URL:-…}"` landed at `ea127e6`. No red was recorded. |

**Rule for strengthened rows.** A test strengthened in place keeps its behavior's class.

- `PROVEN` rows whose tests remediation strengthened (A4, A9, U20, U33, U36, U53) stay `PROVEN`: the behavior's original red is still in the history, and the strengthening is an amendment to an existing row, each re-proven against a named mutant. This follows spec 005's "amendments to existing rows" reading.
- `plan.md:126` and the Phase 9 preamble say strengthened tests "still grade `TEST_AFTER`". Read with this rule, that applies to rows that were already `TEST_AFTER` (U13, U19, U22, U29), and those stay `TEST_AFTER`.
- Only behaviors given a new id (U54, U55) are graded on their own history, which is why T073 covers just those two.

**Existing tests changed in `11285c0..c963653`, checked for weakening.** No real check was lost.

- **A9** (`acceptance.test.mjs:133-142`).
  - Removed: `programs ⊆ {git, docker}` over the stub log. Only the stubs write to that log, so the assertion could not fail (previous Finding 1).
  - Added: `node`, `python3`, `kubectl` and `helm` are absent from the checkout's `PATH`, and setup still exits 0. The harness no longer links `node` into that `PATH` (`harness.mjs:170-181`).
  - Net: stronger. M15 now fails 11 tests.
- **U19 and A4** (`setup.test.mjs:256-259`, `acceptance.test.mjs:81`).
  - Before: every `.env` value of 16 or more characters.
  - After: the 14 `SUPABASE_KEYS` plus `MCP_ACCESS_KEY`, with presence asserted.
  - Against the fixture `.env`, the only values of 16 or more characters are exactly those 15 generated keys. The others are `DASHBOARD_USERNAME=supabase`, `KONG_HTTP_PORT=8000`, a blank `SUPABASE_PUBLISHABLE_KEY` and blank model settings. So no checked value was dropped. Net: equivalent scope, no conditional, stronger.
- **Harness.** The stub `git` now copies a prebuilt stand-in clone instead of calling `node`. Its behavior is unchanged, and H2 still checks it.
- **No test was skipped, removed or excluded.** The adapter's `suite` and a direct `node --test tests/` both report `skipped 0`.

**`tasks.md` against the test list.** All 62 behaviors are `DONE`. T061–T072 are ticked, and each ticked task's behavior is `DONE`. T044 is correctly unticked. One "done when" is ticked without being met in substance: T069 (Finding 3).

## Findings

Ordered by severity. "Own test" means the behavior's test run alone through `tdd.mjs single`. "Suite" means a full `node --test tests/` run with the mutant applied.

| # | Severity | Finding | Evidence |
| - | -------- | ------- | -------- |
| 1 | HIGH (verdict) | **U54 and U55 are `TEST_AFTER` and outside the owner exception.** U54 passes at its own test commit against unfixed source. U55's source predates its test. Both have mutant evidence only (M16, F2 and F3 for U54; F20 for U55). The exception names 17 behaviors and neither of these. | `9e6374b` (archive run: pass 1); `3a0ee07`; `ea127e6` → `723f218`; `plan.md:126`; `tdd/test-list.md:71-72` |
| 2 | HIGH (verdict) | **17 behaviors are `TEST_AFTER` under the T066 exception.** The rubric has no waiver, so they keep the verdict at `FAIL` (spec 004 and 005 precedent). The exception's claims were verified, and its mutants re-killed below. | `plan.md:126`; `tdd/cycle-log.md:436-438` |
| 3 | HIGH (verdict) | **SC-010's Linux half has no test and no recorded run.** T038 is open, `evidence/linux/` does not exist, and SC-010 requires both runs. The rubric makes an untested criterion a `FAIL` condition. T038 (Phase 7) precedes T044 (Phase 8) in `tasks.md`, so this finding clears only when T038 runs.<br><br>**The rule that separates this from the ten live-only criteria:** those ten have recorded, vetted evidence from the Mac run, which the test list declares as their test by design; they are a gap, not a verdict reason (previous audit's reading). SC-010's Linux half has no evidence at all. Spec 003's audit graded manual-only criteria HIGH; if the owner wants that stricter reading here, those ten become verdict reasons too. | `spec.md:177`; `tasks.md:208`; `evidence/` holds only `mac/`, `dmr/`; `specs/003-tdd-extension/tdd/verification.md:148` |
| 4 | HIGH | **Surviving mutant in U36: the `ob1-init` image is unguarded.** Mutant F13 (`image: curlimages/curl:8.11.1` → `alpine:3.20.3`, which has no `curl`) passes U36 and the whole suite. `create-bucket.sh` would then fail at start, so FR-009's bucket would never be created.<br><br>U36 traces FR-009 (`test-list.md:92`), so under the previous audit's severity rule this is HIGH, the same case as M7. The plan's Constitution VI also requires "a pinned public image". Assert `init.image` equals the pinned `curlimages/curl` tag. | `lean.override.yml:44`; `tests/compose.test.mjs:139-151`; `tdd/test-list.md:92`; `plan.md:73` |
| 5 | MED | **The SQL runtime still serves stale content, and T069's tick is unearned in substance.** A size-changing edit to `db/ob1-schema.sql` was made (`vector(1536)` → `vector(768)`, minus 2 bytes). The container saw it (matching sha256, and U41 failed correctly). After `git checkout`, the host file was 3694 bytes (`1ab23bb8…`), but the container read **3692 bytes** (`4704f61f…`): the restored content truncated, missing its final `;`. `file tests/verify.sql` **passed** against that content, so the SQL test passed against a file that is not the repository's. T069's "done when" (pass after a size-changing edit and restore, no restart) is met literally, but it was the wrong check. T069 preferred a non-bind-mount route, and the wrapper is still the bind-mount version. The container was restarted to restore consistency. | `/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin/psql`; `tdd/cycle-log.md:466-472`; `tasks.md:312` |
| 6 | MED | **U54 and U12 don't assert that key generation was reached.** Mutant F21 adds `exit 1` before `mktemp` in `setup.sh:54`, so setup never generates secrets. It passes both U54 and U12 on their own; the suite kills it through 22 other tests. Both tests assert only a non-zero exit plus no leftovers, which an early exit satisfies. Assert the generator's failure is what stopped setup, for example that the output names it. | `tests/setup.test.mjs:152-161,313-322` |
| 7 | MED | **A bashism in `setup.sh` passes locally.** The harness runs `/bin/sh`, which on macOS is bash. Mutant F9 (`if [[ ! -s "$ENV_FILE" ]]` at `setup.sh:53`) passes A9 and the whole suite. Run under `/bin/dash` with the same harness, setup exits 1 (`supabase/docker/.env has no JWT_SECRET`). So the bashism would be caught only on a dash runner, such as fork-ci's `ubuntu-latest` (`.github/workflows/fork-ci.yml:30`). Whether fork-ci runs this folder was not checked. The log's "dash re-check OK" is a manual step, not a test. | `tests/helpers/harness.mjs:189`; `setup.sh:53` |
| 8 | MED | **Eager test: U51 carries U55.** The `STORAGE_URL` override (U55) is asserted inside U51's test, so U55 cannot be selected on its own. A U55 failure reports as U51, and U51 has two reasons to fail. | `tests/create-bucket.test.mjs:56-72`; `tdd/test-list.md:72` |
| 9 | LOW | **U54 only sees leftovers under `TMPDIR`.** Mutant F1 (revert `mktemp -d` to no template) passes U54 and is equivalent while the trap holds. `9e6374b` still had the trap, but M16 applied on top of it (no trap, no template) is the state the log tested: a secret-bearing folder left in the system temp root, invisible to U54. Nothing asserts that the build folder is created under `TMPDIR`. | `setup.sh:54`; `tests/setup.test.mjs:313-322` |
| 10 | LOW | **`assert.notEqual(r.code, 0)` also passes when the spawn itself fails** (`status` null). Every such test pairs it with a message or file assertion, except U54. | `tests/setup.test.mjs:20,30,40,91,102,156,231,245,319`; `tests/create-bucket.test.mjs:38,48,51` |
| 11 | LOW | **H1 still doesn't check `git status`'s exit code.** This is the same pattern T067 fixed in U22 and A4; it is a harness self-check, so LOW. With a failing `git` first on `PATH`, H1 passes while U22 and A4 now fail (checked). | `tests/harness.test.mjs:21-22` |
| 12 | LOW | **Process.** `9e6374b` committed a test that could not fail; the log records this (`cycle-log.md:443`). The five T061–T065 commits are about 40 s apart (19:05:52 to 19:08:32), each logging two to three single runs and a 13 s suite. That is plausible but tight, so this audit re-ran every named mutant rather than trusting the log. | `git log 11285c0..c963653` |
| 13 | LOW | **The test list's `updated_at: 8c7ab08` is stale.** The file last changed at fork-main `b20c1f4`. | `tdd/test-list.md:7` |

Previous findings 1–5 (HIGH smells), 7, 8 (now behavior U54), 10 and 11–15 are resolved. Finding 9 is only partly resolved (Finding 5 above), and Finding 6 is now Finding 2.

No credentials were found: test keys are labelled stand-ins such as `test-service-role-key-abc123`. No repository content attempted to instruct the auditor.

**Properties.**

- **Speed:** the suite takes about 13 s.
- **Determinism and isolation:** no fixed sleeps. Each test uses its own temp checkout.
- **Specific failure messages:** they name the key or service involved.
- **Shared state:** the SQL tests are the exception. They depend on an external container, and Finding 5 shows that container can serve stale content, so a green from `verify.sql` is not yet trustworthy evidence.

## Mutation results

There is no mutation tool (profile `mutation: null`), so deliberate mutants were used. The procedure for each mutant:

- One edit was applied with `perl` in the worktree.
- It was checked as applied (`git diff` non-empty).
- The behavior's own test ran through `node .fork/ci/bin/tdd.mjs single` from fork main.
- `node --test tests/` ran in the folder with the mutant applied.
- The file was restored with `git checkout`, `git status --short` was checked empty, and the adapter suite was re-run (59/59 after every mutant).

The SQL mutant also compared host and container sha256 (Finding 5). The script and its outputs are in `/Users/mfelker/.claude/jobs/4ac8d127/tmp/reaudit/`.

**Previous survivors and named remediation mutants, re-run:**

| Mutant | Own test | Caught by own test | Suite | Decisive line |
| ------ | -------- | ------------------ | ----- | ------------- |
| M6 `lean.override.yml:37` `CHAT_API_BASE: ${EMBEDDING_API_BASE}` | U33 | Yes | 1 fail | `AssertionError: CHAT_API_BASE` |
| M7 `:45` entrypoint `/init/create-bucket-missing.sh` | U36 | Yes | 1 fail (U36) | `ob1-init runs the mounted script` |
| M7b `:53` mount target `/init/other.sh` | U36 | Yes | 1 fail (U36) | strict equal on `target` |
| M15 hard `node -e ""` before `setup.sh:86` | A9 | Yes | 11 fail (A1–A4, A7–A9, U20–U22, U53) | `clone: completed … actual: 127` |
| M16 `setup.sh:55` cleanup `trap` removed | U54 | Yes | 1 fail (U54) | `strictly deep-equal` on the `TMPDIR` listing |
| M18 `setup.sh:56` `cp .env.example` → `: >` | U13 | Yes | 11 fail | `JWT_SECRET present` |
| M18 (same) | U53 | Yes | as above | `JWT_SECRET present` |
| M1 `setup.sh:57` generator output not silenced | U19 | Yes | 2 fail (A4, U19) | `JWT_SECRET value printed` |
| M1 (same) | A4 | Yes | as above | `JWT_SECRET not printed` |
| M29r `:17` `rest` → `service_healthy` | U29 | Yes | 1 fail (U29) | strict equal on the condition |
| M10 `db/ob1-schema.sql` `vector(1536)` → `vector(768)` | A5/U41 (`file tests/verify.sql`) | Yes | n/a | `ERROR: U41 thoughts.embedding is not vector(1536)` |

T067's "done when" was also checked without editing the tree. With a `git` that exits 1 and prints nothing first on the runner's `PATH`, U22 and A4 fail (`actual: 1`), and H1 still passes (Finding 11).

**Fresh mutants** (this auditor's), on `setup.sh`, `lean.override.yml` and `init/create-bucket.sh`:

| Mutant | Own test | Survived | Judgment |
| ------ | -------- | -------- | -------- |
| F1 `setup.sh:54` `mktemp -d` without template | U54 | Yes (suite too) | Equivalent while the trap holds; blind spot, Finding 9 |
| F2 `:55` trap removes only `$build/.env` | U54 | No | the empty folder is seen |
| F3 `:55` trap on `INT TERM` instead of `EXIT` | U54 | No | leftover seen |
| F4 `:57` generator failure ignored (`\|\| true`) | U12 | No | exit 0 caught (U12, U13, U54 fail) |
| F6 `touch "$RECIPE_DIR/setup.log"` before `:86` | U22 | No | U22 and A4 fail |
| F7 `:20` `-hex 32` → `-hex 31` | U9 | No | regex fails (U9, U13, U14) |
| F8 `:44` placeholder `.env` not removed when Compose fails | U7 | No | `.env` exists |
| F9 `:53` `[ … ]` → `[[ … ]]` (bashism) | A9 | Yes (suite too) | Caught under `/bin/dash`; Finding 7 |
| F10 `:66` example-value comparison broken | U18 | No | exit 0 caught |
| F12 `:34` `--depth 1` → `--depth 2` | U4 | No | strict equal |
| F13 `lean.override.yml:44` image → `alpine:3.20.3` | U36 | Yes (suite too) | **HIGH**: breaks FR-009, which U36 traces; Finding 4 |
| F14 `:51` `SERVICE_ROLE_KEY: ${ANON_KEY}` | U36 | No | placeholder mismatch |
| F15 `:35` `EMBEDDING_API_KEY: ${CHAT_API_KEY}` | U33 | No | `EMBEDDING_API_KEY` |
| F16 `:36` `EMBEDDING_MODEL: ${CHAT_MODEL}` | U33 | No | U33 and A8 fail |
| F17 `:46` `restart: on-failure` | U36 | No | strict equal |
| F18 `:49` ob1-init waits for `service_started` | U36 | No | strict equal |
| F19 `:31` `host.docker.internal:127.0.0.1` | U34 | No | deep equal |
| F20 `create-bucket.sh:3` `STORAGE_URL` hard-coded | U51 (U55 half) | No | URL strict equal |
| F21 `setup.sh` `exit 1` before `:54` | U54 (and U12) | Yes for U54 and U12; suite kills it (22 fail) | Precondition not asserted; Finding 6 |

**Score.** 28 mutants were run (9 re-run, including M7b and M29r, and 19 fresh), and F1 is judged equivalent. Of the 27 non-equivalent mutants, 24 were caught by the behavior's own test (89%).

The 3 that were not:

- **F9:** environment-dependent, and caught under dash. It breaks Linux support (SC-010), which A9 does not trace, so MED.
- **F13:** breaks FR-009, which U36 traces, so **HIGH** (Finding 4).
- **F21:** a precondition gap. It does not break C1's no-leftover invariant, which U54 and U12 trace, so MED, and the suite still kills it.

Three survive the local suite: F1 (equivalent), F9 and F13.

The sample was risk-based: secrets handling, temp-file hygiene, the compose wiring the remediation touched, and the bucket script's address. It is not exhaustive. Coverage is unavailable (profile `coverage: null`).

## Traceability

"Yes" means an automated test drives the real entry point: `setup.sh`, `docker compose config` on the real compose files, `create-bucket.sh`, or the schema in Postgres. "Live only" means only the Mac live run covers it (`evidence/mac/`, T037).

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1.1 exactly always-on running and healthy | A1, U24, U27 (config); V2 live | Yes (config level); healthy is live only |
| US1.2 setup check passes | V3 | Live only |
| US1.3 six tools, 1536 capture, reworded search | A5/U41, A8, U33; V4 | Partial; the round trip is live only |
| US1.4 re-run keeps secrets, all present | A2, U16 | Yes |
| US1.5 thoughts survive restart | V8 | Live only |
| US1.6 interrupted run completed (amended by T070) | A3, U13, U14, U53, U54 | Yes; spec, contract C1 and A3 now agree |
| US2.1 private bucket, byte-identical round trip | A6, U47–U52, U55 (stub storage); V5 | Partial; the round trip is live only |
| US2.2 refused without credentials | V5 | Live only |
| US2.3 files survive restart | U31; V8 | Live only |
| US3.1 UI absent by default | A1, A7, U24 | Yes |
| US3.2 UI opens behind the password | A7, U25; V7 | Partial |
| US3.3 UI stops alone, tools keep working | V7 | Live only |
| SC-001 README alone, time recorded | V1–V4, `11-timing.txt` | Live only |
| SC-002 Docker and Compose only | A9, H3 | Yes (now a real constraint: no `node` on `PATH`, M15 killed; bashisms not caught on macOS, Finding 7) |
| SC-003 six tools and setup check on first start | A8, U33; V3, V4 | Partial |
| SC-004 survive restart and reboot | V8 | Live only |
| SC-005 byte-identical, unauthenticated refused | V5 | Live only |
| SC-006 exact sets, UI add and remove | A1, A7, U24–U27 | Yes (config level) |
| SC-007 re-run changes nothing | A2, A3, U16, U53 | Yes |
| SC-008 gate checks | V11, `11-gate.txt` | Live only (T043 open) |
| SC-009 second function | V9 | Live only |
| SC-010 Mac and Linux runs | Mac T037 only | **Not covered**: T038 (Linux) not run (Finding 3) |
| SC-011 | withdrawn | n/a |

Summary:

- **Every `traces` value points at a test that exists and runs** (59/59, 0 skipped). U55's points at half of U51's test (Finding 8).
- **Untested criteria:** SC-010's Linux half. Ten criteria are covered only by the recorded Mac live run; the test list declares this by design.
- **Tests tracing to nothing:** H1–H3 (harness self-checks). The `STORAGE_URL` override is now traced (U55).

## What was not audited

- **The live acceptance run** was taken from `evidence/mac/` as written. Nothing was run against a real stack, real Supabase images, a model server or an MCP client.
- **The Linux run (T038)** does not exist yet.
- **Mutation was a sample of 28 hand-made mutants**, not a tool run.
  - No mutants were applied to the README, `metadata.json`, `docker-compose.yml`, the fixture compose file, or the harness. The harness was judged by reading it.
  - Only one SQL mutant was run (M10), because of the bind-mount staleness in Finding 5.
- **The previous audit's killed mutants** (M2–M4, M5b, M8, M9, M11–M14, M17) were not re-run. The code they touch is unchanged since `11285c0`, except `setup.sh:54`.
- **Unchanged behaviors' classifications** were carried from the previous audit's per-commit evidence with spot checks, not fully re-derived.
- **fork-ci on GitHub runners**: whether the Docker-gated tests and U46 run there, and whether `/bin/sh` there is dash (Finding 7), was not checked.
- **Coverage**: no tool in the profile.
- **README content, gate rules and markdownlint** (T040–T043): docs gates, out of scope for this rubric.
- **Performance, concurrency and Windows**: no criterion, not assessed.
- **Audit side effects.**
  - Container `ob1-006-pgtest` was restarted once, to clear the stale bind mount the audit itself triggered.
  - Each `verify.sql` run left a scratch database in it, by design.
  - Temporary files are under `/Users/mfelker/.claude/jobs/4ac8d127/tmp/reaudit/`.
  - The worktree was left clean at `c963653`.
