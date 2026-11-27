# Cycle log stream: A (app and entry: T031, T032, T045, flips T033, T046, T051, T059, T065)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-app`, branch `contrib/mfelker/thought-attachments-app`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. A "mutant" red means the test passed on its first run; the code was then broken minimally (confirmed with grep), the test failed as quoted, and the file was restored byte for byte.

Cycle baseline: suite 296 passed, 63 ignored at `be151ad`.

## T031: `src/app.ts`, `tests/app_test.ts`

## Cycle U293: the correct key in x-brain-key lets initialize succeed

- test: `tests/app_test.ts::U293 the correct key in x-brain-key lets an MCP initialize succeed` (new)
- red: `error: Error: not implemented` (1 failed)
- green: `createApp` composes `createFinisher`, `buildServer` and a `StreamableHTTPTransport` per request on a Hono app. Suite 297 passed
- commit: `7b6c1a0`

## Cycle U294: the correct key as ?key= lets initialize succeed

- test: `tests/app_test.ts::U294 the correct key as ?key= lets an MCP initialize succeed` (new)
- first run: `1 passed` (no key check yet)
- mutant: `if (new URL(c.req.url).searchParams.has("key")) return c.json({ error: "mutant" }, 401);` -> `-   "mutant"` (1 failed); restored. Suite 298 passed
- commit: `7738897`

## Cycle U295: a wrong key gets the core's authorization error and the store is never called

- test: `tests/app_test.ts::U295 a wrong key gets an authorization error, and the store is never called` (new)
- red: `-     calls: [ "listByParent" ]` / `+     error: { code: -32001, … }` (1 failed)
- green: the key from `x-brain-key` or `?key=`, compared in constant time (`sameKey`: XOR over every byte of the expected key, lengths folded in); a refusal is the core's JSON-RPC envelope, code -32001, HTTP 200, echoing the request id. Suite 299 passed
- commit: `e89f83c`

## Cycle U296: a missing key gets an authorization error

- test: `tests/app_test.ts::U296 a missing key gets an authorization error` (new)
- first run: `1 passed`
- mutant: `if (given && !sameKey(…))` -> `-     error: undefined` with a full `tools/list` result (1 failed); restored. Suite 300 passed
- commit: `f976182`

## Cycle U297: an empty configured key refuses every MCP request

- test: `tests/app_test.ts::U297 with an empty configured key, every MCP request is refused` (new; settings tweaked to `mcpAccessKey: ""`, since `loadSettings` already refuses it, U355)
- first run: `1 passed`
- mutant: `if (given === null || !sameKey(…))` -> `-       undefined` / `+       -32001` for the empty `?key=` (1 failed); restored. Suite 301 passed
- commit: `2096a4c`

## Cycle U298: CORS as the core server

- test: `tests/app_test.ts::U298 an OPTIONS preflight gets the CORS headers the core server sends, with no key` (new; also the headers on a reply and on a refusal)
- red: `-     body: '{"jsonrpc":"2.0","error":{"code":-32001,…` / `+     body: "ok"` (1 failed)
- green: `app.options("*")` answers `ok` with the core's `corsHeaders`; MCP replies and refusals carry them; `mcp-session-id` is dropped as the core does. Suite 302 passed
- commit: `98e6f8c`

## Cycle U299: the Accept header patch

- test: `tests/app_test.ts::U299 an MCP request with no event-stream Accept header is handled, as the core server patches it` (new)
- red: `-     status: 406` with "Not Acceptable: Client must accept both application/json and text/event-stream" (1 failed)
- green: the core's patched request with `Accept: application/json, text/event-stream`. Suite 303 passed
- commit: `c5df52e`

## Cycle U347: settings not ok, an MCP call gets the named error

- test: `tests/app_test.ts::U347 createApp with settings not ok answers an MCP tools/call with the named settings error and nothing else` (new)
- red: `error: Error: not implemented` at `createApp` (1 failed)
- green: `createApp({ ok: false })` returns a handler that answers every request with a JSON-RPC error (code -32000, HTTP 200, CORS headers) whose message is `setting <NAME> is invalid: <reason>`, problems joined by a semicolon and a space. Suite 304 passed
- commit: `e111421`

