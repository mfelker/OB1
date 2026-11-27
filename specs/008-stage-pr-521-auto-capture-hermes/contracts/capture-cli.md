# Contract: `capture-hermes-session.mjs` invocation → observable outcome

This contract describes the author's adapter as written at `b9cbd68`. The fork tests check it and do not change it. Every mode exits with status **0**, whatever the outcome: the adapter must never fail a Hermes hook.

## Inputs

| Input | Meaning |
|---|---|
| `--session <id or prefix>` | capture that session now |
| `--latest` | capture the most recent top-level session with at least one user message |
| `--dry-run` or `OB_CAPTURE_DRY_RUN=1` | print the payload as JSON on stdout; send nothing; write no session state |
| stdin JSON (no flag) | hook mode: `{ hook_event_name, session_id, cwd?, profile?, extra?: { platform? } }` |
| `HERMES_HOME`, `OB_HERMES_STATE_DB` | where the session store is |
| `OB_CAPTURE_ROOT` | where `.env.local`, `logs/`, `state/` and `data/` live |
| `SUPABASE_URL`, `MCP_ACCESS_KEY` | Open Brain address and key; `.env.local` values take precedence over the environment |
| `OB_CAPTURE_MIN_USER_TURNS` (3), `OB_CAPTURE_MAX_CHARS` (24000) | thresholds |
| `OB_CAPTURE_SYNC=1`, `OB_CAPTURE_DEBOUNCE_MS` (120000), `OB_CAPTURE_FINALIZE_DELAY_MS` (5000) | hook scheduling |

## Outcomes (log disposition)

| Situation | Disposition | Request sent |
|---|---|---|
| dry-run of a capturable session | `dry_run:chars_<n>`; payload on stdout | no |
| no matching session | `skipped:no_session` | no |
| subagent session | `skipped:subagent` | no |
| fewer real user turns than the threshold | `skipped:too_short` | no |
| address or key missing | `error:missing_env` | no |
| endpoint answers 2xx | `captured:<job_id \| thought_id \| id \| unknown>` | yes, 1 |
| endpoint answers ≥ 500 or 429, or connection fails | `error:fetch:…`; payload queued | yes |
| endpoint answers another 4xx | `error:HTTP <status>…:permanent`; not queued | yes |
| hook: missing `session_id` | `skipped:no_session_id:<event>`; stdout `{}` | no |
| hook: event other than `on_session_end` / `on_session_finalize` | `skipped:event_<event>`; stdout `{}` | no |
| hook: session already captured | `skipped:already_captured`; stdout `{}` | no |
| hook with a delay: scheduled | `scheduled:<event>:delay_<ms>ms`; stdout `{}` | later, by the worker |
| worker whose token was replaced by a newer fire | `skipped:superseded` | no |

## Payload

Shape and rules: [data-model.md § Capture payload](../data-model.md#capture-payload-output).
