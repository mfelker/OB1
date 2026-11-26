# Stream A cycle log

## Cycle: U180 OPTIONS answers ok with CORS

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U180 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U180 /" tests/` -> `Error: not implemented` at createApp (1 failed)
- green: `lib/app.ts` createApp returns a handler answering OPTIONS with `ok`, 200 and core's CORS headers. Suite -> 189 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `da8d806`

## Cycle: U181 unauthorized POST gets the -32001 envelope

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U181 …` (new)
- red: `deno test … --filter "/^U181 /" tests/` -> `Error: not implemented` (1 failed)
- green: `lib/app.ts` `unauthorizedResponse()` (id null for now); createApp returns it for non-OPTIONS. Suite -> 190 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cb7055e`

## Cycle: A1 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A1` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 202 passed | 0 failed | 23 ignored (1s)
- refactor: none needed
- commit: `46441dc`

## Cycle: A2 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A2` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 203 passed | 0 failed | 22 ignored (1s)
- refactor: none needed
- commit: `367b0e6`

## Cycle: A3 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A3` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 204 passed | 0 failed | 21 ignored (1s)
- refactor: none needed
- commit: `eb10acb`

## Cycle: A4 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A4` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 205 passed | 0 failed | 20 ignored (1s)
- refactor: none needed
- commit: `4c92ede`

## Cycle: A5 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A5` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 206 passed | 0 failed | 19 ignored (1s)
- refactor: none needed
- commit: `23d3c62`

## Cycle: A6 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A6` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 207 passed | 0 failed | 18 ignored (1s)
- refactor: none needed
- commit: `c8a1cd4`

## Cycle: A7 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A7` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 208 passed | 0 failed | 17 ignored (1s)
- refactor: none needed
- commit: `17f1a91`

## Cycle: A8 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A8` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 209 passed | 0 failed | 16 ignored (1s)
- refactor: none needed
- commit: `a4d5ce3`

## Cycle: A10 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A10` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 210 passed | 0 failed | 15 ignored (1s)
- refactor: none needed
- commit: `fd2d317`

## Cycle: A11 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A11` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 211 passed | 0 failed | 14 ignored (1s)
- refactor: none needed
- commit: `3c4d089`

## Cycle: A15 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A15` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 212 passed | 0 failed | 13 ignored (1s)
- refactor: none needed
- commit: `cb463b1`

## Cycle: A16 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A16` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 213 passed | 0 failed | 12 ignored (1s)
- refactor: none needed
- commit: `0cb9b80`

## Cycle: A17 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A17` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 214 passed | 0 failed | 11 ignored (1s)
- refactor: none needed
- commit: `132b097`

## Cycle: A18 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A18` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 215 passed | 0 failed | 10 ignored (1s)
- refactor: none needed
- commit: `25b5048`

## Cycle: A21 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A21` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 216 passed | 0 failed | 9 ignored (1s)
- refactor: none needed
- commit: `2a7315d`

## Cycle: A22 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A22` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 217 passed | 0 failed | 8 ignored (1s)
- refactor: none needed
- commit: `48a7367`

## Cycle: A23 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A23` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 218 passed | 0 failed | 7 ignored (1s)
- refactor: none needed
- commit: `32041e5`

## Cycle: A24 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A24` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the MCP route (U186 f5ede72, U190 ba8c9d9, U192 60ddf69). Suite -> ok | 219 passed | 0 failed | 6 ignored (1s)
- refactor: none needed
- commit: `a954827`

## Cycle: U182 envelope echoes scalar id

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U182 …` (new)
- red: `deno test … --filter "/^U182 /" tests/` -> `AssertionError: Values are not equal.` (1 failed)
- green: `lib/app.ts` extractJsonRpcId/readBodyText ported from core; fetch made async. Suite -> 191 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `502eae8`
- notes: none

## Cycle: U183 GET wrong key gets id-null envelope

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U183 …` (new)
- red: passed on first run (behavior already present after U182)
- green: `lib/app.ts` no change. Suite -> 192 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `200b404`
- notes: mutant: id ?? 0 in the envelope -> U183 failed (Values are not equal); restored

## Cycle: U184 golden equality

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U184 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change. Suite -> 193 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `2ea6e5c`
- notes: mutant: Content-Type text/plain -> U184 failed; restored. Golden literal copied from core's unauthorizedResponse (id 7)

