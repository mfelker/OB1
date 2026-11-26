# Implementation Plan: Lean self-hosted Supabase for Open Brain

**Branch**: `contrib/mfelker/self-hosted-supabase` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-self-hosted-supabase/spec.md`

## Summary

A new recipe, `recipes/self-hosted-supabase-mcp/`, stands up a lean self-hosted Supabase for Open Brain on one machine with Docker Compose and no Kubernetes. It runs 5 of the official stack's 11 services, Studio is an opt-in profile, and Storage works.

- **Reuse, not copy.** A POSIX `setup.sh` shallow-clones the official stack at release tag `self-hosted/v0.8.5` (R1) into an ignored folder. It generates secrets with Supabase's own `generate-keys.sh` plus `MCP_ACCESS_KEY`, building the file to the side and moving it into place so it's all-or-nothing (R6). It is resumable piece by piece (FR-003). It checks Compose by asking it to read the recipe rather than comparing an unsourced version number (R2).
- **Service selection.** The recipe's `docker-compose.yml` `include:`s the official file merged with `lean.override.yml`, which uses profiles plus `!reset`/`!override` (R2). A plain `docker compose up -d` starts exactly `db`, `rest`, `api-gw`, `functions` and `storage`, all verified by probe. `--profile ui` adds `studio` and `meta`.
- **Storage** runs without `auth` and `imgproxy`, but on a **named volume**: Docker Desktop's bind mounts reject the extended attributes Storage writes (R3, probed). A one-shot `ob1-init` service creates the private bucket `ob1-files` at start (R9).
- **Schema and MCP server.** The `docs/01` schema at 1536 is a verbatim copy, guarded by a drift test, and run as a first-boot init script under `set role postgres`, so ownership matches Cloud (R7, probed). Spec 004's server is mounted read-only by reference (R8). The pinned stack in the recipe layout passed an end-to-end probe: setup check 200, six tools, capture and reworded search (R13).
- **Model servers.** The host route works on macOS and Linux through `host-gateway` (R12). Docker Model Runner is the bundled GPU option; its 1536-number embedding check is an owner-approved task (R5).

## Lane

**Lane**: upstream-bound feature
**Branch / Base**: `contrib/mfelker/self-hosted-supabase`, cut from `upstream/main` (`238df6c` at planning time; re-fetch before cutting) with `contrib/mfelker/self-hosted-llm` (`73ee726`) merged in, because the recipe mounts 004's folder and its README links to it. Before the upstream PR, the branch is rebased onto `upstream/main` after #533 merges, so the upstream diff is the one recipe folder (spec Lane table, VP-008). The fork PR's diff against fork `main`, which already has 004, is the recipe folder alone.
**Contribution folder**: `recipes/self-hosted-supabase-mcp/`
**Worktree**: `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-supabase`. Created by task T001 with `git worktree add .worktrees/contrib-self-hosted-supabase -b contrib/mfelker/self-hosted-supabase upstream/main`, then `git merge --no-ff contrib/mfelker/self-hosted-llm`. Do **not** use the `speckit.worktree.create` hook, which branches from fork `main`. All source paths in this plan and in tasks.md are rooted at the worktree. Spec-kit commands still run from the fork-`main` checkout.

## Technical Context

**Language/Version**: POSIX `sh` (setup step); YAML (Compose v2.24+ overlay); SQL (Supabase Postgres 17.6.1.136, from `docs/01`); Node 26 `node --test` for tests only (not a reader prerequisite)

**Primary Dependencies**: the official `supabase/supabase` `docker/` at `self-hosted/v0.8.5` (cloned, never copied); `openssl`, `git`, and `docker` with a Compose that can read the recipe (`include:` with `!reset`/`!override`; tested v5.6.1, R2) on the host; a pinned small `curl` image for the one-shot `ob1-init` (R9); spec 004's `integrations/self-hosted-llm-mcp` (mounted)

**Storage**: Supabase Postgres + pgvector, with `docs/01`'s `thoughts`, `match_thoughts`, `upsert_thought` at 1536 created on first boot; Supabase Storage on a named volume, bucket `ob1-files`

**AI Gateway**: none of its own; spec 004's settings point at the host model server or Docker Model Runner (FR-008, FR-017)

**Testing**:

- `node --test recipes/self-hosted-supabase-mcp/tests/`: `setup.sh` behavior with stub `git` and `docker` and a fixture clone; Compose service selection with `docker compose config` against a fixture compose file with the official service names and dependency links (skipped when `docker` is absent); the drift test against `docs/01`.
- `tests/verify.sql` (fork-ci SQL runtime) applies `db/ob1-schema.sql` in a scratch database and asserts the objects.
- Live acceptance per [quickstart.md](quickstart.md) on the Mac, then Linux (SC-010).

**Target Platform**: one machine running Docker. macOS (Docker Desktop) and Linux (Docker Engine) are both tested; Windows is not.

**Project Type**: recipe

**Constraints**:

- no secrets in tracked files (the clone, `.env` and data stay in the ignored `supabase/`); no binaries; no Kubernetes or cluster tooling (SC-002)
- no copy of Supabase's stack files and no edit to the clone (FR-001)
- no change to 004's folder or to `docs/01` (OS-003); no root `.gitignore` edit (gate rule 12)
- no automatic model pulls (FR-017)
- the gateway is published on `0.0.0.0:8000` (LAN, FR-018); no public route (OS-007)

**Scale/Scope**: single-user personal brain on one machine; 5 always-on containers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Additive-only data**: `db/ob1-schema.sql` **creates** `thoughts` and the two RPCs exactly as `docs/01` does, only on an empty database (R7). No ALTER, DROP, TRUNCATE or DELETE. RLS and policy as in `docs/01`. GRANT to `service_role` per `CONTRIBUTING.md`. The bucket is private.
- [x] **II. Remote MCP only**: no new MCP server. The recipe hosts spec 004's Edge Function in the stack's Edge Runtime and reaches it by URL. No stdio, no `claude_desktop_config.json`, no local Node server.
- [x] **III. Contribution contract**: one folder `recipes/self-hosted-supabase-mcp/` from `recipes/_template/`.
  - The README has Prerequisites, numbered Steps and Expected Outcome. It positions the recipe against `local-brain-no-mcp` and `kubernetes-deployment` and states the lean trade-offs (FR-013 to FR-016, FR-018, FR-020).
  - `metadata.json` is validated against `.github/metadata.schema.json`, with `estimated_time` from the Mac run (SC-001).
  - The recipe artifact `db/ob1-schema.sql` satisfies gate rule 6.
- [x] **IV. Test-First**: upstream-bound lane, so red-green-refactor with every red in `specs/006-self-hosted-supabase/tdd/cycle-log.md`, driven by the mandatory `before_implement` hook (`speckit.tdd.run`, stays enabled).
  - Runners: `node --test` and `tests/verify.sql`, both inside the folder.
  - No live credentials or network in tests: stubbed `git` and `docker`, a fixture clone and a fixture compose file.
  - README-only items are docs, gated by markdownlint, the link check and the live quickstart.
  - Gate 1 needs `tdd.verify` PASS or PASS_WITH_GAPS.
- [x] **V. Lane separation**: one contribution folder. `specs/`, `.specify/` and `.fork/` stay on fork `main`. The stacked base (004 merged in) is a recorded deviation, see Complexity Tracking; the upstream PR opens only after a rebase onto `upstream/main` with #533 merged.
- [x] **VI. Security, content & licensing**:
  - Generated secrets only, in an ignored file, never printed.
  - Supabase's stack (Apache-2.0) is cloned at setup, not redistributed.
  - The `curl` image is a pinned public image.
  - No binaries; the storage-check sample files are created at check time, not committed.
- [x] **VII. Sync discipline**: `upstream/main` re-fetched before cutting (T001). Fork `main` already has 004 (#20). After the fork PR merges, record the branch in `.fork/staged-prs.md` as kind `own`.

*Post-design re-check (after Phase 1)*: unchanged. The design adds no MCP surface, no schema beyond `docs/01`, and no second folder. R3's named volume and R9's one-shot service keep FR-004's always-on set (the init service exits) and FR-010's persistence.

## Project Structure

### Documentation (this feature)

```text
specs/006-self-hosted-supabase/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R12 (probes recorded)
├── data-model.md        # Phase 1: setup pieces, service sets, secrets, schema, storage
├── quickstart.md        # Phase 1: live acceptance V1–V12
├── contracts/
│   └── setup-and-stack.md   # C1 setup.sh, C2 stack commands, C3 endpoints, C4 model settings
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (worktree root)

