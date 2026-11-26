# Stream K cycle log

## Cycle: U146 A healthy configuration and server give ok true

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U146 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U146 /" tests/` -> `Error: not implemented` (1 failed)
- green: lib/setup_check.ts: resolve config, run embed and chat, ok = both ok. Suite -> 109 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `b323794`
- notes: —

## Cycle: U147 The report lists the seven checks in the contract's order

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U147 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U147 /" tests/` -> `AssertionError: Values are not equal (checks was empty)` (1 failed)
- green: lib/setup_check.ts: build the seven checks, ids and roles in contract order. Suite -> 110 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `de288ae`
- notes: reachable/model checks are placeholders until U156-U163

## Cycle: U148 config shows each role's base, model and key_set, chat inherits, and timeout_ms

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U148 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U148 /" tests/` -> `AssertionError: Values are not equal (config was null)` (1 failed)
- green: lib/setup_check.ts: configBlock() maps OkConfig to snake_case block. Suite -> 111 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3516c4c`
- notes: —

## Cycle: U149 No key value appears anywhere in the report

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U149 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U149 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; report carries only key_set booleans. Suite -> 112 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `41bc566`
- notes: Passed first run. Mutant: appended chat key to config.chat.model -> test failed; restored. Test is only weakly exercised until reasons exist (U165+ echo model-server text); error bodies in the fake already contain the keys.

## Cycle: U150 A missing setting fails config with a reason naming each missing setting

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U150 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U150 /" tests/` -> `Error: not implemented` (1 failed)
- green: lib/setup_check.ts: config-failure branch returns a failed config check naming config.missing. Suite -> 113 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `33a731c`
- notes: —

## Cycle: U151 An invalid setting fails config naming it with its reason

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U151 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U151 /" tests/` -> `AssertionError: Expected actual: "Missing required settings: ." to contain: "EMBEDDING_API_BASE"` (1 failed)
- green: lib/setup_check.ts: reason also lists each invalid setting with its reason. Suite -> 114 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `030e720`
- notes: —

## Cycle: U152 With config failed, every other check reads skipped: configuration incomplete

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U152 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U152 /" tests/` -> `AssertionError: Values are not equal (only the config check was listed)` (1 failed)
- green: lib/setup_check.ts: CHECK_IDS table; skipped checks appended after the failed config. Suite -> 115 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `7ef18fe`
- notes: —

## Cycle: U153 With config failed, no model request is sent

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U153 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U153 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the config-failure branch returns before creating a model client. Suite -> 116 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `d71692c`
- notes: Passed first run. Mutant: awaited deps.modelFetch in the failure branch -> test failed (no route); restored.

## Cycle: U154 With config failed, ok is false and thoughts.other_model is null with no store call

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U154 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U154 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; failure branch has other_model null and calls no store method. Suite -> 117 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `5de4f21`
- notes: Passed first run. Mutant: awaited deps.store.countAll() in the failure branch -> test failed; restored.

## Cycle: U155 Any single failed check makes ok false

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U155 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U155 /" tests/` -> `AssertionError: Values are not equal (chat_metadata passed on non-JSON reply)` (1 failed)
- green: lib/setup_check.ts: chat_metadata ok requires parseUsableMetadata(reply) non-null. Suite -> 118 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3064d77`
- notes: Dimension half passed already; chat half drove the change (overlaps U167/U168).

## Cycle: U156 <role>_reachable passes on a 200 and on a 404 from /models

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U156 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U156 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable is still a constant-true placeholder, real logic arrives with U157. Suite -> 119 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `828a130`
- notes: Passed first run. Mutant: chat_reachable ok false -> test failed; restored.

## Cycle: U157 <role>_reachable fails with auth_rejected on a 401 or 403

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U157 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U157 /" tests/` -> `AssertionError: Values are not equal: status 401` (1 failed)
- green: lib/setup_check.ts: also call listModels per role in parallel; reachable() fails on unreachable/timeout/auth_rejected. Suite -> 120 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `144dc3a`
- notes: —

