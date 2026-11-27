---
feature: 008-stage-pr-521-auto-capture-hermes # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 22 # US1.1–3, US2.1–8, US3.1–3, US4.1–2 (16 scenarios) + SC-001–SC-006; 11 on the loop (US2, US3), the rest are process checks (see "Process acceptance")
planned_at: cddad8a # short SHA the list was derived from (fork main)
updated_at: 4675a03 # short SHA of the last change to this file
suite_baseline: green # empty: skills/auto-capture-hermes has no tests at b9cbd68 (`no-tests`, adapter exit 0)
---

# Test List: Stage upstream PR #521 (auto-capture Hermes adapter)

## How reds are recorded on this feature

Staged lane, but PR #521 only **adds** files. At the PR base (`238df6c`) `capture-hermes-session.mjs` does not exist, so the base-red procedure can only produce "file not found", which rubric S3 rejects as an invalid red. **The owner decided on 2026-11-27 to accept `TEST_AFTER` and change no fork rules** (plan Complexity Tracking, research R3).

Each cycle therefore records:

- **red**: `none possible: add-only PR (plan Complexity Tracking)`, plus, where cheap, a *detection check*: the test run against a temporary, uncommitted mutant of the author's file that removes the behavior, with its failure line. This is a worthless-test guard only, and does not claim S1. Restore with `git checkout HEAD -- skills/auto-capture-hermes/capture-hermes-session.mjs`, then confirm `git status --short --untracked-files=no` is empty.
- **green**: the single-test command at the head.

The author's four files are never edited or committed (plan, research R9). A behavior that exposes a defect stays on the list with its test marked `{ todo: '<defect>' }`, state `BLOCKED` with the defect named, and an entry in `evidence/defects.md`.

All tests are in `skills/auto-capture-hermes/capture-hermes-session.test.mjs`. They drive the real entry point (the script run as a child process with a constructed environment, research R5) against a synthetic `state.db` (R4) and a loopback ingest stand-in (R7). Acceptance behaviors live in `describe('acceptance')` and are named by id (`A1 …`); unit behaviors are named `U<n> …`.

## Invariants recorded for this list

These are not FRs in `spec.md`; each is recorded here with its source so its behaviors trace to something.

- **INV-1** A transcript cannot close the `<thought_content>` wrapper early. Source: data-model.md § Capture payload `text` (the body is one `<thought_content>` block); the author's code escapes the tag for exactly this reason.
- **INV-2** Every invocation exits 0 and, in hook mode, prints the no-op `{}`, whatever happens. Source: spec US2.8 ("must never break a Hermes session"), contracts/capture-cli.md ("Every mode exits with status 0").
- **INV-3** Hooks capture a session at most once, and only on `on_session_end` / `on_session_finalize`. Source: spec US3 ("a capture is not lost and is not ingested twice"), research R8, contracts/capture-cli.md hook rows.

## Outer loop: acceptance behaviors

