# Contract: the guard CLI (`.fork/ci/bin/principle-v-guard.mjs`)

One CLI, two modes. Both resolve each path with `repoRelative()`, read `checkoutState()` and `upstreamPaths()` for that path's checkout, and call `decide()` ([rule.md](rule.md)).

## `--hook` (agent guard, FR-007, FR-011)

- **Input**: one Claude Code `PreToolUse` JSON object on stdin (research R1). Target path = `tool_input.file_path ?? tool_input.notebook_path`, resolved against `cwd` when relative.
- **Output, always exit 0**:
  - allowed → no output (normal permission flow continues).
  - denied → `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"<reason> <suggestion>"}}`.
  - guard failure (unparseable stdin, no target path on a matched tool, library load failure, any exception) → the same deny shape with reason `principle-v-guard failed: <message>. The write was refused; fix the guard or run it by hand: node .fork/ci/bin/principle-v-guard.mjs --hook`.
- The library is loaded with a dynamic `import()` inside the top-level `try`, so even a broken `lib/principle-v.mjs` produces a deny, not a crash (a crash would let the write through, R1).

## `--staged` (commit guard, FR-008)

- **Input**: none; runs in the current repository. Paths from `git diff --cached --name-only -z --no-renames` (R6).
- **Output**:
  - every path allowed → exit 0, no output.
  - any path denied → exit 1; stderr lists one line per denied path (indented two spaces), `<reason> <suggestion>` (the reason already starts with `<relPath>:`), after a header `principle-v-guard: commit refused (constitution Principle V)`, and ends with `Bypass deliberately with git commit --no-verify.`
  - guard failure → exit 1 with `principle-v-guard failed: <message>`.

## Wiring

| File | Content |
|------|---------|
| `.claude/settings.json` | `hooks.PreToolUse`: matcher `Write\|Edit\|MultiEdit\|NotebookEdit`, one `command` hook: `node "$CLAUDE_PROJECT_DIR/.fork/ci/bin/principle-v-guard.mjs" --hook`, `timeout: 30` |
| `.fork/githooks/pre-commit` | `#!/bin/sh` + `exec node "$(git rev-parse --show-toplevel)/.fork/ci/bin/principle-v-guard.mjs" --staged`; executable |
| enablement | `git config core.hooksPath .fork/githooks` (R7), documented in `.fork/README.md` |

## Self-test trigger

`.fork/ci/lib/self-test-needed.mjs` also fires for `.fork/githooks/` and `.claude/settings.json`, so CI re-runs the suite when either changes.
