# Contract: Requests sent to the OpenAI-compatible model server

These are the requests the function sends, per role. Tests assert these shapes against an injected `fetch` (research R4).

## Common

- URL = role `base` (trailing `/` removed) + path.
- Headers: `Content-Type: application/json`, plus `Authorization: Bearer <key>` **only when** the role has a key. With no key, no `Authorization` header is sent at all, not an empty bearer token.
- Every request carries an `AbortSignal` that fires after `FETCH_TIMEOUT_MS` (default 60000). A fired signal is the `timeout` outcome (data-model §2).
- Requests go only to the two configured bases (FR-004).

## Embeddings: `POST <embedding base>/embeddings`

```json
{ "model": "<EMBEDDING_MODEL>", "input": "<text>", "dimensions": 1536 }
```

- Success requires `data[0].embedding` to be an array of numbers of length **1536**. Any other length is the `wrong_dimension` outcome (FR-007), with no padding or truncation.
- **Single retry without `dimensions`** (research R3): when the response is HTTP 400 or 422 **and** the body contains `dimension` or `matryoshka` (case-insensitive), the same request is sent once more without the `dimensions` key. The retry's outcome is final and still goes through the length check. No other error is retried.

## Chat (metadata): `POST <chat base>/chat/completions`

```json
{
  "model": "<CHAT_MODEL>",
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "<core's extraction prompt, verbatim from server/index.ts @ 238df6c>" },
    { "role": "user", "content": "<text>" }
  ]
}
```

- Success requires `choices[0].message.content` to hold usable metadata (data-model §3). Anything else is a skip (FR-006), not a capture failure.

## Model listing (setup check only): `GET <role base>/models`

- Used for `<role>_reachable` and `<role>_model` (contracts/setup-check.md). The function reads `data[].id` when present. A non-JSON or differently shaped body still counts as "reachable", and model presence then falls back to the real call's outcome.
