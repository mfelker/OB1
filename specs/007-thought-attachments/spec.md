# Feature Specification: Thought attachments (files linked to thoughts)

**Feature Branch**: `contrib/mfelker/thought-attachments`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Spec 007: attachments, meaning files linked to thoughts, such as a product's service manual (PDF) or photos of where things are stored, so the owner's AI can attach a file to a thought, fetch it back later, and find it through the normal thought search. A new standalone integration on upstream/main with no dependency on spec 004 or upstream PR 533; works on Supabase Cloud and on spec 006's self-hosted stack; fork first, then upstream. Signed upload and download URLs so file bytes never pass through the MCP call; a new attachments table; PDF text chunks and photo captions saved as ordinary thoughts following the upstream ingestion metadata contract; inline extraction within Cloud limits (resumable worker deferred, fork issue 26); scanned PDFs flagged, not OCR'd (fork issue 30); captions from an owner-configured OpenAI-compatible vision model; PDF, JPEG, PNG, WebP only (HEIC rejected); configurable size and page caps validated by measurement; thumbnails deferred (fork issue 31)."

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | upstream-bound feature |
| **Branch** | `contrib/mfelker/thought-attachments` |
| **Base** | `upstream/main` (no stacking: no dependency on spec 004 or upstream PR 533) |
| **Category** | integrations |
| **Contribution folder** | `integrations/thought-attachments/` (new) |
| **Upstream PR** | to be opened after the fork landing; landed on the fork first through a fork PR |
| **Requires** | A working core Open Brain (`docs/01-getting-started.md`) on Supabase Cloud or on spec 006's self-hosted stack; Supabase Storage; the brain's embedding model (the same one the core server uses); a vision-capable model reachable through an OpenAI-compatible endpoint |

## Clarifications

### Session 2026-11-26 (decided before specify, asked one at a time)

- Q: Where does the code live? → A: A new standalone integration with its own remote MCP connector, branched from `upstream/main`, independent of spec 004 and upstream PR 533.
- Q: How are files modelled? → A: A new attachments table with one row per file. Extracted PDF text (in chunks) and photo captions are saved as ordinary thoughts that point back to their attachment, so the existing thought search finds them unchanged; the core `thoughts` table is not altered.
- Q: When does extraction run? → A: Inline, during the call that finishes an attachment, within Supabase Cloud's function limits; files too big to process inline are rejected. A resumable step or background worker is deferred (fork issue 26).
- Q: Which extraction approach? → A: PDF text from the file's text layer; captions from a vision model the owner configures through an OpenAI-compatible endpoint (local or cloud). Scanned PDFs without a text layer are flagged, not OCR'd; OCR is deferred (fork issue 30).
- Q: Who performs the upload to the signed link? → A: The owner must be able to upload photos from their phone in 007. Clients that can run commands (Claude Code) upload directly; every client also gets a one-time browser upload link (file picker, no shell, no access key in the page) that works from a phone. Planning must prove the page works on Supabase Cloud, where functions on the default domain serve HTML as plain text, and choose a fallback if needed (FR-002, User Story 2).
- Q: Attachment lifecycle? → A: Every attachment has a parent thought; there are no parentless files. Removing an attachment is a hard remove, needing an explicit confirmation: the stored file, the attachment record and its derived thoughts are deleted by the attachment's identity, and the parent thought is untouched. Attachments whose parent thought was deleted elsewhere are reported by an orphan check and can then be removed (FR-016, FR-021, User Story 5). A soft remove was rejected because the unchanged core search would keep showing the derived thoughts. → Superseded in part by "Is the note saved if the attachment is refused" (grill): one exception, a note this integration created when starting an attachment is removed with that attachment if it ended refused or expired without an upload and no other attachment points to it.
- Q: Which types and limits? → A: PDF, JPEG, PNG and WebP; HEIC is rejected with a "share as JPEG" message. Size and page limits are configurable settings whose defaults (images 10 MB; PDFs 25 MB and 50 pages) are validated by measurement on Supabase Cloud during planning. Thumbnails are deferred (fork issue 31).

### Session 2026-11-26 (grill-with-docs)

