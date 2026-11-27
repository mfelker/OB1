/** Settings from the environment (contracts/settings.md). */
import type { GetEnv, Settings, SettingsResult } from "./types.ts";

type Problem = { setting: string; reason: string };

export function loadSettings(getEnv: GetEnv): SettingsResult {
  const problems: Problem[] = [];
  const text = (name: string, fallback: string) => getEnv(name) ?? fallback;
  const num = (name: string, fallback: number, decimals = false) => {
    const raw = getEnv(name);
    if (raw === undefined) return fallback;
    const n = Number(raw);
    if (Number.isNaN(n) || n <= 0 || (!decimals && !Number.isInteger(n))) {
      problems.push({ setting: name, reason: decimals ? "must be a positive number" : "must be a positive whole number" });
    }
    return n;
  };
  const rawAccessKey = getEnv("MCP_ACCESS_KEY");
  const mcpAccessKey = rawAccessKey === undefined || rawAccessKey.trim() === "" ? undefined : rawAccessKey;
  // Vision is configured only with both an endpoint and a model (FR-006); otherwise none of it is kept.
  const visionApiBase = getEnv("VISION_API_BASE");
  const visionModel = getEnv("VISION_MODEL");
  const vision = visionApiBase !== undefined && visionModel !== undefined
    ? { visionApiBase, visionApiKey: getEnv("VISION_API_KEY"), visionModel }
    : { visionApiBase: undefined, visionApiKey: undefined, visionModel: undefined };
  const publicBaseUrl = (getEnv("PUBLIC_BASE_URL") ?? getEnv("SUPABASE_PUBLIC_URL") ?? getEnv("SUPABASE_URL") ?? "").replace(/\/+$/, "");
  if (mcpAccessKey === undefined) problems.push({ setting: "MCP_ACCESS_KEY", reason: "must be set" });
  const settings: Settings = {
    mcpAccessKey: mcpAccessKey ?? "",
    embeddingApiBase: text("EMBEDDING_API_BASE", "https://openrouter.ai/api/v1"),
    embeddingApiKey: getEnv("EMBEDDING_API_KEY") ?? getEnv("OPENROUTER_API_KEY"),
    embeddingModel: text("EMBEDDING_MODEL", "openai/text-embedding-3-small"),
    embeddingBatchSize: num("EMBEDDING_BATCH_SIZE", 64),
    ...vision,
    attachmentsBucket: text("ATTACHMENTS_BUCKET", "ob1-files"),
    maxImageMb: num("MAX_IMAGE_MB", 10, true),
    maxPdfMb: num("MAX_PDF_MB", 25, true),
    maxPdfPages: num("MAX_PDF_PAGES", 50),
    passageMaxChars: num("PASSAGE_MAX_CHARS", 1500),
    scannedMinCharsPerPage: num("SCANNED_MIN_CHARS_PER_PAGE", 20),
    uploadLinkMinutes: num("UPLOAD_LINK_MINUTES", 60),
    downloadLinkSeconds: num("DOWNLOAD_LINK_SECONDS", 600),
    busySeconds: num("BUSY_SECONDS", 410),
    publicBaseUrl,
    uploadPageUrl: getEnv("UPLOAD_PAGE_URL") ?? `${publicBaseUrl}/functions/v1/thought-attachments/upload`,
  };
  return problems.length ? { ok: false, problems } : { ok: true, settings };
}