## Cycle U348: the error never echoes the value

- test: `tests/app_test.ts::U348 the settings error names the setting and what it must be, never the value given` (new)
- first run: `1 passed`
- mutant: drop `: ${p.reason}` -> `Expected actual: "…setting MAX_IMAGE_MB is invalid; setting MAX_PDF_PAGES is invalid…" to contain: "setting MAX_PDF_PAGES is invalid: must be a positive whole number".` (1 failed); restored. Suite 305 passed
- commit: `a3d1454`

## T032: `productionDeps()`, `tests/imports_test.ts`

## Cycle U300: productionDeps with settings not ok

- test: `tests/app_test.ts::U300 productionDeps with settings that are not ok returns ok false, naming the settings and no values, without throwing` (new; process env set and restored around the call)
- red: `error: Error: not implemented` (1 failed)
- green: `loadSettings(Deno.env.get)`; not ok returns `{ ok: false, problems }`. The ok branch still threw (it is U301's). Suite 306 passed
- commit: `fe110fd`

## Cycle U301: the production store talks to SUPABASE_URL with the service-role key

- test: `tests/app_test.ts::U301 productionDeps' store sends its requests to SUPABASE_URL with the service-role key` (new; `globalThis.fetch` stubbed and restored)
- red: `error: Error: not implemented` (1 failed)
- green: `createSupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, settings, fetch)`, the real embedding and vision clients, all over a late-bound `globalThis.fetcha semicolon and a spacenow` is the wall clock and `randomBytes` is `crypto.getRandomValues`. Suite 307 passed
- commit: `3f3deea`

## Cycle U351: settings error versus the key check

- test: `tests/app_test.ts::U351 with MCP_ACCESS_KEY set a missing or wrong key is unauthorized; unset, every call gets the named settings error instead` (new; through `productionDeps()` and `createApp`)
- first run: `1 passed`
- mutant: in the settings-error handler, `if (!request.headers.get("x-brain-key")) return await unauthorized(request);` -> `-       "Unauthorized: missing or invalid authentication."` / `+       "setting MCP_ACCESS_KEY is invalid: must be set"` (1 failed); restored. Suite 308 passed
- commit: `cf9e97c`

## Cycle U302: index.ts is the one-line entry

- test: `tests/imports_test.ts::U302 index.ts is the one-line entry` (new)
- first run: `1 passed` (the integrator wrote `index.ts` in T006)
- mutant: `Deno.serve({ port: 8080 }, createApp(productionDeps()).fetch);` -> `-     "Deno.serve({ port: 8080 }, …` (1 failed); restored. Suite 309 passed
- commit: `2053969`

## Cycle U303: no bare import specifier (BLOCKED, not committed)

- test: `tests/imports_test.ts::U303 no .ts file outside tests/ has a bare import specifier` (written, run, then removed; kept at `/Users/mfelker/.claude/jobs/4ac8d127/tmp/a/imports_with_u303.ts`)
- red: `-     "src/store.ts: @supabase/supabase-js",` / `+   []` (1 failed)
- the fix belongs to stream Q's `src/store.ts` line 7: `import { createClient } from "@supabase/supabase-js";` must be `"npm:@supabase/supabase-js@2.47.10"` (tasks.md Seams "Imports", spec 004 R10). Reported to the integrator; the test is not committed, since a red commit is not allowed
- commit: none

## Cycle U304: no pdf-lib outside tests

- test: `tests/imports_test.ts::U304 no .ts file outside tests/ imports pdf-lib` (new)
- first run: `1 passed`
- mutant: `import { PDFDocument } from "npm:pdf-lib@1.17.1";` added to `src/app.ts` -> `-     "src/app.ts: npm:pdf-lib@1.17.1",` (1 failed); restored. Suite 310 passed
- commit: `ac054da`

## T045: `GET /upload` and the page routes in `src/app.ts`

## Cycle U305: GET /upload serves text/html with no key

- test: `tests/app_test.ts::U305 GET /upload returns 200 with text/html, with no brain key` (new; through `FUNCTION_URL`, `http://localhost/thought-attachments`)
- red: `-     type: "application/json"` / `+     type: "text/html"` (1 failed; the key check answered)
- green: `withLocalPath` strips an optional `/functions/v1` and then an optional `/thought-attachments` from the path before routing; `GET /upload` returns the bytes of `upload-page.html` (read beside `src/`) as `text/html; charset=utf-8`. Suite 311 passed
- commit: `9ee9050`

## Cycle U306: the page byte for byte, with either prefix

- test: `tests/app_test.ts::U306 the GET /upload body is upload-page.html byte for byte, its API-address line still blank, with or without /functions/v1` (new)
- first run: `1 passed`
- mutant: serve `(await Deno.readTextFile(UPLOAD_PAGE)).trim()` -> `-       false, false` / `+       true, true` (1 failed); restored. Suite 312 passed
- commit: `34628a9`

## Cycle U307: /page/start needs no brain key

- test: `tests/app_test.ts::U307 /page/start through createApp with no brain key is not refused by the key check` (new; a seeded row and page token)
- red: `-     declared: null, method: undefined` / `+     declared: "shelf.jpg", method: "PUT"` (1 failed)
- green: `app.route("/", pageRoutes(deps, services))` before the `OPTIONS` handler and the key check, so `/page/*` (and its own CORS preflight) never reaches them. Suite 313 passed
- commit: `28d84c4`

## Cycle U349: settings not ok, the page routes get the named error

- test: `tests/app_test.ts::U349 createApp with settings not ok answers /page/info, /page/start and /page/finish with the named error, no brain key needed` (new)
- red: `-       message: undefined, status: 200` / `+       message: "setting MAX_PDF_PAGES is invalid: …", status: 400` (1 failed; the JSON-RPC envelope answered)
- green: with settings not ok, a `/page/*` path answers `400 { code: "settings_invalid", message }`, which the page shows as "Refused: <message>"; every other path keeps the JSON-RPC error. Suite 314 passed
- commit: `066416f`

## Flips: `tests/acceptance_test.ts` (T033, T046, T051, T059, T065)

Red confirmation for every flip: with `src/app.ts` set back to the T006 stub (`git show be151ad:…/src/app.ts`), `RUN_TODO=1` on `tests/acceptance_test.ts` gave 63 failed, each `error: Error: not implemented` (the reds the integrator recorded in T012); the file was then restored byte for byte (`git status --short` clean). With the T031/T032/T045 `src/app.ts`, all 63 passed under `RUN_TODO=1` before any flip, so each flip is the commit that turns its test into a plain `Deno.test`: run alone (`1 passed`), then the suite, then one commit. No assertion was changed. The last flip (A56) also removes the now-unused `todo` import.

| id | task | single | suite | commit |
| --- | --- | --- | --- | --- |
| A1 | T033 | 1 passed | 315 passed | `23e9e3f` |
| A2 | T033 | 1 passed | 316 passed | `926cd2e` |
| A3 | T033 | 1 passed | 317 passed | `a6daceb` |
| A4 | T033 | 1 passed | 318 passed | `9d45c66` |
| A5 | T033 | 1 passed | 319 passed | `a1f9e21` |
| A6 | T033 | 1 passed | 320 passed | `d36e56c` |
| A7 | T033 | 1 passed | 321 passed | `9107181` |
| A8 | T033 | 1 passed | 322 passed | `1152f6f` |
| A9 | T033 | 1 passed | 323 passed | `b3a8113` |
| A10 | T033 | 1 passed | 324 passed | `4222ab7` |
| A11 | T033 | 1 passed | 325 passed | `040aa90` |
| A12 | T033 | 1 passed | 326 passed | `a83ce80` |
| A53 | T033 | 1 passed | 327 passed | `e971cbc` |
| A57 | T033 | 1 passed | 328 passed | `7bf06d2` |
| A59 | T033 | 1 passed | 329 passed | `bee3f1f` |
| A13 | T046 | 1 passed | 330 passed | `1eca474` |
| A14 | T046 | 1 passed | 331 passed | `185e8fb` |
| A15 | T046 | 1 passed | 332 passed | `e0394fa` |
| A16 | T046 | 1 passed | 333 passed | `6b559a5` |
| A17 | T046 | 1 passed | 334 passed | `c83ff18` |
| A18 | T046 | 1 passed | 335 passed | `fbe1edd` |
| A19 | T046 | 1 passed | 336 passed | `e00d703` |
| A20 | T046 | 1 passed | 337 passed | `e4d4f99` |
| A21 | T046 | 1 passed | 338 passed | `f121594` |
| A22 | T046 | 1 passed | 339 passed | `9db6041` |
| A23 | T046 | 1 passed | 340 passed | `fcce541` |
| A24 | T046 | 1 passed | 341 passed | `71fdce3` |
| A25 | T046 | 1 passed | 342 passed | `32f215c` |
| A26 | T046 | 1 passed | 343 passed | `82d4b8c` |
| A58 | T046 | 1 passed | 344 passed | `5773e62` |
| A60 | T046 | 1 passed | 345 passed | `9890879` |
| A61 | T046 | 1 passed | 346 passed | `6893c3f` |
| A27 | T051 | 1 passed | 347 passed | `4fb2c7e` |
| A28 | T051 | 1 passed | 348 passed | `f36f2d4` |
| A29 | T051 | 1 passed | 349 passed | `51f3bf3` |
| A30 | T059 | 1 passed | 350 passed | `7db7d58` |
| A31 | T059 | 1 passed | 351 passed | `03ad181` |
| A32 | T059 | 1 passed | 352 passed | `16b7f87` |
| A33 | T059 | 1 passed | 353 passed | `6827027` |
| A34 | T059 | 1 passed | 354 passed | `c7ebf31` |
| A35 | T059 | 1 passed | 355 passed | `b10db83` |
| A36 | T059 | 1 passed | 356 passed | `ccb6039` |
| A37 | T059 | 1 passed | 357 passed | `be0effa` |
| A38 | T059 | 1 passed | 358 passed | `26b86fd` |
| A39 | T059 | 1 passed | 359 passed | `33f0a33` |
| A40 | T059 | 1 passed | 360 passed | `3eff610` |
| A41 | T059 | 1 passed | 361 passed | `68d9d9a` |
| A42 | T059 | 1 passed | 362 passed | `479cc67` |
| A43 | T059 | 1 passed | 363 passed | `ad6e3fb` |
| A44 | T059 | 1 passed | 364 passed | `5295759` |
| A45 | T059 | 1 passed | 365 passed | `e4ead3d` |
| A54 | T059 | 1 passed | 366 passed | `d0837bc` |
| A55 | T059 | 1 passed | 367 passed | `1daae17` |
| A62 | T059 | 1 passed | 368 passed | `14a81e7` |
| A63 | T059 | 1 passed | 369 passed | `6018380` |
| A46 | T065 | 1 passed | 370 passed | `fbef574` |
| A47 | T065 | 1 passed | 371 passed | `69d5303` |
| A48 | T065 | 1 passed | 372 passed | `1a8d532` |
| A49 | T065 | 1 passed | 373 passed | `e6b17a5` |
| A50 | T065 | 1 passed | 374 passed | `f261036` |
| A51 | T065 | 1 passed | 375 passed | `c09a625` |
| A52 | T065 | 1 passed | 376 passed | `ad59d62` |
| A56 | T065 | 1 passed | 377 passed | `c4e3a83` |

After A56: `RUN_TODO=1` and the default run both give 377 passed, 0 failed, 0 ignored.
