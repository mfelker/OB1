/** Batched OpenAI-compatible embeddings client (spec 007 research R3, FR-007, FR-009, FR-011). */
import type { EmbeddingClient, R, Settings } from "./types.ts";

export function createEmbeddingClient(settings: Settings, fetch: typeof globalThis.fetch): EmbeddingClient {
  async function embedBatch(batch: string[]): Promise<number[][]> {
    const response = await fetch(`${settings.embeddingApiBase}/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: settings.embeddingModel, input: batch }),
    });
    const body = await response.json();
    return body.data.map((d: { embedding: number[] }) => d.embedding);
  }

  return {
    async embed(texts: string[]): Promise<R<number[][]>> {
      const size = Math.max(1, settings.embeddingBatchSize);
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += size) {
        vectors.push(...await embedBatch(texts.slice(i, i + size)));
      }
      return { data: vectors };
    },
  };
}
