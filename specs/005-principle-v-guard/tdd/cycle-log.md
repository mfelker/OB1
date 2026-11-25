# Cycle Log: Principle V guard for the fork-main checkout

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

During the parallel streams, cycles are written first to `tdd/cycle-log.d/<stream>.md` in each stream worktree, then appended here in merge order by the integrator.

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` -> `tests=152 pass=152 fail=0 → sql-unverified` (target: plan Worktree `.worktrees/fork-principle-v-guard`, folder `.fork/ci`, whose `.fork/ci` matches fork `main`)
- commit: `92977db` (fork `main`)
- recorded: cycle 0, before any change

## Outer loop opened: A1–A9 written first as `todo` (T029)

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A1`–`A9` (new), each `test(name, { todo }, fn)` so its failure is recorded without failing the suite. A1–A5 run the `PreToolUse` command string read from `.claude/settings.json` with `sh -c` and `CLAUDE_PROJECT_DIR` set to a temp repo with an `upstream/main` ref; A6–A9 run a real `git commit` through a copy of `.fork/githooks/`.
- red (wiring absent, as committed): `node --test .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> A1–A5 `AssertionError [ERR_ASSERTION]: .claude/settings.json does not exist yet`; A6–A9 `AssertionError [ERR_ASSERTION]: .fork/githooks/pre-commit does not exist yet` (`ℹ todo 9`, `ℹ fail 0`).
- red (behavior absent): the same run with the contract's wiring placed temporarily (contracts/guards.md "Wiring": the settings command and the `pre-commit` script, then removed again because stream W owns them)
  -> A1–A5 `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: … Cannot find module '…/.fork/ci/bin/principle-v-guard.mjs'` / `actual: 1`; A6 `The input did not match the regular expression /principle-v-guard: commit refused \(constitution Principle V\)/` (stderr was the module-not-found error); A7–A9 commit `actual: 1` (the hook could not run). TAP: `not ok 1`…`not ok 9 # TODO`.
- green: not yet. Stream G flips each `todo` to `test` in the commit that makes it pass (T012, T015); A10–A11 are opened by stream W.
- suite: `node --test .fork/ci/test/` -> 161 tests, 152 passed, 0 failed, 9 todo
- commit: (this commit)

<!-- stream rule (merged T019/T020) -->

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

<!-- stream paths (merged T019/T020) -->

## Cycle: U12 repoRelative: relative, absolute and .. forms agree

- test: `.fork/ci/test/principle-v-paths.test.mjs::U12 repoRelative: relative, absolute and .. forms agree` (new)
- red: `node --test --test-name-pattern="^U12 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: null, expected: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:14` repoRelative takes root from `git rev-parse --show-toplevel` of cwd and returns the POSIX path relative to it. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U13 repoRelative: root is the git top-level of the path's own checkout

- test: `.fork/ci/test/principle-v-paths.test.mjs::U13 repoRelative: root is the git top-level of the path's own checkout` (new)
- red: `node --test --test-name-pattern="^U13 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `+ relPath: '../fork-ci-wt-fFPALK/wt/docs/a.md'` vs expected `relPath: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:13-14` root now comes from `git rev-parse --show-toplevel` run in the path's own directory (`dirname` of the resolved path), not `cwd`. Suite `node --test .fork/ci/test/` -> 154 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U14 repoRelative: a path through a symlinked directory matches the real path

- test: `.fork/ci/test/principle-v-paths.test.mjs::U14 repoRelative: a path through a symlinked directory matches the real path` (new)
- red: `node --test --test-name-pattern="^U14 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `+ relPath: '../fork-ci-cmfpdr/viaLink/a.md'` vs expected `relPath: 'docs/a.md'` (1 failed)
- green: `.fork/ci/lib/principle-v-paths.mjs:15-16` the resolved path's directory goes through `realpathSync` before the root and relative path are computed. Suite `node --test .fork/ci/test/` -> 155 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U15 repoRelative: a file not yet created resolves through its nearest existing ancestor

- test: `.fork/ci/test/principle-v-paths.test.mjs::U15 repoRelative: a file not yet created resolves through its nearest existing ancestor` (new)
- red: `node --test --test-name-pattern="^U15 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `Error: ENOENT: no such file or directory, lstat '<tmp>/fork-ci-ePcXfR/docs/new'` (1 failed; the call throws instead of returning the path)
- green: `.fork/ci/lib/principle-v-paths.mjs:15-24` walk up to the nearest existing ancestor, realpath it, append the missing tail; git root is read from that directory. Suite `node --test .fork/ci/test/` -> 156 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U16 repoRelative: outside every checkout, or the root itself, gives relPath null

- test: `.fork/ci/test/principle-v-paths.test.mjs::U16 repoRelative: outside every checkout, or the root itself, gives relPath null` (new)
- red: `node --test --test-name-pattern="^U16 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `fatal: not a git repository (or any of the parent directories): .git` (1 failed; the call throws instead of returning `relPath: null`)
- green: `.fork/ci/lib/principle-v-paths.mjs:26-33` a failing `git rev-parse` returns `{ root: null, relPath: null }`; an empty relative path (the root itself) becomes `null`. Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed
- refactor: dropped an unneeded outside-the-root branch before committing (realpath of both sides makes it unreachable)
- commit: (this commit)

## Cycle: U17 checkoutState: branch is the branch name, or HEAD when detached

- test: `.fork/ci/test/principle-v-paths.test.mjs::U17 checkoutState: branch is the branch name, or HEAD when detached` (new)
- red: `node --test --test-name-pattern="^U17 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: null, expected: 'main'` (1 failed; `checkoutState` was an exported stub)
- green: `.fork/ci/lib/principle-v-paths.mjs:41-48` branch from `git symbolic-ref --short -q HEAD`, `HEAD` when that fails (detached). Suite `node --test .fork/ci/test/` -> 158 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U18 checkoutState: mergeInProgress is true while MERGE_HEAD exists

