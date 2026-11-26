# Stream M cycle log

## Cycle: U33 embed request shape

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U33 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U33 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts embed() posts {model,input,dimensions:1536} to <base>/embeddings. Suite -> 10 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `0c769f4`
- notes: none

## Cycle: U34 embed returns vector

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U34 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U34 /" tests/` -> AssertionError: Values are not equal (stub returned ok:false) (1 failed)
- green: lib/model_client.ts embed() parses data[0].embedding. Suite -> 11 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `5e2bcaf`
- notes: none

## Cycle: U35 chat request shape

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U35 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U35 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts chat() posts model/response_format/messages to <base>/chat/completions. Suite -> 12 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `5bd4d3c`
- notes: none

## Cycle: U36 chat returns content

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U36 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U36 /" tests/` -> AssertionError: Values are not equal (message: "not implemented") (1 failed)
- green: lib/model_client.ts chat() parses choices[0].message.content. Suite -> 13 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `c9a4212`
- notes: none

## Cycle: U37 listModels request

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U37 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U37 /" tests/` -> `not implemented` error from stub (1 failed)
- green: lib/model_client.ts listModels() GETs <role base>/models. Suite -> 14 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `854ddf3`
- notes: none

## Cycle: U38 Bearer key on all operations

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U38 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U38 /" tests/` -> AssertionError: Values are not equal (authorization undefined) (1 failed)
- green: lib/model_client.ts send() helper adds Authorization when ep.key. Suite -> 15 passed | 0 failed | 24 ignored
- refactor: extracted send() helper from three inline fetches
- commit: `6351ee7`
- notes: none

## Cycle: U39 no key, no Authorization header

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U39 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U39 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (send() already conditional). Suite -> 16 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `4b35fc1`
- notes: mutant: send() always adds Authorization -> U39 failed (AssertionError); restored, passes

## Cycle: U40 each role sends its own key

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U40 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U40 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 17 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `d10b92f`
- notes: mutant: listModels always uses embedding endpoint -> U40 failed (Values are not equal); restored

## Cycle: U41 requests stay on configured bases

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U41 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U41 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 18 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `c642683`
- notes: mutant: URL base replaced by http://evil.test -> U41 failed (no route for POST http://evil.test/embeddings); restored. Retry request not yet covered here: re-checked after U54-U55 (see those entries)

## Cycle: U42 unreachable outcome

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U42 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U42 /" tests/` -> TypeError: connection refused (fetch rejection propagated) (1 failed)
- green: lib/model_client.ts send() catches fetch rejection -> unreachable with role and base. Suite -> 19 passed | 0 failed | 24 ignored
- refactor: send() now returns {response}|Failure
- commit: `5b14838`
- notes: none

## Cycle: U43 reply inside timeout is ok

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U43 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U43 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 20 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `e955330`
- notes: mutant: embed returns ok:false -> U43 failed (AssertionError); restored

## Cycle: U44 timeout outcome

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U44 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U44 /" tests/` -> `Promise resolution is still pending but the event loop has already resolved` (hung fetch never settles) (1 failed)
- green: lib/model_client.ts send() passes AbortSignal.timeout(timeoutMs); aborted -> timeout. Suite -> 21 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `3a67b6a`
- notes: none

## Cycle: U45 401/403 auth_rejected

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U45 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U45 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (no status handling) (1 failed)
- green: lib/model_client.ts httpFailure() maps 401/403 to auth_rejected. Suite -> 22 passed | 0 failed | 24 ignored
- refactor: send() now reads the body under the timeout and returns {status,text}
- commit: `e344db7`
- notes: none

## Cycle: U46 404 model_not_found

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U46 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U46 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts httpFailure() maps 404 to model_not_found. Suite -> 23 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `fe7a776`
- notes: none

## Cycle: U47 400/422 body naming unknown model

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U47 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U47 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts namesModelAsUnknown() + 400/422 branch. Suite -> 24 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `74221f4`
- notes: none

## Cycle: U48 5xx http_error

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U48 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U48 /" tests/` -> `Error: not implemented` (httpFailure fallthrough) (1 failed)
- green: lib/model_client.ts httpFailure() returns http_error with role, status, text. Suite -> 25 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `ca3cc1c`
- notes: none

## Cycle: U49 plain 400 is http_error, one request

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U49 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U49 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 26 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `3bf751a`
- notes: mutant: 400/422 branch always model_not_found -> U49 failed; restored

## Cycle: U50 malformed embeddings reply is bad_response

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U50 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U50 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (1 failed)
- green: lib/model_client.ts parseJson() + embedding shape validation -> bad_response. Suite -> 27 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `74d7e0b`
- notes: none

