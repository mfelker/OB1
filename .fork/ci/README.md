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
| `self-test` | fork-ci's own tests plus `actionlint`, only when `.fork/ci/**` or the workflow changed (spec 003 also adds the TDD overrides, the installed extension, the constitution and `.fork/README.md`, which the drift and docs tests read) |
| `fork-ci-verdict` | Always runs; aggregates results into the job summary, including the advisory TDD status. **This is the only required check.** |

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

## TDD adapter (`bin/tdd.mjs`)

The command the spec-kit-tdd loop calls (the profile `.specify/memory/tdd-profile.md` names it for `single`, `file` and `suite`). It runs a test of the **active feature's** target with fork-ci's own runtime detection, so the loop and CI never disagree about which runner owns a file. Workflow: the "TDD workflow" section of [`.fork/README.md`](../README.md#tdd-workflow). Contract: `specs/003-tdd-extension/contracts/tdd-adapter-cli.md`.

```bash
node .fork/ci/bin/tdd.mjs where                  # print the resolved target as JSON
node .fork/ci/bin/tdd.mjs single <file> <name>   # one named test
node .fork/ci/bin/tdd.mjs file <file>            # one test file
node .fork/ci/bin/tdd.mjs suite                  # the contribution folder, as run-folder would
```

| Exit | Meaning |
|------|---------|
| 0 | Pass (`suite`: `pass`, `sql-unverified`, or an empty baseline) |
| 1 | Tests failed, or the suite is red |
| 2 | Target, usage or Node-version error (Node ≥ 26 required); a single-line `tdd: …` message |
| 3 | Zero tests matched the name or file (never a false green) |
| 4 | The operation is unsupported for that runtime (`single` on SQL, a plain `test-*.mjs` script, or a node-script runner other than vitest/jest): use `file` |

**Target resolution** (the repo root is the checkout the script runs from):

1. **Feature**: `SPECIFY_FEATURE_DIRECTORY`, else `feature_directory` from the checkout's own `.specify/feature.json` (gitignored, per checkout), else exit 2 "no active feature".
2. **Lane**, from the plan's `**Lane**` line: `fork feature` → fork, `upstream-bound` → upstream-bound, `staged upstream PR` → staged. A placeholder (contains `[`) or any other value is an error.
3. **Worktree**, from the `**Worktree**` line (text after the first `:`, `*(…)*` annotations removed): a placeholder is an error; a value starting with `none` means the repo root; otherwise the first backticked token must be an absolute path to an existing git work tree. A missing line means the repo root for a fork feature and is an error for staged and upstream-bound features.
4. **Contribution folder**, from the `**Contribution folder**` line: a placeholder or a value starting with `N/A` is an error (checked before backticks); otherwise the first backticked token without a trailing `/`, repo-relative (no leading `/`, no `..`).
5. **File**: an absolute path is used as is; a relative one is tried against the folder, then the tree, then the repo root (first that exists). In every case it must be inside the tree and be a test file of a runtime that `scanRuntimes` finds in the folder.

**Behavior**:

- Child output is streamed live and captured in full (never truncated). One final summary line follows: `[tdd] <op> <kind> feature=<feature> folder=<folder>: tests=<n> pass=<n> fail=<n> → <result>`.
- Node tests run with `--test-isolation=none --test-reporter=spec` and an anchored, escaped name, so a name that matches nothing reports `tests 0` and exits 3.
- **Credential blanking**: every child (including the Python venv setup and `suite`) runs with `NODE_TEST_CONTEXT` removed and credential variables set to `""`: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, and any name ending in `_API_KEY`, `_TOKEN`, `_SECRET` or `_SERVICE_ROLE_KEY`. Empty values also override `.env.local` files.
- **Empty baseline**: `suite` treats `no-tests`, `exempt`, and a contribution folder that doesn't exist yet as green (exit 0) with an `empty baseline: …` notice, so the loop can start on a new folder. `single` and `file` on a missing folder exit 2.
- `suite` runs `bin/run-folder.mjs --mode strict --origin fork` in the tree, and restores a lockfile (`package-lock.json`, `deno.lock`) it modified that was clean before.
- Python `single`/`file` use a cached venv in the per-user cache (`$XDG_CACHE_HOME/fork-tdd/`, else `~/.cache/fork-tdd/`), rebuilt when `requirements.txt` changes, and also rebuilt when the cached directory is a symlink, not owned by you, or group/world-writable.

## TDD status (advisory)

On `pull_request` runs, `bin/verdict.mjs` adds a "TDD status (advisory)" table to the job summary (`lib/tdd-status.mjs`, from the `HEAD_REF` env var). It has one row per spec whose plan names the PR's branch: cycle log present, audit report (`tdd/verification.md`) present, and the audit verdict (PASS, PASS_WITH_GAPS, FAIL, BLOCKED, `missing` or `unreadable`). With no linked spec it prints one line; on a push it shows nothing; if reading the specs fails it prints `TDD status unavailable: … (advisory)`.

The section is **advisory**: it never changes `fork-ci-verdict`'s conclusion, its exit code or `verdict.json`. Contract: `specs/003-tdd-extension/contracts/fork-ci-tdd-status.md`.

## Principle V guard (`bin/principle-v-guard.mjs`)

Enforces constitution Principle V on the fork-`main` checkout. One CLI, two modes, both calling the same rule (`lib/principle-v.mjs`, with path and git helpers in `lib/principle-v-paths.mjs`). It is not called by CI. Wiring and the enable command are in `.fork/README.md`; contract: `specs/005-principle-v-guard/contracts/guards.md`.

| Mode | Called by | Input | Exit codes and output |
|------|-----------|-------|-----------------------|
| `--hook` | Claude Code `PreToolUse` hook (`.claude/settings.json`) | one hook JSON object on stdin; target is `tool_input.file_path`, else `tool_input.notebook_path`, resolved against `cwd` | always exit 0. Allowed: no output. Denied: a `hookSpecificOutput` JSON with `permissionDecision: "deny"` and the reason plus suggestion |
| `--staged` | git `pre-commit` hook (`.fork/githooks/pre-commit`) | the staged paths (`git diff --cached --name-only -z --no-renames`) | exit 0 and no output when every path is allowed; exit 1 with a header, one line per refused path and a `git commit --no-verify` note on stderr otherwise |

**Fail closed.** Unparseable stdin, a matched tool with no target path, a library that fails to load, or any other exception is a refusal, never a pass: `--hook` prints the deny JSON with a reason starting `principle-v-guard failed:` (still exit 0, because a non-zero exit would let the write through); `--staged` exits 1 with `principle-v-guard failed:` on stderr.

Run the hook by hand: `echo '{"tool_input":{"file_path":"README.md"},"cwd":"."}' | node .fork/ci/bin/principle-v-guard.mjs --hook`.

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
| `lib/` | Logic: `paths`, `changes`, `runtimes`, `exec`, `origin`, `verdict`, `report`, `bypass`, `self-test-needed`, `args`; TDD: `tdd-target`, `tdd-commands`, `tdd-env`, `tdd-status`; Principle V: `principle-v`, `principle-v-paths` |
| `bin/` | CLIs called by the workflow: `detect`, `run-folder`, `verdict`, `self-test-needed` (contract: `specs/001-fork-ci/contracts/cli.md`); `tdd` is called by the TDD loop and `principle-v-guard` by the Claude Code and git hooks, not by CI |
| `sql/bootstrap.sql` | Postgres bootstrap, drift-checked against `docs/01-getting-started.md` |
| `test/` | `node:test` suites; fixtures are in-memory file maps (`fixtures.mjs`) so their sample tests are never picked up by `node --test` |

## Toolchain pins

Node 26, Python 3.13, Deno v2.9.x, `pgvector/pgvector:pg17`, `actionlint` 1.7.12 (checksum-verified). Zero runtime dependencies.
