// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Passage, Settings } from "./types.ts";

export function toPassages(
  pageTexts: string[],
  sourceLineFor: (pages: [number, number]) => string,
  settings: Settings,
): Passage[] {
  const passages: Passage[] = [];
  let body = "";
  const fits = (text: string) => sourceLineFor([1, 1]).length + 1 + text.length <= settings.passageMaxChars;
  for (const word of pageTexts.join(" ").split(/\s+/).filter(Boolean)) {
    const next = body ? body + " " + word : word;
    if (fits(next)) {
      body = next;
    } else {
      passages.push({ text: body, pages: [1, 1] });
      body = word;
    }
  }
  if (body) passages.push({ text: body, pages: [1, 1] });
  return passages;
}
