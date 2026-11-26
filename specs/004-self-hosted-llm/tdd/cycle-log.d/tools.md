# Stream T cycle log

## Cycle: U100 tools/list returns exactly the six tools

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U100 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U100 /" tests/` -> `Error: not implemented` from buildServer (1 failed)
- green: `lib/tools.ts` buildServer registers the six tool names with placeholder handlers. Suite -> 109 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ebbf9c5`
- notes: stub handlers; later cycles fill them in

## Cycle: U101 tool title/description/schema/annotations equal core's

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U101 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U101 /" tests/` -> `AssertionError: Values are not equal: search` (1 failed)
- green: `lib/tools.ts` registerTool configs copied from core (titles, descriptions, zod input schemas with defaults, annotations). Suite -> 110 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ce3cbaf`
- notes: -

## Cycle: U102 fetch of an existing id returns core's document text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U102 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U102 /" tests/` -> `SyntaxError: "not implemented" is not valid JSON` (1 failed)
- green: `lib/tools.ts` fetch handler maps store.fetchThought to core's document JSON; thoughtTitle/thoughtUrl helpers. Suite -> 111 passed, 0 failed, 24 ignored
- refactor: none
- commit: `9b0ce47`
- notes: -

## Cycle: U103 fetch with a store error returns core's isError text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U103 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U103 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (fetch handler from U102 already returns `Fetch error:`). Suite -> 112 passed, 0 failed, 24 ignored
- refactor: none
- commit: `dcf7373`
- notes: mutant: `Fetch error:` -> `Fetch err:` -> AssertionError (1 failed); restored

## Cycle: U104 list_thoughts returns core's listing text for rows

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U104 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U104 /" tests/` -> `AssertionError: Values are not equal` (1 failed)
- green: `lib/tools.ts` list_thoughts handler formats store rows as core does. Suite -> 113 passed, 0 failed, 24 ignored
- refactor: none
- commit: `a479538`
- notes: -

## Cycle: U105 list_thoughts with no rows returns core's empty text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U105 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U105 /" tests/` -> `AssertionError: Values are not equal` (1 failed; got `0 recent thought(s):`)
- green: `lib/tools.ts` list_thoughts returns `No thoughts found.` for no rows. Suite -> 114 passed, 0 failed, 24 ignored
- refactor: none
- commit: `242318f`
- notes: -

## Cycle: U106 list_thoughts with a store error returns core's isError text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U106 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U106 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (error branch written with U104). Suite -> 115 passed, 0 failed, 24 ignored
- refactor: none
- commit: `bbf20b8`
- notes: mutant: `Error:` -> `Err:` prefix -> AssertionError (1 failed); restored

## Cycle: U107 list_thoughts forwards its filters to the store

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U107 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U107 /" tests/` -> `AssertionError: Values are not equal` (1 failed; filters missing)
- green: `lib/tools.ts` list_thoughts passes type/topic/person/days when set. Suite -> 116 passed, 0 failed, 24 ignored
- refactor: none
- commit: `136255a`
- notes: -

## Cycle: U108 thought_stats returns core's stats text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U108 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U108 /" tests/` -> `AssertionError: Values are not equal` (1 failed; placeholder text)
- green: `lib/tools.ts` thought_stats aggregates store.stats rows as core does. Suite -> 117 passed, 0 failed, 24 ignored
- refactor: none
- commit: `6b8db3d`
- notes: store error mirrors core (ignored: count/rows default), no behavior row

## Cycle: U109 search_thoughts embeds the query and matches with default threshold and count

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U109 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U109 /" tests/` -> `TypeError: Cannot read properties of undefined (reading 'input')` (no embeddings request; 1 failed)
- green: `lib/tools.ts` models() resolves config per call and builds the real model client; search_thoughts embeds then calls matchThoughts(vec, 0.5, 10) (results text placeholder until U111). Test rig gained an options argument for scripted replies. Suite -> 118 passed, 0 failed, 24 ignored
- refactor: none
- commit: `eb29564`
- notes: temporary models() throws on a bad config until U119

## Cycle: U110 search_thoughts forwards an explicit limit and threshold

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U110 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U110 /" tests/` -> `AssertionError: Values are not equal` (1 failed; got 0.5/10)
- green: `lib/tools.ts` search_thoughts passes threshold and limit to matchThoughts. Suite -> 119 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c8016bc`
- notes: -

## Cycle: U111 search_thoughts returns core's results text and no-match text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U111 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U111 /" tests/` -> `AssertionError: Values are not equal` (1 failed; empty text)
- green: `lib/tools.ts` search_thoughts formats results and the no-match line as core does. Suite -> 120 passed, 0 failed, 24 ignored
- refactor: none
- commit: `1d59424`
- notes: -

