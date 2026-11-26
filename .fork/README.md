# Fork Operating Model (mfelker/OB1)

Fork-only. This folder does not exist upstream and must never appear on a `contrib/` branch.
Authoritative rules: `.specify/memory/constitution.md` (Principles IV, V, VII).

## Remotes

| Remote | URL | Role |
|--------|-----|------|
| `origin` | `https://github.com/mfelker/OB1.git` | The fork: integration `main`, lane branches |
| `upstream` | `https://github.com/NateBJones-Projects/OB1.git` | Clean base; source of PRs to stage |

## Lanes

| Lane | Branch | Cut from | Lands in | TDD rule |
|------|--------|----------|----------|----------|
| Fork feature | `fork/<desc>` | fork `main` | fork `main` | Red-green-refactor, red recorded in `tdd/cycle-log.md` |
| Upstream-bound feature | `contrib/mfelker/<desc>` | `upstream/main` | Upstream PR **and** fork `main` via a fork PR | Red-green-refactor, red recorded in `tdd/cycle-log.md`; tests inside the contribution folder |
| Staged upstream PR | `stage/pr-<N>-<desc>` | `upstream` `refs/pull/<N>/head` | Fork `main` **via a fork PR**, as **its own spec-kit feature** | Tests green before merge; red recorded at the PR base, green at the head (base-red rule) |

