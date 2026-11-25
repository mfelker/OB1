---
detected_at: d3ad0cd # short SHA the profile was detected against
ecosystems: [fork-adapter]
default: fork-adapter
stacks:
  fork-adapter:
    cwd: .
    runner: "fork-ci runtime detection via .fork/ci/bin/tdd.mjs (node-plain | deno | node-script | python | sql)"
    single: 'node .fork/ci/bin/tdd.mjs single {file} "{name}"'
    file: node .fork/ci/bin/tdd.mjs file {file}
    suite: node .fork/ci/bin/tdd.mjs suite
    watch: null
    coverage: null
    mutation: null
    acceptance: null
    property: null
    approval: null
    contract: null
    test_glob: "**/*.{test,spec}.{ts,tsx,js,mjs,cjs} | **/*_test.{ts,js,mjs} | **/test-*.mjs | **/test_*.py | **/*_test.py | tests/verify.sql" # = fork-ci TEST_PATTERNS
    exemplar:
      unit: .fork/ci/test/runtimes.test.mjs
    helpers:
      - .fork/ci/test/fixtures.mjs
      - .fork/ci/test/helpers/
verified: [single, file, suite]
suite_baseline: green
suite_seconds: 5 # target: specs/003-tdd-extension (tree /Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension, folder .fork/ci)
---

# TDD Stack Profile

This repository has no repo-wide test runner. Every command goes through the fork's adapter, `.fork/ci/bin/tdd.mjs`
(contracts: `specs/003-tdd-extension/contracts/tdd-adapter-cli.md`), which picks the runner per file with fork-ci's
own runtime detection.

## Target resolution

- Every command acts on the **active feature**, not on the directory it is run from. The adapter reads the feature
  from `SPECIFY_FEATURE_DIRECTORY`, else `.specify/feature.json`, then takes the tree and folder from that feature's
  `plan.md`:
  - `**Lane**`: `fork feature`, `upstream-bound …` or `staged upstream PR #N`.
  - `**Worktree**`: an absolute backticked path to a git work tree, or `none…` for the repo-root checkout. A fork
    feature may omit the line; staged and upstream-bound features may not.
  - `**Contribution folder**`: the first backticked repo-relative path. `N/A…` or a placeholder is an error.
- To work on another feature, switch `.specify/feature.json` and confirm with `node .fork/ci/bin/tdd.mjs where`.
  Never edit this profile to retarget it.
- Every summary line names the target: `[tdd] <op> <kind> feature=<dir> folder=<folder>: tests=… pass=… fail=… → …`.
  Check `feature=` before trusting a result.
- Exit codes: 0 pass · 1 failed (or counts unreadable) · 2 target, usage or Node-version error · **3 zero tests
  matched** · 4 the operation isn't supported for that runtime (use `file`).
- `{file}` may be absolute or relative. A relative path is tried against the folder, then the tree, then the repo
  root; the result must be inside the tree.

## Conventions to match

- Imitate the target folder's own existing tests first: their file naming, assertion style and helpers.
- Otherwise use the per-runtime exemplars:
  - node-plain (`node:test` + `node:assert/strict`): `recipes/atomizer/atomize-text.test.mjs`. It replaces
    `globalThis.fetch` per test instead of using the network, and its `runScript()` helper spawns the live sanity
    script `test-atomize.mjs` with empty keys (the skip path) or with a dummy key plus the
    `test-support/fetch-stub.mjs` preload.
  - Python (pytest): `integrations/hermes-agent-memory/plugin/tests/test_ob1_provider.py`. It mocks the network at
    `urllib.request.urlopen` and stubs the host-application modules in `sys.modules`, so it runs offline.
  - Fork tooling (`.fork/ci`): `.fork/ci/test/runtimes.test.mjs` is the unit exemplar (`node:test`, one `test()` per
    behavior, fixtures placed with `setupFolder()`).
- Fork-tooling helpers to reuse rather than hand-roll:
  - `.fork/ci/test/fixtures.mjs`: in-memory fixture folders (`fixtures`, `fixtureFiles()`, `materialize()`), written
    to temp dirs at test time so their sample test files are never discovered by `node --test`, Deno or the gate.
  - `.fork/ci/test/helpers/folder.mjs`: `setupFolder(name, path)` places a fixture at `<tmp root>/<category>/<name>`.
  - `.fork/ci/test/helpers/git-fixture.mjs`: temp git repos (`makeRepo`, `writeFiles`, `commit`, `branch`,
    `checkout`, `merge`, `addRemoteRef`) with a fixed identity.
- **Naming `{name}` for node tests**: the adapter anchors and escapes it (`--test-name-pattern=^<name>$`), so pass the
  exact test name. A test inside `describe` matches by its own name or by "<suite name> <test name>"; a suite's name
  selects every test in it.

