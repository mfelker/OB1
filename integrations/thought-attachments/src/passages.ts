// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Passage, Settings } from "./types.ts";

export function toPassages(
  pageTexts: string[],
  sourceLineFor: (pages: [number, number]) => string,
  settings: Settings,
): Passage[] {
  const passages: Passage[] = [];
  let body = "";
  let first = 1;
  let last = 1;
  const fits = (text: string, pages: [number, number]) =>
    sourceLineFor(pages).length + 1 + text.length <= settings.passageMaxChars;
  pageTexts.forEach((pageText, index) => {
    const page = index + 1;
    for (const word of pageText.split(/\s+/).filter(Boolean)) {
      const next = body ? body + " " + word : word;
      if (body && fits(next, [first, page])) {
        body = next;
        last = page;
      } else {
        if (body) passages.push({ text: body, pages: [first, last] });
        body = word;
        first = last = page;
      }
    }
  });
  if (body) passages.push({ text: body, pages: [first, last] });
  return passages;
}
