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
