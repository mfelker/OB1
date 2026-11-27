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

/** Text of exactly `n` characters: 9-letter words with single spaces, never ending in a space. */
function textOf(n: number): string {
  const text = "abcdefghi ".repeat(Math.ceil(n / 10)).slice(0, n);
  return text.endsWith(" ") ? text.slice(0, -1) + "z" : text;
}

Deno.test("U125 text that fits in exactly PASSAGE_MAX_CHARS with its source line is one passage", () => {
  const max = 300;
  const body = textOf(max - lineFor([1, 1]).length - 1);
  const passages = toPassages([body], lineFor, settingsWith({ PASSAGE_MAX_CHARS: String(max) }));
  assertEquals(passages.length, 1);
  assertEquals(passages[0].text, body);
});

Deno.test("U126 text one character longer than that is two passages", () => {
  const max = 300;
  const body = textOf(max - lineFor([1, 1]).length - 1 + 1);
  const passages = toPassages([body], lineFor, settingsWith({ PASSAGE_MAX_CHARS: String(max) }));
  assertEquals(passages.length, 2);
});

Deno.test("U128 a passage within one page records that page as both ends of its range", () => {
  const full = textOf(200 - lineFor([1, 1]).length - 1); // fills a passage exactly, so nothing of the next page joins it
  const passages = toPassages([full, full, full], lineFor, settingsWith({ PASSAGE_MAX_CHARS: "200" }));
  assertEquals(passages.map((p) => p.pages), [[1, 1], [2, 2], [3, 3]]);
});

Deno.test("U129 a passage that crosses a page boundary records both pages", () => {
  const passages = toPassages(["end of page one", "start of page two"], lineFor, settingsWith({ PASSAGE_MAX_CHARS: "300" }));
  assertEquals(passages.length, 1);
  assertEquals(passages[0].pages, [1, 2]);
  assertEquals(passages[0].text, "end of page one start of page two");
});

Deno.test("U127 passages keep reading order and together contain all of the page text, whitespace aside", () => {
  const pages = [words(90, "a"), "", words(70, "b") + "\n\n" + words(40, "c"), "  tail  "];
  const passages = toPassages(pages, lineFor, settingsWith({ PASSAGE_MAX_CHARS: "180" }));
  assert(passages.length > 3);
  const expected = pages.join(" ").split(/\s+/).filter(Boolean);
  const actual = passages.flatMap((p) => p.text.split(/\s+/).filter(Boolean));
  assertEquals(actual, expected);
});
