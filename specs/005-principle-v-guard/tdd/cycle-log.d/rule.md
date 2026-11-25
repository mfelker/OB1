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

## Cycle: U3 D3: merge in progress is allowed

- test: `.fork/ci/test/principle-v.test.mjs::U3 D3: mergeInProgress on main is allowed` (new)
- red: `node --test --test-name-pattern="^U3 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:6` added the D3 return when `mergeInProgress`. Suite `node --test .fork/ci/test/` -> 155 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U4 D9: a new top-level path upstream does not have is allowed

- test: `.fork/ci/test/principle-v.test.mjs::U4 D9: a new top-level path upstream does not have is allowed` (new)
- red: `node --test --test-name-pattern="^U4 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:8` replaced the stub deny with the D9 fallthrough allow (`allow('D9')`). Suite `node --test .fork/ci/test/` -> 156 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U5 D4: a file that exists upstream is denied

- test: `.fork/ci/test/principle-v.test.mjs::U5 D4: a file that exists upstream is denied` (new)
- red: `node --test --test-name-pattern="^U5 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: actual: true, expected: false` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:9` added the D4 deny when `upstream.files` has `relPath`, via a `deny(rule)` helper whose `reason` and `suggestion` are empty until U10/U11. Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed
- refactor: none needed
- commit: (this commit)
