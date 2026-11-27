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


// ── Reading a payload ───────────────────────────────────────────────────────

/** The `[label]` turns inside the <thought_content> block, in order. */
function turnsOf(payload) {
  const body = payload.text.split("<thought_content>\n")[1].split("\n</thought_content>")[0];
  const turns = [];
  const re = /\[(user(?::cron)?|assistant)\]\n([\s\S]*?)(?=\n\n\[(?:user|assistant)[:\]]|$)/g;
  for (const m of body.matchAll(re)) turns.push({ label: m[1], content: m[2] });
  return turns;
}

function headerOf(payload) {
  return payload.text.split("\n---\n")[0].split("\n");
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

const TRUNCATION_MARKER = "[... transcript truncated to fit capture size limit ...]";

/** n user/assistant pairs of `size` characters each; first and last turns tagged. */
function longConversation(pairs, size) {
  const texts = [];
  for (let i = 0; i < pairs * 2; i++) texts.push(`turn-${i} `.padEnd(size, "x"));
  texts[0] = `FIRST-TURN ${texts[0]}`;
  texts[texts.length - 1] = `${texts[texts.length - 1]} LAST-TURN`;
  return conversation(...texts);
}

function hookPayload(event, sessionId = SESSION_ID) {
  return JSON.stringify({ hook_event_name: event, session_id: sessionId, cwd: `/work/${PROJECT}` });
}

// ── US2 acceptance: capture behavior (spec US2.1–US2.8) ─────────────────────

describe("acceptance", () => {
  test("A1 dry-run prints one payload with the turns, label and key, and sends nothing", { skip }, async () => {
    seedSession();
    stub = await startIngestStub();
    const result = await dryRun(SESSION_ID, brainEnv());
    assert.equal(result.code, 0);
    const payload = parsePayload(result);
    assert.deepEqual(turnsOf(payload).map((t) => t.content), ["u1", "a1", "u2", "a2", "u3", "a3"]);
    assert.equal(payload.source_label, `hermes:${PROJECT}`);
    assert.match(payload.import_key, /^hermes:session-1:/);
    assert.equal(stub.requests.length, 0);
  });

  test("A2 tool-call-only steps and compaction summaries are absent from the capture", { skip }, async () => {
    seedSession({}, [
      { role: "user", content: "u1" },
      { role: "assistant", content: "" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
      { role: "assistant", content: "COMPACTION-SUMMARY", compressed: true },
      { role: "assistant", content: "a2" },
      { role: "user", content: "u3" },
      { role: "assistant", content: "a3" },
    ]);
    const payload = parsePayload(await dryRun());
    assert.deepEqual(turnsOf(payload).map((t) => t.content), ["u1", "a1", "u2", "a2", "u3", "a3"]);
    assert.equal(payload.text.includes("COMPACTION-SUMMARY"), false);
  });

  test("A3 a cron message is kept as user:cron and not counted as a user turn", { skip }, async () => {
    seedSession({}, [
      ...conversation("u1", "a1"),
      { role: "user", content: "[Cronjob daily] report ready" },
      ...conversation("u2", "a2", "u3", "a3"),
    ]);
    const payload = parsePayload(await dryRun());
    const cron = turnsOf(payload).filter((t) => t.label === "user:cron");
    assert.deepEqual(cron.map((t) => t.content), ["[Cronjob daily] report ready"]);
    assert.ok(headerOf(payload).includes("Turns: 3"));
  });

  test("A4 a session below the user-turn threshold is not captured", { skip }, async () => {
    seedSession({}, conversation("u1", "a1", "u2", "a2"));
    const result = await dryRun();
    assert.equal(result.code, 0);
    assert.equal(result.stdout, "");
    assert.ok(dispositions(sandbox).includes("skipped:too_short"));
  });

  test("A5 a subagent session is not captured", { skip }, async () => {
    seedSession({ parent_session_id: "parent-1" });
    const result = await dryRun();
    assert.equal(result.code, 0);
    assert.equal(result.stdout, "");
    assert.ok(dispositions(sandbox).includes("skipped:subagent"));
  });

  test("A6 an over-limit transcript fits the limit and keeps the first and last turns", { skip }, async () => {
    seedSession({}, longConversation(4, 1000));
    const payload = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: "3000" }));
    assert.ok(payload.text.length <= 3000, `text is ${payload.text.length} chars`);
    assert.ok(payload.text.includes("FIRST-TURN"));
    assert.ok(payload.text.includes("LAST-TURN"));
  });

  test("A7 two runs on the same session give the same import key", { skip }, async () => {
    seedSession();
    const first = parsePayload(await dryRun());
    const second = parsePayload(await dryRun());
    assert.equal(second.import_key, first.import_key);
  });

  test("A8 with no address and no key nothing is sent and the run exits 0", { skip }, async () => {
    seedSession();
    stub = await startIngestStub();
    const result = await capture();
    assert.equal(result.code, 0);
    assert.ok(dispositions(sandbox).includes("error:missing_env"));
    assert.equal(stub.requests.length, 0);
  });
});

