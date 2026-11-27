/** The entry and the import rules (T032): spec 004 R10 (full specifiers), R15 (pdf-lib in tests only). */
import { assertArrayIncludes, assertEquals } from "jsr:@std/assert@1.0.19";
import { UPLOAD_PAGE_HTML } from "../src/upload_page.ts";

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

/** Every module specifier a text imports or re-exports (static and dynamic). */
function specifiersIn(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/^\s*(?:import|export)\s[^;"'`]*?\bfrom\s*["']([^"']+)["']/gm)) found.push(m[1]);
  for (const m of text.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) found.push(m[1]);
  for (const m of text.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) found.push(m[1]);
  return found;
}

/** Every module specifier a file imports or re-exports. */
async function specifiers(file: string): Promise<string[]> {
  return specifiersIn(await Deno.readTextFile(new URL(file, ROOT)));
}

const isPdfLib = (s: string) => /(^|[:/])pdf-lib(@|\/|$)/.test(s);
const isBare = (s: string) => !/^(npm:|jsr:|\.\.?\/|https:\/\/)/.test(s);

/** A planted text with one pdf-lib import and three bare specifiers (static, re-export and dynamic). */
const PLANTED = 'import { PDFDocument } from "npm:pdf-lib@1.17.1";\nimport { z } from "zod";\nexport * from "hono";\nconst m = await import("unpdf");';

Deno.test("U304 no .ts file outside tests/ imports pdf-lib", async () => {
  // Positive controls: the scan reaches the known source files, and a planted pdf-lib import is flagged.
  const files = await sourceFiles();
  assertArrayIncludes(files, ["index.ts", "src/app.ts", "src/pdf.ts", "src/store.ts"], "sourceFiles() missed a known file");
  assertEquals(specifiersIn(PLANTED).filter(isPdfLib), ["npm:pdf-lib@1.17.1"], "a planted pdf-lib import was not flagged");
  const offenders: string[] = [];
  for (const file of files) {
    for (const s of await specifiers(file)) if (isPdfLib(s)) offenders.push(`${file}: ${s}`);
  }
  assertEquals(offenders, []);
});

Deno.test("U303 no .ts file outside tests/ has a bare import specifier", async () => {
  // Positive controls: the scan reaches the known files and their known specifiers, and planted bare ones are flagged.
  const files = await sourceFiles();
  assertArrayIncludes(files, ["index.ts", "src/store.ts"], "sourceFiles() missed a known file");
  assertArrayIncludes(await specifiers("src/store.ts"), ["npm:@supabase/supabase-js@2.47.10"], "a known npm: specifier was not found");
  assertArrayIncludes(await specifiers("index.ts"), ["./src/app.ts"], "a known relative specifier was not found");
  assertEquals(specifiersIn(PLANTED).filter(isBare), ["zod", "hono", "unpdf"], "planted bare specifiers were not flagged");
  const bare: string[] = [];
  for (const file of files) {
    for (const s of await specifiers(file)) {
      if (isBare(s)) bare.push(`${file}: ${s}`);
    }
  }
  assertEquals(bare, []);
});

/** Filesystem reads a source text makes at run time (the self-hosted runtime compiles the function without its other files). */
function filesystemReadsIn(text: string): string[] {
  return [...text.matchAll(/\bDeno\.(readFile|readTextFile|readFileSync|readTextFileSync|open|openSync|readDir|readDirSync|stat|statSync|lstat|lstatSync|realPath|realPathSync)\b|\bimport\.meta\.(url|resolve|filename|dirname)\b/g)].map((m) => m[0]);
}

Deno.test("U400 no file in src/ reads the filesystem at run time", async () => {
  // Positive controls: the scan reaches the known src files, and planted reads are flagged.
  const files = (await sourceFiles()).filter((f) => f.startsWith("src/"));
  assertArrayIncludes(files, ["src/app.ts", "src/embeddings.ts"], "sourceFiles() missed a known src file");
  assertEquals(
    filesystemReadsIn('const a = await Deno.readFile(new URL("../x.html", import.meta.url));\nconst b = Deno.readTextFileSync("y");'),
    ["Deno.readFile", "import.meta.url", "Deno.readTextFileSync"],
    "a planted filesystem read was not flagged",
  );
  const offenders: string[] = [];
  for (const file of files) {
    for (const read of filesystemReadsIn(await Deno.readTextFile(new URL(file, ROOT)))) offenders.push(`${file}: ${read}`);
  }
  assertEquals(offenders, []);
});

Deno.test("U402 src/upload_page.ts holds upload-page.html byte for byte (the file Cloud owners publish)", async () => {
  const file = await Deno.readFile(new URL("upload-page.html", ROOT));
  const module = new TextEncoder().encode(UPLOAD_PAGE_HTML);
  const firstDifference = module.findIndex((b, i) => b !== file[i]);
  assertEquals({ length: module.length, firstDifference }, { length: file.length, firstDifference: -1 });
});
