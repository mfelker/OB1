# Cycle log stream: X (files: T020, T021, T022, T023, T035, T036, T053, T054)

Append only. Newest last. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-files`, branch `contrib/mfelker/thought-attachments-files`, folder `F` = `integrations/thought-attachments`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Suite: the same without `--filter`. Every red below reported `1 failed`, and every green `1 passed`. Suite counts are `N passed, 0 failed` (the `63 ignored` are the integrator's todo acceptance tests). A "mutant" red means the test passed on its first run; the code was then broken minimally, the test failed as quoted, and the file was restored byte for byte (`cmp` clean).

Contract gaps found (see the final report): refusal `code` values are not defined by any contract, so intake uses `unsupported_type`, `too_large`, `heic`, `wrong_type`, `wrong_size`, `too_many_pages`. `checkActual` has no page-count input in the seam, so it reads `row.page_count` (null: not yet known, check skipped); the finisher must set it before calling.

Cycle baseline: suite 48 passed at `34dd206`.

## T020, T035, T053: `src/intake.ts`, `tests/intake_test.ts`

## Cycle U113: baseName drops POSIX directory parts

- test: `tests/intake_test.ts::U113 baseName drops POSIX directory parts` (new)
- red: `error: Error: not implemented` (1 failed)
- green: `name.split("/").pop()`. Suite 48 passed
- refactor: none
- commit: `5a206fe`

## Cycle U114: baseName drops Windows directory parts and the drive

- red: `-   C:\\Users\\a\\manual.pdf` / `+   manual.pdf` (AssertionError, 1 failed)
- green: split on `/[\\/]/`. Suite 49 passed
- commit: `515e238`

## Cycle U115: baseName removes control characters

- red: `-   man ual\n` / `-   \t.pdf` / `+   manual.pdf` (1 failed)
- green: strip `[\u0000-\u001f\u007f]`. Suite 50 passed
- commit: `4a0d481`

## Cycle U116: checkDeclared accepts each accepted type within its cap

- red: `error: Error: not implemented` (1 failed)
- green: `checkDeclared` returns null. Suite 51 passed
- commit: `01f52e6`

## Cycle U117: checkDeclared refuses other types, naming the accepted types

- red: `error: AssertionError` (`assert(refusal !== null)`, 1 failed)
- green: `ACCEPTED` list check, code `unsupported_type`. Suite 52 passed
- commit: `293ef7c`

## Cycle U119: an image one byte over the cap is refused, naming cap and declared size

- red: `error: AssertionError` (`assert(refusal !== null)`, 1 failed)
- green: `cap = floor(MB * 1024 * 1024)`; `too_large` message names both. Suite 53 passed
- commit: `393c5f1`

## Cycle U118: an image declared at exactly the image cap is accepted

- first run: passed. Mutant: `decl.size > cap` to `>=` -> `Values are not equal. -   { -     code: "too_large",` (1 failed). Restored, cmp clean.
- commit: `668524a`. Suite 54 passed

## Cycles U120, U121, U320: PDF cap boundary, PDF over cap, decimal MAX_IMAGE_MB (one commit, a process slip: three tests committed together)

- tests: three new tests; all three passed on first run
- mutants: PDF cap taken from `maxImageMb` -> U120 `Values are not equal. -   {`; U121 `Expected actual: "The file is 26214401 bytes, over the cap of 10485760 bytes." to contain: "26214400".` MB base `1024 * 1024` to `1000 * 1000` -> U320 `Values are not equal. -   { -     code: "too_large",`. Each restored, cmp clean.
- commit: `172b106`. Suite 57 passed

## Cycle U141: a HEIC declared type is refused with share-as-JPEG steps

- red: `-   unsupported_type` / `+   heic` (1 failed)
- green: `HEIC_REFUSAL` (names iPhone and Android steps) before the type check. Suite 58 passed
- commit: `301a212`

## Cycle U142: a .heic or .heif file name is refused whatever the declared type

- red: `error: AssertionError: a.heic` (1 failed)
- green: name regex `/\.(heic|heif)$/i`. Suite 59 passed
- notes: a first attempt at this edit mangled the file and was committed with a type error; I `git reset --soft`ed that local commit, restored the file and recommitted clean. No pushed history was touched.
- commit: `2eedafa`

## Cycle U143: sniffType identifies PDF, JPEG, PNG, WebP and HEIC

- red: `error: Error: not implemented` (1 failed)
- green: header checks (`%PDF-`, FFD8FF, 89 PNG, RIFF..WEBP, ftyp + heic brands). Suite 60 passed
- commit: `6efdf64`

## Cycle U144: sniffType returns null for other bytes and empty input

- first run: passed. Mutant: final `return null` to `return "image/jpeg"` -> `-   "image/jpeg"` / `+   null` (1 failed). Restored, cmp clean.
- commit: `e2e11fa`. Suite 61 passed

## Cycle U148: checkActual accepts a file matching its declaration

- red: `error: Error: not implemented` (1 failed)
- green: returns null. Suite 62 passed
- commit: `864353c`

## Cycle U149: checkActual refuses a sniffed type that differs from the declared one

- red: `error: AssertionError` (1 failed)
- green: compare `sniffType(bytes)` with `declared_type`, code `wrong_type`. Suite 63 passed
- commit: `024f040`

## Cycle U150: checkActual refuses an actual size that differs from the declared one

- red: `error: AssertionError: 4999` (1 failed)
- green: `info.size !== declared_size`, code `wrong_size`. Suite 64 passed
- commit: `d6e364a`

## Cycle U153: checkActual refuses an actual size over the cap

- red: `error: AssertionError` (1 failed)
- green and refactor: shared `tooLarge(type, size, settings)` used by `checkDeclared` and `checkActual`; a PDF refusal adds the background-processing note (fork issue #26). Suite 65 passed
- commit: `0444a63`

## Cycle U154: checkActual refuses HEIC bytes whatever was declared

- red: `-   wrong_type` / `+   heic` (1 failed)
- green: `sniffType === "image/heic"` returns `HEIC_REFUSAL`. Suite 66 passed
- commit: `d65cbb0`

## Cycle U155: checkActual refuses bytes of an unrecognised type

- red: `-   wrong_type` / `+   unsupported_type` (1 failed)
- green: null sniff gives `unsupported_type` naming the accepted types. Suite 67 passed
- commit: `8a71813`

## Cycle U152: checkActual refuses a PDF over MAX_PDF_PAGES

- red: `error: AssertionError` (1 failed)
- green: `row.page_count > maxPdfPages` gives `too_many_pages` naming `MAX_PDF_PAGES`, the count and the background note. Suite 68 passed
- commit: `f22a707`

## Cycle U151: checkActual accepts a PDF of exactly MAX_PDF_PAGES pages

- first run: passed. Mutant: `row.page_count > settings.maxPdfPages` to `>=` -> `Values are not equal. -   {` (1 failed). Restored, cmp clean.
- commit: `6813f00`. Suite 69 passed

## T021, T054: `src/pdf.ts`, `tests/pdf_test.ts`

## Cycle U122: openPdf reports the page count

- red: `error: Error: not implemented` (1 failed)
- green: `getDocumentProxy(bytes).numPages` (`npm:unpdf@2.2.2`). Suite 70 passed
- commit: `f4a2a0f`

## Cycle U123: pageTexts returns each page's text in page order

- red: `error: Error: not implemented` (the stub `pageTexts` thrown, 1 failed)
- green: `extractText(pdf, { mergePages: false }).text`. Suite 71 passed
- commit: `fec7830`

## Cycle U156: isScanned is true one under the per-page minimum

- red: `error: Error: not implemented` (1 failed)
- green: total characters / page count below `scannedMinCharsPerPage`. Suite 72 passed
- commit: `ccbe712`

## Cycle U157: isScanned is false at exactly the minimum

- first run: passed. Mutant: `<` to `<=` -> `Values are not equal. -   true` (1 failed). Restored, cmp clean.
- commit: `fb1e481`. Suite 73 passed

## Cycle U158: whitespace-only page text counts as zero characters

- red: `Values are not equal. -   false` / `+   true` (1 failed)
- green: count `text.replace(/\s/g, "").length`. Suite 74 passed
- commit: `5449cbe`

## Cycle U159: openPdf of corrupt bytes returns a readable error

- red: `error: InvalidPDFException: Invalid PDF structure.` (thrown, 1 failed)
- green: try/catch gives `{ error: "The PDF could not be read: it is damaged or not a PDF." }`. Suite 75 passed
- commit: `1fc4d69`

## Cycle U160: openPdf of an encrypted PDF returns a readable error

- test: the fixture is a hand-written PDF text with a standard-handler `/Encrypt` entry, built at test time (no binary, no pdf-lib). pdf.js raises `PasswordException: No password given`.
- red: `Expected actual: "The PDF could not be read: it is damaged or not a PDF." to contain: "password".` (1 failed)
- green: `PasswordException` gives "The PDF is password-protected (encrypted), so its text cannot be read." Suite 76 passed. So U160 is DONE here, not DROPPED; T077's live encrypted check is still worth doing against a real encrypted file.
- commit: `f65c6bb`

## T022: `src/passages.ts`, `tests/passages_test.ts`

## Cycle U124: every passage, source line included, is within PASSAGE_MAX_CHARS

- red: `error: Error: not implemented` (1 failed)
- green: greedy word packing against `sourceLineFor(pages).length + 1 + text.length <= passageMaxChars` (pages fixed `[1, 1]` at this point). Suite 77 passed
- commit: `41d53e7`

## Cycles U125, U126: exactly the maximum is one passage, one more is two (one commit: a process slip)

- both passed on first run. Mutants: `<=` to `<` -> U125 `Values are not equal. -   2`; `<=` to `<= max + 1` -> U126 `Values are not equal. -   1`. Each restored, cmp clean.
- commit: `e15ed15`. Suite 79 passed

## Cycle U128: a passage within one page records that page at both ends

- test: the first draft of the test used pages that were too short, so the next page's first word legitimately joined the passage and the test was wrong, not the code. The test was corrected (each page fills a passage exactly) and the red was re-proved against the previous implementation.
- red (against the previous `passages.ts`): `-       1,` / `-       1,` / `+       2,` / `+       2,` / `-       1,` / `+       3,` (1 failed)
- green: track the first and last page of the open passage. Suite 80 passed
- commit: `be9ecaa`

## Cycle U129: a passage crossing a page boundary records both pages

- first run: passed. Mutant: delete `last = page;` -> `Values are not equal. -     1,` (1 failed). Restored, cmp clean.
- commit: `0c334b1`. Suite 81 passed

## Cycle U127: passages keep reading order and cover all the text

- first run: passed. Mutant: drop the final `passages.push` -> `+     "c13",` / `+     "c14",` (1 failed). Restored, cmp clean.
- commit: `2e6c1b1`. Suite 82 passed

## Cycle U130: a run of non-space text longer than the maximum is split

- red: `error: AssertionError: 1,1 is 1000 chars` (1 failed)
- green: a word longer than the room (`max - sourceLine - 1`, at least 1) is cut into room-sized passages. Suite 83 passed
- commit: `9b74ad3`

## T023, T036: `src/derived.ts`, `tests/derived_test.ts`

`sourceLine` takes the locator as a string, so the page-range wording (`page 12` vs `pages 12–13`) lives in a private `locatorFor` used by `passageRow`; U321 and U350 test it through `passageRow`.

## Cycle U131: sourceLine matches the data-model example

- red: `error: Error: not implemented` (1 failed)
- green: `"From " + file + ", " + locator + " (attachment " + shortId + ")"`. Suite 84 passed
- commit: `d3c4397`

## Cycle U133: fingerprint equals upsert_thought's normalisation

- red: `error: Error: not implemented` (1 failed)
- green: collapse `\s+` to one space, trim, lowercase, SHA-256 hex. Suite 85 passed. Includes the SHA-256 of "abc" known vector.
- commit: `4192fff`

## Cycle U134: a passage row's content is the source line, a line break, then the text

- red: `error: Error: not implemented` (1 failed)
- green: `passageRow` builds content, fingerprint and passes the embedding through. Suite 86 passed
- commit: `04de76a`
- refactor (second commit, same behavior id): `passageRow` as a plain `async` function. Suite 86 passed. commit: `c1bb174`

## Cycles U132, U321: short id and one-page wording (one commit: a process slip)

- both passed on first run. Mutants: `row.id.slice(1, 9)` -> `Expected actual: "From a.pdf, page 1 (attachment f1e2d3c-)" to contain: "(attachment 0f1e2d3c)".`; `locatorFor` always `pages a–b` -> `-   From dishwasher-manual.pdf, pages 12–12 (attachment a1b2c3d4)` / `+   From dishwasher-manual.pdf, page 12 (attachment a1b2c3d4)`. Restored, cmp clean.
- commit: `4074fd4`. Suite 88 passed

## Cycle U135: ingestion contract metadata fields

- red: `Values are not equal. -   undefined` / `+   "local_document"` (1 failed)
- green: the nine fields; `importer_version` is the constant `"0.1.0"`, as in `metadata.json` (drifts if the version is bumped). Suite 89 passed
- commit: `ea81c6f`

## Cycle U136: type reference and topics

- red: `-   undefined` / `+   "reference"` (1 failed)
- green: `type: "reference"`, `topics: ["attachment", name]`. Suite 90 passed
- commit: `59597d7`

## Cycle U137: provenance is deterministic_conversion

- red: `Values are not equal.` with the whole expected `provenance` object missing (1 failed)
- green: provenance with locator, artifact and `review_status`. Suite 91 passed
- commit: `86ef988`

## Cycle U138: attachment_id and parent_thought_id

- red: `-   undefined` / `+   "a1b2c3d4-0000-4000-8000-000000000000"` (1 failed)
- green: both ids copied from the row. Suite 92 passed
- commit: `584d021`

## Cycles U350, U139: provenance locator for one page, and the restricted tier (one commit: a process slip)

- both passed on first run. Mutants: provenance locator always `pages a–b` -> `-   pages 12–12`; `sensitivity_tier: "personal"` constant -> `-   personal`. Restored, cmp clean.
- commit: `aac8732`. Suite 94 passed

## Cycle U140: metadata holds no URL, token or absolute path

- red: `metadata holds "/Users": {"source":"local_document", ... "source_label":"/Users/mfelker/private/dishwasher-manual.pdf" ...}` (1 failed)
- green: `baseName` (from `intake.ts`) applied to the file name for the source line, `source_label`, `topics` and `artifact`. Suite 95 passed. Metadata is built only from allowlisted fields, so no token or storage path is copied.
- commit: `dc18738`

## Cycle U145: a caption row's content

- red: `error: Error: not implemented` (1 failed)
- green and refactor: `passageRow` and `captionRow` share a private `derivedRow` builder (the passage tests U131-U140 stayed green). Suite 96 passed
- commit: `ce5f338`

## Cycle U146: a caption row's provenance

- first run: passed (the shared builder already carried it). Mutant: `extractor_model: row.caption_model` -> `-     extractor_model: null,` (1 failed). Restored, cmp clean.
- commit: `fa14309`. Suite 97 passed

## Cycle U147: noteMetadata

- red: `error: Error: not implemented` (1 failed)
- green: the four fields, `imported_at` from the injected clock. Suite 98 passed
- commit: `15ba1f7`

## Stream X summary

All of U113-U160, U320, U321 and U350 are DONE (51 behaviors; U160 built, not dropped). Final suite: 98 passed, 0 failed, 63 ignored.

<!-- end -->
