# Cycle Log: Lean self-hosted Supabase for Open Brain

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

The code lives on `contrib/mfelker/self-hosted-supabase` (worktree `.worktrees/contrib-self-hosted-supabase`), which never carries `specs/` (constitution Principle V). This log lives on fork `main`.

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` → `tdd: worktree not found: /Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-supabase`. Empty baseline: the worktree and `recipes/self-hosted-supabase-mcp/` don't exist yet (task T001), so there are 0 tests.
- commit: `e86a3d4` (fork `main`); upstream `238df6c`
- recorded: cycle 0, before any change

## Setup (T001–T004): worktree, scaffold, harness, fixture

- T001: `git worktree add .worktrees/contrib-self-hosted-supabase -b contrib/mfelker/self-hosted-supabase upstream/main` (`238df6c`), then `git merge --no-ff contrib/mfelker/self-hosted-llm` → merge commit `062b573`. `tdd.mjs where` → `tree=…/contrib-self-hosted-supabase folder=recipes/self-hosted-supabase-mcp`.
- T002–T004: `metadata.json` (validated against `.github/metadata.schema.json`), README skeleton, `.gitignore` (`supabase/`); `tests/helpers/harness.mjs` (temporary git checkout, restricted `PATH`, stub `git` and `docker`, stand-in clone with a stub `generate-keys.sh`); `tests/fixtures/compose/docker-compose.yml` (11 service names and `v0.8.5`'s dependency links, `busybox` images).
- Harness self-test H1–H3 (`tests/harness.test.mjs`): the first run failed H1 because the harness's own files showed in the temporary repo's `git status`. Fixed by excluding them in `.git/info/exclude` (a harness bug, not a cycle). Then `node .fork/ci/bin/tdd.mjs suite` → `tests=3 pass=3 fail=0 → pass`.
- **Baseline for the loop: green, 3 tests (H1–H3).**
- commit: `69a087f` (`contrib/mfelker/self-hosted-supabase`)
- No behavior ids: structural setup, not cycles.

## Outer loop opened: A1–A4, A6–A9 written first as `todo` (T050)

- test: `recipes/self-hosted-supabase-mcp/tests/acceptance.test.mjs::A1`–`A4`, `A6`–`A9` (new), each `test(name, { todo, skip: noDocker for A1/A7/A8 }, fn)`, with `todo` lifted by `RUN_TODO=1`. They drive the real `sh setup.sh`, `docker compose config` on the real compose files, and `init/create-bucket.sh`; only outside programs are stubbed. Harness additions: stub `curl` (stateful bucket store), `makeBucketEnv()`, `realDocker()`, `compose()`.
- first run (no scripts yet): all 8 failed with `actual: 127` / `/bin/sh: setup.sh: No such file or directory`. That's not a valid red, so I added `not implemented` stubs: `setup.sh` and `init/create-bucket.sh` print `… not implemented` and exit 1.
- red: `RUN_TODO=1 node --test tests/acceptance.test.mjs` → `ℹ tests 8 / ℹ pass 0 / ℹ fail 8`. Every one fails with `AssertionError … actual: 1` (from `setup.sh: not implemented` for A1–A4 and A7–A9, and `create-bucket.sh: not implemented` for A6).
- suite (todo mode): `node --test tests/` → `tests 11 / pass 3 / fail 0 / todo 8`.
- commit: `6052532`

## Structural: schema stub and `verify.sql` seam

- `db/ob1-schema.sql` (`-- not implemented`) and `tests/verify.sql`, which creates a uniquely named scratch database (`ob1_verify_<timestamp>_<random>`, no DROP), adds `auth.role()` and `\ir ../db/ob1-schema.sql`. Without a `verify.sql`, the folder's SQL would be "SQL unverified" and the suite red.
- local SQL runtime: a throwaway `pgvector/pgvector:pg17` container (`ob1-006-pgtest`) with the repo bind-mounted read-only at the same path, plus a test-only `psql` wrapper on `PATH` (in the job's temp folder, not in the repo) that runs `psql` inside it. That matches fork-ci's `psql -v ON_ERROR_STOP=1 -X -q -f …` from the folder.
- suite: `node .fork/ci/bin/tdd.mjs suite` → `node-plain: pass`, `sql: pass` → `pass`
- commit: `651e35b`

## U38 schema file carries docs/01's five SQL blocks verbatim and in order

- test: `tests/schema-drift.test.mjs::U38 the schema file contains docs/01's five SQL blocks verbatim and in order` (new)
- red: `node .fork/ci/bin/tdd.mjs single tests/schema-drift.test.mjs "U38 …"`
  → `AssertionError [ERR_ASSERTION]: docs/01 SQL block 1 missing or out of order` (`tests=1 pass=0 fail=1 → fail`)
