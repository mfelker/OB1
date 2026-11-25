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
