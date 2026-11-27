# Cycle Log: Stage upstream PR #521 (auto-capture Hermes adapter)

Append only. Newest last. On this feature no base-red is possible (add-only PR; owner decision 2026-11-27, plan Complexity Tracking), so each entry's `red` says so and may add a non-graded detection check; see `test-list.md` § "How reds are recorded on this feature".

## Baseline

- suite: `node .fork/ci/bin/tdd.mjs suite` -> `skills/auto-capture-hermes: no-tests (no tests for node code)`, `→ empty baseline: no tests yet`, exit 0 (0 tests)
- commit: fork `main` `cddad8a`; stage worktree `/Users/mfelker/Projects/ob1/.worktrees/stage-pr-521-auto-capture-hermes` at `b9cbd68`
- recorded: cycle 0, before any change, 2026-11-27, Node v26.13.0

## Cycle 1: A1 dry-run prints one payload with the turns, label and key, and sends nothing

- test: `capture-hermes-session.test.mjs::A1 dry-run prints one payload with the turns, label and key, and sends nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "source_label constant "hermes"" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A1 dry-run prints one payload with the turns, label and key, and sends nothing"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 2: A2 tool-call-only steps and compaction summaries are absent from the capture

- test: `capture-hermes-session.test.mjs::A2 tool-call-only steps and compaction summaries are absent from the capture` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "drop the `_compressed_summary` filter" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A2 tool-call-only steps and compaction summaries are absent from the capture"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 3: A3 a cron message is kept as user:cron and not counted as a user turn

- test: `capture-hermes-session.test.mjs::A3 a cron message is kept as user:cron and not counted as a user turn` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "cron phase label removed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A3 a cron message is kept as user:cron and not counted as a user turn"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 4: A4 a session below the user-turn threshold is not captured

- test: `capture-hermes-session.test.mjs::A4 a session below the user-turn threshold is not captured` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "threshold lowered to MIN-1" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A4 a session below the user-turn threshold is not captured"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 5: A5 a subagent session is not captured

- test: `capture-hermes-session.test.mjs::A5 a subagent session is not captured` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "isSubagentSession ignores parent_session_id" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A5 a subagent session is not captured"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 6: A6 an over-limit transcript fits the limit and keeps the first and last turns

- test: `capture-hermes-session.test.mjs::A6 an over-limit transcript fits the limit and keeps the first and last turns` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "truncation call removed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A6 an over-limit transcript fits the limit and keeps the first and last turns"` -> `AssertionError [ERR_ASSERTION]: text is 8305 chars` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 7: A7 two runs on the same session give the same import key

- test: `capture-hermes-session.test.mjs::A7 two runs on the same session give the same import key` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "import key gains a time component" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A7 two runs on the same session give the same import key"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 8: A8 with no address and no key nothing is sent and the run exits 0

- test: `capture-hermes-session.test.mjs::A8 with no address and no key nothing is sent and the run exits 0` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "missing-config guard disabled" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A8 with no address and no key nothing is sent and the run exits 0"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 9: U1 an assistant row with empty content contributes nothing

- test: `capture-hermes-session.test.mjs::U1 an assistant row with empty content contributes nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "both empty-content filters removed (parse + format)" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U1 an assistant row with empty content contributes nothing"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 10: U2 a compaction summary row contributes nothing

- test: `capture-hermes-session.test.mjs::U2 a compaction summary row contributes nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "drop the `_compressed_summary` filter" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U2 a compaction summary row contributes nothing"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 11: U3 tool and session_meta rows contribute nothing

