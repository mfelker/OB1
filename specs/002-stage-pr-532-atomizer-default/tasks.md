---

description: "Tasks for staging upstream PR #532 (atomizer Anthropic default model)"
---

# Tasks: Stage upstream PR #532 (atomizer Anthropic default model)

**Input**: Design documents from `specs/002-stage-pr-532-atomizer-default/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY (constitution Principle IV).

- **Staged-PR rule**: the PR's behavior (the default model) needs tests that pass before the merge.
- **The fork's own new code** (the FR-007 skip in `test-atomize.mjs`) follows red-green: its test is committed failing, then the skip makes it pass.

**Organization**: grouped by user story.

- US1 is test-only, because the author's commit `8bebd77` already implements it.
- US2 adds the fork's skip.
- US3 lands the change and records it.

**Merge gate (constitution Principle VII)**: the fork PR merges only after **T001–T025 are all `[X]`** and both `fork-ci-verdict` and `OB1 Review` are green. That merge is T026. **Phase 7 (T027–T029) is post-merge recording** (runbook step 6). It needs the merge's date and SHA, so it can't come before the merge, and it isn't part of the merge gate.

## Path Conventions

- `W` = `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default` (the plan's **Worktree**).
- `F` = `W/recipes/atomizer`. Every source task writes only under `F`.
- Fork-only files (`specs/`, `.fork/`) are edited in the fork-`main` checkout `/Users/mfelker/Projects/ob1`, never in `W`.
- `E` = `/Users/mfelker/Projects/ob1/specs/002-stage-pr-532-atomizer-default/evidence/` is the durable evidence folder on fork `main`. It's committed in T025.
- `BASE` is the PR's base: `git -C W merge-base HEAD upstream/main`, which is `238df6c` today. It stays correct if the author force-pushes.
- Contracts:
  - `contracts/atomize-text-model-defaults.md` covers cases C1–C6.
  - `contracts/test-atomize-cli.md` covers cases K1–K5.
- **Keyless runs**: every command that runs `test-atomize.mjs` is prefixed with `OPENROUTER_API_KEY= ANTHROPIC_API_KEY=`. Without it, a real key in a local `.env.local` would turn the script into a live call (contract K5).

---

## Phase 1: Setup

- [X] T001 Verify the staging worktree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default`:
  - The branch is `stage/pr-532-atomizer-default`, `HEAD` is `8bebd77`, and `git status --short` is empty.
  - `git merge-base --is-ancestor upstream/main main` succeeds in the fork-`main` checkout (Principle VII).
  - The upstream PR head is still `8bebd77` (`gh pr view 532 -R NateBJones-Projects/OB1 --json headRefOid,state`).
  - **If the head moved** (spec edge case): re-fetch it with `git fetch upstream pull/532/head:stage/pr-532-atomizer-default --force` (worktree clean), then replace the old short SHA `8bebd77` and the full SHA `8bebd778241a` with the new head in all of these:
    - spec.md (Lane table, FR-001, US3 scenario 1)
    - plan.md (Summary, Lane, commit sequence)
    - data-model.md (ledger Head SHA)
    - quickstart.md (Prerequisites)
    - this file (T001, US1 Goal, the Notes section)

---

## Phase 2: Foundational (test infrastructure; blocks all stories)

- [X] T002 [P] Create the preload stub `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/test-support/fetch-stub.mjs`, following contracts/test-atomize-cli.md § fetch-stub and research R2/R4:
  - It replaces `globalThis.fetch`.
  - For the `api.anthropic.com` and `openrouter.ai` hosts, it returns the matching canned response shape with atoms `["a","b"]`, and writes `[fetch-stub] <host> model=<body.model>` to stderr.
  - Any other URL throws.
  - Use only Node 18.18-compatible APIs. The basename must stay out of fork-ci's test patterns.
- [X] T003 [P] Create `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/atomize-text.test.mjs` with shared helpers only, no cases yet:
  - An in-process fetch stub (research R2), installed in `beforeEach` and restored in `afterEach`. It records `{url, body}` for each call and throws on unexpected URLs.
  - `runScript(args, envOverrides, {preload})` (research R5). It spawns `process.execPath [--import <fetch-stub URL>] <F>/test-atomize.mjs`, with paths taken from `import.meta.url`. The child env is `process.env` minus `NODE_TEST_CONTEXT`, plus the overrides. It returns `{code, stdout, stderr}`.
  - Use only `node:test` and `node:assert/strict`.
  - **Every test case name starts with its contract ID and names the provider**, for example `C1 anthropic default model`.

