/** links (T009): research R6, contracts/upload-page.md "The link", FR-002, FR-002a. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { curlLine, pageLink, publicUrl } from "../src/links.ts";
import { loadSettings } from "../src/settings.ts";
import type { Settings } from "../src/types.ts";
import { envGetter } from "./helpers/env.ts";

function settingsWith(overrides: Record<string, string | undefined> = {}): Settings {
  const result = loadSettings(envGetter(overrides));
  if (!result.ok) throw new Error(`expected ok settings, got problems: ${JSON.stringify(result.problems)}`);
  return result.settings;
}

/** The path and query of a signed upload link as Storage returns it, with characters that must survive untouched. */
const SIGNED_PATH = "/storage/v1/object/upload/sign/ob1-files/attachments/a1b2/manual%20v2.pdf?token=eyJhbGci.x-y_z%2B1";

Deno.test("U20 publicUrl replaces a signed link's internal origin with PUBLIC_BASE_URL and keeps its path and query", () => {
  const settings = settingsWith({ SUPABASE_URL: "http://api-gw:8000", PUBLIC_BASE_URL: "http://192.168.1.20:8000" });
  assertEquals(publicUrl(settings, `http://api-gw:8000${SIGNED_PATH}`), `http://192.168.1.20:8000${SIGNED_PATH}`);
});

Deno.test("U21 publicUrl returns the link unchanged when PUBLIC_BASE_URL is already its origin", () => {
  const cloud = "https://abcdefghijklmnop.supabase.co";
  const settings = settingsWith({ SUPABASE_URL: cloud, PUBLIC_BASE_URL: undefined, SUPABASE_PUBLIC_URL: undefined });
  assertEquals(publicUrl(settings, `${cloud}${SIGNED_PATH}`), `${cloud}${SIGNED_PATH}`);
});

Deno.test("U22 pageLink is UPLOAD_PAGE_URL then #t= then the token, with the token nowhere before the #", () => {
  const page = "https://pages.example.test/ob1/upload-page.html";
  const token = "Zm9yLXRoZS1wYWdlLW9ubHk";
  const link = pageLink(settingsWith({ UPLOAD_PAGE_URL: page }), token);
  assertEquals([link, link.split("#")[0].includes(token)], [`${page}#t=${token}`, false]);
});

/** Upload instructions as attach_file returns them (contracts/mcp-tools.md). */
const UPLOAD = {
  url: `https://brain.example.test${SIGNED_PATH}`,
  method: "PUT" as const,
  headers: { "content-type": "application/pdf", "x-upsert": "false" },
};

Deno.test("U23 curlLine is a PUT to the upload URL carrying every returned header and the given file path", () => {
  assertEquals(
    curlLine(UPLOAD, "/home/owner/My Manuals/dishwasher's manual.pdf"),
    "curl -X PUT -H 'content-type: application/pdf' -H 'x-upsert: false'" +
      " -T '/home/owner/My Manuals/dishwasher'\\''s manual.pdf'" +
      ` '${UPLOAD.url}'`,
  );
});
