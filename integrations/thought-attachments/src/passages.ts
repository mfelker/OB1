// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Passage, Settings } from "./types.ts";

export function toPassages(
  pageTexts: string[],
  sourceLineFor: (pages: [number, number]) => string,
  settings: Settings,
): Passage[] {
  throw new Error("not implemented");
}