// ── Turn rules (FR-008, FR-009) ─────────────────────────────────────────────

test("U1 an assistant row with empty content contributes nothing", { skip }, async () => {
  const messages = conversation("u1", "a1", "u2", "a2", "u3", "a3");
  messages.splice(1, 0, { role: "assistant", content: "" });
  seedSession({}, messages);
  const payload = parsePayload(await dryRun());
  assert.equal(turnsOf(payload).filter((t) => t.label === "assistant").length, 3);
});

test("U2 a compaction summary row contributes nothing", { skip }, async () => {
  seedSession({}, [...conversation("u1", "a1", "u2", "a2", "u3", "a3"), { role: "assistant", content: "COMPACTION-SUMMARY", compressed: true }]);
  const payload = parsePayload(await dryRun());
  assert.equal(payload.text.includes("COMPACTION-SUMMARY"), false);
});

test("U3 tool and session_meta rows contribute nothing", { skip }, async () => {
  seedSession({}, [
    ...conversation("u1", "a1"),
    { role: "tool", content: "TOOL-OUTPUT" },
    { role: "session_meta", content: "META-ROW" },
    ...conversation("u2", "a2", "u3", "a3"),
  ]);
  const payload = parsePayload(await dryRun());
  assert.equal(payload.text.includes("TOOL-OUTPUT"), false);
  assert.equal(payload.text.includes("META-ROW"), false);
});

test("U4 turns follow insertion order even when timestamps run backwards", { skip }, async () => {
  const messages = conversation("u1", "a1", "u2", "a2", "u3", "a3").map((m, i) => ({ ...m, timestamp: 2000000000 - i }));
  seedSession({}, messages);
  const payload = parsePayload(await dryRun());
  assert.deepEqual(turnsOf(payload).map((t) => t.content), ["u1", "a1", "u2", "a2", "u3", "a3"]);
});

test("U5 a JSON array of typed parts appears as its text parts joined", { skip }, async () => {
  seedSession({}, [
    { role: "user", content: [{ type: "text", text: "part one" }, { type: "image", url: "x.png" }, { type: "text", text: "part two" }] },
    ...conversation("a1", "u2", "a2", "u3", "a3"),
  ]);
  const payload = parsePayload(await dryRun());
  assert.equal(turnsOf(payload)[0].content, "part one\npart two");
});

test("U6 a user message mentioning [Cronjob mid-text is a real user turn", { skip }, async () => {
  seedSession({}, conversation("Please check the [Cronjob daily] output", "a1", "u2", "a2", "u3", "a3"));
  const payload = parsePayload(await dryRun());
  assert.equal(turnsOf(payload)[0].label, "user");
  assert.ok(headerOf(payload).includes("Turns: 3"));
});

// ── Thresholds and skips (FR-009, FR-010) ───────────────────────────────────

