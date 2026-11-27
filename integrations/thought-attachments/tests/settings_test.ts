/** loadSettings (T008): contracts/settings.md, FR-017, R3, R6, R10, R13. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";

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
