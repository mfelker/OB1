# Cycle log stream: R (audit remediation T086–T099)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`, branch `contrib/mfelker/thought-attachments`, folder `F` = `integrations/thought-attachments`. Source: `tdd/verification.md` (FAIL at `ff4bfc1`).

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Each entry applies the audit's mutant (or one the weak assertion lets through), shows the current test passing ("before"), strengthens or adds the test, shows it failing with the mutant still applied ("red"), restores the code byte for byte (`git diff -- src schema.sql` empty), and shows it passing ("green").

Cycle baseline: suite 378 passed, 0 failed at `ff4bfc1`.

## T086: Finding 1, U368 (new)

- finding: a busy `/page/finish` was only tested while the row was `pending_upload`, so the `state` clause hid the busy clause.
- mutant M04: `src/page_routes.ts:103` `outcome.busy === undefined && outcome.state !== "pending_upload"` to `outcome.state !== "pending_upload"`.
- before: U280 and A62 pass under M04 (`2 passed`).
- test: `tests/page_routes_test.ts::U368 a /page/finish busy behind a live finish claim on a not_captioned or failed attachment leaves the token valid` (real `createFinisher`, row seeded `not_captioned` then `failed` with a live `finish` claim).
- red: `AssertionError: Values are not equal: token kept for not_captioned` / `-     null,` (1 failed)
- green: code restored; `1 passed`. Suite 379 passed, 0 failed.
- commit: `338899a`

## T087: Finding 2, A7, A21, A27, A33, A36, A63 (strengthened)

- finding: links were checked only as `typeof === "string"`.
- test: new helpers `downloadLinkFor(w, id)` and `uploadLinkFor(w, id)` in `tests/acceptance_test.ts` find the fake store's signing of the row's own `storage_path` (throwing when there is none) and rewrite `SUPABASE_URL` to `PUBLIC_BASE_URL`. A7, A21, A27, A33 and A36 compare `download_link` with it; A63 compares the upload URL and its `token` query parameter with the signed upload.
- mutant M21: `src/links.ts:8` `return url;` before the rewrite. Before: the six tests pass (`6 passed`). Red: `6 failed`, e.g. A36 `-     link: "http://supabase.internal:8000/storage/v1/object/sign/ob1-files/attachments/…/broken.pdf?token=download-3",`.
- mutant (wrong-path upload signing): `src/tools.ts:123` `signUpload(storagePath + ".x")`. Before: A63 passes (`1 passed`). Red: `error: Error: no upload link was signed for attachments/8317ab3f-…/a.jpg` (1 failed).
- also checked: a wrong-path download signing (`src/tools.ts:304` path `+ ".x"`) already failed the old tests, because the fake store refuses to sign a missing object; the new tests fail too (`5 failed`).
- green: code restored (`git diff -- src schema.sql` empty); `6 passed`. Suite 379 passed, 0 failed.
- commit: `2567d29`

## T088: Finding 3, A21, A25, A34, A36 (strengthened)

- finding: "with the reason" was checked as any non-empty string.
- test: A21 matches `/vision is not configured/` on the row's `state_reason` and the result's `reason`; A25 matches `/vision endpoint answered HTTP 503/` on `last_rebuild_error`; A34 matches `/embedding endpoint answered HTTP 500/` on `state_reason` and `reason`; A36 matches `/The PDF could not be read: it is damaged or not a PDF/` on `reason`.
- mutants (reason swaps in `src/finish.ts`, applied together; each test reaches only its own): `:162` `pdf.error`, `:182` `embedded.error`, `:238` the not-configured text and `:240` `caption.error`, each replaced by `"something went wrong"`.
- before: the four tests pass (`4 passed`).
- red: `4 failed`, one decisive line each: `Expected actual: "something went wrong" to match: "/vision is not configured/"`, `… "/vision endpoint answered HTTP 503/"`, `… "/embedding endpoint answered HTTP 500/"`, `… "/The PDF could not be read: it is damaged or not a PDF/"`.
- green: code restored (`git diff -- src schema.sql` empty); `4 passed`. Suite 379 passed, 0 failed.
- commit: `2a549b7`