## Cycle: U158 <role>_reachable fails with unreachable naming the base on a network error

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U158 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U158 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable() already fails on unreachable and carries the client message naming the base. Suite -> 121 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `6b83a78`
- notes: Passed first run. Mutant: removed unreachable from the failing kinds -> test failed; restored.

## Cycle: U159 <role>_reachable fails with timeout when /models hangs

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U159 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U159 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; reachable() already fails on timeout. Suite -> 122 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `8a76caf`
- notes: Passed first run. Mutant: removed timeout from the failing kinds -> test failed; restored.

## Cycle: U160 <role>_model passes when the model is listed

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U160 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U160 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; model checks are constant-true placeholders until U162. Suite -> 123 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `73ccffe`
- notes: Passed first run. Mutant: embedding_model ok false -> test failed; restored.

## Cycle: U161 <role>_model passes when the model is not listed but the real call succeeded

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U161 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U161 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; model checks still placeholders. Suite -> 124 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `138c09a`
- notes: Passed first run. Mutant: chat_model ok false -> test failed; restored.

## Cycle: U162 <role>_model fails with model_not_found naming the model when unlisted and the real call reports it unknown

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U162 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U162 /" tests/` -> `AssertionError: Values are not equal: embedding_model` (1 failed)
- green: lib/setup_check.ts: modelCheck() passes when listed or the real call succeeded, else carries the call's failure message. Suite -> 125 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `d4fdfb2`
- notes: —

## Cycle: U163 With a non-JSON /models body, <role>_model follows the real call's outcome

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U163 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U163 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; a null listing falls through to the real call's outcome. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9f15e74`
- notes: Passed first run. Mutant: required a non-null listing for the call-succeeded pass -> test failed; restored.

## Cycle: U163 With a non-JSON /models body, <role>_model follows the real call's outcome

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U163 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U163 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; a null listing falls through to the real call's outcome. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `On branch contrib/mfelker/self-hosted-llm-check
nothing to commit, working tree clean`
- notes: Passed first run. Mutant: real-call pass also required a non-null listing -> test failed; restored.

## Cycle: U164 embedding_dimension passes for a 1536-number vector

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U164 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U164 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; embedding_dimension ok = the embed call succeeded (the client enforces 1536). Suite -> 127 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `6e2bdd5`
- notes: Passed first run. Mutant: inverted ok -> test failed; restored.

## Cycle: U165 embedding_dimension fails for 768 numbers with a reason naming 768 and 1536

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U165 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U165 /" tests/` -> `AssertionError: Values are not equal (reason was undefined)` (1 failed)
- green: lib/setup_check.ts: failed embedding_dimension carries the embed call's message. Suite -> 128 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `917bb07`
- notes: —

## Cycle: U166 embedding_dimension carries the embedding call's outcome when the call fails

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U166 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U166 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the same branch as U165 carries any embed failure message. Suite -> 129 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2308d0f`
- notes: Passed first run. Mutant: constant reason "failed" -> test failed; restored.

## Cycle: U167 chat_metadata passes for a JSON-object reply

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U167 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U167 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; chat_metadata ok requires usable metadata (introduced for U155). Suite -> 130 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `bb29aaf`
- notes: Passed first run. Mutant: inverted usability test -> test failed; restored.

## Cycle: U168 chat_metadata fails with unusable output and the first 120 characters (no more) of an unusable reply

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U168 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U168 /" tests/` -> `AssertionError: Values are not equal (reason was undefined)` (1 failed)
- green: lib/setup_check.ts: chatMetadata() reports `unusable output: ` plus reply.slice(0, 120). Suite -> 131 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2a37871`
- notes: Reason format chosen: `unusable output: <first 120 chars>`.

## Cycle: U169 chat_metadata carries the chat call's outcome when the call fails

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U169 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U169 /" tests/` -> `AssertionError: Expected actual: "" to contain: "HTTP 500"` (1 failed)
- green: lib/setup_check.ts: failed chat call gives reason chat.message. Suite -> 132 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `0b54725`
- notes: —

## Cycle: U170 When chat inherits the embedding base, both roles' checks are reported separately and chat requests go to the embedding base

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U170 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U170 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; roles are checked separately and the client already routes chat to the inherited base. Suite -> 133 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `ef35494`
- notes: Passed first run. Mutant: chat_model used the embedding call's outcome -> test failed; restored.

