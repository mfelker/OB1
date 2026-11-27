/** OpenAI-compatible vision captioning client (spec 007 research R4, FR-006, FR-009). */
import { encodeBase64 } from "jsr:@std/encoding@1.0.11/base64";
import type { AcceptedType, R, Settings, VisionClient } from "./types.ts";

const PROMPT =
  "Describe this image in plain language so it can be found by a later search: the visible objects, places, " +
  "labels and any text that appears in it. State only what is visible.";

export function createVisionClient(settings: Settings, fetch: typeof globalThis.fetch): VisionClient {
  return {
    configured: Boolean(settings.visionApiBase && settings.visionModel),
    async caption(bytes: Uint8Array, type: AcceptedType): Promise<R<{ text: string; model: string }>> {
      const response = await fetch(`${settings.visionApiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(settings.visionApiKey ? { authorization: `Bearer ${settings.visionApiKey}` } : {}),
        },
        body: JSON.stringify({
          model: settings.visionModel,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:${type};base64,${encodeBase64(bytes)}` } },
            ],
          }],
        }),
      });
      const body = await response.json();
      return { data: { text: String(body.choices[0].message.content).trim(), model: settings.visionModel! } };
    },
  };
}