- Q: How does the AI identify the parent thought, given that the core connector returns no thought id on capture or in its main search? → A: The attachments connector has its own read-only lookup tool that finds thoughts by meaning or exact text and returns their ids with the first line and date; attaching takes that id.
- Q: Can starting an attachment also create the parent thought? → A: Yes. Starting an attachment takes either an existing thought id or new note text; with text, the note is first saved as a normal thought (embedded with the brain's model, labelled with this integration as its source, type `observation`, without the core's chat-model labelling) and the file is attached to it.
- Q: What finishes an attachment after a phone upload? → A: The upload page itself: after the upload it asks the integration to finish that attachment and shows the result on the phone; the AI can still finish an attachment (command uploads, retries). The page's one-time link may start finishing only for its own attachment.
- Q: How does a search result show which file it came from? → A: Each derived thought's text starts with a short source line naming the file's base name, the page range (or "photo") and a short attachment id, followed by the passage or caption.
- Q: What happens to a file that finishing refuses? → A: Finishing deletes the stored file at once and keeps the attachment record marked `refused`, with the reason and the actual type, size or page count; the owner starts a new attachment to try again, and refused records appear in the orphan check until removed.
- Q: What happens when two operations on one attachment overlap? → A: One at a time: while an attachment is being finished or removed, any other finish or remove on it is refused at once with an "attachment busy, try again shortly" message and changes nothing.
- Q: Which attachment states can be finished again? → A: Every state except `refused`: `failed` and `not captioned` are retried, `scanned` is re-checked, and a `processed` attachment can be rebuilt, replacing its derived thoughts (for example after changing the vision model).
- Q: How do derived thoughts appear in the core listing and stats? → A: They are labelled with the core type `reference` and the topics `attachment` and the file's base name, so the owner can filter them; the unfiltered recent listing may still fill up after a large upload. A later spec that adds more kinds of thought is tracked as fork issue #32.
- Q: How long does an upload link stay valid? → A: A setting, default 60 minutes, for both the direct upload link and the phone upload page.
- Q: What counts as "findable" when verifying? → A: Pass/fail on fixed samples with no percentages: each listed sample question must return its expected passage or caption within the core search's default 10 results, and the phone upload must work with no app and no shell, with no time limit.
- Q: What does a failed rebuild leave behind? → A: The old derived thoughts stay until the new set is completely written and are then swapped; on failure the attachment stays `processed` with its old derived thoughts and a "last rebuild failed" note with the reason.
- Q: What if finishing is cut off by the platform and never reports back? → A: A busy mark expires after a configured time, defaulting to slightly more than the platform's longest allowed request (to be measured); after that, a cut-off finish counts as `failed` with its partial derived thoughts cleared, and a cut-off rebuild keeps its old derived thoughts.
- Q: Is a note saved by starting an attachment kept if that attachment is refused or expires? → A: Checks before upload run before the note is saved, so a request refused at that stage saves nothing. A note this integration created when starting an attachment is removed together with that attachment when the attachment, having ended `refused` or expired without an upload, is removed, but only if no other attachment points to the note; every other parent thought is never touched (confirmed after a conflict with the lifecycle rule).

### Session 2026-11-26 (planning)

- Q: Where does the phone upload page live, given that Supabase Cloud's default domain rewrites HTML from Edge Functions and Storage to plain text and allows XHTML only with the paid custom-domain add-on (probed and read at planning; plan R5)? → A: One static HTML file in the integration folder: on the self-hosted stack the function serves it itself (probed: the self-hosted runtime serves HTML unchanged); on Supabase Cloud the owner publishes the same file once to any free static host, and the upload link points there with its one-time token in the URL fragment, the page calling only the integration's JSON interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach a service manual and find it later (Priority: P1)

The owner tells their AI "here's the manual for the dishwasher, save it with my dishwasher note". The AI attaches the PDF to that thought. Weeks later the owner asks "how do I clean the dishwasher filter?" and the normal thought search returns the relevant manual passage, with a way to open the original file.

**Why this priority**: Searchable manuals are the core reason for the feature; without text extraction feeding search, files are just storage.

**Independent Test**: Attach a small text-layer PDF to a thought, then run the existing thought search with a question answered only inside the PDF; the result is a passage from that PDF that names its attachment.

**Acceptance Scenarios**:

