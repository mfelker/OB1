/**
 * harness.mjs: test harness for recipes/self-hosted-supabase-mcp.
 *
 * Everything the recipe talks to from the outside is replaced at test time:
 * - a temporary git checkout holding a copy of this recipe folder and a marker
 *   for integrations/self-hosted-llm-mcp;
 * - a PATH made of a small set of POSIX tools plus stub `git`, `docker` and
 *   (for the bucket script) `curl`;
 * - a stand-in for the Supabase clone: a `.env.example` with placeholder
 *   values and a stub `utils/generate-keys.sh` that edits `.env` in its working
 *   directory the way Supabase's script does.
 *
 * The stand-ins are written here, never copied from Supabase's files. No test
 * uses the network or a real key.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, symlinkSync, chmodSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const RECIPE_DIR = fileURLToPath(new URL("../..", import.meta.url));
export const RECIPE_REL = "recipes/self-hosted-supabase-mcp";
export const PIN = "self-hosted/v0.8.5";
export const TESTED_COMPOSE = "v5.6.1";

/** Keys Supabase's generate-keys.sh writes (research R6). */
export const SUPABASE_KEYS = [
  "JWT_SECRET", "ANON_KEY", "SERVICE_ROLE_KEY", "SECRET_KEY_BASE", "REALTIME_DB_ENC_KEY",
  "VAULT_ENC_KEY", "PG_META_CRYPTO_KEY", "LOGFLARE_PUBLIC_ACCESS_TOKEN",
  "LOGFLARE_PRIVATE_ACCESS_TOKEN", "S3_PROTOCOL_ACCESS_KEY_ID", "S3_PROTOCOL_ACCESS_KEY_SECRET",
  "MINIO_ROOT_PASSWORD", "POSTGRES_PASSWORD", "DASHBOARD_PASSWORD",
];
export const MODEL_SETTINGS = [
  "EMBEDDING_API_BASE", "EMBEDDING_API_KEY", "EMBEDDING_MODEL",
  "CHAT_API_BASE", "CHAT_API_KEY", "CHAT_MODEL", "FETCH_TIMEOUT_MS",
];

/** Placeholder value a stand-in `.env.example` holds for a key. */
export const examplePlaceholder = (key) => `example-placeholder-${key.toLowerCase()}`;

/** Contents of the stand-in `.env.example`. */
export function fixtureEnvExample() {
  const lines = ["# stand-in for Supabase's .env.example (test fixture)", "DASHBOARD_USERNAME=supabase"];
  for (const k of SUPABASE_KEYS) lines.push(`${k}=${examplePlaceholder(k)}`);
  lines.push("SUPABASE_PUBLISHABLE_KEY=", "KONG_HTTP_PORT=8000", "");
  return lines.join("\n");
}

/**
 * Stand-in generate-keys.sh. With --update-env it replaces every Supabase key
 * in ./.env (its working directory) with fresh hex from openssl, printing each
 * KEY=value line as Supabase's script does. When
 * STUB_GENKEYS_FAIL=1 it writes one key and then fails, like an interrupted run, naming the
 * folder it ran in (so a test can see where setup built the new .env).
 */
function fixtureGenerateKeys() {
  const keys = SUPABASE_KEYS.join(" ");
  return `#!/bin/sh
set -e
[ "$1" = "--update-env" ] || { echo "stub: expected --update-env" >&2; exit 2; }
[ -f .env ] || { echo "stub: no .env in $(pwd)" >&2; exit 2; }
cp .env .env.old
for k in ${keys}; do
  v=$(openssl rand -hex 16)
  echo "$k=$v"
  sed "s|^$k=.*|$k=$v|" .env > .env.tmp && mv .env.tmp .env
  if [ "\${STUB_GENKEYS_FAIL:-0}" = 1 ]; then echo "stub: generate-keys failed in $(pwd)" >&2; exit 1; fi
done
echo "Updating .env..."
`;
}

