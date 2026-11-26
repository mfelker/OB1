# Quickstart: validating 004 end to end

Validation guide only. The design is in [plan.md](plan.md); the behavior is in [contracts/](contracts/) and [data-model.md](data-model.md). Paths are relative to the worktree `/Users/mfelker/Projects/ob1/.worktrees/contrib-self-hosted-llm` unless they start with `specs/`.

## 0. Prerequisites

- Deno 2.9.x (`deno --version`)
- For the manual runs:
  - an Open Brain database with `thoughts`, `match_thoughts` and `upsert_thought` at 1536 (VP-009)
  - the Supabase CLI
  - Ollama ≥ 0.11.11 with `qwen3-embedding:4b` and a small chat model pulled (research R1 candidate)

## 1. Automated suite (no network, no keys, no GPU)

```bash
cd integrations/self-hosted-llm-mcp
deno test --node-modules-dir=none --no-prompt --allow-env --allow-read
```

Expected: all green. These are the same flags fork-ci uses, so a test that tries to open a socket fails here first. The suite covers the spec's Testing Requirements list. The mapping from test to requirement lives in `specs/004-self-hosted-llm/tdd/test-list.md` (created by `/speckit-tdd-plan`).

Fork-ci preview, run from the **worktree root** (not the contribution folder):

```bash
node ../../.fork/ci/bin/run-folder.mjs --path integrations/self-hosted-llm-mcp --mode strict --origin fork --out "$TMPDIR/r.json"
```

## 2. Contribution gates

```bash
git diff --stat upstream/main...HEAD           # only integrations/self-hosted-llm-mcp/
npx markdownlint-cli2 --config .github/.markdownlint.jsonc "integrations/self-hosted-llm-mcp/**/*.md"
npx ajv-cli validate -s .github/metadata.schema.json -d integrations/self-hosted-llm-mcp/metadata.json
```

Then self-check the 16 upstream gate rules (CONTRIBUTING.md), in particular the `docs/05-tool-audit.md` link, Prerequisites, numbered steps, and Expected Outcome.

## 3. Manual: Supabase Cloud (SC-001, SC-002, SC-004, SC-007, SC-009, SC-013, SC-015)

1. `supabase functions deploy self-hosted-llm-mcp --no-verify-jwt`, and set the secrets `MCP_ACCESS_KEY`, `EMBEDDING_API_BASE`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `CHAT_MODEL` (README → Deploy to Supabase Cloud).
2. With the model server reachable only on the LAN, run `curl -s -H "x-brain-key: $KEY" "$URL/setup-check"`. Expected: HTTP 503, and `embedding_reachable` failed naming the base (SC-013).
3. Follow the README's HTTPS-plus-key worked example (FR-019) and run the same `curl`. Expected: HTTP 200, `"ok": true`.
4. Run `curl -s -o /dev/null -w "%{http_code}" "$URL/setup-check"` with no key. Expected: `401` (SC-009).
5. Connect an MCP client with `$URL?key=$KEY`. Expected: six tools listed. With a wrong key, the unauthorized error (SC-015).
6. Capture a thought, then search its exact text (top result) and a paraphrase (returned). Then run list and stats (SC-002, SC-004). The Ollama log shows `/v1/embeddings` and `/v1/chat/completions`, and there is no OpenRouter key anywhere.

## 4. Manual: existing self-hosted Supabase stack (SC-007, SC-014, SC-015)

1. Copy the folder to `docker/volumes/functions/self-hosted-llm-mcp/`. Set the env on the `functions` service and confirm `FUNCTIONS_VERIFY_JWT=false` (research R2). Restart `functions`.
2. Run `curl -s -H "x-brain-key: $KEY" "http://<host>:8000/functions/v1/self-hosted-llm-mcp/setup-check"`. Expected: `ok: true`.
3. With `EMBEDDING_API_BASE=http://ollama:11434/v1` and no key: no warnings. Add `EMBEDDING_API_KEY`: a `key_over_http` warning naming `embedding`, with `ok` still `true` (SC-014).
4. Repeat step 3.5 and step 3.6 against this URL, with no code change since the Cloud deploy (SC-007).

## 5. Manual: failure modes (SC-003, SC-008, SC-009, SC-010, SC-011, SC-012)

| Do | Expect |
|----|--------|
| Unset `EMBEDDING_API_BASE`, then capture | Error naming `EMBEDDING_API_BASE`; the Ollama log shows no request (SC-008) |
| Unset `CHAT_MODEL` only | Every tool names `CHAT_MODEL`; no request (SC-012) |
| Only `EMBEDDING_API_BASE`, `EMBEDDING_MODEL`, `CHAT_MODEL` set | Chat calls hit the embedding base (SC-012) |
| `EMBEDDING_MODEL=nomic-embed-text` (768) | Setup check `embedding_dimension` fails with `768` and `1536`; capture refused; nothing stored (SC-009) |
| Model server stopped | Capture fails naming the base as unreachable; row count unchanged (SC-003) |
| Server that never answers (e.g. `nc -l` behind the base) | Capture fails after ~60 s with a timeout message; with `FETCH_TIMEOUT_MS=90000` and a 70 s delay, it succeeds (SC-011) |
| Capture with chat working; then stop only the chat model and capture new text; then restart it and capture that text again | `enrichment_status` is `complete`, then `fallback` (default metadata, skip line in the reply), then `complete` again (SC-016) |
| Brain with 3 pre-004 thoughts, then 2 captures via 004 | Setup check `thoughts.other_model = 3`; new rows have `metadata.embedding_model` (SC-010) |

## 6. FR-017 / FR-021 verification record

Record in the README's "Tested with (known good, not a minimum)" table:

- the self-hosted Supabase version and Supabase CLI version
- the Ollama version
- the `qwen3-embedding:4b` digest (`ollama show --modelfile` or `ollama list`)
- the chat model tag
- the machine's RAM and GPU
- the length of one `/v1/embeddings` response with `dimensions: 1536` (must be 1536)
- research R3 (confirmed in source, checked live here): Ollama `/v1/embeddings` with a 768-dim model and `dimensions: 1536` answers HTTP 400 with "dimensions … exceeds embedding length". If vLLM is tested, record the HTTP status of its "does not support Matryoshka" rejection (assumed 400).
