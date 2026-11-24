# Contract: Fork CI workflow and required check

**File**: `.github/workflows/fork-ci.yml` (fork-only; the `fork-` prefix keeps it enabled through the Option C post-sync sweep)

## Triggers

| Event | Filter | Purpose |
|-------|--------|---------|
| `pull_request` | `branches: [main]`, **no path filters** (R9) | Blocking check for PRs into fork `main` |
| `push` | `branches: [main]` | After-the-fact verdict and lane-bypass detection (FR-012) |
| `workflow_dispatch` | — | Manual re-run |

Never `pull_request_target` (R5).

## Global settings

- `permissions: { contents: read }`
- `concurrency: fork-ci-${{ github.ref }}`, `cancel-in-progress: true` for PRs
- Every `actions/checkout`: `fetch-depth: 0`, `persist-credentials: false`, default ref (the PR merge ref, R4)
- Upstream fetched without credentials: `git fetch --no-tags https://github.com/NateBJones-Projects/OB1.git main:refs/remotes/upstream/main`

## Jobs

| Job id | Needs | Runs when | Responsibility |
|--------|-------|-----------|----------------|
| `detect` | — | always | Run `detect.mjs`; outputs `has_folders`, `matrix`, `detect_json` |
| `self-test` | — | `.fork/ci/**` or `fork-ci.yml` changed (computed inside the job, not by a path filter) | `node --test .fork/ci/test/` and `actionlint` |
| `test` | `detect` | `has_folders == 'true'` | Matrix over `detect.matrix`, `fail-fast: false`, `timeout-minutes: 20`; Postgres service when `needsPostgres`; runs `run-folder.mjs`; uploads `result-*.json` |
| `fork-ci-verdict` | `detect`, `test`, `self-test` | `if: always()` | Downloads results, runs `verdict.mjs`, writes the job summary; this is **the required check** |

`fork-ci-verdict` also fails when `self-test` ran and did not succeed.

## Required check

- **Name**: `fork-ci-verdict`
- **Enforced by**: repository ruleset on `refs/heads/main`, rule "Require status checks to pass" → `fork-ci-verdict`, bypass actor = Repository admin (`always`) (R11). Applied by the owner (see quickstart), not by a file.

## Report (job summary)

```text
## Fork CI verdict: ✅ success | ❌ failure

| Folder | Mode | Origin | Outcome | Runtimes | Reason |
|--------|------|--------|---------|----------|--------|
| recipes/x | strict | fork | ❌ no-tests | deno | no tests for deno code |
| server | advisory | upstream | ⚠️ no-tests | node-script ✅, deno ⚠️ | no tests for deno code (from upstream) |

Removed: recipes/old · Skipped paths: 3 fork-only, 1 other
Lane bypasses: <sha> merged stage/pr-12-x without a PR
```

Every non-pass row states its reason category (test failure / no tests / setup / timeout / sql-unverified / lane-bypass) so that the failure can be diagnosed from the report alone (SC-007).
