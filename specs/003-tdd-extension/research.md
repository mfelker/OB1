# Research: Adopt the spec-kit-tdd extension

Phase 0 decisions. The Technical Context has no open NEEDS CLARIFICATION items (FR-014 was clarified as option B).

## R1: Verified installation (FR-001)

- **Decision**:
  1. Download `tdd-2.0.1.zip` from the v2.0.1 release into its own empty scratch folder, and record its SHA-256.
  2. Unzip it into a second empty folder.
  3. For every file in the zip, compare its git blob SHA (`git hash-object`) with the blob at tag `v2.0.1` (`55221d4`) from `gh api repos/d0whc3r/spec-kit-tdd/git/trees/v2.0.1?recursive=1`.
  4. Fail if any file differs, is missing from the tag, or sits outside `extension.yml`, `README.md`, `LICENSE`, `commands/` or `templates/` (the release's `.extensionignore` set).
  5. Install the checked folder with `specify extension add --dev <unzipped dir>` from the worktree root.
  6. Record the zip's SHA-256 and the tag commit in the runbook.
- **Rationale**:
  - The tag commit `55221d4` equals the `main` commit whose files were reviewed on 2026-11-25, so the tag equals the reviewed content.
  - `--dev` installs the exact folder that was checked. `--from <url>` would download again after the check (time-of-check/time-of-use).
  - The community catalog lists only v1.1.2, and it's discovery-only, so a catalog install isn't possible anyway.
- **Alternatives considered**:
  - `specify extension add tdd --from <zip-url>`: re-downloads, so the checked bytes aren't the installed bytes.
  - Vendoring a git clone: carries the author's dev tooling, which `.extensionignore` excludes.

## R2: Adapter location and interface

- **Decision**: `.fork/ci/bin/tdd.mjs` with the subcommands `where`, `single <file> <name>`, `file <file>` and `suite`. The logic lives in `lib/tdd-target.mjs` (resolution) and `lib/tdd-commands.mjs` (argv and output parsing).
  - The profile calls `node .fork/ci/bin/tdd.mjs single {file} "{name}"` and so on, using the extension's only placeholders.
  - `where` prints the resolved target, for `tdd.setup` and debugging.
- **Rationale**: the profile allows only `{file}`, `{name}` and `{files}`, and has one fixed working directory per stack. Feature context therefore has to be resolved at call time. `.fork/ci` already holds the runtime detection and the exec helper, and the `self-test` job already runs its tests.
- **Alternatives considered**:
  - Re-running `tdd.setup <path>` for each feature: it rewrites the shared profile every time, and two features in flight would conflict.
  - Overriding the extension's command files: not possible through the template override stack, which covers templates only, and editing the extension is forbidden.

## R3: Resolving the feature to a tree and folder (FR-004, FR-007)

- **Decision**:
  - **Repo root**: three levels above `bin/tdd.mjs`. That's the checkout the script is invoked from (fork `main`), independent of the caller's working directory.
  - **Feature directory**: the same order spec-kit uses. Take `SPECIFY_FEATURE_DIRECTORY` if set, else `feature_directory` from `.specify/feature.json`. If neither exists, error.
  - **Tree**: from `plan.md`, the first backticked absolute path on the line starting `**Worktree**`. If the line is missing, or its value is a template placeholder (it contains `[` or `/absolute/path`), the tree is the repo root.
    - The tree must exist and be a git work tree; otherwise error.
  - **Folder**: from `plan.md`, the first backticked path on the line starting `**Contribution folder**`, with a trailing `/` stripped. It must exist inside the tree.
    - Placeholders or `N/A` give an error naming the missing field.
- **Rationale**: specs 001–003 already carry these lines. The plan template already has the Worktree line, and the tasks for this feature make Contribution folder mandatory with a real path, even for fork features. Errors are explicit, so the adapter never falls back to another folder (FR-007).
- **Alternatives considered**:
  - Inferring from the branch name: spec-kit and the extension both forbid it.
  - Inferring from the caller's working directory: the extension runs everything from the profile's `cwd: .`, so it carries no feature information.

## R4: Choosing a runtime for a file (FR-005)

- **Decision**:
  - Call `scanRuntimes(<tree>/<folder>, <folder>)` and pick the runtime whose `root` contains the file and whose `testFiles` include it.
  - A file path may be absolute, which must be inside the tree, or relative. A relative path is tried against the folder, then the tree, then the repo root; the last case covers paths given as `.worktrees/<wt>/…`.
  - A file that matches no runtime's test pattern gives an error that names the expected patterns.
- **Rationale**: reusing fork-ci's own detection means the loop and CI can't disagree about which runner owns a file (spec Assumptions), and mixed-runtime folders (Deno plus Node) are handled exactly as fork-ci handles them.
- **Alternatives considered**: a second, adapter-local detection, which would drift.

## R5: Per-runtime commands and the zero-match guard (FR-006)

All commands run with the runtime's root directory as their working directory.

| Runtime | `file` | `single` (name) | Zero-match signal |
|---------|--------|-----------------|-------------------|
| node-plain | `node --test --test-isolation=none <f>` | the same plus `--test-name-pattern=<^escaped$>` | `ℹ tests 0`; exit is 0, so the adapter exits **3** |
| deno | fork-ci's deno argv plus `<f>` | plus `--filter <name>` | `ok \| 0 passed` / "No test modules"; the adapter exits 3 |
| python | `python -m pytest -q <f>` | plus `-k <name>` | pytest exit 5 ("no tests ran"); the adapter exits 3 |
| node-script | `npm test -- <f>` when the test script is vitest or jest | vitest: `npx vitest run <f> -t <name>`; jest: `npx jest <f> -t <name>` | "No test found" / 0 tests; the adapter exits 3. Other runners: `single` exits **4** "unsupported" |
| sql | `psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` | exits 4 (unsupported) | N/A |

- **Evidence (2026-11-25, Node 26.13)**:
  - Under the default process isolation, `node --test --test-name-pattern='^no-such$' .fork/ci/test/paths.test.mjs` reports `tests 1, pass 1` and exits 0. The file-level wrapper counts as a passing test: **a false green**.
  - With `--test-isolation=none`, a zero-match gives `tests 0` and a match gives `tests 1`. Both still exit 0, so the count check is required.
- **Rationale**: the extension's setup refuses a single-test command that reports success on a zero match. This guard is what makes the profile pass that check.
- **Alternatives considered**: TAP parsing under process isolation. The child's `1..0` shows zero matches, but it's nested and fragile across Node versions.

## R6: Suite command

- **Decision**: `suite` runs `.fork/ci/bin/run-folder.mjs --path <folder> --mode strict --origin fork --out <tmp>` with the tree as its working directory. It prints a one-line summary per runtime, including test counts parsed from each excerpt.
  - Exit 0 when the outcome is `pass` or `sql-unverified`. `sql-unverified` is advisory in fork-ci, and it's what `.fork/ci` itself returns, because `sql/bootstrap.sql` has no `tests/verify.sql`.
  - Exit 1 for any other outcome.
  - `run-folder` copies `package-lock.json` handling as-is.
- **Rationale**: it's the exact command fork-ci's test job runs, so "suite green locally" means "green in CI" for that folder.
- **Evidence**: `run-folder --path .fork/ci` takes 5.9 s, with node-plain `pass` (101 tests) and sql `sql-unverified`.

## R7: The profile (FR-009)

- **Decision**: write `.specify/memory/tdd-profile.md` in the extension's "Profile format".
  - **One stack**, `fork-adapter`, with `cwd: .`:
    - `single: node .fork/ci/bin/tdd.mjs single {file} "{name}"`
    - `file: node .fork/ci/bin/tdd.mjs file {file}`
    - `suite: node .fork/ci/bin/tdd.mjs suite`
    - `coverage`, `mutation`, `acceptance` and `property` are all `null`, with reasons.
    - `exemplar`: the unit exemplar is `.fork/ci/test/runtimes.test.mjs`.
    - `helpers`: `.fork/ci/test/fixtures.mjs` and `.fork/ci/test/helpers/`.
  - **Body**:
    - Per contribution folder, imitate that folder's own existing tests first.
    - Exemplars per runtime: node-plain `recipes/atomizer/atomize-text.test.mjs`; Python `integrations/hermes-agent-memory/tests/`.
    - Constraints: no repo-wide runner; live scripts such as `test-atomize.mjs` need empty keys; Deno and Python must be available locally.
  - **Verification**:
    - Each command is run against spec 003's own target (`.fork/ci`) before it's recorded, including a zero-match single test, which must exit 3.
    - The steps of the extension's setup command are followed by hand, because newly installed skills may not load in the running session (R11).
- **Rationale**: one stack, because the adapter makes the stack choice per call. `verified:` lists only what was executed.

## R8: Template overrides for staged PRs (FR-010)

- **Decision**:
  - Copy `tdd-test-quality-rubric.md` and `tdd-loop-playbook.md` from the installed extension into `.specify/templates/overrides/` (the first match in the extension's own resolution order). Add one clearly delimited section to each, marked `<!-- fork: staged-pr evidence -->`:
    - **Rubric**: a new evidence rule for lane "staged upstream PR". A behavior whose cycle log records (a) a red at the PR base (`git merge-base HEAD upstream/main`), with the real failure line, and (b) a green at the PR head, is classified `PROVEN`. History ordering is not required for those behaviors. Anything without both records stays `TEST_AFTER`, so the rule fails closed.
    - **Playbook**: for the staged lane, the "test passes on first run" path records the base-red check (check out the base copy of the changed source file, run, restore, then confirm with `git status --untracked-files=no`) as the red evidence, instead of a deliberate mutant.
  - Each override's header records `base: spec-kit-tdd 2.0.1` and the SHA-256 of the original template.
  - `test/tdd-overrides.test.mjs` fails when the installed template's hash no longer matches. An extension update then forces a review of the override (spec edge case).
- **Rationale**: the override stack is the extension's documented customization point, and it leaves the installed extension untouched. Base-red is the evidence spec 002 used (FR-006 there), and it's stronger than a mutant.
- **Alternatives considered**:
  - Recording staged behaviors as characterization: that makes them `NOT_APPLICABLE`, which loses the evidence that the tests catch the regression.
  - Forking the extension: rejected, because it would make updates manual.

## R9: Advisory fork-ci TDD status (FR-014)

- **Decision**: add `lib/tdd-status.mjs`, a pure function `tddStatus(rootDir, headRef)`.
  - It finds `specs/*/spec.md` whose `**Feature Branch**` line names `headRef` in backticks.
  - For each matching feature it reports:
    - whether `tdd/cycle-log.md` exists;
    - whether `tdd/verification.md` exists;
    - the `verdict` from the verification report's frontmatter (`PASS` / `PASS_WITH_GAPS` / `FAIL` / `BLOCKED`), or `missing`.
  - No match gives `no feature linked`. An empty `headRef` (a push event) gives no section.
  - `renderReport` takes an optional `tdd` argument and appends a `### TDD status (advisory)` table. `bin/verdict.mjs` computes it from the checkout and `HEAD_REF`, which the workflow passes as `HEAD_REF: ${{ github.head_ref }}` through `env:` (untrusted values never inline).
  - `computeVerdict` is unchanged. A test asserts the conclusion is the same with and without each TDD status.
- **Rationale**:
  - The PR's merge checkout contains fork `main`'s `specs/`, so a staged or contrib PR's feature folder is present even though the PR branch has no `specs/`.
  - `Feature Branch` is already recorded in every spec (002: `stage/pr-532-atomizer-default`; 003: `fork/tdd-extension`).
- **Alternatives considered**:
  - Linking by PR title: too free-form.
  - Linking by changed `specs/` paths: staged branches carry none.

## R10: Plan template and tasks template updates (FR-012)

- **Decision**:
  - **Plan template**: the Lane block requires real values on the `**Worktree**` line ("none (fork-`main` checkout)" for fork features done in place) and on the `**Contribution folder**` line, both read by the adapter. A fork-only feature names its main code folder, for example `.fork/ci`.
  - **Tasks template**:
    - Test tasks come from `tdd/test-list.md` and carry `[U#]`/`[A#]` markers.
    - The loop runs through the mandatory hook. Never tick a marked task by hand.
    - The pre-merge gate includes `tdd.verify` (PASS or PASS_WITH_GAPS) and the advisory status.
    - The staged-lane base-red step points to the override.
- **Rationale**: the adapter depends on those two plan lines, and the extension's `plan` and `run` depend on the markers.

## R11: Dogfooding this feature

- **Decision**:
  - Implement in the worktree. Install the extension first (task 1), but drive the adapter's red-green cycles **by hand**, writing `specs/003-tdd-extension/tdd/test-list.md` and `tdd/cycle-log.md` in the extension's formats with real red output.
  - After the merge, run `tdd.verify` on 003 as well as on 002. If the extension's skills aren't loaded in the session, its command file is followed as written.
- **Rationale**:
  - The mandatory hook lives in the fork-`main` checkout's `.specify/extensions.yml`, which the session reads. It isn't there until this feature lands.
  - Skills installed mid-session may not be invocable.
  - Following the format by hand still produces auditable evidence.

## R12: Landing

- **Decision**:
  - Land through a fork PR `fork/tdd-extension` → `main`, so that `self-test` (101+ tests and actionlint) and the new advisory section run on a real PR. That's evidence for SC-007.
  - `OB1 Review` fails on fork-only PRs (runbook). Merge with `gh pr merge --merge --admin` (the documented bypass) **only after the owner confirms**, and once `fork-ci-verdict` is green.
- **Alternatives considered**: a local `git merge --no-ff` and push, which the fork lane allows. It skips the PR run that exercises FR-014.

## R13: Housekeeping

- **Decision**: add `extensions/.cache/` to `.specify/.gitignore`. It was created by `specify extension search` and is untracked today.
