# Quality log: app and harness

## Quality: U196 (Finding 12 part, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U196`
- before: expected body was computed by calling runSetupCheck on equivalent deps, so app and report could be wrong together
- after: literal expectations. ok case: 200, ok true, the seven check ids in order all ok true, thoughts.other_model 2 (3 seeded rows, 1 with the model), config.embedding base/model/key_set, timeout_ms 60000. failing case: 503, ok false, 7 checks with "config" first and failing (reason names EMBEDDING_API_BASE), other_model null, config null. The unused runSetupCheck import was removed in the next commit.
- proof: mutant in lib/app.ts serializing "{ ...report, ok: !report.ok }" fails U196; mutant dropping checks (and warnings) from the body fails U196; both restored
- suite: 241 passed, 0 failed
- commit: `aae74ea`

## Quality: U193, U194 (Finding 17, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U193, U194`
- before: U194 matched the exact source text of index.ts; U193 asserted only seen.length > 0
- after: U194 strips comments and whitespace and requires one import (createApp, productionDeps, ./lib/app.ts) and exactly one other statement that is a Deno.serve call referencing createApp( and productionDeps(). U193 keeps the finally restore and asserts exactly 1 request, origin http://db.test, path "/rest/v1/thoughts", method HEAD, apikey header.
- proof: U194 still passes after adding a comment line and reformatting the statement across lines in index.ts (restored); U194 fails when Deno.serve is replaced by console.log (restored); U193 fails when productionDeps appends "/other" to SUPABASE_URL (restored)
- suite: 241 passed, 0 failed
- commit: `b273a2a`

## Quality: H10-H19 (Finding 19, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/helpers/helpers_test.ts::H10-H19`
- before: H1-H9 did not exercise networkError, function handlers, handler sequences, unmatched, seed, fail, calls, countAll/countWithModel, override or todo
- after: H10 networkError, H11 function handlers, H12 per-call sequence (500, 404, 200, 200, 200), H13 unmatched, H14 seed, H15 fail, H16 calls, H17 counts and model filter, H18 override (wins over fail, still recorded), H19 todo (Deno.test temporarily stubbed and RUN_TODO set to unset, 1 and 0 to read the registered ignore flag; both restored in finally, so no side effects)
- proof: all 10 pass; the full suite is green
- suite: 251 passed, 0 failed
- commit: `4c6ed4f`
