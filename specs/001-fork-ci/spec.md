# Feature Specification: Fork CI (per-folder test enforcement)

**Feature Branch**: `fork/fork-ci`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Fork CI workflow (fork-ci) for the mfelker/OB1 fork. Lane: fork feature, branch fork/fork-ci, base fork main. A fork-only GitHub Actions workflow (fork-only file name, e.g. .github/workflows/fork-ci.yml, never sent upstream) that enforces constitution Principle IV (Test-First) because upstream CI runs no contribution tests. On pull requests into fork main (and on push to main), it detects which contribution folders changed (recipes/, schemas/, integrations/, dashboards/, skills/, extensions/, primitives/, server/) and runs each folder's tests with the right runner: deno test for Deno Edge Functions, Vitest/npm test for Node TypeScript apps, node --test or node test-*.mjs for plain Node, pytest for Python importers. Folders with executable code but no tests fail the check (strict TDD), while docs-only folders are exempt. Must never require live credentials. Complements, not duplicates, upstream's OB1 PR Gate and Markdown Lint, which stay enabled under the Option C fork CI policy; fork-only paths (.specify/, specs/, .fork/, .claude/skills/speckit-*) are treated as valid and skipped."

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | Fork feature |
| **Branch** | `fork/fork-ci` |
| **Base** | fork `main` |
| **Category** | None (fork infrastructure, not an OB1 contribution category) |
| **Contribution folder** | Fork-only CI definition under a fork-only file name (`fork-*`) plus any fork-only helper files; no upstream-tracked file is modified |
| **Upstream PR** | N/A (fork-only, never sent upstream) |
| **Requires** | Constitution v1.1.0 Fork CI policy (Option C); upstream OB1 PR Gate and Markdown Lint remain enabled |

## User Scenarios & Testing *(mandatory)*

The single actor is the **fork owner**. They stage upstream pull requests, build their own features, and sync with upstream, and they need an automatic, trustworthy verdict on whether every changed piece of executable code is tested and passing.

### User Story 1 - Changed code is tested before it lands (Priority: P1)

When the fork owner proposes a change to fork `main` that touches one or more contribution folders, the fork automatically identifies each changed folder, runs that folder's tests with the runner that fits its code, and reports a pass/fail verdict per folder plus an overall verdict.

**Why this priority**: This is the reason the feature exists. Upstream CI runs no contribution tests, so without this, Principle IV (Test-First) is enforced only by memory.

**Independent Test**: Open a change that modifies a folder with passing tests and one with a deliberately failing test; the result shows one folder passing, one failing, and an overall failure naming the failing folder.

**Acceptance Scenarios**:

1. **Given** a change touching one contribution folder whose tests pass, **When** the check runs, **Then** that folder is reported as passed and the overall verdict is pass.
2. **Given** a change touching two folders where one folder's tests fail, **When** the check runs, **Then** the failing folder is named with its test output, the passing folder is still reported, and the overall verdict is fail.
3. **Given** a change touching folders written in different languages (for example, a Deno Edge Function and a Python importer), **When** the check runs, **Then** each folder is tested with its own appropriate runner.

---

### User Story 2 - Untested code is caught (Priority: P1)

When a changed folder contains executable code but no tests, the check fails for that folder and says exactly why ("executable code, no tests found"), so a staged upstream PR or a new feature cannot reach fork `main` untested.

**Why this priority**: It enforces the strict-TDD rule for staged PRs ("tests before merge"). 58 of 64 existing code folders have no tests, so this is the case that will come up most often.

**Independent Test**: Change a code file in a folder that has no test files; the check fails for that folder with the "no tests found" reason.

**Acceptance Scenarios**:

1. **Given** a change to a folder with executable code and zero test files, **When** the check runs, **Then** that folder fails with reason "no tests found" and the overall verdict is fail.
2. **Given** a change to a folder containing only documentation, prompts, metadata, or images (no executable code), **When** the check runs, **Then** the folder is reported as "exempt (docs-only)" and does not affect the verdict.

---

### User Story 3 - Fork-only and non-contribution changes don't produce false failures (Priority: P2)

When a change touches only fork-only paths (`.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`), or other non-contribution paths, the check finishes quickly with a pass and a note that no contribution folders changed.

**Why this priority**: Spec-kit work happens constantly on the fork. False failures would train the owner to ignore the check.

**Independent Test**: Open a change that edits only `specs/` and `.fork/`; the check passes and reports "no contribution folders changed".

