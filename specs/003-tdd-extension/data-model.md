# Data Model: Adopt the spec-kit-tdd extension

There's no database. These are the in-memory shapes the adapter and the advisory pass around, and the files they read.

## TddTarget (`lib/tdd-target.mjs` → `resolveTarget()`)

| Field | Type | Rule |
|-------|------|------|
| `repoRoot` | absolute path | Three levels above `bin/tdd.mjs` (research R3) |
| `featureDir` | absolute path | From `SPECIFY_FEATURE_DIRECTORY`, else `.specify/feature.json` `feature_directory`, else error `no active feature` |
| `tree` | absolute path | The plan's `**Worktree**` backticked absolute path. Missing or placeholder means `repoRoot`. It must exist and be a git work tree, else error `worktree not found: <path>` |
| `folder` | repo-relative posix path | The plan's `**Contribution folder**` backticked path, without a trailing `/`. Placeholder, `N/A` or missing gives error `plan has no Contribution folder`. It must exist under `tree`, else error `folder not found in tree` |
| `lane` | `"fork" \| "upstream-bound" \| "staged"` | Parsed from the plan's `**Lane**` line. `staged` when it contains `staged upstream PR`; it selects the override's evidence rule |

Errors are thrown as `TargetError` with a single-line message. The CLI prints it and exits **2**.

## RuntimeCommand (`lib/tdd-commands.mjs` → `commandFor(op, runtime, file, name)`)

| Field | Type | Rule |
|-------|------|------|
| `op` | `"single" \| "file"` | |
| `kind` | fork-ci runtime kind | `deno`, `node-script`, `node-plain`, `python`, `sql` (from `scanRuntimes`) |
| `argv` | string[] | Per research R5. `name` goes in as a single argv element, never through a shell |
| `cwd` | absolute path | `tree` + the runtime's `root` |
| `countParser` | function(output, exitCode) → `{tests, passed, failed}` or `null` | `null` means the counts can't be determined, which is treated as a failure, not a pass |
| `unsupported` | string or null | Set for `single` on sql and on unknown node-script runners. The CLI exits **4** with this text |

**Exit codes** (`bin/tdd.mjs`): 0 pass · 1 tests failed · 2 target or usage error · 3 zero tests matched · 4 operation unsupported for this runtime.

## TddStatus (`lib/tdd-status.mjs` → `tddStatus(rootDir, headRef)`)

| Field | Type | Rule |
|-------|------|------|
| `headRef` | string | Empty means a push event, so no status is reported |
| `features` | array of `{ dir, cycleLog: bool, verification: bool, verdict }` | Every `specs/*/spec.md` whose `**Feature Branch**` backticked value equals `headRef` |
| `verdict` | `"PASS" \| "PASS_WITH_GAPS" \| "FAIL" \| "BLOCKED" \| "missing" \| "unreadable"` | From `tdd/verification.md` frontmatter `verdict:`. `missing` when there's no file; `unreadable` when the file has no valid `verdict:` |
| `linked` | bool | `false` means the report shows `no feature linked` |

Invariant: `computeVerdict()`'s `conclusion` is the same for any `TddStatus`.

## OverrideFile (`.specify/templates/overrides/*.md`)

| Field | Rule |
|-------|------|
| `name` | `tdd-test-quality-rubric.md` or `tdd-loop-playbook.md` |
| header `base` | `spec-kit-tdd 2.0.1` |
| header `base_sha256` | SHA-256 of the installed `.specify/extensions/tdd/templates/<name>` at the time of copying |
| fork section | Delimited by `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->`. Everything outside it is byte-identical to the base |

The drift test asserts two things. The installed template's SHA-256 equals `base_sha256`. Removing the fork section from the override reproduces the base exactly.

## TddProfile (`.specify/memory/tdd-profile.md`)

This uses the extension's format. The fork's field values are in [contracts/tdd-profile.md](contracts/tdd-profile.md).

## Feature TDD artifacts (written by the extension, read by the advisory)

`specs/<feature>/tdd/test-list.md`, `tdd/cycle-log.md` (append-only) and `tdd/verification.md` (frontmatter includes `verdict`). Their formats belong to the extension's templates. The fork only reads `verdict`.
