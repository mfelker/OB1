# Cycle log stream: P (phone page: T042, T043, T044)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-page`, branch `contrib/mfelker/thought-attachments-page`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. A "mutant" red means the test passed on its first run; the code was then broken minimally (applied, confirmed with grep or by the failure text), the test failed as quoted, and the file was restored byte for byte (`git diff --quiet` clean). The `63 ignored` are the integrator's todo acceptance tests.

Seam notes: the page token is stored as the SHA-256 hex of the token string (`attachmentForPageToken(hash)`). `/page/start` refusals answer `400` with `{ code, message }`. A `410` answers `{ error: "This link has expired or was already used. Ask your assistant for a new one" }`. No column says whether a declaration came from the attach call or from the page, so `pageRoutes` keeps an in-process set of attachments the page declared and replaces only those (U269); a recycled instance would refuse a second differing pick (see the final report).

Cycle baseline: suite 153 passed at `0b10510`.

## T042, T043: `src/page_routes.ts`, `tests/page_routes_test.ts`

## Cycle U262: /page/start records the picked file and returns a signed link

- test: `tests/page_routes_test.ts::U262 /page/start with a valid token and no declaration records the base name, type and size and returns a signed link through publicUrl` (new)
- red: `error: Error: not implemented` (1 failed; stub, first cycle)
- green: `/page/start` looks up the token by hash, records the declaration, signs the upload and rewrites it through `publicUrl`. Suite 154 passed
- refactor: none
- commit: `7f453ac`

## Cycle U263: a pick matching the attach call's declaration confirms it

- test: `U263 /page/start whose pick matches the attach call's declaration confirms it and returns a link` (new)
- first run: `1 passed` (the recording path already returned the same path)
- mutant: storage path written as `attachments/<id>/x-<name>` -> `-  "attachments/a0000001-.../x-receipt.jpg"` / `+  ".../receipt.jpg"` (1 failed); restored, rerun `1 passed`. Suite 155 passed
- commit: `cc831ce`

## Cycle U264: a pick that differs from the attach call's declaration is refused

- test: `U264 /page/start whose pick doesn't match the attach call's declaration is refused, with no link` (new)
- red: `-  200, -  undefined, +  400, +  "wrong_size"` (1 failed)
- green: compare type and size against a declaration that exists (codes `wrong_type`, `wrong_size`); the name is not compared, since the stored path is fixed by the attach call. Suite 156 passed
- commit: `d9781f2`

## Cycle U265: a picked HEIC file is refused

- test: `U265 a picked HEIC file is refused with the share-as-JPEG message, with no link` (new)
- red: `-  200, -  undefined, +  400, +  "heic"` (1 failed)
- green: `checkDeclared` runs before any write or link. Suite 157 passed
- commit: `b9f811e`

## Cycle U266: a picked type outside the four is refused

- test: `U266 a picked type outside the four is refused with attach_file's message, with no link` (new)
- first run: `1 passed` (`checkDeclared` already covers it)
- mutant: `if (refusal && refusal.code === "heic") return ...` -> `-  200, +  400, +  "unsupported_type"` (1 failed); restored. Suite 158 passed
- commit: `2fe754a`

## Cycle U268: a picked size over its cap is refused

- test: `U268 a picked size over its cap is refused, naming the cap and the size` (new)
- first run: `1 passed`
- mutant: `checkDeclared({ ..., size: 1 })` -> `-  200, +  400, +  "too_large"` (1 failed); restored. Suite 159 passed
- commit: `5a94276`

## Cycle U267: a pick of the wrong kind for expected_kind is refused

- test: `U267 a pick whose kind differs from expected_kind is refused, a PDF for a photo and the reverse` (new)
- red: `-  200, -  undefined, ... +  "wrong_type", +  400` (1 failed)
- green: compare "is a PDF" with `expected_kind === "pdf"`, code `wrong_type`. Suite 160 passed
- commit: `33de7d6`

## Cycle U269: a second /page/start replaces the declaration

- test: `U269 a second /page/start replaces the declaration and returns a new link` (new)
- red: `-  400, +  200` (the second pick was refused as a mismatch; 1 failed)
- green: an in-process set of attachments the page declared; a mismatch is checked only against an attach-call declaration. Suite 161 passed
- commit: `69b1330`

## Cycle U270: an unknown token gets 410

- test: `U270 an unknown token gets 410 with the expired message` (new; also a request with no token)
- red: `-  "gone", +  "This link has expired or was already used. Ask your assistant for a new one"` (1 failed)
- green: the message constant, and a missing or non-string token is treated as unknown. Suite 162 passed
- commit: `0d08f8c`