## Cycle: U112 search returns core's results JSON

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U112 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U112 /" tests/` -> `SyntaxError: Unexpected token 'o', "not implemented" is not valid JSON` (1 failed)
- green: `lib/tools.ts` search handler: embed, matchThoughts(0.5,10), map to id/title/url JSON. Suite -> 121 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ff2ed37`
- notes: -

## Cycle: U113 search with a store error returns core's Search error text

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U113 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U113 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (search handler from U112 already returns `Search error:`). Suite -> 122 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ccf8248`
- notes: mutant: `Search error:` -> `Search err:` -> AssertionError (1 failed); restored

## Cycle: U114 successful capture replies with core's Captured as confirmation

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U114 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U114 /" tests/` -> `AssertionError: Values are not equal` (1 failed; placeholder text)
- green: `lib/tools.ts` capture_thought: embed, chat (sequential for now), build metadata, upsert, setEmbedding, core confirmation. Suite -> 123 passed, 0 failed, 24 ignored
- refactor: none
- commit: `73c7afa`
- notes: sequential calls and double resolveConfig are temporary; U117 and the gate cycle reshape them

## Cycle: U115 capture stores extracted metadata plus source, embedding_model, enrichment_status

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U115 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U115 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U114 already builds metadata via buildCaptureMetadata). Suite -> 124 passed, 0 failed, 24 ignored
- refactor: none
- commit: `ab73cbd`
- notes: mutant: embedding_model hard-coded "x" -> AssertionError (1 failed); restored. Model-supplied source/embedding_model are overridden (asserted)

## Cycle: U116 capture stores the model's vector as the row's embedding

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U116 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U116 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U114 already calls setEmbedding with the model vector). Suite -> 125 passed, 0 failed, 24 ignored
- refactor: none
- commit: `21124ea`
- notes: mutant: setEmbedding(id, []) -> AssertionError (1 failed); restored

## Cycle: U117 embedding and chat requests are both in flight before either reply is released

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U117 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U117 /" tests/` -> `AssertionError: Values are not equal` (held 1 vs 2; 1 failed)
- green: `lib/tools.ts` capture runs embed and chat with Promise.all. Suite -> 126 passed, 0 failed, 24 ignored
- refactor: none
- commit: `fda4748`
- notes: test releases held replies in a loop so a sequential impl fails fast rather than timing out

## Cycle: U118 every model request goes to a configured base

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U118 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U118 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 127 passed, 0 failed, 24 ignored
- refactor: none
- commit: `bf832f9`
- notes: mutant: embedding base replaced by a hard-coded URL -> AssertionError (1 failed); restored. Separate CHAT_API_BASE covers the chat side

## Cycle: U119 config gate: unset EMBEDDING_API_BASE returns the exact not-configured text for capture

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U119 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U119 /" tests/` -> `AssertionError` -  `Error: configuration incomplete` (1 failed)
- green: `lib/tools.ts` gate() wrapper resolves config per call and returns the contract text; applied to capture_thought. Suite -> 128 passed, 0 failed, 24 ignored
- refactor: none
- commit: `2b60f64`
- notes: other tools adopt the gate in U120

