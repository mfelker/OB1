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

## Stream logs (folded by the integrator, T041, in merge order: D (docs, no cycles), S, C, M, K, T, A)

### Stream S cycle log

#### Cycle: U68 fetchThought requests core's columns as a single object

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U68 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U68 /" tests/` -> `U68 ... FAILED: Error: not implemented (createSupabaseThoughtStore stub throws)`
- green: `lib/thought_store.ts` createClient with injected fetch, fetchThought select/eq/single; other methods stubbed as rejecting not-implemented. Suite -> 10 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `8591df9`
- notes: other store methods are placeholders that reject until their cycle

#### Cycle: U69 fetchThought returns the row

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U69 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U69 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied by U68 implementation). Suite -> 11 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `6dcb393`
- notes: mutant: content overwritten with "x" -> AssertionError: Values are not equal (1 failed); restored, 1 passed

#### Cycle: U70 fetchThought error mapping

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U70 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U70 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 12 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `930d951`
- notes: mutant: error message replaced by "x" -> AssertionError (1 failed); restored

#### Cycle: U71 matchThoughts RPC contract

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U71 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U71 /" tests/` -> `U71 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` matchThoughts calls rpc(match_thoughts) with query_embedding/match_threshold/match_count/filter {}. Suite -> 13 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9af493c`
- notes: error mapping deliberately deferred to U73

#### Cycle: U72 matchThoughts returns rows / []

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U72 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U72 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 14 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `4c2a39c`
- notes: mutant: rows sliced to first -> AssertionError (1 failed); restored

#### Cycle: U73 matchThoughts RPC error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U73 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U73 /" tests/` -> `U73 ... FAILED: AssertionError: Values are not equal (got { data: null })`
- green: `lib/thought_store.ts` matchThoughts returns { error: error.message }. Suite -> 15 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `57cc342`
- notes: none

#### Cycle: U74 listThoughts unfiltered query

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U74 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U74 /" tests/` -> `U74 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` listThoughts select/order desc/limit. Suite -> 16 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `63be553`
- notes: sort-compared the full decoded param list so any extra filter fails

#### Cycle: U75 listThoughts type filter

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U75 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U75 /" tests/` -> `U75 ... FAILED: AssertionError: Values are not equal (no metadata param)`
- green: `lib/thought_store.ts` q.contains("metadata", { type }) when type given. Suite -> 17 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `f507cc6`
- notes: none

#### Cycle: U76 listThoughts topic filter

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U76 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U76 /" tests/` -> `U76 ... FAILED: AssertionError: Values are not equal (no metadata param)`
- green: `lib/thought_store.ts` q.contains("metadata", { topics: [topic] }) when topic given. Suite -> 18 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2573f28`
- notes: none

#### Cycle: U77 listThoughts person filter

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U77 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U77 /" tests/` -> `U77 ... FAILED: AssertionError: Values are not equal (no metadata param)`
- green: `lib/thought_store.ts` q.contains("metadata", { people: [person] }) when person given. Suite -> 19 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `c98cc1b`
- notes: none

#### Cycle: U78 listThoughts days filter

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U78 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U78 /" tests/` -> `U78 ... FAILED: AssertionError: Values are not equal (no created_at param)`
- green: `lib/thought_store.ts` gte(created_at, now - days via setDate, as core) when days given. Suite -> 20 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `0545352`
- notes: tolerance window: +-2h around now - days*24h (covers DST), no clock injection

#### Cycle: U79 listThoughts rows / error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U79 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U79 /" tests/` -> `U79 ... FAILED: AssertionError: Values are not equal (error case returned { data: null })`
- green: `lib/thought_store.ts` listThoughts maps error to { error: message }. Suite -> 21 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `40e412c`
- notes: none

#### Cycle: U80 stats queries

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U80 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U80 /" tests/` -> `U80 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` stats: head exact count + metadata/created_at rows ordered desc. Suite -> 22 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `4a009d1`
- notes: error mapping deferred to U82

#### Cycle: U81 stats returns count and rows

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U81 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U81 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 23 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `a99818a`
- notes: mutant: count forced to 0 -> AssertionError (1 failed); restored

#### Cycle: U82 stats errors

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U82 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U82 /" tests/` -> `U82 ... FAILED: AssertionError: count failure must be an error`
- green: `lib/thought_store.ts` stats returns { error: message } for count or rows failure. Suite -> 24 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `242d87f`
- notes: second query is sent only after the count succeeds, as in core's sequence

#### Cycle: U83 upsertThought RPC contract

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U83 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U83 /" tests/` -> `U83 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` upsertThought rpc(upsert_thought, { p_content, p_payload: { metadata } }). Suite -> 25 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3c4b97e`
- notes: reply-without-id behavior deliberately not specified (Assumption 10); reported to integrator

#### Cycle: U84 upsertThought id / error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U84 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U84 /" tests/` -> `U84 ... FAILED: AssertionError: Values are not equal (error case returned { data: { id: undefined } })`
- green: `lib/thought_store.ts` upsertThought returns { error: message } on RPC error. Suite -> 26 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `44bb73d`
- notes: reply without an id still yields { data: { id: undefined } }: unspecified, raised to integrator

#### Cycle: U85 setEmbedding request

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U85 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U85 /" tests/` -> `U85 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` setEmbedding PATCH thoughts { embedding } where id=eq.<id>. Suite -> 27 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `90f4b52`
- notes: error mapping deferred to U86

#### Cycle: U86 setEmbedding error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U86 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U86 /" tests/` -> `U86 ... FAILED: AssertionError: Values are not equal (got { data: null })`
- green: `lib/thought_store.ts` setEmbedding returns { error: message }. Suite -> 28 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `c622ac7`
- notes: none

#### Cycle: U87 readBack request

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U87 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U87 /" tests/` -> `U87 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` readBack selects created_at, updated_at, embedding for id=eq.<id> as a single object. Suite -> 29 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2d03c03`
- notes: embedding column is selected and tested for null client-side (failure path only); test pins the three columns, not their order

#### Cycle: U88 readBack embeddingIsNull

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U88 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U88 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 30 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `790431f`
- notes: mutant: embeddingIsNull forced true -> AssertionError (1 failed); restored

#### Cycle: U89 readBack timestamps verbatim

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U89 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U89 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 31 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `4ead6fb`
- notes: mutant: createdAt normalised via Date.toISOString -> AssertionError (1 failed); restored

#### Cycle: U90 readBack errors

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U90 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U90 /" tests/` -> `U90 ... FAILED: AssertionError: Values are not equal (error replies came back as data with undefined timestamps)`
- green: `lib/thought_store.ts` readBack returns { error: message }. Suite -> 32 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `b3c1da3`
- notes: also dropped the now-unneeded optional chaining on data

#### Cycle: U91 deleteIfInsertedByCall filters

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U91 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U91 /" tests/` -> `U91 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` DELETE thoughts with id=eq, embedding=is.null, created_at=eq.T, updated_at=eq.T, returning id. Suite -> 33 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `bbbe43d`
- notes: T verified verbatim incl. the + in the offset after URL decoding

#### Cycle: U92 deleteIfInsertedByCall deleted: true

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U92 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U92 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 34 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cd79f69`
- notes: mutant: deleted forced false -> AssertionError (1 failed); restored

#### Cycle: U93 deleteIfInsertedByCall deleted: false

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U93 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U93 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 35 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9b1cf43`
- notes: mutant: deleted forced true -> AssertionError (1 failed); restored

#### Cycle: U94 deleteIfInsertedByCall error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U94 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U94 /" tests/` -> `U94 ... FAILED: AssertionError: Values are not equal (got { data: { deleted: false } })`
- green: `lib/thought_store.ts` deleteIfInsertedByCall returns { error: message }. Suite -> 36 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `c25e7f5`
- notes: none

#### Cycle: U95 countAll

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U95 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U95 /" tests/` -> `U95 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` countAll: head exact count of thoughts. Suite -> 37 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `e9b666a`
- notes: error and empty-table handling deferred to U98/U99

#### Cycle: U96 countWithModel

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U96 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U96 /" tests/` -> `U96 ... FAILED: Error: not implemented`
- green: `lib/thought_store.ts` countWithModel: same head count plus .eq("metadata->>embedding_model", m). Suite -> 38 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cc9114a`
- notes: none

#### Cycle: U97 model names intact

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U97 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U97 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 39 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `a79a903`
- notes: mutant: ':' ',' '/' replaced by '_' in the model name -> AssertionError (1 failed); restored

#### Cycle: U98 counts error

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U98 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U98 /" tests/` -> `U98 ... FAILED: AssertionError: countAll must report the failure`
- green: `lib/thought_store.ts` countAll and countWithModel return { error: message }. Suite -> 40 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `fc43911`
- notes: HEAD replies carry no body, so the error text comes from supabase-js (status text); test asserts a non-empty string error, not exact wording

#### Cycle: U99 counts empty table

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U99 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U99 /" tests/` -> `(passed on first run, 1 passed; mutant below)`
- green: `lib/thought_store.ts` no change (already satisfied). Suite -> 41 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `d2387d0`
- notes: mutant: countWithModel returned (count || 1) -> AssertionError (1 failed); restored

#### Refactor after U99

