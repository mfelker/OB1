# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Lane

**Lane**: [fork feature / upstream-bound feature / staged upstream PR #N]
**Branch / Base**: [`fork/<desc>` from fork `main` | `contrib/mfelker/<desc>` from `upstream/main` | `stage/pr-<N>-<desc>` from `refs/pull/<N>/head`]
**Contribution folder**: `[category]/[kebab-case-name]/`
**Worktree**: [`/absolute/path/to/worktree` for upstream-bound and staged lanes, or none (fork-`main` checkout) for a fork feature done in place] — all source paths in this plan and in tasks.md are rooted here; spec-kit commands still run from the fork-`main` checkout

<!--
  REQUIRED, read by the TDD adapter (`node .fork/ci/bin/tdd.mjs`, see .fork/ci/README.md):
  - Lane line: starts with one of "fork feature", "upstream-bound feature", "staged upstream PR #N".
  - Worktree line: a real value. Either an absolute path in backticks (required for the
    upstream-bound and staged lanes), or a value starting with "none", e.g.
    "none (fork-`main` checkout)", for a fork feature done in place.
  - Contribution folder line: a real repo-relative path in backticks (no leading "/", no "..").
    A fork-only feature names its main code folder, e.g. `.fork/ci`. A value starting with
    "N/A" is rejected.
  Any line still containing "[" is an unfilled placeholder, and the adapter refuses to run.
-->

## Technical Context

<!--
  ACTION REQUIRED: Keep the rows that apply to this contribution; delete the rest.
  Known OB1 stack values are pre-filled.
-->

**Language/Version**: [Deno (Supabase Edge Functions, TypeScript) / Node TypeScript / Python 3 / SQL (Supabase Postgres)]

**Primary Dependencies**: [Edge Function: hono, @hono/mcp, @modelcontextprotocol/sdk, zod, @supabase/supabase-js via `deno.json` import map | Dashboard: Next.js 16 + React 19 + Tailwind 4, or SvelteKit + Vite | Importer: requirements.txt / package.json]

**Storage**: Supabase Postgres + pgvector (`thoughts` table + additive schemas) [or N/A]

**AI Gateway**: [OpenRouter (embeddings/LLM) / none]

**Testing**: [`deno test` | Vitest (`npm test`) | `node <file>.mjs` / `node --test` | pytest | SQL verification] — see constitution Testing Standards

**Target Platform**: [Supabase Edge Functions (remote MCP URL) / Vercel / Netlify / Cloudflare / local script]

**Project Type**: [recipe / schema / integration / dashboard / skill / extension / primitive]

**Constraints**: No secrets in files; no binaries >1 MB; FSL-1.1-MIT-compatible deps; remote MCP only [+ feature-specific]

**Scale/Scope**: [single-user personal brain; thought volume assumptions or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **I. Additive-only data** — no ALTER/DROP of existing `thoughts` columns; no DROP TABLE / DROP DATABASE / TRUNCATE / unqualified DELETE; RLS on new user-data tables
- [ ] **II. Remote MCP only** — Edge Function + `@hono/mcp`; no stdio / `claude_desktop_config.json`; every tool annotated; secrets via env
- [ ] **III. Contribution contract** — one `<category>/<kebab-name>/` folder from `_template/`; README (Prerequisites, numbered steps, Expected outcome, links resolve, tool-audit link if extension/integration); `metadata.json` valid against `.github/metadata.schema.json`; category artifacts present
- [ ] **IV. Test-First** — runner chosen; tests inside the contribution folder; lane rule stated (red-green-refactor with the red in `tdd/cycle-log.md`, or tests-green-before-merge with the red at the PR base for staged PRs); the mandatory `before_implement` TDD hook stays enabled, or Complexity Tracking states why it is `enabled: false`; no live credentials
- [ ] **V. Lane separation** — upstream-bound branch cut from `upstream/main` and touches one folder only; no fork-only paths (`.specify/`, `specs/`, `.fork/`) on it; no edits to upstream-tracked files on fork `main` without justification
- [ ] **VI. Security, content & licensing** — no secrets, no binaries >1 MB, no profanity, license-compatible deps
- [ ] **VII. Sync discipline** — fork `main` synced with `upstream/main` before branching; staged PR recorded in `.fork/staged-prs.md`

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — MCP tool schemas, REST shapes. State observable behavior, not behavior-bearing implementation details (e.g. "load X with a dynamic import"): a detail prescribed here gets built before its own test and is graded TEST_AFTER (spec 005, U25/U26)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Specs live on fork `main` only. For upstream-bound work they are never copied onto the
`contrib/` branch.

### Source Code (repository root)
<!--
  ACTION REQUIRED: Keep the ONE layout that matches the category; replace names with real
  paths. The delivered plan must not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option A: Edge Function contribution (integrations/, extensions/, some recipes/)
[category]/[kebab-name]/
├── README.md
├── metadata.json
├── deno.json            # import map (npm: specifiers)
├── index.ts             # Hono + @hono/mcp remote MCP / HTTP handler
├── index_test.ts        # deno test (or tests/*_test.ts)
└── schema.sql           # if it adds tables (additive only)

# [REMOVE IF UNUSED] Option B: Schema contribution (schemas/)
schemas/[kebab-name]/
├── README.md
├── metadata.json
├── schema.sql           # or migrations/*.sql
└── tests/verify.sql     # executable verification

# [REMOVE IF UNUSED] Option C: Script / importer recipe (recipes/)
recipes/[kebab-name]/
├── README.md
├── metadata.json
├── package.json | requirements.txt
├── [import-script].mjs | .py
└── __tests__/*.test.ts | tests/test_*.py

# [REMOVE IF UNUSED] Option D: Dashboard (dashboards/)
dashboards/[kebab-name]/
├── README.md
├── metadata.json
├── package.json         # next / sveltekit
└── src/**/__tests__/*.test.ts   # Vitest

# [REMOVE IF UNUSED] Option E: Skill (skills/) — docs-only, gates instead of unit tests
skills/[kebab-name]/
├── README.md
├── metadata.json
└── [skill-name].md      # plain-text skill file
```

**Structure Decision**: [Name the chosen option and the real folder path]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., fork-only change to `server/index.ts`] | [current need] | [why an additive contribution folder is insufficient] |
| [e.g., touches 2 contribution folders] | [specific problem] | [why it cannot be split into separate PRs] |
