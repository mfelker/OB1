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
| **Requires** | A running Open Brain (database and `thoughts` table per `docs/01-getting-started.md`); a self-hosted model server the Open Brain deployment can reach over the network |

## Clarifications

### Session 2026-11-25

- Q: Which single contribution folder carries the upstream PR? → A: A new remote MCP server, `integrations/self-hosted-llm-mcp/`, offering the core server's tools and pointed at any OpenAI-compatible model server. Owners deploy it in place of the core server. Core `server/**` is not modified.
- Q: What happens with an embedding model whose vector size is not 1536? → A: It is refused with both sizes reported. No padding, truncation or extra table.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture and search with no cloud AI account (Priority: P1)

An Open Brain owner who runs their own model server (for example on a home lab GPU or a LAN machine) wants to save thoughts and search them from any AI client without an OpenRouter or other cloud AI account. They point Open Brain at their model server's address, choose an embedding model and a chat model, and everything that used to call the cloud now calls their server.

**Why this priority**: This is the whole point of the feature. Capture (which embeds the text and extracts metadata) and semantic search (which embeds the query) are the two operations every Open Brain user relies on, and both currently require a cloud AI key.

**Independent Test**: With no cloud AI key configured anywhere and outbound access to cloud AI providers blocked, save a thought and then find it by a paraphrased search. Both succeed, and the model server's request log shows the embedding and chat calls.

**Acceptance Scenarios**:

1. **Given** Open Brain is configured with a self-hosted endpoint, an embedding model and a chat model, and no cloud AI key exists, **When** the user saves a thought from an AI client, **Then** the thought is stored with an embedding and extracted metadata, and no request leaves for a cloud AI provider.
2. **Given** thoughts saved as in scenario 1, **When** the user searches with a paraphrase of one of them, **Then** that thought is returned among the top results.
3. **Given** the self-hosted configuration, **When** the user lists thoughts or asks for stats, **Then** those operations behave exactly as they do with the cloud setup.

---

### User Story 2 - Clear failure when the model server is wrong or down (Priority: P2)

The owner mistypes the server address, picks a model the server does not have, picks an embedding model whose vectors do not fit the brain's stored embeddings, or the server is simply off. They get a specific, actionable message instead of a silent failure or a thought saved without its embedding.

**Why this priority**: A self-hosted server is less reliable than a cloud API and easier to misconfigure. Silent partial saves would corrupt the brain (thoughts that can never be found by search), which is worse than an error.

**Independent Test**: For each misconfiguration (unreachable address, unknown model, wrong embedding size, server timeout), attempt a capture and a search; each returns a message naming the problem, and no thought is stored without an embedding.

**Acceptance Scenarios**:

1. **Given** the endpoint address is unreachable, **When** the user saves a thought, **Then** the save is refused with a message naming the address and saying it could not be reached, and nothing partial is stored.
2. **Given** the configured embedding model produces vectors of a different size than the brain stores, **When** the setup check or the first capture runs, **Then** the user is told the model's size and the expected size, and nothing is stored.
3. **Given** the chat model fails or returns unusable output for metadata extraction, **When** the user saves a thought, **Then** the thought and its embedding are still saved with minimal default metadata, and the response says metadata extraction was skipped.

---

### User Story 3 - Switch an existing brain over, or back, without losing anything (Priority: P3)

An owner who has been using the cloud setup wants to move to their own server, or try it and go back. Existing thoughts stay searchable, and the owner knows exactly what a switch implies for embeddings already stored.

**Why this priority**: Most adopters will already have a populated brain. Searches only work when the query and the stored thoughts were embedded by compatible models, so switching needs explicit guidance.

**Independent Test**: Starting from a brain populated through the cloud setup, follow the documented switch procedure; afterwards a search for an old thought and a search for a newly captured thought both succeed.

**Acceptance Scenarios**:

1. **Given** a brain whose thoughts were embedded by a cloud model, **When** the owner switches to a self-hosted embedding model, **Then** the documentation states whether existing embeddings stay compatible and, if not, gives a step to re-embed existing thoughts before relying on search.
2. **Given** a self-hosted configuration, **When** the owner restores the cloud configuration, **Then** Open Brain behaves exactly as before the feature, with no leftover setting changing its behavior.

---

### Edge Cases

