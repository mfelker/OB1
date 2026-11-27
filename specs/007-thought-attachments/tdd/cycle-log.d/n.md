# Cycle log stream: N (finishing: T025, T026, T039, T040, T056, T057, T058)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-finish`, branch `contrib/mfelker/thought-attachments-finish`, folder `F` = `integrations/thought-attachments`. Files: `src/finish.ts`, `tests/finish_test.ts`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red reported `1 failed`, every green `1 passed`. Baseline suite at `0b10510`: 153 passed, 63 ignored. Final suite: 194 passed, 0 failed, 63 ignored.

A "mutant" entry means the test passed on its first run. The code was broken minimally, the test failed as quoted, and the file was restored byte for byte (`cmp` clean). Mutants whose edit would not type-check were run with `--no-check`.

Notes that apply to several cycles:

- Test PDFs need at least 20 non-space characters per page, or `SCANNED_MIN_CHARS_PER_PAGE` (20) makes them `scanned`. Cycle U205 made that visible, and the fixture text of the earlier tests was lengthened then (`alpha beta gamma delta epsilon zeta`). No assertion was weakened.
- A newly configured model or threshold is tested with `reconfigured(r, overrides)`, a second finisher over the same store and fake fetch. The vision client reports `settings.visionModel`, not the reply's model field.
- Commit `ef9112a` (U184) was first committed by mistake while red (my commit helper did not gate on the suite), and was amended to green before any further work. No other commit was ever red.
- The finisher returns early, before claiming, for a `refused` attachment (U201). A plain finish on `processed` claims and releases, but writes nothing.

## T025 and T026: PDF path and repeats

## Cycle U182: a pending PDF finishes processed with its passage count and page_count

- test: `tests/finish_test.ts::U182 a pending PDF with a matching upload ends processed, ...` (new)
- red: `--filter "/^U182 /"` -> `error: Error: not implemented` (stub, first cycle only) (1 failed)
- green: `createFinisher` claims, downloads, opens the PDF, builds passages, embeds, writes. Suite 154 passed
- refactor: none
- commit: `260967d`

## Cycle U183: finishing records actual type, size, page count, content hash and processed_at

- red: `AssertionError: Values are not equal.` (`actual_type` null vs `"application/pdf"`) (1 failed)
- green: the patch sets `actual_type` (`sniffType`), `actual_size`, `content_hash` (`sha256:<hex>`) and `processed_at`. Suite 155 passed
- commit: `c6af0ff`

## Cycle U184: derived rows carry the stored bytes' hash as input_hash

- red: `AssertionError: Values are not equal.` (`input_hash` null vs the hash) (1 failed)
- green: `passageRow` receives the row with `content_hash` set. Suite 156 passed
- commit: `ef9112a` (amended once, see the notes)

## Cycle U185: the claim is released after a finish

- first run PASSED
- mutant: `await store.release(...)` replaced by a comment -> `AssertionError` at the new-claim assert (1 failed). Restored, `1 passed`
- commit: `956ddfa`

## Cycle U186: an owner thought equal to a passage is left untouched

- first run PASSED
- mutant: after building the rows, each row's content cut to its body (`split("\n")[1]`) -> `Error: duplicate key value violates unique constraint "idx_thoughts_fingerprint"` (1 failed). Restored, `1 passed`
- commit: `e743221`

## Cycle U187: a plain finish on processed returns the existing outcome

