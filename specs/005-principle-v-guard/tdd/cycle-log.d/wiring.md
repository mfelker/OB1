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