- green: wrote `docs/01`'s five blocks (extracted with the same fence pattern) under a header comment into `db/ob1-schema.sql`. Single: `tests=1 pass=1 fail=0 → pass`.
- suite after green: `sql: fail (exit 3)`, because `verify.sql` → `psql:db/ob1-schema.sql:15: ERROR:  type "vector" does not exist`. That's a real regression, fixed in this cycle in the test's setup: `docs/01` enables pgvector in the dashboard before any SQL runs, so the scratch database now does `CREATE EXTENSION IF NOT EXISTS vector` first. The schema file's own `create extension` line is still U39's job. Suite → `pass`.
- refactor: none needed.
- commit: `e86f7b6`

## U39 the schema file's first two statements enable vector and switch to the postgres role

- test: `tests/schema-drift.test.mjs::U39 …` (new; statements = the file without comment lines, split on `;`)
- red: `node .fork/ci/bin/tdd.mjs single tests/schema-drift.test.mjs "U39 …"`
  → `actual: "create table thoughts (\n  id uuid …"`, `expected: 'create extension if not exists vector'` (`tests=1 pass=0 fail=1 → fail`)
- green: added `create extension if not exists vector;` and `set role postgres;` before block 1, with comments giving the reasons (research R7). Single → pass; suite (node-plain + sql) → `pass`.
- refactor: none needed.
- commit: `ad52da9`

## U40 the schema file's last statement switches back from the postgres role

- test: `tests/schema-drift.test.mjs::U40 …` (new)
- red: `node .fork/ci/bin/tdd.mjs single tests/schema-drift.test.mjs "U40 …"` → `actual: '$$ LANGUAGE plpgsql'`, `expected: 'reset role'` (`tests=1 pass=0 fail=1`)
- green: appended `reset role;` with a comment. Single → pass; suite → `pass`.
- refactor: none needed.
- commit: `7cda837`

## U41–U45: `verify.sql` assertions, each passing on first run and proven by a deliberate mutant

The schema behavior already existed when these assertions were written: U38 copied `docs/01`'s SQL verbatim, and U39 added the role switch. So each assertion passed on its first run and, per the playbook, was proven by a deliberate mutant on `db/ob1-schema.sql`: break it in the smallest way, confirm the named failure, restore it exactly (`git diff --quiet` on `db/`), then run the suite. A helper script in the job's temp folder (not the repo) ran each step the same way. Command for every run: `psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` from the folder, through the test-only `psql` wrapper.

| id | assertion | first run | mutant (sed on the schema file) | mutant failure | commit |
|----|-----------|-----------|---------------------------------|----------------|--------|
| U41 | `thoughts.embedding` is `vector(1536)` | passed | `embedding vector(1536)` → `vector(768)` | `ERROR:  U41 thoughts.embedding is not vector(1536)` | `6e190f4` |
| U42 | `match_thoughts` and `upsert_thought` exist | passed | `FUNCTION upsert_thought(` → `upsert_thought_mutant(` | `ERROR:  U42 match_thoughts or upsert_thought is missing` | `950d6f1` |
| U43 | `service_role` has INSERT on `thoughts` | passed | GRANT line → comment | `ERROR:  U43 service_role has no INSERT on public.thoughts` | `3f81d15` |
| U44 | RLS on `thoughts` | passed | `enable row level security` → `disable …` | `ERROR:  U44 row level security is off on thoughts` | `f190095` |
| U45 | `thoughts` and both RPCs owned by `postgres` | passed | `set role postgres;` → comment | `ERROR:  U45 thoughts or its RPCs are not owned by postgres` | `9f97b79` |

