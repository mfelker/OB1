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

## Cycle: U29 several specs naming the same branch give one entry each

- test: `.fork/ci/test/tdd-status.test.mjs::U29 several specs naming the same branch give one entry each, sorted by dir` (new)
- red: none natural. The test passed on first run because U28's scan already filters every spec. Deliberate-mutant check per the playbook: `.fork/ci/lib/tdd-status.mjs:55` changed to `.slice(0, 1).map(...)`, then `node --test --test-name-pattern="U29" .fork/ci/test/tdd-status.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (1 failed). Mutant reverted exactly (`git diff` empty).
- green: no implementation change (covered by U28). Suite `node --test .fork/ci/test/` -> 105 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test-after relative to U28's implementation; the mutant is the evidence that the test can fail.

## Cycle: U32 the branch is compared literally

- test: `.fork/ci/test/tdd-status.test.mjs::U32 the branch is compared literally: regex metacharacters and ../ are data` (new)
- red: none natural. The test passed on first run because U28 compares with `===`. Deliberate-mutant check: `.fork/ci/lib/tdd-status.mjs:54` changed to match `` new RegExp(`^${headRef}$`) ``, then `node --test --test-name-pattern="U32" .fork/ci/test/tdd-status.test.mjs`
  -> `actual: [ 'specs/001-a', 'specs/002-b' ],` / `expected: [ 'specs/002-b' ],` (1 failed). Mutant reverted exactly (`git status` shows only the test file).
- green: no implementation change (covered by U28). Suite `node --test .fork/ci/test/` -> 106 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test-after relative to U28's implementation; the mutant is the evidence. Feature dirs come from `readdirSync`, never from `headRef`, so `../` in a branch can't select a path.

## Cycle: U33 renderReport renders the advisory TDD status section

- test: `.fork/ci/test/report.test.mjs::U33 renderReport renders the advisory TDD status section per contract T1-T10`, `::U33 pipes and newlines in TDD status names and messages are escaped`, `::U33 the TDD section leaves the rest of the report unchanged` (new; existing report tests untouched)
- red: `node --test --test-name-pattern="U33" .fork/ci/test/report.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` and `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /\| specs\/a\\\|b \| ✅ \| ✅ \| ✅ PASS \|/.` (2 failed, 1 passed)
- green: `.fork/ci/lib/report.mjs:23-41` adds `tddSection` (error line, then "no feature linked", then the table, all through `esc()`); `:49` adds the optional 4th `tdd = null` parameter; `:82` appends the section after the existing report. Suite `node --test .fork/ci/test/` -> 109 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: the third U33 test is an invariant guard (base report unchanged) and passed before the change, because no section was rendered yet. T8 and T10 render the section heading followed by the single contract line.

## Cycle: U34 bin/verdict.mjs keeps the same conclusion and exit for every TDD status

- test: `.fork/ci/test/verdict.test.mjs::U34 bin/verdict.mjs: same conclusion and exit for every TDD status, including a throwing tddStatus` (new; spawns the bin against temp roots for PASS, PASS_WITH_GAPS, FAIL, BLOCKED, missing, unreadable, no link, push and a throwing `tddStatus` (`spec.md` is a directory, EISDIR), on both a success base (exit 0) and a failure base (exit 1), comparing exit, stdout and summary with the TDD section stripped against a run with no `HEAD_REF`; existing verdict tests untouched)
- red: `node --test --test-name-pattern="U34" .fork/ci/test/verdict.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: success/PASS` at `verdict.test.mjs:182` (the section assertion; exit and stdout equality already held) (1 failed)
- green: `.fork/ci/bin/verdict.mjs:42-50` computes `tddStatus(process.cwd(), process.env.HEAD_REF ?? '')` in `try`/`catch` (an exception becomes `{ error: message }`) and passes it to `renderReport` only; `computeVerdict` is unchanged. `.github/workflows/fork-ci.yml` adds `HEAD_REF: ${{ github.head_ref }}` to the Verdict step's `env:` only. Suite `node --test .fork/ci/test/` -> 110 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: actionlint is not on PATH locally; it runs in CI's self-test job. No `verdict.json` is produced by `bin/verdict.mjs` today, so the contract's `verdict.json` invariant is covered by the exit code and summary comparison.
