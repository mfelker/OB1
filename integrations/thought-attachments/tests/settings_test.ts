/** loadSettings (T008): contracts/settings.md, FR-017, R3, R6, R10, R13. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import {
  EMBEDDING_API_KEY,
  envGetter,
  PUBLIC_BASE_URL,
  SUPABASE_URL,
  VISION_API_BASE,
  VISION_MODEL,
} from "./helpers/env.ts";

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

/** The vision part of settings: all three undefined means vision is not configured (FR-006). */
const visionOf = (s: Settings) => ({ base: s.visionApiBase, key: s.visionApiKey, model: s.visionModel });
const NOT_CONFIGURED = { base: undefined, key: undefined, model: undefined };

Deno.test("U9 with VISION_API_BASE or VISION_MODEL unset (each alone) vision is not configured", () => {
  assertEquals(visionOf(settingsWith({ VISION_API_BASE: undefined })), NOT_CONFIGURED);
  assertEquals(visionOf(settingsWith({ VISION_MODEL: undefined })), NOT_CONFIGURED);
});

Deno.test("U10 with VISION_API_BASE and VISION_MODEL set and VISION_API_KEY unset vision is configured", () => {
  assertEquals(visionOf(settingsWith({ VISION_API_KEY: undefined })), {
    base: VISION_API_BASE,
    key: undefined,
    model: VISION_MODEL,
  });
});

Deno.test("U12 a set BUSY_SECONDS is used as given", () => {
  assertEquals(settingsWith({ BUSY_SECONDS: "160" }).busySeconds, 160);
});

Deno.test("U13 with BUSY_SECONDS unset the busy expiry is 410 seconds on every platform", () => {
  const cloud = { SUPABASE_URL: "https://abcdefghijklmnop.supabase.co", PUBLIC_BASE_URL: undefined };
  assertEquals([settingsWith().busySeconds, settingsWith(cloud).busySeconds], [410, 410]);
});

Deno.test("U15 a set UPLOAD_PAGE_URL is used as given", () => {
  const published = "https://pages.example.test/ob1/upload-page.html";
  assertEquals(settingsWith({ UPLOAD_PAGE_URL: published }).uploadPageUrl, published);
});

Deno.test("U16 with UPLOAD_PAGE_URL unset the page address is the public base plus the function's upload path", () => {
  const s = settingsWith({ PUBLIC_BASE_URL: "https://brain.example", UPLOAD_PAGE_URL: undefined });
  assertEquals(s.uploadPageUrl, "https://brain.example/functions/v1/thought-attachments/upload");
});

const WHOLE = "must be a positive whole number";

Deno.test("U17 a non-numeric value for a numeric setting is a problem naming it and what it must be", () => {
  assertEquals(problemsWith({ MAX_PDF_PAGES: "abc" }), [{ setting: "MAX_PDF_PAGES", reason: WHOLE }]);
});

Deno.test("U18 a zero or negative value for a whole-number setting is a problem naming it", () => {
  assertEquals(
    [problemsWith({ MAX_PDF_PAGES: "0" }), problemsWith({ MAX_PDF_PAGES: "-1" })],
    [[{ setting: "MAX_PDF_PAGES", reason: WHOLE }], [{ setting: "MAX_PDF_PAGES", reason: WHOLE }]],
  );
});

Deno.test("U19 a decimal MB cap is accepted as given", () => {
  assertEquals(settingsWith({ MAX_IMAGE_MB: "2.5" }).maxImageMb, 2.5);
});

Deno.test("U308 a decimal value for a whole-number setting is a problem naming it", () => {
  assertEquals(
    [problemsWith({ MAX_PDF_PAGES: "2.5" }), problemsWith({ BUSY_SECONDS: "1.5" })],
    [[{ setting: "MAX_PDF_PAGES", reason: WHOLE }], [{ setting: "BUSY_SECONDS", reason: WHOLE }]],
  );
});
