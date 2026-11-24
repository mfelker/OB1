# Research: Fork CI (per-folder test enforcement)

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Date**: 2026-11-24

Facts were gathered from the repo and the GitHub API on 2026-11-24. Items marked **Verify in T-spike** are expected GitHub behavior that must be confirmed empirically during implementation, before anything is applied to `main`.

## Baseline facts

| Fact | Value | Source |
|------|-------|--------|
| Contribution folders with executable code | 64 | `git ls-files` scan |
| ...of which have any test file | 6 | same |
| `package.json` folders with a `test` script | 2 (`recipes/vercel-neon-telegram` → `vitest run`, `server` → `node test-stateless.mjs`) | scan of 16 `package.json` |
| Lockfiles (npm/pnpm/yarn/bun) | **none** in the repo | scan |
| Folders mixing `deno.json` + `package.json` | 1 (`server/`) | scan |
| Nested sub-projects inside a contribution folder | yes, e.g. `integrations/openclaw-agent-memory/plugin/package.json`, `integrations/hermes-agent-memory/plugin/tests/` | scan |
| Svelte components | 3 files in `dashboards/open-brain-dashboard` | scan |
| Upstream's own CI-tooling tests | `node:test` + `node:assert/strict` (`.github/scripts/gate-context.test.cjs`) | file |
| Core `thoughts` DDL | Markdown code block in `docs/01-getting-started.md` (table, indexes, trigger, `match_thoughts`) | file |
| Fork default workflow token | `read`, cannot approve PRs | `GET actions/permissions/workflow` |
| Fork repository secrets | 0 | `GET actions/secrets` |
| Fork `main` protection / rulesets | none / none | API |
| Local toolchain | Node 26.13, Python 3.15.2, Deno 2.9.8 | local |

## Decisions

### R1. Language for fork-ci's own logic

- **Decision**: Node.js ES modules (`.mjs`) with **zero dependencies**, tested with the built-in `node:test` + `node:assert/strict`.
- **Rationale**: This is the same stack upstream uses for its own CI tooling (`gate-context.test.cjs`). It's preinstalled on GitHub runners, needs no install step (so the fork-only-path case stays under 1 minute, SC-004), and git operations go through `child_process`.
- **Alternatives**: Bash inline in YAML (untestable, violates Principle IV); Python + pytest (needs a pytest install step); Deno (adds a toolchain to the detect job on every run).

### R2. Where fork-ci lives (fork-only paths)

- **Decision**: `.github/workflows/fork-ci.yml` (the `fork-` prefix is required by the Option C sweep) plus everything else under **`.fork/ci/`**: `lib/` (logic), `bin/` (CLI entry points), `test/` (unit tests and fixtures), `sql/` (Postgres bootstrap).
- **Rationale**: GitHub only loads workflows from `.github/workflows/`, and a new file name there never conflicts with upstream. `.fork/` does not exist upstream (Principle V).
- **Alternatives**: `.github/scripts/fork-*` (an upstream-tracked directory, which invites confusion during syncs).

### R3. Which folders changed

- **Decision**:
  - **PRs**: `git diff --name-only <base.sha>...<head.sha>` (diff from the merge-base) with `fetch-depth: 0`.
  - **Pushes to `main`**: `<before>..<after>`; when `before` is all zeros, fall back to `<after>~1..<after>`.
  - **Mapping**: each path maps to a folder `<category>/<name>` or `server`. Fork-only paths, `_template/` and anything outside the categories (for example `docs/`, `.github/`) are dropped (FR-002, FR-003).
- **Rationale**: Diffing from the merge-base shows only what the PR adds, even though fork `main` is ahead of upstream. This is the same property that makes the upstream gate pass on `contrib/` PRs.

### R4. Workflow and helper files on `stage/` and `contrib/` PRs