- The model server is reachable from the user's laptop but not from where Open Brain runs (for example, Open Brain runs in a cloud region and the server is on a home LAN). The setup check must make this visible instead of failing only on first capture.
- The server responds slowly (a cold model load can take tens of seconds). Capture must either wait within a stated limit or fail with a timeout message; it must never store a thought without its embedding.
- The server requires an access key, or requires none. Both must work.
- The embedding model's vector size does not match the brain's stored size (for example a 768-dimension local model against the standard 1536-dimension `thoughts.embedding`). It is refused (FR-007); the README names self-hosted models that can emit 1536-dimension vectors.
- The chat model returns text that is not the structured metadata expected (common with small local models). Fall back to minimal metadata rather than failing the capture.
- The embedding and chat models live on different servers, or only one of the two is self-hosted.
- A capture runs while the model server restarts mid-request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The owner MUST be able to point Open Brain's embedding generation and metadata extraction at a self-hosted model server by configuration alone (server address, optional access key, model names), with no code change.
- **FR-002**: The feature MUST work with any model server that offers the widely used OpenAI-compatible interface for embeddings and chat (which common self-hosted servers such as Ollama, LM Studio, vLLM and llama.cpp provide), and MUST follow the `LLM_BASE_URL` naming convention already used by sibling upstream contributions where one applies.
- **FR-003**: The embedding endpoint/model and the chat endpoint/model MUST be configurable independently, so either can be self-hosted or cloud.
- **FR-004**: With the self-hosted configuration and no cloud AI key present, the capture, search, list and stats operations MUST all work, and no request MUST be sent to a cloud AI provider.
- **FR-005**: A capture MUST never store a thought without its embedding. If the embedding cannot be produced, the capture fails with a message naming the cause (unreachable server, unknown model, timeout, wrong vector size).
- **FR-006**: If metadata extraction fails or returns unusable output, the capture MUST still store the thought and its embedding with minimal default metadata, and MUST say that extraction was skipped.
- **FR-007**: The embedding model's vector size MUST match the size the brain stores (1536). A model producing any other size MUST be refused, with both sizes reported, before anything is stored. Vectors are never padded, truncated or stored elsewhere.
- **FR-008**: The feature MUST provide a setup check the owner can run that confirms, from where Open Brain runs, that the server is reachable, both models exist, the embedding size matches, and the chat model returns usable metadata, reporting each result separately.
- **FR-009**: Requests to the model server MUST time out after a documented limit, and the limit MUST be configurable to allow for slow model loading.
- **FR-010**: The access key for the model server, if any, MUST be supplied through environment configuration and MUST never appear in files, logs or error messages.
- **FR-011**: With the self-hosted settings absent, behavior MUST be identical to the existing cloud setup, so existing users are unaffected.
- **FR-012**: The documentation MUST state the embedding-compatibility consequences of switching models and give a re-embedding step for existing thoughts.
- **FR-013**: The contribution MUST meet the upstream contribution rules: one contribution folder, a `README.md` and `metadata.json`, no credentials in files, and passing the automated PR gate.

### Key Entities

- **Model endpoint configuration**: the address of a model server, an optional access key, a model name, and the role it serves (embedding or chat). There are two of these, one per role, configured independently.
- **Thought**: the existing Open Brain record (text, embedding, metadata). This feature changes only where its embedding and metadata come from, not its shape.
- **Setup check result**: per-item pass/fail for reachability, model presence, embedding size and metadata usability, with a reason for each failure.

### Data & Schema Changes

- None to the core `thoughts` table (CLAUDE.md guard rail). The vector size stays as the brain defines it, which is why FR-007 exists.

### MCP Tool Surface

- The contribution is an MCP server that offers the same tools with the same names and inputs as the core Open Brain server (capture, search, list, stats), so AI clients need no change beyond the connector address. It deploys as a remote Supabase Edge Function and connects through the custom-connector URL, per CLAUDE.md.

### README Contract

- What it does and who it is for (owners who self-host models).
- Prerequisites, including that the model server must be reachable from where Open Brain runs.
- Step-by-step setup with a credential tracker, choosing an embedding model whose vector size fits the brain (1536), with examples of self-hosted models that can emit it.
- Running the setup check and reading its output.
- Switching an existing brain over or back, including re-embedding.
- Troubleshooting for each failure in User Story 2.

### Testing Requirements

- Automated tests for: configuration resolution (self-hosted vs absent), request shape sent to an OpenAI-compatible server, the no-cloud-request guarantee, refusal to store a thought without an embedding, the vector-size check, timeout handling, metadata fallback, and access-key redaction in messages.
- Tests use a local stand-in for the model server; no test may require a real model, a GPU, network access or a cloud key.
- A documented manual verification against a real self-hosted server (save, paraphrase search, list, stats).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner with a running self-hosted model server and an existing Open Brain completes setup, including the setup check, in under 30 minutes by following the README alone.
- **SC-002**: With cloud AI access blocked, 100% of capture, search, list and stats operations succeed against a correctly configured self-hosted server.
- **SC-003**: In every misconfiguration listed in User Story 2, zero thoughts are stored without an embedding, and 100% of failures produce a message that names the specific cause.
- **SC-004**: A thought saved through the self-hosted setup is returned in the top 5 results for a paraphrased search of it in at least 9 of 10 trials.
- **SC-005**: Existing cloud users who do not set the new configuration see no change in behavior (all existing verification steps pass unchanged).
- **SC-006**: The upstream PR passes the automated gate on its first run.

## Assumptions

- "Self-hosted LLM" means a model server exposing the OpenAI-compatible embeddings and chat interface. Servers that do not offer it are out of scope.
- The model server is reachable from where Open Brain's functions run. A brain hosted in a cloud region needs the server exposed to it (for example through a tunnel); this is documented, not built.
- Embedding quality and metadata quality depend on the models the owner chooses; the feature guarantees the plumbing and the failure behavior, not model quality.
- The feature does not migrate the ~50 other contributions that call cloud AI. Upstream is already moving them one at a time to the `LLM_BASE_URL` convention (open PRs #509, #497, #477); this feature follows that convention so it composes with them.
- The existing `recipes/local-ollama-embeddings` and `recipes/local-brain-no-mcp` remain separate: the first covers bulk embedding from the command line only, the second a fully air-gapped stack without MCP. This feature covers the everyday MCP capture/search path.
- Fork-only TDD artifacts (test list, cycle log) stay in the fork; the upstream branch carries only the contribution folder and its tests (constitution Principle V).
