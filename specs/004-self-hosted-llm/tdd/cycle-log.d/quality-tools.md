# Quality log: tools

## Quality: U145 (Finding 14, task T059)

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U145`
- before: asserted only that no secret appeared in each reply; a path whose echo never reached the reply passed vacuously
- after: every path (all 10) carries an exact expected reply with the echo redacted, plus an explicit check that the reply contains "[redacted]" (positive control)
- proof: mutant redactSecrets returns input unchanged in lib/tools.ts: U145 fails. Mutant redact() returns text in lib/model_client.ts: U145 still passes, because the tools-layer redactSecrets independently redacts the same two model keys (EMBEDDING_API_KEY, CHAT_API_KEY); the model-path entries therefore cover the tools layer only, and the model_client redaction is covered by model_client_test.ts
- suite: 47 passed in tools_test.ts, 0 failed (full suite green)
- commit: `e631475`

## Quality: U102, U112 (Finding 12 part, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U102, U112`
- before: expected titles computed by a restated copy of core's thoughtTitle (title helper)
- after: helper removed; fixed created_at 2031-02-03T12:00:00.000Z and a literal 100-char content with a doubled space; the title tail is a literal 80-char string. Deliberate loosening: the date part of the title is matched by regex (digits and separators) because toLocaleDateString varies by locale and zone; the content part after " - " is exact
- proof: mutant slice(0, 80) to slice(0, 70) in lib/tools.ts: U102 and U112 fail
- suite: 47 passed, 0 failed
- commit: `e631475`

## Quality: U123, U125, U126, U127, U132, U133 (Finding 15 part, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U123,U125,U126,U127,U132,U133`
- before: startsWith, endsWith and includes fragments
- after: exact full-string assertEquals on the deterministic reply text (U125 also drops the redundant not-contains Milk check, now implied by equality)
- proof: mutants "could not be reached:" to "cannot be reached:" fails U125 and U126; "was not a JSON object" to "was no JSON object" fails U133; "access key rejected" to "key rejected" fails U127; "Saved with default metadata." to "Saved with defaults." fails U131, U132, U133, U145
- suite: 47 passed, 0 failed
- commit: `e631475`
