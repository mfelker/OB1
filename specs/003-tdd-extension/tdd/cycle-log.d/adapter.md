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

## Cycle: U3 neither env nor feature.json gives "no active feature"

- test: `.fork/ci/test/tdd-target.test.mjs::U3 neither env nor feature.json gives "no active feature"` (new)
- red: `node --test --test-name-pattern="^U3 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: expected TargetError, got Error: ENOENT: no such file or directory, open '…/.specify/feature.json'` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:27` throws `TargetError(NO_FEATURE)` when neither source gives a directory; `:16` `featureJsonDir` returns undefined for a missing or unreadable file. Suite `node --test .fork/ci/test/` -> 104 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U4 lane grammar: fork, upstream-bound, staged; placeholder and unknown are errors

- test: `.fork/ci/test/tdd-target.test.mjs::U4 lane grammar: fork, upstream-bound, staged; placeholder and unknown are errors` (new; written by the previous session, red re-observed here)
- red: `node --test --test-name-pattern="^U4 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` / `expected: 'fork',` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:25` `planField()` reads the text after the first `:` of a `**<field>**` line, `*(…)*` annotations removed; `:34` `parseLane()` maps the prefix to `staged` / `upstream-bound` / `fork` and throws on a missing line, `[` placeholder or unknown value; `:52` a missing plan is `plan not found`. Suite `node --test .fork/ci/test/` -> 105 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U5 a backticked absolute Worktree path becomes tree

- test: `.fork/ci/test/tdd-target.test.mjs::U5 a backticked absolute Worktree path becomes tree` (new; real `git init` + `git worktree add` via the `addWorktree` helper)
- red: `node --test --test-name-pattern="^U5 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` / `expected: '/private/var/folders/…/fork-tdd-wt-bfei5G/wt',` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:43` `parseTree()` takes the first backticked token of the Worktree value; `:61` sets `tree`. Suite `node --test .fork/ci/test/` -> 106 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U6 Worktree none… gives repoRoot

- test: `.fork/ci/test/tdd-target.test.mjs::U6 Worktree none… gives repoRoot` (new; cases "none (fork-`main` checkout)", "None", "NONE: runs in `.`")
- red: `node --test --test-name-pattern="^U6 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: none (fork-\`main\` checkout)` / `actual: 'main',` / `expected: '/private/var/folders/…/fork-tdd-target-pOb3J4',` (1 failed). The backtick rule picked up `main` from the annotation.
- green: `.fork/ci/lib/tdd-target.mjs:44` a value starting `none` (case-insensitive) returns `repoRoot` before the backtick rule. Suite `node --test .fork/ci/test/` -> 107 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U7 a Worktree placeholder or a non-absolute token is an error

- test: `.fork/ci/test/tdd-target.test.mjs::U7 a Worktree placeholder or a non-absolute token is an error` (new; includes the plan template's literal Worktree line with its `*(upstream-bound / staged)*` annotation)
- red: `node --test --test-name-pattern="^U7 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Missing expected exception.` / `actual: undefined,` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:44` a `[` in the value throws `plan Worktree is a placeholder (<plan>)` (checked first, R3 rule 1); `:47` no backticked token, or a non-absolute one, throws `plan Worktree must be an absolute path or "none"`. Suite `node --test .fork/ci/test/` -> 108 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U8 a missing Worktree line gives repoRoot for fork; staged and upstream-bound get an error

- test: `.fork/ci/test/tdd-target.test.mjs::U8 a missing Worktree line gives repoRoot for fork; staged and upstream-bound get an error` (new)
- red: `node --test --test-name-pattern="^U8 " .fork/ci/test/tdd-target.test.mjs`
  -> `Error [TargetError]: plan Worktree must be an absolute path or "none"` (1 failed). The missing line fell through to the absolute-path rule.
- green: `.fork/ci/lib/tdd-target.mjs:44` a missing Worktree line returns `repoRoot` for lane `fork`, else throws `plan Worktree required for <lane> lane` (FR-007). Suite `node --test .fork/ci/test/` -> 109 passed, 0 failed
- refactor: none needed
- commit: (this commit)