**Checkpoint**: `(cd F && node --test atomize-text.test.mjs)` runs and exits 0.

---

## Phase 3: User Story 1 - Anthropic runs keep working after the retirement (P1) 🎯 MVP

**Goal**: Prove the default Anthropic model is `claude-sonnet-5-5`, and that an explicitly passed model always wins. The author's commit `8bebd77` already implements this.

**Independent Test**: `(cd F && node --test --test-name-pattern="anthropic" atomize-text.test.mjs)`.

- The test count is at least 3 (C1, C2, K4).
- It passes on the PR head.
- C1 and K4 fail against `BASE`.

### Tests for User Story 1 (MANDATORY)

- [X] T004 [US1] Add case **C1 anthropic default model** to `atomize-text.test.mjs`:
  - Call `atomizeText("x", {provider:"anthropic", anthropicApiKey:"test-key-not-real"})`.
  - Assert exactly one fetch to `https://api.anthropic.com/v1/messages`, with `body.model === "claude-sonnet-5-5"`, and atoms `["a","b"]`.
  - Covers the `AtomizeOptions.anthropicModel` default in data-model.md (FR-002).
- [X] T005 [US1] Add case **C2 anthropic explicit model**:
  - Make the same call plus `anthropicModel:"claude-opus-5-5"`.
  - Assert that it sends exactly `claude-opus-5-5`.
  - Covers the explicit `AtomizeOptions.anthropicModel` value in data-model.md (FR-003).
- [X] T006 [US1] Add case **K4 anthropic CLI with key**:
  - Call `runScript(["--provider=anthropic"], {ANTHROPIC_API_KEY:"test-key-not-real"}, {preload:true})`.
  - Assert exit 0, `[test] PASS — got 2 atoms` on stdout, and `[fetch-stub] api.anthropic.com model=claude-sonnet-5-5` on stderr.
  - Covers FR-002 end to end, and FR-007's "unchanged with a key".

### Verification for User Story 1

- [X] T007 [US1] Run the US1 Independent Test command above. It must report at least 3 tests, all passing.
- [X] T008 [US1] Run the FR-006 regression check (research R7, quickstart §2) in `W`:
  1. Run `git checkout "$BASE" -- recipes/atomizer/lib/atomize-text.mjs`.
  2. Run `(cd recipes/atomizer && node --test atomize-text.test.mjs)`. Expected: exit 1, with only C1 and K4 failing on `claude-sonnet-4-5`.
  3. Save the summary to `E/r532-red.txt`.
  4. Run `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs`.
  5. Confirm `git status --short --untracked-files=no` is empty: no modified tracked files. The new test files stay untracked until T013.

**Checkpoint**: US1 is proven. The tests cover the default-model behavior and catch the regression.

---

## Phase 4: User Story 2 - Credential-free tests that fork-ci enforces (P1)

**Goal**: Cover the OpenRouter default, the provider and key guards, and the no-network guard. Make `test-atomize.mjs` skip cleanly without a key, so fork-ci's strict verdict can pass.

**Independent Test**:
- `(cd F && OPENROUTER_API_KEY= ANTHROPIC_API_KEY= node --test atomize-text.test.mjs test-atomize.mjs)` passes in under 5 s.
- Strict `run-folder` reports `pass`.

### Tests for User Story 2 (MANDATORY; K1/K2 are written red first)

- [X] T009 [US2] Add the OpenRouter model cases, covering `AtomizeOptions.openrouterModel` in data-model.md (FR-004, FR-003):
  - **C3 openrouter default model**: `provider:"openrouter"` with a dummy key. Assert a fetch to `https://openrouter.ai/api/v1/chat/completions` with `body.model === "anthropic/claude-sonnet-4.5"`.
  - **C4 openrouter explicit model**: the same as C3 plus `openrouterModel:"some/other-model"`. Assert the model is sent exactly as given.
