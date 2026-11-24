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
| Fork feature | `fork/<desc>` | fork `main` | fork `main` | Red-green-refactor |
| Upstream-bound feature | `contrib/mfelker/<desc>` | `upstream/main` | Upstream PR **and** fork `main` via a fork PR | Red-green-refactor; tests inside the contribution folder |
| Staged upstream PR | `stage/pr-<N>-<desc>` | `upstream` `refs/pull/<N>/head` | Fork `main` **via a fork PR** | Tests written and green before merge |

## Where spec-kit runs

Run every `/speckit-*` command from the **fork-`main` checkout** (`~/Projects/ob1`). Worktrees cut from `upstream/main` or a PR head contain no `.specify/`, `specs/`, or speckit skills. The plan records the worktree's absolute path, and tasks write into it from there.

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
| `stage/`, `contrib/` | `gh pr create -R mfelker/OB1 --base main`, then `gh pr merge <N> -R mfelker/OB1 --merge` once green | The ruleset requires `fork-ci-verdict`; a red PR can only merge through the deliberate "bypass rules" checkbox |
| `fork/` | Local `git merge --no-ff`, then push (or a fork PR) | fork-ci runs after the push and reports |
| Upstream sync | Local merge and push, or an optional `sync/upstream-<date>` fork PR | Upstream-only folders are advisory, so syncs are not blocked |

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

```bash
N=123; DESC=short-desc
git fetch upstream "pull/$N/head:stage/pr-$N-$DESC"
git worktree add "../ob1-stage-$N" "stage/pr-$N-$DESC"
cd "../ob1-stage-$N"
# 1. Read the diff: git diff upstream/main...HEAD --stat
# 2. Write tests inside the PR's contribution folder; commit separately: "[category] Tests for #N"
# 3. Run tests until green locally: node .fork/ci/bin/run-folder.mjs is not on this branch,
#    so use the folder's own runner (deno test / npm test / pytest)
git push -u origin "stage/pr-$N-$DESC"
gh pr create -R mfelker/OB1 --base main --head "stage/pr-$N-$DESC" --title "[fork] Stage upstream PR #$N ($DESC)"
# 4. When fork-ci-verdict is green:
gh pr merge <fork-PR-number> -R mfelker/OB1 --merge
cd - && git worktree remove "../ob1-stage-$N"
```

Then add a row to `staged-prs.md`. If the tests are worth offering upstream, comment on the PR with a link to the fork's test commit.

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
# Also land it on fork main through a fork PR (fork-ci must pass):
gh pr create -R mfelker/OB1 --base main --head "contrib/mfelker/$DESC" --title "[fork] Land contrib/mfelker/$DESC"
gh pr merge <fork-PR-number> -R mfelker/OB1 --merge
```

Record it in `staged-prs.md` with kind `own`. Upstream may squash or edit it before merging, and the reconcile rules above apply to it as well.

## Open items (future `/speckit-specify` features)

- Automation scripts for sync and staging (wrapping the commands above, updating the ledger)
- ~~A fork-specific CI workflow~~ → `fork-ci` (spec 001)
- Triage of the upstream open-PR backlog (135 open PRs as of 2026-11-24)
