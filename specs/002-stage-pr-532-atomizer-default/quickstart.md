# Quickstart: validate staged PR #532

All commands run in the worktree unless noted:

```bash
W=/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default
cd "$W"
```

## Prerequisites

- Node 18.18+ (fork-ci uses 26).
- The worktree is on `stage/pr-532-atomizer-default` and its history starts at `8bebd77`.
- No provider key is needed. The tests set empty or dummy keys themselves.

## 1. Tests pass (US1, US2)

```bash
cd recipes/atomizer && node --test atomize-text.test.mjs test-atomize.mjs
```

**Expected**:

- All tests pass, covering contract cases C1–C4 and K1–K4.
- `test-atomize.mjs` passes by printing `skipped: no API key for openrouter`.
- The run takes under 5 s (SC-003).

## 2. Regression check against the pre-PR code (FR-006, research R7)

```bash
git checkout 8bebd77^ -- recipes/atomizer/lib/atomize-text.mjs
(cd recipes/atomizer && node --test atomize-text.test.mjs) ; echo "exit=$?"
git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs && git status --short
```

**Expected**:

- `exit=1`, and only the default-model cases fail (C1 and K4, both receiving `claude-sonnet-4-5`).
- `git status` is clean afterwards.
- Copy the failure summary into the fork PR description.

## 3. fork-ci preview (FR-008, SC-004)

```bash
node ../../.fork/ci/bin/run-folder.mjs --path recipes/atomizer --mode strict --origin fork --out /tmp/r532.json
node -e 'const r=require("/tmp/r532.json");console.log(r.outcome, r.reason ?? "")'
git status --short
```

**Expected**:

- `pass`. The baseline before this feature was `fail` with `tests failed (exit 1)`.
- `git status` lists nothing to commit.

## 4. Lane hygiene

```bash
git diff --stat upstream/main...HEAD
```

**Expected**: only `recipes/atomizer/` paths: `lib/atomize-text.mjs`, `test-atomize.mjs`, `atomize-text.test.mjs`, and `test-support/fetch-stub.mjs`. No `.specify/`, `specs/` or `.fork/` paths.

## 5. Land and record (runbook steps 5–6)

Follow `.fork/README.md` → "Stage an upstream PR", steps 5–6. The checks:

- The fork PR title ends with `(staged #532)`.
- `fork-ci-verdict` is green.
- The PR is merged with `--merge`.
- `.fork/staged-prs.md` has one `#532` row.
- The upstream PR has a comment linking the test commit.
