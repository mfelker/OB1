/** Intake checks (T020, T035, T053): declared and actual file details. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { baseName, checkDeclared } from "../src/intake.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("expected ok settings: " + JSON.stringify(result.problems));
  return result.settings;
}

const IMAGE_CAP = 10_485_760;
const PDF_CAP = 26_214_400;

Deno.test("U113 baseName drops POSIX directory parts", () => {
  assertEquals(baseName("/Users/a/b/manual.pdf"), "manual.pdf");
});

Deno.test("U114 baseName drops Windows directory parts and the drive", () => {
  assertEquals(baseName("C:\\Users\\a\\manual.pdf"), "manual.pdf");
});

Deno.test("U115 baseName removes control characters", () => {
  assertEquals(baseName("man\u0000ual\n\t.pdf\u007f"), "manual.pdf");
});

Deno.test("U116 checkDeclared accepts each of the four accepted types within its cap", () => {
  const s = settingsWith();
  for (const type of ["application/pdf", "image/jpeg", "image/png", "image/webp"]) {
    assertEquals(checkDeclared({ name: "file", type, size: 1000 }, s), null, type);
  }
});