1. **Given** an existing thought and a PDF with a text layer within the limits, **When** the AI attaches the PDF to the thought and the attachment is finished, **Then** the file is stored, the attachment is recorded as processed, and its text is saved as one or more passage thoughts linked to the attachment and its parent thought.
2. **Given** a processed PDF attachment, **When** the owner searches with the brain's existing search tool for something stated only in the PDF, **Then** a passage thought from that PDF is among the results, and its text shows the file name, page range and attachment id.
3. **Given** the same PDF is attached again to the same thought, **When** it is attached, **Then** no second attachment or duplicate passage thoughts are created and the owner is pointed to the existing attachment.
4. **Given** a PDF passage whose text matches a thought the owner wrote earlier, **When** the PDF is finished, **Then** the owner's thought is not changed in any way, and the passage is saved as its own thought owned by the attachment.

---

### User Story 2 - Photograph where something is stored (Priority: P1)

The owner snaps a photo of the garage shelf on their phone and tells the AI "the spare furnace filters are on this shelf". The AI starts an attachment for that thought and gives the owner an upload link; the owner opens it on the phone, picks the photo, and it is attached. Later, "where are the furnace filters?" finds the thought and the photo's description, and the AI can show the photo.

**Why this priority**: The second named use case; it exercises the vision path, which is independent of PDFs.

**Independent Test**: From a phone browser, open an upload link from the AI, pick a JPEG, then have the AI finish the attachment with a configured vision model; a caption thought linked to the attachment exists and the existing search finds it with words describing what the photo shows.

**Acceptance Scenarios**:

1. **Given** a thought and a JPEG, PNG or WebP photo within the limits, **When** the photo is attached and finished, **Then** a caption thought describing the photo is saved, linked to the attachment and its parent thought, and records which model wrote it.
2. **Given** an upload link from the AI, **When** the owner opens it in a phone browser and picks a photo, **Then** the photo is uploaded without a shell, an app install or the brain's access key, and the link cannot be used a second time.
3. **Given** a HEIC photo, **When** the AI tries to attach it or the owner picks it on the upload page, **Then** it is refused before upload with a message telling the owner to share it as JPEG.
4. **Given** a photo taken with the phone's default camera settings (on many phones the default format is HEIC), **When** the owner picks it on the upload page, **Then** it is either uploaded in an accepted format or refused with the "share as JPEG" message together with how to do that on that phone; the owner is never left with a silent failure.
5. **Given** no thought about the shelf exists yet, **When** the AI starts an attachment with the note text "the spare furnace filters are on this shelf", **Then** that note is saved as a thought, becomes the photo's parent, and is returned by the existing search for "furnace filters".
6. **Given** the owner uploaded a photo through the upload page, **When** the upload completes, **Then** the page finishes the attachment without the AI and shows the caption on the phone, and the photo's caption is searchable before the owner returns to the chat.
7. **Given** no vision model is configured or it fails, **When** a photo is finished, **Then** the file is still stored and fetchable, the attachment is marked as not captioned with the reason, and no caption thought is invented.

---

### User Story 3 - Get the original file back (Priority: P2)

The owner asks "show me the dishwasher manual" or "send me that shelf photo". The AI finds the attachment and gives the owner a short-lived link to open or download the original file.

**Why this priority**: Searching finds the passage; having the original is what makes the attachment trustworthy, and it is needed for photos to be useful at all.

**Independent Test**: For a stored attachment, ask for it by attachment or by parent thought; the returned link downloads a file byte-identical to the original, and the same link stops working after its expiry.

**Acceptance Scenarios**:

1. **Given** a stored attachment, **When** the AI asks for it, **Then** it receives the file's name, type, size and a download link that expires after a short, stated time.
2. **Given** a thought with several attachments, **When** the AI lists the thought's attachments, **Then** each is shown with its name, type, size, processing state and number of derived thoughts.
3. **Given** a link older than its expiry, **When** it is used, **Then** the download is refused.

---

### User Story 4 - Clear limits and honest failure (Priority: P2)

When a file is too large, of the wrong type, scanned without text, or the model server is down, the owner is told exactly what happened and what to do, and the brain never holds half-processed or misleading data.

**Why this priority**: Inline processing means limits are real; silent partial results would corrupt search.

**Independent Test**: Try each failure case (oversize image, over-page-limit PDF, unsupported type, scanned PDF, embedding model unavailable) and check the message and the stored state.

**Acceptance Scenarios**:

