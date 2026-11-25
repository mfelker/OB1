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
