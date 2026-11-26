# Stream C cycle log

## Cycle: U1 all six settings resolve as given

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U1 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U1 /" tests/` -> Error: not implemented (resolveConfig stub) (1 failed)
- green: lib/config.ts:3 resolveConfig reads six settings via getEnv into both endpoints (no validation yet). Suite -> 10 passed, 0 failed, 24 ignored
- refactor: none
- commit: `On branch contrib/mfelker/self-hosted-llm-config
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   integrations/self-hosted-llm-mcp/lib/config.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	integrations/self-hosted-llm-mcp/tests/config_test.ts

no changes added to commit (use "git add" and/or "git commit -a")`
- notes: none

## Cycle: U1 all six settings resolve as given

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U1 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U1 /" tests/` -> Error: not implemented (resolveConfig stub) (1 failed)
- green: lib/config.ts:3 resolveConfig reads six settings via getEnv into both endpoints (no validation yet). Suite -> 10 passed, 0 failed, 24 ignored
- refactor: none
- commit: `944d7c3`
- notes: none

## Cycle: U2 chat base falls back to embedding base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U2 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U2 /" tests/` -> AssertionError: Values are not equal (chat base undefined vs embedding base) (1 failed)
- green: lib/config.ts chatBase ?? embedding.base, chatInherits gets 'base'. Suite -> 11 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `b60b2e3`
- notes: none

## Cycle: U3 chat inherits key only with the base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U3 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U3 /" tests/` -> AssertionError: Values are not equal (chat.key undefined vs "ek") (1 failed)
- green: lib/config.ts chat key falls back to embedding key when chat base inherited; chatInherits gets 'key'. Suite -> 12 passed, 0 failed, 24 ignored
- refactor: none needed (cleanup deferred to U9)
- commit: `c76a40f`
- notes: none

## Cycle: U4 own chat base blocks key inheritance

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U4 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U4 /" tests/` -> n/a: passed on first run (mutant: key always inherited -> 1 failed AssertionError) (1 failed)
- green: none: existing U3 rule already implements it. Suite -> 13 passed, 0 failed, 24 ignored
- refactor: none
- commit: `7525a90`
- notes: passed first run; mutant (chat key = embedding.key unconditionally) failed U4 with AssertionError, restored exactly (a first mutant attempt did not apply, redone)

## Cycle: U5 chat uses its own base and key

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U5 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U5 /" tests/` -> n/a: passed on first run (mutant: own CHAT_API_KEY ignored -> 1 failed AssertionError) (1 failed)
- green: none: existing resolution already honors own values. Suite -> 14 passed, 0 failed, 24 ignored
- refactor: none
- commit: `f12865f`
- notes: passed first run; mutant (chat key read from EMBEDDING_API_KEY) failed U5 with AssertionError, restored exactly (first mutant attempt failed type-check, redone)

## Cycle: U6 nothing set reports the three required settings

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U6 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U6 /" tests/` -> AssertionError (result ok:true, expected ok:false) (1 failed)
- green: lib/config.ts: missing required settings filtered in fixed order, returns ok:false. Suite -> 15 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `4ab18cd`
- notes: none

## Cycle: U7 no model fallback for chat

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U7 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U7 /" tests/` -> n/a: passed on first run (mutant: CHAT_MODEL falls back to EMBEDDING_MODEL -> 1 failed AssertionError) (1 failed)
- green: none: required-setting check already has no model fallback. Suite -> 16 passed, 0 failed, 24 ignored
- refactor: none
- commit: `86809f3`
- notes: passed first run; mutant making CHAT_MODEL fall back to EMBEDDING_MODEL failed U7, restored exactly

## Cycle: U8 blank required settings are missing

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U8 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U8 /" tests/` -> AssertionError (blank values accepted, result ok:true) (1 failed)
- green: lib/config.ts: getEnv wrapper treats empty/whitespace-only values as unset. Suite -> 17 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `9d8c050`
- notes: none

## Cycle: U9 blank chat base/key fall back like unset

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U9 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U9 /" tests/` -> n/a: passed on first run (mutant: whitespace not treated as blank -> 1 failed) (1 failed)
- green: none: U8's blank-as-unset wrapper already covers it. Suite -> 18 passed, 0 failed, 24 ignored
- refactor: none
- commit: `54bf42e`
- notes: passed first run; mutant (trim removed from blank test) failed U9, restored exactly

## Cycle: U10 OPENROUTER_API_KEY does not stand in for the base

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U10 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U10 /" tests/` -> n/a: passed on first run (mutant: OPENROUTER_API_KEY waives the base requirement -> 1 failed) (1 failed)
- green: none: resolveConfig never reads OPENROUTER_*. Suite -> 19 passed, 0 failed, 24 ignored
- refactor: none
- commit: `400fe3f`
- notes: passed first run; mutant failed U10 with AssertionError, restored exactly

