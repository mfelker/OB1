<!-- stream guard (G) -->

## Cycle: A1 agent guard refuses an upstream file

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A1 agent guard refuses a Write to a file that exists upstream, naming Principle V and the upstream-bound route` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); re-run with the `todo` option removed and no CLI: `node --test --test-name-pattern="^A1 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: node:internal/modules/cjs/loader … Cannot find module '…/.fork/ci/bin/principle-v-guard.mjs'` / `actual: 1` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:1-27` new CLI: reads the PreToolUse JSON from stdin, loads both libs with dynamic `import()` inside the top-level `try`, resolves `repoRelative` -> `checkoutState` -> `upstreamPaths` -> `decide`, prints the deny JSON (smallest version: every decision prints a deny; any exception prints a `principle-v-guard failed:` deny). Suite `node --test .fork/ci/test/` -> 179 passed, 0 failed, 8 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A3 agent guard allows every fork-only root and zone

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A3 agent guard allows every fork-only root and zone` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); run before this commit's change: `node --test --test-name-pattern="^A3 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/notes.md: an allowed write prints no decision` / `actual: '{"hookSpecificOutput":{…"permissionDecisionReason":"undefined undefined"}}\n', expected: ''` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:22` print the deny only when `!d.allowed`; allowed prints nothing. Suite `node --test .fork/ci/test/` -> 180 passed, 0 failed, 7 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A2 --hook points domain_knowledge writes to .fork/domain-knowledge/

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A2 agent guard refuses docs/domain_knowledge/CONTEXT.md and points to .fork/domain-knowledge/` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A2 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: the D4 deny carries the domain-knowledge suggestion from decide()). Suite `node --test .fork/ci/test/` -> 181 passed, 0 failed, 6 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A4 --hook allows a linked worktree write

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A4 agent guard allows an upstream path in a linked worktree on another branch, from a main-checkout session` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A4 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: repoRelative/checkoutState read the worktree's own root and branch (D2)). Suite `node --test .fork/ci/test/` -> 182 passed, 0 failed, 5 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A5 --hook allows an upstream file during a merge

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A5 agent guard allows editing an upstream file while a merge is in progress on main` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A5 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: checkoutState reports MERGE_HEAD (D3)). Suite `node --test .fork/ci/test/` -> 183 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U22 --hook reads notebook_path and resolves a relative path against cwd

- test: `.fork/ci/test/principle-v-guard.test.mjs::U22 --hook reads tool_input.notebook_path when there is no file_path, resolving a relative path against the input cwd` (new)
- red: `node --test --test-name-pattern="^U22 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^CLAUDE\.md: constitution Principle V/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:17` target is `tool_input.file_path ?? tool_input.notebook_path`; `repoRelative` already resolves a relative path against the input `cwd`. Suite `node --test .fork/ci/test/` -> 184 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U23 --hook fails closed on unparseable stdin

- test: `.fork/ci/test/principle-v-guard.test.mjs::U23 --hook with unparseable stdin prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U23 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /The write was refused; fix the guard or run it by hand: node \.fork\/ci\/bin\/principle-v-guard\.mjs --hook/` with ``actual: `principle-v-guard failed: Unexpected token 'o', "not json" is not valid JSON` `` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` the catch appends the contract's `The write was refused; fix the guard or run it by hand: ...` text (`REFUSED`); the prefix, deny shape and exit 0 already came from the top-level `try`/`catch`. Suite `node --test .fork/ci/test/` -> 185 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U24 --hook fails closed when a matched tool has no target path

- test: `.fork/ci/test/principle-v-guard.test.mjs::U24 --hook for a matched tool with no target path prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U24 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /no target path/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined. The write was refused; …'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:19-20` a missing or empty target throws `no target path in tool_input (file_path or notebook_path)`, which the catch turns into the deny; `tool_input?.` tolerates a missing object. Suite `node --test .fork/ci/test/` -> 186 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)