- U45 note: on plain Postgres the test connects as `postgres`, so an ownership check would pass even without the role switch, which would make it vacuous. So U45's test also makes `verify.sql` apply the schema as a separate superuser, `ob1_init_runner`, standing in for Supabase's `supabase_admin` (`SET ROLE ob1_init_runner; \ir …; RESET ROLE;`). The mutant shows this makes the check meaningful.
- suite after each: `node .fork/ci/bin/tdd.mjs suite` → `pass` (node-plain + sql).
- Audit note: these five are first-run passes on behavior an earlier cycle (U38) already implemented. They're evidenced by mutants, which spec 004's audit grades `TEST_AFTER`, so this is declared here rather than left implied.

## U46 `verify.sql` runs twice on the same Postgres and contains no DROP

- test: `tests/verify-rerun.test.mjs::U46 verify.sql runs twice on the same Postgres and contains no DROP` (new; skipped with `node:test`'s skip when `psql -c 'select 1'` fails, as on fork-ci's Node job)
- first run: `node .fork/ci/bin/tdd.mjs single tests/verify-rerun.test.mjs "U46 …"` → `tests=1 pass=1 fail=0` (the unique name existed from the seam commit `651e35b`)
- mutant: the database name made fixed (`SELECT 'ob1_verify_fixed' AS verify_db \gset`) → `AssertionError [ERR_ASSERTION]: run 2: psql:tests/verify.sql:5: ERROR:  database "ob1_verify_fixed" already exists` (`tests=1 pass=0 fail=1`); then restored exactly.
- suite → `pass`. Audit note: first-run pass, evidenced by mutant (as for U41–U45).
- commit: `92d04ce`

## A5 (T051) `verify.sql` as a whole passes against a fresh Postgres

- test: `tests/verify.sql` (the whole file), run by fork-ci's SQL runtime.
- It has no whole-file red of its own. Before U38 the seam had no assertions and passed. After U38, the suite's SQL run failed (`type "vector" does not exist`) until the scratch-database fix in that cycle. Its five assertions were then each proven by a mutant (U41–U45).
- green: `node .fork/ci/bin/tdd.mjs suite` → `sql: pass`.
- Declared: no independent outer-loop red; it's evidenced by U41–U45's mutants.

## U1 without docker on PATH setup fails naming docker and creates nothing

- test: `tests/setup.test.mjs::U1 …` (new; checkout with `docker` hidden)
- red: `node .fork/ci/bin/tdd.mjs single tests/setup.test.mjs "U1 …"` → `The input did not match the regular expression /\bdocker\b/` with `actual: 'setup.sh: not implemented\n'` (`tests=1 pass=0 fail=1`)
- green: `command -v docker … || die "docker not found on PATH …"` before the stub's exit. Single → pass; suite → `pass`.
- refactor: none needed.
- commit: `5da7e21`

## U2 without git on PATH setup fails naming git and creates nothing

- test: `tests/setup.test.mjs::U2 …` (new)
- red: `… single tests/setup.test.mjs "U2 …"` → `did not match the regular expression /\bgit\b/`, `actual: 'setup.sh: not implemented\n'`
- green: `command -v git … || die "git not found on PATH"`. Suite → `pass`.
- refactor: none needed.

## U3 without openssl on PATH setup fails naming openssl and creates nothing

- test: `tests/setup.test.mjs::U3 …` (new)
- red: `… single tests/setup.test.mjs "U3 …"` → `did not match the regular expression /\bopenssl\b/`, `actual: 'setup.sh: not implemented\n'`
- green: an `openssl` check line. Single → pass.
- refactor: the three checks became one `for tool in docker git openssl` loop (commit `c6f6edf`, suite `pass`). The loop's first message listed all three tools ("needed: Docker…, git, openssl"), which made U1–U3's name checks unable to tell which tool was reported. So a second refactor narrowed it to `"$tool not found on PATH"` (suite `pass`, own commit).
- commits: U2 `7eeb283`, U3 `c6f6edf`, refactor below
- refactor commit `228722d`: its pre-commit suite run was started without the test-only `psql` wrapper on `PATH`, giving `→ setup: psql not found`, which is not a result. Re-run right after the commit with the wrapper: `→ pass`. So the commit is green, but it was committed before that was shown. Process slip, recorded here.

## U4 on a fresh folder setup makes a shallow clone of the pinned tag into supabase/

