# T049: local CI run for fork PR #20 (GitHub Actions disabled)

**Why local.** GitHub Actions was disabled on the owner's account (a "contact support" banner). The last run on the fork is [45686356865](https://github.com/mfelker/OB1/actions/runs/45686356865) (2026-11-25 19:33 UTC); pushes to `main` on 2026-11-26 and [fork PR #20](https://github.com/mfelker/OB1/pull/20) (opened, edited, closed and reopened) created no runs. The two checks the `main` ruleset requires, `fork-ci-verdict` and `OB1 Review`, were therefore run by hand on 2026-11-26 with the workflows' own scripts.

**What was run.**

- Fork CI (`.github/workflows/fork-ci.yml`) on PR #20's merge commit `57d37f2` (parents: fork `main` `75010c9`, head `73ee726`): `detect.mjs` → `run-folder.mjs` (strict) → `verdict.mjs`. Local Node 26.13.0, Deno 2.9.8 (the workflow pins Node 26 and Deno 2.9.x).
- OB1 PR Gate (`.github/workflows/ob1-gate-v2.yml`): the "Run review checks" script, extracted unchanged, on the head `73ee726` with `check-jsonschema` 0.39.0 and the base commit's `metadata.schema.json`. Run twice, once per PR context (base and title).

| Check | Result | File |
|-------|--------|------|
| Fork CI: `detect` | One folder, `integrations/self-hosted-llm-mcp`, strict, origin `fork`; no SQL; nothing skipped. `self-test` not needed (no `.fork/ci/**` change) | `01-fork-ci-verdict.md` |
| Fork CI: `test` + `fork-ci-verdict` | Deno suite passes; verdict **success** | `01-fork-ci-verdict.md` |
| OB1 Review, upstream [#533](https://github.com/NateBJones-Projects/OB1/pull/533) context (base `upstream/main` `238df6c`, `[integrations]` title) | All 15 rules pass, `failed=false` | `02-gate-upstream-pr533.txt` |
| OB1 Review, fork #20 context with its original title `[fork] Land contrib/mfelker/self-hosted-llm` | 14 of 15 pass; **PR format fails** on the `[fork]` prefix, `failed=true` | `03-gate-fork-pr20-old-title.txt` |

**Follow-up.** PR #20 was retitled `[integrations] Self-hosted LLM MCP server (fork landing)`, following fork PR #15 (`[recipes] …`). The head and changes are the same as #533, so with that title the gate's result is the upstream one (file 02). The `[fork] Land …` title in `.fork/README.md` ("Ship an upstream-bound feature") cannot pass the gate for any PR that touches a contribution folder, and is to be corrected with the ledger row.

The per-folder `run-folder.mjs` result JSON was not kept; its outcome (`pass`, "all tests passed") is in the verdict table.
