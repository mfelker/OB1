# Remediation log: tools

## Cycle: U206 (verification finding 2, task T050) - NEW behavior

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U206 …` (new, next to U140)
- red: passed on first run (the guard already exists in `lib/tools.ts`); evidence is the mutant below
- asserts: existing row seeded with `embedding: null", setEmbedding fails -> exact already-in-your-brain text, "store.rows.length === 1", no "deleteIfInsertedByCall` call
- mutant: `lib/tools.ts:~232" removed "back.data.createdAt === back.data.updatedAt && " -> "U206 … => tools_test.ts:644 AssertionError: Values are not equal" (caught); restored, "git status` clean
- suite: 239 passed, 0 failed
- commit: `da0576b`

## Remediation: U101 (verification finding 5, task T052)

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U101 …` (strengthened)
- before: looped over the returned tools, so fewer tools asserted nothing
- after: iterates `Object.keys(CORE_TOOLS)", finds each by name (asserts found), same field comparisons, and asserts "tools.length === Object.keys(CORE_TOOLS).length`
- mutant: `lib/tools.ts:163` `thought_stats" registration skipped -> "AssertionError: Values are not equal" on the tool count (caught); restored, "git status` clean
- suite: 239 passed, 0 failed
- commit: `038be16`

## Remediation: U117 (verification finding 10, task T058)

- test: `integrations/self-hosted-llm-mcp/tests/tools_test.ts::U117 …` (strengthened)
- before: unbounded `while (!settled)` loop with real 10 ms / 5 ms timers
- after: bounded wait (<= 200 x 10 ms) on `fake.heldCount", asserts "heldCount === 2" before a single "release()`, then awaits the call under a 5 s race timeout (timer cleared)
- proof: 5 consecutive runs all `1 passed`
- mutant: `lib/tools.ts:~220` `Promise.all" replaced by sequential awaits -> "AssertionError: Values are not equal" (heldCount 1, not 2), failed in about 2 s, no hang (caught); restored, "git status` clean
- suite: 239 passed, 0 failed
- commit: `51d0961`
