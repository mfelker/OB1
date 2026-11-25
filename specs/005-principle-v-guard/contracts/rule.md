# Contract: the Principle V rule (`.fork/ci/lib/principle-v.mjs` and `principle-v-paths.mjs`)

## `decide(input) → Decision`

Pure: no I/O. Both guards call it (FR-001).

| Input field | Type | Meaning |
|-------------|------|---------|
| `relPath` | string or `null` | Repo-relative POSIX path from `repoRelative()`; `null` when the path is outside the checkout |
| `branch` | string | Current branch of the checkout that owns the path (`HEAD` when detached) |
| `mergeInProgress` | boolean | `MERGE_HEAD` exists in that checkout |
| `upstream` | `{ files: Set<string>, dirs: Set<string> }` or `null` | From `upstreamPaths()`; `null` when `upstream/main` cannot be read |

`Decision` = `{ allowed: true, rule }` or `{ allowed: false, rule, reason, suggestion }`. `rule` names the table row that decided (D1–D9), so tests and messages can cite it.

## Decision table (first matching row wins)

| Row | Condition | Result |
|-----|-----------|--------|
| D1 | `relPath === null` | allow (outside the repository; FR-010) |
| D2 | `branch !== 'main'` | allow (worktrees, other branches, detached HEAD; FR-004) |
| D3 | `mergeInProgress` | allow (resolving an upstream merge; FR-004) |
| D4 | `upstream?.files.has(relPath)` | **deny**: the exact file exists upstream (wins over D5 and D6; FR-003) |
| D5 | first segment is `.fork`, `.specify`, `specs` or `.worktrees` | allow (fork-only root; FR-003) |
| D6 | `relPath === '.claude/settings.json'`, or starts with `.claude/skills/speckit-`, or starts with `.github/workflows/fork-` | allow (fork-only zone; FR-003) |
| D7 | `upstream === null` | **deny**: upstream unknown; reason says to run `git fetch upstream` (FR-006) |
| D8 | any ancestor folder of `relPath` is in `upstream.dirs` | **deny**: new file inside an upstream folder (FR-002) |
| D9 | otherwise | allow (a new top-level path upstream does not have) |

## Messages (FR-005)

Every deny has:

- `reason`: `"<relPath>: constitution Principle V reserves this path for upstream (<why>)."`, where `<why>` is `file exists in upstream/main` (D4), `inside upstream folder <dir>/` (D8), or `upstream/main is unavailable; run git fetch upstream` (D7).
- `suggestion`:
  - for `relPath` under `docs/domain_knowledge/`: `"Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md)."`
  - otherwise: `"Make this change in an upstream-bound worktree (contrib/mfelker/<desc> from upstream/main) or a staged PR, not on fork main."`

## Interpretations settled during implementation

- `upstream.dirs` entries carry no leading or trailing slash (`docs`, `.github/workflows`); the D8 reason appends the `/`.
- When several ancestors of `relPath` are upstream folders, the D8 reason names the outermost one (`docs/a/b/c.md` → `inside upstream folder docs/`).
- The `.fork/domain-knowledge/` suggestion is chosen by path, not by row: any deny (D4, D7 or D8) of a path under `docs/domain_knowledge/` gets it.
- An allow is `{ allowed: true, rule }` with no `reason` or `suggestion`.
- `repoRelative` returns `{ root: null, relPath: null }` when no checkout contains the path.
- `repoRelative` reports the on-disk case of existing path segments (`realpathSync.native`), and D4/D8 match upstream paths case-insensitively; D5/D6 stay exact-case, so case handling can only deny more (analyze F1, U31–U32).

## Helpers (I/O, thin): `.fork/ci/lib/principle-v-paths.mjs`

Kept apart from the pure rule so each has its own module and test file.

| Function | Returns | Failure |
|----------|---------|---------|
| `repoRelative(path, cwd)` | `{ root, relPath }`: `root` is the git top-level of the nearest existing ancestor of the resolved path (symlinks resolved), `relPath` is POSIX-relative to it, or `null` when outside every checkout or equal to `root` | never throws; outside → `relPath: null` |
| `checkoutState(root)` | `{ branch, mergeInProgress }` | throws `GuardError` if `root` is not a git work tree |
| `upstreamPaths(root)` | `{ files, dirs }` from `git ls-tree -r -z --name-only upstream/main`; `dirs` holds every ancestor of every file | `null` when the ref is missing or the command fails |
