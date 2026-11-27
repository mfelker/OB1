/**
 * Drift checks between src/store.ts and schema.sql (T019, T014's static scan). Reads both files with --allow-read.
 * A mismatch fails here in CI rather than on the live run.
 */
import { assertEquals } from "jsr:@std/assert@1.0.19";

const read = (rel: string) => Deno.readTextFileSync(new URL(rel, import.meta.url));

/** The RPCs the base brain already provides (docs/01-getting-started.md step 2.3), with their parameters. */
const BASE_FUNCTIONS: Record<string, string[]> = {
  match_thoughts: ["query_embedding", "match_threshold", "match_count", "filter"],
};

/** Every `rpc("name", { ...keys })` call in the store source, with its top-level argument keys. */
export function rpcCalls(source: string): { name: string; keys: string[] }[] {
  const calls: { name: string; keys: string[] }[] = [];
  const re = /rpc(?:<[^"]*?>)?\(\s*"(\w+)"\s*,\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const keys: string[] = [];
    let depth = 1;
    let i = re.lastIndex;
    let segment = "";
    for (; i < source.length && depth > 0; i++) {
      const c = source[i];
      if (c === "{" || c === "[" || c === "(") depth++;
      else if (c === "}" || c === "]" || c === ")") depth--;
      if (depth === 1 && c === ",") {
        keys.push(...keyOf(segment));
        segment = "";
      } else if (depth >= 1) {
        segment += c;
      }
    }
    keys.push(...keyOf(segment));
    calls.push({ name: m[1], keys });
  }
  return calls;
}

function keyOf(segment: string): string[] {
  const k = /^\s*([A-Za-z_]\w*)\s*(?::|$)/.exec(segment);
  return k ? [k[1]] : [];
}

/** Every `create ... function name(args)` in schema.sql, with its parameter names. */
export function sqlFunctions(sql: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\s*\(([^)]*)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    out[m[1]] = m[2].split(",").map((a) => a.trim().split(/\s+/)[0]).filter((a) => a.length > 0);
  }
  return out;
}

/** What is wrong between the two sources: an RPC schema.sql lacks, or a parameter the function doesn't take. */
export function driftProblems(storeSource: string, schemaSql: string): string[] {
  const known = { ...BASE_FUNCTIONS, ...sqlFunctions(schemaSql) };
  const problems: string[] = [];
  for (const call of rpcCalls(storeSource)) {
    const params = known[call.name];
    if (!params) {
      problems.push(`rpc ${call.name} is not defined in schema.sql`);
      continue;
    }
    for (const key of call.keys) {
      if (!params.includes(key)) problems.push(`rpc ${call.name} sends ${key}, which the function does not take`);
    }
  }
  return problems;
}

/** Every RPC src/store.ts calls, one entry per call site. */
const STORE_RPCS = [
  "attachment_insert_note",
  "match_thoughts",
  "attachment_find_thoughts_exact",
  "attachment_embedding_dimension",
  "attachment_orphans",
  "attachment_by_page_token",
  "attachment_consume_page_token",
  "attachment_claim",
  "attachment_release",
  "attachment_write_derived",
  "attachment_set_state",
  "attachment_removal_preview",
  "attachment_remove",
];

Deno.test("U83 every RPC name and named parameter that src/store.ts sends exists in schema.sql, or is the base match_thoughts", () => {
  const store = read("../src/store.ts");
  const schema = read("../schema.sql");
  const calls = rpcCalls(store);
  // the scan must really see the store's calls, not match nothing: these are the thirteen it makes
  assertEquals(calls.map((c) => c.name).sort(), [...STORE_RPCS].sort());
  assertEquals(calls.filter((c) => c.name === "attachment_claim")[0].keys, ["p_id", "p_op", "p_seconds"]);
  assertEquals(driftProblems(store, schema), []);
});

Deno.test("U375 the drift checker flags an unknown parameter and an undefined function", () => {
  assertEquals(
    driftProblems(`rpc("attachment_claim", { p_id: 1, p_nope: 2 })`, "create or replace function attachment_claim(p_id uuid, p_op text)"),
    ["rpc attachment_claim sends p_nope, which the function does not take"],
  );
  assertEquals(driftProblems(`rpc("attachment_gone", {})`, ""), ["rpc attachment_gone is not defined in schema.sql"]);
});

/** What breaks CLAUDE.md's SQL guard rails in a SQL source: DROP, TRUNCATE, or a DELETE with no WHERE. Comments are ignored. */
export function guardRailProblems(sql: string, file: string): string[] {
  const code = sql.replace(/--[^\n]*/g, "");
  const problems: string[] = [];
  if (/\bdrop\b/i.test(code)) problems.push(`${file} contains DROP`);
  if (/\btruncate\b/i.test(code)) problems.push(`${file} contains TRUNCATE`);
  for (const m of code.matchAll(/\bdelete\s+from\b[^;]*/gi)) {
    if (!/\bwhere\b/i.test(m[0])) problems.push(`${file} has an unqualified DELETE: ${m[0].slice(0, 60)}`);
  }
  return problems;
}

Deno.test("U52 neither schema.sql nor tests/verify.sql contains DROP, TRUNCATE or an unqualified DELETE", () => {
  assertEquals(guardRailProblems(read("../schema.sql"), "schema.sql"), []);
  assertEquals(guardRailProblems(read("verify.sql"), "tests/verify.sql"), []);
});

Deno.test("U376 the guard-rail scan flags DROP, TRUNCATE and an unqualified DELETE, and ignores comments", () => {
  assertEquals(guardRailProblems("drop index x;", "f"), ["f contains DROP"]);
  assertEquals(guardRailProblems("TRUNCATE t;", "f"), ["f contains TRUNCATE"]);
  assertEquals(guardRailProblems("delete from t;", "f").length, 1);
  assertEquals(guardRailProblems("delete from t where id = 1;", "f"), []);
  assertEquals(guardRailProblems("-- no DROP here\nselect 1;", "f"), []);
});
