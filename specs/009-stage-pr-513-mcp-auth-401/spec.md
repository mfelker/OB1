# Feature Specification: Stage upstream PR #513 (MCP auth failures return HTTP 401)

**Feature Branch**: `stage/pr-513-mcp-auth-401`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Stage upstream PR #513 (head 99f589f24c, base upstream/main 238df6c): the core MCP server (server/index.ts) answers a wrong or missing x-brain-key with HTTP 401, a WWW-Authenticate Bearer challenge, CORS headers and a JSON body, returned before any MCP server or transport is created, instead of today's HTTP 200 JSON-RPC -32001 envelope (from #243) that makes MCP clients reconnect indefinitely (issue #512). Key comparison becomes constant-time for both the header and ?key= paths (issue #216). Adds server/auth_test.ts and updates server/test-stateless.mjs (issue #487). Overlaps: #425, #359, #387, #329. Fork follow-ups: self-hosted-llm-mcp and thought-attachments copy the same HTTP 200 -32001 pattern."

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | staged upstream PR |
| **Branch** | `stage/pr-513-mcp-auth-401` (fetched from upstream `pull/513/head`; worktree `.worktrees/stage-pr-513-mcp-auth-401`) |
| **Base** | `refs/pull/513/head` (upstream `NateBJones-Projects/OB1`, head `99f589f24c34`, 1 commit, based on upstream `main` at `238df6cefd30`) |
| **Lands in** | fork `main` via a fork pull request merged with a merge commit (never squash or rebase) |
| **Category** | server (core MCP server; the PR files itself under `[integrations]`, as earlier `server/` fixes did) |
| **Contribution folder** | `server/` (the PR changes `server/index.ts` and `server/test-stateless.mjs`, and adds `server/auth_test.ts`) |
| **Upstream PR** | #513 `[integrations] URGENT: return HTTP 401 + WWW-Authenticate on MCP auth failure (fixes retry storm)` by txcfi-scott, opened 2026-10-11, state OPEN, no review yet |
| **Fixes upstream issues** | #512 (retry storm), #216 (timing-safe comparison), #487 (stale 401 assertion in `test-stateless.mjs`) |

**Branch relationships (why this lands cleanly)**: fork `main` contains all of upstream `main` (0 commits behind on 2026-11-27), and `server/` on fork `main` is identical to upstream `main`. #513's merge base is upstream `main`'s current tip, so merging its head into fork `main` brings in the author's 1 commit and the fork's test commits, with no conflict. **This is the fork's first staged PR that modifies an existing core file** rather than adding a new folder: later upstream changes to `server/index.ts` (for example #425) can conflict with it during sync. Spec-kit artifacts (`specs/009-…/`) live only on fork `main` and never enter the `stage/` branch (constitution Principle V).

## User Scenarios & Testing *(mandatory)*

The actors are the **fork owner**, whose Open Brain runs the core server behind MCP clients (Claude Code, Claude Desktop, claude.ai connectors); **MCP clients**, which decide whether to retry from the server's answer; and **upstream maintainers**, who may later merge #513 and can reuse the fork's tests.

### User Story 1 - A bad or missing access key stops the client instead of starting a retry storm (Priority: P1)

After the owner rotates the access key, or a client is configured with a wrong one, every request with that key gets a clear "unauthorized" answer that MCP clients treat as final. The client stops and tells the user to fix the key. It does not reconnect over and over, so the owner's hosting usage does not spike.

**Why this priority**: This is the reason to stage #513. Issue #512 reports about 1.95M function invocations in about 4 days (389% of the free quota) from one rotated key under today's behavior.

**Independent Test**: Send requests to the real core server module with a wrong key, a key of a different length, a wrong query key, no key, and a GET with no key. Each answer is an HTTP 401 with an authentication challenge, browser-access headers and the fixed JSON body, and no MCP session is started.

**Acceptance Scenarios**:

1. **Given** a request whose access-key header is wrong, **When** the server answers, **Then** the status is 401, the answer carries a `Bearer` authentication challenge, the browser-access (CORS) headers, and the body `{"error":"unauthorized","message":"Invalid or missing x-brain-key"}`.
2. **Given** a request with no access key in the header or the query string, **When** the server answers, **Then** the answer is the same 401 as in scenario 1.
3. **Given** a wrong key in the `?key=` query parameter, **When** the server answers, **Then** the answer is the same 401.
4. **Given** a wrong key of a different length from the real key, **When** the server answers, **Then** the answer is the same 401.
5. **Given** a GET request with no key, **When** the server answers, **Then** the answer is the same 401 (not a hanging stream).
6. **Given** any request that fails authentication, **When** the server answers, **Then** no MCP server or transport was created for it and no database or model call was made.

