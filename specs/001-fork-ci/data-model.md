# Data Model: Fork CI

**Feature**: [spec.md](spec.md) · **Research**: [research.md](research.md)

All entities are in-memory JavaScript objects or JSON artifacts passed between workflow jobs. Nothing is persisted beyond a workflow run.

## Changed Folder

Produced by `detect` (`lib/paths.mjs`, `lib/changes.mjs`, `lib/origin.mjs`).

| Field | Type | Rules |
|-------|------|-------|
| `path` | string | `<category>/<name>` (category ∈ recipes, schemas, integrations, dashboards, skills, extensions, primitives) or `server`. Never `_template`, never a fork-only path (FR-002/003) |
| `category` | string | First path segment, or `server` |
| `status` | enum | `present` \| `removed` (folder absent at head) |
| `origin` | enum | `upstream` (tree at head == tree at merge-base(HEAD, upstream/main)) \| `fork` (R6) |
| `mode` | enum | `advisory` if `origin = upstream`, else `strict` (FR-010) |
| `changedFiles` | string[] | Paths inside the folder that changed in this run's diff |
| `needsPostgres` | boolean | true if any runtime is `sql` with a `tests/verify.sql` (R10) |

**Matrix entry** (what `detect` emits per folder): `{ path, mode, origin, needsPostgres }`. Removed folders are not put in the matrix; `detect` reports them directly to the verdict through its output.

## Runtime

Produced by `lib/runtimes.mjs` from a scan of one folder at head (excluding `node_modules/`).

| Field | Type | Rules |
|-------|------|-------|
| `kind` | enum | `deno` \| `node-script` \| `node-plain` \| `python` \| `sql` (R8) |
| `root` | string | Sub-project dir the command runs in (for example `server`, `integrations/x/plugin`) |
| `codeFiles` | string[] | `.ts .tsx .js .mjs .cjs .py .svelte` (excluding `*.d.ts`, `*.config.*`) owned by this runtime; for `sql`, `.sql` files |
| `testFiles` | string[] | Files matching the runtime's test patterns (R8) |
| `command` | string[] \| null | Argv to run, or `null` when no runner applies |

**Classification of a folder** (derived):

- `exempt`: no runtime has `codeFiles` (docs, prompts, metadata, images only).
- Otherwise: a code folder. In **strict** mode, every runtime with `codeFiles` must have `testFiles` (R7, FR-006). The `sql` runtime is never required to have tests; it is `sql-unverified` (advisory) when no `tests/verify.sql` exists (FR-011).

## Folder Result

Written by `bin/run-folder.mjs` as `result-<slug>.json` (schema: [contracts/result.schema.json](contracts/result.schema.json)).

| Field | Type | Rules |
|-------|------|-------|
| `path`, `mode`, `origin` | | copied from the matrix entry |
| `outcome` | enum | `pass` \| `fail` \| `no-tests` \| `setup` \| `timeout` \| `exempt` \| `sql-unverified` |
| `runtimes` | object[] | per runtime: `{ kind, root, outcome, reason, durationMs, outputExcerpt }` |
| `reason` | string | Human-readable cause of the folder outcome (for example "no tests for deno code", "tests found but no runner configured", "npm install failed") |
| `durationMs` | integer | Total wall time |

**Folder outcome precedence** (worst runtime wins): `timeout` > `setup` > `fail` > `no-tests` > `sql-unverified` > `pass` > `exempt`.

**Runtime outcome rules**:

- Install step non-zero → `setup`
- Test command exit 124 (wrapped `timeout`) → `timeout`
- Other non-zero exit → `fail`
- Code but no tests → `no-tests`
- Test files but `command = null` → `setup` ("tests found but no runner configured")

## Check Verdict

Computed by `bin/verdict.mjs` (`lib/verdict.mjs`).

| Field | Type | Rules |
|-------|------|-------|
| `conclusion` | enum | `success` \| `failure` |
| `counts` | object | Number of folders per outcome × mode |
| `failing` | string[] | Strict folders with outcome ∈ {fail, no-tests, setup, timeout} |
| `advisories` | string[] | Advisory folders with non-pass outcomes, plus all `sql-unverified` |
| `bypasses` | object[] | Push runs only: `{ sha, branch }` for local `stage/`/`contrib/` merges (R11) |
| `missing` | string[] | Matrix folders with no result artifact; they count as `timeout` |

**State rules (R9)**:

- `detect.result ≠ success` → `failure`
- No testable folders → `success` (US3)
- Any `failing`, any strict `missing`, or any `bypasses` → `failure`
- Otherwise → `success`. Advisories never cause failure (FR-010, FR-011, SC-008).
