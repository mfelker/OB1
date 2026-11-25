# Cycle log fragment: stream C (advisory)

Appended to `tdd/cycle-log.md` by the integrator in merge order (research R14).

## Cycle: U31 tddStatus returns null for an empty headRef

- test: `.fork/ci/test/tdd-status.test.mjs::U31 empty headRef (push event) gives null` (new)
- red: `node --test --test-name-pattern="U31" .fork/ci/test/tdd-status.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined, expected: null,` (1 failed; against an empty exported stub)
- green: `.fork/ci/lib/tdd-status.mjs:10` returns `null` when `headRef` is empty. Suite `node --test .fork/ci/test/` -> 102 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U30 tddStatus reports linked:false when no spec names the branch

- test: `.fork/ci/test/tdd-status.test.mjs::U30 no spec names the branch gives linked:false with no features` (new)
- red: `node --test --test-name-pattern="U30" .fork/ci/test/tdd-status.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` / `actual: undefined,` (1 failed)
- green: `.fork/ci/lib/tdd-status.mjs:11-12` returns `{ headRef, features: [], linked: features.length > 0, error: null }` (fake it; U28 triangulates the scan). Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U28 tddStatus reports per-feature artifacts and verdict

- test: `.fork/ci/test/tdd-status.test.mjs::U28 tddStatus reports per-feature cycle log, audit report and verdict` (new; PASS, PASS_WITH_GAPS with a trailing comment, FAIL with CRLF, BLOCKED with trailing spaces, missing, and four unreadable variants: invalid value, empty value, no frontmatter, `verdict:` only in the body)
- red: `node --test --test-name-pattern="U28" .fork/ci/test/tdd-status.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: PASS` / `actual: false,` / `expected: true,` (1 failed; `linked` was still faked)
- green: `.fork/ci/lib/tdd-status.mjs:46-57` scans `specs/*/spec.md`, matches the backticked Feature Branch with `===`, and builds `{ dir, cycleLog, verification, verdict }`; `reportVerdict` (`:18-27`) reads `verdict:` only inside the leading `---` frontmatter. Suite `node --test .fork/ci/test/` -> 104 passed, 0 failed
- refactor: none needed (helpers `featureBranch`, `reportVerdict`, `featureStatus` were written small at green)
- commit: (this commit)
