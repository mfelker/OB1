# Feature Specification: Principle V guard for the fork-main checkout

**Feature Branch**: `fork/principle-v-guard`
**Created**: 2026-11-25
**Status**: Draft
**Input**: User description: "Fork feature: enforce constitution Principle V on the fork-main checkout. Layer 1: a Claude Code PreToolUse hook (fork-only .claude/settings.json) on Write/Edit/MultiEdit/NotebookEdit that denies writes to upstream-tracked paths on fork main …, the deny reason names where to write instead, and for docs/domain_knowledge/ it points to .fork/domain-knowledge/, the knowledge root for /speckit-grill-with-docs, designated in .fork/README.md. Layer 3: a versioned git pre-commit hook in .fork/githooks/ (enabled with core.hooksPath) applying the same rule to staged changes on main. Decisions already settled: knowledge root .fork/domain-knowledge/; scope is all upstream-tracked paths."

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | fork feature |
| **Branch** | `fork/principle-v-guard` |
| **Base** | fork `main` |
| **Category** | fork tooling (`.fork/`), not an upstream category |
| **Contribution folder** | `.fork/ci/` (rule and tests), plus `.fork/githooks/`, `.claude/settings.json` and `.fork/README.md` |
| **Upstream PR** | N/A (fork-only) |
| **Requires** | none |

## Clarifications

### Session 2026-11-25

- Q: Where does `/speckit-grill-with-docs` keep this fork's knowledge base? → A: `.fork/domain-knowledge/`, designated as canonical in `.fork/README.md`.
- Q: How broad is the guard? → A: Every upstream-tracked path on the fork-main checkout, not just the knowledge-base default.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An AI agent cannot write into upstream-owned paths on fork main (Priority: P1)

The fork owner works with AI agents in the fork-main checkout. When an agent (directly, through a slash command such as `/speckit-grill-with-docs`, or through a sub-agent) tries to create or change a file that belongs to upstream, the write is refused before it happens, and the refusal tells the agent where the content belongs instead, so the agent redirects without the owner stepping in.

**Why this priority**: Principle V keeps the fork mergeable with upstream. Today it is enforced only by review, and an agent following a command's defaults (for example grill-with-docs writing to `docs/domain_knowledge/`) would break it silently.

**Independent Test**: In the fork-main checkout, ask an agent to write to an upstream file, to a new file inside an upstream folder, and to a fork-only path. The first two are refused with a reason naming the right location; the third succeeds.

**Acceptance Scenarios**:

1. **Given** the fork-main checkout, **When** an agent tries to edit a file that exists upstream (for example `CLAUDE.md` or `server/index.ts`), **Then** the write is refused with a reason that names the rule and the upstream-bound or staged-PR route.
2. **Given** the fork-main checkout, **When** an agent tries to create `docs/domain_knowledge/CONTEXT.md`, **Then** the write is refused and the reason says the fork's knowledge base lives in `.fork/domain-knowledge/`.
3. **Given** the fork-main checkout, **When** an agent writes under `.fork/`, `.specify/`, `specs/` or `.worktrees/`, or to a fork-only zone (`.claude/settings.json`, `.claude/skills/speckit-*`, `.github/workflows/fork-*`), **Then** the write proceeds.
4. **Given** a worktree on any branch other than `main` (an upstream-bound or staged worktree), **When** an agent writes to an upstream path there, **Then** the write proceeds.
5. **Given** the fork-main checkout with a merge in progress, **When** an agent edits an upstream file to resolve a conflict, **Then** the write proceeds.

---

### User Story 2 - A commit on fork main cannot carry upstream-owned changes (Priority: P2)

Some writes bypass the agent's file tools: a shell redirect, a script, or the owner editing by hand. When a commit on fork main stages a change to an upstream-owned path, the commit is refused with the same rule and the same guidance.

**Why this priority**: The agent guard only sees the agent's own file tools. The commit is the last point where a stray change can be stopped before it reaches the fork's history.

**Independent Test**: On fork main, stage a change to an upstream file and commit; it is refused, listing the file. Stage only fork-only changes; the commit succeeds. Commit during a merge; it succeeds.

**Acceptance Scenarios**:

1. **Given** fork main with a staged change to an upstream-owned path, **When** the owner commits, **Then** the commit is refused and every offending path is listed with where it belongs instead.
2. **Given** fork main with only fork-only paths staged, **When** the owner commits, **Then** the commit succeeds.
3. **Given** a merge in progress on fork main, **When** the merge commit is made, **Then** it succeeds.
4. **Given** a worktree on any other branch, **When** a commit there stages upstream paths, **Then** it succeeds.

---

### User Story 3 - The knowledge base has one documented home (Priority: P3)

The owner and any agent can find where the fork keeps its settled terminology and decisions, and `/speckit-grill-with-docs` resolves its knowledge root there without being told each session.

**Why this priority**: The guard stops the wrong location; this makes the right one discoverable, so grill-with-docs does not even try the wrong one.

**Independent Test**: Read `.fork/README.md`: it names `.fork/domain-knowledge/` as the canonical knowledge root for grill-with-docs.

**Acceptance Scenarios**:

