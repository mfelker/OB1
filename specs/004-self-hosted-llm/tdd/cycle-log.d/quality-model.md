# Quality log: model client

## Quality: U43, U44, U60 (Finding 13 part, task T059)

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U43,U44,U60`
- before: default timeoutMs 50 for every test; U43 and U60 used fixed sleeps.
- after: default 5000; small timeouts only in the U44 and U60 hang parts; U43/U60 use hold + release with bounded waitFor polls; hanging calls wrapped in a bounded within() race.
- proof: 5/5 runs of the model-client file passed (37 passed each); mutant AbortSignal.timeout(timeoutMs * 100) makes U44 and U60 FAIL after about 1 s (bound), no hang.
- suite: 242 passed, 0 failed
- commit: `5af8db7`

## Quality: U42, U44, U45, U46, U48, U62, U47, U64 (Finding 18 part, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/model_client_test.ts::U42,U44,U45,U47,U48,U64`
- before: EMB and CHAT were the same URL; U47 embed only; U64 trim only for http_error.
- after: chat base is http://chat.test/v1; U42/U44/U45/U48 assert the role's own base and not the other; U40 now routes chat listModels; U47 covers chat for 400/422; new U64 test covers the unreachable path (200 kept, 201 cut, redaction before cut).
- proof: mutant chat() using the embedding base fails U35, U36, U40, U41, U42, U43, U44, U45 and more; mutant limiting the 400/422 branch to embedding fails U47; mutant replacing serverText with redact on the unreachable path fails U64. All restored; lib clean.
- suite: 242 passed, 0 failed
- commit: `5af8db7` (both findings in one commit)
