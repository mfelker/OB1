/** Intake checks (T020, T035, T053): declared and actual file details. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { baseName, checkDeclared, sniffType } from "../src/intake.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";
import { heicBytes, jpegBytes, pngBytes, textPdf, webpBytes } from "./helpers/fixtures.ts";

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

Deno.test("U117 checkDeclared refuses any other type, naming the accepted types", () => {
  const refusal = checkDeclared({ name: "a.zip", type: "application/zip", size: 1000 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "unsupported_type");
  for (const name of ["PDF", "JPEG", "PNG", "WebP"]) assertStringIncludes(refusal.message, name);
});

Deno.test("U119 an image declared one byte over the image cap is refused, naming the cap and the declared size", () => {
  const refusal = checkDeclared({ name: "a.jpg", type: "image/jpeg", size: IMAGE_CAP + 1 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "too_large");
  assertStringIncludes(refusal.message, "10485760");
  assertStringIncludes(refusal.message, "10485761");
});

Deno.test("U118 an image declared at exactly the image cap is accepted", () => {
  assertEquals(checkDeclared({ name: "a.jpg", type: "image/jpeg", size: IMAGE_CAP }, settingsWith()), null);
});

Deno.test("U120 a PDF declared at exactly the PDF cap is accepted", () => {
  assertEquals(checkDeclared({ name: "a.pdf", type: "application/pdf", size: PDF_CAP }, settingsWith()), null);
});

Deno.test("U121 a PDF declared one byte over the PDF cap is refused, naming the cap and the declared size", () => {
  const refusal = checkDeclared({ name: "a.pdf", type: "application/pdf", size: PDF_CAP + 1 }, settingsWith());
  assert(refusal !== null);
  assertEquals(refusal.code, "too_large");
  assertStringIncludes(refusal.message, "26214400");
  assertStringIncludes(refusal.message, "26214401");
});

Deno.test("U320 with MAX_IMAGE_MB=2.5 an image at 2,621,440 bytes is accepted and one byte more is refused", () => {
  const s = settingsWith({ MAX_IMAGE_MB: "2.5" });
  assertEquals(checkDeclared({ name: "a.png", type: "image/png", size: 2_621_440 }, s), null);
  const refusal = checkDeclared({ name: "a.png", type: "image/png", size: 2_621_441 }, s);
  assert(refusal !== null);
  assertStringIncludes(refusal.message, "2621440");
});

Deno.test("U141 a HEIC declared type is refused with share it as JPEG and the steps on iPhone and Android", () => {
  for (const type of ["image/heic", "image/heif"]) {
    const refusal = checkDeclared({ name: "photo", type, size: 1000 }, settingsWith());
    assert(refusal !== null, type);
    assertEquals(refusal.code, "heic");
    assertStringIncludes(refusal.message, "share it as JPEG");
    assertStringIncludes(refusal.message, "iPhone");
    assertStringIncludes(refusal.message, "Android");
  }
});

Deno.test("U142 a file name ending .heic or .heif, in any case, gets the same refusal whatever the declared type", () => {
  for (const name of ["a.heic", "B.HEIC", "c.Heif", "d.heif"]) {
    const refusal = checkDeclared({ name, type: "image/jpeg", size: 1000 }, settingsWith());
    assert(refusal !== null, name);
    assertEquals(refusal.code, "heic");
  }
});

Deno.test("U143 sniffType identifies PDF, JPEG, PNG, WebP and HEIC from the first bytes", async () => {
  assertEquals(sniffType(await textPdf(["hello"])), "application/pdf");
  assertEquals(sniffType(jpegBytes()), "image/jpeg");
  assertEquals(sniffType(await pngBytes()), "image/png");
  assertEquals(sniffType(webpBytes()), "image/webp");
  assertEquals(sniffType(heicBytes()), "image/heic");
});