- Removed the unused `notImplemented` placeholder; `deno check` clean. Suite -> 41 passed, 0 failed, 24 ignored. Commit: `91955fd`

### Stream C cycle log

#### Cycle: U1 all six settings resolve as given

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U1 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U1 /" tests/` -> Error: not implemented (resolveConfig stub) (1 failed)
- green: lib/config.ts:3 resolveConfig reads six settings via getEnv into both endpoints (no validation yet). Suite -> 10 passed, 0 failed, 24 ignored
- refactor: none
- commit: `On branch contrib/mfelker/self-hosted-llm-config
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
    modified:   integrations/self-hosted-llm-mcp/lib/config.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
    integrations/self-hosted-llm-mcp/tests/config_test.ts

no changes added to commit (use "git add" and/or "git commit -a")`
- notes: none

#### Cycle: U1 all six settings resolve as given

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U1 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U1 /" tests/` -> Error: not implemented (resolveConfig stub) (1 failed)
- green: lib/config.ts:3 resolveConfig reads six settings via getEnv into both endpoints (no validation yet). Suite -> 10 passed, 0 failed, 24 ignored
- refactor: none
- commit: `944d7c3`
- notes: none

#### Cycle: U2 chat base falls back to embedding base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U2 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U2 /" tests/` -> AssertionError: Values are not equal (chat base undefined vs embedding base) (1 failed)
- green: lib/config.ts chatBase ?? embedding.base, chatInherits gets 'base'. Suite -> 11 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `b60b2e3`
- notes: none

#### Cycle: U3 chat inherits key only with the base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U3 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U3 /" tests/` -> AssertionError: Values are not equal (chat.key undefined vs "ek") (1 failed)
- green: lib/config.ts chat key falls back to embedding key when chat base inherited; chatInherits gets 'key'. Suite -> 12 passed, 0 failed, 24 ignored
- refactor: none needed (cleanup deferred to U9)
- commit: `c76a40f`
- notes: none

#### Cycle: U4 own chat base blocks key inheritance

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U4 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U4 /" tests/` -> n/a: passed on first run (mutant: key always inherited -> 1 failed AssertionError) (1 failed)
- green: none: existing U3 rule already implements it. Suite -> 13 passed, 0 failed, 24 ignored
- refactor: none
- commit: `7525a90`
- notes: passed first run; mutant (chat key = embedding.key unconditionally) failed U4 with AssertionError, restored exactly (a first mutant attempt did not apply, redone)

#### Cycle: U5 chat uses its own base and key

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U5 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U5 /" tests/` -> n/a: passed on first run (mutant: own CHAT_API_KEY ignored -> 1 failed AssertionError) (1 failed)
- green: none: existing resolution already honors own values. Suite -> 14 passed, 0 failed, 24 ignored
- refactor: none
- commit: `f12865f`
- notes: passed first run; mutant (chat key read from EMBEDDING_API_KEY) failed U5 with AssertionError, restored exactly (first mutant attempt failed type-check, redone)

#### Cycle: U6 nothing set reports the three required settings

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U6 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U6 /" tests/` -> AssertionError (result ok:true, expected ok:false) (1 failed)
- green: lib/config.ts: missing required settings filtered in fixed order, returns ok:false. Suite -> 15 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `4ab18cd`
- notes: none

#### Cycle: U7 no model fallback for chat

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U7 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U7 /" tests/` -> n/a: passed on first run (mutant: CHAT_MODEL falls back to EMBEDDING_MODEL -> 1 failed AssertionError) (1 failed)
- green: none: required-setting check already has no model fallback. Suite -> 16 passed, 0 failed, 24 ignored
- refactor: none
- commit: `86809f3`
- notes: passed first run; mutant making CHAT_MODEL fall back to EMBEDDING_MODEL failed U7, restored exactly

#### Cycle: U8 blank required settings are missing

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U8 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U8 /" tests/` -> AssertionError (blank values accepted, result ok:true) (1 failed)
- green: lib/config.ts: getEnv wrapper treats empty/whitespace-only values as unset. Suite -> 17 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9d8c050`
- notes: none

#### Cycle: U9 blank chat base/key fall back like unset

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U9 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U9 /" tests/` -> n/a: passed on first run (mutant: whitespace not treated as blank -> 1 failed) (1 failed)
- green: none: U8's blank-as-unset wrapper already covers it. Suite -> 18 passed, 0 failed, 24 ignored
- refactor: none
- commit: `54bf42e`
- notes: passed first run; mutant (trim removed from blank test) failed U9, restored exactly

#### Cycle: U10 OPENROUTER_API_KEY does not stand in for the base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U10 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U10 /" tests/` -> n/a: passed on first run (mutant: OPENROUTER_API_KEY waives the base requirement -> 1 failed) (1 failed)
- green: none: resolveConfig never reads OPENROUTER_*. Suite -> 19 passed, 0 failed, 24 ignored
- refactor: none
- commit: `400fe3f`
- notes: passed first run; mutant failed U10 with AssertionError, restored exactly

#### Cycle: U11 trailing slash removed from bases

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U11 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U11 /" tests/` -> AssertionError (base kept its trailing slash) (1 failed)
- green: lib/config.ts stripSlash applied to the embedding and chat bases. Suite -> 20 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `a571cae`
- notes: none

#### Cycle: U12 http and https bases accepted

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U12 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U12 /" tests/` -> n/a: passed on first run (no validation exists yet; mutant rewriting http: to https: -> 1 failed AssertionError) (1 failed)
- green: none: no scheme validation exists yet, so both pass; U13/U14 add the rejection. Suite -> 21 passed, 0 failed, 24 ignored
- refactor: none
- commit: `65f4ddc`
- notes: passed first run; mutant rewriting http: to https: failed U12, restored exactly

#### Cycle: U13 schemeless base is invalid

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U13 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U13 /" tests/` -> AssertionError (result ok:true, expected ok:false) (1 failed)
- green: lib/config.ts: scheme check on the embedding base pushes an invalid entry with a reason requiring http:// or https://. Suite -> 22 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `62122b0`
- notes: none

#### Cycle: U14 ftp base is invalid

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U14 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U14 /" tests/` -> n/a: passed on first run (mutant: any scheme accepted -> 1 failed AssertionError) (1 failed)
- green: none: scheme check from U13 already rejects non-http(s) schemes. Suite -> 23 passed, 0 failed, 24 ignored
- refactor: none
- commit: `b143745`
- notes: passed first run; mutant accepting any scheme failed U14, restored exactly

#### Cycle: U15 invalid chat base and inherited invalid base reporting

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U15 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U15 /" tests/` -> AssertionError (invalid chat base not reported: ok result) (1 failed)
- green: lib/config.ts: CHAT_API_BASE scheme check when set; an inherited base is only checked as EMBEDDING_API_BASE. Suite -> 24 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3643eb6`
- notes: none

#### Cycle: U16 timeout defaults to 60000

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U16 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U16 /" tests/` -> n/a: passed on first run (default hardcoded since U1; mutant 6000 -> 1 failed AssertionError) (1 failed)
- green: none: default already returned. Suite -> 25 passed, 0 failed, 24 ignored
- refactor: none
- commit: `601a3ae`
- notes: passed first run; mutant changing the default failed U16, restored exactly

#### Cycle: U17 FETCH_TIMEOUT_MS parsed as an integer

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U17 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U17 /" tests/` -> AssertionError (timeoutMs 60000, expected 90000) (1 failed)
- green: lib/config.ts: timeoutMs = Number(FETCH_TIMEOUT_MS) when set. Suite -> 26 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `97505e8`
- notes: none

#### Cycle: U18 invalid FETCH_TIMEOUT_MS values are reported

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U18 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U18 /" tests/` -> AssertionError: 0 should be invalid (1 failed)
- green: lib/config.ts: FETCH_TIMEOUT_MS must be digits only and >= 1, else an invalid entry. Suite -> 27 passed, 0 failed, 24 ignored
- refactor: cleaned operator grouping of the timeout condition while green
- commit: `58ea0c5`
- notes: none

#### Cycle: U19 missing and invalid reported together

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U19 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U19 /" tests/` -> AssertionError: Values are not equal (missing was [] because invalid returned early) (1 failed)
- green: lib/config.ts: resolveConfig restructured to collect missing and invalid independently before returning. Suite -> 28 passed, 0 failed, 24 ignored
- refactor: rewrote resolveConfig into read / validate / build sections (also removed the U3 duplication); suite stayed green
- commit: `9e2009c`
- notes: none

#### Cycle: U20 nothing cached between calls

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U20 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U20 /" tests/` -> n/a: passed on first run (mutant: module-level result cache -> 1 failed AssertionError) (1 failed)
- green: none: resolveConfig reads getEnv on every call. Suite -> 29 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c588950`
- notes: passed first run; mutant caching the first result failed U20, restored exactly

#### Cycle: U21 no key value in missing or invalid text

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U21 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U21 /" tests/` -> n/a: passed on first run (mutant: reason echoes the timeout value -> 1 failed, key leaked in reason) (1 failed)
- green: none: reasons are fixed strings and never echo a setting value. Suite -> 30 passed, 0 failed, 24 ignored
- refactor: none
- commit: `2289b14`
- notes: passed first run; mutant echoing the rejected FETCH_TIMEOUT_MS value failed U21 (leaked CHAT key shown), restored exactly

