# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## Lane & Contribution Target *(mandatory)*

<!--
  Every OB1 fork change belongs to exactly ONE lane (constitution Principle V).
  Delete the rows that do not apply; keep the table filled for the chosen lane.
-->

| Field | Value |
|-------|-------|
| **Lane** | [fork feature / upstream-bound feature / staged upstream PR] |
| **Branch** | [`fork/<desc>` / `contrib/mfelker/<desc>` / `stage/pr-<N>-<desc>`] |
| **Base** | [fork `main` / `upstream/main` / `refs/pull/<N>/head`] |
| **Category** | [recipes / schemas / integrations / dashboards / skills / extensions / primitives] (extensions and primitives are curated upstream) |
| **Contribution folder** | `[category]/[kebab-case-name]/` (new or existing) |
| **Upstream PR** | [#N being staged, or "to be opened", or N/A for fork-only] |
| **Requires** | [`requires_primitives` / `requires_skills` / services, or none] |

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

### Data & Schema Changes *(include if feature touches the database)*

<!--
  Constitution Principle I: additive only. The core `thoughts` table may gain columns but
  existing columns are never altered or dropped. No DROP TABLE / TRUNCATE / unqualified DELETE.
-->

- **New objects**: [tables / columns / functions / views being added]
- **Touches `thoughts`?**: [No / Adds column(s): ...]
- **RLS**: [policy needed for user data? which role?]
- **Verification**: [how a user confirms the objects exist after running the SQL]

### MCP Tool Surface *(include if feature adds or changes MCP tools)*

<!--
  Constitution Principle II: remote Edge Function only; every tool annotated.
-->

| Tool | Purpose | readOnlyHint | destructiveHint | openWorldHint |
|------|---------|--------------|-----------------|---------------|
| [tool_name] | [what it does] | [true/false] | [true/false/n/a] | [true/false/n/a] |

### README Contract *(mandatory for new contribution folders)*

- **Prerequisites**: [accounts, CLIs, prior extensions/primitives]
- **Steps**: [outline of numbered setup steps]
- **Expected outcome**: [what the user sees when it works]
- **Links**: [`docs/05-tool-audit.md` for extensions/integrations; required primitives/skills]

### Testing Requirements *(mandatory)*

<!--
  Constitution Principle IV (NON-NEGOTIABLE). Choose the rule for this lane:
  - fork / upstream-bound feature: red-green-refactor, failing test first
  - staged upstream PR: tests covering changed behavior written and green BEFORE merge into fork main
  Tests live INSIDE the contribution folder. No live credentials; mock Supabase/OpenRouter.
-->

- **Runner**: [deno test / vitest / node / pytest / SQL verification]
- **Behaviors that MUST have tests**: [list, each traceable to an FR or acceptance scenario]
- **Existing test coverage** *(staged PRs)*: [none / partial: ... / adequate]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Existing authentication system will be reused"]
- [Dependency on existing system/service, e.g., "Requires a working core Open Brain setup (docs/01-getting-started.md)"]
- [Upstream assumption, e.g., "Upstream PR #N will not be merged before this ships; if it is, the sync takes upstream's version"]
