---

description: "Tasks for adopting the spec-kit-tdd extension (spec 003)"
---

# Tasks: Adopt the spec-kit-tdd extension for enforced TDD

**Input**: Design documents from `specs/003-tdd-extension/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY (constitution Principle IV, fork lane: red-green-refactor). The extension can't yet drive its own installation (research R11). Every behavior below therefore runs through the loop **by hand, under the extension's rules**:

- One behavior per cycle.
- The test is written first and **observed failing**, with the real decisive failure line.
- The smallest change to green, then the full adapter suite, then a refactor step.
- One append-only entry per cycle in `specs/003-tdd-extension/tdd/cycle-log.md`, using the cycle-log shape in `.specify/extensions/tdd/templates/tdd-test-list-template.md`.
- Never weaken a test to get green.

**Behavior ids**: `U1`–`U31` (unit) and `A1`–`A3` (acceptance) are defined in the Behavior Map below and written to `tdd/test-list.md` in T006. A task carrying `[U#]` markers is ticked only when **all** its behaviors are `DONE` in the test list.

## Path Conventions

- `W` = `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension` (the plan's **Worktree**). Every source path is under `W`.
- `M` = `/Users/mfelker/Projects/ob1`, the fork-`main` checkout. `specs/003-tdd-extension/**` (this file, `tdd/`, evidence) is edited in `W` too, because the fork branch carries `specs/`. It reaches `main` with the merge.
- `SP` = `/private/tmp/claude-501/-Users-mfelker-Projects-ob1/abfce453-96cf-420b-adce-22ecaf5d89d4/scratchpad`, which holds only untrusted downloads (R1). Nothing from it is executed.
- Adapter test runs: `cd W && node --test .fork/ci/test/<file>`. The full self-test is `node --test .fork/ci/test/`.

## Behavior Map

| Id | Behavior | Contract / model ref | Test file |
|----|----------|----------------------|-----------|
| U1 | `SPECIFY_FEATURE_DIRECTORY` wins over `.specify/feature.json` | data-model `TddTarget.featureDir` | `tdd-target.test.mjs` |
| U2 | `.specify/feature.json` `feature_directory` is used when there's no env | `TddTarget.featureDir` | 〃 |
| U3 | Neither present gives `TargetError` "no active feature" | adapter A2 | 〃 |
| U4 | The plan's `**Worktree**` absolute path becomes `tree` | `TddTarget.tree` | 〃 |
| U5 | A missing or placeholder Worktree line gives `tree = repoRoot` | `TddTarget.tree` | 〃 |
| U6 | A Worktree path not on disk gives "worktree not found" | adapter A3 | 〃 |
| U7 | A missing, placeholder or `N/A` Contribution folder gives "plan has no Contribution folder" | adapter A4, `TddTarget.folder` | 〃 |
| U8 | A folder absent from the tree gives "folder not found in tree" | adapter A5 | 〃 |
| U9 | The Lane line parses to `fork` / `upstream-bound` / `staged` | `TddTarget.lane` | 〃 |
| U10 | File → owning runtime via `scanRuntimes`; a relative path is resolved against the folder, then the tree, then the repo root | research R4, adapter A15 | `tdd-commands.test.mjs` |
| U11 | An absolute file outside the tree is rejected | adapter A14 | 〃 |
| U12 | A file no runtime owns is rejected, naming the patterns | adapter A6 | 〃 |
| U13 | node-plain `single` argv: `--test-isolation=none` plus an anchored, regex-escaped name as one argv element | R5, `RuntimeCommand.argv` | 〃 |
| U14 | The node-plain count parser: `ℹ tests 0` gives the zero-match result; non-numeric output gives `null` (failure) | R5, `RuntimeCommand.countParser` | 〃 |
| U15 | deno `file`/`single` argv (fork-ci flags plus `--filter`), and a parser for `0 passed` | R5 | 〃 |
| U16 | python argv (`-k`), pytest exit 5 giving zero-match | R5 | 〃 |
| U17 | node-script: vitest/jest `single` argv; any other runner gives `unsupported` | R5, adapter A10, `RuntimeCommand.unsupported` | 〃 |
| U18 | sql: `file` gives the psql verify argv; `single` gives `unsupported` | R5, adapter A10 | 〃 |
| U19 | `where` prints the resolved JSON | adapter A1 | `tdd-cli.test.mjs` |
| U20 | `single` exit codes end to end: pass 0, fail 1, zero-match **3** (real `node --test` on fixture files) | adapter A7–A9, A11 | 〃 |
| U21 | `suite` maps `pass`/`sql-unverified` to 0 and anything else to 1 | adapter A12, A13 | 〃 |
| U22 | Usage and target errors exit 2 with a single-line message | adapter usage, A2–A6 | 〃 |
| U23 | The child env omits `NODE_TEST_CONTEXT` | adapter notes | 〃 |
| U24 | `tddStatus`: one linked feature with cycle log, verification and verdict (each verdict value, `missing`, `unreadable`) | fork-ci T1–T6, data-model `TddStatus.verdict` | `tdd-status.test.mjs` |
| U25 | Several specs naming the same branch give one row each | T7 | 〃 |
| U26 | No spec names the branch gives `linked: false` | T8, `TddStatus.linked` | 〃 |
| U27 | An empty headRef (push event) gives no status | T9, `TddStatus.headRef` | 〃 |
| U28 | The branch name is compared literally (regex metacharacters, `../`) | T invariants | 〃 |
| U29 | `renderReport` appends the advisory section, escaping pipes | T1–T8 rendering | `report.test.mjs` (extend) |
| U30 | `computeVerdict` and the `bin/verdict.mjs` conclusion are identical with and without TDD input | T invariant (FR-014) | `verdict.test.mjs` (extend) |
| U31 | Overrides: the installed base hash equals `base_sha256`, and stripping the fork section reproduces the base | data-model `OverrideFile.base_sha256`, `OverrideFile` fork section | `tdd-overrides.test.mjs` |
| A1 | The installed extension is byte-identical to tag `v2.0.1` | FR-001, research R1 | `SP/r1-verify.txt` |
| A2 | The profile's commands were each run before being recorded (single, zero-match, file, suite) | FR-009, contracts/tdd-profile.md | the profile's `verified:` and a cycle-log entry |
| A3 | Calibration verdicts on spec 002 and 003, with zero fork-integration gaps left | FR-013, SC-004 | `specs/00{2,3}-*/tdd/verification.md` |

---

## Phase 1: Setup

- [ ] T001 Create the worktree from `M`:
  - Run `git fetch -q upstream && git merge-base --is-ancestor upstream/main main` (Principle VII).
  - Run `git worktree add .worktrees/fork-tdd-extension -b fork/tdd-extension main`.
  - Verify the branch, `HEAD` = fork `main`, and a clean tree.
- [ ] T002 [P] Add `extensions/.cache/` to `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/.gitignore` (research R13), keeping the existing `extensions/.backup/` line.
- [ ] T003 [P] Set `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/feature.json` to `specs/003-tdd-extension`, and confirm `specs/003-tdd-extension/plan.md` has real values on its **Worktree** line (`W`) and **Contribution folder** line (`.fork/ci`) (research R3, R10).

---

## Phase 2: Foundational (install, then the test list)

- [ ] T004 [A1] Verified download (research R1). All files go in fresh empty folders under `SP`:
  1. Download `tdd-2.0.1.zip` with `gh release download v2.0.1 -R d0whc3r/spec-kit-tdd -p 'tdd-2.0.1.zip' -D SP/tdd-zip`, and record its SHA-256.
  2. Unzip into `SP/tdd-unzipped`.
  3. For every file, compare `git hash-object <file>` with the blob SHA from `gh api 'repos/d0whc3r/spec-kit-tdd/git/trees/v2.0.1?recursive=1'`.
  4. Also confirm the tag commit is `55221d4`, and that every path is within `extension.yml`, `README.md`, `LICENSE`, `commands/` and `templates/`.
  5. Write the result table to `SP/r1-verify.txt`. **Stop if any file differs.**
- [ ] T005 [A1] Install from `W`: `specify extension add --dev SP/tdd-unzipped`. Then:
  - Confirm with `specify extension list` that `tdd 2.0.1` is enabled, and that `.specify/extensions.yml` has the four hooks, with `before_implement` set to `optional: false`.
  - Confirm `.specify/extensions/tdd/` and `.claude/skills/speckit-tdd-*` exist.
  - Re-run the A1 hash check against the *installed* `commands/` and `templates/` copies.
  - Commit in `W` as `[fork] Install spec-kit-tdd 2.0.1 (verified against tag v2.0.1)`, with the zip's SHA-256 in the body.
- [ ] T006 Create `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/specs/003-tdd-extension/tdd/test-list.md` from the Behavior Map, using `.specify/extensions/tdd/templates/tdd-test-list-template.md`. That means frontmatter (`planned_at` = `git rev-parse --short HEAD`, `loop: inside-out` for units plus A1–A3 as the outer list), each behavior's `traces` (FR/SC id), `kind`, and state `PENDING`.
  - Mark A1 `DONE` once T005 has passed, citing `SP/r1-verify.txt`.
  - Create `tdd/cycle-log.md` with the baseline entry only: the result of `node --test .fork/ci/test/` (101 pass) and the commit SHA.

**Checkpoint**: the extension is installed and verified, and the test list and baseline exist. The adapter suite baseline is green.

---

## Phase 3: User Story 2 - The loop runs tests where the code is (P1) 🎯 MVP

**Goal**: `.fork/ci/bin/tdd.mjs` resolves the active feature to the right tree and folder and runs the right runner, with no false greens.

**Independent Test**: `cd W && node --test .fork/ci/test/tdd-target.test.mjs .fork/ci/test/tdd-commands.test.mjs .fork/ci/test/tdd-cli.test.mjs` passes. Quickstart §2–§3 gives the expected exits (0 / 3 / 0 / 0).

US2 comes before US1 because the profile and the hook depend on it.

- [ ] T007 [US2] [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] Run one cycle per behavior, in order, for feature resolution:
  - Tests go in `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.fork/ci/test/tdd-target.test.mjs`. Use in-memory fixture maps written to a temp dir, following `.fork/ci/test/fixtures.mjs`. No test-named files are written into the repo.
  - Implement `.fork/ci/lib/tdd-target.mjs` (`resolveTarget({repoRoot, env})`, `TargetError`), covering data-model.md `TddTarget.featureDir`, `TddTarget.tree`, `TddTarget.folder` and `TddTarget.lane`. A plan-line parse returns the first backticked token.
  - Record each cycle in `tdd/cycle-log.md`, and commit at each green.
- [ ] T008 [US2] [U10] [U11] [U12] [U13] [U14] [U15] [U16] [U17] [U18] Run one cycle per behavior for runtime commands:
  - Tests go in `.fork/ci/test/tdd-commands.test.mjs`.
  - Implement `.fork/ci/lib/tdd-commands.mjs`. It reuses `scanRuntimes` from `.fork/ci/lib/runtimes.mjs`, and the deno flags come from the same source as fork-ci's command, not a copy.
  - It covers data-model.md `RuntimeCommand.argv`, `RuntimeCommand.countParser` and `RuntimeCommand.unsupported`.
  - The name is always a single argv element; the anchored regex escapes `[.*+?^${}()|[\]\\]`.
- [ ] T009 [US2] [U19] [U20] [U21] [U22] [U23] Run one cycle per behavior for the CLI:
  - Tests go in `.fork/ci/test/tdd-cli.test.mjs`. They spawn `process.execPath .fork/ci/bin/tdd.mjs` against temp fixture repos (a fake `.specify/feature.json`, a plan, and a folder with real tiny `*.test.mjs` files). U20 needs a passing test, a failing test and a zero-match name.
  - Implement `.fork/ci/bin/tdd.mjs` per contracts/tdd-adapter-cli.md, using exit codes 0/1/2/3/4 per data-model.md `RuntimeCommand` exit codes. It ends with the summary line `[tdd] …`, and `suite` delegates to `.fork/ci/bin/run-folder.mjs`.
- [ ] T010 [US2] Refactor pass over `lib/tdd-target.mjs`, `lib/tdd-commands.mjs` and `bin/tdd.mjs`, with the full `node --test .fork/ci/test/` green after each move. Record "no refactor needed" if that's the outcome.
  - Then run quickstart §2–§3 against `W` itself (tree `W`, folder `.fork/ci`) and paste the four exit codes into the cycle log's notes.

**Checkpoint**: the adapter works, and every contract row A1–A15 is covered by a passing test.

---

## Phase 4: User Story 1 - Implementation can't skip the loop (P1)

**Goal**: a verified profile, an active mandatory hook, and the advisory fork-ci status that makes skipping visible (FR-014).

**Independent Test**:
- `.specify/memory/tdd-profile.md` lists `verified: [single, file, suite]`, and each was run.
- `.specify/extensions.yml` has `before_implement` with `optional: false`.
- `node --test .fork/ci/test/tdd-status.test.mjs .fork/ci/test/report.test.mjs .fork/ci/test/verdict.test.mjs` passes.

- [ ] T011 [US1] [A2] Write `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/memory/tdd-profile.md` per contracts/tdd-profile.md and data-model.md `TddProfile`. Follow `.specify/extensions/tdd/commands/speckit.tdd.setup.md` Phases 2–3 by hand (research R7):
  - Run each command, including the zero-match single test (it must exit 3).
  - Record `detected_at`, `suite_seconds` and `verified:` from real runs only, and give every null capability its reason.
  - Skip the setup's constitution step here (`--no-constitution`); that's handled in T019.
  - Record the verification in the cycle log as A2, and commit.
- [ ] T012 [US1] [U24] [U25] [U26] [U27] [U28] Run one cycle per behavior:
  - Tests go in `.fork/ci/test/tdd-status.test.mjs`, using temp fixture trees with `specs/*/spec.md`, `tdd/` files and `verification.md` frontmatter variants.
  - Implement `.fork/ci/lib/tdd-status.mjs` (`tddStatus(rootDir, headRef)`), covering data-model.md `TddStatus.headRef`, `TddStatus.features`, `TddStatus.verdict` and `TddStatus.linked`.
- [ ] T013 [US1] [U29] Run one cycle: extend `.fork/ci/test/report.test.mjs`, then add an optional 4th `tdd` parameter to `renderReport` in `.fork/ci/lib/report.mjs`. It renders contracts/fork-ci-tdd-status.md rows T1–T8, with no section for T9 or a missing argument.
- [ ] T014 [US1] [U30] Run one cycle:
  - Extend `.fork/ci/test/verdict.test.mjs` to assert that `computeVerdict`'s conclusion is identical across every `TddStatus` variant and a missing one.
  - Wire `.fork/ci/bin/verdict.mjs` to compute `tddStatus(process.cwd(), process.env.HEAD_REF ?? '')` and pass it to `renderReport` only. Never pass it to `computeVerdict`.
- [ ] T015 [US1] [U30] Edit `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.github/workflows/fork-ci.yml`: add `HEAD_REF: ${{ github.head_ref }}` to the verdict step's `env:`, and nothing else.
  - The self-test job's actionlint (1.7.12, checksum-verified) must pass; run it locally if it's available, otherwise on the PR.
  - Commit.

**Checkpoint**: the loop is enforceable with a real profile, and fork-ci shows TDD status without ever changing a verdict.

---

## Phase 5: User Story 3 - Staged PRs get a fair verdict (P2)

**Goal**: template overrides add the staged-PR base-red evidence rule and fail closed otherwise.

**Independent Test**: `node --test .fork/ci/test/tdd-overrides.test.mjs` passes. Calibration T022 classifies spec 002 C1/K4 per contract S1.

- [ ] T016 [US3] [U31] Write the drift test `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.fork/ci/test/tdd-overrides.test.mjs` first. Assert, for each of the two overrides:
  - the `base_sha256` header equals the SHA-256 of `.specify/extensions/tdd/templates/<name>`;
  - removing the `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->` block and its header reproduces the base byte for byte.
  - Its red is "override file missing". Record it.
- [ ] T017 [US3] [U31] Create `.specify/templates/overrides/tdd-test-quality-rubric.md` and `.specify/templates/overrides/tdd-loop-playbook.md` as copies of the installed templates.
  - Add the header (data-model.md `OverrideFile.base_sha256`, base `spec-kit-tdd 2.0.1`) and one fork section each, per contracts/staged-evidence-override.md:
    - the rubric gets evidence rules S1–S4;
    - the playbook gets the 5-step base-red procedure.
  - The section states it applies only when the plan Lane is `staged upstream PR`.
  - T016 must go green. Commit.

**Checkpoint**: staged-PR evidence is defined, and an extension update can't silently invalidate it.

---

## Phase 6: User Story 4 - Rules and runbook match the tooling (P2)

**Goal**: the constitution, runbook and templates describe the extension workflow without contradictions (SC-005).

**Independent Test**: quickstart §6. Then `/speckit-analyze` on this feature reports 0 contradictions.

- [ ] T018 [P] [US4] Edit `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/templates/tasks-template.md` (research R10):
  - Test tasks come from `tdd/test-list.md` and carry `[U#]`/`[A#]` markers.
  - The mandatory hook runs the loop. Never tick a marked task by hand.
  - The pre-merge gate includes `tdd.verify` with PASS or PASS_WITH_GAPS.
  - For the staged lane, the base-red step points to the override.
  - Edit `.specify/templates/plan-template.md` so the Lane block requires real **Worktree** (or "none (fork-`main` checkout)") and **Contribution folder** values, which the adapter reads.
- [ ] T019 [US4] Amend `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.specify/memory/constitution.md` to 1.3.0 (MINOR), following `/speckit-constitution`'s workflow (FR-011):
  - **Principle IV**: the feature's `tdd/cycle-log.md` is the red evidence for fork and upstream-bound lanes; the base-red rule applies for staged PRs; the extension's mandatory `before_implement` hook is the enforcement; disabling it requires `enabled: false` plus a stated reason in the feature's plan.
  - **Testing Standards and Quality Gates**: the `tdd.verify` verdict is part of Gate 1; the fork-ci TDD status is advisory.
  - Remove the Sync Impact Report before committing.
- [ ] T020 [P] [US4] Edit `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension/.fork/README.md`:
  - Add a "TDD workflow" section covering `tdd.plan` (after tasks), the loop (the mandatory hook), `tdd.verify` (before merge), the staged base-red rule, the advisory status, and how to disable the hook.
  - Update "Stage an upstream PR" steps 3–5 to use it.
  - Record the extension version, the tag commit `55221d4` and the zip's SHA-256 (from T004).
  - Edit `.fork/ci/README.md` to document `bin/tdd.mjs` and the advisory.
- [ ] T021 [US4] Run `npx --yes markdownlint-cli2 --config .github/.markdownlint.jsonc` on every changed Markdown file outside `.claude/skills/` and `.specify/extensions/` (the vendored folders), with 0 issues. Commit.

**Checkpoint**: the docs match the tooling.

---

## Phase 7: User Story 5 - Calibration (P3)

**Goal**: sensible audit verdicts on known work, with every fork-integration gap fixed before merge (FR-013, SC-004).

**Independent Test**: `specs/002-stage-pr-532-atomizer-default/tdd/verification.md` and `specs/003-tdd-extension/tdd/verification.md` exist in `W`, each with a verdict and no open fork-integration-gap findings.

- [ ] T022 [US5] [A3] Calibrate on spec 002:
  1. From `M`, temporarily recreate its worktree: `git worktree add .worktrees/stage-pr-532-atomizer-default stage/pr-532-atomizer-default`. Its plan names this path; the adapter must not fall back (FR-007).
     - In `W`, point `.specify/feature.json` at `specs/002-stage-pr-532-atomizer-default` for the duration. The adapter resolves the target from it, and the extension forbids setting `SPECIFY_FEATURE_DIRECTORY`.
     - Confirm with `node .fork/ci/bin/tdd.mjs where` that it resolves to that worktree and `recipes/atomizer`.
     - Restore it to `specs/003-tdd-extension` in step 5.
  2. Run the extension's verify procedure on `002-stage-pr-532-atomizer-default --no-tasks` from `W`, in a **fresh-context subagent**. Give it the absolute path of `.specify/extensions/tdd/commands/speckit.tdd.verify.md`, the override rubric, the profile, and verify Hard Rules 6–7 verbatim. It writes only `specs/002-…/tdd/verification.md`.
  3. Vet every cited line yourself.
  4. Classify each finding as justified-by-evidence or fork-integration gap.
  5. Restore `.specify/feature.json` to `specs/003-tdd-extension` (check with `tdd.mjs where`), then remove that worktree again.
- [ ] T023 [US5] [A3] Fix every fork-integration-gap finding from T022 inside this feature, each as its own red-green cycle when it's code, then re-run T022. Repeat until there are 0 gaps. Justified findings, such as "evidence outside the cycle log" for 002, stay in the report.
- [ ] T024 [US5] [A3] Audit spec 003 itself the same way, in a fresh subagent: `verify 003-tdd-extension` from `W`, with remediation tasks allowed. Resolve any HIGH finding before T027. Then mark A3 `DONE` in the test list.

---

## Phase 8: Gate self-check & landing (gate: T001–T027 `[X]`)

- [ ] T025 [P] Lane hygiene: `git -C W diff --stat main...HEAD` must list only fork-only paths (`.specify/`, `.fork/`, `specs/003-tdd-extension/`, `specs/002-stage-pr-532-atomizer-default/tdd/`, `.claude/skills/speckit-tdd-*`, `.github/workflows/fork-ci.yml`) (FR-015). Also run a secret scan of the diff.
- [ ] T026 [P] Full self-test `node --test .fork/ci/test/`, all passing. Then confirm the test list has every behavior `DONE` (or `DROPPED` with a reason), and that the cycle log has one entry per cycle with a red.
- [ ] T027 Mark T001–T027 `[X]`. Set spec.md Status to `Implemented`. Commit, and push `fork/tdd-extension`.
- [ ] T028 Open the fork PR: `gh pr create -R mfelker/OB1 --base main --head fork/tdd-extension --title "[fork] Adopt spec-kit-tdd for enforced TDD (spec 003)"`. The body includes the A1 verification table, the test counts, the calibration verdicts, and a note that `OB1 Review` is expected to fail on a fork-only PR.
  - Wait with an `until` loop for `fork-ci-verdict` (with `self-test`) to go green.
  - Confirm the `TDD status (advisory)` section shows `specs/003-tdd-extension` (quickstart §5, SC-007).
- [ ] T029 **Ask the owner first**: merge with `gh pr merge <N> -R mfelker/OB1 --merge --admin` (the documented bypass for `OB1 Review` on fork-only PRs, research R12).
  - Then run `git -C M pull --ff-only origin main` and `git worktree remove .worktrees/fork-tdd-extension`.
  - Confirm `M/.specify/extensions.yml` now carries the tdd hooks.
  - Mark T028–T029 `[X]` and commit on `main`.

---

## Dependencies & Execution Order

- **T001 → T002 and T003 (in parallel) → T004 → T005 → T006**, then:
  - **US2** (T007 → T008 → T009 → T010)
  - **US1** (T011 needs T009; then T012 → T013 → T014 → T015)
  - **US3** (T016 → T017; needs only T005)
  - **US4** (T018 and T020 in parallel; T019; then T021)
  - **US5** (T022 needs T011 and T017; then T023 → T024)
  - **Gate** (T025, T026 → T027 → T028 → T029)
- **Why US2 runs before US1**: the profile's commands call the adapter.
- **US3 can run in parallel with US2 and US1 after T005**, because the override files and their test touch nothing else.
- **T008 needs T007**: the commands resolve files against `TddTarget`.
- **T014 needs T012 and T013.**
- **The adapter, status and report tasks each touch different files**, but they're sequential cycles, because each runs the full suite at green.

## Parallel Example

```bash
# After T005: overrides alongside the adapter work
Task: "T016–T017 overrides + drift test"     # US3
Task: "T007 tdd-target cycles"               # US2
# Docs
Task: "T018 tasks/plan templates"            # US4
Task: "T020 runbook + ci README"             # US4
```

## Implementation Strategy

- **MVP = Setup, Foundational, US2 and T011** (install, adapter, profile). After that merge, the mandatory hook can drive real features.
- **US1's advisory and US3's overrides** make the enforcement visible and fair.
- **US4 makes the rules match the tooling.**
- **US5 proves it on real work before anything relies on it.**
- **Landing**: a single fork PR, with the bypass merge only on the owner's approval.

## Notes

- Never edit `.specify/extensions/tdd/**`. Customize only through `.specify/templates/overrides/`.
- Nothing downloaded into `SP` is executed. The zip contents are Markdown and YAML, installed with `--dev`.
- The cycle log is append-only. A test-after admission is recorded honestly, never disguised.
