# Feature Specification: Self-hosted LLM backend for Open Brain

**Feature Branch**: `contrib/mfelker/self-hosted-llm`
**Created**: 2026-11-25
**Status**: Draft
**Input**: User description: "I would like to create a feature that upon completion can be pushed upstream, said feature will replace the dependency on open router or other cloud API's with the ability to point at a self hosted LLM"

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | upstream-bound feature |
| **Branch** | `contrib/mfelker/self-hosted-llm` |
| **Base** | `upstream/main` |
| **Category** | integrations |
| **Contribution folder** | `integrations/self-hosted-llm-mcp/` (new) |
| **Upstream PR** | to be opened |
| **Requires** | A running Open Brain whose database has the `thoughts` table, `match_thoughts` and `upsert_thought` from `docs/01-getting-started.md` at 1536 dimensions (VP-009); a self-hosted model server the deployed function can reach over the network |

## Clarifications

### Session 2026-11-25

- Q: Which single contribution folder carries the upstream PR? → A: A new remote MCP server, `integrations/self-hosted-llm-mcp/`, offering the core server's tools and pointed at any OpenAI-compatible model server. Owners deploy it in place of the core server. Core `server/**` is not modified.
- Q: What happens with an embedding model whose vector size is not 1536? → A: It is refused with both sizes reported. No padding, truncation or extra table.
- Q: Given `integrations/kubernetes-deployment` (VP-004) and the owner's end goal of self-hosted Supabase plus their own model server without Kubernetes, what is 004's scope? → A: 004 is one upstream PR: a Supabase Edge Function MCP server that runs unchanged on Supabase Cloud or self-hosted Supabase, its README positioned against `kubernetes-deployment`. The self-hosted Supabase stack and migration/re-embedding are follow-up features outside 004.
- Q: What does the server do when its model endpoint settings are missing? → A: It refuses to run: every tool fails with a message naming the missing settings, and nothing is sent anywhere. It never falls back to a cloud provider; returning to cloud means pointing the settings at a cloud endpoint or reconnecting the core server.
- Q: How does the owner run the setup check? → A: An HTTP route on the same function (`GET …/setup-check`, same access key), not an MCP tool, so the tool list stays identical to core's six; the README gives the `curl` command.
- Q: How should the server handle embeddings from different models in one brain? → A: Each capture records `metadata.embedding_model`; the setup check reports how many thoughts were embedded by another model or an unknown one (everything saved before 004). Search is unchanged. The owner also asked that the plan research which self-hosted servers honor the `dimensions` request field, so the README can name a tested model and server pair.
- Q: What is the default timeout for model requests? → A: 60 seconds, configurable through `LLM_TIMEOUT_MS` (renamed `FETCH_TIMEOUT_MS`, Session 2026-11-26 Q4).
- Q: What verifies that search works (SC-004)? → A: A functional check with no quality target: a saved thought is the top result for its exact text and is returned for a paraphrase. Search quality depends on the owner's model and is not a target.
- Q: Does 004 itself provide re-embedding of existing thoughts when switching models? → A: No, documentation only for now: the README states that switching models requires re-embedding and that the setup check shows how many thoughts are affected; the re-embedding tool belongs to the follow-up migration feature (OS-002) or upstream PR #252.
- Q: What are the endpoint settings called? → A: Match `integrations/kubernetes-deployment`: `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL`; the timeout stays `LLM_TIMEOUT_MS` (renamed `FETCH_TIMEOUT_MS`, Session 2026-11-26 Q4).
- Q: May the chat settings default to the embedding settings? → A: Yes for the endpoint and key: `CHAT_API_BASE` falls back to `EMBEDDING_API_BASE` and `CHAT_API_KEY` to `EMBEDDING_API_KEY`; `EMBEDDING_MODEL` and `CHAT_MODEL` are always required. The fallback only reaches the owner's own embedding server, never a cloud default.
- Q: How does a function on Supabase Cloud reach the owner's own model server? → A: The README documents the requirement (on Supabase Cloud the model server must be reachable over HTTPS behind an access key enforced by a proxy or tunnel) with one worked example; 004 ships no tunnel tooling.
- Q: Does the server accept plain `http://` model endpoints? → A: Yes, both `http` and `https` are accepted; the setup check warns (does not fail) when an access key is configured for an `http` endpoint.
- Q: What does the README say about the tested environment? → A: It records what was actually tested next to the tested pair (self-hosted Supabase version, Supabase CLI version for Cloud deploys, model server and model versions, machine RAM and GPU), labeled "known good, not a minimum"; no minimum requirements are promised.
- Q: Who documents deploying 004 onto a self-hosted Supabase stack? → A: 004's README documents both deployment paths: Supabase Cloud (`supabase functions deploy` plus secrets) and an existing self-hosted stack (placing the function in its functions volume and setting its environment); the follow-up stack recipe relies on these steps.
- Q: How does the follow-up stack relate to `recipes/local-brain-no-mcp`? → A: It is a new recipe (for example `recipes/self-hosted-supabase-mcp`): the official stack, a model server, the `docs/01` schema at 1536, and 004 deployed as the MCP server; its README points to `local-brain-no-mcp` for MCP-blocked networks, which stays unchanged.

