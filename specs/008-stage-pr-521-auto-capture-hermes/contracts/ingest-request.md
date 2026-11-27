# Contract: request to the Open Brain ingest endpoint

What the adapter sends when it delivers a capture, and how it treats each response. The fork tests check this against a loopback stand-in. The real endpoint is `integrations/open-brain-rest/` (already on fork `main`).

## Request

- **Method / URL**: `POST <SUPABASE_URL without trailing slash>/functions/v1/open-brain-rest/ingest`
- **Headers**: `Content-Type: application/json`, `x-brain-key: <MCP_ACCESS_KEY>`
- **Body**: the capture payload ([data-model.md](../data-model.md#capture-payload-output)).
- **Order within one run**: queued payloads first (oldest first, at most 3), then the current capture.

## Response handling

| Response | Outcome |
|---|---|
| 2xx with JSON | success; reference taken from `job_id`, then `thought_id`, then `id`, else `unknown` |
| 2xx with a non-JSON body | success; reference `unknown` |
| ≥ 500, 429 | temporary: current payload queued; a queued payload stays queued with `attempt_count + 1`, moved to `dead/` at 5 attempts |
| other 4xx | permanent: current payload not queued; a queued payload moves to `dead/` |
| no answer within the fetch window, connection refused | temporary (queued) |

## Idempotency

The same session with the same content always carries the same `import_key`, so the endpoint can drop a duplicate created when a retry races with a late success.
