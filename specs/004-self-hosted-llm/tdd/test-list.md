---
feature: 004-self-hosted-llm # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 24 # acceptance behaviors derived from US1–US3 scenarios and SC-002–SC-016 (automatable ones)
planned_at: 974ca30 # short SHA the list was derived from (fork main)
updated_at: 873b1cc # short SHA of the last change to this file
suite_baseline: green # empty: integrations/self-hosted-llm-mcp does not exist yet (0 tests)
---

# Test List: Self-hosted LLM backend for Open Brain

## How this list keeps every red real (read before starting a stream)

The rubric grades a behavior `PROVEN` only when its red is recorded **and** its test changes in the same commit as, or before, the source that makes it pass.

- **Outer loop (A1–A24)**:
  - The integrator writes all 24 first, before any stream starts, as `todo(...)` tests (`Deno.test` with `ignore` unless `RUN_TODO=1`) in `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts`, through `createApp(fakeDeps).fetch(new Request(...))` (task T006).
  - Each red is recorded with `RUN_TODO=1`, and the file is committed while every stub still throws.
  - Stream A flips each `todo` to `Deno.test` in the commit that turns it green (T024, T035, T038).
  - These are **integration-level** acceptance tests: the real composed modules behind the real HTTP handler, with the model server (`fetch`) and the database (`ThoughtStore`) faked. A live run against a real model server and Supabase is the manual quickstart (T046), not part of this list.
- **Inner loop**:
  - Rows are in cycle order per component. Each component starts from its T004 stub, which throws `not implemented`, so the first test of every component goes red on the stub.
  - Rows marked "sampled" or "both sides" are one behavior tested at several inputs in one test. Every listed input must be asserted.
- **Behavior ids prefix every test name** (`"U12 …"`, `"A3 …"`), so `--filter "/^U12 /"` selects exactly one test. A run reporting `0 passed | 0 failed` is not evidence.
- A test that passes on its first run gets a deliberate mutant check, and its cycle entry says so.
- **Drafting**: the inner loop was drafted in parallel by six Sonnet agents, one per component, from the design documents only. The integrator then merged, deduplicated and numbered the rows (289 drafts → 205 behaviors). Gaps they raised were settled by spec Session 2026-11-26 Q8–Q11 or are listed under Assumptions.

## Outer loop: acceptance behaviors

Test file: `integrations/self-hosted-llm-mcp/tests/acceptance_test.ts`.

| id  | behavior | traces | kind | state | test |
| --- | -------- | ------ | ---- | ----- | ---- |
| A1 | With only `EMBEDDING_API_BASE`, `EMBEDDING_MODEL` and `CHAT_MODEL` set to a self-hosted base and no cloud key, `capture_thought` stores one row carrying a 1536-length embedding and extracted metadata | US1.1, FR-001, FR-004 | example | DONE | `tests/acceptance_test.ts::A1` |
| A2 | After a capture, `search_thoughts` with the thought's exact text returns that thought as the top result | US1.2, SC-004 | example | DONE | `tests/acceptance_test.ts::A2` |
| A3 | After a capture, `search_thoughts` with a paraphrase (scripted to embed near the original) returns that thought | US1.2, SC-004 | example | DONE | `tests/acceptance_test.ts::A3` |
| A4 | Under the self-hosted configuration, `list_thoughts` and `thought_stats` return core's output text for the same rows | US1.3 | example | DONE | `tests/acceptance_test.ts::A4` |
| A5 | Capture, search, list and stats all succeed, and every model request in the fetch log goes to the configured base | SC-002, FR-004 | example | DONE | `tests/acceptance_test.ts::A5` |
| A6 | With the embedding base unreachable, `capture_thought` returns an error naming the base as unreachable and the store gains no row | US2.1, FR-005, SC-003 | example | DONE | `tests/acceptance_test.ts::A6` |
| A7 | With an embedding model the server does not know, `capture_thought` returns an error naming the model and stores nothing | SC-003, FR-005 | example | DONE | `tests/acceptance_test.ts::A7` |
| A8 | With a 768-dimension embedding model, `capture_thought` returns an error naming 768 and 1536 and stores nothing | US2.2, FR-007, SC-003 | example | DONE | `tests/acceptance_test.ts::A8` |
| A9 | With a 768-dimension embedding model, `GET …/setup-check` answers 503 with `embedding_dimension` failed naming 768 and 1536 | US2.2, SC-009, FR-007 | example | DONE | `tests/acceptance_test.ts::A9` |
| A10 | With the chat model returning unusable output, `capture_thought` saves the thought with its embedding and default metadata, and the reply says extraction was skipped | US2.3, FR-006 | example | DONE | `tests/acceptance_test.ts::A10` |
| A11 | With `EMBEDDING_API_BASE` unset, `capture_thought` fails naming `EMBEDDING_API_BASE` and the fetch log is empty | SC-008, FR-011 | example | DONE | `tests/acceptance_test.ts::A11` |
| A12 | With a correctly configured fake server, `GET …/setup-check` with the key answers 200 with every check passed | SC-009, FR-008 | example | DONE | `tests/acceptance_test.ts::A12` |
| A13 | `GET …/setup-check` without the key answers 401 | SC-009, FR-023 | example | DONE | `tests/acceptance_test.ts::A13` |
| A14 | A brain holding 3 thoughts without `metadata.embedding_model` plus 2 captured through the server reports `thoughts.other_model: 3`, and both new rows name the configured model | US3.1, SC-010, FR-015, FR-016 | example | DONE | `tests/acceptance_test.ts::A14` |
| A15 | With a model server that never answers and a few-ms `FETCH_TIMEOUT_MS`, `capture_thought` fails with a timeout message naming `FETCH_TIMEOUT_MS` and stores nothing | SC-011, FR-009 | example | DONE | `tests/acceptance_test.ts::A15` |
| A16 | With `FETCH_TIMEOUT_MS` larger than the server's (scaled) delay, the same capture succeeds | SC-011, FR-009 | example | DONE | `tests/acceptance_test.ts::A16` |
| A17 | With only `EMBEDDING_API_BASE`, `EMBEDDING_MODEL` and `CHAT_MODEL` set, the capture's chat request goes to the embedding base | SC-012, FR-011 | example | DONE | `tests/acceptance_test.ts::A17` |
| A18 | With `CHAT_MODEL` unset, every one of the six tools fails naming `CHAT_MODEL` and the fetch log is empty | SC-012, FR-011 | example | DONE | `tests/acceptance_test.ts::A18` |
| A19 | `EMBEDDING_API_BASE=http://ollama:11434/v1` with no key passes the setup check with no warning | SC-014, FR-020 | example | DONE | `tests/acceptance_test.ts::A19` |
| A20 | The same base with `EMBEDDING_API_KEY` set passes the setup check with a `key_over_http` warning naming the embedding role | SC-014, FR-020 | example | DONE | `tests/acceptance_test.ts::A20` |
| A21 | An MCP client using only `?key=<MCP_ACCESS_KEY>` lists exactly the six tools | SC-015, FR-023 | example | DONE | `tests/acceptance_test.ts::A21` |
| A22 | An MCP request with a wrong key receives the JSON-RPC unauthorized error | SC-015, FR-023 | example | DONE | `tests/acceptance_test.ts::A22` |
| A23 | With both roles pointed at a cloud-style `https` base, capture and search succeed with every model request to that base | FR-002, US3.2 | example | DONE | `tests/acceptance_test.ts::A23` |
| A24 | A capture with chat working stores `enrichment_status: "complete"`; new text captured with chat failing stores `"fallback"`; recapturing that text with chat working restores `"complete"` | SC-016, FR-024 | example | DONE | `tests/acceptance_test.ts::A24` |