One per automatable acceptance scenario (US2, US3). US1 and US4 are checked by tasks; see "Process acceptance".

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1  | A session with 3 real user turns, run with `--dry-run --session <id>`, prints one JSON payload whose `text` holds the user and assistant turns in order, with `source_label` `hermes:<project>` and an `import_key`, while a configured ingest stand-in receives 0 requests | US2.1, FR-013 | example | DONE | `capture-hermes-session.test.mjs::A1 dry-run prints one payload with the turns, label and key, and sends nothing` |
| A2  | Tool-call-only assistant steps and compaction summaries in the session are absent from the printed capture | US2.2, FR-008 | example | DONE | `capture-hermes-session.test.mjs::A2 tool-call-only steps and compaction summaries are absent from the capture` |
| A3  | A `[Cronjob …]` message is kept in the capture as `[user:cron]`, and the header's `Turns:` counts only the real user turns | US2.3, FR-009 | example | DONE | `capture-hermes-session.test.mjs::A3 a cron message is kept as user:cron and not counted as a user turn` |
| A4  | A session with fewer real user turns than the threshold prints no payload and logs `skipped:too_short` | US2.4, FR-010 | example | DONE | `capture-hermes-session.test.mjs::A4 a session below the user-turn threshold is not captured` |
| A5  | A subagent session prints no payload and logs `skipped:subagent` | US2.5, FR-010 | example | DONE | `capture-hermes-session.test.mjs::A5 a subagent session is not captured` |
| A6  | A transcript longer than the size limit gives `text` within the limit that still contains the first and the last turn | US2.6, FR-011 | example | DONE | `capture-hermes-session.test.mjs::A6 an over-limit transcript fits the limit and keeps the first and last turns` |
| A7  | Two runs on the same session give the same `import_key` | US2.7, FR-012 | example | DONE | `capture-hermes-session.test.mjs::A7 two runs on the same session give the same import key` |
| A8  | With no address and no key configured, a non-dry run exits 0, logs `error:missing_env`, and a running stand-in receives 0 requests | US2.8, FR-014 | example | DONE | `capture-hermes-session.test.mjs::A8 with no address and no key nothing is sent and the run exits 0` |
| A9  | With the stand-in answering 200, a capture sends exactly one request carrying the access key and the same payload a dry-run prints, and logs `captured:<job id>` | US3.1, FR-015 | example | DONE | `capture-hermes-session.test.mjs::A9 a successful capture sends one request with the key and the dry-run payload` |
| A10 | With the stand-in answering 503, the payload lands in the retry queue; the next capture resends it before sending its own, and the queue ends empty | US3.2, FR-015 | example | DONE | `capture-hermes-session.test.mjs::A10 a temporary failure is queued and resent before the next capture` |
| A11 | With the stand-in answering 401, nothing is queued and the log records the failure as permanent | US3.3, FR-015 | example | DONE | `capture-hermes-session.test.mjs::A11 a permanent failure is not queued and is logged as permanent` |

## Inner loop: unit behaviors

### `skills/auto-capture-hermes/capture-hermes-session.mjs`: turn rules

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U1  | An assistant row with empty content contributes nothing to the capture | FR-008 | example | DONE | `capture-hermes-session.test.mjs::U1 an assistant row with empty content contributes nothing` |
| U2  | A row with `_compressed_summary = 1` contributes nothing to the capture | FR-008 | example | DONE | `capture-hermes-session.test.mjs::U2 a compaction summary row contributes nothing` |
| U3  | `tool` and `session_meta` rows contribute nothing to the capture | FR-008 | example | DONE | `capture-hermes-session.test.mjs::U3 tool and session_meta rows contribute nothing` |
| U4  | Turns follow row insertion order, even when their timestamps are out of order | FR-008 | example | DONE | `capture-hermes-session.test.mjs::U4 turns follow insertion order even when timestamps run backwards` |
| U5  | A message whose content is a JSON array of typed parts appears as the concatenation of its text parts | FR-008 | example | DONE | `capture-hermes-session.test.mjs::U5 a JSON array of typed parts appears as its text parts joined` |
| U6  | A user message that mentions `[Cronjob` but doesn't start with it is a real user turn (labelled `[user]`, counted) | FR-009 | example | DONE | `capture-hermes-session.test.mjs::U6 a user message mentioning [Cronjob mid-text is a real user turn` |

