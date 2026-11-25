# Data Model: Stage upstream PR #532

No persisted data or schema changes. This feature has two kinds of entity: the request options that decide which model is sent, and the ledger row.

## AtomizeOptions (input to `atomizeText`, `recipes/atomizer/lib/atomize-text.mjs`)

| Field | Type | Default | Rule |
|-------|------|---------|------|
| `provider` | `"openrouter" \| "anthropic" \| "claude-cli"` | `"openrouter"` | Unknown values throw (contract C6) |
| `anthropicModel` | string | **`"claude-sonnet-5-5"`** (was `"claude-sonnet-4-5"`) | Used only when `provider = "anthropic"`. An explicit value is sent verbatim (FR-002, FR-003) |
| `openrouterModel` | string | `"anthropic/claude-sonnet-4.5"` | **Unchanged** (FR-004). Used only when `provider = "openrouter"` |
| `anthropicApiKey` / `openrouterApiKey` | string | — | Required for the matching provider. Without one, the function throws before any `fetch` (contract C5, both keys) |

**Derived value**: `RequestedModel` is the `model` field of the JSON body POSTed to the provider endpoint. That's the value the tests assert on.

## StagedPrLedgerRow (`.fork/staged-prs.md`)

| Column | Value for this feature |
|--------|------------------------|
| PR | `#532` |
| Kind | `staged` |
| Title | `[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5` |
| Spec | `specs/002-stage-pr-532-atomizer-default/` |
| Head SHA | `8bebd778241a` (or a later head if the author force-pushes; edge case) |
| Fork test commit(s) | the SHAs of commits 2 and 3 in the plan's commit sequence |
| Merged into fork | the merge date (YYYY-MM-DD) |
| Status | `staged`, then `upstreamed` or `upstreamed (reconciled)`, or else `fork-only` or `reverted` |
| Notes | MUST record the fork-only divergence: "fork keeps the `test-atomize.mjs` skip (plan Complexity Tracking) until upstream adopts it". After T028, it adds "tests and test-atomize skip offered upstream". The divergence survives an `upstreamed` reconciliation unless upstream takes the skip. |

There is exactly one row for #532 (SC-005).