#### Cycle: U22 keyed http embedding role warns

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U22 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U22 /" tests/` -> Error: not implemented (keyOverHttpWarnings stub) (1 failed)
- green: lib/config.ts: keyOverHttpWarnings maps each keyed http:// endpoint to a key_over_http warning with the contract message. Suite -> 31 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `14aa0dc`
- notes: none

#### Cycle: U23 no warning for unkeyed http or keyed https

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U23 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U23 /" tests/` -> n/a: passed on first run (mutants: dropped key test, dropped scheme test -> each 1 failed AssertionError) (1 failed)
- green: none: U22's filter already requires both a key and http://. Suite -> 32 passed, 0 failed, 24 ignored
- refactor: none
- commit: `a1bf9a0`
- notes: passed first run; two mutants (warn without key; warn without http check) each failed U23, restored exactly

#### Cycle: U24 inheriting chat role gets its own warning

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U24 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U24 /" tests/` -> n/a: passed on first run (mutant: only the embedding role checked -> 1 failed AssertionError) (1 failed)
- green: none: U22's implementation already checks both roles. Suite -> 33 passed, 0 failed, 24 ignored
- refactor: none
- commit: `19c2f66`
- notes: passed first run; mutant checking only embedding failed U24, restored exactly

#### Cycle: U25 extraction prompt matches core verbatim

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U25 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U25 /" tests/` -> AssertionError: Values are not equal (EXTRACTION_PROMPT "" vs core prompt) (1 failed)
- green: lib/metadata.ts:2 EXTRACTION_PROMPT set to core's prompt text. Suite -> 34 passed, 0 failed, 24 ignored
- refactor: none
- commit: `5e2579d`
- notes: test reads server/index.ts at test time, so drift in core fails it

#### Cycle: U26 raw JSON object reply is usable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U26 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U26 /" tests/` -> Error: not implemented (parseUsableMetadata stub) (1 failed)
- green: lib/metadata.ts parseUsableMetadata parses the trimmed reply (no validation yet). Suite -> 35 passed, 0 failed, 24 ignored
- refactor: none
- commit: `195b3f5`
- notes: none

#### Cycle: U27 single fenced block reply is usable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U27 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U27 /" tests/` -> SyntaxError: Unexpected token ` (fenced reply not unwrapped) (1 failed)
- green: lib/metadata.ts: a reply that is exactly one fenced block (json or bare) is unwrapped before parsing. Suite -> 36 passed, 0 failed, 24 ignored
- refactor: none
- commit: `fd51d73`
- notes: none

#### Cycle: U28 non-object JSON is unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U28 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U28 /" tests/` -> AssertionError (array [1,2] returned instead of null) (1 failed)
- green: lib/metadata.ts: only a plain object (not null, not an array) is returned. Suite -> 37 passed, 0 failed, 24 ignored
- refactor: none
- commit: `4f9f844`
- notes: none

#### Cycle: U29 unparseable replies are unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U29 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U29 /" tests/` -> SyntaxError: Unexpected token 'o', "not json at all" is not valid JSON (1 failed)
- green: lib/metadata.ts: JSON.parse failure returns null (also covers prose around a fence and two fences). Suite -> 38 passed, 0 failed, 24 ignored
- refactor: none
- commit: `69f3a50`
- notes: none

#### Cycle: U30 fallback metadata when extraction is unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U30 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U30 /" tests/` -> Error: not implemented (buildCaptureMetadata stub) (1 failed)
- green: lib/metadata.ts: buildCaptureMetadata returns the fallback record. Suite -> 39 passed, 0 failed, 24 ignored
- refactor: none
- commit: `20a0d98`
- notes: none

#### Cycle: U31 extracted metadata kept and completed

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U31 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U31 /" tests/` -> AssertionError (fallback topics/type returned instead of extracted fields) (1 failed)
- green: lib/metadata.ts: extracted metadata spread, plus source, embedding_model, enrichment_status complete. Suite -> 40 passed, 0 failed, 24 ignored
- refactor: none
- commit: `1357819`
- notes: none

#### Cycle: U32 real values override extracted claims

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U32 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U32 /" tests/` -> n/a: passed on first run (mutant: spread of extracted placed last -> 1 failed AssertionError) (1 failed)
- green: none: U31's spread order already lets the real values win. Suite -> 41 passed, 0 failed, 24 ignored
- refactor: none
- commit: `129ca5d`
- notes: passed first run; mutant putting ...extracted last failed U32, restored exactly

### Stream M cycle log

#### Cycle: U33 embed request shape

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U33 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U33 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts embed() posts {model,input,dimensions:1536} to <base>/embeddings. Suite -> 10 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `0c769f4`
- notes: none

#### Cycle: U34 embed returns vector

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U34 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U34 /" tests/` -> AssertionError: Values are not equal (stub returned ok:false) (1 failed)
- green: lib/model_client.ts embed() parses data[0].embedding. Suite -> 11 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `5e2bcaf`
- notes: none

#### Cycle: U35 chat request shape

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U35 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U35 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts chat() posts model/response_format/messages to <base>/chat/completions. Suite -> 12 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `5bd4d3c`
- notes: none

#### Cycle: U36 chat returns content

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U36 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U36 /" tests/` -> AssertionError: Values are not equal (message: "not implemented") (1 failed)
- green: lib/model_client.ts chat() parses choices[0].message.content. Suite -> 13 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `c9a4212`
- notes: none

#### Cycle: U37 listModels request

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U37 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U37 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts listModels() GETs <role base>/models. Suite -> 14 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `854ddf3`
- notes: none

#### Cycle: U38 Bearer key on all operations

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U38 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U38 /" tests/` -> AssertionError: Values are not equal (authorization undefined) (1 failed)
- green: lib/model_client.ts send() helper adds Authorization when ep.key. Suite -> 15 passed | 0 failed | 24 ignored
- refactor: extracted send() helper from three inline fetches
- commit: `6351ee7`
- notes: none

#### Cycle: U39 no key, no Authorization header

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U39 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U39 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (send() already conditional). Suite -> 16 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `4b35fc1`
- notes: mutant: send() always adds Authorization -> U39 failed (AssertionError); restored, passes

#### Cycle: U40 each role sends its own key

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U40 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U40 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 17 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `d10b92f`
- notes: mutant: listModels always uses embedding endpoint -> U40 failed (Values are not equal); restored

#### Cycle: U41 requests stay on configured bases

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U41 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U41 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 18 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `c642683`
- notes: mutant: URL base replaced by http://evil.test -> U41 failed (no route for POST http://evil.test/embeddings); restored. Retry request not yet covered here: re-checked after U54-U55 (see those entries)

#### Cycle: U42 unreachable outcome

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U42 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U42 /" tests/` -> TypeError: connection refused (fetch rejection propagated) (1 failed)
- green: lib/model_client.ts send() catches fetch rejection -> unreachable with role and base. Suite -> 19 passed | 0 failed | 24 ignored
- refactor: send() now returns {response}|Failure
- commit: `5b14838`
- notes: none

#### Cycle: U43 reply inside timeout is ok

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U43 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U43 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 20 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `e955330`
- notes: mutant: embed returns ok:false -> U43 failed (AssertionError); restored

#### Cycle: U44 timeout outcome

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U44 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U44 /" tests/` -> `Promise resolution is still pending but the event loop has already resolved` (hung fetch never settles) (1 failed)
- green: lib/model_client.ts send() passes AbortSignal.timeout(timeoutMs); aborted -> timeout. Suite -> 21 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `3a67b6a`
- notes: none

#### Cycle: U45 401/403 auth_rejected

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U45 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U45 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (no status handling) (1 failed)
- green: lib/model_client.ts httpFailure() maps 401/403 to auth_rejected. Suite -> 22 passed | 0 failed | 24 ignored
- refactor: send() now reads the body under the timeout and returns {status,text}
- commit: `e344db7`
- notes: none

#### Cycle: U46 404 model_not_found

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U46 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U46 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts httpFailure() maps 404 to model_not_found. Suite -> 23 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `fe7a776`
- notes: none

#### Cycle: U47 400/422 body naming unknown model

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U47 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U47 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts namesModelAsUnknown() + 400/422 branch. Suite -> 24 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `74221f4`
- notes: none

#### Cycle: U48 5xx http_error

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U48 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U48 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts httpFailure() returns http_error with role, status, text. Suite -> 25 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `ca3cc1c`
- notes: none

#### Cycle: U49 plain 400 is http_error, one request

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U49 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U49 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 26 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `3bf751a`
- notes: mutant: 400/422 branch always model_not_found -> U49 failed; restored

#### Cycle: U50 malformed embeddings reply is bad_response

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U50 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U50 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (1 failed)
- green: lib/model_client.ts parseJson() + embedding shape validation -> bad_response. Suite -> 27 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `74d7e0b`
- notes: none

#### Cycle: U51 malformed chat reply is bad_response

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U51 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U51 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (1 failed)
- green: lib/model_client.ts chat() validates choices[0].message.content. Suite -> 28 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `254a4ac`
- notes: none

