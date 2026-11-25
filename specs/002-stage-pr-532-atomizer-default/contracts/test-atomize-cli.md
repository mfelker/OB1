# Contract: `test-atomize.mjs` CLI (live sanity script)

Script: `recipes/atomizer/test-atomize.mjs`.

## Invocation

```
node [--import ./test-support/fetch-stub.mjs] test-atomize.mjs [--provider=openrouter|anthropic|claude-cli]
```

With no flag, the provider is `openrouter`. A key is "missing" when the variable is unset **or** empty, in both `process.env` and `.env.local`. `process.env` wins, including when its value is empty.

## Behaviour

| # | Provider | Key state | stdout contains | Exit | Network | Req |
|---|----------|-----------|-----------------|------|---------|-----|
| K1 | openrouter (default) | `OPENROUTER_API_KEY` missing | `skipped: no API key for openrouter` | **0** | none | FR-007 |
| K2 | anthropic | `ANTHROPIC_API_KEY` missing | `skipped: no API key for anthropic` | **0** | none | FR-007 |
| K3 | openrouter | dummy key + fetch-stub preload | `[test] PASS — got 2 atoms` | 0 | stubbed (stderr: `[fetch-stub] openrouter.ai model=anthropic/claude-sonnet-4.5`) | FR-007 (unchanged with key) |
| K4 | anthropic | dummy key + fetch-stub preload | `[test] PASS — got 2 atoms` | 0 | stubbed (stderr: `[fetch-stub] api.anthropic.com model=claude-sonnet-5-5`) | FR-007, FR-002 |
| K5 | any | a real key, no preload | `[test] PASS …` or `[test] FAIL …` | 0 or 1 | **live**: manual use only, never in tests | unchanged |

- The skip line is printed on **stdout** as one line. It may continue with a hint, for example `(set OPENROUTER_API_KEY in .env.local or process env)`.
- K1/K2 MUST NOT print `[test] provider:` (nothing past the key check runs).
- `claude-cli` needs no key. It is out of scope for the skip and isn't exercised by tests: it spawns the `claude` binary and is blocked inside Claude Code sessions.

## fetch-stub preload (`test-support/fetch-stub.mjs`)

- Replaces `globalThis.fetch`. For `api.anthropic.com` / `openrouter.ai` it returns the matching canned shape (research R2) with atoms `["a","b"]`. It writes `[fetch-stub] <host> model=<body.model>` to stderr.
- Any other URL throws.
- Its basename matches neither `*.test.mjs` nor `test-*.mjs`, so fork-ci never runs it as a test.