## Cycle: U120 config gate: with CHAT_MODEL unset each of the six tools returns isError naming CHAT_MODEL

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U120 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U120 /" tests/` -> `AssertionError: Values are not equal: search` (-`Error: configuration incomplete`; 1 failed)
- green: `lib/tools.ts` all six handlers wrapped in gate(); temporary models() removed. Suite -> 129 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e2b6b9c`
- notes: search/search_thoughts/fetch/list/stats/capture all asserted with exact text

## Cycle: U121 config gate: no model request and no store call under a bad configuration

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U121 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U121 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate returns before any call). Suite -> 130 passed, 0 failed, 24 ignored
- refactor: none
- commit: `86ad90f`
- notes: mutant: store.countAll() fired before the gate reply -> AssertionError (1 failed); restored. Checked across all six tools with every variable unset

## Cycle: U122 config gate: tools/list still returns the six tools under a bad configuration

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U122 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U122 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 131 passed, 0 failed, 24 ignored
- refactor: none
- commit: `354adf4`
- notes: mutant: early return skipping the last four registrations when config is bad -> AssertionError (1 failed); restored

## Cycle: U123 config gate: an invalid setting is named with the missing ones

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U123 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U123 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate text written in U119 names invalid settings). Suite -> 132 passed, 0 failed, 24 ignored
- refactor: none
- commit: `af29d2a`
- notes: mutant: invalid reasons dropped -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded). Format chosen: `missing A; invalid B (reason), C (reason).`

## Cycle: U124 config gate: setting a missing variable between calls lets the second call run

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U124 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U124 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (gate resolves per call). Suite -> 133 passed, 0 failed, 24 ignored
- refactor: none
- commit: `185e13f`
- notes: mutant: config cached in a global on first call -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded)

## Cycle: U125 search_thoughts and search with a failing embedding return isError naming the cause

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U125 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U125 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (embedding failure throws into the Error: wrapper). Suite -> 134 passed, 0 failed, 24 ignored
- refactor: none
- commit: `99acc6f`
- notes: mutant: search proceeds to matchThoughts with an empty vector on embed failure -> AssertionError (1 failed); restored

## Cycle: U126 capture with embedding unreachable or timing out returns isError naming the cause, no upsert

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U126 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U126 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (embedding failure throws before upsert). Suite -> 135 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c307201`
- notes: mutant: embed-failure guard removed and setEmbedding fed [] -> AssertionError (1 failed); restored

## Cycle: U127 capture with auth_rejected/model_not_found/bad_response/http_error embedding returns isError, no upsert

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U127 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U127 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 136 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c8f56c6`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Four kinds asserted by content

## Cycle: U128 capture with a 768-length embedding returns the exact wrong_dimension text, stores nothing

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U128 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U128 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 137 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e6a9926`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Text is asserted inside core's `Error:` wrapper per Assumption 6

## Cycle: U129 capture whose embedding fails while chat succeeds stores nothing

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U129 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U129 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change. Suite -> 138 passed, 0 failed, 24 ignored
- refactor: none
- commit: `93fe4e7`
- notes: mutant: embed-failure guard removed -> AssertionError (1 failed); restored. Also asserts the chat request was sent (concurrency, R5)

## Cycle: U130 capture with chat unreachable stores the fallback row with its embedding

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U130 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U130 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (chat failure already yields null metadata -> buildCaptureMetadata fallback). Suite -> 139 passed, 0 failed, 24 ignored
- refactor: none
- commit: `5f2e4a1`
- notes: mutant: chat failure yields {topics:["x"]} metadata -> AssertionError (1 failed); restored

## Cycle: U131 capture with chat timing out stores the fallback row and ends with the skip line naming the timeout

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U131 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U131 /" tests/` -> `AssertionError: Captured as observation — uncategorized` (regex did not match; 1 failed)
- green: `lib/tools.ts` capture appends `\nMetadata extraction skipped: <chat message sans trailing period>. Saved with default metadata.` when chat failed. Suite -> 140 passed, 0 failed, 24 ignored
- refactor: none
- commit: `e6246c0`
- notes: -

## Cycle: U132 capture with a chat 5xx or missing choices stores the fallback row with the skip line

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U132 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U132 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (U131 skip line covers failed chat). Suite -> 141 passed, 0 failed, 24 ignored
- refactor: none
- commit: `26b8e36`
- notes: mutant: skip-line branch disabled -> AssertionError (1 failed); restored (first mutant attempt was a type error, discarded)

## Cycle: U133 capture with non-JSON-object chat content stores the fallback row with the skip line

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U133 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U133 /" tests/` -> `AssertionError: Captured as observation — uncategorized` (no skip line; 1 failed)
- green: `lib/tools.ts` skip reason also set when chat replied but the content is unusable. Suite -> 142 passed, 0 failed, 24 ignored
- refactor: none
- commit: `56e3fcb`
- notes: -

## Cycle: U134 capture with fenced JSON chat content stores enrichment_status complete

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U134 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U134 /" tests/` -> (passed on first run, 1 passed; mutant below)
- green: `lib/tools.ts` no change (parseUsableMetadata handles one fenced block). Suite -> 143 passed, 0 failed, 24 ignored
- refactor: none
- commit: `08e387f`
- notes: mutant: plain JSON.parse instead of parseUsableMetadata -> AssertionError (1 failed); restored
