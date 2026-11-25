# Contract: `atomizeText` model selection

Module: `recipes/atomizer/lib/atomize-text.mjs`. Export: `atomizeText(text, opts) → Promise<string[]>`.

Observed by stubbing `globalThis.fetch` (research R2). "Request" means the single `fetch` call the function makes.

| # | Input `opts` | Expected request URL | Expected `body.model` | Req |
|---|--------------|----------------------|-----------------------|-----|
| C1 | `{ provider: "anthropic", anthropicApiKey: "test-key-not-real" }` | `https://api.anthropic.com/v1/messages` | `claude-sonnet-5-5` | FR-002 |
| C2 | C1 plus `anthropicModel: "claude-opus-5-5"` | same | `claude-opus-5-5` | FR-003 |
| C3 | `{ provider: "openrouter", openrouterApiKey: "test-key-not-real" }` | `https://openrouter.ai/api/v1/chat/completions` | `anthropic/claude-sonnet-4.5` | FR-004 |
| C4 | C3 plus `openrouterModel: "some/other-model"` | same | `some/other-model` | FR-003 |
| C5 | `{ provider: "anthropic" }` with no key; `{ provider: "openrouter" }` with no key | none (rejects, 0 fetch calls) | — | FR-005 |
| C6 | `{ provider: "codex" }` | none (rejects with "unknown provider", 0 fetch calls) | — | FR-005 |

Test case names start with their ID and name the provider, for example `C1 anthropic default model`.

**Invariants for C1–C4**:

- `fetch` is called exactly once.
- Calls to any other URL make the stub throw, so the test fails (FR-005).
- The canned response yields the atoms `["a", "b"]`, which confirms the stub is the only path the function takes.

**Regression check (FR-006)**: run against `lib/atomize-text.mjs` at the PR base (`BASE` = `git merge-base HEAD upstream/main`, which is `238df6c` today). There C1 MUST fail, receiving `claude-sonnet-4-5`, and C2–C6 pass.
