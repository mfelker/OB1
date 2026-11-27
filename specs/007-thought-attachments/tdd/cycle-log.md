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

## Integrator foundation (T008, T009, T011, T012), folded from cycle-log.d/integrator.md

Append only. Newest last. Worktree `W` = `.worktrees/contrib-thought-attachments`, folder `F` = `W/integrations/thought-attachments`, branch `contrib/mfelker/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`.

## Baseline

- suite: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` -> 7 passed, 0 failed (the T010 harness proof)
- commit: `d8e30fe`
- recorded: before T008's first cycle

## T008 settings (`tests/settings_test.ts`, `src/settings.ts`)

Every red below ran `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/` and reported `1 failed`. A "mutant" red means the test passed on its first run, because an earlier cycle had already built the behavior. The implementation was then broken minimally, the test failed as quoted, and the file was restored byte for byte (`git diff --quiet` clean). The restored rerun passed.

## Cycle U1: each documented default applies when its variable is unset

- test: `tests/settings_test.ts::U1 each documented default applies when its variable is unset` (new)
- red: `--filter "/^U1 /"` -> `error: Error: not implemented` (1 failed)
- green: `loadSettings` returns the defaults (constants). Suite -> 8 passed, 0 failed
- refactor: none
- commit: `075dcf3`

## Cycle U2: a set variable overrides its default

- test: `U2 a set variable overrides its default` (new)
- red: `--filter "/^U2 /"` -> `AssertionError: Values are not equal.` `- attachmentsBucket: "ob1-files", - maxPdfPages: 50, + attachmentsBucket: "files", + maxPdfPages: 30,` (1 failed)
- green: `text(name, fallback)` and `num(name, fallback)` read the environment. Suite -> 9 passed
- refactor: none
- commit: `104a25b`

## Cycle U3: with EMBEDDING_API_KEY unset the embedding key is OPENROUTER_API_KEY

- test: `U3 with EMBEDDING_API_KEY unset the embedding key is OPENROUTER_API_KEY` (new)
- red: `--filter "/^U3 /"` -> `- undefined + "test-openrouter-key-placeholder"` (1 failed)
- green: `?? getEnv("OPENROUTER_API_KEY")`. Suite -> 10 passed
- refactor: none
- commit: `ceb76d7`

## Cycle U4: with both set EMBEDDING_API_KEY wins

- test: `U4 with both set EMBEDDING_API_KEY wins over OPENROUTER_API_KEY` (new)
- red: first run passed (U3's `??` order already gives it). Mutant: swapped the fallback order -> `- test-openrouter-key-placeholder + test-embedding-key-placeholder` (1 failed); restored
- green: no production change. Suite -> 11 passed
- refactor: none
- commit: `42978a3`

## Cycle U5: with PUBLIC_BASE_URL unset the public base is SUPABASE_PUBLIC_URL

- test: `U5 with PUBLIC_BASE_URL unset the public base is SUPABASE_PUBLIC_URL` (new)
- red: `--filter "/^U5 /"` -> `- (empty string) + http://192.168.1.20:8000` (1 failed)
- green: `?? getEnv("SUPABASE_PUBLIC_URL")`. Suite -> 12 passed
- refactor: none
- commit: `d4f6b2b`

## Cycle U6: with PUBLIC_BASE_URL and SUPABASE_PUBLIC_URL unset the public base is SUPABASE_URL

- test: `U6 with PUBLIC_BASE_URL and SUPABASE_PUBLIC_URL unset the public base is SUPABASE_URL` (new)
- red: `--filter "/^U6 /"` -> `- (empty string) + http://supabase.internal:8000` (1 failed)
- green: `?? getEnv("SUPABASE_URL")`. Suite -> 13 passed
- refactor: none
- commit: `c9ab99a`

## Cycle U7: a set PUBLIC_BASE_URL wins over both fallbacks

- test: `U7 a set PUBLIC_BASE_URL wins over both fallbacks` (new)
- red: first run passed. Mutant: `SUPABASE_PUBLIC_URL` read before `PUBLIC_BASE_URL` -> `- http://192.168.1.20:8000 + https://brain.example.test` (1 failed); restored
- green: no production change. Suite -> 14 passed
- refactor: none
- commit: `d77a8a0`

## Cycle U8: with MCP_ACCESS_KEY unset the result is not ok, naming MCP_ACCESS_KEY

- test: `U8 with MCP_ACCESS_KEY unset the result is not ok, with a problem naming MCP_ACCESS_KEY` (new)
- red: `--filter "/^U8 /"` -> `error: Error: expected settings problems, got ok settings` (1 failed)
- green: an unset key returns `{ ok: false, problems: [{ setting: "MCP_ACCESS_KEY", reason: "must be set" }] }`. Suite -> 15 passed
- refactor: none
- commit: `07136c5`

## Cycle U9: with VISION_API_BASE or VISION_MODEL unset (each alone) vision is not configured

- test: `U9 with VISION_API_BASE or VISION_MODEL unset (each alone) vision is not configured` (new). "Not configured" at the settings level means all three vision fields are undefined, so no consumer sees half a configuration
- red: `--filter "/^U9 /"` -> `- key: "test-vision-key-placeholder", - model: "test/vision-model", + key: undefined, + model: undefined,` (1 failed)
- green: vision fields kept only when both `VISION_API_BASE` and `VISION_MODEL` are set. Suite -> 16 passed
- refactor: none
- commit: `f6b2e29`

## Cycle U10: with VISION_API_BASE and VISION_MODEL set and VISION_API_KEY unset vision is configured

- test: `U10 with VISION_API_BASE and VISION_MODEL set and VISION_API_KEY unset vision is configured` (new)
- red: first run passed. Mutant: the vision condition also required `VISION_API_KEY` -> `- base: undefined, + base: "http://vision.test/v1", - model: undefined, + model: "test/vision-model",` (1 failed); restored
- green: no production change. Suite -> 17 passed
- refactor: none
- commit: `c836484`

## Cycle U12: a set BUSY_SECONDS is used as given

- test: `U12 a set BUSY_SECONDS is used as given` (new)
- red: `--filter "/^U12 /"` -> `- 410 + 160` (1 failed)
- green: `busySeconds: num("BUSY_SECONDS", 410)`. Suite -> 18 passed
- refactor: none
- commit: `afa300b`

## Cycle U13: with BUSY_SECONDS unset the busy expiry is 410 seconds on every platform

- test: `U13 with BUSY_SECONDS unset the busy expiry is 410 seconds on every platform` (new; baseline env and a `*.supabase.co` `SUPABASE_URL`)
- red: first run passed. Mutant: default 160 when `SUPABASE_URL` contains `.supabase.co` -> `- 160, + 410,` (1 failed); restored
- green: no production change. Suite -> 19 passed
- refactor: none
- commit: `b88046b`

## Cycle U15: a set UPLOAD_PAGE_URL is used as given

