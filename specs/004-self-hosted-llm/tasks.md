---

description: "Tasks for the self-hosted LLM MCP server (spec 004), structured for parallel Sonnet-class stream agents"
---

# Tasks: Self-hosted LLM backend for Open Brain

**Input**: Design documents from `specs/004-self-hosted-llm/`

**Prerequisites**: plan.md, spec.md, research.md (R1–R13), data-model.md, contracts/mcp-tools.md, contracts/setup-check.md, contracts/model-server-requests.md, quickstart.md

**Tests**: MANDATORY (constitution Principle IV, upstream-bound lane: red-green-refactor). This feature runs through the installed spec-kit-tdd loop:

- After this file is written, the `after_tasks` hook (`tdd.plan`) writes `tdd/test-list.md` and adds the `[U#]`/`[A#]` behavior markers to these tasks. Never tick a marked task by hand. The integrator ticks it when all of its behaviors are `DONE`.
- One behavior per cycle:
  1. Write the test first. Name it with its behavior id prefix (`"U7 …"`, `"A3 …"`).
  2. **Observe it fail for the right reason**, and record the decisive failure line.
  3. Make the smallest change to green.
  4. Run the full suite.
  5. Refactor.
- Never commit on red. Commit at green, test and implementation together, one cycle per commit. Never weaken a test.
- A test that passes on its first run is checked with a deliberate mutant (the playbook rule) and recorded as such.
- **Stream agents run `deno test` directly in their own worktree**:
  - single: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" tests/`. The slashes are required. Deno treats an unslashed filter as a literal substring, so `"^U7 "` matches **zero tests and still exits ok** (checked 2026-11-26 on Deno 2.9.8). Every single run must report exactly `1 passed` or `1 failed`. A run with `0 passed | 0 failed` proves nothing and must not be recorded.
  - full: the same command without `--filter`

  These are fork-ci's flags: **no `--allow-net`**, so the model server and the database are always injected fakes (research R4). Do not use `tdd.mjs` in a stream. It resolves the plan's Worktree, `W`, not the stream's tree. The integrator uses the profile commands in `W`.

**Single writers**: `tasks.md`, `tdd/test-list.md` and `tdd/cycle-log.md` live only on fork `main` (`M`), never on a `contrib/` branch (Principle V). Only the integrator (the main session) edits them. Each stream appends its cycle entries to **`M/specs/004-self-hosted-llm/tdd/cycle-log.d/<stream>.md`**, an absolute path outside its worktree. It writes only that one file in `M` and reports which behaviors are `DONE`.

**Stream agents**: each stream is one Sonnet subagent (`Agent` with `model: "sonnet"`). Its brief contains:

- its worktree, branch and task IDs
- the TDD rules above, the single-writer rule, and the **Seams** section
- the contract and data-model sections its tasks cite

A stream edits only the files listed for it in the ownership table, and never edits `lib/types.ts` or `tests/helpers/*`. If a seam must change, the stream stops and reports to the integrator.

**Rules every stream brief must repeat**:

- **Working directory**: the shell resets to `M` after every tool call. Start every command with `cd <stream worktree> &&`, or use `git -C <stream worktree>`. **Never run git in `M`.** The only `M` file a stream touches is its own `cycle-log.d/<stream>.md`, written with the file tools and never staged or committed by the stream.
- **Design documents are read-only, at absolute paths**: the stream worktree has no `specs/`. Every citation in this file (`data-model.md` §…, `contracts/…`, `research.md` R…, `tdd/test-list.md`) means `/Users/mfelker/Projects/ob1/specs/004-self-hosted-llm/<file>`.
- **Commit messages**: `[integrations] <behavior id>: <short description>`. These commits go into the upstream PR, so the `[fork]` prefix is never used on a stream branch.

## Path Conventions

