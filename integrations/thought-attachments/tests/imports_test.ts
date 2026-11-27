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
