# Data Model: Self-hosted LLM MCP server (004)

No database schema changes. The `thoughts` table, `match_thoughts` and `upsert_thought` from `docs/01-getting-started.md` (upstream `238df6c`) are used unchanged at 1536 dimensions (VP-009). Everything below is either in-memory per request or a key inside the existing `metadata` JSON.

## 1. Endpoint configuration (per role, resolved per request)

Read from the environment **on every request**, never at module load, so a missing setting produces a named failure instead of a crash at import (FR-011, research R7).

| Field | Embedding role source | Chat role source | Rule |
|-------|-----------------------|------------------|------|
| `base` | `EMBEDDING_API_BASE` | `CHAT_API_BASE`, else `EMBEDDING_API_BASE` | Required (embedding). `http://` or `https://` only (FR-020). Trailing `/` removed. |
| `key` | `EMBEDDING_API_KEY` | `CHAT_API_KEY`, else `EMBEDDING_API_KEY` | Optional. When absent, no `Authorization` header is sent. Never logged or echoed (FR-010). |
| `model` | `EMBEDDING_MODEL` | `CHAT_MODEL` | Both required, with no fallback between them (FR-011). |

Shared settings:

| Field | Source | Rule |
|-------|--------|------|
| `timeoutMs` | `FETCH_TIMEOUT_MS` | Default `60000` (upstream's name and default, research R11). A value that is not a positive integer makes the configuration invalid, reported as a named problem (same as a missing setting). This is **stricter than upstream**, which silently uses the default. |
| `missing[]` | derived | Names of required settings that are unset or blank, in the order `EMBEDDING_API_BASE`, `EMBEDDING_MODEL`, `CHAT_MODEL`. Non-empty ⇒ no request to any model server (FR-011, FR-018). |
| `invalid[]` | derived | Settings present but unusable (a non-`http(s)` base, an invalid `FETCH_TIMEOUT_MS`), each with a reason that never includes a key value. Treated like `missing[]`: no request is sent (FR-011, spec Session 2026-11-26 Q6). |

No OpenRouter default and no `OPENROUTER_API_KEY` fallback exist (unlike `integrations/kubernetes-deployment`). That is the no-cloud-fallback guarantee (FR-004, FR-011).

Unchanged core settings: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (injected by both hosts), `MCP_ACCESS_KEY`, `OPEN_BRAIN_CITATION_BASE_URL` (optional).

## 2. Model call outcome

Every call to a model server resolves to exactly one outcome. Messages name the role, the endpoint base and the model, and never the key (FR-010).

| Outcome | Raised when | Message names |
|---------|-------------|---------------|
| `ok` | 2xx with a well-formed body | — |
| `unreachable` | `fetch` rejects (DNS, refused connection, TLS, reset mid-request) | role, base URL, "could not be reached" |
| `timeout` | no complete response within `timeoutMs` (AbortSignal) | role, base URL, the timeout in ms and `FETCH_TIMEOUT_MS` |
| `auth_rejected` | HTTP 401/403 | role, base URL, "access key rejected" |
| `model_not_found` | HTTP 404, or a 4xx body that names the model as unknown | role, model name |
| `http_error` | any other non-2xx | role, status code, a server message trimmed to 200 chars with key values redacted |
| `bad_response` | 2xx whose body lacks `data[0].embedding` (embeddings) or `choices[0].message.content` (chat) | role, what was missing |
| `wrong_dimension` | embedding length ≠ 1536 | model, actual length, expected 1536 (FR-007) |

## 3. Thought (existing record, unchanged shape)

| Field | Change in 004 |
|-------|---------------|
| `content` | none |
| `embedding vector(1536)` | always written by a successful capture; a capture whose embedding failed stores no row (FR-005) |
| `metadata` | gains `embedding_model: <EMBEDDING_MODEL>` (FR-015) and `enrichment_status: "complete" \| "fallback"` (FR-024) on every capture; `source: "mcp"` as in core |
| other columns | none |

Metadata written by capture = extracted metadata (or the default `{ topics: ["uncategorized"], type: "observation" }`, FR-006) merged with `{ source: "mcp", embedding_model, enrichment_status }`. These three are set last, so a chat model cannot override them. `enrichment_status` is `"complete"` when the extracted metadata was used and `"fallback"` when the default was used (FR-024). On the duplicate path, `upsert_thought` merges with `old || new`, so a fallback capture of already-saved text overwrites the old row's good metadata with the default and marks it `"fallback"`. A later successful capture restores `"complete"` (research R12).

### Capture state transitions

```text
start
  ├─ config invalid ──────────────────────────► FAIL (names settings; no request, no row)
  ├─ embed ─ not ok / wrong_dimension ────────► FAIL (names cause; no row)       [FR-005, FR-007]
  │   (chat runs concurrently; its result is discarded on this path)
  ├─ embed ok, chat ok ──────────────────────► enrichment_status := "complete"            [FR-024]
  ├─ embed ok, chat not ok / unusable ────────► metadata := default, enrichment_status := "fallback", skipped := reason   [FR-006, FR-024]
  ├─ upsert_thought(content, {metadata}) ─ err ► FAIL (no row written by this call)
  ├─ update embedding by id ─ err ─► read back (created_at, updated_at, embedding is null)   [research R6]
  │     ├─ created_at = updated_at, embedding null ─► delete (id, embedding null, both timestamps = T)
  │     │                                            FAIL "…not kept; capture it again"
  │     ├─ created_at ≠ updated_at (merged) ─────────► no delete; FAIL "…already in your brain … capture it again to repair"
  │     └─ read-back or delete fails ────────────────► no further action; FAIL "…may be saved without its embedding …"
  └─ ok ──────────────────────────────────────► SUCCESS ("Captured as …" + "metadata extraction skipped: <reason>" when skipped)
```

Usable metadata (research R5): the chat reply's content parses as a JSON **object**, either raw or inside one fenced code block. Arrays, scalars and unparseable text count as unusable.

## 4. Setup check report (`GET …/setup-check`)

One JSON document (shape in [contracts/setup-check.md](contracts/setup-check.md)):

| Field | Meaning |
|-------|---------|
| `ok` | `true` when every check passed; warnings do not affect it |
| `checks[]` | `{ id, role?, ok, reason? }`, one per check, in a fixed order |
| `warnings[]` | `{ id, role, message }`, e.g. `key_over_http` (FR-020) |
| `thoughts.other_model` | count of thoughts whose `metadata.embedding_model` is absent or differs from `EMBEDDING_MODEL` (FR-016); `null` with a reason if the count could not be read |
| `config` | the non-secret resolved values: each role's base, model, whether a key is set (boolean), and `timeoutMs` |

Check ids: `config`, `embedding_reachable`, `embedding_model`, `embedding_dimension`, `chat_reachable`, `chat_model`, `chat_metadata`. When `config` fails, every other check reports `ok: false` with reason `skipped: configuration incomplete`, and no request is sent (FR-018).

## 5. Mixed-model count (derived, no new SQL)

`other_model = total − matching`, where `total` is a `count: exact, head: true` select on `thoughts`, and `matching` is the same select filtered with `.eq("metadata->>embedding_model", EMBEDDING_MODEL)`. Two plain filters, so model names containing `:`, `/`, `.` or `,` need no PostgREST `or()` quoting (research R9). In SC-010's example, total 5 and matching 2 give 3.
