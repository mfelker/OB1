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
    test_glob: "**/*.test.mjs | **/test-*.mjs | **/*_test.ts | **/test_*.py | tests/verify.sql (fork-ci TEST_PATTERNS)"
    exemplar:
      unit: .fork/ci/test/runtimes.test.mjs
    helpers:
      - .fork/ci/test/fixtures.mjs
      - .fork/ci/test/helpers/
verified: [single, file, suite]
suite_baseline: green
suite_seconds: <observed for the target folder>
```

**The body MUST state these:**

1. **Target resolution**: commands act on the active feature's plan Worktree and Contribution folder (contracts/tdd-adapter-cli.md). Switch the feature with `.specify/feature.json`, never by editing the profile.
2. **Conventions**:
   - Imitate the target folder's existing tests first.
   - Otherwise use the per-runtime exemplars: node-plain `recipes/atomizer/atomize-text.test.mjs` (fetch stub, `runScript` helper), Python `integrations/hermes-agent-memory/tests/`, fork tooling `.fork/ci/test/`.
3. **Constraints**:
   - There's no repo-wide runner.
   - Live-credential scripts (for example `recipes/atomizer/test-atomize.mjs`) are run only with empty keys.
   - Deno and Python must be installed locally for their folders.
   - There's no mutation tool, so the audit uses deliberate mutants.
   - Never add dependencies to upstream folders.
4. **Null capabilities**, each with its consequence (the extension requires this): coverage, mutation, acceptance, property, approval, contract.
5. **Lane note**: staged PRs use the base-red evidence rule (contracts/staged-evidence-override.md).
