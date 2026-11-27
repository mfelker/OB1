# Cycle log stream: Q (data) (T014 to T019, T038, T048, T055, T061, T062)

Append only. Newest last. Worktree `.worktrees/ta-data`, branch `contrib/mfelker/thought-attachments-data`, folder `F` = `.worktrees/ta-data/integrations/thought-attachments`.

SQL cycles run `cd F && PATH=/Users/mfelker/.claude/jobs/4ac8d127/tmp/pgbin007:$PATH psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql` (the whole file; each assertion block names its id in its exception message). "Mutant" means the block passed on its first run, so `schema.sql` was broken minimally, the block failed as quoted, and the file was restored byte for byte (copy back, rerun green). The test database is persistent, so a mutant or an index-predicate change that needs a rebuilt object was followed by a dev-only reset of the feature objects (a `psql` command outside the repo files); the final check below runs from a fresh state.

Function names (private to stream Q, checked by U83): `attachment_write_derived`, `attachment_require_claim`, `attachment_apply_patch`, `attachment_set_state`, `attachment_claim`, `attachment_release`, `attachment_embedding_dimension`, `attachment_find_thoughts_exact`, `attachment_insert_note`, `attachment_by_page_token`, `attachment_consume_page_token`, `attachment_note_would_go`, `attachment_remove`, `attachment_removal_preview`, `attachment_orphans`.

## SQL cycles (T014, T015, T016, T038 SQL half, T055, T061)

Each row: id, red (decisive line, verbatim or trimmed), what turned it green, commit. The suite after each green was the whole `verify.sql` with no error output.

