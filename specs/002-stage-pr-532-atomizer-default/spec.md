# Feature Specification: Stage upstream PR #532 (atomizer Anthropic default model)

**Feature Branch**: `stage/pr-532-atomizer-default`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Stage upstream PR #532 atomizer default model"

## Lane & Contribution Target *(mandatory)*

| Field | Value |
|-------|-------|
| **Lane** | staged upstream PR |
| **Branch** | `stage/pr-532-atomizer-default` |
| **Base** | `refs/pull/532/head` (upstream `NateBJones-Projects/OB1`, head `8bebd778241a`, 1 commit, mergeable) |
| **Category** | recipes |
| **Contribution folder** | `recipes/atomizer/` (existing) |
| **Upstream PR** | #532 `[recipes] atomizer: move the Anthropic default off claude-sonnet-4-5` by AyhamJo7, opened 2026-11-23, review required |
| **Requires** | none (no new primitives, skills or services) |

## User Scenarios & Testing *(mandatory)*

The actors are the **fork owner**, who runs the atomizer recipe against their own Open Brain, and **upstream maintainers**, who may later merge #532 and benefit from the fork's tests.

### User Story 1 - Anthropic runs keep working after the model retirement (Priority: P1)

The fork owner runs the atomizer with the Anthropic provider and no explicit model. Today the recipe falls back to a model that the PR says Anthropic retires on 2026-11-30. After staging, the fallback is a current model, so these runs keep working past that date without any configuration change.

**Why this priority**: This is the reason to stage #532 ahead of upstream. Without it, every default Anthropic run in the fork fails after 2026-11-30.

**Independent Test**: Invoke the atomizer's text-splitting function with the Anthropic provider and no model, intercept the outgoing request without sending it, and confirm the requested model is the new default.

**Acceptance Scenarios**:

1. **Given** the staged change on fork `main`, **When** the atomizer runs with the Anthropic provider and no model specified, **Then** the request names `claude-sonnet-5-5`.
2. **Given** the staged change, **When** the owner explicitly specifies a model, **Then** the request names exactly that model (the default does not override an explicit choice).

---

### User Story 2 - The staged change is proven by credential-free tests (Priority: P1)

Before the change reaches fork `main`, automated tests inside `recipes/atomizer/` prove the new default, the explicit override, and the untouched OpenRouter default. They run without API keys or network, so fork-ci can enforce them on every future change to the folder.

**Why this priority**: Constitution Principle IV requires tests written and green before a staged PR merges. The atomizer currently has no credential-free tests; its only test-like file is a live sanity script.

**Independent Test**: Run the new tests on a machine with no provider keys and no network access; they pass against the staged code and fail against the pre-PR code.

**Acceptance Scenarios**:

1. **Given** no `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` in the environment, **When** the new tests run, **Then** they pass and make no network calls.
2. **Given** the pre-PR code (default `claude-sonnet-4-5`), **When** the new tests run, **Then** the default-model test fails (the tests detect the regression).
3. **Given** the staged fork PR, **When** fork-ci evaluates `recipes/atomizer/` in strict mode, **Then** the verdict passes.

---

### User Story 3 - Staging is recorded and reconcilable (Priority: P2)

The staged PR is recorded in the fork's ledger with its spec folder, head commit and test commits, so that when upstream later merges #532 (as-is, squashed or modified) the owner can reconcile the fork and re-apply the tests.

**Why this priority**: It is required by Principle VII. It doesn't affect whether the fix works today.

**Independent Test**: After landing, the ledger has a `#532` row linking this spec, the upstream head commit and the fork's test commit(s).

**Acceptance Scenarios**:

1. **Given** the fork PR is merged, **When** the owner opens `.fork/staged-prs.md`, **Then** a row for #532 lists kind `staged`, this spec folder, head `8bebd778241a`, the test commit(s), the merge date and status `staged`.
2. **Given** the fork's tests are worth sharing, **When** staging completes, **Then** the upstream PR receives a comment linking the fork's test commit.

---

### Edge Cases

