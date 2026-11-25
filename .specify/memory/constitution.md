<!--
Sync Impact Report
- Version: 1.1.0 → 1.2.0 (MINOR: every staged upstream PR is its own spec-kit feature)
  - Modified principles: IV. Test-First (staged-PR lane rule references its feature's tasks),
    VII. Sync Discipline (new staged-PR-as-feature rule; staged PRs land via fork PR, not --no-ff)
  - Modified sections: Lanes & Branching (table "Lands in" aligned with the fork-PR runbook;
    staged-PR spec directory naming)
  - Added/removed sections: none
  - Templates: spec-template already has "Lane: staged upstream PR #N" ✅; plan/tasks unchanged ✅
  - Follow-up: .fork/README.md "Stage an upstream PR" should start with /speckit-specify (deferred)
- Version: 1.0.1 → 1.1.0 (MINOR: Fork CI policy, Option C, in Quality Gates)
- Version: 1.0.0 → 1.0.1 (PATCH: spec-kit runs from fork main; worktree-rooted task paths;
  cross-folder import rule softened to match observed code; Deno test caveat; ledger covers
  own contrib branches)
- Version: template → 1.0.0 (initial ratification via /speckit-brownfield-bootstrap)
- Principles added: I–VII (all new)
- Sections added: Code Boundaries, Lanes & Branching, Testing Standards, Quality Gates, Governance
- Templates updated: spec-template.md ✅, plan-template.md ✅, tasks-template.md ✅
- Fork-only docs added: .fork/README.md ✅, .fork/staged-prs.md ✅
- Deferred: fork CI workflow, sync/staging automation scripts (future /speckit-specify features)
-->

# OB1 Fork (mfelker/OB1) Constitution

**Project identity**: Open Brain (OB1) is a persistent AI memory system — one Supabase
Postgres + pgvector database, one remote MCP protocol, any AI client. This repository is a
**fork** of `NateBJones-Projects/OB1` and is simultaneously (a) the owner's own Open Brain,
(b) a QA/staging lane for upstream pull requests, and (c) a launchpad for contributions back
upstream. Architecture: a contribution-catalog monorepo around a small core MCP server
(`server/`); each contribution is a self-contained folder deployed into the user's own
Supabase project. Primary languages: TypeScript (Deno Edge Functions, Next.js/SvelteKit
dashboards), JavaScript (Node scripts), Python (importers), SQL (Postgres).

Upstream rules in `CLAUDE.md`, `AGENTS.md`, and `CONTRIBUTING.md` remain authoritative for
anything that goes upstream. This constitution adds the fork's own stricter rules on top; it
never relaxes an upstream rule.

## Core Principles

### I. Additive-Only Data

- The core `thoughts` table structure MUST NOT be altered: adding columns is allowed;
  altering, renaming, or dropping existing columns is forbidden.
- SQL files MUST NOT contain `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, or unqualified
  `DELETE FROM`.
- New tables, columns, functions, and views MUST be idempotent where practical
  (`IF NOT EXISTS`, `CREATE OR REPLACE`) and protected by RLS when they hold user data.

*Rationale*: every OB1 user shares the `thoughts` contract; upstream gate rule 5 enforces it.

### II. Remote MCP Only

- MCP servers MUST deploy as Supabase Edge Functions (Deno + Hono + `@hono/mcp`) and connect
  via a remote URL. `StdioServerTransport`, local Node.js MCP servers, and
  `claude_desktop_config.json` MUST NOT be used.
- Every MCP tool MUST declare annotations: read-only tools `readOnlyHint: true`; write tools
  `readOnlyHint: false` plus `openWorldHint` and `destructiveHint`.
- Secrets MUST come from `Deno.env` / environment variables, never literals.

*Rationale*: upstream gate rules 14 and 16; one deployment model for every client.

### III. Contribution Contract

- Every contribution MUST live in exactly one folder `<category>/<kebab-case-name>/` where
  category ∈ `extensions | primitives | recipes | schemas | dashboards | integrations | skills`,
  and MUST be scaffolded from that category's `_template/`.
- Each folder MUST contain `README.md` and a `metadata.json` that validates against
  `.github/metadata.schema.json`.
- READMEs MUST include Prerequisites, numbered step-by-step instructions, and Expected
  Outcome; all relative links MUST resolve; extensions and integrations MUST link to
  `docs/05-tool-audit.md`; declared `requires_primitives` / `requires_skills` MUST exist and
  be linked.
- Category artifacts MUST be present (schemas → SQL; extensions → SQL + code; integrations →
  code; dashboards → frontend code/`package.json`; skills → a plain-text skill file;
  primitives → 200+ word README). `extensions/` and `primitives/` are curated upstream: new
  ones are fork-only unless a maintainer approves.

*Rationale*: upstream gate rules 1–3, 6, 9, 10, 13, 15. A fork contribution that meets the
contract can go upstream unchanged.

### IV. Test-First (NON-NEGOTIABLE)

The fork enforces TDD more strictly than upstream. Rules by lane (see Lanes & Branching):

- **Fork features and upstream-bound features**: red-green-refactor. A failing test MUST be
  committed (or demonstrably run red) before the implementation that makes it pass.
- **Staged upstream PRs**: the code already exists, so the rule is "tests before merge", and
  those tests are tasks in the staged PR's own spec-kit feature (Principle VII). Tests
  covering the PR's changed behavior MUST be written and passing before the PR is merged into
  fork `main`. If the PR has no tests, the owner writes them.
- Tests MUST live **inside the contribution folder** they cover so they stay within upstream's
  scope check and can be offered back upstream.
- Docs-only changes (README, skills prose, primitives) are exempt from unit tests but MUST
  pass the documentation gates (markdownlint, link check, README sections).
- SQL changes MUST be verified by an executable check (a test script or a documented
  query in the README's verification step that asserts the expected objects exist).

*Rationale*: the owner's standing requirement; upstream has only ~9 test files, so the fork
fills the gap and contributes tests back.

### V. Lane Separation & Upstream Fidelity

- Every change belongs to exactly one lane, declared in its spec.
- Upstream-bound branches MUST be cut from `upstream/main` and touch only one contribution
  folder (plus its tests). They MUST NOT carry `.specify/`, `specs/`, `.fork/`,
  `.claude/skills/speckit-*`, or any other fork-only path.
- Fork-only content MUST live only in paths that do not exist upstream. Upstream-tracked
  files (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/**`, `server/**`, existing
  contribution folders) MUST NOT be modified on fork `main` except by merging upstream, a
  staged upstream PR, or an upstream-bound branch.
