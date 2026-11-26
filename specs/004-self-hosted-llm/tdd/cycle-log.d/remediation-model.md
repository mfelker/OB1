# Remediation log: model and setup check

## Remediation: U56 (verification finding 1, task T051)

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U56 …` (strengthened)
- before: both Matryoshka fixtures also contained "dimension", so the matryoshka alternative was never isolated
- after: added case, HTTP 400 body `Model 'x' does not support Matryoshka embeddings`; asserts exactly 2 requests, dimensions key dropped on retry, ok 1536 result
- mutant: `lib/model_client.ts:105` `/dimension|matryoshka/i" -> "/dimension/i" -> new U56 test FAILED (caught); restored, "git status` clean
- suite: 240 passed, 0 failed
- commit: `1a79400`

## Remediation: U52 (verification finding 4, task T052 part)

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U52 …` (strengthened)
- before: loop with `if (!r.ok)` deciding what to assert
- after: straight-line: 1536 -> exactly `{ok:true, value: sent}`; 1535 and 1537 -> ok false, kind wrong_dimension
- mutant: `lib/model_client.ts:115` `!==" -> ">" -> U52 FAILED (caught); restored, "git status` clean
- suite: 240 passed, 0 failed
- commit: `218d512`

## Remediation: U171 (verification finding 3, task T052 part)

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U171 shared base …", "U171 split bases …` (split)
- before: loop over two envs with an `if` choosing counts
- after: two straight-line tests with literal counts (shared: 1 POST embeddings, 1 POST chat, 2 GET /models, 4 total; split: 1+1+1 GET per base, 4 total)
- mutant: `lib/setup_check.ts" extra "client.listModels("embedding")" call -> both U171 tests FAILED (3 vs expected 2 in shared) (caught); restored, "git status` clean
- suite: 240 passed, 0 failed
- commit: `b1180e5`