## Cycle: U185 wrong key refused

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U185 …` (new)
- red: passed on first run (every request was refused before the auth check existed)
- green: `lib/app.ts` no change at the time. Suite -> 194 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `96b4721`
- notes: DEVIATION: a mutant was not possible until U186 added the key compare. After U186, mutant removing '|| provided !== accessKey' -> U185 failed (TypeError reading code); restored

## Cycle: U186 correct key reaches MCP route

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U186 …` (new)
- red: `--filter "/^U186 /"` -> `TypeError: Cannot read properties of undefined (reading 'tools')` (1 failed)
- green: `lib/app.ts` createApp compares header-or-query key with MCP_ACCESS_KEY, serveMcp builds a fresh buildServer + StreamableHTTPTransport per request via Hono; CORS on response. Suite -> 195 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `f5ede72`
- notes: full npm: specifiers for hono and @hono/mcp

## Cycle: U187 header precedence

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U187 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change. Suite -> 196 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `31e1e96`
- notes: mutant: query ?? header -> U187 failed at 'wrong header + right query'; restored

## Cycle: U188 and U189 unset key and Supabase headers

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U188, U189 …` (new)
- red: both passed on first run
- green: `lib/app.ts` no change. Suite -> 198 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `0f72b97`
- notes: DEVIATION: two behaviors in one commit. Mutants: '(provided) !== (accessKey || null)' -> U188 failed ('no key'); reading apikey header as a key -> U189 failed. The '!accessKey' guard is redundant with the compare for non-empty provided keys

## Cycle: U190 Accept patch

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U190 …` (new)
- red: `--filter "/^U190 /"` -> `AssertionError: Values are not equal: accept null` (1 failed)
- green: `lib/app.ts` Accept header patched to application/json, text/event-stream when it lacks text/event-stream. Suite -> 199 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `ba8c9d9`
- notes: none

## Cycle: U191 no session id, CORS

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U191 …` (new)
- red: passed on first run
- green: `lib/app.ts` no change (the transport sends no mcp-session-id in this configuration, so core's defensive delete is not reproduced). Suite -> 200 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `cb6f03f`
- notes: mutant: remove CORS loop -> U191 failed (Access-Control-Allow-Origin); restored. No mutant possible for the session-id header, the transport never emits one

## Cycle: U192 deps injected into MCP tools

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U192 …` (new)
- red: first run failed on my fixture (config gate: env lacked model settings); test fixed, then passed on first valid run
- green: `lib/app.ts` no change. Suite -> 201 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `60ddf69`
- notes: mutant: stats stubbed to count 0 in buildServer deps -> U192 failed ('Total thoughts: 0'); restored

## Cycle: U193 productionDeps

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U193 …` (new)
- red: `deno test … --filter "/^U193 /" tests/` -> `Error: not implemented` (1 failed)
- green: `lib/app.ts` productionDeps: getEnv -> Deno.env.get, modelFetch/store fetch -> globalThis.fetch, store from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Suite -> 220 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `b154eb7`

## Cycle: U194 index.ts one statement

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U194 …` (new)
- red: passed on first run (index.ts was already the one-line entry)
- green: no change. Suite -> 221 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `409f7f6`
- notes: mutant: appended `console.log("x");` to index.ts -> U194 failed (Values are not equal); restored

## Cycle: U195 no bare import specifier (BLOCKED)

- test: drafted `tests/imports_test.ts::U195` (copy saved at `specs/004-self-hosted-llm/tdd/cycle-log.d/app-U195-imports_test.ts.txt`; not committed, it is red)
- red: `deno test … --filter "/^U195 /" tests/` -> offender `lib/thought_store.ts: @supabase/supabase-js` (1 failed). Negative control assertions pass; the real scan finds one genuine bare import.
- green: BLOCKED. `lib/thought_store.ts:1` (`import { createClient } from "@supabase/supabase-js";`) belongs to another stream/merged work and must become `npm:@supabase/supabase-js@2.47.10` (the version pinned in deno.json). I may not edit that file; integrator must change it, then the test can be committed unchanged.

## Cycle: A9 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A9` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 224 passed | 0 failed | 5 ignored (1s)
- refactor: none needed
- commit: `8b46b60`

## Cycle: A12 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A12` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 225 passed | 0 failed | 4 ignored (1s)
- refactor: none needed
- commit: `55980a3`

## Cycle: A13 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A13` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U197 776df2e). Suite -> ok | 226 passed | 0 failed | 3 ignored (1s)
- refactor: none needed
- commit: `8d308ef`

## Cycle: A14 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A14` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 227 passed | 0 failed | 2 ignored (1s)
- refactor: none needed
- commit: `ed8a17a`