## Cycle: U11 trailing slash removed from bases

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U11 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U11 /" tests/` -> AssertionError (base kept its trailing slash) (1 failed)
- green: lib/config.ts stripSlash applied to the embedding and chat bases. Suite -> 20 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `a571cae`
- notes: none

## Cycle: U12 http and https bases accepted

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U12 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U12 /" tests/` -> n/a: passed on first run (no validation exists yet; mutant rewriting http: to https: -> 1 failed AssertionError) (1 failed)
- green: none: no scheme validation exists yet, so both pass; U13/U14 add the rejection. Suite -> 21 passed, 0 failed, 24 ignored
- refactor: none
- commit: `65f4ddc`
- notes: passed first run; mutant rewriting http: to https: failed U12, restored exactly

## Cycle: U13 schemeless base is invalid

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U13 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U13 /" tests/` -> AssertionError (result ok:true, expected ok:false) (1 failed)
- green: lib/config.ts: scheme check on the embedding base pushes an invalid entry with a reason requiring http:// or https://. Suite -> 22 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `62122b0`
- notes: none

## Cycle: U14 ftp base is invalid

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U14 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U14 /" tests/` -> n/a: passed on first run (mutant: any scheme accepted -> 1 failed AssertionError) (1 failed)
- green: none: scheme check from U13 already rejects non-http(s) schemes. Suite -> 23 passed, 0 failed, 24 ignored
- refactor: none
- commit: `b143745`
- notes: passed first run; mutant accepting any scheme failed U14, restored exactly

## Cycle: U15 invalid chat base and inherited invalid base reporting

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U15 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U15 /" tests/` -> AssertionError (invalid chat base not reported: ok result) (1 failed)
- green: lib/config.ts: CHAT_API_BASE scheme check when set; an inherited base is only checked as EMBEDDING_API_BASE. Suite -> 24 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `3643eb6`
- notes: none

## Cycle: U16 timeout defaults to 60000

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U16 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U16 /" tests/` -> n/a: passed on first run (default hardcoded since U1; mutant 6000 -> 1 failed AssertionError) (1 failed)
- green: none: default already returned. Suite -> 25 passed, 0 failed, 24 ignored
- refactor: none
- commit: `601a3ae`
- notes: passed first run; mutant changing the default failed U16, restored exactly

## Cycle: U17 FETCH_TIMEOUT_MS parsed as an integer

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U17 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U17 /" tests/` -> AssertionError (timeoutMs 60000, expected 90000) (1 failed)
- green: lib/config.ts: timeoutMs = Number(FETCH_TIMEOUT_MS) when set. Suite -> 26 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `97505e8`
- notes: none

## Cycle: U18 invalid FETCH_TIMEOUT_MS values are reported

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U18 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U18 /" tests/` -> AssertionError: 0 should be invalid (1 failed)
- green: lib/config.ts: FETCH_TIMEOUT_MS must be digits only and >= 1, else an invalid entry. Suite -> 27 passed, 0 failed, 24 ignored
- refactor: cleaned operator grouping of the timeout condition while green
- commit: `58ea0c5`
- notes: none

## Cycle: U19 missing and invalid reported together

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U19 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U19 /" tests/` -> AssertionError: Values are not equal (missing was [] because invalid returned early) (1 failed)
- green: lib/config.ts: resolveConfig restructured to collect missing and invalid independently before returning. Suite -> 28 passed, 0 failed, 24 ignored
- refactor: rewrote resolveConfig into read / validate / build sections (also removed the U3 duplication); suite stayed green
- commit: `9e2009c`
- notes: none

## Cycle: U20 nothing cached between calls

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U20 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U20 /" tests/` -> n/a: passed on first run (mutant: module-level result cache -> 1 failed AssertionError) (1 failed)
- green: none: resolveConfig reads getEnv on every call. Suite -> 29 passed, 0 failed, 24 ignored
- refactor: none
- commit: `c588950`
- notes: passed first run; mutant caching the first result failed U20, restored exactly

## Cycle: U21 no key value in missing or invalid text

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U21 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U21 /" tests/` -> n/a: passed on first run (mutant: reason echoes the timeout value -> 1 failed, key leaked in reason) (1 failed)
- green: none: reasons are fixed strings and never echo a setting value. Suite -> 30 passed, 0 failed, 24 ignored
- refactor: none
- commit: `2289b14`
- notes: passed first run; mutant echoing the rejected FETCH_TIMEOUT_MS value failed U21 (leaked CHAT key shown), restored exactly

