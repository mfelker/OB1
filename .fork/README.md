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
| Upstream-bound feature | `contrib/mfelker/<desc>` | `upstream/main` | Upstream PR **and** fork `main` | Red-green-refactor; tests inside the contribution folder |
| Staged upstream PR | `stage/pr-<N>-<desc>` | `upstream` `refs/pull/<N>/head` | Fork `main` (`--no-ff`) | Tests written and green before merge |

## One-time setup (per clone or worktree)

```bash
git config rerere.enabled true
git config rerere.autoupdate true
git config merge.conflictstyle zdiff3
```

Upstream GitHub workflows stay disabled on the fork. They would fail fork-internal PRs on the scope check:

```bash
for wf in $(gh workflow list -R mfelker/OB1 --all --json id -q '.[].id'); do
  gh workflow disable "$wf" -R mfelker/OB1
done
```

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
# 3. Run tests until green
cd -
git switch main
git merge --no-ff "stage/pr-$N-$DESC" -m "[fork] Stage upstream PR #$N ($DESC)"
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
git switch main && git merge --no-ff "contrib/mfelker/$DESC"
```

## Open items (future `/speckit-specify` features)

- Automation scripts for sync and staging (wrapping the commands above, updating the ledger)
- A fork-specific CI workflow (fork-only file name) that runs tests and gate checks on fork PRs
- Triage of the upstream open-PR backlog (135 open PRs as of 2026-11-24)