Every lane follows the [TDD workflow](#tdd-workflow).

## Where spec-kit runs

Run every `/speckit-*` command from the **fork-`main` checkout** (`~/Projects/ob1`). Worktrees cut from `upstream/main` or a PR head contain no `.specify/`, `specs/`, or speckit skills. The plan records the worktree's absolute path, and tasks write into it from there.

## TDD workflow

Every lane runs its tests through the spec-kit-tdd extension (installed in `.specify/extensions/tdd/`; record under [Extension version](#extension-version)). The rules are in constitution Principle IV (v1.3.0). Never edit `.specify/extensions/tdd/`; the fork tunes it only through `.specify/templates/overrides/`.

| Step | Command | How it runs | Writes |
|------|---------|-------------|--------|
| 1. Test list | `/speckit-tdd-plan` (`speckit.tdd.plan`) | Offered by the `after_tasks` hook right after `/speckit-tasks` (optional: accept it). Offered again after `/speckit-converge` (`after_converge`) | `tdd/test-list.md`; adds the `[U#]`/`[A#]` behavior markers to `tasks.md` and reorders the test tasks first |
| 2. Loop | `speckit.tdd.run` | Runs first inside `/speckit-implement` through the mandatory `before_implement` hook (`optional: false`). With no test list it stops | One red-green-refactor cycle per behavior, each recorded in `tdd/cycle-log.md`; ticks the marked tasks it completed |
| 3. Audit | `/speckit-tdd-verify` (`speckit.tdd.verify`) | Offered by the `after_implement` hook; run tdd.verify before merge in every lane | `tdd/verification.md` with a verdict; merge needs PASS or PASS_WITH_GAPS (Quality Gate 1) |

- **Never tick a marked task by hand.** The loop ticks `[U#]`/`[A#]` tasks when their behaviors are done; `/speckit-implement` then covers only the unmarked work.
- **Profile**: `.specify/memory/tdd-profile.md` holds the loop's single-test, file and suite commands. They all call the adapter `node .fork/ci/bin/tdd.mjs`, which resolves the active feature's plan **Worktree** and **Contribution folder** and picks fork-ci's runner for the file (see `.fork/ci/README.md`).
- **Staged PRs (base-red rule)**: the PR's code already exists, so a new test usually passes at once. Record the red at the PR base instead: `BASE=$(git merge-base HEAD upstream/main)`, check out the base copy of only the PR-changed source files, run the profile's single-test command and record the base SHA and failure line, restore with `git checkout HEAD -- <files>`, confirm `git status --short --untracked-files=no` is empty, then record the green at the PR head. A green at the head alone counts as test-after. The procedure lives in `.specify/templates/overrides/tdd-loop-playbook.md` and the evidence rules in `.specify/templates/overrides/tdd-test-quality-rubric.md`; both apply only when the plan's Lane is "staged upstream PR". Never commit a base checkout.
- **CI status is advisory**: on a pull request, fork-ci's job summary adds a "TDD status (advisory)" table with each linked feature's cycle log, audit report and verdict. It never changes `fork-ci-verdict`; checking the audit verdict before merge is the owner's job.

### The active feature, per checkout

- `.specify/feature.json` is gitignored, per-checkout state, and the adapter reads it (unless `SPECIFY_FEATURE_DIRECTORY` is set). Every checkout or worktree that runs the loop needs its own local `.specify/feature.json`, for example `{"feature_directory": "specs/003-tdd-extension"}`.
- Before running against a feature that isn't the active one, switch `.specify/feature.json` to it and confirm with `node .fork/ci/bin/tdd.mjs where` (it prints `featureDir`, `lane`, `tree` and `folder`). Switch back afterwards. Every adapter summary line also names `feature=` and `folder=`.
- The adapter blanks credential variables (known provider keys and any name ending in `_API_KEY`, `_TOKEN`, `_SECRET` or `_SERVICE_ROLE_KEY`) for every test it starts, so a live sanity script takes its skip path and the loop never makes a live call.

### Disabling the mandatory hook

Only with a stated reason. In `.specify/extensions.yml`, set `enabled: false` on the `before_implement` entry of extension `tdd`, and state the reason in the feature's `plan.md` (Complexity Tracking). A disabled hook without a reason violates Principle IV. Set it back to `enabled: true` when the feature is done.

### Extension version

| Field | Value |
|-------|-------|
| Extension | `tdd` (spec-kit-tdd by d0whc3r), version **2.0.1** |
| Tag | `v2.0.1` → commit `55221d4` (`55221d428c7f135d8884df57a49108a59541a698`) |
| Release asset | `tdd-2.0.1.zip`, SHA-256 `bdae2f8d6582767c47c1758ed3204d23d41b83e666e0165830720b97b7212726` |
| Evidence | [`specs/003-tdd-extension/evidence/r1-verify.md`](../specs/003-tdd-extension/evidence/r1-verify.md) |

To verify a future upgrade, as a fork feature of its own:

1. Download the new release zip into a fresh empty scratch folder and record its SHA-256. Unzip it into a second empty folder; never execute anything from either.
2. Compare every unzipped file's `git hash-object` with its blob from `gh api 'repos/d0whc3r/spec-kit-tdd/git/trees/<tag>?recursive=1'`, and record the tag's commit. Stop on any difference, or on any file outside `extension.yml`, `README.md`, `LICENSE`, `commands/` and `templates/`.
3. Install with `specify extension add --dev <unzipped folder>`, re-hash the installed copies, and confirm the four hooks in `.specify/extensions.yml` (`before_implement` still `optional: false`).
4. Rebase the overrides on the new templates: their header records the base template's SHA-256, and the drift test (`.fork/ci/test/tdd-overrides.test.mjs`) fails until they are updated.
5. Update this table and write a new evidence file.

## Domain knowledge

`.fork/domain-knowledge/` is the canonical knowledge root for `/speckit-grill-with-docs` on the fork. Upstream owns `docs/`, so the grill's glossary and decisions live here, where the fork owns the path:

```text
.fork/domain-knowledge/
├── CONTEXT.md        # the glossary and domain overview
├── <topic>.md        # topic documents, one per area
└── adr/              # architecture decision records
```

The folder does not exist until the grill records its first item. Do not create it by hand.

## Principle V guard

Constitution Principle V keeps the fork-`main` checkout free of upstream-owned paths. Two guards enforce it, both running the same rule (`.fork/ci/lib/principle-v.mjs`) through one CLI, `.fork/ci/bin/principle-v-guard.mjs` (see `.fork/ci/README.md`):

- **Agent guard.** A Claude Code `PreToolUse` hook, registered in `.claude/settings.json`, checks every `Write`, `Edit`, `MultiEdit` and `NotebookEdit` before it runs. It is active as soon as the repository is opened in Claude Code.
- **Commit guard.** The git `pre-commit` hook in `.fork/githooks/` checks every staged path. Git does not use it until you enable it, once per clone (worktrees share the setting):

```bash
git config core.hooksPath .fork/githooks
```

**What is refused**, only on a checkout of `main`: changing a file that exists in `upstream/main`, creating a new file inside a folder that exists upstream, and any path when `upstream/main` cannot be read (run `git fetch upstream`). The message names the reason and where to make the change instead: an upstream-bound worktree (`contrib/mfelker/<desc>` from `upstream/main`) or a staged PR. A refused write under `docs/domain_knowledge/` points to `.fork/domain-knowledge/`.

**What is allowed**: everything on any other branch, in a linked worktree, or on a detached HEAD (so a detached HEAD or a rebase in the fork-main checkout is unguarded by design); fork-only paths (`.fork/`, `.specify/`, `specs/`, `.worktrees/`, `.claude/settings.json`, `.claude/skills/speckit-*`, `.github/workflows/fork-*`); new top-level paths upstream does not have; and paths outside the repository.

**Merge exception**: while a merge is in progress (`MERGE_HEAD` exists), both guards allow everything, so syncing upstream and resolving conflicts works.

**Bypass**: a refused commit can be forced deliberately with `git commit --no-verify`. The agent guard has no bypass; make the change in the right worktree instead. If the guard itself fails, it refuses (fail closed) rather than letting the change through.

## One-time setup (per clone or worktree)

```bash
git config rerere.enabled true
git config rerere.autoupdate true
git config merge.conflictstyle zdiff3
```

## Fork CI policy (Option C)

Upstream workflow files are never edited or deleted. They are switched on or off in repo settings only, so syncs never conflict on them.

| Workflow | File | State |
|----------|------|-------|
| OB1 PR Gate | `ob1-gate-v2.yml` | **Enabled**: upstream-identical checks before submitting (advisory on fork-only PRs) |
| Markdown Lint | `markdown-lint.yml` | **Enabled** |
| All others (9 as of 2026-11-24) | — | Disabled |

Upstream CI runs no contribution tests; `fork-ci` (fork-only workflow) covers that.

**After every sync**, disable any newly arrived upstream workflow:

```bash
KEEP='^(ob1-gate-v2|markdown-lint)\.yml$'
gh api repos/mfelker/OB1/actions/workflows --paginate \
  -q '.workflows[] | select(.state=="active") | "\(.id) \(.path)"' |
while read -r id path; do
  base=$(basename "$path")
  case "$base" in fork-*) continue ;; esac   # fork-owned workflows stay on
  echo "$base" | grep -qE "$KEEP" || gh workflow disable "$id" -R mfelker/OB1
done
```

## How changes land on fork `main`

`stage/` and `contrib/` changes land **only through a pull request on the fork**, merged with a merge commit after `fork-ci-verdict` passes. `fork/` branches and upstream syncs may still be merged locally and pushed.

| Lane | How it lands | What enforces it |
|------|--------------|------------------|
| `stage/`, `contrib/` | `gh pr create -R mfelker/OB1 --base main`, then `gh pr merge <N> -R mfelker/OB1 --merge` once green | The ruleset (`fork-ci required`) requires `fork-ci-verdict` **and** `OB1 Review`; a red PR can only merge through the deliberate "bypass rules" checkbox |
| `fork/` | Local `git merge --no-ff`, then push (or a fork PR) | fork-ci runs after the push and reports |
| Upstream sync | Local merge and push, or an optional `sync/upstream-<date>` fork PR | Upstream-only folders are advisory, so syncs are not blocked |

`OB1 Review` runs on every PR into `main`. On fork-only PRs (`.specify/`, `specs/`, `.fork/`) and `sync/upstream-*` PRs its Folder-structure/Scope failures are expected, so those PRs need the admin bypass (or land by direct push / local merge, as the table allows).

Use **Create a merge commit** (`--merge`), never squash or rebase. It keeps contributor commits intact for the ledger, and GitHub-committed merges are how fork-ci recognizes a PR merge.

A local merge of a `stage/` or `contrib/` branch still pushes, because the owner bypasses the ruleset, but `git push` prints `Bypassed rule violations`, and the post-push fork-ci run fails with **`lane-bypass`**. It recognizes the branch by its history (cut from upstream), not by the merge message.

### fork-ci outcomes

| Outcome | Meaning | Blocks? |
|---------|---------|---------|
| ✅ `pass` | All runtimes' tests passed | — |
| ❌ `fail` | Tests failed | Yes (strict) |
| ❌ `no-tests` | A runtime with code has no tests (for example "no tests for deno code") | Yes (strict) |
| ❌ `setup` | Install failed, or tests found but no runner configured | Yes (strict) |
| ❌ `timeout` | Tests exceeded the limit, or a job lost its result | Yes (strict) |
| ⚠️ any of the above, advisory | The folder's content is identical to upstream (`(from upstream)`) | No |
| ⚠️ `sql-unverified` | SQL changed but the folder has no `tests/verify.sql` | No |
| ➖ `exempt` | Docs-only folder | No |
| ❌ `lane-bypass` | Push run only: a `stage/`/`contrib/` branch was merged locally | Yes |

Design and details: `specs/001-fork-ci/` and `.fork/ci/README.md`.

## Sync upstream into the fork (weekly, and before any new `contrib/` branch)

```bash
git switch main
git fetch upstream
git merge --no-ff upstream/main -m "[fork] Sync upstream/main $(date +%F)"
# Conflicts on a staged PR's files: take upstream's version, then re-apply fork tests (see below)
git push origin main
```

Never rebase or force-push fork `main`.

## Stage an upstream PR

**Every staged upstream PR is its own spec-kit feature** (constitution v1.2.0, Principle VII): one PR = one `specs/###-stage-pr-<N>-<desc>/` folder, never batched with other PRs. Run all `/speckit-*` commands from the fork-`main` checkout (`~/Projects/ob1`); code changes happen in a worktree cut from the PR head.

### 1. Specify (fork-`main` checkout)

```bash
N=532; DESC=atomizer-default
gh pr view $N -R NateBJones-Projects/OB1          # read it first
gh pr diff $N -R NateBJones-Projects/OB1
```

Then run `/speckit-specify Stage upstream PR #$N: <what it does>` and fill the spec's **Lane & Contribution Target** table:

| Field | Value |
|-------|-------|
| Lane | staged upstream PR |
| Branch | `stage/pr-<N>-<desc>` |
| Base | `refs/pull/<N>/head` |
| Contribution folder | the folder the PR touches |
| Upstream PR | `#<N>` |

Decline the worktree extension's after-specify offer; the staging worktree is created in step 2.

### 2. Worktree from the PR head

```bash
git fetch upstream "pull/$N/head:stage/pr-$N-$DESC"
git worktree add ".worktrees/stage-pr-$N-$DESC" "stage/pr-$N-$DESC"   # ignored by .worktrees/.gitignore
```

The worktree has no `.specify/`, `specs/` or `.fork/` (it is upstream code).

### 3. Plan and tasks (fork-`main` checkout)

Run `/speckit-plan`, then `/speckit-tasks`. The plan's **Lane** is "staged upstream PR #N", its **Worktree** is the absolute path of `.worktrees/stage-pr-<N>-<desc>`, and its **Contribution folder** is the folder the PR touches; the adapter reads all three. Every task path is rooted at the worktree. The tasks MUST include the tests for the PR's changed behavior (Principle IV: written and green before merge). The existing code is not rewritten; tests are added in separate commits.

Accept the `after_tasks` offer to run `/speckit-tdd-plan`: it writes the feature's `tdd/test-list.md` and adds the `[U#]`/`[A#]` markers to `tasks.md`. Without a test list, step 4 stops.

### 4. Implement (the loop)

In the fork-`main` checkout, with `.specify/feature.json` pointing at this feature (`node .fork/ci/bin/tdd.mjs where` shows the staging worktree as `tree`), run `/speckit-implement`. Its mandatory `before_implement` hook drives each behavior through the loop first, writing the tests into the worktree and recording each cycle in the feature's `tdd/cycle-log.md`. Because the PR's code already exists, each red is recorded **at the PR base** (the base-red rule in [TDD workflow](#tdd-workflow)), and the green at the head. Commit the tests in the worktree separately (`[category] Tests for #N`). The profile's commands run the folder's own runner (`deno test`, `npm test`, `node --test`, `pytest`) through the adapter; `.fork/ci/` itself is not on the staging branch. Before pushing, preview fork-ci's verdict by running the fork-`main` copy of `run-folder` from inside the worktree (it treats the current directory as the repo root):

```bash
cd ".worktrees/stage-pr-$N-$DESC"
node ../../.fork/ci/bin/run-folder.mjs --path <folder> --mode strict --origin fork --out /tmp/r.json
git status --short   # npm installs may leave a package-lock.json; don't commit it
```

### 5. Audit, then land through a fork PR

From the fork-`main` checkout, run `/speckit-tdd-verify` on the feature. It writes `tdd/verification.md`; the merge needs the verdict PASS or PASS_WITH_GAPS (Quality Gate 1). A behavior with only a head-green is classified test-after, so go back to step 4 for it. Commit the feature's `tdd/` files on fork `main`. The fork PR's "TDD status (advisory)" summary shows this verdict but doesn't block.

```bash
cd ".worktrees/stage-pr-$N-$DESC"
git push -u origin "stage/pr-$N-$DESC"
# Keep the upstream PR's own "[category] ..." title so the OB1 PR Gate title rule passes
# (the gate is authoritative for stage/ -> main PRs; constitution Fork CI policy):
gh pr create -R mfelker/OB1 --base main --head "stage/pr-$N-$DESC" \
  --title "$(gh pr view $N -R NateBJones-Projects/OB1 --json title -q .title) (staged #$N)"
# When fork-ci-verdict AND "OB1 Review" are green, tdd.verify is PASS or PASS_WITH_GAPS,
# and the feature's pre-merge tasks are all [X]
# (only post-merge recording -- ledger row, upstream comment, worktree removal -- may follow the merge):
gh pr merge <fork-PR-number> -R mfelker/OB1 --merge
cd - && git worktree remove ".worktrees/stage-pr-$N-$DESC"
```

### 6. Record

Add a row to `staged-prs.md`, including the **Spec** folder. Commit the feature's `specs/` updates on fork `main`. If the tests are worth offering upstream, comment on the upstream PR with a link to the fork's test commit.

### When upstream later lands a staged PR

Upstream uses both merge commits and squash merges.

- **Merged as-is (merge commit)**: the sync merges cleanly. Set the ledger status to `upstreamed`.
- **Squashed or modified**: conflicts or duplicate content may appear. Resolve **in favor of upstream** (`git checkout --theirs <paths>` for that folder only). Re-run the fork's tests, re-apply them as a new commit if upstream changed the code, and set the ledger status to `upstreamed (reconciled)`.
- **Closed unmerged upstream**: decide whether to keep it as fork-only (status `fork-only`) or revert it (`git revert -m 1 <merge-sha>`, status `reverted`).

## Ship an upstream-bound feature

```bash
git fetch upstream
git worktree add "../ob1-$DESC" -b "contrib/mfelker/$DESC" upstream/main
# Implement per specs/###-name/tasks.md (specs stay on fork main)
git diff --stat upstream/main...HEAD   # must list only the one contribution folder
git push -u origin "contrib/mfelker/$DESC"
gh pr create -R NateBJones-Projects/OB1 --head "mfelker:contrib/mfelker/$DESC" --title "[category] Short description"
# Also land it on fork main through a fork PR (fork-ci and OB1 Review must pass).
# Use the same [category] prefix as the upstream PR: the gate's PR-format rule rejects
# "[fork] ..." for any PR that touches a contribution folder (fork #20, spec 004 T049).
gh pr create -R mfelker/OB1 --base main --head "contrib/mfelker/$DESC" --title "[category] Short description (fork landing)"
gh pr merge <fork-PR-number> -R mfelker/OB1 --merge
```

Record it in `staged-prs.md` with kind `own`. Upstream may squash or edit it before merging, and the reconcile rules above apply to it as well.

## Open items (future `/speckit-specify` features)

- Automation scripts for sync and staging (wrapping the commands above, updating the ledger)
- ~~A fork-specific CI workflow~~ → `fork-ci` (spec 001)
- Triage of the upstream open-PR backlog (135 open PRs as of 2026-11-24)
