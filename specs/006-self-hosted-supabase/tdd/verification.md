---
feature: 006-self-hosted-supabase
verdict: FAIL
standard: .specify/templates/overrides/tdd-test-quality-rubric.md # rubric graded against; lane upstream-bound, so the staged-PR section did not apply
verified_at: 11285c0 # contrib/mfelker/self-hosted-supabase (worktree .worktrees/contrib-self-hosted-supabase); artifacts at fork main 8d47e41
behaviors: 60
proven: 42
likely: 1
test_after: 17
no_test: 0
high_smells: 5
criteria_total: 22 # US1.1-1.6, US2.1-2.3, US3.1-3.3, SC-001-SC-010; SC-011 withdrawn
criteria_covered: 11 # by an automated test at the recipe's real entry point; 10 more only by the recorded Mac live run; SC-010 (Linux half) by nothing
mutation_score: 74 # deliberate mutants, no tool: 14 of 19 non-equivalent caught by the behavior's own test; 20 run, 1 equivalent
mutants_survived: 5 # 4 inside DONE behaviors (U33, U36, A9, U13+U53); 4 of the 5 also survive the whole suite
suite: 58 passed, 0 failed, ~14s wall (adapter suite, node-plain + sql, with the test-only psql wrapper and container ob1-006-pgtest)
---

# TDD Verification: Lean self-hosted Supabase for Open Brain

**Verdict: FAIL.** Deliberate mutants survive inside DONE behaviors U33, U36, A9, U13 and U53. Three of them (M6, M7, M15) also survive the whole 58-test suite. Separately, 17 behaviors are `TEST_AFTER`: they passed on their first run and have no recorded red.

**Independence.** This audit was run from cold context. The auditor wrote none of the code or tests.

- Every test and source file was re-read at `11285c0`.
- Every claim in the cycle log was checked against the git history, including unreachable objects (`git fsck --unreachable`).
- The smell pass was done by the auditor directly, not delegated.

Reading coverage:

- Read in full: `spec.md`, `tdd/test-list.md`, `tdd/cycle-log.md`, the contract, and all test and source files.
- Read in part: `plan.md` (lines 1–60 and 100–134), `research.md` (every R heading, plus R9 and R10 in full) and `tasks.md` (all task lines and the landing phase).

Judgments on the repository-relative smells:

- **Foreign style.** The folder's tests match its own conventions and the node-plain exemplar `recipes/atomizer/atomize-text.test.mjs`: `node:test` with `node:assert/strict`, a header carrying a `Run:` line, and behavior ids prefixing test names. No finding.
- **Bypassed test utility.** The profile's helpers (`.fork/ci/test/fixtures.mjs`, `.fork/ci/test/helpers/`) are fork tooling that an upstream recipe cannot import, so the recipe's own `tests/helpers/harness.mjs` is not a bypass. No finding.
- **Redundant test.** The A/U pairs (A1/U24, A2/U16, A7/U25, A4/U19/U22) are double-loop pairs at different levels. No finding.
- **Framework under test.** U28 and U29 assert the recipe's merged configuration, not Compose's `!reset` semantics. No finding.

**Discipline.** The loop itself shows real discipline:

- 42 behaviors have a recorded red, and their test and source land in the same commit (or the test first).
- No existing test was weakened.
- Every ticked task in `tasks.md` maps to a `DONE` behavior.
- The cycle log openly declares the first-run passes.

**Test strength.** This is where the feature fails. Four tests cannot tell a correct configuration from a broken one, in the ways listed under Findings 1–4.

## Test-first evidence

Method:

- The cycle log was read against `git log --stat` over `062b573..11285c0`, both first-parent and the full graph.
- Every first-run-pass commit was checked: it touches only the test file, and the behavior's source already existed in an earlier commit.
- The source of U28/U29 is in U24's `4beeb8d`, U51's request shape in `ea127e6`/`fb9a8ae`, U10's `openssl rand` in `e0cc3ef`, and U19's `>/dev/null` in `4358f1f`.
- To find amends, author and committer timestamps were compared for every commit, and unreachable commits were examined.