## Cycle: A19 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A19` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 228 passed | 0 failed | 1 ignored (1s)
- refactor: none needed
- commit: `c4eb12d`

## Cycle: A20 acceptance flipped (todo -> Deno.test)

- test: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts::A20` (flipped, body unchanged)
- red: recorded at T006 (99577b2): Error: not implemented at createApp
- green: made to pass by the setup-check route (U196 70ade4e). Suite -> ok | 229 passed | 0 failed (1s)
- refactor: none needed
- commit: `805b321`

## Cycle: U196 setup-check 200/503

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U196 …` (new)
- red: `--filter "/^U196 /"` -> `AssertionError: Values are not equal.` (1 failed; the request fell through to the MCP route)
- green: `lib/app.ts` isSetupCheck + jsonResponse; authorized setup-check runs runSetupCheck(deps), 200 if ok else 503. Suite -> 222 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `70ade4e`

## Cycle: U197 setup-check 401

- test: `integrations/self-hosted-llm-mcp/tests/app_test.ts::U197 …` (new)
- red: `--filter "/^U197 /"` -> `AssertionError: Values are not equal: …/setup-check` (1 failed)
- green: `lib/app.ts` authorized flag; unauthorized setup-check -> 401 `{"error":"Unauthorized: missing or invalid authentication."}` with CORS. Suite -> 223 passed, 0 failed, 6 ignored
- refactor: none needed
- commit: `776df2e`

## Cycle: U198, U199, U200 setup-check key handling

- test: `tests/app_test.ts::U198`, `::U199`, `::U200` (new)
- red: all three passed on first run (the shared `authorized` flag from U197 already covers them)
- green: no change. Suite -> 232 passed, 0 failed, 0 ignored
- refactor: none needed
- commit: `66c6c35`
- notes: DEVIATION: three behaviors in one commit. Mutants, each failing only its test and restored: U198 header-only key source; U199 `provided === (accessKey || null)`; U200 runSetupCheck called before the 401.

## Cycle: U201 setup-check path matching (sampled)

- test: `tests/app_test.ts::U201` (new)
- red: passed on first run (isSetupCheck from U196 already matches by last segment)
- green: no change
- commit: `8de4015`
- notes: mutants, restored: no trailing-slash trim -> failed at "/fn/setup-check/"; `endsWith("/fn/setup-check")` -> failed at "/setup-check". The test asserts the 401 first so a missed route fails fast (an authorized GET that falls to the MCP route opens an SSE stream and hangs).

## Cycle: U202 near-miss paths reach the MCP route (sampled)

- test: `tests/app_test.ts::U202` (new)
- red: passed on first run
- green: no change. Suite -> 234 passed, 0 failed
- commit: `dbea45c`
- notes: mutant `includes("setup-check")` -> U202 failed; restored

## Cycle: U203 and U204 non-setup-check routing

- test: `tests/app_test.ts::U203`, `::U204` (new)
- red: both passed on first run
- green: no change
- commit: `a359bd1` (DEVIATION: two behaviors in one commit)
- notes: mutants, restored: dropping the GET-only condition -> U203 failed; sending every unauthorized request to 401 -> U204 failed ("POST ")

## Cycle: U205 crashing setup check

- test: `tests/app_test.ts::U205` (new)
- red: `--filter "/^U205 /"` -> `Error: boom with test-key inside` (1 failed; the crash escaped the handler)
- green: `lib/app.ts` try/catch around runSetupCheck -> 500 `{"error":"Setup check failed unexpectedly."}` with CORS. Suite -> 236 passed, 0 failed
- refactor: none needed
- commit: `ae38281`

## Cycle: U195 no source file outside tests/ uses a bare import specifier (integrator, after merge)

- test: `integrations/self-hosted-llm-mcp/tests/imports_test.ts::U195 …` (new; written by stream A, held uncommitted while red because the offender was outside stream A's files)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U195 /" tests/` (on the integration branch after merging A) -> `AssertionError: Values are not equal.` listing `lib/thought_store.ts: @supabase/supabase-js` (1 failed)
- green: `lib/thought_store.ts:1` import pinned to `npm:@supabase/supabase-js@2.47.10` (same version as `deno.json`). Suite -> 238 passed, 0 failed, 0 ignored; `deno check` clean
- refactor: none needed
- commit: `aa4f940`
- notes: a real FR-014 defect. The self-hosted router applies one shared import map and ignores the function's `deno.json` (research R10), so stream S's bare import would have failed to resolve on self-hosted Supabase while every unit test passed under the local `deno.json`.
