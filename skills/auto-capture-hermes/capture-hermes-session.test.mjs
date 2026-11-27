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
  queueFiles,
  seedQueueEntry,
  writeEnvLocal,
  startIngestStub,
  closedPortUrl,
  waitFor,
} from "./test-support/run-adapter.mjs";

const support = sqliteSupport();
const skip = support.ok ? false : support.reason;

const SESSION_ID = "session-1";
const JOB_ID = "job-hermes-1"; // the id the accepting stand-in returns
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

/** A stand-in that accepts every capture and answers with JOB_ID. */
function acceptingStub() {
  return startIngestStub([{ status: 200, body: { job_id: JOB_ID } }]);
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

// The script's marker wording is not part of any contract (data-model: "a marker"),
// so match it loosely. No fixture text contains "truncated".
const TRUNCATION_MARKER = /truncated/i;

// The long fixture: LONG_PAIRS user/assistant pairs of LONG_TURN_CHARS each.
const LONG_PAIRS = 4;
const LONG_TURN_CHARS = 1000;
const LONG_TURN_TEXT_CHARS = LONG_PAIRS * 2 * LONG_TURN_CHARS; // turn text only; header and labels add a few hundred
// Half the turn text: certainly over the limit. Two and a half times: certainly under.
// The exact boundary is pinned separately by U41.
const LIMIT_OVER_LONG = String(LONG_TURN_TEXT_CHARS / 2);
const LIMIT_UNDER_LONG = String(LONG_TURN_TEXT_CHARS * 2.5);

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
    seedSession({}, longConversation(LONG_PAIRS, LONG_TURN_CHARS));
    const payload = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: LIMIT_OVER_LONG }));
    assert.ok(payload.text.length <= Number(LIMIT_OVER_LONG), `text is ${payload.text.length} chars`);
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
    const result = await capture();
    assert.equal(result.code, 0);
    // The child has no address, so it could never reach the stand-in. "Nothing is
    // sent" is shown instead by the run stopping at the config check: a single log
    // line, and no delivery attempt left in the retry queue.
    assert.deepEqual(dispositions(sandbox), ["error:missing_env"]);
    assert.deepEqual(queueEntries(sandbox), []);
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
  // Two top-level sessions (older, newer) and a subagent newer than both:
  // the newer top-level one must win, so both "newest" and "not a subagent" can fail.
  seedSession({ started_at: 1764200000 });
  const newer = store.addSession({ id: "session-3", cwd: `/work/${PROJECT}`, started_at: 1764205000 });
  store.addMessages(newer.id, conversation("n1", "na1", "n2", "na2", "n3", "na3"));
  const child = store.addSession({ id: "session-2", parent_session_id: newer.id, started_at: 1764209999 });
  store.addMessages(child.id, conversation("c1", "ca1", "c2", "ca2", "c3", "ca3"));
  const result = await runAdapter(sandbox, { args: ["--dry-run", "--latest"] });
  const header = headerOf(parsePayload(result));
  assert.equal(header.find((line) => line.startsWith("Session: ")), "Session: session-3");
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
  const messages = longConversation(LONG_PAIRS, LONG_TURN_CHARS);
  seedSession({}, messages);
  const { text } = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: LIMIT_UNDER_LONG }));
  assert.deepEqual(turnsOf({ text }).map((t) => t.content), messages.map((m) => m.content));
  assert.equal(TRUNCATION_MARKER.test(text), false);
});

test("U17 an over-limit transcript has the marker between the kept start and end", { skip }, async () => {
  seedSession({}, longConversation(LONG_PAIRS, LONG_TURN_CHARS));
  const { text } = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: LIMIT_OVER_LONG }));
  const first = text.indexOf("FIRST-TURN");
  const marker = text.search(TRUNCATION_MARKER);
  const last = text.indexOf("LAST-TURN");
  assert.ok(first >= 0, "the first turn is kept");
  assert.ok(last >= 0, "the last turn is kept");
  assert.ok(marker > first, "the marker comes after the first turn");
  assert.ok(marker < last, "the marker comes before the last turn");
});

