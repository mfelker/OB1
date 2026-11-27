// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Settings, Store } from "./types.ts";

export function createSupabaseStore(
  url: string,
  serviceRoleKey: string,
  settings: Settings,
  fetch: typeof globalThis.fetch,
): Store {
  throw new Error("not implemented");
}
