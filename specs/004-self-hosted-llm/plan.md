# Implementation Plan: Self-hosted LLM backend for Open Brain

**Branch**: `contrib/mfelker/self-hosted-llm` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-self-hosted-llm/spec.md`

## Summary

A new remote MCP server, `integrations/self-hosted-llm-mcp/`, is a Supabase Edge Function that offers core's six tools unchanged (parity baseline: upstream `238df6c`). It sends embedding and metadata calls to any OpenAI-compatible model server, configured by `EMBEDDING_*` / `CHAT_*` / `FETCH_TIMEOUT_MS` (upstream's timeout name, R11), with no cloud fallback.

It adds:

- strict failure behavior: a thought is never stored without its embedding, vectors must be 1536 long, chat failure falls back to default metadata, and the timeout is configurable
- `metadata.embedding_model` on every capture
- a key-protected `GET …/setup-check` route

Embedding requests always ask for `dimensions: 1536`. If a server rejects that field, the request is retried once without it (research R3). The logic lives in injectable modules behind a thin `index.ts`, so it is tested in-process with a fake model server and no network (R4). The same code deploys to Supabase Cloud (`--no-verify-jwt`) and to a self-hosted Compose stack, where JWT verification is a single global switch that is off by default (R2).

## Lane

**Lane**: upstream-bound feature
**Branch / Base**: `contrib/mfelker/self-hosted-llm` from `upstream/main` (`238df6c` at planning time; re-fetch before cutting)
**Contribution folder**: `integrations/self-hosted-llm-mcp/`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-llm`. Created 2026-11-26 at `238df6c` with `git worktree add .worktrees/contrib-self-hosted-llm -b contrib/mfelker/self-hosted-llm upstream/main`; `tdd.mjs where` resolves it. The branch tracks `upstream/main`, so push with `git push -u origin contrib/mfelker/self-hosted-llm`. Do **not** use the `speckit.worktree.create` hook, which branches from fork `main`. All source paths in this plan and in tasks.md are rooted at the worktree. Spec-kit commands still run from the fork-`main` checkout.

## Technical Context

**Language/Version**: Deno 2.x (Supabase Edge Functions, TypeScript); local and CI Deno 2.9.x

**Primary Dependencies**: `hono@4.9.2`, `@hono/mcp@0.1.1`, `@modelcontextprotocol/sdk@1.24.3`, `zod@4.1.13`, `@supabase/supabase-js@2.47.10` (same versions as `server/deno.json`), imported in source with **full `npm:` specifiers**, because the self-hosted router uses one shared import map for all functions and ignores the function's own `deno.json` (R10); `jsr:@std/assert` for tests

**Storage**: Supabase Postgres + pgvector: existing `thoughts`, `match_thoughts`, `upsert_thought` at 1536 (VP-009); no schema change; `metadata.embedding_model` key only

**AI Gateway**: any OpenAI-compatible server (`/embeddings`, `/chat/completions`, `/models`); candidate tested pair Ollama ≥ 0.11.11 + `qwen3-embedding:4b` (R1, owner-verified in tasks)

