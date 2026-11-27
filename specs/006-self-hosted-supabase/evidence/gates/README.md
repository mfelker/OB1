# Spec 006 gates T039–T045 (local run, 2026-11-27)

Branch `contrib/mfelker/self-hosted-supabase` at `9744cd2`, worktree `.worktrees/contrib-self-hosted-supabase`. Fork `main` at `79a9092`, `upstream/main` at `238df6c`. GitHub Actions is disabled on the account, so these checks were run locally.

| Task | Check | Result | File |
|------|-------|--------|------|
| T039 | Refactor pass, all tests green | `setup.sh` (86 lines) and `init/create-bucket.sh` (23 lines) reviewed after three audits; no structural refactor warranted, no change. Suite 60/60. | `05-suite.txt` |
| T040 | `metadata.json` against `.github/metadata.schema.json` | Pass, with the schema taken from both fork `main` and `upstream/main` (the gate validates against the base's schema) | `01`, `02` |
| T041 | `markdownlint-cli2 --config .github/.markdownlint.jsonc` | 0 issues in 1 file | `03-markdownlint.txt` |
| T042 | README: Prerequisites, numbered steps, Expected Outcome, relative links, `docs/05-tool-audit.md` link | Pass: 7 numbered steps; all 8 relative link targets exist in the worktree; the tool-audit link is at README line 110 | `01`, `02` (README completeness, Internal links) |
| T043 | Secrets, binaries, profanity, SQL safety, plus all OB1 gate checks with the upstream title `[recipes] Lean self-hosted Supabase for Open Brain` | 15/15 gate checks pass under both schemas; the profanity word scan of the folder finds nothing | `01`, `02` |
| T045 | `git diff --stat main...HEAD` against fork `main` | 18 files, all under `recipes/self-hosted-supabase-mcp/` | `04-scope-diff-stat.txt` |

**How the gate was run:** the review step of `.github/workflows/ob1-gate-v2.yml` was extracted as it stands in the file. It was run with `CHANGED_FILES` set to `git diff --name-only origin/main...HEAD` and `CONTRIB_DIRS` set to `recipes/self-hosted-supabase-mcp`. Before each run, the base's `metadata.schema.json` was copied to `/tmp/ob1-metadata.schema.json`, as the workflow's earlier step does.

**Note for the upstream PR (T048):** `integrations/self-hosted-llm-mcp/` is linked from the README. It exists on the branch through spec 004's merge but is not yet on `upstream/main`, and lands there with #533. The branch is rebased after that (T047).
