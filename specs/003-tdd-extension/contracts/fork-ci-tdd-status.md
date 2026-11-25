# Contract: fork-ci "TDD status (advisory)" section

This is rendered by `renderReport(verdict, results, detect, tdd)`, using `tddStatus(rootDir, process.env.HEAD_REF)`. It appears only on `pull_request` runs, where `HEAD_REF` is non-empty.

```markdown
### TDD status (advisory)

| Feature | Cycle log | Audit report | Verdict |
|---------|-----------|--------------|---------|
| specs/003-tdd-extension | ✅ | ✅ | ✅ PASS |
```

| # | Situation | Row(s) |
|---|-----------|--------|
| T1 | One linked feature, both files present, verdict PASS | `✅ ✅ ✅ PASS` |
| T2 | Verdict PASS_WITH_GAPS | `⚠️ PASS_WITH_GAPS` |
| T3 | Verdict FAIL or BLOCKED | `❌ FAIL` / `❌ BLOCKED` |
| T4 | No `verification.md` | Verdict `➖ missing` |
| T5 | `verification.md` without a valid `verdict:` | `⚠️ unreadable` |
| T6 | No cycle log | Cycle log `➖` |
| T7 | Several specs name the same branch | One row each |
| T8 | No spec names the branch | A single line: `No feature linked to <headRef> (advisory).` |
| T9 | Push event (`HEAD_REF` empty) | No section |

**Invariants**:

- The section never changes `fork-ci-verdict`'s conclusion, its exit code or the `verdict.json` outcome. A test compares the T1–T9 runs against the same results with no TDD input.
- `HEAD_REF` reaches the step only through `env:`, never interpolated into `run:`.
- A branch name is treated as data. It's compared literally, never used as a regex or a path.
- Pipe characters (`|`) in names are escaped with the report's existing `esc()`.