## Cycle: U51 malformed chat reply is bad_response

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U51 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U51 /" tests/` -> `TypeError: Cannot read properties of undefined (reading '0')` (1 failed)
- green: lib/model_client.ts chat() validates choices[0].message.content. Suite -> 28 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `254a4ac`
- notes: none

## Cycle: U52 1536 ok, 1535/1537 wrong_dimension

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U52 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U52 /" tests/` -> `AssertionError: Values are not equal: length 1535` (1 failed)
- green: lib/model_client.ts embed() length check against EXPECTED_DIMENSIONS. Suite -> 29 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `1cc3324`
- notes: none

## Cycle: U53 wrong_dimension exact message

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U53 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U53 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (message written with U52 to satisfy the contract text). Suite -> 30 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `cc1da3b`
- notes: mutant: 'Choose'->'Pick' in message -> U53 failed; restored

## Cycle: U54 dimensions retry

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U54 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U54 /" tests/` -> `AssertionError: Values are not equal` (only 1 request sent) (1 failed)
- green: lib/model_client.ts embed() retries once without dimensions on 400/422 mentioning dimension|matryoshka. Suite -> 31 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `dfba06f`
- notes: none

## Cycle: U55 retry identical apart from dimensions

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U55 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U55 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 32 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `2c1e315`
- notes: mutant: retry input changed to "x" -> U55 failed; restored

## Cycle: U41 (extension) retry stays on configured base

- test: U41 extended with a dimensions-retry scenario; passed on first run
- mutant: retry sent to http://evil.test -> U41 failed (FakeFetch: no route); restored, suite green
- commit: `4a94a6e`

## Cycle: U56 retry triggers sampled

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U56 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U56 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 33 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `6eaa99b`
- notes: mutant: dropped /i flag from the retry regex -> U56 failed; restored

## Cycle: U57 no retry for 404 / 500

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U57 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U57 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 34 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `95167e8`
- notes: mutant: retry on any status >=400 -> U57 failed; restored

## Cycle: U58 retry is single

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U58 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U58 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 35 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `339fd98`
- notes: mutant: a second retry after the retry -> U58 failed (3 requests); restored

## Cycle: U59 retry result goes through length check

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U59 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U59 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 36 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `128c50f`
- notes: mutant: retry 2xx returned without length check -> U59 failed; restored

## Cycle: U60 retry has own timeout

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U60 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U60 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (each send() creates its own AbortSignal). Suite -> 37 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `cd8d6ca`
- notes: first mutant (shared AbortSignal) survived because FakeFetch function handlers ignore the signal; test rewritten to use `hold` replies, then the mutant -> U60 failed (AssertionError); restored. Commit amended

## Cycle: U61 one request on success

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U61 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U61 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change. Suite -> 38 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `869780e`
- notes: mutant: retry on any response -> U61 failed (2 requests); restored

## Cycle: U62 redact keys in server text

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U62 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U62 /" tests/` -> `AssertionError: Expected actual: ... to contain: "[redacted]"` (1 failed)
- green: lib/model_client.ts redact() applied to the http_error server text. Suite -> 39 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `0e66367`
- notes: none

## Cycle: U63 redact keys in fetch error

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U63 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U63 /" tests/` -> `AssertionError: Expected actual: "...could not be reached." to contain: "[redacted]"` (1 failed)
- green: lib/model_client.ts unreachable message now carries the redacted fetch error text. Suite -> 40 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `97fe82b`
- notes: none

## Cycle: U64 200-char trim after redaction

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U64 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U64 /" tests/` -> `AssertionError` (201-char text not cut) (1 failed)
- green: lib/model_client.ts serverText() = redact then slice(0,200), used for http_error and unreachable. Suite -> 41 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `d8e3f25`
- notes: mutant: trim before redact -> U64 failed (key prefix leaked); restored

## Cycle: U65 listModels returns ids

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U65 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U65 /" tests/` -> `AssertionError: Values are not equal` (value null) (1 failed)
- green: lib/model_client.ts listModels() maps data[].id. Suite -> 42 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `7e503f6`
- notes: none

## Cycle: U66 listModels null for unusable listing

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U66 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U66 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (written with U65). Suite -> 43 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `f45db3b`
- notes: mutant: unusable listing returns [] -> U66 failed; restored

## Cycle: U67 listModels maps 401 and unreachable

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U67 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U67 /" tests/` -> n/a: passed on first run (1 passed)
- green: no code change (shared send()/httpFailure()). Suite -> 44 passed | 0 failed | 24 ignored
- refactor: none needed
- commit: `02ca108`
- notes: two mutants: 401 no longer auth_rejected; unreachable kind changed -> U67 failed each; restored
