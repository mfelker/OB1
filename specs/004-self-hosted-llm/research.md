# Phase 0 Research: Self-hosted LLM MCP server (004)

Date: 2026-11-26. Parity baseline: upstream `238df6c` (2026-09-10). `git diff --stat upstream/main main -- server docs/01-getting-started.md integrations/kubernetes-deployment integrations/_template .github/metadata.schema.json` is empty, so the fork-main files read during planning are identical to upstream.

R1 and R2 are the two research items the spec makes mandatory (OS-003, OS-006). They are listed first.

---

## R1 (OS-003): Which self-hosted servers honor the OpenAI `dimensions` field

**Source**: a research pass over server source and docs on 2026-11-26. Nothing was run against a live server, so every row is **derived from docs and source, not tested**.

| Server | Honors `dimensions`? | Version / conditions | Evidence |
|--------|---------------------|----------------------|----------|
| **Ollama** | Yes, on `/v1/embeddings` and `/api/embed` | ≥ **v0.11.11** (PR #12242, 2025-09-11). Works for any model. Re-normalizes after truncation. A size above native gives an error `dimensions N exceeds embedding length M` | github.com/ollama/ollama/pull/12242; `server/routes.go`, `middleware/openai.go` |
| **vLLM** | Yes, only for models it treats as Matryoshka | Qwen3-Embedding is not auto-detected. Without `--hf-overrides '{"is_matryoshka": true}'`, a request carrying `dimensions` gets **HTTP 400**. Re-normalizes. | docs.vllm.ai pooling_models/embed; vllm-project/vllm#20899 |
| **llama.cpp `llama-server`** | **No. It silently ignores the field** and returns the native size | current master | `tools/server/server-context.cpp` (`handle_embeddings_impl`) |
| **LM Studio** | **Unverified** (closed source; docs list no parameters) | — | lmstudio.ai/docs/developer/openai-compat/embeddings |
| **HF TEI** | Yes; a value above native is rejected | first version unverified | `core/src/infer.rs` |
| **Infinity** | Yes, but **does not re-normalize** after truncation | first version unverified | `batch_handler.py` |

Models: Qwen3-Embedding-0.6B is native 1024 and **cannot** produce 1536. Qwen3-Embedding-4B is native 2560 (MRL range 32–2560) and Qwen3-Embedding-8B native 4096. Both can be truncated to 1536.

**Decision**:

- **Candidate tested pair** (for FR-017, to be verified by the owner): **Ollama ≥ 0.11.11 + `qwen3-embedding:4b`**, with `dimensions: 1536` sent on `POST /v1/embeddings`. It is a single binary with no extra flags, the field works on the OpenAI-compatible route, it re-normalizes, and the q4_K_M build is ~2.5 GB.
- **Fallback pair**: vLLM + `Qwen/Qwen3-Embedding-4B` started with `--hf-overrides '{"is_matryoshka": true}'`.
- **FR-017 and FR-021 are not met by this research.** The README may name a pair only after an owner-run verification task records a 1536-length response on the owner's own hardware, along with the environment table (Supabase versions, Ollama version, model tag/digest, RAM, GPU). Tasks must include that verification as a manual step. Until it is done, README wording must not say "verified".
- The README lists llama.cpp as **not usable for embeddings in 004** (it ignores `dimensions`, so a 1536 vector comes back only from a natively-1536 model) and LM Studio as **untested**.

**Rationale**: this is the only configuration with source-level evidence for both honoring the field and re-normalizing, on the owner's no-Kubernetes, single-host target.

**Alternatives considered**: Qwen3-Embedding-0.6B (too small); llama.cpp (ignores the field); Infinity (no re-normalization; cosine search via `match_thoughts` would be affected unless normalized client-side, which we do not do).

## R2 (OS-006): Per-function JWT verification on self-hosted Supabase

**Source**: verified directly against `supabase/supabase` master on 2026-11-26, after a delegated research report. The files were fetched and the lines below checked.

- `docker/volumes/functions/main/index.ts:20`: `const VERIFY_JWT = Deno.env.get('VERIFY_JWT') === 'true'`; line 344: `if (req.method !== 'OPTIONS' && VERIFY_JWT) { … }`. This is **one switch for all functions**. The worker is chosen by `service_name = pathname.split('/')[1]` (line 318).
- `docker/docker-compose.yml:501-502`: `# TODO: Allow configuring VERIFY_JWT per function.` / `VERIFY_JWT: "${FUNCTIONS_VERIFY_JWT}"`.
- `docker/.env.example:326-327`: `# NOTE: VERIFY_JWT applies to all functions` / `FUNCTIONS_VERIFY_JWT=false`.
- `docker/volumes/api/kong.yml` route `functions-v1` (`/functions/v1/` → `http://functions:9000/`, `strip_path: true`) has **no `key-auth` plugin**, only a request-transformer for `sb-api-key`, so no `apikey` is required. It sets `read_timeout: 160000` "leaving 10s for the runtime's 150s idle timeout".
- The Supabase CLI local router (`supabase functions serve`) **does** support per-function `verify_jwt` through config. The Docker Compose stack does not.

**Decision**: **Per-function: no.** FR-023's README text for self-hosted must say:

1. JWT checking is the single setting `FUNCTIONS_VERIFY_JWT` in the stack's `.env`, default `false`, which covers all functions.
2. With it `false`, the function is reached with only `x-brain-key` or `?key=`; no `apikey` or `Authorization` header is needed.
3. **Warning (required by OS-006)**: every function in that stack is reachable without a Supabase JWT, so each must check its own credentials. The functions container passes `SUPABASE_SERVICE_ROLE_KEY` to every function.
4. If the owner needs `FUNCTIONS_VERIFY_JWT=true` for other functions, the only option is a local edit to `volumes/functions/main/index.ts` to exempt this function by name. Supabase does not document this, and the edit must be redone after stack updates. The README states this and gives no patch.
5. The README links the three files by commit permalink, because they change often: compose `160f233b4e`, `main/index.ts` `3580c144a4`, `kong.yml` `1b5d89f78a`. All three commit URLs return HTTP 200 on GitHub; that their content matches the lines quoted above was checked on `master`, not at each hash.

**Unverified**: behavior on stack versions before ~2026-09 and a live run. The SC-007/SC-015 manual verification covers the live run.

---

## R3: Send `dimensions` on every embedding request?

**Decision**: Yes. Every embedding request carries `"dimensions": 1536`. If the server answers **HTTP 400 or 422 and the body mentions `dimension` or `matryoshka`** (case-insensitive), the server retries **once** without the field. Whatever comes back goes through the 1536 length check (FR-007).

**Rationale**: FR-002 and FR-003 require any OpenAI-compatible server, cloud ones included, with exactly the six settings the spec fixes.

- OpenAI's `text-embedding-3-small` accepts `dimensions: 1536` (its native size).
- Ollama and TEI honor it.
- vLLM without the Matryoshka override, and a natively-1536 model on a server that rejects the field, would otherwise fail every call. The single retry covers those cases with no new setting.
- llama.cpp ignores the field, and the length check then refuses non-1536 output with both sizes named.

The retry happens only on that specific error, so a normal capture sends one request.

**Trigger evidence**:

- **Ollama (verified in source)**: `server/routes.go` returns `fmt.Errorf("dimensions %d exceeds embedding length %d", …)`, sent as **HTTP 400** with `{"error": "…"}`, so a 768-dim model gets the retry and then a `wrong_dimension` refusal naming 768 and 1536 (SC-009). The `/v1/embeddings` compatibility middleware keeps the status: its error writer re-encodes with `w.ResponseWriter.Status()` (`middleware/openai.go:74`), so the 400 survives (verified in source 2026-11-26).
- **vLLM (verified in source, `vllm/pooling_params.py:247-263`)**: all three rejections raise `VLLMValidationError` with text containing "Matryoshka" and/or "dimensions":
  - `Model '…' does not support Matryoshka embeddings; dimensions must be unset (received dimensions=1536).`
  - `… only supports dimensions in range [1, N], got 1536.`
  - `… only supports Matryoshka dimensions [...], got 1536.`

  The HTTP status vLLM maps this error to is **assumed to be 400** (it is a request validation error).

The only remaining assumption, vLLM's status code, goes into the owner-run verification if vLLM is tested (quickstart §6).

**Alternatives rejected**:

- A new `EMBEDDING_DIMENSIONS` toggle would change the spec's fixed settings list (FR-003). Not needed.
- Never sending the field would make Qwen3-4B/8B unusable at 1536, which defeats FR-017.
- Retrying on any 4xx would mask unknown-model and auth errors.

## R4: Runtime layout and test isolation

**Decision**: `index.ts` is a thin entry: `Deno.serve(createApp(realDeps()).fetch)`. All logic lives in importable modules under `lib/` that take their dependencies as arguments:

- `env`: a getter
- `fetch`: the model-server transport
- a `ThoughtStore` interface over Supabase
- `now`/timer, where needed

Tests drive `createApp(fakeDeps).fetch(new Request(…))` in-process.

**Rationale**: fork-ci runs `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read`, with **no `--allow-net`** (`.fork/ci/README.md`). Core `index.ts` reads env with top-level `!` and calls `Deno.serve` on import, so it cannot be imported by a test (constitution Testing Standards). An injected `fetch` is the "local stand-in for the model server" the spec requires: no listener, no network, no GPU, no key. Timeouts are tested with a fake fetch that never resolves until aborted, and a `timeoutMs` of a few ms.

**Alternatives rejected**: a localhost HTTP stub needs `--allow-net`, which fork-ci does not grant. Copying core's top-level-env style would make FR-011 untestable and crash on a missing env.

## R5: Metadata extraction and FR-006

**Decision**: the embedding call and the chat call run **concurrently**, as in core, but are settled independently:

- An embedding failure aborts the capture and discards the chat result.
- A chat failure of any kind (unreachable, timeout, non-2xx, missing `choices`, or content that is not a JSON object) leaves the capture going with the default metadata and the `Metadata extraction skipped: <reason>` line.

"Usable" means the content parses as a JSON object, raw or inside one fenced code block. Small local models often wrap JSON in a fence, so that is tolerated.

The request keeps core's system prompt and `response_format: { type: "json_object" }`. A server that rejects `response_format` leads to a skip with the reason shown, not a failed capture.

**Chat timeout (FR-006 vs FR-009), settled in spec Session 2026-11-26 Q3, FR-009 amended**: upstream precedent is `integrations/enhanced-mcp`, where any metadata failure, including a `FETCH_TIMEOUT_MS` timeout, falls back to default metadata and never fails the save. For the **chat** role, FR-006 is the more specific rule: a capture whose embedding succeeded is saved with default metadata, and the skip reason names the timeout. FR-009's "stores nothing" applies to the embedding request, and to every request in `/setup-check`.

**Rationale**: core's `extractMetadata` never checks `r.ok` and lets a network error abort the capture (VP-003). FR-006 requires the opposite for chat.

**Alternatives rejected**: retrying without `response_format` (adds a hidden second chat call; the setup check's `chat_metadata` exposes the problem instead).

## R6: FR-005 and the two-step write

**Context**: core calls `upsert_thought(p_content, p_payload)`. It returns `{id, fingerprint}` and either **inserts** a row with `embedding = NULL` or **merges** metadata into an existing row with the same fingerprint. Core then runs a separate `update({embedding}).eq("id", id)`. If that update fails, a row without an embedding can be left behind. The RPC does not say whether it inserted or merged.

**Decision (owner choice "C", 2026-11-26)**: delete only a row this capture inserted.

Keep core's two calls (the RPC is upstream's and 004 adds no SQL). If the embedding update fails:

1. **Read back** the row: `select created_at, updated_at, embedding is null` by `id`.
2. **Inserted by this call** ⇔ `created_at = updated_at`. Both default to `now()` on insert, and `now()` is fixed for the whole transaction. On the merge path, `upsert_thought` and the `thoughts_updated_at` trigger set `updated_at = now()`, which is later than the old `created_at`. This relies on the `docs/01` schema, which VP-009 already requires.
3. If the row was inserted by this call and its embedding is null, **delete** it with `delete().eq("id", id).is("embedding", null).eq("created_at", T).eq("updated_at", T)`, where `T` is the value read back. Repeating the filters keeps the delete from removing anything that changed in between.
4. Reply with one of:

| Case | Row afterwards | Message (after `Embedding could not be saved: <db message>.`) |
|------|----------------|---------------------------------------------------------------|
| Inserted, delete succeeded | none | `The thought was not kept; capture it again.` |
| Merged into an existing thought | the existing row: old embedding (or none, if it never had one), metadata merged | `This text was already in your brain; its metadata was updated but its embedding was not. Capture it again to repair.` |
| Read-back or delete failed | unknown | `The thought may be saved without its embedding; capture it again to repair.` |

**Why a retry always repairs**: capturing the same text again reaches the same row through the fingerprint, and a successful update writes the embedding and the current `embedding_model` together.

**What it never does**: delete a row that existed before this call.

**Residual risk** (for README Troubleshooting and the tasks). Both cases need a database failure between two consecutive calls to the same database:

1. In the merge case, the row's `metadata.embedding_model` names the new model while it holds the old vector, until the retry. The setup check undercounts it by one.
2. If the read-back or the delete also fails, an embedding-less row may remain until the retry. The message says so.

**Alternatives rejected**:

- **A**, an `embedding IS NULL` delete without the inserted-by-this-call test: it could delete a pre-existing thought that another tool had saved without an embedding.
- **B**, no cleanup, matching core: it leaves FR-005 broken until the user retries.
- Computing the fingerprint client-side and doing one `upsert` with the embedding: this duplicates SQL `regexp_replace`/`trim` semantics in TypeScript and breaks on the partial unique index used with `ON CONFLICT`.
- A new RPC: adds SQL that every user must install, which is outside the "no schema change" scope.

## R7: Configuration resolution and FR-011's "every tool fails"

**Decision**: configuration is resolved on each request (data-model §1). If it is incomplete or invalid, **all six tools** fail with the message naming each setting, and so does the setup check. That includes `list_thoughts`, `thought_stats` and `fetch`, which need no model, as the owner decided in spec Q4. There is no default base, no OpenRouter fallback, and no `OPENROUTER_API_KEY` read.

**Rationale**: the spec is explicit (FR-011, Session 2026-11-25 Q4). A half-configured server that answers some tools would hide the misconfiguration.

## R8: `/setup-check` routing, duration, host limits

- **Path**: both hosts hand the function `/<function-name>/<rest>`. Supabase Cloud includes the slug, verified from Supabase's routing guide (`apps/docs/content/guides/functions/routing.mdx:141`: "paths should always be prefixed with the function name"; its examples use `url.pathname.split('/').pop()` and `basePath('/<functionName>')`). On self-hosted, Kong strips `/functions/v1` and the main router dispatches on `pathname.split('/')[1]` and forwards the request unchanged (`main/index.ts:316-318`). Matching the **last path segment == `setup-check`** is host-independent (FR-014).
- **Duration**: the self-hosted runtime enforces a **150 s request idle timeout** (`main/index.ts:120`, kong `read_timeout: 160000`). Supabase Cloud documents a **150 s request idle timeout** and a wall-clock limit of **150 s on Free, 400 s on paid plans** (`apps/docs/content/guides/functions/limits.mdx:11-16`), so both hosts share the 150 s bound. All setup-check model requests run concurrently, so the worst case is about `FETCH_TIMEOUT_MS`. The README advises `FETCH_TIMEOUT_MS` < 140000.
- **Auth response**: HTTP 401 with a JSON body. The MCP route keeps core's HTTP-200 JSON-RPC envelope, because strict MCP hosts tear down on 4xx (core comment). `curl` users and scripts need a real status.

## R9: Mixed-model count without new SQL

**Decision**: `other_model = count(*) − count(* where metadata->>embedding_model = EMBEDDING_MODEL)`. These are two `select("id", { count: "exact", head: true })` calls, the second using `.eq("metadata->>embedding_model", model)`. `eq` values are URL-encoded by supabase-js, so `:` `/` `.` `,` in names such as `qwen3-embedding:4b` or `openai/text-embedding-3-small` are safe. An `or()` filter would need quoting.

**Rationale**: no RPC or view to install, and both counts are cheap at single-user scale. The two counts are not atomic. A capture between them can skew the count by one, which is acceptable for an advisory number.

## R10: Dependencies and folder conventions

- **Import specifiers (FR-014)**: the self-hosted router creates every worker with `importMapPath = /home/deno/functions/deno.jsonc`, a **single shared import map** (`main/index.ts:403-405`, comment: "Using a common Import Map for all functions"). That map holds only `@supabase/functions-js` and `@supabase/server`. A function's own `deno.json` import map is therefore not applied on self-hosted, and core-style bare specifiers (`hono`, `zod`) would fail to resolve there. **Decision**: source files import with full specifiers (`npm:hono@4.9.2`, `npm:@hono/mcp@0.1.1`, `npm:@modelcontextprotocol/sdk@1.24.3/server/mcp.js`, `npm:zod@4.1.13`, `npm:@supabase/supabase-js@2.47.10`, `jsr:@std/assert` in tests). These are the same versions as `server/deno.json` at `238df6c`, all MIT or Apache-2.0 and compatible with FSL-1.1-MIT. `deno.json` stays in the folder for Supabase Cloud bundling and for fork-ci's `deno` profile detection, but nothing depends on its import map. A test asserts that no source file uses a bare specifier. The manual self-hosted run (quickstart §4) confirms it.
- **Injected env**: verified for self-hosted. The `functions` service sets `SUPABASE_URL: http://api-gw:8000` and `SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}` (`docker-compose.yml`, functions service). On Supabase Cloud these are default function secrets, which core already relies on.
- Tests: `tests/*_test.ts` inside the contribution folder, which matches fork-ci's `deno` profile (`*_test.*`).
- Integration folder conventions: scaffold from `integrations/_template/`. The README links `docs/05-tool-audit.md` (gate rule) and positions against `integrations/kubernetes-deployment` (spec README Contract).
- **Self-hosted deploy path** (FR-022): copy the folder to `docker/volumes/functions/<name>/` and set env in the functions service. The Compose router passes the whole container env to every worker (`main/index.ts:409`), so `EMBEDDING_*`, `CHAT_*`, `MCP_ACCESS_KEY` and `FETCH_TIMEOUT_MS` go on the `functions` service in `docker-compose.yml` (or an override file), followed by a restart of `functions`.

## R11: Timeout setting name and bad values

**Decision (owner, spec Session 2026-11-26 Q4)**: the timeout setting is named `FETCH_TIMEOUT_MS`, default 60000. That is upstream's existing name for the model-request timeout in `integrations/enhanced-mcp/_shared/helpers.ts` (`fetchWithTimeout`), `integrations/consolidation-workers/_shared/network.ts` (`resolveLlmFetchTimeoutMs`) and `integrations/entity-extraction-worker/index.ts`.

**Bad-value handling deliberately differs**: upstream returns the default when the value is not a positive integer. 004 reports it as a named configuration error that fails every tool and the setup check's `config` check (FR-011). For example, `60s` would otherwise run silently with 60000.

**Shared-environment note**: on self-hosted Supabase the router passes the whole container environment to every function (R10), and Cloud secrets are per project. So one `FETCH_TIMEOUT_MS` governs 004 and any co-deployed `enhanced-mcp`, which is consistent, since it means the same thing in each. The README says so.

## R12: `metadata.enrichment_status`

**Decision (owner, spec Session 2026-11-26 Q5, FR-024)**: every capture writes `metadata.enrichment_status`, using `"complete"` or `"fallback"`, with the key name and values from upstream `integrations/consolidation-workers/_shared/helpers.ts` (`enrichment_status: enrichmentStatus`). `"skipped"` never occurs, because 004 always attempts extraction. Upstream's companion keys `enrichment_attempted_at` and `enrichment_warnings` are **not** adopted: `created_at`/`updated_at` carry the time, and the skip reason goes back to the user in the response.

**Why**: FR-006's fallback discards metadata for good (004 has no re-enrichment tool). The marker lets a later tool, the follow-up migration feature, or a query (`metadata->>'enrichment_status' = 'fallback'`) find those thoughts.

It also exposes a duplicate-path effect that core has today without any marker: capturing already-saved text while chat is failing overwrites that row's good metadata with the default (`upsert_thought` merges `old || new`). The marker makes that row findable, and a later capture with chat working restores it (SC-016).

## R13: Malformed base URL and setup-check status

**Decision (owner, spec Session 2026-11-26 Q6, Q7)**:

- **Malformed base**: an endpoint base without an `http://` or `https://` scheme is a named configuration error (FR-011), the same rule as an invalid `FETCH_TIMEOUT_MS` (R11). Otherwise `fetch` would throw at request time, and the user would see a generic unreachable or invalid-URL error instead of the setting's name.
- **`/setup-check` status**: 200 when `ok`, 503 when any check failed (FR-008). Upstream precedent: `integrations/consolidation-workers/bio/index.ts:511` returns 503 for "No LLM API keys configured". `agent-memory-api`'s always-200 `/health` is a liveness ping, not a configuration check. The README tells owners to read the JSON body, and that a 502/504 with no JSON body comes from the Supabase gateway, meaning the function did not answer.

## Open items carried to tasks (not blockers for planning)

- FR-017 / FR-021 owner-run verification of the candidate pair (R1). It produces the environment table.
- SC-007 / SC-013 / SC-015 manual runs on Supabase Cloud and on a self-hosted stack.
- Pick the chat model for the tested environment at verification time. A small instruct model on the same Ollama, for example `qwen3:4b`, is a candidate, but it is **not** a requirement. Metadata quality is not a target (Assumptions).
