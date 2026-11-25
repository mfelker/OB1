## Cycle: U36 D4 outranks D5: an upstream file under a fork-only root is denied

- test: `.fork/ci/test/principle-v.test.mjs::U36 D4 before D5: a file under a fork-only root that exists upstream is denied with D4` (new)
- red: mutant M13 (D5 evaluated before D4, swapped lines 45-46 of `.fork/ci/lib/principle-v.mjs`), `node --test --test-name-pattern="^U36 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U36 D4 before D5 ...` / `actual: true` / `expected: false` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 199 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 1 / M13

## Cycle: U37 D6 zones are narrow (other skills and workflows are upstream)

- test: `.fork/ci/test/principle-v.test.mjs::U37 D6 zones are narrow: other files in .claude/skills and .github/workflows are denied with D8` (new)
- red: mutant M06 (zone prefixes widened to `.claude/skills/` and `.github/workflows/`, `.fork/ci/lib/principle-v.mjs:5-6`), `node --test --test-name-pattern="^U37 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U37 D6 zones are narrow ...` / `actual: true` / `expected: false` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 200 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 2 / M06

## Cycle: U38 D8 names the outermost upstream folder

- test: `.fork/ci/test/principle-v.test.mjs::U38 D8 names the outermost upstream folder when several enclose the path` (new)
- red: mutant M10 (D8 picks the innermost enclosing folder: `.find(Boolean)` -> `.findLast(Boolean)`, `.fork/ci/lib/principle-v.mjs:49`), `node --test --test-name-pattern="^U38 " .fork/ci/test/principle-v.test.mjs`
  -> `✖ U38 D8 names the outermost upstream folder ...` / `actual: false` / `expected: true` (1 failed); mutant reverted, `git status --short` clean except tests
- green: no production change. Suite `node --test .fork/ci/test/` -> 201 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding HIGH 3 / M10

## Cycle: A7-A9 strengthened (the commit hook provably ran; A7 passes only through D5)

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A7 commit guard allows a commit on main that stages only fork-only paths`, `::A8 commit guard allows committing a conflicted merge that touches upstream files`, `::A9 commit guard allows a commit staging upstream files in a linked worktree on another branch` (strengthened; every existing assertion kept)
- change: a test-fixture-only observation, no production change. `gitTrace()` writes a `--require` preload (via `NODE_OPTIONS`, scoped to `principle-v-guard.mjs`) that logs the child processes the guard spawns, then runs them unchanged; `assertGuardRan` requires the log to hold `diff --cached --name-only`. A7-A9 now assert it after the exit-0 check. A7's fixture also gets upstream `.fork/README.md` and `specs/README.md` (new optional `guardRepo(extraUpstream)` argument; A1-A6 unchanged), so without D5 the staged `.fork/notes.md` and `specs/006-x/spec.md` fall to D8.
- red: mutant M-A (`--staged` exits 0 without running: `if (process.argv[2]) return;` as the first line of `stagedGuarded`, `.fork/ci/bin/principle-v-guard.mjs:54`), `node --test --test-name-pattern="^A[789] " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError: A7: the commit guard never queried the staged paths, so it did not run` (likewise A8, A9; 3 failed, 0 passed). Before the change these three passed against this mutant (exit 0 only).
- red: mutant M-B (remove D5, delete `if (FORK_ROOTS.has(...)) return allow('D5');`, `.fork/ci/lib/principle-v.mjs:46`), same command
  -> `AssertionError: principle-v-guard: commit refused (constitution Principle V)`, `.fork/notes.md: ... (inside upstream folder .fork/)`, `actual: 1` / `expected: 0` (A7 failed; A8, A9 pass, as they do not depend on D5). Both mutants reverted, `git status --short` clean except tests.
- green: no production change. Suite `node --test .fork/ci/test/` -> 201 passed, 0 failed
- refactor: none needed
- commit: (this commit)
- notes: test strengthening against Gate 1 audit finding MED 5. Deviation: this edits committed acceptance tests (strengthens only, no assertion removed or loosened). The first observation attempt, a `git` shim on PATH, saw only the outer commit because git puts its own exec-path ahead of PATH for hooks; replaced by the preload.
