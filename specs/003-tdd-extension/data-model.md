# Data Model: Adopt the spec-kit-tdd extension

No database. These are the in-memory shapes the adapter and the advisory pass around, and the files they read.

## TddTarget (`lib/tdd-target.mjs` → `resolveTarget({ repoRoot, env })`)

| Field | Type | Rule (grammar: research R3) |
|-------|------|------------------------------|
| `repoRoot` | absolute path | Three levels above `bin/tdd.mjs`. Passed in, so tests can point it at a fixture repo |
| `featureDir` | absolute path | From `SPECIFY_FEATURE_DIRECTORY`, else `.specify/feature.json` `feature_directory`, else error `no active feature` |
| `lane` | `"fork" \| "upstream-bound" \| "staged"` | From the `**Lane**` line. A placeholder (`[`) or an unknown value is an error |
| `tree` | absolute path | From the `**Worktree**` line: placeholder → error; `none…` → `repoRoot`; first backticked token, which must be absolute; must exist as a git work tree. A **missing line** means `repoRoot` for lane `fork` only, otherwise error `plan Worktree required for <lane> lane` |
| `folder` | repo-relative posix path | From the `**Contribution folder**` line: placeholder → error; `N/A…` → error (checked before backticks); first backticked token, without a trailing `/`, no leading `/`, no `..` |
| `folderExists` | bool | `true` when `tree/folder` is a directory. `false` is allowed only for `suite` (empty baseline, FR-017); other operations fail with error `folder not found in tree` |

Errors are `TargetError` with a single-line message. The CLI exits **2**.

## RuntimeCommand (`lib/tdd-commands.mjs` → `buildCommand({ op, runtime, tree, file, name })`)

| Field | Type | Rule (research R5) |
|-------|------|--------------------|
| `op` | `"single" \| "file"` | `suite` doesn't build a RuntimeCommand; it delegates to run-folder |
| `kind` | fork-ci runtime kind | `deno`, `node-script`, `node-plain`, `python` or `sql`, taken from the `scanRuntimes` entry that owns the file. node-plain is refined into `node-test` (imports `node:test`) or `plain-script` |
| `argv` | string[] | Per research R5. `name` is a single argv element and never passes through a shell. Deno flags come from `runtime.command` |
| `cwd` | absolute path | `tree` + the runtime's `root`. This is the main correctness constraint of US2: a command never runs in another tree |
| `countParser` | (output, exitCode) → `{ tests, passed, failed }` or `null` | `null` means the counts couldn't be determined, which counts as a failure, never a pass |
| `unsupported` | string or null | Set for `single` on `sql`, `plain-script` and node-script runners other than vitest/jest. The CLI exits **4** with this text |

**Exit codes** (`bin/tdd.mjs`): 0 pass · 1 tests failed or suite red · 2 target, usage or Node-version error · 3 zero tests matched · 4 operation unsupported for this runtime.

## ChildEnv (`lib/tdd-env.mjs` → `childEnv(baseEnv)`)

| Rule | Detail (research R10) |
|------|-----------------------|
| Removed | `NODE_TEST_CONTEXT` |
| Set to `""` | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, and every name matching `/(_API_KEY\|_TOKEN\|_SECRET\|_SERVICE_ROLE_KEY)$/` |
| Kept | Everything else (`PATH`, `HOME`, …) |
| Scope | Every child process: `single`, `file`, the Python venv setup, and `suite` (run-folder) |

## SuiteResult (`bin/tdd.mjs suite`)

| run-folder outcome | Exit | Notice |
|--------------------|------|--------|
| `pass` | 0 | — |
| `sql-unverified` | 0 | `sql unverified (advisory)` |
| `no-tests` / `exempt` | 0 | `empty baseline: …` |
| folder missing (`folderExists: false`) | 0 | `empty baseline: folder does not exist yet` (run-folder isn't called) |
| any other | 1 | the reason |

Lockfiles (`package-lock.json`, `deno.lock`) that were clean before the run are restored afterwards (research R6).

## TddStatus (`lib/tdd-status.mjs` → `tddStatus(rootDir, headRef)`)

| Field | Type | Rule |
|-------|------|------|
| `headRef` | string | Empty means a push event, so there's no status (`null` returned) |
| `features` | `{ dir, cycleLog: bool, verification: bool, verdict }[]` | Every `specs/*/spec.md` whose `**Feature Branch**` backticked value **literally equals** `headRef` |
| `verdict` | `"PASS" \| "PASS_WITH_GAPS" \| "FAIL" \| "BLOCKED" \| "missing" \| "unreadable"` | From `tdd/verification.md` frontmatter `verdict:`. `missing` means there's no file; `unreadable` means there's no valid value |
| `linked` | bool | `false` → `No feature linked to <headRef> (advisory).` |
| `error` | string or null | Set by `bin/verdict.mjs` when `tddStatus` throws. It renders `TDD status unavailable: <message> (advisory)` |

**Invariant**: `fork-ci-verdict`'s conclusion and exit code are the same for every TddStatus value, including `error`.

## OverrideFile (`.specify/templates/overrides/*.md`)

| Field | Rule |
|-------|------|
| `name` | `tdd-test-quality-rubric.md` or `tdd-loop-playbook.md` |
| header `base` | `spec-kit-tdd 2.0.1` |
| header `base_sha256` | SHA-256 of the installed `.specify/extensions/tdd/templates/<name>` at the time of copying |
| fork section | Delimited by `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->`. Everything outside the header and that section is byte-identical to the base |

## TddProfile (`.specify/memory/tdd-profile.md`)

This uses the extension's format. The fork's values are listed in [contracts/tdd-profile.md](contracts/tdd-profile.md).

## Feature TDD artifacts

The extension writes `specs/<feature>/tdd/test-list.md`, `tdd/cycle-log.md` (append-only) and `tdd/verification.md` (frontmatter `verdict`), in its own formats. During parallel implementation, streams write `tdd/cycle-log.d/<stream>.md` fragments instead. The integrator appends them to `cycle-log.md` in merge order, then deletes them (research R14).
