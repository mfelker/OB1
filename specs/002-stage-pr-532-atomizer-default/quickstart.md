# Quickstart: validate staged PR #532

All commands run from the worktree root. Steps that need the recipe folder use a subshell, so the shell stays at `W` throughout:

```bash
W=/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default
E=/Users/mfelker/Projects/ob1/specs/002-stage-pr-532-atomizer-default/evidence   # durable, on fork main
cd "$W" && mkdir -p "$E"
```

## Prerequisites

- Node 18.18+. The `--import` preload needs it; fork-ci uses 26.
- The worktree is on `stage/pr-532-atomizer-default` and its history starts at the PR head (`8bebd77`).
- No provider key is needed.
- **Keyless runs:** every command that runs `test-atomize.mjs` is prefixed with `OPENROUTER_API_KEY= ANTHROPIC_API_KEY=`. An empty variable in the environment wins over `.env.local`, so a real local key can't turn the run into a live call (contract K5).

## 1. Tests pass (US1, US2)

```bash
(cd recipes/atomizer && OPENROUTER_API_KEY= ANTHROPIC_API_KEY= node --test atomize-text.test.mjs test-atomize.mjs)
```

**Expected**:

- All tests pass: C1–C6, the network guard, and K1–K4.
- `test-atomize.mjs` passes because it prints `skipped: no API key for openrouter`.
- The run takes under 5 s (SC-003).

## 2. Regression check against the pre-PR code (FR-006, research R7)

```bash
BASE=$(git merge-base HEAD upstream/main)          # PR base; 238df6c today
git checkout "$BASE" -- recipes/atomizer/lib/atomize-text.mjs
(cd recipes/atomizer && node --test atomize-text.test.mjs) > "$E/r532-red.txt" 2>&1 ; echo "exit=$?"
git checkout HEAD -- recipes/atomizer/lib/atomize-text.mjs
git status --short --untracked-files=no            # must be empty
```

**Expected**:

- `exit=1`.
- Only C1 and K4 fail, both receiving `claude-sonnet-4-5`.
- No modified tracked files remain afterwards.

## 3. fork-ci preview (FR-008, SC-004)

```bash
OPENROUTER_API_KEY= ANTHROPIC_API_KEY= node ../../.fork/ci/bin/run-folder.mjs \
  --path recipes/atomizer --mode strict --origin fork --out "$E/r532-run-folder.json"
node -e 'const r=require(process.argv[1]);console.log(r.outcome, r.reason ?? "")' "$E/r532-run-folder.json"
git status --short
```

**Expected**:

- The outcome is `pass`. The baseline before this feature was `fail` with `tests failed (exit 1)`.
- `git status` lists nothing to commit.

## 4. Lane hygiene and gates (Quality Gates 3–5)

```bash
git diff --stat upstream/main...HEAD
npx --yes -p ajv-cli@5 -p ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s .github/metadata.schema.json -d recipes/atomizer/metadata.json
```

**Expected**:

- The diff lists only these `recipes/atomizer/` paths:
  - `lib/atomize-text.mjs`
  - `test-atomize.mjs`
  - `atomize-text.test.mjs`
  - `test-support/fetch-stub.mjs`
- It has no `.specify/`, `specs/` or `.fork/` paths.
- The validator prints `valid`.
- Upstream rules 1–16 are recorded as self-checked in `$E/r532-gate-rules.md`.

## 5. Land and record (runbook steps 5–6)

Follow `.fork/README.md` → "Stage an upstream PR", steps 5–6. The checks:

- The fork PR title ends with `(staged #532)`.
- `fork-ci-verdict` **and** `OB1 Review` are green.
- Tasks T001–T025 are `[X]` before the merge.
- The PR is merged with `--merge`.
- After the merge:
  - `.fork/staged-prs.md` has one `#532` row.
  - Its Notes record the `test-atomize.mjs` divergence.