- test: `.fork/ci/test/principle-v-paths.test.mjs::U18 checkoutState: mergeInProgress is true while MERGE_HEAD exists` (new)
- red: `node --test --test-name-pattern="^U18 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `actual: false, expected: true` (1 failed; the stub-era `mergeInProgress: false` was hard-coded)
- green: `.fork/ci/lib/principle-v-paths.mjs:49-54` `git rev-parse -q --verify MERGE_HEAD` succeeds only mid-merge. Suite `node --test .fork/ci/test/` -> 159 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U19 checkoutState: throws GuardError for a directory that is not a git work tree

- test: `.fork/ci/test/principle-v-paths.test.mjs::U19 checkoutState: throws GuardError for a directory that is not a git work tree` (new)
- red: `node --test --test-name-pattern="^U19 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Missing expected exception.` (1 failed; `GuardError` was an exported stub class)
- green: `.fork/ci/lib/principle-v-paths.mjs:33-47` `GuardError` sets its name; `checkoutState` first requires `git rev-parse --is-inside-work-tree` to print `true`, else throws `GuardError`. Suite `node --test .fork/ci/test/` -> 160 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U20 upstreamPaths: files from upstream/main, dirs hold every proper ancestor

- test: `.fork/ci/test/principle-v-paths.test.mjs::U20 upstreamPaths: files from upstream/main, dirs hold every proper ancestor` (new)
- red: `node --test --test-name-pattern="^U20 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: null` (1 failed; `upstreamPaths` was an exported stub returning null)
- green: `.fork/ci/lib/principle-v-paths.mjs:62-75` `git ls-tree -r -z --name-only upstream/main` split on NUL into `files`; every proper ancestor of every file added to `dirs`. The first green attempt failed on a wrong expected list in my own uncommitted test (listed a file the fixture never creates); corrected the expectation, not the behavior. Suite `node --test .fork/ci/test/` -> 161 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U21 upstreamPaths: null when upstream/main does not exist

- test: `.fork/ci/test/principle-v-paths.test.mjs::U21 upstreamPaths: null when upstream/main does not exist` (new)
- red: `node --test --test-name-pattern="^U21 " .fork/ci/test/principle-v-paths.test.mjs`
  -> `fatal: Not a valid object name upstream/main` (1 failed; the call throws instead of returning null)
- green: `.fork/ci/lib/principle-v-paths.mjs:63-71` a failing `git ls-tree` returns `null`. Suite `node --test .fork/ci/test/` -> 162 passed, 0 failed
- refactor: none needed
- commit: (this commit)

<!-- stream wiring (merged T019/T020) -->

## Cycle: U28 `.claude/settings.json` registers the PreToolUse guard

- test: `.fork/ci/test/principle-v-docs.test.mjs::U28 .claude/settings.json registers the PreToolUse guard` (new)
- red: `node --test --test-name-pattern="^U28 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .claude/settings.json does not exist` (1 failed)
- green: `.claude/settings.json` created with the single PreToolUse entry. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U29 the pre-commit hook is executable sh and execs the staged guard

- test: `.fork/ci/test/principle-v-docs.test.mjs::U29 .fork/githooks/pre-commit is an executable sh script that execs the staged guard` (new)
- red: `node --test --test-name-pattern="^U29 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/githooks/pre-commit does not exist` (1 failed)
- green: `.fork/githooks/pre-commit` created (`#!/bin/sh`, `exec node ... --staged`, chmod +x). Suite `node --test .fork/ci/test/` -> 154 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U30 self-test trigger covers the guard wiring

- test: `.fork/ci/test/self-test-needed.test.mjs::U30 true for .fork/githooks/ paths and .claude/settings.json, not look-alikes` (new)
- red: `node --test --test-name-pattern="^U30 " .fork/ci/test/self-test-needed.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/githooks/pre-commit` / `false !== true` (1 failed)
- green: `.fork/ci/lib/self-test-needed.mjs` added the `.fork/githooks/` prefix and `.claude/settings.json` exact path. Suite `node --test .fork/ci/test/` -> 155 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: A10 runbook names .fork/domain-knowledge/ as the grill knowledge root

- test: `.fork/ci/test/principle-v-docs.test.mjs::A10 .fork/README.md names .fork/domain-knowledge/ as the grill knowledge root with its layout` (new)
- red: `node --test --test-name-pattern="^A10 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: a "## Domain knowledge" section is required in .fork/README.md` (1 failed)
- green: `.fork/README.md` new "Domain knowledge" section (root, `CONTEXT.md`, topic documents, `adr/`). Suite `node --test .fork/ci/test/` -> 156 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: A11 runbook documents both guards, the merge exception, --no-verify and the enable command

- test: `.fork/ci/test/principle-v-docs.test.mjs::A11 .fork/README.md has a Principle V guard section covering both guards and how to enable them` (new)
- red: `node --test --test-name-pattern="^A11 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: a "## Principle V guard" section is required in .fork/README.md` (1 failed)
- green: `.fork/README.md` new "Principle V guard" section (both guards, refused/allowed, merge exception, `--no-verify`, `git config core.hooksPath .fork/githooks`). Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## T018 document principle-v-guard CLI

- docs only, no behavior: `.fork/ci/README.md` gained a "Principle V guard" section (`--hook`, `--staged`, exit codes, fail-closed) and the Layout rows. Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed; markdownlint 0 issues.
- commit: (this commit)
