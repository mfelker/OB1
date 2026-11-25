---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: MANDATORY (constitution Principle IV, NON-NEGOTIABLE). Fork and upstream-bound lanes: write tests first and confirm they FAIL. Staged upstream PR lane: tests covering the PR's behavior must be green before the merge into fork `main`. Docs-only work replaces unit tests with the documentation gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- `[folder]` = `<ROOT>/[category]/[kebab-name]` where `<ROOT>` is the plan's **Worktree** absolute path for upstream-bound and staged lanes, or the fork-`main` checkout for fork features. Write every task path with that absolute root so `/speckit-implement` never edits fork `main` by accident
- All paths are inside ONE contribution folder (from plan.md Structure Decision)
- Edge Function: `index.ts`, `deno.json`, `index_test.ts` / `tests/*_test.ts`, `schema.sql`
- Schema: `schema.sql` or `migrations/*.sql`, `tests/verify.sql`
- Node/TS recipe or dashboard: `src/…`, `src/**/__tests__/*.test.ts` (Vitest)
- Python importer: `*.py`, `tests/test_*.py` (pytest)
- Fork-only files (`specs/`, `.fork/`) are edited on fork `main`, never on a `contrib/` branch

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Sync: `git fetch upstream && git merge upstream/main` on fork `main` (rerere enabled)
- [ ] T002 Create lane branch + worktree: `git worktree add ../ob1-<desc> -b contrib/mfelker/<desc> upstream/main` (or `fork/<desc>` from `main`, or `stage/pr-<N>-<desc>` from `upstream refs/pull/<N>/head`)
- [ ] T003 Scaffold `[category]/[kebab-name]/` from `[category]/_template/` (README.md, metadata.json)
- [ ] T004 [P] Set up the test runner for the folder (`deno.json` test task / `vitest` devDependency / `pytest` in requirements)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T005 Write failing verification for new SQL objects in `[folder]/tests/verify.sql` (additive only; no `thoughts` column changes)
- [ ] T006 Add `[folder]/schema.sql` (IF NOT EXISTS, RLS for user data) until verification passes
- [ ] T007 [P] Edge Function skeleton: Hono app + `@hono/mcp` transport + access-key check in `[folder]/index.ts`, imports in `[folder]/deno.json`
- [ ] T008 [P] Stubs/mocks for Supabase client and OpenRouter in `[folder]/tests/` (no live credentials)
- [ ] T009 Environment variables documented (names only) in README Prerequisites

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation** (staged PR lane: write them against the PR's code and make them pass before merge)

- [ ] T010 [P] [US1] Tool contract test for `[tool_name]` (input schema, annotations) in `[folder]/index_test.ts`
- [ ] T011 [P] [US1] Behavior test for [user journey] with mocked Supabase in `[folder]/tests/[name]_test.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Register `[tool_name]` with zod input schema and annotations in `[folder]/index.ts`
- [ ] T013 [US1] Implement Supabase query/RPC for [behavior] in `[folder]/index.ts` (depends on T012)
- [ ] T014 [US1] Error handling returns MCP errors without leaking secrets
- [ ] T015 [US1] README step + Expected outcome for this story in `[folder]/README.md`
- [ ] T016 [US1] Run tests: `deno test [folder]` (or `npm test` / `pytest` / `node …`) → green

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T018 [P] [US2] Tool contract test for `[tool_name]` in `[folder]/index_test.ts`
- [ ] T019 [P] [US2] Behavior test for [user journey] in `[folder]/tests/[name]_test.ts`

### Implementation for User Story 2

- [ ] T020 [US2] Implement [behavior] in `[folder]/index.ts`
- [ ] T021 [US2] README step + Expected outcome in `[folder]/README.md`
- [ ] T022 [US2] Run tests → green
- [ ] T023 [US2] Integrate with User Story 1 tools (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T024 [P] [US3] Tool contract test for `[tool_name]` in `[folder]/index_test.ts`
- [ ] T025 [P] [US3] Behavior test for [user journey] in `[folder]/tests/[name]_test.ts`

### Implementation for User Story 3

- [ ] T026 [US3] Implement [behavior] in `[folder]/index.ts`
- [ ] T027 [US3] README step + Expected outcome in `[folder]/README.md`
- [ ] T028 [US3] Run tests → green

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Gate Self-Check & Landing

**Purpose**: Pass every constitution Quality Gate, then land the change in its lane

- [ ] TXXX Refactor with tests green (red-green-REFACTOR)
- [ ] TXXX [P] `metadata.json` validates against `.github/metadata.schema.json`
- [ ] TXXX [P] `markdownlint-cli2 --config .github/.markdownlint.jsonc "[folder]/**/*.md"`
- [ ] TXXX [P] README: Prerequisites, numbered steps, Expected outcome, relative links resolve, `docs/05-tool-audit.md` link (extensions/integrations)
- [ ] TXXX [P] Secret / binary / profanity / SQL-safety scan of the folder
- [ ] TXXX Scope check: `git diff --stat upstream/main...HEAD` lists only `[folder]/` (upstream-bound lane)
- [ ] TXXX Run quickstart.md validation
- [ ] TXXX Land by lane:
  - fork feature → merge `fork/<desc>` into `main`
  - upstream-bound → `gh pr create -R NateBJones-Projects/OB1` with title `[category] …`, then land the `contrib/` branch on fork `main` through a fork PR (`--merge`)
  - staged PR → fork PR (`gh pr create -R mfelker/OB1 --base main`, title `<upstream title> (staged #N)`); merge with `gh pr merge --merge` only after all pre-merge tasks are `[X]` and `fork-ci-verdict` + `OB1 Review` are green; then post-merge recording: ledger row in `.fork/staged-prs.md`, optional upstream comment (owner approval), worktree removal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation (staged PR lane: written and passing before merge)
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Tool contract test for [tool_name] in [folder]/index_test.ts"
Task: "Behavior test for [user journey] in [folder]/tests/[name]_test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing; all paths stay inside the one contribution folder
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
