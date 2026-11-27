// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { EmbeddingClient, Settings } from "./types.ts";

export function createEmbeddingClient(settings: Settings, fetch: typeof globalThis.fetch): EmbeddingClient {
  throw new Error("not implemented");
}
