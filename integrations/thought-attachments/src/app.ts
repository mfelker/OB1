// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { AppInput, FetchApp } from "./types.ts";

/** Answers every MCP call and page route with the named settings error when `input.ok` is false (T005 Q3). */
export function createApp(input: AppInput): FetchApp {
  throw new Error("not implemented");
}

export function productionDeps(): AppInput {
  throw new Error("not implemented");
}
