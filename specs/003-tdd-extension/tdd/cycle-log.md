# Cycle Log: Adopt the spec-kit-tdd extension for enforced TDD

Append only. Newest last. Every entry's `red` block is the evidence that the test existed and failed before the implementation.

During the parallel streams (research R14), cycles are written first to `tdd/cycle-log.d/<stream>.md`, then appended here in merge order by the integrator.

## Baseline

- suite: `node --test .fork/ci/test/` -> 101 passed, 0 failed (6 s wall)
- commit: `d83711a`
- recorded: cycle 0, before any change. The extension is installed and verified (A1).

## Notes and deviations

- **Profile after list**: the extension makes `.specify/memory/tdd-profile.md` a precondition of planning. This list was written before the profile exists (task T014), because the profile's commands call the adapter this feature builds (research R7). Until T014, cycles run tests with `node --test` directly.
- **Hand-driven loop**: the extension's mandatory `before_implement` hook can't drive its own installation (research R11). These cycles follow `.specify/extensions/tdd/commands/speckit.tdd.run.md` and its playbook by hand.
- **Parallel streams**: cycles from streams A–D ran concurrently in separate worktrees. Their order here is the merge order, not wall-clock order.

<!-- stream adapter (merged T022) -->

## Cycle: U1 SPECIFY_FEATURE_DIRECTORY wins over feature.json

- test: `.fork/ci/test/tdd-target.test.mjs::U1 SPECIFY_FEATURE_DIRECTORY wins over feature.json` (new)
- red: `node --test --test-name-pattern="^U1 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` (1 failed). The module existed only as an empty `resolveTarget` stub plus `TargetError`, so the import resolved.
- green: `.fork/ci/lib/tdd-target.mjs:14` `featureDir` resolved from `SPECIFY_FEATURE_DIRECTORY` against `repoRoot`. Suite `node --test .fork/ci/test/` -> 102 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U2 feature.json feature_directory is used when there is no env

- test: `.fork/ci/test/tdd-target.test.mjs::U2 feature.json feature_directory is used when there is no env` (new)
- red: `node --test --test-name-pattern="^U2 " .fork/ci/test/tdd-target.test.mjs`
  -> `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[1]" argument must be of type string. Received undefined` (1 failed). The resolver had no feature.json path, so it passed the missing env value to `path.resolve`.
- green: `.fork/ci/lib/tdd-target.mjs:13` `featureJsonDir()` reads `.specify/feature.json`; `:19` uses it when the env is unset or empty. Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U3 neither env nor feature.json gives "no active feature"

- test: `.fork/ci/test/tdd-target.test.mjs::U3 neither env nor feature.json gives "no active feature"` (new)
- red: `node --test --test-name-pattern="^U3 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: expected TargetError, got Error: ENOENT: no such file or directory, open '…/.specify/feature.json'` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:27` throws `TargetError(NO_FEATURE)` when neither source gives a directory; `:16` `featureJsonDir` returns undefined for a missing or unreadable file. Suite `node --test .fork/ci/test/` -> 104 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U4 lane grammar: fork, upstream-bound, staged; placeholder and unknown are errors

- test: `.fork/ci/test/tdd-target.test.mjs::U4 lane grammar: fork, upstream-bound, staged; placeholder and unknown are errors` (new; written by the previous session, red re-observed here)
- red: `node --test --test-name-pattern="^U4 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` / `expected: 'fork',` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:25` `planField()` reads the text after the first `:` of a `**<field>**` line, `*(…)*` annotations removed; `:34` `parseLane()` maps the prefix to `staged` / `upstream-bound` / `fork` and throws on a missing line, `[` placeholder or unknown value; `:52` a missing plan is `plan not found`. Suite `node --test .fork/ci/test/` -> 105 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U5 a backticked absolute Worktree path becomes tree

- test: `.fork/ci/test/tdd-target.test.mjs::U5 a backticked absolute Worktree path becomes tree` (new; real `git init` + `git worktree add` via the `addWorktree` helper)
- red: `node --test --test-name-pattern="^U5 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` / `expected: '/private/var/folders/…/fork-tdd-wt-bfei5G/wt',` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:43` `parseTree()` takes the first backticked token of the Worktree value; `:61` sets `tree`. Suite `node --test .fork/ci/test/` -> 106 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U6 Worktree none… gives repoRoot

- test: `.fork/ci/test/tdd-target.test.mjs::U6 Worktree none… gives repoRoot` (new; cases "none (fork-`main` checkout)", "None", "NONE: runs in `.`")
- red: `node --test --test-name-pattern="^U6 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: none (fork-\`main\` checkout)` / `actual: 'main',` / `expected: '/private/var/folders/…/fork-tdd-target-pOb3J4',` (1 failed). The backtick rule picked up `main` from the annotation.
- green: `.fork/ci/lib/tdd-target.mjs:44` a value starting `none` (case-insensitive) returns `repoRoot` before the backtick rule. Suite `node --test .fork/ci/test/` -> 107 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U7 a Worktree placeholder or a non-absolute token is an error

