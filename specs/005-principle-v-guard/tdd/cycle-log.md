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

<!-- stream guard (merged T020) -->

<!-- stream guard (G) -->

## Cycle: A1 agent guard refuses an upstream file

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A1 agent guard refuses a Write to a file that exists upstream, naming Principle V and the upstream-bound route` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); re-run with the `todo` option removed and no CLI: `node --test --test-name-pattern="^A1 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: node:internal/modules/cjs/loader … Cannot find module '…/.fork/ci/bin/principle-v-guard.mjs'` / `actual: 1` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:1-27` new CLI: reads the PreToolUse JSON from stdin, loads both libs with dynamic `import()` inside the top-level `try`, resolves `repoRelative` -> `checkoutState` -> `upstreamPaths` -> `decide`, prints the deny JSON (smallest version: every decision prints a deny; any exception prints a `principle-v-guard failed:` deny). Suite `node --test .fork/ci/test/` -> 179 passed, 0 failed, 8 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A3 agent guard allows every fork-only root and zone

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A3 agent guard allows every fork-only root and zone` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); run before this commit's change: `node --test --test-name-pattern="^A3 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/notes.md: an allowed write prints no decision` / `actual: '{"hookSpecificOutput":{…"permissionDecisionReason":"undefined undefined"}}\n', expected: ''` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:22` print the deny only when `!d.allowed`; allowed prints nothing. Suite `node --test .fork/ci/test/` -> 180 passed, 0 failed, 7 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A2 --hook points domain_knowledge writes to .fork/domain-knowledge/

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A2 agent guard refuses docs/domain_knowledge/CONTEXT.md and points to .fork/domain-knowledge/` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A2 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: the D4 deny carries the domain-knowledge suggestion from decide()). Suite `node --test .fork/ci/test/` -> 181 passed, 0 failed, 6 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A4 --hook allows a linked worktree write

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A4 agent guard allows an upstream path in a linked worktree on another branch, from a main-checkout session` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A4 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: repoRelative/checkoutState read the worktree's own root and branch (D2)). Suite `node --test .fork/ci/test/` -> 182 passed, 0 failed, 5 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A5 --hook allows an upstream file during a merge

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A5 agent guard allows editing an upstream file while a merge is in progress on main` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A5 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: checkoutState reports MERGE_HEAD (D3)). Suite `node --test .fork/ci/test/` -> 183 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U22 --hook reads notebook_path and resolves a relative path against cwd

- test: `.fork/ci/test/principle-v-guard.test.mjs::U22 --hook reads tool_input.notebook_path when there is no file_path, resolving a relative path against the input cwd` (new)
- red: `node --test --test-name-pattern="^U22 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^CLAUDE\.md: constitution Principle V/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:17` target is `tool_input.file_path ?? tool_input.notebook_path`; `repoRelative` already resolves a relative path against the input `cwd`. Suite `node --test .fork/ci/test/` -> 184 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U23 --hook fails closed on unparseable stdin

- test: `.fork/ci/test/principle-v-guard.test.mjs::U23 --hook with unparseable stdin prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U23 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /The write was refused; fix the guard or run it by hand: node \.fork\/ci\/bin\/principle-v-guard\.mjs --hook/` with ``actual: `principle-v-guard failed: Unexpected token 'o', "not json" is not valid JSON` `` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` the catch appends the contract's `The write was refused; fix the guard or run it by hand: ...` text (`REFUSED`); the prefix, deny shape and exit 0 already came from the top-level `try`/`catch`. Suite `node --test .fork/ci/test/` -> 185 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U24 --hook fails closed when a matched tool has no target path

- test: `.fork/ci/test/principle-v-guard.test.mjs::U24 --hook for a matched tool with no target path prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U24 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /no target path/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined. The write was refused; …'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:19-20` a missing or empty target throws `no target path in tool_input (file_path or notebook_path)`, which the catch turns into the deny; `tool_input?.` tolerates a missing object. Suite `node --test .fork/ci/test/` -> 186 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U25 --hook fails closed when the rule library fails to load