test("U41 a transcript one character under the limit is sent whole and one character over is trimmed to fit", { skip }, async () => {
  seedSession({}, longConversation(LONG_PAIRS, LONG_TURN_CHARS));
  // Measure the full capture once, with a limit far above it, then put the limit
  // one character either side of that size.
  const fullLength = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: "100000" })).text.length;

  const under = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: String(fullLength + 1) })).text;
  assert.equal(under.length, fullLength, "one character under the limit: sent whole");
  assert.equal(TRUNCATION_MARKER.test(under), false, "one character under the limit: no marker");

  const over = parsePayload(await dryRun(SESSION_ID, { OB_CAPTURE_MAX_CHARS: String(fullLength - 1) })).text;
  assert.ok(over.length <= fullLength - 1, `one character over the limit: ${over.length} chars exceeds ${fullLength - 1}`);
  assert.equal(TRUNCATION_MARKER.test(over), true, "one character over the limit: marker present");
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
  await capture(SESSION_ID, { MCP_ACCESS_KEY: DUMMY_KEY });
  // No address reaches the child, so assert that no delivery was attempted (see A8).
  assert.deepEqual(dispositions(sandbox), ["error:missing_env"]);
  assert.deepEqual(queueEntries(sandbox), []);
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
  stub = await acceptingStub();
  const before = Date.now();
  const result = await runAdapter(sandbox, { stdin: hookPayload("on_session_finalize"), env: { ...brainEnv(), OB_CAPTURE_SYNC: "1" } });
  const after = Date.now();
  assert.equal(result.stdout, "{}\n");
  assert.equal(stub.requests.length, 1);
  const state = readState(sandbox, SESSION_ID);
  // captured_at is the ISO-8601 time of this capture, not just any truthy value.
  assert.match(state.captured_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  const capturedAt = Date.parse(state.captured_at);
  assert.ok(capturedAt >= before && capturedAt <= after, `captured_at ${state.captured_at} is outside this run`);
  assert.equal(state.ingest_ref, JOB_ID);
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

// ── US3 acceptance: delivery (spec US3.1–US3.3) ─────────────────────────────

function seedSecondSession(id = "session-2") {
  store.addSession({ id, cwd: `/work/${PROJECT}` });
  store.addMessages(id, conversation("v1", "b1", "v2", "b2", "v3", "b3"));
}

function queuedEntry(key, attempts = 1) {
  return { payload: { text: `queued ${key}`, import_key: key }, failed_at: "2026-11-27T00:00:00.000Z", error: "HTTP 503", attempt_count: attempts };
}

describe("acceptance", () => {
  test("A9 a successful capture sends one request with the key and the dry-run payload", { skip }, async () => {
    seedSession();
    const expected = parsePayload(await dryRun());
    stub = await acceptingStub();
    await capture(SESSION_ID, brainEnv());
    assert.equal(stub.requests.length, 1);
    const [request] = stub.requests;
    assert.equal(request.method, "POST");
    assert.equal(request.path, INGEST_PATH);
    assert.equal(request.key, DUMMY_KEY);
    assert.deepEqual(request.body, expected);
    // The dry run above logged its own line first; the capture's line is the last one.
    assert.equal(dispositions(sandbox).at(-1), `captured:${JOB_ID}`);
  });

  test("A10 a temporary failure is queued and resent before the next capture", { skip }, async () => {
    seedSession();
    seedSecondSession();
    stub = await startIngestStub([{ status: 503, body: { error: "unavailable" } }]);
    await capture(SESSION_ID, brainEnv());
    const [queued] = queueEntries(sandbox);
    assert.ok(queued, "nothing was queued");
    await stub.close();
    stub = await startIngestStub();
    await capture("session-2", brainEnv());
    assert.equal(stub.requests.length, 2);
    assert.equal(stub.requests[0].body.import_key, queued.payload.import_key);
    assert.match(stub.requests[1].body.import_key, /^hermes:session-2:/);
    assert.deepEqual(queueEntries(sandbox), []);
  });

  test("A11 a permanent failure is not queued and is logged as permanent", { skip }, async () => {
    seedSession();
    stub = await startIngestStub([{ status: 401, body: { error: "bad key" } }]);
    await capture(SESSION_ID, brainEnv());
    assert.deepEqual(queueEntries(sandbox), []);
    // Contract form: error:HTTP <status>…:permanent (the body in between is not pinned).
    const logged = dispositions(sandbox);
    assert.equal(logged.length, 1, `expected one log line, got ${JSON.stringify(logged)}`);
    assert.match(logged[0], /^error:HTTP 401:.*:permanent$/);
  });
});

// ── Delivery and retry queue (US3.1, FR-015, INV-2) ─────────────────────────

test("U25 an address with a trailing slash still posts to the ingest path", { skip }, async () => {
  seedSession();
  stub = await startIngestStub();
  await capture(SESSION_ID, brainEnv(`${stub.url}/`));
  assert.equal(stub.requests[0]?.path, INGEST_PATH);
});

test("U26 a 2xx answer with a non-JSON body is logged captured:unknown", { skip }, async () => {
  seedSession();
  stub = await startIngestStub([{ status: 200, body: "ok" }]);
  await capture(SESSION_ID, brainEnv());
  assert.ok(dispositions(sandbox).includes("captured:unknown"));
});

for (const [id, status] of [["U27", 429], ["U28", 500]]) {
  test(`${id} a ${status} answer queues the payload`, { skip }, async () => {
    seedSession();
    stub = await startIngestStub([{ status, body: {} }]);
    await capture(SESSION_ID, brainEnv());
    assert.equal(queueEntries(sandbox).length, 1);
  });
}

test("U29 a 400 answer is not queued and is logged as permanent", { skip }, async () => {
  seedSession();
  stub = await startIngestStub([{ status: 400, body: { error: "bad payload" } }]);
  await capture(SESSION_ID, brainEnv());
  assert.deepEqual(queueEntries(sandbox), []);
  const logged = dispositions(sandbox);
  assert.equal(logged.length, 1, `expected one log line, got ${JSON.stringify(logged)}`);
  assert.match(logged[0], /^error:HTTP 400:.*:permanent$/);
});

test("U30 a refused connection exits 0 and queues the payload", { skip }, async () => {
  seedSession();
  const result = await capture(SESSION_ID, brainEnv(await closedPortUrl()));
  assert.equal(result.code, 0);
  assert.equal(queueEntries(sandbox).length, 1);
});

test("U31 a queued entry failing a fourth time stays queued with attempt_count 4", { skip }, async () => {
  seedSession();
  seedQueueEntry(sandbox, "1-old.json", queuedEntry("k-old", 3));
  stub = await startIngestStub([{ status: 503, body: {} }]);
  await capture(SESSION_ID, brainEnv());
  const old = queueEntries(sandbox).find((e) => e.file === "1-old.json");
  assert.equal(old?.attempt_count, 4);
});

test("U32 a queued entry failing a fifth time moves to dead/", { skip }, async () => {
  seedSession();
  seedQueueEntry(sandbox, "1-old.json", queuedEntry("k-old", 4));
  stub = await startIngestStub([{ status: 503, body: {} }]);
  await capture(SESSION_ID, brainEnv());
  assert.equal(queueEntries(sandbox).some((e) => e.file === "1-old.json"), false);
  assert.deepEqual(queueEntries(sandbox, { dead: true }).map((e) => e.file), ["1-old.json"]);
});

test("U33 a queued entry answered with 401 moves to dead/", { skip }, async () => {
  seedSession();
  seedQueueEntry(sandbox, "1-old.json", queuedEntry("k-old", 1));
  stub = await startIngestStub([{ status: 401, body: {} }]);
  await capture(SESSION_ID, brainEnv());
  assert.deepEqual(queueEntries(sandbox, { dead: true }).map((e) => e.file), ["1-old.json"]);
});

test("U34 one run resends the three oldest queued entries and keeps the newest", { skip }, async () => {
  seedSession();
  for (const name of ["1-a", "2-b", "3-c", "4-d"]) seedQueueEntry(sandbox, `${name}.json`, queuedEntry(`k-${name}`));
  stub = await startIngestStub();
  await capture(SESSION_ID, brainEnv());
  assert.deepEqual(stub.requests.slice(0, 3).map((r) => r.body.import_key), ["k-1-a", "k-2-b", "k-3-c"]);
  assert.deepEqual(queueEntries(sandbox).map((e) => e.file), ["4-d.json"]);
});

test("U42 an unreadable queue entry moves to dead/ and the valid entries behind it are still resent", { skip }, async () => {
  seedSession();
  // "1-a" sorts first. Left in the queue it would take a retry slot on every run.
  seedQueueEntry(sandbox, "1-a.json", "{ this is not json");
  for (const name of ["2-b", "3-c", "4-d"]) seedQueueEntry(sandbox, `${name}.json`, queuedEntry(`k-${name}`));
  stub = await startIngestStub();
  await capture(SESSION_ID, brainEnv());
  assert.deepEqual(queueFiles(sandbox, { dead: true }), ["1-a.json"]);
  assert.deepEqual(stub.requests.slice(0, 2).map((r) => r.body.import_key), ["k-2-b", "k-3-c"]);
  assert.deepEqual(queueFiles(sandbox), ["4-d.json"]);
});

// ── Debounce (INV-3, research R8) ───────────────────────────────────────────

test("U40 two quick on_session_end fires are captured once", { skip }, async () => {
  seedSession();
  stub = await acceptingStub();
  // Timing margin: the second fire must replace the first fire's token before the
  // first worker wakes. Two Node start-ups take about 150 ms, so a 1000 ms debounce
  // leaves a wide margin (research R8). The wait allows the second worker's full
  // debounce plus its capture.
  const DEBOUNCE_MS = 1000;
  const env = { ...brainEnv(), OB_CAPTURE_DEBOUNCE_MS: String(DEBOUNCE_MS) };
  await runAdapter(sandbox, { stdin: hookPayload("on_session_end"), env });
  await runAdapter(sandbox, { stdin: hookPayload("on_session_end"), env });
  await waitFor(() => {
    const d = dispositions(sandbox);
    return d.includes("skipped:superseded") && d.includes(`captured:${JOB_ID}`);
  }, { timeoutMs: DEBOUNCE_MS * 5, what: "one superseded worker and one capture" });
  assert.equal(stub.requests.length, 1);
});