- [X] T010 [US2] Add the guard cases (FR-005):
  - **C5 missing key rejects before fetch**. Covers `AtomizeOptions.anthropicApiKey` and `AtomizeOptions.openrouterApiKey` in data-model.md. `provider:"anthropic"` with no `anthropicApiKey` rejects with 0 fetch calls; so does `provider:"openrouter"` with no `openrouterApiKey`.
  - **C6 unknown provider rejects**. Covers `AtomizeOptions.provider` in data-model.md. `provider:"codex"` rejects with 0 fetch calls.
  - **Network guard**: with the stub installed, `globalThis.fetch("https://example.invalid/")` rejects. `atomizeText`'s URLs are hard-coded, so the guard is tested on the stub itself.
- [X] T011 [US2] Add the skip cases from contracts/test-atomize-cli.md:
  - **K1 openrouter CLI skip**: `runScript([], {OPENROUTER_API_KEY:"", ANTHROPIC_API_KEY:""})`.
  - **K2 anthropic CLI skip**: `runScript(["--provider=anthropic"], {ANTHROPIC_API_KEY:"", OPENROUTER_API_KEY:""})`.
  - Assert exit 0, stdout containing `skipped: no API key for openrouter` or `skipped: no API key for anthropic`, and stdout NOT containing `[test] provider:`.
- [X] T012 [US2] Add case **K3 openrouter CLI with key**:
  - Call `runScript([], {OPENROUTER_API_KEY:"test-key-not-real"}, {preload:true})`.
  - Assert exit 0, `[test] PASS — got 2 atoms` on stdout, and `[fetch-stub] openrouter.ai model=anthropic/claude-sonnet-4.5` on stderr.
- [X] T013 [US2] Run `(cd F && node --test atomize-text.test.mjs)` and confirm that only K1 and K2 are **red**. They exit 1 with the old "requires …_API_KEY" message; everything else passes.
  - Save the summary to `E/r532-skip-red.txt`.
  - Then commit in `W`: `git add recipes/atomizer/atomize-text.test.mjs recipes/atomizer/test-support/fetch-stub.mjs`, with the message `[recipes] Tests for #532: atomizer model defaults` (plan commit 2).

### Implementation for User Story 2

- [X] T014 [US2] Edit `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default/recipes/atomizer/test-atomize.mjs` (research R6):
  - Change only the two missing-key branches. Replace `console.error(...); process.exit(1)` with `console.log("skipped: no API key for <provider> (set <VAR> in .env.local or process env)"); process.exit(0)`.
  - Leave everything else unchanged. `git diff` must touch only those lines.
- [X] T015 [US2] Run `(cd F && OPENROUTER_API_KEY= ANTHROPIC_API_KEY= node --test atomize-text.test.mjs test-atomize.mjs)`. Everything must pass, in under 5 s (SC-003).
  - Save the summary to `E/r532-green.txt`.
  - Commit in `W` with the message `[recipes] atomizer: test-atomize skips cleanly without a provider key` (plan commit 3).
- [X] T016 [US2] Preview fork-ci from `W` (quickstart §3):
  - Run `OPENROUTER_API_KEY= ANTHROPIC_API_KEY= node ../../.fork/ci/bin/run-folder.mjs --path recipes/atomizer --mode strict --origin fork --out E/r532-run-folder.json`.
  - The outcome must be `pass`.
  - Confirm `git status --short` is empty (no lockfiles).

**Checkpoint**: the folder's strict verdict passes locally, and the baseline `fail` is resolved.

---

## Phase 5: Gate Self-Check (before the fork PR; Quality Gates 1–5, Principle VI)

- [X] T017 [P] Lane hygiene in `W` (quickstart §4): `git diff --stat upstream/main...HEAD` must list only these four paths under `recipes/atomizer/`:
  - `lib/atomize-text.mjs`
  - `test-atomize.mjs`
  - `atomize-text.test.mjs`
  - `test-support/fetch-stub.mjs`
