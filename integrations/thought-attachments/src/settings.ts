/** Settings from the environment (contracts/settings.md). */
import type { GetEnv, SettingsResult } from "./types.ts";

export function loadSettings(getEnv: GetEnv): SettingsResult {
  return {
    ok: true,
    settings: {
      mcpAccessKey: getEnv("MCP_ACCESS_KEY") ?? "",
      embeddingApiBase: "https://openrouter.ai/api/v1",
      embeddingApiKey: getEnv("EMBEDDING_API_KEY"),
      embeddingModel: "openai/text-embedding-3-small",
      embeddingBatchSize: 64,
      visionApiBase: getEnv("VISION_API_BASE"),
      visionApiKey: getEnv("VISION_API_KEY"),
      visionModel: getEnv("VISION_MODEL"),
      attachmentsBucket: "ob1-files",
      maxImageMb: 10,
      maxPdfMb: 25,
      maxPdfPages: 50,
      passageMaxChars: 1500,
      scannedMinCharsPerPage: 20,
      uploadLinkMinutes: 60,
      downloadLinkSeconds: 600,
      busySeconds: 410,
      publicBaseUrl: getEnv("PUBLIC_BASE_URL") ?? "",
      uploadPageUrl: getEnv("UPLOAD_PAGE_URL") ?? "",
    },
  };
}
