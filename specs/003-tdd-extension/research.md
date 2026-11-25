# Research: Adopt the spec-kit-tdd extension

These are the Phase 0 decisions. FR-014 was clarified as option B, so no NEEDS CLARIFICATION items remain. The fixes from the 2026-11-25 `/speckit-analyze` (fresh subagent) are folded in and tagged with their finding ids.

## R1: Verified installation (FR-001)

- **Decision**:
  1. Download `tdd-2.0.1.zip` from the v2.0.1 release into an empty scratch folder and record its SHA-256.
  2. Unzip it into a second empty folder.
  3. For every file in the zip, compare its git blob SHA (`git hash-object`) with the blob at tag `v2.0.1` (`55221d4`), taken from `gh api repos/d0whc3r/spec-kit-tdd/git/trees/v2.0.1?recursive=1`.
  4. Fail if any file differs, is missing from the tag, or sits outside `extension.yml`, `README.md`, `LICENSE`, `commands/` or `templates/`.
  5. Install the checked folder with `specify extension add --dev <unzipped dir>` from the worktree root.
  6. Write the verification table to **`specs/003-tdd-extension/evidence/r1-verify.md`**. It's committed with the feature, because the scratchpad doesn't last. *(C4)*
- **Rationale**:
  - The tag commit `55221d4` is the same `main` commit whose files were reviewed.
  - `--dev` installs exactly the folder that was checked; `--from` would download again after the check.
  - The community catalog lists only v1.1.2, and only for discovery, so it can't install this version.
