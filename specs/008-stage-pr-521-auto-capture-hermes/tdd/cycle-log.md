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
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "drop the _compressed_summary filter" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "A2 tool-call-only steps and compaction summaries are absent from the capture"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:` (exit 1); author script restored, `git diff --quiet` clean: true
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
- red: none possible (add-only PR; plan Complexity Tracking, TEST_AFTER by owner decision). Detection check, not S1: mutant "drop the _compressed_summary filter" (evidence/detection/mutants-*.json), `node .fork/ci/bin/tdd.mjs single capture-hermes-session.test.mjs "U2 a compaction summary row contributes nothing"` -> `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` (exit 1); author script restored, `git diff --quiet` clean: true
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
