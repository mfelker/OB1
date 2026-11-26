# Feature Specification: Lean self-hosted Supabase for Open Brain

**Feature Branch**: `contrib/mfelker/self-hosted-supabase`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Spec 006: self-hosted Supabase stack for Open Brain (the follow-up OS-001 from spec 004). A new upstream-bound recipe that stands up a LEAN self-hosted Supabase instead of Kubernetes or the full stack: always-on db, rest, api-gw, functions and storage (so later features can keep files such as product service manuals and photos of where things are stored; imgproxy optional), with studio + meta as an optional profile. No auth, realtime or supavisor. Reuse the official supabase/supabase Compose stack via a setup script that clones it at a pinned commit plus an overlay compose file using `include:` — never vendor Supabase's compose file. Creates the docs/01 schema at 1536 with the GRANT step and deploys spec 004's integrations/self-hosted-llm-mcp as the six-tool MCP server. Model server: any OpenAI-compatible server the owner runs. New, empty brain; migration and re-embedding are a later spec (008); file attachments, attach/fetch tools, PDF text extraction and vision captions are a later spec (007) — 006 only provides a working Storage service. README states what the lean stack drops and costs, and positions against local-brain-no-mcp and kubernetes-deployment. Upstream PR only after upstream #533 merges; land on the fork first. Research: does Storage work without the auth service?"

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | upstream-bound feature |
| **Branch** | `contrib/mfelker/self-hosted-supabase` |
| **Base** | `upstream/main` once upstream #533 merges. Until then, `upstream/main` with `contrib/mfelker/self-hosted-llm` merged in (stacked), because the recipe deploys that integration; the branch is rebased onto `upstream/main` before the upstream PR so its diff is the one recipe folder (VP-008) |
| **Category** | recipes |
| **Contribution folder** | `recipes/self-hosted-supabase-mcp/` (new) |
| **Upstream PR** | to be opened after upstream #533 merges; landed on the fork first through a fork PR (fork `main` already has 004) |
| **Requires** | Docker with Compose v2.20 or newer (for `include:`); `git`; an OpenAI-compatible model server with one embedding model that returns 1536 dimensions and one chat model (spec 004's requirements); `integrations/self-hosted-llm-mcp/` in the same checkout |

## Clarifications

### Session 2026-11-26

- Q: Which Supabase services does the stack run? → A: Lean plus Storage: the database, the REST API, the gateway, the Edge Functions runtime and Storage always run; the Studio web UI (with the metadata service it needs) is an optional add-on started only on request. No user-login service, realtime or connection pooler.
- Q: What is in 006's scope? → A: The stack only, starting from a new, empty brain. Moving an existing brain over and re-embedding are a later feature (planned 008). Keeping files linked to thoughts, the MCP tools for them, and making manuals and photos searchable are a later feature (planned 007); 006 only makes sure Storage works.
- Q: Does a lean stack still meet upstream's contribution expectations? → A: Yes. No upstream rule requires particular Supabase services; the only architectural rule (remote MCP through Edge Functions) is met; upstream already accepted `recipes/local-brain-no-mcp` and `integrations/kubernetes-deployment`, which depart further from the canonical setup (VP-004). The README must state the trade-offs.
- Q: Where does the model server run? → A: On the host by default (any OpenAI-compatible server the owner runs, as T046 proved), plus an optional bundled model-server container for owners who want one command to start everything, for example on a Linux box; it is opt-in and not part of the always-on set (FR-017).
- Q: Does 006 create a storage bucket? → A: Yes, one private bucket, `ob1-files`, so the storage check has a real target and planned 007 builds on it (FR-009).
- Q: How do the owner's AI clients reach the stack? → A: In 006, from the same machine and the local network only. A secure route for cloud-hosted clients (claude.ai custom connectors, a phone), such as the Caddy plus Tailscale Funnel setup proven in spec 004's Cloud run, is its own later feature (FR-018, OS-007).
- Q: What is this stack in relation to the owner's existing Open Brain on their tailnet (core plus the `/crm`, `/household` and `/edit` endpoints)? → A: Its eventual replacement: 006 builds a fresh stack designed to become that brain's home; planned spec 008 moves the data and extensions onto it (FR-021, OS-001).
- Q: What does "not as heavy" (than `integrations/kubernetes-deployment`) mean measurably? → A: No Kubernetes infrastructure: the brain runs on one machine with Docker Compose. There is no memory or size target; leanness otherwise shows only in which services run (FR-004, SC-002).
- Q: Which machines must the recorded live run cover? → A: The owner's Mac first, then a Linux machine before the upstream PR is opened (SC-010).
- Q: How do models get into the optional bundled model-server container? → A: In 006 the container is Ollama and the README documents a manual pull command per model (`EMBEDDING_MODEL`, `CHAT_MODEL`); nothing is pulled automatically. A later feature will publish a Docker image able to serve through vLLM, SGLang, llama.cpp or Ollama (FR-017, OS-008). → Superseded by the GPU-on-Mac question: the bundled option is Docker Model Runner instead of an Ollama container; the manual pull per model stays.
- Q: Given that this stack will become the owner's real brain, how much backup does 006 provide? → A: Minimal: the README documents where the database and Storage files live and one database dump command; a backup and restore procedure proven by a restore test arrives with planned spec 008, before the real brain moves over (OS-005).
- Q: The owner wants the bundled model server to use the Mac's GPU, which an Ollama container cannot; which bundled option? → A: Docker Model Runner, with a manual `docker model pull` per model: it runs models with Metal on Apple Silicon (and NVIDIA, AMD or Vulkan on Linux), and containers reach its OpenAI-compatible API without a key. Research must confirm it returns 1536-number embeddings; if not, the embedding role uses the host route (FR-017, FR-012, VP-011).
- Q: Should setup have a time target? → A: No numeric target; the Mac live run measures the real time, and the README and `metadata.json`'s `estimated_time` report it (SC-001).
- Q: What does re-running setup do after an interrupted run? → A: It completes whatever is missing and keeps whatever exists, checking each piece on its own, and reports which pieces it completed and which were already there (FR-003).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run my own Open Brain on my own machine (Priority: P1)

An owner who already runs (or is willing to run) their own model server wants Open Brain without any cloud account and without Kubernetes. They clone the repo, run one setup command and one start command, and get a brain whose six MCP tools work from their AI client, with every thought stored in a database on their own machine.

**Why this priority**: This is the reason the feature exists: the database half of "self-hosted Open Brain" that spec 004 deliberately left out (spec 004 OS-001). Without it nothing else in this spec matters.

**Independent Test**: On a machine with Docker and a model server and no prior setup, follow the README from the top; connect an MCP client; capture a thought; find it again with a reworded search.

**Acceptance Scenarios**:

1. **Given** a machine with Docker and a reachable model server and no previous stack, **When** the owner runs the setup step and then the start step, **Then** exactly the always-on services are running and healthy, and no user-login, realtime, pooler or web UI service is running.
2. **Given** the running stack, **When** the owner runs spec 004's setup check against it, **Then** every check passes.
3. **Given** the running stack and an MCP client connected with the access key, **When** the owner lists tools, captures a thought and searches with different wording, **Then** all six tools are listed, the capture is stored with a 1536-number embedding, and the search returns it first.
4. **Given** the setup step has already been run, **When** the owner runs it again, **Then** it does not overwrite the existing secrets or data and reports every piece as already present.
5. **Given** a running stack with thoughts in it, **When** the owner stops and restarts the stack (or the machine), **Then** every thought is still there and the tools work again without re-running setup.
6. **Given** a setup run that stopped after writing the secrets file but before linking 004's function, **When** the owner runs setup again, **Then** the same secrets are kept, the function is linked, and setup reports the link as completed and the secrets as already present (Round 5, Q1).

---

### User Story 2 - Storage ready for files (Priority: P2)

The owner wants to later keep real files in their brain — the service manual of a product they own, photos of where they have stored things. 006 does not add file features to Open Brain, but it must leave the owner with a Storage service that verifiably works on the lean stack, so the later attachments feature (planned 007) has somewhere to put files.

**Why this priority**: The owner chose Storage as part of the stack specifically for this. It is not needed for the six tools, so it ranks below Story 1.

**Independent Test**: On the running stack, upload a PDF and a photo to a private bucket with the stack's service credentials, download them, and compare.

**Acceptance Scenarios**:

1. **Given** the running stack, **When** the owner follows the README's storage check, **Then** a private bucket exists and a test file uploaded to it downloads byte-for-byte identical.
2. **Given** a private bucket, **When** anyone requests a file in it without the stack's credentials, **Then** the request is refused.
3. **Given** files stored in a bucket, **When** the stack is stopped and restarted, **Then** the files are still there.

---

### User Story 3 - Web UI only when I want it (Priority: P3)

Most of the time the owner wants the stack as light as possible, but sometimes they want to browse thoughts, look at stored files or run SQL in a web UI. They start the optional UI add-on, use it, and stop it again, without changing anything else.

**Why this priority**: A convenience. The README's `psql` route already covers every setup step, so the brain works fully without it.

**Independent Test**: Start the stack without the UI, then add the UI with its one documented command, open it, see the `thoughts` table and the storage bucket, then stop only the UI.

**Acceptance Scenarios**:

1. **Given** the stack started the normal way, **When** the owner lists running services, **Then** the web UI is not among them.
2. **Given** the running stack, **When** the owner starts the UI add-on with the documented command, **Then** the web UI opens, protected by the dashboard password, and shows the `thoughts` table and the storage bucket.
3. **Given** the UI add-on is running, **When** the owner stops it with the documented command, **Then** the always-on services and the MCP tools keep working.

---

### Edge Cases

- **Model server unreachable from the containers** (for example `localhost` used for a server on the host): the setup check fails naming the address (spec 004 behavior); the README explains how containers reach the host.
- **Embedding model not 1536**: capture is refused naming both sizes (spec 004 FR behavior); the stack itself is unaffected.
- **Ports already in use** on the host: the start step fails clearly, and the README says which ports the stack uses and how to change them.
- **Docker Compose older than v2.20** (no `include:`): the setup step detects it and stops with the required version.
- **The pinned Supabase commit is no longer available, or the owner wants a newer one**: the pin is one documented setting; changing it is a documented, owner-run step, and only the pinned commit is claimed as tested.
- **Starting a single always-on service pulls in an optional one** through the official file's dependencies (VP-001): the documented start command must start exactly the always-on set.
- **Storage depends on the image service** in the official file (VP-001): either the image service runs as part of the always-on set or Storage is shown to work without it; the README states which.
- **Secrets**: the setup step generates every secret; none is committed, printed into a tracked file, or reused from the official example file's defaults.
- **The functions runtime checks no Supabase JWT for any function** (VP-003): the README warns that every function on the stack must check its own credentials, and that the stack's gateway must not be exposed beyond the networks the owner intends.
- **The owner points 004's function at the wrong project URL or key**: the setup check reports the database step failing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The recipe MUST provide a setup step that obtains the official Supabase self-hosting stack at one pinned version, without copying Supabase's own stack files into the contribution folder (VP-004).
- **FR-002**: The setup step MUST generate fresh values for every secret the stack needs, including 004's `MCP_ACCESS_KEY` (derived from FR-007 and spec 004 FR-023), write them only to an untracked local file, and never reuse the example defaults.
- **FR-003**: Re-running the setup step MUST NOT overwrite existing secrets or data. It MUST check each setup piece on its own (the stack clone at the pin, the secrets file, the link to 004's function, the bucket), complete any piece that is missing, including after an interrupted run, and report which pieces it completed and which already existed (Round 5, Q1).
- **FR-004**: The documented start command MUST start exactly the always-on services — the database, the REST API, the gateway, the Edge Functions runtime and Storage, plus the image service only if Storage requires it (FR-012) — and no user-login, realtime, pooler, web UI or metadata service, despite the official file's dependency links (VP-001).
- **FR-005**: The web UI and its metadata service MUST be startable and stoppable as one optional add-on with one documented command each, without restarting the always-on services.
- **FR-006**: On first start of an empty database, the stack MUST create the `thoughts` table, `match_thoughts` and `upsert_thought` exactly as `docs/01-getting-started.md` defines them, at 1536 dimensions, including the GRANT step `CONTRIBUTING.md` requires (VP-007), with no change to the canonical definitions.
- **FR-007**: The recipe MUST deploy spec 004's `integrations/self-hosted-llm-mcp` into the stack as the MCP server by reference to that folder, without copying or modifying it, following spec 004's self-hosted deployment steps (spec 004 FR-022).
- **FR-008**: The owner MUST configure the model server only through spec 004's settings (`EMBEDDING_API_BASE`, `EMBEDDING_MODEL`, `CHAT_MODEL` and the rest); the recipe adds no model settings of its own.
- **FR-009**: The stack MUST have one private storage bucket named `ob1-files` for the owner's files, created on first setup and left untouched if it already exists; files in it are reachable only with the stack's service credentials. Later features (planned 007) may add buckets but do not rename this one.
- **FR-010**: Data in the database and in Storage MUST survive stopping and restarting the stack and the machine.
- **FR-011**: The recipe MUST provide an executable verification that checks the schema objects (FR-006) exist with 1536 dimensions, and a documented storage check (upload, download, compare, refused without credentials).
- **FR-012**: Research MUST settle, on the pinned version, whether Storage runs and authorizes requests with the user-login service absent, whether it runs without the image service, whether the UI add-on shows tables and buckets with the user-login service absent (derived from Story 3 and the no-auth decision), and whether Docker Model Runner returns 1536-number embeddings for an embedding model available to it (Round 3, Q1); the always-on set and the README follow the result.
- **FR-013**: The README MUST provide a `psql` route for every setup step that other OB1 docs describe as "paste into the SQL Editor", so the web UI is never required.
- **FR-014**: The README MUST state the services the lean stack leaves out and what that costs: `dashboards/open-brain-dashboard` does not work (it needs user login), and Studio is opt-in (VP-006).
- **FR-015**: The README MUST position the recipe against `recipes/local-brain-no-mcp` (for networks where MCP is blocked; full stack; 768 dimensions by default) and `integrations/kubernetes-deployment` (Kubernetes, no Supabase), and link to both.
- **FR-016**: The README MUST carry spec 004's R2 warning: on this stack, JWT verification is one setting for all functions (VP-003).
- **FR-017**: By default the model server MUST be any OpenAI-compatible server the owner runs on the host (or elsewhere on their network), reached from the containers at a documented address. The recipe MUST also offer an optional bundled model server, Docker Model Runner, used only when the owner enables it and not part of the always-on set (FR-004): on macOS it runs models with GPU acceleration through Metal. The owner pulls each model named in `EMBEDDING_MODEL` and `CHAT_MODEL` with a documented `docker model pull` command; the recipe MUST NOT pull models automatically. If research (FR-012) shows Docker Model Runner cannot return 1536-number embeddings, the README MUST say to use it for the chat role only and serve embeddings through the host route.
- **FR-018**: The README MUST document connecting MCP clients that run on the same machine or the local network (for example Claude Code and Claude Desktop) with the access key, and MUST state that cloud-hosted clients such as claude.ai custom connectors cannot reach the stack in this version, pointing to the planned remote-access feature (OS-007). The recipe MUST NOT expose the stack's gateway beyond the local network by default.
- **FR-019**: The contribution folder MUST meet `CONTRIBUTING.md` and the upstream gate rules (README sections, metadata, no secrets, no binaries, scope, internal links resolving once #533 is upstream).
- **FR-020**: The README MUST document how to stop the stack, how to remove it with or without its data, where the database and Storage files live on disk, and one command that dumps the database to a file (Round 2, Q1).
- **FR-021**: Nothing in the stack's setup or layout may prevent deploying further OB1 Edge Function MCP servers next to 004's (for example the `extensions/professional-crm` and `extensions/household-knowledge` servers the owner already uses) or adding their tables later; 006 itself deploys only 004's server.

### Key Entities

- **Stack pin**: the one version of the official Supabase self-hosting files the recipe is tested against; one documented setting.
- **Local secrets file**: the untracked file holding the generated secrets and the owner's model settings.
- **Always-on service set**: database, REST API, gateway, functions runtime, Storage (plus the image service if required).
- **UI add-on**: the web UI and its metadata service, started on request.
- **Model-server add-on**: Docker Model Runner, an optional bundled OpenAI-compatible model server the owner enables, with models pulled by hand; the default is the owner's own server on the host (FR-017).
- **Owner bucket**: the private Storage bucket `ob1-files` that later features use for files (FR-009).

### Data & Schema Changes

- **New objects**: none beyond `docs/01`'s canonical `thoughts`, `match_thoughts`, `upsert_thought` (created in a new, empty database) and one private storage bucket, `ob1-files`.
- **Touches `thoughts`?**: No. It is created exactly as `docs/01` defines it.
- **RLS**: as in `docs/01`; the bucket is private (service credentials only).
- **Verification**: the executable schema check and the storage check (FR-011).

### README Contract

- **Prerequisites**: Docker with Compose v2.20+, `git`, a model server meeting spec 004's model requirements, enough RAM for the stack plus models.
- **Steps**: setup → configure the model settings → start → run spec 004's setup check → connect an MCP client → (optional) storage check → (optional) UI add-on → stop and remove.
- **Expected outcome**: six MCP tools working against a brain stored on the owner's machine; a working private storage bucket.
- **Links**: `integrations/self-hosted-llm-mcp/` (the MCP server), `docs/01-getting-started.md` (schema), `docs/05-tool-audit.md`, `recipes/local-brain-no-mcp/`, `integrations/kubernetes-deployment/`.

### Testing Requirements

- **Runner**: decided in the plan. Candidates: tests for the setup step's logic (secret generation, no-overwrite, version check, service selection) in a runner from the constitution's Testing Standards table; the schema check as `tests/verify.sql`, which fork-ci runs against a throwaway Postgres with pgvector.
- **Behaviors that MUST have tests**: FR-002 (fresh secrets, never the example defaults), FR-003 (no overwrite on re-run), FR-004 (exact service set), FR-005 (UI add-on separate), FR-017 (model-server add-on separate and opt-in), FR-006 (schema at 1536 with the GRANT), the Compose-version check (edge case), FR-019 (no secrets written into tracked files).
- **Live acceptance**: like spec 004's T046, recorded end-to-end runs covering Stories 1–3, first on the owner's Mac and then on a Linux machine before the upstream PR (SC-010), with evidence in `specs/006-self-hosted-supabase/evidence/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time reader who already has Docker and a model server reaches a working brain (a capture found again by a reworded search) by following the README alone, with no step outside it. There is no time target: the Mac run records the elapsed time, and the README and `metadata.json`'s `estimated_time` report that measured figure (Round 4, Q1).
- **SC-002**: The whole brain runs on one machine with only Docker and Docker Compose: no Kubernetes, cluster, or orchestration tooling is installed or used at any step of the README (Round 1, Q2).
- **SC-003**: All six MCP tools work from a real MCP client against the stack, and spec 004's setup check passes, on the first start after setup.
- **SC-004**: 100% of thoughts and stored files are still present after stopping and restarting the stack and after rebooting the machine.
- **SC-005**: A file uploaded to the owner's bucket downloads byte-for-byte identical, and an unauthenticated request for it is refused.
- **SC-006**: Exactly the always-on services are running after the documented start command; the web UI appears only after the add-on command and disappears after its stop command, with the tools working throughout.
- **SC-007**: Re-running setup, after a complete or an interrupted run, changes no secret and loses no data, and leaves every setup piece present (Round 5, Q1).
- **SC-008**: The contribution folder passes the upstream gate's review checks (all rules) in the upstream PR's context.
- **SC-009**: With 004's server running, a second Edge Function placed next to it in the stack's functions directory answers on its own path while 004's six tools keep working, without re-running setup (verifies FR-021; Round 1, Q1).
- **SC-010**: Stories 1–3 pass in a recorded live run on macOS (the owner's Mac) and in a second recorded run on Linux; the upstream PR is not opened until both runs pass, and the README names both as tested (Round 1, Q3).
- **SC-011**: On the owner's Mac with Docker Model Runner enabled and the chat model pulled by hand, pointing `CHAT_API_BASE` at it makes 004's setup check pass, and a capture's metadata extraction runs on the GPU; the embedding role does the same if research shows 1536-number embeddings, otherwise the README's host-route fallback is followed (verifies FR-017; Round 3, Q1).

## Verified Premises

- **VP-001**: In the official stack at `supabase/supabase` `a522111` (the commit spec 004's T046 used), the services are `db`, `rest`, `api-gw`, `functions`, `storage`, `imgproxy`, `auth`, `realtime`, `supavisor`, `studio`, `meta`, with no profiles. Dependency links: `api-gw` → `studio`; `functions` → `api-gw`; `storage` → `db`, `imgproxy`; `rest`, `auth`, `meta`, `realtime`, `supavisor` → `db`. So starting `functions` the default way also starts `studio` (checked with `docker compose config`, 2026-11-26).
- **VP-002**: The `storage` service's configuration has `AUTH_JWT_SECRET`, `ANON_KEY` and `SERVICE_KEY` and no setting naming the user-login service, which suggests it checks tokens itself; FR-012 must confirm this on a running stack.
- **VP-003**: On the Compose stack, JWT verification for Edge Functions is one switch, `FUNCTIONS_VERIFY_JWT`, for all functions (spec 004 research R2).
- **VP-004**: `recipes/local-brain-no-mcp` (merged upstream 2026-05-13) uses a `setup.sh` that clones `supabase/supabase` and an overlay `docker-compose.yml` with `include:` (Compose v2.20+); it runs the full stack, defaults to 768 dimensions, and offers no MCP. `integrations/kubernetes-deployment` runs the same six tools on Kubernetes with plain Postgres.
- **VP-005**: Spec 004's T046 ran only `db`, `rest`, `api-gw` and `functions` from the official stack, with Ollama on the host, and all six tools worked from a real Claude Code client (`specs/004-self-hosted-llm/evidence/t046-local-selfhosted/`).
- **VP-006**: Of the repo's contributions, only `dashboards/open-brain-dashboard` calls the user-login service (`supabase.auth.getUser()`); none uses Supabase Storage or Realtime; `pg_cron` (4 contributions) and `pg_net` (1) are database extensions, not separate services; 56 contributions or docs tell the reader to use Studio's SQL or Table Editor.
- **VP-007**: `CONTRIBUTING.md` (line 121) requires a GRANT step for every contribution that creates tables, because Supabase no longer grants `service_role` access automatically.
- **VP-008**: Upstream gate rule 13 requires every relative link in a README to resolve; links into `integrations/self-hosted-llm-mcp/` resolve upstream only after #533 merges. Rule 12 limits a PR to one contribution folder.
- **VP-009**: In the official stack at `a522111`, only two services publish host ports: `api-gw` on `0.0.0.0:8000` and `supavisor` on `0.0.0.0:5432` and `6543`. Without `supavisor`, Postgres has no host port, so the `psql` route (FR-013) runs inside the `db` container. Storage uses the `file` backend at `/var/lib/storage`, bind-mounted from the stack's `volumes/storage/`. The gateway protects Studio with HTTP basic auth from `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` (`volumes/api/envoy/`) (checked with `docker compose config`, 2026-11-26).
- **VP-010**: Every service in the official stack at `a522111` has `restart: unless-stopped`, so the stack comes back after a reboot once Docker itself starts. Postgres data lives in the bind mount `volumes/db/data` and Storage files in `volumes/storage` inside the cloned stack directory; Edge Functions are read from a mount at `/home/deno/functions` (checked with `docker compose config`, 2026-11-26).
- **VP-011**: Docker Model Runner runs models with llama.cpp using Metal GPU acceleration automatically on Apple Silicon, and NVIDIA, AMD or Vulkan on Linux; Docker Desktop 4.62 added vLLM Metal. Containers reach its OpenAI-compatible API at `http://model-runner.docker.internal/engines/v1` (chat completions and embeddings), and it needs no API key. A Compose top-level `models:` element pulls and runs models automatically. (Docker docs: `ai/model-runner/inference-engines.md`, `api-reference.md`, `compose/how-tos/models-and-compose.md`.) On the owner's Mac it is installed but not enabled: Docker Desktop 4.96.2, `docker model` v1.2.6 (checked 2026-11-26).

## Out of Scope

- **OS-001**: Moving an existing brain (from Supabase Cloud or elsewhere, including the owner's current tailnet brain and its CRM, household and edit extensions) onto this stack, and re-embedding thoughts with a new model: planned spec 008.
- **OS-002**: Keeping files linked to thoughts, MCP tools to attach and fetch files, extracting text from PDFs such as service manuals, and describing photos with a vision model so they become searchable: planned spec 007. 006 provides only the working Storage service and bucket.
- **OS-003**: Any change to `integrations/self-hosted-llm-mcp/`, `docs/01` or the core `thoughts` table.
- **OS-004**: User login, `dashboards/open-brain-dashboard`, realtime features and connection pooling.
- **OS-005**: Backups beyond documenting where the data lives (VP-010) and a one-line database dump command; a backup and restore procedure for the database and Storage files, proven by a restore test, arrives with planned spec 008 before the owner's real brain moves over. Until then, Storage files are not covered by any documented backup (Round 2, Q1).
- **OS-006**: Supporting Supabase stack versions other than the pinned one.
- **OS-007**: Reaching the stack from cloud-hosted clients (claude.ai custom connectors, a phone off the local network) through a secure public HTTPS route: a planned later feature, which can reuse the Caddy plus Tailscale Funnel pattern from spec 004's Cloud run (`specs/004-self-hosted-llm/evidence/t046-cloud/`).
- **OS-008**: A published Docker image that serves models through a choice of vLLM, SGLang, llama.cpp or Ollama, alongside or replacing 006's Docker Model Runner option: a planned later feature (Round 1, Q4).
- **OS-009**: Undecided (not asked): what starting the UI add-on does while the always-on services are stopped. Outstanding as minor; needs a user decision if the plan finds the add-on can start parts of the stack on its own.
- **OS-010**: Undecided (not asked): whether Docker Model Runner's host port on the owner's Mac is reachable from the local network. Outstanding as minor; needs a fact from FR-012's research.

## Assumptions

- The owner runs Docker on macOS or Linux, both tested (SC-010); Windows is not tested.
- A personal brain: one owner, small data volumes, no high-availability needs.
- The 1536-dimension convention stays fixed (spec 004 VP-009).
- Upstream #533 merges before 006's upstream PR is opened; if upstream asks for changes to #533 first, 006 waits and follows them.
- Spec 004's function needs no change to run on this stack (proven by VP-005).