```text
recipes/self-hosted-supabase-mcp/
├── README.md
├── metadata.json
├── .gitignore              # supabase/ (the clone, .env, database data)
├── setup.sh                # C1: resumable, pinned clone, secrets, model-setting names
├── docker-compose.yml      # include: [supabase/docker/docker-compose.yml, lean.override.yml]
├── lean.override.yml       # profiles, !reset/!override, named storage volume, ob1-init, 004 mount, env, host-gateway
├── db/
│   └── ob1-schema.sql      # create extension vector + docs/01's five blocks, verbatim
└── tests/
    ├── setup.test.mjs      # setup.sh behaviors (stub git/docker, fixture clone)
    ├── compose.test.mjs    # docker compose config against a fixture compose file (skips without docker)
    ├── schema-drift.test.mjs   # db/ob1-schema.sql contains docs/01's blocks in order
    ├── verify.sql          # fork-ci SQL runtime: scratch database, apply, assert 1536, RPCs, GRANT, RLS
    └── fixtures/           # stub executables, minimal fixture clone and fixture compose file
```

**Structure Decision**: a recipe (`recipes/self-hosted-supabase-mcp/`), close to the template's "script / importer recipe" layout, with a shell setup step and Compose files instead of an importer. It follows `recipes/local-brain-no-mcp/`'s clone-and-`include:` pattern.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Branch base is `upstream/main` **plus** `contrib/mfelker/self-hosted-llm` merged in (Principle V says "cut from `upstream/main`") | The recipe mounts `integrations/self-hosted-llm-mcp/` and links to it. Without it, neither the tests' path checks nor the live runs can work, and #533 isn't upstream yet. | Waiting for #533 would block 006 on upstream review. Copying 004 into the recipe is forbidden by FR-007. The deviation ends before the upstream PR: rebase onto `upstream/main` once #533 merges (T-last), checked with `git diff --stat upstream/main...HEAD` showing only the recipe folder. |
| `db/ob1-schema.sql` duplicates `docs/01`'s SQL | First-boot init needs a SQL file, and FR-006 requires `docs/01`'s exact definitions. | Parsing `docs/01` at setup time is fragile and needs a Markdown parser on the host. The duplication is guarded by `schema-drift.test.mjs`, which fails on any divergence. |

