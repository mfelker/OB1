/** Batched OpenAI-compatible embeddings client (spec 007 research R3, FR-007, FR-009, FR-011). */
import type { EmbeddingClient, R, Settings } from "./types.ts";

export function createEmbeddingClient(settings: Settings, fetch: typeof globalThis.fetch): EmbeddingClient {
  return {
    async embed(texts: string[]): Promise<R<number[][]>> {
      const response = await fetch(`${settings.embeddingApiBase}/embeddings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: settings.embeddingModel, input: texts }),
      });
      const body = await response.json();
      return { data: body.data.map((d: { embedding: number[] }) => d.embedding) };
    },
  };
}
