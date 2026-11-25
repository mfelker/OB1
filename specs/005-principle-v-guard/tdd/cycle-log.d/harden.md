## Cycle: U36 D4 outranks D5: an upstream file under a fork-only root is denied

- test: `.fork/ci/test/principle-v.test.mjs::U36 D4 before D5: a file under a fork-only root that exists upstream is denied with D4` (new)
- red: mutant M13 (D5 evaluated before D4, swapped lines 45-46 of `.fork/ci/lib/principle-v.mjs`), `node --test --test-name-pattern="^U36 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U36 D4 before D5 ...` / `actual: true` / `expected: false` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 199 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 1 / M13

## Cycle: U37 D6 zones are narrow (other skills and workflows are upstream)

- test: `.fork/ci/test/principle-v.test.mjs::U37 D6 zones are narrow: other files in .claude/skills and .github/workflows are denied with D8` (new)
- red: mutant M06 (zone prefixes widened to `.claude/skills/` and `.github/workflows/`, `.fork/ci/lib/principle-v.mjs:5-6`), `node --test --test-name-pattern="^U37 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U37 D6 zones are narrow ...` / `actual: true` / `expected: false` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 200 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 2 / M06

## Cycle: U38 D8 names the outermost upstream folder

- test: `.fork/ci/test/principle-v.test.mjs::U38 D8 names the outermost upstream folder when several enclose the path` (new)
- red: mutant M10 (D8 picks the innermost enclosing folder: `.find(Boolean)` -> `.findLast(Boolean)`, `.fork/ci/lib/principle-v.mjs:49`), `node --test --test-name-pattern="^U38 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U38 D8 names the outermost upstream folder ...` / `actual: false` / `expected: true` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 201 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 3 / M10