#### Cycle: U52 1536 ok, 1535/1537 wrong_dimension

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U52 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U52 /" tests/` -> `AssertionError: Values are not equal: length 1535` (1 failed)
- green: lib/model_client.ts embed() length check against EXPECTED_DIMENSIONS. Suite -> 29 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `1cc3324`
- notes: none

#### Cycle: U53 wrong_dimension exact message

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U53 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U53 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (message written with U52 to satisfy the contract text). Suite -> 30 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `cc1da3b`
- notes: mutant: 'Choose'->'Pick' in message -> U53 failed; restored

#### Cycle: U54 dimensions retry

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U54 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U54 /" tests/` -> `AssertionError: Values are not equal` (only 1 request sent) (1 failed)
- green: lib/model_client.ts embed() retries once without dimensions on 400/422 mentioning dimension|matryoshka. Suite -> 31 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `dfba06f`
- notes: none

#### Cycle: U55 retry identical apart from dimensions

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U55 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U55 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 32 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `2c1e315`
- notes: mutant: retry input changed to "x" -> U55 failed; restored

#### Cycle: U41 (extension) retry stays on configured base

- test: U41 extended with a dimensions-retry scenario; passed on first run
- mutant: retry sent to http://evil.test -> U41 failed (FakeFetch: no route); restored, suite green
- commit: `4a94a6e`

#### Cycle: U56 retry triggers sampled

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U56 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U56 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 33 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `6eaa99b`
- notes: mutant: dropped /i flag from the retry regex -> U56 failed; restored

#### Cycle: U57 no retry for 404 / 500

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U57 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U57 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 34 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `95167e8`
- notes: mutant: retry on any status >=400 -> U57 failed; restored

#### Cycle: U58 retry is single

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U58 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U58 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 35 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `339fd98`
- notes: mutant: a second retry after the retry -> U58 failed (3 requests); restored

#### Cycle: U59 retry result goes through length check

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U59 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U59 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 36 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `128c50f`
- notes: mutant: retry 2xx returned without length check -> U59 failed; restored

#### Cycle: U60 retry has own timeout

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U60 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U60 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (each send() creates its own AbortSignal). Suite -> 37 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `cd8d6ca`
- notes: first mutant (shared AbortSignal) survived because FakeFetch function handlers ignore the signal; test rewritten to use `hold` replies, then the mutant -> U60 failed (AssertionError); restored. Commit amended

#### Cycle: U61 one request on success

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U61 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U61 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 38 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `869780e`
- notes: mutant: retry on any response -> U61 failed (2 requests); restored

#### Cycle: U62 redact keys in server text

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U62 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U62 /" tests/` -> `AssertionError: Expected actual: ... to contain: "[redacted]"` (1 failed)
- green: lib/model_client.ts redact() applied to the http_error server text. Suite -> 39 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `0e66367`
- notes: none

#### Cycle: U63 redact keys in fetch error

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U63 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U63 /" tests/` -> `AssertionError: Expected actual: "...could not be reached." to contain: "[redacted]"` (1 failed)
- green: lib/model_client.ts unreachable message now carries the redacted fetch error text. Suite -> 40 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `97fe82b`
- notes: none

#### Cycle: U64 200-char trim after redaction

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U64 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U64 /" tests/` -> `AssertionError` (201-char text not cut) (1 failed)
- green: lib/model_client.ts serverText() = redact then slice(0,200), used for http_error and unreachable. Suite -> 41 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `d8e3f25`
- notes: mutant: trim before redact -> U64 failed (key prefix leaked); restored

#### Cycle: U65 listModels returns ids

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U65 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U65 /" tests/` -> `AssertionError: Values are not equal` (value null) (1 failed)
- green: lib/model_client.ts listModels() maps data[].id. Suite -> 42 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `7e503f6`
- notes: none

#### Cycle: U66 listModels null for unusable listing

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U66 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U66 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (written with U65). Suite -> 43 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `f45db3b`
- notes: mutant: unusable listing returns [] -> U66 failed; restored

#### Cycle: U67 listModels maps 401 and unreachable

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U67 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U67 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (shared send()/httpFailure()). Suite -> 44 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `02ca108`
- notes: two mutants: 401 no longer auth_rejected; unreachable kind changed -> U67 failed each; restored

### Stream K cycle log

#### Cycle: U146 A healthy configuration and server give ok true

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U146 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U146 /" tests/` -> `Error: not implemented` (1 failed)
- green: lib/setup_check.ts: resolve config, run embed and chat, ok = both ok. Suite -> 109 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `b323794`
- notes: —

#### Cycle: U147 The report lists the seven checks in the contract's order

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U147 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U147 /" tests/` -> `AssertionError: Values are not equal (checks was empty)` (1 failed)
- green: lib/setup_check.ts: build the seven checks, ids and roles in contract order. Suite -> 110 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `de288ae`
- notes: reachable/model checks are placeholders until U156-U163

#### Cycle: U148 config shows each role's base, model and key_set, chat inherits, and timeout_ms

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U148 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U148 /" tests/` -> `AssertionError: Values are not equal (config was null)` (1 failed)
- green: lib/setup_check.ts: configBlock() maps OkConfig to snake_case block. Suite -> 111 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3516c4c`
- notes: —

#### Cycle: U149 No key value appears anywhere in the report

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U149 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U149 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; report carries only key_set booleans. Suite -> 112 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `41bc566`
- notes: Passed first run. Mutant: appended chat key to config.chat.model -> test failed; restored. Test is only weakly exercised until reasons exist (U165+ echo model-server text); error bodies in the fake already contain the keys.

#### Cycle: U150 A missing setting fails config with a reason naming each missing setting

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U150 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U150 /" tests/` -> `Error: not implemented` (1 failed)
- green: lib/setup_check.ts: config-failure branch returns a failed config check naming config.missing. Suite -> 113 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `33a731c`
- notes: —

#### Cycle: U151 An invalid setting fails config naming it with its reason

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U151 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U151 /" tests/` -> `AssertionError: Expected actual: "Missing required settings: ." to contain: "EMBEDDING_API_BASE"` (1 failed)
- green: lib/setup_check.ts: reason also lists each invalid setting with its reason. Suite -> 114 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `030e720`
- notes: —

#### Cycle: U152 With config failed, every other check reads skipped: configuration incomplete

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U152 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U152 /" tests/` -> `AssertionError: Values are not equal (only the config check was listed)` (1 failed)
- green: lib/setup_check.ts: CHECK_IDS table; skipped checks appended after the failed config. Suite -> 115 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `7ef18fe`
- notes: —

#### Cycle: U153 With config failed, no model request is sent

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U153 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U153 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the config-failure branch returns before creating a model client. Suite -> 116 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `d71692c`
- notes: Passed first run. Mutant: awaited deps.modelFetch in the failure branch -> test failed (no route); restored.

#### Cycle: U154 With config failed, ok is false and thoughts.other_model is null with no store call

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U154 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U154 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; failure branch has other_model null and calls no store method. Suite -> 117 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `5de4f21`
- notes: Passed first run. Mutant: awaited deps.store.countAll() in the failure branch -> test failed; restored.

#### Cycle: U155 Any single failed check makes ok false

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U155 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U155 /" tests/` -> `AssertionError: Values are not equal (chat_metadata passed on non-JSON reply)` (1 failed)
- green: lib/setup_check.ts: chat_metadata ok requires parseUsableMetadata(reply) non-null. Suite -> 118 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3064d77`
- notes: Dimension half passed already; chat half drove the change (overlaps U167/U168).

#### Cycle: U156 <role>_reachable passes on a 200 and on a 404 from /models

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U156 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U156 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable is still a constant-true placeholder, real logic arrives with U157. Suite -> 119 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `828a130`
- notes: Passed first run. Mutant: chat_reachable ok false -> test failed; restored.

#### Cycle: U157 <role>_reachable fails with auth_rejected on a 401 or 403

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U157 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U157 /" tests/` -> `AssertionError: Values are not equal: status 401` (1 failed)
- green: lib/setup_check.ts: also call listModels per role in parallel; reachable() fails on unreachable/timeout/auth_rejected. Suite -> 120 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `144dc3a`
- notes: —

#### Cycle: U158 <role>_reachable fails with unreachable naming the base on a network error

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U158 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U158 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable() already fails on unreachable and carries the client message naming the base. Suite -> 121 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `6b83a78`
- notes: Passed first run. Mutant: removed unreachable from the failing kinds -> test failed; restored.

#### Cycle: U159 <role>_reachable fails with timeout when /models hangs

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U159 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U159 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable() already fails on timeout. Suite -> 122 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `8a76caf`
- notes: Passed first run. Mutant: removed timeout from the failing kinds -> test failed; restored.

#### Cycle: U160 <role>_model passes when the model is listed

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U160 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U160 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; model checks are constant-true placeholders until U162. Suite -> 123 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `73ccffe`
- notes: Passed first run. Mutant: embedding_model ok false -> test failed; restored.

#### Cycle: U161 <role>_model passes when the model is not listed but the real call succeeded

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U161 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U161 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; model checks still placeholders. Suite -> 124 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `138c09a`
- notes: Passed first run. Mutant: chat_model ok false -> test failed; restored.

