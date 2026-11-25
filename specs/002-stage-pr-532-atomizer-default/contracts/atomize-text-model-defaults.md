# Contract: `atomizeText` model selection

Module: `recipes/atomizer/lib/atomize-text.mjs`. Export: `atomizeText(text, opts) → Promise<string[]>`.

Observed by stubbing `globalThis.fetch` (research R2). "Request" means the single `fetch` call the function makes.

| # | Input `opts` | Expected request URL | Expected `body.model` | Req |
|---|--------------|----------------------|-----------------------|-----|
| C1 | `{ provider: "anthropic", anthropicApiKey: "test-key-not-real" }` | `https://api.anthropic.com/v1/messages` | `claude-sonnet-5-5` | FR-002 |
| C2 | C1 plus `anthropicModel: "claude-opus-5-5"` | same | `claude-opus-5-5` | FR-003 |
| C3 | `{ provider: "openrouter", openrouterApiKey: "test-key-not-real" }` | `https://openrouter.ai/api/v1/chat/completions` | `anthropic/claude-sonnet-4.5` | FR-004 |
| C4 | C3 plus `openrouterModel: "some/other-model"` | same | `some/other-model` | FR-003 |

**Invariants for every case**:

- `fetch` is called exactly once.
- Calls to any other URL make the stub throw, so the test fails (FR-005).
- The canned response yields the atoms `["a", "b"]`, which confirms the stub is the only path the function takes.

**Regression check (FR-006)**: against `lib/atomize-text.mjs` at `8bebd77^`, C1 MUST fail, receiving `claude-sonnet-4-5`. C2–C4 pass.
