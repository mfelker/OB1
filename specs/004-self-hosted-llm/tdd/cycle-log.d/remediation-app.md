# Remediation log: acceptance and app

## Remediation: A2 (verification finding 6, task T053)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A2 …` (strengthened)
- before: other thought was filtered by the 0.5 threshold, so "first" was trivially true
- after: other thought embeds at cosine 0.7 (above threshold, below the exact 1.0); asserts exact text and "100.0% match" under "--- Result 1 ", other text and "70.0% match" under "--- Result 2 "
- mutant: `tests/helpers/fake_store.ts" matchThoughts sort ascending -> "Expected actual: "--- Result 1 (70.0% match) ---" (caught); restored, "git status` clean
- suite: 238 passed, 0 failed
- commit: `b2ed5d1`

## Remediation: A7 (verification finding 7, task T054)

- test: `tests/acceptance_test.ts::A7 …` (strengthened)
- before: 404 body named the model, reply only needed to include the model name
- after: 404 body is `not found"; reply must include "The embedding model "embed-1536" was not found on the model server at http://model.test/v1.`
- mutant: `lib/model_client.ts:70" 404 -> http_error -> "Expected actual: "Error: x" to contain: "The embedding model ..."` (caught); restored, clean
- suite: 238 passed, 0 failed
- commit: `5a72318`

## Remediation: U187 (verification finding 8, task T055)

- test: `tests/app_test.ts::U187 …` (strengthened)
- before: accepted cases asserted only `!isRefused`
- after: both accepted cases assert HTTP 200 and the tool list equals the six core tools
- mutant: `lib/app.ts" serveMcp -> "new Response("x", {status: 500})" -> "Values are not equal: right header + wrong query` (caught); restored, clean
- suite: 238 passed, 0 failed
- commit: `e046e46`

## Remediation: U199 (verification finding 9, task T056)

- test: `tests/app_test.ts::U199 …` (strengthened)
- before: `{...MODEL_ENV, ...{}}` kept MCP_ACCESS_KEY, so "unset" was never tested
- after: unset env built by deleting MCP_ACCESS_KEY from MODEL_ENV; empty-string case kept; key `"undefined"` added
- mutant: `lib/app.ts:91` `authorized = !!provided && (accessKey === undefined || provided === accessKey)" -> "AssertionError: Values are not equal.` (caught); restored, clean
- suite: 238 passed, 0 failed
- commit: `47c613e`