### Session 2026-11-26

- Q: How do MCP clients authenticate to 004 on self-hosted Supabase? → A: Same as core everywhere: no Supabase JWT, only `MCP_ACCESS_KEY` (header or `key` query parameter); the README states how to turn JWT verification off for this function on Cloud (`--no-verify-jwt`) and on self-hosted; whether self-hosted allows that per function or only globally is a plan research item.
- Q: Should captures be queued and embedded later while the model server is down? → A: No, keep refusing: a capture fails with a named cause and stores nothing (FR-005); the user retries once the server is back.
- Q: When only the chat request times out during a capture (embedding succeeded), does FR-009 (fail, store nothing) or FR-006 (save with default metadata) apply? → A: FR-006. A chat timeout is one more kind of metadata failure: the capture saves with default metadata and names the timeout. Only an embedding timeout fails the capture. This matches upstream `integrations/enhanced-mcp`, where metadata failures never block a save (plan research R5).
- Q: Should the timeout setting use upstream's existing name? → A: Yes. Rename `LLM_TIMEOUT_MS` to `FETCH_TIMEOUT_MS`, the name `integrations/enhanced-mcp`, `consolidation-workers` and `entity-extraction-worker` use for the same 60000 ms model-request timeout. Keep strict handling: a value that is not a positive integer is a named configuration error (FR-011), not upstream's silent fall back to the default (plan research R11).
- Q: Should a capture record whether its metadata came from the chat model or from the FR-006 defaults? → A: Yes. Use upstream's `consolidation-workers` key `metadata.enrichment_status`: `"complete"` when extraction succeeded, `"fallback"` when the defaults were used. `"skipped"` never occurs, because 004 always attempts extraction (FR-024, plan research R12).
- Q: What happens when an endpoint base is set but is not an `http://` or `https://` URL (for example `ollama:11434/v1` with no scheme)? → A: It is refused at configuration like a missing setting: every tool and the setup check's `config` check name the setting and say it must start with `http://` or `https://`, and no request is sent (FR-011, FR-020).
- Q: What HTTP status does `/setup-check` return? → A: 200 when every check passed, 503 when any check failed, with the same JSON report either way. Warnings do not change it. This matches upstream `consolidation-workers`' 503 for a misconfigured service, and lets `curl -f` and monitors branch without parsing JSON (FR-008).
- Q: Does `GET …/<fn>/setup-check/` (trailing slash) reach the setup check? → A: Yes. One trailing slash is ignored. `/setup-checker` and `/setup-check/extra` still go to the MCP route.
- Q: When the configuration is incomplete, does the setup check still count `thoughts.other_model`? → A: No. It reports `other_model: null` and makes no database or model call (FR-018).
- Q: What does `/setup-check` answer if the check itself crashes (a bug, not a failed check)? → A: HTTP 500 with `{"error":"Setup check failed unexpectedly."}` and CORS headers, never a stack trace or key value, so 503 keeps meaning "a check failed".
- Q: With a separate `CHAT_API_BASE` and no `CHAT_API_KEY`, does the chat role inherit `EMBEDDING_API_KEY`? → A: No. The chat key falls back to the embedding key only when the chat base also falls back, so one host's key never reaches another host (FR-011 amended).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture and search with no cloud AI account (Priority: P1)

