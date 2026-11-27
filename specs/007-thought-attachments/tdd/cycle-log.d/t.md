# Cycle log stream: T (tools: T027, T028, T029, T030, T041, T049, T050, T063, T064)

Append only. Worktree `/Users/mfelker/Projects/ob1/.worktrees/ta-tools`, branch `contrib/mfelker/thought-attachments-tools`, folder `F` = `integrations/thought-attachments`. Files owned: `src/tools.ts`, `tests/tools_test.ts`.

Single-test command (from `F`): `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. Every red reported `1 failed` and every green `1 passed`. Suite baseline 153 passed; final 210 passed, 0 failed, 63 ignored (the integrator's todo acceptance tests). A "mutant" means the test passed on its first run; the source was then broken minimally, the test failed, and the file was restored byte for byte (`cmp` clean).

Test method: `buildServer(deps, services)` driven through `inMemoryClient`, with `FakeStore` (dimension 4), a recording fake embedding client and a scripted `services.finish`.

Decisions: `page_token_hash` is the lowercase hex SHA-256 of the token after `#t=` (integrator rule, asserted by U237). Refusals use `isError` with the structured `code` from `intake.ts` passed through (U232b). A busy result is `isError` with text `busy (finishing|rebuilding|removing), try again shortly`. The reading layer is `asReported`: a cut-off finish reads `failed` "the run did not finish", a cut-off rebuild stays `processed` with `last_rebuild_error` set, a cut-off remove reads as stored.

## T027: registration

## Cycle U217: tools/list returns exactly the seven tool names

- red: `error: Error: not implemented` (stub, first cycle only; 1 failed)
- green: seven tools registered with stub handlers
- commit: `b69861b`

## Cycle U218: annotations match the contract

- red: `AssertionError: Values are not equal: find_thought` (readOnlyHint, 1 failed)
- green: annotations table
- commit: `7299855`

## Cycle U219: input schemas and defaults

- red: `AssertionError: Values are not equal.` (find_thought required list, 1 failed)
- green: zod schemas, `mode` default `meaning`, `limit` default 5, `confirm` default false
- commit: `bade4fc`

## T028: find_thought

## Cycle U220: meaning mode

- red: `AssertionError: Values are not equal.` (matches, 1 failed)
- green: embed the query, `matchThoughts`
- commit: `2ee0681`

## Cycle U221: exact mode

- red: `AssertionError: Values are not equal.` (matches empty, 1 failed)
- green: `findThoughtsExact`, no embedding call
- commit: `5675da7`

## Cycle U222: no limit asks for 5

- first run passed. Mutant: `default(5)` to `default(6)` -> `AssertionError: Values are not equal.` (1 failed); restored
- commit: `48adb61`

## Cycle U223: limit 20 asks for 20

- first run passed. Mutant: `findThoughtsExact(query, limit)` to `(query, 5)` -> `Values are not equal.`; restored
- commit: `5a3d4b6`

## Cycle U328: limit above 20 is reduced to 20

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `Math.min(asked, 20)`
- commit: `4e4c9c0`

## Cycle U225: a 121-character first line is cut to 120

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `slice(0, 120)` on the store's first line
- commit: `ab71a2f`

## Cycle U224: a 120-character first line is whole

- first run passed. Mutant: cap 120 to 119 -> `Values are not equal.`; restored
- commit: `0392e66`

## Cycle U226: first line stops at the first line break

- red: `AssertionError: Values are not equal.` (1 failed)
- green: split on line break
- commit: `a5e1fe5`

## Cycle U227: each match has id, first_line, captured

- first run passed. Mutant: dropped `captured` (`{ id, first_line }`) -> `Values are not equal.`; restored
- commit: `baec9d6`

## Cycle U228: no match says "no matching thought"

- red: `Expected actual: "[]" to contain: "no matching thought".` (1 failed)
- green: empty result message, readable lines otherwise
- commit: `0e53c4d`

## T029: attach_file (command upload)

## Cycle U229: unknown thought_id refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `thoughtExists` check
- commit: `73f2f6e`