- test: `U15 a set UPLOAD_PAGE_URL is used as given` (new)
- red: first run passed (U1's stub read it). Mutant: `uploadPageUrl: ""` -> `- (empty string) + https://pages.example.test/ob1/upload-page.html` (1 failed); restored
- green: no production change. Suite -> 20 passed
- refactor: none
- commit: `bd1ada8`

## Cycle U16: with UPLOAD_PAGE_URL unset the page address is the public base plus the function's upload path

- test: `U16 with UPLOAD_PAGE_URL unset the page address is the public base plus the function's upload path` (new)
- red: `--filter "/^U16 /"` -> `- (empty string) + https://brain.example/functions/v1/thought-attachments/upload` (1 failed)
- green: default `` `${publicBaseUrl}/functions/v1/thought-attachments/upload` ``. Suite -> 21 passed
- refactor: none
- commit: `673e159`

## Cycle U17: a non-numeric value for a numeric setting is a named problem

- test: `U17 a non-numeric value for a numeric setting is a problem naming it and what it must be` (new)
- red: `--filter "/^U17 /"` -> `error: Error: expected settings problems, got ok settings` (1 failed)
- green: `num` records `{ setting, reason: "must be a positive whole number" }` for NaN; problems are collected and returned together. Suite -> 22 passed
- refactor: the early `MCP_ACCESS_KEY` return folded into the same problems list (suite green)
- commit: `bdfee0b`

## Cycle U18: a zero or negative value for a whole-number setting is a named problem

- test: `U18 a zero or negative value for a whole-number setting is a problem naming it` (new)
- red: `--filter "/^U18 /"` -> `error: Error: expected settings problems, got ok settings` (1 failed)
- green: `|| n <= 0`. Suite -> 23 passed
- refactor: none
- commit: `710e13e`

## Cycle U19: a decimal MB cap is accepted as given

- test: `U19 a decimal MB cap is accepted as given` (new)
- red: first run passed (nothing checked wholeness yet). Mutant: `Math.trunc(Number(raw))` -> `- 2 + 2.5` (1 failed); restored
- green: no production change. Suite -> 24 passed
- refactor: none
- commit: `5e7dbf9`

## Cycle U308: a decimal value for a whole-number setting is a named problem

- test: `U308 a decimal value for a whole-number setting is a problem naming it` (new)
- red: `--filter "/^U308 /"` -> `error: Error: expected settings problems, got ok settings` (1 failed)
- green: `num(name, fallback, decimals = false)` refuses non-integers unless `decimals`; the two MB caps pass `true`. Suite -> 25 passed
- refactor: none
- commit: `b48d90c`

## Cycle U309: a non-numeric, zero or negative MB cap is a named problem saying what it must be

- test: `U309 a non-numeric, zero or negative MB cap is a problem naming it and what it must be` (new)
- red: `--filter "/^U309 /"` -> `- reason: "must be a positive whole number", + reason: "must be a positive number",` (x3) (1 failed)
- green: the reason is `"must be a positive number"` for the decimal caps. Suite -> 26 passed
- refactor: none
- commit: `1f754bf`

## Cycle U310: each other numeric setting set to abc is a named problem

- test: `U310 each other numeric setting set to abc is a problem naming it` (new)
- red: first run passed (every numeric goes through `num`). Mutant: `embeddingBatchSize: Number(getEnv("EMBEDDING_BATCH_SIZE") ?? 64)` -> `error: Error: expected settings problems, got ok settings` (1 failed); restored
- green: no production change. Suite -> 27 passed
- refactor: none
- commit: `03006e1`

## Cycle U11: no setting's value appears in any problem's reason

- test: `U11 no setting's value appears in any problem's reason` (new; run after U17–U310 so there are value problems to check: `MCP_ACCESS_KEY` unset and all nine numerics invalid, 10 problems)
- red: first run passed. Mutant: the whole-number reason became `` `must be a positive whole number, not ${raw}` `` -> `- [ "EMBEDDING_BATCH_SIZE: badembedding_batch_size", … "BUSY_SECONDS: badbusy_seconds", ] + []` (1 failed); restored
- green: no production change. Suite -> 28 passed
- refactor: reviewed `src/settings.ts` as a whole; no change. `deno check` clean. `deno lint` flags only `no-import-prefix`, which the Seams rule (full specifiers) requires
- commit: `625cef3`
- note: U14 is DROPPED in the test list and has no test

## T009 links (`tests/links_test.ts`, `src/links.ts`)

## Cycle U20: publicUrl replaces a signed link's internal origin with PUBLIC_BASE_URL and keeps its path and query

- test: `tests/links_test.ts::U20 publicUrl replaces a signed link's internal origin with PUBLIC_BASE_URL and keeps its path and query` (new; the path and query carry `%20`, `%2B`, `.`, `-` and `_`)
- red: `--filter "/^U20 /"` -> `error: Error: not implemented` (1 failed)
- green: `publicUrl` = `settings.publicBaseUrl` + the link after its own origin, character for character. Suite -> 29 passed
- refactor: removed an untested trailing-slash strip I had added to the green (suite 29 passed, commit `88b5d1a`)
- commit: `8ec898b` (behavior), `88b5d1a` (structure)
- note: `Settings` has no `SUPABASE_URL` field, so "the internal origin" is read as "the link's own origin" (signed links only ever come from the store's Supabase origin). No seam change needed

## Cycle U21: publicUrl returns the link unchanged when PUBLIC_BASE_URL is already its origin

- test: `U21 publicUrl returns the link unchanged when PUBLIC_BASE_URL is already its origin` (new; Cloud `*.supabase.co`, public base from the `SUPABASE_URL` fallback)
- red: first run passed. Mutant: `settings.publicBaseUrl + "/" + rest` -> `- https://abcdefghijklmnop.supabase.co//storage/v1/object/upload/sign/… + https://abcdefghijklmnop.supabase.co/storage/v1/object/upload/sign/…` (1 failed); restored
- green: no production change. Suite -> 30 passed
- refactor: none
- commit: `8f35c10`

## Cycle U22: pageLink is UPLOAD_PAGE_URL + #t= + the token, with the token nowhere before the `#`

- test: `U22 pageLink is UPLOAD_PAGE_URL then #t= then the token, with the token nowhere before the #` (new)
- red: `--filter "/^U22 /"` -> `error: Error: not implemented` (1 failed)
- green: `` `${settings.uploadPageUrl}#t=${token}` ``. Suite -> 31 passed
- refactor: none
- commit: `45a63d3`

## Cycle U23: curlLine is a PUT to the upload URL carrying every returned header and the given file path

- test: `U23 curlLine is a PUT to the upload URL carrying every returned header and the given file path` (new; the path has a space and a `'`)
- red: `--filter "/^U23 /"` -> `error: Error: not implemented` (1 failed)
- green: `curl -X PUT -H '<k>: <v>'… -T '<path>' '<url>'`, every word POSIX single-quoted (`'` as `'\''`). Suite -> 32 passed
- refactor: none
- commit: `5ceb5cd`

## Cycle U24: curlLine contains neither the MCP access key nor the service-role key

- test: `U24 curlLine contains neither the MCP access key nor the service-role key` (new; puts the placeholder keys in the process environment, as production has them, and restores it after)
- red: first run passed (`curlLine` never receives settings). Mutant: an added `-H 'authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY from Deno.env>'` -> `- [ "test-service-role-key-placeholder", ] + []` (1 failed); restored
- green: no production change. Suite -> 33 passed
- refactor: `deno fmt --line-width 120` on the test file (suite 33 passed, commit `3dff057`)
- commit: `d552df7` (behavior), `3dff057` (structure)

## T011 fake-store self-tests (`tests/helpers/fake_store_test.ts`; subject `tests/helpers/fake_store.ts`, already written in T007)

The subject existed before these tests, so every test passed on its first run, as expected. The red evidence for each is a deliberate mutant in `tests/helpers/fake_store.ts`: one exact snippet replaced, the single test run (`1 failed`), then the original bytes written back. A sha256 compare and `git diff --quiet` confirmed the restore, and the rerun passed. No fake-store bug was found: every rule matched data-model.md, R9, R10, R16 and R17, so `fake_store.ts` is unchanged. One U25 mutant attempt (`if (false) {`) failed type-checking (`error: Type checking failed.`), which is not a valid red, so it was replaced by the type-safe mutant below.

## Cycle U25: a claim while another unexpired claim exists returns busy naming the holder's operation

- test: `U25 a claim while another unexpired claim exists returns busy naming the holder's operation` (new; second claim at BUSY_SECONDS − 1)
- red: mutant: claim's busy test `getTime() > now` became `> now + 1e12` (never busy) -> `- token: "claim-2", + busy: "finish",` (1 failed); restored
- green: no change. Suite -> 34 passed
- refactor: none
- commit: `aa3e3c1`

## Cycle U26: a claim after the holder's expiry, by the injected clock, succeeds with a new token

- test: `U26 a claim after the holder's expiry by the injected clock succeeds with a new token` (new; exactly BUSY_SECONDS later)
- red: mutant: `getTime() > now` became `>= now` (the expiry instant still busy) -> `Values are not equal: got {"busy":"finish"}` (1 failed); restored
- green: no change. Suite -> 35 passed
- refactor: none
- commit: `da74422`

## Cycle U27: writeDerived or setState with a stale or foreign claim token returns an error and changes nothing

- test: `U27 writeDerived or setState with a stale or foreign claim token returns an error and changes nothing` (new)
- red: mutant: `checkClaim` only required `busy_until !== null` (token and expiry ignored) -> `- derived_count: 1, + derived_count: 0, … - state: "failed", + state: "pending_upload", … - false, ×4 + true, ×4` (1 failed); restored
- green: no change. Suite -> 36 passed
- refactor: none
- commit: `713d085`

## Cycle U28: writeDerived failing partway leaves the previous derived set and state unchanged

- test: `U28 writeDerived failing partway leaves the previous derived set and state unchanged` (new; `failDerivedAfter = 1` on a 3-row rebuild over a 2-row set)
- red: mutant: `transaction` no longer restored thoughts and attachments on error -> `+ content: "From manual.pdf, page 1 (attachment a0000001)\nStep 1.", - content: "From manual.pdf, page 3 (attachment a0000001)\nStep 3.",` (1 failed); restored
- green: no change. Suite -> 37 passed
- refactor: none
- commit: `30f3ab8`

## Cycle U29: a derived row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged

- test: `U29 a writeDerived row whose fingerprint equals an existing thought's returns an error and leaves that thought unchanged` (new; the owner thought differs only in case and spacing, so it also exercises upsert_thought's normalisation)
- red: mutant: on a fingerprint clash the row merged into the existing thought instead of raising -> `- derived: 1, - failed: false, + derived: 0, + failed: true, - attachment_id: "a0000001-…", + attachment_id: null,` (1 failed); restored
- green: no change. Suite -> 38 passed
- refactor: none
- commit: `362a6f7`

## Cycle U30: removeAttachment removes only that attachment's derived thoughts and its row

- test: `U30 removeAttachment removes only that attachment's derived thoughts and its row` (new; a second processed attachment on the same parent and an owner thought must survive)
- red: mutant: removal kept only thoughts with `attachment_id === null` (every attachment's derived thoughts deleted) -> `+ attachment_id: "a0000002-…", + content: "From shelf.jpg, photo (attachment a0000002)\nA grey shelf.",` (1 failed); restored
- green: no change. Suite -> 39 passed
- refactor: dropped a redundant second assertion before the commit (the owner thought is already in the kept set)
- commit: `8289885`

## Cycle U31: removeAttachment removes the parent note only under FR-016's exception

- test: `U31 removeAttachment removes the parent note only under FR-016's exception` (new; created-here + refused + alone removes it; processed, a sibling attachment, or not created here keep it)
- red: mutant: `noteWouldGo` ignored whether the attachment ended (`(ended || true)`) -> `- noteRemoved: true, - noteStored: false, + noteRemoved: false, + noteStored: true,` (1 failed); restored
- green: no change. Suite -> 40 passed
- refactor: none
- commit: `b1bc983`

## Cycle U32: orphans lists a gone parent, an expired pending_upload and a refused row, each with why

- test: `U32 orphans lists a row whose parent is gone, an expired pending_upload row and a refused row, each with why` (new; two unexpired pending rows must not be listed)
- red: mutant: the upload-expired branch dropped its deadline test -> `- id: "a0000001-…", - why: "upload_expired", … - id: "a0000005-…", - why: "upload_expired",` (1 failed); restored
- green: no change. Suite -> 41 passed
- refactor: none
- commit: `d31a423`

## Cycle U33: insertNote with an existing fingerprint returns that thought's id with created false and leaves it unchanged

- test: `U33 insertNote with a fingerprint that already exists returns that thought's id with created false and leaves it unchanged` (new; the note differs only in case and spacing)
- red: mutant: on a match, the existing thought's metadata was overwritten and a new row inserted -> `- count: 2, + count: 1, - metadata: { type: "observation" }, + metadata: {}, - created: true, + created: false,` (1 failed); restored
- green: no change. Suite -> 42 passed
- refactor: none
- commit: `ee8cbfb`

## Cycle U311: findPending returns a matching pending_upload whose deadline is one second after now

- test: `U311 findPending returns a matching pending_upload whose deadline is one second after now` (new)
- red: mutant: `> now.getTime()` became `> now.getTime() + 1000` -> `- undefined + "a0000001-0000-4000-8000-000000000000"` (1 failed); restored
- green: no change. Suite -> 43 passed
- refactor: none
- commit: `2cd3ae1`

## Cycle U312: findPending returns null for such a row whose deadline is one second before now

- test: `U312 findPending returns null for such a row whose deadline is one second before now` (new)
- red: mutant: `> now.getTime()` became `> now.getTime() - 5000` (a grace window) -> `- { actual_size: null, … file_name: "manual.pdf", id: "a0000001-…", … } + null` (1 failed); restored
- green: no change. Suite -> 44 passed
- refactor: none
- commit: `9bf93d5`

## Cycle U313: findByHash returns a non-refused attachment on that parent with that hash, and null when the only match is refused or on another parent

- test: `U313 findByHash returns … and null when the only match is refused or on another parent` (new)
- red: mutant 1: the `state !== "refused"` filter dropped -> `- { … content_hash: "sha256:cdcd…", id: "a0000002-…", … } + null` (1 failed); mutant 2: the parent filter dropped -> `- id: "a0000003-…"` (1 failed); both restored
- green: no change. Suite -> 45 passed
- refactor: `deno fmt --line-width 120` on the test file, as its own commit (suite 45 passed, `2d563e2`)
- commit: `b4b37c4` (behavior), `2d563e2` (structure)

## T012 outer loop: acceptance todos (`tests/acceptance_test.ts`)

- test file: `tests/acceptance_test.ts` (new), 63 `todo("A<n> …")` tests, A1–A63, each exactly once (checked). Each test drives `createApp({ ok: true, deps })` (A54: `createApp({ ok: false, problems })` from `loadSettings` with `MAX_PDF_PAGES=abc`) via `app.fetch`: the MCP route through `tests/helpers/mcp.ts`, and the page routes by direct `POST <FUNCTION_URL>/page/<route>`. Deps are `FakeStore`, the real `createEmbeddingClient`/`createVisionClient` over `FakeFetch` (`<EMBEDDING_API_BASE>/embeddings`, `<VISION_API_BASE>/chat/completions`), `loadSettings(envGetter(…))` and the fake `Clock`. `deno check` is clean.
- red: `RUN_TODO=1 deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/acceptance_test.ts` -> `FAILED | 0 passed | 63 failed`. Every test fails at the first stub the composed world reaches. 62 build the world, where settings and the fakes load without error, then reach `createEmbeddingClient`. A54 reaches `createApp`. None errors in its own setup.
- default run: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` -> `ok | 45 passed | 0 failed | 63 ignored`
- commit: `a5b1c87` (`[integrations] Acceptance tests as todo (T012)`)
- note: today every red is the same `not implemented`, so it can't tell the tests apart. Stream A's flip commits are where each test's own assertions first meet real code.

Lines are from the whole-file `RUN_TODO=1` run. Spot checks with `--filter "/^<id> /"` for A1, A54 and A63 each report `0 passed | 1 failed | 107 filtered out`.

| id | decisive red line |
| -- | -- |
| A1 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A2 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A3 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A4 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A5 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A6 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A7 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A8 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A9 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A10 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A11 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A12 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A13 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A14 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A15 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A16 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A17 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A18 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A19 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A20 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A21 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A22 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A23 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A24 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A25 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A26 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A27 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A28 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A29 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A30 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A31 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A32 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A33 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A34 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A35 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A36 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A37 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A38 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A39 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A40 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A41 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A42 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A43 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A44 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A45 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A46 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A47 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A48 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A49 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A50 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A51 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A52 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A53 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A54 | `Error: not implemented` at `createApp` (src/app.ts:6) |
| A55 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A56 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A57 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A58 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A59 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A60 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A61 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A62 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |
| A63 | `Error: not implemented` at `createEmbeddingClient` (src/embeddings.ts:5) |

## Notes and deviations (integrator stream, T008–T012)

- No seam problem. `src/types.ts` is unchanged.
- No fake-store bug found (T011). `tests/helpers/fake_store.ts` is unchanged.
- `deno lint` reports `no-import-prefix` on every test file's `jsr:` import. The Seams rule requires full specifiers, and the existing helpers already use them, so I left it.
- Choices the contracts left open. Each is recorded here for a decision on the test list:
  1. Settings problem reasons are `"must be set"` (`MCP_ACCESS_KEY`), `"must be a positive whole number"` and `"must be a positive number"` (the MB caps). The app's message is `setting <NAME> is invalid: <reason>`, which gives contracts/settings.md's example exactly.
  2. `loadSettings` treats only an unset `MCP_ACCESS_KEY` as missing, not an empty one. Suggested new row: an empty `MCP_ACCESS_KEY` is a problem. Otherwise an empty `?key=` could match an empty key.
  3. With both `VISION_API_BASE` and `VISION_MODEL` needed for vision, a half-set pair clears all three vision fields (U9).
  4. `publicUrl` swaps the link's own origin for `PUBLIC_BASE_URL`, because `Settings` has no `SUPABASE_URL` field. A trailing `/` on `PUBLIC_BASE_URL` (or on the base used for `UPLOAD_PAGE_URL`'s default) is not stripped, because no row asks for it. Suggested new row if wanted.
  5. `curlLine` shape: `curl -X PUT -H '<k>: <v>'… -T '<path>' '<url>'`, POSIX single-quoted.
  6. The acceptance tests read keys the contracts name, and look up by value where they don't: the short id, the curl line (any string starting with `curl` and a space), a page route's upload link (any string holding `/storage/v1/object/upload/sign/`), records in list and orphan results. Message checks use regexes on the contract wording: "share it as JPEG", "no file uploaded yet", "upload window expired", "already attached to this thought as <short>", "the run did not finish", `busy.*finishing`, "text search won't cover it yet", "expired or was already used", "background". Where the contract gives no exact wording, I picked one, and the integrator should confirm it before stream A flips:
     - A59: the conflict reason matches `/conflict|already exists|same text|identical/i`;
     - A22: the not-captioned reason contains `500`;
     - A27: the lifetime is stated as `600 seconds` or `10 minutes`;
     - A30 and A63: the limit is in MB or bytes, the declared size in bytes;
     - A47: the preview says `<N> derived`;
     - A10: the MCP authorization error is the core's JSON-RPC `-32001` (INV-4).
  7. A17 asserts the share-as-JPEG message but not the phone steps' wording, which no contract fixes.

## Cycle U355: an empty or blank MCP_ACCESS_KEY counts as unset (integrator, after review)

- test: `tests/settings_test.ts::U355 …` (new). Found in the T008 review: an empty key was accepted, and a caller sending an empty key could then match it (FR-018).
- red: `--filter "/^U355 /"` → `Error: expected settings problems, got ok settings` (1 failed)
- green: a blank `MCP_ACCESS_KEY` is treated as undefined. Suite → 46 passed, 63 ignored
- refactor: none
- commit: `6348e35`

## Cycle U356: a trailing slash on PUBLIC_BASE_URL is dropped (integrator, after review)

- test: `tests/settings_test.ts::U356 …` (new)
- red: `--filter "/^U356 /"` → `- page: "https://brain.example//functions/v1/thought-attachments/upload"` / `+ page: "https://brain.example/functions/v1/thought-attachments/upload"` (1 failed)
- green: trailing slashes are stripped from the public base. Suite → 47 passed, 63 ignored
- refactor: none
- commit: `34dd206`

## Stream D merged (README; docs-only, exempt from unit tests)

- Tasks T034, T047, T052, T060 and T066 are in commits `9d49573`, `adb494b`, `49aef8f`, `8d8e32e` and `52dc8ce`, merged into W at `798e78a`. Only `README.md` changed. markdownlint reports 0 issues. The suite is unchanged at 47 passed, 63 ignored.
- Open for T073:
  - the link `../../recipes/self-hosted-supabase-mcp/` resolves on fork `main` (spec 006) but not on `upstream/main` until 006 lands upstream, so upstream's link check will flag it;
  - the README mentions fork issue 26 only generically (it is resumable or background processing, R1);
  - the self-hosted override (`env_file`) is not live-tested.

## Stream E merged: embedding and vision clients (merge `a701ec0`), folded from cycle-log.d/e.md

Append only. Worktree `.worktrees/ta-models`, branch `contrib/mfelker/thought-attachments-models`, folder `F` = `.worktrees/ta-models/integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red below reported `1 failed`; every green `1 passed`. Suite counts are `N passed, 0 failed, 63 ignored` (the ignored ones are the acceptance todos). Baseline before the first cycle: 48 passed.

Refactor: none unless noted. Red lines are the decisive line of the single-test run.

## T024 embeddings (`tests/embeddings_test.ts`, `src/embeddings.ts`)

## Cycle U161: embed posts the model and an array input

- red: `error: Error: not implemented` (stub). Commit `2b97f67`. Suite 49 passed.
- green: one POST to `<base>/embeddings`, body `{ model, input }`.

## Cycle U162: 64 texts in one request

- first run PASSED (single request already).
- mutant: `input: texts.slice(0, 63)` -> `1 failed` (input length 63 vs 64). Restored byte for byte (`git diff` clean), rerun `1 passed`. Commit `795c722`.

## Cycle U163: 65 texts in two requests (64, 1)

- red: `AssertionError: Values are not equal.` `- 65` vs `+ 64, + 1`.
- green: sequential loop over `embeddingBatchSize` slices. Suite 50 passed. Commit `4b2c0df`.

## Cycle U164: batch size 1, one text per request

- first run PASSED (generic loop).
- mutant: `i += size + 1` -> `1 failed` (text 1 skipped from the recorded inputs). Restored, `1 passed`. Commit `4a8c074`.

## Cycle U165: bearer key on every request

- red: `AssertionError: - undefined + "Bearer test-embedding-key-placeholder"`.
- green: `authorization` header from `embeddingApiKey` when set. Suite 52 passed. Commit `bf6eea0`.

## Cycle U166: vectors in input order across batches

- first run PASSED (compared to `vectorFor` per text over batch size 2 and 5 texts).
- mutant: `vectors.unshift(...)` for `vectors.push(...)` -> `1 failed`. Restored, `1 passed`. Commit `dab2513`.

## Cycle U167: unreachable endpoint

- red: `error: TypeError: connection refused`.
- green: try/catch around fetch returns `R` error `embedding endpoint <base> is unreachable: ...`; `embedBatch` returns `R`. Suite 54 passed. Commit `02c710f`.

## Cycle U168: non-2xx status

- red: `error: SyntaxError: Unexpected token 'u', "upstream down" is not valid JSON`.
- green: `!response.ok` returns `embedding endpoint answered HTTP <status>: <body, 300 chars>`. Suite 55 passed. Commit `ac18f84`.

## Cycle U169: malformed body

- test loops over three bodies: no `data`, non-JSON text, one vector for two inputs.
- red: `error: TypeError: Cannot read properties of undefined (reading 'map')`.
- green: guarded parse, count and shape check, reason `... sent a malformed reply ...`. Suite 56 passed. Commit `4cd9c9b`.

## Cycle U170: a later batch fails the whole call

- first run PASSED (`embed` already returns the batch error).
- mutant: on error return `{ ...batch, data: vectors }` (partial vectors) -> `1 failed`. Restored, `1 passed`. Commit `be95750`.

## Cycle U171: key redacted from an error body

- red: `AssertionError: embedding endpoint answered HTTP 401: invalid api key test-embedding-key-placeholder for this account`.
- green: `redact()` over the unreachable message and the body. Suite 58 passed. Commit `1fef04a`.
- refactor: redact the whole body before truncating to 300 characters, so a key cut by the slice can't leak (commit `2d5f132`, suite 58 passed).

## T037 vision (`tests/vision_test.ts`, `src/vision.ts`)

## Cycle U172: configured

- red: `error: Error: not implemented`.
- green: `configured = Boolean(visionApiBase && visionModel)`; `caption` still throws. Suite 59 passed. Commit `7c86fb4`.

## Cycle U173: request shape and data URL of the real type

- red: `error: Error: not implemented` (`caption`).
- green: POST `<base>/chat/completions`, `model`, one user message with a text part and an `image_url` part `data:<type>;base64,<jsr:@std/encoding base64>`. Suite 60 passed. Commit `0c57364`. The test sends `image/png` bytes so a hard-coded JPEG type would fail.

## Cycle U174: prompt content

- red: `AssertionError: Expected actual: "describe this image." to contain: "objects".`
- green: prompt names visible objects, places, labels and text. Suite 61 passed. Commit `47cad45`.

## Cycle U175: bearer key when set

- red: `AssertionError: Values are not equal.` (header undefined).
- green: header from `visionApiKey` when set. Suite 62 passed. Commit `7b4508d`.

## Cycle U176: no Authorization when the key is unset

- first run PASSED.
- mutant: `settings.visionApiKey ? ...` -> `true ? ...` -> `1 failed`. Restored, `1 passed`. Commit `fc2a7c9`.

## Cycle U177: caption text and model

- red: `- text: "  a red door with a brass 14  "` vs `+ text: "a red door with a brass 14"` (caption is trimmed).
- green: `String(content).trim()`; model is the configured `VISION_MODEL` (the one the request named). Suite 64 passed. Commit `ad076d8`.

## Cycle U178: unreachable endpoint

- red: `error: TypeError: connection refused`.
- green: try/catch, reason `vision endpoint <base> is unreachable: ...`. Suite 65 passed. Commit `129f246`.

## Cycle U179: non-2xx status

- red: `error: SyntaxError: Unexpected token 'b', "bad gateway" is not valid JSON`.
- green: `!response.ok` returns `... answered HTTP <status>: ...`. Suite 66 passed. Commit `353c740`.

## Cycle U180: empty or whitespace caption

- test loops over `""`, whitespace and `choices: []`.
- red: `AssertionError: expected an error for {... "content":""}`.
- green: guarded parse, empty text returns `vision endpoint returned an empty caption`. Suite 67 passed. Commit `4446c6f`.

## Cycle U181: key redacted

- test covers a 401 body and a network error message that contain the key.
- red: `AssertionError: vision endpoint answered HTTP 401: invalid api key test-vision-key-placeholder for this account`.
- green: `redact()` on the body and the unreachable message. Suite 68 passed, 0 failed.
- process note: I first committed after a `deno fmt` run without re-running the suite, and the network-error half was still red (my string replace missed the already-reformatted line). I fixed it and amended that local, unpushed commit before any other work, so the final commit `bf238f7` is green. The same commit includes `deno fmt` reformatting of the four owned files.

### Integrator verification of stream E

- Suite green at all 22 commits (throwaway worktree, fork-ci flags).
- Only its 4 owned files changed, and every commit has its trailers.
- The U172 red was replayed at its parent commit: `error: Error: not implemented`, the same as the log. Note: the first cycle on each stubbed function (U161, U172, U173) records a stub-throw red. The test reached the missing behavior, but that is weaker than an assertion failure, and the cold audit may grade it so.
- The U176 mutant was re-applied on the final code (`...(true` at `src/vision.ts:31`): U176 fails. Restored byte for byte, and the tree is clean.
- The U181 slip (committed before re-running the suite, then amended locally) was fixed before the merge; the final commit `bf238f7` is green.

## Stream X merged: intake, PDF, passages, derived content (merge `bf285d9`), folded from cycle-log.d/x.md

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-files`, branch `contrib/mfelker/thought-attachments-files`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red below reported `1 failed`, and every green `1 passed`. Suite counts are `N passed, 0 failed` (the `63 ignored` are the integrator's todo acceptance tests). A "mutant" red means the test passed on its first run; the code was then broken minimally, the test failed as quoted, and the file was restored byte for byte (`cmp` clean).

Contract gaps found (see the final report): refusal `code` values are not defined by any contract, so intake uses `unsupported_type`, `too_large`, `heic`, `wrong_type`, `wrong_size`, `too_many_pages`. `checkActual` has no page-count input in the seam, so it reads `row.page_count` (null: not yet known, check skipped); the finisher must set it before calling.

Cycle baseline: suite 48 passed at `34dd206`.

## T020, T035, T053: `src/intake.ts`, `tests/intake_test.ts`

## Cycle U113: baseName drops POSIX directory parts

- test: `tests/intake_test.ts::U113 baseName drops POSIX directory parts` (new)
- red: `error: Error: not implemented` (1 failed)
- green: `name.split("/").pop()`. Suite 48 passed
- refactor: none
- commit: `5a206fe`

## Cycle U114: baseName drops Windows directory parts and the drive

- red: `-   C:\\Users\\a\\manual.pdf` / `+   manual.pdf` (AssertionError, 1 failed)
- green: split on `/[\\/]/`. Suite 49 passed
- commit: `515e238`

## Cycle U115: baseName removes control characters

- red: `-   man ual\n` / `-   \t.pdf` / `+   manual.pdf` (1 failed)
- green: strip `[\u0000-\u001f\u007f]`. Suite 50 passed
- commit: `4a0d481`

## Cycle U116: checkDeclared accepts each accepted type within its cap

- red: `error: Error: not implemented` (1 failed)
- green: `checkDeclared` returns null. Suite 51 passed
- commit: `01f52e6`

## Cycle U117: checkDeclared refuses other types, naming the accepted types

- red: `error: AssertionError` (`assert(refusal !== null)`, 1 failed)
- green: `ACCEPTED` list check, code `unsupported_type`. Suite 52 passed
- commit: `293ef7c`

## Cycle U119: an image one byte over the cap is refused, naming cap and declared size

- red: `error: AssertionError` (`assert(refusal !== null)`, 1 failed)
- green: `cap = floor(MB * 1024 * 1024)`; `too_large` message names both. Suite 53 passed
- commit: `393c5f1`

## Cycle U118: an image declared at exactly the image cap is accepted

- first run: passed. Mutant: `decl.size > cap` to `>=` -> `Values are not equal. -   { -     code: "too_large",` (1 failed). Restored, cmp clean.
- commit: `668524a`. Suite 54 passed

## Cycles U120, U121, U320: PDF cap boundary, PDF over cap, decimal MAX_IMAGE_MB (one commit, a process slip: three tests committed together)

- tests: three new tests; all three passed on first run
- mutants: PDF cap taken from `maxImageMb` -> U120 `Values are not equal. -   {`; U121 `Expected actual: "The file is 26214401 bytes, over the cap of 10485760 bytes." to contain: "26214400".` MB base `1024 * 1024` to `1000 * 1000` -> U320 `Values are not equal. -   { -     code: "too_large",`. Each restored, cmp clean.
- commit: `172b106`. Suite 57 passed

## Cycle U141: a HEIC declared type is refused with share-as-JPEG steps

- red: `-   unsupported_type` / `+   heic` (1 failed)
- green: `HEIC_REFUSAL` (names iPhone and Android steps) before the type check. Suite 58 passed
- commit: `301a212`

## Cycle U142: a .heic or .heif file name is refused whatever the declared type

- red: `error: AssertionError: a.heic` (1 failed)
- green: name regex `/\.(heic|heif)$/i`. Suite 59 passed
- notes: a first attempt at this edit mangled the file and was committed with a type error; I `git reset --soft`ed that local commit, restored the file and recommitted clean. No pushed history was touched.
- commit: `2eedafa`

## Cycle U143: sniffType identifies PDF, JPEG, PNG, WebP and HEIC

- red: `error: Error: not implemented` (1 failed)
- green: header checks (`%PDF-`, FFD8FF, 89 PNG, RIFF..WEBP, ftyp + heic brands). Suite 60 passed
- commit: `6efdf64`

## Cycle U144: sniffType returns null for other bytes and empty input

- first run: passed. Mutant: final `return null` to `return "image/jpeg"` -> `-   "image/jpeg"` / `+   null` (1 failed). Restored, cmp clean.
- commit: `e2e11fa`. Suite 61 passed

## Cycle U148: checkActual accepts a file matching its declaration

- red: `error: Error: not implemented` (1 failed)
- green: returns null. Suite 62 passed
- commit: `864353c`

## Cycle U149: checkActual refuses a sniffed type that differs from the declared one

- red: `error: AssertionError` (1 failed)
- green: compare `sniffType(bytes)` with `declared_type`, code `wrong_type`. Suite 63 passed
- commit: `024f040`

## Cycle U150: checkActual refuses an actual size that differs from the declared one

- red: `error: AssertionError: 4999` (1 failed)
- green: `info.size !== declared_size`, code `wrong_size`. Suite 64 passed
- commit: `d6e364a`

## Cycle U153: checkActual refuses an actual size over the cap

- red: `error: AssertionError` (1 failed)
- green and refactor: shared `tooLarge(type, size, settings)` used by `checkDeclared` and `checkActual`; a PDF refusal adds the background-processing note (fork issue #26). Suite 65 passed
- commit: `0444a63`

## Cycle U154: checkActual refuses HEIC bytes whatever was declared

- red: `-   wrong_type` / `+   heic` (1 failed)
- green: `sniffType === "image/heic"` returns `HEIC_REFUSAL`. Suite 66 passed
- commit: `d65cbb0`

## Cycle U155: checkActual refuses bytes of an unrecognised type

- red: `-   wrong_type` / `+   unsupported_type` (1 failed)
- green: null sniff gives `unsupported_type` naming the accepted types. Suite 67 passed
- commit: `8a71813`

## Cycle U152: checkActual refuses a PDF over MAX_PDF_PAGES

- red: `error: AssertionError` (1 failed)
- green: `row.page_count > maxPdfPages` gives `too_many_pages` naming `MAX_PDF_PAGES`, the count and the background note. Suite 68 passed
- commit: `f22a707`

## Cycle U151: checkActual accepts a PDF of exactly MAX_PDF_PAGES pages

- first run: passed. Mutant: `row.page_count > settings.maxPdfPages` to `>=` -> `Values are not equal. -   {` (1 failed). Restored, cmp clean.
- commit: `6813f00`. Suite 69 passed

## T021, T054: `src/pdf.ts`, `tests/pdf_test.ts`

## Cycle U122: openPdf reports the page count

- red: `error: Error: not implemented` (1 failed)
- green: `getDocumentProxy(bytes).numPages` (`npm:unpdf@2.2.2`). Suite 70 passed
- commit: `f4a2a0f`

## Cycle U123: pageTexts returns each page's text in page order

- red: `error: Error: not implemented` (the stub `pageTexts` thrown, 1 failed)
- green: `extractText(pdf, { mergePages: false }).text`. Suite 71 passed
- commit: `fec7830`

## Cycle U156: isScanned is true one under the per-page minimum

- red: `error: Error: not implemented` (1 failed)
- green: total characters / page count below `scannedMinCharsPerPage`. Suite 72 passed
- commit: `ccbe712`

## Cycle U157: isScanned is false at exactly the minimum

- first run: passed. Mutant: `<` to `<=` -> `Values are not equal. -   true` (1 failed). Restored, cmp clean.
- commit: `fb1e481`. Suite 73 passed

## Cycle U158: whitespace-only page text counts as zero characters

- red: `Values are not equal. -   false` / `+   true` (1 failed)
- green: count `text.replace(/\s/g, "").length`. Suite 74 passed
- commit: `5449cbe`

## Cycle U159: openPdf of corrupt bytes returns a readable error

- red: `error: InvalidPDFException: Invalid PDF structure.` (thrown, 1 failed)
- green: try/catch gives `{ error: "The PDF could not be read: it is damaged or not a PDF." }`. Suite 75 passed
- commit: `1fc4d69`

## Cycle U160: openPdf of an encrypted PDF returns a readable error

- test: the fixture is a hand-written PDF text with a standard-handler `/Encrypt` entry, built at test time (no binary, no pdf-lib). pdf.js raises `PasswordException: No password given`.
- red: `Expected actual: "The PDF could not be read: it is damaged or not a PDF." to contain: "password".` (1 failed)
- green: `PasswordException` gives "The PDF is password-protected (encrypted), so its text cannot be read." Suite 76 passed. So U160 is DONE here, not DROPPED; T077's live encrypted check is still worth doing against a real encrypted file.
- commit: `f65c6bb`

## T022: `src/passages.ts`, `tests/passages_test.ts`

## Cycle U124: every passage, source line included, is within PASSAGE_MAX_CHARS

- red: `error: Error: not implemented` (1 failed)
- green: greedy word packing against `sourceLineFor(pages).length + 1 + text.length <= passageMaxChars` (pages fixed `[1, 1]` at this point). Suite 77 passed
- commit: `41d53e7`

## Cycles U125, U126: exactly the maximum is one passage, one more is two (one commit: a process slip)

- both passed on first run. Mutants: `<=` to `<` -> U125 `Values are not equal. -   2`; `<=` to `<= max + 1` -> U126 `Values are not equal. -   1`. Each restored, cmp clean.
- commit: `e15ed15`. Suite 79 passed

## Cycle U128: a passage within one page records that page at both ends

- test: the first draft of the test used pages that were too short, so the next page's first word legitimately joined the passage and the test was wrong, not the code. The test was corrected (each page fills a passage exactly) and the red was re-proved against the previous implementation.
- red (against the previous `passages.ts`): `-       1,` / `-       1,` / `+       2,` / `+       2,` / `-       1,` / `+       3,` (1 failed)
- green: track the first and last page of the open passage. Suite 80 passed
- commit: `be9ecaa`

## Cycle U129: a passage crossing a page boundary records both pages

- first run: passed. Mutant: delete `last = page;` -> `Values are not equal. -     1,` (1 failed). Restored, cmp clean.
- commit: `0c334b1`. Suite 81 passed

## Cycle U127: passages keep reading order and cover all the text

- first run: passed. Mutant: drop the final `passages.push` -> `+     "c13",` / `+     "c14",` (1 failed). Restored, cmp clean.
- commit: `2e6c1b1`. Suite 82 passed

## Cycle U130: a run of non-space text longer than the maximum is split

- red: `error: AssertionError: 1,1 is 1000 chars` (1 failed)
- green: a word longer than the room (`max - sourceLine - 1`, at least 1) is cut into room-sized passages. Suite 83 passed
- commit: `9b74ad3`

## T023, T036: `src/derived.ts`, `tests/derived_test.ts`

`sourceLine` takes the locator as a string, so the page-range wording (`page 12` vs `pages 12–13`) lives in a private `locatorFor` used by `passageRow`; U321 and U350 test it through `passageRow`.

## Cycle U131: sourceLine matches the data-model example

- red: `error: Error: not implemented` (1 failed)
- green: `"From " + file + ", " + locator + " (attachment " + shortId + ")"`. Suite 84 passed
- commit: `d3c4397`

## Cycle U133: fingerprint equals upsert_thought's normalisation

- red: `error: Error: not implemented` (1 failed)
- green: collapse `\s+` to one space, trim, lowercase, SHA-256 hex. Suite 85 passed. Includes the SHA-256 of "abc" known vector.
- commit: `4192fff`

## Cycle U134: a passage row's content is the source line, a line break, then the text

- red: `error: Error: not implemented` (1 failed)
- green: `passageRow` builds content, fingerprint and passes the embedding through. Suite 86 passed
- commit: `04de76a`
- refactor (second commit, same behavior id): `passageRow` as a plain `async` function. Suite 86 passed. commit: `c1bb174`

## Cycles U132, U321: short id and one-page wording (one commit: a process slip)

- both passed on first run. Mutants: `row.id.slice(1, 9)` -> `Expected actual: "From a.pdf, page 1 (attachment f1e2d3c-)" to contain: "(attachment 0f1e2d3c)".`; `locatorFor` always `pages a–b` -> `-   From dishwasher-manual.pdf, pages 12–12 (attachment a1b2c3d4)` / `+   From dishwasher-manual.pdf, page 12 (attachment a1b2c3d4)`. Restored, cmp clean.
- commit: `4074fd4`. Suite 88 passed

## Cycle U135: ingestion contract metadata fields

- red: `Values are not equal. -   undefined` / `+   "local_document"` (1 failed)
- green: the nine fields; `importer_version` is the constant `"0.1.0"`, as in `metadata.json` (drifts if the version is bumped). Suite 89 passed
- commit: `ea81c6f`

## Cycle U136: type reference and topics

- red: `-   undefined` / `+   "reference"` (1 failed)
- green: `type: "reference"`, `topics: ["attachment", name]`. Suite 90 passed
- commit: `59597d7`

## Cycle U137: provenance is deterministic_conversion

- red: `Values are not equal.` with the whole expected `provenance` object missing (1 failed)
- green: provenance with locator, artifact and `review_status`. Suite 91 passed
- commit: `86ef988`

## Cycle U138: attachment_id and parent_thought_id

- red: `-   undefined` / `+   "a1b2c3d4-0000-4000-8000-000000000000"` (1 failed)
- green: both ids copied from the row. Suite 92 passed
- commit: `584d021`

## Cycles U350, U139: provenance locator for one page, and the restricted tier (one commit: a process slip)

- both passed on first run. Mutants: provenance locator always `pages a–b` -> `-   pages 12–12`; `sensitivity_tier: "personal"` constant -> `-   personal`. Restored, cmp clean.
- commit: `aac8732`. Suite 94 passed

## Cycle U140: metadata holds no URL, token or absolute path

- red: `metadata holds "/Users": {"source":"local_document", ... "source_label":"/Users/mfelker/private/dishwasher-manual.pdf" ...}` (1 failed)
- green: `baseName` (from `intake.ts`) applied to the file name for the source line, `source_label`, `topics` and `artifact`. Suite 95 passed. Metadata is built only from allowlisted fields, so no token or storage path is copied.
- commit: `dc18738`

## Cycle U145: a caption row's content

- red: `error: Error: not implemented` (1 failed)
- green and refactor: `passageRow` and `captionRow` share a private `derivedRow` builder (the passage tests U131-U140 stayed green). Suite 96 passed
- commit: `ce5f338`

## Cycle U146: a caption row's provenance

- first run: passed (the shared builder already carried it). Mutant: `extractor_model: row.caption_model` -> `-     extractor_model: null,` (1 failed). Restored, cmp clean.
- commit: `fa14309`. Suite 97 passed

## Cycle U147: noteMetadata

- red: `error: Error: not implemented` (1 failed)
- green: the four fields, `imported_at` from the injected clock. Suite 98 passed
- commit: `15ba1f7`

## Stream X summary

All of U113-U160, U320, U321 and U350 are DONE (51 behaviors; U160 built, not dropped). Final suite: 98 passed, 0 failed, 63 ignored.

<!-- end -->

### Integrator verification of stream X

- Suite green at all 47 commits (throwaway worktree, fork-ci flags); only its 8 owned files changed; all commits have trailers.
- U152 red replayed at its parent commit: `error: AssertionError`, the same as the log.
- Mutants re-applied on a copy of the final code, each edit checked to have applied:
  - `size <= cap` changed to `size < cap` (`src/intake.ts:33`): U118 fails;
  - `page_count > maxPdfPages` changed to `>=` (`:72`): 4 tests fail.
- Deviation, recorded for the audit: five commits bundle two or three behaviors (U120/U121/U320, U125/U126, U132/U321, U350/U139), against one behavior per cycle. Each has its own logged red or mutant.

## Stream Q merged: SQL schema, functions and store (merge `82439ab`), folded from cycle-log.d/q.md

Append only. Newest last. Worktree `.worktrees/ta-data`, branch `contrib/mfelker/thought-attachments-data`, folder `F` = `.worktrees/ta-data/integrations/thought-attachments`.

SQL cycles run `cd F && PATH=/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin007:$PATH psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` (the whole file; each assertion block names its id in its exception message). "Mutant" means the block passed on its first run, so `schema.sql` was broken minimally, the block failed as quoted, and the file was restored byte for byte (copy back, rerun green). The test database is persistent, so a mutant or an index-predicate change that needs a rebuilt object was followed by a dev-only reset of the feature objects (a `psql` command outside the repo files); the final check below runs from a fresh state.

Function names (private to stream Q, checked by U83): `attachment_write_derived`, `attachment_require_claim`, `attachment_apply_patch`, `attachment_set_state`, `attachment_claim`, `attachment_release`, `attachment_embedding_dimension`, `attachment_find_thoughts_exact`, `attachment_insert_note`, `attachment_by_page_token`, `attachment_consume_page_token`, `attachment_note_would_go`, `attachment_remove`, `attachment_removal_preview`, `attachment_orphans`.

## SQL cycles (T014, T015, T016, T038 SQL half, T055, T061)

Each row: id, red (decisive line, verbatim or trimmed), what turned it green, commit. The suite after each green was the whole `verify.sql` with no error output.

| id | red | green | commit |
| --- | --- | --- | --- |
| U34 | `ERROR:  U34: columns differ: <NULL>` (no table). A second run showed my expectation for `id` nullability was wrong (primary key is NOT NULL); the test was corrected, not weakened | `create table if not exists thought_attachments` with every column | b223f19 |
| U35 | `ERROR:  U35: image/gif was accepted` | check constraint `thought_attachments_declared_type_check`, added by name in a guarded block | c7fb10e |
| U36 | `ERROR:  U36: bogus was accepted` | `expected_kind in ('photo','pdf','')` | e0e3687 |
| U37 | `ERROR:  U37: secret was accepted` | tier check (default already in the table) | 160f52a |
| U38 | `ERROR:  U38: done was accepted` | state check | 4065f2c |
| U39 | `ERROR:  U39: purge was accepted` | busy_op check | bff9bdb |
| U40 | `ERROR:  U40: updated_at did not advance (... then ...)` | `thought_attachments_touch()` and the before-update trigger | 8f2f080 |
| U41 | `ERROR:  U41: no index on parent_thought_id` | the two indexes | 02d357e |
| U42 | `ERROR:  U42: duplicate (parent, hash) was accepted` | plain unique index on `(parent_thought_id, content_hash)` | e4119d7 |
| U43 | stale plain unique index gave `ERROR: duplicate key value ...` on the second insert (the index predicate was missing) | `where state <> 'refused'` (the dev DB was reset so the index was recreated) | 4aa6c2f |
| U44 | first run passed. Mutant: `nulls not distinct` on the index -> `Key (parent_thought_id, content_hash)=(..., null) already exists.` | no production change | cdb0485 |
| U45 | `ERROR:  U45: RLS is not enabled` | `enable row level security`, no policies | ca50b42 |
| U46 | `ERROR:  U46: service_role lacks select` | `grant select, insert, update, delete ... to service_role` | 9574749 |
| U47 | `ERROR:  U47: thoughts.content_fingerprint missing` | `add column if not exists` and `create unique index if not exists idx_thoughts_fingerprint` | 2b8a7b3 |
| U48 | first run passed. Mutant: a block creating a randomly named second index on `content_fingerprint` -> `ERROR:  U48: index count on thoughts changed` (the stray index was dropped by a dev command) | no production change | a4b19c4 |
| U49 | `ERROR:  U49: bucket ob1-files missing` | guarded insert into `storage.buckets` (private, four MIME types, no size limit), by dynamic SQL only when the schema exists | 3c45fb7 |
| U50 | first run passed. First mutant (`create schema if not exists storage` at the file end) was judged weak because the block treated any storage schema as real; the block was strengthened to record the pre-existing schema state with `set_config` and `\gset`. Mutant again -> `ERROR:  U50: a storage schema exists after the no-storage run` | no production change (the stub storage schema lives as `storage_verify_stub` between runs, renamed in and out by `verify.sql`, with no DROP) | faf5bc1 |
| U51 | first run passed. Mutant: trigger guard replaced by `if true` -> `ERROR: trigger ... already exists` on the extra `\i` | no production change | f8b23ac |
| U53 | `No function matches the given name and argument types` (`attachment_write_derived`) | function inserts rows with the guide's fingerprint expression and sets `derived_count` | 8f796c4 |
| U54 | `ERROR:  U54: an expired claim was not refused` | `attachment_require_claim` (row lock, token and expiry check, message `attachment claim not held`) | 9a991ac |
| U55 | first run passed. Mutant: dropped `lower(...)` from the fingerprint -> `ERROR:  U55: 1 rows with a different fingerprint` (first mutant attempt was a syntax error and was redone) | no production change | 1c4a965 |
| U56 | first run passed (the unique index raises). Mutant: `on conflict ... do update set metadata` -> `ERROR:  U56: a fingerprint conflict did not raise` | no production change | 693dd16 |
| U57 | `ERROR:  U57: set not replaced (3 rows, 2 old)` | delete the attachment's old derived set (scoped by `metadata->>'attachment_id'`); `attachment_apply_patch` applies the state patch and `derived_count` | a07b7da |
| U58 | first run passed (a plpgsql function is one transaction). Mutant (run with U56's block temporarily cut, then restored): the insert loop wrapped in `exception when unique_violation then null` -> `ERROR:  U58: the conflicting write did not raise` | no production change | 2a10ca8 |
| U59 | first run passed. Mutant: the delete changed to `where metadata ? 'attachment_id'` -> `ERROR:  U59: the other attachment changed (0 rows, derived_count 1)` | no production change | 825e2d6 |
| U60 | first run passed (unique index). Mutant: `content_hash` ignored in the patch -> `ERROR:  U60: the duplicate content_hash was accepted` | no production change | cd702ee |
| U61 | `No function matches` (`attachment_claim`) | claim function that returns `{busy: op}` while unexpired (token path stubbed) | 5233a13 |
| U62 | `ERROR:  U62: claim not recorded: ...` | single conditional `update ... where busy_until is null or busy_until <= now() returning busy_token`; `busy` otherwise; `attachment not found` raised for an unknown id | 0596b99 |
| U63 | first run passed. Mutant: `id = p_id` removed from the update -> `ERROR: more than one row returned by a subquery used as an expression`/`Make sure the query returns a single row` | no production change | 82e2f60 |
| U64 | `No function matches` (`attachment_release`) | release (clears by id) | 9e28005 |
| U65 | `ERROR:  U65: the claim was released by another token: {"token": ...}` | `and busy_token = p_token` | 28412c3 |
| U66 | `No function matches` (`attachment_embedding_dimension`) | `atttypmod` of `thoughts.embedding` | 5329596 |
| U67 | `No function matches` (`attachment_find_thoughts_exact`) | `position(p_text in content) > 0`, first line, `created_at`, `limit least(p_limit, 20)` | d5482b0 |
| U68 | first run passed. Mutant: `like '%' \|\| p_text \|\| '%'` -> `ERROR:  U68: 2 matches, first ...` | no production change | 60ac15e |
| U314 | `ERROR:  U314: 0 matches, first <NULL>` | `lower()` on both sides | 9e0f37d |
| U84 | `No function matches` (`attachment_insert_note`) | insert the note with the fingerprint, embedding and metadata | 1ee9304 |
| U85 | unique violation raised by the existing fingerprint (`returning id` error) | `on conflict (content_fingerprint) ... do nothing`, then select the existing id and return `created: false` | 6715973 |
| U86 | `No function matches` (`attachment_by_page_token`) | `select * ... where page_token_hash = p_hash` (a null hash matches nothing) | 29ffd4a |
| U87 | `No function matches` (`attachment_consume_page_token`) | `update ... set page_token_hash = null where id and page_token_hash = p_hash`, returns `found` | b5f8bf6 |
| U94 | `No function matches` (`attachment_set_state`) | require claim, then apply the patch, no derived change. The patch keeps `derived_count` if sent, as the fake store does | 594dab0 |
| U93 | first run passed. Mutant: the token comparison removed from `attachment_require_claim` -> `ERROR:  U93: a write with the old token was not refused` | no production change | 0470eb7 |
| U95 | `No function matches` (`attachment_remove`) | require claim, delete the derived set scoped by id, delete the row, return counts | e227cec |
| U96 | first run passed. Mutant: unscoped derived delete -> `ERROR:  U96: the other attachment lost data (0 thoughts, 1 row)` | no production change | 5295dd8 |
| U97 | first run passed. Mutant: `attachment_require_claim` call removed from `attachment_remove` -> `ERROR:  U97: not refused (wrong f, expired f)` | no production change | 2d2492f |
| U98 | `ERROR:  U98: {"removed": {"derived": 0, "noteRemoved": false}, ...}` (the first red was the missing preview function in the helper; the helper was reduced and the real red recorded) | `note_goes` for `refused`, `parent_created_here` and no other attachment; the parent thought is deleted | b51b718 |
| U99 | `ERROR:  U99: {"removed": {"derived": 0, "noteRemoved": false}, ...}` | `attachment_note_would_go(a)`: `refused` or (`pending_upload` and past the deadline), plus the same conditions | 0263b65 |
| U100 | first run passed. Mutant: the `no other attachment` clause removed -> `ERROR:  U100: ... "noteRemoved": true ... "parent_still_there": false` | no production change | 4eb0697 |
| U101 | first run passed. Mutant: `parent_created_here` clause removed -> `ERROR:  U101: ... "noteRemoved": true` | no production change | 0d4e766 |
| U102 | first run passed. Mutant: `state <> 'pending_upload'` in place of `= 'refused'` -> `ERROR:  U102: ... "noteRemoved": true` | no production change | 27ff228 |
| U103 | first run passed. Mutant: the deadline condition removed -> `ERROR:  U103: ... "noteRemoved": true` | no production change | 0b0a6ba |
| U104 | `No function matches` (`attachment_removal_preview`) | preview returns `{derived, noteWouldGo}` from the same rule, no delete | 7ab6805 |
| U105 | `No function matches` (`attachment_orphans`) | `parent_gone` branch | 50d3ac6 |
| U106 | `ERROR:  U106: <NULL>` | `upload_expired` branch | 23a4456 |
| U107 | first run passed. Mutant: deadline test removed -> `ERROR:  U107: {"why": "upload_expired", ...}` | no production change | 2aed227 |
| U108 | `ERROR:  U108: <NULL>` | `refused` branch | 6deb48b |
| U109 | first run passed. Mutant: `a.state in ('refused', 'processed')` -> `ERROR:  U109: {"why": "refused", ...}` (state `processed`) | no production change | 97bba06 |

Note: U43 is shared by T014 and T055 and was done in the T014 run.

Verification of the SQL half from a fresh state: the feature objects were reset (dev only), `verify.sql` ran twice in a row, both with no error output.

## Deno cycles (T017, T018, T019, T038 store half, T048, T062, and the T014 scan U52)

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Every red below reported `1 failed` (`0 passed | 1 failed`); the decisive line is the first assertion or error line. Suite after each green: the whole `deno test ... tests/` run, `0 failed`. Counts went from 48 passed (integrator baseline plus U69) to 81 passed, 63 ignored (the todo acceptance tests), 0 failed. The store tests run supabase-js over `tests/helpers/fake_fetch.ts` (no `--allow-net`).

`src/store.ts` started as the stub's replacement: every method answered "not implemented" until its test arrived, and U78 added an all-methods guard so a thrown error (a network failure) also becomes `{ error }` with the key removed.

| id | red (decisive line) | green | commit |
| --- | --- | --- | --- |
| U69 | `error: Error: not implemented` | `thoughtExists` reads `thoughts` by id | 02aab54 |
| U70 | `error: Error: not implemented` | `matchThoughts` calls `match_thoughts` with `match_threshold: 0`, maps `content` to the first line (120 characters) | fcfa75f |
| U71 | `error: Error: not implemented` | `findThoughtsExact` sends `p_text` and `p_limit` to `attachment_find_thoughts_exact` | e07f297 |
| U72 | `error: Error: not implemented` | `embeddingDimension` calls `attachment_embedding_dimension` | ed9f605 |
| U73 | `error: Error: not implemented` | `claim` calls `attachment_claim` and returns the reply (`{ token }` or `{ busy }`) | 1ef3019 |
| U74 | `error: Error: not implemented` | `getAttachment` reads by `id=eq.` | fd90eaa |
| U75 | `AssertionError: Values are not equal.` (the short id was sent as `id=eq.`) | an 8-hex short id becomes the range `id >= prefix-0000-... and id <= prefix-ffff-...` (a uuid column has no prefix match) | d6a06b9 |
| U76 | `AssertionError: Values are not equal.` | two rows -> `"ambiguous"` | e45eb1d |
| U77 | `AssertionError: Values are not equal.` | no row -> `"not_found"` | 6fa04aa |
| U78 | `AssertionError: Values are not equal.` (the thoughtExists error was swallowed and the key leaked) | `scrub()` removes the key; every method is wrapped so a thrown error becomes `{ error }`; `thoughtExists` and `getAttachment` check the error | c6b27c5 |
| U315 | `- error: "not implemented"` | `findByHash` filters by parent, hash and `state=neq.refused` | f61baf8 |
| U316 | first run passed. Mutant: the `neq("state","refused")` removed -> `FAILED \| 0 passed \| 1 failed` (the first mutant attempt did not apply, so it was redone and confirmed) | no production change | 3a59798 |
| U317 | first run passed with a test whose fake database returned nothing when the parent filter was missing, so the mutant did not fail. The test was corrected (the fake returns the row when no parent filter is sent), then mutant: the parent filter removed -> `AssertionError: Values are not equal.` | no production change | 7e4951a |
| U318 | `FAILED \| 0 passed \| 1 failed` (not implemented) | `findPending` filters by parent, name, type, size, `state=eq.pending_upload` and `upload_deadline=gt.<now>` | 6304fdf |
| U319 | first run passed. Mutant: the `gt("upload_deadline", now)` removed -> `AssertionError: Values are not equal.` | no production change | 67b80a3 |
| U88 | `- error: "not implemented"` | `insertNote` (embedding sent as the `[..]` text), `attachmentForPageToken` (first row of the setof reply or null), `consumePageToken` | 41d87bd |
| U79 | `- error: "not implemented"` | `signUpload` through `createSignedUploadUrl` in the configured bucket; the signed URL is returned as supabase-js builds it from Storage's reply | 3afdb80 |
| U80 | `- error: "not implemented"` | `objectInfo` through Storage `info`; a 404 maps to `null` | 9a0076d |
| U81 | `FAILED \| 0 passed \| 1 failed` (not implemented) | `download` returns the blob's bytes | 8d1975b |
| U82 | `- error: "not implemented"` | `deleteObject` through `remove([path])` | b9db630 |
| U89 | `- error: "not implemented"` | `signDownload` through `createSignedUrl(path, seconds)` | b740781 |
| U90 | `- error: "not implemented"` | `listByParent` filters by parent, ordered by `created_at` | 3a41d9a |
| U91 | `- error: "not implemented"` | `attachmentForDerived` reads the thought's `metadata.attachment_id`, then the attachment | 778f71e |
| U92 | first run passed. Mutant: the "no attachment_id" early return removed -> `- error: "TypeError: FakeFetch: no route for GET .../thought_attachments?...id=eq.undefined..."` | no production change | d8c2dd9 |
| U110 | `FAILED \| 0 passed \| 1 failed` | `removalPreview` calls `attachment_removal_preview` | f39b87b |
| U111 | `FAILED \| 0 passed \| 1 failed` | `removeAttachment` calls `attachment_remove` with the token | 06f1ea1 |
| U112 | `FAILED \| 0 passed \| 1 failed` | `orphans` calls `attachment_orphans` with `p_now`, maps `{ attachment, why }` to `{ row, why }` | 9b3621c |
| UQ1 | `FAILED \| 0 passed \| 1 failed` (not implemented; a second red showed the test's reply must be one object for `.single()`, corrected in the test) | `createAttachment` inserts the fields with `state: "pending_upload"` and the default tier | 88b0f20 |
| UQ2 | `FAILED \| 0 passed \| 1 failed` | `setDeclaration` updates by id | f6fd212 |
| UQ3 | `FAILED \| 0 passed \| 1 failed` | `release` calls `attachment_release` | 6f88f24 |
| UQ4 | `FAILED \| 0 passed \| 1 failed` | `writeDerived` sends rows as `{ content, metadata, embedding }` (the fingerprint is computed in SQL) and the patch | 95365eb |
| UQ5 | `FAILED \| 0 passed \| 1 failed` | `setState` calls `attachment_set_state` | 22f0aa8 |
| U83 | first run passed (store and schema already agreed). Mutants: (a) `attachment_release(p_id uuid, p_tok text)` in `schema.sql` -> `- "rpc attachment_release sends p_token, which the function does not take"`; (b) `p_hsh` in `store.ts` -> `rpc attachment_by_page_token sends p_hsh ...`. Both restored | no production change; the stub-removal refactor (`notYet`) went in the same commit | 3c8557a |
| U52 | first run passed. Mutants: `drop index if exists ...;` appended to `schema.sql` -> `1 failed`; `delete from thought_attachments;` appended to `tests/verify.sql` -> `1 failed`. Both restored | no production change | 129141b |

UQ1 to UQ5 are extra behaviors that the test list has no row for (see the final report): the Store methods `createAttachment`, `setDeclaration`, `release`, `writeDerived` and `setState` are used by the finishing, tools and page streams, so they could not stay stubs.

## Final state

- Deno: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/` -> 81 passed, 0 failed, 63 ignored.
- SQL: from a fresh state (feature objects reset by a dev-only command), `verify.sql` ran twice with no error output.
- Behaviors DONE: U34 to U112 (all of stream Q's rows), U314 to U319, and UQ1 to UQ5 (extra). Tasks complete: T014, T015, T016, T017, T018, T019, T038, T048, T055, T061, T062.

### Integrator verification of stream Q

- Deno suite green at all 90 commits (throwaway worktree, fork-ci flags). Only its 5 owned files changed, and every commit has its trailers.
- `verify.sql` ran twice in a row on a **new database** (`qverify`, fork-ci `bootstrap.sql` applied first), exit 0 both times, and again on the merged W.
- Guard rails: no `DROP` or `TRUNCATE` in `schema.sql` or `verify.sql`. All three `DELETE`s are scoped, by `id` or by `metadata->>'attachment_id'` (`schema.sql:178`, `:339`, `:342`, `:344`).
- SQL mutant re-applied on a copy: removing `perform attachment_require_claim(p_id, p_token)` from `attachment_write_derived` makes `verify.sql` stop with `ERROR: U54: an expired claim was not refused`. Stream Q's tree was untouched.
- Stream Q's extra behaviors UQ1–UQ5 (`createAttachment`, `setDeclaration`, `release`, `writeDerived`, `setState`) were renamed to **U357–U361** in a structural commit on W (`0b10510`) and added to the test list on T017. The UQ ids in the folded log above are these.
- Reviewed and accepted (integrator): the derived-thought deletes match on `metadata->>'attachment_id'` only. Only this integration writes that key, on derived thoughts. Tightening it to also require `importer_name = 'thought-attachments'` is a one-line hardening, left for owner decision or the audit.

## Stream N merged: finishing pipeline (merge `40458e0`), folded from cycle-log.d/n.md

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-finish`, branch `contrib/mfelker/thought-attachments-finish`, folder `F` = `integrations/thought-attachments`. Files: `src/finish.ts`, `tests/finish_test.ts`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. Baseline suite at `0b10510`: 153 passed, 63 ignored. Final suite: 194 passed, 0 failed, 63 ignored.

A "mutant" entry means the test passed on its first run. The code was broken minimally, the test failed as quoted, and the file was restored byte for byte (`cmp` clean). Mutants whose edit would not type-check were run with `--no-check`.

Notes that apply to several cycles:

- Test PDFs need at least 20 non-space characters per page, or `SCANNED_MIN_CHARS_PER_PAGE` (20) makes them `scanned`. Cycle U205 made that visible, and the fixture text of the earlier tests was lengthened then (`alpha beta gamma delta epsilon zeta`). No assertion was weakened.
- A newly configured model or threshold is tested with `reconfigured(r, overrides)`, a second finisher over the same store and fake fetch. The vision client reports `settings.visionModel`, not the reply's model field.
- Commit `ef9112a` (U184) was first committed by mistake while red (my commit helper did not gate on the suite), and was amended to green before any further work. No other commit was ever red.
- The finisher returns early, before claiming, for a `refused` attachment (U201). A plain finish on `processed` claims and releases, but writes nothing.

## T025 and T026: PDF path and repeats

## Cycle U182: a pending PDF finishes processed with its passage count and page_count

- test: `tests/finish_test.ts::U182 a pending PDF with a matching upload ends processed, ...` (new)
- red: `--filter "/^U182 /"` -> `error: Error: not implemented` (stub, first cycle only) (1 failed)
- green: `createFinisher` claims, downloads, opens the PDF, builds passages, embeds, writes. Suite 154 passed
- refactor: none
- commit: `260967d`

## Cycle U183: finishing records actual type, size, page count, content hash and processed_at

- red: `AssertionError: Values are not equal.` (`actual_type` null vs `"application/pdf"`) (1 failed)
- green: the patch sets `actual_type` (`sniffType`), `actual_size`, `content_hash` (`sha256:<hex>`) and `processed_at`. Suite 155 passed
- commit: `c6af0ff`

## Cycle U184: derived rows carry the stored bytes' hash as input_hash

- red: `AssertionError: Values are not equal.` (`input_hash` null vs the hash) (1 failed)
- green: `passageRow` receives the row with `content_hash` set. Suite 156 passed
- commit: `ef9112a` (amended once, see the notes)

## Cycle U185: the claim is released after a finish

- first run PASSED
- mutant: `await store.release(...)` replaced by a comment -> `AssertionError` at the new-claim assert (1 failed). Restored, `1 passed`
- commit: `956ddfa`

## Cycle U186: an owner thought equal to a passage is left untouched

- first run PASSED
- mutant: after building the rows, each row's content cut to its body (`split("\n")[1]`) -> `Error: duplicate key value violates unique constraint "idx_thoughts_fingerprint"` (1 failed). Restored, `1 passed`
- commit: `e743221`

## Cycle U187: a plain finish on processed returns the existing outcome

- red: `AssertionError: Values are not equal.` (a second full run's outcome differed) (1 failed)
- green: `run` returns `outcomeOf(row)` for a `processed` row unless rebuilding. Suite 159 passed
- commit: `d23b44e`

## Cycle U188: duplicate bytes on the same parent end refused

- red: `Error: duplicate key value violates unique constraint "thought_attachments_parent_hash_key"` (the write hit the index) (1 failed)
- green: `findByHash` after hashing; another attachment's hit gives `refuse(...)` with "already attached to this thought as <short id>", object deleted. Suite 160 passed
- commit: `fd16ae8`

## Cycle U322: a refused attachment with the same bytes doesn't refuse the finish

- first run PASSED
- mutant (`--no-check`): `twin.data && twin.data.id !== row.id` replaced by `twin.data !== undefined` -> `TypeError: Cannot read properties of null (reading 'id')` (1 failed). A first, type-checked mutant failed only on type checking and was discarded. Restored, `1 passed`
- commit: `65535c2`

## Cycle U323: the same bytes on another parent don't refuse the finish

- first run PASSED
- mutant (`--no-check`): same `twin.data !== undefined` mutant -> `TypeError ... (reading 'id')` (1 failed). The per-parent scoping lives in the store (`findByHash(parentId, ...)`), which the fake and stream Q's SQL both implement, so the finisher has no line of its own to break for it. Restored, `1 passed`
- commit: `5c6e15e`

## Cycle U324: a failed attachment with the same bytes still counts as a duplicate

- first run PASSED
- mutant: condition `twin.data && twin.data.state !== "failed" && twin.data.id !== row.id` -> `Error: duplicate key value violates unique constraint "thought_attachments_parent_hash_key"` (1 failed). Restored, `1 passed`
- commit: `766448e`

## T039: photo path

## Cycle U189: a photo finishes with one caption thought and its model

- red: `Error: The PDF could not be read: it is damaged or not a PDF.` (JPEG went down the PDF path) (1 failed)
- green: `run` branches on the sniffed type into `pdfPath` and `photoPath` (vision caption, embed, `captionRow`, `caption_model`). Suite 164 passed
- refactor: the PDF path moved into its own function
- commit: `565ae8d`

## Cycle U191: a long caption is cut to 300 characters in the outcome only

- red: `AssertionError: Values are not equal.` (outcome caption 301 characters) (1 failed)
- green: `caption.data.text.slice(0, 300)` in the outcome. Suite 165 passed
- commit: `51c4e7a`

## Cycle U190: a 300-character caption is returned whole

- first run PASSED
- mutant: `slice(0, 300)` -> `slice(0, 299)` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `ffe7ab4`

## Cycle U192: a photo without vision ends not_captioned with the file kept

- red: `Error: vision endpoint undefined is unreachable: Invalid URL: 'undefined/chat/completions'` (1 failed)
- green: `if (!deps.vision.configured)` -> `notCaptioned(...)`, a `setState` with the reason. Suite 167 passed
- commit: `5a22cbe`

## Cycle U193: a failing vision call ends not_captioned with its reason

- red: `Error: vision endpoint answered HTTP 503: vision is down` (thrown) (1 failed)
- green: a caption error goes to `notCaptioned`. Suite 168 passed
- commit: `bb19495`

## Cycle U194: finishing a not_captioned photo again writes the caption and clears its reason

- red: `AssertionError: Values are not equal.` (`state_reason` still set) (1 failed)
- green: the success patch sets `state_reason: null`. Suite 169 passed
- commit: `c78f5b3`

## T040: rebuilds

## Cycle U195: rebuild replaces a photo's caption with one by the new model

- red: `AssertionError: Values are not equal.` (a plain return, `caption` missing) (1 failed). After the change, a second red was a fixture mistake: the vision client reports `settings.visionModel`, so the test now rebuilds through `reconfigured(r, { VISION_MODEL: "new/model" })`
- green: `rebuild: true` on a `processed` row claims `rebuild` and skips the early return. Suite 170 passed
- commit: `cc47512`

## Cycle U196: rebuild replaces a PDF's passage set

- first run PASSED
- mutant: `writeDerived(row.id, token, rows.slice(0, 1), patch)` -> `AssertionError` at `derived.length > first.derived_count` (1 failed). Restored, `1 passed`
- commit: `bf1222f`

## Cycle U197: a failed photo rebuild keeps the old caption and reports last_rebuild_error

- red: `AssertionError: Values are not equal.` (state not `processed` with an error) (1 failed)
- green: a failure during a rebuild goes to `rebuildFailed`, a `setState` of `last_rebuild_error` only. Suite 172 passed
- commit: `7fc92a0`

## Cycle U326: a successful rebuild clears last_rebuild_error

- red: `AssertionError: Values are not equal.` (row kept the old error) (1 failed)
- green: both success patches set `last_rebuild_error: null`. Suite 173 passed
- commit: `f40796d`

## Cycle U325: a repeat finish or rebuild isn't refused as a duplicate of itself

- first run PASSED
- mutant: `twin.data && twin.data.id !== row.id` -> `twin.data` -> `AssertionError: Values are not equal.` (the failed attachment was refused as its own twin) (1 failed). Restored, `1 passed`
- commit: `d6234bd`

## T056: refusals

## Cycle U198: a failed actual-file check deletes the object and ends refused

- test loops over wrong type, wrong size and too many pages
- red: `AssertionError: Values are not equal: wrong type` (1 failed)
- green: `openPdf` runs first so `page_count` is set before `checkActual`; a refusal calls `refuse` with the actual type, size and page count. Suite 175 passed
- refactor: the PDF is opened once in `run` and passed to `pdfPath`
- extra mutant: `checkActual({ ...row, page_count: null }` -> `AssertionError: Values are not equal: too many pages`. Restored
- commit: `8819881`

## Cycle U199: an object uploaded after the deadline is refused and deleted

- red: `AssertionError: Values are not equal.` (state `processed`) (1 failed)
- green: `createdAt > upload_deadline` refuses, "The file was uploaded after the upload window closed." Suite 176 passed
- commit: `9db1322`

## Cycle U200: an object created exactly at the deadline is accepted

- first run PASSED
- mutant: `>` -> `>=` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `e04c3eb`

## Cycle U201: finishing a refused attachment is refused and changes nothing

- red: `AssertionError: Values are not equal.` (the run went on and failed on the missing object) (1 failed)
- green: an early return before the claim: state `refused`, "this attachment was refused and can't be finished (<reason>)". Suite 178 passed
- commit: `49b7ff1`

## Cycle U202: a finish with no object yet says so and changes nothing

- red: `Error: no object` (1 failed)
- green: a missing object returns `{ state: row.state, reason: "no file uploaded yet" }`. Suite 179 passed
- commit: `70b2302`

## Cycle U203: a finish with no object after the deadline reports the window expired

- red: `Expected actual: "no file uploaded yet" to contain: "upload window expired".` (1 failed)
- green: `now >= upload_deadline` gives "upload window expired" (the store treats `deadline <= now` as expired). Suite 180 passed
- commit: `76ba6e0`

## Cycle U204: the claim is released after a refused or no-file finish

- first run PASSED
- mutant: `if (rebuild) await store.release(...)` -> `AssertionError` at the new-claim assert (1 failed). Restored, `1 passed`
- commit: `2b4af28`

## T057: failures

## Cycle U205: a text-less PDF ends scanned with the file kept

- red: `AssertionError: Values are not equal.` (state `processed` for `scannedPdf`) (1 failed). The first attempt also turned 11 earlier tests red, because their PDFs held under 20 characters a page (see the notes); their fixture text was lengthened
- green: `isScanned(pageTexts, settings)` -> `ends(..., "scanned", "No text layer ... text search won't cover it yet.")`. `ends` generalises `notCaptioned`. Suite 182 passed
- refactor: `notCaptioned` delegates to `ends`
- commit: `2a9f445`

## Cycle U206: a re-finished scanned PDF with text now over the threshold ends processed

- red: `AssertionError: Values are not equal.` (`state_reason` still set) (1 failed)
- green: the PDF success patch sets `state_reason: null`. Suite 183 passed
- commit: `c797bb6`

## Cycle U207: a scanned PDF finished again with unchanged settings stays scanned

- first run PASSED
- mutant: `if (isScanned(...) && !row.state_reason)` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `b6dca80`

## Cycle U208: a corrupt PDF ends failed with the reason

- red: `Error: The PDF could not be read: it is damaged or not a PDF.` (thrown) (1 failed)
- green: an `openPdf` error goes to `ends(..., "failed", error)`. Suite 185 passed
- commit: `17ce0c9`

## Cycle U209: an embedding failure ends failed with no derived thought

- test covers a PDF whose second batch fails (`EMBEDDING_BATCH_SIZE` 1) and a photo whose only request fails
- red: `Error: embedding endpoint answered HTTP 500: embeddings down` (thrown) (1 failed)
- green: an embedding error goes to `ends(..., "failed", ...)` in both paths. Suite 186 passed
- commit: `33b0804`

## Cycle U210: a vector of the wrong length ends failed naming both lengths

- red: `Error: expected 1536 dimensions, not 8` (the store's refusal, thrown) (1 failed)
- green: `wrongLength` compares each vector with `embeddingDimension()` before writing; the reason names both lengths. Suite 187 passed
- commit: `9c20640`

## Cycle U211: a failed attachment finishes processed once the services work

- first run PASSED
- mutant: the early return `row.state === "processed"` -> `row.state !== "pending_upload"` -> `AssertionError` (`failed` vs `processed`) (1 failed). Restored, `1 passed`
- commit: `973cbd0`

## Cycle U327: a fingerprint conflict ends failed and leaves the existing thought unchanged

- red: `Error: duplicate key value violates unique constraint "idx_thoughts_fingerprint"` (thrown) (1 failed)
- green: a `writeDerived` error goes to `ends(..., "failed", writeReason(error))`; a duplicate-key or fingerprint error reads "An existing thought has the same text as a derived thought, so nothing was written (...)". The real store raises a different text for a stale claim, so no code matches on that text. Suite 189 passed
- commit: `7e14d9c`

## T058: the claim

## Cycle U212: a finish while another operation holds the claim returns busy

- red: `Error: claim failed` (1 failed)
- green: a `{ busy }` claim returns `{ state, reason: "busy (finishing / rebuilding / removing), try again shortly", derived_count, busy }`. Suite 190 passed
- commit: `1dd34e2`

## Cycle U213: a finish is still busy one second before BUSY_SECONDS has passed

- first run PASSED
- mutant: claim seconds `settings.busySeconds - 5` -> the second finish was not busy, `Promise resolution is still pending but the event loop has already resolved.` after the failed assertion (1 failed). Restored, `1 passed`
- commit: `ba8ef14`

## Cycle U215: a cut-off rebuild reads as processed with its old set and "the run did not finish"

- red: `AssertionError: Values are not equal.` (`last_rebuild_error` undefined) (1 failed)
- green: `outcomeOf` reads an expired `rebuild` claim on the row as `last_rebuild_error: "the run did not finish"`. The note is not stored: a later claim overwrites the claim fields (the same as the data-model's reading rule). Suite 192 passed
- commit: `3df6f60`

## Cycle U216: a finish whose claim was taken over has its write refused and the newer result stands

- the first run stalls inside `objectInfo` (a one-call `override`) after taking its claim; the clock moves 411 s; a second finish completes; then the first resumes
- red: `Error: claim token is stale or foreign` (thrown from the `setState` in `ends`) (1 failed)
- green: `finish` catches a thrown error, re-reads the row, and when `busy_token` is no longer its token returns `currentOutcome(fresh)` (busy while another live claim exists, otherwise the row's outcome). No text of the store's error is matched, because the fake and the SQL word it differently. Suite 193 passed
- commit: `d20b491`

## Cycle U214: a finish proceeds once BUSY_SECONDS has passed

- first run PASSED
- mutant (`--no-check`): `if (!("token" in claim.data) || deps.now().getTime() > 0)` -> `AssertionError: Values are not equal.` (always busy) (1 failed). A type-checked version of the mutant failed only on type checking and was discarded. Restored, `1 passed`
- commit: `fef2b18`

## Done

DONE: U182, U183, U184, U185, U186, U187, U188, U189, U190, U191, U192, U193, U194, U195, U196, U197, U198, U199, U200, U201, U202, U203, U204, U205, U206, U207, U208, U209, U210, U211, U212, U213, U214, U215, U216, U322, U323, U324, U325, U326, U327. That is 41 behaviors, which are T025, T026, T039, T040, T056, T057 and T058.

Observations for the integrator:

- Order inside `run`: object info and download, sniff, open the PDF (sets `page_count`), the deadline check, `checkActual`, the hash and duplicate check, then the PDF or photo path.
- A thrown store error that is not a lost claim propagates out of `finish` (after the claim is released). Stream T's tool layer should turn it into a tool error. No behavior in the list covers a store outage.
- `finish` on an unknown id throws "attachment not found"; the tool layer resolves ids first.

## Stream T merged: MCP tools (merge `a65bb2d`), folded from cycle-log.d/t.md

Append only. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-tools`, branch `contrib/mfelker/thought-attachments-tools`, folder `F` = `integrations/thought-attachments`. Files owned: `src/tools.ts`, `tests/tools_test.ts`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Every red reported `1 failed` and every green `1 passed`. Suite baseline 153 passed; final 210 passed, 0 failed, 63 ignored (the integrator's todo acceptance tests). A "mutant" means the test passed on its first run; the source was then broken minimally, the test failed, and the file was restored byte for byte (`cmp` clean).

Test method: `buildServer(deps, services)` driven through `inMemoryClient`, with `FakeStore` (dimension 4), a recording fake embedding client and a scripted `services.finish`.

Decisions: `page_token_hash` is the lowercase hex SHA-256 of the token after `#t=` (integrator rule, asserted by U237). Refusals use `isError` with the structured `code` from `intake.ts` passed through (U232b). A busy result is `isError` with text `busy (finishing|rebuilding|removing), try again shortly`. The reading layer is `asReported`: a cut-off finish reads `failed` "the run did not finish", a cut-off rebuild stays `processed` with `last_rebuild_error` set, a cut-off remove reads as stored.

## T027: registration

## Cycle U217: tools/list returns exactly the seven tool names

- red: `error: Error: not implemented` (stub, first cycle only; 1 failed)
- green: seven tools registered with stub handlers
- commit: `b69861b`

## Cycle U218: annotations match the contract

- red: `AssertionError: Values are not equal: find_thought` (readOnlyHint, 1 failed)
- green: annotations table
- commit: `7299855`

## Cycle U219: input schemas and defaults

- red: `AssertionError: Values are not equal.` (find_thought required list, 1 failed)
- green: zod schemas, `mode` default `meaning`, `limit` default 5, `confirm` default false
- commit: `bade4fc`

## T028: find_thought

## Cycle U220: meaning mode

- red: `AssertionError: Values are not equal.` (matches, 1 failed)
- green: embed the query, `matchThoughts`
- commit: `2ee0681`

## Cycle U221: exact mode

- red: `AssertionError: Values are not equal.` (matches empty, 1 failed)
- green: `findThoughtsExact`, no embedding call
- commit: `5675da7`

## Cycle U222: no limit asks for 5

- first run passed. Mutant: `default(5)` to `default(6)` -> `AssertionError: Values are not equal.` (1 failed); restored
- commit: `48adb61`

## Cycle U223: limit 20 asks for 20

- first run passed. Mutant: `findThoughtsExact(query, limit)` to `(query, 5)` -> `Values are not equal.`; restored
- commit: `5a3d4b6`

## Cycle U328: limit above 20 is reduced to 20

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `Math.min(asked, 20)`
- commit: `4e4c9c0`

## Cycle U225: a 121-character first line is cut to 120

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `slice(0, 120)` on the store's first line
- commit: `ab71a2f`

## Cycle U224: a 120-character first line is whole

- first run passed. Mutant: cap 120 to 119 -> `Values are not equal.`; restored
- commit: `0392e66`

## Cycle U226: first line stops at the first line break

- red: `AssertionError: Values are not equal.` (1 failed)
- green: split on line break
- commit: `a5e1fe5`

## Cycle U227: each match has id, first_line, captured

- first run passed. Mutant: dropped `captured` (`{ id, first_line }`) -> `Values are not equal.`; restored
- commit: `baec9d6`

## Cycle U228: no match says "no matching thought"

- red: `Expected actual: "[]" to contain: "no matching thought".` (1 failed)
- green: empty result message, readable lines otherwise
- commit: `0e53c4d`

## T029: attach_file (command upload)

## Cycle U229: unknown thought_id refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `thoughtExists` check
- commit: `73f2f6e`

## Cycle U230: both thought_id and note refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: exactly-one rule
- commit: `e514da7`

## Cycle U231: neither refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `(thought_id === undefined) === (note === undefined)`
- commit: `d2f9806`

## Cycle U232: checkDeclared refusal returned, nothing created

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `checkDeclared` with the base name
- commit: `c633d48`

## Cycle U233: same file pending on the parent points to it

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `findPending`, returns the existing attachment
- commit: `14fb8af`

## Cycle U235: a successful start writes the pending_upload row

- red: `AssertionError: Values are not equal.` (1 failed)
- green: createAttachment with generated id, base name, storage path
- commit: `176e3fe`

## Cycle U234: a different size creates a new attachment

- first run passed. Mutant: `findPending` size argument replaced by 1000 -> `Values are not equal.`; restored
- commit: `4289e21`

## Cycle U236: upload_deadline is now plus UPLOAD_LINK_MINUTES

- first run passed. Mutant: `uploadLinkMinutes * 60_000` to `3_600_000` -> `Values are not equal.`; restored
- commit: `0a7115c`

## Cycle U237: page_token_hash is the SHA-256 (lowercase hex) of the token

- red: `TypeError: Cannot read properties of undefined (reading 'includes')` (no page_link, 1 failed)
- green: random token, hash stored, `pageLink`
- commit: `a61d3fb`

## Cycle U238: the result carries ids, deadline, upload, curl, page link, limits

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `signUpload`, `curlLine`, `limitsFor`
- commit: `608d7d0`

## Cycle U239: upload.url goes through publicUrl

- first run passed. Mutant: `url: signed.data.url` (no `publicUrl`) -> `Values are not equal.`; restored
- commit: `4b82cfc`

## Cycle U240: sensitivity_tier stored

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `sensitivity_tier` passed to the row
- commit: `f1624f3`

## Cycle U329: an expired pending upload does not block

- first run passed. Mutant: `findPending` now replaced by `new Date(0)` -> `Values are not equal.`; restored
- commit: `9af1cd0`

## Cycle U330: only some of the three details refused

- red: `AssertionError: Values are not equal: {"file_name":"manual.pdf"}` (1 failed); a second red on the message wording (`Expected ... to contain "give all three, or none for a phone upload"`), then the message was reworded to contain it
- green: given-count check
- commit: `456a747`

## T030: finish_attachment

## Cycle U241: passes id and rebuild, returns the outcome

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `resolveAttachment`, `services.finish`
- commit: `4c8781a`

## Cycle U242: busy names the running operation

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `busyReply`
- commit: `86f0eb8`

## T041: attach_file note and phone upload

## Cycle U244: note saved through insertNote as the parent

- red: `AssertionError: Values are not equal.` (1 failed)
- green: embed the note, `insertNote`, `noteMetadata`; handler moved into `attachFile`
- commit: `c546ad1`

## Cycle U245: a matching note attaches to the existing thought

- red: `Expected actual: "Attachment ... started on thought ..." to contain: "attached to your existing thought"` (1 failed)
- green: text line when `created` is false
- commit: `3b9c746`

## Cycle U246: HEIC with note saves no note

- first run passed. Mutant: `if (refusal) void 0;` -> `Values are not equal.`; restored
- commit: `1ab6640`

## Cycle U247: over-cap with note saves no note

- first run passed. Same mutant -> `Values are not equal.`; restored
- commit: `6f533ef`

## Cycle U248: phone upload without details

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `file` is null; no `signUpload`, no declaration, `expected_kind`, all limits
- commit: `b9e1421`

## Cycle U249: expected_kind other than photo or pdf refused

- first run passed. Mutant: `z.string()` cast in place of the enum -> `Values are not equal.`; restored (a first mutant failed type checking, so it was replaced)
- commit: `512c31f`

## T049: get_attachment

## Cycle U250: details

- red: `AssertionError: Values are not equal.` (1 failed)
- green: details and text
- commit: `f9c7eed`

## Cycle U251: a stored file gets a download link

- red: `AssertionError: Values are not equal: processed` (1 failed)
- green: `signDownload` through `publicUrl`, lifetime stated
- commit: `39d1d0b`

## Cycle U252: no link for pending_upload

- red: `AssertionError: Values are not equal.` (1 failed)
- green: state check
- commit: `27bd18c`

## Cycle U253: no link for refused

- first run passed. Mutant: removed `&& row.state !== "refused"` -> `Values are not equal.`; restored
- commit: `594e899`

## Cycle U331: a cut-off finish reads failed

- red: `Values are not equal.` (`+ failed`, 1 failed)
- green: `asReported`
- commit: `9dc7f0e`

## Cycle U332: one second before busy_until reads as stored

- first run passed. Mutant: expiry compared with `now + 2000` -> `Values are not equal.`; restored
- commit: `98a0956`

## Cycle U333: a cut-off rebuild reads processed with the cut-off noted

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `last_rebuild_error` in the output
- commit: `0fb54ef`

## Cycle U353: cut-off finish reads failed and keeps its download link

- first run passed. Mutant: raw row state used for the link check -> `TypeError: Cannot read properties of undefined (reading 'url')` (no link); restored
- commit: `0da9e98`

## T050: list_attachments

## Cycle U254: by thought

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `listByParent`, `summary`
- commit: `cf5b222`

## Cycle U255: by derived thought

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `attachmentForDerived`
- commit: `bd5ecc0`

## Cycle U256: both or neither refused

- red: `AssertionError: Values are not equal: {"thought_id":...,"derived_thought_id":...}` (1 failed)
- green: exactly-one rule
- commit: `406ab4b`

## Cycle U257: no owner says not found

- red: `Expected actual: "" to contain: "not found".` (1 failed)
- green: "not found" text for an empty list
- commit: `2198cf5`

## Cycle U334: cut-off finish reads failed in a list

- first run passed. Mutant: `summary(row)` without `asReported` -> `Values are not equal.` (`+ "failed"`); restored
- commit: `4a0062a`

## T063: remove_attachment

## Cycle U258: no confirm is a dry run

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `removalPreview` text and fields
- commit: `b8812c9`

## Cycle U259: confirm removes the file then the records

- red: `AssertionError: Values are not equal.` (1 failed)
- green: claim, `deleteObject`, `removeAttachment`, release in `finally`
- commit: `79131f3`

## Cycle U260: busy refused

- first run passed. Mutant: busy branch returns `ok` -> `Values are not equal.`; restored
- commit: `2c05091`

## Cycle U335: failed record removal reported, attachment stays listed

- first run passed. Mutant: removal error branch returns `Removed` -> `Values are not equal.`; restored
- commit: `2365c71`

## Cycle U336: repeat remove succeeds after a failed removal

- first run passed. Mutant: release replaced by `void token` -> `Values are not equal.` (repeat is busy); restored
- commit: `c6134f9`

## Cycle U354: remove proceeds after a cut-off remove

- first run passed. Mutant: `removeAttachment(row.id, "stale")` -> `Values are not equal.`; restored
- commit: `12cf458`

## T064: find_orphan_attachments

## Cycle U261: orphans with id, file name, why and derived_count

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `orphans(now)` mapping
- commit: `4378c67`

## Cycle U243: id-taking tools accept short ids

- red: `Expected actual: "Ambiguous attachment id: ..." to contain: "ambiguous".` (1 failed)
- green: message reworded; then mutant `services.finish(attachment_id, ...)` (raw id) -> `Values are not equal.`; restored
- commit: `d324119`

## Cycle U232b: refusal code passed through (extra, with U232)

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `fail(message, code)`
- commit: `48f95b5`

Refactor: removed the unused placeholder handler, commit `8ff95de`.

## DONE behaviors

U217-U261, U328-U330, U331-U336, U353, U354, U243 (T027, T028, T029, T030, T041, T049, T050, T063, T064 all complete).

## Stream P merged: phone page and routes (merge `b7788be`), folded from cycle-log.d/p.md

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-page`, branch `contrib/mfelker/thought-attachments-page`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. A "mutant" red means the test passed on its first run; the code was then broken minimally (applied, confirmed with grep or by the failure text), the test failed as quoted, and the file was restored byte for byte (`git diff --quiet` clean). The `63 ignored` are the integrator's todo acceptance tests.

Seam notes: the page token is stored as the SHA-256 hex of the token string (`attachmentForPageToken(hash)`). `/page/start` refusals answer `400` with `{ code, message }`. A `410` answers `{ error: "This link has expired or was already used. Ask your assistant for a new one" }`. No column says whether a declaration came from the attach call or from the page, so `pageRoutes` keeps an in-process set of attachments the page declared and replaces only those (U269); a recycled instance would refuse a second differing pick (see the final report).

Cycle baseline: suite 153 passed at `0b10510`.

## T042, T043: `src/page_routes.ts`, `tests/page_routes_test.ts`

## Cycle U262: /page/start records the picked file and returns a signed link

- test: `tests/page_routes_test.ts::U262 /page/start with a valid token and no declaration records the base name, type and size and returns a signed link through publicUrl` (new)
- red: `error: Error: not implemented` (1 failed; stub, first cycle)
- green: `/page/start` looks up the token by hash, records the declaration, signs the upload and rewrites it through `publicUrl`. Suite 154 passed
- refactor: none
- commit: `7f453ac`

## Cycle U263: a pick matching the attach call's declaration confirms it

- test: `U263 /page/start whose pick matches the attach call's declaration confirms it and returns a link` (new)
- first run: `1 passed` (the recording path already returned the same path)
- mutant: storage path written as `attachments/<id>/x-<name>` -> `-  "attachments/a0000001-.../x-receipt.jpg"` / `+  ".../receipt.jpg"` (1 failed); restored, rerun `1 passed`. Suite 155 passed
- commit: `cc831ce`

## Cycle U264: a pick that differs from the attach call's declaration is refused

- test: `U264 /page/start whose pick doesn't match the attach call's declaration is refused, with no link` (new)
- red: `-  200, -  undefined, +  400, +  "wrong_size"` (1 failed)
- green: compare type and size against a declaration that exists (codes `wrong_type`, `wrong_size`); the name is not compared, since the stored path is fixed by the attach call. Suite 156 passed
- commit: `d9781f2`

## Cycle U265: a picked HEIC file is refused

- test: `U265 a picked HEIC file is refused with the share-as-JPEG message, with no link` (new)
- red: `-  200, -  undefined, +  400, +  "heic"` (1 failed)
- green: `checkDeclared` runs before any write or link. Suite 157 passed
- commit: `b9f811e`

## Cycle U266: a picked type outside the four is refused

- test: `U266 a picked type outside the four is refused with attach_file's message, with no link` (new)
- first run: `1 passed` (`checkDeclared` already covers it)
- mutant: `if (refusal && refusal.code === "heic") return ...` -> `-  200, +  400, +  "unsupported_type"` (1 failed); restored. Suite 158 passed
- commit: `2fe754a`

## Cycle U268: a picked size over its cap is refused

- test: `U268 a picked size over its cap is refused, naming the cap and the size` (new)
- first run: `1 passed`
- mutant: `checkDeclared({ ..., size: 1 })` -> `-  200, +  400, +  "too_large"` (1 failed); restored. Suite 159 passed
- commit: `5a94276`

## Cycle U267: a pick of the wrong kind for expected_kind is refused

- test: `U267 a pick whose kind differs from expected_kind is refused, a PDF for a photo and the reverse` (new)
- red: `-  200, -  undefined, ... +  "wrong_type", +  400` (1 failed)
- green: compare "is a PDF" with `expected_kind === "pdf"`, code `wrong_type`. Suite 160 passed
- commit: `33de7d6`

## Cycle U269: a second /page/start replaces the declaration

- test: `U269 a second /page/start replaces the declaration and returns a new link` (new)
- red: `-  400, +  200` (the second pick was refused as a mismatch; 1 failed)
- green: an in-process set of attachments the page declared; a mismatch is checked only against an attach-call declaration. Suite 161 passed
- commit: `69b1330`

## Cycle U270: an unknown token gets 410

- test: `U270 an unknown token gets 410 with the expired message` (new; also a request with no token)
- red: `-  "gone", +  "This link has expired or was already used. Ask your assistant for a new one"` (1 failed)
- green: the message constant, and a missing or non-string token is treated as unknown. Suite 162 passed
- commit: `0d08f8c`

## Cycle U271: a used token gets 410

- test: `U271 a used token gets 410 with the same message` (new)
- first run: `1 passed` (the store returns null once the hash is cleared)
- mutant (first attempt failed type-checking, so it was invalid and redone): `// @ts-nocheck` plus removing `|| found.data === null` -> `TypeError: Cannot read properties of null (reading 'id')` (1 failed); restored. Suite 163 passed
- commit: `02dd621`

## Cycle U272: a token past upload_deadline gets 410

- test: `U272 a token one second after upload_deadline gets 410` (new)
- red: `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed)
- green: `now >= upload_deadline` is expired. Suite 164 passed
- commit: `5ed26f1`

## Cycle U273: a token one second before the deadline is accepted

- test: `U273 a token one second before upload_deadline is accepted` (new)
- first run: `1 passed`
- mutant: deadline check `>= deadline - 2000` -> `-  410, -  0, +  200, +  1` (1 failed); restored. Suite 165 passed
- commit: `e0fb064`

## Cycle U274: no brain key needed or accepted

- test: `U274 the page routes need no brain key, and a brain key without a valid token gets 410` (new)
- first run: `1 passed`
- mutant: the handler answers `{ upload: {} }` when `x-brain-key` equals the brain key -> `+  410, +  410, -  200, -  200` (1 failed); restored. Suite 166 passed
- commit: `eb8908c`

## Cycle U275: CORS only for the UPLOAD_PAGE_URL origin

- test: `U275 CORS allows the origin of UPLOAD_PAGE_URL and gives no allow-origin to any other origin` (new; POST and preflight)
- red: `+  "https://pages.example.test", +  "https://pages.example.test", -  null, -  null` (1 failed)
- green: a middleware on `/page/*` that allows the page origin or the request's own origin, and answers preflight `204`. Suite 167 passed
- commit: `f3d11f9`

## Cycle U276: CORS allows the same origin when the function serves the page

- test: `U276 CORS allows the same origin when the page is served by the function` (new)
- first run: `1 passed` (the default `UPLOAD_PAGE_URL` is under `PUBLIC_BASE_URL`, and the middleware allows the request's own origin)
- mutant: removed `|| origin === new URL(c.req.url).origin` -> `+  "https://other-host.example.test", -  null` (1 failed); restored. Suite 168 passed
- commit: `842bde6`

## Cycle U337: /page/info

- test: `U337 /page/info returns the expected kind, the four accepted types and the caps, and changes nothing` (new)
- red: `SyntaxError: Unexpected non-whitespace character after JSON at position 4` (the route answered `404 Not Found`; 1 failed)
- green: `/page/info`, with the token lookup refactored into `attachmentFor(body)` (null for unknown, used, expired or missing). Suite 169 passed
- refactor: `attachmentFor` shared by all three routes
- commit: `f9b4ff5`

## Cycle U338: /page/info with no expected kind

- test: `U338 /page/info for an attachment started with no expected kind returns no expected kind` (new)
- first run: `1 passed`
- mutant: `expected_kind: row.expected_kind ?? "photo"` -> `-  "photo"` / `+  null` (1 failed); restored. Suite 170 passed
- commit: `b9a40b2`

## Cycle U339: /page/info with a bad token

- test: `U339 /page/info with an unknown, used or expired token gets 410 with the expired message` (new)
- first run: `1 passed`
- mutant: deleted the deadline line in `attachmentFor` -> `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed); restored. Suite 171 passed
- commit: `c1cf333`

## Cycle U352: /page/info shape and caps

- test: `U352 /page/info returns exactly expected_kind, accepted_types and caps, with image_bytes at MAX_IMAGE_MB times 1048576` (new)
- first run: `1 passed`
- mutant: `mb * 1000 * 1000` -> `-  image_bytes: 10000000, -  pdf_bytes: 7500000, +  image_bytes: 10485760, +  pdf_bytes: 7864320` (1 failed); restored. Suite 172 passed
- commit: `1df5a8a`

## Cycle U277: /page/finish finishes its own attachment

- test: `U277 /page/finish finishes only its own attachment, returns the outcome as JSON and uses the token up` (new)
- red: `-  404` / `+  200` (1 failed)
- green: `services.finish(row.id, {})`, then `consumePageToken`. Suite 173 passed
- commit: `63ae7b2`

## Cycle U278: a second /page/finish gets 410

- test: `U278 a second /page/finish with the same token, after processed, gets 410` (new)
- first run: `1 passed`
- mutant: removed the `consumePageToken` line -> `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed); restored. Suite 174 passed
- commit: `2135898`

## Cycle U279: a token never finishes another attachment

- test: `U279 a token for attachment X never finishes attachment Y` (new; the body also carries Y's ids)
- first run: `1 passed`
- mutant: `services.finish(body.id ?? row.id, {})` -> `-  "a0000002-..."` / `+  "a0000001-..."` (1 failed); restored. Suite 175 passed
- commit: `6eb038e`

## Cycle U280: busy leaves the token valid

- test: `U280 a /page/finish refused as busy returns the busy outcome and leaves the token valid` (new)
- red: `-  null` / `+  "8d3875317d1b79cc..."` (the token was used up; 1 failed)
- green: consume only when `outcome.busy === undefined`. Suite 176 passed
- commit: `9e67335`

## Cycle U340: no file uploaded yet leaves the token valid

- test: `U340 a /page/finish with no file uploaded yet returns it and leaves the token valid` (new)
- red: `-  null` / `+  "8d3875317d1b79cc..."` (1 failed)
- green: an outcome with `state: "pending_upload"` also leaves the token valid. Suite 177 passed
- commit: `e016546`

## Cycle U341: a refused outcome uses the token up

- test: `U341 a /page/finish whose outcome is refused uses the token up` (new)
- first run: `1 passed`
- mutant: also keep the token valid when the state is `refused` -> `-  200, +  410` (1 failed); restored. Suite 178 passed
- commit: `d032f55`

## T044: `upload-page.html`, `tests/page_script_test.ts`, `tests/helpers/page_dom.ts`

The stand-in (`page_dom.ts`) makes an element for every `id` in the HTML (attributes and static text included), runs the first inline `<script>` with `document`, `location`, `fetch`, `setTimeout` and `clearTimeout` supplied, and has a virtual clock (`advance(ms)`) for the retry timer. Progress is shown as "Uploading …" text plus a `<progress>` element, since `fetch` has no upload progress.

## Cycle U281: the token comes only from the #t= fragment

- test: `tests/page_script_test.ts::U281 the page reads its token only from the #t= fragment; a token in the query string is ignored` (new)
- red: `+  [ { token: "fragment-token" } ]` / `-  []` (1 failed; the scaffold HTML had an empty script)
- green: `readToken()` from `location.hash`, `/page/info` call, the expired text when there is no token, and `apiBase()`. Suite 179 passed
- commit: `ef75438`

## Cycle U282: a filled-in API address is the only address called

- test: `U282 with its API-address line filled in, every request goes to that address, never to one taken from the link` (new; the link carries hostile `api=` and `base=` values)
- first run: `1 passed`
- mutant: `if (false && API_ADDRESS) return ...` -> `TypeError: FakeFetch: no route for POST https://brain.example.test/functions/v1/thought-attachments/page/info` (reported as 2 failed: the test and its unhandled rejection); restored. Suite 180 passed
- commit: `d60d3c4`

## Cycle U283: a blank line uses the served-from address

- test: `U283 with its API-address line blank, every request goes to the address the page was served from` (new)
- red: `+  "https://brain.example.test/functions/v1/thought-attachments/page/start"` missing (no request was made on a pick; 1 failed)
- green: a `change` handler on the file input that posts `/page/start`. Suite 181 passed
- commit: `d4bc933`

## Cycle U284: the file input accepts the four types and one file

- test: `U284 the file input accepts exactly the four types and one file` (new)
- first run: `1 passed`
- mutant: `accept="image/jpeg,image/png,application/pdf"` -> `-  "image/jpeg,image/png,application/pdf"` / `+  "image/jpeg,image/png,image/webp,application/pdf"` (1 failed); restored. Suite 182 passed
- commit: `0801f87`

## Cycle U285: the page shows the accepted types

- test: `U285 the page shows the accepted types` (new)
- red: first attempt `Expected actual: "" to contain: "JPEG"` came from a gap in the stand-in (it did not read static text), and I committed before checking the full suite, so the first commit was red. Amended to `d9a40d0` after the stand-in read static text. Red re-proved against the page with the text removed: `Expected actual: "" to contain: "JPEG".` (1 failed)
- green: static text in `#types`. Suite 183 passed
- commit: `d9a40d0` (amended)

## Cycle U286: a refusal from /page/start is shown

- test: `U286 a refusal from /page/start is shown, and no PUT happens` (new)
- red: `Expected actual: "" to contain: "The file is 20000000 bytes, over the cap of 10485760 bytes."` (1 failed)
- green: a `400` shows "Refused: <message>". Suite 184 passed
- commit: `8643986`

## Cycle U287: upload progress during the PUT

- test: `U287 upload progress is shown during the PUT` (new; the PUT reply is held)
- red: `-  0` / `+  1` held requests (no PUT was made; 1 failed)
- green: `upload()` shows "Uploading <name>…" and un-hides `#progress`. Suite 185 passed
- commit: `9eb2802`

## Cycle U288: PUT the file, then call /page/finish

- test: `U288 the page PUTs the one file to the returned link, then calls /page/finish` (new)
- red: `+  "POST /page/finish"` missing (1 failed)
- green: `finish()` after the PUT. Suite 186 passed
- commit: `3c8e4af`

## Cycle U289: each outcome shows its text

- test: `U289 each outcome shows its text from the contract` (new; six outcomes, a 400-character caption)
- red: `-  Uploading receipt.jpg…` / `+  Captioned: xxxx…` (1 failed)
- green: `outcomeText()`. Suite 187 passed
- commit: `29dd688`

## Cycle U290: a 410 shows the expired message

- test: `U290 a 410 shows the expired message, from info, start and finish` (new)
- red: `TypeError: Cannot read properties of undefined (reading 'url')` (the `410` body was read as an upload target; reported as 2 failed with its unhandled rejection)
- green: refactor into `call(path, body)`, which shows the expired message and resolves null on `410`. Suite 188 passed
- refactor: `call`, `show` and the chain moved into one place
- commit: `55f3412`

## Cycle U291: no key, token or address beyond the API-address line

- test: `U291 the file contains no key, no token and no project address other than its API-address setting` (new)
- first run: `1 passed`
- mutant: added `var HOST = "https://project.example.test";` -> `-  [ "https://" ]` / `+  null` (1 failed); restored. Suite 189 passed
- commit: `597901f`

## Cycle U292: no external script or style

- test: `U292 the file loads no external script or style` (new)
- first run: `1 passed`
- mutant: added `<link rel="stylesheet" href="x.css">` -> `-  [ "<link" ]` / `+  null` (1 failed); restored. Suite 190 passed
- commit: `fba7ddb`

## Cycle U342: the page shows the expected kind and the size limit

- test: `U342 before any pick, the page sends { token } to /page/info and shows the expected kind and the size limit` (new)
- red: `Expected actual: "" to contain: "photo".` (1 failed)
- green: `showInfo()`. Suite 191 passed
- commit: `c560fe1`

## Cycle U343: Waiting… and a retry every 10 seconds

- test: `U343 when /page/finish answers busy or no file yet, the page shows Waiting… and calls it again 10 seconds later` (new; both answers, injected timer)
- red: `-  "Failed: undefined"` / `+  "Waiting…"` (1 failed)
- green: a busy or `pending_upload` answer shows "Waiting…" and `setTimeout(finish, 10000)`. Suite 192 passed
- commit: `e403355`

## Cycle U344: no retry before 10 seconds

- test: `U344 9 seconds after a busy answer, the page has not called /page/finish again` (new)
- first run: `1 passed`
- mutant: `setTimeout(finish, 5000)` -> a second finish call at 9 s (1 failed); restored. Suite 193 passed
- commit: `f0bca41`

## Cycle U345: a 410 on a retry shows the expired message and stops

- test: `U345 when a retried /page/finish gets 410, the page shows the expired message and stops retrying` (new)
- first run: `1 passed`
- mutant: `if (!r) { retry = setTimeout(finish, 10000); return; }` -> `-  1` / `+  0` pending timers (1 failed); restored. Suite 194 passed
- commit: `9a35b33`

## Cycle U346: the repository page has its API-address line blank

- test: `U346 the repository's upload-page.html has its API-address line blank` (new)
- first run: `1 passed`
- mutant: `var API_ADDRESS = "x";` -> `-  false` / `+  true` (1 failed); restored. Suite 195 passed
- commit: `e197f10`

## Cycle P1 (extra, not in the test list): a failed upload or unreachable server shows Failed

- test: `P1 a failed upload or an unreachable server shows Failed, and /page/finish is not called` (new)
- red: `Expected actual: "Captioned: A receipt on a desk" to contain: "Failed: ".` (1 failed)
- green: a non-ok PUT shows "Failed: the upload was not accepted (<status>)." and does not finish; a network error shows "Failed: could not reach the server." Suite 196 passed
- commit: `9076b02`

## Refactor: inline phone-width style

- no behavior change; suite 196 passed. commit: `8998082`

<!-- end -->

### Integrator verification of wave 2 (streams N, T and P)

- Suite green at every commit of each stream (N 41, T 58, P 44 commits; throwaway worktrees, fork-ci flags). Each stream changed only its owned files, and every commit has its trailers.
- A cross-stream rule was pinned in each stream by a mutant re-applied on a copy of its final code, with each edit confirmed:
  - **N:** `checkActual({ ...row, page_count: null }` (`src/finish.ts:114`, page count dropped before the checks): 1 test fails;
  - **P:** `if (true) await deps.store.consumePageToken` (`src/page_routes.ts:107`, token used up even when busy): 2 tests fail;
  - **T:** `.toUpperCase()` on the page-token SHA-256 hex (`src/tools.ts:41`): 2 tests fail.
- Merged in order N `40458e0`, T `a65bb2d`, P `b7788be`. Suite after each: 194, 251, 294 passed; 63 todos.
- Extra behaviors renamed in a structural commit on W (`4a18c39`): T's U232b → **U362**, P's P1 → **U363**.
- **Open finding (integrator, to fix before wave 3):** `src/page_routes.ts` keeps "this declaration came from the page" in an in-memory `Set` (`declaredByPage`). Edge Function isolates don't keep memory between requests, so on a new isolate a second pick (which should replace the declaration, contracts/upload-page.md) is refused as a mismatch. The fix needs a stored flag: a schema column, the store, and the page route.

## Integrator cycles U365–U367: the page-declared flag is stored, not kept in isolate memory

Found in the wave-2 review: `src/page_routes.ts` kept a `declaredByPage` `Set` in memory, and Edge Function isolates don't keep memory between requests.

- **U365** (`tests/page_routes_test.ts`)
  - red: `--filter "/^U365 /"` → `- 400` / `+ 200` for the second pick on a fresh `pageRoutes` instance (1 failed)
  - green: `AttachmentRow.declared_by_page?` (optional, so other streams' row literals still type-check); the route reads `row.declared_by_page` instead of the `Set`, which is removed; the fake store sets the flag on `setDeclaration`. Suite → 295 passed
  - commit: `5eb3476`
- **U366** (`tests/page_routes_test.ts`)
  - red: `- undefined` / `+ true` for `declared_by_page` in the `setDeclaration` call (1 failed)
  - green: `Declaration.declared_by_page?`; the route sends `declared_by_page: true`; the fake store stores what it is given (as the real store's PATCH does), so U358's exact-body assertion stays valid. Suite → 296 passed
  - commit: `80480ce`
- **U367** (`tests/verify.sql`)
  - red: U34's expected column list gains `declared_by_page|boolean|NO|false`, a deliberate extension of a DONE test because the data model grows → `ERROR: U34: columns differ` (fresh database `u367`)
  - green: the column is added in `create table`, plus `alter table … add column if not exists` for earlier installs. `verify.sql` passed twice; run 1 exercised the upgrade path on the red run's old table. Deno suite 296 passed
  - commit: `be151ad`

## Stream A merged: app, entry, /upload; acceptance flips (merge `b53bab8`), folded from cycle-log.d/a.md

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-app`, branch `contrib/mfelker/thought-attachments-app`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. A "mutant" red means the test passed on its first run; the code was then broken minimally (confirmed with grep), the test failed as quoted, and the file was restored byte for byte.

Cycle baseline: suite 296 passed, 63 ignored at `be151ad`.

## T031: `src/app.ts`, `tests/app_test.ts`

## Cycle U293: the correct key in x-brain-key lets initialize succeed

- test: `tests/app_test.ts::U293 the correct key in x-brain-key lets an MCP initialize succeed` (new)
- red: `error: Error: not implemented` (1 failed)
- green: `createApp` composes `createFinisher`, `buildServer` and a `StreamableHTTPTransport` per request on a Hono app. Suite 297 passed
- commit: `7b6c1a0`

## Cycle U294: the correct key as ?key= lets initialize succeed

- test: `tests/app_test.ts::U294 the correct key as ?key= lets an MCP initialize succeed` (new)
- first run: `1 passed` (no key check yet)
- mutant: `if (new URL(c.req.url).searchParams.has("key")) return c.json({ error: "mutant" }, 401);` -> `-   "mutant"` (1 failed); restored. Suite 298 passed
- commit: `7738897`

## Cycle U295: a wrong key gets the core's authorization error and the store is never called

- test: `tests/app_test.ts::U295 a wrong key gets an authorization error, and the store is never called` (new)
- red: `-     calls: [ "listByParent" ]` / `+     error: { code: -32001, … }` (1 failed)
- green: the key from `x-brain-key` or `?key=`, compared in constant time (`sameKey`: XOR over every byte of the expected key, lengths folded in); a refusal is the core's JSON-RPC envelope, code -32001, HTTP 200, echoing the request id. Suite 299 passed
- commit: `e89f83c`

## Cycle U296: a missing key gets an authorization error

- test: `tests/app_test.ts::U296 a missing key gets an authorization error` (new)
- first run: `1 passed`
- mutant: `if (given && !sameKey(…))` -> `-     error: undefined` with a full `tools/list` result (1 failed); restored. Suite 300 passed
- commit: `f976182`

## Cycle U297: an empty configured key refuses every MCP request

- test: `tests/app_test.ts::U297 with an empty configured key, every MCP request is refused` (new; settings tweaked to `mcpAccessKey: ""`, since `loadSettings` already refuses it, U355)
- first run: `1 passed`
- mutant: `if (given === null || !sameKey(…))` -> `-       undefined` / `+       -32001` for the empty `?key=` (1 failed); restored. Suite 301 passed
- commit: `2096a4c`

## Cycle U298: CORS as the core server

- test: `tests/app_test.ts::U298 an OPTIONS preflight gets the CORS headers the core server sends, with no key` (new; also the headers on a reply and on a refusal)
- red: `-     body: '{"jsonrpc":"2.0","error":{"code":-32001,…` / `+     body: "ok"` (1 failed)
- green: `app.options("*")` answers `ok` with the core's `corsHeaders`; MCP replies and refusals carry them; `mcp-session-id` is dropped as the core does. Suite 302 passed
- commit: `98e6f8c`

## Cycle U299: the Accept header patch

- test: `tests/app_test.ts::U299 an MCP request with no event-stream Accept header is handled, as the core server patches it` (new)
- red: `-     status: 406` with "Not Acceptable: Client must accept both application/json and text/event-stream" (1 failed)
- green: the core's patched request with `Accept: application/json, text/event-stream`. Suite 303 passed
- commit: `c5df52e`

## Cycle U347: settings not ok, an MCP call gets the named error

- test: `tests/app_test.ts::U347 createApp with settings not ok answers an MCP tools/call with the named settings error and nothing else` (new)
- red: `error: Error: not implemented` at `createApp` (1 failed)
- green: `createApp({ ok: false })` returns a handler that answers every request with a JSON-RPC error (code -32000, HTTP 200, CORS headers) whose message is `setting <NAME> is invalid: <reason>`, problems joined by a semicolon followed by a space. Suite 304 passed
- commit: `e111421`

## Cycle U348: the error never echoes the value

- test: `tests/app_test.ts::U348 the settings error names the setting and what it must be, never the value given` (new)
- first run: `1 passed`
- mutant: drop `: ${p.reason}` -> `Expected actual: "…setting MAX_IMAGE_MB is invalid; setting MAX_PDF_PAGES is invalid…" to contain: "setting MAX_PDF_PAGES is invalid: must be a positive whole number".` (1 failed); restored. Suite 305 passed
- commit: `a3d1454`

## T032: `productionDeps()`, `tests/imports_test.ts`

## Cycle U300: productionDeps with settings not ok

- test: `tests/app_test.ts::U300 productionDeps with settings that are not ok returns ok false, naming the settings and no values, without throwing` (new; process env set and restored around the call)
- red: `error: Error: not implemented` (1 failed)
- green: `loadSettings(Deno.env.get)`; not ok returns `{ ok: false, problems }`. The ok branch still threw (it is U301's). Suite 306 passed
- commit: `fe110fd`

## Cycle U301: the production store talks to SUPABASE_URL with the service-role key

- test: `tests/app_test.ts::U301 productionDeps' store sends its requests to SUPABASE_URL with the service-role key` (new; `globalThis.fetch` stubbed and restored)
- red: `error: Error: not implemented` (1 failed)
- green: `createSupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, settings, fetch)`, the real embedding and vision clients, all over a late-bound `globalThis.fetch`; `now` is the wall clock and `randomBytes` is `crypto.getRandomValues`. Suite 307 passed
- commit: `3f3deea`

## Cycle U351: settings error versus the key check

- test: `tests/app_test.ts::U351 with MCP_ACCESS_KEY set a missing or wrong key is unauthorized; unset, every call gets the named settings error instead` (new; through `productionDeps()` and `createApp`)
- first run: `1 passed`
- mutant: in the settings-error handler, `if (!request.headers.get("x-brain-key")) return await unauthorized(request);` -> `-       "Unauthorized: missing or invalid authentication."` / `+       "setting MCP_ACCESS_KEY is invalid: must be set"` (1 failed); restored. Suite 308 passed
- commit: `cf9e97c`

## Cycle U302: index.ts is the one-line entry

- test: `tests/imports_test.ts::U302 index.ts is the one-line entry` (new)
- first run: `1 passed` (the integrator wrote `index.ts` in T006)
- mutant: `Deno.serve({ port: 8080 }, createApp(productionDeps()).fetch);` -> `-     "Deno.serve({ port: 8080 }, …` (1 failed); restored. Suite 309 passed
- commit: `2053969`

## Cycle U303: no bare import specifier (BLOCKED, not committed)

- test: `tests/imports_test.ts::U303 no .ts file outside tests/ has a bare import specifier` (written, run, then removed; kept at `/Users/mfelker/.claude/jobs/4ac8d127/tmp/a/imports_with_u303.ts`)
- red: `-     "src/store.ts: @supabase/supabase-js",` / `+   []` (1 failed)
- the fix belongs to stream Q's `src/store.ts` line 7: `import { createClient } from "@supabase/supabase-js";` must be `"npm:@supabase/supabase-js@2.47.10"` (tasks.md Seams "Imports", spec 004 R10). Reported to the integrator; the test is not committed, since a red commit is not allowed
- commit: none

## Cycle U304: no pdf-lib outside tests

- test: `tests/imports_test.ts::U304 no .ts file outside tests/ imports pdf-lib` (new)
- first run: `1 passed`
- mutant: `import { PDFDocument } from "npm:pdf-lib@1.17.1";` added to `src/app.ts` -> `-     "src/app.ts: npm:pdf-lib@1.17.1",` (1 failed); restored. Suite 310 passed
- commit: `ac054da`

## T045: `GET /upload` and the page routes in `src/app.ts`

## Cycle U305: GET /upload serves text/html with no key

- test: `tests/app_test.ts::U305 GET /upload returns 200 with text/html, with no brain key` (new; through `FUNCTION_URL`, `http://localhost/thought-attachments`)
- red: `-     type: "application/json"` / `+     type: "text/html"` (1 failed; the key check answered)
- green: `withLocalPath` strips an optional `/functions/v1` and then an optional `/thought-attachments` from the path before routing; `GET /upload` returns the bytes of `upload-page.html` (read beside `src/`) as `text/html; charset=utf-8`. Suite 311 passed
- commit: `9ee9050`

## Cycle U306: the page byte for byte, with either prefix

- test: `tests/app_test.ts::U306 the GET /upload body is upload-page.html byte for byte, its API-address line still blank, with or without /functions/v1` (new)
- first run: `1 passed`
- mutant: serve `(await Deno.readTextFile(UPLOAD_PAGE)).trim()` -> `-       false, false` / `+       true, true` (1 failed); restored. Suite 312 passed
- commit: `34628a9`

## Cycle U307: /page/start needs no brain key

- test: `tests/app_test.ts::U307 /page/start through createApp with no brain key is not refused by the key check` (new; a seeded row and page token)
- red: `-     declared: null, method: undefined` / `+     declared: "shelf.jpg", method: "PUT"` (1 failed)
- green: `app.route("/", pageRoutes(deps, services))` before the `OPTIONS` handler and the key check, so `/page/*` (and its own CORS preflight) never reaches them. Suite 313 passed
- commit: `28d84c4`

## Cycle U349: settings not ok, the page routes get the named error

- test: `tests/app_test.ts::U349 createApp with settings not ok answers /page/info, /page/start and /page/finish with the named error, no brain key needed` (new)
- red: `-       message: undefined, status: 200` / `+       message: "setting MAX_PDF_PAGES is invalid: …", status: 400` (1 failed; the JSON-RPC envelope answered)
- green: with settings not ok, a `/page/*` path answers `400 { code: "settings_invalid", message }`, which the page shows as "Refused: <message>"; every other path keeps the JSON-RPC error. Suite 314 passed
- commit: `066416f`

## Flips: `tests/acceptance_test.ts` (T033, T046, T051, T059, T065)

Red confirmation for every flip: with `src/app.ts` set back to the T006 stub (`git show be151ad:…/src/app.ts`), `RUN_TODO=1` on `tests/acceptance_test.ts` gave 63 failed, each `error: Error: not implemented` (the reds the integrator recorded in T012); the file was then restored byte for byte (`git status --short` clean). With the T031/T032/T045 `src/app.ts`, all 63 passed under `RUN_TODO=1` before any flip, so each flip is the commit that turns its test into a plain `Deno.test`: run alone (`1 passed`), then the suite, then one commit. No assertion was changed. The last flip (A56) also removes the now-unused `todo` import.

| id | task | single | suite | commit |
| --- | --- | --- | --- | --- |
| A1 | T033 | 1 passed | 315 passed | `23e9e3f` |
| A2 | T033 | 1 passed | 316 passed | `926cd2e` |
| A3 | T033 | 1 passed | 317 passed | `a6daceb` |
| A4 | T033 | 1 passed | 318 passed | `9d45c66` |
| A5 | T033 | 1 passed | 319 passed | `a1f9e21` |
| A6 | T033 | 1 passed | 320 passed | `d36e56c` |
| A7 | T033 | 1 passed | 321 passed | `9107181` |
| A8 | T033 | 1 passed | 322 passed | `1152f6f` |
| A9 | T033 | 1 passed | 323 passed | `b3a8113` |
| A10 | T033 | 1 passed | 324 passed | `4222ab7` |
| A11 | T033 | 1 passed | 325 passed | `040aa90` |
| A12 | T033 | 1 passed | 326 passed | `a83ce80` |
| A53 | T033 | 1 passed | 327 passed | `e971cbc` |
| A57 | T033 | 1 passed | 328 passed | `7bf06d2` |
| A59 | T033 | 1 passed | 329 passed | `bee3f1f` |
| A13 | T046 | 1 passed | 330 passed | `1eca474` |
| A14 | T046 | 1 passed | 331 passed | `185e8fb` |
| A15 | T046 | 1 passed | 332 passed | `e0394fa` |
| A16 | T046 | 1 passed | 333 passed | `6b559a5` |
| A17 | T046 | 1 passed | 334 passed | `c83ff18` |
| A18 | T046 | 1 passed | 335 passed | `fbe1edd` |
| A19 | T046 | 1 passed | 336 passed | `e00d703` |
| A20 | T046 | 1 passed | 337 passed | `e4d4f99` |
| A21 | T046 | 1 passed | 338 passed | `f121594` |
| A22 | T046 | 1 passed | 339 passed | `9db6041` |
| A23 | T046 | 1 passed | 340 passed | `fcce541` |
| A24 | T046 | 1 passed | 341 passed | `71fdce3` |
| A25 | T046 | 1 passed | 342 passed | `32f215c` |
| A26 | T046 | 1 passed | 343 passed | `82d4b8c` |
| A58 | T046 | 1 passed | 344 passed | `5773e62` |
| A60 | T046 | 1 passed | 345 passed | `9890879` |
| A61 | T046 | 1 passed | 346 passed | `6893c3f` |
| A27 | T051 | 1 passed | 347 passed | `4fb2c7e` |
| A28 | T051 | 1 passed | 348 passed | `f36f2d4` |
| A29 | T051 | 1 passed | 349 passed | `51f3bf3` |
| A30 | T059 | 1 passed | 350 passed | `7db7d58` |
| A31 | T059 | 1 passed | 351 passed | `03ad181` |
| A32 | T059 | 1 passed | 352 passed | `16b7f87` |
| A33 | T059 | 1 passed | 353 passed | `6827027` |
| A34 | T059 | 1 passed | 354 passed | `c7ebf31` |
| A35 | T059 | 1 passed | 355 passed | `b10db83` |
| A36 | T059 | 1 passed | 356 passed | `ccb6039` |
| A37 | T059 | 1 passed | 357 passed | `be0effa` |
| A38 | T059 | 1 passed | 358 passed | `26b86fd` |
| A39 | T059 | 1 passed | 359 passed | `33f0a33` |
| A40 | T059 | 1 passed | 360 passed | `3eff610` |
| A41 | T059 | 1 passed | 361 passed | `68d9d9a` |
| A42 | T059 | 1 passed | 362 passed | `479cc67` |
| A43 | T059 | 1 passed | 363 passed | `ad6e3fb` |
| A44 | T059 | 1 passed | 364 passed | `5295759` |
| A45 | T059 | 1 passed | 365 passed | `e4ead3d` |
| A54 | T059 | 1 passed | 366 passed | `d0837bc` |
| A55 | T059 | 1 passed | 367 passed | `1daae17` |
| A62 | T059 | 1 passed | 368 passed | `14a81e7` |
| A63 | T059 | 1 passed | 369 passed | `6018380` |
| A46 | T065 | 1 passed | 370 passed | `fbef574` |
| A47 | T065 | 1 passed | 371 passed | `69d5303` |
| A48 | T065 | 1 passed | 372 passed | `1a8d532` |
| A49 | T065 | 1 passed | 373 passed | `e6b17a5` |
| A50 | T065 | 1 passed | 374 passed | `f261036` |
| A51 | T065 | 1 passed | 375 passed | `c09a625` |
| A52 | T065 | 1 passed | 376 passed | `ad59d62` |
| A56 | T065 | 1 passed | 377 passed | `c4e3a83` |

After A56: `RUN_TODO=1` and the default run both give 377 passed, 0 failed, 0 ignored.

### Integrator verification of stream A, and cycle U303

- Suite green at all 81 commits (throwaway worktree, fork-ci flags). Only its owned files changed (`src/app.ts`, `tests/app_test.ts`, `tests/imports_test.ts`, `tests/acceptance_test.ts`), and every commit has its trailers.
- The acceptance flips changed only `todo(` → `Deno.test(` (plus removing the unused `todo` import): the diff has no assertion lines.
- Mutant re-applied on a copy: the key check reduced to `if (!given)` (`src/app.ts:110`, any non-empty key accepted) fails 4 tests. `sameKey` is constant-time: it folds the length difference into the result and doesn't stop early.
- Merged at `b53bab8`: **377 passed, 0 ignored. All 63 acceptance tests run and pass.**
- **U303** (integrator, after stream A blocked on stream Q's file): `tests/imports_test.ts::U303 no .ts file outside tests/ has a bare import specifier`.
  - red: `--filter "/^U303 /"` → `FAILED \| 0 passed \| 1 failed`, decisive diff `- "src/store.ts: @supabase/supabase-js"` / `+ []` (recorded by stream A, reproduced here)
  - green: `src/store.ts:7` now imports `npm:@supabase/supabase-js@2.47.10`. A real deploy risk is closed: the self-hosted router ignores a function's own import map (spec 004 R10). Suite → 378 passed
  - commit: `287280f`

## Audit remediation T086–T099 (folded from cycle-log.d/r.md)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`, branch `contrib/mfelker/thought-attachments`, folder `F` = `integrations/thought-attachments`. Source: `tdd/verification.md` (FAIL at `ff4bfc1`).

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Each entry applies the audit's mutant (or one the weak assertion lets through), shows the current test passing ("before"), strengthens or adds the test, shows it failing with the mutant still applied ("red"), restores the code byte for byte (`git diff -- src schema.sql` empty), and shows it passing ("green").

Cycle baseline: suite 378 passed, 0 failed at `ff4bfc1`.

## T086: Finding 1, U368 (new)

- finding: a busy `/page/finish` was only tested while the row was `pending_upload`, so the `state` clause hid the busy clause.
- mutant M04: `src/page_routes.ts:103` `outcome.busy === undefined && outcome.state !== "pending_upload"` to `outcome.state !== "pending_upload"`.
- before: U280 and A62 pass under M04 (`2 passed`).
- test: `tests/page_routes_test.ts::U368 a /page/finish busy behind a live finish claim on a not_captioned or failed attachment leaves the token valid` (real `createFinisher`, row seeded `not_captioned` then `failed` with a live `finish` claim).
- red: `AssertionError: Values are not equal: token kept for not_captioned` / `-     null,` (1 failed)
- green: code restored; `1 passed`. Suite 379 passed, 0 failed.
- commit: `338899a`

## T087: Finding 2, A7, A21, A27, A33, A36, A63 (strengthened)

- finding: links were checked only as `typeof === "string"`.
- test: new helpers `downloadLinkFor(w, id)` and `uploadLinkFor(w, id)` in `tests/acceptance_test.ts` find the fake store's signing of the row's own `storage_path` (throwing when there is none) and rewrite `SUPABASE_URL` to `PUBLIC_BASE_URL`. A7, A21, A27, A33 and A36 compare `download_link` with it; A63 compares the upload URL and its `token` query parameter with the signed upload.
- mutant M21: `src/links.ts:8` `return url;` before the rewrite. Before: the six tests pass (`6 passed`). Red: `6 failed`, e.g. A36 `-     link: "http://supabase.internal:8000/storage/v1/object/sign/ob1-files/attachments/…/broken.pdf?token=download-3",`.
- mutant (wrong-path upload signing): `src/tools.ts:123` `signUpload(storagePath + ".x")`. Before: A63 passes (`1 passed`). Red: `error: Error: no upload link was signed for attachments/8317ab3f-…/a.jpg` (1 failed).
- also checked: a wrong-path download signing (`src/tools.ts:304` path `+ ".x"`) already failed the old tests, because the fake store refuses to sign a missing object; the new tests fail too (`5 failed`).
- green: code restored (`git diff -- src schema.sql` empty); `6 passed`. Suite 379 passed, 0 failed.
- commit: `2567d29`

## T088: Finding 3, A21, A25, A34, A36 (strengthened)

- finding: "with the reason" was checked as any non-empty string.
- test: A21 matches `/vision is not configured/` on the row's `state_reason` and the result's `reason`; A25 matches `/vision endpoint answered HTTP 503/` on `last_rebuild_error`; A34 matches `/embedding endpoint answered HTTP 500/` on `state_reason` and `reason`; A36 matches `/The PDF could not be read: it is damaged or not a PDF/` on `reason`.
- mutants (reason swaps in `src/finish.ts`, applied together; each test reaches only its own): `:162` `pdf.error`, `:182` `embedded.error`, `:238` the not-configured text and `:240` `caption.error`, each replaced by `"something went wrong"`.
- before: the four tests pass (`4 passed`).
- red: `4 failed`, one decisive line each: `Expected actual: "something went wrong" to match: "/vision is not configured/"`, `… "/vision endpoint answered HTTP 503/"`, `… "/embedding endpoint answered HTTP 500/"`, `… "/The PDF could not be read: it is damaged or not a PDF/"`.
- green: code restored (`git diff -- src schema.sql` empty); `4 passed`. Suite 379 passed, 0 failed.
- commit: `2a549b7`

## T089: Finding 4, U135 (strengthened)

- finding: `importer_version` was checked as any non-empty string.
- test: U135 asserts `importer_version` equals `version` read from `F/metadata.json` (`PACKAGE_VERSION`).
- mutant: `src/derived.ts:6` `IMPORTER_VERSION = "0.1.1"`.
- before: U135 passes (`1 passed`).
- red: `-   0.1.1` / `+   0.1.0` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `fbd76c8`

## T090: Finding 5, U243 (strengthened)

- finding: `assertEquals(ok.data.attachment_id ?? row.id, row.id)` compared a value with itself for `finish_attachment` and `remove_attachment`.
- test: the short-id row gets a distinct file name (`short-target.pdf`). Per tool, U243 asserts the row acted on: `finish_attachment` by the last `services.finish` id, `get_attachment` by `attachment_id` and `file_name`, `remove_attachment` by the preview's `file` and the `removalPreview` argument. No `??` remains.
- mutant: `src/tools.ts` `remove_attachment` resolves any other 8-character id to `a1b2c3d4-…-000000000001` (the short id resolved to the wrong row; the test's `ffffffff` and `a1b2c3d4` probes are left alone so only the resolution differs).
- before: U243 passes (`1 passed`).
- red: `AssertionError: Values are not equal: remove_attachment` / `-     file: "manual.pdf",` / `+     file: "short-target.pdf",` (1 failed)
- green: code restored (`cmp` clean, `git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `4f57404`

## T091: Finding 6, A11 (strengthened)

- finding: the expected hints were built with a conditional spread, so read-only tools never had `destructiveHint` or `openWorldHint` compared.
- test: A11 maps each tool name to its whole `annotations` object and compares it with the contract's table.
- mutant: `src/tools.ts:225` `find_thought` `annotations: { ...READ_ONLY, destructiveHint: true }`.
- before: A11 passes (`1 passed`).
- red: `AssertionError: Values are not equal.` / `-       destructiveHint: true,` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `ac3960a`

## T092: Finding 7, U249 (strengthened)

- finding: a `try/catch` set `refused = true` on any thrown exception, and the refusal's text was never read.
- probe: SDK 1.24.3 answers with `isError: true` and the text `MCP error -32602: Input validation error: Invalid arguments for tool attach_file: [ … "path": [ "expected_kind" ], "message": "Invalid option: expected one of \"photo\"|\"pdf\"" … ]`; it does not throw.
- test: U249 calls once with no `try/catch` and asserts `isError`, `Input validation error`, `"expected_kind"` and `Invalid option: expected one of`.
- mutant (the refusal for the wrong cause): `src/tools.ts:251` `expected_kind: z.string().optional()`, plus a line in `attachFile` that dereferences `undefined` for any other kind (an unrelated TypeError). Run with `--no-check`, since the loosened schema doesn't type-check (as the audit ran M06, M10, M16).
- before: U249 passes (`1 passed`).
- red: `AssertionError: Expected actual: "Cannot read properties of undefined (reading 'x')" to contain: "Input validation error".` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`; `grep -n catch tests/tools_test.ts` returns nothing. Suite 379 passed, 0 failed.
- commit: `dfab592`

## T093: Finding 8, U50 (strengthened, the notice option)

- finding: U50 returned early, silently, whenever a real `storage` schema existed.
- change: `tests/verify.sql` U50 now raises `NOTICE: U50: SKIPPED: a real storage schema exists, so the no-storage path was not run (it runs on fork-ci's bootstrap)` before returning. The no-storage assertion itself is unchanged. The scratch-schema option was not taken: `schema.sql` keys on the fixed name `storage`, so proving the path on a database that has a real one would mean renaming that schema.
- before: on a fresh bootstrapped database with a `storage` schema and `buckets` table created first (no stub comment, so it reads as real), the `HEAD` `verify.sql` gave `rc=0` with no line about U50.
- after: the same set-up gives `rc=0` and `psql:tests/verify.sql:32: NOTICE:  U50: SKIPPED: …`. There is no red: this is a visibility fix, not a new assertion.
- verify: `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (`remed_t093`, dropped), with no notice (fork-ci's path asserts). `git diff -- src schema.sql` empty. Suite 379 passed, 0 failed.
- commit: `8a787c6`

## T094: Finding 9, U55 (strengthened)

- finding: U55's expected fingerprint was the same expression `schema.sql:187,266` uses.
- test: U55 writes one row with the fixed content `E'  U55   Mixed CASE\ntext\tfor the café fingerprint  '` and asserts its `content_fingerprint` array is exactly `{b05af88c83ebf399bbc3012d5224c51fe75dfcc25e5770b76e9087faab0b470d}`. That digest was computed independently (Python `hashlib` over the normalised text) and equals `fingerprint()` from `src/derived.ts` for the same text. The "é" pins the UTF-8 encoding.
- mutant: `schema.sql:187` `convert_to(…, 'UTF8')` to `convert_to(…, 'LATIN1')`.
- before: the old U55 (ASCII content, the expression as oracle) passes: `verify.sql` run 1 `rc=0` under the mutant.
- red: `psql:tests/verify.sql:384: ERROR:  U55: fingerprints are {79712381df2969e4c55647950421d57e1a9480d852a5425ac226031b80e50eaf}, want the one literal digest` (`rc=3`)
- green: `schema.sql` restored (`cmp` clean, `git diff -- src schema.sql` empty); `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (dropped). Suite 379 passed, 0 failed.
- commit: `d9754b9`

## T099 (finding 19, done ahead of T095): seeded random bytes in `tests/tools_test.ts`

- finding: the harness drew `Deps.randomBytes` from `crypto.getRandomValues`, so ids and page tokens differed on every run.
- change: `seededBytes()`: call k returns n bytes of value k. Ids and tokens are now the same on every run, which T095's literal expectations need.
- mutant: none applies (a determinism fix, not an assertion).
- check: `grep -n getRandomValues tests/tools_test.ts` returns nothing. Suite run twice: 379 passed, 0 failed, both times. `git diff -- src schema.sql` empty.
- commit: `3f300a9`

## T095: Finding 10, U238, U239, U244, U251, U353 (strengthened)

- finding: `curlLine`, `pageLink`, `publicUrl` and `noteMetadata` from `src/` were the tests' oracle.
- test: literal expectations. U238: id `01010101-0101-4101-8101-010101010101` (seeded call 1), the upload URL `https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/<id>/manual.pdf?token=<the fake's token>`, the whole curl line `curl -X PUT -H 'content-type: application/pdf' -H 'x-upsert: false' -T 'manual.pdf' '<url>'`, and the page link `https://brain.example.test/functions/v1/thought-attachments/upload#t=` + `"02".repeat(32)`. U239, U251, U353: `https://brain.example.test/storage/v1/object/…/ob1-files/<storage_path>?token=<the fake's token>`. U244: the note metadata object with `imported_at: "2026-01-01T12:00:00.000Z"`. The imports of the four helpers are gone.
- mutants (applied together first): `src/links.ts` `publicUrl` drops the query (`.split("?")[0]`), `pageLink` adds `/` before `#t=`, `curlLine` `-T` to `--upload-file`; `src/derived.ts` `noteMetadata` `type: "reference"`.
- before: the five tests pass under all four (`5 passed`).
- red: `5 failed`. U239 `-   https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/01010101-…/manual.pdf` / `+   …/manual.pdf?token=upload-1`; U244 `-     type: "reference",`; U251 `Values are not equal: processed` (query dropped); U353 likewise. With only the curl and page mutants, U238 fails on `-   curl -X PUT … --upload-file 'manual.pdf' …`; with only the page mutant, on `-   https://brain.example.test/functions/v1/thought-attachments/upload/#t=0202…`.
- green: code restored (`git diff -- src schema.sql` empty); `5 passed`. `grep -nE 'curlLine\(|pageLink\(|publicUrl\(|noteMetadata\(' tests/tools_test.ts` returns nothing. Suite 379 passed, 0 failed.
- commit: `90df2cd`

## T096: Finding 11, U339 (strengthened), U267 (void line dropped)

- finding: `late.page_token_hash !== null` (U339) and `photo.expected_kind === "photo"` (U267) read the clone `seedAttachment` returned, so they could never fail.
- test: U339 asserts `r.store.attachment(late.id)!.page_token_hash` equals `sha256Hex("late-token")`. U267 drops the clone check; its main assertions are unchanged.
- mutant: `src/page_routes.ts:49` an expired token is consumed (`consumePageToken`) before the 410.
- before: U339 and U267 pass (`2 passed`).
- red: U339 `-   null` / `+   "a37d12117f072c57ebd30d5036334817604d4661025e83e78e9e8a27774e1282"` (1 failed; U267 passes, as it should).
- green: code restored (`git diff -- src schema.sql` empty); `2 passed`. Suite 379 passed, 0 failed.
- commit: `553268e`

## T097 (finding 12): U210 (strengthened)

- finding: with `wrongLength` disabled, U210 and A39 still passed, because the fake store (like pgvector) rejects the vector naming both lengths; `assertStringIncludes(reason, "8")` matched any 8.
- test: U210 asserts the exact message `The embedding model returned vectors of length 8, but this brain's vectors have length 1536.` and that `writeDerived` was never called.
- mutant M11: `src/finish.ts:153` `vectors.find((v) => v.length !== dimension.data && false)`.
- before: U210 and A39 pass (`2 passed`).
- red: `-   expected 1536 dimensions, not 8` / `+   The embedding model returned vectors of length 8, but this brain's vectors have length 1536.` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `601b2aa`

## T097 (finding 13): U369, U370, U371 (new)

- finding: the page token (`src/page_routes.ts:49`), the orphan check (`schema.sql:386`) and the expired wording (`src/finish.ts:94`) were pinned at ±1 s, never at the exact instant.
- decision on agreement: no production change. The deadline is the first instant the window is closed, for a token presented, the orphan check, the expired wording and `findPending` (`.gt`). An object Storage recorded at exactly the deadline stays on time (U200), because R8 refuses only an object "created after the deadline": it was already in flight. The page and `src/finish.ts:108` judge different events (a request now versus a stored object's time), so they don't need to agree.
- tests: `tests/page_routes_test.ts::U369 a token at exactly upload_deadline gets 410`; `tests/verify.sql` U370 block (orphans lists a `pending_upload` row at exactly its deadline, `interval '0'` against the transaction's `now()`); `tests/finish_test.ts::U371 with no object at exactly the deadline, the outcome is 'upload window expired' and the state is unchanged`.
- mutants (applied together): M03 `src/page_routes.ts:49` `>=` to `>`; M15 `src/finish.ts:94` `>=` to `>`; S6 `schema.sql:386` `<=` to `<`.
- before: U272, U273, U203 and U200 pass (`4 passed`); `verify.sql` run 1 `rc=0`.
- red: U369 `-     200,` / `+     410,` (failed); U371 `-     "no file uploaded yet",` / `+     "upload window expired",` (failed); together `2 failed`. `verify.sql` `psql:tests/verify.sql:861: ERROR:  U370: <NULL>` (`rc=3`).
- green: code restored (`git diff -- src schema.sql` empty); U369, U371, U200 `3 passed`; `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (dropped). Suite 381 passed, 0 failed.
- commit: `c515b7b`

## T098 (finding 15): U303, U304 (strengthened)

- finding: `assertEquals(offenders, [])` also passed if `sourceFiles()` returned nothing or the specifier regexes stopped matching.
- test: the scan's text part is split out (`specifiersIn`, `isPdfLib`, `isBare`; the regexes are unchanged). U304 asserts `sourceFiles()` includes `index.ts`, `src/app.ts`, `src/pdf.ts` and `src/store.ts`, and that a planted `npm:pdf-lib@1.17.1` import is flagged. U303 asserts the known files, `npm:@supabase/supabase-js@2.47.10` in `src/store.ts`, `./src/app.ts` in `index.ts`, and that planted bare `zod` (import), `hono` (re-export) and `unpdf` (dynamic import) are flagged.
- mutant (in the test helper): `sourceFiles()` returns `[]` at once.
- before: U303 and U304 pass (`2 passed`).
- red: both fail: `AssertionError: Expected actual: "[]" to include: "[` / `"index.ts",` (indented) … (`2 failed`)
- green: the helper restored (its text identical to `HEAD`'s; `git diff -- src schema.sql` empty); `2 passed`. Suite 381 passed, 0 failed.
- commit: `516a815`

## T098 (finding 16): U182, U206, U214 (strengthened)

- finding: `derived.length >= 1` paired with `derived_count === derived.length`, both from the same array, so a wrong passage split passed. The same pattern sat in U206 and U214.
- test: U182 asserts exactly 1 derived thought and `derived_count` 1 (both short pages fit one passage at the default `PASSAGE_MAX_CHARS` of 1500); U206 and U214 assert `derived_count` 1. U184's `>= 1` is left: it only guards its per-row loop from running over nothing.
- mutant: `src/passages.ts` `if (body && page === last && fits(…))`, a new passage on every page.
- before: U182 passes (`1 passed`).
- red: U182 `-   2` / `+   1` (failed), and U206 fails too (`2 failed`; U214 has one page, so this mutant doesn't reach it).
- green: code restored (`git diff -- src schema.sql` empty); `3 passed`. Suite 381 passed, 0 failed.
- commit: `fe53e52`

## T098 (finding 17): U47 (strengthened)

- finding: on a persistent database U47 passed on every run after the first, even if `schema.sql` stopped adding the column and index.
- test: inside `begin; … rollback;`, U47 creates schema `u47_scratch` with a `thoughts` table as fork-ci's bootstrap creates it (no fingerprint column, no index), records that pre-run state in a temp table, sets `search_path = u47_scratch, public`, runs `\i schema.sql`, asserts the recorded state lacked both and that both now exist in `u47_scratch`. The rollback removes everything, so no DROP is needed and each run starts the same.
- mutant: `schema.sql:107-110` (the `alter table … add column if not exists content_fingerprint` and `create unique index if not exists idx_thoughts_fingerprint`) commented out.
- before: a database that ran `verify.sql` once with the real schema, then the old `verify.sql` again under the mutant: `rc=0`.
- red: on that same database, the new `verify.sql`: `psql:tests/verify.sql:267: ERROR:  U47: thoughts.content_fingerprint was not added` (`rc=3`).
- green: `schema.sql` restored (`git diff -- src schema.sql` empty); two more runs on the persistent database `rc=0`; on a fresh bootstrapped database run 1 `rc=0`, run 2 `rc=0` (both dropped). Suite 381 passed, 0 failed.
- commit: `cbbf44c`

## T099 (finding 18): `settle()`, H6, H7 (condition waits)

- finding: `settle()` was five fixed `setTimeout(0)` yields, so the page tests' negative checks depended on scheduling; H6 and H7 slept 5 ms.
- change: `tests/helpers/page_dom.ts` counts each page's fetches (started, answered or failed) and the body reads it makes, and gives a `signature()` of what the page shows and schedules. `settle()` now waits until every page made in the module has no body read open and an unchanged signature across a whole turn of the event loop, and throws after 1000 turns instead of returning. A fetch the network holds stays open without making the page busy. H6 and H7 use a bounded `until(cond)` on `fake.inFlight === 1` and `fake.heldCount === 2`.
- mutant search (none survives the old helper): a page-script mutant in `upload-page.html` that, after a failed PUT, delays `/page/finish` behind 8 and then 40 chained `res.clone().text()` reads, and then behind 40 chained `/page/info` calls. U363 failed under both the old and the new `settle()` each time, because all fake I/O resolves within five turns. So this change removes the dependence on a fixed count; it has no red to show. `upload-page.html` restored (`cmp` clean).
- check: `grep -n 'setTimeout(r, 5)' tests/helpers/helpers_test.ts` returns nothing. `page_script_test.ts` 18 passed (three runs); H6, H7 `2 passed`. Suite run twice: 381 passed, 0 failed.
- commit: `cf8556c`

## T099 (finding 20): U88, U298, U83, U52 split (U372–U376 new)

- finding: eager tests. U88 covered three store methods, indexing `ff.requests[0]`, `[1]` and `[3]` by position; U298, named for the preflight, also pinned reply CORS; U83 and U52 mixed repository checks with the scanners' self-checks.
- change: U88 keeps `insertNote`; U372 `attachmentForPageToken` (the row, or null) and U373 `consumePageToken` (a boolean) each have their own set-up and compare the whole list of request bodies, not indexed positions. U298 keeps the preflight (status, body, headers, no store call); U374 asserts the MCP reply's and a refused request's CORS. U83 and U52 keep the repository checks (U83 with its positive control); U375 is the drift checker's self-check and U376 the guard-rail scan's. Every assertion is kept.
- mutant: none (a structure fix, not a strength fix).
- check: the nine tests `9 passed`. Suite 386 passed, 0 failed.
- commit: `88a06ce`

## T099 (finding 21): U212, U213, U215, U216, U83 (magic values named)

- finding: 409, 410 and 411 stood for `busySeconds` −1, itself and +1; `calls.length >= 13` was an unexplained floor.
- change: the claims use `r.settings.busySeconds` and the clock moves by `r.settings.busySeconds - 1` or `+ 1`, as U214 already did. U213 keeps its pin of the default (`assertEquals(r.settings.busySeconds, 410); // the default BUSY_SECONDS`). U83's floor becomes an exact comparison with `STORE_RPCS`, the named list of the thirteen RPC call sites in `src/store.ts`, so a lost or extra call site now fails it too.
- mutant: none (naming).
- check: `grep -n "409\|411\|, 410)" tests/finish_test.ts` finds only the commented default pin. The six tests `6 passed`. Suite 386 passed, 0 failed.
- commit: `8938ceb`

## T099 (finding 22): vision tests, tools short ids, U301 (test utilities used)

- finding: (a) `tests/vision_test.ts` used hand-rolled JPEG bytes and captioned them as `image/png` in U173; (b) `tests/tools_test.ts` derived short ids by hand at six places; (c) U301 used a hand-rolled fetch recorder.
- change: (a) `JPEG = jpegBytes()` for every caption call, and U173 captions `PNG = await pngBytes()` as `image/png`, as its name says. (b) `shortId` from `tests/helpers/fake_store.ts` everywhere; U238's short id is the literal `01010101` (seeded bytes). (c) U301 installs a `FakeFetch` with the one route `POST <SUPABASE_URL>/rest/v1/rpc/attachment_embedding_dimension`, asserts the reply `{ data: 1536 }`, no unmatched request, and the exact URL, `apikey` and `authorization` of the one request.
- mutant for (c): `src/store.ts:61` `rpc("attachment_vector_length", {})`, the wrong RPC path on the right origin.
- before: the old U301 (origin and keys only, any URL answered) passes (`1 passed`).
- red: the new U301 `AssertionError: Values are not equal.` (1 failed). (a) and (b) are utility swaps with no mutant.
- green: code restored (`git diff -- src schema.sql` empty). Suite 386 passed, 0 failed.
- commit: `74f6221`

## T099 (finding 23): U353, U291 and U346, U351 (redundant halves removed)

- finding: U353 repeated U331's set-up and its failed-state assertions; U291 and U346 both checked the blank API-address line; U351's set-key half repeated U295 and U296.
- change: U353 keeps only the download-link half (renamed `U353 a cut-off finish (read as failed, U331) still gets a download link for its stored file`). The blank-line check now lives only in U346, in U291's stricter form (`assertEquals(lines, ['var API_ADDRESS = "";'])`, stronger than U346's old regex), and U291 keeps its no-key, no-address and no-token checks. U351 keeps the unset-key half (renamed `U351 with MCP_ACCESS_KEY unset, productionDeps is not ok and every call, even with no key, gets the named settings error`), with a comment pointing to U295 and U296. For the integrator: the test-list rows for U353 and U351 name the old test titles.
- mutant: none (duplicates removed; each removed check is still made by the named test).
- check: the seven tests `7 passed`. Suite 386 passed, 0 failed.
- commit: `19144da`

## T099 (finding 24): U235, U238, U250 and the page-route tests (labelled assertions)

- finding: ten or more unlabelled `assertEquals` per test (U235, U238, U250), and tuples mixing status, code and store facts in `tests/page_routes_test.ts`, so a failure didn't say which fact broke.
- change: U235, U238 and U250 each compare one object whose keys name every fact (U238 keeps all of T095's literals, and compares the whole `upload` object). In `tests/page_routes_test.ts`, 31 tuple assertions became objects with named keys (for example `{ status, code }`, `{ signedUploads, declaredType }`, `{ firstStatus, secondStatus, secondError }`); U275's five CORS values are keyed `ok`, `other`, `none`, `preflight`, `badPreflight`. U368's tuples already carry a message and were left. Every value is still compared.
- mutant: none (a diagnosability fix).
- check: the 32 affected tests `32 passed`. Suite 386 passed, 0 failed.
- commit: `c52f349`

## T099 (finding 25): U377 (new)

- finding: U336's "file already missing" half passes only because `FakeStore.deleteObject` succeeds on an absent path, and no store test pinned what `storage.remove([path])` does for a missing object.
- test: `tests/store_test.ts::U377 deleteObject on a missing object succeeds: Storage answers 200 with an empty list`. Storage's remove answers with the objects it deleted, so a missing one is just absent from the list; `deleteObject` must give `{ data: null }`, sending `{ prefixes: [path] }`.
- mutant: `src/store.ts` `deleteObject` returns `{ error: "Object not found" }` when the deleted list is empty.
- before: U82 passes (`1 passed`).
- red: `-     error: "Object not found",` / `+     data: null,` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 387 passed, 0 failed.
- not covered: the busy and claim boundaries decided in `tests/helpers/fake_store.ts:525` (U212, U214, U260, U354) still rest on the fake. On the SQL side, `verify.sql`'s claim blocks (U62, U54) pin them; no TypeScript test runs the real store against Postgres.
- commit: `f9bb8cd`

## Close

- final: suite 387 passed, 0 failed (`deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/`); `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (`remed_final`, dropped).
- T099 done-greps: `grep -n 'setTimeout(r, 5)' tests/helpers/helpers_test.ts` and `grep -n getRandomValues tests/tools_test.ts` return nothing. T095's `grep -nE 'curlLine\(|pageLink\(|publicUrl\(|noteMetadata\(' tests/tools_test.ts` returns nothing.
- production code: unchanged. No strengthened test exposed a real bug.
- new ids: U368 (T086); U369, U370, U371 (T097); U372–U376 (T099 finding 20 splits); U377 (T099 finding 25). Renamed titles: U353, U351 (finding 23). The integrator still needs to put them in `tdd/test-list.md`.
- `git status --short` in the worktree: clean.

### Integrator verification of the remediation

- Only test files changed between `ff4bfc1` and the remediation head (no `src/`, `schema.sql`, `index.ts` or page change). Suite 387 passed.
- The audit's deciding mutant (`src/page_routes.ts:103`, dropping `outcome.busy === undefined &&`) now fails 1 test (U368); before, it passed 378 of 378.

## Cycles U378 and U379: provider error bodies keep only their message (T101, live Cloud finding)

- Found in the live Cloud run (T076, scenario 7): a vision-endpoint error stored OpenRouter's raw body, including the account `user_id`.
- **U378** (`tests/vision_test.ts`): red `--filter "/^U378 /"` → `AssertionError: vision endpoint answered HTTP 400: {"error":{"message":"ob1-test/x is not a valid model ID","code":400},"user_id":"user_acct123"}` (1 failed). Green: `bodyReason()` keeps a JSON body's `error.message` and otherwise the bounded, redacted text, so U179 and U181 still pass. Commit `8441b05`.
- **U379** (`tests/embeddings_test.ts`): red `AssertionError: embedding endpoint answered HTTP 404: {"error":{"message":"model not found","code":404},"user_id":"user_acct123"}` (1 failed). Green: the same helper in `src/embeddings.ts`. Commit `9aacf86`. Suite 389 passed; `deno lint` clean.
- Redeployed to the live Cloud project (`9aacf86`); 7 tools answer.

## Re-audit remediation T102–T104 (folded from cycle-log.d/r2.md)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`, branch `contrib/mfelker/thought-attachments`, base `9aacf86`, folder `F` = `integrations/thought-attachments`.

Suite (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/`. SQL: fresh database `rr103`, `bootstrap.sql`, then `verify.sql` twice through the pgbin007 wrapper, then drop `rr103`. Each mutant was applied with a script, checked with `git diff` and grep, and restored with `git checkout -- src schema.sql` (`git diff -- src schema.sql` empty afterwards). Only tests changed; no production change.

## T102: U378, U379 (Finding 1; mutants B5, B6)

| Step | Evidence |
| --- | --- |
| before | B5 (`return JSON.stringify(parsed.error)`) and B6 (`return message + JSON.stringify({ code: parsed.error.code })`) each applied in both `src/vision.ts` and `src/embeddings.ts`; U378 and U379 `ok` under each |
| change | both tests now compare the whole reason with `assertEquals`, and the body carries `error.code` plus `error.metadata.account_id` (`acct_nested_456`) beside the top-level `user_id` |
| red B5 | `-   vision endpoint answered HTTP 400: {"message":"ob1-test/x is not a valid model ID","code":400,"metadata":{"provider_name":"acme","account_id":"acct_nested_456"}}` (U378 and U379 FAILED) |
| red B6 | `-   embedding endpoint answered HTTP 404: model not found{"code":404}` (U378 and U379 FAILED) |
| green | restored; U378, U379 `2 passed` |
| suite | 389 passed, 0 failed |
| commit | `2cee598` |

## T104: U380–U385 (Finding 3; mutants B4, B7, B8)

New tests: U380, U381 and U382 in `tests/vision_test.ts`; U383, U384 and U385 in `tests/embeddings_test.ts`. They pin a non-JSON body's text, the 300-character cut (a 400-character body), and a JSON body whose `error.message` is `42`.

| Step | Evidence |
| --- | --- |
| before | `tests/vision_test.ts` and `tests/embeddings_test.ts` `23 passed` under each of B4 (`return "";`), B7 (`.slice(0, 30000)`) and B8 (`message !== undefined`) |
| red B4 | actual `-   vision endpoint answered HTTP 502:` with nothing after the colon, expected `+   vision endpoint answered HTTP 502: bad gateway from upstream` (all six FAILED) |
| red B7 | U381 and U384 FAILED: the actual reason carries all 400 characters, the expected one 300 |
| red B8 | `error: TypeError: text.split is not a function` (U382 and U385 FAILED; `redact()` throws on the number) |
| green | restored; U380–U385 `6 passed` |
| suite | 395 passed, 0 failed |
| commit | `c1322ed` |

## T103: U84, U85 (Finding 2; mutant S10)

U84 now inserts U55's fixed non-ASCII text (`E'  U55   Mixed CASE\ntext\tfor the café fingerprint  '`) and asserts the stored `content_fingerprint` is `b05af88c83ebf399bbc3012d5224c51fe75dfcc25e5770b76e9087faab0b470d`. U85 seeds a fixed ASCII text with the literal `53fcfb6e6b1ad09def85040d6dcd92ce263be88826862f0e2dcce397f9ed7983` instead of the `encode(sha256(convert_to(…)))` expression, and removes a row the call creates if it wrongly reports `created`. Both digests were computed with Python `hashlib` over the normalised UTF-8 bytes, and the first was checked with `shasum -a 256`.

| Step | Evidence |
| --- | --- |
| before | S10 (`schema.sql:266` `'UTF8'` to `'LATIN1'`) applied; fresh `rr103`: `verify.sql` run 1 and run 2 rc=0 |
| red | `psql:tests/verify.sql:636: ERROR:  U84: fingerprint is 79712381df2969e4c55647950421d57e1a9480d852a5425ac226031b80e50eaf, want the literal digest` (rc=3, both runs; the LATIN1 digest matches Python's) |
| green | restored; fresh `rr103`: run 1 and run 2 rc=0 |
| suite | 395 passed, 0 failed |
| commit | `293dee5` |

### Integrator verification

- Test-only (`git diff --name-only 9aacf86..293dee5` lists only test files). Suite 395 passed. The B5 mutant (`return JSON.stringify(parsed.error)` at `src/vision.ts:87`) re-applied on a copy fails 1 test; the copy was removed.

## Third-audit remediation T108–T115 (folded from cycle-log.d/r3.md)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`, branch `contrib/mfelker/thought-attachments`, base `293dee5`, folder `F` = `integrations/thought-attachments`.

Suite (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/`. SQL: fresh database `rr3`, `bootstrap.sql`, then `verify.sql` twice through the pgbin007 wrapper, then drop `rr3`. Each mutant was applied in place with a script that requires exactly one match, checked with grep, and restored with `git checkout --` (`git diff -- src schema.sql upload-page.html index.ts` empty afterwards).

## T108: U386, U387 (Finding 1; mutants P6, P6b, P6c)

U386 (by `x-brain-key`) and U387 (by `?key=`) send `BRAIN_KEY` with one byte changed to `X` (or `Y`): the first byte, a middle byte and the last byte. All three keys have the configured key's length. Each expects `-32001`, the request id, and no store call.

| Step | Evidence |
| --- | --- |
| before | P6 (`i < b.length - 1`), P6b (`let i = 1`), P6c (`(a[i] ?? 0) & b[i] & 0`) each applied to `src/app.ts:31`; suite `395 passed, 0 failed` under each |
| red P6 | U386 and U387 FAILED: `last` actual `calls: ["listByParent"]`, `error: undefined` |
| red P6b | U386 and U387 FAILED: `first` actual `error: undefined` |
| red P6c | U386 and U387 FAILED: `first`, `middle` and `last` each actual `error: undefined` |
| green | restored; `tests/app_test.ts` `19 passed` |
| suite | 397 passed, 0 failed |
| commit | `a272273` |

## T109: U57, U94 and a file-wide sweep (Finding 2; mutants Q10, Q15)

In `tests/verify.sql`, every `<>` whose left side can be NULL (a row column, a `->>` value, a `select … into` variable that reads a column) is now `is distinct from`: U37, U49, U56, U57, U58, U59, U60, U61, U62, U63, U67, U68, U314, U84, U85, U94, U93, U95, U104, U105, U106, U370 and U108. Comparisons of `count(*)` results keep `<>`. U62 also raises when `busy_until` is NULL.

| Step | Evidence |
| --- | --- |
| before | Q10 (`schema.sql:156` `state_reason = t.state_reason,`) and Q15 (`schema.sql:158` `caption_model = t.caption_model,`) each applied; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 under each |
| red Q10 | `psql:tests/verify.sql:698: ERROR:  U94: returned (…,failed,,,,2,…)` (rc=3; `state_reason` is empty) |
| red Q15 | `psql:tests/verify.sql:442: ERROR:  U57: state fields not set: (…,application/pdf,10,3,sha256:u57,,personal,processed,…)` (rc=3; `caption_model` is empty) |
| green | restored; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 |
| suite | 397 passed, 0 failed |
| commit | `2c81b5b` |

## T110: U314 (Finding 3; mutant Q8)

U314 now stores `'Box of Furnace FILTERS ' || upper(tag)` (and the non-match `'Box of Water FILTERS ' || upper(tag)`) and queries `'furnace Filters ' || tag`, so the stored text and the query are in different mixed case.

| Step | Evidence |
| --- | --- |
| before | Q8 (`schema.sql:253` `position(lower(p_text) in t.content)`) applied; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 |
| red | `psql:tests/verify.sql:618: ERROR:  U314: 0 matches, first <NULL>` (rc=3) |
| green | restored; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 |
| suite | 397 passed, 0 failed |
| commit | `6965a0e` |

## T111: U144 (Finding 4; mutants F3, F3b, F3c, F3d, F3e)

U144 now also sniffs five near misses and compares one labelled record against all `null`: `RIFF….WAVEfmt` plus a space (`riffWave`), `….ftypisom` (`isoBmffIsom`), `\x00PNG\r\n\x1a\n` (`pngWithoutLead`), `FF D8 00 E0 JFIF` (`jpegWithoutThirdFf`) and `%PDF 1.7 …` (`pdfWithoutDash`).

| Step | Evidence |
| --- | --- |
| before | each of F3 (`ascii(1, 4) === "PNG"` alone), F3b (`bytes[0] === 0xff && bytes[1] === 0xd8`), F3c (`ascii(0, 4) === "RIFF"` alone), F3d (`ascii(4, 8) === "ftyp"` alone) and F3e (`ascii(0, 4) === "%PDF"`) applied to `src/intake.ts:45-49`; suite `397 passed, 0 failed` under each |
| red F3 | U144 FAILED: `-     pngWithoutLead: "image/png",` |
| red F3b | U144 FAILED: `-     jpegWithoutThirdFf: "image/jpeg",` |
| red F3c | U144 FAILED: `-     riffWave: "image/webp",` |
| red F3d | U144 FAILED: `-     isoBmffIsom: "image/heic",` |
| red F3e | U144 FAILED: `-     pdfWithoutDash: "application/pdf",` |
| green | restored; suite green |
| suite | 397 passed, 0 failed |
| commit | `1016627` |

## T112: U388 (Finding 5; mutant K18)

U388 in `tests/tools_test.ts`: `deleteObject` fails once (`storage went away`). The confirmed remove must be an error naming that reason, without "Removed", without a `removeAttachment` call, with the row still listed, both derived thoughts present, the file still stored and the claim released. A repeat confirmed remove then succeeds and removes the row, the two derived thoughts and the file.

The brief called this a production bug. It is not one at `293dee5`: U388 passes on the unmutated code, because `src/tools.ts:364` already returns `fail(deleted.error)`. Only the test was missing. No production change.

| Step | Evidence |
| --- | --- |
| before | K18 (`src/tools.ts:364` `if ("error" in deleted) return fail(deleted.error);` deleted) applied; suite at `1016627` `397 passed, 0 failed` |
| red | U388 FAILED at `tests/tools_test.ts:931` (`assertEquals(out.isError, true)`): actual `false`, expected `true` |
| green | restored; U388 passes |
| suite | 398 passed, 0 failed |
| commit | `6f923a9` |

## T113: U389, U390, U391, U392 (Finding 6; mutants G2, G3, K15, Q14)

Each test asserts the clock is at exactly `busy_until` (or, in SQL, `upload_deadline = now()` inside one transaction) before it acts.

- U389 (`tests/finish_test.ts`): a killed rebuild claim at exactly `busy_until`; a plain finish returns `{ state: "processed", derived_count: 1, last_rebuild_error: "the run did not finish" }` and the old derived set.
- U390 (`tests/finish_test.ts`): a finish stalls; a newer claim takes over and is never released; at exactly its `busy_until` the stalled run's write is refused, and it returns `{ state: "pending_upload", derived_count: 0 }`, not busy.
- U391 (`tests/tools_test.ts`): `get_attachment` on a finish claim at exactly `busy_until` reads `failed`, "the run did not finish".
- U392 (`tests/verify.sql`): `note_case('pending_upload', true, interval '0')`; the preview and the remove both drop the parent note.

| Step | Evidence |
| --- | --- |
| before | G2 (`src/finish.ts:60` `<=` to `<`), G3 (`src/finish.ts:71` `>` to `>=`), K15 (`src/tools.ts:176` `<=` to `<`) each applied; suite `398 passed, 0 failed` under each. Q14 (`schema.sql:324` `a.upload_deadline < now()`) applied; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 |
| red G2 | U389 FAILED (`tests/finish_test.ts:682`): expected `+     last_rebuild_error: "the run did not finish",` missing from actual |
| red G3 | U390 FAILED (`tests/finish_test.ts:696`): actual `-     busy: "finish",` and `-     reason: "busy (finishing), try again shortly",` |
| red K15 | U391 FAILED (`tests/tools_test.ts:705`): actual `-     state: "pending_upload",`, expected `+     state: "failed",` |
| red Q14 | `psql:tests/verify.sql:816: ERROR:  U392: {"preview": {"derived": 0, "noteWouldGo": false}, "removed": {"derived": 0, "noteRemoved": false}, "parent_still_there": true}` (rc=3) |
| green | restored; suite green; fresh `rr3`: `verify.sql` run 1 and run 2 rc=0 |
| suite | 401 passed, 0 failed |
| commit | `4915667` |

## T114: U393 (Finding 7; mutant G1)

U393 in `tests/finish_test.ts`: a photo ends `not_captioned` (vision 503). Then `rebuild: true` runs with vision failing again (502). Both claims are `finish`. The outcome is `not_captioned` with the 502 reason and no `last_rebuild_error`. The row's `state_reason` equals that reason, its `last_rebuild_error` is null, and there are no derived thoughts.

| Step | Evidence |
| --- | --- |
| before | G1 (`src/finish.ts:30` `const rebuild = opts.rebuild === true;`) applied; suite `401 passed, 0 failed` |
| red | U393 FAILED (`tests/finish_test.ts:302`): claims actual `["finish", "rebuild"]`, expected `["finish", "finish"]` |
| green | restored; U393 passes |
| suite | 402 passed, 0 failed |
| commit | `8856099` |

## T115: U244 (Finding 8; mutant K14)

U244 now pins the reply's first line, `Attachment <id> (short id <short>) started on thought <note id>.`, and asserts the text has no "attached to your existing thought".

| Step | Evidence |
| --- | --- |
| before | K14 (`src/tools.ts:159` `note !== undefined ?`, without `!parentCreated`) applied; suite `402 passed, 0 failed` |
| red | U244 FAILED (`tests/tools_test.ts:515`): actual `-   Attachment 01010101-0101-4101-8101-010101010101 (short id 01010101) started on thought 00000001-0000-4000-9000-000000000000, attached to your existing thought.` |
| green | restored; U244 passes |
| suite | 402 passed, 0 failed |
| commit | `a6168ba` |

## Close

No production change in R3. Final suite at `a6168ba`: 402 passed, 0 failed. Fresh `rr3`: `verify.sql` run 1 and run 2 rc=0. `git status --short` clean.

### Integrator verification

- Test-only: `git diff --name-only 293dee5..HEAD` lists only test files. Suite 402 passed.
- The skip-last-byte mutant of the constant-time key compare (`i < b.length - 1` at `src/app.ts:31`), re-applied on a copy, fails 2 tests.
- Correction to the audit's framing: T112's K18 is not a code bug. `src/tools.ts:364` already returns `fail(deleted.error)`; the gap was the missing test, now U388.

## Cycle U394: a phone-page PDF with no expected kind (T117; kills N21)

- Final scoped audit finding (HIGH): mutant N21 (`src/page_routes.ts:78`, `row.expected_kind !== null &&` removed) refused every PDF picked on the page when the AI named no kind, and the suite still passed 402 of 402 (before).
- test: `tests/page_routes_test.ts::U394 /page/start with no expected kind accepts a picked PDF: it is recorded as the declaration and a link is returned` (new)
- red: with N21 applied, `--filter "/^U394 /"` gives `FAILED \| 0 passed \| 1 failed` (status 400 `wrong_type`, where 200 is expected)
- green: the code is restored byte for byte (`git diff --quiet -- src`); U394 passes; suite 403 passed
- commit: `4044fdeb`

## Integrator targeted recheck after U394 (owner-chosen scope)

The final audit's survivors were re-applied from its own `fresh.json`, each on a fresh copy:

- **N21:** now killed (`FAILED \| 402 passed \| 1 failed`).
- **Still surviving, as the audit graded them:** N10 (no observable effect), N12, N15 and N24 (LOW; each gives `ok \| 403 passed`), and the SQL mutants S1 and S2 (MED, claim at exactly `busy_until`), S8 (MED, 120-character cut) and S5 (LOW).
- No HIGH remains. Under the owner's rule (2026-11-27), these MED/LOW items are recorded follow-ups (T118–T120), not another audit loop.
