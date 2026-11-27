/** Batched OpenAI-compatible embeddings client (spec 007 research R3, FR-007, FR-009, FR-011). */
import type { EmbeddingClient, R, Settings } from "./types.ts";

export function createEmbeddingClient(settings: Settings, fetch: typeof globalThis.fetch): EmbeddingClient {
  async function embedBatch(batch: string[]): Promise<R<number[][]>> {
    let response: Response;
    try {
      response = await fetch(`${settings.embeddingApiBase}/embeddings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(settings.embeddingApiKey ? { authorization: `Bearer ${settings.embeddingApiKey}` } : {}),
        },
        body: JSON.stringify({ model: settings.embeddingModel, input: batch }),
      });
    } catch (e) {
      return { error: `embedding endpoint ${settings.embeddingApiBase} is unreachable: ${(e as Error).message}` };
    }
    if (!response.ok) {
      return { error: `embedding endpoint answered HTTP ${response.status}: ${(await response.text()).slice(0, 300)}` };
    }
    let vectors: number[][] | undefined;
    try {
      const body = await response.json();
      if (Array.isArray(body?.data)) vectors = body.data.map((d: { embedding: number[] }) => d.embedding);
    } catch {
      // falls through to the malformed reply below
    }
    if (!vectors || vectors.length !== batch.length || !vectors.every(Array.isArray)) {
      return { error: "embedding endpoint sent a malformed reply (expected one vector per input text)" };
    }
    return { data: vectors };
  }

  return {
    async embed(texts: string[]): Promise<R<number[][]>> {
      const size = Math.max(1, settings.embeddingBatchSize);
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += size) {
        const batch = await embedBatch(texts.slice(i, i + size));
        if ("error" in batch) return batch;
        vectors.push(...batch.data);
      }
      return { data: vectors };
    },
  };
}