1. **Given** the fork runbook, **When** someone looks for where domain knowledge lives, **Then** the runbook names `.fork/domain-knowledge/` as canonical, with its layout (`CONTEXT.md`, topic documents, `adr/`).
2. **Given** a fresh clone, **When** the owner follows the runbook's setup, **Then** one documented command enables the commit guard.

---

### Edge Cases

- The upstream reference is missing or stale (no `upstream` remote, or never fetched). The guard cannot know which paths are upstream-owned; it must not silently allow everything.
- A path is given relative, absolute, with `..`, or through a symlink; the decision must be the same for the same file.
- A write targets a file outside the repository entirely; the guard does not apply.
- A file exists upstream inside a folder the fork otherwise treats as fork-only zone material (for example an upstream file under `.github/workflows/`); the exact upstream file is protected.
- The fork-main checkout is in a detached-HEAD or rebase state.
- The agent's tool input is malformed or the guard itself crashes; the failure mode must be stated (the write is not silently allowed without notice).
- The commit guard is not enabled in a clone; the runbook says how to enable it, and the agent guard still applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A single rule MUST decide, for a file path in a checkout, whether a change there is allowed; both guards MUST use it.
- **FR-002**: The rule MUST protect a path when the checkout is on branch `main` and the path is either a file that exists in `upstream/main`, or a new file inside a folder that exists in `upstream/main`.
- **FR-003**: The rule MUST allow paths under the fork-only roots `.fork/`, `.specify/`, `specs/` and `.worktrees/`, and the fork-only zones `.claude/settings.json`, `.claude/skills/speckit-*` and `.github/workflows/fork-*`, unless the exact file exists in `upstream/main`.
- **FR-004**: The rule MUST allow every path when the checkout is on any branch other than `main`, or when a merge is in progress.
- **FR-005**: Every refusal MUST state the path, that constitution Principle V reserves it for upstream, and where the change belongs instead: `.fork/domain-knowledge/` for anything under `docs/domain_knowledge/`, otherwise an upstream-bound worktree or a staged PR.
- **FR-006**: When `upstream/main` is unavailable, the rule MUST still allow the fork-only roots and zones and MUST refuse every other path on `main`, with a reason telling the owner to fetch upstream.
- **FR-007**: The agent guard MUST run before every agent file write (create, overwrite, edit, notebook edit) in this repository and refuse the write when the rule protects the path.
- **FR-008**: The commit guard MUST check every staged path on `main`, refuse the commit if any is protected, and list each protected path with its reason.
- **FR-009**: The commit guard MUST be versioned in the fork and enabled by one documented command.
- **FR-010**: Path handling MUST resolve relative, absolute, `..` and symlinked forms to the same file; paths outside the repository MUST be allowed.
- **FR-011**: If the agent guard fails internally or receives input it cannot read, it MUST refuse the write with a message saying the guard failed and why.
- **FR-012**: `.fork/README.md` MUST designate `.fork/domain-knowledge/` as the canonical knowledge root for `/speckit-grill-with-docs`, describe its layout, and document both guards and how to enable the commit guard.
- **FR-013**: All new files MUST live in fork-only paths (Principle V), and no upstream-tracked file may change.

### Key Entities

- **Path decision**: for one file path in one checkout, allowed or protected, with the reason and the suggested location when protected.
- **Upstream path set**: the files and folders in `upstream/main`, read from the local upstream reference.
- **Fork-only zones**: the fixed list of fork-only roots and fork-only zones inside upstream folders (FR-003).

### Testing Requirements

- Automated tests for the rule: an upstream file, a new file in an upstream folder, each fork-only root and zone, an exact upstream file inside a zone, a non-`main` branch, a merge in progress, a missing upstream reference, relative/absolute/`..`/symlink forms, and a path outside the repository.
- Automated tests for the agent guard end to end: tool input in, decision out, for an allowed write, a refused write (with the reason text), malformed input, and the `docs/domain_knowledge/` redirect.
- Automated tests for the commit guard end to end in a temporary repository: refused with the listed paths, allowed with fork-only paths, allowed during a merge, allowed on another branch.
- Tests run in temporary repositories; none may touch the real checkout or need network access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of agent writes to upstream-owned paths on fork main are refused, and 100% of refusals name where the content belongs.
- **SC-002**: 0 agent writes to fork-only paths, or in other branches' worktrees, are refused.
- **SC-003**: 100% of commits on fork main that stage an upstream-owned path are refused, with every such path listed.
- **SC-004**: A `/speckit-grill-with-docs` session on fork main ends with its knowledge files in `.fork/domain-knowledge/` and none in `docs/`.
- **SC-005**: Merging upstream into fork main, including resolving conflicts, needs no guard bypass.

## Assumptions

- The guarded checkout is the fork-main checkout, recognized by its branch being `main`. Upstream-bound and staged work happens in worktrees on other branches.
- `upstream/main` is the local reference to upstream's main branch, refreshed by `git fetch upstream`. The rule reads it; it does not fetch.
- Shell-command writes by the agent are not intercepted by the agent guard; the commit guard is the backstop for them.
- The owner can bypass the commit guard deliberately (`git commit --no-verify`); the guard prevents accidents, not intentional overrides.
- The fork-only zones list is fixed in this feature; adding a zone later is a reviewed change to the rule and its tests.
