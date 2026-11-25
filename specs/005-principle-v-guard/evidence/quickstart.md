# Quickstart evidence (T022, T028)

Run on the fork-`main` checkout after PR #19 merged (`bb41dd4`), with `git config core.hooksPath .fork/githooks` set (T027, commit `4272c7a`).

## §1 Suite

`node --test .fork/ci/test/` on `main` → 201 passed, 0 failed. CI `self-test` on PR #19 head `f321fd5` (Linux) → pass.

## §2 Agent guard by hand

Run by stream G in a temp repo on `main` with an `upstream/main` ref (cycle log, stream guard notes): the `docs/domain_knowledge/CONTEXT.md` Write printed the deny naming `.fork/domain-knowledge/`, exit 0; an Edit of `.fork/README.md` printed nothing, exit 0; `not json` printed a deny starting `principle-v-guard failed:`, exit 0.

## §3 Commit guard on the real fork main

- A fork-only commit (`specs/005-principle-v-guard/plan.md`, commit `4272c7a`) went through the guard: exit 0.
- Staging a change to `CODE_OF_CONDUCT.md` and committing was refused, exit 1:

  ```text
  principle-v-guard: commit refused (constitution Principle V)
    CODE_OF_CONDUCT.md: constitution Principle V reserves this path for upstream (file exists in upstream/main). Make this change in an upstream-bound worktree (contrib/mfelker/<desc> from upstream/main) or a staged PR, not on fork main.
  Bypass deliberately with git commit --no-verify.
  ```

  The probe was unstaged and reverted; the working tree was clean afterwards.

## §4 Live Claude Code check

In the live Claude Code session on the fork-`main` checkout (the session picked up the merged `.claude/settings.json`), the agent's `Write` to `docs/domain_knowledge/CONTEXT.md` was refused by the hook:

```text
PreToolUse:Write hook error: docs/domain_knowledge/CONTEXT.md: constitution Principle V reserves this path for upstream (inside upstream folder docs/). Write fork knowledge to .fork/domain-knowledge/ instead (the knowledge root for /speckit-grill-with-docs, see .fork/README.md).
```

No file was created (`docs/domain_knowledge/` does not exist; `git status` clean). This confirms the `Write` input field (`tool_input.file_path`) live.

Not yet observed live: `MultiEdit` and `NotebookEdit` payloads (research R1). The guard reads `file_path` with a `notebook_path` fallback (U22); confirm the first time either tool is used on an upstream path.

## §5 Cost

~60 ms per allowed agent write (five runs: 0.05–0.07 s), measured at T022.
