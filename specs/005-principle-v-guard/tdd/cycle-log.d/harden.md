## Cycle: U36 D4 outranks D5: an upstream file under a fork-only root is denied

- test: `.fork/ci/test/principle-v.test.mjs::U36 D4 before D5: a file under a fork-only root that exists upstream is denied with D4` (new)
- red: mutant M13 (D5 evaluated before D4, swapped lines 45-46 of `.fork/ci/lib/principle-v.mjs`), `node --test --test-name-pattern="^U36 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U36 D4 before D5 ...` / `actual: true` / `expected: false` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 199 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 1 / M13