- test: `.fork/ci/test/tdd-target.test.mjs::U7 a Worktree placeholder or a non-absolute token is an error` (new; includes the plan template's literal Worktree line with its `*(upstream-bound / staged)*` annotation)
- red: `node --test --test-name-pattern="^U7 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Missing expected exception.` / `actual: undefined,` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:44` a `[` in the value throws `plan Worktree is a placeholder (<plan>)` (checked first, R3 rule 1); `:47` no backticked token, or a non-absolute one, throws `plan Worktree must be an absolute path or "none"`. Suite `node --test .fork/ci/test/` -> 108 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U8 a missing Worktree line gives repoRoot for fork; staged and upstream-bound get an error

- test: `.fork/ci/test/tdd-target.test.mjs::U8 a missing Worktree line gives repoRoot for fork; staged and upstream-bound get an error` (new)
- red: `node --test --test-name-pattern="^U8 " .fork/ci/test/tdd-target.test.mjs`
  -> `Error [TargetError]: plan Worktree must be an absolute path or "none"` (1 failed). The missing line fell through to the absolute-path rule.
- green: `.fork/ci/lib/tdd-target.mjs:44` a missing Worktree line returns `repoRoot` for lane `fork`, else throws `plan Worktree required for <lane> lane` (FR-007). Suite `node --test .fork/ci/test/` -> 109 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U9 a Worktree not on disk, or not a git work tree, is an error

- test: `.fork/ci/test/tdd-target.test.mjs::U9 a Worktree not on disk, or not a git work tree, is an error` (new; a path never created, and a plain temp dir with no `.git`)
- red: `node --test --test-name-pattern="^U9 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Missing expected exception.` / `actual: undefined,` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:57` `workTree()` realpaths the named path and requires `git rev-parse --show-toplevel` to equal it, else throws `worktree not found: <path>` (adapter A3); `:53` a named Worktree goes through it. Suite `node --test .fork/ci/test/` -> 110 passed, 0 failed
- refactor: none needed
- notes: a subdirectory of a work tree is also rejected (top-level must equal the named path); R3 says "must be a git work tree", read here as the work tree's root.
- commit: (this commit)

## Cycle: U10 Contribution folder grammar: placeholder, N/A before backticks, trailing / stripped, leading / or .. rejected

- test: `.fork/ci/test/tdd-target.test.mjs::U10 Contribution folder grammar: placeholder, N/A before backticks, trailing / stripped, leading / or .. rejected` (new; includes the plan template's literal `[category]/[kebab-case-name]/` line and spec 001's literal "N/A. Fork infrastructure lives in `.fork/ci/` …" line)
- red: `node --test --test-name-pattern="^U10 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` (1 failed)
- green: `.fork/ci/lib/tdd-target.mjs:67` `parseFolder()`: a missing line, a `[` placeholder or an `N/A` prefix (checked before backticks) throws `plan has no Contribution folder (<plan>)` (adapter A4); otherwise the first backticked token with trailing `/` stripped; a leading `/` or a `..` segment throws. Suite `node --test .fork/ci/test/` -> 111 passed, 0 failed
- refactor: none needed
- notes: contract ambiguity resolved: the contract gives no message for a non-repo-relative folder, so it is `plan Contribution folder must be repo-relative: <folder>` (exit 2 like every TargetError). A value with no backticked token is treated as "no Contribution folder".
- commit: (this commit)

## Cycle: U11 folderExists:false is allowed for suite only; other operations get "folder not found"

- test: `.fork/ci/test/tdd-target.test.mjs::U11 folderExists:false is allowed for suite only; other operations get "folder not found"` (new)
- red: `node --test --test-name-pattern="^U11 " .fork/ci/test/tdd-target.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` (1 failed). `requireFolder` existed only as an empty exported stub, so the import resolved.
- green: `.fork/ci/lib/tdd-target.mjs:94` `folderExists` is `tree/folder` being a directory; `:99` `requireFolder(target)` throws `folder not found in tree: <folder> (<tree>)` (adapter A5) when it is false. Suite `node --test .fork/ci/test/` -> 112 passed, 0 failed
- refactor: none needed
- notes: design choice: `resolveTarget({repoRoot, env})` keeps its data-model signature (no `op`); the per-operation rule is the separate exported guard `requireFolder`, which `single`/`file` call and `suite` does not.
- commit: (this commit)

## Cycle: U12 file resolution: folder, then tree, then repo root; the inside-tree check runs after every resolution

- test: `.fork/ci/test/tdd-commands.test.mjs::U12 file resolution: folder, then tree, then repo root; the inside-tree check runs after every resolution` (new file; cases: folder beats tree, tree beats repo root, a repo-root-only hit is rejected, an absolute path outside, a `../` escape, a symlink inside the folder pointing outside, a missing file)
- red: `node --test --test-name-pattern="^U12 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: undefined,` (1 failed). `lib/tdd-commands.mjs` existed only as an empty `resolveFile` stub, so the import resolved.
- green: `.fork/ci/lib/tdd-commands.mjs:9` `resolveFile(file, target)` tries an absolute path as is, a relative one against folder, tree, repo root (first that exists), then realpaths the hit and requires it inside the realpath of the tree, else `<file> is outside the target tree <tree>`. Suite `node --test .fork/ci/test/` -> 113 passed, 0 failed
- refactor: none needed
- notes: contract ambiguity resolved: A16 doesn't say what happens when no candidate exists; it is the TargetError `file not found: <file>` (exit 2).
- commit: (this commit)

## Cycle: U13 a file no runtime owns is rejected, naming the patterns

- test: `.fork/ci/test/tdd-commands.test.mjs::U13 a file no runtime owns is rejected, naming the patterns` (new; node-plain fixture plus a pytest file; a code file and a file outside the folder are rejected)
- red: `node --test --test-name-pattern="^U13 " .fork/ci/test/tdd-commands.test.mjs`
  -> `TypeError [Error]: Cannot read properties of undefined (reading 'kind')` (1 failed). `runtimeFor` existed only as an empty exported stub, so the import resolved and the owner lookup returned nothing.
- green: `.fork/ci/lib/tdd-commands.mjs:24` `runtimeFor(fileAbs, target)` picks the `scanRuntimes(<tree>/<folder>, <folder>)` entry whose `root` contains the file and whose `testFiles` include it; otherwise throws `<file> is not a test file of any runtime in <folder> (patterns: <kind> <regex>; …; sql tests/verify.sql)` (adapter A6). `.fork/ci/lib/runtimes.mjs:8` now exports `TEST_PATTERNS` so the message reuses fork-ci's patterns instead of copying them. Suite `node --test .fork/ci/test/` -> 114 passed, 0 failed
- refactor: none needed
- notes: `<file>` in the A6 message is the tree-relative posix path.
- commit: (this commit)

## Cycle: U14 node-test single/file argv and cwd = tree + root

- test: `.fork/ci/test/tdd-commands.test.mjs::U14 node-test single/file argv (isolation none, spec reporter, anchored escaped name as one element) and cwd = tree + root` (new; the name carries every metacharacter `\ ^ $ . * + ? ( ) [ ] { } |`, and the built pattern is checked to match it literally)
- red: `node --test --test-name-pattern="^U14 " .fork/ci/test/tdd-commands.test.mjs`
  -> `TypeError [Error]: Cannot read properties of undefined (reading 'op')` (1 failed). `buildCommand` existed only as an empty exported stub.
- green: `.fork/ci/lib/tdd-commands.mjs:35` `buildCommand()` returns `{op, kind:'node-test', argv, cwd, unsupported:null}` with `cwd = tree + runtime.root`, argv `--test --test-isolation=none --test-reporter=spec [--test-name-pattern=^<escaped>$] <file rel to cwd>`; `:45` `escapeRegex`. Suite `node --test .fork/ci/test/` -> 115 passed, 0 failed
- refactor: none needed
- notes: argv[0] is `process.execPath` rather than a bare `node`, so the child runs on the same Node the adapter's version check accepted. Probe (Node 26.13, `--test-isolation=none`): an anchored pattern matches a test inside `describe` by its leaf name and by "<suite> <leaf>"; a suite name selects all its tests.
- commit: (this commit)

## Cycle: U15 node count parser: tests 0 is zero-match; unparseable output gives null

- test: `.fork/ci/test/tdd-commands.test.mjs::U15 node count parser: tests 0 is zero-match; unparseable output gives null` (new)
- red: `node --test --test-name-pattern="^U15 " .fork/ci/test/tdd-commands.test.mjs`
  -> `TypeError [Error]: countParser is not a function` (1 failed)
- green: `.fork/ci/lib/tdd-commands.mjs:48` `nodeCounts()` reads the last `ℹ tests/pass/fail N` lines and returns null unless all three are present; `buildCommand` returns it as `countParser`. Suite `node --test .fork/ci/test/` -> 116 passed, 0 failed
- refactor: `lastCount`'s line regex tightened from `^\S* ?<label>` to `^ℹ <label>`; suite re-run -> 116 passed, 0 failed
- commit: (this commit)

## Cycle: U16 a test-*.mjs script without node:test is kind plain-script

- test: `.fork/ci/test/tdd-commands.test.mjs::U16 a test-*.mjs script without node:test is kind plain-script: single unsupported, file uses process isolation` (new)
- red: `node --test --test-name-pattern="^U16 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'node-test',` (1 failed)
- green: `.fork/ci/lib/tdd-commands.mjs:37` a node-plain file whose source has no `node:test` import/require (`:47` `USES_NODE_TEST`) is `plain-script`: `single` sets `unsupported` to "plain script, no named tests; use `file`", `file` runs `node --test --test-reporter=spec <f>` without `--test-isolation=none` (adapter A10, R5). Suite `node --test .fork/ci/test/` -> 117 passed, 0 failed
- refactor: `buildCommand` reshaped around a shared `base` (`op`, `cwd`, `unsupported`) ahead of the other runtimes; suite re-run -> 117 passed
- commit: (this commit)

## Cycle: U17 deno argv is runtime.command plus --filter; the 0 passed parser

- test: `.fork/ci/test/tdd-commands.test.mjs::U17 deno argv is runtime.command plus --filter; the 0 passed parser` (new; parser fed real deno 2.9.8 summary lines, ANSI codes included, captured from a probe in the scratchpad)
- red: `node --test --test-name-pattern="^U17 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'plain-script',` (1 failed). Every runtime still fell into the node-plain branch.
- green: `.fork/ci/lib/tdd-commands.mjs:37` deno argv is `runtime.command` (scanRuntimes' own argv, not a copy) plus `--filter <name>` for `single`, then the file; `:68` `denoCounts()` strips ANSI, maps "No test modules found" to zero and otherwise reads the last `N passed | M failed`, else null. Suite `node --test .fork/ci/test/` -> 118 passed, 0 failed
- refactor: none needed
- notes: `--filter <name>` is R5's argv verbatim; deno's string filter is a substring match, so a `single` name can select more than one deno test (recorded for the profile).
- commit: (this commit)

## Cycle: U18 python: cached venv keyed by tree + root and the requirements hash; argv -k; exit 5 is zero-match

- test: `.fork/ci/test/tdd-commands.test.mjs::U18 python: cached venv keyed by tree + root and the requirements hash; argv -k; exit 5 is zero-match` (new; with and without `requirements.txt`)
- red: `node --test --test-name-pattern="^U18 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'plain-script',` (1 failed)
- green: `.fork/ci/lib/tdd-commands.mjs:39` python argv `<venv>/bin/python -m pytest -q [-k <name>] <f>`; `:87` `pythonVenv()` gives `{dir: <os tmp>/fork-tdd-venv-<sha1(tree + root)>, requirements, requirementsHash}`; `:95` `pytestCounts()` maps exit 5 to zero and reads the last `… in Ns` summary (errors count as failures), else null. Suite `node --test .fork/ci/test/` -> 119 passed, 0 failed
- refactor: none needed
- notes: `buildCommand` stays pure: it describes the venv (`venv` field, an addition to the data-model fields) and the CLI creates or refreshes it. "tree + root" is hashed as the joined cwd path.
- commit: (this commit)

## Cycle: U19 node-script: vitest and jest support single with -t; other runners are unsupported

- test: `.fork/ci/test/tdd-commands.test.mjs::U19 node-script: vitest and jest support single with -t; other runners are unsupported` (new)
- red: `node --test --test-name-pattern="^U19 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'node-test',` (1 failed)
- green: `.fork/ci/lib/tdd-commands.mjs:44` node-script goes to `nodeScriptCommand()` (`:80`): the runner is vitest or jest when the root's `package.json` test script names it or a dependency is present (`:73`); vitest `npx vitest run <f> [-t <name>]`, jest `npx jest <f> [-t <name>]`; any other runner `npm test -- <f>` with `single` unsupported. `vitestCounts`/`jestCounts` read the last `Tests` summary (skipped not counted; "No test files found" / "No tests found" is zero), else null. Suite `node --test .fork/ci/test/` -> 120 passed, 0 failed
- refactor: extracted `countOf(line, word)` from three copies of the same summary-count lambda (pytest, vitest, jest) and made `nodeScriptRunner` take the parsed package.json so it is read once; suite re-run -> 120 passed, 0 failed
- notes: the other-runner `file` parser is `nodeCounts` (the `ℹ tests` summary), so a runner that prints no node summary gives null, which is a failure, never a pass.
- commit: (this commit)

## Cycle: U20 sql: file gives the psql verify argv; single is unsupported

- test: `.fork/ci/test/tdd-commands.test.mjs::U20 sql: file gives the psql verify argv; single is unsupported` (new; fork-ci's `sql-verify` fixture)
- red: `node --test --test-name-pattern="^U20 " .fork/ci/test/tdd-commands.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'plain-script',` (1 failed)
- green: `.fork/ci/lib/tdd-commands.mjs:44` sql argv is `runtime.command` (`psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql`, scanRuntimes' own), `single` unsupported "tests/verify.sql is one script, no named tests; use `file`" (adapter A10); `:120` `sqlCounts` maps exit 0 to one pass, else one failure. Suite `node --test .fork/ci/test/` -> 121 passed, 0 failed
- refactor: none needed
- notes: the `file` op runs only the verify script, as R5 specifies; it does not run fork-ci's `bootstrap.sql` first (run-folder does that in `suite`).
- commit: (this commit)

## Cycle: U21 childEnv: NODE_TEST_CONTEXT removed; credential vars set to ""; others kept

- test: `.fork/ci/test/tdd-env.test.mjs::U21 childEnv: NODE_TEST_CONTEXT removed; credential vars set to ""; others kept` (new file; obviously fake values only; near-miss names such as `TOKENIZER_MODEL`, `SECRET_SAUCE_DIR`, `API_KEY_FILE` are kept)
- red: `node --test --test-name-pattern="^U21 " .fork/ci/test/tdd-env.test.mjs`
  -> `TypeError [Error]: Cannot use 'in' operator to search for 'NODE_TEST_CONTEXT' in undefined` (1 failed). `lib/tdd-env.mjs` existed only as an empty `childEnv` stub, so the import resolved.
- green: `.fork/ci/lib/tdd-env.mjs:10` `childEnv()` copies the base without `NODE_TEST_CONTEXT`, blanks every present name matching `/(_API_KEY|_TOKEN|_SECRET|_SERVICE_ROLE_KEY)$/`, and sets each of the seven named variables to `""` even when absent. Suite `node --test .fork/ci/test/` -> 122 passed, 0 failed
- refactor: none needed
- notes: the named list is set when absent too, per R10's rationale (`key in env` must hold so `.env.local` cannot fill it); suffix patterns can only apply to names that are present.
- commit: (this commit)

## Cycle: U22 where prints the JSON, including featureDir and folderExists

- test: `.fork/ci/test/tdd-cli.test.mjs::U22 where prints the JSON, including featureDir and folderExists` (new file; `cliRepo()` copies `.fork/ci/{bin,lib,sql}` into a temp repo so the adapter's repo root, three levels above `bin/tdd.mjs`, is the fixture; `tdd()` spawns `process.execPath` from that root with `NODE_TEST_CONTEXT` and `SPECIFY_FEATURE_DIRECTORY` removed)
- red: `node --test --test-name-pattern="^U22 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: stdout:` (empty) / `actual: false,` / `expected: true,` (1 failed). `bin/tdd.mjs` existed only as a two-line header stub, so it ran and printed nothing.
- green: `.fork/ci/bin/tdd.mjs:10` `REPO_ROOT` is the realpath three levels above the script; `:12` `where` prints `resolveTarget()` plus `runtimes:[{kind, root, testFiles}]` from `scanRuntimes` (empty when the folder doesn't exist yet) as one JSON line (adapter A1). Suite `node --test .fork/ci/test/` -> 123 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: U23 single/file end to end: pass 0, fail 1, zero-match 3, unsupported 4; full child output streamed

- test: `.fork/ci/test/tdd-cli.test.mjs::U23 single/file end to end: pass 0, fail 1, zero-match 3, unsupported 4; full child output streamed` (new; tiny real passing, failing, 3000-line noisy failing, and plain-script files)
- red: `node --test --test-name-pattern="^U23 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /tests=1 pass=1 fail=0 → pass$/. Input:` / `actual: '',` (1 failed). The CLI had only `where`; `single` printed nothing.
- green: `.fork/ci/bin/tdd.mjs:17` `run()` spawns the RuntimeCommand, writing each stdout/stderr chunk through live and capturing all of it (exec.mjs's tail truncation is not used); `:56` `runTests()` = `requireFolder(resolveTarget())` → `resolveFile` → `runtimeFor` → `buildCommand`, `unsupported` exits 4 (adapter A10), child env from `childEnv()`; outcome: unreadable counts or failures exit 1, zero tests with a clean exit (or pytest 5, `:14`) exit 3, else 0; `:29` `ensureVenv()` creates or refreshes the cached pytest venv when its stamp differs from the requirements hash. Suite `node --test .fork/ci/test/` -> 124 passed, 0 failed
- refactor: none needed
- notes: deviation: the exit-4 path (adapter A10) has no Behavior Map id of its own; it is asserted here because U23 owns `single`/`file` end to end and T011 names the plain-script fixture. Zero tests with a non-zero exit is a failure (exit 1), never 3. The python and deno paths were also run by hand against scratchpad fixtures (pytest venv created; `single` pass 0, unmatched 3, `file` 0; deno `single` pass 0, unmatched 3); they are not in the automated suite because they need network/deno. The summary here omits `feature=`/`folder=`, which U27 drives.
- commit: (this commit)

## Cycle: U24 suite exit mapping, including the empty baseline (no-tests, exempt, missing folder)

- test: `.fork/ci/test/tdd-cli.test.mjs::U24 suite exit mapping, including the empty baseline (no-tests, exempt, missing folder)` (new; pass, fail, sql-only, code without tests, docs-only, and a folder not yet created)
- red: `node --test --test-name-pattern="^U24 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^\[tdd\] suite\b.*→ pass$/. Input:` / `actual: '',` (1 failed). The CLI had no `suite`.
- green: `.fork/ci/bin/tdd.mjs:95` `suite()`: a missing folder is `empty baseline: folder does not exist yet` without calling run-folder; otherwise it runs `run-folder.mjs --path <folder> --mode strict --origin fork --out <tmp>` (resolved beside the adapter, `:13`, not in the tree) with cwd = tree and `childEnv()`, prints one line per runtime, and maps the outcome via `:87` `SUITE` (pass / sql-unverified with the advisory notice / no-tests and exempt as empty baselines → 0; anything else → 1 with the reason; adapter A12–A14, FR-017). Suite `node --test .fork/ci/test/` -> 125 passed, 0 failed
- refactor: `SUITE` entries changed from thunks to plain `[exit, summary]` pairs; suite re-run -> 125 passed, 0 failed
- notes: the first draft of this test matched `/^\[tdd\] suite .*→ pass$/`; before going green it was loosened to `suite\b` so U27 (not this cycle) drives the `feature=`/`folder=` part of the summary. No green test was changed.
- commit: (this commit)

## Cycle: U25 suite restores a lockfile it modified that was clean before

- test: `.fork/ci/test/tdd-cli.test.mjs::U25 suite restores a lockfile it modified that was clean before` (new; a committed fixture repo whose passing test rewrites `deno.lock` and `package-lock.json` in its runtime root; `package-lock.json` is already dirty before the run and must be left alone)
- red: `node --test --test-name-pattern="^U25 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'rewritten\n',` (1 failed)
- green: `.fork/ci/bin/tdd.mjs:97` `cleanLockfiles()` lists tracked `package-lock.json`/`deno.lock` under the folder with no diff against HEAD; `:109` `restoreLockfiles()` runs `git checkout HEAD -- <file>` for each one that changed during the run and prints `[tdd] restored <file>` (adapter A21, R6); `:129` wraps the run-folder call. Suite `node --test .fork/ci/test/` -> 126 passed, 0 failed
- refactor: none needed
- notes: the fixture dirties the lockfiles from its own test rather than relying on `npm install`, so the test is offline and deterministic. A tree that isn't a git checkout restores nothing.
- commit: (this commit)

## Cycle: U26 usage, target and Node < 26 errors exit 2 with a single-line message

- test: `.fork/ci/test/tdd-cli.test.mjs::U26 usage, target and Node < 26 errors exit 2 with a single-line message` (new; missing/unknown subcommand, missing arguments, plan not found, no active feature, worktree not found, folder not found, and Node 24 simulated with a `--import data:` preload that redefines `process.versions.node` in the spawned adapter only; `tdd()` gained an optional `nodeArgs` parameter for that)
- red: `node --test --test-name-pattern="^U26 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: tdd: missing subcommand; usage: tdd.mjs where | single <file> <name> | file <file> | suite` / `actual: 0,` / `expected: 2,` (1 failed). Re-observed against the committed CLI after fixing a draft case (see notes).
- green: `.fork/ci/bin/tdd.mjs:152` `parseArgs()` throws a `UsageError` for a missing or unknown subcommand or missing arguments; `:163` Node major < 26 is `requires Node >= 26 (found <v>)` (adapter A20), checked before anything else; `main` prints `tdd: <message>` (usage errors append `; <synopsis>`) as one stderr line and exits 2. Suite `node --test .fork/ci/test/` -> 127 passed, 0 failed
- refactor: none needed
- notes: contract ambiguity resolved: "usage errors print the synopsis" and U26's "single-line message" are reconciled by putting the synopsis on the same line. A draft case (`SPECIFY_FEATURE_DIRECTORY: ''`) was wrong before green (an empty env falls back to feature.json, per U2) and was replaced with `specs/999-none` → `plan not found`; the red was then re-observed with the committed CLI swapped back in.
- commit: (this commit)

## Cycle: U27 the summary line names feature= and folder=

- test: `.fork/ci/test/tdd-cli.test.mjs::U27 the summary line names feature= and folder=` (new; exact last lines for `single`, `file`, `suite`, and `suite` on a folder not yet created)
- red: `node --test --test-name-pattern="^U27 " .fork/ci/test/tdd-cli.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: '[tdd] single node-test: tests=1 pass=1 fail=0 → pass',` (1 failed)
- green: `.fork/ci/bin/tdd.mjs:44` `label()` = `feature=<featureDir relative to repo root> folder=<folder>`, used in every `[tdd] <op> …` summary (`:68`, `:85`, `:127`, `:139`, `:145`), giving the contract's `[tdd] <op> <kind> feature=… folder=…: tests=… pass=… fail=… → <result>` (R2, I5). Suite `node --test .fork/ci/test/` -> 128 passed, 0 failed
- refactor: none needed
- notes: `suite` has no single kind, so its summary is `[tdd] suite feature=… folder=… → <outcome>`; the per-runtime lines above it name each kind and root.
- commit: (this commit)

## Cycle: A3 suite for a feature whose plan names a real git worktree runs that worktree's folder

- test: `.fork/ci/test/tdd-cli.test.mjs::acceptance A3 suite for a feature whose plan names a real git worktree runs that worktree's folder` (new; `stagedLayout()`: committed repo R whose `recipes/x` test fails, plus a real `git worktree add` W whose `recipes/x` test passes, so routing to the wrong tree turns the suite red)
- red: the test passed on its first run (`node --test --test-name-pattern="^A3 " .fork/ci/test/tdd-cli.test.mjs` -> 1 passed): the outer loop closes over units U5/U9/U24 that already exist (`loop: inside-out`). In place of a pre-implementation red, a deliberate mutant: `.fork/ci/lib/tdd-target.mjs:53` changed to `workTree(m[1]); return repoRoot;` (the Worktree is validated but ignored), then the same command
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: '/private/var/folders/…/fork-tdd-cli-VzSPz0',` (1 failed). Mutant reverted from a byte copy.
- green: no production change. Suite `node --test .fork/ci/test/` -> 129 passed, 0 failed
- refactor: none needed
- notes: deviation: no red before implementation is possible for an acceptance behavior written after its units in an inside-out loop; the mutant red is the evidence the test can fail for the right reason (US2 AS1, FR-004).
- commit: (this commit)

## Cycle: A4 the profile single command run as written gives exit 3 for a name that matches nothing

- test: `.fork/ci/test/tdd-cli.test.mjs::acceptance A4 the profile single command run as written gives exit 3 for a name that matches nothing` (new; the contract's profile string `node .fork/ci/bin/tdd.mjs single {file} "{name}"` is expanded and run through a shell from the repo root of the staged layout, `node` resolving to the running Node first on PATH; the unmatched name carries regex metacharacters)
- red: the test passed on its first run (`node --test --test-name-pattern="^A4 " .fork/ci/test/tdd-cli.test.mjs` -> 1 passed; inside-out, over U14/U15/U23). Mutant: `.fork/ci/bin/tdd.mjs:80` `exit = 3;` changed to `exit = 0;` (the false green R5 guards against), then the same command
  -> `AssertionError [ERR_ASSERTION]: ℹ tests 0` / `actual: 0,` (1 failed). Mutant reverted from a byte copy.
- green: no production change. Suite `node --test .fork/ci/test/` -> 130 passed, 0 failed
- refactor: none needed
- notes: deviation: `.specify/memory/tdd-profile.md` doesn't exist yet (T014 writes it), so the string is taken verbatim from contracts/tdd-profile.md; T014 records the same string.
- commit: (this commit)

## Cycle: A5 a fork feature with Worktree none uses the repo-root checkout

- test: `.fork/ci/test/tdd-cli.test.mjs::acceptance A5 a fork feature with Worktree none uses the repo-root checkout` (new; same two-tree layout, plan lane `fork feature`, Worktree "none (fork-`main` checkout)"; the repo root's copy of the test fails, so the profile `single` string must exit 1 with the root's failure marker)
- red: the test passed on its first run (`node --test --test-name-pattern="^A5 " .fork/ci/test/tdd-cli.test.mjs` -> 1 passed; inside-out, over U6). Mutant: `.fork/ci/lib/tdd-target.mjs:50` `return repoRoot;` changed to `return undefined;` for a `none…` value, then the same command
  -> `SyntaxError [Error]: Unexpected end of JSON input` (1 failed): `where` crashed without printing a target. Mutant reverted from a byte copy.
- green: no production change. Suite `node --test .fork/ci/test/` -> 131 passed, 0 failed
- refactor: none needed
- notes: a first mutant attempt was not applied (a `grep` guard didn't match the pattern), so its passing run is not evidence; the mutant above was applied with an exact-string replace and asserted before the run.
- commit: (this commit)

## Cycle: A6 a missing folder or no detectable runtime fails explicitly

- test: `.fork/ci/test/tdd-cli.test.mjs::acceptance A6 a missing folder or no detectable runtime fails explicitly` (new; staged plan whose folder `recipes/gone/` is absent from the worktree, via the profile `single` string; and the profile `file` string on a README and on a code file in a folder whose only runtime owns neither)
- red: the test passed on its first run (`node --test --test-name-pattern="^A6 " .fork/ci/test/tdd-cli.test.mjs` -> 1 passed; inside-out, over U11/U13). Mutant: `.fork/ci/lib/tdd-target.mjs:100` guard `if (!target.folderExists) throw` changed to `if (false) throw`, then the same command
  -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `actual: 'tdd: file not found: a.test.mjs\n',` / `expected: 'tdd: folder not found in tree: recipes/gone (/private/var/folders/…/fork-tdd-accept-wt-XR9uex/wt)\n',` (1 failed). Mutant reverted from a byte copy.
- green: no production change. Suite `node --test .fork/ci/test/` -> 132 passed, 0 failed
- refactor: none needed
- notes: `suite` on a missing folder stays an empty baseline (exit 0, FR-017, covered by U24); A6's explicit failure applies to `single`/`file`.
- commit: (this commit)

## Refactor pass (T013) and quickstart §2–§3

- scope: `lib/tdd-target.mjs`, `lib/tdd-commands.mjs`, `lib/tdd-env.mjs`, `bin/tdd.mjs`; structure only, no behavior change, no test changed.
- moves, each followed by `node --test .fork/ci/test/` -> 132 passed, 0 failed:
  1. `lib/tdd-commands.mjs`: `vitestCounts` and `jestCounts` were the same function with different regexes; both are now one-line calls to `summaryCounts(output, zero, lineRx)`.
  2. `bin/tdd.mjs`: the exit/result ladder in `runTests` extracted into the pure `outcome(counts, code, kind, op, name)`; `BIN_DIR` computed once for `RUN_FOLDER` and `REPO_ROOT`. `lib/tdd-target.mjs`: `parseTree` dropped the `value ?? ''` guards that became dead after U8's missing-line branch.
- `lib/tdd-env.mjs`: no refactor needed.
- quickstart, run from this worktree (`WA`); `where` resolved `tree` = `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension` (spec 003's plan Worktree, the integration worktree, used read-only), `folder` = `.fork/ci`, `lane` = `fork`, runtimes node-plain (14 `test/*.test.mjs`) + sql:
  - §2 `node .fork/ci/bin/tdd.mjs where` -> exit 0
  - §3 `single .fork/ci/test/paths.test.mjs "CATEGORIES lists the seven upstream contribution categories"` -> `tests=1 pass=1 fail=0 → pass`, exit **0**
  - §3 `single .fork/ci/test/paths.test.mjs "no such test xyz"` -> `tests=0 pass=0 fail=0 → no tests matched "no such test xyz"`, exit **3**
  - §3 `file .fork/ci/test/paths.test.mjs` -> `tests=7 pass=7 fail=0 → pass`, exit **0**
  - §3 `suite` -> node-plain `pass`, sql `sql-unverified`, `→ sql-unverified`, exit **0** (5 s)
  - expected 0 / 3 / 0 / 0: matched. The integration worktree's `git status --short` was the same before and after (only the integrator's `tasks.md` edit).
- commit: (this commit)

## Cycle: A2 profile commands each run before recording (single, zero-match, file, suite)

- test: `.specify/memory/tdd-profile.md` `verified:` and its "Verification record" table (new file; written by hand under `speckit.tdd.setup` Phases 2–3, per contracts/tdd-profile.md and research R7)
- red: n/a for a document. The behavior's failure mode is a command recorded without being run; each command was run first, from this worktree, against the target `where` resolved (feature `specs/003-tdd-extension`, tree `/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension`, folder `.fork/ci`):
  - `node .fork/ci/bin/tdd.mjs single .fork/ci/test/runtimes.test.mjs "deno runtime: deno.json root, code vs tests, sandboxed command without --allow-net"` -> only that test ran (`✔ deno runtime: …`), `tests=1 pass=1 fail=0 → pass`, exit 0
  - `node .fork/ci/bin/tdd.mjs single .fork/ci/test/runtimes.test.mjs "no test is named this"` -> `tests=0 pass=0 fail=0 → no tests matched "no test is named this"`, exit **3**
  - `node .fork/ci/bin/tdd.mjs file .fork/ci/test/runtimes.test.mjs` -> `tests=9 pass=9 fail=0 → pass`, exit 0
  - `node .fork/ci/bin/tdd.mjs suite` -> `→ sql-unverified`, exit 0, `real 4.97` (`/usr/bin/time -p`)
- green: profile recorded with `verified: [single, file, suite]`, `suite_baseline: green`, `suite_seconds: 5` naming the measured target, `detected_at: d3ad0cd`, and a reason and consequence for each null (watch, coverage, mutation, acceptance, property, approval, contract). Every exemplar and helper path was opened before recording: `recipes/atomizer/atomize-text.test.mjs` (fetch stub, `runScript()` at line 63, `test-support/fetch-stub.mjs`), `integrations/hermes-agent-memory/plugin/tests/test_ob1_provider.py` (offline, `urlopen` mocked), `.fork/ci/test/runtimes.test.mjs`, `.fork/ci/test/fixtures.mjs`, `.fork/ci/test/helpers/{folder,git-fixture}.mjs`. Suite `node --test .fork/ci/test/` -> 132 passed, 0 failed
- refactor: none needed
- notes: Phase 4 (constitution) skipped by instruction; stream D owns Principle IV. Deviation (R7/I22): the test list predates the profile. The profile body adds, beyond the contract's list: the exit-code table, the `describe` name-matching rule probed in U14, deno's substring `--filter`, and the SQL `file` op not applying bootstrap.
- commit: (this commit)

## Corrections to earlier entries in this fragment

Past entries are not edited; this entry corrects them.

- **Line references** (checked with `git show <cycle commit>:<file> | grep -n`):
  - U13: `runtimeFor` is at `.fork/ci/lib/tdd-commands.mjs:22`, not `:24`.
  - U14: `buildCommand` is at `:33` and `escapeRegex` at `:43`, not `:35`/`:45`.
  - U15: `nodeCounts` is at `:49`, not `:48`.
  - U19: `nodeScriptRunner` is at `:74`, not `:73`.
  - U23: `runTests` is at `.fork/ci/bin/tdd.mjs:51`, not `:56`. `:56` is its `unsupported` check.
- **U16 refactor line**: the `base` reshape was part of the green edit, not a separate refactor step. The suite ran once after it (117 passed), not again.
- **Real plans, checked with `where` after A2**:
  - `SPECIFY_FEATURE_DIRECTORY=specs/001-fork-ci` gives `tdd: plan has no Contribution folder (specs/001-fork-ci/plan.md)`, as R3 expects.
  - `specs/002-stage-pr-532-atomizer-default` gives `tdd: worktree not found: /Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default`, because that worktree has been removed.
  - The Worktree line is resolved before the folder line, so 001's folder error appears only while its backticked `/Users/mfelker/Projects/ob1` path is a git work tree. Otherwise 001 fails earlier, with `worktree not found`.

<!-- stream overrides (merged T022) -->

## Cycle: U35 overrides pin their base and add only the fork section

- test: `.fork/ci/test/tdd-overrides.test.mjs::U35 tdd-test-quality-rubric.md override pins its base and adds only the fork section` and `::U35 tdd-loop-playbook.md override pins its base and adds only the fork section` (new)
- red: `node --test .fork/ci/test/tdd-overrides.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: override file missing: /Users/mfelker/Projects/ob1/.worktrees/fork-tdd-overrides/.specify/templates/overrides/tdd-test-quality-rubric.md` (same for `tdd-loop-playbook.md`)
- green: added `.specify/templates/overrides/tdd-test-quality-rubric.md` (rules S1–S4 after the test-first evidence classes table) and `.specify/templates/overrides/tdd-loop-playbook.md` (the 5-step base-red procedure after the deliberate mutant paragraph in Step 3), each a byte copy of the installed spec-kit-tdd 2.0.1 base plus a `fork-override` header with `base_sha256` and one `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->` section; plus `.specify/templates/overrides/.markdownlint-cli2.jsonc` (lint exemption). Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed. Deviation during green: the first green run failed only on the test's own `applies only when` regex, because the fork-section prose wraps across lines; the test's phrase regexes were loosened to `\s+` between words (no assertion weakened). A deliberate mutant (one byte appended to the playbook override) then failed with `override diverges from base outside the fork section`, and was restored.
- commit: (this commit)

<!-- stream advisory (merged T022) -->

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

## Cycle: U36 selfTestNeeded fires for the TDD overrides, extension, constitution and fork README

- test: `.fork/ci/test/self-test-needed.test.mjs::U36 true for TDD overrides, the tdd extension, the constitution and .fork/README.md` (new; includes near-miss negatives such as `.specify/extensions/tddx/`, `.specify/memory/tdd-profile.md` and `.fork/README.md.bak`)
- red: `node --test --test-name-pattern="U36" .fork/ci/test/self-test-needed.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .specify/templates/overrides/tdd-loop-playbook.md` / `actual: false,` / `expected: true,` (1 failed)
- green: `.fork/ci/lib/self-test-needed.mjs:5-10` adds the `.specify/templates/overrides/` and `.specify/extensions/tdd/` prefixes and the exact paths `.specify/memory/constitution.md` and `.fork/README.md`; the existing `.fork/ci/` and `fork-ci.yml` triggers are unchanged. Suite `node --test .fork/ci/test/` -> 111 passed, 0 failed
- refactor: none needed (prefix and exact lists written at green)
- commit: (this commit)
- notes: deviation. The existing test `false for other paths, including other fork-only paths` asserted `.fork/README.md` -> `false`, which U36 explicitly supersedes. Only that one path was removed from its first assertion (`['specs/001/spec.md', '.fork/README.md', 'recipes/a/index.ts']` -> `['specs/001/spec.md', 'recipes/a/index.ts']`). The test name and its other assertions are unchanged, and the U36 test pins `.fork/README.md.bak` as still `false`.

<!-- stream docs (merged T022) -->

## Cycle: A13 Principle IV names the cycle log, base-red rule and hook

- test: `.fork/ci/test/tdd-docs.test.mjs::A13 constitution Principle IV names the cycle log, the staged base-red rule and the hook` (new)
- red: `node --test --test-name-pattern="A13" .fork/ci/test/tdd-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: Principle IV must name tdd/cycle-log.md as the red evidence` (1 failed)
- green: amended `.specify/memory/constitution.md` to v1.3.0 (Principle IV: cycle log as red evidence for the fork and upstream-bound lanes, staged base-red rule pointing to `.specify/templates/overrides/`, mandatory `before_implement` hook, disabling with `enabled: false` plus a reason in the plan; Gate 1 includes `speckit.tdd.verify` PASS or PASS_WITH_GAPS; fork-ci TDD status advisory; Sync Impact Report entry prepended). The first green attempt still failed on `Principle IV must tie the cycle log to the fork and upstream-bound lanes`; the sentence was reworded (the test was not changed). Suite `node --test .fork/ci/test/` -> 102 passed, 0 failed
- refactor: none needed
- commit: (this commit)

## Cycle: A14 Runbook TDD workflow covers the test list, loop, audit and disabling the hook

- test: `.fork/ci/test/tdd-docs.test.mjs::A14 runbook TDD workflow covers the test list, the loop, the audit before merge, the advisory and disabling the hook` (new)
- red: `node --test --test-name-pattern="A14" .fork/ci/test/tdd-docs.test.mjs`
  -> `AssertionError [ERR_ASSERTION]: .fork/README.md must have a "## TDD workflow" section` (1 failed)
- green: added the "TDD workflow" section to `.fork/README.md` (`tdd.plan` via the optional `after_tasks` hook adding the `[U#]`/`[A#]` markers, the loop via the mandatory `before_implement` hook, `tdd.verify` before merge, the staged base-red rule, the advisory CI status, the per-checkout `.specify/feature.json` and `tdd.mjs where`, credential blanking, disabling the hook with `enabled: false` plus a reason, and the extension version record with upgrade steps); also updated the Lanes table and "Stage an upstream PR" steps 3–5. Suite `node --test .fork/ci/test/` -> 103 passed, 0 failed
- refactor: none needed
- commit: (this commit)
