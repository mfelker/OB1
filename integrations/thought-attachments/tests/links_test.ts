/** links (T009): research R6, contracts/upload-page.md "The link", FR-002, FR-002a. */
import { assertEquals } from "jsr:@std/assert@1.0.19";
import { publicUrl } from "../src/links.ts";
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
