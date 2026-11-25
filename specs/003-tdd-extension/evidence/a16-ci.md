# A16: the fork PR's verdict summary shows the 003 TDD status row, verdict unchanged

Observed on fork PR [#16](https://github.com/mfelker/OB1/pull/16), head `cec878f`, job `fork-ci-verdict` (run `45631585606`, job `139266254598`), 2026-11-25. The verdict step ran with `HEAD_REF: fork/tdd-extension` and wrote this summary (copied from the job log):

```text
## Fork CI verdict: ✅ success

No contribution folders changed.

Skipped paths: 59 fork-only, 0 template, 0 other

### TDD status (advisory)

| Feature | Cycle log | Audit report | Verdict |
|---------|-----------|--------------|---------|
| specs/003-tdd-extension | ✅ | ✅ | ❌ FAIL |
```

- The row names `specs/003-tdd-extension` and reports the committed pre-merge audit (`tdd/verification.md`, FAIL).
- The conclusion stayed `✅ success` and the check passed: the advisory status did not change the verdict (FR-014, SC-007).
- The T032 re-audit confirmed the same log independently.
