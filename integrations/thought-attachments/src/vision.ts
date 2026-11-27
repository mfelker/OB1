/** OpenAI-compatible vision captioning client (spec 007 research R4, FR-006, FR-009). */
import { encodeBase64 } from "jsr:@std/encoding@1.0.11/base64";
import type { AcceptedType, R, Settings, VisionClient } from "./types.ts";

const PROMPT =
  "Describe this image in plain language so it can be found by a later search: the visible objects, places, " +
  "labels and any text that appears in it. State only what is visible.";

export function createVisionClient(
  settings: Settings,
  fetch: typeof globalThis.fetch,
): VisionClient {
  /** FR-009: no key value ever appears in a reason. */
  function redact(text: string): string {
    const key = settings.visionApiKey;
    return key ? text.split(key).join("[redacted]") : text;
  }

  return {
    configured: Boolean(settings.visionApiBase && settings.visionModel),
    async caption(
      bytes: Uint8Array,
      type: AcceptedType,
    ): Promise<R<{ text: string; model: string }>> {
      let response: Response;
      try {
        response = await fetch(`${settings.visionApiBase}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(settings.visionApiKey
              ? { authorization: `Bearer ${settings.visionApiKey}` }
              : {}),
          },
          body: JSON.stringify({
            model: settings.visionModel,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${type};base64,${encodeBase64(bytes)}`,
                  },
                },
              ],
            }],
          }),
        });
      } catch (e) {
        return {
          error: redact(
            `vision endpoint ${settings.visionApiBase} is unreachable: ${
              (e as Error).message
            }`,
          ),
        };
      }
      if (!response.ok) {
        return {
          error: `vision endpoint answered HTTP ${response.status}: ${
            redact(bodyReason(await response.text())).slice(0, 300)
          }`,
        };
      }
      let text = "";
      try {
        const body = await response.json();
        const content = body?.choices?.[0]?.message?.content;
        if (typeof content === "string") text = content.trim();
      } catch {
        // an unreadable body is treated as an empty caption below
      }
      if (!text) return { error: "vision endpoint returned an empty caption" };
      return { data: { text, model: settings.visionModel! } };
    },
  };
}

/** The provider's own error message from a JSON error body, or the bounded text of any other body.
 * Other body fields (for example an account `user_id`) are never kept (FR-009, T101). */
function bodyReason(text: string): string {
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message;
    if (typeof message === "string") return message;
  } catch {
    // not JSON: fall through to the bounded text
  }
  return text;
}
