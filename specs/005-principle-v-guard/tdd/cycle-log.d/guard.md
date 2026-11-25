<!-- stream guard (G) -->

## Cycle: A1 agent guard refuses an upstream file

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A1 agent guard refuses a Write to a file that exists upstream, naming Principle V and the upstream-bound route` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); re-run with the `todo` option removed and no CLI: `node --test --test-name-pattern="^A1 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: node:internal/modules/cjs/loader … Cannot find module '…/.fork/ci/bin/principle-v-guard.mjs'` / `actual: 1` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:1-27` new CLI: reads the PreToolUse JSON from stdin, loads both libs with dynamic `import()` inside the top-level `try`, resolves `repoRelative` -> `checkoutState` -> `upstreamPaths` -> `decide`, prints the deny JSON (smallest version: every decision prints a deny; any exception prints a `principle-v-guard failed:` deny). Suite `node --test .fork/ci/test/` -> 179 passed, 0 failed, 8 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A3 agent guard allows every fork-only root and zone

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A3 agent guard allows every fork-only root and zone` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); run before this commit's change: `node --test --test-name-pattern="^A3 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/notes.md: an allowed write prints no decision` / `actual: '{"hookSpecificOutput":{…"permissionDecisionReason":"undefined undefined"}}\n', expected: ''` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:22` print the deny only when `!d.allowed`; allowed prints nothing. Suite `node --test .fork/ci/test/` -> 180 passed, 0 failed, 7 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A2 --hook points domain_knowledge writes to .fork/domain-knowledge/

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A2 agent guard refuses docs/domain_knowledge/CONTEXT.md and points to .fork/domain-knowledge/` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A2 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: the D4 deny carries the domain-knowledge suggestion from decide()). Suite `node --test .fork/ci/test/` -> 181 passed, 0 failed, 6 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A4 --hook allows a linked worktree write

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A4 agent guard allows an upstream path in a linked worktree on another branch, from a main-checkout session` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A4 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: repoRelative/checkoutState read the worktree's own root and branch (D2)). Suite `node --test .fork/ci/test/` -> 182 passed, 0 failed, 5 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A5 --hook allows an upstream file during a merge

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A5 agent guard allows editing an upstream file while a merge is in progress on main` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A1 and A3 commits, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A5 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (already covered by the A1/A3 pipeline: checkoutState reports MERGE_HEAD (D3)). Suite `node --test .fork/ci/test/` -> 183 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U22 --hook reads notebook_path and resolves a relative path against cwd

- test: `.fork/ci/test/principle-v-guard.test.mjs::U22 --hook reads tool_input.notebook_path when there is no file_path, resolving a relative path against the input cwd` (new)
- red: `node --test --test-name-pattern="^U22 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^CLAUDE\.md: constitution Principle V/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:17` target is `tool_input.file_path ?? tool_input.notebook_path`; `repoRelative` already resolves a relative path against the input `cwd`. Suite `node --test .fork/ci/test/` -> 184 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U23 --hook fails closed on unparseable stdin

- test: `.fork/ci/test/principle-v-guard.test.mjs::U23 --hook with unparseable stdin prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U23 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /The write was refused; fix the guard or run it by hand: node \.fork\/ci\/bin\/principle-v-guard\.mjs --hook/` with ``actual: `principle-v-guard failed: Unexpected token 'o', "not json" is not valid JSON` `` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` the catch appends the contract's `The write was refused; fix the guard or run it by hand: ...` text (`REFUSED`); the prefix, deny shape and exit 0 already came from the top-level `try`/`catch`. Suite `node --test .fork/ci/test/` -> 185 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U24 --hook fails closed when a matched tool has no target path

- test: `.fork/ci/test/principle-v-guard.test.mjs::U24 --hook for a matched tool with no target path prints the principle-v-guard failed deny and exits 0` (new)
- red: `node --test --test-name-pattern="^U24 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /no target path/` with `actual: 'principle-v-guard failed: The "paths[1]" argument must be of type string. Received undefined. The write was refused; …'` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs:19-20` a missing or empty target throws `no target path in tool_input (file_path or notebook_path)`, which the catch turns into the deny; `tool_input?.` tolerates a missing object. Suite `node --test .fork/ci/test/` -> 186 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U25 --hook fails closed when the rule library fails to load

