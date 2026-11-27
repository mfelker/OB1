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

Deno.test("U83 every RPC name and named parameter that src/store.ts sends exists in schema.sql, or is the base match_thoughts", () => {
  const store = read("../src/store.ts");
  const schema = read("../schema.sql");
  const calls = rpcCalls(store);
  // the scan must really see the store's calls, not match nothing
  assertEquals(calls.length >= 13, true, `only ${calls.length} rpc calls found`);
  assertEquals(calls.filter((c) => c.name === "attachment_claim")[0].keys, ["p_id", "p_op", "p_seconds"]);
  assertEquals(driftProblems(store, schema), []);

  // the checker catches both kinds of drift
  assertEquals(
    driftProblems(`rpc("attachment_claim", { p_id: 1, p_nope: 2 })`, "create or replace function attachment_claim(p_id uuid, p_op text)"),
    ["rpc attachment_claim sends p_nope, which the function does not take"],
  );
  assertEquals(driftProblems(`rpc("attachment_gone", {})`, ""), ["rpc attachment_gone is not defined in schema.sql"]);
});
