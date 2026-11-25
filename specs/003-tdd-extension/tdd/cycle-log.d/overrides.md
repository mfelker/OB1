## Cycle: U35 overrides pin their base and add only the fork section

- test: `.fork/ci/test/tdd-overrides.test.mjs::U35 tdd-test-quality-rubric.md override pins its base and adds only the fork section` and `::U35 tdd-loop-playbook.md override pins its base and adds only the fork section` (new)
- red: `node --test .fork/ci/test/tdd-overrides.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: override file missing: /Users/mfelker/Projects/ob1/.worktrees/fork-tdd-overrides/.specify/templates/overrides/tdd-test-quality-rubric.md` (same for `tdd-loop-playbook.md`)
- green: added `.specify/templates/overrides/tdd-test-quality-rubric.md` (rules S1–S4 after the test-first evidence classes table) and `.specify/templates/overrides/tdd-loop-playbook.md` (the 5-step base-red procedure after the deliberate mutant paragraph in Step 3), each a byte copy of the installed spec-kit-tdd 2.0.1 base plus a `fork-override` header with `base_sha256` and one `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->` section; plus `.specify/templates/overrides/.markdownlint-cli2.jsonc` (lint exemption). Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed. Deviation during green: the first green run failed only on the test's own `applies only when` regex, because the fork-section prose wraps across lines; the test's phrase regexes were loosened to `\s+` between words (no assertion weakened). A deliberate mutant (one byte appended to the playbook override) then failed with `override diverges from base outside the fork section`, and was restored.
- commit: (this commit)
