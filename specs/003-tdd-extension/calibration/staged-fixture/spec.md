# Feature Specification: calibration fixture for the staged-lane evidence override

**Feature Branch**: `stage/pr-532-atomizer-default`
**Status**: Calibration fixture (spec 003 T031; research R11). Not a real feature.

This fixture re-describes three behaviors of upstream PR #532 (staged as spec 002) so the `speckit.tdd.verify` audit can be calibrated against the fork's staged-PR override. Its source of truth is `specs/002-stage-pr-532-atomizer-default/contracts/atomize-text-model-defaults.md`.

## User Scenarios & Testing

### User Story 1 - Anthropic default model (Priority: P1)

1. **Given** `atomizeText` with `provider: "anthropic"` and a key but no model, **When** it calls the API, **Then** the request body's model is `claude-sonnet-5-5` (contract C1).
2. **Given** the `test-atomize.mjs` CLI with `--provider=anthropic` and a key, **When** it runs against the fetch stub, **Then** it requests `claude-sonnet-5-5` and exits 0 (contract K4).

### User Story 2 - OpenRouter default unchanged (Priority: P2)

1. **Given** `atomizeText` with `provider: "openrouter"` and a key but no model, **When** it calls the API, **Then** the model is `anthropic/claude-sonnet-4.5` (contract C3).

### User Story 3 - CLI skips without a key (Priority: P3)

1. **Given** the `test-atomize.mjs` CLI with `--provider=anthropic` and no key, **When** it runs, **Then** it prints a skip line and exits 0 (contract K2).

## Requirements

- **FR-001**: The Anthropic default model is `claude-sonnet-5-5` (C1, K4).
- **FR-002**: The OpenRouter default model is unchanged (C3).
- **FR-003**: The CLI without a key skips with exit 0 (K2).
