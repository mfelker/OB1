---

description: "Tasks for staging upstream PR #532 (atomizer Anthropic default model)"
---

# Tasks: Stage upstream PR #532 (atomizer Anthropic default model)

**Input**: Design documents from `specs/002-stage-pr-532-atomizer-default/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY (constitution Principle IV).

- **Staged-PR rule**: the PR's behavior (the default model) needs tests that pass before the merge.
- **The fork's own new code** (the FR-007 skip in `test-atomize.mjs`) follows red-green: its test is committed failing, then the skip makes it pass.

**Organization**: Grouped by user story. The code for US1 already exists in the author's commit `8bebd77`, so US1 is test-only. US2 adds the fork's skip. US3 lands and records the change.

## Path Conventions

- `W` = `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default` (the plan's **Worktree**).
- `F` = `W/recipes/atomizer`. Every source task writes only under `F`.
- Fork-only files (`specs/`, `.fork/`) are edited in the fork-`main` checkout `/Users/mfelker/Projects/ob1`, never in `W`.
- Contracts: `contracts/atomize-text-model-defaults.md` (cases C1–C4) and `contracts/test-atomize-cli.md` (cases K1–K5).

---

## Phase 1: Setup

- [ ] T001 Verify the staging worktree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default`:
  - The branch is `stage/pr-532-atomizer-default`, `HEAD` = `8bebd77`, and `git status --short` is empty.
  - `git merge-base --is-ancestor upstream/main main` succeeds in the fork-`main` checkout (Principle VII).
  - The PR head on upstream is still `8bebd77`: `gh pr view 532 -R NateBJones-Projects/OB1 --json headRefOid,state`.
  - If the head moved (spec edge case), re-fetch it and update the SHA in plan.md and data-model.md.

---

## Phase 2: Foundational (test infrastructure; blocks all stories)

- [ ] T002 [P] Create the preload stub `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/test-support/fetch-stub.mjs`, following contracts/test-atomize-cli.md § fetch-stub and research R2/R4:
  - It replaces `globalThis.fetch`.
  - For the `api.anthropic.com` and `openrouter.ai` hosts it returns the matching canned response shape with atoms `["a","b"]`, and writes `[fetch-stub] <host> model=<body.model>` to stderr.
  - Any other URL throws.
  - Use only Node 18-compatible APIs. Keep the basename out of the test patterns.
- [ ] T003 [P] Create the test file `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/atomize-text.test.mjs` with shared helpers only (no cases yet):
  - An in-process fetch stub (research R2): install it in `beforeEach` and restore the original in `afterEach`. It records `{url, body}` per call and throws on unexpected URLs.
  - A `runScript(args, envOverrides, {preload})` helper (research R5). It spawns `process.execPath [--import <fetch-stub URL>] <F>/test-atomize.mjs` with paths from `import.meta.url`, and an env made of `process.env` minus `NODE_TEST_CONTEXT`, plus the overrides. It returns `{code, stdout, stderr}`.
  - Use `node:test` and `node:assert/strict` only.

**Checkpoint**: `cd F && node --test atomize-text.test.mjs` runs with 0 tests and exits 0.

---

## Phase 3: User Story 1 - Anthropic runs keep working after the retirement (P1) 🎯 MVP

**Goal**: Prove the default Anthropic model is `claude-sonnet-5-5` and that an explicit model always wins. The author's commit `8bebd77` already implements this.

**Independent Test**: `cd F && node --test --test-name-pattern="anthropic" atomize-text.test.mjs`. It passes on `8bebd77`, and C1/K4 fail against `8bebd77^`.

### Tests for User Story 1 (MANDATORY)

- [ ] T004 [US1] Add case **C1** to `atomize-text.test.mjs`:
  - Call `atomizeText("x", {provider:"anthropic", anthropicApiKey:"test-key-not-real"})`.
  - Assert one fetch to `https://api.anthropic.com/v1/messages` with `body.model === "claude-sonnet-5-5"`, and atoms `["a","b"]`.
  - This covers data-model.md `AtomizeOptions.anthropicModel` (default) and FR-002.
- [ ] T005 [US1] Add case **C2**: the same call plus `anthropicModel:"claude-opus-5-5"` must send exactly `claude-opus-5-5`. This covers data-model.md `AtomizeOptions.anthropicModel` (explicit value) and FR-003.
- [ ] T006 [US1] Add case **K4**:
  - Call `runScript(["--provider=anthropic"], {ANTHROPIC_API_KEY:"test-key-not-real"}, {preload:true})`.
  - Assert exit 0, `[test] PASS — got 2 atoms` on stdout, and `[fetch-stub] api.anthropic.com model=claude-sonnet-5-5` on stderr.
  - This covers FR-002 end to end and FR-007 "unchanged with a key".