#### Cycle: U162 <role>_model fails with model_not_found naming the model when unlisted and the real call reports it unknown

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U162 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U162 /" tests/` -> `AssertionError: Values are not equal: embedding_model` (1 failed)
- green: lib/setup_check.ts: modelCheck() passes when listed or the real call succeeded, else carries the call's failure message. Suite -> 125 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `d4fdfb2`
- notes: —

#### Cycle: U163 With a non-JSON /models body, <role>_model follows the real call's outcome

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U163 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U163 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; a null listing falls through to the real call's outcome. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9f15e74`
- notes: Passed first run. Mutant: required a non-null listing for the call-succeeded pass -> test failed; restored.

#### Cycle: U163 With a non-JSON /models body, <role>_model follows the real call's outcome

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U163 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U163 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; a null listing falls through to the real call's outcome. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `On branch contrib/mfelker/self-hosted-llm-check
nothing to commit, working tree clean`
- notes: Passed first run. Mutant: real-call pass also required a non-null listing -> test failed; restored.

#### Cycle: U164 embedding_dimension passes for a 1536-number vector

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U164 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U164 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; embedding_dimension ok = the embed call succeeded (the client enforces 1536). Suite -> 127 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `6e2bdd5`
- notes: Passed first run. Mutant: inverted ok -> test failed; restored.

#### Cycle: U165 embedding_dimension fails for 768 numbers with a reason naming 768 and 1536

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U165 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U165 /" tests/` -> `AssertionError: Values are not equal (reason was undefined)` (1 failed)
- green: lib/setup_check.ts: failed embedding_dimension carries the embed call's message. Suite -> 128 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `917bb07`
- notes: —

#### Cycle: U166 embedding_dimension carries the embedding call's outcome when the call fails

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U166 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U166 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the same branch as U165 carries any embed failure message. Suite -> 129 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2308d0f`
- notes: Passed first run. Mutant: constant reason "failed" -> test failed; restored.

#### Cycle: U167 chat_metadata passes for a JSON-object reply

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U167 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U167 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; chat_metadata ok requires usable metadata (introduced for U155). Suite -> 130 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `bb29aaf`
- notes: Passed first run. Mutant: inverted usability test -> test failed; restored.

#### Cycle: U168 chat_metadata fails with unusable output and the first 120 characters (no more) of an unusable reply

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U168 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U168 /" tests/` -> `AssertionError: Values are not equal (reason was undefined)` (1 failed)
- green: lib/setup_check.ts: chatMetadata() reports "unusable output: " plus reply.slice(0, 120). Suite -> 131 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2a37871`
- notes: Reason format chosen: `unusable output: <first 120 chars>`.

#### Cycle: U169 chat_metadata carries the chat call's outcome when the call fails

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U169 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U169 /" tests/` -> `AssertionError: Expected actual: "" to contain: "HTTP 500"` (1 failed)
- green: lib/setup_check.ts: failed chat call gives reason chat.message. Suite -> 132 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `0b54725`
- notes: —

#### Cycle: U170 When chat inherits the embedding base, both roles' checks are reported separately and chat requests go to the embedding base

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U170 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U170 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; roles are checked separately and the client already routes chat to the inherited base. Suite -> 133 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `ef35494`
- notes: Passed first run. Mutant: chat_model used the embedding call's outcome -> test failed; restored.

#### Cycle: U171 One run sends one embedding call, one chat call and one /models request per role

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U171 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U171 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; each call is made once and shared by its checks. Suite -> 134 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `1606bd8`
- notes: Passed first run. First mutant (chat listing via embedding role) exposed a weak count assertion on a shared base; test strengthened (separate per-base GET counts), mutant then failed; restored.

#### Cycle: U172 A key_over_http warning is reported and leaves ok true

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U172 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U172 /" tests/` -> `AssertionError: Values are not equal (warnings was empty)` (1 failed)
- green: lib/setup_check.ts: warnings = keyOverHttpWarnings(config). Suite -> 135 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `502c045`
- notes: —

#### Cycle: U173 An unkeyed http:// base and a keyed https:// base produce no warning

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U173 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U173 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; keyOverHttpWarnings already gives none for these. Suite -> 136 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `5d8941a`
- notes: Passed first run. Mutant: constant bogus warning -> test failed; restored.

#### Cycle: U174 Every model request starts before any reply is released

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U174 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U174 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the four model calls already run under Promise.all. Suite -> 137 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3b278d0`
- notes: Passed first run. Mutant: sequential awaits -> test failed (heldCount never reached 4); restored.

#### Cycle: U175 With every model route hanging, the run finishes in about one timeoutMs, not several

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U175 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U175 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; calls run concurrently so the run is bounded by one timeout. Suite -> 138 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `25b0380`
- notes: Passed first run. Mutant: sequential awaits -> 'took 1214 ms' failure; restored. Upper bound set to 850 ms for a 300 ms timeout to avoid flakiness (sequential is about 1200 ms).

#### Cycle: U176 5 thoughts, 2 matching EMBEDDING_MODEL, give thoughts.other_model: 3

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U176 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U176 /" tests/` -> `AssertionError: Values are not equal (other_model was null)` (1 failed)
- green: lib/setup_check.ts: other_model = countAll - countWithModel(EMBEDDING_MODEL). Suite -> 139 passed, 0 failed, 24 ignored
- refactor: Moved the two counts into the same Promise.all as the model calls so database latency does not add to the run time
- commit: `acd44a7`
- notes: —

#### Cycle: U177 All thoughts matching, and an empty brain, each give other_model: 0

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U177 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U177 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the subtraction already yields 0. Suite -> 140 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3968ac0`
- notes: Passed first run. Mutant: off by one (+1) -> test failed; restored.

#### Cycle: U178 A failing count gives other_model: null with a thoughts_count warning carrying the database message

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U178 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U178 /" tests/` -> `AssertionError: countAll: no thoughts_count warning` (1 failed)
- green: lib/setup_check.ts: on a failed count, other_model stays null and a thoughts_count warning carries the store error. Suite -> 141 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `f6263a0`
- notes: Sampled both countAll and countWithModel failures.

#### Cycle: U179 With a failing count, the model checks still run and decide ok

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U179 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U179 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; warnings never feed into ok and counts run alongside the model calls. Suite -> 142 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `7e010f9`
- notes: Passed first run. Mutant: ok also required no warnings -> test failed; restored.

#### Integrator note: mutant checks for U156, U160, U161 (added at merge)

The stream recorded U156, U160 and U161 as first-run passes against constant-true placeholders without a mutant. At the stream's tip (`7e010f9`), the integrator applied one mutant per test to the real logic in `lib/setup_check.ts`, ran the single test, and restored the file exactly (`git status` clean afterwards):

- U156: `reachable()` forced to return `ok: false` -> `FAILED | 0 passed | 1 failed`
- U160: the "model listed" branch of `modelCheck()` removed -> `FAILED | 0 passed | 1 failed`
- U161: the "real call succeeded" branch of `modelCheck()` removed -> `FAILED | 0 passed | 1 failed`

Each test is therefore load-bearing. Its red evidence is a mutant, not a pre-implementation red, which the audit may grade below PROVEN.

### Stream T cycle log

#### Cycle: U100 tools/list returns exactly the six tools

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U100 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U100 /" tests/` -> `Error: not implemented` from buildServer (1 failed)
- green: `lib/tools.ts` buildServer registers the six tool names with placeholder handlers. Suite -> 109 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ebbf9c5`
- notes: stub handlers; later cycles fill them in

#### Cycle: U101 tool title/description/schema/annotations equal core's

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U101 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U101 /" tests/` -> `AssertionError: Values are not equal: search` (1 failed)
- green: `lib/tools.ts` registerTool configs copied from core (titles, descriptions, zod input schemas with defaults, annotations). Suite -> 110 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ce3cbaf`
- notes: -

#### Cycle: U102 fetch of an existing id returns core's document text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U102 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U102 /" tests/` -> `SyntaxError: "not implemented" is not valid JSON` (1 failed)
- green: `lib/tools.ts` fetch handler maps store.fetchThought to core's document JSON; thoughtTitle/thoughtUrl helpers. Suite -> 111 passed, 0 failed, 24 ignored
- refactor: none
- commit: `9b0ce47`
- notes: -

#### Cycle: U103 fetch with a store error returns core's isError text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U103 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U103 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (fetch handler from U102 already returns `Fetch error:`). Suite -> 112 passed, 0 failed, 24 ignored
- refactor: none
- commit: `dcf7373`
- notes: mutant: `Fetch error:` -> `Fetch err:` -> AssertionError (1 failed); restored

#### Cycle: U104 list_thoughts returns core's listing text for rows

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U104 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U104 /" tests/` -> `AssertionError: Values are not equal` (1 failed)
- green: `lib/tools.ts` list_thoughts handler formats store rows as core does. Suite -> 113 passed, 0 failed, 24 ignored
- refactor: none
- commit: `a479538`
- notes: -

#### Cycle: U105 list_thoughts with no rows returns core's empty text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U105 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U105 /" tests/` -> `AssertionError: Values are not equal` (1 failed; got `0 recent thought(s):`)
- green: `lib/tools.ts` list_thoughts returns `No thoughts found.` for no rows. Suite -> 114 passed, 0 failed, 24 ignored
- refactor: none
- commit: `242318f`
- notes: -

