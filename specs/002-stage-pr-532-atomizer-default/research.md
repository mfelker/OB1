# Research: Stage upstream PR #532 (atomizer Anthropic default model)

Phase 0 decisions. The Technical Context has no open NEEDS CLARIFICATION items.

## R1: Is the PR's premise correct?

- **Decision**: Accept it. `claude-sonnet-4-5` is deprecated and retires on **2026-11-30**, and `claude-sonnet-5-5` is the current Sonnet model ID.
- **Rationale**: Verified on 2026-11-24 against the Claude API skill's model tables. `shared/models.md` lists `claude-sonnet-4-5` as "Deprecated, Nov 30, 2026" and suggests `claude-sonnet-5-5`; the current-models table lists `claude-sonnet-5-5`. This resolves the spec's "not independently re-verified" assumption.
- **Alternatives considered**:
  - `claude-opus-5-5`: rejected. It changes the cost profile, and the PR's scope is a like-for-like Sonnet swap.
  - `claude-sonnet-5`: rejected because it's the previous generation.

## R2: How to observe the requested model without network

- **Decision**: In each test, replace `globalThis.fetch` with a stub that records `(url, JSON.parse(init.body))` and returns a canned success response, then restore the original in `afterEach`.
  - Anthropic response shape: `{ content: [{ type: "text", text: '["a","b"]' }] }`.
  - OpenRouter response shape: `{ choices: [{ message: { content: '["a","b"]' } }] }`.
  - The stub **throws** for any URL other than the two provider endpoints, so an accidental real request fails fast (spec edge case).
- **Rationale**: `atomizeText` uses the global `fetch` directly (`lib/atomize-text.mjs`) and has no injection point. A global swap needs no change to the author's code and no mocking library.
- **Alternatives considered**:
  - `node:test` `mock.method(globalThis, 'fetch')`: works on Node 20+, but the recipe states Node 18+, so plain assignment and restore is the portable choice.
  - A local HTTP server with an overridden base URL: impossible, because the URLs are hard-coded.
  - Refactoring for dependency injection: it would rewrite the author's code.

## R3: Test file name and location

- **Decision**: `recipes/atomizer/atomize-text.test.mjs`, at the folder root.
- **Rationale**: fork-ci's `node-plain` runtime matches the basename against `*.test.mjs` or `test-*.mjs` and runs `node --test <files>`. A root placement sits next to `test-atomize.mjs` and imports `./lib/atomize-text.mjs` directly.
- **Alternatives considered**:
  - `__tests__/atomize-text.test.mjs`: also matched, but it adds a folder for one file.
  - `test-atomize-text.mjs`: confusable with the live script.

## R4: Verifying "with a key, behavior unchanged" (FR-007) without network

- **Decision**:
  - Add a preload module `recipes/atomizer/test-support/fetch-stub.mjs`. It sets `globalThis.fetch` to a stub that returns canned atoms and writes `[fetch-stub] <host> model=<model>` to stderr.
  - The CLI test spawns `process.execPath --import <fetch-stub> test-atomize.mjs [--provider=…]` with a **dummy** key (`test-key-not-real`). It asserts exit 0, `[test] PASS — got 2 atoms` on stdout, and the stub line on stderr.
  - For `--provider=anthropic` the stub line must show `model=claude-sonnet-5-5`, so FR-002 is also covered end to end.
- **Rationale**: This turns "unchanged with a key" into an automated, network-free assertion. Diff review alone would leave it unverified. `--import` exists on Node 18.18+/20+ and runs before the entry module.
- **Constraint**: the helper's basename must match neither `*.test.mjs` nor `test-*.mjs`, otherwise fork-ci would run it as a test. `fetch-stub.mjs` in `test-support/` satisfies that.
- **Alternatives considered**: verifying by diff minimality only (weaker; kept as a secondary review check); a spawn with a dummy key and no stub (would hit the real network and break FR-005).

## R5: Making the CLI skip test hermetic

- **Decision**: Spawn the child with an env built from `process.env` minus `NODE_TEST_CONTEXT`, with `OPENROUTER_API_KEY=""` and `ANTHROPIC_API_KEY=""` set explicitly. Use `process.execPath` and a script path derived from `import.meta.url`.
- **Rationale**:
  - `loadEnv` copies `process.env` first and only fills keys from `.env.local` when `!(key in env)`. An empty string is *in* env, so a real key in the owner's `.env.local` can't leak in.
  - The script's `!atomizeOpts.<key>` check treats `""` as missing, so the skip path runs.
  - Stripping `NODE_TEST_CONTEXT` avoids the nested-runner leak found in spec 001.
- **Alternatives considered**:
  - Skipping the test when `.env.local` exists: it would leave the test unrun on the owner's machine.
  - Copying the script to a temp dir: it has relative imports, so that's heavy.

## R6: Skip semantics in `test-atomize.mjs`

- **Decision**:
  - In the two existing missing-key branches (anthropic, openrouter), replace `console.error(...); process.exit(1)` with `console.log("skipped: no API key for <provider> (set <VAR> in .env.local or process env)"); process.exit(0)`.
  - Leave everything else unchanged, including the `claude-cli` path, which needs no key.
- **Rationale**: This is the minimal diff that meets FR-007. It keeps the hint about which variable to set, prints on stdout as the contract requires, and exits 0, which `node --test` reports as a passing file.
- **Alternatives considered**:
  - Skipping only when `NODE_TEST_CONTEXT` is set, keeping exit 1 for manual runs: rejected because it relies on an undocumented runner-internal variable. fork-ci's run-folder also strips it at the outer level, which makes the behavior hard to reason about.
  - Calling `node:test`'s `test.skip`: rejected because the script isn't a `node:test` file, and importing the runner would change its manual output.

## R7: FR-006 red evidence against the pre-PR code

- **Decision**:
  1. In the worktree, run `git checkout 8bebd77^ -- recipes/atomizer/lib/atomize-text.mjs`.
  2. Run `node --test atomize-text.test.mjs`. Expected: the default-model assertions fail (`claude-sonnet-4-5` ≠ `claude-sonnet-5-5`) and the override and OpenRouter tests pass.
  3. Run `git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs` and confirm `git status` is clean.
  4. Paste the failing summary into the fork PR description (Quality Gate 1: evidence in the PR).
- **Rationale**: It proves the tests detect the regression without committing anything to the branch.
- **Alternatives considered**: a temporary revert commit (it pollutes history).

## R8: Landing and reconciliation

- **Decision**: Follow the runbook's steps 4–6 (`.fork/README.md`):
  - Preview with `run-folder` (strict, origin fork), expecting `pass`.
  - Push `stage/pr-532-atomizer-default` to `origin`.
  - Open the fork PR titled `[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5 (staged #532)`.
  - Merge with `gh pr merge --merge` once `fork-ci-verdict` is green.
  - Add the ledger row and comment upstream with the test commit link.
- **Rationale**: Constitution Principle VII and FR-008 to FR-011.
- **Alternatives considered**: a local merge. It is blocked by policy: fork-ci would report `lane-bypass`.

## Baseline (recorded 2026-11-24)

`run-folder --path recipes/atomizer --mode strict --origin fork` on the unmodified PR head gives:

- Outcome: `fail`, `tests failed (exit 1)`.
- Runtime: one `node-plain` runtime, with `test-atomize.mjs` as the only test file.
- Error: `--provider=openrouter requires OPENROUTER_API_KEY in .env.local or process env`.

No provider key was present in the shell or in any `.env.local`.