### Verification for User Story 1

- [ ] T007 [US1] Run `cd F && node --test atomize-text.test.mjs`. C1, C2 and K4 must pass on the PR code.
- [ ] T008 [US1] Run the FR-006 regression check (research R7, quickstart §2):
  1. `git checkout 8bebd77^ -- recipes/atomizer/lib/atomize-text.mjs`.
  2. Run the tests. Expect exit 1, with only C1 and K4 failing on `claude-sonnet-4-5`.
  3. Save the summary to `/private/tmp/claude-501/-Users-mfelker-Projects-ob1/abfce453-96cf-420b-adce-22ecaf5d89d4/scratchpad/r532-red.txt`.
  4. `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs` and confirm `git status` is clean.

**Checkpoint**: US1 is proven. The default model behavior is covered and detects the regression.

---

## Phase 4: User Story 2 - Credential-free tests that fork-ci enforces (P1)

**Goal**: Cover the OpenRouter default and the no-network guard, and make `test-atomize.mjs` skip cleanly without a key so fork-ci's strict verdict can pass.

**Independent Test**:
- With no provider keys, `cd F && node --test atomize-text.test.mjs test-atomize.mjs` passes in under 5 s.
- `run-folder` in strict mode reports `pass`.

### Tests for User Story 2 (MANDATORY; K1/K2 are written red first)

- [ ] T009 [US2] Add cases **C3** and **C4** to `atomize-text.test.mjs`, covering data-model.md `AtomizeOptions.openrouterModel` (FR-004, FR-003):
  - **C3**: `provider:"openrouter"`, dummy key. Assert a fetch to `https://openrouter.ai/api/v1/chat/completions` with `body.model === "anthropic/claude-sonnet-4.5"`.
  - **C4**: as C3 plus `openrouterModel:"some/other-model"`, which must be sent verbatim.
- [ ] T010 [US2] Add the no-network guard case:
  - With the stub installed, assert that `globalThis.fetch("https://example.invalid/")` rejects. `atomizeText`'s URLs are hard-coded, so the guard is tested on the stub itself; this proves no other host can be reached during tests.
  - Also assert that a missing key throws before any fetch: `provider:"anthropic"` with no `anthropicApiKey` rejects and records 0 fetch calls.
  - This covers data-model.md `AtomizeOptions.anthropicApiKey` and FR-005.
- [ ] T011 [US2] Add cases **K1** and **K2** (contracts/test-atomize-cli.md):
  - **K1**: `runScript([], {OPENROUTER_API_KEY:"", ANTHROPIC_API_KEY:""})`.
  - **K2**: `runScript(["--provider=anthropic"], {ANTHROPIC_API_KEY:"", OPENROUTER_API_KEY:""})`.
  - Assert exit 0, stdout containing `skipped: no API key for openrouter` / `skipped: no API key for anthropic`, and stdout NOT containing `[test] provider:`.
- [ ] T012 [US2] Add case **K3**:
  - Call `runScript([], {OPENROUTER_API_KEY:"test-key-not-real"}, {preload:true})`.
  - Assert exit 0, `[test] PASS — got 2 atoms` on stdout, and `[fetch-stub] openrouter.ai model=anthropic/claude-sonnet-4.5` on stderr.
- [ ] T013 [US2] Run `cd F && node --test atomize-text.test.mjs` and confirm **red** for K1 and K2 only (exit 1 with the old "requires …_API_KEY" message), with everything else green. Then commit in `W`:
  - Run `git add recipes/atomizer/atomize-text.test.mjs recipes/atomizer/test-support/fetch-stub.mjs`.
  - Commit with the message `[recipes] Tests for #532: atomizer model defaults` (plan commit 2).

### Implementation for User Story 2

- [ ] T014 [US2] Edit `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/test-atomize.mjs` per research R6:
  - In the two missing-key branches only, replace `console.error(...)` and `process.exit(1)` with:
    - `console.log("skipped: no API key for <provider> (set <VAR> in .env.local or process env)")`;
    - `process.exit(0)`.
  - Change nothing else. `git diff` should touch only those lines.
- [ ] T015 [US2] Run `cd F && node --test atomize-text.test.mjs test-atomize.mjs`. Everything must be green, in under 5 s (SC-003).
  - Then commit in `W` with the message `[recipes] atomizer: test-atomize skips cleanly without a provider key` (plan commit 3).
- [ ] T016 [US2] Preview fork-ci from `W` (quickstart §3):
  - Run `node ../../.fork/ci/bin/run-folder.mjs --path recipes/atomizer --mode strict --origin fork --out <scratchpad>/r532.json`.
  - Expect the outcome `pass`. Then check `git status --short` is clean (no lockfiles).

**Checkpoint**: The folder's strict verdict passes locally. The baseline `fail` is resolved.