Each claim from the brief, checked against history:

- **First-run passes (U10, U13, U19, U22, U25–U29, U41–U46, U51, A5).** Confirmed: each green commit touches only test files.
- **U50 and U52 are not first-run passes.**
  - U50: the log records a real red after the test was strengthened (`could not reach storage`), and source and test change together in `fb9a8ae`.
  - U52: the log records a real red (`apikey header missing`), and source and test change together in `f099344`.
  - Both are `PROVEN`. The test list's "(mutant-proven)" label on them is inaccurate (Finding 12).
- **Two parallel streams.** Confirmed: the merges are `17968fc` (stream B, U47–U52) and `612936a` (stream C, U24–U36).
  - Stream B's 6 commits touch only `init/create-bucket.sh` and its test.
  - Stream C's 13 commits touch only `docker-compose.yml`, `lean.override.yml` and `tests/compose.test.mjs`.
  - Both stream branches and their worktrees are gone, so their reflogs are gone too.
- **U24 carried U28/U29's overrides.** Confirmed: `4beeb8d:lean.override.yml` already has `api-gw: depends_on: !reset {}` and `storage: depends_on: !override {db, rest}`. U28's (`5974b52`) and U29's (`6dc2e1c`) commits are test-only.
- **The U34 amend.** Confirmed: `5729d95` is the only commit in the range whose author and committer times differ (17:38:24 vs 17:38:41).
  - The pre-amend commit `e9789ed` survives as an unreachable object. Its test asserted `extra_hosts["host.docker.internal"]`, which cannot pass against the list that `config --format json` emits. That commit was therefore committed red, with source and test together.
  - The amend replaced the assertion with `deepEqual(extra_hosts, ["host.docker.internal=host-gateway"])`.
  - The red the log records ("assertion on undefined extra_hosts") would fail with either shape, so the history cannot show that the corrected test failed before the source. Hence `LIKELY`.
  - The stashes `6022d8a` and `4aee2d7` (in-progress U30 and U35 work) are benign.
- **U53 added mid-loop.** Confirmed at `23a226c`, with test and source together and a red recorded. Note that it landed after the outer loop closed (`f1ba495`) and after the README (`f578677`), so it is post-loop rather than mid-loop.
- **Weakened existing tests: none.**
  - Every removed line in test files across the range is an import change, a helper restructure (`224c874`: `config()` split into `configIn()`), the `todo` switch removal (`f1ba495`), or a doc comment.
  - Each A-test's body is byte-identical between its first write (`6052532`) and its flip commit; only the `{ todo }` option changed.
- **`tasks.md` against the test list.** Every `[X]` task's behavior ids are `DONE`. There is no unticked behavioral task with a `DONE` behavior.

