# Cycle Log: Self-hosted LLM backend for Open Brain

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

During the parallel streams, each stream writes its cycles to `tdd/cycle-log.d/<stream>.md` in this checkout (fork `main`). The integrator appends them here in merge order (T041). The code lives on `contrib/mfelker/self-hosted-llm`, which never carries `specs/` (constitution Principle V).

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` -> `[tdd] suite feature=specs/004-self-hosted-llm folder=integrations/self-hosted-llm-mcp → empty baseline: folder does not exist yet` (0 tests). Target: plan Worktree `.worktrees/contrib-self-hosted-llm` at upstream `238df6c`.
- commit: `974ca30` (fork `main`); worktree `238df6c` (`upstream/main`)
- recorded: cycle 0, before any change

## Setup (T003–T005): scaffold, seams, harness

- `a5bbcb2` scaffold (`metadata.json` validated against `.github/metadata.schema.json`, README skeleton, `deno.json`); `89385a8` seams (`lib/types.ts`, throwing stubs, one-line `index.ts`; `deno check` clean); `f2d9213` harness (`tests/helpers/*`).
- Harness self-test: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` -> `ok | 9 passed | 0 failed` (H1–H9: MCP over `app.fetch`, in-memory client, supabase-js via injected fetch, hang/hold/abort, fake-store merge, insert-only timestamp equality, R6 delete filter). `--filter "/^H4 /"` -> `1 passed | 0 failed | 8 filtered out`. Adapter: `node .fork/ci/bin/tdd.mjs suite` -> `tests=9 pass=9 fail=0 → pass`.
- No behavior ids: structural setup, not cycles.

## Outer loop opened: A1–A24 written first as `todo` (T006)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A1`–`A24` (new), each `todo(name, fn)` (`Deno.test` ignored unless `RUN_TODO=1`), driving `createApp(deps).fetch(Request)` with only `modelFetch` (FakeFetch) and `store` (FakeStore) faked. Written by a Sonnet agent from the test list and contracts; reviewed and run by the integrator.
- red: `RUN_TODO=1 deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/acceptance_test.ts`
  -> `FAILED | 0 passed | 24 failed`; every one `error: Error: not implemented` `at createApp (…/lib/app.ts:4:9)` (24 of 24).
- green: not yet. Stream A flips each `todo` to `Deno.test` in the commit that makes it pass (T024, T035, T038).
- suite: `deno test … tests/` -> `ok | 9 passed | 0 failed | 24 ignored`
- commit: `99577b2` (`contrib/mfelker/self-hosted-llm`)
