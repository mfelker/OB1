/**
 * hermes-store.mjs — builds a synthetic Hermes `state.db` for the tests.
 *
 * Only the columns capture-hermes-session.mjs reads are created (see SKILL.md,
 * "Hermes writes no transcript files"). Nothing binary is committed: each test
 * builds its own store in a temporary directory.
 *
 * Uses node:sqlite when present (Node 22.5+), else the sqlite3 CLI. When
 * neither exists, sqliteSupport() says why, so the suite can skip visibly.
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const SCHEMA = `
CREATE TABLE sessions (
  id TEXT PRIMARY KEY, source TEXT, created_source TEXT, profile_name TEXT,
  parent_session_id TEXT, title TEXT, model TEXT, cwd TEXT, git_branch TEXT,
  started_at REAL, ended_at REAL, end_reason TEXT, message_count INTEGER,
  last_activity_at REAL
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, role TEXT,
  content TEXT, timestamp REAL, _compressed_summary INTEGER DEFAULT 0
);`;

export const DEFAULT_STARTED_AT = 1764200000; // 2025-11-26T23:33:20Z

let nodeSqlite;
function loadNodeSqlite() {
  if (nodeSqlite === undefined) {
    try {
      nodeSqlite = require("node:sqlite");
    } catch {
      nodeSqlite = null;
    }
  }
  return nodeSqlite;
}

function cliAvailable() {
  try {
    execFileSync("sqlite3", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** { ok, via, reason } — which driver builds the fixtures, or why none can. */
export function sqliteSupport() {
  if (loadNodeSqlite()) return { ok: true, via: "node:sqlite" };
  if (cliAvailable()) return { ok: true, via: "sqlite3 CLI" };
  return { ok: false, reason: "neither node:sqlite (Node 22.5+) nor the sqlite3 CLI is available to build the Hermes fixture" };
}

function literal(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function execSql(dbPath, sql) {
  const mod = loadNodeSqlite();
  if (mod) {
    const db = new mod.DatabaseSync(dbPath);
    try {
      db.exec(sql);
    } finally {
      db.close();
    }
    return;
  }
  execFileSync("sqlite3", [dbPath], { input: sql, stdio: ["pipe", "ignore", "pipe"] });
}

/**
 * Create an empty store at dbPath and return helpers to fill it.
 * Messages get increasing ids in insertion order; timestamps default to
 * started_at + position but can be set per message.
 */
export function createStore(dbPath) {
  execSql(dbPath, SCHEMA);

  return {
    path: dbPath,

    addSession(fields = {}) {
      const row = {
        id: "session-1",
        source: "cli",
        created_source: null,
        profile_name: null,
        parent_session_id: null,
        title: "Demo session",
        model: null,
        cwd: "/work/demo-project",
        git_branch: null,
        started_at: DEFAULT_STARTED_AT,
        ended_at: null,
        end_reason: null,
        message_count: 0,
        last_activity_at: null,
        ...fields,
      };
      if (row.last_activity_at === null) row.last_activity_at = row.started_at;
      const cols = Object.keys(row);
      execSql(dbPath, `INSERT INTO sessions (${cols.join(", ")}) VALUES (${cols.map((c) => literal(row[c])).join(", ")});`);
      return row;
    },

    /** messages: [{ role, content, timestamp?, compressed? }] — content may be a string or an array (stored as JSON). */
    addMessages(sessionId, messages, { startedAt = DEFAULT_STARTED_AT } = {}) {
      const statements = messages.map((m, i) => {
        const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        const timestamp = m.timestamp ?? startedAt + i + 1;
        return `INSERT INTO messages (session_id, role, content, timestamp, _compressed_summary) VALUES (${literal(sessionId)}, ${literal(m.role)}, ${literal(content)}, ${literal(timestamp)}, ${m.compressed ? 1 : 0});`;
      });
      if (statements.length) execSql(dbPath, statements.join("\n"));
    },

    /** Change one message's content (matched by session and exact old content). */
    updateContent(sessionId, oldContent, newContent) {
      execSql(dbPath, `UPDATE messages SET content = ${literal(newContent)} WHERE session_id = ${literal(sessionId)} AND content = ${literal(oldContent)};`);
    },
  };
}
