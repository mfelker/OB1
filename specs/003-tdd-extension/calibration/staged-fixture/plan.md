# Implementation Plan: calibration fixture (staged lane)

**Branch**: `stage/pr-532-atomizer-default` | **Spec**: [spec.md](spec.md)

## Lane

**Lane**: staged upstream PR #532

**Contribution folder**: `recipes/atomizer/`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-532-atomizer-default`. All source paths are rooted here; spec-kit commands run from the fork-`main` checkout.

## Technical Context

**Language/Version**: JavaScript (Node 26), ES modules
**Testing**: `node:test` in `recipes/atomizer/atomize-text.test.mjs`, with the fetch stub `recipes/atomizer/test-support/fetch-stub.mjs`, run through `.fork/ci/bin/tdd.mjs`

## Structure

- `recipes/atomizer/lib/atomize-text.mjs`: `atomizeText` and its model defaults (changed by the PR).
- `recipes/atomizer/test-atomize.mjs`: the CLI (changed by the PR).
- `recipes/atomizer/atomize-text.test.mjs`: the PR's tests.