## Inner loop: unit behaviors

All paths are under `integrations/self-hosted-llm-mcp/`. The test file is `tests/<module>_test.ts`.

### `lib/config.ts` (stream C)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U1 | All six settings set validly: `ok: true`, each role's base, key and model as given, `chatInherits: []` | FR-003, data-model §1 | example | T008 | DONE | `tests/config_test.ts::U1` |
| U2 | Only `EMBEDDING_API_BASE`, `EMBEDDING_MODEL`, `CHAT_MODEL` set: `ok: true`, chat base equals the embedding base, no key on either role, `chatInherits: ["base"]` | FR-011, SC-012 | example | T008 | DONE | `tests/config_test.ts::U2` |
| U3 | `EMBEDDING_API_KEY` set with `CHAT_API_BASE` and `CHAT_API_KEY` unset: chat key equals the embedding key, `chatInherits: ["base", "key"]` in that order | FR-011, Q 2026-11-26 #11 | example | T008 | DONE | `tests/config_test.ts::U3` |
| U4 | `CHAT_API_BASE` set, `CHAT_API_KEY` unset, `EMBEDDING_API_KEY` set: the chat role has **no** key, `chatInherits: []` | FR-011, Q 2026-11-26 #11 | example | T008 | DONE | `tests/config_test.ts::U4` |
| U5 | `CHAT_API_BASE` and `CHAT_API_KEY` set: the chat role uses its own values | FR-003 | example | T008 | DONE | `tests/config_test.ts::U5` |
| U6 | Nothing set: `ok: false`, `missing` is exactly `["EMBEDDING_API_BASE", "EMBEDDING_MODEL", "CHAT_MODEL"]` | FR-011, data-model §1 | example | T008 | DONE | `tests/config_test.ts::U6` |
| U7 | `CHAT_MODEL` unset with `EMBEDDING_MODEL` set: `missing` is `["CHAT_MODEL"]` (no model fallback) | FR-011, SC-012 | example | T008 | DONE | `tests/config_test.ts::U7` |
| U8 | A required setting that is `""` or whitespace only is reported in `missing`; `"x"` is not | data-model §1 | example | T008 | DONE | `tests/config_test.ts::U8` |
| U9 | A blank `CHAT_API_BASE` or `CHAT_API_KEY` falls back exactly as if unset | data-model §1 | example | T008 | DONE | `tests/config_test.ts::U9` |
| U10 | `OPENROUTER_API_KEY` set with `EMBEDDING_API_BASE` unset: still `missing` `EMBEDDING_API_BASE`, and no resolved field holds an OpenRouter URL | FR-004, FR-011 | example | T008 | DONE | `tests/config_test.ts::U10` |
| U11 | A base ending in `/` is returned without it; a base without one is unchanged | data-model §1 | example | T008 | DONE | `tests/config_test.ts::U11` |
| U12 | `http://` and `https://` bases are both accepted | FR-020 | example | T008 | DONE | `tests/config_test.ts::U12` |
| U13 | Base `ollama:11434/v1` (no scheme): `invalid` names `EMBEDDING_API_BASE` with a reason requiring `http://` or `https://`, and `missing` is empty | FR-011, FR-020, Q 2026-11-26 #6 | example | T008 | DONE | `tests/config_test.ts::U13` |
| U14 | Base `ftp://host/v1` is invalid, naming its setting | FR-020, Q 2026-11-26 #6 | example | T008 | DONE | `tests/config_test.ts::U14` |
| U15 | An invalid `CHAT_API_BASE` is reported under `CHAT_API_BASE`; an invalid embedding base inherited by chat is reported once, under `EMBEDDING_API_BASE` | FR-011 | example | T008 | DONE | `tests/config_test.ts::U15` |
| U16 | `FETCH_TIMEOUT_MS` unset gives `timeoutMs` 60000 | FR-009, R11 | example | T008 | DONE | `tests/config_test.ts::U16` |
| U17 | `FETCH_TIMEOUT_MS` `"90000"` gives 90000 and `"1"` gives 1 (smallest accepted) | FR-009, SC-011, R11 | example | T008 | DONE | `tests/config_test.ts::U17` |
| U18 | `FETCH_TIMEOUT_MS` `"0"`, `"-5"`, `"60s"`, `"1.5"`, `"abc"` are each `invalid` naming `FETCH_TIMEOUT_MS`, never defaulted | FR-011, Q 2026-11-26 #4, R11 | example, sampled at boundaries | T008 | DONE | `tests/config_test.ts::U18` |
| U19 | Missing and invalid settings are reported together in one result | FR-011 | example | T008 | DONE | `tests/config_test.ts::U19` |
| U20 | Two calls with different environments each return their own values (nothing cached) | data-model §1, R7 | example | T008 | DONE | `tests/config_test.ts::U20` |
| U21 | No `missing`, `invalid` or reason text contains the `EMBEDDING_API_KEY` or `CHAT_API_KEY` value | FR-010 | example, sampled at boundaries | T008 | DONE | `tests/config_test.ts::U21` |
| U22 | `keyOverHttpWarnings`: a keyed `http://` embedding role gives exactly one `key_over_http` warning naming `embedding` with the contract's message | FR-020, SC-014, contracts/setup-check.md | example | T009 | DONE | `tests/config_test.ts::U22` |
| U23 | `keyOverHttpWarnings`: an unkeyed `http://` role and a keyed `https://` role give no warning | FR-020, SC-014, OS-005 | example | T009 | DONE | `tests/config_test.ts::U23` |
| U24 | `keyOverHttpWarnings`: a chat role inheriting a keyed `http://` embedding base gives two warnings, one per role | FR-020, contracts/setup-check.md | example | T009 | DONE | `tests/config_test.ts::U24` |