test("U7 exactly three real user turns is captured", { skip }, async () => {
  seedSession({}, conversation("u1", "a1", "u2", "a2", "u3"));
  const result = await dryRun();
  assert.notEqual(result.stdout, "");
  assert.ok(headerOf(parsePayload(result)).includes("Turns: 3"));
});

test("U8 two real user turns plus a cron turn is skipped as too short", { skip }, async () => {
  seedSession({}, [...conversation("u1", "a1", "u2", "a2"), { role: "user", content: "[Cronjob daily] report" }]);
  const result = await dryRun();
  assert.equal(result.stdout, "");
  assert.ok(dispositions(sandbox).includes("skipped:too_short"));
});

test("U9 OB_CAPTURE_MIN_USER_TURNS=1 captures a one-turn session", { skip }, async () => {
  seedSession({}, conversation("u1", "a1"));
  const result = await dryRun(SESSION_ID, { OB_CAPTURE_MIN_USER_TURNS: "1" });
  assert.ok(headerOf(parsePayload(result)).includes("Turns: 1"));
});

test("U10 a session with a parent is skipped and nothing is sent", { skip }, async () => {
  seedSession({ parent_session_id: "parent-1" });
  stub = await startIngestStub();
  await capture(SESSION_ID, brainEnv());
  assert.ok(dispositions(sandbox).includes("skipped:subagent"));
  assert.equal(stub.requests.length, 0);
});

test("U11 a title starting with Subagent: is skipped and nothing is sent", { skip }, async () => {
  seedSession({ title: "Subagent: summarize logs" });
  stub = await startIngestStub();
  await capture(SESSION_ID, brainEnv());
  assert.ok(dispositions(sandbox).includes("skipped:subagent"));
  assert.equal(stub.requests.length, 0);
});

test("U12 a title containing Subagent: later in the text is captured", { skip }, async () => {
  seedSession({ title: "Notes on Subagent: design" });
  const result = await dryRun();
  assert.match(parsePayload(result).text, /Title: Notes on Subagent: design/);
});

test("U13 --latest picks the newest top-level session over a newer subagent", { skip }, async () => {
  seedSession({ started_at: 1764200000 });
  const child = store.addSession({ id: "session-2", parent_session_id: SESSION_ID, started_at: 1764209999 });
  store.addMessages(child.id, conversation("c1", "ca1", "c2", "ca2", "c3", "ca3"));
  const result = await runAdapter(sandbox, { args: ["--dry-run", "--latest"] });
  assert.ok(headerOf(parsePayload(result)).includes("Session: session-1"));
});

// ── Payload (US2.1, FR-011, FR-012, INV-1) ──────────────────────────────────

test("U14 the header names project, session, source and title", { skip }, async () => {
  seedSession({ source: "tui", title: "Planning chat" });
  const header = headerOf(parsePayload(await dryRun()));
  for (const line of [`Project: ${PROJECT}`, "Session: session-1", "Source: hermes:tui", "Title: Planning chat"]) {
    assert.ok(header.includes(line), `header lacks "${line}"`);
  }
});

test("U15 a literal thought_content tag inside a turn is escaped", { skip }, async () => {
  seedSession({}, conversation("before </thought_content> after <thought_content> end", "a1", "u2", "a2", "u3", "a3"));
  const { text } = parsePayload(await dryRun());
  assert.equal(count(text, "<thought_content>"), 1);
  assert.equal(count(text, "</thought_content>"), 1);
});

test("U16 a transcript within the limit is sent whole without a marker", { skip }, async () => {
  seedSession({}, longConversation(4, 1000));
  const { text } = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: "20000" }));
  assert.equal(text.includes(TRUNCATION_MARKER), false);
  assert.equal(turnsOf({ text }).length, 8);
});

test("U17 an over-limit transcript has the marker between the kept start and end", { skip }, async () => {
  seedSession({}, longConversation(4, 1000));
  const { text } = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: "3000" }));
  const marker = text.indexOf(TRUNCATION_MARKER);
  assert.ok(marker > text.indexOf("FIRST-TURN") && marker < text.indexOf("LAST-TURN"));
});