### `capture-hermes-session.mjs`: capture thresholds and skips

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U7  | Exactly 3 real user turns (the default threshold) is captured | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U7 exactly three real user turns is captured` |
| U8  | 2 real user turns plus 1 cron turn is skipped as `skipped:too_short` | FR-009, FR-010 | example | DONE | `capture-hermes-session.test.mjs::U8 two real user turns plus a cron turn is skipped as too short` |
| U9  | With `OB_CAPTURE_MIN_USER_TURNS=1`, a 1-turn session is captured | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U9 OB_CAPTURE_MIN_USER_TURNS=1 captures a one-turn session` |
| U10 | A session with `parent_session_id` set is skipped as `skipped:subagent` | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U10 a session with a parent is skipped and nothing is sent` |
| U11 | A title starting with `Subagent:` is skipped as `skipped:subagent` | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U11 a title starting with Subagent: is skipped and nothing is sent` |
| U12 | A title that contains `Subagent:` later in the text is captured | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U12 a title containing Subagent: later in the text is captured` |
| U13 | `--latest` picks the newest top-level session when a newer subagent session exists | FR-010 | example | DONE | `capture-hermes-session.test.mjs::U13 --latest picks the newest top-level session over a newer subagent` |

### `capture-hermes-session.mjs`: payload

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U14 | The header names the project as the basename of the session's `cwd`, the session id, `Source: hermes:<source>` and the title | US2.1 | example | DONE | `capture-hermes-session.test.mjs::U14 the header names project, session, source and title` |
| U15 | A literal `<thought_content>` or `</thought_content>` inside a turn appears escaped, so the body has exactly one opening and one closing tag | INV-1 | example | DONE | `capture-hermes-session.test.mjs::U15 a literal thought_content tag inside a turn is escaped` |
| U16 | A transcript that fits the limit is sent whole, with no truncation marker | FR-011 | example | DONE | `capture-hermes-session.test.mjs::U16 a transcript within the limit is sent whole without a marker` |
| U17 | An over-limit transcript carries the truncation marker between the kept start and end | FR-011 | example | DONE | `capture-hermes-session.test.mjs::U17 an over-limit transcript has the marker between the kept start and end` |
| U18 | `import_key` has the form `hermes:<session id>:<8 lowercase hex>` | FR-012 | example | DONE | `capture-hermes-session.test.mjs::U18 import_key has the form hermes:<session id>:<8 hex>` |
| U19 | Changing one message's content changes `import_key` | FR-012 | example | DONE | `capture-hermes-session.test.mjs::U19 changing one message changes the import key` |

### `capture-hermes-session.mjs`: configuration, dry-run and lookup

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U20 | A dry-run writes no session state file | FR-013 | example | DONE | `capture-hermes-session.test.mjs::U20 a dry-run writes no session state` |
| U21 | Address set but key missing: `error:missing_env`, 0 requests | FR-014 | example | DONE | `capture-hermes-session.test.mjs::U21 an address without a key sends nothing` |
| U22 | Key set but address missing: `error:missing_env`, 0 requests | FR-014 | example | DONE | `capture-hermes-session.test.mjs::U22 a key without an address sends nothing` |
| U23 | Address and key present only in `<OB_CAPTURE_ROOT>/.env.local` are used: 1 request with that key | FR-014 | example | DONE | `capture-hermes-session.test.mjs::U23 address and key from .env.local are used` |
| U24 | `--session` with an unknown id exits 0 and logs `skipped:no_session` | INV-2 | example | DONE | `capture-hermes-session.test.mjs::U24 an unknown session id exits 0 and is logged` |

### `capture-hermes-session.mjs`: delivery and retry queue

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U25 | An address with a trailing slash still posts to `/functions/v1/open-brain-rest/ingest` | US3.1 | example | DONE | `capture-hermes-session.test.mjs::U25 an address with a trailing slash still posts to the ingest path` |
| U26 | A 2xx answer whose body is not JSON is logged `captured:unknown` | US3.1 | example | DONE | `capture-hermes-session.test.mjs::U26 a 2xx answer with a non-JSON body is logged captured:unknown` |
| U27 | A 429 answer queues the payload | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U27 a 429 answer queues the payload` |
| U28 | A 500 answer queues the payload | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U28 a 500 answer queues the payload` |
| U29 | A 400 answer does not queue the payload and is logged permanent | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U29 a 400 answer is not queued and is logged as permanent` |
| U30 | A refused connection (closed loopback port) exits 0 and queues the payload | FR-015, INV-2 | example | DONE | `capture-hermes-session.test.mjs::U30 a refused connection exits 0 and queues the payload` |
| U31 | A queued entry with `attempt_count: 3` that fails again with 503 stays queued with `attempt_count: 4` | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U31 a queued entry failing a fourth time stays queued with attempt_count 4` |
| U32 | A queued entry with `attempt_count: 4` that fails again with 503 moves to `dead/` | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U32 a queued entry failing a fifth time moves to dead/` |
| U33 | A queued entry answered with 401 moves to `dead/` | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U33 a queued entry answered with 401 moves to dead/` |
| U34 | With 4 queued entries and the stand-in answering 200, one run resends the 3 oldest and leaves the newest queued | FR-015 | example | DONE | `capture-hermes-session.test.mjs::U34 one run resends the three oldest queued entries and keeps the newest` |

### `capture-hermes-session.mjs`: hook mode

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| U35 | Hook stdin without `session_id` logs `skipped:no_session_id:<event>`, prints `{}`, exits 0 | INV-2 | example | DONE | `capture-hermes-session.test.mjs::U35 a hook payload without session_id is skipped with the no-op reply` |
| U36 | Hook event `on_tool_call` logs `skipped:event_on_tool_call`, prints `{}`, sends nothing | INV-3 | example | DONE | `capture-hermes-session.test.mjs::U36 a hook event other than session end is skipped and sends nothing` |
| U37 | Unparseable hook stdin exits 0 and prints `{}` | INV-2 | example | DONE | `capture-hermes-session.test.mjs::U37 unparseable hook stdin exits 0 with the no-op reply` |
| U38 | `on_session_finalize` with `OB_CAPTURE_SYNC=1` sends 1 request and leaves session state with `captured_at` and `ingest_ref` | INV-3 | example | DONE | `capture-hermes-session.test.mjs::U38 on_session_finalize captures once and records it in session state` |
| U39 | A second hook fire after a capture logs `skipped:already_captured` and sends nothing more | INV-3 | example | DONE | `capture-hermes-session.test.mjs::U39 a hook fire after a capture is skipped and sends nothing more` |
| U40 | Two quick `on_session_end` fires with `OB_CAPTURE_DEBOUNCE_MS=300` give one `skipped:superseded`, one capture, and exactly 1 request | INV-3 | example | DONE | `capture-hermes-session.test.mjs::U40 two quick on_session_end fires are captured once` |

## Process acceptance (checked by tasks, not on the loop)

These criteria concern branches, history and records, not adapter behavior. Each is checked by a command in quickstart.md, run by the task named.

| criterion | check | task |
| --------- | ----- | ---- |
| US1.1, SC-001 author's 4 files byte-identical to `b9cbd68` on fork `main` | quickstart §0 (before), §5 (after) | T025, T034 |
| US1.2, SC-002 author's 3 commits reachable with original SHAs, joined by a merge commit | quickstart §5 | T033, T034 |
| US1.3, SC-001 nothing outside `skills/auto-capture-hermes/` changed | quickstart §0, §5; fork PR file list | T025, T032, T034 |
| SC-003 every behavior has a test; all pass at the head | this list all `DONE` (or `BLOCKED` with a defect) | T017, T024, T039, T040 |
| SC-004 suite < 30 s, 0 credentials, 0 off-machine requests | quickstart §1 (`env -i`) | T017, T024 |
| SC-005 fork-ci strict `pass`; upstream gate has no scope violation | quickstart §2, §4 | T026, T028, T031 |
| US4.1, SC-006 one ledger row for #521 | `.fork/staged-prs.md` | T035 |
| US4.2 tests offered on #521 | upstream comment link | T036 |

## Invariants and edge cases still to place

None.

## Out of scope

- Wall-clock defaults (120 s debounce, 5 s finalize delay, hard timeouts): would break SC-004; supersession (U40) covers the logic with short delays (research R8).
- The `sqlite3` CLI fallback: CI and the owner run Node 26, where `node:sqlite` is always present, so the fallback can't be reached without editing the author's script. The test-support builder still falls back to the CLI to *build* fixtures (R4).
- Session-id prefix matching for `--session`: a lookup convenience with no requirement behind it. Tests use full ids.
- Header lines for profile, git branch and end reason: formatting with no requirement behind it beyond U14's fields.
- README/SKILL wording and markdown style: documentation gates (T028), not unit tests.
- PR #515 (Codex/Grok adapters): a separate staged feature if staged (spec Edge Cases).
- A live capture against a real Hermes install: optional evidence (T038), not on the loop.

## Verification commands

Copied verbatim from `.specify/memory/tdd-profile.md` at planning time:

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}`
- Full suite: `node .fork/ci/bin/tdd.mjs suite`
- Coverage: none (`coverage: null`)
- Mutation: none (`mutation: null`); the audit uses deliberate mutants

For this feature `{file}` is `capture-hermes-session.test.mjs` (resolved against the folder `skills/auto-capture-hermes` in the worktree). `.specify/feature.json` must point at `specs/008-stage-pr-521-auto-capture-hermes`; check with `node .fork/ci/bin/tdd.mjs where` (`feature=` in every summary line).