---

## Phase 5: User Story 3 - Staging is recorded and reconcilable (P2)

**Goal**: Land the change through a fork PR, record it in the ledger, and offer the tests upstream.

**Independent Test**: `.fork/staged-prs.md` on fork `main` has exactly one `#532` row linking this spec, the head `8bebd778241a`, and the test commits (SC-005).

- [ ] T017 [US3] Lane hygiene check in `W` (quickstart §4): `git diff --stat upstream/main...HEAD` lists only these four `recipes/atomizer/` paths:
  - `lib/atomize-text.mjs`
  - `test-atomize.mjs`
  - `atomize-text.test.mjs`
  - `test-support/fetch-stub.mjs`
- [ ] T018 [US3] Push and open the fork PR from `W`:
  - `git push -u origin stage/pr-532-atomizer-default`.
  - `gh pr create -R mfelker/OB1 --base main --head stage/pr-532-atomizer-default --title "[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5 (staged #532)"` (FR-009).
  - The body includes:
    - a link to upstream #532 and to this spec;
    - the red evidence from `r532-red.txt` (FR-006);
    - the green test output and run-folder result;
    - the Complexity Tracking justification for the `test-atomize.mjs` edit.
- [ ] T019 [US3] Wait for `fork-ci-verdict` with an `until` loop on `gh pr checks <N> -R mfelker/OB1`. It must be green, with strict mode and 0 advisories for `recipes/atomizer/` (SC-004).
  - Then merge with `gh pr merge <N> -R mfelker/OB1 --merge` (FR-008; never squash or rebase).
  - Then run `git worktree remove .worktrees/stage-pr-532-atomizer-default` from `/Users/mfelker/Projects/ob1`.
- [ ] T020 [US3] In `/Users/mfelker/Projects/ob1`:
  - Run `git pull --ff-only origin main`.
  - Add the `#532` row to `/Users/mfelker/Projects/ob1/.fork/staged-prs.md`, filling every column from data-model.md `StagedPrLedgerRow` (PR, Kind, Title, Spec, Head SHA, Fork test commit(s), Merged into fork, Status = `staged`, Notes) (FR-010).
  - Commit `[fork] Ledger: staged #532` and push.
- [ ] T021 [US3] **Confirm with the owner first; this is outward-facing.** Comment on upstream PR #532 (`gh pr comment 532 -R NateBJones-Projects/OB1`). The comment links the fork's test commit(s) and offers the tests and the `test-atomize.mjs` skip (FR-011). Record "tests offered upstream" in the ledger Notes.

---

## Phase 6: Polish & Gate Self-Check

- [ ] T022 [P] Scan the staging diff:
  - **Secrets**: the only key-like strings are `test-key-not-real`.
  - **Content**: no binaries and no profanity.
  - **Scope**: `metadata.json` and `README.md` are unchanged.
- [ ] T023 [P] Set the spec Status to `Implemented` in `/Users/mfelker/Projects/ob1/specs/002-stage-pr-532-atomizer-default/spec.md`, mark every task `[X]` in this file, and commit on fork `main`.

---

## Dependencies & Execution Order

- **T001 → T002, T003** (in parallel) **→ US1 (T004–T008) → US2 (T009–T016) → US3 (T017–T021) → Polish (T022–T023)**.
- US1 and US2 tests share one file (`atomize-text.test.mjs`), so their test tasks run in sequence.
- **Commit 2** (T013) contains every test, so it waits for both US1 and US2 tests.
- **Commit 3** (T015) waits for T014.
- **T008** temporarily checks out the old library file; it must finish (and the tree must be clean) before T009 starts.
- **US3** needs US2's green preview (T016), because fork-ci would block the PR otherwise.
- **T020** needs the merge in T019. **T021** needs the owner's approval.

## Parallel Example

```bash
# Phase 2: two different files, no shared dependency
Task: "Create recipes/atomizer/test-support/fetch-stub.mjs"   # T002
Task: "Create recipes/atomizer/atomize-text.test.mjs helpers" # T003
# Phase 6
Task: "Secret/binary/scope scan"                               # T022
Task: "Spec status + task checkboxes"                          # T023
```

## Implementation Strategy

- **MVP = US1 + US2 through T016.** The tests prove the new default, and fork-ci's preview passes. Only then can the change land before **2026-11-30** (SC-002).
- **US3** follows immediately: it is the landing itself. T021 is optional, after the owner approves.
- **If upstream merges #532 first** (T001 or a later re-check), stop staging. Sync upstream instead, and land only the fork's tests (status `upstreamed`).

## Notes

- Never rewrite `8bebd77`. Never commit `package-lock.json` or `.env.local`.
- Every tool call that touches source uses absolute paths under `W`.