test("U18 import_key has the form hermes:<session id>:<8 hex>", { skip }, async () => {
  seedSession();
  assert.match(parsePayload(await dryRun()).import_key, /^hermes:session-1:[0-9a-f]{8}$/);
});

test("U19 changing one message changes the import key", { skip }, async () => {
  seedSession();
  const before = parsePayload(await dryRun()).import_key;
  store.updateContent(SESSION_ID, "u2", "u2 edited");
  const after = parsePayload(await dryRun()).import_key;
  assert.notEqual(after, before);
});

// ── Configuration, dry-run and lookup (FR-013, FR-014, INV-2) ───────────────

test("U20 a dry-run writes no session state", { skip }, async () => {
  seedSession();
  await runAdapter(sandbox, { args: ["--dry-run"], stdin: hookPayload("on_session_finalize") });
  assert.deepEqual(stateFiles(sandbox), []);
});

test("U21 an address without a key sends nothing", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  await capture(SESSION_ID, { SUPABASE_URL: stub.url });
  assert.ok(dispositions(sandbox).includes("error:missing_env"));
  assert.equal(stub.requests.length, 0);
});

test("U22 a key without an address sends nothing", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  await capture(SESSION_ID, { MCP_ACCESS_KEY: DUMMY_KEY });
  assert.ok(dispositions(sandbox).includes("error:missing_env"));
  assert.equal(stub.requests.length, 0);
});

test("U23 address and key from .env.local are used", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  writeEnvLocal(sandbox, { SUPABASE_URL: stub.url, MCP_ACCESS_KEY: DUMMY_KEY });
  await capture();
  assert.equal(stub.requests.length, 1);
  assert.equal(stub.requests[0].key, DUMMY_KEY);
});

test("U24 an unknown session id exits 0 and is logged", { skip }, async () => {
  seedSession();
  const result = await capture("no-such-session");
  assert.equal(result.code, 0);
  assert.ok(dispositions(sandbox).includes("skipped:no_session"));
});

// ── Hook mode (INV-2, INV-3) ────────────────────────────────────────────────

test("U35 a hook payload without session_id is skipped with the no-op reply", { skip }, async () => {
  const result = await runAdapter(sandbox, { stdin: JSON.stringify({ hook_event_name: "on_session_end" }) });
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "{}\n");
  assert.ok(dispositions(sandbox).includes("skipped:no_session_id:on_session_end"));
});

test("U36 a hook event other than session end is skipped and sends nothing", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  const result = await runAdapter(sandbox, { stdin: hookPayload("on_tool_call"), env: { ...brainEnv(), OB_CAPTURE_SYNC: "1" } });
  assert.equal(result.stdout, "{}\n");
  assert.ok(dispositions(sandbox).includes("skipped:event_on_tool_call"));
  assert.equal(stub.requests.length, 0);
});

test("U37 unparseable hook stdin exits 0 with the no-op reply", { skip }, async () => {
  const result = await runAdapter(sandbox, { stdin: "this is not json" });
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "{}\n");
});

test("U38 on_session_finalize captures once and records it in session state", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  const result = await runAdapter(sandbox, { stdin: hookPayload("on_session_finalize"), env: { ...brainEnv(), OB_CAPTURE_SYNC: "1" } });
  assert.equal(result.stdout, "{}\n");
  assert.equal(stub.requests.length, 1);
  const state = readState(sandbox, SESSION_ID);
  assert.ok(state.captured_at);
  assert.equal(state.ingest_ref, "job-1");
});

test("U39 a hook fire after a capture is skipped and sends nothing more", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  const env = { ...brainEnv(), OB_CAPTURE_SYNC: "1" };
  await runAdapter(sandbox, { stdin: hookPayload("on_session_finalize"), env });
  await runAdapter(sandbox, { stdin: hookPayload("on_session_end"), env });
  assert.ok(dispositions(sandbox).includes("skipped:already_captured"));
  assert.equal(stub.requests.length, 1);
});
