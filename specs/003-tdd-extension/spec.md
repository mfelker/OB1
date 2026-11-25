# Feature Specification: Adopt the spec-kit-tdd extension for enforced TDD

**Feature Branch**: `fork/tdd-extension`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Adopt the spec-kit-tdd extension (d0whc3r/spec-kit-tdd v2.0.1) to enforce TDD discipline in the fork: install it from the vetted release zip, add a fork-only adapter so its profile commands run tests in the active feature's worktree and contribution folder via fork-ci runtime detection, add template overrides so staged upstream PRs count red-against-PR-base as test-first evidence, amend constitution Principle IV so the cycle log is the red evidence, update runbook and tasks template, and calibrate by running tdd.verify on spec 002"

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | fork feature |
| **Branch** | `fork/tdd-extension` |
| **Base** | fork `main` |
| **Category** | N/A: fork-only tooling (`.specify/`, `.fork/`, `specs/`, `.claude/skills/`) |
| **Contribution folder** | N/A. Fork-only paths, never offered upstream |
| **Upstream PR** | N/A (fork-only) |
| **Requires** | The spec-kit-tdd extension v2.0.1 (MIT, `d0whc3r/spec-kit-tdd`) and spec-kit ≥ 0.12.17 (installed: 1.4.4) |

## User Scenarios & Testing *(mandatory)*

The **fork owner** runs spec-kit features in three lanes (fork, upstream-bound, staged upstream PR) and wants TDD to be enforced by the workflow instead of followed by convention. **Future agent sessions** run `/speckit-implement` and must not be able to write a feature test-after.

### User Story 1 - Implementation cannot skip the red-green loop (Priority: P1)

When the owner runs `/speckit-implement` on any feature, the loop runs first: one behavior at a time, a failing test observed and its real failure output recorded, then the smallest change to pass, then refactor. Only work that changes no behavior (wiring, config, docs) is left for the normal implement step.

**Why this priority**: This is the reason for the feature. Today TDD in this fork depends on the agent following the constitution by choice, and spec 002 showed the evidence had to be improvised (`evidence/` folder).

**Independent Test**: On a throwaway fork-only feature with one behavior, run `/speckit-implement`. Check that the loop runs before any implementation, that a cycle log entry with a recorded red exists, and that the behavior's task is ticked by the loop and not rewritten afterwards.

**Acceptance Scenarios**:

1. **Given** the extension is installed with its mandatory pre-implementation hook enabled, **When** the owner runs `/speckit-implement` on a feature with a test list, **Then** every behavior on the list is driven through a recorded red-green-refactor cycle before any non-behavioral task is implemented.
2. **Given** a feature with tasks but no test list, **When** `/speckit-implement` runs, **Then** implementation stops with a message to plan the test list first. It does not proceed test-after.
3. **Given** a completed cycle, **When** the owner opens the feature's cycle log, **Then** it shows the test, the command that ran it red, the decisive failure line, what made it green, and the commit.

---

### User Story 2 - The loop runs tests where the code actually is (Priority: P1)