An Open Brain owner who runs their own model server (for example on a home lab GPU or a LAN machine) wants to save thoughts and search them from any AI client without an OpenRouter or other cloud AI account. They point Open Brain at their model server's address, choose an embedding model and a chat model, and everything that used to call the cloud now calls their server.

**Why this priority**: This is the whole point of the feature. Capture (which embeds the text and extracts metadata) and semantic search (which embeds the query) are the two operations every Open Brain user relies on, and both currently require a cloud AI key.

**Independent Test**: With no cloud AI key configured anywhere and outbound access to cloud AI providers blocked, save a thought and then find it by a paraphrased search. Both succeed, and the model server's request log shows the embedding and chat calls.

**Acceptance Scenarios**:

1. **Given** Open Brain is configured with a self-hosted endpoint, an embedding model and a chat model, and no cloud AI key exists, **When** the user saves a thought from an AI client, **Then** the thought is stored with an embedding and extracted metadata, and no request leaves for a cloud AI provider.
2. **Given** thoughts saved as in scenario 1, **When** the user searches with the exact text of one of them, **Then** that thought is the top result; **and when** they search with a paraphrase of it, **Then** it is returned.
3. **Given** the self-hosted configuration, **When** the user lists thoughts or asks for stats, **Then** those operations behave exactly as they do with the cloud setup.

---

### User Story 2 - Clear failure when the model server is wrong or down (Priority: P2)

The owner mistypes the server address, picks a model the server does not have, picks an embedding model whose vectors do not fit the brain's stored embeddings, or the server is simply off. They get a specific, actionable message instead of a silent failure or a thought saved without its embedding.

**Why this priority**: A self-hosted server is less reliable than a cloud API and easier to misconfigure. Silent partial saves would corrupt the brain (thoughts that can never be found by search), which is worse than an error.

**Independent Test**: For each misconfiguration (unreachable address, unknown model, wrong embedding size, server timeout), attempt a capture and a search; each returns a message naming the problem, and no thought is stored without an embedding.

**Acceptance Scenarios**:

1. **Given** the endpoint address is unreachable, **When** the user saves a thought, **Then** the save is refused with a message naming the address and saying it could not be reached, and nothing partial is stored.
2. **Given** the configured embedding model produces vectors of a different size than the brain stores, **When** the setup check or the first capture runs, **Then** the user is told the model's size and the expected size, and nothing is stored.
3. **Given** the chat model fails or returns unusable output for metadata extraction, **When** the user saves a thought, **Then** the thought and its embedding are still saved with the core server's default metadata (FR-006), and the response says metadata extraction was skipped.

---

### User Story 3 - Switch an existing brain over, or back, without losing anything (Priority: P3)

An owner who has been using the cloud setup wants to move to their own server, or try it and go back. Existing thoughts stay searchable, and the owner knows exactly what a switch implies for embeddings already stored.

**Why this priority**: Most adopters will already have a populated brain. Searches only work when the query and the stored thoughts were embedded by compatible models, so switching needs explicit guidance.

**Independent Test**: Starting from a brain populated through the cloud setup, follow the documented switch procedure; afterwards a search for an old thought and a search for a newly captured thought both succeed.

**Acceptance Scenarios**:

1. **Given** a brain whose thoughts were embedded by a cloud model, **When** the owner switches to a self-hosted embedding model, **Then** the README states that existing embeddings are not comparable until re-embedded, and the setup check reports how many thoughts still carry another or unknown model's embedding (FR-012, FR-016).
2. **Given** a self-hosted configuration, **When** the owner reconnects the core server's connector (or points both roles' settings at a cloud endpoint), **Then** Open Brain behaves exactly as before the feature, with no leftover setting changing its behavior.

---

