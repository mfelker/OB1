/** loadSettings (T008): contracts/settings.md, FR-017, R3, R6, R10, R13. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { EMBEDDING_API_KEY, envGetter, PUBLIC_BASE_URL, SUPABASE_URL } from "./helpers/env.ts";

/** Loads settings over the baseline env with `overrides`, and fails the test unless the result is ok. */
function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings, got problems: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

Deno.test("U1 each documented default applies when its variable is unset", () => {
  const s = settingsWith({ EMBEDDING_API_BASE: undefined, EMBEDDING_MODEL: undefined });
  assertEquals(
    {
      embeddingApiBase: s.embeddingApiBase,
      embeddingModel: s.embeddingModel,
      embeddingBatchSize: s.embeddingBatchSize,
      attachmentsBucket: s.attachmentsBucket,
      maxImageMb: s.maxImageMb,
      maxPdfMb: s.maxPdfMb,
      maxPdfPages: s.maxPdfPages,
      passageMaxChars: s.passageMaxChars,
      scannedMinCharsPerPage: s.scannedMinCharsPerPage,
      uploadLinkMinutes: s.uploadLinkMinutes,
      downloadLinkSeconds: s.downloadLinkSeconds,
    },
    {
      embeddingApiBase: "https://openrouter.ai/api/v1",
      embeddingModel: "openai/text-embedding-3-small",
      embeddingBatchSize: 64,
      attachmentsBucket: "ob1-files",
      maxImageMb: 10,
      maxPdfMb: 25,
      maxPdfPages: 50,
      passageMaxChars: 1500,
      scannedMinCharsPerPage: 20,
      uploadLinkMinutes: 60,
      downloadLinkSeconds: 600,
    },
  );
});

Deno.test("U2 a set variable overrides its default", () => {
  const s = settingsWith({ MAX_PDF_PAGES: "30", ATTACHMENTS_BUCKET: "files" });
  assertEquals({ maxPdfPages: s.maxPdfPages, attachmentsBucket: s.attachmentsBucket }, {
    maxPdfPages: 30,
    attachmentsBucket: "files",
  });
});

const OPENROUTER_KEY = "test-openrouter-key-placeholder";

Deno.test("U3 with EMBEDDING_API_KEY unset the embedding key is OPENROUTER_API_KEY", () => {
  const s = settingsWith({ EMBEDDING_API_KEY: undefined, OPENROUTER_API_KEY: OPENROUTER_KEY });
  assertEquals(s.embeddingApiKey, OPENROUTER_KEY);
});

Deno.test("U4 with both set EMBEDDING_API_KEY wins over OPENROUTER_API_KEY", () => {
  const s = settingsWith({ EMBEDDING_API_KEY: EMBEDDING_API_KEY, OPENROUTER_API_KEY: OPENROUTER_KEY });
  assertEquals(s.embeddingApiKey, EMBEDDING_API_KEY);
});

const SUPABASE_PUBLIC = "http://192.168.1.20:8000";

Deno.test("U5 with PUBLIC_BASE_URL unset the public base is SUPABASE_PUBLIC_URL", () => {
  const s = settingsWith({ PUBLIC_BASE_URL: undefined, SUPABASE_PUBLIC_URL: SUPABASE_PUBLIC });
  assertEquals(s.publicBaseUrl, SUPABASE_PUBLIC);
});

Deno.test("U6 with PUBLIC_BASE_URL and SUPABASE_PUBLIC_URL unset the public base is SUPABASE_URL", () => {
  const s = settingsWith({ PUBLIC_BASE_URL: undefined, SUPABASE_PUBLIC_URL: undefined });
  assertEquals(s.publicBaseUrl, SUPABASE_URL);
});

Deno.test("U7 a set PUBLIC_BASE_URL wins over both fallbacks", () => {
  const s = settingsWith({ SUPABASE_PUBLIC_URL: SUPABASE_PUBLIC });
  assertEquals(s.publicBaseUrl, PUBLIC_BASE_URL);
});

/** Loads settings over the baseline env with `overrides`, and fails the test unless the result has problems. */
function problemsWith(overrides: Record<string, string | undefined>): { setting: string; reason: string }[] {
  const result = loadSettings(envGetter(overrides));
  if (result.ok) throw new Error("expected settings problems, got ok settings");
  return result.problems;
}

Deno.test("U8 with MCP_ACCESS_KEY unset the result is not ok, with a problem naming MCP_ACCESS_KEY", () => {
  const problems = problemsWith({ MCP_ACCESS_KEY: undefined });
  assertEquals(problems.map((p) => p.setting), ["MCP_ACCESS_KEY"]);
});
