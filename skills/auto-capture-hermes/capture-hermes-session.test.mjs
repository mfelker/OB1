/**
 * capture-hermes-session.test.mjs — credential-free tests for the Hermes
 * auto-capture adapter.
 *
 * Run: node --test capture-hermes-session.test.mjs   (from skills/auto-capture-hermes/)
 *
 * Each test builds a synthetic Hermes state.db (test-support/hermes-store.mjs)
 * and runs the real script as a child process with a constructed environment
 * (test-support/run-adapter.mjs). Delivery goes to a stand-in ingest endpoint
 * on 127.0.0.1; nothing leaves the machine and no real key is used.
 *
 * Test names start with their behavior id (A1…, U1…) from the fork's test list
 * for staged upstream PR #521.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createStore, sqliteSupport } from "./test-support/hermes-store.mjs";
import {
  DUMMY_KEY,
  INGEST_PATH,
  makeSandbox,
  runAdapter,
  parsePayload,
  dispositions,
  readState,
  stateFiles,
  queueEntries,
  seedQueueEntry,
  writeEnvLocal,
  startIngestStub,
  closedPortUrl,
  waitFor,
} from "./test-support/run-adapter.mjs";

const support = sqliteSupport();
const skip = support.ok ? false : support.reason;

const SESSION_ID = "session-1";
const PROJECT = "demo-project";

let sandbox;
let store;
let stub;

beforeEach(() => {
  sandbox = makeSandbox();
  store = support.ok ? createStore(sandbox.dbPath) : null;
  stub = null;
});

afterEach(async () => {
  if (stub) await stub.close();
  sandbox.cleanup();
});

/** user/assistant pairs: ["u1","a1","u2","a2",…] → messages. */
function conversation(...texts) {
  return texts.map((content, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content }));
}

/** A session with the given messages; defaults to 3 real user turns. */
function seedSession(fields = {}, messages = conversation("u1", "a1", "u2", "a2", "u3", "a3")) {
  const session = store.addSession({ id: SESSION_ID, cwd: `/work/${PROJECT}`, ...fields });
  store.addMessages(session.id, messages);
  return session;
}

function dryRun(sessionId = SESSION_ID, env = {}) {
  return runAdapter(sandbox, { args: ["--dry-run", "--session", sessionId], env });
}

function capture(sessionId = SESSION_ID, env = {}) {
  return runAdapter(sandbox, { args: ["--session", sessionId], env });
}

/** Address and key pointing at the stand-in. */
function brainEnv(url = stub.url) {
  return { SUPABASE_URL: url, MCP_ACCESS_KEY: DUMMY_KEY };
}