## Cycle: U22 keyed http embedding role warns

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U22 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U22 /" tests/` -> Error: not implemented (keyOverHttpWarnings stub) (1 failed)
- green: lib/config.ts: keyOverHttpWarnings maps each keyed http:// endpoint to a key_over_http warning with the contract message. Suite -> 31 passed, 0 failed, 24 ignored
- refactor: none needed
- commit: `14aa0dc`
- notes: none

## Cycle: U23 no warning for unkeyed http or keyed https

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U23 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U23 /" tests/` -> n/a: passed on first run (mutants: dropped key test, dropped scheme test -> each 1 failed AssertionError) (1 failed)
- green: none: U22's filter already requires both a key and http://. Suite -> 32 passed, 0 failed, 24 ignored
- refactor: none
- commit: `a1bf9a0`
- notes: passed first run; two mutants (warn without key; warn without http check) each failed U23, restored exactly

## Cycle: U24 inheriting chat role gets its own warning

- test: `integrations/self-hosted-llm-mcp/tests/config_test.ts::U24 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U24 /" tests/` -> n/a: passed on first run (mutant: only the embedding role checked -> 1 failed AssertionError) (1 failed)
- green: none: U22's implementation already checks both roles. Suite -> 33 passed, 0 failed, 24 ignored
- refactor: none
- commit: `19c2f66`
- notes: passed first run; mutant checking only embedding failed U24, restored exactly

## Cycle: U25 extraction prompt matches core verbatim

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U25 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U25 /" tests/` -> AssertionError: Values are not equal (EXTRACTION_PROMPT "" vs core prompt) (1 failed)
- green: lib/metadata.ts:2 EXTRACTION_PROMPT set to core's prompt text. Suite -> 34 passed, 0 failed, 24 ignored
- refactor: none
- commit: `5e2579d`
- notes: test reads server/index.ts at test time, so drift in core fails it

## Cycle: U26 raw JSON object reply is usable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U26 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U26 /" tests/` -> Error: not implemented (parseUsableMetadata stub) (1 failed)
- green: lib/metadata.ts parseUsableMetadata parses the trimmed reply (no validation yet). Suite -> 35 passed, 0 failed, 24 ignored
- refactor: none
- commit: `195b3f5`
- notes: none

## Cycle: U27 single fenced block reply is usable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U27 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U27 /" tests/` -> SyntaxError: Unexpected token ` (fenced reply not unwrapped) (1 failed)
- green: lib/metadata.ts: a reply that is exactly one fenced block (json or bare) is unwrapped before parsing. Suite -> 36 passed, 0 failed, 24 ignored
- refactor: none
- commit: `fd51d73`
- notes: none

## Cycle: U28 non-object JSON is unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U28 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U28 /" tests/` -> AssertionError (array [1,2] returned instead of null) (1 failed)
- green: lib/metadata.ts: only a plain object (not null, not an array) is returned. Suite -> 37 passed, 0 failed, 24 ignored
- refactor: none
- commit: `4f9f844`
- notes: none

## Cycle: U29 unparseable replies are unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U29 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U29 /" tests/` -> SyntaxError: Unexpected token 'o', "not json at all" is not valid JSON (1 failed)
- green: lib/metadata.ts: JSON.parse failure returns null (also covers prose around a fence and two fences). Suite -> 38 passed, 0 failed, 24 ignored
- refactor: none
- commit: `69f3a50`
- notes: none

## Cycle: U30 fallback metadata when extraction is unusable

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U30 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U30 /" tests/` -> Error: not implemented (buildCaptureMetadata stub) (1 failed)
- green: lib/metadata.ts: buildCaptureMetadata returns the fallback record. Suite -> 39 passed, 0 failed, 24 ignored
- refactor: none
- commit: `20a0d98`
- notes: none

## Cycle: U31 extracted metadata kept and completed

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U31 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U31 /" tests/` -> AssertionError (fallback topics/type returned instead of extracted fields) (1 failed)
- green: lib/metadata.ts: extracted metadata spread, plus source, embedding_model, enrichment_status complete. Suite -> 40 passed, 0 failed, 24 ignored
- refactor: none
- commit: `1357819`
- notes: none

## Cycle: U32 real values override extracted claims

- test: `integrations/self-hosted-llm-mcp/tests/metadata_test.ts::U32 …` (new)
- red: `deno test --node-modules-dir=none --no-prompt --allow-env --allow-read --filter "/^U32 /" tests/` -> n/a: passed on first run (mutant: spread of extracted placed last -> 1 failed AssertionError) (1 failed)
- green: none: U31's spread order already lets the real values win. Suite -> 41 passed, 0 failed, 24 ignored
- refactor: none
- commit: `129ca5d`
- notes: passed first run; mutant putting ...extracted last failed U32, restored exactly
