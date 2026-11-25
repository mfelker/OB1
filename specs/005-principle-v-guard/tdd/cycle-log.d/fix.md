## Cycle: U31 repoRelative returns the on-disk case of existing ancestors

- test: `.fork/ci/test/principle-v-paths.test.mjs::U31 repoRelative: a differently-cased path resolves to the on-disk case of its existing ancestors` (new; skips with a reason on a case-sensitive filesystem, detected by statting the upper-case name of a probe file; U12-U16 untouched)
- red: `node --test --test-name-pattern="^U31 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: 'Docs/new.md'` / `expected: 'docs/new.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:21` `realpathSync` -> `realpathSync.native` (returns on-disk case; temp dirs in tests are still normalised through `realpathSync`). Suite `node --test .fork/ci/test/` -> 194 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U32 D4 and D8 match case-insensitively; D5 and D6 stay exact-case

- test: `.fork/ci/test/principle-v.test.mjs::U32 D4/D8: upstream matches are case-insensitive; D5 and D6 stay exact-case` (new; `claude.md` -> D4, `Docs/x.md` -> D8, reasons name the given path, `Specs/x.md` still D9 and `SPECS/x.md` D7 with upstream null, so case variants of fork zones are never allowed as fork paths)
- red: `node --test --test-name-pattern="^U32 " .fork/ci/test/principle-v.test.mjs`
  -> `actual: true` / `expected: false` (on `claude.md` allowed) (1 failed)
- green: `.fork/ci/lib/principle-v.mjs` `decide()` D4/D8 compare against a lower-cased view of the upstream sets (`foldedUpstream`, cached per upstream object in a WeakMap; `decide()` input shape unchanged); D8 message names the upstream spelling of the folder. Suite `node --test .fork/ci/test/` -> 195 passed, 0 failed
- refactor: none needed
- commit: (this commit)
