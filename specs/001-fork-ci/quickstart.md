# Quickstart: Validating Fork CI

Validation scenarios that prove the feature works end to end. The contracts are in [contracts/](contracts/), the data shapes in [data-model.md](data-model.md).

## Prerequisites

- Node 26, Deno 2.9.x, Python 3.13 (+ `pip`) locally; `gh` authenticated as the fork owner
- Branch `fork/fork-ci` checked out in `/Users/mfelker/Projects/ob1`
- Upstream remote fetched: `git fetch upstream`

## 1. Unit tests (local, every change)

```bash
node --test .fork/ci/test/
```

**Expected**: all tests pass, covering paths, changes, runtimes, origin, verdict, report, and bypass, including the fixture repos for the sync-via-PR and newer-upstream `contrib/` cases (R6).

## 2. Detect against real history (local)

```bash
node .fork/ci/bin/detect.mjs --event push --before 238df6c --after HEAD \
  --upstream-ref refs/remotes/upstream/main
```

**Expected**: `has_folders: false`. The bootstrap commits and this feature touch only fork-only paths, so they're skipped (US3, SC-004).

## 3. Run one folder locally

```bash
node .fork/ci/bin/run-folder.mjs --path recipes/vercel-neon-telegram --mode strict --origin fork --out /tmp/r.json
node .fork/ci/bin/run-folder.mjs --path server --mode strict --origin fork --out /tmp/s.json
```

**Expected**:

- `vercel-neon-telegram` → `pass` (Vitest).
- `server` → `no-tests` with reason "no tests for deno code". Its `node-script` runtime passes (R7).

## 4. GitHub behavior spike (before the ruleset touches `main`)

Owner-approved repo-settings change. Use a throwaway branch pattern only.

1. Create a ruleset targeting `refs/heads/spike/fork-ci-*` that requires `fork-ci-verdict`, with Repository admin bypass `always`.
2. Push `spike/fork-ci-base` from `fork/fork-ci`. Open PRs into it:
   - **a** a branch cut from `upstream/main` touching an untested folder (R4: the workflow runs and finds `.fork/ci/`)
   - **b** a red test (verdict ❌; merge button disabled; bypass checkbox shown)
   - **c** fork-only edits (verdict ✅ in under 1 minute; empty matrix)
3. Direct-push a commit to `spike/fork-ci-base`. **Expected**: the push succeeds and `remote: Bypassed rule violations` is printed (R11).
4. Delete the spike ruleset and branches.

**Expected**: every R4, R9 and R11 assumption holds. If one doesn't, stop and amend research before step 5.

## 5. Enable enforcement on `main` (owner step)

```bash
gh api -X POST repos/mfelker/OB1/rulesets --input - <<'JSON'
{
  "name": "fork-ci required",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [ { "actor_type": "RepositoryRole", "actor_id": 5, "bypass_mode": "always" } ],
  "rules": [ { "type": "required_status_checks",
               "parameters": { "strict_required_status_checks_policy": false,
                               "required_status_checks": [ { "context": "fork-ci-verdict" } ] } } ]
}
JSON
```

(`actor_id: 5` is the built-in Repository admin role; confirm in the spike.)

## 6. End-to-end on fork `main`

| Scenario | Action | Expected verdict |
|----------|--------|------------------|
| Staged PR, no tests | PR `stage/pr-<N>-x` → `main` touching code | ❌ `no-tests` (strict), merge blocked |
| Staged PR, tests added | add tests in the folder, push | ✅ |
| Upstream sync | PR `sync/upstream-<date>` → `main` | ✅ with ⚠️ advisories "(from upstream)" (SC-008) |
| Fork-only edit | PR touching only `specs/` | ✅ in under 1 minute, 0 folders |
| Local stage merge | `git merge --no-ff stage/...` + push | push run ❌ `lane-bypass` |
| SQL without verify script | change `schemas/x/schema.sql` | ✅ with ⚠️ `sql-unverified` |
| SQL with `tests/verify.sql` | add a failing assertion | ❌ `fail` (Postgres job) |

<!-- spike (c) -->

<!-- val forkonly -->