- test: `tests/setup.test.mjs::U4 …` (new; reads the stub `git` log)
- red: `… single tests/setup.test.mjs "U4 …"` → `AssertionError [ERR_ASSERTION]: a git clone call` / `actual: undefined` (`tests=1 pass=0 fail=1`)
- green: `PIN`, `SUPABASE_REPO`, `RECIPE_DIR`, `CLONE` and `git clone --quiet --depth 1 --branch "$PIN" "$SUPABASE_REPO" "$CLONE"`. The first green attempt failed: `actual: '/private/var/folders/…/supabase'` vs `expected: '/var/folders/…/supabase'`. That was a harness bug (macOS temp folders are symlinks), fixed by resolving the checkout root with `realpathSync` in `makeCheckout`; no assertion changed. Single → pass; suite → `pass`.
- refactor: none needed.
- commit: `97a2831`

## Parallel streams started at `97a2831`

- Stream B (`.worktrees/shs-bucket`, branch `contrib/mfelker/self-hosted-supabase-bucket`): U47–U52, `init/create-bucket.sh` + `tests/create-bucket.test.mjs`.
- Stream C (`.worktrees/shs-compose`, branch `contrib/mfelker/self-hosted-supabase-compose`): U24–U36, `docker-compose.yml`, `lean.override.yml`, `tests/compose.test.mjs`.
- Both are Sonnet agents with the same cycle discipline, writing their logs to the job's temp folder. The integrator folds those logs in here in merge order.

## U5 with the clone already present at the pin setup makes no clone call and reports it present

- test: `tests/setup.test.mjs::U5 …` (new; runs setup twice, counts `git clone` calls)
- red: `… single tests/setup.test.mjs "U5 …"` → `Expected values to be strictly equal: actual: 2, expected: 1`
- green: clone only when `supabase/docker/docker-compose.yml` is absent, otherwise print `clone: already present`. Suite → `pass`.
- refactor: none needed.
- commit: `4bd2b4d`

## U6 with the clone at another tag setup fails naming both tags and changes nothing

- test: `tests/setup.test.mjs::U6 …` (new; `snapshot()` of `supabase/` before and after)
- first run: `SyntaxError: Invalid or unexpected token`. Not a valid red: a Python here-doc had mangled the test's escapes. Fixed the test text (now `includes()` checks for both tags) and re-ran.
- red: `… single tests/setup.test.mjs "U6 …"` → `AssertionError [ERR_ASSERTION]: names the clone's tag` / `actual: false`
- green: the existing-clone branch reads `git -C supabase describe --tags --exact-match` and dies naming both tags and the README section when it isn't `$PIN`. Suite → `pass`.
- refactor: none needed.
- commit: `1858e60`

## U7 when Compose cannot read the recipe setup fails naming the versions and creates no .env

- test: `tests/setup.test.mjs::U7 …` (new; stub `docker` with `STUB_COMPOSE_CONFIG_EXIT=1`, `STUB_COMPOSE_VERSION=2.19.0`)
- red: `… single tests/setup.test.mjs "U7 …"` → `AssertionError [ERR_ASSERTION]: names the version found` / `actual: false`
- green: after the clone step, `docker compose config -q` in the recipe folder; on failure, die naming `docker compose version --short` and the tested `v5.6.1`. The include needs its env file, so a placeholder empty `.env` is created only for the check and removed again (whether it passes or fails). Suite → `pass`.
- refactor: none needed.
- note: whether real Compose accepts the empty placeholder is checked in the live run (quickstart V1).
- commit: `b508ea6`

## U8 on a fresh folder .env holds every generated key and none keeps its .env.example value

- test: `tests/setup.test.mjs::U8 …` (new)
- red: `… single tests/setup.test.mjs "U8 …"` → `AssertionError [ERR_ASSERTION]: .env created` / `actual: false`
- green: when `.env` is absent, copy `.env.example` and run the clone's `utils/generate-keys.sh --update-env` in `supabase/docker/`. Suite → `pass`. (Building it to the side so it's all-or-nothing is U12's cycle.)
- refactor: none needed.
- commit: `4358f1f`

## Stream B log (folded in after the merge `17968fc`)