### `lib/metadata.ts` (stream C)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U25 | `EXTRACTION_PROMPT` equals core's `extractMetadata` system prompt verbatim | VP-002, contracts/model-server-requests.md | contract | T010 | DONE | `tests/metadata_test.ts::U25` |
| U26 | `parseUsableMetadata` returns the object for a raw JSON object reply (including `{}`) | data-model §3, R5 | example | T010 | DONE | `tests/metadata_test.ts::U26` |
| U27 | `parseUsableMetadata` returns the object when the whole reply is one fenced block (```` ```json ```` or bare ```` ``` ````) | data-model §3, R5 | example | T010 | DONE | `tests/metadata_test.ts::U27` |
| U28 | `parseUsableMetadata` returns unusable for a JSON array, number, string or `null` | data-model §3, R5 | example | T010 | DONE | `tests/metadata_test.ts::U28` |
| U29 | `parseUsableMetadata` returns unusable for unparseable text, an empty reply, a fenced non-JSON block, prose around a fence, or two fenced blocks | data-model §3, R5, FR-006 | example | T010 | DONE | `tests/metadata_test.ts::U29` |
| U30 | `buildCaptureMetadata(null, m)` gives `topics: ["uncategorized"]`, `type: "observation"`, `source: "mcp"`, `embedding_model: m`, `enrichment_status: "fallback"` | FR-006, FR-015, FR-024 | example | T010 | DONE | `tests/metadata_test.ts::U30` |
| U31 | `buildCaptureMetadata(extracted, m)` keeps the extracted fields and adds `source`, `embedding_model: m`, `enrichment_status: "complete"`, with no default topics or type | FR-015, FR-024 | example | T010 | DONE | `tests/metadata_test.ts::U31` |
| U32 | Extracted metadata carrying `source`, `embedding_model` or `enrichment_status` is overridden by the real values | FR-024, data-model §3 | example, sampled at boundaries | T010 | DONE | `tests/metadata_test.ts::U32` |