**Acceptance Scenarios**:

1. **Given** a change touching only fork-only paths, **When** the check runs, **Then** it passes and lists zero folders tested.
2. **Given** a change touching fork-only paths and one contribution folder, **When** the check runs, **Then** only the contribution folder is evaluated.

---

### User Story 4 - Upstream syncs are handled predictably (Priority: P2)

When the owner merges `upstream/main` into fork `main`, upstream's changes may touch older folders that have no tests. The check's behavior for these sync merges is explicit and documented, so a routine sync is never blocked by surprise.

**Why this priority**: Syncs are scheduled weekly. If their outcome is unpredictable, the owner will either stop syncing or stop trusting the check.

**Independent Test**: Run the check against a sync merge that brings in changes to an untested upstream folder; the outcome matches the rule chosen in FR-010.

**Acceptance Scenarios**:

1. **Given** an upstream sync merge touching an untested folder, **When** the check runs, **Then** the folder is reported as "untested (from upstream)", the overall verdict is not failed by it, and the report says the change came from upstream.
2. **Given** an upstream sync merge touching a folder whose existing tests now fail, **When** the check runs, **Then** the failure is reported as advisory "failing (from upstream)" and the owner can see which upstream folders need attention.

---

### Edge Cases

- A change deletes an entire contribution folder: nothing is tested for it; it is reported as "removed".
- A folder contains code in more than one runtime (for example, an Edge Function plus a Node helper script): every applicable runner runs, and the folder passes only if all pass.
- A folder's tests exist but its dependencies cannot be installed (no lockfile, registry outage): the folder fails with an "environment/setup" reason, distinguishable from a test failure.
- A test hangs: the folder is stopped after a time limit and fails with a "timeout" reason; other folders still report.
- A change touches a `_template/` folder: treated as documentation scaffolding and exempt.
- A change touches the core `server/` folder: treated as a contribution folder and tested like any other.
- A test tries to reach a live service using credentials: no credentials are available, so it fails, which signals that the test must be mocked (Principle IV).
- A change touches many folders at once (for example, a large staged PR): every folder is still evaluated, independently and in parallel where possible.
- A change touches only SQL files in a folder: its verification script runs if present; otherwise "SQL unverified" is reported as advisory (FR-011).
- A `stage/` or `contrib/` change is merged locally, bypassing the PR: the after-the-fact run on fork `main` still reports it, and the branch-protection requirement (FR-012) flags the bypass.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The check MUST run automatically on every proposed change targeting fork `main` and on every update to fork `main`.
- **FR-002**: The check MUST determine the set of changed contribution folders, where a contribution folder is `<category>/<name>/` for categories `recipes`, `schemas`, `integrations`, `dashboards`, `skills`, `extensions`, `primitives`, plus the core `server/` folder.
- **FR-003**: Fork-only paths (`.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`) and `_template/` folders MUST be ignored for test purposes and MUST NOT cause failure.
- **FR-004**: For each changed folder, the check MUST classify it as **code** (contains executable source: TypeScript, JavaScript, or Python) or **docs-only** (no executable source), and MUST exempt docs-only folders.
- **FR-005**: For each code folder, the check MUST select the test runner from the folder's own contents, following the constitution's Testing Standards: Deno test runner for Deno Edge Functions, the folder's declared Node test script (Vitest or `node --test`) for Node projects, plain Node test scripts (`test-*.mjs`) where that is the folder's convention, and pytest for Python.
- **FR-006**: A code folder with no test files MUST fail with the reason "no tests found".
- **FR-007**: The check MUST report, per folder: name, classification, runner(s) used, outcome (pass / fail / exempt / removed), and a failure reason category (test failure, no tests, setup error, timeout). It MUST also report one overall verdict.
- **FR-008**: The check MUST run without any repository secrets or live service credentials. No step may read secrets.
- **FR-009**: The check MUST be defined only in fork-only files (`fork-` prefixed workflow name and fork-only helper paths) and MUST NOT modify, wrap, or depend on edits to any upstream-tracked file.
- **FR-010**: For upstream sync merges, folders whose changes come **only from upstream** MUST be evaluated in **advisory** mode: tests that exist are run, and failures or missing tests are reported as "untested/failing (from upstream)" without failing the overall verdict. Folders that the sync touches *and* that also carry fork-side changes in the same change are evaluated strictly.
- **FR-011**: For folders whose changed files are SQL, the check MUST run the folder's SQL verification script **if the folder provides one**, and MUST fail the folder if that verification fails. SQL-only changes in folders without a verification script MUST be reported as **advisory** ("SQL unverified") without failing the verdict. Static SQL safety stays with the upstream gate (FR-014).
- **FR-012**: The check's verdict MUST be a **required, merge-blocking status for changes from `stage/` and `contrib/` branches**, which therefore reach fork `main` through a pull request on the fork. Changes from `fork/` branches MAY be merged locally; for those, and for every update to fork `main`, the check runs after the fact and reports its verdict without blocking.
- **FR-013**: Each folder's evaluation MUST be bounded by a time limit and isolated, so one folder's failure, hang, or setup error does not prevent the others from reporting.
- **FR-014**: The check MUST NOT duplicate upstream gate rules (folder structure, metadata, README, SQL safety, scope) or Markdown linting. Those stay with the enabled upstream workflows.

