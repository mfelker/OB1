# Cycle Log: Self-hosted LLM backend for Open Brain

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

During the parallel streams, each stream writes its cycles to `tdd/cycle-log.d/<stream>.md` in this checkout (fork `main`). The integrator appends them here in merge order (T041). The code lives on `contrib/mfelker/self-hosted-llm`, which never carries `specs/` (constitution Principle V).

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` -> `[tdd] suite feature=specs/004-self-hosted-llm folder=integrations/self-hosted-llm-mcp → empty baseline: folder does not exist yet` (0 tests). Target: plan Worktree `.worktrees/contrib-self-hosted-llm` at upstream `238df6c`.
- commit: `974ca30` (fork `main`); worktree `238df6c` (`upstream/main`)
- recorded: cycle 0, before any change