### Edge Cases

- The model server is reachable from the user's laptop but not from where Open Brain runs (for example, Open Brain runs in a cloud region and the server is on a home LAN). The setup check must make this visible instead of failing only on first capture.
- The server responds slowly (a cold model load can take tens of seconds). Capture must either wait within a stated limit or fail with a timeout message; it must never store a thought without its embedding.
- The server requires an access key, or requires none. Both must work.
- The embedding model's vector size does not match the brain's stored size (for example a 768-dimension local model against the standard 1536-dimension `thoughts.embedding`). It is refused (FR-007); the README names self-hosted models that can emit 1536-dimension vectors.
- The chat model returns text that is not the structured metadata expected (common with small local models). Fall back to the core server's default metadata (FR-006) rather than failing the capture.
- The embedding and chat models live on different servers, or only one of the two is self-hosted.
- A capture runs while the model server restarts mid-request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The owner MUST be able to point Open Brain's embedding generation and metadata extraction at a self-hosted model server by configuration alone (server address, optional access key, model names), with no code change.
- **FR-002**: The feature MUST work with any model server that offers the widely used OpenAI-compatible interface for embeddings and chat (which common self-hosted servers such as Ollama, LM Studio, vLLM and llama.cpp provide).
- **FR-003**: The embedding role and the chat role MUST be configured independently through `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL` and `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL`, the names `integrations/kubernetes-deployment` uses (VP-004), so either role can be self-hosted or cloud; the request timeout is `FETCH_TIMEOUT_MS` (FR-009) (Session 2026-11-25, Q10).
- **FR-004**: With the self-hosted configuration and no cloud AI key present, all six tools (VP-001) MUST work, and no request MUST be sent to a cloud AI provider.
- **FR-005**: A capture MUST never store a thought without its embedding. If the embedding cannot be produced, the capture fails with a message naming the cause (unreachable server, unknown model, timeout, wrong vector size). A search whose query cannot be embedded fails the same way and returns no results (derived from US2 Independent Test and FR-005). Captures are not queued for later embedding (Session 2026-11-26, Q2).
- **FR-006**: If metadata extraction fails or returns unusable output, the capture MUST still store the thought and its embedding with the core server's default metadata (`topics: ["uncategorized"]`, `type: "observation"`; VP-002), and MUST say that extraction was skipped.
- **FR-007**: The embedding model's vector size MUST match the size the brain stores (1536). A model producing any other size MUST be refused, with both sizes reported, before anything is stored. Vectors are never padded, truncated or stored elsewhere.
- **FR-008**: The server MUST answer `GET <function URL>/setup-check`, behind the same access key as the tools (VP-001), with one result per check run from where the server is deployed: the model server is reachable, the embedding model and the chat model exist, the embedding size is 1536, and the chat model returns usable metadata; each failure names its reason. The MCP tool list stays the six core tools (Session 2026-11-25, Q5). It answers HTTP 200 when every check passed and HTTP 503 when any check failed, with the same JSON report either way; warnings do not change the status (Session 2026-11-26, Q7).
- **FR-009**: Each request to a model server MUST time out after `FETCH_TIMEOUT_MS` milliseconds, default 60000. On timeout of an **embedding** request, the operation fails with a message naming the timeout and stores nothing (FR-005). A **chat** request timeout during capture follows FR-006: the thought is saved with default metadata, and the skip reason names the timeout. Every timeout in the setup check is a failed check naming it (Session 2026-11-25, Q7; Session 2026-11-26, Q3).
- **FR-010**: The access key for the model server, if any, MUST be supplied through environment configuration and MUST never appear in files, logs or error messages.
- **FR-011**: `EMBEDDING_API_BASE`, `EMBEDDING_MODEL` and `CHAT_MODEL` are required; `CHAT_API_BASE` falls back to `EMBEDDING_API_BASE` when unset, and `CHAT_API_KEY` falls back to `EMBEDDING_API_KEY` only when `CHAT_API_BASE` also falls back (Session 2026-11-26, Q11); access keys are optional (FR-001). When a required setting is missing, every tool MUST fail with a message naming each missing setting, and the server MUST send no request to any model provider; it never falls back to a cloud default. The core server is untouched, so existing cloud users are unaffected (Session 2026-11-25, Q4, Q11). A setting that is present but unusable is treated like a missing one, named in the message, with no request sent: an endpoint base that does not start with `http://` or `https://` (FR-020), or a `FETCH_TIMEOUT_MS` that is not a positive integer (Session 2026-11-26, Q4, Q6).
- **FR-012**: The README MUST state that switching embedding models makes existing thoughts' embeddings incomparable until they are re-embedded, that the setup check (FR-016) shows how many are affected, and that 004 provides no re-embedding tool (OS-004) (Session 2026-11-25, Q9).
- **FR-013**: The contribution MUST meet the upstream contribution rules: one contribution folder, a `README.md` and `metadata.json`, no credentials in files, and passing the automated PR gate.
- **FR-014**: The server MUST run unchanged as an Edge Function on both Supabase Cloud and a self-hosted Supabase stack (VP-006); nothing in it may depend on which one hosts it.
- **FR-015**: Every capture MUST write the configured embedding model's name to the thought's `metadata.embedding_model`; no column is added (Session 2026-11-25, Q6).
- **FR-016**: The setup check (FR-008) MUST also report the number of thoughts whose `metadata.embedding_model` differs from the configured model or is absent, so the owner knows search may compare incomparable vectors (Session 2026-11-25, Q6; VP-007).
- **FR-017**: The README MUST name at least one self-hosted embedding model and server pair verified to return 1536-dimension vectors through the OpenAI-compatible `dimensions` request field (Session 2026-11-25, Q6; VP-007).
- **FR-018**: When a required setting is missing, the setup check reports each missing setting as a failed check naming it, and sends no request to any model provider (derived from FR-008 and FR-011).
- **FR-019**: The README MUST state that, when the function runs on Supabase Cloud, the model server must be reachable from the public internet over HTTPS behind an access key enforced in front of it (by a proxy or tunnel), set as `EMBEDDING_API_KEY` / `CHAT_API_KEY`, and MUST walk through one worked example; 004 ships no tunnel tooling (Session 2026-11-25, Q12).
- **FR-020**: The server MUST accept both `http://` and `https://` endpoints. When a role has an access key and an `http://` endpoint, the setup check MUST report a warning naming that role, without failing the check (Session 2026-11-25, Q13).
- **FR-021**: Next to the tested model and server pair (FR-017), the README MUST list the environment it was verified on: the self-hosted Supabase version, the Supabase CLI version used for Cloud deploys, the model server and model versions, and the machine's RAM and GPU, labeled "known good, not a minimum"; it MUST NOT state minimum hardware requirements (Session 2026-11-25, Q14).
- **FR-022**: The README MUST document deploying the function to Supabase Cloud (`supabase functions deploy` and setting its secrets) and to an existing self-hosted Supabase stack (placing the function in the stack's functions volume and setting its environment) (Session 2026-11-25, Q15).
- **FR-023**: MCP clients MUST authenticate with `MCP_ACCESS_KEY` alone, from the `x-brain-key` header or the `key` query parameter, on both hosts; no Supabase JWT or `ANON_KEY` may be required. The README MUST state how JWT verification is turned off for this function on Supabase Cloud (`--no-verify-jwt`) and on a self-hosted stack (Session 2026-11-26, Q1; VP-010).
- **FR-024**: Every capture MUST write `metadata.enrichment_status`: `"complete"` when the chat model returned usable metadata, `"fallback"` when FR-006's default metadata was used. Like `embedding_model` (FR-015), it is set after the extracted metadata, so a chat model cannot override it; no column is added (Session 2026-11-26, Q5).

### Key Entities

- **Model endpoint configuration**: the address of a model server, an optional access key, a model name, and the role it serves (embedding or chat). There are two of these, one per role, configured independently.
- **Thought**: the existing Open Brain record (text, embedding, metadata). This feature changes only where its embedding and metadata come from, not its shape.
- **Setup check result**: per-item pass/fail for reachability, model presence, embedding size and metadata usability, with a reason for each failure, plus the count of thoughts embedded by another or unknown model (FR-008, FR-016).

### Data & Schema Changes

- None to the core `thoughts` table's columns (CLAUDE.md guard rail). The vector size stays as the brain defines it, which is why FR-007 exists. Captures add `embedding_model` and `enrichment_status` inside the existing `metadata` JSON (FR-015, FR-024).

### MCP Tool Surface

- The contribution is an MCP server that offers the same six tools with the same names and inputs as the core Open Brain server (`capture_thought`, `search_thoughts`, `list_thoughts`, `thought_stats`, `search`, `fetch`; VP-001), so AI clients need no change beyond the connector address. It deploys as a remote Supabase Edge Function and connects through the custom-connector URL, per CLAUDE.md.

### README Contract

- What it does and who it is for (owners who self-host models), and how it differs from `integrations/kubernetes-deployment` (same six tools; Supabase Edge Function instead of Kubernetes and plain Postgres).
- Prerequisites, including that the model server must be reachable from where the function runs, and, for Supabase Cloud, the HTTPS-plus-access-key requirement with one worked example (FR-019).
- Deployment steps for both Supabase Cloud and an existing self-hosted stack (FR-022).
- Step-by-step setup with a credential tracker, choosing an embedding model whose vector size fits the brain (1536), with the tested pair and its "known good, not a minimum" environment (FR-017, FR-021).
- Running the setup check (`curl` against `…/setup-check` with the access key) and reading its output.
- Switching an existing brain over or back: that re-embedding is required and not provided by 004, and how the setup check shows the affected count (FR-012, FR-016, OS-004).
- Troubleshooting for each failure in User Story 2.

### Testing Requirements

- Automated tests for: configuration resolution (required settings, the `CHAT_*` fallback, missing settings), request shape sent to an OpenAI-compatible server, the no-cloud-request guarantee, refusal to store a thought without an embedding, the vector-size check, timeout handling, metadata fallback, `metadata.embedding_model` and `metadata.enrichment_status` on capture, the `/setup-check` route (including the mixed-model count), and access-key redaction in messages.
- Tests use a local stand-in for the model server; no test may require a real model, a GPU, network access or a cloud key.
- A documented manual verification against a real self-hosted server (save, paraphrase search, list, stats).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner with a running self-hosted model server and an existing Open Brain completes setup, including the setup check, in under 30 minutes by following the README alone.
- **SC-002**: With cloud AI access blocked, 100% of capture, search, list and stats operations succeed against a correctly configured self-hosted server.
- **SC-003**: In every misconfiguration listed in User Story 2, zero thoughts are stored without an embedding, and 100% of failures produce a message that names the specific cause.
- **SC-004**: A thought saved through the self-hosted setup is the top result when searching for its exact text, and is returned when searching for a paraphrase of it; no ranking-quality target applies (Session 2026-11-25, Q8).
- **SC-005**: Existing cloud users who keep the core server see no change in behavior (all existing verification steps pass unchanged).
- **SC-006**: The upstream PR passes the automated gate on its first run.
- **SC-007**: The same deployed function passes the setup check and a save-then-search round trip on Supabase Cloud and on a self-hosted Supabase stack, with no code change between the two (Session 2026-11-25, Q3).
- **SC-008**: With the embedding endpoint setting unset, a capture fails with a message naming that setting, and the model-server request log and outbound traffic show no request (Session 2026-11-25, Q4).
- **SC-009**: With a correctly configured server, `GET …/setup-check` with the access key reports every check passed; with the access key missing it is refused; with the embedding model replaced by a 768-dimension model it reports the embedding-size check failed with both sizes (Session 2026-11-25, Q5; FR-007).
- **SC-010**: In a brain holding 3 thoughts saved before 004 (no `embedding_model`) and 2 saved through 004, the setup check reports 3 thoughts embedded by another or unknown model, and each new capture's metadata names the configured model (Session 2026-11-25, Q6).
- **SC-011**: With a model server that never answers, a capture fails after about 60 s (default) with a timeout message and no thought is stored; with `FETCH_TIMEOUT_MS=90000` and a server that answers after 70 s (example values), the capture succeeds (Session 2026-11-25, Q7).
- **SC-012**: With only `EMBEDDING_API_BASE`, `EMBEDDING_MODEL` and `CHAT_MODEL` set, metadata extraction calls the embedding server's URL; with `CHAT_MODEL` also unset, every tool fails naming `CHAT_MODEL` and no request is sent (Session 2026-11-25, Q11).
- **SC-013**: With the function on Supabase Cloud and the model server reachable only on a private network, `/setup-check` reports the reachability check failed naming the endpoint; after following the README's worked example, the same check passes and a capture succeeds (Session 2026-11-25, Q12).
- **SC-014**: `EMBEDDING_API_BASE=http://ollama:11434/v1` with no key passes the setup check with no warning; the same endpoint with `EMBEDDING_API_KEY` set passes with a warning naming the embedding role (Session 2026-11-25, Q13).
- **SC-015**: On both Supabase Cloud and a self-hosted stack, an MCP client configured with only the function URL and `?key=<MCP_ACCESS_KEY>` lists the six tools; with a wrong key it gets the unauthorized error (Session 2026-11-26, Q1).
- **SC-016**: A capture with a working chat model stores `metadata.enrichment_status = "complete"`; the same capture with the chat model failing, timing out or returning unusable output stores `"fallback"` with the default metadata; capturing that text again with chat working sets it back to `"complete"` (Session 2026-11-26, Q5).

## Verified Premises

- **VP-001**: The core server (`server/index.ts`) registers six tools: `search`, `fetch`, `search_thoughts`, `list_thoughts`, `thought_stats`, `capture_thought`, behind `MCP_ACCESS_KEY` (`x-brain-key` header or `key` query parameter).
- **VP-002**: The core server embeds with `openai/text-embedding-3-small` and extracts metadata with `openai/gpt-4o-mini`, both through OpenRouter. When the metadata reply does not parse, it stores `{ topics: ["uncategorized"], type: "observation" }` (`server/index.ts`, `extractMetadata`).
- **VP-003**: The core capture computes the embedding before inserting the thought, so an embedding failure aborts the capture without storing anything; a network failure of the metadata call also aborts it (`server/index.ts`, `capture_thought`).
- **VP-004**: Upstream already has `integrations/kubernetes-deployment`: a copy of the core server with the same six tools and configurable `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_API_BASE`, `CHAT_API_KEY`, `CHAT_MODEL` (defaulting to OpenRouter), documented for local models (Ollama, llama.cpp). It replaces Supabase with self-managed Postgres on Kubernetes and runs as a container, not a Supabase Edge Function.
- **VP-005**: Contributions configure model endpoints under two conventions: `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` / `EMBEDDING_BASE_URL` (recipes such as `recipes/entity-wiki`, `recipes/wiki-synthesis`) and `EMBEDDING_API_BASE` / `CHAT_API_BASE` / `*_MODEL` (`integrations/kubernetes-deployment`). Integrations fix `EMBEDDING_DIMENSION = 1536` (`integrations/*/_shared/config.ts`).
- **VP-006**: The official self-hosted Supabase Docker Compose stack includes the Edge Functions runtime; `recipes/local-brain-no-mcp` runs it on one host beside an Ollama container (and stores 768-dimension embeddings, unlike the canonical 1536).
- **VP-007**: The 1536 size comes from the core model: `docs/01-getting-started.md` creates `embedding vector(1536)` and `match_thoughts(query_embedding vector(1536), …)` for `text-embedding-3-small`'s native 1536-dimension output, and integrations drop vectors of any other length (`integrations/rest-api/_shared/helpers.ts:89`). A same-size vector from a different model lies in a different embedding space, so the two are not comparable.
- **VP-008**: Upstream has no bulk re-embedding tool: `recipes/local-ollama-embeddings` embeds new text only and warns not to mix models (README, line 89); `integrations/update-thought-mcp` re-embeds one thought when its content changes. Upstream PR #252 (adds a re-embed command to `local-ollama-embeddings`) is open, not merged.
- **VP-009**: The core server's only database dependencies are the `thoughts` table and the RPCs `match_thoughts(query_embedding vector(1536), …)` and `upsert_thought(p_content, p_payload)`, all created by `docs/01-getting-started.md` (lines 113 and 199); a self-hosted Supabase must have them at 1536 dimensions (`recipes/local-brain-no-mcp` defaults to 768, VP-006).
- **VP-010**: On Supabase Cloud the core server is deployed with `supabase functions deploy open-brain-mcp --no-verify-jwt` (`docs/01-getting-started.md`, lines 470 and 647) and authenticates only with `MCP_ACCESS_KEY` from the `x-brain-key` header or the `key` query parameter (`server/index.ts`, around line 604). On a self-hosted stack, `recipes/local-brain-no-mcp` calls its functions through Kong with the stack's `ANON_KEY` as `apikey` and `Bearer` headers (its README, lines 83–86).

## Out of Scope and Limitations

- **OS-001**: A self-hosted Supabase stack is not part of 004. It is a planned follow-up feature and upstream PR: a new recipe (for example `recipes/self-hosted-supabase-mcp`) with the official Supabase Compose stack, a model server, the `docs/01` schema at 1536 (VP-009) and 004 deployed as the MCP server using FR-022's steps; its README points to `recipes/local-brain-no-mcp` (unchanged) for MCP-blocked networks. Its model server choice waits on OS-003 (Session 2026-11-25, Q3, Q15, Q16).
- **OS-002**: Migrating an existing brain from Supabase Cloud to self-hosted Supabase is not part of 004; it is a planned follow-up feature (Session 2026-11-25, Q3).
- **OS-003**: Undecided (needs fact): which self-hosted servers (for example vLLM, Ollama, llama.cpp, LM Studio) honor the `dimensions` request field for a model trained for variable output sizes (for example Qwen3-Embedding) — must be settled by a plan-phase research task before FR-017 can be met; needs a fact, not a user decision.
- **OS-004**: 004 provides no re-embedding of existing thoughts (Session 2026-11-25, Q9). This leaves part of US3 unmet: after switching models, thoughts saved before the switch are not reliably searchable until they are re-embedded with a tool from the follow-up migration feature (OS-002) or upstream PR #252 (VP-008).
- **OS-005**: The setup check cannot tell whether an unkeyed `http://` endpoint is reachable from the public internet, because the server must not depend on where it runs (FR-014); FR-020 warns only when a key is sent over `http`. Following FR-019's HTTPS-plus-key guidance for Supabase Cloud is the owner's responsibility (derived from FR-014, FR-019, FR-020).
- **OS-006**: Undecided (needs fact): whether a self-hosted Supabase stack can turn off JWT verification (and any Kong key requirement) for one function only or only for all functions — must be settled by a plan-phase research task; if only globally, the README must warn that every function in that stack becomes reachable without a Supabase JWT (FR-023); needs a fact, not a user decision.

## Assumptions

- "Self-hosted LLM" means a model server exposing the OpenAI-compatible embeddings and chat interface. Servers that do not offer it are out of scope.
- The model server is reachable from where Open Brain's functions run. A brain hosted in a cloud region needs the server exposed to it (for example through a tunnel); this is documented, not built.
- Embedding quality and metadata quality depend on the models the owner chooses; the feature guarantees the plumbing and the failure behavior, not model quality.
- The feature does not migrate the ~50 other contributions that call cloud AI. Upstream is moving them one at a time toward configurable endpoints (open PRs #509, #497, #477); 004 uses the `kubernetes-deployment` setting names (FR-003), the closest sibling server.
- The existing `recipes/local-ollama-embeddings` and `recipes/local-brain-no-mcp` remain separate: the first covers bulk embedding from the command line only, the second a fully air-gapped stack without MCP. This feature covers the everyday MCP capture/search path.
- Fork-only TDD artifacts (test list, cycle log) stay in the fork; the upstream branch carries only the contribution folder and its tests (constitution Principle V).