### Key Entities

- **Changed Folder**: a contribution folder touched by the change. Attributes: path, category, classification (code / docs-only / template / removed), detected runtimes, origin (owner change vs upstream sync).
- **Folder Result**: the outcome for one changed folder. Attributes: runner(s), outcome, mode (strict / advisory), failure reason category, duration, test output excerpt.
- **Check Verdict**: the overall result for the change. Attributes: pass/fail, counts per outcome, list of failing folders.

### Testing Requirements *(mandatory)*

- **Runner**: The feature's own folder-detection and runner-selection logic MUST be tested test-first with fixture folders (code with tests, code without tests, docs-only, mixed runtime, template, fork-only paths, deleted folder).
- **Behaviors that MUST have tests**: changed-folder detection (FR-002, FR-003); code vs docs classification (FR-004); runner selection per runtime (FR-005); "no tests found" failure (FR-006); report shape and reason categories (FR-007); upstream-origin advisory mode (FR-010); SQL verification-script vs advisory (FR-011); blocking vs non-blocking by branch lane (FR-012); timeout and isolation (FR-013).
- **Existing test coverage**: none (new fork-only feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of changed folders that contain executable code but no tests are flagged as failing (no false passes) across the fixture suite.
- **SC-002**: 0 false failures for changes touching only fork-only paths or docs-only folders across the fixture suite.
- **SC-003**: For a typical change touching 3 or fewer contribution folders, the owner sees a per-folder verdict within 10 minutes of proposing the change.
- **SC-004**: A change touching only fork-only paths completes its check in under 1 minute.
- **SC-005**: 0 secrets or credentials are referenced or exposed by the check, as verified by review of its definition.
- **SC-006**: 0 upstream-tracked files are modified by this feature, so upstream syncs produce no conflicts in it (`git diff --stat upstream/main...fork/fork-ci` lists only fork-only paths).
- **SC-007**: The owner can identify why a folder failed (test failure vs no tests vs setup vs timeout) from the report alone, without opening logs, for every failure in the fixture suite.
- **SC-008**: A routine upstream sync that touches only untested upstream folders is never blocked (0 overall failures caused solely by upstream-origin folders).
- **SC-009**: 100% of `stage/` and `contrib/` changes reach fork `main` only after a passing check.

## Assumptions

- The fork owner is the only user; there are no external contributors opening PRs against the fork.
- GitHub Actions is enabled on the fork under the Option C policy; this workflow's `fork-` prefix keeps it on during the post-sync disable sweep.
- Package registries (npm, PyPI, deno.land/jsr) are reachable from CI; fetching public dependencies is not considered a "live credential".
- Folders without lockfiles may install dependencies fresh; a setup failure is reported as such, not as a test failure.
- "Executable code" means `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`, `.py` source files; configuration-only files (for example `*.config.*`, `deno.json`, `package.json`) alone do not make a folder a code folder.
- Upstream's OB1 PR Gate and Markdown Lint keep running on fork PRs and remain the authority for upstream contribution rules; this check covers tests only.
- Q3 decision (2026-11-24) changes the staging runbook: `stage/` and `contrib/` branches now merge into fork `main` through a fork pull request rather than a local `--no-ff` merge. Updating `.fork/README.md` and enabling branch protection on fork `main` are part of this feature.
- Origin detection for FR-010 relies on the change being an upstream sync merge (a merge whose second parent is on `upstream/main`).
- Coverage depth (whether tests cover the *specific* changed behavior) is out of scope for automation; the check enforces presence and passing of tests, and coverage judgment stays with the owner during staging.
