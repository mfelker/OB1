# Cycle Log: Thought attachments (files linked to thoughts)

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

The code lives on `contrib/mfelker/thought-attachments` (worktree `.worktrees/contrib-thought-attachments`, cut from `upstream/main` by T001), which never carries `specs/` (constitution Principle V). This log lives on fork `main`. Streams write their entries to `tdd/cycle-log.d/<stream>.md`, and the integrator folds them in here in behavior order (T069).

## Local SQL runtime (T004)

Spec 006's T069 recipe, with no bind mount and a fresh copy on every call:

1. Container `ob1-007-pgtest` from `pgvector/pgvector:pg17`, created 2026-11-26 with no bind mount and no restart policy. After a Docker restart, run `docker start ob1-007-pgtest`.
2. Wrapper: `/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin007/psql`. Put it first on `PATH`. On each call it copies `$PWD` into the container at the same path, then runs `psql` there.
3. `.fork/ci/sql/bootstrap.sql` was applied once, which created `anon`, `authenticated` and `service_role` (checked).
4. SQL cycles: `cd <F> && PATH=/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin007:$PATH psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql`.
5. `node .fork/ci/bin/tdd.mjs where` resolves tree `.worktrees/contrib-thought-attachments` and folder `integrations/thought-attachments` (`folderExists: true`).

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` → `tdd: worktree not found: /Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments` (exit 2). This is an empty baseline: the worktree and `integrations/thought-attachments/` don't exist yet (task T001), so 0 tests ran. It is recorded as green under the profile's rule that an empty baseline is green. It is not a pass.
- commit: `9d20be9` (fork `main`); upstream `238df6c` at planning
- recorded: cycle 0, before any change
