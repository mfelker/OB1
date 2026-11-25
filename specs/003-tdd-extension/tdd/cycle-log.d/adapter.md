## Cycle: U1 SPECIFY_FEATURE_DIRECTORY wins over feature.json

- test: `.fork/ci/test/tdd-target.test.mjs::U1 SPECIFY_FEATURE_DIRECTORY wins over feature.json` (new)
- red: `node --test --test-name-pattern="^U1 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` (1 failed). The module existed only as an empty `resolveTarget` stub plus `TargetError`, so the import resolved.
- green: `.fork/ci/lib/tdd-target.mjs:14` `featureDir` resolved from `SPECIFY_FEATURE_DIRECTORY` against `repoRoot`. Suite `node --test .fork/ci/test/` -> 102 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U2 feature.json feature_directory is used when there is no env

- test: `.fork/ci/test/tdd-target.test.mjs::U2 feature.json feature_directory is used when there is no env` (new)
- red: `node --test --test-name-pattern="^U2 " .fork/ci/test/tdd-target.test.mjs`
  -> `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[1]" argument must be of type string. Received undefined` (1 failed). The resolver had no feature.json path, so it passed the missing env value to `path.resolve`.
- green: `.fork/ci/lib/tdd-target.mjs:13` `featureJsonDir()` reads `.specify/feature.json`; `:19` uses it when the env is unset or empty. Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed
- commit: (this commit)
