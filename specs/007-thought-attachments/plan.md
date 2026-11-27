# Implementation Plan: Thought attachments (files linked to thoughts)

**Branch**: `contrib/mfelker/thought-attachments` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-thought-attachments/spec.md`

## Summary

A new remote MCP integration, `integrations/thought-attachments/`, links real files (PDF manuals and photos) to thoughts and makes them findable through the brain's **unchanged** core search.

- **Files never pass through MCP.** `attach_file` returns three ways in: a signed Storage upload link, a ready-to-run `curl` line, and a one-time phone page link. The integration enforces its own 60-minute window, because Storage's signed upload links always last 2 hours (R8).
- **Derived thoughts.**
  - PDF text (from `unpdf`, R2) is cut into passages, and photos get a caption from an OpenAI-compatible vision model (R4).
  - Each passage or caption becomes an ordinary thought: it starts with a source line, is labelled `reference`, carries the ingestion contract's metadata, and is embedded with the brain's own model at the brain's dimension (R3).
  - Writes go through the integration's own database function in one transaction, never through `upsert_thought`'s merge (R9). That gives all-or-nothing finishing, exclusive ownership, and rebuilds that keep the old set on failure.
- **Fits Cloud's limits (probed).**
  - On a Free-plan project, a dense 50-page PDF costs 0.8–1.0 s of the 2 s CPU budget, and a 10 MB image encodes in about 70 ms (R1).
  - The caps are settings; SC-004 is evidenced, and is re-checked with a real manual on the live run.
- **Phone upload.**
  - iPhone photos arrive as JPEG even with the camera on HEIC (probed on the owner's phone, R7).
  - The page is one static file. The function serves it on self-hosted (probed); on Cloud the owner publishes it to a static host, because Cloud rewrites HTML to plain text (R5, owner decision).
  - Every returned link uses an address the phone can reach (R6).
- **Safety.**
  - Finish and remove run one at a time per attachment, through an expiring claim (R10).
  - The lookup uses parameters, not filter strings (R11).
  - The same access key as the core; deployed with `--no-verify-jwt` (R13).

## Lane

**Lane**: upstream-bound feature
**Branch / Base**: `contrib/mfelker/thought-attachments`, cut from `upstream/main` (`238df6c` at planning time; re-fetch before cutting). No stacking: it doesn't depend on spec 004 or upstream PR 533. The fork PR's diff and the upstream PR's diff are both the one integration folder.
**Contribution folder**: `integrations/thought-attachments/`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/contrib-thought-attachments`. Task T001 creates it with `git fetch upstream && git worktree add .worktrees/contrib-thought-attachments -b contrib/mfelker/thought-attachments upstream/main`. Do **not** use the `speckit.worktree.create` hook, which branches from fork `main` (as in spec 006). All source paths in this plan and in tasks.md are rooted at the worktree. Spec-kit commands still run from the fork-`main` checkout.

## Technical Context

**Language/Version**: Deno (Supabase Edge Functions, TypeScript; `edge-runtime` v1.79.2 on self-hosted; probed on both platforms); SQL (Supabase Postgres 17); one static HTML file with inline script

**Primary Dependencies**: `hono`, `@hono/mcp`, `@modelcontextprotocol/sdk`, `zod` and `@supabase/supabase-js`, at the versions upstream's `server/deno.json` pins (hono 4.9.2, @hono/mcp 0.1.1, SDK 1.24.3, zod 4.1.13, supabase-js 2.47.10); `unpdf` 2.2.3 (MIT); `@std/encoding` (base64); `pdf-lib` 1.17.1 (MIT), in tests only

**Storage**: Supabase Postgres + pgvector: the core `thoughts` table (derived rows added; `content_fingerprint` added only if missing, R16) plus the new `thought_attachments` table ([data-model.md](data-model.md)); Supabase Storage, private bucket `ob1-files` (R12)

**AI Gateway**: OpenAI-compatible endpoints set by the owner: embeddings (same names as 004 and 006; Cloud default OpenRouter `openai/text-embedding-3-small`) and vision (`VISION_*`) ([contracts/settings.md](contracts/settings.md))

**Testing**:

- `deno test` in `integrations/thought-attachments/tests/`. It calls the app's request handler directly, with fakes for Storage, the database client, embeddings and vision. There is no network (fork CI's deno runtime). Sample PDFs are generated with `pdf-lib` at test time (R15).
- `tests/verify.sql` on fork CI's throwaway Postgres with pgvector covers the table, indexes, grants, RLS, and the claim, write, remove, lookup, dimension and orphan functions.
- Live acceptance on Cloud and on 006 per [quickstart.md](quickstart.md).

**Target Platform**: Supabase Edge Functions as a remote MCP URL: Supabase Cloud (Free and paid) and spec 006's self-hosted stack

**Project Type**: integration

**Constraints**:

