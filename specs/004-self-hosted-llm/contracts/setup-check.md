# Contract: `GET …/setup-check`

An HTTP route on the same function, not an MCP tool (spec Q5). The README gives the `curl` command.

## Routing

- Matches `GET` when the request path's **last segment** is `setup-check`. The function sees `/<function-name>/setup-check` on Supabase Cloud, and on self-hosted after Kong strips `/functions/v1` (research R8). Matching the last segment works on both and does not depend on the function's name (FR-014).
- Any other method on that path goes to the MCP route, exactly as core would handle it.

## Authentication

- Same key sources as the MCP route (`x-brain-key` header or `key` query parameter).
- A missing or wrong key gets **HTTP 401** with `{"error":"Unauthorized: missing or invalid authentication."}` and core's CORS headers. This route is for `curl` and scripts, so a plain HTTP status is used, not the JSON-RPC envelope (SC-009).

## Response

`Content-Type: application/json`. HTTP **200** when `ok` is `true`, **503** when any check failed (FR-008), so `curl -f` scripts can branch on it. A 502/504 with no JSON body comes from the Supabase gateway, not from this function (research R13). Shape:

```json
{
  "ok": false,
  "checks": [
    { "id": "config",              "ok": true },
    { "id": "embedding_reachable", "role": "embedding", "ok": true },
    { "id": "embedding_model",     "role": "embedding", "ok": true },
    { "id": "embedding_dimension", "role": "embedding", "ok": false,
      "reason": "Embedding model \"nomic-embed-text\" returned 768-dimension vectors; this brain stores 1536." },
    { "id": "chat_reachable",      "role": "chat", "ok": true },
    { "id": "chat_model",          "role": "chat", "ok": true },
    { "id": "chat_metadata",       "role": "chat", "ok": true }
  ],
  "warnings": [
    { "id": "key_over_http", "role": "embedding",
      "message": "An access key is configured for the embedding endpoint, but it uses http://; the key travels unencrypted." }
  ],
  "thoughts": { "other_model": 3 },
  "config": {
    "embedding": { "base": "http://ollama:11434/v1", "model": "…", "key_set": true },
    "chat":      { "base": "http://ollama:11434/v1", "model": "…", "key_set": true, "inherits": ["base", "key"] },
    "timeout_ms": 60000
  }
}
```

## Check semantics

| id | Passes when | Fails with reason naming |
|----|-------------|--------------------------|
| `config` | all required settings present and valid | each missing or invalid setting (FR-018) |
| `<role>_reachable` | `GET <base>/models` gets any HTTP response that is not 401/403 | `unreachable` (base URL), `timeout`, or `auth_rejected` (data-model §2) |
| `<role>_model` | model listed by `/models`, **or** the role's real call (below) succeeded | `model_not_found` (model name) when it is not listed and the real call reports an unknown model; otherwise the real call's outcome |
| `embedding_dimension` | a real embedding of a fixed sample sentence returns 1536 numbers | actual vs expected size (FR-007), or the call's outcome |
| `chat_metadata` | a real chat call on a fixed sample sentence returns usable metadata (data-model §3) | `unusable output` with the first 120 chars of the reply, or the call's outcome |

- When `config` fails, every other check is `ok: false` with reason `skipped: configuration incomplete`, and **no request** is sent to any model server (FR-018, SC-012).
- When the chat role inherits the embedding base, both roles are still checked and reported separately.
- **Warnings** never change `ok`. `key_over_http` is reported per role whose base is `http://` and whose key is set (FR-020, SC-014). There is no warning for an unkeyed `http://` endpoint (OS-005).
- **`thoughts.other_model`** is the mixed-model count (data-model §5, FR-016, SC-010). If the database count fails, it is `null` and a `thoughts_count` warning carries the database message. The model checks still run.
- **Duration**: all model requests run concurrently, so the worst case is about one `FETCH_TIMEOUT_MS` (60 s by default). That is under the 150 s request limit that both hosts enforce (Cloud Free plan wall clock and both hosts' idle timeout; research R8). The README advises keeping `FETCH_TIMEOUT_MS` below 140000.
- The response never contains a key value. `config` shows only `key_set` booleans (FR-010).
