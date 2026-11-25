# Quickstart: validate the spec-kit-tdd adoption

```bash
W=/Users/mfelker/Projects/ob1/.worktrees/fork-tdd-extension   # this feature's worktree
M=/Users/mfelker/Projects/ob1                                   # fork-main checkout
cd "$W"
```

## Prerequisites

- Node ≥ 22.8 (26 locally and in CI). `deno` and `python3` with `pytest` are needed only for the runtime checks in §3.
- `.specify/feature.json` points to `specs/003-tdd-extension` (in the checkout being tested).

## 1. The installed extension matches the reviewed release (FR-001)

```bash
specify extension list            # shows tdd 2.0.1, enabled
grep -n 'speckit.tdd' .specify/extensions.yml
```

**Expected**:

- Hooks are registered: `after_tasks` (optional), `before_implement` (**optional: false**), `after_implement` (optional), `after_converge` (optional).
- The verification log from research R1 shows 0 differing files and records the zip's SHA-256.

## 2. The adapter resolves the right tree and folder (US2)

```bash
node .fork/ci/bin/tdd.mjs where
```

**Expected**: JSON with `tree` = `$W`, `folder` = `.fork/ci`, `lane` = `fork`, and a `node-plain` runtime listing the `test/*.test.mjs` files.

## 3. Single, zero-match, file and suite (FR-005, FR-006)

```bash
node .fork/ci/bin/tdd.mjs single .fork/ci/test/paths.test.mjs "CATEGORIES lists the seven upstream contribution categories"; echo "exit=$?"
node .fork/ci/bin/tdd.mjs single .fork/ci/test/paths.test.mjs "no such test xyz"; echo "exit=$?"
node .fork/ci/bin/tdd.mjs file .fork/ci/test/paths.test.mjs; echo "exit=$?"
node .fork/ci/bin/tdd.mjs suite; echo "exit=$?"
```

**Expected** (contract rows A7, A9, A11, A12):

- The single test gives `tests=1 pass=1`, exit 0.
- The zero-match name gives `no tests matched`, exit **3**.
- The file run passes, exit 0.
- The suite reports `sql-unverified` with node-plain `pass`, exit 0.

Repeat with a staged-style target to check the worktree routing. Point `SPECIFY_FEATURE_DIRECTORY` at a fixture feature whose plan names another worktree; the automated tests cover this in `tdd-cli.test.mjs`.

## 4. The adapter's own tests, and the full fork-ci self-test

```bash
node --test .fork/ci/test/
```

**Expected**: all of them pass (101 existing plus the new `tdd-*` tests). `tdd-overrides.test.mjs` confirms both overrides match their pinned base.

## 5. Advisory TDD status (FR-014, SC-007)

On the fork PR for this feature, open the `fork-ci-verdict` job summary.

**Expected**:

- A `### TDD status (advisory)` table shows a row for `specs/003-tdd-extension` (contract T1–T6).
- `fork-ci-verdict` has the same conclusion it would have without the section.

## 6. Rules match the tooling (US4, SC-005)

Read `.specify/memory/constitution.md` Principle IV (v1.3.0), `.fork/README.md` (the TDD workflow per lane) and `.specify/templates/tasks-template.md`.

**Expected**: they name the cycle log as red evidence, the test list as the source of test tasks, the staged base-red rule, and how to disable the mandatory hook. `/speckit-analyze` reports 0 contradictions.

## 7. Calibration (US5, FR-013)

From `$M`, after the merge, run the extension's verify command on spec 002, then on spec 003:

```bash
# /speckit-tdd-verify 002-stage-pr-532-atomizer-default   then   /speckit-tdd-verify 003-tdd-extension
```

**Expected**:

- Each run writes a `specs/<feature>/tdd/verification.md` with a verdict.
- On spec 002, C1 and K4 are classified per the override (contract S1). Every other finding is either justified by the evidence, or a fork-integration gap that this feature fixes before it's considered done.
