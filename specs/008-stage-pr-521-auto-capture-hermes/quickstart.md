# Quickstart: validate and land staged PR #521

Run guide only. What is checked is in [contracts/](contracts/); the tests are written during `/speckit-implement`.

```bash
M=/Users/mfelker/Projects/ob1                                   # fork-main checkout
W=$M/.worktrees/stage-pr-521-auto-capture-hermes                # stage worktree
F=skills/auto-capture-hermes
E=$M/specs/008-stage-pr-521-auto-capture-hermes/evidence
```

## 0. Branches are where they should be

```bash
git -C $W rev-parse --abbrev-ref HEAD                 # stage/pr-521-auto-capture-hermes
git -C $W log --oneline 238df6c..HEAD                 # author's 3 commits, then only fork test commits
git -C $M log --oneline main..upstream/main | wc -l   # 0 (fork main has upstream); else sync main first
git -C $W diff --stat upstream/main...HEAD            # only files under skills/auto-capture-hermes/
git -C $W diff --quiet b9cbd68 HEAD -- $F/README.md $F/SKILL.md $F/metadata.json $F/capture-hermes-session.mjs && echo "author files unchanged"
```

Expected: every line as commented. If upstream changed #521's head, re-fetch (`git fetch upstream pull/521/head`), reset the stage branch to the new head plus the fork's test commits, and update the plan and ledger SHA.

## 1. Tests pass with no credentials and no network

```bash
cd $W/$F && env -i PATH="$PATH" HOME="$(mktemp -d)" node --test capture-hermes-session.test.mjs
```

Expected: all tests pass (any `todo` names a defect reported on #521); the run takes < 30 s. `env -i` proves nothing comes from the owner's shell (SC-004).

## 2. fork-ci preview (strict)

```bash
cd $W && node $M/.fork/ci/bin/run-folder.mjs --path $F --mode strict --origin fork --out $E/run-folder-final.json
node -e 'const r=require(process.argv[1]);console.log(r.outcome, r.reason ?? "")' $E/run-folder-final.json
git -C $W status --short
```

Expected: `pass` (the baseline was `no-tests`, see `evidence/baseline/run-folder-head.json`); clean status.

## 3. TDD audit

From `$M`, with `.specify/feature.json` pointing at this feature, run `/speckit-tdd-verify`. Expected: test-first behaviors are graded `TEST_AFTER` by owner decision (plan Complexity Tracking); test-smell and coverage findings must have no HIGH except the test-first ones. The owner waives Gate 1 for test-first only.

## 4. Fork PR and landing

```bash
cd $W && git push -u origin stage/pr-521-auto-capture-hermes
gh pr create -R mfelker/OB1 --base main --head stage/pr-521-auto-capture-hermes \
  --title "[skills] Add auto-capture-hermes adapter (staged #521)"
gh pr checks <fork-PR> -R mfelker/OB1 --watch       # fork-ci-verdict + OB1 Review green
gh pr merge <fork-PR> -R mfelker/OB1 --merge        # merge commit only
```

Expected: the OB1 Review gate passes (one folder, `SKILL.md` present, `auto-capture` dependency exists and is linked, `[skills]` title).

## 5. After the merge (fork main)

```bash
git -C $M pull --ff-only
git -C $M log --oneline --first-parent -1                      # the merge commit
git -C $M merge-base --is-ancestor b9cbd68 main && echo "author commits kept"
git -C $M diff --stat HEAD^1 HEAD                              # only skills/auto-capture-hermes/
git worktree remove $W
```

Then add the `#521` ledger row in `.fork/staged-prs.md` ([data-model.md](data-model.md#ledger-row-fork-main-forkstaged-prsmd)), commit `[fork] Spec 008: …` on `main`, and comment on #521 linking the fork's test commit(s).

## 6. Optional live check

Only if the owner runs Hermes Agent: follow the skill README against the owner's Open Brain, run `--dry-run --latest`, then end a real session and confirm one capture arrives. Save the output under `evidence/live/`.