- **Decision**: Trigger on `pull_request` (never `pull_request_target`) and check out the default **merge ref** (`refs/pull/N/merge`).
- **Rationale**: Branches cut from `upstream/main` or a PR head contain neither `fork-ci.yml` nor `.fork/`. For `pull_request` events, GitHub runs the workflow from the merge commit (head merged into fork `main`), which contains both. Checking out the head alone would lose them.
- **Verify in T-spike**: open a scratch PR from a branch cut from `upstream/main`; confirm the workflow runs and finds `.fork/ci/`.

### R5. Running untrusted staged code safely

- **Decision**: Workflow-level `permissions: contents: read`; `actions/checkout` with `persist-credentials: false`; no `secrets.*` references at all (FR-008), including no `GITHUB_TOKEN` use in test jobs; no `pull_request_target`; and a job timeout on every test job.
- **Rationale**: Staged PRs run third-party code with unpinned `npm install` (there are no lockfiles). The baseline is already read-only with 0 secrets; the workflow pins it explicitly so a later repo-setting change can't widen it.

### R6. Upstream vs fork origin (FR-010), replacing the spec's second-parent assumption

- **Decision**: A changed folder is **upstream-origin** when its tree at the checked-out head is identical to its tree at `U = merge-base(HEAD, upstream/main)`, with upstream fetched fresh from the public URL (no credentials): `git rev-parse HEAD:<folder>` equals `git rev-parse U:<folder>`. Upstream-origin folders run in **advisory** mode; every other folder runs in **strict** mode.
- **Rationale**: This rule is based on folder content, not commit history, so it covers every case the second-parent rule misses:

  | Case | Result |
  |------|--------|
  | Sync merged locally or through a `sync/` PR | Upstream's folders are unchanged by the fork → advisory |
  | `contrib/` branch cut from a newer upstream than fork `main` | Folders that only upstream changed equal `U` → advisory; the owner's folder differs → strict |
  | Staged PR | The contributor's folder differs from `U` → strict |
  | Sync touching a folder that the fork already modified (for example a previously staged PR) | Differs → strict, which is correct because fork-side changes are involved |
  | Folder deleted at head | Reported as `removed` |

