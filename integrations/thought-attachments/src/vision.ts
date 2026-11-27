/** OpenAI-compatible vision captioning client (spec 007 research R4, FR-006, FR-009). */
import type { Settings, VisionClient } from "./types.ts";

export function createVisionClient(settings: Settings, fetch: typeof globalThis.fetch): VisionClient {
  return {
    configured: Boolean(settings.visionApiBase && settings.visionModel),
    caption() {
      throw new Error("not implemented");
    },
  };
}
