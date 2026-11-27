# Cycle log stream: E (T024, T037), model clients

Append only. Worktree `.worktrees/ta-models`, branch `contrib/mfelker/thought-attachments-models`, folder `F` = `.worktrees/ta-models/integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red below reported `1 failed`; every green `1 passed`. Suite counts are `N passed, 0 failed, 63 ignored` (the ignored ones are the acceptance todos). Baseline before the first cycle: 48 passed.

Refactor: none unless noted. Red lines are the decisive line of the single-test run.

## T024 embeddings (`tests/embeddings_test.ts`, `src/embeddings.ts`)

## Cycle U161: embed posts the model and an array input

- red: `error: Error: not implemented` (stub). Commit `2b97f67`. Suite 49 passed.
- green: one POST to `<base>/embeddings`, body `{ model, input }`.

## Cycle U162: 64 texts in one request

- first run PASSED (single request already).
- mutant: `input: texts.slice(0, 63)` -> `1 failed` (input length 63 vs 64). Restored byte for byte (`git diff` clean), rerun `1 passed`. Commit `795c722`.

## Cycle U163: 65 texts in two requests (64, 1)

- red: `AssertionError: Values are not equal.` `- 65` vs `+ 64, + 1`.
- green: sequential loop over `embeddingBatchSize` slices. Suite 50 passed. Commit `4b2c0df`.

## Cycle U164: batch size 1, one text per request

- first run PASSED (generic loop).
- mutant: `i += size + 1` -> `1 failed` (text 1 skipped from the recorded inputs). Restored, `1 passed`. Commit `4a8c074`.

## Cycle U165: bearer key on every request

- red: `AssertionError: - undefined + "Bearer test-embedding-key-placeholder"`.
- green: `authorization` header from `embeddingApiKey` when set. Suite 52 passed. Commit `bf6eea0`.

## Cycle U166: vectors in input order across batches

- first run PASSED (compared to `vectorFor` per text over batch size 2 and 5 texts).
- mutant: `vectors.unshift(...)` for `vectors.push(...)` -> `1 failed`. Restored, `1 passed`. Commit `dab2513`.

## Cycle U167: unreachable endpoint

- red: `error: TypeError: connection refused`.
- green: try/catch around fetch returns `R` error `embedding endpoint <base> is unreachable: ...`; `embedBatch` returns `R`. Suite 54 passed. Commit `02c710f`.

## Cycle U168: non-2xx status

- red: `error: SyntaxError: Unexpected token 'u', "upstream down" is not valid JSON`.
- green: `!response.ok` returns `embedding endpoint answered HTTP <status>: <body, 300 chars>`. Suite 55 passed. Commit `ac18f84`.

## Cycle U169: malformed body

- test loops over three bodies: no `data`, non-JSON text, one vector for two inputs.
- red: `error: TypeError: Cannot read properties of undefined (reading 'map')`.
- green: guarded parse, count and shape check, reason `... sent a malformed reply ...`. Suite 56 passed. Commit `4cd9c9b`.

## Cycle U170: a later batch fails the whole call

- first run PASSED (`embed` already returns the batch error).
- mutant: on error return `{ ...batch, data: vectors }` (partial vectors) -> `1 failed`. Restored, `1 passed`. Commit `be95750`.

## Cycle U171: key redacted from an error body

- red: `AssertionError: embedding endpoint answered HTTP 401: invalid api key test-embedding-key-placeholder for this account`.
- green: `redact()` over the unreachable message and the body. Suite 58 passed. Commit `1fef04a`.
- refactor: redact the whole body before truncating to 300 characters, so a key cut by the slice can't leak (commit `2d5f132`, suite 58 passed).

## T037 vision (`tests/vision_test.ts`, `src/vision.ts`)

## Cycle U172: configured

- red: `error: Error: not implemented`.
- green: `configured = Boolean(visionApiBase && visionModel)`; `caption` still throws. Suite 59 passed. Commit `7c86fb4`.

## Cycle U173: request shape and data URL of the real type

- red: `error: Error: not implemented` (`caption`).
- green: POST `<base>/chat/completions`, `model`, one user message with a text part and an `image_url` part `data:<type>;base64,<jsr:@std/encoding base64>`. Suite 60 passed. Commit `0c57364`. The test sends `image/png` bytes so a hard-coded JPEG type would fail.

## Cycle U174: prompt content

- red: `AssertionError: Expected actual: "describe this image." to contain: "objects".`
- green: prompt names visible objects, places, labels and text. Suite 61 passed. Commit `47cad45`.

## Cycle U175: bearer key when set

- red: `AssertionError: Values are not equal.` (header undefined).
- green: header from `visionApiKey` when set. Suite 62 passed. Commit `7b4508d`.

## Cycle U176: no Authorization when the key is unset

- first run PASSED.
- mutant: `settings.visionApiKey ? ...` -> `true ? ...` -> `1 failed`. Restored, `1 passed`. Commit `fc2a7c9`.

## Cycle U177: caption text and model

- red: `- text: "  a red door with a brass 14  "` vs `+ text: "a red door with a brass 14"` (caption is trimmed).
- green: `String(content).trim()`; model is the configured `VISION_MODEL` (the one the request named). Suite 64 passed. Commit `ad076d8`.

## Cycle U178: unreachable endpoint

- red: `error: TypeError: connection refused`.
- green: try/catch, reason `vision endpoint <base> is unreachable: ...`. Suite 65 passed. Commit `129f246`.

## Cycle U179: non-2xx status

- red: `error: SyntaxError: Unexpected token 'b', "bad gateway" is not valid JSON`.
- green: `!response.ok` returns `... answered HTTP <status>: ...`. Suite 66 passed. Commit `353c740`.

## Cycle U180: empty or whitespace caption

- test loops over `""`, whitespace and `choices: []`.
- red: `AssertionError: expected an error for {... "content":""}`.
- green: guarded parse, empty text returns `vision endpoint returned an empty caption`. Suite 67 passed. Commit `4446c6f`.

## Cycle U181: key redacted

- test covers a 401 body and a network error message that contain the key.
- red: `AssertionError: vision endpoint answered HTTP 401: invalid api key test-vision-key-placeholder for this account`.
- green: `redact()` on the body and the unreachable message. Suite 68 passed, 0 failed.
- process note: I first committed after a `deno fmt` run without re-running the suite, and the network-error half was still red (my string replace missed the already-reformatted line). I fixed it and amended that local, unpushed commit before any other work, so the final commit `bf238f7` is green. The same commit includes `deno fmt` reformatting of the four owned files.
