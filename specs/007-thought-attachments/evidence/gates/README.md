# Spec 007 gates T068, T070–T075 and T082 (local run, 2026-11-27)

Branch `contrib/mfelker/thought-attachments` at `ff4bfc1`, worktree `.worktrees/contrib-thought-attachments`, `upstream/main` at `238df6c`.

| Task | Check | Result | File |
|------|-------|--------|------|
| T068, T074 | OB1 gate review checks (`.github/workflows/ob1-gate-v2.yml`, the "Run review checks" step), upstream title `[integrations] Thought attachments: files linked to thoughts (PDF manuals, phone photos)` | 15 of 15 pass under both the `upstream/main` schema and the fork `main` schema. These include **No credentials**, **SQL safety** (R16's guarded `ADD COLUMN` on `thoughts` is accepted by rule 5), **Internal links** and **Scope check** | `01`, `02` |
| T070 | Refactor pass | `deno check` reports 0 errors. `deno lint` is clean, with `no-import-prefix` excluded because full specifiers are required (spec 004 R10, U303) and a justified `no-control-regex` ignore in `baseName` (FR-009). No `not implemented` is left in `src/`. `RUN_TODO=1` gives 378 passed, 0 ignored | — |
| T071 | `metadata.json` against `.github/metadata.schema.json` | Pass under both schemas (gate "Metadata valid") | `01`, `02` |
| T072 | `markdownlint-cli2 --config .github/.markdownlint.jsonc` on the folder's Markdown | 0 issues | — |
| T073 | README: sections, both platforms, links, tool-audit link | Pass. The link to the self-hosted recipe was made plain text, because it doesn't exist on `upstream/main`; the limitations are stated without fork issue numbers (`ff4bfc1`) | `01`, `02` |
| T074 | Secrets, binaries over 1 MB, profanity, SQL safety, fork-only files | The gate passes. No file is over 1 MB. The profanity scan finds 0. No fork-only path is present | `04` |
| T075 | Fork-ci preview, `run-folder.mjs --mode strict --origin fork`, with the T004 `psql` wrapper | outcome `pass`: deno pass, sql pass | — |
| T082 | `git diff --stat upstream/main...HEAD` | 48 files, 11,365 insertions, all under `integrations/thought-attachments/`. No `specs/`, `.specify/` or `.fork/` | `04` |

**How the gate was run:** spec 006's method (`specs/006-self-hosted-supabase/evidence/gates/README.md`). The review step was extracted as it stands in the workflow, with only the schema path redirected into the job folder. It was run with `CHANGED_FILES` from `git diff --name-only upstream/main...HEAD`, `CONTRIB_DIRS=integrations/thought-attachments`, and the base's `metadata.schema.json` staged before each run.
