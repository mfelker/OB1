# Data Model: Principle V guard

No persisted data. Four in-memory shapes, all defined in [contracts/rule.md](contracts/rule.md).

| Entity | Fields | Rules |
|--------|--------|-------|
| `PathTarget` | `root` (git top-level), `relPath` (POSIX, repo-relative, or `null`) | Same file → same `PathTarget` whether given relative, absolute, with `..`, or through a symlink (FR-010). A file not yet created is resolved through its nearest existing ancestor. |
| `CheckoutState` | `branch`, `mergeInProgress` | Read from the checkout that owns the path, not from the session's working directory, so a write into `.worktrees/<x>` sees that worktree's branch. |
| `UpstreamPaths` | `files: Set`, `dirs: Set` | `dirs` = every proper ancestor of every file (`docs`, `docs/assets`, …). `null` when `upstream/main` is unreadable (FR-006). |
| `Decision` | `allowed`, `rule` (D1–D9), `reason`, `suggestion` | Deny always carries both strings (FR-005). |

## Guard outcomes

| Guard | Allowed | Denied | Guard failure |
|-------|---------|--------|---------------|
| Agent (`--hook`) | tool call proceeds | refused; Claude sees `reason` + `suggestion` | refused with `principle-v-guard failed: <error>` (FR-011) |
| Commit (`--staged`) | commit proceeds | commit aborted; each protected path listed with its reason (FR-008) | commit aborted with the error |
