# Feature Specification: Stage upstream PR #521 (auto-capture Hermes adapter)

**Feature Branch**: `stage/pr-521-auto-capture-hermes`

**Created**: 2026-11-27

**Status**: Complete (landed on the fork via #33, `4f74232`, 2026-11-27; optional follow-ups in fork issue #37)

**Input**: User description: "merge upstream pr #521 into our fork... please ensure we handle this correctly as it relates to appropriate branches"

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | staged upstream PR |
| **Branch** | `stage/pr-521-auto-capture-hermes` (fetched from upstream `pull/521/head`; worktree `.worktrees/stage-pr-521-auto-capture-hermes`) |
| **Base** | `refs/pull/521/head` (upstream `NateBJones-Projects/OB1`, head `b9cbd68fb989`, 3 commits, based on upstream `main` at `238df6cefd30`) |
| **Lands in** | fork `main` via a fork pull request merged with a merge commit (never squash or rebase) |
| **Category** | skills |
| **Contribution folder** | `skills/auto-capture-hermes/` (new; the PR adds only these 4 files: `README.md`, `SKILL.md`, `capture-hermes-session.mjs`, `metadata.json`) |
| **Upstream PR** | #521 `[skills] Add auto-capture-hermes adapter` by eazene, opened 2026-10-12, state OPEN |
| **Requires** | `requires_skills: auto-capture` (already on fork `main`); the Open Brain REST ingest endpoint (`integrations/open-brain-rest/`, already on fork `main`) for live captures only |

**Branch relationships (why this lands cleanly)**: fork `main` already contains all of upstream `main` (0 commits behind on 2026-11-27), and #521's merge base with upstream is upstream `main`'s current tip. #521 only adds a new folder, so merging its head into fork `main` brings in nothing besides the author's 3 commits and the fork's test commits, and nothing can conflict. Spec-kit artifacts for this feature (`specs/008-…/`) live only on fork `main`. They never enter the `stage/` branch, and the `stage/` branch never carries `.specify/`, `specs/`, or `.fork/` (constitution Principle V).

## User Scenarios & Testing *(mandatory)*

The actors are the **fork owner**, who may run Hermes Agent against their own Open Brain, and **upstream maintainers**, who may later merge #521 and can reuse the fork's tests.

### User Story 1 - The Hermes adapter is available on the fork (Priority: P1)

The fork owner wants the Hermes Agent auto-capture adapter on fork `main` before upstream reviews it. After staging, `skills/auto-capture-hermes/` sits on fork `main` exactly as the author wrote it, next to the base `auto-capture` skill and the Claude Code adapter. A Hermes user can follow its README to capture sessions into Open Brain.

**Why this priority**: This is the reason to stage #521. Upstream merges slowly, and the fork is the owner's working Open Brain.

**Independent Test**: After the fork PR merges, the fork `main` tree for `skills/auto-capture-hermes/` matches the author's head except for the fork's added test files, and the author's 3 commits show up unchanged (same SHAs) in fork `main`'s history.

**Acceptance Scenarios**:

1. **Given** the fork PR is merged, **When** the owner lists `skills/auto-capture-hermes/` on fork `main`, **Then** the author's 4 files are present, byte-identical to head `b9cbd68fb989` (or a later head if the author updates the PR).
2. **Given** the fork PR is merged, **When** the owner inspects fork `main`'s history, **Then** commits `f1f4536`, `5cf07c0` and `b9cbd68` are reachable with their original SHAs, joined by a merge commit.
3. **Given** the fork PR is merged, **When** the owner compares fork `main` with its pre-merge state, **Then** no file outside `skills/auto-capture-hermes/` changed.

---

### User Story 2 - The adapter's capture behavior is proven by credential-free tests (Priority: P1)

Before the adapter reaches fork `main`, automated tests inside `skills/auto-capture-hermes/` prove what it sends to Open Brain and what it skips. They read a small synthetic Hermes session store built by the test, use no API keys, and make no network requests. fork-ci can then enforce them on every later change to the folder.

**Why this priority**: Constitution Principle IV requires tests that cover the PR's behavior to be written and green before a staged PR merges. #521 ships no tests; the author checked only syntax and ran dry-runs by hand.

**Independent Test**: Run the new tests on a machine with no Open Brain credentials, no Hermes install, and no network. They pass against the PR head and fail at the PR base, where the adapter does not exist.

**Acceptance Scenarios**:

1. **Given** a synthetic session with at least the minimum number of real user turns, **When** the adapter runs in dry-run mode on it, **Then** it produces one capture payload containing the user and assistant turns in order, with the Hermes source label and an import key, and sends nothing.
2. **Given** a session whose assistant steps include tool-call-only rows (no prose) and context-compaction summary rows, **When** the adapter parses it, **Then** those rows are absent from the capture.
3. **Given** a session with scheduled (cron) messages injected as user turns, **When** the adapter parses it, **Then** the cron messages stay in the capture, labelled as cron, but do not count toward the minimum-turn threshold.
4. **Given** a session with fewer real user turns than the threshold, **When** the adapter runs, **Then** nothing is captured and the skip reason is logged.
5. **Given** a subagent session (it has a parent session, or its title marks it as a subagent), **When** the adapter runs on it, **Then** nothing is captured.
6. **Given** a session whose transcript is longer than the size limit, **When** the adapter builds the payload, **Then** the text is within the limit and keeps the start and end of the conversation.
7. **Given** the same session processed twice, **When** the adapter builds the payload each time, **Then** the import key is identical, so the ingest endpoint can drop the duplicate.
8. **Given** no Open Brain address or access key is configured, **When** the adapter runs outside dry-run mode, **Then** it sends nothing, logs the missing configuration, and exits without an error status (it must never break a Hermes session).

---

### User Story 3 - Delivery to Open Brain is resilient and idempotent (Priority: P2)

When the owner's Open Brain is slow or temporarily unavailable, a capture is not lost and is not ingested twice. A temporary failure is queued and retried on the next capture. A permanent failure (bad credentials, rejected payload) is not retried forever.

**Why this priority**: This matters once the owner runs Hermes for real. It does not block having the adapter available or proving the parsing.

**Independent Test**: Point the adapter at a local stand-in for the ingest endpoint, controlled by the test, that answers success, a temporary failure, or a permanent failure. Observe the requests received and the retry queue on disk.

**Acceptance Scenarios**:

1. **Given** the ingest endpoint answers success, **When** a session is captured, **Then** exactly one request reaches the endpoint, carrying the access key and the payload from Story 2.
2. **Given** the endpoint answers with a temporary failure, **When** a session is captured, **Then** the payload is saved to the retry queue, and the next capture resends it before sending its own.
3. **Given** the endpoint answers with a permanent failure, **When** a session is captured, **Then** the payload is not queued for retry and the failure is logged.

---

### User Story 4 - Staging is recorded and reconcilable (Priority: P2)

The staged PR is recorded in the fork's ledger with its spec folder, head commit and test commits. When upstream later merges #521 (as-is, squashed or modified), the owner can reconcile the fork and re-apply the tests.

**Why this priority**: Principle VII requires it. It does not affect whether the adapter works today.

**Independent Test**: After landing, `.fork/staged-prs.md` has one `#521` row linking this spec, the upstream head and the fork's test commit(s).

**Acceptance Scenarios**:

1. **Given** the fork PR is merged, **When** the owner opens `.fork/staged-prs.md`, **Then** a row for #521 lists kind `staged`, this spec folder, head `b9cbd68fb989` (or the head actually staged), the test commit(s), the merge date and fork PR, and status `staged`.
2. **Given** the fork's tests pass, **When** staging completes, **Then** upstream PR #521 gets a comment linking the fork's test commit(s), offering them to the author.

---

### Edge Cases

- **Upstream merges #521 before the fork lands it**: staging is no longer needed. The owner syncs upstream instead and keeps only the tests (status `upstreamed`).
- **The author force-pushes or adds commits (new head)**: the `stage/` branch is re-fetched from the new head, the ledger records the new SHA, and the tests are re-run. Fork test commits are re-applied on top. They are never mixed into the author's commits.
- **Sibling PR #515** (Codex and Grok adapters, a Claude Code parser fix, a hook-authoring skill) touches neighbouring `skills/auto-capture-*` folders. It is not part of this feature. If staged, it gets its own feature (Principle VII, no batching). The two PRs share no files.
- **Fork `main` moves on while this feature is in progress** (e.g. spec 007 work lands): the stage branch is still merged into the current fork `main` through the fork PR. Since the PR touches only a new folder, no rebase of the stage branch is needed or allowed. The author's commits stay unrewritten.
- **The test runtime lacks the built-in SQLite driver**: the adapter falls back to the `sqlite3` command-line tool. Tests MUST state which path they exercise and MUST NOT pass silently when neither path is available. They fail with a clear message, or skip only with an explicit, visible reason.
- **A test accidentally reaches a real Open Brain or the public network**: it MUST fail rather than send. Tests set no real address or key and use only a local stand-in endpoint.
- **Tests write logs, retry queues or lock files**: all of them go to a temporary directory per test. Nothing is written to the owner's home directory or to the real Hermes home.
- **The upstream gate (`ob1-gate-v2`) runs on the fork PR**: test files inside `skills/auto-capture-hermes/` stay within its one-folder scope rule. The fork PR touches no other upstream path.
- **The owner does not run Hermes Agent**: staging still delivers value as QA for upstream and as tests offered back. A live capture check (README steps against a real Hermes install) is optional and recorded as evidence only if performed.

## Requirements *(mandatory)*

### Functional Requirements

**Branching and landing**

- **FR-001**: The staged code MUST come from upstream `refs/pull/521/head` into a local branch named `stage/pr-521-auto-capture-hermes`, checked out in its own worktree at `.worktrees/stage-pr-521-auto-capture-hermes`. All code and test changes for this feature MUST be made in that worktree, never on the fork-`main` checkout.
- **FR-002**: The author's commits (`f1f4536`, `5cf07c0`, `b9cbd68`, or the later head's commits) MUST be kept unrewritten: no rebase, squash, amend or cherry-pick.
- **FR-003**: The fork's tests MUST be added as separate commits on top of the author's head, on the `stage/` branch, with commit titles prefixed `[skills]`.
- **FR-004**: The `stage/` branch MUST NOT contain any fork-only path (`.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`) and MUST NOT change any file outside `skills/auto-capture-hermes/`.
- **FR-005**: The staged work MUST land on fork `main` only through a fork pull request (`stage/pr-521-auto-capture-hermes` → `main` on `mfelker/OB1`), merged with a merge commit, after this feature's tasks are complete and `fork-ci-verdict` passes in strict mode.
- **FR-006**: The fork pull request title MUST keep upstream's title with a suffix: `[skills] Add auto-capture-hermes adapter (staged #521)`.
- **FR-007**: The staging MUST NOT be pushed to, and no pull request may be opened against, upstream `NateBJones-Projects/OB1`. The only upstream interaction is the offer comment in FR-018.