- red: `AssertionError: Values are not equal.` (a second full run's outcome differed) (1 failed)
- green: `run` returns `outcomeOf(row)` for a `processed` row unless rebuilding. Suite 159 passed
- commit: `d23b44e`

## Cycle U188: duplicate bytes on the same parent end refused

- red: `Error: duplicate key value violates unique constraint "thought_attachments_parent_hash_key"` (the write hit the index) (1 failed)
- green: `findByHash` after hashing; another attachment's hit gives `refuse(...)` with "already attached to this thought as <short id>", object deleted. Suite 160 passed
- commit: `fd16ae8`

## Cycle U322: a refused attachment with the same bytes doesn't refuse the finish

- first run PASSED
- mutant (`--no-check`): `twin.data && twin.data.id !== row.id` replaced by `twin.data !== undefined` -> `TypeError: Cannot read properties of null (reading 'id')` (1 failed). A first, type-checked mutant failed only on type checking and was discarded. Restored, `1 passed`
- commit: `65535c2`

## Cycle U323: the same bytes on another parent don't refuse the finish

- first run PASSED
- mutant (`--no-check`): same `twin.data !== undefined` mutant -> `TypeError ... (reading 'id')` (1 failed). The per-parent scoping lives in the store (`findByHash(parentId, ...)`), which the fake and stream Q's SQL both implement, so the finisher has no line of its own to break for it. Restored, `1 passed`
- commit: `5c6e15e`

## Cycle U324: a failed attachment with the same bytes still counts as a duplicate

- first run PASSED
- mutant: condition `twin.data && twin.data.state !== "failed" && twin.data.id !== row.id` -> `Error: duplicate key value violates unique constraint "thought_attachments_parent_hash_key"` (1 failed). Restored, `1 passed`
- commit: `766448e`

## T039: photo path

## Cycle U189: a photo finishes with one caption thought and its model

- red: `Error: The PDF could not be read: it is damaged or not a PDF.` (JPEG went down the PDF path) (1 failed)
- green: `run` branches on the sniffed type into `pdfPath` and `photoPath` (vision caption, embed, `captionRow`, `caption_model`). Suite 164 passed
- refactor: the PDF path moved into its own function
- commit: `565ae8d`

## Cycle U191: a long caption is cut to 300 characters in the outcome only

- red: `AssertionError: Values are not equal.` (outcome caption 301 characters) (1 failed)
- green: `caption.data.text.slice(0, 300)` in the outcome. Suite 165 passed
- commit: `51c4e7a`

## Cycle U190: a 300-character caption is returned whole

- first run PASSED
- mutant: `slice(0, 300)` -> `slice(0, 299)` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `ffe7ab4`

## Cycle U192: a photo without vision ends not_captioned with the file kept

- red: `Error: vision endpoint undefined is unreachable: Invalid URL: 'undefined/chat/completions'` (1 failed)
- green: `if (!deps.vision.configured)` -> `notCaptioned(...)`, a `setState` with the reason. Suite 167 passed
- commit: `5a22cbe`

## Cycle U193: a failing vision call ends not_captioned with its reason

- red: `Error: vision endpoint answered HTTP 503: vision is down` (thrown) (1 failed)
- green: a caption error goes to `notCaptioned`. Suite 168 passed
- commit: `bb19495`

## Cycle U194: finishing a not_captioned photo again writes the caption and clears its reason

- red: `AssertionError: Values are not equal.` (`state_reason` still set) (1 failed)
- green: the success patch sets `state_reason: null`. Suite 169 passed
- commit: `c78f5b3`

## T040: rebuilds

## Cycle U195: rebuild replaces a photo's caption with one by the new model

- red: `AssertionError: Values are not equal.` (a plain return, `caption` missing) (1 failed). After the change, a second red was a fixture mistake: the vision client reports `settings.visionModel`, so the test now rebuilds through `reconfigured(r, { VISION_MODEL: "new/model" })`
- green: `rebuild: true` on a `processed` row claims `rebuild` and skips the early return. Suite 170 passed
- commit: `cc47512`

## Cycle U196: rebuild replaces a PDF's passage set

- first run PASSED
- mutant: `writeDerived(row.id, token, rows.slice(0, 1), patch)` -> `AssertionError` at `derived.length > first.derived_count` (1 failed). Restored, `1 passed`
- commit: `bf1222f`

## Cycle U197: a failed photo rebuild keeps the old caption and reports last_rebuild_error

- red: `AssertionError: Values are not equal.` (state not `processed` with an error) (1 failed)
- green: a failure during a rebuild goes to `rebuildFailed`, a `setState` of `last_rebuild_error` only. Suite 172 passed
- commit: `7fc92a0`

## Cycle U326: a successful rebuild clears last_rebuild_error

- red: `AssertionError: Values are not equal.` (row kept the old error) (1 failed)
- green: both success patches set `last_rebuild_error: null`. Suite 173 passed
- commit: `f40796d`

## Cycle U325: a repeat finish or rebuild isn't refused as a duplicate of itself

- first run PASSED
- mutant: `twin.data && twin.data.id !== row.id` -> `twin.data` -> `AssertionError: Values are not equal.` (the failed attachment was refused as its own twin) (1 failed). Restored, `1 passed`
- commit: `d6234bd`

## T056: refusals

## Cycle U198: a failed actual-file check deletes the object and ends refused

- test loops over wrong type, wrong size and too many pages
- red: `AssertionError: Values are not equal: wrong type` (1 failed)
- green: `openPdf` runs first so `page_count` is set before `checkActual`; a refusal calls `refuse` with the actual type, size and page count. Suite 175 passed
- refactor: the PDF is opened once in `run` and passed to `pdfPath`
- extra mutant: `checkActual({ ...row, page_count: null }` -> `AssertionError: Values are not equal: too many pages`. Restored
- commit: `8819881`

## Cycle U199: an object uploaded after the deadline is refused and deleted

- red: `AssertionError: Values are not equal.` (state `processed`) (1 failed)
- green: `createdAt > upload_deadline` refuses, "The file was uploaded after the upload window closed." Suite 176 passed
- commit: `9db1322`

## Cycle U200: an object created exactly at the deadline is accepted

- first run PASSED
- mutant: `>` -> `>=` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `e04c3eb`

## Cycle U201: finishing a refused attachment is refused and changes nothing

- red: `AssertionError: Values are not equal.` (the run went on and failed on the missing object) (1 failed)
- green: an early return before the claim: state `refused`, "this attachment was refused and can't be finished (<reason>)". Suite 178 passed
- commit: `49b7ff1`

## Cycle U202: a finish with no object yet says so and changes nothing

- red: `Error: no object` (1 failed)
- green: a missing object returns `{ state: row.state, reason: "no file uploaded yet" }`. Suite 179 passed
- commit: `70b2302`

## Cycle U203: a finish with no object after the deadline reports the window expired

- red: `Expected actual: "no file uploaded yet" to contain: "upload window expired".` (1 failed)
- green: `now >= upload_deadline` gives "upload window expired" (the store treats `deadline <= now` as expired). Suite 180 passed
- commit: `76ba6e0`

## Cycle U204: the claim is released after a refused or no-file finish

- first run PASSED
- mutant: `if (rebuild) await store.release(...)` -> `AssertionError` at the new-claim assert (1 failed). Restored, `1 passed`
- commit: `2b4af28`

## T057: failures

## Cycle U205: a text-less PDF ends scanned with the file kept

- red: `AssertionError: Values are not equal.` (state `processed` for `scannedPdf`) (1 failed). The first attempt also turned 11 earlier tests red, because their PDFs held under 20 characters a page (see the notes); their fixture text was lengthened
- green: `isScanned(pageTexts, settings)` -> `ends(..., "scanned", "No text layer ... text search won't cover it yet.")`. `ends` generalises `notCaptioned`. Suite 182 passed
- refactor: `notCaptioned` delegates to `ends`
- commit: `2a9f445`

## Cycle U206: a re-finished scanned PDF with text now over the threshold ends processed

- red: `AssertionError: Values are not equal.` (`state_reason` still set) (1 failed)
- green: the PDF success patch sets `state_reason: null`. Suite 183 passed
- commit: `c797bb6`

## Cycle U207: a scanned PDF finished again with unchanged settings stays scanned

- first run PASSED
- mutant: `if (isScanned(...) && !row.state_reason)` -> `AssertionError: Values are not equal.` (1 failed). Restored, `1 passed`
- commit: `b6dca80`

## Cycle U208: a corrupt PDF ends failed with the reason

- red: `Error: The PDF could not be read: it is damaged or not a PDF.` (thrown) (1 failed)
- green: an `openPdf` error goes to `ends(..., "failed", error)`. Suite 185 passed
- commit: `17ce0c9`

## Cycle U209: an embedding failure ends failed with no derived thought

- test covers a PDF whose second batch fails (`EMBEDDING_BATCH_SIZE` 1) and a photo whose only request fails
- red: `Error: embedding endpoint answered HTTP 500: embeddings down` (thrown) (1 failed)
- green: an embedding error goes to `ends(..., "failed", ...)` in both paths. Suite 186 passed
- commit: `33b0804`

## Cycle U210: a vector of the wrong length ends failed naming both lengths

- red: `Error: expected 1536 dimensions, not 8` (the store's refusal, thrown) (1 failed)
- green: `wrongLength` compares each vector with `embeddingDimension()` before writing; the reason names both lengths. Suite 187 passed
- commit: `9c20640`

## Cycle U211: a failed attachment finishes processed once the services work

- first run PASSED
- mutant: the early return `row.state === "processed"` -> `row.state !== "pending_upload"` -> `AssertionError` (`failed` vs `processed`) (1 failed). Restored, `1 passed`
- commit: `973cbd0`

## Cycle U327: a fingerprint conflict ends failed and leaves the existing thought unchanged

- red: `Error: duplicate key value violates unique constraint "idx_thoughts_fingerprint"` (thrown) (1 failed)
- green: a `writeDerived` error goes to `ends(..., "failed", writeReason(error))`; a duplicate-key or fingerprint error reads "An existing thought has the same text as a derived thought, so nothing was written (...)". The real store raises a different text for a stale claim, so no code matches on that text. Suite 189 passed
- commit: `7e14d9c`

## T058: the claim

## Cycle U212: a finish while another operation holds the claim returns busy

- red: `Error: claim failed` (1 failed)
- green: a `{ busy }` claim returns `{ state, reason: "busy (finishing / rebuilding / removing), try again shortly", derived_count, busy }`. Suite 190 passed
- commit: `1dd34e2`

## Cycle U213: a finish is still busy one second before BUSY_SECONDS has passed

- first run PASSED
- mutant: claim seconds `settings.busySeconds - 5` -> the second finish was not busy, `Promise resolution is still pending but the event loop has already resolved.` after the failed assertion (1 failed). Restored, `1 passed`
- commit: `ba8ef14`

## Cycle U215: a cut-off rebuild reads as processed with its old set and "the run did not finish"

- red: `AssertionError: Values are not equal.` (`last_rebuild_error` undefined) (1 failed)
- green: `outcomeOf` reads an expired `rebuild` claim on the row as `last_rebuild_error: "the run did not finish"`. The note is not stored: a later claim overwrites the claim fields (the same as the data-model's reading rule). Suite 192 passed
- commit: `3df6f60`

## Cycle U216: a finish whose claim was taken over has its write refused and the newer result stands

- the first run stalls inside `objectInfo` (a one-call `override`) after taking its claim; the clock moves 411 s; a second finish completes; then the first resumes
- red: `Error: claim token is stale or foreign` (thrown from the `setState` in `ends`) (1 failed)
- green: `finish` catches a thrown error, re-reads the row, and when `busy_token` is no longer its token returns `currentOutcome(fresh)` (busy while another live claim exists, otherwise the row's outcome). No text of the store's error is matched, because the fake and the SQL word it differently. Suite 193 passed
- commit: `d20b491`

## Cycle U214: a finish proceeds once BUSY_SECONDS has passed

- first run PASSED
- mutant (`--no-check`): `if (!("token" in claim.data) || deps.now().getTime() > 0)` -> `AssertionError: Values are not equal.` (always busy) (1 failed). A type-checked version of the mutant failed only on type checking and was discarded. Restored, `1 passed`
- commit: `fef2b18`

## Done

DONE: U182, U183, U184, U185, U186, U187, U188, U189, U190, U191, U192, U193, U194, U195, U196, U197, U198, U199, U200, U201, U202, U203, U204, U205, U206, U207, U208, U209, U210, U211, U212, U213, U214, U215, U216, U322, U323, U324, U325, U326, U327. That is 41 behaviors, which are T025, T026, T039, T040, T056, T057 and T058.

Observations for the integrator:

- Order inside `run`: object info and download, sniff, open the PDF (sets `page_count`), the deadline check, `checkActual`, the hash and duplicate check, then the PDF or photo path.
- A thrown store error that is not a lost claim propagates out of `finish` (after the claim is released). Stream T's tool layer should turn it into a tool error. No behavior in the list covers a store outage.
- `finish` on an unknown id throws "attachment not found"; the tool layer resolves ids first.