For upstream-bound and staged-PR features, the code lives in a git worktree under `.worktrees/`, while spec-kit commands run from the fork-`main` checkout. Every test command the extension uses (single test, one file, the folder's suite) must run against the active feature's worktree and contribution folder, with the right runner for that folder (Deno, Node script, plain Node, Python, SQL), as fork-ci would.

**Why this priority**: Without it the extension is unusable here. It would write and run tests against fork `main`'s copy of the folder instead of the branch under work, and it would find no repository-wide test runner because none exists.

**Independent Test**: With a feature whose plan names a worktree and a contribution folder, run the single-test command against a known test and against a non-existent test name. The first runs exactly that test in the worktree. The second reports zero tests rather than silently passing.

**Acceptance Scenarios**:

1. **Given** the active feature's plan records a worktree and a contribution folder, **When** the extension's suite command runs, **Then** it runs that folder's tests inside that worktree using the same runtime detection as fork-ci, and reports pass/fail counts.
2. **Given** a test name that matches nothing, **When** the single-test command runs, **Then** it reports zero tests run and exits non-zero (no false green).
3. **Given** a fork feature with no worktree (it works in the fork-`main` checkout), **When** the commands run, **Then** they use the fork-`main` checkout and the folder named in the plan.
4. **Given** the plan names no folder or a folder with no detectable runtime, **When** any command runs, **Then** it fails with a message naming what is missing rather than running some other folder's tests.

---

### User Story 3 - Staged upstream PRs get a fair verdict (Priority: P2)

For a staged PR, the author's code already exists before the fork writes tests, so commit order alone always looks "test-after". The audit must instead accept the fork's stronger evidence: the new tests observed failing against the PR's base commit and passing against the PR head.

**Why this priority**: Without it, every staged PR fails the audit, which trains the owner to ignore the audit. It's lower than US1 and US2 because it only affects the verdict, not the loop.

**Independent Test**: Run the audit on spec 002 (staged #532). Behaviors whose tests were shown red against the PR base are classified as test-first, not test-after.

**Acceptance Scenarios**:

1. **Given** a staged-PR feature whose cycle log records a red against the PR base and a green at the PR head, **When** the audit runs, **Then** those behaviors are classified as test-first and do not by themselves cause a FAIL.
2. **Given** a staged-PR behavior with no red recorded against the PR base, **When** the audit runs, **Then** it is classified test-after, as for any other lane (fail closed).
3. **Given** a fork or upstream-bound feature, **When** the audit runs, **Then** the standard rules apply unchanged (the staged-PR rule never applies outside the staged lane).

---

### User Story 4 - The rules and runbook say the same thing as the tooling (Priority: P2)

The constitution, the runbook and the tasks template describe the extension-based workflow: the cycle log is the "demonstrably run red" evidence, the test list drives the test tasks, and the audit verdict is part of the gate.

**Why this priority**: Constitution and runbook drift was a recurring analyze finding (D1, D2, the "advisory" OB1 gate). Tooling that contradicts the written rules gets bypassed.

**Independent Test**: Read Principle IV, the runbook's staging steps and the tasks template, and confirm each names the cycle log as red evidence, the test list as the source of test tasks, and the audit's place in the merge gate.

**Acceptance Scenarios**:

1. **Given** the amended constitution, **When** a reviewer checks Principle IV, **Then** it names the feature's cycle log as the required red evidence for fork and upstream-bound features, and red-against-PR-base as the evidence for staged PRs.
2. **Given** the updated runbook, **When** the owner follows "Stage an upstream PR", **Then** the steps include the test list, the loop, and the audit before the merge.

---

### User Story 5 - Calibration on real past work (Priority: P3)

Before the extension gates a new feature, the audit is run on spec 002, a completed staged PR, to show that the adapter and overrides give a sensible verdict on known-good work.

**Why this priority**: It's a confidence check, not a capability.

**Independent Test**: The audit report for spec 002 exists, gives a verdict, and every finding in it is either justified by the evidence or traced to a gap in the adapter/overrides that this feature then fixes.

**Acceptance Scenarios**:

1. **Given** the extension, adapter and overrides are in place, **When** the audit runs on spec 002, **Then** it produces a verdict report, and the owner can see why each behavior was classified as it was.

---

### Edge Cases

- **The extension is updated upstream later**: the fork's template overrides and adapter keep working, or the update is detectably incompatible (pinned version recorded; overrides keyed by template name).
- **The release zip differs from the reviewed source**: installation stops. Only content matching the reviewed v2.0.1 commands and templates is installed.
- **Docs-only feature** (no behaviors): the mandatory hook doesn't block. The test list records zero behaviors with a reason, and implement proceeds.
- **A contribution folder with several runtimes** (for example Deno plus a Node script): each command targets the runtime that owns the file, as fork-ci does.
- **A red baseline suite** in the target folder: the loop refuses to start and reports the failing tests (the extension's own rule). Pre-existing failures in upstream code are reported, not fixed.
- **A test that needs credentials or network**: it's reported as a constraint in the profile and never run live by the loop. This is the `test-atomize.mjs` lesson.
- **A feature started before adoption** (specs 001 and 002): existing work isn't re-gated. Only calibration reads spec 002.
- **The mandatory hook needs to be off temporarily**: it can be disabled explicitly and visibly in `.specify/extensions.yml`, never by deleting the extension.
- **A PR that touches more than one feature's files, or none** (an upstream sync, a fork-only docs PR): fork-ci reports each linked feature's TDD status, or "no feature linked". The advisory never blocks (FR-014).
- **Mid-cycle interruption**: a behavior left red or green can be resumed. The log is append-only and never rewritten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The fork MUST install the spec-kit-tdd extension at exactly version 2.0.1 from its release archive, and MUST verify before installing that the archive's commands and templates match the reviewed source.
- **FR-002**: The extension's mandatory pre-implementation hook MUST be active, so `/speckit-implement` drives the feature's behaviors through the red-green loop before implementing anything else.
- **FR-003**: The extension's optional post-tasks hook (derive the test list) and post-implementation hook (audit) MUST be registered and offered.
- **FR-004**: The fork MUST provide an adapter that the extension's profile commands call. It resolves the active feature (from spec-kit's feature pointer and that feature's plan) to a working tree (the plan's worktree, or the fork-`main` checkout for fork features) and a contribution folder.
- **FR-005**: The adapter MUST support "single test by file and name", "one file", and "the folder's suite". It MUST select the runner with the same runtime detection fork-ci uses.
- **FR-006**: The adapter's single-test command MUST report zero tests and exit non-zero when the name matches nothing.
- **FR-007**: The adapter MUST fail with an explicit message, and never fall back to another folder or tree, when the feature, worktree, folder or runtime cannot be resolved.
- **FR-008**: The adapter MUST have its own automated tests in the fork's CI test suite, written test-first. This feature dogfoods the loop where the extension can already run on fork-only code.
- **FR-009**: The fork MUST hold a verified test profile for the extension that records only commands actually executed, and records the known constraints: no repo-wide runner, live-credential scripts, Deno and Python availability.
- **FR-010**: The fork MUST provide template overrides, using the extension's override mechanism and never editing the installed extension, that let staged-PR behaviors count as test-first when the cycle log records a red against the PR base and a green at the PR head. Without that evidence they stay test-after.
- **FR-011**: Constitution Principle IV MUST be amended to name the cycle log as the red evidence (fork and upstream-bound lanes) and red-against-PR-base as the staged-PR evidence, with a version bump and sync report.
- **FR-012**: The runbook (`.fork/README.md`) and the tasks template MUST describe the extension workflow (test list, loop, audit) for all three lanes, including how to disable the mandatory hook explicitly.
- **FR-013**: The audit MUST be run on spec 002 as calibration. Its report MUST be kept, and every finding caused by a fork-integration gap (adapter or override) MUST be fixed within this feature.
- **FR-014**: fork-ci MUST report, **advisory only**, the TDD artifact status for each PR into fork `main` whose changes belong to a spec-kit feature: whether the feature's cycle log and audit report exist, and the audit verdict (PASS / PASS_WITH_GAPS / FAIL / BLOCKED / missing). It MUST appear in the verdict summary and MUST NOT change `fork-ci-verdict`'s pass/fail outcome. A PR whose feature can't be identified is reported as "no feature linked", not as a failure. *(Clarified 2026-11-25, Q1 option B: advisory now. Making it blocking for `stage/`/`contrib/` PRs is a possible later follow-up once calibration (US5) has proven the audit fair.)*
- **FR-015**: The feature MUST change only fork-only paths (`.specify/`, `.fork/`, `specs/`, `.claude/skills/`, `.github/workflows/fork-*`). No upstream-tracked file may change.

### Testing Requirements *(mandatory)*

- **Runner**: Node's built-in test runner, matching the existing `.fork/ci/test/` suite (101 tests) that fork-ci's self-test job runs.
- **Behaviors that MUST have tests**:
  - Adapter feature resolution: worktree, fork-`main` and missing cases (FR-004, FR-007).
  - Runner selection per runtime (FR-005).
  - Single test on a known name, and a zero-match name reported as non-zero (FR-006).
  - Suite counts.
  - Overrides: staged-PR classification with and without base-red evidence (FR-010). This one is verified by the calibration run, since the overrides are prompt text.
  - fork-ci advisory TDD status (FR-014): artifacts present, missing, each verdict value, "no feature linked", and that `fork-ci-verdict`'s outcome is unchanged in every case.
- **Existing test coverage**: fork-ci's `lib/` (101 tests) covers runtime detection, which the adapter reuses. There's no coverage yet for feature resolution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of features implemented after adoption have a cycle log with a recorded red for every behavior, or an explicit test-after admission.
- **SC-002**: 0 behavioral tasks in features implemented after adoption are completed by the normal implement step instead of the loop.
- **SC-003**: The adapter runs the correct folder in the correct tree in 100% of tested cases, including all five fork-ci runtimes, and never reports a green for a test name that matches nothing.
- **SC-004**: The calibration audit on spec 002 produces a verdict with 0 findings caused by fork-integration gaps once this feature lands.
- **SC-005**: The constitution, runbook and tasks template contain 0 statements that contradict the extension workflow (checked by `/speckit-analyze`).
- **SC-006**: Adoption adds no more than one extra command to the owner's per-feature workflow beyond `/speckit-implement`. The loop and audit run through hooks.
- **SC-007**: 100% of fork PRs that belong to a spec-kit feature show that feature's TDD artifact status in fork-ci's summary, and 0 PRs change pass/fail because of it.

## Assumptions

- The reviewed v2.0.1 payload (manifest, 4 commands, 4 templates) is what the release zip contains. FR-001 verifies this before installing.
- Hooks run automatically (`auto_execute_hooks: true` in `.specify/extensions.yml`), so the mandatory pre-implementation hook really blocks test-after implementation in agent sessions.
- Mutation tooling is absent for most contribution folders, and the fork won't add dependencies to upstream folders. The audit uses its deliberate-mutant fallback.
- The adapter reuses fork-ci's existing runtime detection rather than duplicating it, so fork-ci and the TDD loop can't disagree about which runner owns a file.
- Specs 001 and 002 aren't retrofitted with test lists. Spec 002 is only read for calibration.
- The extension writes per-feature artifacts (`tdd/test-list.md`, `tdd/cycle-log.md`, `tdd/verification.md`) inside `specs/<feature>/`, which is fork-only and stays on fork `main`.
- Deferred: the fork-ci "manual scripts" mechanism from spec 002 is a separate feature. The adapter only needs to record live-credential scripts as constraints.
