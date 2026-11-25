# Contract: `.fork/ci/bin/tdd.mjs`

```
node .fork/ci/bin/tdd.mjs where
node .fork/ci/bin/tdd.mjs single <file> <name>
node .fork/ci/bin/tdd.mjs file <file>
node .fork/ci/bin/tdd.mjs suite
```

The adapter resolves the target per data-model `TddTarget` and picks the runtime per research R4/R5. The child's stdout and stderr pass through unchanged, and the adapter adds one final line: `[tdd] <op> <kind> <folder>: tests=<n> pass=<n> fail=<n> → <result>`.

| # | Situation | Exit | Output (last line or stderr) |
|---|-----------|------|------------------------------|
| A1 | `where` with a valid target | 0 | JSON `{repoRoot, featureDir, tree, folder, lane, runtimes:[{kind, root, testFiles}]}` |
| A2 | No active feature | 2 | `tdd: no active feature (set SPECIFY_FEATURE_DIRECTORY or .specify/feature.json)` |
| A3 | Plan worktree path missing on disk | 2 | `tdd: worktree not found: <path>` |
| A4 | Plan has no Contribution folder (placeholder, N/A or missing) | 2 | `tdd: plan has no Contribution folder (<plan path>)` |
| A5 | Folder not in tree | 2 | `tdd: folder not found in tree: <folder> (<tree>)` |
| A6 | `single` on a file no runtime owns | 2 | `tdd: <file> is not a test file of any runtime in <folder> (patterns: …)` |
| A7 | `single` with a known name, passing | 0 | `… tests=1 pass=1 fail=0 → pass` |
| A8 | `single` with a known name, failing | 1 | `… fail=1 → fail` (the child's failure output stays above it) |
| A9 | `single` with a name matching nothing | **3** | `… tests=0 → no tests matched "<name>"` |
| A10 | `single` on sql, or a node-script runner other than vitest/jest | 4 | `tdd: single unsupported for <kind>: <reason>; use 'file'` |
| A11 | `file` | 0, 1 or 3 | As A7–A9, for the whole file |
| A12 | `suite` with outcome `pass` or `sql-unverified` | 0 | One line per runtime, then `[tdd] suite <folder>: <outcome>` |
| A13 | `suite` with any other outcome | 1 | The same, with the reason |
| A14 | File given as absolute path outside the tree | 2 | `tdd: <file> is outside the target tree <tree>` |
| A15 | Relative file path | — | Resolved against the folder, then the tree, then the repo root; the first that exists wins |

Usage errors (unknown subcommand, missing args) exit 2 and print the usage synopsis. `name` is passed as a single argv element and never through a shell. The child env is `process.env` minus `NODE_TEST_CONTEXT` (the spec 001 lesson).