**Adapter behavior under test** (the author's behavior, as already written; the fork changes no adapter code)

- **FR-008**: The capture MUST contain only user and assistant turns that carry prose, in their original order. Tool-call-only assistant steps and context-compaction summaries MUST be excluded.
- **FR-009**: Scheduled (cron) messages injected as user turns MUST be kept and labelled, and MUST NOT count toward the minimum user-turn threshold.
- **FR-010**: Sessions with fewer real user turns than the threshold (default 3), and subagent sessions, MUST NOT be captured. The skip reason MUST be logged.
- **FR-011**: The capture text MUST NOT exceed the size limit (default 24,000 characters). When trimmed, it MUST keep the beginning and the end of the conversation.
- **FR-012**: Each capture MUST carry a stable import key derived from the session and its content, identical across repeated runs on the same session.
- **FR-013**: Dry-run mode MUST print the payload it would send and MUST NOT contact any endpoint.
- **FR-014**: With no Open Brain address or access key configured, the adapter MUST send nothing, log the missing configuration, and exit with a success status.
- **FR-015**: Delivery failures MUST be classified: temporary failures are queued and retried on the next capture, permanent failures are logged and not queued.

**Tests and records**

- **FR-016**: Automated tests for FR-008 to FR-015 MUST live inside `skills/auto-capture-hermes/`, build their own synthetic Hermes session store, and run without credentials, a Hermes install, or public network access. They MUST pass at the PR head and fail at the PR base (staged base-red rule, Principle IV).
- **FR-017**: The staging MUST be recorded in `.fork/staged-prs.md` with this spec folder (ledger row added on fork `main` after the fork PR merges).
- **FR-018**: The fork SHOULD offer its tests to the upstream author by commenting on PR #521 with a link to the test commit(s).

### README Contract *(mandatory for new contribution folders)*

The README is the author's and is staged unchanged. Review only checks that it meets the contract; any gap is reported to the author upstream, not patched in the fork.

- **Prerequisites**: Hermes Agent with shell hooks enabled, Node.js 18+ (22.5+ for the built-in SQLite driver, otherwise the `sqlite3` CLI), a working Open Brain with the REST ingest endpoint, and the base [auto-capture](../../skills/auto-capture/) skill.
- **Steps**: numbered install steps that wire the `on_session_finalize` and `on_session_end` hooks and set the Open Brain address and access key.
- **Expected outcome**: after a Hermes session with enough turns ends, one session summary appears in Open Brain; `--dry-run` shows the payload without sending.
- **Links**: base `auto-capture` skill.

### Testing Requirements *(mandatory)*

- **Runner**: Node's built-in test runner (`node --test`) inside `skills/auto-capture-hermes/`, matching fork-ci's plain-Node runtime for a folder with no `package.json` (no dependencies added).
- **Behaviors that MUST have tests**: turn filtering and order (FR-008), cron labelling and threshold exclusion (FR-009), short-session and subagent skips (FR-010), size limit with start and end kept (FR-011), stable import key (FR-012), dry-run sends nothing (FR-013), missing configuration (FR-014), success, temporary and permanent delivery outcomes against a local stand-in endpoint (FR-015, Story 3).
- **Explicitly not unit-tested** (judged in plan): the hook timing (finalize delay, the 120-second debounce of `on_session_end`, hard timeouts). The plan decides whether to cover it by shortening the delays through the adapter's existing environment settings, or to leave it to an optional live check.
- **Existing test coverage** *(staged PRs)*: none. The PR has no test files; the author reports `node --check`, markdownlint, the upstream gate script, and manual dry-runs against their own Hermes sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the fork PR merges, 100% of the author's files in `skills/auto-capture-hermes/` on fork `main` are byte-identical to the staged upstream head, and 0 files outside that folder changed.
- **SC-002**: All 3 of the author's commits are reachable from fork `main` with their original SHAs.
- **SC-003**: Every behavior listed in the Testing Requirements has at least one test; all pass at the PR head and the suite fails at the PR base.
- **SC-004**: The full test suite finishes in under 30 seconds with 0 credentials and 0 requests leaving the machine.
- **SC-005**: The fork PR's `fork-ci-verdict` is green in strict mode for `skills/auto-capture-hermes/`, and the upstream gate reports no scope violations.
- **SC-006**: The ledger has exactly 1 row for #521, linking this spec.

## Assumptions

- Upstream has not merged #521 at staging time (state OPEN as of 2026-11-27, no review yet).
- The spec number 008 follows the repo's sequential numbering. The self-hosting roadmap's planned "008 migration" feature takes the next free number when it is specified.
- The base `auto-capture` skill and `integrations/open-brain-rest/` are already on fork `main` (verified 2026-11-27), so the adapter's declared dependency is met without staging anything else.
- The fork changes no line of the author's code or docs. If tests expose a defect, the fork reports it on #521 and records it in this feature. A fork-only fix happens only with a Complexity Tracking justification in the plan (Principle V).
- The tests drive the adapter through its existing environment settings (store location, capture log location, thresholds, delays) and its exported functions. No test-only hooks are added to the author's script.
- Live verification against a real Hermes Agent install and the owner's self-hosted Open Brain is optional. If the owner runs Hermes, the evidence goes under this spec's `evidence/` folder.
- Sibling PR #515 is out of scope and would be staged as its own feature.
- The worktree extension's after-specify offer is declined. The staging worktree must be cut from the PR head (`.fork/README.md`, "Stage an upstream PR", step 2), not from fork `main`.
