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
