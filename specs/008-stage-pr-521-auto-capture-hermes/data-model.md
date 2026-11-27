# Data Model: Stage upstream PR #521

No Open Brain data changes. The entities below are what the adapter reads and writes, and what the tests build or inspect. All file locations are relative to `OB_CAPTURE_ROOT` unless stated otherwise.

## Hermes session store (input, read-only; synthetic in tests)

`state.db` at `OB_HERMES_STATE_DB`, otherwise `<HERMES_HOME>/state.db`.

- **sessions**: `id` (text, primary key; matched exactly or by prefix), `source`, `created_source`, `profile_name`, `parent_session_id` (non-null means subagent), `title` (`Subagent:` prefix means subagent), `model`, `cwd` (its basename is the project name), `git_branch`, `started_at` / `ended_at` / `last_activity_at` (epoch seconds), `end_reason`, `message_count`.
- **messages**: `id` (integer, defines order), `session_id`, `role` (`user` | `assistant` | `tool` | `session_meta`), `content` (plain text or a JSON array of typed parts), `timestamp`, `_compressed_summary` (1 = compaction summary, excluded).

**Turn rules**: keep `user` and `assistant` rows with non-empty text, in `id` order. A `user` row starting with `[Cronjob` is labelled `cron` and doesn't count as a user turn.

## Capture payload (output)

| Field | Value |
|---|---|
| `text` | header (`Hermes Agent Session Transcript`, Project, Session, Source, optional Profile/Title/Branch, Date, optional Ended, `Turns: <real user turns>`, `---`) + `<thought_content>` block of `[role]` / `[user:cron]` turns; total ≤ `OB_CAPTURE_MAX_CHARS` (default 24000), middle trimmed with a marker |
| `source_label` | `hermes:<project>` |
| `source_type` | `hermes_ambient` |
| `auto_execute` | `true` |
| `import_key` | `hermes:<session id>:<first 8 hex of sha256(text)>` |

## Session state (per session, written outside dry-run)

`state/sessions/<safe session id>.json`: `session_id`, `token` (newest hook fire wins), `last_event`, `platform`, `cwd`, `profile`, `hermes_home`, `updated_at`; after a successful send also `project_name`, `captured_at`, `captured_token`, `ingest_ref`, `user_turns`.

**States**: none → scheduled (`token` set) → captured (`captured_at` set). A later hook fire for a captured session is skipped (`already_captured`). A worker whose `token` is no longer current is skipped (`superseded`).

## Retry queue entry

`data/capture-retry-queue/<ms>-<safe session id>.json`: `payload`, `failed_at`, `error`, `attempt_count`. Created on a temporary failure (status ≥ 500, 429, timeout, connection error). Up to 3 entries are re-sent before each new send. An entry is deleted on success and moved to `dead/` on a permanent failure or after 5 attempts.

## Capture log line

`logs/ambient-capture-hermes.log`: `<ISO time> session=<id> project=<name> turns=<n> disposition=<d>`. The dispositions the tests use are listed in [contracts/capture-cli.md](contracts/capture-cli.md).

## Ledger row (fork `main`, `.fork/staged-prs.md`)

| PR | Kind | Title | Spec | Head SHA | Fork test commit(s) | Merged into fork | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| #521 | staged | [skills] Add auto-capture-hermes adapter | `specs/008-stage-pr-521-auto-capture-hermes/` | `b9cbd68fb989` (or later staged head) | the test commit SHAs | date via fork PR (merge SHA) | `staged` | `TEST_AFTER` by owner decision; any defects reported on #521 |
