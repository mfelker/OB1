---

description: "Tasks for adopting the spec-kit-tdd extension (spec 003)"
---

# Tasks: Adopt the spec-kit-tdd extension for enforced TDD

**Input**: Design documents from `specs/003-tdd-extension/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY (constitution Principle IV, fork lane: red-green-refactor). The extension can't drive its own installation (research R11), so every behavior runs through the loop **by hand, under the extension's rules**:

- One behavior per cycle.
- Write the test first, **observe it fail**, and capture the real decisive failure line.
- Make the smallest change to green, run the full `node --test .fork/ci/test/`, then refactor.
- Never commit on red. Commit at green, test and implementation together.
- Never weaken a test.
- Write each cycle's entry in the cycle-log shape from `.specify/extensions/tdd/templates/tdd-test-list-template.md`.

**Behavior ids** come from the Behavior Map, written to `tdd/test-list.md` in T006. A `[U#]`/`[A#]` marker appears **only on the task that drives that behavior**. Marked tasks are ticked by the integrator when all their behaviors are `DONE` (the extension's rule), never in bulk. Unmarked tasks are ticked when done.

**Single writers**: during the parallel streams, only the integrator (the main session) edits `tasks.md`, `tdd/test-list.md` and `tdd/cycle-log.md`. Each stream appends its cycle entries to `specs/003-tdd-extension/tdd/cycle-log.d/<stream>.md` and reports which behaviors are `DONE` (research R14).

## Path Conventions

- `W` = `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension`: the integration worktree on `fork/tdd-extension` (the plan's **Worktree**).
- `WA`, `WB`, `WC`, `WD` = `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-{adapter,overrides,advisory,docs}`: the stream worktrees, on branches `fork/tdd-extension-{adapter,overrides,advisory,docs}` cut from `fork/tdd-extension` after T006.
- `M` = `/Users/mfelker/Projects/ob1`: the fork-`main` checkout. Every `/speckit-*` command runs here only (constitution).
- `SP` = `/private/tmp/claude-501/-Users-mfelker-Projects-ob1/abfce453-96cf-420b-adce-22ecaf5d89d4/scratchpad`: untrusted downloads only. Nothing in it is executed.
- A stream's source paths are relative to its own worktree root. The full self-test is `node --test .fork/ci/test/`.

## Behavior Map

| Id | Behavior | Contract / model ref | Stream, test file |
|----|----------|----------------------|-------------------|
| U1 | `SPECIFY_FEATURE_DIRECTORY` wins over `feature.json` | `TddTarget.featureDir` | A, `tdd-target.test.mjs` |
| U2 | `feature.json` `feature_directory` is used when there's no env | `TddTarget.featureDir` | A, 〃 |
| U3 | Neither gives "no active feature" | adapter A2 | A, 〃 |
| U4 | Lane grammar: fork / upstream-bound / staged; a placeholder or unknown value is an error | `TddTarget.lane`, adapter A17 | A, 〃 |
| U5 | Worktree backticked absolute path becomes `tree` | `TddTarget.tree` | A, 〃 |
| U6 | Worktree `none…` (for example "none (fork-`main` checkout)") gives `repoRoot` | `TddTarget.tree`, R3 | A, 〃 |
| U7 | Worktree placeholder, or a non-absolute token, is an error | adapter A17, A18 | A, 〃 |
| U8 | Missing Worktree line: fork gives `repoRoot`; staged / upstream-bound give an error | adapter A19, FR-007 | A, 〃 |
| U9 | A Worktree not on disk, or not a git work tree, is an error | adapter A3 | A, 〃 |
| U10 | Contribution folder grammar: placeholder, `N/A` checked before backticks (spec 001's line), trailing `/` stripped, a leading `/` or `..` rejected | `TddTarget.folder`, adapter A4 | A, 〃 |
| U11 | `folderExists:false` is allowed for `suite` only; other operations get "folder not found" | `TddTarget.folderExists`, adapter A5 | A, 〃 |
| U12 | File resolution order (folder, tree, repo root), then the inside-tree check **after every resolution** | R4, adapter A15, A16 | A, `tdd-commands.test.mjs` |
| U13 | A file no runtime owns is rejected, naming the patterns | adapter A6 | A, 〃 |
| U14 | node-test `single`/`file` argv (`--test-isolation=none --test-reporter=spec`, anchored escaped name as one element) and `cwd` = tree + runtime root | `RuntimeCommand.argv`, `RuntimeCommand.cwd`, `RuntimeCommand.op` | A, 〃 |
| U15 | node count parser: `tests 0` is zero-match; unparseable output gives `null` (failure) | `RuntimeCommand.countParser` | A, 〃 |
| U16 | A plain `test-*.mjs` script (no `node:test` import) is kind `plain-script`; `single` is unsupported, `file` uses process isolation | `RuntimeCommand.kind`, `RuntimeCommand.unsupported`, adapter A10 | A, 〃 |
| U17 | deno argv from `runtime.command` plus `--filter`; the `0 passed` parser | R5 | A, 〃 |
| U18 | python: the cached venv path keyed by tree + root and the requirements hash; argv `-k`; exit 5 is zero-match | R5 | A, 〃 |
| U19 | node-script: vitest/jest `single`; other runners unsupported | `RuntimeCommand.unsupported` | A, 〃 |
| U20 | sql: `file` gives the psql verify argv; `single` is unsupported | adapter A10 | A, 〃 |
| U21 | `childEnv`: `NODE_TEST_CONTEXT` removed; credential vars set to `""` (the list plus suffix patterns); others kept | data-model `ChildEnv`, FR-016 | A, `tdd-env.test.mjs` |
| U22 | `where` prints the JSON, including `featureDir` and `folderExists` | adapter A1 | A, `tdd-cli.test.mjs` |
| U23 | `single`/`file` end to end: pass 0, fail 1, zero-match **3**; full child output streamed, not truncated | adapter A7–A9, A11 | A, 〃 |
| U24 | `suite` exit mapping, including the empty baseline (`no-tests`, `exempt`, missing folder) | data-model `SuiteResult`, adapter A12–A14, FR-017 | A, 〃 |
| U25 | `suite` restores a lockfile it modified that was clean before | adapter A21 | A, 〃 |
| U26 | Usage, target and Node < 26 errors exit 2 with a single-line message | adapter A2–A6, A17–A20 | A, 〃 |
| U27 | The summary line names `feature=` and `folder=` | adapter summary, R2 | A, 〃 |
| U28 | `tddStatus`: per-feature `cycleLog`, `verification`, and `verdict` ∈ PASS / PASS_WITH_GAPS / FAIL / BLOCKED / missing / unreadable | `TddStatus.features`, `TddStatus.verdict` | C, `tdd-status.test.mjs` |
| U29 | Several specs naming the same branch give one entry each | T7 | C, 〃 |
| U30 | No spec names the branch gives `linked:false` | `TddStatus.linked`, T8 | C, 〃 |
| U31 | Empty headRef (push) gives `null` | `TddStatus.headRef`, T9 | C, 〃 |
| U32 | The branch is compared literally (regex metacharacters, `../`) | T invariants | C, 〃 |
| U33 | `renderReport` renders T1–T10 with escaped pipes; no section for `null` | contracts/fork-ci-tdd-status.md | C, `report.test.mjs` |
| U34 | `bin/verdict.mjs`: same conclusion and exit for every status; `tddStatus` throwing renders the T10 line with the exit unchanged | `TddStatus.error`, FR-014 | C, `verdict.test.mjs` |
| U36 | `selfTestNeeded` also fires for `.specify/templates/overrides/`, `.specify/extensions/tdd/`, `.specify/memory/constitution.md` and `.fork/README.md`, so the drift and docs tests run in CI when those change | FR-010, FR-011, FR-012 | C, `self-test-needed.test.mjs` (extend) |
| U35 | Overrides: the installed base hash equals `base_sha256`; stripping the header and fork section reproduces the base | `OverrideFile.base_sha256`, `OverrideFile.name`, `OverrideFile` fork section | B, `tdd-overrides.test.mjs` |
| A1 | Installed extension byte-identical to tag `v2.0.1` | FR-001 | integrator, `evidence/r1-verify.md` |
| A2 | Profile commands each run before recording (single, zero-match, file, suite) | FR-009 | A, the profile's `verified:` and a cycle entry |
| A3 | US2 AS1: `suite` for a feature whose plan names a real git worktree runs that worktree's folder | US2, FR-004 | A, `tdd-cli.test.mjs` (acceptance) |
| A4 | US2 AS2: the profile's `single` command run as written gives exit 3 for a name that matches nothing | US2, FR-006 | A, 〃 |
| A5 | US2 AS3: a fork feature with Worktree `none` uses the repo-root checkout | US2 | A, 〃 |
| A6 | US2 AS4: a missing folder or no detectable runtime fails explicitly | US2, FR-007 | A, 〃 |
| A7 | US1 AS1: `/speckit-implement` drives the behavior through the loop before anything else | US1, FR-002 | post-merge smoke, `evidence/smoke.md` |
| A8 | US1 AS2: with no test list, `/speckit-implement` stops | US1 | 〃 |
| A9 | US1 AS3: the cycle log records the test, red command, failure line, green and commit | US1 | 〃 |
| A10 | US3 AS1: fixture C1/K4 with real base-red classify `PROVEN` | US3, FR-010 | post-merge, fixture `tdd/verification.md` |
| A11 | US3 AS2: fixture C3 without base-red classifies `TEST_AFTER` | US3 | 〃 |
| A12 | US3 AS3: the fork-lane audit of 003 applies the base rules (the fork section stays inert) | US3 | post-merge, `specs/003-…/tdd/verification.md` |
| A13 | US4 AS1: Principle IV names the cycle log as red evidence, the staged base-red rule and the hook | US4, FR-011 | D, `tdd-docs.test.mjs` |
| A14 | US4 AS2: the runbook TDD workflow covers test list, loop, audit before merge, and disabling the hook | US4, FR-012 | D, 〃 |
| A15 | US5 AS1: calibration reports exist for 002 (`BLOCKED`, with reason) and the fixture | US5, FR-013 | post-merge |
| A16 | SC-007: the fork PR's verdict summary shows the 003 TDD status row, and the verdict is unchanged | FR-014, SC-007 | integrator, on PR |

---

## Phase 1: Setup (integrator)

- [X] T001 From `M`:
  - Run `git fetch -q upstream && git merge-base --is-ancestor upstream/main main`.
  - Run `git worktree add .worktrees/fork-tdd-extension -b fork/tdd-extension main`.
  - Verify the branch, `HEAD` = `main`, and a clean tree.
- [X] T002 [P] Add `extensions/.cache/` to `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/.gitignore` (R13).
- [X] T003 [P] In `W`, confirm `.specify/feature.json` = `specs/003-tdd-extension`, and that `specs/003-tdd-extension/plan.md` Lane, Worktree (`W`, absolute) and Contribution folder (`.fork/ci`) parse under the R3 grammar. This is a read-only check; no `/speckit-*` command runs in `W`.

## Phase 2: Foundational (integrator, serial)

- [X] T004 Verified download (R1), into fresh empty folders under `SP`:
  1. `gh release download v2.0.1 -R d0whc3r/spec-kit-tdd -p 'tdd-2.0.1.zip' -D SP/tdd-zip`, and record its SHA-256.
  2. Unzip into `SP/tdd-unzipped`.
  3. Compare every file's `git hash-object` with the blobs from `gh api 'repos/d0whc3r/spec-kit-tdd/git/trees/v2.0.1?recursive=1'`, and confirm the tag commit is `55221d4`.
  4. Confirm the allowed path set. **Stop on any difference.**
- [X] T005 [A1] Install from `W` with `specify extension add --dev SP/tdd-unzipped`. Then:
  - Confirm `specify extension list` shows `tdd 2.0.1` and that `.specify/extensions.yml` has the 4 hooks (`before_implement` with `optional: false`).
  - Re-hash the installed `.specify/extensions/tdd/{commands,templates}` against the tag.
  - Write `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/specs/003-tdd-extension/evidence/r1-verify.md` (the table, the zip SHA-256, the tag commit).
  - Commit `[fork] Install spec-kit-tdd 2.0.1 (verified against tag v2.0.1)`.
- [X] T006 Write `specs/003-tdd-extension/tdd/test-list.md` from the Behavior Map, using the extension's test-list template:
  - Frontmatter, with `planned_at` from `git rev-parse --short HEAD`.
  - Per behavior: `traces`, `kind` (`example`, or `docs-check` for A13 and A14), state `PENDING`; A1 is `DONE`, citing `evidence/r1-verify.md`.
  - The Out of scope list: specs 001 and 002 aren't retrofitted.
  - Write `tdd/cycle-log.md` with the baseline entry only: `node --test .fork/ci/test/` passes 101 tests, plus the SHA. Its notes record the deviation that the profile is written after the list (R7, I22).
  - Commit, then create `tdd/cycle-log.d/` with a `.gitkeep`.

**Checkpoint**: extension installed and verified, test list and baseline committed on `fork/tdd-extension`.

## Phase 3: Parallel streams (one subagent each, own worktree)

- [ ] T007 From `M`, create the four stream worktrees: `git worktree add .worktrees/fork-tdd-<s> -b fork/tdd-extension-<s> fork/tdd-extension` for `s` ∈ {adapter, overrides, advisory, docs}. Then dispatch four subagents in parallel, each briefed with:
  - its worktree and branch;
  - its tasks;
  - the TDD rules above;
  - the single-writer rule;
  - the contract and data-model files it needs.

### Stream A: adapter (US2 → US1 profile), worktree `WA`

**Goal**: `.fork/ci/bin/tdd.mjs` resolves the right tree and folder, picks the right runner, blanks credentials, and never gives a false green.

**Independent Test**: `node --test .fork/ci/test/tdd-target.test.mjs .fork/ci/test/tdd-commands.test.mjs .fork/ci/test/tdd-env.test.mjs .fork/ci/test/tdd-cli.test.mjs` passes.

- [ ] T008 [P] [US2] [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] [U10] [U11] One cycle per behavior, in order:
  - Tests in `.fork/ci/test/tdd-target.test.mjs`, using temp-dir fixture repos built from in-memory maps (pattern: `.fork/ci/test/fixtures.mjs`), with real `git init` / `git worktree add` where U5 and U9 need a work tree.
  - Implement `.fork/ci/lib/tdd-target.mjs` (`resolveTarget`, `TargetError`), covering data-model.md `TddTarget.repoRoot`, `TddTarget.featureDir`, `TddTarget.lane`, `TddTarget.tree`, `TddTarget.folder` and `TddTarget.folderExists`, with the R3 grammar.
  - Include spec 001's literal Contribution folder line and the plan template's placeholder lines as U7/U10 cases.
- [ ] T009 [P] [US2] [U12] [U13] [U14] [U15] [U16] [U17] [U18] [U19] [U20] One cycle per behavior:
  - Tests in `.fork/ci/test/tdd-commands.test.mjs`.
  - Implement `.fork/ci/lib/tdd-commands.mjs` (`buildCommand`, `resolveFile`, parsers), covering data-model.md `RuntimeCommand.op`, `RuntimeCommand.kind`, `RuntimeCommand.argv`, `RuntimeCommand.cwd`, `RuntimeCommand.countParser` and `RuntimeCommand.unsupported`.
  - It reuses `scanRuntimes` and `runtime.command` from `.fork/ci/lib/runtimes.mjs`, without copying either.
  - The anchored name escapes the regex metacharacters ``\ ^ $ . * + ? ( ) [ ] { } |``.
- [ ] T010 [P] [US2] [U21] One cycle: tests in `.fork/ci/test/tdd-env.test.mjs`; implement `.fork/ci/lib/tdd-env.mjs` `childEnv()` per data-model.md `ChildEnv`.
- [ ] T011 [P] [US2] [U22] [U23] [U24] [U25] [U26] [U27] One cycle per behavior:
  - Tests in `.fork/ci/test/tdd-cli.test.mjs`. They spawn `process.execPath .fork/ci/bin/tdd.mjs` against temp fixture repos with tiny real test files: one passing, one failing, and one plain script.
  - Implement `.fork/ci/bin/tdd.mjs` per contracts/tdd-adapter-cli.md, using the data-model.md `RuntimeCommand` exit codes and `SuiteResult`.
    - It streams and captures child output itself; `exec.mjs` truncates.
    - `suite` delegates to `.fork/ci/bin/run-folder.mjs`, with `childEnv` and the lockfile restore.
- [ ] T012 [P] [US2] [A3] [A4] [A5] [A6] The acceptance cycles, in a `describe('acceptance')` block in `.fork/ci/test/tdd-cli.test.mjs`. Each runs a temp repo with a real `git worktree` and a plan, exactly as the extension would invoke the profile's command strings from the repo root:
  - **A3**: suite routes to the worktree folder.
  - **A4**: the profile `single` string with an unmatched name gives exit 3.
  - **A5**: a fork feature with Worktree `none` gives the repo root.
  - **A6**: a missing folder or runtime gives an explicit error.
- [ ] T013 [P] [US2] Refactor pass over `lib/tdd-target.mjs`, `lib/tdd-commands.mjs`, `lib/tdd-env.mjs` and `bin/tdd.mjs`, with the full suite green after each move. "No refactor needed" is a valid outcome.
  - Then run quickstart §2–§3 in `WA` and record the exit codes (expected 0 / 3 / 0 / 0) in the fragment.
- [ ] T014 [P] [US1] [A2] Write `.specify/memory/tdd-profile.md` in `WA`, per contracts/tdd-profile.md, following `.specify/extensions/tdd/commands/speckit.tdd.setup.md` Phases 2–3 by hand (R7):
  - Run each command against `WA`'s target, including zero-match (it must exit 3).
  - Open every exemplar and helper path before recording it.
  - Record `verified: [single, file, suite]`, `suite_seconds` with the measured target named, and a reason for each null.
  - Skip the setup's constitution step (T020 covers it).

### Stream B: overrides (US3), worktree `WB`

- [ ] T015 [P] [US3] [U35] One cycle, in a single uninterrupted block (the red is never committed):
  1. Write `.fork/ci/test/tdd-overrides.test.mjs` first, per data-model.md `OverrideFile.base_sha256`, `OverrideFile.name` and the `OverrideFile` fork section.
  2. Observe red: "override file missing".
  3. Create `.specify/templates/overrides/tdd-test-quality-rubric.md` (rules S1–S4) and `.specify/templates/overrides/tdd-loop-playbook.md` (the 5-step base-red procedure), per contracts/staged-evidence-override.md. Each is a copy of the installed template plus the header and one delimited fork section that states it applies only when the plan's Lane is `staged upstream PR`.
  4. Go green with the full suite, then commit.

### Stream C: advisory (US1 visibility, FR-014), worktree `WC`

- [ ] T016 [P] [US1] [U28] [U29] [U30] [U31] [U32] One cycle per behavior:
  - Tests in `.fork/ci/test/tdd-status.test.mjs`.
  - Implement `.fork/ci/lib/tdd-status.mjs` `tddStatus(rootDir, headRef)`, covering data-model.md `TddStatus.headRef`, `TddStatus.features`, `TddStatus.verdict` and `TddStatus.linked`.
- [ ] T017 [P] [US1] [U33] One cycle: extend `.fork/ci/test/report.test.mjs`, then add the optional 4th `tdd` parameter to `renderReport` in `.fork/ci/lib/report.mjs`, covering contract rows T1–T10.
- [ ] T018 [P] [US1] [U34] [U36] One cycle per behavior (U36: extend `.fork/ci/test/self-test-needed.test.mjs`, then `.fork/ci/lib/self-test-needed.mjs`):
  - Extend `.fork/ci/test/verdict.test.mjs`, covering data-model.md `TddStatus.error`.
  - Wire `.fork/ci/bin/verdict.mjs`: call `tddStatus(process.cwd(), process.env.HEAD_REF ?? '')` inside `try`/`catch`, and pass the result (or `{error}`) to `renderReport` only, never to `computeVerdict`.
  - Then add `HEAD_REF: ${{ github.head_ref }}` to the verdict step's `env:` in `.github/workflows/fork-ci.yml`, and nothing else. Run actionlint 1.7.12 if it's available locally, otherwise on the PR.

### Stream D: docs and rules (US4), worktree `WD`

- [ ] T019 [P] [US4] [A13] [A14] One cycle per behavior:
  1. Write `.fork/ci/test/tdd-docs.test.mjs` first.
     - A13 asserts `.specify/memory/constitution.md` Principle IV names `tdd/cycle-log.md` as red evidence, the staged base-red rule and the mandatory `before_implement` hook.
     - A14 asserts `.fork/README.md` has a "TDD workflow" section covering `tdd.plan`, the loop, `tdd.verify` before merge, the advisory status and `enabled: false` with a reason.
  2. Observe red.
  3. Make it green through T020 and T021.
- [ ] T020 [P] [US4] Amend `.specify/memory/constitution.md` to 1.3.0 (MINOR; rationale in plan.md Complexity Tracking), following the `/speckit-constitution` workflow:
  - **Principle IV**: the cycle log is the red evidence for the fork and upstream-bound lanes; the staged base-red rule; the mandatory hook enforces it; disabling it needs `enabled: false` plus a reason in the plan.
  - **Gate 1**: includes a `tdd.verify` PASS or PASS_WITH_GAPS. The fork-ci TDD status is advisory.
  - **Lanes**: `/speckit-*` commands still run only from fork `main`.
  - **Prepend** a 1.2.0 → 1.3.0 entry to the existing Sync Impact Report comment (keep the history).
- [ ] T021 [P] [US4] Edit the docs:
  - `.fork/README.md`:
    - A "TDD workflow" section covering:
      - `tdd.plan` through the `after_tasks` hook, which adds the markers;
      - the loop through the mandatory hook;
      - `tdd.verify` before merge;
      - the staged base-red rule;
      - the advisory;
      - disabling the hook;
      - switching `.specify/feature.json` and checking `tdd.mjs where` before running against a non-active feature (I5).
    - Update "Stage an upstream PR" steps 3–5.
    - Record version 2.0.1, tag `55221d4` and the zip SHA-256 from `evidence/r1-verify.md`.
  - `.fork/ci/README.md`: document `bin/tdd.mjs` (from contracts/tdd-adapter-cli.md) and the advisory.
  - `.specify/templates/tasks-template.md`: "the `after_tasks` hook (`tdd.plan`) adds the `[U#]`/`[A#]` markers and reorders the test tasks"; "never tick a marked task by hand"; the pre-merge gate includes `tdd.verify`; the staged base-red step points to the override.
  - `.specify/templates/plan-template.md`: the Lane block requires a real Worktree (absolute path, or "none (fork-`main` checkout)" for fork features) and a Contribution folder.
  - T019 must go green.

## Phase 4: Integration and gate (integrator, in `W`)

- [ ] T022 Merge the four stream branches into `fork/tdd-extension` with `git merge --no-ff`, in the order adapter, overrides, advisory, docs. Then:
  - Append each `tdd/cycle-log.d/<stream>.md` to `tdd/cycle-log.md` in merge order, and delete the fragments.
  - Set each reported behavior `DONE` in `tdd/test-list.md`, after checking its cycle entry has a real red.
  - Tick T008–T021 per the marker rule.
  - Remove the four stream worktrees and branches.
- [ ] T023 Run the gate checks:
  - Full `node --test .fork/ci/test/`: all pass.
  - `npx --yes markdownlint-cli2 --config .github/.markdownlint.jsonc` on every changed Markdown file outside `.claude/skills/` and `.specify/extensions/`: 0 issues.
  - Check that every relative link in those files resolves (constitution docs gate).
- [ ] T024 Run `/speckit-analyze` on 003 **from `M`** (fresh subagent; it reads `W`'s artifacts by absolute path). Resolve any CRITICAL or HIGH finding before continuing (SC-005).
- [ ] T025 [P] Lane hygiene: `git -C W diff --stat main...HEAD` lists only fork-only paths per FR-015 (`.specify/`, `.fork/`, `specs/003-tdd-extension/`, `.claude/skills/speckit-tdd-*`, `.github/workflows/fork-ci.yml`). Also run a secret scan of the diff.
- [ ] T026 [P] Confirm in the test list that U1–U35, A1–A6, A13 and A14 are `DONE`. A7–A12, A15 and A16 stay `PENDING` (post-merge or on-PR). The cycle log has one entry per cycle, each with a red.
- [ ] T027 Tick T001–T026. Push `fork/tdd-extension`.
- [ ] T028 [A16] Open the fork PR: `gh pr create -R mfelker/OB1 --base main --head fork/tdd-extension --title "[fork] Adopt spec-kit-tdd for enforced TDD (spec 003)"`.
  - The body has the A1 table, the test counts, and the note that `OB1 Review` is expected to fail on a fork-only PR.
  - Wait with an `until` loop for `fork-ci-verdict` and `self-test`.
  - Confirm the summary's `TDD status (advisory)` shows `specs/003-tdd-extension`, with the conclusion unchanged.
- [ ] T029 **Ask the owner first.** Then:
  1. Merge with `gh pr merge <N> -R mfelker/OB1 --merge --admin` (R12).
  2. In `M`, run `git pull --ff-only origin main`.
  3. Update `specs/003-tdd-extension/plan.md`'s Worktree line to "none (fork-`main` checkout)" (R12) and commit.
  4. Run `git worktree remove .worktrees/fork-tdd-extension`.
  5. Confirm `M/.specify/extensions.yml` has the tdd hooks.

## Phase 5: Post-merge calibration and smoke (from `M`; US1, US3, US5)

- [ ] T030 [US1] [A7] [A8] [A9] Run the smoke check in `M` (R11):
  1. Create a throwaway fork feature `specs/990-tdd-smoke/`: a spec with one behavior ("`sum(a, b)` returns `a + b`"), a plan with Lane fork, Worktree `.worktrees/tdd-smoke` (branch `fork/tdd-smoke` from `main`), Contribution folder `.fork/smoke-sandbox` (a new folder, which exercises the FR-017 empty baseline), and a tasks.md with one test task and one implementation task.
  2. Point `feature.json` at it, and run `/speckit-implement` **with no test list**. Expect it to stop (A8).
  3. Run `/speckit-tdd-plan`, then `/speckit-implement`. Expect the mandatory hook to drive one recorded cycle and tick the marked task (A7, A9). If the `speckit-tdd-*` skills aren't loaded in the session, follow `.specify/extensions/tdd/commands/*.md` as written and say so.
  4. Record the outcome in `specs/003-tdd-extension/evidence/smoke.md`.
  5. Delete the throwaway spec, worktree and branch, and restore `feature.json` to 003.
- [ ] T031 [US3] [US5] [A10] [A11] [A15] Calibrate (R11):
  1. Recreate `.worktrees/stage-pr-532-atomizer-default` from `stage/pr-532-atomizer-default`.
  2. Create `specs/003-tdd-extension/calibration/staged-fixture/`: spec, plan (Lane staged, Worktree = that worktree, folder `recipes/atomizer/`) and a test list with C1, K4 and C3.
  3. Switch `feature.json` to the fixture and confirm with `tdd.mjs where`.
  4. **Really run** the override's base-red procedure for C1 and K4 through the profile's `single` command, recording a cycle log. Record only a head-green for C3.
  5. In fresh subagents, run the verify procedure on the fixture, expecting C1/K4 `PROVEN` and C3 `TEST_AFTER`, then on 002 (switch `feature.json`), expecting `BLOCKED` "no test list".
  6. Vet every cited line yourself.
  7. Restore `feature.json` to 003, remove the 002 worktree, and commit the reports.
- [ ] T032 [US3] [A12] Audit 003 in a fresh subagent (verify, with remediation allowed). Expect PASS or PASS_WITH_GAPS, with the fork section inert (base rules).
  - Fix any fork-integration gap found in T030–T032 through a follow-up `fork/tdd-calibration-fixes` branch, under the same TDD rules, then re-run the affected step.
  - Mark A7–A12, A15 and A16 `DONE`, set spec.md Status to `Implemented`, tick T028–T032, and commit to `main`.

---

## Dependencies & Execution Order

- **T001 → T002 and T003 in parallel → T004 → T005 → T006 → T007.**
- **T007 → four streams in parallel**, sequential within each:
  - **A**: T008 → T009 → T010 → T011 → T012 → T013 → T014.
  - **B**: T015.
  - **C**: T016 → T017 → T018.
  - **D**: T019 → T020 and T021, then the green for T019.
  - No two streams touch the same file, and the shared TDD files have a single writer (R14).
- **All streams → T022 → T023 → T024 → T025 and T026 in parallel → T027 → T028 → T029** (owner approval).
- **T029 → T030 → T031 → T032.** The calibration needs the merged hooks and profile in `M`.

## Parallel Example

```bash
# After T007, one subagent per stream, each in its own worktree:
Agent A (WA): T008–T014   # adapter + profile
Agent B (WB): T015        # overrides + drift test
Agent C (WC): T016–T018   # advisory status + workflow env
Agent D (WD): T019–T021   # constitution, runbook, templates, docs test
```

## Implementation Strategy

- **MVP = Phases 1–2 plus stream A.** Once merged, the mandatory hook can drive real features.
- **Streams B, C and D** make enforcement fair, visible and documented.
- **Phase 5** proves it on real work. Its gaps are fixed in a follow-up branch under the same rules.

## Notes

- Never edit `.specify/extensions/tdd/**`; customize only through `.specify/templates/overrides/`.
- Nothing from `SP` is executed. The zip holds Markdown and YAML, installed with `--dev`.
- The cycle log is append-only. A test-after admission is recorded honestly.