- **Alternatives**: second-parent detection (misses PR-based syncs and newer-base `contrib/` branches); comparing to the upstream tip (falsely strict when upstream moved past the branch's base).
- **Spec amendment**: the Assumptions line about "second parent on `upstream/main`" is replaced by this rule.

### R7. Strict TDD granularity: by runtime, not just by folder (FR-006)

- **Decision**: Within a strict folder, **each runtime that has executable code must have tests for that runtime**. A Deno runtime with `index.ts` but only a Node test fails with "no tests for deno code".
- **Rationale**: A folder-level "any test file" rule gives a false pass on `server/`: its only test (`test-stateless.mjs`) copies the pattern of `index.ts` instead of importing it, so the Edge Function itself is untested. That contradicts SC-001.
- **Consequence**: The first staged PR that touches `server/` will need a Deno test for `index.ts`. Because `index.ts` reads `Deno.env` and builds clients at import time, tests must stub env before importing (constitution Testing Standards).
- **Spec amendment**: FR-006 is refined from folder level to runtime level.

### R8. Runtime and runner detection (FR-005)

Each changed folder is scanned (excluding `node_modules/`) into **runtimes**. A runtime's *code* is its source files; its *tests* are files that match its test patterns.

| Runtime | Detected when | Test files | Command (run in the sub-project dir) |
|---------|---------------|-----------|---------------------------------------|
| `deno` | a dir with `deno.json`/`deno.jsonc` | `*_test.{ts,tsx,js,mjs}`, `*.test.{ts,tsx,js,mjs}`, `*.spec.{ts,tsx,js,mjs}` under it | `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read` (no `--allow-net`, so tests that call live services fail) |
| `node-script` | a dir with `package.json` that has a `scripts.test` | counted as present when the `test` script exists **and** a file matching `*.test.*` or `*.spec.*` (`.ts .tsx .js .mjs .cjs`) exists under it | `npm install --no-audit --no-fund` then `npm test` |
| `node-plain` | `.js/.mjs/.cjs` test files not covered by a `node-script` or `deno` sub-project | `*.test.{js,mjs,cjs}`, `*.spec.{js,mjs,cjs}`, `test-*.mjs` | `node --test <files>` |
| `python` | any `.py` source | `test_*.py`, `*_test.py` | `pip install -r requirements.txt` (if present), `pip install pytest`, `pytest -q` |
| `sql` | any `.sql` file | `tests/verify.sql` | see R10 |

- **Code files**: `.ts .tsx .js .mjs .cjs .py .svelte`, excluding `*.d.ts` and config files (`*.config.{js,mjs,cjs,ts}`, `eslint.config.*`).
- **Test files found but no runner applies** (for example `*.test.ts` with no `deno.json` and no test script) → `setup` failure with reason "tests found but no runner configured".
- **`server/`**: the `node-script` runtime runs `npm test`; the `deno` runtime has code and no tests → strict failure (R7).
- **Docs-only folders** (no code files and no `.sql`) → `exempt`.

### R9. Job layout, isolation, timeouts, and the required check

- **Decision**: three jobs.
  - `detect` builds a JSON matrix of folders.
  - `test` is a matrix over folders with `fail-fast: false`, `timeout-minutes: 20`. It runs each command through a Node runner (`lib/exec.mjs`) that kills the process group after `--timeout-sec` (default 600) and reports `timedOut` → `timeout`. This works the same on macOS and Linux, unlike a coreutils `timeout` wrapper. The job **always writes a result JSON artifact and exits 0**.
  - `fork-ci-verdict` has `if: always()`, downloads every result, writes the report to the job summary, and is the **only required check**.
- **Verdict rules**:
  - `detect` not `success` → fail.
  - `test` was `skipped` → pass only if `detect` reported 0 testable folders.
  - A folder with no result artifact (job killed, runner lost) → that folder counts as `timeout` and fails if it is strict.
  - Any strict folder with outcome `fail`, `no-tests`, `setup` or `timeout` → fail.
- **Rationale**: GitHub treats a **skipped** required job as passing, so the verdict job must never depend on test-job success and must check the result explicitly. Exiting 0 from matrix jobs keeps advisory failures out of red X's (SC-007, SC-008). **No workflow-level `paths` filters**: a required check that never reports stays pending forever.
- **Known behavior**: a PR with merge conflicts gets no `pull_request` run, so the check stays pending and the merge is blocked. That's acceptable, because conflicts must be resolved first anyway.
- **Verify in T-spike**: a red `test` job with the verdict job; an empty matrix; a missing artifact.

### R10. SQL verification convention (FR-011)

- **Decision**: The convention is **`<folder>/tests/verify.sql`**, run with `psql -v ON_ERROR_STOP=1` from inside the folder. The verify script pulls in what it needs with `\ir ../schema.sql` (relative include), and its assertions `RAISE EXCEPTION` on failure.
  - Before it runs, CI starts a `pgvector/pgvector` service container and applies `.fork/ci/sql/bootstrap.sql`: Supabase role stubs (`anon`, `authenticated`, `service_role`), an `auth` schema with an `auth.uid()` stub, `create extension vector`, and the core `thoughts` table plus `match_thoughts`, copied from `docs/01-getting-started.md`.
  - A self-test compares the bootstrap's `thoughts` column list with the doc's code block to catch drift.
  - Folders whose changed files include SQL but have no `tests/verify.sql` → `advisory: sql-unverified`.
- **Rationale**: No folder has a verification script today. Making the author control includes avoids guessing apply order across `schema.sql`, `migrations/`, `queries.sql`, and so on. Starting Postgres only for matrix entries that need it keeps other jobs fast.
- **Scope**: delivered in the last user story (P3). Until then, every SQL change reports `sql-unverified` (advisory).

### R11. Lane enforcement (FR-012): ruleset with owner bypass, plus bypass detection

- **Decision**: A repository **ruleset** on `main` requiring the `fork-ci-verdict` status check, with **repository admin as bypass actor (`always`)**. On every push to `main`, fork-ci also scans the pushed range for **local merges of upstream-based branches** and fails that push run's verdict with reason `lane-bypass`.
- **Detection rule** (content-based, independent of commit messages, because git does not record branch names). For each merge commit `M` (parents `P1`, `P2`) in `before..after` on the first-parent chain:
  1. Committer is `GitHub <noreply@github.com>` → merged through a PR → **not flagged**.
  2. `P2` is an ancestor of `upstream/main` → upstream sync → **not flagged**.
  3. `merge-base(P1, P2)` is an ancestor of `upstream/main` → the merged branch was cut from upstream or a PR head, so it is a `stage/` or `contrib/` lane → **flagged `lane-bypass`**.
  4. Otherwise the branch was cut from fork `main` (a `fork/` lane) → **not flagged**.

  The `branch` label comes from a default `Merge branch '…'` message when present, otherwise `unknown`. Custom messages such as `-m "[fork] Stage upstream PR #12"` are still caught by rule 3.
- **Known limits**:
  - A `stage/` or `contrib/` branch landed by rebase or fast-forward produces no merge commit and is not detected. The runbook forbids rebasing onto fork `main` (Principle VII).
  - Rule 4 assumes fork `main` carries at least one fork-only commit. That is true since the spec-kit bootstrap commit `f702cb7`.
- **Rationale**:
  - Required status checks also reject **direct pushes**, which would break upstream syncs and local `fork/` merges. So the owner must be a bypass actor, and then nothing technically prevents a local `stage/` merge either.
  - Enforcement therefore has three layers:
    1. On a PR, a red verdict disables the normal merge button. Bypassing needs the explicit "bypass rules" checkbox, which is a deliberate act.
    2. On a direct push, GitHub prints "Bypassed rule violations" in the `git push` output.
    3. The post-push run turns a local `stage/`/`contrib/` merge red.
  - This is the strongest enforcement available for a single-owner repo without blocking syncs.
- **Spec amendments**:
  - SC-009 is reworded from "100% … only after a passing check" to "every `stage/`/`contrib/` change that reaches `main` through a local merge is flagged red".
  - The edge case "branch protection flags the bypass" now reads "the post-push run flags the bypass (`lane-bypass`)".
- **Permission**: creating the ruleset is a repo-settings change. It is a **user-run or user-approved step** (quickstart), never applied silently.
- **Verify in T-spike**: create the ruleset against a throwaway pattern (`spike/fork-ci-*`) first. Confirm the direct-push bypass message, a PR with a red check (merge button disabled, bypass checkbox present), a PR whose check never reported (pending blocks), and that PR merge commits carry committer `GitHub <noreply@github.com>`.

### R12. Toolchain pinning

- **Decision**: Node `26` (`actions/setup-node`), Python `3.13` (`actions/setup-python`), Deno `v2.9.x` (`denoland/setup-deno`), and PostgreSQL via `pgvector/pgvector:pg17`. Actions are pinned to major versions.
- **Rationale**: The runner image's defaults differ from local (Node 26, Python 3.15, Deno 2.9.8). Explicit pins make results reproducible. Python 3.13 instead of 3.15 because older importers' dependencies may lack wheels for 3.15.
- **Revisit**: when a contribution declares a different engine version.

### R13. Testing fork-ci itself

- **Decision**:
  - **Unit tests** (`node --test .fork/ci/test/`) cover detection, mapping, classification, runtime and runner selection, origin, verdict, report rendering, and bypass detection, using fixture folders and **temporary git repos** built inside the tests.
  - A **`self-test` job** runs whenever `.fork/ci/**` or `fork-ci.yml` changes. FR-003 skips fork-only paths for *contribution* testing, so without this job fork-ci's own tests would never run in CI.
  - **`actionlint`** runs in the self-test job (downloaded binary) to lint the workflow file.
- **Rationale**: This is Principle IV applied to the tool that enforces Principle IV.

## Spike results (T011, 2026-11-24)

Run on `mfelker/OB1` with stub CLIs (T009) and the workflow skeleton (T010), using a temporary ruleset (id `28028942`) on `refs/heads/spike/fork-ci-*` that requires `fork-ci-verdict`, with bypass actor `RepositoryRole` `actor_id: 5` (`always`). GitHub accepted `actor_id: 5` as the Repository admin role.

| Assumption | Scenario | Observed | Holds? |
|------------|----------|----------|--------|
| R4: workflow + `.fork/ci/` available on PRs from upstream-based branches | PR #1: branch cut from `upstream/main` (no `fork-ci.yml` on it) touching `recipes/brain-smoke-test` | The push of that branch started **no** run (no workflow on it), yet its PR run executed from the merge ref and found `.fork/ci/`. `detect` (merge-base diff) listed only `recipes/brain-smoke-test`, so no fork-only commits leaked in | ✅ |
| R9: a failing `test` job still gets an always-run verdict | PR #2: `SPIKE_FAIL` marker → `test` job failure | `fork-ci-verdict` ran and failed (`detect=success test=failure`); PR `mergeable_state=blocked` | ✅ |
| R9: an empty matrix / skipped `test` is handled | PR #3: fork-only edit only | `test` skipped, `fork-ci-verdict` success; PR `clean`; run took **39 s** (SC-004 < 1 min) | ✅ |
| R9: a pending required check blocks | All 3 PRs while running | `mergeable_state=blocked` until the verdict reported | ✅ |
| R11: direct push is allowed for the owner but flagged | Direct push to `spike/fork-ci-base` | Push succeeded; `remote: Bypassed rule violations … Required status check "fork-ci-verdict" is expected.` | ✅ |
| R11: PR merges are committed by GitHub | PR #3 merged via `gh pr merge --merge` | Merge commit `7912715` committer `GitHub <noreply@github.com>` | ✅ |
| R11: red PR shows a deliberate bypass option | PR #2 | API shows `blocked`; the UI "bypass rules" checkbox for admins was not observed through the API (UI-only) | ⚠️ not verified via API |

Cosmetic finding: a skipped matrix job is listed as `test (${{ matrix.path }})` because the name expression cannot resolve without a matrix. This is harmless; the verdict, not the job name, is the required check.

**US1 validation (T026, 2026-11-24)**, using real `run-folder` and `verdict` on PR #4 into `spike/fork-ci-base` that touches `recipes/vercel-neon-telegram` (one deliberately failing Vitest assertion), `integrations/chrome-capture-extension` and `recipes/authorship-edges`:

- Red run `45501700932`: the 3 matrix jobs ran in parallel; the verdict was ❌ naming only `recipes/vercel-neon-telegram` (`node-script ❌ tests failed (exit 1)`). PR opened 22:31:14 → verdict 22:32:22 = **68 s** (SC-003 < 10 min ✅).
- Green run `45501926020` after reverting the assertion: ✅ in 51 s.
- Real-folder findings: `recipes/atomizer/test-atomize.mjs` is a live-API script that fails without `OPENROUTER_API_KEY` (correct under FR-008); `integrations/hermes-agent-memory` tests import the undeclared host package `agent` and fail outside a Hermes install; `server` → node-script pass + deno no-tests (R7).
- Side effect of the temporary `spike/fork-ci-*` **push** trigger: PR branches matching it also get push runs, which duplicates the checks. This goes away when T055 restores `main`-only triggers.

**US3 and US4 validation (T038, T044, 2026-11-24)**, PRs into `spike/fork-ci-base` from `val/*` branches (no push-trigger duplicates):

- PR #5, fork-only edit (`specs/…/quickstart.md`): ✅ in **35 s**, self-test `needed=false`, "No contribution folders changed" (SC-004 ✅).
- PR #6, `.fork/ci/lib/paths.mjs` touched: the self-test ran **85/85 tests, 0 skipped** on Linux with `CI=true` (Python venv and Deno exercised). The first run failed only on `actionlint` shellcheck SC2016 (JS template literals inside a single-quoted `node -e`); after fixing that in the workflow, it went ✅ in 40 s. The self-test caught a real issue in fork-ci's own workflow.
- PR #7, simulated sync: spike base set behind upstream for `recipes/google-activity-import`; the PR restored upstream's version. Detect produced `advisory`/`upstream`, and the report showed `⚠️ no-tests … no tests for node code (from upstream)`. Verdict ✅ (SC-008 ✅).

**SQL validation (T053, 2026-11-24)**, PR #8 into `spike/fork-ci-base` adding `schemas/fork-ci-val` (schema with an FK to the core `thoughts` table, plus `tests/verify.sql`) and `schemas/fork-ci-val-noverify` (SQL only):

- Routing: `fork-ci-val` → `test-sql` job (pgvector service), `-noverify` → `test` job.
- Red run `45510961508`: bootstrap applied (the FK to `thoughts` resolved); the verify script failed on the deliberate assertion (`ERROR: thought_labels.confidence missing`) → ❌ `fail (exit 3)`; `-noverify` → ⚠️ `sql-unverified` (advisory).
- Green run `45511164090` after removing the assertion: ✅ with `sql ✅` and the ⚠️ advisory row, in 62 s.

**Landing and end-to-end on `main` (T060–T062, 2026-11-24)**:

- T060: PR #9 (`fork/fork-ci` → `main`) passed `fork-ci-verdict` (self-test 101/101, 0 skipped), Markdown Lint and the OB1 PR Gate, and was merged with a merge commit (`845d15e`, committer `noreply@github.com`). Fixing Markdown Lint required exempting the vendored `.claude/skills/speckit-*` files committed by the bootstrap (75 issues; every PR into `main` had been failing lint since `f702cb7`). The first push run on `main` was ✅, with no lane bypass.
- T061: ruleset `28033062` "fork-ci required" on `refs/heads/main`, requiring `fork-ci-verdict`, with admin bypass (`actor_id: 5`).
- T062, never-merged PRs against `main`:

  | Scenario | PR | Result |
  |----------|----|--------|
  | Staged PR (cut from `upstream/main`) changing code, no tests | #10 | ❌ `no tests for node code`, `mergeable_state=blocked` |
  | Same PR after adding a test in the folder | #10 | ✅ `pass`, no longer blocked (`unstable` only from the advisory OB1 Gate's title rule) |
  | Fork-only edit | #11 | ✅ in 38 s, `clean` |
  | SQL without verify + SQL with a failing `tests/verify.sql` | #12 | ❌ `fail` for the verify script, ⚠️ `sql-unverified` advisory, `blocked` |
  | Upstream sync | — | Not exercisable: upstream has no new commits; validated on the spike in T044 |
  | Local `stage/` merge pushed to `main` | — | Not run on `main` to keep it clean; covered by `bypass.test.mjs` and the real-history check |

  Finding: the upstream OB1 PR Gate (advisory) fails rule 7 when a staged PR is titled `[fork] …`. The runbook now keeps the upstream PR's own `[category]` title for staged PRs.

**Result**: every R4, R9 and R11 assumption that the API can observe holds; no research amendment is needed. `actor_id: 5` is confirmed for T061.

## Spec amendments (reported to the owner)

1. **FR-006**: "code folder with no tests" is refined to "**each runtime** with code in a strict folder must have tests" (R7).
2. **Assumptions, origin detection**: the second-parent rule is replaced by folder-tree comparison against `merge-base(HEAD, upstream/main)` (R6).
3. **SC-009 and the lane-bypass edge case**: technical blocking applies to PR merges, while direct-push and local-merge bypasses are detected and flagged red (R11).
