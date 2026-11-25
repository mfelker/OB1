---

description: "Tasks for the Principle V guard (spec 005), structured for parallel Sonnet-class stream agents"
---

# Tasks: Principle V guard for the fork-main checkout

**Input**: Design documents from `specs/005-principle-v-guard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rule.md, contracts/guards.md, quickstart.md

**Tests**: MANDATORY (constitution Principle IV, fork lane: red-green-refactor). This feature runs through the installed spec-kit-tdd loop:

- After this file is written, the `after_tasks` hook (`tdd.plan`) writes `tdd/test-list.md` and adds the `[U#]`/`[A#]` behavior markers to these tasks. Never tick a marked task by hand; the integrator ticks it when all its behaviors are `DONE`.
- One behavior per cycle. Write the test first, **observe it fail** for the right reason, record the decisive failure line, then the smallest change to green, then the full `node --test .fork/ci/test/`, then refactor.
- Never commit on red. Commit at green, test and implementation together, one cycle per commit. Never weaken a test.
- Stream agents run tests with `node --test` directly in their own worktree (single: `--test-name-pattern="^<id> "`; full: `node --test .fork/ci/test/`). Do not use `tdd.mjs` there: it resolves 005's plan Worktree, which is `W`, not the stream's tree. The integrator uses the profile commands in `W`.
- A test that passes on its first run is checked with a deliberate mutant (the playbook rule) and recorded as such.

**Single writers**: during the streams, only the integrator (the main session) edits `tasks.md`, `tdd/test-list.md` and `tdd/cycle-log.md`. Each stream appends its cycle entries to `specs/005-principle-v-guard/tdd/cycle-log.d/<stream>.md` in its own worktree and reports which behaviors are `DONE`.

**Stream agents**: each stream is one Sonnet-class subagent (`Agent` with `model: "sonnet"`), briefed with its worktree, branch, task IDs, the rules above, the single-writer rule, and the contract and data-model sections it needs. A stream touches only the files its tasks name.

## Path Conventions

- `M` = `/Users/mfelker/Projects/ob1`: the fork-`main` checkout. Every `/speckit-*` command runs here.
- `W` = `/Users/mfelker/Projects/ob1/.worktrees/fork-principle-v-guard`: the integration worktree on `fork/principle-v-guard` (the plan's **Worktree**).
- `WR`, `WP`, `WW`, `WG` = `/Users/mfelker/Projects/ob1/.worktrees/fork-pvg-{rule,paths,wiring,guard}`: stream worktrees on branches `fork/principle-v-guard-{rule,paths,wiring,guard}`, cut from `fork/principle-v-guard`.
- Source paths below are relative to the stream's worktree root.

## Streams and file ownership

| Stream | Worktree | Starts | Owns (and only these) |
|--------|----------|--------|------------------------|
| R (rule) | `WR` | wave 1 | `.fork/ci/lib/principle-v.mjs`, `.fork/ci/test/principle-v.test.mjs`, `tdd/cycle-log.d/rule.md` |
| P (paths) | `WP` | wave 1 | `.fork/ci/lib/principle-v-paths.mjs`, `.fork/ci/test/principle-v-paths.test.mjs`, `tdd/cycle-log.d/paths.md` |
| W (wiring, docs) | `WW` | wave 1 | `.fork/ci/lib/self-test-needed.mjs`, `.fork/ci/test/self-test-needed.test.mjs`, `.fork/ci/test/principle-v-docs.test.mjs`, `.claude/settings.json`, `.fork/githooks/pre-commit`, `.fork/README.md`, `.fork/ci/README.md`, `tdd/cycle-log.d/wiring.md` |
| G (guard CLI) | `WG` | wave 2, after R, P and W are merged into `fork/principle-v-guard` | `.fork/ci/bin/principle-v-guard.mjs`, `.fork/ci/test/principle-v-guard.test.mjs`, `.fork/ci/test/principle-v-guard.acceptance.test.mjs` (only to flip `todo` → `test`), `tdd/cycle-log.d/guard.md` |

Wave 1 runs three agents at once (R, P, W). G needs the merged `decide()` and helper interfaces, so it runs alone in wave 2.

---

## Phase 1: Setup (integrator, in `M` then `W`)

- [X] T001 In `M`, run the `after_tasks` hook `/speckit-tdd-plan` on 005: it writes `specs/005-principle-v-guard/tdd/test-list.md` and the baseline-only `tdd/cycle-log.md`, and adds behavior markers to this file. Commit on fork `main`.
- [X] T002 Fast-forward `W` to fork `main` (`git -C W merge --ff-only main`) so the integration branch carries spec, plan, tasks and test list. From here on, 005's artifacts change only in `W` (single writer).
- [X] T003 In `W`, create `specs/005-principle-v-guard/tdd/cycle-log.d/.gitkeep` and commit. Then create the three wave-1 worktrees from `M`: `git worktree add .worktrees/fork-pvg-<s> -b fork/principle-v-guard-<s> fork/principle-v-guard` for `s` ∈ {rule, paths, wiring}.

- [X] T029 [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] Outer loop first: in `W`, write `.fork/ci/test/principle-v-guard.acceptance.test.mjs` with A1–A9 as `node:test` `todo` tests (one per behavior, asserting the full observable result through the real entry points: the `.claude/settings.json` command string for A1–A5, a real `git commit` through a copy of `.fork/githooks/` for A6–A9, temp repos with an `upstream/main` ref via `git-fixture.mjs`). Run the file, record each red (`✖ … # TODO` with its failure line) in `tdd/cycle-log.md`, confirm the full suite still passes, and commit. Stream G flips each `todo` to `test` in the commit that turns it green.

**Checkpoint**: test list committed, integration branch current, acceptance tests committed as recorded reds, wave-1 worktrees exist.

---

## Phase 2: Foundational (wave 1, streams R and P in parallel)

**Purpose**: the rule and its I/O helpers. Both guards (US1, US2) call them.

### Stream R: the rule (`WR`)

- [X] T004 [P] [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] Tests first in `.fork/ci/test/principle-v.test.mjs`, then `decide()` in `.fork/ci/lib/principle-v.mjs`, one cycle per decision-table row of contracts/rule.md (D1–D9, first match wins), covering data-model.md `Decision.allowed` and `Decision.rule`. Start from a stub `decide()` that returns a deny, and run the cycles in test-list order (U1→U9) so every test is red first. Include: an exact upstream file inside a fork-only zone is denied (D4 before D6); `upstream: null` still allows fork-only roots and zones (D5, D6 before D7); a new file at the top level that upstream does not have is allowed (D9).
- [X] T005 [P] [U10] [U11] Tests first in `.fork/ci/test/principle-v.test.mjs`, then the deny texts, covering data-model.md `Decision.reason` and `Decision.suggestion` with the exact strings in contracts/rule.md "Messages": the D4, D7 and D8 reasons, the `docs/domain_knowledge/` suggestion naming `.fork/domain-knowledge/`, and the default upstream-bound/staged suggestion.

### Stream P: path and checkout helpers (`WP`)

- [X] T006 [P] [U12] [U13] [U14] [U15] [U16] Tests first in `.fork/ci/test/principle-v-paths.test.mjs` (temp repos via `.fork/ci/test/helpers/git-fixture.mjs`), then `repoRelative(path, cwd)` in `.fork/ci/lib/principle-v-paths.mjs`, covering data-model.md `PathTarget.root` and `PathTarget.relPath`: relative, absolute, `..` and symlinked forms give the same result (cycle order U12→U16 per the test list; U12's minimal version may take the root from `cwd`, which U13 then corrects); a not-yet-created file resolves through its nearest existing ancestor; a path outside every checkout, or equal to the root, gives `relPath: null`; a path inside a linked worktree reports that worktree as `root`.
- [X] T007 [P] [U17] [U18] [U19] Tests first, then `checkoutState(root)` and `GuardError` in `.fork/ci/lib/principle-v-paths.mjs`, covering data-model.md `CheckoutState.branch` and `CheckoutState.mergeInProgress`: branch name on a branch, `HEAD` when detached, `mergeInProgress` true while `MERGE_HEAD` exists (make it with `git merge --no-commit --no-ff`), `GuardError` for a non-repository.
- [X] T008 [P] [U20] [U21] Tests first, then `upstreamPaths(root)` in `.fork/ci/lib/principle-v-paths.mjs`, covering data-model.md `UpstreamPaths.files` and `UpstreamPaths.dirs`: files from `upstream/main` (set the ref with `addRemoteRef`), every proper ancestor in `dirs`, and `null` when the ref is missing.

---

## Phase 3: User Story 1 - the agent guard (Priority: P1) 🎯 MVP

**Goal**: an agent write to an upstream-owned path on fork main is refused with a redirect; fork-only and worktree writes proceed.

**Independent Test**: `node --test .fork/ci/test/principle-v-guard.test.mjs` (hook cases) and quickstart §2.

### Wave 1, stream W (`WW`): wiring for US1

- [X] T009 [P] [US1] [U28] Tests first in `.fork/ci/test/principle-v-docs.test.mjs`, then `.claude/settings.json`, per contracts/guards.md "Wiring": exactly one `hooks.PreToolUse` entry with matcher `Write|Edit|MultiEdit|NotebookEdit`, one `command` hook whose command is `node "$CLAUDE_PROJECT_DIR/.fork/ci/bin/principle-v-guard.mjs" --hook`, and `timeout: 30`. The test parses the JSON; it does not run Claude Code.

### Wave 2, stream G (`WG`): the `--hook` mode

- [X] T012 [US1] [A1] [A2] [A3] [A4] [A5] Flip the A1–A5 `todo` tests in `.fork/ci/test/principle-v-guard.acceptance.test.mjs` to `test`, one cycle each, in the same commit as the `--hook` change that makes each pass (A1 first: it creates the `--hook` path), one per spec US1 scenario (AS1–AS5): upstream file refused with the upstream-bound/staged route; `docs/domain_knowledge/CONTEXT.md` refused naming `.fork/domain-knowledge/`; fork-only roots and zones allowed; a write into a linked worktree on another branch allowed; a write during a merge allowed.
- [X] T010 [US1] [U22] Tests first in `.fork/ci/test/principle-v-guard.test.mjs` (spawn `process.execPath .fork/ci/bin/principle-v-guard.mjs --hook` with JSON on stdin against temp repos), then the `--hook` mode in `.fork/ci/bin/principle-v-guard.mjs`, per contracts/guards.md `--hook`: allowed → exit 0, no output; denied → exit 0 with the `hookSpecificOutput` deny JSON whose reason is `decide()`'s reason plus suggestion; target from `tool_input.file_path`, falling back to `tool_input.notebook_path`, resolved against `cwd`.
- [X] T011 [US1] [U23] [U24] [U25] Tests first, then fail-closed handling in `.fork/ci/bin/principle-v-guard.mjs` (FR-011, research R1): unparseable stdin, a matched tool with no target path, and a library that fails to load each produce the deny JSON with reason starting `principle-v-guard failed:` and exit 0, never a non-zero exit. Load `lib/principle-v.mjs` and `lib/principle-v-paths.mjs` with dynamic `import()` inside the top-level `try`; test the load failure by pointing the CLI at a temp copy whose lib file is broken.
**Checkpoint**: US1 complete once T009–T012 are merged into `fork/principle-v-guard`.

---

## Phase 4: User Story 2 - the commit guard (Priority: P2)

**Goal**: a commit on fork main that stages an upstream-owned path is refused, listing every such path.

**Independent Test**: `node --test .fork/ci/test/principle-v-guard.test.mjs` (staged cases) and quickstart §3.

### Wave 1, stream W (`WW`): wiring for US2

- [X] T013 [P] [US2] [U29] Tests first in `.fork/ci/test/principle-v-docs.test.mjs`, then `.fork/githooks/pre-commit`, per contracts/guards.md "Wiring": executable, POSIX `sh`, and runs `node "$(git rev-parse --show-toplevel)/.fork/ci/bin/principle-v-guard.mjs" --staged` with `exec`.

### Wave 2, stream G (`WG`): the `--staged` mode

- [X] T015 [US2] [A6] [A7] [A8] [A9] Flip the A6–A9 `todo` tests in `.fork/ci/test/principle-v-guard.acceptance.test.mjs` to `test`, one cycle each, in the same commit as the `--staged` change that makes each pass (A6 first), one per spec US2 scenario (AS1–AS4), driving a real `git commit` in a temp repo whose `core.hooksPath` points at a copy of `.fork/githooks/`: refused with the listed paths; fork-only commit succeeds; merge commit succeeds; commit on another branch's worktree succeeds.
- [X] T014 [US2] [U26] [U27] Tests first in `.fork/ci/test/principle-v-guard.test.mjs`, then the `--staged` mode in `.fork/ci/bin/principle-v-guard.mjs`, per contracts/guards.md `--staged` and research R6: staged paths from `git diff --cached --name-only -z --no-renames` (additions, modifications, deletions, both sides of a rename); any denied path → exit 1 with the header, one line per path and the `--no-verify` note on stderr; all allowed → exit 0, no output; guard failure → exit 1 with `principle-v-guard failed:`.
**Checkpoint**: US2 complete once T013–T015 are merged.

---

## Phase 5: User Story 3 - the knowledge base has one home (Priority: P3)

**Goal**: the fork runbook designates `.fork/domain-knowledge/` and documents both guards.

**Independent Test**: `node --test .fork/ci/test/principle-v-docs.test.mjs`.

### Wave 1, stream W (`WW`)

- [X] T016 [P] [US3] [A10] [A11] Tests first in `.fork/ci/test/principle-v-docs.test.mjs`, then `.fork/README.md`: a section that names `.fork/domain-knowledge/` as the canonical knowledge root for `/speckit-grill-with-docs` with its layout (`CONTEXT.md`, topic documents, `adr/`); a "Principle V guard" section describing both guards, what they allow and refuse, the merge exception and `--no-verify`; and the enable command `git config core.hooksPath .fork/githooks` (US3 AS1, AS2). Do not create `.fork/domain-knowledge/` itself (grill creates it on its first recorded item).
- [X] T017 [P] [U30] Tests first in `.fork/ci/test/self-test-needed.test.mjs`, then `.fork/ci/lib/self-test-needed.mjs`, per contracts/guards.md "Self-test trigger": `true` for paths under `.fork/githooks/` and for `.claude/settings.json`; existing triggers unchanged.
- [X] T018 [P] Document `bin/principle-v-guard.mjs` (`--hook`, `--staged`, exit codes, fail-closed) in `.fork/ci/README.md`, from contracts/guards.md. No test; docs only.

---

## Phase 6: Integration and gate (integrator, in `W`)

- [X] T019 After R and P report: merge `fork/principle-v-guard-rule` then `fork/principle-v-guard-paths` into `fork/principle-v-guard` with `--no-ff`; append each fragment to `tdd/cycle-log.md` in merge order and delete the fragments; set reported behaviors `DONE` after checking each has a real red; run the full suite. Then create `WG` from `fork/principle-v-guard` and dispatch stream G (T010–T012, T014, T015).
- [X] T020 After W reports: merge `fork/principle-v-guard-wiring` the same way. After G reports: merge `fork/principle-v-guard-guard` the same way. Tick marked tasks per the marker rule. Remove the four stream worktrees and branches.
- [X] T021 Gate checks in `W`: full `node --test .fork/ci/test/` passes; `npx --yes markdownlint-cli2 --config .github/.markdownlint.jsonc` on every changed Markdown file outside `.claude/skills/` and `.specify/extensions/` (pass paths as separate arguments) reports 0 issues; relative links resolve.
- [X] T022 Run quickstart §1, §2 and §5 in `W` (the guard targets `W`'s own checkout, branch `fork/principle-v-guard`, so expect allows there; use a temp repo on a `main` branch for the deny cases) and record results in the cycle log notes.
- [X] T023 TDD audit (Quality Gate 1, no exemption): from `M`, a fresh Sonnet-class subagent runs `/speckit-tdd-verify` on 005 against `W`'s artifacts and writes `W/specs/005-principle-v-guard/tdd/verification.md`. Required: PASS or PASS_WITH_GAPS. Fix any finding under the same TDD rules and re-audit.
- [X] T024 [P] `/speckit-analyze` on 005 from `M` in a fresh subagent; resolve any CRITICAL or HIGH finding.
- [X] T025 [P] Lane hygiene: `git -C W diff --stat main...HEAD` lists only fork-only paths (`.fork/`, `.claude/settings.json`, `specs/005-principle-v-guard/`); secret scan with gitleaks.
- [X] T026 Tick T001–T025 and T029, push `fork/principle-v-guard`, open the fork PR (`gh pr create -R mfelker/OB1 --base main --head fork/principle-v-guard --title "[fork] Principle V guard: agent and commit guards (spec 005)"`), wait for `fork-ci-verdict` and `self-test`. **Ask the owner before merging.**

- [X] T030 [U31] [U32] [U33] [U34] [U35] Analyze remediation (T024 F1 HIGH case bypass, F3, F4): stream F (Sonnet) in `.worktrees/fork-pvg-fix`, test-first; merged into `fork/principle-v-guard`.
- [X] T031 [U36] [U37] [U38] Audit remediation (T023 HIGH 1–3, MED 5): stream H (Sonnet) in `.worktrees/fork-pvg-harden`, test strengthening with mutant reds; then merge and re-run T023. U25/U26 stay `TEST_AFTER` under the owner exception in plan.md Complexity Tracking.

## Phase 7: After merge (integrator, in `M`)

- [X] T027 In `M`: `git pull --ff-only origin main`; update plan.md's Worktree line to "none (fork-`main` checkout)"; run `git config core.hooksPath .fork/githooks`; remove `W`.
- [X] T028 Quickstart §3 (commit guard on real fork main) and §4 (live Claude Code check in a new session, including the one-time `MultiEdit`/`NotebookEdit` stdin field check from research R1). Record results in `specs/005-principle-v-guard/evidence/quickstart.md`, set spec Status to `Implemented`, commit.

---

## Dependencies & Execution Order

- Phase 1 (T001–T003, T029) blocks everything.
- Wave 1: streams R (T004–T005), P (T006–T008) and W (T009, T013, T016–T018) run in parallel; their files are disjoint (see the ownership table).
- Wave 2: stream G (T010–T012, T014–T015) starts after R, P **and W** are merged: the CLI imports R's and P's modules, and G's acceptance tests read W's `.claude/settings.json` and copy W's `.fork/githooks/` (dependency found at integration).
- Integration (T019–T026) is the integrator's alone; T024 and T025 can run in parallel.
- Phase 7 needs the merged PR.

### Within each stream

Tests before implementation, one behavior per commit, the full suite green before every commit. A stream never edits another stream's files, `tasks.md`, `tdd/test-list.md` or `tdd/cycle-log.md`.

## Parallel Example: wave 1

```text
Agent(model: sonnet) → stream R in WR: T004, T005
Agent(model: sonnet) → stream P in WP: T006, T007, T008
Agent(model: sonnet) → stream W in WW: T009, T013, T016, T017, T018
```

## Implementation Strategy

- **MVP**: US1 (the agent guard) is the point of the feature; it needs R, P, W's T009 and G's T010–T012. US2 rides on the same CLI and lands in the same PR.
- **Why one PR**: the guards are only useful together with the runbook entry and the settings file, and the integration branch keeps `main` clean until the audit passes.
