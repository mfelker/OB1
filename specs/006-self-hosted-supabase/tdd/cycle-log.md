# Cycle Log: Lean self-hosted Supabase for Open Brain

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

The code lives on `contrib/mfelker/self-hosted-supabase` (worktree `.worktrees/contrib-self-hosted-supabase`), which never carries `specs/` (constitution Principle V). This log lives on fork `main`.

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` → `tdd: worktree not found: /Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-supabase`. Empty baseline: the worktree and `recipes/self-hosted-supabase-mcp/` don't exist yet (task T001), so there are 0 tests.
- commit: `e86a3d4` (fork `main`); upstream `238df6c`
- recorded: cycle 0, before any change

## Setup (T001–T004): worktree, scaffold, harness, fixture

- T001: `git worktree add .worktrees/contrib-self-hosted-supabase -b contrib/mfelker/self-hosted-supabase upstream/main` (`238df6c`), then `git merge --no-ff contrib/mfelker/self-hosted-llm` → merge commit `062b573`. `tdd.mjs where` → `tree=…/contrib-self-hosted-supabase folder=recipes/self-hosted-supabase-mcp`.
- T002–T004: `metadata.json` (validated against `.github/metadata.schema.json`), README skeleton, `.gitignore` (`supabase/`); `tests/helpers/harness.mjs` (temporary git checkout, restricted `PATH`, stub `git` and `docker`, stand-in clone with a stub `generate-keys.sh`); `tests/fixtures/compose/docker-compose.yml` (11 service names and `v0.8.5`'s dependency links, `busybox` images).
- Harness self-test H1–H3 (`tests/harness.test.mjs`): the first run failed H1 because the harness's own files showed in the temporary repo's `git status`. Fixed by excluding them in `.git/info/exclude` (a harness bug, not a cycle). Then `node .fork/ci/bin/tdd.mjs suite` → `tests=3 pass=3 fail=0 → pass`.
- **Baseline for the loop: green, 3 tests (H1–H3).**
- commit: `69a087f` (`contrib/mfelker/self-hosted-supabase`)
- No behavior ids: structural setup, not cycles.
