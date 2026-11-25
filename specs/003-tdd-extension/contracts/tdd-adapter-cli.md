# Contract: `.fork/ci/bin/tdd.mjs`

```
node .fork/ci/bin/tdd.mjs where
node .fork/ci/bin/tdd.mjs single <file> <name>
node .fork/ci/bin/tdd.mjs file <file>
node .fork/ci/bin/tdd.mjs suite
```

The target is resolved per data-model `TddTarget` (grammar in research R3), and the runtime per research R4/R5.

- **Output**: the child's stdout and stderr are **streamed live** and captured in full; nothing is truncated.
- **Summary**: the adapter adds one final line, `[tdd] <op> <kind> feature=<featureDir rel> folder=<folder>: tests=<n> pass=<n> fail=<n> → <result>`.
- **Environment**: every child runs with `childEnv()` (data-model `ChildEnv`).

| # | Situation | Exit | Output (last line or stderr) |
|---|-----------|------|------------------------------|
| A1 | `where`, valid target | 0 | JSON `{repoRoot, featureDir, lane, tree, folder, folderExists, runtimes:[{kind, root, testFiles}]}` |
| A2 | No active feature | 2 | `tdd: no active feature (set SPECIFY_FEATURE_DIRECTORY or .specify/feature.json)` |
| A3 | Plan worktree path missing on disk | 2 | `tdd: worktree not found: <path>` |
| A4 | Contribution folder is a placeholder, `N/A…` or missing | 2 | `tdd: plan has no Contribution folder (<plan path>)` |
| A5 | `single`/`file` with the folder missing from the tree | 2 | `tdd: folder not found in tree: <folder> (<tree>)` |
| A6 | `single`/`file` on a file no runtime owns | 2 | `tdd: <file> is not a test file of any runtime in <folder> (patterns: …)` |
| A7 | `single`, known name, passing | 0 | `… tests=1 pass=1 fail=0 → pass` |
| A8 | `single`, known name, failing | 1 | `… fail=1 → fail` (the full child failure output streams above it) |
| A9 | `single`, name matching nothing | **3** | `… tests=0 → no tests matched "<name>"` |
| A10 | `single` on sql, a plain script, or a node-script runner other than vitest/jest | 4 | `tdd: single unsupported for <kind>: <reason>; use 'file'` |
| A11 | `file` | 0, 1 or 3 | As A7–A9, for the whole file |
| A12 | `suite` outcome `pass` or `sql-unverified` | 0 | One line per runtime, then `[tdd] suite … → <outcome>` |
| A13 | `suite` outcome `no-tests` or `exempt`, or the folder doesn't exist yet | 0 | `[tdd] suite … → empty baseline: <why>` |
| A14 | `suite`, any other outcome | 1 | The same, with the reason |
| A15 | A file path (absolute **or** resolved relative) outside the tree | 2 | `tdd: <file> is outside the target tree <tree>` |
| A16 | A relative file path | — | Tried against the folder, then the tree, then the repo root. The first that exists wins, then A15 is checked |
| A17 | The Lane or Worktree line is a placeholder (contains `[`) | 2 | `tdd: plan <field> is a placeholder (<plan path>)` |
| A18 | The Worktree value isn't `none…` and has no absolute backticked path | 2 | `tdd: plan Worktree must be an absolute path or "none"` |
| A19 | Lane is `staged` or `upstream-bound` with no Worktree line | 2 | `tdd: plan Worktree required for <lane> lane` |
| A20 | Node major < 26 | 2 | `tdd: requires Node >= 26 (found <v>)` |
| A21 | `suite` modified a lockfile that was clean before | — | Restored, with the notice `restored <file>` |

Usage errors (an unknown subcommand, missing arguments) exit 2 and print the synopsis.

**Shell quoting**: `name` is passed to the child as one argv element. The caller's shell expands the profile's `"{name}"` first, though, so a name containing `"`, `$` or a backtick must be escaped by the caller (noted in the profile).
