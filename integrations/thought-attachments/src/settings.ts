/** Settings from the environment (contracts/settings.md). */
import type { GetEnv, SettingsResult } from "./types.ts";

export function loadSettings(getEnv: GetEnv): SettingsResult {
  const text = (name: string, fallback: string) => getEnv(name) ?? fallback;
  const num = (name: string, fallback: number) => {
    const raw = getEnv(name);
    return raw === undefined ? fallback : Number(raw);
  };
  return {
    ok: true,
    settings: {
      mcpAccessKey: getEnv("MCP_ACCESS_KEY") ?? "",
      embeddingApiBase: text("EMBEDDING_API_BASE", "https://openrouter.ai/api/v1"),
      embeddingApiKey: getEnv("EMBEDDING_API_KEY"),
      embeddingModel: text("EMBEDDING_MODEL", "openai/text-embedding-3-small"),
      embeddingBatchSize: num("EMBEDDING_BATCH_SIZE", 64),
      visionApiBase: getEnv("VISION_API_BASE"),
      visionApiKey: getEnv("VISION_API_KEY"),
      visionModel: getEnv("VISION_MODEL"),
      attachmentsBucket: text("ATTACHMENTS_BUCKET", "ob1-files"),
      maxImageMb: num("MAX_IMAGE_MB", 10),
      maxPdfMb: num("MAX_PDF_MB", 25),
      maxPdfPages: num("MAX_PDF_PAGES", 50),
      passageMaxChars: num("PASSAGE_MAX_CHARS", 1500),
      scannedMinCharsPerPage: num("SCANNED_MIN_CHARS_PER_PAGE", 20),
      uploadLinkMinutes: num("UPLOAD_LINK_MINUTES", 60),
      downloadLinkSeconds: num("DOWNLOAD_LINK_SECONDS", 600),
      busySeconds: 410,
      publicBaseUrl: getEnv("PUBLIC_BASE_URL") ?? "",
      uploadPageUrl: getEnv("UPLOAD_PAGE_URL") ?? "",
    },
  };
}