## T089: Finding 4, U135 (strengthened)

- finding: `importer_version` was checked as any non-empty string.
- test: U135 asserts `importer_version` equals `version` read from `F/metadata.json` (`PACKAGE_VERSION`).
- mutant: `src/derived.ts:6` `IMPORTER_VERSION = "0.1.1"`.
- before: U135 passes (`1 passed`).
- red: `-   0.1.1` / `+   0.1.0` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `fbd76c8`

## T090: Finding 5, U243 (strengthened)

- finding: `assertEquals(ok.data.attachment_id ?? row.id, row.id)` compared a value with itself for `finish_attachment` and `remove_attachment`.
- test: the short-id row gets a distinct file name (`short-target.pdf`). Per tool, U243 asserts the row acted on: `finish_attachment` by the last `services.finish` id, `get_attachment` by `attachment_id` and `file_name`, `remove_attachment` by the preview's `file` and the `removalPreview` argument. No `??` remains.
- mutant: `src/tools.ts` `remove_attachment` resolves any other 8-character id to `a1b2c3d4-…-000000000001` (the short id resolved to the wrong row; the test's `ffffffff` and `a1b2c3d4` probes are left alone so only the resolution differs).
- before: U243 passes (`1 passed`).
- red: `AssertionError: Values are not equal: remove_attachment` / `-     file: "manual.pdf",` / `+     file: "short-target.pdf",` (1 failed)
- green: code restored (`cmp` clean, `git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `4f57404`

## T091: Finding 6, A11 (strengthened)

- finding: the expected hints were built with a conditional spread, so read-only tools never had `destructiveHint` or `openWorldHint` compared.
- test: A11 maps each tool name to its whole `annotations` object and compares it with the contract's table.
- mutant: `src/tools.ts:225` `find_thought` `annotations: { ...READ_ONLY, destructiveHint: true }`.
- before: A11 passes (`1 passed`).
- red: `AssertionError: Values are not equal.` / `-       destructiveHint: true,` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `ac3960a`

## T092: Finding 7, U249 (strengthened)

- finding: a `try/catch` set `refused = true` on any thrown exception, and the refusal's text was never read.
- probe: SDK 1.24.3 answers with `isError: true` and the text `MCP error -32602: Input validation error: Invalid arguments for tool attach_file: [ … "path": [ "expected_kind" ], "message": "Invalid option: expected one of \"photo\"|\"pdf\"" … ]`; it does not throw.
- test: U249 calls once with no `try/catch` and asserts `isError`, `Input validation error`, `"expected_kind"` and `Invalid option: expected one of`.
- mutant (the refusal for the wrong cause): `src/tools.ts:251` `expected_kind: z.string().optional()`, plus a line in `attachFile` that dereferences `undefined` for any other kind (an unrelated TypeError). Run with `--no-check`, since the loosened schema doesn't type-check (as the audit ran M06, M10, M16).
- before: U249 passes (`1 passed`).
- red: `AssertionError: Expected actual: "Cannot read properties of undefined (reading 'x')" to contain: "Input validation error".` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`; `grep -n catch tests/tools_test.ts` returns nothing. Suite 379 passed, 0 failed.
- commit: `dfab592`

## T093: Finding 8, U50 (strengthened, the notice option)

- finding: U50 returned early, silently, whenever a real `storage` schema existed.
- change: `tests/verify.sql` U50 now raises `NOTICE: U50: SKIPPED: a real storage schema exists, so the no-storage path was not run (it runs on fork-ci's bootstrap)` before returning. The no-storage assertion itself is unchanged. The scratch-schema option was not taken: `schema.sql` keys on the fixed name `storage`, so proving the path on a database that has a real one would mean renaming that schema.
- before: on a fresh bootstrapped database with a `storage` schema and `buckets` table created first (no stub comment, so it reads as real), the `HEAD` `verify.sql` gave `rc=0` with no line about U50.
- after: the same set-up gives `rc=0` and `psql:tests/verify.sql:32: NOTICE:  U50: SKIPPED: …`. There is no red: this is a visibility fix, not a new assertion.
- verify: `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (`remed_t093`, dropped), with no notice (fork-ci's path asserts). `git diff -- src schema.sql` empty. Suite 379 passed, 0 failed.
- commit: `8a787c6`

## T094: Finding 9, U55 (strengthened)

- finding: U55's expected fingerprint was the same expression `schema.sql:187,266` uses.
- test: U55 writes one row with the fixed content `E'  U55   Mixed CASE\ntext\tfor the café fingerprint  '` and asserts its `content_fingerprint` array is exactly `{b05af88c83ebf399bbc3012d5224c51fe75dfcc25e5770b76e9087faab0b470d}`. That digest was computed independently (Python `hashlib` over the normalised text) and equals `fingerprint()` from `src/derived.ts` for the same text. The "é" pins the UTF-8 encoding.
- mutant: `schema.sql:187` `convert_to(…, 'UTF8')` to `convert_to(…, 'LATIN1')`.
- before: the old U55 (ASCII content, the expression as oracle) passes: `verify.sql` run 1 `rc=0` under the mutant.
- red: `psql:tests/verify.sql:384: ERROR:  U55: fingerprints are {79712381df2969e4c55647950421d57e1a9480d852a5425ac226031b80e50eaf}, want the one literal digest` (`rc=3`)
- green: `schema.sql` restored (`cmp` clean, `git diff -- src schema.sql` empty); `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (dropped). Suite 379 passed, 0 failed.
- commit: `d9754b9`

## T099 (finding 19, done ahead of T095): seeded random bytes in `tests/tools_test.ts`

- finding: the harness drew `Deps.randomBytes` from `crypto.getRandomValues`, so ids and page tokens differed on every run.
- change: `seededBytes()`: call k returns n bytes of value k. Ids and tokens are now the same on every run, which T095's literal expectations need.
- mutant: none applies (a determinism fix, not an assertion).
- check: `grep -n getRandomValues tests/tools_test.ts` returns nothing. Suite run twice: 379 passed, 0 failed, both times. `git diff -- src schema.sql` empty.
- commit: `3f300a9`

## T095: Finding 10, U238, U239, U244, U251, U353 (strengthened)

- finding: `curlLine`, `pageLink`, `publicUrl` and `noteMetadata` from `src/` were the tests' oracle.
- test: literal expectations. U238: id `01010101-0101-4101-8101-010101010101` (seeded call 1), the upload URL `https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/<id>/manual.pdf?token=<the fake's token>`, the whole curl line `curl -X PUT -H 'content-type: application/pdf' -H 'x-upsert: false' -T 'manual.pdf' '<url>'`, and the page link `https://brain.example.test/functions/v1/thought-attachments/upload#t=` + `"02".repeat(32)`. U239, U251, U353: `https://brain.example.test/storage/v1/object/…/ob1-files/<storage_path>?token=<the fake's token>`. U244: the note metadata object with `imported_at: "2026-01-01T12:00:00.000Z"`. The imports of the four helpers are gone.
- mutants (applied together first): `src/links.ts` `publicUrl` drops the query (`.split("?")[0]`), `pageLink` adds `/` before `#t=`, `curlLine` `-T` to `--upload-file`; `src/derived.ts` `noteMetadata` `type: "reference"`.
- before: the five tests pass under all four (`5 passed`).
- red: `5 failed`. U239 `-   https://brain.example.test/storage/v1/object/upload/sign/ob1-files/attachments/01010101-…/manual.pdf` / `+   …/manual.pdf?token=upload-1`; U244 `-     type: "reference",`; U251 `Values are not equal: processed` (query dropped); U353 likewise. With only the curl and page mutants, U238 fails on `-   curl -X PUT … --upload-file 'manual.pdf' …`; with only the page mutant, on `-   https://brain.example.test/functions/v1/thought-attachments/upload/#t=0202…`.
- green: code restored (`git diff -- src schema.sql` empty); `5 passed`. `grep -nE 'curlLine\(|pageLink\(|publicUrl\(|noteMetadata\(' tests/tools_test.ts` returns nothing. Suite 379 passed, 0 failed.
- commit: `90df2cd`

## T096: Finding 11, U339 (strengthened), U267 (void line dropped)

- finding: `late.page_token_hash !== null` (U339) and `photo.expected_kind === "photo"` (U267) read the clone `seedAttachment` returned, so they could never fail.
- test: U339 asserts `r.store.attachment(late.id)!.page_token_hash` equals `sha256Hex("late-token")`. U267 drops the clone check; its main assertions are unchanged.
- mutant: `src/page_routes.ts:49` an expired token is consumed (`consumePageToken`) before the 410.
- before: U339 and U267 pass (`2 passed`).
- red: U339 `-   null` / `+   "a37d12117f072c57ebd30d5036334817604d4661025e83e78e9e8a27774e1282"` (1 failed; U267 passes, as it should).
- green: code restored (`git diff -- src schema.sql` empty); `2 passed`. Suite 379 passed, 0 failed.
- commit: `553268e`

## T097 (finding 12): U210 (strengthened)

- finding: with `wrongLength` disabled, U210 and A39 still passed, because the fake store (like pgvector) rejects the vector naming both lengths; `assertStringIncludes(reason, "8")` matched any 8.
- test: U210 asserts the exact message `The embedding model returned vectors of length 8, but this brain's vectors have length 1536.` and that `writeDerived` was never called.
- mutant M11: `src/finish.ts:153` `vectors.find((v) => v.length !== dimension.data && false)`.
- before: U210 and A39 pass (`2 passed`).
- red: `-   expected 1536 dimensions, not 8` / `+   The embedding model returned vectors of length 8, but this brain's vectors have length 1536.` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 379 passed, 0 failed.
- commit: `601b2aa`

## T097 (finding 13): U369, U370, U371 (new)

- finding: the page token (`src/page_routes.ts:49`), the orphan check (`schema.sql:386`) and the expired wording (`src/finish.ts:94`) were pinned at ±1 s, never at the exact instant.
- decision on agreement: no production change. The deadline is the first instant the window is closed, for a token presented, the orphan check, the expired wording and `findPending` (`.gt`). An object Storage recorded at exactly the deadline stays on time (U200), because R8 refuses only an object "created after the deadline": it was already in flight. The page and `src/finish.ts:108` judge different events (a request now versus a stored object's time), so they don't need to agree.
- tests: `tests/page_routes_test.ts::U369 a token at exactly upload_deadline gets 410`; `tests/verify.sql` U370 block (orphans lists a `pending_upload` row at exactly its deadline, `interval '0'` against the transaction's `now()`); `tests/finish_test.ts::U371 with no object at exactly the deadline, the outcome is 'upload window expired' and the state is unchanged`.
- mutants (applied together): M03 `src/page_routes.ts:49` `>=` to `>`; M15 `src/finish.ts:94` `>=` to `>`; S6 `schema.sql:386` `<=` to `<`.
- before: U272, U273, U203 and U200 pass (`4 passed`); `verify.sql` run 1 `rc=0`.
- red: U369 `-     200,` / `+     410,` (failed); U371 `-     "no file uploaded yet",` / `+     "upload window expired",` (failed); together `2 failed`. `verify.sql` `psql:tests/verify.sql:861: ERROR:  U370: <NULL>` (`rc=3`).
- green: code restored (`git diff -- src schema.sql` empty); U369, U371, U200 `3 passed`; `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (dropped). Suite 381 passed, 0 failed.
- commit: `c515b7b`

## T098 (finding 15): U303, U304 (strengthened)

- finding: `assertEquals(offenders, [])` also passed if `sourceFiles()` returned nothing or the specifier regexes stopped matching.
- test: the scan's text part is split out (`specifiersIn`, `isPdfLib`, `isBare`; the regexes are unchanged). U304 asserts `sourceFiles()` includes `index.ts`, `src/app.ts`, `src/pdf.ts` and `src/store.ts`, and that a planted `npm:pdf-lib@1.17.1` import is flagged. U303 asserts the known files, `npm:@supabase/supabase-js@2.47.10` in `src/store.ts`, `./src/app.ts` in `index.ts`, and that planted bare `zod` (import), `hono` (re-export) and `unpdf` (dynamic import) are flagged.
- mutant (in the test helper): `sourceFiles()` returns `[]` at once.
- before: U303 and U304 pass (`2 passed`).
- red: both fail: `AssertionError: Expected actual: "[]" to include: "[` / `"index.ts",` (indented) … (`2 failed`)
- green: the helper restored (its text identical to `HEAD`'s; `git diff -- src schema.sql` empty); `2 passed`. Suite 381 passed, 0 failed.
- commit: `516a815`

## T098 (finding 16): U182, U206, U214 (strengthened)

- finding: `derived.length >= 1` paired with `derived_count === derived.length`, both from the same array, so a wrong passage split passed. The same pattern sat in U206 and U214.
- test: U182 asserts exactly 1 derived thought and `derived_count` 1 (both short pages fit one passage at the default `PASSAGE_MAX_CHARS` of 1500); U206 and U214 assert `derived_count` 1. U184's `>= 1` is left: it only guards its per-row loop from running over nothing.
- mutant: `src/passages.ts` `if (body && page === last && fits(…))`, a new passage on every page.
- before: U182 passes (`1 passed`).
- red: U182 `-   2` / `+   1` (failed), and U206 fails too (`2 failed`; U214 has one page, so this mutant doesn't reach it).
- green: code restored (`git diff -- src schema.sql` empty); `3 passed`. Suite 381 passed, 0 failed.
- commit: `fe53e52`

## T098 (finding 17): U47 (strengthened)

- finding: on a persistent database U47 passed on every run after the first, even if `schema.sql` stopped adding the column and index.
- test: inside `begin; … rollback;`, U47 creates schema `u47_scratch` with a `thoughts` table as fork-ci's bootstrap creates it (no fingerprint column, no index), records that pre-run state in a temp table, sets `search_path = u47_scratch, public`, runs `\i schema.sql`, asserts the recorded state lacked both and that both now exist in `u47_scratch`. The rollback removes everything, so no DROP is needed and each run starts the same.
- mutant: `schema.sql:107-110` (the `alter table … add column if not exists content_fingerprint` and `create unique index if not exists idx_thoughts_fingerprint`) commented out.
- before: a database that ran `verify.sql` once with the real schema, then the old `verify.sql` again under the mutant: `rc=0`.
- red: on that same database, the new `verify.sql`: `psql:tests/verify.sql:267: ERROR:  U47: thoughts.content_fingerprint was not added` (`rc=3`).
- green: `schema.sql` restored (`git diff -- src schema.sql` empty); two more runs on the persistent database `rc=0`; on a fresh bootstrapped database run 1 `rc=0`, run 2 `rc=0` (both dropped). Suite 381 passed, 0 failed.
- commit: `cbbf44c`

## T099 (finding 18): `settle()`, H6, H7 (condition waits)

- finding: `settle()` was five fixed `setTimeout(0)` yields, so the page tests' negative checks depended on scheduling; H6 and H7 slept 5 ms.
- change: `tests/helpers/page_dom.ts` counts each page's fetches (started, answered or failed) and the body reads it makes, and gives a `signature()` of what the page shows and schedules. `settle()` now waits until every page made in the module has no body read open and an unchanged signature across a whole turn of the event loop, and throws after 1000 turns instead of returning. A fetch the network holds stays open without making the page busy. H6 and H7 use a bounded `until(cond)` on `fake.inFlight === 1` and `fake.heldCount === 2`.
- mutant search (none survives the old helper): a page-script mutant in `upload-page.html` that, after a failed PUT, delays `/page/finish` behind 8 and then 40 chained `res.clone().text()` reads, and then behind 40 chained `/page/info` calls. U363 failed under both the old and the new `settle()` each time, because all fake I/O resolves within five turns. So this change removes the dependence on a fixed count; it has no red to show. `upload-page.html` restored (`cmp` clean).
- check: `grep -n 'setTimeout(r, 5)' tests/helpers/helpers_test.ts` returns nothing. `page_script_test.ts` 18 passed (three runs); H6, H7 `2 passed`. Suite run twice: 381 passed, 0 failed.
- commit: `cf8556c`

## T099 (finding 20): U88, U298, U83, U52 split (U372–U376 new)

- finding: eager tests. U88 covered three store methods, indexing `ff.requests[0]`, `[1]` and `[3]` by position; U298, named for the preflight, also pinned reply CORS; U83 and U52 mixed repository checks with the scanners' self-checks.
- change: U88 keeps `insertNote`; U372 `attachmentForPageToken` (the row, or null) and U373 `consumePageToken` (a boolean) each have their own set-up and compare the whole list of request bodies, not indexed positions. U298 keeps the preflight (status, body, headers, no store call); U374 asserts the MCP reply's and a refused request's CORS. U83 and U52 keep the repository checks (U83 with its positive control); U375 is the drift checker's self-check and U376 the guard-rail scan's. Every assertion is kept.
- mutant: none (a structure fix, not a strength fix).
- check: the nine tests `9 passed`. Suite 386 passed, 0 failed.
- commit: `88a06ce`

## T099 (finding 21): U212, U213, U215, U216, U83 (magic values named)

- finding: 409, 410 and 411 stood for `busySeconds` −1, itself and +1; `calls.length >= 13` was an unexplained floor.
- change: the claims use `r.settings.busySeconds` and the clock moves by `r.settings.busySeconds - 1` or `+ 1`, as U214 already did. U213 keeps its pin of the default (`assertEquals(r.settings.busySeconds, 410); // the default BUSY_SECONDS`). U83's floor becomes an exact comparison with `STORE_RPCS`, the named list of the thirteen RPC call sites in `src/store.ts`, so a lost or extra call site now fails it too.
- mutant: none (naming).
- check: `grep -n "409\|411\|, 410)" tests/finish_test.ts` finds only the commented default pin. The six tests `6 passed`. Suite 386 passed, 0 failed.
- commit: `8938ceb`

## T099 (finding 22): vision tests, tools short ids, U301 (test utilities used)

- finding: (a) `tests/vision_test.ts` used hand-rolled JPEG bytes and captioned them as `image/png` in U173; (b) `tests/tools_test.ts` derived short ids by hand at six places; (c) U301 used a hand-rolled fetch recorder.
- change: (a) `JPEG = jpegBytes()` for every caption call, and U173 captions `PNG = await pngBytes()` as `image/png`, as its name says. (b) `shortId` from `tests/helpers/fake_store.ts` everywhere; U238's short id is the literal `01010101` (seeded bytes). (c) U301 installs a `FakeFetch` with the one route `POST <SUPABASE_URL>/rest/v1/rpc/attachment_embedding_dimension`, asserts the reply `{ data: 1536 }`, no unmatched request, and the exact URL, `apikey` and `authorization` of the one request.
- mutant for (c): `src/store.ts:61` `rpc("attachment_vector_length", {})`, the wrong RPC path on the right origin.
- before: the old U301 (origin and keys only, any URL answered) passes (`1 passed`).
- red: the new U301 `AssertionError: Values are not equal.` (1 failed). (a) and (b) are utility swaps with no mutant.
- green: code restored (`git diff -- src schema.sql` empty). Suite 386 passed, 0 failed.
- commit: `74f6221`

## T099 (finding 23): U353, U291 and U346, U351 (redundant halves removed)

- finding: U353 repeated U331's set-up and its failed-state assertions; U291 and U346 both checked the blank API-address line; U351's set-key half repeated U295 and U296.
- change: U353 keeps only the download-link half (renamed `U353 a cut-off finish (read as failed, U331) still gets a download link for its stored file`). The blank-line check now lives only in U346, in U291's stricter form (`assertEquals(lines, ['var API_ADDRESS = "";'])`, stronger than U346's old regex), and U291 keeps its no-key, no-address and no-token checks. U351 keeps the unset-key half (renamed `U351 with MCP_ACCESS_KEY unset, productionDeps is not ok and every call, even with no key, gets the named settings error`), with a comment pointing to U295 and U296. For the integrator: the test-list rows for U353 and U351 name the old test titles.
- mutant: none (duplicates removed; each removed check is still made by the named test).
- check: the seven tests `7 passed`. Suite 386 passed, 0 failed.
- commit: `19144da`

## T099 (finding 24): U235, U238, U250 and the page-route tests (labelled assertions)

- finding: ten or more unlabelled `assertEquals` per test (U235, U238, U250), and tuples mixing status, code and store facts in `tests/page_routes_test.ts`, so a failure didn't say which fact broke.
- change: U235, U238 and U250 each compare one object whose keys name every fact (U238 keeps all of T095's literals, and compares the whole `upload` object). In `tests/page_routes_test.ts`, 31 tuple assertions became objects with named keys (for example `{ status, code }`, `{ signedUploads, declaredType }`, `{ firstStatus, secondStatus, secondError }`); U275's five CORS values are keyed `ok`, `other`, `none`, `preflight`, `badPreflight`. U368's tuples already carry a message and were left. Every value is still compared.
- mutant: none (a diagnosability fix).
- check: the 32 affected tests `32 passed`. Suite 386 passed, 0 failed.
- commit: `c52f349`

## T099 (finding 25): U377 (new)

- finding: U336's "file already missing" half passes only because `FakeStore.deleteObject` succeeds on an absent path, and no store test pinned what `storage.remove([path])` does for a missing object.
- test: `tests/store_test.ts::U377 deleteObject on a missing object succeeds: Storage answers 200 with an empty list`. Storage's remove answers with the objects it deleted, so a missing one is just absent from the list; `deleteObject` must give `{ data: null }`, sending `{ prefixes: [path] }`.
- mutant: `src/store.ts` `deleteObject` returns `{ error: "Object not found" }` when the deleted list is empty.
- before: U82 passes (`1 passed`).
- red: `-     error: "Object not found",` / `+     data: null,` (1 failed)
- green: code restored (`git diff -- src schema.sql` empty); `1 passed`. Suite 387 passed, 0 failed.
- not covered: the busy and claim boundaries decided in `tests/helpers/fake_store.ts:525` (U212, U214, U260, U354) still rest on the fake. On the SQL side, `verify.sql`'s claim blocks (U62, U54) pin them; no TypeScript test runs the real store against Postgres.
- commit: `f9bb8cd`

## Close

- final: suite 387 passed, 0 failed (`deno test --node-modules-dir=none --no-prompt --allow-env --allow-read tests/`); `verify.sql` run 1 `rc=0`, run 2 `rc=0` on a fresh bootstrapped database (`remed_final`, dropped).
- T099 done-greps: `grep -n 'setTimeout(r, 5)' tests/helpers/helpers_test.ts` and `grep -n getRandomValues tests/tools_test.ts` return nothing. T095's `grep -nE 'curlLine\(|pageLink\(|publicUrl\(|noteMetadata\(' tests/tools_test.ts` returns nothing.
- production code: unchanged. No strengthened test exposed a real bug.
- new ids: U368 (T086); U369, U370, U371 (T097); U372–U376 (T099 finding 20 splits); U377 (T099 finding 25). Renamed titles: U353, U351 (finding 23). The integrator still needs to put them in `tdd/test-list.md`.
- `git status --short` in the worktree: clean.
