/**
 * run-adapter.mjs — runs capture-hermes-session.mjs as a child process in a
 * sandbox, and provides a loopback stand-in for the Open Brain ingest endpoint.
 *
 * The child gets a constructed environment (PATH, a temp HOME, the sandbox's
 * HERMES_HOME and OB_CAPTURE_ROOT, plus what the test passes). Nothing comes
 * from the developer's shell, so a real SUPABASE_URL / MCP_ACCESS_KEY can never
 * leak into a test run.
 */

import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ADAPTER = fileURLToPath(new URL("../capture-hermes-session.mjs", import.meta.url));
export const DUMMY_KEY = "test-key-not-real";
export const INGEST_PATH = "/functions/v1/open-brain-rest/ingest";

// ── Sandbox ─────────────────────────────────────────────────────────────────

export function makeSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ob-hermes-test-"));
  const sandbox = {
    root,
    home: path.join(root, "home"),
    hermesHome: path.join(root, "hermes"),
    captureRoot: path.join(root, "capture"),
    get dbPath() {
      return path.join(this.hermesHome, "state.db");
    },
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
  for (const dir of [sandbox.home, sandbox.hermesHome, sandbox.captureRoot]) fs.mkdirSync(dir, { recursive: true });
  return sandbox;
}

export function writeEnvLocal(sandbox, vars) {
  const body = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  fs.writeFileSync(path.join(sandbox.captureRoot, ".env.local"), body);
}

// ── Running the adapter ─────────────────────────────────────────────────────

/** Resolves with { code, stdout, stderr }. stdin: a string (hook payload) or undefined (closed). */
export function runAdapter(sandbox, { args = [], stdin, env = {}, timeoutMs = 20000 } = {}) {
  const childEnv = {
    PATH: process.env.PATH,
    HOME: sandbox.home,
    HERMES_HOME: sandbox.hermesHome,
    OB_CAPTURE_ROOT: sandbox.captureRoot,
    ...env,
  };
  for (const [k, v] of Object.entries(childEnv)) if (v === undefined) delete childEnv[k];

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ADAPTER, ...args], {
      cwd: sandbox.root,
      env: childEnv,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`adapter did not exit within ${timeoutMs} ms`));
    }, timeoutMs);
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(stdin ?? "");
  });
}

/** The dry-run payload printed on stdout, parsed. */
export function parsePayload(result) {
  if (!result.stdout.trim()) throw new Error(`no payload printed (exit ${result.code}); stderr: ${result.stderr.trim() || "(empty)"}`);
  return JSON.parse(result.stdout);
}

// ── Reading what the adapter left behind ────────────────────────────────────

export function logLines(sandbox) {
  const file = path.join(sandbox.captureRoot, "logs", "ambient-capture-hermes.log");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean) : [];
}

/** The `disposition=` value of every log line, in order. */
export function dispositions(sandbox) {
  return logLines(sandbox).map((line) => line.slice(line.indexOf("disposition=") + "disposition=".length));
}

export function readState(sandbox, sessionId) {
  const file = path.join(sandbox.captureRoot, "state", "sessions", `${sessionId.replace(/[^a-zA-Z0-9_.-]/g, "_")}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function stateFiles(sandbox) {
  const dir = path.join(sandbox.captureRoot, "state", "sessions");
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

function queueDir(sandbox, dead = false) {
  const dir = path.join(sandbox.captureRoot, "data", "capture-retry-queue");
  return dead ? path.join(dir, "dead") : dir;
}

/** Queue entries (parsed), oldest first. dead: read dead/ instead. */
export function queueEntries(sandbox, { dead = false } = {}) {
  const dir = queueDir(sandbox, dead);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

/** Queue file names (not parsed, so unreadable entries show too), sorted. dead: list dead/ instead. */
export function queueFiles(sandbox, { dead = false } = {}) {
  const dir = queueDir(sandbox, dead);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];
}

/**
 * Pre-load a retry queue entry, as an earlier failed run would have left it.
 * entry: an object (written as JSON) or a string (written as is, e.g. a corrupt file).
 */
export function seedQueueEntry(sandbox, fileName, entry) {
  const dir = queueDir(sandbox);
  fs.mkdirSync(path.join(dir, "dead"), { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), typeof entry === "string" ? entry : JSON.stringify(entry, null, 2));
}

// ── Loopback ingest stand-in ────────────────────────────────────────────────

/**
 * Starts an HTTP server on 127.0.0.1. responses: [{ status, body }] answered in
 * order; the last one repeats. body may be an object (sent as JSON) or a string.
 * Resolves with { url, requests, close() }; requests: [{ method, path, key, body }].
 */
export async function startIngestStub(responses = [{ status: 200, body: { job_id: "job-1" } }]) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      let body = raw;
      try {
        body = JSON.parse(raw);
      } catch {
        // keep the raw text
      }
      requests.push({ method: req.method, path: req.url, key: req.headers["x-brain-key"], body });
      const answer = responses[Math.min(requests.length - 1, responses.length - 1)];
      const text = typeof answer.body === "string" ? answer.body : JSON.stringify(answer.body ?? {});
      res.writeHead(answer.status, { "content-type": typeof answer.body === "string" ? "text/plain" : "application/json" });
      res.end(text);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** A loopback URL with nothing listening on it. */
export async function closedPortUrl() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return `http://127.0.0.1:${port}`;
}

/** Polls fn until it returns truthy, or fails after timeoutMs. */
export async function waitFor(fn, { timeoutMs = 5000, intervalMs = 50, what = "condition" } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = fn();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out after ${timeoutMs} ms waiting for ${what}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