| Behavior | Class | Evidence |
| -------- | ----- | -------- |
| A1, A2, A3, A4, A7, A8, A9 | PROVEN | red at T050 (`6052532`: tests added with `not implemented` stubs, `actual: 1`, before any source); bodies unchanged until flips `e1d8cec`, `95ad94d`, `6800132`, `c13bee4`, `d85ecbf`, `c6cc7bf`, `5a3afd4` |
| A5 | TEST_AFTER | no whole-file red (log declares it); evidenced only by U41–U45 mutants |
| A6 | PROVEN | red at T050 (`create-bucket.sh: not implemented`); flip `161ec06` after stream B |
| U1, U2, U3 | PROVEN | reds recorded; `5da7e21`, `7eeb283`, `c6f6edf` each add test and source together |
| U4–U9 | PROVEN | reds recorded; `97a2831`, `4bd2b4d`, `1858e60` (first run a SyntaxError, then a valid red), `b508ea6`, `4358f1f`, `e0cc3ef` |
| U10 | TEST_AFTER | first-run pass; `3e5e229` test only; mutant only |
| U11, U12 | PROVEN | reds recorded; `050da74`, `26fe491` |
| U13 | TEST_AFTER | first-run pass; `3f43058` test only; mutant only |
| U14–U18 | PROVEN | reds recorded; `729517d`, `2427afd`, `8971032`, `ea346f5`, `de42462` |
| U19 | TEST_AFTER | first-run pass; `4ac1479` test only (the log entry names no commit); mutant only |
| U20, U21 | PROVEN | reds recorded; `1c02edf`, `95124f5` |
| U22 | TEST_AFTER | first-run pass; `300fd36` test only; mutant only |
| U53 | PROVEN | red recorded (`actual: 1, expected: 0`); `23a226c` test and source together |
| U24 | PROVEN | red 2 recorded (extra services, `ob1-init` missing); `4beeb8d` |
| U25, U26, U27, U28, U29 | TEST_AFTER | first-run passes; `598c934`, `9c70f74`, `a76fabe`, `5974b52`, `6dc2e1c` are test only; mutants only |
| U30, U31, U32, U33, U35, U36 | PROVEN | reds recorded (terse, stream C); `b508947`, `fb56c99`, `224c874`, `b8c0ffb`, `3b02e01`, `945d6ab` add test and source together |
| U34 | LIKELY | red recorded, but commit amended (`e9789ed` → `5729d95`), and the recorded red predates the corrected assertion |
| U38, U39, U40 | PROVEN | reds recorded; `e86f7b6`, `ad52da9`, `7cda837` |
| U41, U42, U43, U44, U45 | TEST_AFTER | first-run passes on U38's verbatim copy; `6e190f4`, `950d6f1`, `3f81d15`, `f190095`, `9f97b79` test only; mutants only |
| U46 | TEST_AFTER | first-run pass; `92d04ce` test only; mutant only |
| U47, U48, U49 | PROVEN | reds recorded; `980c6f3`, `ea127e6`, `6954f0c` |
| U50 | PROVEN | 500 half was a first-run pass; then a strengthened test failed (`could not reach storage`) and source changed in the same commit `fb9a8ae` |
| U51 | TEST_AFTER | first-run pass; `723f218` test only; mutants only |
| U52 | PROVEN | red recorded (headers missing); `f099344` test and source together; the never-printed half mutant-checked |

No `NO_TEST` behaviors. H1–H3 (`tests/harness.test.mjs`) are harness self-checks, not behaviors.

## Findings

Ordered by severity. "Survives the suite" means all 58 tests stayed green with the mutant applied.

