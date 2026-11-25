## Cycle: U1 D1: relPath null is allowed

- test: `.fork/ci/test/principle-v.test.mjs::U1 D1: relPath null is allowed` (new)
- red: `node --test --test-name-pattern="^U1 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:4` added the D1 early return (`allow('D1')`) ahead of the stub deny. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U2 D2: branch other than main is allowed

- test: `.fork/ci/test/principle-v.test.mjs::U2 D2: a branch other than main (or detached HEAD) is allowed; main is not covered by D2` (new)
- red: `node --test --test-name-pattern="^U2 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: feature/x` with `actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:5` added the D2 return when `branch !== 'main'`. Suite `node --test .fork/ci/test/` -> 154 passed, 0 failed
- refactor: none needed
- commit: (this commit)
