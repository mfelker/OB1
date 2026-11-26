# Quality log: setup check and store

## Quality: U155 (Finding 11, task T059)

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U155`
- before: tried only embedding_dimension and chat_metadata failing.
- after: a table of constant cases fails each of the seven checks in turn and asserts the exact set of failed checks and ok === false. A model check cannot fail alone (it implies the failed real call, which also fails dimension or metadata) and config skips all others, so those expected sets are [model, dimension], [model, metadata] and all seven.
- proof: mutant computing ok from only embedding_dimension and chat_metadata made U155 fail; restored.
- suite: 241 passed, 0 failed
- commit: `3bb65ec`

## Quality: U175 (Finding 13 part, task T059)

- test: `integrations/self-hosted-llm-mcp/tests/setup_check_test.ts::U175`
- before: literal 250/850 ms bounds against a 300 ms timeout, an unexplained 6.
- after: named TIMEOUT, MIN_ELAPSED = 0.8x, MAX_ELAPSED = 2.5x, EVERY_CHECK_BUT_CONFIG = 6.
- proof: 5/5 consecutive runs passed; mutant making the four model requests sequential gave 1212 ms and U175 failed; restored.
- suite: 241 passed, 0 failed
- commit: `3bb65ec`

## Quality: U78 (Finding 13 part, task T059)

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U78`
- before: one days value (7) with plus or minus 2 h slack, so a one-hour error passed.
- after: days 1, 7 and 90; cutoff must lie in [before - days*DAY, after - days*DAY], shifted only by the local UTC-offset change over the span (zero except across a DST change, since the core subtracts calendar days).
- proof: mutant subtracting an extra hour in the cutoff made U78 fail; restored.
- suite: 241 passed, 0 failed
- commit: `a4c1ca4`

## Quality: U82, U98 (Finding 15 part, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts::U82, U98`
- before: only "error" in r.
- after: exact { error: "" } and no data key. Deliberate pin: supabase-js gives an empty message for a body-less HEAD 500 (observed once for stats, countAll, countWithModel). The GET failure in U82 already asserted the exact message. Observation: the real user-facing message for a failed count is empty.
- proof: mutants returning { error: "x" } from stats and from countAll made U82 and U98 fail; restored.
- suite: 241 passed, 0 failed
- commit: `a4c1ca4`

## Quality: U68, U75-U77, U80, U87, U95, U96 (Finding 16, task T060)

- test: `integrations/self-hosted-llm-mcp/tests/thought_store_test.ts`
- before: pinned supabase-js serialization.
- after: kept table, columns, filter fields and values, order, limit, RPC names and params, method. Deliberately dropped or loosened, because the feature does not own supabase-js encoding:
  - U68, U87: dropped the Accept pgrst.object+json header regex (how .single() is encoded).
  - U75, U76, U77: contains filter parsed to its JSON payload, no longer the literal cs.{...} operator text.
  - U80, U95, U96: dropped select=* and Prefer count=exact assertions (how a head count is spelled); filter params asserted via a helper ignoring select.
- proof: deliberate loosening: wire detail not owned by the feature. Mutant changing people to persons in the list filter made U77 fail; restored.
- suite: 241 passed, 0 failed
- commit: `a4c1ca4`