## Notes and constraints

- **Node ≥ 26 is required.** The adapter refuses older versions (exit 2), because the zero-match guard relies on
  `--test-isolation=none` (verified on Node 26.13).
- **Shell quoting**: the agent's shell expands `"{name}"` before the adapter sees it. A name containing `"`, `$` or a
  backtick must be escaped by the caller.
- **Credentials are blanked**: every child the adapter starts runs with `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` and every
  `*_API_KEY`, `*_TOKEN`, `*_SECRET`, `*_SERVICE_ROLE_KEY` set to `""`, and without `NODE_TEST_CONTEXT`. Live scripts
  such as `recipes/atomizer/test-atomize.mjs` therefore take their skip path. A test can't opt out.
- **`suite` is networked and slow** for some folders: it delegates to fork-ci's `run-folder.mjs`, which runs
  `npm install` for node-script runtimes and builds a fresh pytest venv for Python. Tracked lockfiles
  (`package-lock.json`, `deno.lock`) that were clean before the run are restored afterwards (`[tdd] restored …`).
- **An empty baseline is green**: `suite` exits 0 for `no-tests`, `exempt` (docs-only) and a folder that doesn't
  exist yet, and reports `sql unverified (advisory)` for SQL without `tests/verify.sql`.
- **`suite_seconds` is per target.** The recorded 5 s is spec 003's target (`.fork/ci` in the integration worktree:
  node-plain pass, sql unverified). Other folders differ widely, especially those that install dependencies.
- **Per-runtime notes**:
  - Deno and Python must be installed locally for their folders. Python `single`/`file` use a cached venv at
    `<os tmp>/fork-tdd-venv-<sha1(tree + root)>`, rebuilt when `requirements.txt` changes; the first run installs
    pytest.
  - Deno `single` uses `--filter <name>`, a substring match, so it can select more than one test.
  - `single` is unsupported (exit 4) for plain `test-*.mjs` scripts, SQL verify scripts and node-script runners other
    than vitest/jest. Use `file`.
  - SQL `file` runs `tests/verify.sql` with `psql` (PG* env) and doesn't apply fork-ci's bootstrap; `suite` does.
- There is no mutation tool, so the audit uses deliberate mutants.
- Never add dependencies to upstream folders.

## Null capabilities

Each is `null` because no tool for it exists in this repository, and none may be added by this profile (Hard Rule 2).

- **coverage**: no coverage tool is configured for any runtime. The audit can't measure line coverage; it relies on
  the cycle log's red evidence. Node's built-in `--experimental-test-coverage` is the default if the owner wants it.
- **mutation**: no mutation tool. The audit applies deliberate, hand-made mutants (as the acceptance cycles of spec
  003 did) instead of a tool run. Stryker is the JavaScript default; mutmut the Python default.
- **acceptance**: there is no separate acceptance runner. Acceptance tests are ordinary tests in the folder's own
  runtime (for example a `describe('acceptance')` block driving a CLI), run through `single`/`file`.
- **property**: no property-based library. A behavior can't be recorded as kind `property`. fast-check (JS) and
  Hypothesis (Python) are the defaults.
- **approval**: no snapshot or approval tool. A behavior can't be recorded as kind `approval`.
- **contract**: no contract-testing tool. A behavior can't be recorded as kind `contract`; contracts are checked by
  ordinary example tests.
- **watch**: no watch command is recorded; every cycle runs its command explicitly.

## Lane note

Staged upstream PRs use the base-red evidence rule (`specs/003-tdd-extension/contracts/staged-evidence-override.md`,
applied through the overrides in `.specify/templates/overrides/`). The fork lane uses the extension's base rules.

## Verification record

Run on 2026-11-25 from this checkout (`/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-adapter`, HEAD `d3ad0cd`),
Node 26.13.0. Target: `where` resolved feature `specs/003-tdd-extension`, lane `fork`, tree
`/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension`, folder `.fork/ci`.

| capability | command as run | result |
| --- | --- | --- |
| single | `node .fork/ci/bin/tdd.mjs single .fork/ci/test/runtimes.test.mjs "deno runtime: deno.json root, code vs tests, sandboxed command without --allow-net"` | exactly that test ran; `tests=1 pass=1 fail=0 → pass`, exit 0 |
| single, zero-match | `node .fork/ci/bin/tdd.mjs single .fork/ci/test/runtimes.test.mjs "no test is named this"` | `tests=0 … → no tests matched`, exit **3** |
| file | `node .fork/ci/bin/tdd.mjs file .fork/ci/test/runtimes.test.mjs` | `tests=9 pass=9 fail=0 → pass`, exit 0 |
| suite | `node .fork/ci/bin/tdd.mjs suite` | node-plain pass, sql unverified (advisory), `→ sql-unverified`, exit 0, 4.97 s wall |
