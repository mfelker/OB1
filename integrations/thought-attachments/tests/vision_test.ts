/** vision (T037): research R4, contracts/settings.md, FR-006, FR-009. */
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1.0.19";
import { createVisionClient } from "../src/vision.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter, VISION_API_BASE, VISION_API_KEY, VISION_MODEL } from "./helpers/env.ts";
import { chatReply, FakeFetch, visionResponder } from "./helpers/fake_fetch.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings, got problems: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

const URL_ = `${VISION_API_BASE}/chat/completions`;
const BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);

Deno.test("U172 configured is false when VISION_API_BASE or VISION_MODEL is unset", () => {
  const fetch = new FakeFetch().fetch;
  assertEquals(createVisionClient(settingsWith(), fetch).configured, true);
  assertEquals(createVisionClient(settingsWith({ VISION_API_BASE: undefined }), fetch).configured, false);
  assertEquals(createVisionClient(settingsWith({ VISION_MODEL: undefined }), fetch).configured, false);
});
