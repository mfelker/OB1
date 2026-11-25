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
- green: `.fork/ci/lib/principle-v.mjs:8` added the D4 deny when `upstream.files` has `relPath`, via a `deny(rule)` helper whose `reason` and `suggestion` are empty until U10/U11. Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U6 D8: a new file inside an upstream folder is denied

- test: `.fork/ci/test/principle-v.test.mjs::U6 D8: a new file inside an upstream folder is denied; a sibling top-level path is not` (new)
- red: `node --test --test-name-pattern="^U6 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: docs/x.md` with `actual: true, expected: false` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:5` added an `ancestors()` helper and (`:15`) the D8 deny when any ancestor folder is in `upstream.dirs`. Suite `node --test .fork/ci/test/` -> 158 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U7 D7: upstream unknown denies a non-fork path

- test: `.fork/ci/test/principle-v.test.mjs::U7 D7: with upstream null, a non-fork path is denied` (new)
- red: `node --test --test-name-pattern="^U7 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: actual: true, expected: false` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:15` added the D7 deny when `upstream === null`, before D8. Suite `node --test .fork/ci/test/` -> 159 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U8 D5: fork-only roots are allowed

- test: `.fork/ci/test/principle-v.test.mjs::U8 D5: each fork-only root is allowed, even with upstream null; .forkx is not a root` (new)
- red: `node --test --test-name-pattern="^U8 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/ci/x.mjs` with `actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:17` added the D5 allow when the first segment is in `FORK_ROOTS`, after D4 and before D7. Suite `node --test .fork/ci/test/` -> 160 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U9 D6: fork-only zones are allowed

- test: `.fork/ci/test/principle-v.test.mjs::U9 D6: fork-only zones are allowed inside upstream folders; look-alikes and upstream files in a zone are denied` (new)
- red: `node --test --test-name-pattern="^U9 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .claude/settings.json` with `actual: false, expected: true` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:23` added the D6 allow via `isForkZone()` after D5 and before D7 (so D4 still wins for an upstream file in a zone, and `upstream: null` still allows zones). Suite `node --test .fork/ci/test/` -> 161 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U10 deny reasons match the contract

- test: `.fork/ci/test/principle-v.test.mjs::U10 messages: D4, D8 and D7 reasons match the contract` (new)
- red: `node --test --test-name-pattern="^U10 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: ... actual: '', expected: 'CLAUDE.md: constitution Principle V reserves this path for upstream (file exists in upstream/main).'` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:9` `deny(rule, relPath, why)` now builds the contract reason; D4, D7 and D8 (`:26`, `:29`, `:30-31`) pass their `why`, D8 naming the outermost matching upstream folder. Suite `node --test .fork/ci/test/` -> 162 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U11 deny suggestions match the contract

- test: `.fork/ci/test/principle-v.test.mjs::U11 messages: suggestion names .fork/domain-knowledge/ under docs/domain_knowledge/, else the upstream-bound text` (new)
- red: `node --test --test-name-pattern="^U11 " .fork/ci/test/principle-v.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: ... actual: '', expected: 'Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md).'` (1 failed)
- green: `.fork/ci/lib/principle-v.mjs:18` `deny()` now picks `KNOWLEDGE_SUGGESTION` for `docs/domain_knowledge/` paths and `UPSTREAM_BOUND_SUGGESTION` otherwise. Suite `node --test .fork/ci/test/` -> 163 passed, 0 failed
- refactor: none needed
- commit: (this commit)