- **Upstream merges #532 before the fork lands it**: the staging is unnecessary; the owner syncs upstream instead and keeps only the tests (status `upstreamed`).
- **The author force-pushes #532 (new head)**: the staged branch is re-fetched from the new head, the ledger records the new SHA, and the tests are re-run.
- **Upstream changes the default to a different model** (review feedback): reconciliation takes upstream's value and updates the tests (status `upstreamed (reconciled)`).
- **2026-11-30 passes before landing**: default Anthropic runs in the fork fail until the staged change lands; the tests still apply unchanged.
- **A test accidentally performs a real request**: it MUST fail fast rather than reach the network (tests run with the request function replaced).
- **The live sanity script `test-atomize.mjs`** is treated as a test by fork-ci and fails without credentials; FR-007 makes it skip cleanly. The `claude-cli` provider needs no key, and under fork-ci the script uses its default (`openrouter`), so the skip covers the CI case.
- **A key is present** (owner running manually): the script still performs the live call exactly as before.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Fork `main` MUST contain upstream PR #532's change with the author's commit unrewritten (head `8bebd778241a` or a later head if the author updates the PR).
- **FR-002**: When the atomizer uses the Anthropic provider and no model is given, it MUST request `claude-sonnet-5-5`.
- **FR-003**: When a model is given explicitly, the atomizer MUST request exactly that model.
- **FR-004**: The OpenRouter default (`anthropic/claude-sonnet-4.5`) MUST remain unchanged. Changing it is out of scope, matching the upstream PR's stated scope.
- **FR-005**: Automated tests for FR-002, FR-003 and FR-004 MUST live inside `recipes/atomizer/`, run without credentials or network access, and be committed separately from the author's commit.
- **FR-006**: The tests MUST fail against the pre-PR default, demonstrating that they detect the regression.
- **FR-007**: `recipes/atomizer/test-atomize.mjs` (a live sanity script that fork-ci picks up as a test) MUST skip cleanly when the selected provider's key is not set: print a "skipped: no API key for <provider>" message and exit 0. With a key set, its behavior MUST be unchanged. This edit is committed separately from the author's commit, justified in the plan's Complexity Tracking (constitution Principle V), and offered upstream with the tests (FR-011). *(Clarified 2026-11-24, Q1 option C: this skip now; a general fork-ci "manual scripts" mechanism follows later as its own fork feature.)*
- **FR-008**: The fork pull request MUST pass `fork-ci-verdict` in strict mode before merging and MUST be merged with a merge commit.
- **FR-009**: The fork pull request title MUST keep upstream's `[recipes] …` title with a `(staged #532)` suffix.
- **FR-010**: The staging MUST be recorded in `.fork/staged-prs.md` with this spec folder.
- **FR-011**: The fork SHOULD offer its tests to upstream by commenting on PR #532 with a link to the test commit.

### Testing Requirements *(mandatory)*

- **Runner**: Node's built-in test runner (`node --test`) inside `recipes/atomizer/`, matching fork-ci's `node-plain` runtime for this folder (no `package.json` test script).
- **Behaviors that MUST have tests**: default Anthropic model (FR-002), explicit override (FR-003), unchanged OpenRouter default (FR-004), no network access in tests (FR-005), and `test-atomize.mjs` exiting 0 with a skip message when no key is set (FR-007).
- **Existing test coverage** *(staged PRs)*: none credential-free. `test-atomize.mjs` is a live sanity script that needs a provider key (see FR-007).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Anthropic-provider atomizer runs without an explicit model request a currently served model, as verified by the automated tests.
- **SC-002**: The staged change is on fork `main` before 2026-11-30.
- **SC-003**: The new tests complete in under 5 seconds with 0 credentials and 0 network requests.
- **SC-004**: The fork PR's `fork-ci-verdict` is green in strict mode with 0 advisories for `recipes/atomizer/`.
- **SC-005**: The ledger has exactly 1 row for #532, linking this spec.

## Assumptions

- The retirement of `claude-sonnet-4-5` (alias included) on 2026-11-30 is as stated in PR #532, which links Anthropic's model-deprecations page; it was not independently re-verified for this spec. `claude-sonnet-5-5` is a current Sonnet model ID.
- The OpenRouter slug `anthropic/claude-sonnet-4.5` may follow its own schedule; if it is also retired, that's a separate staged PR or fork feature, not this one.
- Upstream has not merged #532 at staging time (state OPEN, review required, as of 2026-11-24).
- Sibling PR #531 (thought-enrichment) is staged as its own separate feature, per constitution Principle VII (no batching).
- The README tip that names the OpenRouter slug stays unchanged, as in the PR.
- **Deferred (separate fork feature)**: a fork-ci mechanism, in fork-only files, that marks known manual/live scripts as non-tests, so that other recipes' live scripts need no edits. Out of scope here (Q1 option C).