## Cycle: U171 One run sends one embedding call, one chat call and one /models request per role

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U171 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U171 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; each call is made once and shared by its checks. Suite -> 134 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `1606bd8`
- notes: Passed first run. First mutant (chat listing via embedding role) exposed a weak count assertion on a shared base; test strengthened (separate per-base GET counts), mutant then failed; restored.

## Cycle: U172 A key_over_http warning is reported and leaves ok true

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U172 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U172 /" tests/` -> `AssertionError: Values are not equal (warnings was empty)` (1 failed)
- green: lib/setup_check.ts: warnings = keyOverHttpWarnings(config). Suite -> 135 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `502c045`
- notes: —

## Cycle: U173 An unkeyed http:// base and a keyed https:// base produce no warning

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U173 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U173 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; keyOverHttpWarnings already gives none for these. Suite -> 136 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `5d8941a`
- notes: Passed first run. Mutant: constant bogus warning -> test failed; restored.

## Cycle: U174 Every model request starts before any reply is released

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U174 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U174 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the four model calls already run under Promise.all. Suite -> 137 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3b278d0`
- notes: Passed first run. Mutant: sequential awaits -> test failed (heldCount never reached 4); restored.

## Cycle: U175 With every model route hanging, the run finishes in about one timeoutMs, not several

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U175 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U175 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; calls run concurrently so the run is bounded by one timeout. Suite -> 138 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `25b0380`
- notes: Passed first run. Mutant: sequential awaits -> 'took 1214 ms' failure; restored. Upper bound set to 850 ms for a 300 ms timeout to avoid flakiness (sequential is about 1200 ms).

## Cycle: U176 5 thoughts, 2 matching EMBEDDING_MODEL, give thoughts.other_model: 3

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U176 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U176 /" tests/` -> `AssertionError: Values are not equal (other_model was null)` (1 failed)
- green: lib/setup_check.ts: other_model = countAll - countWithModel(EMBEDDING_MODEL). Suite -> 139 passed, 0 failed, 24 ignored
- refactor: Moved the two counts into the same Promise.all as the model calls so database latency does not add to the run time
- commit: `acd44a7`
- notes: —

## Cycle: U177 All thoughts matching, and an empty brain, each give other_model: 0

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U177 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U177 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; the subtraction already yields 0. Suite -> 140 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3968ac0`
- notes: Passed first run. Mutant: off by one (+1) -> test failed; restored.

## Cycle: U178 A failing count gives other_model: null with a thoughts_count warning carrying the database message

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U178 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U178 /" tests/` -> `AssertionError: countAll: no thoughts_count warning` (1 failed)
- green: lib/setup_check.ts: on a failed count, other_model stays null and a thoughts_count warning carries the store error. Suite -> 141 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `f6263a0`
- notes: Sampled both countAll and countWithModel failures.

## Cycle: U179 With a failing count, the model checks still run and decide ok

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U179 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U179 /" tests/` -> `n/a (passed first run)` (1 failed)
- green: no code change; warnings never feed into ok and counts run alongside the model calls. Suite -> 142 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `7e010f9`
- notes: Passed first run. Mutant: ok also required no warnings -> test failed; restored.

## Integrator note: mutant checks for U156, U160, U161 (added at merge)

The stream recorded U156, U160 and U161 as first-run passes against constant-true placeholders without a mutant. At the stream's tip (`7e010f9`), the integrator applied one mutant per test to the real logic in `lib/setup_check.ts`, ran the single test, and restored the file exactly (`git status` clean afterwards):

- U156: `reachable()` forced to return `ok: false` -> `FAILED | 0 passed | 1 failed`
- U160: the "model listed" branch of `modelCheck()` removed -> `FAILED | 0 passed | 1 failed`
- U161: the "real call succeeded" branch of `modelCheck()` removed -> `FAILED | 0 passed | 1 failed`

Each test is therefore load-bearing. Its red evidence is a mutant, not a pre-implementation red, which the audit may grade below PROVEN.
