/** The entry and the import rules (T032): spec 004 R10 (full specifiers), R15 (pdf-lib in tests only). */
import { assertEquals } from "jsr:@std/assert@1.0.19";

const ROOT = new URL("../", import.meta.url);

Deno.test("U302 index.ts is the one-line entry", async () => {
  const lines = (await Deno.readTextFile(new URL("index.ts", ROOT))).split("\n").filter((l) => l.trim() !== "");
  assertEquals(lines, [
    'import { createApp, productionDeps } from "./src/app.ts";',
    "Deno.serve(createApp(productionDeps()).fetch);",
  ]);
});

/** Every `.ts` file outside tests/, relative to the folder. */
async function sourceFiles(dir = ROOT, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for await (const e of Deno.readDir(dir)) {
    const rel = prefix + e.name;
    if (e.isDirectory && rel !== "tests" && rel !== "node_modules") out.push(...await sourceFiles(new URL(`${e.name}/`, dir), `${rel}/`));
    else if (e.isFile && e.name.endsWith(".ts")) out.push(rel);
  }
  return out.sort();
}

/** Every module specifier a file imports or re-exports (static and dynamic). */
async function specifiers(file: string): Promise<string[]> {
  const text = await Deno.readTextFile(new URL(file, ROOT));
  const found: string[] = [];
  for (const m of text.matchAll(/^\s*(?:import|export)\s[^;"'`]*?\bfrom\s*["']([^"']+)["']/gm)) found.push(m[1]);
  for (const m of text.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) found.push(m[1]);
  for (const m of text.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) found.push(m[1]);
  return found;
}

Deno.test("U304 no .ts file outside tests/ imports pdf-lib", async () => {
  const offenders: string[] = [];
  for (const file of await sourceFiles()) {
    for (const s of await specifiers(file)) if (/(^|[:/])pdf-lib(@|\/|$)/.test(s)) offenders.push(`${file}: ${s}`);
  }
  assertEquals(offenders, []);
});

Deno.test("U303 no .ts file outside tests/ has a bare import specifier", async () => {
  const bare: string[] = [];
  for (const file of await sourceFiles()) {
    for (const s of await specifiers(file)) {
      if (!/^(npm:|jsr:|\.\.?\/|https:\/\/)/.test(s)) bare.push(`${file}: ${s}`);
    }
  }
  assertEquals(bare, []);
});