#### Cycle: U106 list_thoughts with a store error returns core's isError text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U106 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U106 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (error branch written with U104). Suite -> 115 passed, 0 failed, 24 ignored
- refactor: none
- commit: `bbf20b8`
- notes: mutant: `Error:` -> `Err:` prefix -> AssertionError (1 failed); restored

#### Cycle: U107 list_thoughts forwards its filters to the store

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U107 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U107 /" tests/` -> `AssertionError: Values are not equal` (1 failed; filters missing)
- green: `lib/tools.ts` list_thoughts passes type/topic/person/days when set. Suite -> 116 passed, 0 failed, 24 ignored
- refactor: none
- commit: `136255a`
- notes: -

#### Cycle: U108 thought_stats returns core's stats text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U108 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U108 /" tests/` -> `AssertionError: Values are not equal` (1 failed; placeholder text)
- green: `lib/tools.ts` thought_stats aggregates store.stats rows as core does. Suite -> 117 passed, 0 failed, 24 ignored
- refactor: none
- commit: `6b8db3d`
- notes: store error mirrors core (ignored: count/rows default), no behavior row

#### Cycle: U109 search_thoughts embeds the query and matches with default threshold and count

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U109 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U109 /" tests/` -> `TypeError: Cannot read properties of undefined (reading 'input')` (no embeddings request; 1 failed)
- green: `lib/tools.ts` models() resolves config per call and builds the real model client; search_thoughts embeds then calls matchThoughts(vec, 0.5, 10) (results text placeholder until U111). Test rig gained an options argument for scripted replies. Suite -> 118 passed, 0 failed, 24 ignored
- refactor: none
- commit: `eb29564`
- notes: temporary models() throws on a bad config until U119

#### Cycle: U110 search_thoughts forwards an explicit limit and threshold

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U110 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U110 /" tests/` -> `AssertionError: Values are not equal` (1 failed; got 0.5/10)
- green: `lib/tools.ts` search_thoughts passes threshold and limit to matchThoughts. Suite -> 119 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c8016bc`
- notes: -

#### Cycle: U111 search_thoughts returns core's results text and no-match text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U111 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U111 /" tests/` -> `AssertionError: Values are not equal` (1 failed; empty text)
- green: `lib/tools.ts` search_thoughts formats results and the no-match line as core does. Suite -> 120 passed, 0 failed, 24 ignored
- refactor: none
- commit: `1d59424`
- notes: -

#### Cycle: U112 search returns core's results JSON

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U112 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U112 /" tests/` -> `SyntaxError: Unexpected token 'o', "not implemented" is not valid JSON` (1 failed)
- green: `lib/tools.ts` search handler: embed, matchThoughts(0.5,10), map to id/title/url JSON. Suite -> 121 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ff2ed37`
- notes: -

#### Cycle: U113 search with a store error returns core's Search error text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U113 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U113 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (search handler from U112 already returns `Search error:`). Suite -> 122 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ccf8248`
- notes: mutant: `Search error:` -> `Search err:` -> AssertionError (1 failed); restored

#### Cycle: U114 successful capture replies with core's Captured as confirmation

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U114 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U114 /" tests/` -> `AssertionError: Values are not equal` (1 failed; placeholder text)
- green: `lib/tools.ts` capture_thought: embed, chat (sequential for now), build metadata, upsert, setEmbedding, core confirmation. Suite -> 123 passed, 0 failed, 24 ignored
- refactor: none
- commit: `73c7afa`
- notes: sequential calls and double resolveConfig are temporary; U117 and the gate cycle reshape them

#### Cycle: U115 capture stores extracted metadata plus source, embedding_model, enrichment_status

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U115 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U115 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U114 already builds metadata via buildCaptureMetadata). Suite -> 124 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ab73cbd`
- notes: mutant: embedding_model hard-coded "x" -> AssertionError (1 failed); restored. Model-supplied source/embedding_model are overridden (asserted)

#### Cycle: U116 capture stores the model's vector as the row's embedding

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U116 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U116 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U114 already calls setEmbedding with the model vector). Suite -> 125 passed, 0 failed, 24 ignored
- refactor: none
- commit: `21124ea`
- notes: mutant: setEmbedding(id, []) -> AssertionError (1 failed); restored

#### Cycle: U117 embedding and chat requests are both in flight before either reply is released

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U117 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U117 /" tests/` -> `AssertionError: Values are not equal` (held 1 vs 2; 1 failed)
- green: `lib/tools.ts` capture runs embed and chat with Promise.all. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none
- commit: `fda4748`
- notes: test releases held replies in a loop so a sequential impl fails fast rather than timing out

#### Cycle: U118 every model request goes to a configured base

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U118 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U118 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 127 passed, 0 failed, 24 ignored
- refactor: none
- commit: `bf832f9`
- notes: mutant: embedding base replaced by a hard-coded URL -> AssertionError (1 failed); restored. Separate CHAT_API_BASE covers the chat side

#### Cycle: U119 config gate: unset EMBEDDING_API_BASE returns the exact not-configured text for capture

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U119 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U119 /" tests/` -> `AssertionError` -  `Error: configuration incomplete` (1 failed)
- green: `lib/tools.ts` gate() wrapper resolves config per call and returns the contract text; applied to capture_thought. Suite -> 128 passed, 0 failed, 24 ignored
- refactor: none
- commit: `2b60f64`
- notes: other tools adopt the gate in U120

#### Cycle: U120 config gate: with CHAT_MODEL unset each of the six tools returns isError naming CHAT_MODEL

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U120 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U120 /" tests/` -> `AssertionError: Values are not equal: search` (-`Error: configuration incomplete`; 1 failed)
- green: `lib/tools.ts` all six handlers wrapped in gate(); temporary models() removed. Suite -> 129 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e2b6b9c`
- notes: search/search_thoughts/fetch/list/stats/capture all asserted with exact text

#### Cycle: U121 config gate: no model request and no store call under a bad configuration

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U121 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U121 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate returns before any call). Suite -> 130 passed, 0 failed, 24 ignored
- refactor: none
- commit: `86ad90f`
- notes: mutant: store.countAll() fired before the gate reply -> AssertionError (1 failed); restored. Checked across all six tools with every variable unset

#### Cycle: U122 config gate: tools/list still returns the six tools under a bad configuration

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U122 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U122 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 131 passed, 0 failed, 24 ignored
- refactor: none
- commit: `354adf4`
- notes: mutant: early return skipping the last four registrations when config is bad -> AssertionError (1 failed); restored

#### Cycle: U123 config gate: an invalid setting is named with the missing ones

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U123 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U123 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate text written in U119 names invalid settings). Suite -> 132 passed, 0 failed, 24 ignored
- refactor: none
- commit: `af29d2a`
- notes: mutant: invalid reasons dropped -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded). Format chosen: `missing A; invalid B (reason), C (reason).`

#### Cycle: U124 config gate: setting a missing variable between calls lets the second call run

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U124 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U124 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate resolves per call). Suite -> 133 passed, 0 failed, 24 ignored
- refactor: none
- commit: `185e13f`
- notes: mutant: config cached in a global on first call -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded)

#### Cycle: U125 search_thoughts and search with a failing embedding return isError naming the cause

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U125 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U125 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (embedding failure throws into the Error: wrapper). Suite -> 134 passed, 0 failed, 24 ignored
- refactor: none
- commit: `99acc6f`
- notes: mutant: search proceeds to matchThoughts with an empty vector on embed failure -> AssertionError (1 failed); restored

#### Cycle: U126 capture with embedding unreachable or timing out returns isError naming the cause, no upsert

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U126 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U126 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (embedding failure throws before upsert). Suite -> 135 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c307201`
- notes: mutant: embed-failure guard removed and setEmbedding fed [] -> AssertionError (1 failed); restored

#### Cycle: U127 capture with auth_rejected/model_not_found/bad_response/http_error embedding returns isError, no upsert

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U127 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U127 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 136 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c8f56c6`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Four kinds asserted by content

#### Cycle: U128 capture with a 768-length embedding returns the exact wrong_dimension text, stores nothing

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U128 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U128 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 137 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e6a9926`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Text is asserted inside core's `Error:` wrapper per Assumption 6

#### Cycle: U129 capture whose embedding fails while chat succeeds stores nothing

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U129 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U129 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 138 passed, 0 failed, 24 ignored
- refactor: none
- commit: `93fe4e7`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Also asserts the chat request was sent (concurrency, R5)

#### Cycle: U130 capture with chat unreachable stores the fallback row with its embedding

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U130 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U130 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (chat failure already yields null metadata -> buildCaptureMetadata fallback). Suite -> 139 passed, 0 failed, 24 ignored
- refactor: none
- commit: `5f2e4a1`
- notes: mutant: chat failure yields {topics:["x"]} metadata -> AssertionError (1 failed); restored