- [X] T018 [P] Scan the staging diff in `W` (Principle VI, Gate 4):
  - Secrets: the only key-like strings are `test-key-not-real`, and nothing matches the OB1 gate's credential patterns.
  - No binaries and no profanity.
  - `metadata.json` and `README.md` are unchanged (`git diff --quiet upstream/main...HEAD -- recipes/atomizer/metadata.json recipes/atomizer/README.md`).
- [X] T019 [P] Gate 3, run from `W`: `npx --yes -p ajv-cli@5 -p ajv-formats ajv validate --spec=draft2020 -c ajv-formats -s .github/metadata.schema.json -d recipes/atomizer/metadata.json` must print `valid`.
- [X] T020 Gate 4: self-check upstream rules 1–16 (CONTRIBUTING.md § "The Automated Review Rules") against `recipes/atomizer/` on the staging branch.
  - Record a one-line pass/N-A per rule in `E/r532-gate-rules.md`.
  - Any failure blocks T021.
  - Gate 2 doesn't apply: no Markdown changes in the folder.

---

## Phase 6: User Story 3 - Land the staged PR (P2)

**Goal**: Land the change through a fork PR that passes both required gates.

**Independent Test**: the fork PR is merged with a merge commit, and fork `main` contains `8bebd77` and both test commits (FR-001, FR-008).

- [X] T021 [US3] Push and open the fork PR from `W`:
  - Push the branch: `git push -u origin stage/pr-532-atomizer-default`.
  - Create the PR: `gh pr create -R mfelker/OB1 --base main --head stage/pr-532-atomizer-default --title "[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5 (staged #532)"` (FR-009).
  - The PR body includes:
    - links to upstream #532 and this spec;
    - the red evidence (`E/r532-red.txt`, `E/r532-skip-red.txt`), which covers FR-006 and Gate 1;
    - the green output (`E/r532-green.txt`);
    - the run-folder outcome;
    - the Gate 4 result;
    - the Complexity Tracking justification for the `test-atomize.mjs` edit.
- [X] T022 [US3] Wait with an `until` loop on `gh pr checks <N> -R mfelker/OB1` until **both** of these are green:
  - `fork-ci-verdict` in strict mode, with 0 advisories for `recipes/atomizer/` (SC-004);
  - `OB1 Review`, which is authoritative for `stage/` → `main` under the constitution's Fork CI policy.
  - If either fails, fix it on the branch and repeat T015–T020 as needed.
- [X] T023 [US3] Confirm the fork PR's diff (`gh pr diff <N> -R mfelker/OB1 --name-only`) lists only the four paths from T017.
- [X] T024 [US3] Prepare the ledger row text for `.fork/staged-prs.md`. Fill every column defined by `StagedPrLedgerRow` in data-model.md, leaving only **Merged into fork** blank. The Notes column must record that the fork keeps the `test-atomize.mjs` skip (plan Complexity Tracking) until upstream adopts it.
  - Keep the text in `E/r532-ledger-row.md`; it is applied in T027.
- [X] T025 [US3] On fork `main` (`/Users/mfelker/Projects/ob1`):
  - Set spec.md **Status** to `Implemented`.
  - Mark T001–T025 `[X]` in this file.
  - Commit `E/` and both files as `[fork] Spec 002: evidence and status before merge`, then push.

---

## Merge (gate: T001–T025 all `[X]`, `fork-ci-verdict` and `OB1 Review` green)

- [X] T026 [US3] Merge the fork PR with `gh pr merge <N> -R mfelker/OB1 --merge` (FR-008; never squash or rebase).

---

## Phase 7: Post-merge recording (runbook step 6; needs the merge's date and SHA)

- [X] T027 [US3] In `/Users/mfelker/Projects/ob1`:
  - Update fork `main` to the merged state: `git pull --ff-only origin main`.
  - Apply `E/r532-ledger-row.md` to `/Users/mfelker/Projects/ob1/.fork/staged-prs.md`, filling in `StagedPrLedgerRow.Merged into fork` from data-model.md with the merge date. Status is `staged` (FR-010, SC-005: exactly one `#532` row).
  - Commit `[fork] Ledger: staged #532` and push.
- [X] T028 [US3] **Ask the owner before doing this; it is outward-facing.** Comment on upstream PR #532 (`gh pr comment 532 -R NateBJones-Projects/OB1`):
  - Link the fork's test commits.
  - Offer the tests and the `test-atomize.mjs` skip (FR-011).
  - Then add "tests and test-atomize skip offered upstream" to the ledger Notes and commit.
