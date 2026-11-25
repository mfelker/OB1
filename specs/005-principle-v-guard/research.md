# Research: Principle V guard

## R1: Claude Code `PreToolUse` hook contract

Source: Claude Code hooks reference (`code.claude.com/docs/en/hooks`: common input fields, exit-code output, PreToolUse decision control, matchers) and the sub-agents page, checked 2026-11-25.

- **Input** (stdin JSON): `hook_event_name: "PreToolUse"`, `tool_name`, `tool_input`, `cwd`, `session_id`, `permission_mode`, `tool_use_id`; subagent calls add `agent_id`, `agent_type`. `Write` and `Edit` carry `tool_input.file_path` (absolute). `MultiEdit` and `NotebookEdit` field names are not documented in what was readable: read `file_path`, falling back to `notebook_path`, and confirm once with a stdin log (quickstart §4).
- **Deny**: exit 0 with `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"…"}}`. Claude sees the reason. (Exit 2 with the reason on stderr is equivalent; this feature uses the JSON form only.) Exit 0 with no output = no decision, normal flow.
- **Fail-open trap**: any other non-zero exit (including an uncaught exception, exit 1) is a *non-blocking* error and **the tool call proceeds**; a timed-out hook also does not block by default. So fail-closed (FR-011) needs the guard to catch every error, including failing to load its own library, and emit a JSON deny. The only uncovered case is `node` itself missing; the commit guard backstops it.
- **Wiring**: `.claude/settings.json` → `hooks.PreToolUse[]` → `{ matcher, hooks: [{ type: "command", command, timeout }] }`. A matcher of letters and `|` only is a list of exact tool names, so `Write|Edit|MultiEdit|NotebookEdit` matches exactly those four. `$CLAUDE_PROJECT_DIR` is the session's project root; quote it.
- **Subagents**: project settings hooks fire for subagent tool calls too, so grill-with-docs run through an agent is guarded.

## R2: Where the upstream path set comes from

- **Decision**: `git ls-tree -r -z --name-only upstream/main`, read per call. No cache.
- **Rationale**: the local `upstream/main` ref is what the owner already syncs before branching (constitution VII), so the guard agrees with the rest of the workflow. Reading it per call means a `git fetch upstream` takes effect immediately.
- **Alternatives**: a committed snapshot list (stale after every upstream sync, and a merge-conflict magnet); querying GitHub (network on every write, fails offline).

## R3: Which checkout a path belongs to

- **Decision**: resolve the path (realpath of the nearest existing ancestor, then append the rest), then `git -C <that dir> rev-parse --show-toplevel`. Branch and `MERGE_HEAD` are read from that top-level.
- **Rationale**: the session runs in the fork-main checkout but routinely writes into `.worktrees/<x>`, whose top-level and branch differ. Deciding by the session's working directory would block legitimate worktree writes (US1 AS4).
- **Alternatives**: string prefix checks on `.worktrees/` (misses symlinks and worktrees placed elsewhere).

## R4: Cost per agent write

- **Decision**: accept one `git ls-tree` (~2,000 entries) plus two `rev-parse` calls per guarded write.
- **Rationale**: tens of milliseconds locally; agent writes are not a hot loop. Measure in the quickstart; cache only if it is noticeable.

## R5: Fail-closed behavior

- **Decision**: an unreadable `upstream/main` denies everything except fork-only roots and zones (D7). A guard exception or malformed hook input denies with the error (FR-011).
- **Rationale**: a guard that silently allows on error stops guarding the first time a remote is renamed. Fork-only roots stay writable so the owner can still fix tooling.

## R6: Staged-change listing for the commit guard

- **Decision**: `git diff --cached --name-only -z --no-renames`, which lists additions, modifications and deletions, and both sides of a rename. Each path goes through `decide()` with the commit's own checkout state.
- **Rationale**: deleting or renaming an upstream file on fork main is as much a Principle V break as editing it.

## R7: Enabling the commit guard

- **Decision**: `git config core.hooksPath .fork/githooks`, documented in `.fork/README.md`. The repository had no active hooks in `.git/hooks`, so nothing is disabled.
- **Rationale**: versioned and reviewable, unlike `.git/hooks`. Git does not version the setting itself, so the runbook names the command (plan Complexity Tracking).
- **Alternatives**: a symlink in `.git/hooks` (unversioned, per clone anyway).

## R8: Detached HEAD, rebase, cherry-pick on main

- **Decision**: detached HEAD reports branch `HEAD`, so D2 allows it. Fork main is updated by merge, not rebase, so only `MERGE_HEAD` gets an explicit exception.
- **Rationale**: keeps the rule small; the commit guard still checks the final commit on `main`.
