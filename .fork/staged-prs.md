# Staged Upstream PRs

Ledger of upstream pull requests merged into fork `main` ahead of upstream (constitution Principle VII).
Process: [README.md](README.md#stage-an-upstream-pr). Each staged PR is its own spec-kit feature; **Spec** is its `specs/###-stage-pr-<N>-<desc>/` folder.

**Kind**: `staged` (someone else's upstream PR) · `own` (the fork's own `contrib/` branch, also submitted upstream)

**Status values**: `staged` · `upstreamed` · `upstreamed (reconciled)` · `fork-only` · `reverted`

| PR | Kind | Title | Spec | Head SHA | Fork test commit(s) | Merged into fork | Status | Notes |
|----|------|-------|------|----------|---------------------|------------------|--------|-------|
| [#532](https://github.com/NateBJones-Projects/OB1/pull/532) | staged | [recipes] atomizer: move the Anthropic default off claude-sonnet-4-5 | [specs/002-stage-pr-532-atomizer-default/](../specs/002-stage-pr-532-atomizer-default/) | `8bebd778241a` | `cfbfe76` (tests), `58b0567` (test-atomize skip) | 2026-11-25 via [fork #15](https://github.com/mfelker/OB1/pull/15) (`f029a5f`) | staged | Fork keeps the `test-atomize.mjs` skip (plan Complexity Tracking) until upstream adopts it; tests and test-atomize skip offered upstream ([comment](https://github.com/NateBJones-Projects/OB1/pull/532#issuecomment-7153473651)) |
