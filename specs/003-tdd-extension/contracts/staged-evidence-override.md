# Contract: staged-PR evidence override

The override files are `.specify/templates/overrides/tdd-test-quality-rubric.md` and `.specify/templates/overrides/tdd-loop-playbook.md`. Each is a copy of the installed 2.0.1 template plus one delimited fork section (data-model `OverrideFile`).

## When it applies

Only when the feature's plan `**Lane**` line says `staged upstream PR`. For any other lane the fork section says "does not apply", and the base rules govern unchanged (US3 scenario 3).

## Evidence rule (rubric section)

| # | Cycle-log evidence for a behavior (staged lane) | Classification |
|---|-------------------------------------------------|----------------|
| S1 | A red recorded **at the PR base** (the command, the base SHA, the decisive failure line) **and** a green at the PR head | `PROVEN` (history ordering not required) |
| S2 | Green at the head only, with no base-red | `TEST_AFTER` (fail closed) |
| S3 | A base-red whose recorded failure line has nothing to do with the behavior (a syntax or import error) | `TEST_AFTER`, plus a HIGH "invalid red" finding |
| S4 | A behavior whose code the PR didn't change (unchanged at the base) | Use the base rules: characterization (`BASELINE`), so `NOT_APPLICABLE` |

## Loop procedure (playbook section)

For a staged behavior whose new test passes on its first run at the PR head:

1. Find the base: `BASE=$(git merge-base HEAD upstream/main)`.
2. Check out the base copy of only the PR-changed source file(s) the behavior covers.
3. Run the single-test command, and record the command, the base short SHA and the decisive failure line in the cycle log as the red.
4. Restore with `git checkout HEAD -- <files>`, then confirm `git status --short --untracked-files=no` is empty.
5. Run the test at the head and record the green.

Never commit a base checkout. If the test still passes at the base, it doesn't detect the PR's change: rewrite it (the base playbook's "worthless test" rule).

## Calibration expectation (US5)

On spec 002, behaviors C1 (default model) and K4 (CLI default model) have a recorded base-red, in `evidence/r532-red.txt` and copied into the PR #15 body, so they classify as S1. Their cycle-log equivalent is reconstructed only from that recorded output, never invented. Spec 002 has no cycle log, so the audit is expected to note "evidence in a non-standard location". The calibration report states this rather than counting it as a fork-integration gap.