## Cycle U230: both thought_id and note refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: exactly-one rule
- commit: `e514da7`

## Cycle U231: neither refused

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `(thought_id === undefined) === (note === undefined)`
- commit: `d2f9806`

## Cycle U232: checkDeclared refusal returned, nothing created

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `checkDeclared` with the base name
- commit: `c633d48`

## Cycle U233: same file pending on the parent points to it

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `findPending`, returns the existing attachment
- commit: `14fb8af`

## Cycle U235: a successful start writes the pending_upload row

- red: `AssertionError: Values are not equal.` (1 failed)
- green: createAttachment with generated id, base name, storage path
- commit: `176e3fe`

## Cycle U234: a different size creates a new attachment

- first run passed. Mutant: `findPending` size argument replaced by 1000 -> `Values are not equal.`; restored
- commit: `4289e21`

## Cycle U236: upload_deadline is now plus UPLOAD_LINK_MINUTES

- first run passed. Mutant: `uploadLinkMinutes * 60_000` to `3_600_000` -> `Values are not equal.`; restored
- commit: `0a7115c`

## Cycle U237: page_token_hash is the SHA-256 (lowercase hex) of the token

- red: `TypeError: Cannot read properties of undefined (reading 'includes')` (no page_link, 1 failed)
- green: random token, hash stored, `pageLink`
- commit: `a61d3fb`

## Cycle U238: the result carries ids, deadline, upload, curl, page link, limits

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `signUpload`, `curlLine`, `limitsFor`
- commit: `608d7d0`

## Cycle U239: upload.url goes through publicUrl

- first run passed. Mutant: `url: signed.data.url` (no `publicUrl`) -> `Values are not equal.`; restored
- commit: `4b82cfc`

## Cycle U240: sensitivity_tier stored

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `sensitivity_tier` passed to the row
- commit: `f1624f3`

## Cycle U329: an expired pending upload does not block

- first run passed. Mutant: `findPending` now replaced by `new Date(0)` -> `Values are not equal.`; restored
- commit: `9af1cd0`

## Cycle U330: only some of the three details refused

- red: `AssertionError: Values are not equal: {"file_name":"manual.pdf"}` (1 failed); a second red on the message wording (`Expected ... to contain "give all three, or none for a phone upload"`), then the message was reworded to contain it
- green: given-count check
- commit: `456a747`

## T030: finish_attachment

## Cycle U241: passes id and rebuild, returns the outcome

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `resolveAttachment`, `services.finish`
- commit: `4c8781a`

## Cycle U242: busy names the running operation

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `busyReply`
- commit: `86f0eb8`

## T041: attach_file note and phone upload

## Cycle U244: note saved through insertNote as the parent

- red: `AssertionError: Values are not equal.` (1 failed)
- green: embed the note, `insertNote`, `noteMetadata`; handler moved into `attachFile`
- commit: `c546ad1`

## Cycle U245: a matching note attaches to the existing thought

- red: `Expected actual: "Attachment ... started on thought ..." to contain: "attached to your existing thought"` (1 failed)
- green: text line when `created` is false
- commit: `3b9c746`

## Cycle U246: HEIC with note saves no note

- first run passed. Mutant: `if (refusal) void 0;` -> `Values are not equal.`; restored
- commit: `1ab6640`

## Cycle U247: over-cap with note saves no note

- first run passed. Same mutant -> `Values are not equal.`; restored
- commit: `6f533ef`

## Cycle U248: phone upload without details

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `file` is null; no `signUpload`, no declaration, `expected_kind`, all limits
- commit: `b9e1421`

## Cycle U249: expected_kind other than photo or pdf refused

- first run passed. Mutant: `z.string()` cast in place of the enum -> `Values are not equal.`; restored (a first mutant failed type checking, so it was replaced)
- commit: `512c31f`

## T049: get_attachment

## Cycle U250: details

- red: `AssertionError: Values are not equal.` (1 failed)
- green: details and text
- commit: `f9c7eed`

