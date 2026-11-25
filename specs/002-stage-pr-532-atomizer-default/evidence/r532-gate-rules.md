# Gate 4 self-check: upstream rules 1–16 for `recipes/atomizer/`

Self-checked on 2026-11-24 against `stage/pr-532-atomizer-default` at `58b0567`, using the rules in CONTRIBUTING.md § "The Automated Review Rules".

| # | Rule | Result | Evidence |
|---|------|--------|----------|
| 1 | Folder structure | pass | All changes are under `recipes/atomizer/` |
| 2 | Required files | pass | `README.md` and `metadata.json` are present (unchanged) |
| 3 | Metadata valid | pass | `ajv validate --spec=draft2020` against `.github/metadata.schema.json` reports `valid` |
| 4 | No credentials | pass | The only key-like string is the dummy `test-key-not-real`; there are no credential patterns in the diff |
| 5 | SQL safety | N/A | No SQL in the diff |
| 6 | Category artifacts | pass | The recipe has code (`*.mjs`) |
| 7 | PR format | pass (planned) | Title `[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5 (staged #532)` |
| 8 | No binary blobs | pass | No binaries and no files over 1 MB |
| 9 | README completeness | pass | README has `## Prerequisites` (l.14), `## Setup` steps (l.46) and `## Expected Outcome` (l.221) |
| 10 | Contribution dependencies | N/A | `metadata.json` declares no `requires_primitives` / `requires_skills` |
| 11 | LLM clarity review | N/A | Planned for v2 upstream |
| 12 | Scope check | pass | `git diff --stat upstream/main...HEAD` lists 4 files, all in `recipes/atomizer/` |
| 13 | Internal links | pass | Both relative README links resolve (`../../docs/01-getting-started.md`, `../email-history-import/`) |
| 14 | Remote MCP pattern | N/A | Recipe, not an extension or integration; no MCP server |
| 15 | Tool audit link | N/A | Recipe, not an extension or integration |
| 16 | MCP tool annotations | N/A | No MCP tools |

No rule fails, so T021 may proceed. Gate 2 (markdownlint) does not apply: no Markdown changed in the folder.