---

### User Story 2 - Correct keys keep working exactly as before (Priority: P1)

Clients that already use the right key see no change: the tool list and tool calls work through the header key and through the `?key=` query parameter, and browser-based clients still pass the pre-flight check without a key.

**Why this priority**: The fix must not break the owner's working connectors. A regression here takes the whole brain offline for every client.

**Independent Test**: Send an MCP tool-list request to the real server module with the right header key, and separately with the right query key. Both succeed with a non-empty tool list. Send a pre-flight (OPTIONS) request with no key; it succeeds.

**Acceptance Scenarios**:

1. **Given** the right key in the access-key header, **When** a client asks for the tool list, **Then** the status is 200 and the list is non-empty.
2. **Given** the right key in the `?key=` query parameter only, **When** a client asks for the tool list, **Then** the status is 200.
3. **Given** a pre-flight (OPTIONS) request with no key, **When** the server answers, **Then** the status is 200 with the browser-access headers.
4. **Given** a client that sends no `Accept` header (Claude Desktop connectors), **When** it calls with the right key, **Then** the request still succeeds, as it does today.
5. **Given** the right key in one place and a wrong key in the other (header vs query), **When** the server answers, **Then** the request is accepted, because one valid key is enough.

---

### User Story 3 - Key checks do not leak the key through response timing (Priority: P2)

Checking a submitted key takes the same work whether it shares a prefix with the real key, has a different length, or arrives by header or by query string. An attacker cannot learn the key one character at a time by timing answers.