| id | red | green | commit |
| --- | --- | --- | --- |
| U34 | `ERROR:  U34: columns differ: <NULL>` (no table). A second run showed my expectation for `id` nullability was wrong (primary key is NOT NULL); the test was corrected, not weakened | `create table if not exists thought_attachments` with every column | b223f19 |
| U35 | `ERROR:  U35: image/gif was accepted` | check constraint `thought_attachments_declared_type_check`, added by name in a guarded block | c7fb10e |
| U36 | `ERROR:  U36: bogus was accepted` | `expected_kind in ('photo','pdf','')` | e0e3687 |
| U37 | `ERROR:  U37: secret was accepted` | tier check (default already in the table) | 160f52a |
| U38 | `ERROR:  U38: done was accepted` | state check | 4065f2c |
| U39 | `ERROR:  U39: purge was accepted` | busy_op check | bff9bdb |
| U40 | `ERROR:  U40: updated_at did not advance (... then ...)` | `thought_attachments_touch()` and the before-update trigger | 8f2f080 |
| U41 | `ERROR:  U41: no index on parent_thought_id` | the two indexes | 02d357e |
| U42 | `ERROR:  U42: duplicate (parent, hash) was accepted` | plain unique index on `(parent_thought_id, content_hash)` | e4119d7 |
| U43 | stale plain unique index gave `ERROR: duplicate key value ...` on the second insert (the index predicate was missing) | `where state <> 'refused'` (the dev DB was reset so the index was recreated) | 4aa6c2f |
| U44 | first run passed. Mutant: `nulls not distinct` on the index -> `Key (parent_thought_id, content_hash)=(..., null) already exists.` | no production change | cdb0485 |
| U45 | `ERROR:  U45: RLS is not enabled` | `enable row level security`, no policies | ca50b42 |
| U46 | `ERROR:  U46: service_role lacks select` | `grant select, insert, update, delete ... to service_role` | 9574749 |
| U47 | `ERROR:  U47: thoughts.content_fingerprint missing` | `add column if not exists` and `create unique index if not exists idx_thoughts_fingerprint` | 2b8a7b3 |
| U48 | first run passed. Mutant: a block creating a randomly named second index on `content_fingerprint` -> `ERROR:  U48: index count on thoughts changed` (the stray index was dropped by a dev command) | no production change | a4b19c4 |
| U49 | `ERROR:  U49: bucket ob1-files missing` | guarded insert into `storage.buckets` (private, four MIME types, no size limit), by dynamic SQL only when the schema exists | 3c45fb7 |
| U50 | first run passed. First mutant (`create schema if not exists storage` at the file end) was judged weak because the block treated any storage schema as real; the block was strengthened to record the pre-existing schema state with `set_config` and `\gset`. Mutant again -> `ERROR:  U50: a storage schema exists after the no-storage run` | no production change (the stub storage schema lives as `storage_verify_stub` between runs, renamed in and out by `verify.sql`, with no DROP) | faf5bc1 |
| U51 | first run passed. Mutant: trigger guard replaced by `if true` -> `ERROR: trigger ... already exists` on the extra `\i` | no production change | f8b23ac |
| U53 | `No function matches the given name and argument types` (`attachment_write_derived`) | function inserts rows with the guide's fingerprint expression and sets `derived_count` | 8f796c4 |
| U54 | `ERROR:  U54: an expired claim was not refused` | `attachment_require_claim` (row lock, token and expiry check, message `attachment claim not held`) | 9a991ac |
| U55 | first run passed. Mutant: dropped `lower(...)` from the fingerprint -> `ERROR:  U55: 1 rows with a different fingerprint` (first mutant attempt was a syntax error and was redone) | no production change | 1c4a965 |
| U56 | first run passed (the unique index raises). Mutant: `on conflict ... do update set metadata` -> `ERROR:  U56: a fingerprint conflict did not raise` | no production change | 693dd16 |
| U57 | `ERROR:  U57: set not replaced (3 rows, 2 old)` | delete the attachment's old derived set (scoped by `metadata->>'attachment_id'`); `attachment_apply_patch` applies the state patch and `derived_count` | a07b7da |
| U58 | first run passed (a plpgsql function is one transaction). Mutant (run with U56's block temporarily cut, then restored): the insert loop wrapped in `exception when unique_violation then null` -> `ERROR:  U58: the conflicting write did not raise` | no production change | 2a10ca8 |
| U59 | first run passed. Mutant: the delete changed to `where metadata ? 'attachment_id'` -> `ERROR:  U59: the other attachment changed (0 rows, derived_count 1)` | no production change | 825e2d6 |
| U60 | first run passed (unique index). Mutant: `content_hash` ignored in the patch -> `ERROR:  U60: the duplicate content_hash was accepted` | no production change | cd702ee |
| U61 | `No function matches` (`attachment_claim`) | claim function that returns `{busy: op}` while unexpired (token path stubbed) | 5233a13 |
| U62 | `ERROR:  U62: claim not recorded: ...` | single conditional `update ... where busy_until is null or busy_until <= now() returning busy_token`; `busy` otherwise; `attachment not found` raised for an unknown id | 0596b99 |
| U63 | first run passed. Mutant: `id = p_id` removed from the update -> `ERROR: more than one row returned by a subquery used as an expression`/`Make sure the query returns a single row` | no production change | 82e2f60 |
| U64 | `No function matches` (`attachment_release`) | release (clears by id) | 9e28005 |
| U65 | `ERROR:  U65: the claim was released by another token: {"token": ...}` | `and busy_token = p_token` | 28412c3 |
| U66 | `No function matches` (`attachment_embedding_dimension`) | `atttypmod` of `thoughts.embedding` | 5329596 |
| U67 | `No function matches` (`attachment_find_thoughts_exact`) | `position(p_text in content) > 0`, first line, `created_at`, `limit least(p_limit, 20)` | d5482b0 |
| U68 | first run passed. Mutant: `like '%' \|\| p_text \|\| '%'` -> `ERROR:  U68: 2 matches, first ...` | no production change | 60ac15e |
| U314 | `ERROR:  U314: 0 matches, first <NULL>` | `lower()` on both sides | 9e0f37d |
| U84 | `No function matches` (`attachment_insert_note`) | insert the note with the fingerprint, embedding and metadata | 1ee9304 |
| U85 | unique violation raised by the existing fingerprint (`returning id` error) | `on conflict (content_fingerprint) ... do nothing`, then select the existing id and return `created: false` | 6715973 |
| U86 | `No function matches` (`attachment_by_page_token`) | `select * ... where page_token_hash = p_hash` (a null hash matches nothing) | 29ffd4a |
| U87 | `No function matches` (`attachment_consume_page_token`) | `update ... set page_token_hash = null where id and page_token_hash = p_hash`, returns `found` | b5f8bf6 |
| U94 | `No function matches` (`attachment_set_state`) | require claim, then apply the patch, no derived change. The patch keeps `derived_count` if sent, as the fake store does | 594dab0 |
| U93 | first run passed. Mutant: the token comparison removed from `attachment_require_claim` -> `ERROR:  U93: a write with the old token was not refused` | no production change | 0470eb7 |
| U95 | `No function matches` (`attachment_remove`) | require claim, delete the derived set scoped by id, delete the row, return counts | e227cec |
| U96 | first run passed. Mutant: unscoped derived delete -> `ERROR:  U96: the other attachment lost data (0 thoughts, 1 row)` | no production change | 5295dd8 |
| U97 | first run passed. Mutant: `attachment_require_claim` call removed from `attachment_remove` -> `ERROR:  U97: not refused (wrong f, expired f)` | no production change | 2d2492f |
| U98 | `ERROR:  U98: {"removed": {"derived": 0, "noteRemoved": false}, ...}` (the first red was the missing preview function in the helper; the helper was reduced and the real red recorded) | `note_goes` for `refused`, `parent_created_here` and no other attachment; the parent thought is deleted | b51b718 |
| U99 | `ERROR:  U99: {"removed": {"derived": 0, "noteRemoved": false}, ...}` | `attachment_note_would_go(a)`: `refused` or (`pending_upload` and past the deadline), plus the same conditions | 0263b65 |
| U100 | first run passed. Mutant: the `no other attachment` clause removed -> `ERROR:  U100: ... "noteRemoved": true ... "parent_still_there": false` | no production change | 4eb0697 |
| U101 | first run passed. Mutant: `parent_created_here` clause removed -> `ERROR:  U101: ... "noteRemoved": true` | no production change | 0d4e766 |
| U102 | first run passed. Mutant: `state <> 'pending_upload'` in place of `= 'refused'` -> `ERROR:  U102: ... "noteRemoved": true` | no production change | 27ff228 |
| U103 | first run passed. Mutant: the deadline condition removed -> `ERROR:  U103: ... "noteRemoved": true` | no production change | 0b0a6ba |
| U104 | `No function matches` (`attachment_removal_preview`) | preview returns `{derived, noteWouldGo}` from the same rule, no delete | 7ab6805 |
| U105 | `No function matches` (`attachment_orphans`) | `parent_gone` branch | 50d3ac6 |
| U106 | `ERROR:  U106: <NULL>` | `upload_expired` branch | 23a4456 |
| U107 | first run passed. Mutant: deadline test removed -> `ERROR:  U107: {"why": "upload_expired", ...}` | no production change | 2aed227 |
| U108 | `ERROR:  U108: <NULL>` | `refused` branch | 6deb48b |
| U109 | first run passed. Mutant: `a.state in ('refused', 'processed')` -> `ERROR:  U109: {"why": "refused", ...}` (state `processed`) | no production change | 97bba06 |

Note: U43 is shared by T014 and T055 and was done in the T014 run.

Verification of the SQL half from a fresh state: the feature objects were reset (dev only), `verify.sql` ran twice in a row, both with no error output.
