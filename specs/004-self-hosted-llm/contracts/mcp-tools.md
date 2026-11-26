# Contract: MCP tool surface and HTTP authentication

**Parity baseline**: core `server/index.ts` at upstream `238df6c` (2026-09-10). 004 offers the same six tools with the same names, titles, descriptions, input schemas and annotations (VP-001). The only observable differences are listed under each tool.

## Authentication (all routes, FR-023, VP-010)

- The access key is read from the `x-brain-key` header, or else the `key` query parameter, and compared with `MCP_ACCESS_KEY`. No Supabase JWT, `apikey` or `ANON_KEY` is read or required.
- MCP route (any path other than `…/setup-check`): a missing or wrong key gets core's response, byte for byte. HTTP 200 with a JSON-RPC error `{ code: -32001, message: "Unauthorized: missing or invalid authentication." }`, echoing the request `id` (or `null`). CORS preflight `OPTIONS` answers `200 ok` with core's CORS headers.
- If `MCP_ACCESS_KEY` itself is unset, every request is refused as unauthorized. An unset key never means "open".
- The Accept-header patch for Claude Desktop (core, issue #33) is kept.

## Configuration gate (FR-011, SC-008, SC-012)

Before any tool does any work, the endpoint configuration is resolved. If it is incomplete or invalid, **every one of the six tools** returns `isError: true` with text:

```text
Model endpoint not configured: missing EMBEDDING_API_BASE, CHAT_MODEL. Set these as function secrets (see README → Configure).
```

Each missing or invalid setting is named. No model server request and no database call are made (FR-011, research R7). The tool list itself (`tools/list`) is still served, so clients can connect and see the message.

## Tools

| Tool | Annotations (as core) | Behavior in 004 |
|------|----------------------|-----------------|
| `search` | `readOnlyHint: true` | Embeds `query` with the embedding role, then `match_thoughts` (threshold 0.5, count 10) as core. Embedding failure ⇒ `isError: true`, text names the cause (data-model §2), and no results. |
| `fetch` | `readOnlyHint: true` | Unchanged from core, except the configuration gate. |
| `search_thoughts` | `readOnlyHint: true` | Same as core's inputs and defaults; embedding failure handled as in `search`. |
| `list_thoughts` | `readOnlyHint: true` | Unchanged from core, except the configuration gate. |
| `thought_stats` | `readOnlyHint: true` | Unchanged from core, except the configuration gate. |
| `capture_thought` | `readOnlyHint: false, openWorldHint: false, destructiveHint: false, idempotentHint: false` | See below. |

### `capture_thought` observable behavior

| Situation | Result | Stored |
|-----------|--------|--------|
| Config incomplete | `isError`, names missing settings | nothing; no model request |
| Embedding unreachable / timeout / auth / unknown model / bad response | `isError`, names cause, role, base or model | nothing (FR-005) |
| Embedding length ≠ 1536 | `isError`: `Embedding model "<model>" returned <n>-dimension vectors; this brain stores 1536. Choose a model that can output 1536 dimensions (see README).` | nothing (FR-007) |
| Embedding ok, chat fails, times out, or returns unusable output | success text as core, plus a line `Metadata extraction skipped: <reason>. Saved with default metadata.` | row with embedding, `metadata = { topics: ["uncategorized"], type: "observation", source: "mcp", embedding_model, enrichment_status: "fallback" }` (FR-006, FR-024) |
| Both ok | success text as core (`Captured as <type> — <topics> …`) | row with embedding, extracted metadata + `source: "mcp"` + `embedding_model` + `enrichment_status: "complete"` (FR-015, FR-024) |
| Embedding update fails; the row was inserted by this call | `isError`: `Embedding could not be saved: <db message>. The thought was not kept; capture it again.` | the new row is removed (research R6) |
| Embedding update fails; the text was already saved (merge path) | `isError`: `… This text was already in your brain; its metadata was updated but its embedding was not. Capture it again to repair.` | existing row kept: old embedding, merged metadata; nothing deleted |
| Embedding update fails, and the read-back or delete also fails | `isError`: `… The thought may be saved without its embedding; capture it again to repair.` | unknown; a retry repairs it |

Error text never contains `EMBEDDING_API_KEY`, `CHAT_API_KEY`, `MCP_ACCESS_KEY` or `SUPABASE_SERVICE_ROLE_KEY` values (FR-010). Any key value that appears in an upstream server's error body is replaced with `[redacted]`.

## No-cloud guarantee (FR-004)

The only hosts the function contacts are `SUPABASE_URL`, the embedding base and the chat base. No URL is hard-coded besides the citation default `https://openbrain.local/thoughts`, which is never fetched. A test asserts that every `fetch` the server makes goes to a configured base.