**Why this priority**: Hardening (issue #216). The access key is the only credential on the core server, but timing attacks over the internet are hard to mount, so this ranks below stopping the retry storm.

**Independent Test**: Inspect and unit-test the comparison: keys that differ only in the last character, keys of different lengths and empty keys are all rejected. Both the header and query candidates are always evaluated. No early-exit comparison of the raw strings remains on the auth path.

**Acceptance Scenarios**:

1. **Given** a key equal to the real key except for its last character, **When** it is checked, **Then** it is rejected.
2. **Given** a key that is a prefix of the real key, or the real key plus extra characters, **When** it is checked, **Then** it is rejected.
3. **Given** the server is started with no access key configured, **When** any request arrives with any key (including an empty one), **Then** it is rejected with the 401, never accepted.

---

### User Story 4 - Staging is recorded, the overlaps are known, and the fork's own copies get follow-ups (Priority: P2)

The staged PR is recorded in the fork's ledger. The upstream PRs that touch the same code or rely on the old behavior are listed, so a later sync or staging knows what to expect. The fork's own servers that copied the old pattern get tracked follow-ups.

**Why this priority**: Principle VII requires the ledger row. The overlaps and follow-ups protect later work, but do not change what this feature delivers.

**Independent Test**: After landing, `.fork/staged-prs.md` has one `#513` row linking this spec. Fork issues exist for the two fork servers that return HTTP 200 with `-32001`.

**Acceptance Scenarios**:

1. **Given** the fork PR is merged, **When** the owner opens `.fork/staged-prs.md`, **Then** a row for #513 lists kind `staged`, this spec folder, head `99f589f24c34` (or the head actually staged), the test commit(s), the merge date and fork PR, and status `staged`.
2. **Given** the feature is complete, **When** the owner checks fork issues, **Then** there is a follow-up for `integrations/self-hosted-llm-mcp` (which also affects upstream #533) and one for `integrations/thought-attachments`, each saying to return 401 with a challenge instead of HTTP 200 with `-32001`.
3. **Given** the fork's tests pass, **When** staging completes, **Then** upstream PR #513 gets a comment linking the fork's test commit(s) if they add coverage beyond the author's tests.

---

### Edge Cases

- **Upstream merges #513 before the fork lands it**: staging is no longer needed. The owner syncs upstream and keeps only the fork's extra tests (status `upstreamed`).
- **The author force-pushes or adds commits**: the `stage/` branch is re-fetched from the new head, the ledger records the new SHA, the tests are re-run, and the fork's test commits are re-applied on top.
- **Upstream #425 (405 for non-POST) lands first, upstream or on the fork**: it edits the same `app.all` handler right below the auth check. The merge must keep both: the auth check runs first (a GET with no key gets 401, not 405), then the method guard. Which order the two checks run in for a GET with a valid key is #425's concern, not this feature's.
- **Upstream #359 and #387 (brain-smoke-test)** parse the `-32001` JSON-RPC auth error, and **#329** adds that envelope to `work-operating-model-activation`. They build on the behavior this PR removes. If staged later, they must be re-checked against the 401 behavior. #329's recipe has its own server and is not changed by this PR.
- **Codex CLI and other clients that expect a JSON-RPC body**: the 401 body is not a JSON-RPC envelope, so such a client logs one parse error and stops. That is accepted (the PR's stated trade-off): one terminal failure, not a loop.
- **A client that still retries on 401**: the server cannot stop that, but each retry ends before any MCP server, database or model work, so it costs as little as possible.
- **Key in the query string**: the query-string key path is kept for backward compatibility. Its exposure in logs (the other half of #216) is not addressed by this PR and stays out of scope.
- **The server module is imported by tests**: importing it must not start a listening server. Serving happens only when the file is the program's entry point. The Supabase edge runtime still serves it normally (the author reports a production deploy).
- **Tests and environment**: the tests set fake values for the database address, service key and model key. They MUST make no network request and need no credentials, because the tool list and failed auth never touch the database or model.
- **The upstream gate (`ob1-gate-v2`) runs on the fork PR**: it treats `server/` changes as repo changes and skips the contribution checks (seen on #513 upstream). The fork PR touches nothing outside `server/`.
- **fork-ci runtime choice for `server/`**: the folder has both a Deno config and a Node `package.json` (for `test-stateless.mjs`). The plan decides how fork-ci runs both test files.
- **The owner's live brain**: the fork's live tailnet brain and the spec 006 self-hosted stack both run this core server. Deploying the change to either is the owner's call and is optional evidence, not a merge requirement.

## Requirements *(mandatory)*

### Functional Requirements

**Branching and landing**

- **FR-001**: The staged code MUST come from upstream `refs/pull/513/head` into a local branch named `stage/pr-513-mcp-auth-401`, checked out in its own worktree at `.worktrees/stage-pr-513-mcp-auth-401`. All code and test changes for this feature MUST be made in that worktree, never on the fork-`main` checkout.
- **FR-002**: The author's commit (`99f589f24c`, or the later head's commits) MUST be kept unrewritten: no rebase, squash, amend or cherry-pick.
- **FR-003**: The fork's tests MUST be added as separate commits on top of the author's head, on the `stage/` branch, with commit titles prefixed `[integrations]` to match the upstream PR.
- **FR-004**: The `stage/` branch MUST NOT contain any fork-only path (`.specify/`, `specs/`, `.fork/`, `.claude/skills/speckit-*`) and MUST NOT change any file outside `server/`.
- **FR-005**: The staged work MUST land on fork `main` only through a fork pull request (`stage/pr-513-mcp-auth-401` → `main` on `mfelker/OB1`), merged with a merge commit, after this feature's pre-merge tasks are complete and `fork-ci-verdict` passes in strict mode.
- **FR-006**: The fork pull request title MUST keep upstream's title with a suffix: `[integrations] URGENT: return HTTP 401 + WWW-Authenticate on MCP auth failure (fixes retry storm) (staged #513)`.
- **FR-007**: The staging MUST NOT be pushed to, and no pull request may be opened against, upstream `NateBJones-Projects/OB1`. The only upstream interaction is the offer comment in FR-019.

**Server behavior under test** (the author's behavior, as already written; the fork changes no server code)

- **FR-008**: A request with a wrong, wrong-length or missing access key, in the header or the query string, MUST be answered with HTTP 401.
- **FR-009**: Every 401 MUST carry a `Bearer` authentication challenge header, the same browser-access (CORS) headers as successful answers, and the JSON body `{"error":"unauthorized","message":"Invalid or missing x-brain-key"}`.
- **FR-010**: A failed authentication MUST be answered before any MCP server or transport is created, and MUST NOT read or depend on the request body.
- **FR-011**: A request with the right key in the header, or in the query string, MUST be served as before (tool list and tool calls work), including the existing fix for clients that send no `Accept` header.
- **FR-012**: A pre-flight (OPTIONS) request MUST succeed without a key.
- **FR-013**: The key comparison MUST NOT end early on the first differing character or on a length difference, and both key candidates (header and query) MUST be evaluated on every request.
- **FR-014**: When the server has no access key configured, every request MUST be rejected with the 401.
- **FR-015**: Importing the server module MUST NOT start a listening server. Running it as the entry point (as the edge runtime does) MUST serve as before.

**Tests and records**

- **FR-016**: Automated tests for FR-008 to FR-015 MUST live inside `server/`, exercise the real server module (not only the inline mirror in `test-stateless.mjs`), and run without credentials or network access. They MUST pass at the PR head and fail at the PR base (staged base-red rule, Principle IV).
- **FR-017**: The staging MUST be recorded in `.fork/staged-prs.md` with this spec folder (ledger row added on fork `main` after the fork PR merges).
- **FR-018**: Fork issues MUST be opened for the same HTTP 200 / `-32001` pattern in `integrations/self-hosted-llm-mcp/lib/app.ts` (note: also part of upstream #533) and `integrations/thought-attachments/src/app.ts`. Fixing them is out of scope for this feature.
- **FR-019**: If the fork's tests add coverage beyond the author's, the fork SHOULD offer them by commenting on PR #513 with a link to the test commit(s).

### Testing Requirements *(mandatory)*

- **Runner**: Deno's test runner for tests that import the real `server/index.ts` (the author's `auth_test.ts` pattern). The existing Node script `test-stateless.mjs` keeps running under Node. The plan decides how fork-ci runs both runners for `server/`.
- **Behaviors that MUST have tests**: 401 status, challenge, CORS headers and exact body for every failure kind (FR-008, FR-009); no server, transport or body read on failure (FR-010); valid header key, valid query key, mixed valid/invalid pair, and no-`Accept`-header client (FR-011); OPTIONS without a key (FR-012); near-miss keys (last character, prefix, extension) rejected (FR-013); no configured key rejects everything (FR-014); importing the module does not serve (FR-015).
- **Explicitly not unit-tested**: actual timing behavior of the comparison (statistical timing tests are flaky). FR-013 is covered by near-miss correctness tests plus a structural check that no early-exit raw comparison remains on the auth path; the plan decides the form of that check.
- **Existing test coverage** *(staged PRs)*: the PR adds `server/auth_test.ts` (4 Deno tests: valid header key with a non-empty tool list, valid query key, five failure kinds with the full 401 shape, OPTIONS without a key) and one new assertion in `server/test-stateless.mjs` (challenge header on 401). The author reports 4/4 Deno tests, 21/21 `test-stateless.mjs` assertions and a clean `deno check`. `test-stateless.mjs` tests an inline copy of the handler, not `index.ts`, so it does not count toward FR-016.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the fork PR merges, the author's 3 files in `server/` on fork `main` are byte-identical to the staged upstream head, and 0 files outside `server/` changed.
- **SC-002**: The author's commit is reachable from fork `main` with its original SHA.
- **SC-003**: 100% of the failure kinds listed in User Story 1 get a 401 with the challenge, CORS headers and exact body; 0 of them get HTTP 200.
- **SC-004**: 100% of the valid-key paths in User Story 2 still succeed.
- **SC-005**: Every behavior listed in the Testing Requirements has at least one test; all pass at the PR head and the suite fails at the PR base.
- **SC-006**: The full test suite finishes in under 30 seconds with 0 credentials and 0 requests leaving the machine.
- **SC-007**: The fork PR's `fork-ci-verdict` is green in strict mode for `server/`, and the upstream gate reports no issues.
- **SC-008**: The ledger has exactly 1 row for #513 linking this spec, and 2 fork issues track the fork's own copies of the old pattern.

## Assumptions

- Upstream has not merged #513 at staging time (state OPEN as of 2026-11-27, no review).
- This feature takes spec number 009 under the repo's sequential numbering. The roadmap's migration feature takes the next free number when it is specified.
- The PR's switch to 401 is correct per the MCP authorization spec (2025-11-25, "Error Handling": 401 for missing or invalid credentials, with a challenge header), and Claude Code does not retry authentication errors. The fork accepts the PR's trade-off (one parse error in clients that expect a JSON-RPC body).
- The fork changes no line of the author's code. If tests expose a defect, the fork reports it on #513 and records it here. A fork-only fix happens only with a Complexity Tracking justification in the plan (Principle V).
- Tests drive the server through its environment settings and the exported `app`. No test-only hooks are added to `index.ts`.
- Fixing the fork's own servers (FR-018) and the query-string log exposure in #216 are out of scope.
- Live verification on the owner's tailnet brain or the spec 006 stack is optional; the owner decides whether to deploy. Evidence goes under this spec's `evidence/` folder.
- The worktree extension's after-specify offer is declined. The staging worktree is cut from the PR head (`.fork/README.md`, "Stage an upstream PR", step 2).