### U47 200 -> exit 0, output says bucket ready
- test: `tests/create-bucket.test.mjs::U47 …`
- red: `node --test --test-name-pattern='^U47 ' tests/create-bucket.test.mjs` → `AssertionError: Expected values to be strictly equal: actual: 1, expected: 0` (stub script exited 1)
- green: script replaced by a minimal ready message; suite -> 11 pass / 0 fail / 1 skipped / 8 todo
- refactor: none needed
- commit: `980c6f3`

### U48 400 BucketAlreadyExists -> exit 0
- test: `tests/create-bucket.test.mjs::U48 …`
- red: `node --test --test-name-pattern='^U48 ' tests/create-bucket.test.mjs` → `actual: 'create-bucket.sh: bucket ob1-files is ready\n', expected: /ob1-files.*already/i` (exit-0 half already held; output assertion failed)
- green: script now POSTs via curl with -o/-w, branches on 200 / 400+BucketAlreadyExists; suite -> 12 pass / 0 fail
- refactor: none needed
- commit: `ea127e6`

### U49 other 400 -> non-zero with status and error
- test: `tests/create-bucket.test.mjs::U49 …`
- red: `node --test --test-name-pattern='^U49 ' tests/create-bucket.test.mjs` → `Expected "actual" to be strictly unequal to: 0 (actual: 0)`
- green: else branch prints status and body to stderr, exit 1; suite -> 13 pass / 0 fail
- refactor: none needed
- commit: `6954f0c`

### U50 500 / unreachable -> non-zero naming failure
- test: `tests/create-bucket.test.mjs::U50 …`
- red: first run PASSED (500 hit the U49 branch). Mutant 1 (`exit 1`->`exit 0`): `ℹ fail 1`, `actual: 0` (caught). Mutant 2 (`curl -sS`->`-s`): survived, because the stub writes its error regardless of flags, so the test's `/Failed to connect/` assertion proved nothing about the script. Strengthened the test (not weakened): unreachable case now requires `/could not reach storage/i`; run → `actual: 'curl: (7) Failed to connect to storage port 5000\ncreate-bucket.sh: storage answered : \n', expected: /could not reach storage/i`
- green: curl invocation wrapped in `if ! status=$(...)` printing "could not reach storage at $STORAGE_URL", exit 1; suite -> 14 pass / 0 fail. Exit-code mutant re-run on final script: fails as expected; script restored exactly.
- refactor: none needed
- commit: `fb9a8ae`

### U51 POST /bucket with id/name ob1-files, public false
- test: `tests/create-bucket.test.mjs::U51 …` (also checks Content-Type header and STORAGE_URL override)
- red: first run PASSED (behavior already implemented). Mutants on the script, each failed the test: `"public":true` (actual public: true), `/buckets`, `-X PUT`, default port 5001. Script restored exactly.
- green: no script change; suite -> 15 pass / 0 fail
- refactor: none needed
- commit: `723f218`

### U52 apikey + Authorization Bearer from SERVICE_ROLE_KEY; key never printed
- test: `tests/create-bucket.test.mjs::U52 …` (key checked absent in 200, 400-exists, 500 and unreachable outputs)
- red: `node --test --test-name-pattern='^U52 ' tests/create-bucket.test.mjs` → `actual: false, expected: true` (apikey header missing)
- green: added the two -H headers; suite -> 16 pass / 0 fail / 1 skipped / 8 todo. The "never printed" half passed from the start, so mutant: error message echoing `$SERVICE_ROLE_KEY` → `AssertionError: key printed for status 500` (caught); script restored exactly.
- refactor: none needed
- commit: `f099344`

## U9 on a fresh folder MCP_ACCESS_KEY is exactly 64 lowercase hex characters

- test: `tests/setup.test.mjs::U9 …` (new)
- red: `… single tests/setup.test.mjs "U9 …"` → `did not match the regular expression /^[0-9a-f]{64}$/` / `actual: ''`
- green: after key generation, append `MCP_ACCESS_KEY=$(openssl rand -hex 32)` under a comment. Suite → `pass`.
- refactor: none needed.
- commit: `e0cc3ef`

## A6 (T058) creating the bucket twice leaves exactly one private ob1-files bucket

- red: recorded at T050 (`create-bucket.sh: not implemented`, `actual: 1`).
- green: after merging stream B (`17968fc`): `RUN_TODO=1 node --test --test-name-pattern='^A6 ' tests/acceptance.test.mjs` → `pass 1 / fail 0`. Then flipped from `todo` to a plain `test`: `… single tests/acceptance.test.mjs "A6 …"` → `pass`; suite → `pass`.
- commit: `161ec06`

