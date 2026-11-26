# Cycle Log: Lean self-hosted Supabase for Open Brain

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

The code lives on `contrib/mfelker/self-hosted-supabase` (worktree `.worktrees/contrib-self-hosted-supabase`), which never carries `specs/` (constitution Principle V). This log lives on fork `main`.

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` → `tdd: worktree not found: /Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-supabase`. Empty baseline: the worktree and `recipes/self-hosted-supabase-mcp/` don't exist yet (task T001), so there are 0 tests.
- commit: `e86a3d4` (fork `main`); upstream `238df6c`
- recorded: cycle 0, before any change
