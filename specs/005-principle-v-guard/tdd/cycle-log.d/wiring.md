## Cycle: U28 `.claude/settings.json` registers the PreToolUse guard

- test: `.fork/ci/test/principle-v-docs.test.mjs::U28 .claude/settings.json registers the PreToolUse guard` (new)
- red: `node --test --test-name-pattern="^U28 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .claude/settings.json does not exist` (1 failed)
- green: `.claude/settings.json` created with the single PreToolUse entry. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U29 the pre-commit hook is executable sh and execs the staged guard

- test: `.fork/ci/test/principle-v-docs.test.mjs::U29 .fork/githooks/pre-commit is an executable sh script that execs the staged guard` (new)
- red: `node --test --test-name-pattern="^U29 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/githooks/pre-commit does not exist` (1 failed)
- green: `.fork/githooks/pre-commit` created (`#!/bin/sh`, `exec node ... --staged`, chmod +x). Suite `node --test .fork/ci/test/` -> 154 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U30 self-test trigger covers the guard wiring

- test: `.fork/ci/test/self-test-needed.test.mjs::U30 true for .fork/githooks/ paths and .claude/settings.json, not look-alikes` (new)
- red: `node --test --test-name-pattern="^U30 " .fork/ci/test/self-test-needed.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/githooks/pre-commit` / `false !== true` (1 failed)
- green: `.fork/ci/lib/self-test-needed.mjs` added the `.fork/githooks/` prefix and `.claude/settings.json` exact path. Suite `node --test .fork/ci/test/` -> 155 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: A10 runbook names .fork/domain-knowledge/ as the grill knowledge root

- test: `.fork/ci/test/principle-v-docs.test.mjs::A10 .fork/README.md names .fork/domain-knowledge/ as the grill knowledge root with its layout` (new)
- red: `node --test --test-name-pattern="^A10 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: a "## Domain knowledge" section is required in .fork/README.md` (1 failed)
- green: `.fork/README.md` new "Domain knowledge" section (root, `CONTEXT.md`, topic documents, `adr/`). Suite `node --test .fork/ci/test/` -> 156 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: A11 runbook documents both guards, the merge exception, --no-verify and the enable command

- test: `.fork/ci/test/principle-v-docs.test.mjs::A11 .fork/README.md has a Principle V guard section covering both guards and how to enable them` (new)
- red: `node --test --test-name-pattern="^A11 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: a "## Principle V guard" section is required in .fork/README.md` (1 failed)
- green: `.fork/README.md` new "Principle V guard" section (both guards, refused/allowed, merge exception, `--no-verify`, `git config core.hooksPath .fork/githooks`). Suite `node --test .fork/ci/test/` -> 157 passed, 0 failed
- refactor: none needed
- commit: (this commit)
