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
- green: cap = floor(MB * 1024 * 1024); `too_large` message names both. Suite 53 passed
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

<!-- end -->
