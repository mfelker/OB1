# Cycle Log: Adopt the spec-kit-tdd extension for enforced TDD

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

During the parallel streams (research R14), cycles are written first to `tdd/cycle-log.d/<stream>.md`, then appended here in merge order by the integrator.

## Baseline

- suite: `node --test .fork/ci/test/` -> 101 passed, 0 failed (6 s wall)
- commit: `d83711a`
- recorded: cycle 0, before any change. The extension is installed and verified (A1).

## Notes and deviations

- **Profile after list**: the extension makes `.specify/memory/tdd-profile.md` a precondition of planning. This list was written before the profile exists (task T014), because the profile's commands call the adapter this feature builds (research R7). Until T014, cycles run tests with `node --test` directly.
- **Hand-driven loop**: the extension's mandatory `before_implement` hook can't drive its own installation (research R11). These cycles follow `.specify/extensions/tdd/commands/speckit.tdd.run.md` and its playbook by hand.
- **Parallel streams**: cycles from streams A–D ran concurrently in separate worktrees. Their order here is the merge order, not wall-clock order.