- no secrets in files; no binaries over 1 MB (fixtures are generated, R15); FSL-1.1-MIT-compatible dependencies; remote MCP only
- Cloud: 2 s CPU per request, 150 s wall clock on Free, 256 MB of memory (R1)
- no change to the core `thoughts` columns (adding `content_fingerprint` only where missing, R16); no change to spec 006's folder (R14) or to upstream-tracked files
- no `upsert_thought` for derived thoughts (R9)

**Scale/Scope**: single-user personal brain. A manual of up to 50 pages makes about 50–350 passages; photos are up to 10 MB; dozens to hundreds of attachments.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Additive-only data**:
  - new table `thought_attachments`, with RLS on and `service_role` grants;
  - `thoughts` only gains `content_fingerprint` if it is missing (`if not exists`, matching `docs/01`);
  - derived thoughts are inserted rows;
  - every delete is scoped by an attachment id (FR-016), and no `DROP`, `TRUNCATE` or unqualified `DELETE` appears in SQL files.
- [x] **II. Remote MCP only**: one Edge Function with Hono and `@hono/mcp`; 7 tools, each annotated ([contracts/mcp-tools.md](contracts/mcp-tools.md)); secrets from the environment ([contracts/settings.md](contracts/settings.md)). The page routes are plain HTTP on the same function, gated by a token.
- [x] **III. Contribution contract**:
  - one folder, from `integrations/_template/`; README with prerequisites, numbered steps (both platforms), expected outcome, troubleshooting, and links to `docs/05-tool-audit.md`, `docs/ingestion-metadata-contract.md` and 006's recipe;
  - `metadata.json` valid against `.github/metadata.schema.json`; code present.
- [x] **IV. Test-First**:
  - Deno tests and `tests/verify.sql` live inside the folder;
  - red-green-refactor, with each red recorded in `tdd/cycle-log.md`;
  - the mandatory `before_implement` TDD hook stays enabled;
  - no live credentials (fakes).
  - Live runs are acceptance evidence, not unit tests.
- [x] **V. Lane separation**: the branch is cut from `upstream/main` and touches only `integrations/thought-attachments/`; `specs/`, `.fork/` and `.specify/` stay on fork `main`; 006's folder is not edited (R14).
- [x] **VI. Security, content & licensing**:
  - tokens are stored only as hashes; links carry no brain key;
  - dependencies are MIT or compatible (`unpdf`, `pdf-lib`);
  - no binaries and no profanity.
- [x] **VII. Sync discipline**: fetch `upstream` and cut from the current `upstream/main` in T001. Fork `main` is 5 commits ahead of origin with spec work only; push when the owner asks.

**Post-design re-check (after Phase 1)**: all seven still pass. The design adds no fork-only change to upstream code, and the only change to `thoughts` is R16's guarded column.

## Project Structure

### Documentation (this feature)

```text
specs/007-thought-attachments/
├── plan.md              # This file
├── research.md          # Phase 0 (R1–R16)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1: live acceptance runs
├── contracts/
│   ├── mcp-tools.md     # the 7 tools, observable behaviour
│   ├── upload-page.md   # phone page and its token routes
│   └── settings.md      # environment variables and defaults
├── evidence/
│   ├── spike/           # Cloud compute probe (R1)
│   └── phone-format/    # iPhone format probe (R7)
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

Specs live on fork `main` only. They are never copied onto the `contrib/` branch.

### Source Code (worktree root)

```text
integrations/thought-attachments/
├── README.md
├── metadata.json
├── deno.json            # import map (npm: and jsr: specifiers, pinned)
├── index.ts             # entry: MCP route, GET /upload, POST /page/start, POST /page/finish
├── upload-page.html     # the phone page (served on self-hosted; published on Cloud)
├── schema.sql           # thought_attachments, functions, grants, RLS, guarded column and bucket
├── src/                 # modules; tasks.md settles the split
└── tests/
    ├── *_test.ts        # deno test, fakes only, no network
    └── verify.sql       # executable SQL verification
```

**Structure Decision**: an Edge Function contribution at `integrations/thought-attachments/`. It is one function serving both the MCP route and the page routes, so one deployment and one URL serve both platforms.

## Complexity Tracking

No constitution violations. Deviations from defaults, recorded for reviewers:

| Deviation | Why needed | Simpler alternative rejected because |
|-----------|------------|--------------------------------------|
| The `speckit.worktree.create` hook is not used | The branch must start from `upstream/main` (Principle V) | The hook branches from fork `main` and would carry `specs/` and `.fork/` |
| Derived thoughts bypass the base `upsert_thought` | Its table-wide merge would break exclusive ownership and all-or-nothing finishing (VP-004, R9) | Per-passage `upsert_thought` is neither atomic nor merge-free |
| `schema.sql` may add `thoughts.content_fingerprint` | Brains that predate guide step 2.6, and fork CI's bootstrap, lack it (R16) | Requiring it as a manual prerequisite would fail opaquely on older brains |