- Fork-only behavior changes to existing upstream code require a recorded justification in
  the plan's Complexity Tracking table, because each one is a future merge conflict.

*Rationale*: keeps the fork mergeable with upstream and every upstream PR passing gate
rule 12 (scope check).

### VI. Security, Content & Licensing

- No credentials, API keys, tokens, or secrets in any file; `.env*` stays gitignored.
- No binaries over 1 MB and no `.exe`, `.dmg`, `.zip`, `.tar.gz`.
- No profanity in docs, examples, seed data, UI copy, prompts, or generated assets.
- License is FSL-1.1-MIT: no commercial derivative works; new dependencies MUST be license-
  compatible.

*Rationale*: upstream gate rules 4 and 8, `CLAUDE.md` guard rails, `LICENSE.md`.

### VII. Sync Discipline

- Upstream enters the fork only by **merge** of `upstream/main` into fork `main`; fork `main`
  is never rebased or force-pushed.
- `git rerere` MUST be enabled in every clone/worktree used for syncing.
- **Every staged upstream PR is its own spec-kit feature.** One upstream PR = one feature
  directory `specs/###-stage-pr-<N>-<short-desc>/`, taken through `/speckit-specify` →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`, with the spec's Lane set to
  "staged upstream PR #N". Staged PRs MUST NOT be batched into a shared feature, and a staged PR
  MUST NOT merge into fork `main` until its feature's tasks are complete and `fork-ci-verdict`
  passes.
- Staged upstream PRs MUST be fetched from `refs/pull/<N>/head`, keep the author's commits
  unrewritten, and land on fork `main` through a fork pull request merged with a merge commit
  (never squash or rebase). Each one MUST be recorded in
  `.fork/staged-prs.md` (PR number, head SHA, test commit(s), status). The fork's own
  upstream-bound `contrib/` branches merged into fork `main` are recorded there too: once
  upstream opens a PR for them, upstream may squash or modify it just the same.
- When upstream lands a staged PR (merge or squash, possibly modified), the sync MUST resolve
  in favor of upstream's version, then re-apply the fork's tests on top, and update the ledger.
- Sync procedure is documented in `.fork/README.md`; sync at least weekly and before
  starting any new upstream-bound branch.

*Rationale*: upstream mixes merge commits and squash merges (72 vs 34 of the last 200
first-parent commits), so staged PRs can return as duplicate content; a ledger plus rerere
makes those conflicts predictable.

## Code Boundaries

| Path | Contains | Owner / rule |
|------|----------|--------------|
| `server/` | Core remote MCP server (Deno Edge Function) + Node test | Upstream; change only via upstream-bound or staged lanes |
| `extensions/` | Curated 6-step learning path (SQL + Edge Function each) | Upstream-curated |
| `primitives/` | Reusable concept guides | Upstream-curated |
| `recipes/`, `schemas/`, `integrations/`, `dashboards/`, `skills/` | Open contribution categories | One folder per contribution |
| `docs/`, `resources/` | Guides, walkthroughs, diagrams | Upstream |
| `.github/` | Gate, review, and automation workflows | Upstream; disabled on the fork |
| `.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*` | Spec-kit config, feature specs, fork runbooks | **Fork-only**; never upstream |

Contributions SHOULD NOT import code from other contribution folders; dependencies between
contributions are expressed through `metadata.json` (`requires_primitives`,
`requires_skills`, `requires.open_brain`) and shared database objects. (Observed exception:
`integrations/open-brain-rest/smoke/` imports seed data from `docs/walkthroughs/` — importing
shared fixtures from `docs/` is tolerated; importing another contribution's code is not.)

## Lanes & Branching

| Lane | Branch | Cut from | Lands in |
|------|--------|----------|----------|
| Fork feature | `fork/<short-desc>` | fork `main` | fork `main` |
| Upstream-bound feature | `contrib/mfelker/<short-desc>` | `upstream/main` | upstream PR **and** fork `main` via a fork PR |
| Staged upstream PR | `stage/pr-<N>-<short-desc>` | `refs/pull/<N>/head` (upstream) | fork `main` via a fork PR, as its own spec-kit feature |
| Upstream sync | `sync/upstream-<YYYY-MM-DD>` (optional) | fork `main` | fork `main` |

- Spec-kit spec directories (`specs/###-name/`) are independent of branch names; pass
  `GIT_BRANCH_NAME` with the lane prefix when a branch is created for a feature. A staged PR's
  feature uses `specs/###-stage-pr-<N>-<short-desc>/` and branch `stage/pr-<N>-<short-desc>`.