- test: `.fork/ci/test/principle-v-guard.test.mjs::U25 --hook whose rule library fails to load prints the principle-v-guard failed deny and exits 0` (new; the fixture is a temp copy of `.fork/ci/{bin,lib}` whose `lib/principle-v.mjs` is replaced by `export const decide = ;`)
- red: not observed. The test passed on its first run because the A1 cycle already loads both libs with dynamic `import()` inside the top-level `try` (a design choice made up front from contracts/guards.md). Deviation: no invented red; a deliberate mutant check instead.
- mutant check: temporarily added a static `import { decide as _d } from '../lib/principle-v.mjs';` to the CLI. `node --test --test-name-pattern="^U25 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: file:///…/.fork/ci/lib/principle-v.mjs:1` (1 failed: the crash exits non-zero, the fail-open case). Mutant reverted; test then passes.
- green: no CLI change (behavior already present). Suite `node --test .fork/ci/test/` -> 187 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A6 commit guard refuses a commit that stages upstream paths

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A6 commit guard refuses a commit on main that stages upstream paths, listing each with its reason` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); run before this commit's change (CLI treated every mode as `--hook`): `node --test --test-name-pattern="^A6 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: commit must be refused` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` new `staged()` mode (`--staged`): top level from `git rev-parse --show-toplevel`, paths from `git diff --cached --name-only -z --no-renames`, each through the shared `decideFor()`; any deny prints the header, one two-space-indented line per denied path and the `--no-verify` line to stderr and sets exit code 1. Suite `node --test .fork/ci/test/` -> 188 passed, 0 failed, 3 todo
- refactor: extracted `decideFor(root, relPath)` (libs loaded by dynamic `import()`, state, upstream, `decide`) out of the `--hook` path so both modes share it; behavior unchanged (suite stays green).
- note (contract wording): contracts/guards.md says each line is `<relPath>: <reason> <suggestion>`, but `decide()`'s reason already begins `<relPath>: constitution Principle V ...` (contracts/rule.md "Messages"). The line is therefore `<reason> <suggestion>` (indented two spaces), so the path appears once, not twice. A6's patterns (`CLAUDE\.md: .*file exists in upstream\/main`) hold either way.
- commit: (this commit)

## Cycle: A7 --staged allows a fork-only commit

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A7 commit guard allows a commit on main that stages only fork-only paths` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A7 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (no deny lines, so the guard exits 0 silently). Suite `node --test .fork/ci/test/` -> 189 passed, 0 failed, 2 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A8 --staged allows a conflicted merge commit

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A8 commit guard allows committing a conflicted merge that touches upstream files` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A8 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (decideFor reads MERGE_HEAD (D3)). Suite `node --test .fork/ci/test/` -> 190 passed, 0 failed, 1 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A9 --staged allows a commit in a linked worktree

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A9 commit guard allows a commit staging upstream files in a linked worktree on another branch` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A9 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (decideFor reads the worktree's own branch (D2)). Suite `node --test .fork/ci/test/` -> 191 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)

## Cleanup: outer loop closed (A1-A9 all plain tests)

- refactor: deleted the now-unused `OUTER` constant from `.fork/ci/test/principle-v-guard.acceptance.test.mjs` and changed the header comment's tense ("flips" -> "flipped"). No assertion touched. Suite `node --test .fork/ci/test/` -> 191 passed, 0 failed, 0 todo
- commit: (this commit)

## Cycle: U26 --staged lists staged deletions and both sides of a rename

- test: `.fork/ci/test/principle-v-guard.test.mjs::U26 --staged lists staged deletions and both sides of a rename` (new; stages `git rm docs/extra.md` and `git mv CLAUDE.md docs/moved.md`, expects exit 1 with `docs/extra.md` and `CLAUDE.md` as D4 denies and `docs/moved.md` as a D8 deny)
- red: not observed. The test passed on its first run because A6 already built `--staged` on `git diff --cached --name-only -z --no-renames` (research R6). Deviation: no invented red; deliberate mutant checks instead.
- mutant checks: (1) removed `--no-renames` from the diff command: `node --test --test-name-pattern="^U26 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /CLAUDE\.md: .*file exists in upstream\/main/` (1 failed: only the rename's new path is listed). (2) added `--diff-filter=AM`: -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /docs\/extra\.md: .*file exists in upstream\/main/` (1 failed: deletions dropped). Both mutants reverted; test then passes.
- green: no CLI change (behavior already present). Suite `node --test .fork/ci/test/` -> 192 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U27 --staged fails with exit 1 and principle-v-guard failed: on a guard failure

