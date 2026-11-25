# Cycle Log: calibration fixture (staged lane, PR #532)

Append only. Newest last. Staged lane: the code under test already exists at the PR head, so each red below is the fork override's base-red procedure (`.specify/templates/overrides/tdd-loop-playbook.md`, fork section), run for real on 2026-11-25 against the worktree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default` (branch `stage/pr-532-atomizer-default`, head `58b0567`). The PR's source change is `8bebd77`; its tests landed in `cfbfe76`.

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` -> `tests=12 pass=12 fail=0 → pass` (at the PR head)
- commit: `58b0567`
- recorded: cycle 0. The PR's base is `238df6c` (`git merge-base HEAD upstream/main`).

## Cycle 1: U1 C1 anthropic default model is claude-sonnet-5-5

- test: `recipes/atomizer/atomize-text.test.mjs::C1 anthropic default model is claude-sonnet-5-5` (exists at head, `cfbfe76`)
- red (base-red): `BASE=$(git merge-base HEAD upstream/main)` = `238df6c`; `git checkout "$BASE" -- recipes/atomizer/lib/atomize-text.mjs`; `node .fork/ci/bin/tdd.mjs single recipes/atomizer/atomize-text.test.mjs "C1 anthropic default model is claude-sonnet-5-5"`
  -> `actual: 'claude-sonnet-4-5',` / `expected: 'claude-sonnet-5-5',`; `tests=1 pass=0 fail=1 → fail` (exit 1). The failure is the missing behavior: the base default model.
- restore: `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs`; `git status --short --untracked-files=no` empty.
- green: same command at head -> `tests=1 pass=1 fail=0 → pass`. The implementation is the PR's `8bebd77`.
- refactor: not applicable (staged lane: the PR's code is not refactored in the fork)
- commit: none (the test is the PR's `cfbfe76`; a base checkout is never committed)

## Cycle 2: U2 K4 anthropic CLI with key requests the default model (stubbed)

- test: `recipes/atomizer/atomize-text.test.mjs::K4 anthropic CLI with key requests the default model (stubbed)` (exists at head, `cfbfe76`)
- red (base-red): base `238df6c`; `git checkout "$BASE" -- recipes/atomizer/lib/atomize-text.mjs`; `node .fork/ci/bin/tdd.mjs single recipes/atomizer/atomize-text.test.mjs "K4 anthropic CLI with key requests the default model (stubbed)"`
  -> `The input did not match the regular expression /\[fetch-stub\] api\.anthropic\.com model=claude-sonnet-5-5/` / `actual: '[fetch-stub] api.anthropic.com model=claude-sonnet-4-5\n'`; `tests=1 pass=0 fail=1 → fail` (exit 1).
- restore: `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs`; `git status --short --untracked-files=no` empty.
- green: same command at head -> `tests=1 pass=1 fail=0 → pass`.
- refactor: not applicable
- commit: none (the test is the PR's `cfbfe76`)

## Cycle 3: U3 C3 openrouter default model is unchanged

- test: `recipes/atomizer/atomize-text.test.mjs::C3 openrouter default model is unchanged` (exists at head, `cfbfe76`)
- red: **none recorded, deliberately.** This is the calibration control: a head green with no base-red, which the override says is audited as `TEST_AFTER` (fail closed).
- green: `node .fork/ci/bin/tdd.mjs single recipes/atomizer/atomize-text.test.mjs "C3 openrouter default model is unchanged"` -> `tests=1 pass=1 fail=0 → pass` at head.
- refactor: not applicable
- commit: none

## Correction: Cycle 3 (U3, C3) is the S4 control, not an S2 control

C3's code (the OpenRouter default at `recipes/atomizer/lib/atomize-text.mjs:254`) is unchanged between the base `238df6c` and the head, so C3 also passes at the base and can never carry a base-red. The T031 audit classed it S4 → `NOT_APPLICABLE`, which is correct. U3 is now recorded as `characterization` / `BASELINE`, and the S2 control is K2 below. The rubric override now states that S4 takes precedence over S2 (spec 003 U38).

## Cycle 4: U4 K2 anthropic CLI without a key skips with exit 0

- test: `recipes/atomizer/atomize-text.test.mjs::K2 anthropic CLI without a key skips with exit 0` (exists at head, `cfbfe76`)
- red: **none recorded, deliberately.** This is the S2 calibration control: its code (`recipes/atomizer/test-atomize.mjs`, changed by `58b0567`) differs between the base and the head, and only a head green is recorded, so the override must class it `TEST_AFTER` (fail closed).
- green: `SPECIFY_FEATURE_DIRECTORY=specs/003-tdd-extension/calibration/staged-fixture node .fork/ci/bin/tdd.mjs single recipes/atomizer/atomize-text.test.mjs "K2 anthropic CLI without a key skips with exit 0"` -> `tests=1 pass=1 fail=0 → pass` at head.
- refactor: not applicable
- commit: none
