# Smoke check: the mandatory hook drives the loop (T030; A7, A8, A9)

Run from the fork-`main` checkout `/Users/mfelker/Projects/ob1` at `9c31c00`, after PR #16 merged (`6a4e195`).
Throwaway feature `specs/990-tdd-smoke/` (one behavior, `sum(a, b)`), plan Lane fork, Worktree `/Users/mfelker/Projects/ob1/.worktrees/tdd-smoke` (branch `fork/tdd-smoke` from `main`), Contribution folder `.fork/smoke-sandbox` (new). `.specify/feature.json` pointed at it.

## Target check

`node .fork/ci/bin/tdd.mjs where` → `featureDir …/specs/990-tdd-smoke`, `lane fork`, `tree …/.worktrees/tdd-smoke`, `folder .fork/smoke-sandbox`, `folderExists false`.
`node .fork/ci/bin/tdd.mjs suite` → `[tdd] suite feature=specs/990-tdd-smoke folder=.fork/smoke-sandbox → empty baseline: folder does not exist yet`, exit 0 (FR-017).

## A8: `/speckit-implement` with no test list stops

- `/speckit-implement` read `.specify/extensions.yml` `hooks.before_implement`: `tdd` / `speckit.tdd.run`, `enabled: true`, `optional: false`, `condition: null`. It emitted the Automatic Pre-Hook block and invoked `/speckit-tdd-run`.
- `speckit-tdd-run` Phase 0: profile present; `check_prerequisites.py --json --paths-only` → `FEATURE_DIR /Users/mfelker/Projects/ob1/specs/990-tdd-smoke`; `ls specs/990-tdd-smoke/tdd/test-list.md` → `No such file or directory`. The hook stopped with "run `/speckit-tdd-plan` first; the implementation phase must not continue until the list exists".
- `/speckit-implement` did not proceed: the smoke worktree stayed clean, `.fork/smoke-sandbox` was not created, and `tasks.md` has 0 ticked tasks.
- Result: **A8 observed.**

## A7 and A9: with a one-behavior test list, the hook drives the loop first

- `/speckit-tdd-plan` (skill loaded from the installed extension) wrote `specs/990-tdd-smoke/tdd/test-list.md` (`loop: inside-out`, U1 `sum(2, 3)` returns `5`, traces US1 AS1, FR-001, SC-001), the baseline-only `tdd/cycle-log.md`, and put `[U1]` on T001 and T002 in `tasks.md`.
- `/speckit-implement` re-run: the mandatory `before_implement` hook invoked `/speckit-tdd-run` (`all`). Preflight passed (list present, suite green on the empty baseline, smoke worktree clean). One cycle:
  - red: `node .fork/ci/bin/tdd.mjs single .fork/smoke-sandbox/sum.test.mjs "U1 sum(a, b) returns a + b"` -> `actual: undefined,` / `expected: 5,`, `tests=1 pass=0 fail=1 → fail`, exit 1 (an empty `sum` declaration let the import resolve).
  - green: `sum` returns `a + b`; `tdd.mjs suite` -> `tests=1 pass=1 fail=0 → pass`.
  - refactor: none needed. Commit `9ff5bd4` on `fork/tdd-smoke` (test and implementation together).
  - The hook appended the cycle entry to `tdd/cycle-log.md` with the test, the red command, the failure line, the green, the refactor and the commit SHA; set U1 `DONE`; ticked T001 and T002 through their `[U1]` markers.
- `/speckit-implement` then found 0 open tasks and no checklists, so it implemented nothing after the hook: no code was written test-after. `after_implement` listed the optional `/speckit-tdd-verify` hook (not run; throwaway feature).
- Result: **A7 observed** (the behavior went through the loop before anything else). **A9 observed** (the cycle log records test, red command, failure line, green and commit).
- Side observations: a test name with regex metacharacters (`(`, `)`, `+`) matched exactly one test through the profile's `single` string (`tests=1`), confirming U14's escaping on a real run; `suite` printed U37's counts.

## Cleanup

The throwaway spec `specs/990-tdd-smoke/`, the worktree `.worktrees/tdd-smoke` and the branch `fork/tdd-smoke` were deleted after this record was written, and `.specify/feature.json` was restored to `specs/003-tdd-extension` (confirmed with `tdd.mjs where`). Their content as run is reproduced above.
