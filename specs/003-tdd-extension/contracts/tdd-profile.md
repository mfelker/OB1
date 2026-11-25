# Contract: this fork's `.specify/memory/tdd-profile.md`

The shape follows the extension's "Profile format" (`templates/tdd-stack-profile.md`). These are the fork's values; every command listed must appear in `verified:` only after it has been run (FR-009).

```yaml
detected_at: <git rev-parse --short HEAD at write time>
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
    test_glob: "**/*.{test,spec}.{ts,tsx,js,mjs,cjs} | **/*_test.{ts,js,mjs} | **/test-*.mjs | **/test_*.py | **/*_test.py | tests/verify.sql"  # = fork-ci TEST_PATTERNS
    exemplar:
      unit: .fork/ci/test/runtimes.test.mjs
    helpers:
      - .fork/ci/test/fixtures.mjs
      - .fork/ci/test/helpers/
verified: [single, file, suite]
suite_baseline: green
suite_seconds: <observed>  # per target; the body names the measured target
```

**The body MUST state these:**

1. **Target resolution**: commands act on the active feature's plan Worktree and Contribution folder (contracts/tdd-adapter-cli.md). Switch the feature with `.specify/feature.json`, never by editing the profile.
2. **Conventions**:
   - Imitate the target folder's existing tests first.
   - Otherwise use the per-runtime exemplars: node-plain `recipes/atomizer/atomize-text.test.mjs` (fetch stub, `runScript` helper), Python `integrations/hermes-agent-memory/plugin/tests/test_ob1_provider.py`, fork tooling `.fork/ci/test/`.
3. **Constraints**:
   - There's no repo-wide runner.
   - Credential variables are blanked by the adapter for every run (FR-016), so live scripts such as `recipes/atomizer/test-atomize.mjs` take their skip path.
   - Every `suite` run installs dependencies (npm, pip): it's networked and slow. Changed lockfiles are restored.
   - Shell quoting: the caller must escape `"`, `$` and backticks in `{name}`.
   - `suite_seconds` varies per target; the body records which target was measured.
   - Deno and Python must be installed locally for their folders.
   - There's no mutation tool, so the audit uses deliberate mutants.
   - Never add dependencies to upstream folders.
4. **Null capabilities**, each with its consequence (the extension requires this): coverage, mutation, acceptance, property, approval, contract.
5. **Lane note**: staged PRs use the base-red evidence rule (contracts/staged-evidence-override.md).