### `lib/model_client.ts` (stream M)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U33 | `embed(text)` sends one `POST <embedding base>/embeddings` with `{ model, input, dimensions: 1536 }` and `Content-Type: application/json` | FR-002, contracts/model-server-requests.md, R3 | contract | T011 | DONE | `tests/model_client_test.ts::U33` |
| U34 | `embed` returns `ok` with the vector for a 2xx reply holding a 1536-number `data[0].embedding` | contracts/model-server-requests.md | example | T011 | DONE | `tests/model_client_test.ts::U34` |
| U35 | `chat(text)` sends one `POST <chat base>/chat/completions` with `CHAT_MODEL`, `response_format: { type: "json_object" }` and messages `[system: EXTRACTION_PROMPT, user: text]` | FR-002, contracts/model-server-requests.md | contract | T011 | DONE | `tests/model_client_test.ts::U35` |
| U36 | `chat` returns `ok` with `choices[0].message.content` for a 2xx reply | contracts/model-server-requests.md | example | T011 | DONE | `tests/model_client_test.ts::U36` |
| U37 | `listModels(role)` sends one `GET <role base>/models` | FR-002, contracts/model-server-requests.md | contract | T011 | DONE | `tests/model_client_test.ts::U37` |
| U38 | A role with a key sends `Authorization: Bearer <key>` on embed, chat and listModels | data-model §1 key | example | T011 | DONE | `tests/model_client_test.ts::U38` |
| U39 | A role with no key sends no `Authorization` header at all | data-model §1 key | example | T011 | DONE | `tests/model_client_test.ts::U39` |
| U40 | Each role sends its own key when the two keys differ | FR-003 | example | T011 | DONE | `tests/model_client_test.ts::U40` |
| U41 | Every request across embed, chat, listModels and the retry goes to one of the two configured bases | FR-004, SC-002 | example, sampled across operations | T011 | DONE | `tests/model_client_test.ts::U41` |
| U42 | A rejected fetch gives `unreachable`, the message naming the role and base and "could not be reached" | data-model §2, US2.1 | example | T012 | DONE | `tests/model_client_test.ts::U42` |
| U43 | A reply arriving inside `timeoutMs` is `ok` | FR-009 | example | T012 | DONE | `tests/model_client_test.ts::U43` |
| U44 | A fetch that hangs past `timeoutMs` gives `timeout` for either role, the message naming the role, base, the ms value and `FETCH_TIMEOUT_MS` | FR-009, SC-011, data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U44` |
| U45 | HTTP 401 and 403 each give `auth_rejected`, naming the role, base and "access key rejected" | data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U45` |
| U46 | HTTP 404 gives `model_not_found`, naming the role and model | data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U46` |
| U47 | A 400 or 422 whose body names the configured model with "not found", "unknown" or "does not exist" gives `model_not_found` | data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U47` |
| U48 | HTTP 500 gives `http_error`, naming the role, the status and the server text | data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U48` |
| U49 | A 400 whose body mentions neither dimensions nor the model gives `http_error` after exactly one request | data-model §2, R3 | example | T012 | DONE | `tests/model_client_test.ts::U49` |
| U50 | A 2xx embeddings reply lacking `data[0].embedding`, with a non-array, non-numeric items or a non-JSON body gives `bad_response` | data-model §2 | example, sampled | T012 | DONE | `tests/model_client_test.ts::U50` |
| U51 | A 2xx chat reply lacking `choices[0].message.content` or with a non-JSON body gives `bad_response` | data-model §2 | example | T012 | DONE | `tests/model_client_test.ts::U51` |
| U52 | A 1536-length vector is `ok`; 1535 and 1537 each give `wrong_dimension` | FR-007 | example, boundary both sides | T012 | DONE | `tests/model_client_test.ts::U52` |
| U53 | `wrong_dimension`'s message is exactly the contracts/mcp-tools.md text naming the model, the length and 1536, and no vector is returned | FR-007, SC-009 | example | T012 | DONE | `tests/model_client_test.ts::U53` |
| U54 | A 400 `dimensions 1536 exceeds embedding length 768` (Ollama) is retried once to the same URL without the `dimensions` key | R3 | example | T013 | DONE | `tests/model_client_test.ts::U54` |
| U55 | The retry is otherwise identical (model, input, headers) and its 1536-length reply is `ok` | R3 | example | T013 | DONE | `tests/model_client_test.ts::U55` |
| U56 | A 422 mentioning `dimension`, a 400 `does not support Matryoshka embeddings` (vLLM) and an upper-case `DIMENSIONS` body are each retried once | R3 | example, sampled | T013 | DONE | `tests/model_client_test.ts::U56` |
| U57 | A 404, and a 500 whose body mentions `dimension`, are not retried | R3 | example, boundary on status | T013 | DONE | `tests/model_client_test.ts::U57` |
| U58 | A retry that again fails with a `dimension` 400 sends no third request and gives `http_error` | R3 | example | T013 | DONE | `tests/model_client_test.ts::U58` |
| U59 | A retry returning a 768-length vector gives `wrong_dimension` | R3, FR-007 | example | T013 | DONE | `tests/model_client_test.ts::U59` |
| U60 | The retry gets its own `timeoutMs`; a hanging retry gives `timeout` | R3, FR-009, contracts/model-server-requests.md | example | T013 | DONE | `tests/model_client_test.ts::U60` |
| U61 | A 2xx first reply means exactly one request is sent | R3 | example | T013 | DONE | `tests/model_client_test.ts::U61` |
| U62 | A key value of either role inside a server error body appears as `[redacted]` in the message | FR-010 | example | T014 | DONE | `tests/model_client_test.ts::U62` |
| U63 | A key value inside a thrown fetch error appears as `[redacted]` in the `unreachable` message | FR-010 | example | T014 | DONE | `tests/model_client_test.ts::U63` |
| U64 | A 200-char server message is kept whole and a 201-char one is cut to 200, redaction applied first so a key straddling the cut never leaks | FR-010, data-model §2 | example, boundary both sides | T014 | DONE | `tests/model_client_test.ts::U64` |
| U65 | `listModels` returns the `data[].id` list for a 2xx listing | contracts/model-server-requests.md | example | T015 | DONE | `tests/model_client_test.ts::U65` |
| U66 | `listModels` returns `ok` with `null` for a 2xx non-JSON body or one without `data[]` | contracts/model-server-requests.md | example | T015 | DONE | `tests/model_client_test.ts::U66` |
| U67 | `listModels` maps 401 to `auth_rejected` and a rejected fetch to `unreachable` | contracts/model-server-requests.md, data-model §2 | example | T015 | DONE | `tests/model_client_test.ts::U67` |

### `lib/thought_store.ts` (stream S)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U68 | `fetchThought(id)` requests core's columns for `id=eq.<id>` as a single object | core parity (fetch) | contract | T016 | DONE | `tests/thought_store_test.ts::U68` |
| U69 | `fetchThought` returns the row for a 200 | core parity (fetch) | example | T016 | DONE | `tests/thought_store_test.ts::U69` |
| U70 | `fetchThought` returns `{ error }` with PostgREST's message for a missing row or a database error | core parity (fetch) | example | T016 | DONE | `tests/thought_store_test.ts::U70` |
| U71 | `matchThoughts` calls RPC `match_thoughts` with `query_embedding`, the given `match_threshold` and `match_count`, and `filter: {}` | core parity (search, search_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U71` |
| U72 | `matchThoughts` returns the rows, and `[]` for none | core parity | example | T016 | DONE | `tests/thought_store_test.ts::U72` |
| U73 | `matchThoughts` returns `{ error }` for an RPC error | core parity | example | T016 | DONE | `tests/thought_store_test.ts::U73` |
| U74 | `listThoughts` with no filters requests core's columns ordered `created_at.desc` with the limit and no other filter | core parity (list_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U74` |
| U75 | `listThoughts` adds a metadata contains `{type}` filter only when `type` is given | core parity (list_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U75` |
| U76 | `listThoughts` adds a metadata contains `{topics: [topic]}` filter only when `topic` is given | core parity (list_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U76` |
| U77 | `listThoughts` adds a metadata contains `{people: [person]}` filter only when `person` is given | core parity (list_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U77` |
| U78 | `listThoughts` adds `created_at=gte.<now − days>` (within a tolerance window) only when `days` is given | core parity (list_thoughts) | contract | T016 | DONE | `tests/thought_store_test.ts::U78` |
| U79 | `listThoughts` returns the rows, or `{ error }` for a database error | core parity | example | T016 | DONE | `tests/thought_store_test.ts::U79` |
| U80 | `stats` sends core's two `thought_stats` queries (exact count head; metadata and created_at rows) | core parity (thought_stats) | contract | T016 | DONE | `tests/thought_store_test.ts::U80` |
| U81 | `stats` returns the count and the rows | core parity | example | T016 | DONE | `tests/thought_store_test.ts::U81` |
| U82 | `stats` returns `{ error }` when either query fails | core parity | example | T016 | DONE | `tests/thought_store_test.ts::U82` |
| U83 | `upsertThought` calls RPC `upsert_thought` with `p_content` and `p_payload: { metadata }` | core parity (capture), R6 | contract | T017 | DONE | `tests/thought_store_test.ts::U83` |
| U84 | `upsertThought` returns `{ id }` from the reply, or `{ error }` for an RPC error | core parity, R6 | example | T017 | DONE | `tests/thought_store_test.ts::U84` |
| U85 | `setEmbedding` updates `embedding` on `id=eq.<id>` | core parity (capture), R6 | contract | T017 | DONE | `tests/thought_store_test.ts::U85` |
| U86 | `setEmbedding` returns `{ error }` for a database error | R6, FR-005 | example | T017 | DONE | `tests/thought_store_test.ts::U86` |
| U87 | `readBack` requests `created_at`, `updated_at` and whether `embedding` is null for one id | R6 | contract | T017 | DONE | `tests/thought_store_test.ts::U87` |
| U88 | `readBack` reports `embeddingIsNull` true for a null embedding and false for a set one | R6, data-model §3 | example, both sides | T017 | DONE | `tests/thought_store_test.ts::U88` |
| U89 | `readBack` returns both timestamps as the exact strings received, equal or differing | R6 | example, both sides | T017 | DONE | `tests/thought_store_test.ts::U89` |
| U90 | `readBack` returns `{ error }` for a missing row or a database error | R6 | example | T017 | DONE | `tests/thought_store_test.ts::U90` |
| U91 | `deleteIfInsertedByCall(id, T)` deletes filtered by `id`, `embedding is null`, `created_at=eq.T` and `updated_at=eq.T`, with `T` passed verbatim | R6 | contract | T017 | DONE | `tests/thought_store_test.ts::U91` |
| U92 | `deleteIfInsertedByCall` reports `deleted: true` when a row was deleted | R6 | example | T017 | DONE | `tests/thought_store_test.ts::U92` |
| U93 | `deleteIfInsertedByCall` reports `deleted: false` with no error when no row matched | R6, contracts/mcp-tools.md | example | T017 | DONE | `tests/thought_store_test.ts::U93` |
| U94 | `deleteIfInsertedByCall` returns `{ error }` for a database error | R6 | example | T017 | DONE | `tests/thought_store_test.ts::U94` |
| U95 | `countAll` requests an exact head count of `thoughts` and returns the total | R9, data-model §5 | contract | T018 | DONE | `tests/thought_store_test.ts::U95` |
| U96 | `countWithModel(m)` adds `metadata->>embedding_model=eq.m` to the same count | R9, data-model §5 | contract | T018 | DONE | `tests/thought_store_test.ts::U96` |
| U97 | Model names `qwen3-embedding:4b`, `openai/text-embedding-3-small`, `v1.5` and `a,b` reach the request intact | R9 | example, sampled | T018 | DONE | `tests/thought_store_test.ts::U97` |
| U98 | Both counts return `{ error }` for a database error | R9 | example | T018 | DONE | `tests/thought_store_test.ts::U98` |
| U99 | Both counts return 0 for an empty table | R9, SC-010 | example | T018 | DONE | `tests/thought_store_test.ts::U99` |

### `lib/tools.ts` (stream T)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U100 | `tools/list` returns exactly the six tools named as core | VP-001, core parity | contract | T019 | DONE | `tests/tools_test.ts::U100` |
| U101 | Each tool's title, description, input schema (with defaults) and annotations equal core's | VP-001, contracts/mcp-tools.md | contract | T019 | DONE | `tests/tools_test.ts::U101` |
| U102 | `fetch` of an existing id returns core's document text | core parity, US1.3 | example | T020 | DONE | `tests/tools_test.ts::U102` |
| U103 | `fetch` with a store error returns core's `isError` text | core parity | example | T020 | DONE | `tests/tools_test.ts::U103` |
| U104 | `list_thoughts` returns core's listing text for rows | core parity, US1.3 | example | T020 | DONE | `tests/tools_test.ts::U104` |
| U105 | `list_thoughts` with no rows returns core's empty text | core parity | example | T020 | DONE | `tests/tools_test.ts::U105` |
| U106 | `list_thoughts` with a store error returns core's `isError` text | core parity | example | T020 | DONE | `tests/tools_test.ts::U106` |
| U107 | `list_thoughts` forwards `limit`, `type`, `topic`, `person` and `days` to the store | core parity | example | T020 | DONE | `tests/tools_test.ts::U107` |
| U108 | `thought_stats` returns core's stats text | core parity, US1.3 | example | T020 | DONE | `tests/tools_test.ts::U108` |
| U109 | `search_thoughts` embeds the query and calls `matchThoughts` with that vector, threshold 0.5 and count 10 by default | contracts/mcp-tools.md, US1.2 | example | T020 | DONE | `tests/tools_test.ts::U109` |
| U110 | `search_thoughts` forwards an explicit `limit` and `threshold` | core parity | example | T020 | DONE | `tests/tools_test.ts::U110` |
| U111 | `search_thoughts` returns core's results text, and core's no-match text for none | core parity | example | T020 | DONE | `tests/tools_test.ts::U111` |
| U112 | `search` returns core's results JSON (`id`, `title`, `url`) using threshold 0.5 and count 10 | core parity | example | T020 | DONE | `tests/tools_test.ts::U112` |
| U113 | `search` with a store error returns core's `Search error:` text | core parity | example | T020 | DONE | `tests/tools_test.ts::U113` |
| U114 | A successful capture replies with core's `Captured as …` confirmation | contracts/mcp-tools.md, US1.1 | example | T021 | DONE | `tests/tools_test.ts::U114` |
| U115 | A successful capture stores the extracted metadata plus `source`, `embedding_model` and `enrichment_status: "complete"` | FR-015, FR-024 | example | T021 | DONE | `tests/tools_test.ts::U115` |
| U116 | A successful capture stores the model's vector as the row's embedding | US1.1, FR-005 | example | T021 | DONE | `tests/tools_test.ts::U116` |
| U117 | Both the embedding and chat requests are in flight before either reply is released | R5 | example | T021 | DONE | `tests/tools_test.ts::U117` |
| U118 | Every model request in a capture and a search goes to a configured base | FR-004 | example | T021 | DONE | `tests/tools_test.ts::U118` |
| U119 | Config gate: with `EMBEDDING_API_BASE` unset, capture returns the exact `Model endpoint not configured: missing EMBEDDING_API_BASE. …` text | FR-011, SC-008 | example | T026 | DONE | `tests/tools_test.ts::U119` |
| U120 | Config gate: with `CHAT_MODEL` unset, each of the six tools returns `isError` naming `CHAT_MODEL` | FR-011, SC-012 | example, sampled across the six | T026 | DONE | `tests/tools_test.ts::U120` |
| U121 | Config gate: no model request and no store call happen under a bad configuration | FR-011, FR-018, SC-008 | example | T026 | DONE | `tests/tools_test.ts::U121` |
| U122 | Config gate: `tools/list` still returns the six tools under a bad configuration | contracts/mcp-tools.md | contract | T026 | DONE | `tests/tools_test.ts::U122` |
| U123 | Config gate: an invalid setting (scheme-less base, bad `FETCH_TIMEOUT_MS`) is named with the missing ones | FR-011, Q 2026-11-26 #6 | example | T026 | DONE | `tests/tools_test.ts::U123` |
| U124 | Config gate: setting a missing variable between two calls lets the second call run | R7, data-model §1 | example | T026 | DONE | `tests/tools_test.ts::U124` |
| U125 | `search_thoughts` and `search` with a failing embedding return `isError` naming the cause, with no `matchThoughts` call and no results | FR-005 | example | T027 | DONE | `tests/tools_test.ts::U125` |
| U126 | Capture with the embedding unreachable or timing out returns `isError` naming the cause, with no `upsertThought` call | FR-005, FR-009, US2.1, SC-003 | example | T027 | DONE | `tests/tools_test.ts::U126` |
| U127 | Capture with an `auth_rejected`, `model_not_found`, `bad_response` or `http_error` embedding returns `isError` naming it, with no `upsertThought` call | FR-005, SC-003 | example, sampled | T027 | DONE | `tests/tools_test.ts::U127` |
| U128 | Capture with a 768-length embedding returns the exact `wrong_dimension` text and stores nothing | FR-007, US2.2 | example | T027 | DONE | `tests/tools_test.ts::U128` |
| U129 | Capture whose embedding fails while chat succeeds stores nothing | R5, data-model §3 | example | T027 | DONE | `tests/tools_test.ts::U129` |
| U130 | Capture with chat unreachable stores the row with its embedding, default metadata, `embedding_model`, `source` and `enrichment_status: "fallback"` | FR-006, FR-024, US2.3 | example | T028 | DONE | `tests/tools_test.ts::U130` |
| U131 | Capture with chat timing out stores the fallback row and ends the reply with `Metadata extraction skipped: <reason naming the timeout>. Saved with default metadata.` | FR-006, FR-009, Q 2026-11-26 #3 | example | T028 | DONE | `tests/tools_test.ts::U131` |
| U132 | Capture with a chat 5xx or missing `choices` stores the fallback row with the skip line naming the reason | FR-006, R5 | example | T028 | DONE | `tests/tools_test.ts::U132` |
| U133 | Capture with chat content that is not a JSON object stores the fallback row with the skip line | FR-006, R5 | example | T028 | DONE | `tests/tools_test.ts::U133` |
| U134 | Capture with chat content in one fenced JSON block stores `enrichment_status: "complete"` | R5 | example | T028 | DONE | `tests/tools_test.ts::U134` |
| U135 | A fallback reply keeps core's `Captured as observation — uncategorized` text before the skip line | contracts/mcp-tools.md | example | T028 | DONE | `tests/tools_test.ts::U135` |
| U136 | Capturing existing text with chat failing marks the one existing row `fallback` | SC-016, R12 | example | T028 | DONE | `tests/tools_test.ts::U136` |
| U137 | Recapturing that text with chat working marks the same row `complete` | SC-016, R12 | example | T028 | DONE | `tests/tools_test.ts::U137` |
| U138 | An `upsertThought` error returns core's `Failed to capture: <msg>` text with no `setEmbedding` call | core parity, data-model §3 | example | T029 | DONE | `tests/tools_test.ts::U138` |
| U139 | `setEmbedding` failing on a row this call inserted returns `… The thought was not kept; capture it again.` and the row is gone | R6, contracts/mcp-tools.md | example | T029 | DONE | `tests/tools_test.ts::U139` |
| U140 | `setEmbedding` failing on a merged duplicate returns the `already in your brain … repair` text, keeps the row and makes no delete call | R6, contracts/mcp-tools.md | example | T029 | DONE | `tests/tools_test.ts::U140` |
| U141 | `setEmbedding` failing with `readBack` failing returns the `may be saved without its embedding` text with no delete call | R6, contracts/mcp-tools.md | example | T029 | DONE | `tests/tools_test.ts::U141` |
| U142 | `setEmbedding` failing with the delete erroring returns the `may be saved` text | R6 | example | T029 | DONE | `tests/tools_test.ts::U142` |
| U143 | `setEmbedding` failing with the delete reporting `deleted: false` returns the `may be saved` text | R6, contracts/mcp-tools.md | example | T029 | DONE | `tests/tools_test.ts::U143` |
| U144 | The compensating delete uses the read-back id and timestamp | R6 | example | T029 | DONE | `tests/tools_test.ts::U144` |
| U206 | `setEmbedding` failing on a merged duplicate whose existing row has **no** embedding returns the `already in your brain … repair` text and makes no delete call | R6, contracts/mcp-tools.md | example | T050 | DONE | `tests/tools_test.ts::U206` |
| U145 | With known values in all four secrets echoed by the fake servers and store errors, no tool reply contains any of them | FR-010 | example, sampled across paths | T030 | DONE | `tests/tools_test.ts::U145` |

### `lib/setup_check.ts` (stream K)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U146 | A healthy configuration and server give `ok: true` | FR-008, SC-009 | example | T031 | DONE | `tests/setup_check_test.ts::U146` |
| U147 | The report lists the seven checks in the contract's order, role checks carrying `role` | contracts/setup-check.md, data-model §4 | example | T031 | DONE | `tests/setup_check_test.ts::U147` |
| U148 | `config` shows each role's base, model and `key_set`, chat `inherits`, and `timeout_ms` | contracts/setup-check.md, data-model §4 | example | T031 | DONE | `tests/setup_check_test.ts::U148` |
| U149 | No key value appears anywhere in the report | FR-010 | example | T031 | DONE | `tests/setup_check_test.ts::U149` |
| U150 | A missing setting fails `config` with a reason naming each missing setting | FR-018, FR-011 | example | T031 | DONE | `tests/setup_check_test.ts::U150` |
| U151 | An invalid setting fails `config` naming it with its reason | FR-011, FR-018, Q 2026-11-26 #6 | example | T031 | DONE | `tests/setup_check_test.ts::U151` |
| U152 | With `config` failed, every other check reads `skipped: configuration incomplete` | FR-018 | example | T031 | DONE | `tests/setup_check_test.ts::U152` |
| U153 | With `config` failed, no model request is sent | FR-018, SC-012 | example | T031 | DONE | `tests/setup_check_test.ts::U153` |
| U154 | With `config` failed, `ok` is false and `thoughts.other_model` is `null` with no store call | FR-008, Q 2026-11-26 #9 | example | T031 | DONE | `tests/setup_check_test.ts::U154` |
| U155 | Any single failed check makes `ok` false | FR-008, data-model §4 | example | T031 | DONE | `tests/setup_check_test.ts::U155` |
| U156 | `<role>_reachable` passes on a 200 and on a 404 from `/models` | contracts/setup-check.md | example, both sides | T032 | DONE | `tests/setup_check_test.ts::U156` |
| U157 | `<role>_reachable` fails with `auth_rejected` on a 401 or 403 | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U157` |
| U158 | `<role>_reachable` fails with `unreachable` naming the base on a network error | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U158` |
| U159 | `<role>_reachable` fails with `timeout` when `/models` hangs | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U159` |
| U160 | `<role>_model` passes when the model is listed | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U160` |
| U161 | `<role>_model` passes when the model is not listed but the real call succeeded | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U161` |
| U162 | `<role>_model` fails with `model_not_found` naming the model when unlisted and the real call reports it unknown | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U162` |
| U163 | With a non-JSON `/models` body, `<role>_model` follows the real call's outcome | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U163` |
| U164 | `embedding_dimension` passes for a 1536-number vector | contracts/setup-check.md, SC-009 | example | T032 | DONE | `tests/setup_check_test.ts::U164` |
| U165 | `embedding_dimension` fails for 768 numbers with a reason naming 768 and 1536 | FR-007, SC-009 | example | T032 | DONE | `tests/setup_check_test.ts::U165` |
| U166 | `embedding_dimension` carries the embedding call's outcome when the call fails | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U166` |
| U167 | `chat_metadata` passes for a JSON-object reply | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U167` |
| U168 | `chat_metadata` fails with `unusable output` and the first 120 characters (no more) of an unusable reply | contracts/setup-check.md | example, boundary 120 | T032 | DONE | `tests/setup_check_test.ts::U168` |
| U169 | `chat_metadata` carries the chat call's outcome when the call fails | contracts/setup-check.md | example | T032 | DONE | `tests/setup_check_test.ts::U169` |
| U170 | When chat inherits the embedding base, both roles' checks are reported separately and the chat requests go to the embedding base | contracts/setup-check.md, SC-012 | example | T032 | DONE | `tests/setup_check_test.ts::U170` |
| U171 | One run sends one embedding call, one chat call and one `/models` request per role | contracts/setup-check.md, R8 | example | T032 | DONE | `tests/setup_check_test.ts::U171` |
| U172 | A `key_over_http` warning is reported and leaves `ok` true | FR-020, SC-014 | example | T033 | DONE | `tests/setup_check_test.ts::U172` |
| U173 | An unkeyed `http://` base and a keyed `https://` base produce no warning | FR-020, SC-014, OS-005 | example | T033 | DONE | `tests/setup_check_test.ts::U173` |
| U174 | Every model request starts before any reply is released | R8, contracts/setup-check.md | example | T033 | DONE | `tests/setup_check_test.ts::U174` |
| U175 | With every model route hanging, the run finishes in about one `timeoutMs`, not several | R8 | example | T033 | DONE | `tests/setup_check_test.ts::U175` |
| U176 | 5 thoughts, 2 matching `EMBEDDING_MODEL`, give `thoughts.other_model: 3` | SC-010, FR-016, data-model §5 | example | T037 | DONE | `tests/setup_check_test.ts::U176` |
| U177 | All thoughts matching, and an empty brain, each give `other_model: 0` | FR-016 | example | T037 | DONE | `tests/setup_check_test.ts::U177` |
| U178 | A failing count gives `other_model: null` with a `thoughts_count` warning carrying the database message | contracts/setup-check.md | example | T037 | DONE | `tests/setup_check_test.ts::U178` |
| U179 | With a failing count, the model checks still run and decide `ok` | contracts/setup-check.md | example | T037 | DONE | `tests/setup_check_test.ts::U179` |

### `lib/app.ts` and `index.ts` (stream A)

| id | behavior | traces | kind | task | state | test |
| --- | -------- | ------ | ---- | ---- | ----- | ---- |
| U180 | `OPTIONS` on any path, with no key, answers 200 `ok` with core's CORS headers | contracts/mcp-tools.md, core parity | contract | T022 | DONE | `tests/app_test.ts::U180` |
| U181 | A `POST` with no key answers HTTP 200 with the JSON-RPC `-32001` `Unauthorized: missing or invalid authentication.` envelope | FR-023, core parity | contract | T022 | DONE | `tests/app_test.ts::U181` |
| U182 | The envelope echoes a string or number request `id`, and gives `null` for a null, missing, non-scalar or unparseable id | core parity | contract | T022 | DONE | `tests/app_test.ts::U182` |
| U183 | A `GET` with a wrong key gets the envelope with `id: null` | core parity | contract | T022 | DONE | `tests/app_test.ts::U183` |
| U184 | The unauthorized response's status, body, `Content-Type` and CORS headers equal core's golden response at `238df6c` | contracts/mcp-tools.md, VP-010 | contract | T022 | DONE | `tests/app_test.ts::U184` |
| U185 | A wrong `x-brain-key` and a wrong `?key=` are each refused | FR-023, SC-015 | example | T022 | DONE | `tests/app_test.ts::U185` |
| U186 | A correct `x-brain-key`, and a correct `?key=` alone, each reach the MCP route | FR-023, SC-015 | example | T022 | DONE | `tests/app_test.ts::U186` |
| U187 | A non-empty header wins over the query: wrong header + right query is refused, right header + wrong query is accepted, an empty header falls through to the query | contracts/mcp-tools.md, core parity | contract | T022 | DONE | `tests/app_test.ts::U187` |
| U188 | With `MCP_ACCESS_KEY` unset or empty, every request is refused, whatever key it presents | contracts/mcp-tools.md | example | T022 | DONE | `tests/app_test.ts::U188` |
| U189 | Supabase `Authorization: Bearer` or `apikey` headers without the access key are refused | FR-023, VP-010 | example | T022 | DONE | `tests/app_test.ts::U189` |
| U190 | An authorized `tools/list` succeeds with no `Accept` header, with `application/json` only, and with both types | core parity (issue #33) | contract | T022 | DONE | `tests/app_test.ts::U190` |
| U191 | An authorized response has no `mcp-session-id` header and carries the CORS headers | core parity | contract | T022 | DONE | `tests/app_test.ts::U191` |
| U192 | The MCP route serves the tools built from the injected `deps` | plan.md seams | example | T022 | DONE | `tests/app_test.ts::U192` |
| U193 | `productionDeps()` reads `Deno.env`, uses `globalThis.fetch` and builds the store from `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | R4, R10 | example | T023 | DONE | `tests/app_test.ts::U193` |
| U194 | `index.ts` holds one statement serving `createApp(productionDeps()).fetch` | R4 | example | T023 | DONE | `tests/app_test.ts::U194` |
| U195 | No source file outside `tests/` uses a bare import specifier, and a planted bare import is flagged | R10, FR-014 | example | T023 | DONE | `tests/imports_test.ts::U195` |
| U196 | `GET …/setup-check` with the key answers 200 for an ok report and 503 otherwise, with the same JSON body, `Content-Type: application/json` and CORS headers | FR-008, Q 2026-11-26 #7 | example, both sides | T034 | DONE | `tests/app_test.ts::U196` |
| U197 | `GET …/setup-check` with no or a wrong key (header or query) answers 401 with the exact error body and CORS headers | contracts/setup-check.md, SC-009 | example | T034 | DONE | `tests/app_test.ts::U197` |
| U198 | `GET …/setup-check` accepts a correct `?key=` and applies the same header precedence as the MCP route | contracts/setup-check.md | example | T034 | DONE | `tests/app_test.ts::U198` |
| U199 | With `MCP_ACCESS_KEY` unset, `GET …/setup-check` answers 401 | contracts/mcp-tools.md | example | T034 | DONE | `tests/app_test.ts::U199` |
| U200 | An unauthorized setup-check request runs no check and sends no model request | SC-009, FR-010 | example | T034 | DONE | `tests/app_test.ts::U200` |
| U201 | `/fn/setup-check`, `/setup-check`, `/other/setup-check`, `/fn/setup-check/` and `/fn/setup-check?x=1` all reach the setup check | R8, FR-014, Q 2026-11-26 #8 | example, sampled | T034 | DONE | `tests/app_test.ts::U201` |
| U202 | `/fn/setup-check/extra`, `/fn/setup-checker`, `/fn/xsetup-check` and `/setup-check/fn` reach the MCP route | contracts/setup-check.md | example, sampled | T034 | DONE | `tests/app_test.ts::U202` |
| U203 | `POST …/setup-check` goes to the MCP route (no key gives the 200 envelope, not 401) | contracts/setup-check.md | example | T034 | DONE | `tests/app_test.ts::U203` |
| U204 | A wrong key on any non-setup-check path gets the 200 envelope, never 401 | contracts/mcp-tools.md | example | T034 | DONE | `tests/app_test.ts::U204` |
| U205 | A crashing setup check answers 500 with `{"error":"Setup check failed unexpectedly."}` and CORS headers, with no stack trace or key | Q 2026-11-26 #10, FR-010 | example | T034 | DONE | `tests/app_test.ts::U205` |

## Invariants and edge cases still to place

None. Every drafted invariant is placed above:

- no secret in any output: config, model client, tools and setup check rows
- requests only to the configured bases: model client and tools rows
- the zero-request config gate: tools and setup check rows

Some drafted rows were deliberately not kept:

- A fresh default-metadata object per call: this is an implementation detail with no spec trace.
- A fixed sample sentence for the setup check: this is mechanics.
- A model-name comparison in the setup check: this is owned by the store's model-name row.
- Golden-file comparison of `index.ts` line count: replaced by the one-statement row in `lib/app.ts`.

## Assumptions (literal readings chosen while merging; owner may override with a refresh)

1. **Reason wording**: tests assert that a message names the facts its data-model §2 row lists (role, base, model, ms, `FETCH_TIMEOUT_MS`), not exact sentences. Exact text is asserted only where a contract fixes it:
   - `wrong_dimension`
   - the config gate
   - the R6 messages
   - the skip-line frame
   - the 401 and 500 bodies
2. **`model_not_found` from a 4xx body** (data-model §2 "a 4xx body that names the model as unknown"): HTTP 400 or 422 whose body contains the configured model name and "not found", "unknown" or "does not exist", case-insensitive. A body matching the `dimensions` retry rule is retried first. The retry's outcome is final.
3. **Redact, then trim**: key values are replaced before the 200-char cut.
4. **Retry timeout**: each request gets its own `timeoutMs`, so a retried embedding can take up to about 2× `timeoutMs`. The setup-check "about one `timeoutMs`" row is measured without a retry.
5. **Usable metadata**: the whole reply is one JSON object, raw or as exactly one fenced block. `{}` is usable. Prose around a fence is not.
6. **Tool error prefixes**: read tools and upsert failures keep core's prefixes (`Fetch error:`, `Search error:`, `Failed to capture:`, `Error:`). Embedding-failure replies name the cause inside core's `Error:` wrapper and are asserted by content.
7. **Store return shapes** are pinned by the integrator in `lib/types.ts` (T004):
   - `stats` returns `{ count, rows }`
   - `matchThoughts` returns the RPC rows as-is
   - `readBack` returns camelCase timestamps as the exact strings received
8. **`listThoughts` `days`**: asserted within a tolerance window around now. No clock is injected.
9. **`timeout_ms`**: the report uses the contract's snake_case key; data-model §4's `timeoutMs` is the in-memory name.
10. **`upsert_thought` replying without an id**: not specified. Stream S raises it to the integrator rather than inventing a rule.

## Out of scope

- **SC-001** (30-minute setup), **SC-007** (both hosts, no code change), **SC-013** (Cloud plus private network): owner-run manual verification (quickstart §3–§4, T046).
- **SC-005** (core users unaffected): the scope check (T048) proves `server/**` is untouched. There is no test.
- **SC-006** (gate passes first run): gate self-check T043 and the upstream PR run.
- **FR-012, FR-017, FR-019, FR-021, FR-022, the FR-023 README wording**: README content. Docs gates and the manual §6 cover it, not unit tests.
- **R6's `created_at = updated_at` premise in real Postgres**: T045 checks it manually with SQL. The fake store only models it.
- **Search ranking quality**: no target (spec Q8 of Session 2026-11-25).

## Verification commands

From `.specify/memory/tdd-profile.md` (integrator, acting on the plan's Worktree):

- Single test: `node .fork/ci/bin/tdd.mjs single {file} "{name}"`
- File: `node .fork/ci/bin/tdd.mjs file {file}`
- Full suite: `node .fork/ci/bin/tdd.mjs suite`

Stream agents, inside their own worktree (fork-ci's Deno flags, no network):

- Single test: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^<id> /" integrations/self-hosted-llm-mcp/tests/`
- Full suite: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read integrations/self-hosted-llm-mcp/tests/`
- Acceptance reds (integrator): add `RUN_TODO=1` to the environment