- test: `.fork/ci/test/principle-v-guard.test.mjs::U25 --hook whose rule library fails to load prints the principle-v-guard failed deny and exits 0` (new; the fixture is a temp copy of `.fork/ci/{bin,lib}` whose `lib/principle-v.mjs` is replaced by `export const decide = ;`)
- red: not observed. The test passed on its first run because the A1 cycle already loads both libs with dynamic `import()` inside the top-level `try` (a design choice made up front from contracts/guards.md). Deviation: no invented red; a deliberate mutant check instead.
- mutant check: temporarily added a static `import { decide as _d } from '../lib/principle-v.mjs';` to the CLI. `node --test --test-name-pattern="^U25 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: hook must exit 0; stderr: file:///…/.fork/ci/lib/principle-v.mjs:1` (1 failed: the crash exits non-zero, the fail-open case). Mutant reverted; test then passes.
- green: no CLI change (behavior already present). Suite `node --test .fork/ci/test/` -> 187 passed, 0 failed, 4 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A6 commit guard refuses a commit that stages upstream paths

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A6 commit guard refuses a commit on main that stages upstream paths, listing each with its reason` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); run before this commit's change (CLI treated every mode as `--hook`): `node --test --test-name-pattern="^A6 " .fork/ci/test/principle-v-guard.acceptance.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: commit must be refused` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` new `staged()` mode (`--staged`): top level from `git rev-parse --show-toplevel`, paths from `git diff --cached --name-only -z --no-renames`, each through the shared `decideFor()`; any deny prints the header, one two-space-indented line per denied path and the `--no-verify` line to stderr and sets exit code 1. Suite `node --test .fork/ci/test/` -> 188 passed, 0 failed, 3 todo
- refactor: extracted `decideFor(root, relPath)` (libs loaded by dynamic `import()`, state, upstream, `decide`) out of the `--hook` path so both modes share it; behavior unchanged (suite stays green).
- note (contract wording): contracts/guards.md says each line is `<relPath>: <reason> <suggestion>`, but `decide()`'s reason already begins `<relPath>: constitution Principle V ...` (contracts/rule.md "Messages"). The line is therefore `  <reason> <suggestion>`, so the path appears once, not twice. A6's patterns (`CLAUDE\.md: .*file exists in upstream\/main`) hold either way.
- commit: (this commit)

## Cycle: A7 --staged allows a fork-only commit

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A7 commit guard allows a commit on main that stages only fork-only paths` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A7 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (no deny lines, so the guard exits 0 silently). Suite `node --test .fork/ci/test/` -> 189 passed, 0 failed, 2 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A8 --staged allows a conflicted merge commit

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A8 commit guard allows committing a conflicted merge that touches upstream files` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A8 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (decideFor reads MERGE_HEAD (D3)). Suite `node --test .fork/ci/test/` -> 190 passed, 0 failed, 1 todo
- refactor: none needed
- commit: (this commit)

## Cycle: A9 --staged allows a commit in a linked worktree

- test: `.fork/ci/test/principle-v-guard.acceptance.test.mjs::A9 commit guard allows a commit staging upstream files in a linked worktree on another branch` (flipped from todo)
- red: recorded at T029 (cycle-log.md 'Outer loop opened'); passes after the A6 commit, so no new red is invented: the flip is its own cycle. Check run: `node --test --test-name-pattern="^A9 " .fork/ci/test/principle-v-guard.acceptance.test.mjs` -> 1 passed, 0 failed
- green: no CLI change needed (decideFor reads the worktree's own branch (D2)). Suite `node --test .fork/ci/test/` -> 191 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)

## Cleanup: outer loop closed (A1-A9 all plain tests)

- refactor: deleted the now-unused `OUTER` constant from `.fork/ci/test/principle-v-guard.acceptance.test.mjs` and changed the header comment's tense ("flips" -> "flipped"). No assertion touched. Suite `node --test .fork/ci/test/` -> 191 passed, 0 failed, 0 todo
- commit: (this commit)

## Cycle: U26 --staged lists staged deletions and both sides of a rename

- test: `.fork/ci/test/principle-v-guard.test.mjs::U26 --staged lists staged deletions and both sides of a rename` (new; stages `git rm docs/extra.md` and `git mv CLAUDE.md docs/moved.md`, expects exit 1 with `docs/extra.md` and `CLAUDE.md` as D4 denies and `docs/moved.md` as a D8 deny)
- red: not observed. The test passed on its first run because A6 already built `--staged` on `git diff --cached --name-only -z --no-renames` (research R6). Deviation: no invented red; deliberate mutant checks instead.
- mutant checks: (1) removed `--no-renames` from the diff command: `node --test --test-name-pattern="^U26 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /CLAUDE\.md: .*file exists in upstream\/main/` (1 failed: only the rename's new path is listed). (2) added `--diff-filter=AM`: -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /docs\/extra\.md: .*file exists in upstream\/main/` (1 failed: deletions dropped). Both mutants reverted; test then passes.
- green: no CLI change (behavior already present). Suite `node --test .fork/ci/test/` -> 192 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)

## Cycle: U27 --staged fails with exit 1 and principle-v-guard failed: on a guard failure

- test: `.fork/ci/test/principle-v-guard.test.mjs::U27 --staged on a guard failure exits 1 with principle-v-guard failed:` (new; a temp copy whose `lib/principle-v.mjs` is broken, one staged file)
- red: `node --test --test-name-pattern="^U27 " .fork/ci/test/principle-v-guard.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^principle-v-guard failed: /` with `actual: "file:///…/.fork/ci/lib/principle-v.mjs:1\nexport const decide = ;\n … SyntaxError: Unexpected token ';'…"` (1 failed)
- green: `.fork/ci/bin/principle-v-guard.mjs` `stagedGuarded()` wraps `staged()` and prints `principle-v-guard failed: <message>` to stderr with exit code 1. Suite `node --test .fork/ci/test/` -> 193 passed, 0 failed, 0 todo
- refactor: none needed
- commit: (this commit)