- test: `capture-hermes-session.test.mjs::U3 tool and session_meta rows contribute nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "role filter removed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U3 tool and session_meta rows contribute nothing"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 12: U4 turns follow insertion order even when timestamps run backwards

- test: `capture-hermes-session.test.mjs::U4 turns follow insertion order even when timestamps run backwards` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "order by timestamp" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U4 turns follow insertion order even when timestamps run backwards"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 13: U5 a JSON array of typed parts appears as its text parts joined

- test: `capture-hermes-session.test.mjs::U5 a JSON array of typed parts appears as its text parts joined` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "parts mapped to their type" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U5 a JSON array of typed parts appears as its text parts joined"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 14: U6 a user message mentioning [Cronjob mid-text is a real user turn

- test: `capture-hermes-session.test.mjs::U6 a user message mentioning [Cronjob mid-text is a real user turn` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "cron match unanchored" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U6 a user message mentioning [Cronjob mid-text is a real user turn"` -> `Error: no payload printed (exit 0); stderr: Session session-1 has 2 user turns (< 3); nothing to capture.` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 15: U7 exactly three real user turns is captured

- test: `capture-hermes-session.test.mjs::U7 exactly three real user turns is captured` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "< becomes <=" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U7 exactly three real user turns is captured"` -> `AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: ''` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 16: U8 two real user turns plus a cron turn is skipped as too short

- test: `capture-hermes-session.test.mjs::U8 two real user turns plus a cron turn is skipped as too short` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "cron counts as a user turn" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U8 two real user turns plus a cron turn is skipped as too short"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 17: U9 OB_CAPTURE_MIN_USER_TURNS=1 captures a one-turn session

- test: `capture-hermes-session.test.mjs::U9 OB_CAPTURE_MIN_USER_TURNS=1 captures a one-turn session` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "env setting ignored" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U9 OB_CAPTURE_MIN_USER_TURNS=1 captures a one-turn session"` -> `Error: no payload printed (exit 0); stderr: Session session-1 has 1 user turns (< 3); nothing to capture.` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 18: U10 a session with a parent is skipped and nothing is sent

- test: `capture-hermes-session.test.mjs::U10 a session with a parent is skipped and nothing is sent` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "isSubagentSession ignores parent_session_id" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U10 a session with a parent is skipped and nothing is sent"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 19: U11 a title starting with Subagent: is skipped and nothing is sent

- test: `capture-hermes-session.test.mjs::U11 a title starting with Subagent: is skipped and nothing is sent` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "title check never matches" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U11 a title starting with Subagent: is skipped and nothing is sent"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 20: U12 a title containing Subagent: later in the text is captured

- test: `capture-hermes-session.test.mjs::U12 a title containing Subagent: later in the text is captured` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "title check unanchored" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U12 a title containing Subagent: later in the text is captured"` -> `Error: no payload printed (exit 0); stderr: (empty)` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 21: U13 --latest picks the newest top-level session over a newer subagent

- test: `capture-hermes-session.test.mjs::U13 --latest picks the newest top-level session over a newer subagent` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "--latest drops the parent filter" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U13 --latest picks the newest top-level session over a newer subagent"` -> `Error: no payload printed (exit 0); stderr: (empty)` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 22: U14 the header names project, session, source and title

- test: `capture-hermes-session.test.mjs::U14 the header names project, session, source and title` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "source line constant" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U14 the header names project, session, source and title"` -> `AssertionError [ERR_ASSERTION]: header lacks "Source: hermes:tui"` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 23: U15 a literal thought_content tag inside a turn is escaped

- test: `capture-hermes-session.test.mjs::U15 a literal thought_content tag inside a turn is escaped` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "opening-tag escape removed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U15 a literal thought_content tag inside a turn is escaped"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 24: U16 a transcript within the limit is sent whole without a marker

- test: `capture-hermes-session.test.mjs::U16 a transcript within the limit is sent whole without a marker` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "always truncate" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U16 a transcript within the limit is sent whole without a marker"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 25: U17 an over-limit transcript has the marker between the kept start and end

- test: `capture-hermes-session.test.mjs::U17 an over-limit transcript has the marker between the kept start and end` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "truncation keeps only the head" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U17 an over-limit transcript has the marker between the kept start and end"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 26: U18 import_key has the form hermes:<session id>:<8 hex>

- test: `capture-hermes-session.test.mjs::U18 import_key has the form hermes:<session id>:<8 hex>` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "9 hex chars" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U18 import_key has the form hermes:<session id>:<8 hex>"` -> `AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^hermes:session-1:[0-9a-f]{8}$/. Input:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 27: U19 changing one message changes the import key

- test: `capture-hermes-session.test.mjs::U19 changing one message changes the import key` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "key hashes the session id only" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U19 changing one message changes the import key"` -> `AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 28: U20 a dry-run writes no session state

- test: `capture-hermes-session.test.mjs::U20 a dry-run writes no session state` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "dry-run guard in writeSessionState removed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U20 a dry-run writes no session state"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 29: U21 an address without a key sends nothing

- test: `capture-hermes-session.test.mjs::U21 an address without a key sends nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "guard needs both missing" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U21 an address without a key sends nothing"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 30: U22 a key without an address sends nothing

- test: `capture-hermes-session.test.mjs::U22 a key without an address sends nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "guard needs both missing" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U22 a key without an address sends nothing"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 31: U23 address and key from .env.local are used

- test: `capture-hermes-session.test.mjs::U23 address and key from .env.local are used` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant ".env.local ignored" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U23 address and key from .env.local are used"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 32: U24 an unknown session id exits 0 and is logged

- test: `capture-hermes-session.test.mjs::U24 an unknown session id exits 0 and is logged` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "no-session branch logs nothing" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U24 an unknown session id exits 0 and is logged"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 33: U35 a hook payload without session_id is skipped with the no-op reply

- test: `capture-hermes-session.test.mjs::U35 a hook payload without session_id is skipped with the no-op reply` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "no-session-id branch emits no reply" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U35 a hook payload without session_id is skipped with the no-op reply"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 34: U36 a hook event other than session end is skipped and sends nothing

- test: `capture-hermes-session.test.mjs::U36 a hook event other than session end is skipped and sends nothing` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "event filter disabled" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U36 a hook event other than session end is skipped and sends nothing"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 35: U37 unparseable hook stdin exits 0 with the no-op reply

- test: `capture-hermes-session.test.mjs::U37 unparseable hook stdin exits 0 with the no-op reply` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "parse error rethrown" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U37 unparseable hook stdin exits 0 with the no-op reply"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 36: U38 on_session_finalize captures once and records it in session state

- test: `capture-hermes-session.test.mjs::U38 on_session_finalize captures once and records it in session state` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "captured_at not recorded" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U38 on_session_finalize captures once and records it in session state"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 37: U39 a hook fire after a capture is skipped and sends nothing more

- test: `capture-hermes-session.test.mjs::U39 a hook fire after a capture is skipped and sends nothing more` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "both already-captured checks disabled (hook entry + captureIfCurrent)" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U39 a hook fire after a capture is skipped and sends nothing more"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 37 passed, 0 failed
- refactor: none needed
- commit: `5e5853b`

## Cycle 38: A9 a successful capture sends one request with the key and the dry-run payload

- test: `capture-hermes-session.test.mjs::A9 a successful capture sends one request with the key and the dry-run payload` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "wrong x-brain-key header" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A9 a successful capture sends one request with the key and the dry-run payload"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 39: A10 a temporary failure is queued and resent before the next capture

- test: `capture-hermes-session.test.mjs::A10 a temporary failure is queued and resent before the next capture` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "retry queue not processed" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A10 a temporary failure is queued and resent before the next capture"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 40: A11 a permanent failure is not queued and is logged as permanent

- test: `capture-hermes-session.test.mjs::A11 a permanent failure is not queued and is logged as permanent` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "permanent failures queued too" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A11 a permanent failure is not queued and is logged as permanent"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 41: U25 an address with a trailing slash still posts to the ingest path

- test: `capture-hermes-session.test.mjs::U25 an address with a trailing slash still posts to the ingest path` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "trailing slash kept" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U25 an address with a trailing slash still posts to the ingest path"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 42: U26 a 2xx answer with a non-JSON body is logged captured:unknown

- test: `capture-hermes-session.test.mjs::U26 a 2xx answer with a non-JSON body is logged captured:unknown` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "non-JSON body throws" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U26 a 2xx answer with a non-JSON body is logged captured:unknown"` -> `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 43: U27 a 429 answer queues the payload

- test: `capture-hermes-session.test.mjs::U27 a 429 answer queues the payload` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "429 not retryable" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U27 a 429 answer queues the payload"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 44: U28 a 500 answer queues the payload

- test: `capture-hermes-session.test.mjs::U28 a 500 answer queues the payload` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "500 not retryable (> instead of >=)" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U28 a 500 answer queues the payload"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 45: U29 a 400 answer is not queued and is logged as permanent

- test: `capture-hermes-session.test.mjs::U29 a 400 answer is not queued and is logged as permanent` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "4xx retryable" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U29 a 400 answer is not queued and is logged as permanent"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 46: U30 a refused connection exits 0 and queues the payload

- test: `capture-hermes-session.test.mjs::U30 a refused connection exits 0 and queues the payload` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "failures never queued" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U30 a refused connection exits 0 and queues the payload"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 47: U31 a queued entry failing a fourth time stays queued with attempt_count 4

- test: `capture-hermes-session.test.mjs::U31 a queued entry failing a fourth time stays queued with attempt_count 4` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "dead at MAX-1 attempts" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U31 a queued entry failing a fourth time stays queued with attempt_count 4"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 48: U32 a queued entry failing a fifth time moves to dead/

- test: `capture-hermes-session.test.mjs::U32 a queued entry failing a fifth time moves to dead/` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "dead only above MAX attempts" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U32 a queued entry failing a fifth time moves to dead/"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 49: U33 a queued entry answered with 401 moves to dead/

- test: `capture-hermes-session.test.mjs::U33 a queued entry answered with 401 moves to dead/` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "permanent flag ignored for queued entries" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U33 a queued entry answered with 401 moves to dead/"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 50: U34 one run resends the three oldest queued entries and keeps the newest

- test: `capture-hermes-session.test.mjs::U34 one run resends the three oldest queued entries and keeps the newest` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "batch size + 1" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U34 one run resends the three oldest queued entries and keeps the newest"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Cycle 51: U40 two quick on_session_end fires are captured once

- test: `capture-hermes-session.test.mjs::U40 two quick on_session_end fires are captured once` (new)
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "token supersession check disabled" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U40 two quick on_session_end fires are captured once"` -> `Error: timed out after 5000 ms waiting for one superseded worker and one capture` (exit 1); author script restored, `git diff --quiet` clean: true
- green: no source change (author's code at `b9cbd68`). `[tdd] single node-test feature=specs/008-stage-pr-521-auto-capture-hermes folder=skills/auto-capture-hermes: tests=1 pass=1 fail=0 → pass`; suite at commit -> 51 passed, 0 failed
- refactor: none needed
- commit: `6bcefef`

## Notes and deviations

- **Scaffolding**: T002–T004 (`test-support/hermes-store.mjs`, `test-support/run-adapter.mjs`, test-file skeleton) committed first as `6e3ad8d`; they carry no behavior and change no adapter code.
- **TEST_AFTER for every behavior** (owner decision 2026-11-27, plan Complexity Tracking): the PR adds the adapter, so no base-red exists. Each test was instead run against a temporary mutant of `capture-hermes-session.mjs` by `evidence/detection/mutate.mjs` (apply, run the single test, restore, check `git diff --quiet`, re-run green). All 51 mutants were detected; raw results in `evidence/detection/results-us2.json` and `results-us3.json`.
- **Batching**: no source changes were needed, so tests were written per story (US2: 37, US3: 14) and committed per story (`5e5853b`, `6bcefef`) rather than one commit per cycle. Each behavior still has its own single-test green and its own detection check.
- **U1 fixture corrected before commit**: the first fixture restarted `conversation()` after the empty row, which made `a1` a user turn (`2 !== 3`). The adapter was right; the fixture was fixed with a stated reason, not loosened.
- **A10 assertion tightened before commit**: it compared `requests[1]` with itself; replaced by an exact request count and order.
- **`parsePayload` refactor** (in `5e5853b`): an empty stdout now fails as `no payload printed (exit …)` instead of a JSON parse error, so the U6/U9/U12/U13 detection lines name the cause.
- **Two-site mutants (adapter has redundant guards)**: U1 needed both empty-content filters removed (parse and format); U39 needed both already-captured checks disabled (hook entry and `captureIfCurrent`). With one site removed the behavior still held, so a one-site mutant could not be detected. Not a defect.
- **U40 debounce 1000 ms** instead of research R8's 300 ms: the second hook fire must land before the first worker wakes, and two Node start-ups take about 150 ms. 5/5 repeated runs passed.
- **No adapter defects found**: `evidence/defects.md` not created.

## Remediation after `/speckit-tdd-verify` (verdict FAIL at `4ad3e3f`)

Commands run from the stage worktree folder `skills/auto-capture-hermes` with `env -i PATH="$PATH" HOME="$TMPDIR" node --test --test-reporter=tap --test-name-pattern=<pattern> capture-hermes-session.test.mjs` (the adapter's `single` was not used, so the other session's `.specify/feature.json` stayed on 007). Each mutant was applied alone to the author's script, then restored; `git diff --quiet` was clean after every one, and the test was green again on the restored script.

## Cycle 52: A8, U22 test correction (finding 1, T041)

- test: `A8 with no address and no key nothing is sent and the run exits 0`, `U22 a key without an address sends nothing` (changed)
- reason: their `stub.requests.length === 0` could not fail, because the child was never given the stand-in's address. Replaced by exact `dispositions` (`["error:missing_env"]`) and an empty retry queue; the unused stand-in was removed. This is a strengthening, not a loosening.
- red, old tests: mutant "guard logs `error:missing_env` but falls through" (`"error:missing_env");\n    return;` → `"error:missing_env");`) → old A8 and U22 **pass** (exit 0): the gap is confirmed.
- red, new tests: same mutant → `not ok` for both, decisive line `+   "error:main:Cannot read properties of undefined (reading 'replace')"` (exit 1). Loop mutant "missing-config guard disabled" → both `not ok` (exit 1).
- green: the real script passes both; suite 51 passed, 0 failed
- refactor: none needed
- commit: `b13ca53`

## Cycle 53: U38 test correction (finding 2, T042)

- test: `U38 on_session_finalize captures once and records it in session state` (changed)
- reason: `assert.ok(state.captured_at)` accepted any truthy value. It now matches ISO-8601 and checks that `Date.parse` falls between timestamps taken before and after the run.
- red, old test: mutants `captured_at: true` and `captured_at: new Date(0).toISOString()` → old U38 **passes** both (exit 0).
- red, new test: `captured_at: true` → `not ok`, `operator: 'match'`; `new Date(0)` → `not ok`, `captured_at 1970-01-01T00:00:00.000Z is outside this run`; field removed → `not ok`, `operator: 'match'` (all exit 1).
- green: the real script passes; suite 51 passed, 0 failed
- refactor: none needed
- commit: `b13ca53`

## Cycle 54: U41 a transcript one character under the limit is sent whole and one character over is trimmed to fit (finding 3, T043)

- test: `capture-hermes-session.test.mjs::U41 a transcript one character under the limit is sent whole and one character over is trimmed to fit` (new)
- red: none possible (add-only PR, TEST_AFTER by owner decision). Detection check, not S1: audit mutant M7 (`text.length <= budget` → `<` in `truncateMiddle`) → `not ok`, `actual: true` on "one character under the limit: no marker" (exit 1). Mutant "truncation call removed" → `not ok` (exit 1).
- green: no source change. `ok 1 - U41 …`; suite 52 passed, 0 failed, in 3 consecutive runs (4.3 s, 4.4 s, 4.8 s)
- refactor: none needed
- commit: `dfb0d57`
- note: the limits are derived from the measured capture size (dry run with limit 100000, giving 8305 chars), not from the author's `header.length - 40` budget, so the test does not copy the implementation. Under M7 the trimmed text happens to have the full length, so the marker assertion is the one that detects it.

## Notes and deviations (remediation)

- **Exact fit is trimmed by one character (observed, not a defect):** with `OB_CAPTURE_MAX_CHARS` equal to the full capture size (8305), the author's script trims it. Its budget reserves 40 characters for the `<thought_content>` wrapper, which uses 39. FR-011 ("MUST NOT exceed") holds, so U41 pins the sides at ±1 and asserts nothing about exact fit. This is worth mentioning in the #521 comment (T036) as a remark, not a defect. `evidence/defects.md` is still not created.

## Cycle 55: U13 test correction (second audit finding 1, T048)

- test: `capture-hermes-session.test.mjs::U13 --latest picks the newest top-level session over a newer subagent` (changed)
- reason: the fixture had one top-level session, so "newest" was never exercised. It now has `session-1` (older top-level), `session-3` (newer top-level) and `session-2` (a subagent newer than both). The assertion changed from header `includes("Session: session-1")` to an exact `Session:` line `"Session: session-3"`. This is a strengthening.
- red, old test: audit mutant N5 (`findLatestSession` `DESC` → `ASC`) → old U13 **passes** (second audit, `cc50f39`).
- red, new test: N5 → `not ok`, `expected: 'Session: session-3'`, `actual: 'Session: session-1'` (exit 1). N4 (parent filter dropped) → `not ok`, `no payload printed (exit 0); stderr: (empty)` (the subagent is picked, then skipped). Script restored, `git diff --quiet` clean after each, green again on the restored script.
- green: the real script passes; suite 52 passed, 0 failed (2 runs, 4.3 s)
- refactor: none needed
- commit: `7cd5290`

## Cycle 56: U42 an unreadable queue entry moves to dead/ and the valid entries behind it are still resent (second audit finding 2, T049)

- test: `capture-hermes-session.test.mjs::U42 an unreadable queue entry moves to dead/ and the valid entries behind it are still resent` (new)
- red: none possible (add-only PR, TEST_AFTER by owner decision). Detection checks, not S1:
  - N7 (corrupt entry left in place: rename removed, `continue` kept) → `not ok`, `dead/` is `[]` where `['1-a.json']` was expected (exit 1).
  - N7b (corrupt entry dead-lettered, then `return` stops the batch) → `not ok`, requests `['hermes:session-1:6521cc5e']` where `['k-2-b', 'k-3-c']` were expected (exit 1).
  - Script restored, `git diff --quiet` clean after each, green again on the restored script.
- green: no source change; suite 53 passed, 0 failed (2 runs, 4.3 s)
- refactor: test-support gains `queueFiles()` (file names without parsing; `queueEntries()` would throw on the corrupt file), and `seedQueueEntry()` accepts a raw string. Existing callers are unchanged.
- commit: `1652c3a`

## Cycle 57: A11, U29 test correction (first audit finding 4 / second audit finding 3, T044)

- test: `A11 a permanent failure is not queued and is logged as permanent`, `U29 a 400 answer is not queued and is logged as permanent` (changed)
- reason: `some(d => d.endsWith(":permanent"))` did not pin the status. Both tests now require exactly one log line matching the contract form `/^error:HTTP 401:.*:permanent$/` (A11) and `/^error:HTTP 400:.*:permanent$/` (U29). The response body in between is not pinned.
- red, old tests: mutant P1 (`new Error(\`HTTP ${response.status}:` → `new Error(\`HTTP 418:`) → A11 and U29 **pass**.
- red, new tests: P1 → both `not ok`, `actual: 'error:HTTP 418:{"error":"bad key"}:permanent'` and `actual: 'error:HTTP 418:{"error":"bad payload"}:permanent'` (exit 1).
- green: the real script passes; suite 53 passed, 0 failed
- refactor: none needed
- commit: `6cfc4ac`

## Cycle 58: U17 test correction (first audit finding 5 / second audit finding 4, T045)

- test: `U17 an over-limit transcript has the marker between the kept start and end` (changed)
- reason: one unlabelled `assert.ok(marker > first && marker < last)` passed when FIRST-TURN was missing (`indexOf` gives -1). It is now four labelled assertions: first turn kept, last turn kept, marker after first, marker before last.
- red, old test: mutant P2 (head slice dropped in `truncateMiddle`) → U17 **passes**.
- red, new test: P2 → `not ok`, "the first turn is kept", `expected: true`, `actual: false` (exit 1).
- green: suite 53 passed, 0 failed
- refactor: none needed
- commit: `6cfc4ac`

## Cycle 59: test refactor, named values (first audit findings 6–8 / second audit findings 5–6, T046)

- tests changed: A6, A9, U16, U17, U38, U40, U41. Structural only, with one strengthening (U16).
- What changed:
  - **Stand-in reply:** `JOB_ID` is passed explicitly by `acceptingStub()` where tests assert on it (U38, A9, U40), instead of relying on `startIngestStub`'s default.
  - **Size limits:** derived from the fixture (`LONG_TURN_TEXT_CHARS` = 8000). Over = half (4000, previously 3000), under = 2.5× (20000).
  - **Marker:** `TRUNCATION_MARKER` is now `/truncated/i`, because the wording is in no contract.
  - **U16:** deep-equals the exact 8 turn contents, instead of a marker-absence check plus a count.
  - **A9:** asserts that the last log line is `captured:${JOB_ID}`. An exact full-log equality was tried first and failed, because A9's own dry run logs `dry_run:chars_273` first; pinning that character count would couple the test, so the last-line check was used instead.
- red: none (structural). No weakening: all 26 audit mutants re-run against `1e16541` plus T047; 25 caught, only N6 survives (out of scope, T051). The author script was clean after each.
- green: suite 53 passed, 0 failed (3 runs, 4.3–4.5 s)
- commit: `1e16541`

## Cycle 60: U40 timing margin stated (first audit findings 9–10 / second audit findings 7–8, T047)

- test: `U40 two quick on_session_end fires are captured once` (changed; structural)
- change: a named `DEBOUNCE_MS = 1000`, a comment on why the margin is safe (two Node start-ups take about 150 ms), and the `waitFor` timeout scaled to `DEBOUNCE_MS * 5` (unchanged at 5000 ms). The test-list row and research R8 now say 1000 ms.
- red: none (structural); mutant M "token supersession check disabled" from cycle 51 still applies.
- green: U40 passed 5/5 alone; suite 53 passed, 0 failed
- commit: `2c22e41`

## Cycle 61: test-list rows and scope (second audit findings 8–9, T050, T051)

- T050: the A8 and U22 rows now describe what the tests observe: exactly `error:missing_env` logged, an empty retry queue, and no stand-in.
- T051: quoted `.env.local` values are recorded under "Out of scope". The README and SKILL.md show only unquoted values, so there is no requirement behind quoting. Mutant N6 surviving is therefore expected; revisit if upstream documents quoting.
- No test or source change.

## Pre-merge checks re-run after remediation (T024–T028, stage `2c22e41`)

- **§0:** stage branch `stage/pr-521-auto-capture-hermes`; author's 3 commits, then 9 fork test commits. `git fetch upstream`: `upstream/main` is `238df6c`, fork main is 0 behind, and #521 is open at `b9cbd68` (unchanged). The author's 4 files are byte-identical to `b9cbd68`.
- **T024:** `env -i` full suite, 53 pass, 0 fail, 0 skipped, 4.47 s real (`evidence/us2-node-test.txt` and `evidence/us3-node-test.txt` refreshed).
- **T025:** only `skills/auto-capture-hermes/` paths; no `.specify/`, `specs/`, `.fork/` in the tree; every commit title starts `[skills]`.
- **T026:** fork-ci `run-folder` strict → `pass` (all tests passed; node-plain, 4484 ms) (`evidence/run-folder-final.json`); worktree clean.
- **T027:** diff `b9cbd68..HEAD` has no secret patterns, no binaries or `.db` files, and no profanity. The only URL is `http://127.0.0.1:${port}`; the one "token" match is wording in U40's comment.
- **T028:** OB1 Review step re-extracted from `ob1-gate-v2.yml` at `238df6c` and confirmed identical to the saved harness. Run with the base schema and check-jsonschema 0.39.0: 15/15, `failed=false`, `secret_blocked=false` (`evidence/gate-review-local.txt`).

## Cycle 62: A1, U27, U28 test strengthening (third audit findings 1–2, T052, T053)

- tests: `A1 dry-run prints one payload with the turns, label and key, and sends nothing`, `U27 a 429 answer queues the payload`, `U28 a 500 answer queues the payload` (changed)
- reason: `source_type` and `auto_execute` (data-model § Capture payload) and a new queue entry's `attempt_count` (contracts/ingest-request.md:18) were asserted nowhere. A1 now pins `source_type === "hermes_ambient"` and `auto_execute === true`; U27 and U28 pin `attempt_count === 1` on the queued entry.
- red, old tests: mutants R1, R2 and Q5 survived the whole suite (third audit, `d51cc69`).
- red, new tests:
  - R1 (`source_type: "hermes"`) → A1 `not ok`, `expected: 'hermes_ambient'`, `actual: 'hermes'`.
  - R2 (`auto_execute: false`) → A1 `not ok`, `expected: true`, `actual: false`.
  - Q5 (new entry at `attempt_count: 0`) → U27 and U28 `not ok`, `expected: 1`, `actual: 0`.
  - All exit 1; script restored, `git diff --quiet` clean, green again on the restored script.
- green: suite 53 passed, 0 failed (2 runs)
- refactor: none needed
- commit: `a4fb349`

## Pre-merge checks refreshed at stage `a4fb349` (after T052, T053)

- **T024:** `env -i` suite 53/53 (evidence files refreshed).
- **T026:** fork-ci strict `pass`.
- **T025, T027:** scope is only the folder; 0 secret-pattern matches.
- **T028:** OB1 Review 15/15, `failed=false`.

## Fork PR opened (T030, T032)

- T030 (owner): `git push -u origin stage/pr-521-auto-capture-hermes` (`a4fb349`), then `gh pr create` → https://github.com/mfelker/OB1/pull/33, title `[skills] Add auto-capture-hermes adapter (staged #521)`, base `main`, 14 commits, mergeable. The body mentions the author at the owner's request.
- T032: `gh pr diff 33 --name-only` lists 7 files, all under `skills/auto-capture-hermes/`.

## Fork PR checks green (T031)

- PR #33 at `a4fb349`. Passed: `fork-ci-verdict`, `test (skills/auto-capture-hermes)` (19 s), `OB1 Review` (11 s), `detect`, `lint`, `self-test`. Skipped by design: `test-sql` (no SQL) and `OB1 Gate Event Guard`. Run 46013672123.
- **Linux:** the suite passed on `ubuntu-26.04` with Node v26.13.1 (`skills/auto-capture-hermes: pass (all tests passed)`). This is the first run off macOS.
- **T054 is still open.** CI ran the suite but not mutant Q4. Whether U34 catches a missing `.sort()` on Linux is still unmeasured.
