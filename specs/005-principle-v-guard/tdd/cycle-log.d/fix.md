## Cycle: U31 repoRelative returns the on-disk case of existing ancestors

- test: `.fork/ci/test/principle-v-paths.test.mjs::U31 repoRelative: a differently-cased path resolves to the on-disk case of its existing ancestors` (new; skips with a reason on a case-sensitive filesystem, detected by statting the upper-case name of a probe file; U12-U16 untouched)
- red: `node --test --test-name-pattern="^U31 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: 'Docs/new.md'` / `expected: 'docs/new.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:21` `realpathSync` -> `realpathSync.native` (returns on-disk case; temp dirs in tests are still normalised through `realpathSync`). Suite `node --test .fork/ci/test/` -> 194 passed, 0 failed
- refactor: none needed
- commit: (this commit)
