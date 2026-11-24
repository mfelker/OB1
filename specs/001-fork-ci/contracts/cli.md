# Contract: fork-ci CLI scripts

All scripts are Node ES modules with no dependencies, run from the repo root as `node .fork/ci/bin/<name>.mjs`. They never read secrets or environment credentials.

## `detect.mjs`

Determines the changed folders and builds the test matrix.

| Arg | Required | Meaning |
|-----|----------|---------|
| `--event pull_request\|push` | yes | Which diff mode to use (R3) |
| `--base <sha>` / `--head <sha>` | PR | Diff is `base...head` |
| `--before <sha>` / `--after <sha>` | push | Diff is `before..after` (all-zero `before` → `after~1..after`) |
| `--upstream-ref <ref>` | yes | Already-fetched upstream ref, for example `refs/remotes/upstream/main` (R6) |

**stdout** (JSON, single line):

```json
{
  "has_folders": true,
  "matrix": { "include": [ { "path": "recipes/x", "mode": "strict", "origin": "fork", "needsPostgres": false } ] },
  "has_sql": true,
  "sql_matrix": { "include": [ { "path": "schemas/y", "mode": "strict", "origin": "fork", "needsPostgres": true } ] },
  "removed": ["recipes/old"],
  "skipped": { "forkOnly": 3, "template": 0, "other": 1 }
}
```

**Exit codes**: `0` success (including zero folders); `2` usage error; `3` git error (for example an unknown sha).

## `self-test-needed.mjs`

Decides whether fork-ci's own tests must run (research R13).

| Arg | Required | Meaning |
|-----|----------|---------|
| `--event pull_request\|push` | yes | Diff mode, as for `detect.mjs` |
| `--base` / `--head` or `--before` / `--after` | yes | Same as `detect.mjs` |

**stdout**: `true` when any changed path is under `.fork/ci/` or is `.github/workflows/fork-ci.yml`, otherwise `false`.

**Exit codes**: `0` success; `2` usage error; `3` git error.

## `run-folder.mjs`

Runs every runtime of one folder and always writes a result.

| Arg | Required | Meaning |
|-----|----------|---------|
| `--path <folder>` | yes | Folder from the matrix |
| `--mode strict\|advisory` | yes | From the matrix |
| `--origin fork\|upstream` | yes | From the matrix |
| `--out <file>` | yes | Result JSON path (see [result.schema.json](result.schema.json)) |
| `--timeout-sec <n>` | no | Per-command timeout, default `600` |

**Behavior**: classifies runtimes (data-model *Runtime*), runs each runtime's install and test commands in its `root` with the timeout, captures the last 60 lines of output per runtime, and writes the result.

**Exit code**: always `0` once a result is written (R9). Non-zero only if the result file itself cannot be written.

## `verdict.mjs`

Aggregates results into the required check.

| Arg | Required | Meaning |
|-----|----------|---------|
| `--detect <file>` | yes | `detect.mjs` stdout saved to a file |
| `--results <dir>` | yes | Directory of downloaded `result-*.json` |
| `--detect-result success\|failure\|cancelled\|skipped` | yes | `needs.detect.result` |
| `--test-result success\|failure\|cancelled\|skipped` | yes | `needs.test.result` |
| `--test-sql-result success\|failure\|cancelled\|skipped` | yes | `needs.test-sql.result`; `skipped` is valid only when `has_sql` is false |
| `--self-test-result success\|failure\|cancelled\|skipped` | yes | `needs.self-test.result`; `skipped` means self-test was not needed |
| `--bypass-range <before>..<after>` | push only | Range to scan for local merges of upstream-based branches (R11) |
| `--upstream-ref <ref>` | with `--bypass-range` | Fetched upstream ref used by the R11 rule |
| `--summary <file>` | yes | Markdown report destination (`$GITHUB_STEP_SUMMARY`) |

**Exit codes**: `0` when the verdict is `success`; `1` when the verdict is `failure`; `2` on a usage error.
