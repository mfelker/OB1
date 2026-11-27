/** toPassages (T022): size-bounded passages with their page ranges. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.19";
import { toPassages } from "../src/passages.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error("expected ok settings: " + JSON.stringify(result.problems));
  return result.settings;
}

/** The source line the way derived.ts builds it, for a fixed file. */
const lineFor = ([a, b]: [number, number]) =>
  a === b ? `From manual.pdf, page ${a} (attachment a1b2c3d4)` : `From manual.pdf, pages ${a}–${b} (attachment a1b2c3d4)`;

const words = (n: number, prefix = "w") => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(" ");

Deno.test("U124 every passage, source line included, is at most PASSAGE_MAX_CHARS", () => {
  const max = 200;
  const passages = toPassages([words(120), words(80, "x")], lineFor, settingsWith({ PASSAGE_MAX_CHARS: String(max) }));
  assert(passages.length > 2);
  for (const p of passages) {
    assert(lineFor(p.pages).length + 1 + p.text.length <= max, `${p.pages} is ${p.text.length} chars`);
  }
});
