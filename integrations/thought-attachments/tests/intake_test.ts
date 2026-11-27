/** Intake checks (T020, T035, T053): declared and actual file details. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { baseName } from "../src/intake.ts";

Deno.test("U113 baseName drops POSIX directory parts", () => {
  assertEquals(baseName("/Users/a/b/manual.pdf"), "manual.pdf");
});

Deno.test("U114 baseName drops Windows directory parts and the drive", () => {
  assertEquals(baseName("C:\\Users\\a\\manual.pdf"), "manual.pdf");
});

Deno.test("U115 baseName removes control characters", () => {
  assertEquals(baseName("man\u0000ual\n\t.pdf\u007f"), "manual.pdf");
});
