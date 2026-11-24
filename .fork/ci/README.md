# fork-ci

Fork-only CI that enforces constitution Principle IV (Test-First) on `mfelker/OB1`.
Upstream CI runs no contribution tests; fork-ci does. Design: [`specs/001-fork-ci/`](../../specs/001-fork-ci/plan.md).

> Status: under construction (spec 001). Full documentation lands in task T056.

## Layout

| Path | Contents |
|------|----------|
| `lib/` | Pure-ish logic modules (path mapping, diffs, runtimes, origin, verdict, report, bypass) |
| `bin/` | Thin CLIs called by `.github/workflows/fork-ci.yml` |
| `sql/` | Postgres bootstrap for SQL verification |
| `test/` | `node:test` suites (`*.test.mjs`), `helpers/`, and in-memory `fixtures.mjs` |

Fixture folders are stored as in-memory file maps and written to temp directories at test time, so their sample test files are never picked up by `node --test` or other tools.

## Run the tests

```bash
node --test .fork/ci/test/
```

Zero dependencies: Node 26 standard library only.

<!-- spike direct push -->
