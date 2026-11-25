## Cycle: A13 Principle IV names the cycle log, base-red rule and hook

- test: `.fork/ci/test/tdd-docs.test.mjs::A13 constitution Principle IV names the cycle log, the staged base-red rule and the hook` (new)
- red: `node --test --test-name-pattern="A13" .fork/ci/test/tdd-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Principle IV must name tdd/cycle-log.md as the red evidence` (1 failed)
- green: amended `.specify/memory/constitution.md` to v1.3.0 (Principle IV: cycle log as red evidence for the fork and upstream-bound lanes, staged base-red rule pointing to `.specify/templates/overrides/`, mandatory `before_implement` hook, disabling with `enabled: false` plus a reason in the plan; Gate 1 includes `speckit.tdd.verify` PASS or PASS_WITH_GAPS; fork-ci TDD status advisory; Sync Impact Report entry prepended). The first green attempt still failed on `Principle IV must tie the cycle log to the fork and upstream-bound lanes`; the sentence was reworded (the test was not changed). Suite `node --test .fork/ci/test/` -> 102 passed, 0 failed
- refactor: none needed
- commit: (this commit)