- test: `.fork/ci/test/principle-v-guard.test.mjs::U27 --staged on a guard failure exits 1 with principle-v-guard failed:` (new; a temp copy whose `lib/principle-v.mjs` is broken, one staged file)
- red: `node --test --test-name-pattern="^U27 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^principle-v-guard failed: /` with `actual: "file:///…/.fork/ci/lib/principle-v.mjs:1\nexport const decide = ;\n … SyntaxError: Unexpected token ';'…"` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` `stagedGuarded()` wraps `staged()` and prints `principle-v-guard failed: <message>` to stderr with exit code 1. Suite `node --test .fork/ci/test/` -> 193 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)

## Note: quickstart §2 by hand

Run in a temp repo on `main` with `docs/domain_knowledge/CONTEXT.md` committed and `refs/remotes/upstream/main` at that commit, a copy of `.fork/ci/{bin,lib}`, and an uncommitted `.fork/README.md` (a first attempt that committed `.fork/README.md` as upstream content correctly denied it under D4, so the fixture was corrected). Each exited 0.

1. `... docs/domain_knowledge/CONTEXT.md | node $G --hook` -> `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"docs/domain_knowledge/CONTEXT.md: constitution Principle V reserves this path for upstream (file exists in upstream/main). Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md)."}}`
2. `... .fork/README.md (Edit) | node $G --hook` -> no output.
3. `echo 'not json' | node $G --hook` -> `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"principle-v-guard failed: Unexpected token 'o', \"not json\n\" is not valid JSON. The write was refused; fix the guard or run it by hand: node .fork/ci/bin/principle-v-guard.mjs --hook"}}`

<!-- stream fix (merged after T024 analyze: F1 case bypass, F3, F4) -->

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

## Cycle: U33 --hook denies case variants of upstream paths end to end

- test: `.fork/ci/test/principle-v-guard.test.mjs::U33 --hook denies case variants of upstream paths on a case-insensitive filesystem` (new; `Write` to `claude.md` and `Docs/x.md` in a temp repo whose upstream has `CLAUDE.md` and `docs/`; skips with a reason on a case-sensitive filesystem; the reasons name the on-disk paths `CLAUDE.md` and `docs/x.md`)
- red: first-run pass (U31 + U32 already deliver the behavior). My first draft asserted the given-case name in the reason and failed on that (`actual: 'CLAUDE.md: constitution Principle V reserves ...'`), which was a wrong expectation, not a missing behavior: `repoRelative` now reports the on-disk case. Corrected the assertion before the first passing run; no production change.
- mutants (each run with `node --test --test-name-pattern="^U33 " .fork/ci/test/principle-v-guard.test.mjs`, then restored with `git checkout`):
  - revert `realpathSync.native` only -> 1 failed (`actual: 'claude.md: constitution Principle V ...'`; still denied, because the rule layer catches it, but the on-disk-case reason differs). Each layer alone is sufficient to deny: that is the intended defense in depth.
  - make the rule's D4/D8 match exact-case only -> 0 failed (the path layer already normalises the case; expected for the same reason).
  - both reverted -> 1 failed (the variants are allowed, no deny JSON). This is the mutant that proves the test guards the bypass.
- green: no production change. Suite `node --test .fork/ci/test/` -> 196 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U34 --staged computes the upstream set once per commit

- test: `.fork/ci/test/principle-v-guard.test.mjs::U34 --staged lists upstream/main once per commit, however many paths are staged` (new). Approach: a `git` shim script first on PATH in the spawned guard's environment appends a line to a log for each `ls-tree` call and then execs the real git; three staged `docs/*.md` paths must produce three deny lines and exactly one log line. Chosen over injectable dependencies because it checks the real CLI end to end without changing its shape, and counts a git call rather than time.
- red: `node --test --test-name-pattern="^U34 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: git ls-tree upstream/main ran once` with `actual: 3, expected: 1` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` `decideFor` split into `checkoutContext(root)` (state + upstream sets) and `decideWith(relPath, context)`; `staged()` builds the context once (skipped when nothing is staged) and `hook()` builds it once for its one path. Suite `node --test .fork/ci/test/` -> 197 passed, 0 failed
- refactor: none needed (the split is the change)
- commit: (this commit)

## Cycle: U35 an unknown or missing mode prints usage and exits 1 without reading stdin

- test: `.fork/ci/test/principle-v-guard.test.mjs::U35 an unknown or missing mode prints a one-line usage to stderr, exits 1 and never reads stdin` (new; async `spawn` with stdin left open and never written, 3 s kill timer, so a blocking stdin read shows as `timedOut`; modes: none, `--hok`, `--stage`, `staged`)
- red: `node --test --test-name-pattern="^U35 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: []: blocked reading stdin` with `actual: true, expected: false` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` bottom dispatch: exactly `--staged` and `--hook` run a mode; anything else prints `usage: principle-v-guard.mjs --hook | --staged` to stderr and sets exit code 1. Suite `node --test .fork/ci/test/` -> 198 passed, 0 failed
- refactor: none needed
- commit: (this commit)