1. **Given** a PDF declared over the size limit, **When** an attachment is started for it, **Then** it is refused before upload with the limit and the declared size; **Given** an uploaded PDF over the page or size limit, **When** it is finished, **Then** it is refused, its stored file is deleted, its record shows `refused` with the actual size or page count, and the message notes that larger files need the planned background processing (derived from FR-003, FR-004 and Round 1, Q5).
2. **Given** a PDF with no text layer, **When** it is finished, **Then** the file is stored and fetchable, the attachment is flagged as scanned, no passage thoughts are created, and the owner is told text search will not cover it yet.
3. **Given** the embedding model fails partway through a PDF, **When** finishing fails, **Then** no passage thoughts from that attempt remain, the attachment is marked failed with the reason, and finishing again later can succeed.

---

### User Story 5 - Remove an attachment (Priority: P3)

The owner says "that's the wrong manual, remove it". The attachment, its stored file and the thoughts derived from it stop appearing in search and fetch, without touching the owner's own thought.

**Why this priority**: Needed for a usable product, but the first upload paths come first.

**Independent Test**: Remove an attachment; its derived thoughts no longer appear in search, its file can no longer be fetched, and its parent thought is unchanged.

**Acceptance Scenarios**:

1. **Given** a processed attachment, **When** the owner asks to remove it and confirms, **Then** its stored file, its attachment record and all its derived thoughts are permanently deleted, the existing search no longer returns them, fetching it fails as not found, and the parent thought and its other attachments are unchanged (except as in scenario 4).
2. **Given** a remove request without confirmation, **When** it is sent, **Then** nothing is deleted and the response lists exactly what would be deleted (the file, and the count of derived thoughts).
3. **Given** an attachment whose parent thought was deleted outside this integration, **When** the AI runs the orphan check, **Then** that attachment is listed as orphaned with its file name and derived-thought count, and it can be removed in the same way.
4. **Given** an attachment started with note text whose upload link expired unused, **When** the orphan check lists it and it is removed, **Then** the note created for it is removed too; had a second, processed attachment pointed to that note, the note would stay.

---

### Edge Cases

- An upload page opened twice, or after its expiry, refuses the second upload and says to ask the AI for a new link.
- The upload link expires before the client uploads; finishing reports "no file uploaded" and a new link can be requested.
- The client declares one type or size but uploads another; finishing checks the actual stored file (type by content, size, hash) and refuses a mismatch.
- The parent thought does not exist; attaching is refused.
- The page and the AI finish the same attachment at nearly the same time, or a remove arrives while finishing runs; the later operation is refused as busy and the owner or AI retries (FR-026).
- The same file attached to two different thoughts; each is its own attachment with its own derived thoughts, so removing one never removes the other's searchable text.
- A PDF that is encrypted or corrupt; it is stored, marked failed with a readable reason, and no passage thoughts are created.
- A file name containing personal or path information; only the file's base name is kept, never a local path.
- The brain's embedding model returns vectors of a different length than the brain's thoughts; finishing fails loudly instead of writing unsearchable thoughts.
- A very long passage; passage thoughts are kept small enough for the brain's full-text search limits.

## Requirements *(mandatory)*

### Functional Requirements

**Attach and upload**