#### Cycle: U131 capture with chat timing out stores the fallback row and ends with the skip line naming the timeout

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U131 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U131 /" tests/` -> `AssertionError: Captured as observation — uncategorized` (regex did not match; 1 failed)
- green: `lib/tools.ts` capture appends `\nMetadata extraction skipped: <chat message sans trailing period>. Saved with default metadata.` when chat failed. Suite -> 140 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e6246c0`
- notes: -

#### Cycle: U132 capture with a chat 5xx or missing choices stores the fallback row with the skip line

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U132 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U132 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U131 skip line covers failed chat). Suite -> 141 passed, 0 failed, 24 ignored
- refactor: none
- commit: `26b8e36`
- notes: mutant: skip-line branch disabled -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded)

#### Cycle: U133 capture with non-JSON-object chat content stores the fallback row with the skip line

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U133 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U133 /" tests/` -> `AssertionError: Captured as observation — uncategorized` (no skip line; 1 failed)
- green: `lib/tools.ts` skip reason also set when chat replied but the content is unusable. Suite -> 142 passed, 0 failed, 24 ignored
- refactor: none
- commit: `56e3fcb`
- notes: -

#### Cycle: U134 capture with fenced JSON chat content stores enrichment_status complete

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U134 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U134 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (parseUsableMetadata handles one fenced block). Suite -> 143 passed, 0 failed, 24 ignored
- refactor: none
- commit: `08e387f`
- notes: mutant: plain JSON.parse instead of parseUsableMetadata -> AssertionError (1 failed); restored

#### Cycle: U135 fallback reply keeps core's Captured as observation — uncategorized text before the skip line

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U135 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U135 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 144 passed, 0 failed, 24 ignored
- refactor: none
- commit: `7ca2eb6`
- notes: mutant: confirmation prefix changed -> AssertionError (1 failed); restored

#### Cycle: U136 capturing existing text with chat failing marks the one existing row fallback

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U136 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U136 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 145 passed, 0 failed, 24 ignored
- refactor: none
- commit: `f722680`
- notes: mutant: enrichment_status forced to "complete" -> AssertionError (1 failed); restored

#### Cycle: U137 recapturing that text with chat working marks the same row complete

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U137 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U137 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change; test rig gained chat handler sequences. Suite -> 146 passed, 0 failed, 24 ignored
- refactor: none
- commit: `dece3bd`
- notes: mutant: enrichment_status forced to "fallback" -> AssertionError (1 failed); restored

#### Cycle: U138 an upsertThought error returns core's Failed to capture text with no setEmbedding call

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U138 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U138 /" tests/` -> (passed on first run, 1 passed; mutants below)
- green: `lib/tools.ts` no change. Suite -> 147 passed, 0 failed, 24 ignored
- refactor: none
- commit: `0f6101a`
- notes: mutants: (a) setEmbedding fired on upsert error -> AssertionError (1 failed); (b) prefix changed to `Capture failed:` -> AssertionError (1 failed); both restored (first two mutant attempts were dead code / type errors, discarded)

#### Cycle: U139 setEmbedding failing on a row this call inserted returns the not-kept text and the row is gone

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U139 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U139 /" tests/` -> `AssertionError: Values are not equal` (core `Failed to save embedding:` text, row left behind; 1 failed)
- green: `lib/tools.ts` R6 flow: readBack, created==updated && embeddingIsNull -> deleteIfInsertedByCall(id, createdAt), not-kept text; read-back/delete problems -> may-be-saved text. Suite -> 148 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c9c7189`
- notes: merge branch still returns the may-be-saved text until U140

#### Cycle: U140 setEmbedding failing on a merged duplicate returns the already-in-your-brain text and keeps the row

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U140 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U140 /" tests/` -> `AssertionError: Values are not equal` (may-be-saved text instead; 1 failed)
- green: `lib/tools.ts` merged branch (created != updated) returns the already-in-your-brain/repair text with no delete. Suite -> 149 passed, 0 failed, 24 ignored
- refactor: none
- commit: `55023ed`
- notes: -

#### Cycle: U141 setEmbedding failing with readBack failing returns the may-be-saved text, no delete

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U141 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U141 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (read-back error branch written with U139). Suite -> 150 passed, 0 failed, 24 ignored
- refactor: none
- commit: `2ceeb5e`
- notes: mutant: read-back error returns the not-kept text -> AssertionError (1 failed); restored

#### Cycle: U142 setEmbedding failing with the delete erroring returns the may-be-saved text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U142 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U142 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 151 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ed6e5fa`
- notes: mutant: delete error treated as success -> AssertionError (1 failed); restored

#### Cycle: U143 setEmbedding failing with the delete reporting deleted: false returns the may-be-saved text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U143 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U143 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 152 passed, 0 failed, 24 ignored
- refactor: none
- commit: `93f5fc1`
- notes: mutant: deleted:false ignored -> AssertionError (1 failed); restored

#### Cycle: U144 the compensating delete uses the read-back id and timestamp

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U144 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U144 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 153 passed, 0 failed, 24 ignored
- refactor: none
- commit: `7228307`
- notes: mutant: delete called with "x" instead of the read-back timestamp -> AssertionError (1 failed); restored

#### Cycle: U145 no tool reply contains any of the four secrets

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U145 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U145 /" tests/` -> `AssertionError: fetch store error: reply contains a secret: Fetch error: rejected emb-secret-AAAA1111 / …` (1 failed)
- green: `lib/tools.ts` gate() redacts the four secret env values from every reply text. Suite green. Suite -> 154 passed, 0 failed, 24 ignored
- refactor: none
- commit: `a36fe25`
- notes: ten sampled paths: store errors on all tools, embedding/chat echo, upsert/setEmbedding/readBack errors

#### Refactor after U145

- removed the unused `notYet` placeholder from `lib/tools.ts`; suite -> 154 passed, 0 failed, 24 ignored; commit: `7ba8920`

### Stream A cycle log

#### Cycle: U180 OPTIONS answers ok with CORS

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U180 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U180 /" tests/` -> `Error: not implemented` at createApp (1 failed)
- green: `lib/app.ts` createApp returns a handler answering OPTIONS with `ok`, 200 and core's CORS headers. Suite -> 189 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `da8d806`

#### Cycle: U181 unauthorized POST gets the -32001 envelope

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U181 …` (new)
- red: `deno test … --filter "/^U181 /" tests/` -> `Error: not implemented` (1 failed)
- green: `lib/app.ts` `unauthorizedResponse()` (id null for now); createApp returns it for non-OPTIONS. Suite -> 190 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cb7055e`

#### Cycle: A1 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A1` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 202 passed | 0 failed | 23 ignored (1s)
- refactor: none needed
- commit: `46441dc`

#### Cycle: A2 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A2` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 203 passed | 0 failed | 22 ignored (1s)
- refactor: none needed
- commit: `367b0e6`

#### Cycle: A3 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A3` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 204 passed | 0 failed | 21 ignored (1s)
- refactor: none needed
- commit: `eb10acb`

#### Cycle: A4 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A4` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 205 passed | 0 failed | 20 ignored (1s)
- refactor: none needed
- commit: `4c92ede`

#### Cycle: A5 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A5` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 206 passed | 0 failed | 19 ignored (1s)
- refactor: none needed
- commit: `23d3c62`

#### Cycle: A6 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A6` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 207 passed | 0 failed | 18 ignored (1s)
- refactor: none needed
- commit: `c8a1cd4`

#### Cycle: A7 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A7` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 208 passed | 0 failed | 17 ignored (1s)
- refactor: none needed
- commit: `17f1a91`

#### Cycle: A8 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A8` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 209 passed | 0 failed | 16 ignored (1s)
- refactor: none needed
- commit: `a4d5ce3`

#### Cycle: A10 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A10` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 210 passed | 0 failed | 15 ignored (1s)
- refactor: none needed
- commit: `fd2d317`

#### Cycle: A11 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A11` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 211 passed | 0 failed | 14 ignored (1s)
- refactor: none needed
- commit: `3c4d089`

#### Cycle: A15 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A15` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 212 passed | 0 failed | 13 ignored (1s)
- refactor: none needed
- commit: `cb463b1`

#### Cycle: A16 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A16` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 213 passed | 0 failed | 12 ignored (1s)
- refactor: none needed
- commit: `0cb9b80`

#### Cycle: A17 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A17` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 214 passed | 0 failed | 11 ignored (1s)
- refactor: none needed
- commit: `132b097`

#### Cycle: A18 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A18` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 215 passed | 0 failed | 10 ignored (1s)
- refactor: none needed
- commit: `25b5048`

#### Cycle: A21 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A21` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 216 passed | 0 failed | 9 ignored (1s)
- refactor: none needed
- commit: `2a7315d`

#### Cycle: A22 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A22` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 217 passed | 0 failed | 8 ignored (1s)
- refactor: none needed
- commit: `48a7367`

#### Cycle: A23 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A23` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 218 passed | 0 failed | 7 ignored (1s)
- refactor: none needed
- commit: `32041e5`

#### Cycle: A24 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A24` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 219 passed | 0 failed | 6 ignored (1s)
- refactor: none needed
- commit: `a954827`

#### Cycle: U182 envelope echoes scalar id

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U182 …` (new)
- red: `deno test … --filter "/^U182 /" tests/` -> `AssertionError: Values are not equal.` (1 failed)
- green: `lib/app.ts` extractJsonRpcId/readBodyText ported from core; fetch made async. Suite -> 191 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `502eae8`
- notes: none

#### Cycle: U183 GET wrong key gets id-null envelope

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U183 …` (new)
- red: passed on first run (behavior already present after U182)
- green: `lib/app.ts` no change. Suite -> 192 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `200b404`
- notes: mutant: id ?? 0 in the envelope -> U183 failed (Values are not equal); restored