| # | Severity | Finding | Evidence |
| - | -------- | ------- | -------- |
| 1 | HIGH | **Tautological assertion (A9, SC-002).** Only the stub `git` and `docker` write to `$STUB_LOG`, so `programs ⊆ {git, docker}` cannot fail. A9's only real evidence is exit 0 under the restricted `PATH`, and that `PATH` also holds `node`. Mutant M15 adds a hard `node -e ""` line to `setup.sh` (under `set -e` it fails without `node`, which research R10 rules out for readers): A9 passes, and it **survives the suite**. A9 should assert that setup runs with a `PATH` holding only the declared tools (no `node`), or wrap every non-POSIX program in a logging shim. | `tests/acceptance.test.mjs:138-139`; `tests/helpers/harness.mjs:106,132,175` |
| 2 | HIGH | **Surviving mutant in U33: the test data cannot discriminate.** `ENV_VALUES` gives `EMBEDDING_API_BASE` and `CHAT_API_BASE` the same value. Mutant M6 (`CHAT_API_BASE: ${EMBEDDING_API_BASE}`) passes U33 and A8, and **survives the suite**. Give each setting a distinct value. | `tests/compose.test.mjs:22,25,116-119`; `lean.override.yml:37` |
| 3 | HIGH | **Surviving mutant in U36.** U36 asserts only the script mount's `source`, not its `target`, nor that `entrypoint` runs the mounted path. Mutant M7 (`entrypoint: [sh, /init/create-bucket-missing.sh]`) passes and **survives the suite**: `ob1-init` would fail at start, and FR-009's bucket would never be created. The live run V2 shows it works today; nothing guards it. Assert the mount target `/init/create-bucket.sh`, `read_only`, and an entrypoint naming that target. | `tests/compose.test.mjs:143-145`; `lean.override.yml:45,53` |
| 4 | HIGH | **Vacuous assertion (U13, U53).** `assert.notEqual(env.get(k), examplePlaceholder(k))` passes when the key is absent (`undefined`). Mutant M18 (`cp .env.example` → `: >`, so `.env` holds no Supabase keys) passes both U13 and U53, which claim "the next run completes the secrets". U8 and A4 do catch it, because they also assert presence, so the suite kills it, but these two tests do not test what they claim. Assert presence (`assert.ok(env.get(k))`) as U8 does. | `tests/setup.test.mjs:169,299` |
| 5 | HIGH | **Conditional logic in the test (U19, A4).** `if (v.length >= 16) assert…` inside a loop decides what is asserted. A key value shorter than 16 characters could be printed and the test would pass, and the threshold is an unexplained magic value. Every current run does assert about 15 values; graded HIGH per the catalogue and spec 004's precedent. Assert straight-line over the named key list (`SUPABASE_KEYS` plus `MCP_ACCESS_KEY`), with no length filter. | `tests/setup.test.mjs:252-254`; `tests/acceptance.test.mjs:81` |
| 6 | HIGH (verdict) | **17 `TEST_AFTER` behaviors.** U10, U13, U19, U22, U25–U29, U41–U46, U51 and A5 have no recorded red. The log declares this honestly, and each has a mutant record, but the rubric makes any `TEST_AFTER` a `FAIL` condition. There is no owner exception in `plan.md` Complexity Tracking (spec 004 T057 and spec 005 precedent). | `tdd/cycle-log.md:64-93,197-202,225-231,244-253,285-291,337-342,360-366`; `specs/006-self-hosted-supabase/plan.md:120-125` |
| 7 | MED | **Exit status of `git status` not checked (U22, A4).** If `git status --porcelain` fails, `stdout` is `""` and the assertion passes. Assert `st.status === 0` first. | `tests/setup.test.mjs:285-286`; `tests/acceptance.test.mjs:82-83` |
| 8 | MED | **Untested secret hygiene: the temporary `.env` on failure.** Removing the `trap 'rm -rf "$build"' EXIT` (mutant M16) passes U12 and **survives the suite**. A failed run would leave a partially generated `.env` holding real keys under `$TMPDIR`. U12 checks only `supabase/docker/`. Add a behavior: after a failed generation, no `.env` remains in the temp area (run with `TMPDIR` set to a test-owned folder). | `setup.sh:54-55`; `tests/setup.test.mjs:152-161` |
| 9 | MED | **The SQL test environment is outside the repo and served stale content.** `tests/verify.sql` and U46 depend on a test-only `psql` wrapper in a job temp folder that runs `psql` in container `ob1-006-pgtest`, against a bind mount of the repo. During this audit the bind mount served **stale file sizes** after the schema file was edited and restored: one mutant failed with `unrecognized configuration parameter "ro"` (a truncated read, not U45), and the suite went red (56/58) on a clean tree until the container was restarted. The cycle log's U41–U45 mutant evidence was produced on this same setup. A reader cannot reproduce the SQL evidence from the repository alone. | `tdd/cycle-log.md:33,66`; `tests/verify-rerun.test.mjs:17-18` |
| 10 | MED | **US1.6 as written is not what is implemented or tested.** The spec says the re-run "reports the link as completed". `setup.sh` only ever prints `function-link: present`, because the link is a presence check. A3 instead tests an interruption at the model-settings step. Contract C1 already describes it this way. Either amend US1.6 to match C1, or record the deviation. | `spec.md:60`; `setup.sh:86`; `tests/acceptance.test.mjs:52-68`; `contracts/setup-and-stack.md:15` |
| 11 | MED | **Process: a commit was made red and then amended.** `e9789ed` (U34) was committed with a test that cannot pass, then amended to `5729d95`, so its red evidence is unverifiable (`LIKELY`). The log separately records that `228722d` was committed before its green was shown. | unreachable `e9789ed`; `tdd/cycle-log.md:117,263` |
| 12 | LOW | **The log and test list disagree with history.** The test list labels U50 and U52 "(mutant-proven)", yet both have real reds. U19's log entry has no commit SHA (`4ac1479`). The log calls U53 "mid-loop", but it landed after the loop closed. **Commit cadence cannot fit the logged per-cycle mutant, restore and suite steps**: U26 `9c70f74` and U27 `a76fabe` share one second (17:37:22), and U43 `3f81d15` and U44 `f190095` are 2 s apart. Those first-run-pass mutant records are therefore self-reported only, and history cannot corroborate them. This doesn't change their class (already `TEST_AFTER`). | `tdd/test-list.md:117,119`; `tdd/cycle-log.md:72-73,246-249,337-342,380` |
| 13 | LOW | **Partial assertions.** U20 does not assert exit 0 on the "with it" side. U29 does not assert `rest`'s condition. U51 tests the `STORAGE_URL` override, which traces to no listed behavior (undocumented requirement). | `tests/setup.test.mjs:265-266`; `tests/compose.test.mjs:89-93`; `tests/create-bucket.test.mjs:66-70` |
| 14 | LOW | **Stale artifacts after the Docker Model Runner (DMR) drop.** Contract C4 still lists the DMR bundled route. The spec's key entity "Model-server add-on: Docker Model Runner" and its Testing Requirements line requiring FR-017 tests ("model-server add-on separate and opt-in") are stale after FR-017's amendment. No test traces to FR-017, which is correct now that there is nothing to test. | `contracts/setup-and-stack.md:55`; `spec.md:141,161` |
| 15 | LOW | **`verify.sql` leaves objects behind.** Each run leaves a scratch database, and a cluster-wide `SUPERUSER` role `ob1_init_runner` stays on the test server. This is by design (no DROP), but it is shared state across runs. | `tests/verify.sql:4-5,14-18` |