## Notes for `/speckit-tasks`

- **Keep live runs out of the worktree's contribution folder.** Running `setup.sh` inside the worktree puts the clone (`.ts`, `.sql`) under `recipes/self-hosted-supabase-mcp/supabase/`. Local fork-ci and TDD scans would then pick it up, because `supabase` isn't in `SKIP_DIRS` (`.fork/ci/lib/runtimes.mjs`). Do the live runs in a separate scratch checkout of the branch, or delete `supabase/` before any local CI or TDD run.
- **Final rebase.** Once #533 is upstream, use `git rebase --onto upstream/main <the 004 merge commit>`. A plain rebase would replay 004's 275 commits. The cycle-log SHAs will change, so record the old-to-new mapping in the cycle log.
- **The `images` profile** starts `imgproxy` but leaves `ENABLE_IMAGE_TRANSFORMATION=false`, so it enables nothing on its own. Planned spec 007 turns transformations on. The README says so.
- **The docker-absent compose tests** use `node:test`'s skip, never a silent pass (R10).
- **Run the gate early.** Run the gate's review checks against the folder as soon as the schema file and a `setup.sh` skeleton exist, not only at V11, to catch SQL-safety or credential false positives (for example, `create table`, or key names in `lean.override.yml`).
- **The Docker Model Runner check (R5)** is an owner-approved task: it changes a Docker Desktop setting.