- **Alternatives considered**: `--from <zip-url>` (the download happens after the check), and vendoring a git clone (it would carry the author's dev tooling).

## R2: Adapter location and interface

- **Decision**: add `.fork/ci/bin/tdd.mjs` with the subcommands `where`, `single <file> <name>`, `file <file>` and `suite`. The logic lives in `lib/tdd-target.mjs` (resolution), `lib/tdd-commands.mjs` (`buildCommand`, output parsing) and `lib/tdd-env.mjs` (child environment).
  - The profile calls `node .fork/ci/bin/tdd.mjs single {file} "{name}"` and so on.
  - Every summary line names the feature it used (`[tdd] feature=specs/…`), so running against the wrong feature is visible. *(I5)*
- **Rationale**: the profile allows only `{file}`, `{name}` and `{files}`, and one fixed `cwd` per stack, so the feature context has to be resolved when the command runs.
- **Alternatives considered**:
  - Running `tdd.setup <path>` for each feature: it rewrites the shared profile, and two features in flight would conflict.
  - Overriding the extension's commands: not possible, because only templates can be overridden.

## R3: Plan-line grammar and resolution (FR-004, FR-007) *(I3, I4, I21)*

- **Repo root**: three levels above `bin/tdd.mjs`, i.e. the checkout the script is invoked from.
- **Feature directory**: `SPECIFY_FEATURE_DIRECTORY` if set, else `feature_directory` from `.specify/feature.json`, else the error `no active feature`.
- **Lane**: from the line starting `**Lane**`. A value containing `[` is an unfilled placeholder, which is an error.
  - `staged upstream PR` gives `staged`; `upstream-bound` gives `upstream-bound`; `fork feature` gives `fork`.
  - Any other value is the error `unknown lane`.
- **Worktree**: from the line starting `**Worktree**`. The value is the text after the first `:`, with `*(…)*` annotations removed. The rules are checked in this order:
  1. The value contains `[` (a placeholder): error `plan Worktree is a placeholder`.
  2. The value starts with `none`, case-insensitive (for example "none (fork-`main` checkout)"): no worktree.
  3. Otherwise the first backticked token **must be an absolute path**; anything else is the error `plan Worktree must be an absolute path or "none"`.
  4. A line that is missing counts as "none", but **only for lane `fork`**. For `staged` and `upstream-bound` it's the error `plan Worktree required for <lane> lane` (FR-007).
  5. "No worktree" means the tree is the repo root. A named worktree must exist and be a git work tree, else the error `worktree not found`.
- **Contribution folder**: from the line starting `**Contribution folder**`. The rules are checked in this order:
  1. The value contains `[`: placeholder error.
  2. The value starts with `N/A`: error `plan has no Contribution folder`. This is checked before backticks, so spec 001's "N/A. Fork infrastructure lives in `.fork/ci/`" is an error, not `.fork/ci`.
  3. Otherwise the first backticked token, without a trailing `/`. It must be repo-relative (no leading `/`, no `..`).
- **Existing plans** (corrects the earlier claim that specs 001–003 already carry these lines):
  - 001 has `N/A` and gives the folder error. It's a pre-adoption feature that isn't retrofitted.
  - 002 has an absolute Worktree, `recipes/atomizer/` and lane staged.
  - 003 has an absolute Worktree, `.fork/ci` and lane fork.
  - The template placeholders give placeholder errors.
- **Rationale**: one explicit grammar, with no silent fallbacks.

## R4: Choosing a runtime for a file (FR-005) *(I4)*

- **Decision**:
  - Resolve `file` like this: an absolute path is used as is; a relative path is tried against the folder, then the tree, then the repo root, and the first that exists wins.
  - **Then, in every case**, check that the real path is inside the tree, else the error `outside the target tree`.
  - Pick the runtime from `scanRuntimes(<tree>/<folder>, <folder>)` whose `root` contains the file and whose `testFiles` include it.
- **Rationale**: this reuses fork-ci's detection, so the loop and CI can't disagree about which runner owns a file.

## R5: Per-runtime commands and the zero-match guard (FR-006) *(I12, I15, I18, I23)*

Every command runs with **cwd = tree + the runtime's `root`** (data-model `RuntimeCommand.cwd`).

| Runtime | `file` | `single` (name) | Zero-match signal (adapter exits 3) |
|---------|--------|-----------------|-------------------------------------|
| node-plain (uses `node:test`) | `node --test --test-isolation=none --test-reporter=spec <f>` | the same plus `--test-name-pattern=<^escaped$>` | `ℹ tests 0` (Node still exits 0) |
| node-plain plain script (`test-*.mjs` that doesn't import `node:test`) | `node --test --test-reporter=spec <f>` (process isolation: the file is one test) | **exit 4** "plain script, no named tests; use `file`" | N/A |
| deno | `runtime.command` (fork-ci's argv) plus `<f>` | plus `--filter <name>` | `0 passed` / "No test modules found" |
| python | `<venv>/bin/python -m pytest -q <f>` | plus `-k <name>` | pytest exit 5 |
| node-script | vitest: `npx vitest run <f>`; jest: `npx jest <f>` | plus `-t <name>` | "No test files found" / `Tests: 0` |
| node-script, other runner | `npm test -- <f>` | exit 4 | N/A |
| sql | `psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` | exit 4 | N/A |

- **Reporter**: `--test-reporter=spec` is passed explicitly, so the `ℹ tests N` parser doesn't depend on whether stdout is a TTY.
- **Node version**: the adapter refuses to run on Node < 26 (exit 2), because 26.13 is the only version this behavior was verified on. *(I12: earlier releases had only the experimental flag, and the default reporter differs.)*
- **Python environment**: `single` and `file` use a cached venv at `<os tmp>/fork-tdd-venv-<sha1(tree+root)>`. It is created with `python3 -m venv`, then `pip install -q pytest [-r requirements.txt]`, and rebuilt only when the `requirements.txt` hash changes (a stamp file). It mirrors run-folder's per-run venv without reinstalling every cycle.
- **`buildCommand`**: the new function is called `buildCommand`, not `commandFor`. Deno flags come from `runtime.command`, which is `scanRuntimes`' own argv, not a copy. *(I23)*
- **Output**: the child's stdout and stderr are **streamed live** to the adapter's own stdout and stderr and captured in full for count parsing. They aren't truncated to the last lines, so the red evidence stays complete. *(I11)*
- **Evidence (2026-11-25, Node 26.13)**:
  - Under process isolation, a zero-match name reports `tests 1, pass 1` (a false green).
  - With `--test-isolation=none`, a zero-match gives `tests 0` and a match gives `tests 1`, both exiting 0.

## R6: Suite command (FR-017, FR-016) *(C1, C2, I17)*

- **Decision**: `suite` runs `.fork/ci/bin/run-folder.mjs --path <folder> --mode strict --origin fork --out <tmp>` with the tree as cwd and the env from R10.

  | Outcome | Exit | Notice |
  |---------|------|--------|
  | `pass` | 0 | — |
  | `sql-unverified` | 0 | "sql unverified (advisory)" |
  | `no-tests` | 0 | "empty baseline: no tests yet" |
  | `exempt` | 0 | "empty baseline: docs-only" |
  | folder missing in the tree (a new contribution) | 0 | "empty baseline: folder does not exist yet" |
  | anything else | 1 | — |

- **Lockfiles**: before running, `suite` records which tracked lockfiles (`package-lock.json`, `deno.lock`) are clean. After the run, it restores any that run-folder's `npm install` modified (`git checkout -- <file>`) and says so. That keeps the staged override's "no modified tracked files" check valid. *(I17)*
- **Rationale**:
  - The loop requires a green baseline before its first cycle. Without these rules, a brand-new contribution folder, a staged PR with no tests (constitution: "the owner writes them") or a docs-only feature would read as a red baseline, and the loop would refuse to start.
  - The `no-tests` CI failure is exactly what the loop exists to fix.

## R7: The profile (FR-009) *(I13, I16, I19, I22, I24)*

- **Decision**: write `.specify/memory/tdd-profile.md` with one stack, `fork-adapter`, `cwd: .`. The commands are given in contracts/tdd-profile.md.
  - **`test_glob`** is derived from fork-ci's `TEST_PATTERNS` exactly: `*.test.*`/`*.spec.*` (ts/tsx/js/mjs/cjs), `*_test.ts/js/mjs` (deno), `test-*.mjs` (node-plain), `test_*.py`/`*_test.py`, `tests/verify.sql`.
  - **Exemplars**: node-plain `recipes/atomizer/atomize-text.test.mjs`; Python `integrations/hermes-agent-memory/plugin/tests/test_ob1_provider.py`; fork tooling `.fork/ci/test/runtimes.test.mjs`. Each one is opened before it's recorded.
  - **Body**:
    - Shell quoting: the agent's shell expands `"{name}"` first, so a name containing `"`, `$` or a backtick must be escaped by the caller.
    - `suite_seconds` is per target, so the profile records the measured target alongside the value.
    - npm and pip install on every `suite` run (network, slow).
- **Verification**: each command is run against spec 003's own target before it's recorded, including the zero-match (exit 3). The setup steps are followed by hand.
- **Ordering**: the extension makes the profile a precondition of `tdd.plan`. This feature writes its test list (T006) before the profile exists (T011), because the profile depends on the adapter it tests. The cycle log's baseline entry records this as a deviation. *(I22)*

## R8: Template overrides for staged PRs (FR-010)

- **Decision**:
  - Copy `tdd-test-quality-rubric.md` and `tdd-loop-playbook.md` from the installed extension into `.specify/templates/overrides/`.
  - Add one delimited section to each, `<!-- fork: staged-pr evidence -->` … `<!-- /fork -->`, with the rules S1–S4 and the base-red procedure from contracts/staged-evidence-override.md.
  - The header carries `base: spec-kit-tdd 2.0.1` and the original's SHA-256. `test/tdd-overrides.test.mjs` pins both.
- **Rationale**: the override stack is the extension's documented customization point. Base-red is stronger evidence than a mutant.

## R9: Advisory fork-ci TDD status (FR-014) *(C6, I20)*

- **Decision**: `lib/tdd-status.mjs` exports the pure function `tddStatus(rootDir, headRef)`.
  - **Matching**: it compares the `**Feature Branch**` backticked value of every `specs/*/spec.md` literally against `headRef`.
  - **What it reads**: for each match, the existence of `tdd/cycle-log.md` and `tdd/verification.md`, and the verdict from the report's frontmatter: `PASS` / `PASS_WITH_GAPS` / `FAIL` / `BLOCKED`, or `missing`, or `unreadable`.
  - **Wiring**: `bin/verdict.mjs` wraps the call in `try`/`catch`. An exception renders `TDD status unavailable: <message> (advisory)`, and the exit code is unchanged.
  - **Workflow**: `HEAD_REF` reaches the verdict step only through `env:`.
- **Rationale**: the PR's merge checkout contains fork `main`'s `specs/`, and every spec records its Feature Branch.

## R10: Child environment (FR-016) *(C2)*

- **Decision**: add `lib/tdd-env.mjs`, which builds `childEnv(base)` for every process the adapter starts, including run-folder:
  - It removes `NODE_TEST_CONTEXT`.
  - It sets these to the empty string: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, and every variable whose name ends in `_API_KEY`, `_TOKEN`, `_SECRET` or `_SERVICE_ROLE_KEY`.
- **Rationale**:
  - An empty string wins over `.env.local` in the recipes' `loadEnv`, because it checks `key in env`. Deleting the variable instead would let `.env.local` fill it.
  - Spec 002 needed hand-written `KEY=` prefixes; the adapter makes them automatic, and the loop can't opt out.
  - The live scripts' sanity paths (`test-atomize.mjs`) then skip cleanly.

## R11: Dogfooding and calibration timing *(D2, I8, C3, C5)*

- **Decision**:
  - **Implementation** runs in the worktree. The adapter's red-green cycles are driven by hand, under the extension's rules, and logged in `specs/003-tdd-extension/tdd/` in its formats.
  - **No `/speckit-*` command runs from the worktree.** That's the constitution's rule. `tdd.mjs` isn't a spec-kit command.
  - **After the merge, from the fork-`main` checkout**:
    1. Run the `tdd.verify` procedure in fresh-context subagents on **spec 002**. The expected verdict is `BLOCKED` (no test list), with the reason stated.
    2. Run it on the **calibration fixture** `specs/003-tdd-extension/calibration/staged-fixture/`. This is a minimal staged-lane feature whose cycle log is produced by **really running** the base-red procedure on 002's C1 and K4 tests in a recreated 002 worktree. It also contains one behavior deliberately left without a base-red. Expected: `PROVEN` for C1 and K4, `TEST_AFTER` for the third.
    3. Run it on **spec 003**.
    4. Run a **smoke** check on a throwaway fork feature: `/speckit-implement` must stop when there's no test list, and with a one-behavior test list it must drive the loop and write a cycle-log entry.
  - **Fixes** for gaps found after the merge land through a follow-up `fork/` PR within this feature.
  - **Switching features**: before running against a feature other than the active one, the subagent switches `.specify/feature.json` (the adapter reads it) and confirms the switch with `tdd.mjs where`. Afterwards it switches back.
- **Rationale**: this satisfies the constitution's rule that spec-kit runs from fork `main`. It gives FR-010 a real positive test without retrofitting 002, and it exercises the mandatory hook end to end (US1).

## R12: Landing

- **Decision**: land through a fork PR (`fork/tdd-extension` → `main`). `OB1 Review` fails on fork-only PRs, so the merge uses `gh pr merge --merge --admin` **only after the owner confirms**, once `fork-ci-verdict` is green.
- **Merge task**: update 003's plan Worktree line to "none (fork-`main` checkout)". The worktree is removed after the merge, and the adapter refuses a missing worktree, so the post-merge calibration would otherwise fail on 003.

## R13: Housekeeping

- Add `extensions/.cache/` to `.specify/.gitignore`.

## R14: Parallel implementation with worktrees

- **Decision**: after the serial foundation (install, test list and baseline), run four independent streams, each in its own worktree `.worktrees/fork-tdd-<stream>` on a branch `fork/tdd-extension-<stream>` cut from `fork/tdd-extension`:
  - **A**: the adapter (US2), then the profile.
  - **B**: the overrides (US3).
  - **C**: the advisory (US1 status).
  - **D**: the docs (US4).
- **Shared files**: each stream writes its cycle entries to `specs/003-tdd-extension/tdd/cycle-log.d/<stream>.md`. The integrator merges each stream with `--no-ff`, appends the fragments to `cycle-log.md` in merge order, and updates `test-list.md` and `tasks.md` checkboxes. Streams never edit those three files. Stream D depends only on the contract names, not on stream A's code.
- **Rationale**: no stream touches another stream's files, the cycle log stays append-only, and checkboxes have a single writer.
