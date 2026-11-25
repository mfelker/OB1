<!-- stream guard (G) -->

## Cycle: A1 agent guard refuses an upstream file

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A1 agent guard refuses a Write to a file that exists upstream, naming Principle V and the upstream-bound route` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); re-run with the `todo` option removed and no CLI: `node --test --test-name-pattern="^A1 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: node:internal/modules/cjs/loader … Cannot find module '…/.fork/ci/bin/principle-v-guard.mjs'` / `actual: 1` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:1-27` new CLI: reads the PreToolUse JSON from stdin, loads both libs with dynamic `import()` inside the top-level `try`, resolves `repoRelative` -> `checkoutState` -> `upstreamPaths` -> `decide`, prints the deny JSON (smallest version: every decision prints a deny; any exception prints a `principle-v-guard failed:` deny). Suite `node --test .fork/ci/test/` -> 179 passed, 0 failed, 8 todo
- refactor: none needed
- commit: (this commit)
