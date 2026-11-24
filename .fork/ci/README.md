# fork-ci

Fork-only CI for `mfelker/OB1` that enforces constitution Principle IV (Test-First). Upstream CI runs no contribution tests; fork-ci runs them for every changed contribution folder.
Design, decisions and validation evidence: [`specs/001-fork-ci/`](../../specs/001-fork-ci/plan.md) (see `research.md` for R1–R13 and the spike results).

## What it does

On every pull request into `main` and every push to `main`, the workflow [`.github/workflows/fork-ci.yml`](../../.github/workflows/fork-ci.yml) runs:

| Job | Does |
|-----|------|
| `detect` | Finds changed contribution folders (`recipes/`, `schemas/`, `integrations/`, `dashboards/`, `skills/`, `extensions/`, `primitives/`, `server/`); skips fork-only paths and `_template/`; decides **strict** or **advisory** per folder |
| `test` | One matrix job per folder: runs each runtime's tests |
| `test-sql` | Folders with `tests/verify.sql`, against a throwaway Postgres + pgvector |
| `self-test` | fork-ci's own tests plus `actionlint`, only when `.fork/ci/**` or the workflow changed |
| `fork-ci-verdict` | Always runs; aggregates results into the job summary. **This is the only required check.** |

## Runtimes and runners

| Runtime | Detected by | Test files | Runs |
|---------|-------------|-----------|------|
| `deno` | `deno.json` / `deno.jsonc` | `*_test.*`, `*.test.*`, `*.spec.*` (`.ts .tsx .js .mjs`) | `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read` (**no network**) |
| `node-script` | `package.json` with a real `test` script | `*.test.*`, `*.spec.*`, `test-*.mjs` | `npm install` then `npm test` |
| `node-plain` | JS/TS code outside any of the above | `*.test.*`, `*.spec.*`, `test-*.mjs` (runnable: `.js .mjs .cjs`) | `node --test <files>` |
| `python` | any `.py` | `test_*.py`, `*_test.py` | `pytest` in a throwaway venv (`requirements.txt` installed if present) |
| `sql` | any `.sql` | `tests/verify.sql` | `bootstrap.sql`, then `psql -v ON_ERROR_STOP=1 -f tests/verify.sql` |

In a **strict** folder, every runtime that has code must have tests (for example, `server/`'s Node test does not cover its Deno Edge Function). Tests run without any secrets; a test that needs a live service fails, which signals that it must mock that service.

## Outcomes

| Outcome | Meaning | Fails the verdict? |
|---------|---------|--------------------|
| `pass` | Tests passed | — |
| `fail` | Tests failed | strict only |
| `no-tests` | Code without tests ("no tests for deno code") | strict only |
| `setup` | Install failed, or "tests found but no runner configured" | strict only |
| `timeout` | Exceeded `--timeout-sec` (default 600), or a job lost its result | strict only |
| `sql-unverified` | SQL without `tests/verify.sql` | never (advisory) |
| `exempt` | Docs-only folder | never |
| `lane-bypass` | Push only: a `stage/` or `contrib/` branch was merged locally | yes |

**Advisory mode**: a folder whose content is identical to the upstream commit the change is based on (`merge-base(HEAD, upstream/main)`) is upstream-origin. Its problems are reported as `⚠️ … (from upstream)` but never block, so routine syncs are not held up by untested upstream code.

## SQL verification convention

Add `tests/verify.sql` to a contribution folder. It runs from the folder with `psql`, after `.fork/ci/sql/bootstrap.sql` has created Supabase-like roles, `auth.uid()`/`auth.role()` stubs, `vector`, and the core `thoughts` schema. Include your SQL with `\ir` and fail with `raise exception`:

```sql
\ir ../schema.sql
do $$
begin
  if to_regclass('public.my_table') is null then
    raise exception 'my_table missing';
  end if;
end
$$;
```

## Run locally

```bash
node --test .fork/ci/test/                       # fork-ci's own tests (Node 26; Deno and Python used if present)
node .fork/ci/bin/run-folder.mjs --path recipes/vercel-neon-telegram \
  --mode strict --origin fork --out /tmp/r.json  # one folder, as CI would run it
git fetch upstream
node .fork/ci/bin/detect.mjs --event push --before <sha> --after HEAD \
  --upstream-ref refs/remotes/upstream/main      # what CI would test for a range
```

SQL verification needs `psql` and `PG*` environment variables pointing at a Postgres with pgvector.

## Layout

| Path | Contents |
|------|----------|
| `lib/` | Logic: `paths`, `changes`, `runtimes`, `exec`, `origin`, `verdict`, `report`, `bypass`, `self-test-needed`, `args` |
| `bin/` | CLIs called by the workflow: `detect`, `run-folder`, `verdict`, `self-test-needed` (contract: `specs/001-fork-ci/contracts/cli.md`) |
| `sql/bootstrap.sql` | Postgres bootstrap, drift-checked against `docs/01-getting-started.md` |
| `test/` | `node:test` suites; fixtures are in-memory file maps (`fixtures.mjs`) so their sample tests are never picked up by `node --test` |

## Toolchain pins

Node 26, Python 3.13, Deno v2.9.x, `pgvector/pgvector:pg17`, `actionlint` 1.7.12 (checksum-verified). Zero runtime dependencies.