#### Cycle: U184 golden equality

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U184 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change. Suite -> 193 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2ea6e5c`
- notes: mutant: Content-Type text/plain -> U184 failed; restored. Golden literal copied from core's unauthorizedResponse (id 7)

#### Cycle: U185 wrong key refused

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U185 …` (new)
- red: passed on first run (every request was refused before the auth check existed)
- green: `lib/app.ts` no change at the time. Suite -> 194 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `96b4721`
- notes: DEVIATION: a mutant was not possible until U186 added the key compare. After U186, mutant removing '|| provided !== accessKey' -> U185 failed (TypeError reading code); restored

#### Cycle: U186 correct key reaches MCP route

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U186 …` (new)
- red: `--filter "/^U186 /"` -> `TypeError: Cannot read properties of undefined (reading 'tools')` (1 failed)
- green: `lib/app.ts` createApp compares header-or-query key with MCP_ACCESS_KEY, serveMcp builds a fresh buildServer + StreamableHTTPTransport per request via Hono; CORS on response. Suite -> 195 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `f5ede72`
- notes: full npm: specifiers for hono and @hono/mcp

#### Cycle: U187 header precedence

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U187 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change. Suite -> 196 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `31e1e96`
- notes: mutant: query ?? header -> U187 failed at 'wrong header + right query'; restored

#### Cycle: U188 and U189 unset key and Supabase headers

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U188, U189 …` (new)
- red: both passed on first run
- green: `lib/app.ts` no change. Suite -> 198 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `0f72b97`
- notes: DEVIATION: two behaviors in one commit. Mutants: '(provided) !== (accessKey || null)' -> U188 failed ('no key'); reading apikey header as a key -> U189 failed. The '!accessKey' guard is redundant with the compare for non-empty provided keys

#### Cycle: U190 Accept patch

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U190 …` (new)
- red: `--filter "/^U190 /"` -> `AssertionError: Values are not equal: accept null` (1 failed)
- green: `lib/app.ts` Accept header patched to application/json, text/event-stream when it lacks text/event-stream. Suite -> 199 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `ba8c9d9`
- notes: none

#### Cycle: U191 no session id, CORS

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U191 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change (the transport sends no mcp-session-id in this configuration, so core's defensive delete is not reproduced). Suite -> 200 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cb6f03f`
- notes: mutant: remove CORS loop -> U191 failed (Access-Control-Allow-Origin); restored. No mutant possible for the session-id header, the transport never emits one

#### Cycle: U192 deps injected into MCP tools

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U192 …` (new)
- red: first run failed on my fixture (config gate: env lacked model settings); test fixed, then passed on first valid run
- green: `lib/app.ts` no change. Suite -> 201 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `60ddf69`
- notes: mutant: stats stubbed to count 0 in buildServer deps -> U192 failed ('Total thoughts: 0'); restored

#### Cycle: U193 productionDeps

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U193 …` (new)
- red: `deno test … --filter "/^U193 /" tests/` -> `Error: not implemented` (1 failed)
- green: `lib/app.ts` productionDeps: getEnv -> Deno.env.get, modelFetch/store fetch -> globalThis.fetch, store from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Suite -> 220 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `b154eb7`

#### Cycle: U194 index.ts one statement

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U194 …` (new)
- red: passed on first run (index.ts was already the one-line entry)
- green: no change. Suite -> 221 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `409f7f6`
- notes: mutant: appended `console.log("x");` to index.ts -> U194 failed (Values are not equal); restored

#### Cycle: U195 no bare import specifier (BLOCKED)

- test: drafted `tests/imports_test.ts::U195` (copy saved at `specs/004-self-hosted-llm/tdd/cycle-log.d/app-U195-imports_test.ts.txt`; not committed, it is red)
- red: `deno test … --filter "/^U195 /" tests/` -> offender `lib/thought_store.ts: @supabase/supabase-js` (1 failed). Negative control assertions pass; the real scan finds one genuine bare import.
- green: BLOCKED. `lib/thought_store.ts:1` (`import { createClient } from "@supabase/supabase-js";`) belongs to another stream/merged work and must become `npm:@supabase/supabase-js@2.47.10` (the version pinned in deno.json). I may not edit that file; integrator must change it, then the test can be committed unchanged.

#### Cycle: A9 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A9` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 224 passed | 0 failed | 5 ignored (1s)
- refactor: none needed
- commit: `8b46b60`

#### Cycle: A12 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A12` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 225 passed | 0 failed | 4 ignored (1s)
- refactor: none needed
- commit: `55980a3`

#### Cycle: A13 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A13` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U197 776df2e). Suite -> ok | 226 passed | 0 failed | 3 ignored (1s)
- refactor: none needed
- commit: `8d308ef`

#### Cycle: A14 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A14` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 227 passed | 0 failed | 2 ignored (1s)
- refactor: none needed
- commit: `ed8a17a`

#### Cycle: A19 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A19` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 228 passed | 0 failed | 1 ignored (1s)
- refactor: none needed
- commit: `c4eb12d`

#### Cycle: A20 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A20` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 229 passed | 0 failed (1s)
- refactor: none needed
- commit: `805b321`

#### Cycle: U196 setup-check 200/503

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U196 …` (new)
- red: `--filter "/^U196 /"` -> `AssertionError: Values are not equal.` (1 failed; the request fell through to the MCP route)
- green: `lib/app.ts` isSetupCheck + jsonResponse; authorized setup-check runs runSetupCheck(deps), 200 if ok else 503. Suite -> 222 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `70ade4e`

#### Cycle: U197 setup-check 401

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U197 …` (new)
- red: `--filter "/^U197 /"` -> `AssertionError: Values are not equal: …/setup-check` (1 failed)
- green: `lib/app.ts` authorized flag; unauthorized setup-check -> 401 `{"error":"Unauthorized: missing or invalid authentication."}` with CORS. Suite -> 223 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `776df2e`

#### Cycle: U198, U199, U200 setup-check key handling

- test: `tests/app_test.ts::U198`, `::U199`, `::U200` (new)
- red: all three passed on first run (the shared `authorized` flag from U197 already covers them)
- green: no change. Suite -> 232 passed, 0 failed, 0 ignored
- refactor: none needed
- commit: `66c6c35`
- notes: DEVIATION: three behaviors in one commit. Mutants, each failing only its test and restored: U198 header-only key source; U199 `provided === (accessKey || null)`; U200 runSetupCheck called before the 401.

#### Cycle: U201 setup-check path matching (sampled)

- test: `tests/app_test.ts::U201` (new)
- red: passed on first run (isSetupCheck from U196 already matches by last segment)
- green: no change
- commit: `8de4015`
- notes: mutants, restored: no trailing-slash trim -> failed at "/fn/setup-check/"; `endsWith("/fn/setup-check")` -> failed at "/setup-check". The test asserts the 401 first so a missed route fails fast (an authorized GET that falls to the MCP route opens an SSE stream and hangs).

#### Cycle: U202 near-miss paths reach the MCP route (sampled)

- test: `tests/app_test.ts::U202` (new)
- red: passed on first run
- green: no change. Suite -> 234 passed, 0 failed
- commit: `dbea45c`
- notes: mutant `includes("setup-check")` -> U202 failed; restored

#### Cycle: U203 and U204 non-setup-check routing

- test: `tests/app_test.ts::U203`, `::U204` (new)
- red: both passed on first run
- green: no change
- commit: `a359bd1` (DEVIATION: two behaviors in one commit)
- notes: mutants, restored: dropping the GET-only condition -> U203 failed; sending every unauthorized request to 401 -> U204 failed ("POST ")

#### Cycle: U205 crashing setup check

- test: `tests/app_test.ts::U205` (new)
- red: `--filter "/^U205 /"` -> `Error: boom with test-key inside` (1 failed; the crash escaped the handler)
- green: `lib/app.ts` try/catch around runSetupCheck -> 500 `{"error":"Setup check failed unexpectedly."}` with CORS. Suite -> 236 passed, 0 failed
- refactor: none needed
- commit: `ae38281`

#### Cycle: U195 no source file outside tests/ uses a bare import specifier (integrator, after merge)

- test: `integrations/self-hosted-llm-mcp/tests/imports_test.ts::U195 …` (new; written by stream A, held uncommitted while red because the offender was outside stream A's files)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U195 /" tests/` (on the integration branch after merging A) -> `AssertionError: Values are not equal.` listing `lib/thought_store.ts: @supabase/supabase-js` (1 failed)
- green: `lib/thought_store.ts:1` import pinned to `npm:@supabase/supabase-js@2.47.10` (same version as `deno.json`). Suite -> 238 passed, 0 failed, 0 ignored; `deno check` clean
- refactor: none needed
- commit: `aa4f940`
- notes: a real FR-014 defect. The self-hosted router applies one shared import map and ignores the function's `deno.json` (research R10), so stream S's bare import would have failed to resolve on self-hosted Supabase while every unit test passed under the local `deno.json`.