/** Build the stand-in clone at `<dest>`: supabase/docker with .env.example and utils/generate-keys.sh. */
export function writeFixtureClone(dest, { composeFile } = {}) {
  const docker = join(dest, "docker");
  mkdirSync(join(docker, "utils"), { recursive: true });
  writeFileSync(join(docker, ".env.example"), fixtureEnvExample());
  writeFileSync(join(docker, "utils", "generate-keys.sh"), fixtureGenerateKeys());
  chmodSync(join(docker, "utils", "generate-keys.sh"), 0o755);
  const compose = composeFile ?? fileURLToPath(new URL("../fixtures/compose/docker-compose.yml", import.meta.url));
  cpSync(compose, join(docker, "docker-compose.yml"));
  mkdirSync(join(dest, ".git"), { recursive: true });
}

const POSIX_TOOLS = [
  "sh", "cat", "sed", "grep", "mkdir", "cp", "mv", "rm", "mktemp", "printf", "tr", "head", "tail",
  "cut", "awk", "date", "od", "chmod", "ls", "dirname", "basename", "env", "uname", "tee", "wc",
  "test", "[", "expr", "sort", "uniq", "touch", "cmp", "find", "xargs", "sleep", "true", "false", "rmdir",
];

function which(cmd) {
  for (const d of ["/bin", "/usr/bin", "/usr/local/bin", "/opt/homebrew/bin"]) {
    const p = join(d, cmd);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Stub `git`, plain sh (no node, so a checkout's PATH can leave node out). Logs every call to
 * $STUB_LOG. On `clone ... --branch <tag> <url> <dest>` it copies the prebuilt stand-in clone to
 * <dest> and remembers <tag>. `-C <dir> describe --tags --exact-match` prints the
 * remembered tag (from <dir>/.git/stub-tag).
 */
function stubGit(cloneTemplate) {
  return `#!/bin/sh
echo "git $*" >> "$STUB_LOG"
if [ "$1" = "-C" ]; then dir="$2"; shift 2; else dir=.; fi
case "$1" in
  clone)
    tag=""; dest=""; prev=""
    for a in "$@"; do
      [ "$prev" = "--branch" ] && tag="$a"
      prev="$a"; dest="$a"
    done
    cp -R "${cloneTemplate}" "$dest" || exit 1
    printf '%s\n' "$tag" > "$dest/.git/stub-tag"
    ;;
  describe)
    [ -f "$dir/.git/stub-tag" ] || { echo "fatal: no tag" >&2; exit 128; }
    cat "$dir/.git/stub-tag"
    ;;
  status|rev-parse|init|add|commit|config)
    exec "${which("git")}" -C "$dir" "$@"
    ;;
  *) echo "stub git: unexpected $*" >&2; exit 2 ;;
esac
`;
}

/** Stub `docker`: `compose version --short` prints $STUB_COMPOSE_VERSION; `compose ... config -q` exits $STUB_COMPOSE_CONFIG_EXIT. */
function stubDocker() {
  return `#!/bin/sh
echo "docker $*" >> "$STUB_LOG"
[ "$1" = "compose" ] || { echo "stub docker: unexpected $*" >&2; exit 2; }
case " $* " in
  *" version "*) echo "\${STUB_COMPOSE_VERSION:-${TESTED_COMPOSE.slice(1)}}" ;;
  *" config "*) exit "\${STUB_COMPOSE_CONFIG_EXIT:-0}" ;;
  *) echo "stub docker: unexpected $*" >&2; exit 2 ;;
esac
`;
}

/**
 * Make a temporary checkout: <root>/recipes/self-hosted-supabase-mcp (a copy of this folder without
 * its tests and any local clone), <root>/integrations/self-hosted-llm-mcp/ (unless withIntegration is
 * false), committed in a fresh git repo, plus a bin directory for PATH.
 *
 * @param {{ withIntegration?: boolean, hide?: string[] }} [opts] hide: tools left off PATH ("docker", "git", "openssl")
 */
export function makeCheckout({ withIntegration = true, hide = [] } = {}) {
  // Resolved path (macOS temp folders are symlinks under /private), so paths the scripts print compare equal.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ob1-006-")));
  const recipe = join(root, RECIPE_REL);
  cpSync(RECIPE_DIR, recipe, {
    recursive: true,
    filter: (src) => !src.includes(`${RECIPE_REL}/tests`) && !src.includes(`${RECIPE_REL}/supabase`),
  });
  if (withIntegration) {
    mkdirSync(join(root, "integrations", "self-hosted-llm-mcp"), { recursive: true });
    writeFileSync(join(root, "integrations", "self-hosted-llm-mcp", "index.ts"), "// marker\n");
  }
  const git = which("git");
  const run = (...args) => spawnSync(git, args, { cwd: root, encoding: "utf8" });
  run("init", "-q");
  writeFileSync(join(root, ".git", "info", "exclude"), ".bin/\n.fixture-clone/\n.stub.log\n");
  run("-c", "user.email=t@example.invalid", "-c", "user.name=t", "add", "-A");
  run("-c", "user.email=t@example.invalid", "-c", "user.name=t", "commit", "-q", "-m", "fixture");

  const bin = join(root, ".bin");
  mkdirSync(bin);
  for (const t of POSIX_TOOLS) {
    const p = which(t);
    if (p) symlinkSync(p, join(bin, t));
  }
  if (!hide.includes("openssl")) symlinkSync(which("openssl"), join(bin, "openssl"));
  // The stand-in clone is built once here; the stub git only copies it (no node on the checkout's PATH).
  const cloneTemplate = join(root, ".fixture-clone");
  writeFixtureClone(cloneTemplate);
  if (!hide.includes("git")) { writeFileSync(join(bin, "git"), stubGit(cloneTemplate)); chmodSync(join(bin, "git"), 0o755); }
  if (!hide.includes("docker")) { writeFileSync(join(bin, "docker"), stubDocker()); chmodSync(join(bin, "docker"), 0o755); }
  const log = join(root, ".stub.log");
  writeFileSync(log, "");
  return { root, recipe, bin, log, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/**
 * Shell the tests run the recipe's scripts under (setup.sh and init/create-bucket.sh): dash where
 * present, else /bin/sh. On macOS /bin/sh is bash, which accepts bashisms that Debian and Ubuntu's
 * sh (dash) rejects; dash keeps the tests strict about POSIX sh on every host (H4, H5).
 */
export const SETUP_SHELL = existsSync("/bin/dash") ? "/bin/dash" : "/bin/sh";

/** Run `sh setup.sh` (under SETUP_SHELL) in the checkout's recipe folder with only the checkout's bin on PATH. */
export function runSetup(co, env = {}) {
  const r = spawnSync(SETUP_SHELL, ["setup.sh"], {
    cwd: co.recipe,
    encoding: "utf8",
    env: { PATH: co.bin, HOME: co.root, STUB_LOG: co.log, ...env },
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, out: `${r.stdout}${r.stderr}` };
}

/** Parse a .env file into a Map of key → value (ignores comments and blank lines). */
export function readEnv(path) {
  const m = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    m.set(line.slice(0, i), line.slice(i + 1));
  }
  return m;
}

/** Path of the generated .env inside a checkout. */
export const envPath = (co) => join(co.recipe, "supabase", "docker", ".env");

/** Stub log lines. */
export const stubCalls = (co) => readFileSync(co.log, "utf8").split("\n").filter(Boolean);

/**
 * Stub `curl` (node script). Understands -s, -S, -f (ignored), -o <file>, -w <fmt> (with %{http_code}),
 * -H <header>, -d/--data/--data-raw <body>, -X <method>, and one URL. Logs each request as a JSON line
 * to $STUB_CURL_LOG. Responds by $STUB_CURL_MODE:
 * - "stateful": POST …/bucket creates the bucket named by the JSON body's id in $STUB_CURL_STATE
 *   (200), or answers 400 {"statusCode":"409","error":"Duplicate","code":"BucketAlreadyExists"} if it exists;
 * - "fixed": answers $STUB_CURL_STATUS with body $STUB_CURL_BODY;
 * - "unreachable": prints a connection error and exits 7, like curl.
 */
const STUB_CURL = `#!/usr/bin/env node
const fs = require("node:fs");
const a = process.argv.slice(2);
let out = null, fmt = null, body = "", method = null, url = null; const headers = [];
for (let i = 0; i < a.length; i++) {
  const x = a[i];
  if (x === "-o") out = a[++i];
  else if (x === "-w") fmt = a[++i];
  else if (x === "-H") headers.push(a[++i]);
  else if (x === "-d" || x === "--data" || x === "--data-raw") body = a[++i];
  else if (x === "-X") method = a[++i];
  else if (/^-[sSf]+$/.test(x) || x === "--silent" || x === "--show-error") continue;
  else if (!x.startsWith("-")) url = x;
}
method = method || (body ? "POST" : "GET");
fs.appendFileSync(process.env.STUB_CURL_LOG, JSON.stringify({ method, url, headers, body }) + "\\n");
const mode = process.env.STUB_CURL_MODE || "fixed";
if (mode === "unreachable") { process.stderr.write("curl: (7) Failed to connect to storage port 5000\\n"); process.exit(7); }
let status = 200, resp = "";
if (mode === "stateful") {
  const st = fs.existsSync(process.env.STUB_CURL_STATE) ? JSON.parse(fs.readFileSync(process.env.STUB_CURL_STATE, "utf8")) : [];
  const req = JSON.parse(body || "{}");
  if (method === "POST" && /\\/bucket$/.test(url || "")) {
    if (st.some((b) => b.id === req.id)) { status = 400; resp = JSON.stringify({ statusCode: "409", error: "Duplicate", message: "The resource already exists", code: "BucketAlreadyExists" }); }
    else { st.push(req); fs.writeFileSync(process.env.STUB_CURL_STATE, JSON.stringify(st)); resp = JSON.stringify({ name: req.id }); }
  } else { status = 404; resp = "{}"; }
} else { status = Number(process.env.STUB_CURL_STATUS || 200); resp = process.env.STUB_CURL_BODY || ""; }
if (out) fs.writeFileSync(out, resp); else process.stdout.write(resp);
if (fmt) process.stdout.write(fmt.replace("%{http_code}", String(status)));
`;

/**
 * An environment for running init/create-bucket.sh: a bin directory with POSIX tools and the stub curl.
 * Returns run(env) → {code, stdout, stderr, out}, requests() → logged requests, buckets() → stateful store.
 * `script` defaults to the recipe's init/create-bucket.sh; the harness self-test (H5) passes another.
 */
export function makeBucketEnv({ script = join(RECIPE_DIR, "init", "create-bucket.sh") } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ob1-006-bucket-"));
  const bin = join(root, "bin");
  mkdirSync(bin);
  for (const t of POSIX_TOOLS) { const p = which(t); if (p) symlinkSync(p, join(bin, t)); }
  symlinkSync(process.execPath, join(bin, "node"));
  writeFileSync(join(bin, "curl"), STUB_CURL);
  chmodSync(join(bin, "curl"), 0o755);
  const log = join(root, "curl.log");
  const state = join(root, "buckets.json");
  writeFileSync(log, "");
  return {
    root,
    run(env = {}) {
      const r = spawnSync(SETUP_SHELL, [script], {
        encoding: "utf8",
        env: { PATH: bin, STUB_CURL_LOG: log, STUB_CURL_STATE: state, ...env },
      });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr, out: `${r.stdout}${r.stderr}` };
    },
    requests: () => readFileSync(log, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)),
    buckets: () => (existsSync(state) ? JSON.parse(readFileSync(state, "utf8")) : []),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** Real docker on the test runner's own PATH, or null. Compose tests skip without it. */
export function realDocker() {
  const r = spawnSync("/bin/sh", ["-c", "command -v docker"], { encoding: "utf8", env: process.env });
  if (r.status !== 0) return null;
  const v = spawnSync("docker", ["compose", "version", "--short"], { encoding: "utf8" });
  return v.status === 0 ? r.stdout.trim() : null;
}

/** Run the real `docker compose` in a checkout's recipe folder. */
export function compose(co, args) {
  const r = spawnSync("docker", ["compose", ...args], { cwd: co.recipe, encoding: "utf8", env: process.env });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