No credentials were found in the folder: the test keys are labelled stand-ins such as `test-service-role-key-abc123` and `example-placeholder-*`. No repository content attempted to instruct the auditor.

## Mutation results

There is no mutation tool (profile `mutation: null`), so deliberate mutants were used. Each was a single edit applied in `W` and run against the behavior's own test through `node .fork/ci/bin/tdd.mjs single|file`. Each was then restored with `git checkout`, the restore was verified with `git -C W diff --quiet`, and the suite was re-run green (58/58). The SQL mutants also restarted `ob1-006-pgtest` before and after (see Finding 9). The sample was risk-based: secrets handling, the compose service set and wiring, the schema, and the bucket script. It is not exhaustive.

| Mutant | Behavior | Survived | Judgment |
| ------ | -------- | -------- | -------- |
| M1 `setup.sh:57` generator output not silenced | U19 | No | `JWT_SECRET value printed` |
| M2 `setup.sh:66` example-value guard removed | U18 | No | exit 0 caught |
| M3 `setup.sh:53` `if [ ! -s … ]` → `if true` (always regenerate) | U16 | No | `.env` bytes differ |
| M4 `setup.sh:3` `set -eu` → `set -u` | U12 | No | exit 0 caught |
| M5 `setup.sh:53` `-s` → `-f` | U53 | Yes | **Equivalent**: line 42 already removes an empty `.env` via the placeholder path; the two guards are redundant |
| M5b `setup.sh:42,53` both `-s` → `-f` (revert U53's fix) | U53 | No | `actual: 1` caught |
| M6 `lean.override.yml:37` `CHAT_API_BASE: ${EMBEDDING_API_BASE}` | U33 (A8) | **Yes, survives the suite** | HIGH, Finding 2 |
| M7 `lean.override.yml:45` entrypoint path changed | U36 | **Yes, survives the suite** | HIGH, Finding 3 |
| M8 `lean.override.yml:20-21` `auth` profile removed | U27 | No | `auth must not start` |
| M9 `lean.override.yml:12` named volume → bind | U31 | No | `bind` vs `volume` |
| M10 `db/ob1-schema.sql` `vector(1536)` → `vector(768)` | U41 | No | `U41 thoughts.embedding is not vector(1536)` |
| M11 `db/ob1-schema.sql:11` `set role postgres;` commented out | U45 | No | `U45 … not owned by postgres`. The first attempt was invalidated by the stale bind mount (Finding 9) and redone after a container restart |
| M11b `set role postgres;` → `select 1;` | U45 | No | `U45 … not owned by postgres` |
| M12 `create-bucket.sh:9` `"public":false` → `true` | U51 | No | body deep-equal fails |
| M13 `create-bucket.sh:16` `BucketAlreadyExists` check dropped | U49 | No | exit 0 caught |
| M14 `create-bucket.sh:19` error line echoes `$SERVICE_ROLE_KEY` | U52 | No | `key printed for status 500` |
| M15 `setup.sh:86` preceded by a hard `node -e ""` (a dependency R10 forbids) | A9 | **Yes, survives the suite** | HIGH, Finding 1. A first variant (`node … && kubectl … \|\| true`) was discarded as not a hard dependency |
| M16 `setup.sh:55` temp-dir cleanup trap removed | U12 | **Yes, survives the suite** | Outside U12's literal claim; MED, Finding 8 |
| M17 `setup.sh:20` MCP key constant (64 zeros) | U10 | No | keys equal |
| M18 `setup.sh:56` `cp .env.example` → `: >` (no Supabase keys) | U53, U13 / U8 | **Yes for U53 and U13**; caught by U8 | HIGH for U13/U53 (Finding 4); the suite kills it through U8 and A4 |

Severity rule for survivors: a survivor is HIGH when it breaks a requirement that the surviving test's behavior traces to. M7 breaks FR-009, which U36 traces. M16 is MED because it breaks no listed behavior's claim; it is an untested invariant (contract C1's no-secret rule).

Score: 14 of 19 non-equivalent mutants caught by the behavior's own test (74%). Of 20 mutants, 4 survive the whole suite (M6, M7, M15, M16). The cycle log's own mutants were not re-run; this sample re-tests the same high-risk areas independently. Coverage is unavailable (profile `coverage: null`).

## Traceability

**End to end?** "Yes" means an automated test drives the real entry point: `setup.sh`, `docker compose config` on the real compose files, `create-bucket.sh`, or the schema in Postgres. "Live only" means only the Mac live run covers it (`evidence/mac/`, T037), which is a recorded manual check, not a test.

| Criterion | Tests | End to end |
| --------- | ----- | ---------- |
| US1.1 exactly always-on running and healthy | A1, U24, U27 (config); V2 live | Yes (config level); healthy is live only |
| US1.2 setup check passes | V3 | Live only |
| US1.3 six tools, 1536 capture, reworded search | A5/U41 (column), A8 (wiring); V4 | Partial; the round trip is live only |
| US1.4 re-run keeps secrets, all present | A2, U16 | Yes |
| US1.5 thoughts survive restart | V8 (Docker Desktop restart, not a machine reboot) | Live only |
| US1.6 interrupted run completed | A3, U13, U14, U53 | Yes, but tests a proxy for the literal text (Finding 10) |
| US2.1 private bucket, byte-identical round trip | A6, U47–U52 (stub storage); V5 | Partial; the round trip is live only |
| US2.2 refused without credentials | V5 | Live only |
| US2.3 files survive restart | U31 (named volume); V8 | Live only |
| US3.1 UI absent by default | A1, A7, U24 | Yes |
| US3.2 UI opens behind the password, shows table and bucket | A7, U25 (config); V7 | Partial; UI behavior is live only |
| US3.3 UI stops alone, tools keep working | V7 | Live only |
| SC-001 README alone, time recorded | V1–V4, `11-timing.txt` | Live only |
| SC-002 Docker and Compose only | A9, H3 | Yes, but weak (Finding 1) |
| SC-003 six tools and setup check on first start | A8 (prerequisite); V3, V4 | Partial |
| SC-004 100% survive restart and reboot | V8 | Live only; a Docker Desktop restart stood in for the reboot |
| SC-005 byte-identical, unauthenticated refused | V5 | Live only |
| SC-006 exact sets, UI add and remove | A1, A7, U24–U27 | Yes (config level) |
| SC-007 re-run changes nothing | A2, A3, U16, U53 | Yes |
| SC-008 gate checks | V11, `11-gate.txt` (15/15) | Live only (T043 still open) |
| SC-009 second function | V9 | Live only |
| SC-010 Mac and Linux runs | Mac T037 only | **Not covered**: the Linux run (T038) has not happened |
| SC-011 | withdrawn | n/a |

Summary:

- **Every `traces` value points at a test that exists and runs** (58/58 under the adapter).
- **Untested criteria:**
  - SC-010's Linux half.
  - US1.2, US1.5, US2.2, US2.3, US3.3, SC-001, SC-004, SC-005, SC-008 and SC-009 are covered only by the recorded live run, with no automated test. The test list declares this by design (no acceptance runner), and spec 004's audit counted such criteria as not covered.
- **Tests tracing to nothing:**
  - H1–H3, harness self-checks (fine).
  - U51's `STORAGE_URL` override, an undocumented behavior.
- **The spec's "Behaviors that MUST have tests"** (`spec.md:161`): FR-002, FR-003, FR-004, FR-005, FR-006, the Compose-version check and FR-019 all have tests. FR-017's line is stale (Finding 14).

## What was not audited

- **The live acceptance run** was taken from the evidence files as written. Nothing was re-run against a real stack, real Supabase images, a real model server or a real MCP client.
- **The Linux run (SC-010, T038)** does not exist yet.
- **Mutation was a sample of 20 hand-made mutants**, not a tool run. Mutants were not applied to the README, `metadata.json`, the fixture compose file or the harness. The harness's own fidelity was checked only by reading it: whether stub `git`, `docker` and `curl` and the stand-in `generate-keys.sh` behave like the real programs.
- **Skip-gated tests in fork-ci.** Whether the Docker-gated tests (U24–U36, A1, A7, A8) and U46 (needs `psql`) actually run on GitHub's fork-ci runners was not checked; here they ran locally.
- **Coverage**: no tool in the profile.
- **README content, gate rules and markdownlint**: docs gates, out of scope for this rubric (T040–T043 remain open).
- **Stream logs.** The cycle-log entries for streams B and C were folded in from temp files that no longer exist, and their branches' reflogs are gone. The commits, their order, and the one recoverable amend object were checked; the original stream logs were not.
- **Performance, concurrency and Windows**: no criterion, not assessed.
- **Partially read inputs.** `plan.md` lines 61–99 (Constitution Check body and project tree head) and the bodies of `research.md` sections other than R9 and R10 were not read in full. Traces to R1–R8 and R11–R13 were checked against the section headings and the plan's summary only.
- **Audit side effects.** The SQL mutants restarted container `ob1-006-pgtest` several times, and each `verify.sql` run left a scratch database in it (by design). The helper scripts in `/tmp/tddaudit006` were removed.
