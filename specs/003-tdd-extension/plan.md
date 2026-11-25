# Implementation Plan: Adopt the spec-kit-tdd extension for enforced TDD

**Branch**: `fork/tdd-extension` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-tdd-extension/spec.md`

## Summary

Install spec-kit-tdd v2.0.1, which adds four commands: setup, plan, run and verify. Its mandatory `before_implement` hook makes `/speckit-implement` drive every behavior through a recorded red-green-refactor cycle first. Then make it work in this fork:

1. **Adapter** `.fork/ci/bin/tdd.mjs`. The profile's single-test, file and suite commands call it.
   - It resolves the active feature (`.specify/feature.json`, then that feature's `plan.md` **Worktree** and **Contribution folder**) to a tree and a folder.
   - It picks the runner with fork-ci's own `scanRuntimes`, and guards against false greens. Node's name filter exits 0 even when nothing matches, so the adapter checks the test count itself.
2. **Profile** `.specify/memory/tdd-profile.md`, with every command verified by running it.
3. **Template overrides** in `.specify/templates/overrides/`, so a staged PR counts "red against the PR base, green at the head" as test-first evidence.
4. **Advisory fork-ci TDD status** (FR-014). The verdict summary shows the linked feature's cycle log, audit report and verdict, and never changes the outcome.
5. **Rules and docs**: amend constitution Principle IV, and update the runbook and the tasks template.
6. **Calibration**, after the merge and from the fork-`main` checkout: `tdd.verify` on spec 002 (expected `BLOCKED`), on a calibration fixture with real base-red evidence (the positive staged-PR check), and on spec 003. Plus a post-merge smoke run proving `/speckit-implement` is blocked without a test list and drives the loop with one.

## Lane

**Lane**: fork feature
**Branch / Base**: `fork/tdd-extension` from fork `main` (`43e898a`; it contains `upstream/main` `238df6c`)
**Contribution folder**: `.fork/ci` (the adapter and fork-ci code and tests). The feature also edits other fork-only paths, listed under Project Structure.
**Worktree**: none (fork-`main` checkout). Merged in PR #16 (`6a4e195`); the integration worktree `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension` has been removed (R12). Spec-kit commands run from the fork-`main` checkout (`/Users/mfelker/Projects/ob1`).

## Technical Context

**Language/Version**: Node.js ESM (`.mjs`), the same as `.fork/ci/`. Local and CI use Node 26. The adapter requires **Node ≥ 26**: that's the only version its `--test-isolation=none` and `--test-reporter=spec` behavior was verified on (research R5). It's fork tooling, not an upstream recipe. The extension itself is Markdown prompts.

**Primary Dependencies**: none new in code. The adapter imports `.fork/ci/lib/runtimes.mjs` (`scanRuntimes`) and `exec.mjs` (`runCommand`). The extension spec-kit-tdd v2.0.1 (MIT) is installed with `specify extension add --dev`.

**Storage**: N/A. The extension writes per-feature Markdown under `specs/<feature>/tdd/`.

**AI Gateway**: N/A

**Testing**: `node --test` in `.fork/ci/test/`. There are 101 tests today; fork-ci's `self-test` job runs them, plus actionlint for workflow changes.

**Target Platform**: the local spec-kit workflow (Claude Code skills) and the GitHub Actions `fork-ci` workflow.

**Project Type**: fork-only tooling (no upstream category)

**Constraints**: fork-only paths only (FR-015). Never edit the installed extension; customize it only through the override stack. No secrets. The fork-ci advisory must never change `fork-ci-verdict`. Keep the extension's hook semantics: `before_implement` stays mandatory.

**Scale/Scope**: about 4 new library or bin files, about 4 new test files, 2 template overrides, a profile, 1 workflow change, and edits to the constitution, runbook, tasks template, plan template and gitignore.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes.*

- [x] **I. Additive-only data**: no SQL or data changes.
- [x] **II. Remote MCP only**: no MCP changes.
- [x] **III. Contribution contract**: N/A. Nothing goes into an upstream category folder.
- [x] **IV. Test-First**:
  - Red-green-refactor for every adapter and fork-ci behavior.
  - The extension can't drive its own installation, so this feature follows its rules by hand. It keeps `specs/003-tdd-extension/tdd/test-list.md` and `tdd/cycle-log.md` in the extension's format, with real red output (research R11). Those files are then audited with `tdd.verify`.
  - The template overrides are prompt text with no unit test. They're verified by the calibration run (US5) and by a drift test that pins the bytes they were derived from.
- [x] **V. Lane separation**: fork-only paths only. No upstream-tracked file changes, and the `git diff --stat main...HEAD` check is a task.
- [x] **VI. Security, content & licensing**:
  - The extension is MIT and contains prompts only, with no scripts. It's installed only after a byte-for-byte check against the reviewed `v2.0.1` tag (research R1).
  - The adapter never runs a live-credential script differently than fork-ci would. Those stay recorded as profile constraints.
- [x] **VII. Sync discipline**: fork `main` contains `upstream/main` (`238df6c`). N/A otherwise: this isn't a staged PR.

**Fork CI policy**:
- This changes `.github/workflows/fork-ci.yml`, a fork-owned file. The advisory step is added without changing which checks are required.
- `OB1 Review` will fail on this fork-only PR (Folder structure, Scope), as the runbook documents. Landing therefore uses the admin bypass or a local merge, decided in research R12.

## Project Structure

### Documentation (this feature)

```text
specs/003-tdd-extension/
├── plan.md                # This file
├── research.md            # Phase 0: R1–R14
├── data-model.md          # Phase 1: TddTarget, RuntimeCommand, TddStatus, OverrideFile, profile
├── quickstart.md          # Phase 1: validation run guide
├── contracts/
│   ├── tdd-adapter-cli.md        # .fork/ci/bin/tdd.mjs
│   ├── tdd-profile.md            # .specify/memory/tdd-profile.md shape for this fork
│   ├── staged-evidence-override.md
│   └── fork-ci-tdd-status.md     # advisory section in the verdict summary
├── tdd/                   # written by hand, in the extension's format (R11)
│   ├── test-list.md
│   ├── cycle-log.md
│   └── cycle-log.d/       # per-stream fragments during parallel work (R14)
├── evidence/              # r1-verify.md (install check), smoke.md
├── calibration/staged-fixture/   # post-merge positive check of the staged-PR override
├── checklists/requirements.md
└── tasks.md               # /speckit-tasks output
```

### Source Code (worktree root)

```text
.fork/ci/
├── bin/tdd.mjs                   # NEW adapter CLI: where | single | file | suite
├── bin/verdict.mjs               # EDIT: render the advisory TDD status
├── lib/tdd-target.mjs            # NEW: feature → {tree, folder}
├── lib/tdd-commands.mjs          # NEW: buildCommand (runtime → argv, cwd), parsers, zero-match guard
├── lib/tdd-env.mjs               # NEW: childEnv (credential blanking, FR-016)
├── lib/tdd-status.mjs            # NEW: PR head ref → feature → artifact status
├── lib/report.mjs                # EDIT: "TDD status (advisory)" section
├── test/tdd-target.test.mjs      # NEW
├── test/tdd-commands.test.mjs    # NEW
├── test/tdd-cli.test.mjs         # NEW: end to end against fixture trees
├── test/tdd-status.test.mjs      # NEW
├── test/tdd-env.test.mjs         # NEW
├── test/tdd-overrides.test.mjs   # NEW: override drift pin (R8)
├── test/tdd-docs.test.mjs        # NEW: US4 statements (A13, A14)
└── README.md                     # EDIT: adapter + advisory docs
.github/workflows/fork-ci.yml     # EDIT: pass HEAD_REF to the verdict step
.specify/
├── extensions/tdd/               # INSTALLED (specify extension add --dev), never edited
├── extensions.yml                # UPDATED by the installer (4 tdd hooks)
├── memory/tdd-profile.md         # NEW: verified profile
├── memory/constitution.md        # AMEND: Principle IV (1.2.0 → 1.3.0)
├── templates/overrides/tdd-test-quality-rubric.md   # NEW
├── templates/overrides/tdd-loop-playbook.md         # NEW
├── templates/tasks-template.md   # EDIT: test list, loop, audit; [U#] markers
├── templates/plan-template.md    # EDIT: Lane block requires Worktree + Contribution folder lines
└── .gitignore                    # EDIT: extensions/.cache/
.claude/skills/speckit-tdd-*/     # INSTALLED by the installer
.fork/README.md                   # EDIT: TDD workflow per lane, hook disable
```

**Structure Decision**:
- The adapter is a thin CLI over two pure libraries (`tdd-target`, `tdd-commands`), matching fork-ci's existing bin/lib split, which keeps the logic unit-testable.
- The advisory is a third pure library that the existing verdict renderer consumes. It doesn't change `computeVerdict`, so FR-014's "never changes the outcome" holds by construction.

## Complexity Tracking

One recorded constitution exception, plus deliberate trade-offs.

| Violation | Why needed | Simpler alternative rejected because |
|-----------|------------|--------------------------------------|
| **Gate 1 bootstrap exemption**: 003 merges with its `speckit.tdd.verify` verdict FAIL (`tdd/verification.md`, T026a), although constitution 1.3.0 Gate 1 requires PASS or PASS_WITH_GAPS. | 003 is the feature that installs the audit. The extension could not drive its own installation (R11), so the loop was hand-followed. The FAIL has three causes no pre-merge work can remove: A7–A12 and A15 can only be tested after the merge, with the extension installed on `main`; A3–A6, U29 and U32 passed on their first run over existing units and carry deliberate-mutant reds, so they are permanently `TEST_AFTER`; A1 and A2 are evidenced by documents, not executable tests (owner decision: kept as-is). The T026a audit's surviving mutants were fixed (`1c2df30`). | Restructuring the test list to fit the rubric would drop US2's acceptance scenarios as rows. Merging with no recorded exception would leave the PR that introduces Gate 1 in silent violation of it. |

Scope of the exemption: 003 only. Gate 1's audit applies in full to every feature planned after 1.3.0 is installed. T032 re-audits 003 after the merge for the record; its verdict is not a merge gate.

Trade-offs recorded in research:

- **R11**: the feature hand-follows the loop instead of letting the extension drive it.
- **R12**: landing a fork-only PR uses the admin bypass for `OB1 Review`.
- **Test placement**: `.fork/ci/test/` also holds the override drift test and the docs test, although they cover `.specify/` files. Those files have no runner of their own, and `.fork/ci/test/` is the fork tooling's suite that CI already runs.
- **Constitution bump is MINOR**: Principle IV isn't redefined. Its rule ("a failing test committed or demonstrably run red") is kept; the amendment names the cycle log as the form that evidence takes and adds the enforcement hook.