## U10 two fresh setups produce two different MCP access keys

- test: `tests/setup.test.mjs::U10 …` (new)
- first run: `… single … "U10 …"` → `tests=1 pass=1` (U9's `openssl rand` already provides it).
- deliberate mutant: the key replaced by a fixed 64-zero string → `Expected "actual" to be strictly unequal to: … '0000…'` (`fail=1`); restored exactly (`git diff --quiet`).
- suite → `pass`. Audit note: first-run pass, evidenced by the mutant.
- commit: `3e5e229`

## Stream C log (folded in after the merge `612936a`)

# Compose stream cycle log (branch contrib/mfelker/self-hosted-supabase-compose)
Test file: recipes/self-hosted-supabase-mcp/tests/compose.test.mjs. Run: `node --test --test-name-pattern='^Uxx ' tests/compose.test.mjs`. Suite after every cycle: `node --test tests/` 0 fail (final: 32 tests, 23 pass, 0 fail, 1 skipped, 8 todo).

### U24 default service set
- red 1 (no compose files): `U24` -> `AssertionError: no configuration file provided: not found`
- red 2 (placeholder docker-compose.yml, include of base only): -> `+ 'auth', + 'imgproxy', + 'meta', + 'realtime', + 'studio'` extra, `- 'ob1-init'` missing
- green: lean.override.yml with profiles (ui/images/never) and ob1-init. Compose refused ("api-gw depends on undefined service studio", then "storage depends on undefined service imgproxy"), so api-gw `!reset` (U28) and storage depends_on `!override` (U29) landed here. suite 11 pass/0 fail.
- commit: 4beeb8d
### U25 ui profile adds studio+meta
- first run PASS (profiles from U24). Mutant: meta -> profile never: `- 'meta'` missing. Restored.
- commit: 598c934
### U26 images profile adds imgproxy
- first run PASS. Mutant: imgproxy -> profile ui: `- 'imgproxy'` missing. Restored. commit: 9c70f74
### U27 auth/realtime/supavisor never start
- first run PASS. Mutant: auth -> profile ui: `auth must not start`. Restored. commit: a76fabe
### U28 api-gw has no depends_on studio
- first run PASS (reset forced by U24). Mutant: depends_on studio: `{"studio":{"condition":"service_started","required":true}}`. Restored. commit: 5974b52
### U29 storage depends on db(healthy)+rest
- first run PASS (override forced by U24). Mutants: add imgproxy dep -> "invalid compose project" (weak); db condition service_started -> strict-equal failure. Restored. commit: 6dc2e1c
### U30 ENABLE_IMAGE_TRANSFORMATION "false"
- red: AssertionError strictly equal ("true" vs "false"). green: env in storage override. suite 17/0. commit: b508947
### U31 storage named volume ob1-storage
- red: AssertionError strictly equal (bind vs volume). green: volumes entry + top-level volume ob1-storage. suite 18/0. commit: fb56c99
### U32 functions mounts 004
- red: `no mount at the target`. green: `../../../../integrations/self-hosted-llm-mcp:...:ro`. refactor: config() split into configIn() returning root. commit: 224c874
### U33 functions env
- red: `AssertionError: MCP_ACCESS_KEY`. green: 8 `${VAR}` entries. commit: b8c0ffb
### U34 extra_hosts
- red: assertion on undefined extra_hosts. green: `host.docker.internal:host-gateway` (config emits list `["host.docker.internal=host-gateway"]`, test asserts that). Slip: first commit carried a wrongly-shaped assertion; fixed by amending before anything else, red re-verified. commit: 5729d95
### U35 db schema mount
- red: `no schema mount`. green: ro bind `../../db/ob1-schema.sql`; fixture db mounts retained. commit: 3b02e01
### U36 ob1-init
- red: `TypeError ... reading 'storage'` (no depends_on). green: curlimages/curl:8.11.1 entrypoint, depends storage healthy, restart "no", script mount, SERVICE_ROLE_KEY. Mutants: restart always, SERVICE_ROLE_KEY literal -> both fail. refactor: removed unused MODEL_SETTINGS import. commit: 945d6ab

## U11 on a fresh folder .env holds every model setting name, blank

- test: `tests/setup.test.mjs::U11 …` (new)
- red: `… single … "U11 …"` → `AssertionError [ERR_ASSERTION]: EMBEDDING_API_BASE present and blank` / `actual: undefined, expected: ''`
- green: append a commented block with `EMBEDDING_API_BASE= … FETCH_TIMEOUT_MS=` (blank) to the new `.env`. Suite → `pass`.
- refactor: none needed.
- commit: `050da74`

## U12 when key generation fails setup fails and leaves no .env or temporary file in supabase/docker

- test: `tests/setup.test.mjs::U12 …` (new; `STUB_GENKEYS_FAIL=1` makes the stand-in generator write one key, then exit 1)
- red: `… single … "U12 …"` → `AssertionError [ERR_ASSERTION]: no .env` / `actual: true, expected: false`
- green: `.env` is built in `mktemp -d` (with a `trap` to remove it): copy `.env.example`, run the generator there, append the MCP key and model names, then `mv` it into `supabase/docker/.env`. Under `set -e`, a failed generator exits before the `mv`. Suite → `pass`.
- refactor: none needed (the fresh-file steps now all target the temp file).
- commit: `26fe491`

## U13 after a failed key generation the next run completes the secrets

- test: `tests/setup.test.mjs::U13 …` (new)
- first run: `tests=1 pass=1` (U12's build-to-the-side already provides it).
- deliberate mutant: write `.env` in place again (no temp folder, no `mv`) → `AssertionError [ERR_ASSERTION]: ANON_KEY generated` / `actual: 'example-placeholder-anon_key'` (a partial `.env` from the failed run blocks generation on the rerun). Restored exactly.
- suite → `pass`. Audit note: first-run pass, evidenced by the mutant.
- commit: `3f43058`

## U14 an .env without MCP_ACCESS_KEY gets only that line added, every other line unchanged

- test: `tests/setup.test.mjs::U14 …` (new; `removeLines()` helper: run setup, drop given keys' lines)
- red: `… single … "U14 …"` → `AssertionError [ERR_ASSERTION]: added: []` / `actual: 0, expected: 1`
- green: `elif ! grep -q '^MCP_ACCESS_KEY=' .env` → append the key, print `secrets: completed`. Suite → `pass`.
- refactor: none needed.
- commit: `729517d`

## U15 an .env missing model setting names gets only the missing names added (one missing, all missing)

- test: `tests/setup.test.mjs::U15 …` (new; both sides: `CHAT_MODEL` only, and all seven)
- red: `… single … "U15 …"` → `Expected values to be strictly deep-equal: actual: [], expected: [Array]`
- green: a model-settings step after secrets: for each of the seven names, append `NAME=` if no `^NAME=` line exists; print `model-settings: completed` if any was added. Suite → `pass`.
- refactor: none (the fresh path still writes the names inside the temp build; moving that into this step changes fresh-run output, which is U21's cycle).
- commit: `2427afd`

## U16 a complete .env is left byte-identical and secrets and model settings report already present

- test: `tests/setup.test.mjs::U16 …` (new)
- red: `… single … "U16 …"` → `did not match the regular expression /secrets: already present/` / `actual: 'clone: already present\nsetup.sh: not implemented\n'`
- green: the `else` branches print `secrets: already present` and `model-settings: already present`. Suite → `pass`.
- refactor: none needed.
- commit: `8971032`

## U17 an .env missing a Supabase key makes setup fail naming it and leave .env unchanged

- test: `tests/setup.test.mjs::U17 …` (new; `JWT_SECRET` line removed)
- red: `… single … "U17 …"` → `did not match the regular expression /\bJWT_SECRET\b/` / `actual: 'clone: already present\nsecrets: already present\nmodel-settings: already present\nsetup.sh: not implemented\n'`
- green: a `SUPABASE_KEYS` list (the 14 keys `generate-keys.sh` writes, research R6); for an existing `.env`, `grep -q "^$k="` or die naming the key. Suite → `pass`.
- refactor: deferred to after U18.
- commit: `ea346f5`

## U18 an .env with a Supabase key still at its example value makes setup fail naming it and leave .env unchanged

- test: `tests/setup.test.mjs::U18 …` (new; `SERVICE_ROLE_KEY` reset to its example value; other side of U16)
- red: `… single … "U18 …"` → `did not match the regular expression /\bSERVICE_ROLE_KEY\b/` / `actual: '…secrets: already present…'`
- green: compare each key's value with the same key in `.env.example`, and die naming it when they're equal. Suite → `pass`.
- refactor (own commit): the secrets section became `if fresh … else check keys, then complete the MCP key`, with helpers `add_mcp_key` and `MODEL_SETTINGS` / `KEEP_KEYS` named once. Suite → `pass`.
- commits: `de42462` (U18), refactor below

## Harness fidelity: the stand-in `generate-keys.sh` prints its keys

- Supabase's real `generate-keys.sh` prints every generated `KEY=value` (research R6). The stand-in didn't, so no test could catch setup failing to silence it. The stand-in now echoes each `KEY=value`. Suite → `pass`. commit `3015117`.

## U19 a fresh run prints no value of any key it wrote to .env

- test: `tests/setup.test.mjs::U19 …` (new)
- first run: `tests=1 pass=1` (setup already sent the generator's output to `/dev/null` since U8).
- deliberate mutant: generator output not silenced → `AssertionError [ERR_ASSERTION]: JWT_SECRET value printed` (`fail=1`); restored exactly.
- suite → `pass`. Audit note: first-run pass, evidenced by the mutant.

## U20 setup fails without the checkout's integrations/self-hosted-llm-mcp and reports the function link present with it

- test: `tests/setup.test.mjs::U20 …` (new; both sides)
- red: `… single … "U20 …"` → `did not match the regular expression /integrations\/self-hosted-llm-mcp/` / `actual: 'model-settings: already present\nsetup.sh: not implemented\n'`
- green: `FUNCTION_DIR` (`../../integrations/self-hosted-llm-mcp`); fail fast after the tool checks if it's absent (before anything is created), and print `function-link: present` at the end. Suite → `pass`.
- refactor: none needed.
- commit: `1c02edf`

## U21 a fresh run exits 0 and reports clone, secrets and model settings completed and the function link present

- test: `tests/setup.test.mjs::U21 …` (new)
- red: `… single … "U21 …"` → `AssertionError [ERR_ASSERTION]: model-settings: already present` / `actual: 1, expected: 0`
- green: print `clone: completed` after the clone and `secrets: completed` after the `mv`; the new `.env` no longer gets the model names inside the temp build, so the model-settings step adds them (with its comment header, once) and reports `completed`; the stub's `not implemented` / `exit 1` tail is removed. Single → pass; suite → `tests=56 pass=49 fail=0 → pass`.
- refactor: none needed.
- commit: `95124f5`

## U22 after a fresh run git status in the checkout is empty

- test: `tests/setup.test.mjs::U22 …` (new)
- first run: `tests=1 pass=1` (the recipe's `.gitignore` has held `supabase/` since T002).
- deliberate mutant: empty `.gitignore` → `actual: '?? recipes/self-hosted-supabase-mcp/supabase/\n', expected: ''` (`fail=1`); restored exactly.
- suite → `tests=57 pass=50 fail=0 → pass`. Audit note: first-run pass, evidenced by the mutant.
- commit: `300fd36`

## Outer loop closed: A1–A4, A7–A9 (T052–T057, T059)

- reds: recorded at T050 (`setup.sh: not implemented`, `actual: 1`).
- greens: `RUN_TODO=1 node --test tests/acceptance.test.mjs` → `✔` for A1, A2, A3, A4, A6, A7, A8, A9 (A1, A7 and A8 through real `docker compose config` on the merged overlay after a real `setup.sh` run). Then each was flipped from `todo` to a plain `test` (A1, A7, A8 keep `skip: noDocker`) in its own commit, with single and suite runs green: A1 `e1d8cec`, A2 `95ad94d`, A3 `6800132`, A4 `c13bee4`, A7 `d85ecbf`, A8 `c6cc7bf`, A9 `5a3afd4`.
- refactor: the now-unused `todo` switch and its comment removed (`f1ba495`).
- suite: `node .fork/ci/bin/tdd.mjs suite` → `tests=57 pass=57 fail=0 → pass`. Plain `node --test tests/` without Postgres → `tests 56, pass 55, skipped 1` (U46 skipped, not passed).