- Specs for upstream-bound work are authored on fork `main`; implementation happens in a
  separate git worktree on the `contrib/` (or `stage/`) branch, per upstream's
  one-worktree-per-task rule.
- **Spec-kit commands (`/speckit-*`) MUST run from the fork-`main` checkout.** Worktrees cut
  from `upstream/main` or a PR head have no `.specify/`, `specs/`, or speckit skills, and
  `.specify/feature.json` is per-checkout. For those lanes, the plan MUST record the worktree's
  absolute path and every task path MUST be rooted at it, so `/speckit-implement` writes into
  the worktree, never onto fork `main`.
- Naming: kebab-case for folders and branch suffixes; files follow category templates
  (`schema.sql`, `index.ts`, `deno.json`, `metadata.json`, `README.md`).
- Commit and PR titles: `[category] Short description` (`[recipes]`, `[schemas]`, …);
  fork-only commits use `[fork]`.

## Testing Standards

| Code type | Runner | Location (inside the contribution folder) | Precedent |
|-----------|--------|-------------------------------------------|-----------|
| Deno Edge Functions | `deno test` | `*_test.ts` next to `index.ts` or in `tests/` | **New convention** (no upstream precedent; requires the Deno CLI). `index.ts` reads env and builds clients at module top level, so tests MUST either set env stubs before import or exercise extracted pure functions; `server/test-stateless.mjs` mirrors the pattern instead of importing it. |
| Node/TypeScript apps (Next.js, Vite) | Vitest (`npm test` → `vitest run`) | `src/**/__tests__/*.test.ts` | `recipes/vercel-neon-telegram` |
| Plain Node scripts / protocol checks | `node <file>.mjs` or `node --test` | `test-*.mjs` / `__tests__/*.test.js` | `server/test-stateless.mjs`, `integrations/chrome-capture-extension` |
| Python importers | pytest | `tests/test_*.py` | `integrations/hermes-agent-memory` |
| SQL | Executable verification query/script | `tests/` or README verification step | — |