- `M` = `/Users/mfelker/Projects/ob1`: the fork-`main` checkout. Every `/speckit-*` command and every `specs/` edit happens here.
- `W` = `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-llm`: the integration worktree on `contrib/mfelker/self-hosted-llm`, cut from `upstream/main` `238df6c` (the plan's **Worktree**). It is the only branch that becomes the upstream PR.
- `F` = `W/integrations/self-hosted-llm-mcp`: the contribution folder.
- Stream worktrees: `/Users/mfelker/Projects/ob1/.worktrees/shl-<stream>` on local branches `contrib/mfelker/self-hosted-llm-<stream>`, cut from `contrib/mfelker/self-hosted-llm`. Inside a stream, paths are relative to its worktree root, so the folder is `integrations/self-hosted-llm-mcp/`.
- Core parity reference: `W/server/index.ts` (identical to upstream `238df6c`).

## Streams and file ownership

All paths are relative to `integrations/self-hosted-llm-mcp/`.

| Stream | Worktree | Wave | Owns (and only these) |
|--------|----------|------|------------------------|
| C (config + metadata) | `shl-config` | 1 | `lib/config.ts`, `lib/metadata.ts`, `tests/config_test.ts`, `tests/metadata_test.ts` |
| M (model client) | `shl-model` | 1 | `lib/model_client.ts`, `tests/model_client_test.ts` |
| S (thought store) | `shl-store` | 1 | `lib/thought_store.ts`, `tests/thought_store_test.ts` |
| D (docs) | `shl-docs` | 1 | `README.md` |
| T (tools + capture) | `shl-tools` | 2, after C, M, S merged | `lib/tools.ts`, `tests/tools_test.ts` |
| K (setup check) | `shl-check` | 2, after C, M, S merged | `lib/setup_check.ts`, `tests/setup_check_test.ts` |
| A (app + entry) | `shl-app` | 3, after T and K merged | `lib/app.ts`, `index.ts`, `tests/app_test.ts`, `tests/imports_test.ts`, `tests/acceptance_test.ts` (only to flip `todo` → `Deno.test`) |

- Each stream also writes `M/specs/004-self-hosted-llm/tdd/cycle-log.d/<stream>.md`.
- Wave 1 runs four agents at once and wave 2 runs two. Wave 3 runs one agent, because `createApp` composes everything.
- D runs in wave 1 because the README depends only on the design documents.
- The integrator owns `deno.json`, `metadata.json`, `lib/types.ts` and `tests/helpers/*`.

## Seams (written by the integrator in T004–T005, frozen during the waves)

Streams code against these. Signatures are the only shared contract. Behavior comes from the cited contract and data-model sections.

- `lib/types.ts`:
  - `GetEnv = (name: string) => string | undefined`
  - `Role = "embedding" | "chat"`
  - `EndpointConfig { role; base; key?: string; model }`
  - `ResolvedConfig = { ok: true; embedding; chat; timeoutMs; chatInherits: ("base"|"key")[] } | { ok: false; missing: string[]; invalid: { setting: string; reason: string }[] }`
  - `OutcomeKind` = the eight outcomes of data-model.md §2
  - `ModelResult<T> = { ok: true; value: T } | { ok: false; kind: OutcomeKind; message: string }`
  - `ModelClient { embed(text): Promise<ModelResult<number[]>>; chat(text): Promise<ModelResult<string>>; listModels(role): Promise<ModelResult<string[] | null>> }`
  - `ThoughtStore`: methods returning `{ data } | { error: string }`:
    - `fetchThought`, `matchThoughts`, `listThoughts`, `stats`: core's read queries
    - `upsertThought(content, metadata)` → `{ id }`
    - `setEmbedding(id, embedding)`
    - `readBack(id)` → `{ createdAt, updatedAt, embeddingIsNull }`
    - `deleteIfInsertedByCall(id, timestamp)` → `{ deleted: boolean }`
    - `countAll()`
    - `countWithModel(model)`
  - `Deps { getEnv: GetEnv; modelFetch: typeof fetch; store: ThoughtStore }`
- Stub exports (each throws `new Error("not implemented")` until its stream replaces it):
  - `config.ts`: `resolveConfig(getEnv)`, `keyOverHttpWarnings(config)`
  - `metadata.ts`: `EXTRACTION_PROMPT`, `parseUsableMetadata(text)`, `buildCaptureMetadata(extracted | null, embeddingModel)`
  - `model_client.ts`: `createModelClient(config, fetch)`
  - `thought_store.ts`: `createSupabaseThoughtStore(url, serviceRoleKey, fetch)`
  - `tools.ts`: `buildServer(deps)`
  - `setup_check.ts`: `runSetupCheck(deps)`
  - `app.ts`: `createApp(deps)`
- `tests/helpers/fake_fetch.ts`: a scripted `fetch`.
  - Routes are keyed by method and URL.
  - It records every request (URL, method, headers, parsed body).
  - Each route can reply with a status and body, or throw a network error.
  - A route can **hang until its `AbortSignal` fires**, which tests the timeout without waiting 60 s: tests set `FETCH_TIMEOUT_MS` to a few ms.
  - A route can hold its reply until released, to prove concurrency.
- `tests/helpers/fake_store.ts`: an in-memory `ThoughtStore`.
  - Rows carry `createdAt`/`updatedAt`/`embedding`, and `upsertThought` reproduces `upsert_thought`'s insert-or-merge (`old || new`) semantics.
  - It records calls, and failure can be injected per method.
- `tests/helpers/todo.ts`: `todo(name, fn)` registers `Deno.test({ name, ignore: Deno.env.get("RUN_TODO") !== "1", fn })`. It stands in for `node:test`'s `todo`. Reds are recorded with `RUN_TODO=1`.

---

## Phase 1: Setup (integrator, in `M` then `W`)

- [ ] T001 Sync check in `M`: run `git fetch upstream`.
  - Confirm `main` contains `upstream/main` (`git merge-base --is-ancestor upstream/main main`).
  - Confirm `W` is at `upstream/main` with a clean tree.
  - If upstream moved past `238df6c`, merge it into fork `main` (rerere on) and run `git -C W merge --ff-only upstream/main`. Then re-check that `server/index.ts`, `docs/01-getting-started.md` and `integrations/_template/` are unchanged from `238df6c`; if they changed, stop and re-plan.
- [ ] T002 In `M`, run the `after_tasks` hook `/speckit-tdd-plan` on 004. It writes `specs/004-self-hosted-llm/tdd/test-list.md` and the baseline-only `tdd/cycle-log.md`, and adds behavior markers to this file. Create `specs/004-self-hosted-llm/tdd/cycle-log.d/.gitkeep`, then commit on fork `main` (`[fork] Spec 004: test list`).
- [ ] T003 Scaffold `F` from `W/integrations/_template/`.
  - `F/metadata.json` with real values (name, description, `category: "integrations"`, author `mfelker`, `requires.open_brain: true`, tags, difficulty, estimated time, dates 2026-11-26), validated against `W/.github/metadata.schema.json`.
  - `F/README.md`: section headings only (stream D fills it).
  - `F/deno.json`: the five `server/deno.json` imports at the same versions, plus `"@std/assert": "jsr:@std/assert@^1"`; `"lock": false`; a `test` task with fork-ci's flags.

  Commit in `W`: `[integrations] Scaffold self-hosted-llm-mcp`.
- [ ] T004 Write the seams in `F/lib/types.ts` and the throwing stubs in `F/lib/{config,metadata,model_client,thought_store,tools,setup_check,app}.ts`, exactly as listed under **Seams**.
  - Write `F/index.ts` as the one-line entry: `Deno.serve(createApp(productionDeps()).fetch)`, with `productionDeps` a stub in `lib/app.ts`.
  - Every import uses a full `npm:`/`jsr:` specifier, never a bare name (research R10).
  - Run `deno check` on all of them. Commit.
- [ ] T005 Write `F/tests/helpers/fake_fetch.ts`, `F/tests/helpers/fake_store.ts`, `F/tests/helpers/todo.ts` and `F/tests/helpers/mcp.ts` per **Seams**. `mcp.ts` holds `mcpCall(fetchFn, method, params, key)`, which builds the JSON-RPC `Request` that T006 and stream A use, and `inMemoryClient(server)`, which uses the SDK `Client` over `InMemoryTransport` for streams T and K.

  Then write `F/tests/helpers/helpers_test.ts`, which proves **the harness itself works under fork-ci's exact flags** (`--node-modules-dir=none --no-prompt --allow-env --allow-read`, no net) before any agent builds on it:
  - the five npm imports load
  - a throwaway `McpServer` with one dummy tool, behind a minimal Hono + `StreamableHTTPTransport` app, answers `initialize`, `tools/list` and `tools/call` through `app.fetch(...)` via `mcpCall`
  - `inMemoryClient` lists and calls that tool
  - supabase-js `createClient(url, key, { global: { fetch: fake } })` sends its request to the fake fetch
  - the fake fetch's hang-until-abort mode resolves when the signal fires
  - the fake store merges metadata on a duplicate fingerprint, and gives `createdAt = updatedAt` only on insert
  - `--filter "/^<name> /"` on this file runs exactly one test

  Commit.
- [ ] T006 [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] [A10] [A11] [A12] [A13] [A14] [A15] [A16] [A17] [A18] [A19] [A20] [A21] [A22] [A23] [A24] Outer loop first: write `F/tests/acceptance_test.ts` with every `[A#]` behavior from the test list as a `todo(...)` test through `createApp(fakeDeps).fetch(new Request(...))`. Each test asserts the full observable result: the JSON-RPC response, `/setup-check` status and body, fake-store rows, and fake-fetch request log.
  - Run with `RUN_TODO=1` and record each red (test name + decisive failure line) in `M/specs/004-self-hosted-llm/tdd/cycle-log.md`.
  - Confirm the default run is green (all ignored).
  - Commit in `W` (`[integrations] Acceptance tests as todo`) and in `M` (`[fork] Spec 004: acceptance reds`).
- [ ] T007 From `M`, create the wave-1 stream worktrees: `git worktree add .worktrees/shl-<s> -b contrib/mfelker/self-hosted-llm-<s> contrib/mfelker/self-hosted-llm` for `s` ∈ {config, model, store, docs}. Brief and launch streams C, M, S and D in one message.

**Checkpoint**: test list committed on `M`; seams, stubs, fakes and acceptance todos committed on `W`; four wave-1 worktrees exist.

---

## Phase 2: Foundational (wave 1: streams C, M, S in parallel)

**Purpose**: configuration, the model client and the database adapter. Every user story calls them.

### Stream C: configuration and metadata (`shl-config`)

- [ ] T008 [P] [U1] [U2] [U3] [U4] [U5] [U6] [U7] [U8] [U9] [U10] [U11] [U12] [U13] [U14] [U15] [U16] [U17] [U18] [U19] [U20] [U21] Tests first in `tests/config_test.ts`, then `resolveConfig(getEnv)` in `lib/config.ts`. Cover:
  - `data-model.md` §1 `Endpoint configuration.base`, `.key` and `.model`, and the shared `timeoutMs`, `missing[]` and `invalid[]`
  - the required trio and the order in which `missing[]` names them
  - blank is the same as unset
  - `CHAT_API_BASE` and `CHAT_API_KEY` fall back to the embedding values, and `chatInherits` reports it; `CHAT_MODEL` has no fallback (SC-012)
  - trailing `/` trimmed
  - a non-`http(s)` base is invalid and names the setting (FR-011, FR-020, spec Q6)
  - `FETCH_TIMEOUT_MS` defaults to 60000, and a non-positive-integer value is invalid rather than defaulted (research R11)
  - no `OPENROUTER_API_KEY` read and no default base (FR-004)
  - no key value appears in any reason (FR-010)
- [ ] T009 [P] [U22] [U23] [U24] Tests first in `tests/config_test.ts`, then `keyOverHttpWarnings(config)` in `lib/config.ts`: one `key_over_http` warning per role whose base is `http://` and whose key is set, with the role named and the message from contracts/setup-check.md. No warning for an unkeyed `http://` base or any `https://` base (FR-020, SC-014, OS-005).
- [ ] T010 [P] [U25] [U26] [U27] [U28] [U29] [U30] [U31] [U32] Tests first in `tests/metadata_test.ts`, then `lib/metadata.ts`:
  - `EXTRACTION_PROMPT` equals core's system prompt verbatim (`W/server/index.ts`, `extractMetadata`).
  - `parseUsableMetadata` accepts a JSON object, raw or inside one fenced code block, and rejects arrays, scalars and unparseable text (`data-model.md` §3 "Usable metadata").
  - `buildCaptureMetadata` returns the extracted metadata, or the default `{ topics: ["uncategorized"], type: "observation" }` when given `null`, plus `source: "mcp"`, `embedding_model` and `enrichment_status` (`"complete"` or `"fallback"`). Those three are set last, so a reply containing them cannot override them (`data-model.md` §3 `Thought.metadata`; FR-006, FR-015, FR-024).

### Stream M: model client (`shl-model`)

- [ ] T011 [P] [U33] [U34] [U35] [U36] [U37] [U38] [U39] [U40] [U41] Tests first in `tests/model_client_test.ts`, then request shapes in `lib/model_client.ts`, per contracts/model-server-requests.md:
  - `POST <embedding base>/embeddings` with `{ model, input, dimensions: 1536 }`
  - `POST <chat base>/chat/completions` with `response_format: { type: "json_object" }` and `[system: EXTRACTION_PROMPT, user: text]`
  - `GET <role base>/models`
  - `Authorization: Bearer <key>` only when the role has a key, and no header at all otherwise (`data-model.md` §1 `Endpoint configuration.key`)
  - requests go only to the configured bases (FR-004)

  Import `EXTRACTION_PROMPT` from `lib/metadata.ts`; it is a stub until C merges, so test the message structure here and the prompt text in C.
- [ ] T012 [P] [U42] [U43] [U44] [U45] [U46] [U47] [U48] [U49] [U50] [U51] [U52] [U53] Tests first, then outcome mapping. Cover every row of `data-model.md` §2 `Model call outcome`: `unreachable` (fetch rejects), `timeout`, `auth_rejected` (401/403), `model_not_found` (404 or a 4xx naming the model), `http_error`, `bad_response` (missing `data[0].embedding` / `choices[0].message.content`) and `wrong_dimension`.
  - `timeout`: an AbortSignal fires after `timeoutMs`, and the message names the ms and `FETCH_TIMEOUT_MS`. Use fake-fetch hang mode with `timeoutMs` of a few ms (FR-009).
  - Each message names the role and the base or model as the table says.
- [ ] T013 [P] [U54] [U55] [U56] [U57] [U58] [U59] [U60] [U61] Tests first, then the `dimensions` retry (research R3): exactly one retry without `dimensions`, and only on HTTP 400/422 whose body contains `dimension` or `matryoshka` (case-insensitive). No retry on any other error. The retry's result is final and still length-checked. The `wrong_dimension` message names the model, the actual length and 1536, matching contracts/mcp-tools.md (FR-007). Fixtures:
  - Ollama's `dimensions 1536 exceeds embedding length 768` (400)
  - vLLM's `does not support Matryoshka embeddings` (400)
  - a 404 unknown-model reply (no retry)
- [ ] T014 [P] [U62] [U63] [U64] Tests first, then redaction: any key value of either role that appears in a server error body or `fetch` error message is replaced with `[redacted]`, and server messages are trimmed to 200 chars (FR-010).
- [ ] T015 [P] [U65] [U66] [U67] Tests first, then `listModels`: returns `data[].id` when present. A 2xx with a non-JSON or differently shaped body is `ok` with `null`, meaning reachable but no list (contracts/model-server-requests.md "Model listing").

### Stream S: thought store (`shl-store`)

- [ ] T016 [P] [U68] [U69] [U70] [U71] [U72] [U73] [U74] [U75] [U76] [U77] [U78] [U79] [U80] [U81] [U82] Tests first in `tests/thought_store_test.ts`, then the read methods of `createSupabaseThoughtStore(url, key, fetch)` in `lib/thought_store.ts`, using supabase-js with `global.fetch` injected.
  - Assert the PostgREST/RPC request each method sends: URL path, method and body.
  - Methods: `fetchThought`, `matchThoughts` (the `match_thoughts` params core uses in `search` and `search_thoughts`), `listThoughts` (core's select, order, limit and `type`/`topic`/`person`/`days` filters) and `stats` (core's `thought_stats` queries).
  - Each must match `W/server/index.ts` exactly (contracts/mcp-tools.md parity baseline).
- [ ] T017 [P] [U83] [U84] [U85] [U86] [U87] [U88] [U89] [U90] [U91] [U92] [U93] [U94] Tests first, then the write methods (research R6 option C):
  - `upsertThought` → RPC `upsert_thought` with `p_content` and `p_payload: { metadata }`, returning `{ id }`
  - `setEmbedding` → update by `id`
  - `readBack` → select `created_at, updated_at` and whether `embedding` is null, by `id`
  - `deleteIfInsertedByCall(id, T)` → delete filtered by `id`, `embedding is null`, `created_at = T` and `updated_at = T`, reporting whether a row was deleted

  Cover `data-model.md` §3 `Thought.embedding`.
- [ ] T018 [P] [U95] [U96] [U97] [U98] [U99] Tests first, then `countAll()` and `countWithModel(model)`: `count: exact, head: true`, the second with `.eq("metadata->>embedding_model", model)`. A test proves that names containing `:`, `/`, `.` and `,` (`qwen3-embedding:4b`, `openai/text-embedding-3-small`, `a,b`) reach the request intact and correctly encoded (`data-model.md` §5 `Mixed-model count.other_model`; research R9).

**Checkpoint (integrator)**: merge C, M and S into `W` (see T040). Then create the wave-2 worktrees (`shl-tools`, `shl-check`) from the updated integration branch, and launch T and K in one message.

---

## Phase 3: User Story 1 - Capture and search with no cloud AI account (Priority: P1) 🎯 MVP

**Goal**: core's six tools work against an OpenAI-compatible model server, with no cloud key and no cloud request.

**Independent Test**: acceptance tests for US1 scenarios 1–3 pass through `createApp`, and the fake-fetch log shows requests only to the configured bases. Manually: quickstart §3 steps 5–6.

### Stream T: tools (`shl-tools`, wave 2)

- [ ] T019 [U100] [U101] [US1] Tests first in `tests/tools_test.ts`, then `buildServer(deps)` in `lib/tools.ts`, registering the six tools with names, titles, descriptions, input schemas (including defaults) and annotations identical to `W/server/index.ts` (contracts/mcp-tools.md "Tools"). Drive it through the MCP SDK `Client` over `InMemoryTransport`: `tools/list` returns exactly the six, each field equal to a fixture copied from core.
- [ ] T020 [U102] [U103] [U104] [U105] [U106] [U107] [U108] [U109] [U110] [U111] [U112] [U113] [US1] Tests first, then the read tools through `deps.store`, with output text identical to core:
  - `search` and `search_thoughts`: embed the query with the embedding role, then `matchThoughts` with core's threshold and count
  - `fetch`, `list_thoughts`, `thought_stats`
- [ ] T021 [U114] [U115] [U116] [U117] [U118] [US1] Tests first, then `capture_thought`'s success path:
  1. Embedding and chat start concurrently. Prove it with fake-fetch hold mode.
  2. `upsertThought` stores `buildCaptureMetadata(extracted, EMBEDDING_MODEL)`, so `enrichment_status` is `"complete"`.
  3. `setEmbedding`.
  4. The reply text matches core's confirmation (`Captured as …`).

  Cover `data-model.md` §3 `Thought.metadata` (FR-015, FR-024). Every `fetch` goes only to the configured bases (FR-004).

### Stream A: app and entry (`shl-app`, wave 3)

- [ ] T022 [U180] [U181] [U182] [U183] [U184] [U185] [U186] [U187] [U188] [U189] [U190] [U191] [U192] [US1] Tests first in `tests/app_test.ts`, then `createApp(deps)` in `lib/app.ts` (contracts/mcp-tools.md "Authentication"):
  - The MCP route accepts the key from `x-brain-key` or `?key=`. A missing or wrong key gets core's HTTP-200 JSON-RPC `-32001` envelope echoing the request `id`, byte for byte.
  - An unset `MCP_ACCESS_KEY` refuses everything.
  - `OPTIONS` answers with core's CORS headers.
  - Core's Accept-header patch is applied.
  - `mcp-session-id` is stripped and CORS headers are added to responses.
- [ ] T023 [U193] [U194] [U195] [US1] Tests first in `tests/imports_test.ts`, then `productionDeps()` in `lib/app.ts`:
  - `Deno.env.get`, `globalThis.fetch`, and `createSupabaseThoughtStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, fetch)`.
  - `index.ts` stays the one-line entry.
  - The test reads every `.ts` file under the folder (not `tests/`) and fails on any bare import specifier (research R10, FR-014).
- [ ] T024 [A1] [A2] [A3] [A4] [A5] [A21] [A22] [A23] [US1] Flip the US1 acceptance tests in `tests/acceptance_test.ts` from `todo` to `Deno.test`, one per commit, each in the commit that turns it green. That includes SC-015's six-tools-with-key and wrong-key cases, and US3 scenario 2 (all settings pointed at a cloud-style `https` base behaves the same).

### Stream D: docs (`shl-docs`, wave 1)

- [ ] T025 [P] [US1] Write `README.md` (docs-only; gated by markdownlint and link check, not unit tests). Sections:
  - **What it does and who it's for**, positioned against `../kubernetes-deployment/`: same six tools, but a Supabase Edge Function instead of Kubernetes with plain Postgres.
  - **Link to `../../docs/05-tool-audit.md`**.
  - **Prerequisites**: the `docs/01` schema at 1536 (VP-009); a model server reachable from where the function runs.
  - **Credential tracker**.
  - **Configure**: a table of every setting (contracts/mcp-tools.md; `data-model.md` §1), including the shared-environment note for `FETCH_TIMEOUT_MS` (research R11) and the advice to keep it below 140000 (research R8).
  - **Choosing an embedding model**: 1536 via `dimensions`; candidate Ollama ≥ 0.11.11 + `qwen3-embedding:4b`; fallback vLLM with `--hf-overrides '{"is_matryoshka": true}'`; llama.cpp not usable and LM Studio untested (research R1).
  - **"Tested with (known good, not a minimum)"**: the table structure only, every value cell reading `pending verification` until T046. It must not say "verified" (FR-017, FR-021).
  - **Deploy to Supabase Cloud**: `supabase functions deploy <name> --no-verify-jwt` plus `supabase secrets set` (FR-022, FR-023).
  - **Deploy to an existing self-hosted stack**: research R2 items 1–5 verbatim in substance, including the global-JWT warning and the three commit permalinks (FR-022, FR-023).
  - **Supabase Cloud reachability**: FR-019 with one worked example, a reverse proxy in front of the model server that serves HTTPS and rejects requests without `Authorization: Bearer <key>`, the key then set as `EMBEDDING_API_KEY`/`CHAT_API_KEY`. Write it as numbered steps with no tunnel tooling shipped.
  - **Expected Outcome**.

---

## Phase 4: User Story 2 - Clear failure when the model server is wrong or down (Priority: P2)

**Goal**: every misconfiguration or outage produces a named cause, and no thought is ever stored without its embedding.

**Independent Test**: acceptance tests for US2 scenarios 1–3 and SC-003, SC-008, SC-009, SC-011, SC-012, SC-014 pass. Manually: quickstart §5.

### Stream T: tools (`shl-tools`, wave 2)

- [ ] T026 [U119] [U120] [U121] [U122] [U123] [U124] [US2] Tests first, then the configuration gate in `lib/tools.ts`: with `resolveConfig` not `ok`, **every one of the six tools** returns `isError` with `Model endpoint not configured: …`, naming each missing and invalid setting. The fake fetch and fake store record **zero** calls. `tools/list` still returns the six tools under the bad configuration (contracts/mcp-tools.md "Configuration gate"; FR-011, FR-018, SC-008, SC-012).
- [ ] T027 [U125] [U126] [U127] [U128] [U129] [US2] Tests first, then capture's embedding-failure paths. For each failing `Model call outcome` kind (`data-model.md` §2), including `wrong_dimension` with its exact message, the result is `isError` naming the cause, and the fake store records **no** `upsertThought` call (FR-005, FR-007, SC-003). `search` and `search_thoughts` fail the same way and return no results.
- [ ] T028 [U130] [U131] [U132] [U133] [U134] [U135] [U136] [U137] [US2] Tests first, then capture's chat-failure paths. Chat unreachable, timing out (FR-009 as amended), non-2xx, missing `choices`, or returning unusable content each lead to:
  - the thought saved with its embedding
  - default metadata with `enrichment_status: "fallback"` (`data-model.md` §3 `Thought.metadata`)
  - the reply ending with `Metadata extraction skipped: <reason>. Saved with default metadata.`, the reason naming the timeout where applicable

  Covers FR-006, FR-024 and SC-016's fallback half. A duplicate capture that falls back marks the existing row `fallback`, and a later successful capture marks it `complete` (SC-016).
- [ ] T029 [U138] [U139] [U140] [U141] [U142] [U143] [U144] [US2] Tests first, then the R6 option C compensation after a failed `setEmbedding`. The three cases with their exact messages and store effects from contracts/mcp-tools.md:
  - inserted → deleted
  - merged → no delete
  - read-back or delete fails, **or `deleteIfInsertedByCall` returns `deleted: false` without an error** (the row changed between read and delete) → no further action, with the "may be saved without its embedding" message

  Use the fake store's failure injection and insert/merge timestamps (`data-model.md` §3 capture state transitions).
- [ ] T030 [U145] [US2] Tests first, then the end-to-end redaction check: with known key values in `EMBEDDING_API_KEY`, `CHAT_API_KEY`, `MCP_ACCESS_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, and a fake server echoing them in error bodies, no tool output contains any of them (FR-010).

### Stream K: setup check (`shl-check`, wave 2)

- [ ] T031 [U146] [U147] [U148] [U149] [U150] [U151] [U152] [U153] [U154] [U155] [US2] Tests first in `tests/setup_check_test.ts`, then `runSetupCheck(deps)` in `lib/setup_check.ts`: the report shape and fixed check order of contracts/setup-check.md (`data-model.md` §4 `Setup check report.ok`, `.checks`, `.warnings`, `.config`).
  - With configuration not `ok`, `config` fails naming each setting, every other check reads `skipped: configuration incomplete`, and the fake fetch records **zero** requests (FR-018).
  - `.config` shows each role's base, model and `key_set` boolean plus `timeout_ms`, and never a key value (FR-010).
- [ ] T032 [U156] [U157] [U158] [U159] [U160] [U161] [U162] [U163] [U164] [U165] [U166] [U167] [U168] [U169] [U170] [U171] [US2] Tests first, then the check semantics table of contracts/setup-check.md:
  - `<role>_reachable`: any non-401/403 response passes; `unreachable`, `timeout` and `auth_rejected` fail with their reasons.
  - `<role>_model`: listed, **or** the real call succeeded.
  - `embedding_dimension`: 1536, otherwise both sizes are named (SC-009).
  - `chat_metadata`: usable, otherwise the first 120 chars of the reply.
  - When the chat role inherits the embedding base, both roles are still reported.
- [ ] T033 [U172] [U173] [U174] [U175] [US2] Tests first, then:
  - `key_over_http` warnings via `keyOverHttpWarnings`, which never change `ok` (SC-014)
  - **all model requests start before any completes**, proved with fake-fetch hold mode (research R8)
  - each request bounded by `timeoutMs`, so the total is about one timeout

### Stream A: app (`shl-app`, wave 3)

- [ ] T034 [U196] [U197] [U198] [U199] [U200] [U201] [U202] [U203] [U204] [U205] [US2] Tests first in `tests/app_test.ts`, then the `/setup-check` route in `lib/app.ts`:
  - matched on `GET` with a **last path segment** of `setup-check` (`/<any-name>/setup-check`; research R8)
  - a missing or wrong key gets **HTTP 401** with `{"error":"Unauthorized: missing or invalid authentication."}` and CORS headers
  - success is **200**, any failed check **503**, with the same JSON body either way (FR-008 as amended)
  - other methods on that path go to the MCP route
- [ ] T035 [A6] [A7] [A8] [A9] [A10] [A11] [A12] [A13] [A15] [A16] [A17] [A18] [A19] [A20] [A24] [US2] Flip the US2 acceptance tests (SC-003, SC-008, SC-009, SC-011 with a few-ms `FETCH_TIMEOUT_MS`, SC-012, SC-014, SC-016) from `todo` to `Deno.test`, one per green commit.

### Stream D: docs (`shl-docs`, wave 1)

- [ ] T036 [P] [US2] In `README.md`, add:
  - **Run the setup check**: the `curl` with `x-brain-key` (preferred over `?key=`, because query strings reach access logs), how to read each check id, and the 200/503/401 meaning. A 502/504 with no JSON body comes from the Supabase gateway (research R13).
  - **Troubleshooting**: one entry per US2 failure (unreachable, unknown model, wrong size, timeout, unusable chat output, key over http). Include the cold-start hint (Ollama `keep_alive`) and the R6 messages with "capture it again to repair".

---

## Phase 5: User Story 3 - Switch an existing brain over, or back (Priority: P3)

**Goal**: the owner sees how many thoughts carry another model's embedding, and can switch back with no leftover behavior.

**Independent Test**: SC-010 acceptance test passes (3 pre-004 thoughts + 2 new → `other_model: 3`). Manually: quickstart §5 last row.

### Stream K: setup check (`shl-check`, wave 2)

- [ ] T037 [U176] [U177] [U178] [U179] [US3] Tests first, then `thoughts.other_model = countAll() − countWithModel(EMBEDDING_MODEL)` in `lib/setup_check.ts` (`data-model.md` §5 `Mixed-model count.other_model`; FR-016, SC-010). If either count fails, it reports `null` with a `thoughts_count` warning carrying the database message, and the model checks still run.

### Stream A: app (`shl-app`, wave 3)

- [ ] T038 [A14] [US3] Flip the US3 acceptance test (SC-010 through `GET …/setup-check` on a fake store seeded with 3 rows without `embedding_model` plus 2 captures) from `todo` to `Deno.test`.

### Stream D: docs (`shl-docs`, wave 1)

- [ ] T039 [P] [US3] In `README.md`, add **Switching an existing brain**:
  - switching embedding models makes existing embeddings incomparable until re-embedded, and 004 ships no re-embedding tool; point to the follow-up and upstream PR #252 (FR-012, OS-004)
  - the setup check's `thoughts.other_model` shows how many are affected
  - `metadata.enrichment_status = 'fallback'` finds thoughts saved with default metadata (research R12)
  - switching back: reconnect the core server's connector, or point both roles at a cloud endpoint

---

## Phase 6: Integration, gates and landing (integrator)

- [ ] T040 Merge each stream into `W` after verifying it myself:
  - check out each of its commits in a throwaway worktree and run the full suite there
  - `git diff --name-only` touches only its owned files
  - reproduce one recorded red, or one mutant, per stream

  Merge with `git -C W merge --no-ff contrib/mfelker/self-hosted-llm-<s>`. Wave 1 (C, M, S, D) before launching wave 2; wave 2 (T, K) before launching wave 3 (A).
- [ ] T041 Fold `M/specs/004-self-hosted-llm/tdd/cycle-log.d/*.md` into `tdd/cycle-log.md` in behavior order. Tick tasks whose behaviors are all `DONE`. Commit on fork `main`.
- [ ] T042 Refactor with the full suite green in `W`: `deno check`, `deno lint` on `F`, and remove any remaining stub `not implemented` throws (`grep -rn "not implemented" F` is empty). Confirm `RUN_TODO=1` runs no ignored acceptance tests, because every `todo` has been flipped.
- [ ] T043 [P] Gates in `W`:
  - `metadata.json` validates against `.github/metadata.schema.json`
  - `npx markdownlint-cli2 --config .github/.markdownlint.jsonc "integrations/self-hosted-llm-mcp/**/*.md"`
  - README has Prerequisites, numbered steps and Expected Outcome; relative links resolve; the `docs/05-tool-audit.md` link is present
  - scan for secrets, binaries and profanity (no real keys in examples)
  - self-check the 16 upstream gate rules in `CONTRIBUTING.md`
- [ ] T044 [P] Fork-ci preview from `W`'s root: `node ../../.fork/ci/bin/run-folder.mjs --path integrations/self-hosted-llm-mcp --mode strict --origin fork --out "$TMPDIR/r.json"`. Green under the no-network profile.
- [ ] T045 Real-Postgres check of research R6's premise, if Docker is available: run `docs/01`'s `thoughts` DDL, trigger and `upsert_thought` in a `pgvector/pgvector:pg17` container. Show `created_at = updated_at` after a first insert and `created_at < updated_at` after a duplicate. Record the commands and output in `M/specs/004-self-hosted-llm/tdd/r6-premise.md`. Without Docker, the owner runs the same SQL on the self-hosted stack in T046.
- [ ] T046 **Owner-run manual verification**, recorded in `M/specs/004-self-hosted-llm/evidence/`:
  - quickstart §3 (Supabase Cloud: SC-001, SC-002, SC-004, SC-007, SC-009, SC-013, SC-015)
  - §4 (self-hosted: SC-007, SC-014, SC-015)
  - §5 (failure modes)
  - §6 (FR-017/FR-021 environment, plus R3's Ollama live check)

  The integrator then replaces the README's `pending verification` cells with the recorded values in `W` (FR-017, FR-021).
- [ ] T047 TDD audit: run `/speckit-tdd-verify` in `M`. It writes `tdd/verification.md` with verdict PASS or PASS_WITH_GAPS (Quality Gate 1).
- [ ] T048 Scope check: `git -C W diff --stat upstream/main...HEAD` lists only `integrations/self-hosted-llm-mcp/`, with no `specs/`, `.specify/` or `.fork/` (Principle V).
- [ ] T049 Land, **asking the owner before each push or PR**:
  1. `git -C W push -u origin contrib/mfelker/self-hosted-llm`
  2. Upstream PR: `gh pr create -R NateBJones-Projects/OB1 --head mfelker:contrib/mfelker/self-hosted-llm --title "[integrations] Self-hosted LLM MCP server (any OpenAI-compatible model server)"`, with the body from `.github/PULL_REQUEST_TEMPLATE.md`.
  3. Fork PR: `gh pr create -R mfelker/OB1 --base main --head contrib/mfelker/self-hosted-llm --title "[fork] Land contrib/mfelker/self-hosted-llm"`, merged with `--merge` by the owner after `fork-ci-verdict` is green.
  4. Record the branch in `.fork/staged-prs.md`.
  5. Remove the seven `shl-*` worktrees and their local branches.

---

## Dependencies & Execution Order

### Phase and wave dependencies

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007
   wave 1 (parallel): C[T008–T010]  M[T011–T015]  S[T016–T018]  D[T025, T036, T039]
   → T040 (merge C, M, S, D)
   wave 2 (parallel): T[T019–T021, T026–T030]   K[T031–T033, T037]
   → T040 (merge T, K)
   wave 3: A[T022–T024, T034, T035, T038]
   → T040 (merge A) → T041 → T042 → T043 ∥ T044 ∥ T045 → T046 → T047 → T048 → T049
```

- **Why these waves**: T and K call C's config, M's client and S's store through the real modules (only the model server and database are faked). A composes T and K. D depends only on the design documents.
- **User stories vs waves**: each wave contributes to several stories. Stories complete in priority order at merge time: US1 is whole after wave 3's T022–T024, US2 after T035, and US3 after T038.
- **Within a stream**: tasks run in their listed order, which matches the test-list order once `tdd.plan` adds markers. One behavior per commit.

### Parallel Opportunities

- Wave 1: four Sonnet agents at once (C, M, S, D).
- Wave 2: two Sonnet agents at once (T, K).
- Integrator gates T043, T044 and T045 can run in parallel.

## Parallel Example: Wave 1

```text
Agent(model: "sonnet", description: "Stream C config+metadata", prompt: <brief: worktree /Users/mfelker/Projects/ob1/.worktrees/shl-config, branch contrib/mfelker/self-hosted-llm-config, tasks T008–T010, TDD rules, single-writer rule, Seams, data-model §1 §3, contracts/setup-check.md warnings, log to M/specs/004-self-hosted-llm/tdd/cycle-log.d/config.md>)
Agent(model: "sonnet", description: "Stream M model client", prompt: <… shl-model, T011–T015, contracts/model-server-requests.md, data-model §2, research R3 …>)
Agent(model: "sonnet", description: "Stream S thought store", prompt: <… shl-store, T016–T018, W/server/index.ts parity, data-model §3 §5, research R6 R9 …>)
Agent(model: "sonnet", description: "Stream D README", prompt: <… shl-docs, T025, T036, T039, spec README Contract, research R1 R2 R8 R11 R12 R13 …>)
```

## Implementation Strategy

### MVP (User Story 1)

Setup → wave 1 → wave 2 limited to T019–T021 → wave 3 limited to T022–T024. The result is a server that captures and searches against a self-hosted model with no cloud key. **Stop and validate** with quickstart §3 steps 5–6 before taking on the failure paths.

### Incremental delivery

Because streams own files rather than stories, the practical order is wave by wave. Every merge keeps the suite green: stubs throw, and acceptance tests stay `todo` until flipped. So `W` is always shippable as far as it goes. The upstream PR opens only after T046 fills the README's verification table.

## Notes

- `[P]` = parallel with the other streams of its wave (different files). Tasks inside one stream run in order.
- Never tick a `[U#]`/`[A#]`-marked task by hand.
- Streams write nothing in `M` except their own `cycle-log.d/<stream>.md`. The Principle V guard allows that path on fork `main`.
- Lessons applied from spec 005:
  - the outer loop opens first (T006)
  - the integrator verifies every stream before merging (T040)
  - contracts state behavior, not implementation, so behavior is built test-first inside streams
  - the only prescribed structure is the seams