**Testing**: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read` (fork-ci `deno` profile, no `--allow-net`); the model server stand-in is an injected `fetch`, and the database is a fake `ThoughtStore` or a fake `fetch` given to supabase-js

**Target Platform**: Supabase Edge Functions on Supabase Cloud and on the self-hosted Docker Compose stack (remote MCP URL)

**Project Type**: integration

**Constraints**:

- no secrets in files; no binaries; FSL-compatible deps; remote MCP only
- key values never in errors or responses (FR-010)
- worst-case `/setup-check` ≈ one `FETCH_TIMEOUT_MS`, under the 150 s idle limit (R8)
- no import-time env reads or `Deno.serve` outside `index.ts` (R4)
- no bare import specifiers in source (R10, FR-014)

**Scale/Scope**: single-user personal brain; one request at a time; two `count` queries per setup check

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Additive-only data**: no SQL at all; writes only a new key inside the existing `metadata` JSON. The compensating delete (R6, option C) is a supabase-js call qualified by `id`, `embedding IS NULL` and the read-back timestamps. It removes only a row this capture inserted, never a pre-existing one. It is not a SQL file and not an unqualified `DELETE FROM`.
- [x] **II. Remote MCP only**: Edge Function + `@hono/mcp`; `Deno.serve` only; no stdio and no `claude_desktop_config.json`; tool annotations copied from core; all settings from `Deno.env` through an injected getter.
- [x] **III. Contribution contract**: one folder `integrations/self-hosted-llm-mcp/` scaffolded from `integrations/_template/`. The README has Prerequisites, numbered steps, Expected Outcome, a link to `docs/05-tool-audit.md`, and positioning against `integrations/kubernetes-deployment`. `metadata.json` is validated against `.github/metadata.schema.json`. Code artifacts are present.
- [x] **IV. Test-First**: runner `deno test`; tests in `integrations/self-hosted-llm-mcp/tests/`; upstream-bound lane, so red-green-refactor with every red in `specs/004-self-hosted-llm/tdd/cycle-log.md`, driven by the mandatory `before_implement` hook (`speckit.tdd.run`, stays enabled). No live credentials, network or GPU in tests (R4). README-only items (FR-012, FR-017, FR-019, FR-021, FR-022, FR-023 wording) are docs, gated by markdownlint, the link check and the manual quickstart. Gate 1 needs `tdd.verify` PASS or PASS_WITH_GAPS.
- [x] **V. Lane separation**: branch cut from `upstream/main`. It touches only `integrations/self-hosted-llm-mcp/`, checked with `git diff --stat upstream/main...HEAD`. `specs/`, `.specify/`, `.fork/` stay on fork `main`. Core `server/**` is not modified.
- [x] **VI. Security, content & licensing**: no secrets, with key redaction tested. Example keys in the README are placeholders. No binaries. Deps are core's (MIT/Apache-2.0).
- [x] **VII. Sync discipline**: fork `main` contains `upstream/main` (`238df6c`, checked 2026-11-26). Re-fetch upstream before cutting the branch. After the fork PR merges, record `contrib/mfelker/self-hosted-llm` in `.fork/staged-prs.md`.

**Post-design re-check (after Phase 1)**: all pass, and no Complexity Tracking entries are needed. The design decisions that come closest to a principle are recorded in research instead:

- the R6 compensating delete (Principle I): option C, deletes only a row this call inserted (shown by `created_at = updated_at`); code, not SQL; residual documented
- in-process testing (Principle IV): required by fork-ci's no-network profile

## Project Structure

### Documentation (this feature)

```text
specs/004-self-hosted-llm/
├── spec.md
├── plan.md                         # this file
├── research.md                     # R1 (OS-003), R2 (OS-006), R3–R10
├── data-model.md                   # config, call outcomes, thought metadata, setup-check report
├── quickstart.md                   # automated + manual validation
├── contracts/
│   ├── mcp-tools.md                # six-tool parity, auth, config gate, capture outcomes
│   ├── setup-check.md              # GET …/setup-check route
│   └── model-server-requests.md    # request shapes, dimensions retry
├── checklists/
└── tasks.md                        # /speckit-tasks (not created here)
```

Specs live on fork `main` only and are never copied onto the `contrib/` branch.

### Source Code (worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-llm`)

```text
integrations/self-hosted-llm-mcp/
├── README.md
├── metadata.json
├── deno.json                # kept for Cloud bundling and fork-ci's deno profile detection; source does not rely on its import map (R10)
├── index.ts                 # only: Deno.serve(createApp(productionDeps()).fetch)
├── lib/
│   ├── config.ts            # resolve env → per-role config, missing[], invalid[]
│   ├── model_client.ts      # embed / chat / listModels with timeout, outcomes, dimensions retry, redaction
│   ├── metadata.ts          # core prompt, usable-JSON parsing, default metadata
│   ├── thought_store.ts     # ThoughtStore interface + supabase-js implementation (match, list, stats, fetch, upsert, setEmbedding, readBack, deleteIfInsertedByCall, counts)
│   ├── tools.ts             # buildServer(deps): the six tools, core text/annotations
│   ├── setup_check.ts       # runSetupCheck(deps) → report
│   └── app.ts               # createApp(deps): Hono, CORS, auth, /setup-check route, MCP route
└── tests/
    └── *_test.ts            # one file per lib module + app-level tests through createApp(fakeDeps).fetch
```

**Structure Decision**: an Edge Function integration at `integrations/self-hosted-llm-mcp/`, split into `lib/` modules so the spec's Testing Requirements are met in-process (R4). The module list above is the intended layout, not a contract. Tasks may merge modules if a test drives it.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 99 behaviors graded `TEST_AFTER` by the TDD audit (`tdd/verification.md`, `8fcda29`): their tests passed on the first run, because an earlier cycle in the same stream had already implemented the behavior. Principle IV requires each behavior's red before its implementation. | Owner decision 2026-11-26 (task T057): accept as a recorded exception, as spec 005 did for its six. Each of the 99 carries a recorded deliberate-mutant check showing the test fails when its behavior is broken (`tdd/cycle-log.md`). The integrator re-ran three of those checks (U156, U160, U161) at merge. The cause is a process pattern (cycles implementing more than their own test required), not missing tests. | Re-driving them is impossible: a behavior that already exists cannot produce a pre-implementation red again. Deleting and re-implementing code to manufacture a red would be theater, and strengthened tests still grade `TEST_AFTER` (spec 005). The HIGH findings that do weaken the safety net are remediated separately (T050–T056). |
| U206 graded `TEST_AFTER` by the re-audit (`tdd/verification.md`, `2d7f60b`). It is a behavior added by audit remediation (T050) to cover R6's merged-row-without-embedding case, so its code already existed and its test passed on the first run. | Owner decision 2026-11-26 (task T062): extend the T057 exception to U206. Its evidence is deliberate mutant M6 (dropping `createdAt === updatedAt` from `lib/tools.ts:232` fails U206), which the remediation agent ran and the integrator re-ran. | A remediation test for existing code cannot produce a pre-implementation red. The rubric itself grades strengthened tests `TEST_AFTER` (spec 005). |