Tests MUST NOT require live credentials; external services (Supabase, OpenRouter) MUST be
mocked or stubbed, following `server/test-stateless.mjs` (no infra) as the model.

## Quality Gates

A change is mergeable into fork `main` only when all applicable gates pass:

1. Tests for the lane pass (Principle IV), with evidence recorded in the PR/merge description.
2. `markdownlint-cli2 --config .github/.markdownlint.jsonc` passes on changed Markdown.
3. `metadata.json` validates against `.github/metadata.schema.json`.
4. Upstream gate rules 1–16 (CONTRIBUTING.md "The Automated Review Rules") are self-checked
   for any contribution folder touched; ESLint passes where the subproject configures it.
5. For upstream-bound branches: `git diff --stat upstream/main...HEAD` shows only the one
   contribution folder.

**Fork CI policy (Option C, decided 2026-11-24)**: upstream workflow files are never edited or
deleted; they are enabled or disabled through repo settings only.

- **Enabled**: `OB1 PR Gate` (`ob1-gate-v2.yml`) and `Markdown Lint` (`markdown-lint.yml`).
  They give upstream-identical checks before submitting. The gate is authoritative for
  `contrib/` → `main` and `stage/` → `main` PRs; on fork-only PRs (touching `.specify/`,
  `specs/`, `.fork/`) its failures on Folder structure and Scope are expected and advisory.
- **Disabled**: every other upstream workflow (bots, triage, release, Discord, Pages,
  README-contributions PR, follow-ups, Claude review).
- **New upstream workflows** arrive active after a sync; each sync MUST re-check and disable
  any not listed as enabled above.
- Upstream CI runs no contribution tests, so Principle IV is enforced by a fork-only workflow
  (`fork-ci`, fork-only file name), not by upstream CI.

## Governance

- This constitution supersedes ad-hoc practice in the fork; upstream's `CONTRIBUTING.md`
  remains the source of truth for what upstream accepts. If they conflict, the stricter rule
  wins for fork `main`, and upstream's rule wins for upstream-bound branches.
- Amendments: edit this file, bump the version (MAJOR: principle removed/redefined; MINOR:
  principle or section added; PATCH: clarification), update the Sync Impact Report, and
  propagate to `.specify/templates/*`.
- Every `/speckit-plan` MUST run the Constitution Check; violations MUST be justified in
  Complexity Tracking or the plan does not proceed.
- Re-run `/speckit-brownfield-validate` after upstream syncs that change `CONTRIBUTING.md`,
  `CLAUDE.md`, or `.github/metadata.schema.json`.

**Version**: 1.2.0 | **Ratified**: 2026-11-24 | **Last Amended**: 2026-11-24