- [X] T029 Clean up: from `/Users/mfelker/Projects/ob1`, run `git worktree remove .worktrees/stage-pr-532-atomizer-default`. Then mark T026–T029 `[X]` and commit on fork `main`.

---

## Phase 8: Follow-up upstream PR with the tests (requested by #532's author)

On 2026-11-26 the author of #532 replied to T028's comment ([comment 7179170276](https://github.com/NateBJones-Projects/OB1/pull/532#issuecomment-7179170276)): open the stubbed-fetch tests as a separate PR under the owner's name, with `58b0567` if the maintainers want `test-atomize.mjs` under `node --test`. Owner decisions, 2026-11-26, asked one at a time: (1) include `58b0567` and K1/K2, stating the spec 003 T031 vacuous-pass caveat in the PR body; (2) open now, stacked on #532's head, because C1 asserts #532's new default and the old model retires 2026-11-30; (3) track it here, not as a new spec.

- [X] T030 Cut `contrib/mfelker/atomizer-tests` at `58b0567`, which is `8bebd77` (#532's head, on `upstream/main` `238df6c`) + `cfbfe76` + `58b0567`, so no cherry-pick is needed; worktree `.worktrees/atomizer-tests`. Checks: `git diff --stat upstream/main...HEAD` lists only `recipes/atomizer/`; against #532 it adds `atomize-text.test.mjs`, `test-support/fetch-stub.mjs` and the `test-atomize.mjs` change; `node --test recipes/atomizer/` with no provider keys gives 12 pass, 0 fail; the OB1 gate's review checks, run locally with the PR title and base `upstream/main`, pass all 15 rules.
- [X] T031 **Ask the owner first.** Push the branch to origin and open the upstream PR `[recipes] atomizer: credential-free tests for the model defaults (follows #532)`, body stating the dependency on #532 and the caveat; the body ends with the "Generated with Claude Code" line only (no session link). Done 2026-11-26: [#534](https://github.com/NateBJones-Projects/OB1/pull/534), head `58b0567`.
- [ ] T032 Reply on #532 linking the new PR, and add it to the #532 ledger row's Notes in `.fork/staged-prs.md`; commit on fork `main`.
- [ ] T033 After the follow-up PR merges or closes upstream: remove `.worktrees/atomizer-tests` and the local branch, and reconcile the ledger.

---

## Dependencies & Execution Order

- **T001** runs first, then **T002 and T003** in parallel.
- Then **US1** (T004–T008), then **US2** (T009–T016), then the **gate self-check** (T017–T020), then **US3** (T021–T025).
- Then the **merge** (T026), then **post-merge recording** (T027–T029).
- US1 and US2 tests share one file (`atomize-text.test.mjs`), so their test tasks run in order.
- **T008** temporarily checks out the old library file. It must finish, leaving no modified tracked files, before T009.
- **Commit 2** (T013) holds all the tests. **Commit 3** (T015) waits for T014.
- **T021** needs T016–T020 green. **T026** needs T025 pushed and both checks green.
- **T028** needs the owner's approval.

## Parallel Example

```bash
# Phase 2: two different files, no shared dependency
Task: "Create recipes/atomizer/test-support/fetch-stub.mjs"   # T002
Task: "Create recipes/atomizer/atomize-text.test.mjs helpers" # T003
# Phase 5: independent read-only checks
Task: "Lane hygiene diff"            # T017
Task: "Secret/binary/scope scan"     # T018
Task: "metadata.json schema check"   # T019
```

## Implementation Strategy

- **MVP = US1 + US2 through T016.** At that point the tests prove the new default and fork-ci's preview passes.
- The gate self-check and US3 follow immediately; landing is required before **2026-11-30** (SC-002).
- **If upstream merges #532 first** (at T001 or a later re-check), stop staging. Sync upstream instead and land only the fork's tests, with status `upstreamed`.

## Notes

- Never rewrite `8bebd77`. Never commit `package-lock.json` or `.env.local`.
- Every tool call that touches source uses absolute paths under `W`.
