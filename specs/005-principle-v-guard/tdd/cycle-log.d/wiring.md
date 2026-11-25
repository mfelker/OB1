## Cycle: U28 `.claude/settings.json` registers the PreToolUse guard

- test: `.fork/ci/test/principle-v-docs.test.mjs::U28 .claude/settings.json registers the PreToolUse guard` (new)
- red: `node --test --test-name-pattern="^U28 " .fork/ci/test/principle-v-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .claude/settings.json does not exist` (1 failed)
- green: `.claude/settings.json` created with the single PreToolUse entry. Suite `node --test .fork/ci/test/` -> 153 passed, 0 failed
- refactor: none needed
- commit: (this commit)