## Cycle U251: a stored file gets a download link

- red: `AssertionError: Values are not equal: processed` (1 failed)
- green: `signDownload` through `publicUrl`, lifetime stated
- commit: `39d1d0b`

## Cycle U252: no link for pending_upload

- red: `AssertionError: Values are not equal.` (1 failed)
- green: state check
- commit: `27bd18c`

## Cycle U253: no link for refused

- first run passed. Mutant: removed `&& row.state !== "refused"` -> `Values are not equal.`; restored
- commit: `594e899`

## Cycle U331: a cut-off finish reads failed

- red: `Values are not equal.` (`+ failed`, 1 failed)
- green: `asReported`
- commit: `9dc7f0e`

## Cycle U332: one second before busy_until reads as stored

- first run passed. Mutant: expiry compared with `now + 2000` -> `Values are not equal.`; restored
- commit: `98a0956`

## Cycle U333: a cut-off rebuild reads processed with the cut-off noted

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `last_rebuild_error` in the output
- commit: `0fb54ef`

## Cycle U353: cut-off finish reads failed and keeps its download link

- first run passed. Mutant: raw row state used for the link check -> `TypeError: Cannot read properties of undefined (reading 'url')` (no link); restored
- commit: `0da9e98`

## T050: list_attachments

## Cycle U254: by thought

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `listByParent`, `summary`
- commit: `cf5b222`

## Cycle U255: by derived thought

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `attachmentForDerived`
- commit: `bd5ecc0`

## Cycle U256: both or neither refused

- red: `AssertionError: Values are not equal: {"thought_id":...,"derived_thought_id":...}` (1 failed)
- green: exactly-one rule
- commit: `406ab4b`

## Cycle U257: no owner says not found

- red: `Expected actual: "" to contain: "not found".` (1 failed)
- green: "not found" text for an empty list
- commit: `2198cf5`

## Cycle U334: cut-off finish reads failed in a list

- first run passed. Mutant: `summary(row)` without `asReported` -> `Values are not equal.` (`+ "failed"`); restored
- commit: `4a0062a`

## T063: remove_attachment

## Cycle U258: no confirm is a dry run

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `removalPreview` text and fields
- commit: `b8812c9`

## Cycle U259: confirm removes the file then the records

- red: `AssertionError: Values are not equal.` (1 failed)
- green: claim, `deleteObject`, `removeAttachment`, release in `finally`
- commit: `79131f3`

## Cycle U260: busy refused

- first run passed. Mutant: busy branch returns `ok` -> `Values are not equal.`; restored
- commit: `2c05091`

## Cycle U335: failed record removal reported, attachment stays listed

- first run passed. Mutant: removal error branch returns `Removed` -> `Values are not equal.`; restored
- commit: `2365c71`

## Cycle U336: repeat remove succeeds after a failed removal

- first run passed. Mutant: release replaced by `void token` -> `Values are not equal.` (repeat is busy); restored
- commit: `c6134f9`

## Cycle U354: remove proceeds after a cut-off remove

- first run passed. Mutant: `removeAttachment(row.id, "stale")` -> `Values are not equal.`; restored
- commit: `12cf458`

## T064: find_orphan_attachments

## Cycle U261: orphans with id, file name, why and derived_count

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `orphans(now)` mapping
- commit: `4378c67`

## Cycle U243: id-taking tools accept short ids

- red: `Expected actual: "Ambiguous attachment id: ..." to contain: "ambiguous".` (1 failed)
- green: message reworded; then mutant `services.finish(attachment_id, ...)` (raw id) -> `Values are not equal.`; restored
- commit: `d324119`

## Cycle U232b: refusal code passed through (extra, with U232)

- red: `AssertionError: Values are not equal.` (1 failed)
- green: `fail(message, code)`
- commit: `48f95b5`

Refactor: removed the unused placeholder handler, commit `8ff95de`.

## DONE behaviors

U217-U261, U328-U330, U331-U336, U353, U354, U243 (T027, T028, T029, T030, T041, T049, T050, T063, T064 all complete).