- **FR-001**: The integration MUST let the AI start an attachment by giving the file's name, declared type and size and either an existing thought's id or new note text; with note text, the note MUST first be saved as a normal thought (embedded with the brain's model, type `observation`, metadata naming this integration as its source) and becomes the parent (Round 1, Q2). It MUST return an upload link that accepts exactly one file and expires after a configured time (default 60 minutes, shared by the direct link and the upload page; Round 1, Q9); file bytes MUST NOT pass through the MCP call.
- **FR-002**: Every started attachment MUST be uploadable two ways: (a) directly to the upload link by a client that can run commands, with a ready-to-run command returned; and (b) through a one-time browser upload page that works on a phone, needs no shell, app or access key, shows the expected file type and size limit, accepts only one file, and stops working after one upload or when the link expires. The page MUST work on Supabase Cloud and on the self-hosted stack: on the self-hosted stack the integration serves it; on Supabase Cloud it is the same file published once by the owner to a static host of their choice, carrying no secrets, with the one-time token in the link's fragment (planning clarification).
- **FR-003**: Starting an attachment MUST refuse, before any upload and before any note text is saved as a thought, a declared type outside PDF, JPEG, PNG and WebP (HEIC gets the "share as JPEG" message) and a declared size over the configured limit.
- **FR-004**: Finishing an attachment MUST check the stored file itself (type by content, actual size, page count for PDFs, content hash) and refuse it when it breaks a limit or does not match what was declared. On refusal it MUST delete the stored file at once, create no derived thoughts, and keep the attachment record in state `refused` with the reason and the actual type, size or page count; a refused attachment cannot be finished again (Round 1, Q5).

**Extraction and derived thoughts**

- **FR-005**: Finishing a PDF with a text layer MUST save its text as passage thoughts: each passage small enough for the brain's search limits, in reading order, and each recording its page range.
- **FR-006**: Finishing a photo MUST save one caption thought written by the configured vision model, describing what is visible in a way that helps later search for objects and places.
- **FR-007**: Every derived thought MUST be a normal thought, embedded with the same embedding model and vector size as the brain's existing thoughts, so the brain's existing search tools find it without changes; a vector-size mismatch MUST fail the finish with a clear error.
- **FR-008**: Every derived thought MUST carry the upstream ingestion metadata contract fields: source type `local_document`, source label (the file's base name), importer name and version, imported-at time, input hash (the file's), content fingerprint (the thought's), sensitivity tier, and provenance with method (`deterministic_conversion` for PDF text, `llm_extraction` for captions), the extractor model for captions, and a locator (page range). It MUST also identify its attachment and parent thought.
- **FR-009**: Derived-thought metadata and attachment records MUST NOT contain signed links, access keys, or absolute local paths.
- **FR-010**: A PDF with no usable text layer MUST be stored and flagged as scanned, with no passage thoughts, and the finish response MUST say text search will not cover it.
- **FR-011**: Finishing MUST be all-or-nothing for derived thoughts: on any failure no derived thoughts from that attempt remain, the attachment records a failed state with the reason, and finishing can be retried.
- **FR-012**: Re-finishing an attachment, or attaching the same file content to the same parent thought again, MUST NOT create duplicate attachments or derived thoughts.
- **FR-022**: Each derived thought MUST be created by, and owned by, exactly one attachment. Writing derived thoughts MUST NEVER merge into, update or take ownership of a thought that already exists (the owner's own thoughts or another attachment's), even when their text is the same; and removal MUST delete only thoughts that this integration created for that attachment.
- **FR-013**: Extraction MUST run within one finish call; files the configured limits mark as too large for inline processing MUST be refused with a message that names the limit and the planned background processing.

**Fetch and list**

- **FR-014**: The AI MUST be able to get a stored attachment's name, type, size, state and a download link that expires after a configured short time (default 10 minutes).
- **FR-015**: The AI MUST be able to list the attachments of a thought, and find the attachment behind a derived thought returned by search.

**Lifecycle**

- **FR-016**: Every attachment MUST belong to exactly one existing parent thought. Removing an attachment MUST require explicit confirmation; without it, the response MUST describe what would be deleted and delete nothing. With it, the stored file, the attachment record and the attachment's derived thoughts MUST be permanently deleted, each deletion scoped to that attachment's identity (never an unscoped delete), and the parent thought MUST NOT change, with one exception: when the attachment being removed ended `refused` or expired without an upload, and its parent is a note this integration created when starting that attachment, and no other attachment points to that note, the note MUST be removed with it (Round 3, Q1).
- **FR-021**: The AI MUST be able to list orphaned attachments (parent thought no longer exists), including uploads that were started but never finished after their link expired and attachments in state `refused`, and remove them under FR-016's rules.

**Configuration and security**

- **FR-017**: Limits (image size, PDF size, PDF pages), the upload link lifetime, the download link lifetime, the busy-mark expiry, the vision model and its endpoint MUST be settings with documented defaults; the defaults MUST be validated by measurement on Supabase Cloud before landing.
- **FR-018**: The integration MUST use the brain's existing access key for its connector, and the stored files MUST NOT be publicly readable.
- **FR-019**: The integration MUST work unchanged on Supabase Cloud and on spec 006's self-hosted stack, differing only in settings.
- **FR-020**: The setup MUST create everything the integration needs (its table, any storage bucket it uses) idempotently, without needing spec 006, and with the required grants for every new table.
- **FR-023**: The integration MUST offer a read-only lookup that finds existing thoughts by meaning or by exact text and returns, for each match, its id, the first line of its content and its capture date, so the AI can name a parent thought without any other connector; starting an attachment MUST take that id (Round 1, Q1; VP-001, VP-002).
- **FR-024**: After a successful upload through the browser upload page, the page MUST start finishing that attachment and show the owner the outcome (processed with a short caption or passage count, scanned, not captioned, refused or failed, with the reason). The page's one-time link MUST authorise finishing only its own attachment and nothing else; the AI MUST still be able to finish any attachment (Round 1, Q3).
- **FR-025**: Every derived thought's text MUST begin with one source line naming the file's base name, its page range (PDF passages) or "photo" (captions), and a short attachment id that the attachment tools accept, followed by the passage or caption; the source line counts toward the passage size limit of FR-005. Two derived thoughts from different attachments are therefore never identical text, so FR-022 holds under the brain's table-wide duplicate merge (Round 1, Q4; VP-004).
- **FR-026**: Finish and remove MUST run one at a time per attachment: while one is in progress on an attachment, any other finish or remove on that same attachment MUST be refused at once with a message saying the attachment is busy and which operation is running, and MUST change nothing. Operations on different attachments are not blocked (Round 1, Q6). A busy mark MUST expire after a configured time (default: slightly more than the platform's longest allowed request, set from the planning measurement); once it has expired, the next finish or remove proceeds, a cut-off finish counts as `failed` with any derived thoughts it wrote removed (FR-011), and a cut-off rebuild keeps the old derived thoughts (FR-027) (Round 2, Q2).
- **FR-027**: Finishing again MUST be allowed for every attachment state except `refused`: for `failed` and `not captioned` it retries and writes the missing derived thoughts; for `scanned` it re-checks the text layer; for `processed` a plain repeat returns the existing outcome (FR-012), and an explicitly requested rebuild replaces all of the attachment's derived thoughts with newly extracted ones, recording the model used (Round 1, Q7). A rebuild MUST keep the old derived thoughts until the new set is completely written and then swap them; if it fails, the attachment MUST stay `processed` with its old derived thoughts and record a "last rebuild failed" note with the reason (Round 2, Q1).
- **FR-028**: Every derived thought MUST carry the core type `reference` and the topics `attachment` and the file's base name, so the core listing can be filtered by type and the core stats count derived thoughts under `reference`; the core tools themselves are unchanged (Round 1, Q8; VP-003).

### Key Entities

- **Attachment**: One stored file linked to one parent thought. Attributes: base file name, type, size, content hash, page count (PDFs), storage location, processing state (pending upload, processed, scanned, uncaptioned, failed, refused) with a reason, the model used for captions, created and processed times.
- **Derived thought**: An ordinary thought created from an attachment: a PDF passage or a photo caption. It carries the ingestion-contract metadata and points to its attachment and parent thought.
- **Parent thought**: The thought the file belongs to: either an existing thought, or a note this integration saved when the attachment was started with note text. Once it exists, this feature never modifies it.

### Data & Schema Changes

- **New objects**: an attachments table (one row per file) with indexes on parent thought and content hash; a private storage bucket for attachment files, unless the owner's setup already provides one (spec 006 creates `ob1-files`); the grants every new table needs.
- **Touches `thoughts`?**: No. Derived thoughts are inserted as ordinary rows using the existing columns; no columns are added or altered.
- **RLS**: Row level security on the attachments table, with access only through the server-side role, matching the core `thoughts` table.
- **Verification**: a documented query and an executable test that assert the table, indexes, grants and bucket exist, and that the bucket is private.

### MCP Tool Surface

Names are provisional; planning settles them.

| Tool | Purpose | readOnlyHint | destructiveHint | openWorldHint |
|------|---------|--------------|-----------------|---------------|
| `attach_file` | Start an attachment for a thought; return a one-file upload link, a ready-to-run upload command and a one-time phone upload page link | false | false | true (embeds a new note) |
| `finish_attachment` | Verify the uploaded file, extract text or caption, write derived thoughts (also started by the upload page for its own attachment); retry, re-check or, on explicit request, rebuild (FR-027) | false | true (a rebuild replaces derived thoughts) | true (calls the vision and embedding models) |
| `get_attachment` | Return an attachment's details and a short-lived download link | true | n/a | false |
| `list_attachments` | List a thought's attachments, or the attachment behind a derived thought | true | n/a | false |
| `remove_attachment` | Permanently remove an attachment, its file and derived thoughts (dry run without confirm) | false | true | false |
| `find_thought` | Find existing thoughts by meaning or exact text; return id, first line and capture date | true | n/a | false |
| `find_orphan_attachments` | List attachments whose parent thought is gone, or unfinished uploads past expiry | true | n/a | false |

### README Contract

- **Prerequisites**: a working Open Brain (Cloud or spec 006 self-hosted); the Supabase CLI; the brain's access key; the brain's embedding model settings; a vision-capable model endpoint.
- **Steps**: run the setup SQL (and create the bucket if needed); set the settings; deploy the Edge Function; on Supabase Cloud only, publish the upload page file to a static host and set its address; add the connector in the AI client; attach a sample PDF and photo; search for them.
- **Expected outcome**: a photo uploaded from a phone through the upload page, and the sample PDF's passage and the photo's caption appear in the brain's normal search, and the original files can be fetched through a link.
- **Links**: `docs/05-tool-audit.md`; `docs/ingestion-metadata-contract.md`; the getting-started guide; spec 006's recipe for self-hosted users.

### Testing Requirements

- **Runner**: Deno tests inside `integrations/thought-attachments/`, plus SQL verification; storage, embedding and vision services mocked; no live credentials.
- **Behaviors that MUST have tests**: each acceptance scenario above; type and limit refusals (FR-003, FR-004); passage size and page locators (FR-005); ingestion-contract fields and the no-secrets rule (FR-008, FR-009); vector-size mismatch (FR-007); all-or-nothing failure and retry (FR-011); duplicate prevention and exclusive ownership, including a passage that matches an existing thought (FR-012, FR-022); link expiry (FR-014); confirmed and unconfirmed removal, scoped deletes and orphan listing (FR-016, FR-021); grants and private bucket (FR-018, FR-020).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a fixed sample service manual within the limits and a listed set of questions answerable only from it, every question returns its expected passage within the core search's default 10 results (pass/fail per question; verifies Round 1, Q10).
- **SC-002**: For a fixed set of sample storage photos, a search naming each photo's stored object returns that photo's caption thought within the core search's default 10 results (pass/fail per photo; verifies Round 1, Q10).
- **SC-003**: A file fetched through its link is byte-identical to the original in 100% of tested cases, and every expired link is refused.
- **SC-004**: On Supabase Cloud, a PDF at the default page and size limits and an image at the default size limit each finish within one call without hitting platform limits; if not, the defaults are lowered until they do, and the measured values are recorded.
- **SC-005**: Every refusal and failure case in User Story 4 leaves zero derived thoughts from the failed attempt and gives a message naming the cause.
- **SC-006**: A live run on both Supabase Cloud and spec 006's self-hosted stack completes the attach, search and fetch flow for one PDF and one photo with identical behaviour, differing only in settings.
- **SC-007**: No derived thought or attachment record contains a signed link, access key or absolute local path (checked over every record from the live runs).
- **SC-008**: On both Supabase Cloud and the self-hosted stack (phone on the same network), the owner uploads a photo taken with the phone's default camera settings through the upload page with no app install and no shell, and the photo ends up captioned and searchable; no time limit applies (verifies Round 1, Q10).
- **SC-009**: After the owner captures a thought through the core connector, the AI finds it with the lookup using words from it, gets its id among the returned matches, and attaches a file to it without using any other connector (verifies Round 1, Q1).
- **SC-010**: Starting an attachment with note text and no thought id creates exactly one new thought with that text, the attachment's parent is that thought, and the core connector's search finds it (verifies Round 1, Q2).
- **SC-011**: A photo uploaded through the upload page is finished by the page itself: with no further AI call, its caption thought exists and the page shows the caption; the page's link cannot finish or upload to any other attachment (verifies Round 1, Q3).
- **SC-012**: For a passage returned by the core connector's search, the AI fetches the original file using only the attachment id shown in the result's text; and the same PDF attached to two different thoughts yields two separate sets of passages, so removing one attachment leaves the other's passages searchable (verifies Round 1, Q4).
- **SC-013**: An upload whose real type or size breaks the limits (example: a 40 MB file declared as a 4 MB JPEG) is refused at finishing; afterwards its stored file no longer exists, the attachment shows state `refused` with the actual size, it has no derived thoughts, and the orphan check lists it (verifies Round 1, Q5).
- **SC-014**: While an attachment is being finished, a second finish and a remove on the same attachment are each refused as busy and change nothing; once finishing completes, a repeat finish returns the existing outcome with no new derived thoughts, and the remove then succeeds (verifies Round 1, Q6).
- **SC-015**: A photo finished while the vision model was off is `not captioned`; after the model is back, finishing it again writes its caption thought. A `processed` photo rebuilt with a different configured vision model ends with exactly one caption thought, written by the new model (verifies Round 1, Q7).
- **SC-016**: After a PDF is processed, the core listing filtered to type `observation` shows none of its passages, the core stats count every passage under `reference`, and each passage carries the topics `attachment` and the file's base name (verifies Round 1, Q8).
- **SC-017**: With the default settings, an upload page opened 20 minutes after the AI created it accepts the photo; one opened 65 minutes after refuses it with a "link expired, ask your assistant for a new one" message, and that pending attachment appears in the orphan check (example times; verifies Round 1, Q9).
- **SC-018**: A `processed` photo whose rebuild fails because the vision model is unavailable still has exactly its old caption thought, still shows state `processed`, and reports the failed rebuild with its reason (verifies Round 2, Q1).
- **SC-019**: When a finishing run is killed before it completes (simulated), a finish before the busy mark expires is refused as busy; one after it expires proceeds, finds no derived thoughts left from the killed run, and completes the attachment (verifies Round 2, Q2).
- **SC-020**: Starting an attachment with note text and a declared HEIC photo saves no thought; starting one with note text whose link then expires, and removing it, leaves no trace of the note; the same with a second processed attachment on that note leaves the note in place (verifies Round 3, Q1).

## Assumptions

- The owner already has a working Open Brain; this integration adds a second connector next to the core one and shares the brain's access key.
- The brain's embedding model and vector size are known to the owner and set to match the core server (upstream default: a 1536-number model); the integration verifies this rather than choosing a model.
- Derived thoughts default to the sensitivity tier `personal` (the ingestion contract says escalate when unsure); the attach call may set a stricter tier.
- On spec 006's self-hosted stack the phone must be on the same network as the stack until secure remote access (fork issue #29) lands; on Supabase Cloud the phone works from anywhere.
- One file belongs to one parent thought; attaching the same file to another thought creates a second attachment record.
- The download link lifetime default (10 minutes) is short enough to limit leaks and long enough for a person to open it.
- Out of scope, tracked as fork issues: resumable or background processing for larger files (#26), OCR for scanned PDFs (#30), photo thumbnails (#31), and more kinds of thought so derived thoughts no longer crowd the owner's unfiltered recent listing (#32; the unfiltered listing showing derived thoughts is a known limitation of 007). Also out of scope: Word, spreadsheet and slide formats; HEIC conversion; editing attachments; a dashboard view.
- Upstream PR 533 and spec 004 are not needed; if upstream PR 533 merges first, nothing here changes.
- Supabase Cloud's per-request function limits are tight for large PDFs; the default limits are a starting point, to be confirmed by the planning measurement (SC-004).

## Verified Premises

- **VP-001**: The core connector's capture tool returns only a confirmation text (type, topics, people, actions), not the new thought's id (upstream `server/index.ts`, `capture_thought`, lines ~485–495 at `238df6c`).
- **VP-002**: The core connector's `search_thoughts` shows each match's similarity, capture date, type, topics, people, actions and content, but not its id or any other metadata; only the ChatGPT-style `search` tool returns ids (upstream `server/index.ts`, lines ~140 and ~255–278 at `238df6c`).
- **VP-003**: The core connector's `list_thoughts` lists the most recent thoughts with optional filters on `metadata.type`, topic, person and days, and `thought_stats` counts thoughts by type and topic (upstream `server/index.ts`, lines ~289–330 and ~366 at `238df6c`).
- **VP-004**: The base `upsert_thought` computes `content_fingerprint` from the trimmed, lower-cased, whitespace-collapsed content, and on a conflict anywhere in the `thoughts` table it merges the new metadata into the existing row instead of inserting (upstream `docs/01-getting-started.md`, `upsert_thought`, at `238df6c`).