## Cycle U271: a used token gets 410

- test: `U271 a used token gets 410 with the same message` (new)
- first run: `1 passed` (the store returns null once the hash is cleared)
- mutant (first attempt failed type-checking, so it was invalid and redone): `// @ts-nocheck` plus removing `|| found.data === null` -> `TypeError: Cannot read properties of null (reading 'id')` (1 failed); restored. Suite 163 passed
- commit: `02dd621`

## Cycle U272: a token past upload_deadline gets 410

- test: `U272 a token one second after upload_deadline gets 410` (new)
- red: `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed)
- green: `now >= upload_deadline` is expired. Suite 164 passed
- commit: `5ed26f1`

## Cycle U273: a token one second before the deadline is accepted

- test: `U273 a token one second before upload_deadline is accepted` (new)
- first run: `1 passed`
- mutant: deadline check `>= deadline - 2000` -> `-  410, -  0, +  200, +  1` (1 failed); restored. Suite 165 passed
- commit: `e0fb064`

## Cycle U274: no brain key needed or accepted

- test: `U274 the page routes need no brain key, and a brain key without a valid token gets 410` (new)
- first run: `1 passed`
- mutant: the handler answers `{ upload: {} }` when `x-brain-key` equals the brain key -> `+  410, +  410, -  200, -  200` (1 failed); restored. Suite 166 passed
- commit: `eb8908c`

## Cycle U275: CORS only for the UPLOAD_PAGE_URL origin

- test: `U275 CORS allows the origin of UPLOAD_PAGE_URL and gives no allow-origin to any other origin` (new; POST and preflight)
- red: `+  "https://pages.example.test", +  "https://pages.example.test", -  null, -  null` (1 failed)
- green: a middleware on `/page/*` that allows the page origin or the request's own origin, and answers preflight `204`. Suite 167 passed
- commit: `f3d11f9`

## Cycle U276: CORS allows the same origin when the function serves the page

- test: `U276 CORS allows the same origin when the page is served by the function` (new)
- first run: `1 passed` (the default `UPLOAD_PAGE_URL` is under `PUBLIC_BASE_URL`, and the middleware allows the request's own origin)
- mutant: removed `|| origin === new URL(c.req.url).origin` -> `+  "https://other-host.example.test", -  null` (1 failed); restored. Suite 168 passed
- commit: `842bde6`

## Cycle U337: /page/info

- test: `U337 /page/info returns the expected kind, the four accepted types and the caps, and changes nothing` (new)
- red: `SyntaxError: Unexpected non-whitespace character after JSON at position 4` (the route answered `404 Not Found`; 1 failed)
- green: `/page/info`, with the token lookup refactored into `attachmentFor(body)` (null for unknown, used, expired or missing). Suite 169 passed
- refactor: `attachmentFor` shared by all three routes
- commit: `f9b4ff5`

## Cycle U338: /page/info with no expected kind

- test: `U338 /page/info for an attachment started with no expected kind returns no expected kind` (new)
- first run: `1 passed`
- mutant: `expected_kind: row.expected_kind ?? "photo"` -> `-  "photo"` / `+  null` (1 failed); restored. Suite 170 passed
- commit: `b9a40b2`

## Cycle U339: /page/info with a bad token

- test: `U339 /page/info with an unknown, used or expired token gets 410 with the expired message` (new)
- first run: `1 passed`
- mutant: deleted the deadline line in `attachmentFor` -> `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed); restored. Suite 171 passed
- commit: `c1cf333`

## Cycle U352: /page/info shape and caps

- test: `U352 /page/info returns exactly expected_kind, accepted_types and caps, with image_bytes at MAX_IMAGE_MB times 1048576` (new)
- first run: `1 passed`
- mutant: `mb * 1000 * 1000` -> `-  image_bytes: 10000000, -  pdf_bytes: 7500000, +  image_bytes: 10485760, +  pdf_bytes: 7864320` (1 failed); restored. Suite 172 passed
- commit: `1df5a8a`

## Cycle U277: /page/finish finishes its own attachment

- test: `U277 /page/finish finishes only its own attachment, returns the outcome as JSON and uses the token up` (new)
- red: `-  404` / `+  200` (1 failed)
- green: `services.finish(row.id, {})`, then `consumePageToken`. Suite 173 passed
- commit: `63ae7b2`

## Cycle U278: a second /page/finish gets 410

- test: `U278 a second /page/finish with the same token, after processed, gets 410` (new)
- first run: `1 passed`
- mutant: removed the `consumePageToken` line -> `-  200, -  undefined, +  410, +  "This link has expired ..."` (1 failed); restored. Suite 174 passed
- commit: `2135898`

## Cycle U279: a token never finishes another attachment

- test: `U279 a token for attachment X never finishes attachment Y` (new; the body also carries Y's ids)
- first run: `1 passed`
- mutant: `services.finish(body.id ?? row.id, {})` -> `-  "a0000002-..."` / `+  "a0000001-..."` (1 failed); restored. Suite 175 passed
- commit: `6eb038e`

## Cycle U280: busy leaves the token valid

- test: `U280 a /page/finish refused as busy returns the busy outcome and leaves the token valid` (new)
- red: `-  null` / `+  "8d3875317d1b79cc..."` (the token was used up; 1 failed)
- green: consume only when `outcome.busy === undefined`. Suite 176 passed
- commit: `9e67335`

## Cycle U340: no file uploaded yet leaves the token valid

- test: `U340 a /page/finish with no file uploaded yet returns it and leaves the token valid` (new)
- red: `-  null` / `+  "8d3875317d1b79cc..."` (1 failed)
- green: an outcome with `state: "pending_upload"` also leaves the token valid. Suite 177 passed
- commit: `e016546`

## Cycle U341: a refused outcome uses the token up

- test: `U341 a /page/finish whose outcome is refused uses the token up` (new)
- first run: `1 passed`
- mutant: also keep the token valid when the state is `refused` -> `-  200, +  410` (1 failed); restored. Suite 178 passed
- commit: `d032f55`

## T044: `upload-page.html`, `tests/page_script_test.ts`, `tests/helpers/page_dom.ts`

The stand-in (`page_dom.ts`) makes an element for every `id` in the HTML (attributes and static text included), runs the first inline `<script>` with `document`, `location`, `fetch`, `setTimeout` and `clearTimeout` supplied, and has a virtual clock (`advance(ms)`) for the retry timer. Progress is shown as "Uploading …" text plus a `<progress>` element, since `fetch` has no upload progress.

## Cycle U281: the token comes only from the #t= fragment

- test: `tests/page_script_test.ts::U281 the page reads its token only from the #t= fragment; a token in the query string is ignored` (new)
- red: `+  [ { token: "fragment-token" } ]` / `-  []` (1 failed; the scaffold HTML had an empty script)
- green: `readToken()` from `location.hash`, `/page/info` call, the expired text when there is no token, and `apiBase()`. Suite 179 passed
- commit: `ef75438`

## Cycle U282: a filled-in API address is the only address called

- test: `U282 with its API-address line filled in, every request goes to that address, never to one taken from the link` (new; the link carries hostile `api=` and `base=` values)
- first run: `1 passed`
- mutant: `if (false && API_ADDRESS) return ...` -> `TypeError: FakeFetch: no route for POST https://brain.example.test/functions/v1/thought-attachments/page/info` (reported as 2 failed: the test and its unhandled rejection); restored. Suite 180 passed
- commit: `d60d3c4`

## Cycle U283: a blank line uses the served-from address

- test: `U283 with its API-address line blank, every request goes to the address the page was served from` (new)
- red: `+  "https://brain.example.test/functions/v1/thought-attachments/page/start"` missing (no request was made on a pick; 1 failed)
- green: a `change` handler on the file input that posts `/page/start`. Suite 181 passed
- commit: `d4bc933`

## Cycle U284: the file input accepts the four types and one file

- test: `U284 the file input accepts exactly the four types and one file` (new)
- first run: `1 passed`
- mutant: `accept="image/jpeg,image/png,application/pdf"` -> `-  "image/jpeg,image/png,application/pdf"` / `+  "image/jpeg,image/png,image/webp,application/pdf"` (1 failed); restored. Suite 182 passed
- commit: `0801f87`

## Cycle U285: the page shows the accepted types

- test: `U285 the page shows the accepted types` (new)
- red: first attempt `Expected actual: "" to contain: "JPEG"` came from a gap in the stand-in (it did not read static text), and I committed before checking the full suite, so the first commit was red. Amended to `d9a40d0` after the stand-in read static text. Red re-proved against the page with the text removed: `Expected actual: "" to contain: "JPEG".` (1 failed)
- green: static text in `#types`. Suite 183 passed
- commit: `d9a40d0` (amended)

## Cycle U286: a refusal from /page/start is shown

- test: `U286 a refusal from /page/start is shown, and no PUT happens` (new)
- red: `Expected actual: "" to contain: "The file is 20000000 bytes, over the cap of 10485760 bytes."` (1 failed)
- green: a `400` shows "Refused: <message>". Suite 184 passed
- commit: `8643986`

## Cycle U287: upload progress during the PUT

- test: `U287 upload progress is shown during the PUT` (new; the PUT reply is held)
- red: `-  0` / `+  1` held requests (no PUT was made; 1 failed)
- green: `upload()` shows "Uploading <name>…" and un-hides `#progress`. Suite 185 passed
- commit: `9eb2802`

## Cycle U288: PUT the file, then call /page/finish

- test: `U288 the page PUTs the one file to the returned link, then calls /page/finish` (new)
- red: `+  "POST /page/finish"` missing (1 failed)
- green: `finish()` after the PUT. Suite 186 passed
- commit: `3c8e4af`

## Cycle U289: each outcome shows its text

- test: `U289 each outcome shows its text from the contract` (new; six outcomes, a 400-character caption)
- red: `-  Uploading receipt.jpg…` / `+  Captioned: xxxx…` (1 failed)
- green: `outcomeText()`. Suite 187 passed
- commit: `29dd688`

## Cycle U290: a 410 shows the expired message

- test: `U290 a 410 shows the expired message, from info, start and finish` (new)
- red: `TypeError: Cannot read properties of undefined (reading 'url')` (the `410` body was read as an upload target; reported as 2 failed with its unhandled rejection)
- green: refactor into `call(path, body)`, which shows the expired message and resolves null on `410`. Suite 188 passed
- refactor: `call`, `show` and the chain moved into one place
- commit: `55f3412`

## Cycle U291: no key, token or address beyond the API-address line

- test: `U291 the file contains no key, no token and no project address other than its API-address setting` (new)
- first run: `1 passed`
- mutant: added `var HOST = "https://project.example.test";` -> `-  [ "https://" ]` / `+  null` (1 failed); restored. Suite 189 passed
- commit: `597901f`

## Cycle U292: no external script or style

- test: `U292 the file loads no external script or style` (new)
- first run: `1 passed`
- mutant: added `<link rel="stylesheet" href="x.css">` -> `-  [ "<link" ]` / `+  null` (1 failed); restored. Suite 190 passed
- commit: `fba7ddb`

## Cycle U342: the page shows the expected kind and the size limit

- test: `U342 before any pick, the page sends { token } to /page/info and shows the expected kind and the size limit` (new)
- red: `Expected actual: "" to contain: "photo".` (1 failed)
- green: `showInfo()`. Suite 191 passed
- commit: `c560fe1`

## Cycle U343: Waiting… and a retry every 10 seconds

- test: `U343 when /page/finish answers busy or no file yet, the page shows Waiting… and calls it again 10 seconds later` (new; both answers, injected timer)
- red: `-  "Failed: undefined"` / `+  "Waiting…"` (1 failed)
- green: a busy or `pending_upload` answer shows "Waiting…" and `setTimeout(finish, 10000)`. Suite 192 passed
- commit: `e403355`

## Cycle U344: no retry before 10 seconds

- test: `U344 9 seconds after a busy answer, the page has not called /page/finish again` (new)
- first run: `1 passed`
- mutant: `setTimeout(finish, 5000)` -> a second finish call at 9 s (1 failed); restored. Suite 193 passed
- commit: `f0bca41`

## Cycle U345: a 410 on a retry shows the expired message and stops

- test: `U345 when a retried /page/finish gets 410, the page shows the expired message and stops retrying` (new)
- first run: `1 passed`
- mutant: `if (!r) { retry = setTimeout(finish, 10000); return; }` -> `-  1` / `+  0` pending timers (1 failed); restored. Suite 194 passed
- commit: `9a35b33`

## Cycle U346: the repository page has its API-address line blank

- test: `U346 the repository's upload-page.html has its API-address line blank` (new)
- first run: `1 passed`
- mutant: `var API_ADDRESS = "x";` -> `-  false` / `+  true` (1 failed); restored. Suite 195 passed
- commit: `e197f10`

## Cycle P1 (extra, not in the test list): a failed upload or unreachable server shows Failed

- test: `P1 a failed upload or an unreachable server shows Failed, and /page/finish is not called` (new)
- red: `Expected actual: "Captioned: A receipt on a desk" to contain: "Failed: ".` (1 failed)
- green: a non-ok PUT shows "Failed: the upload was not accepted (<status>)." and does not finish; a network error shows "Failed: could not reach the server." Suite 196 passed
- commit: `9076b02`

## Refactor: inline phone-width style

- no behavior change; suite 196 passed. commit: `8998082`

<!-- end -->
