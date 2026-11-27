// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Settings, UploadInstructions } from "./types.ts";

/** Rewrites a link's internal Supabase origin to PUBLIC_BASE_URL, keeping its path and query (R6). */
export function publicUrl(settings: Settings, url: string): string {
  // Signed links always come from the store's own Supabase origin, so whatever origin
  // the link has is the internal one; the rest of it is kept character for character.
  const rest = url.slice(new URL(url).origin.length);
  return settings.publicBaseUrl.replace(/\/+$/, "") + rest;
}

/** `UPLOAD_PAGE_URL#t=<token>` (contracts/upload-page.md "The link"). */
export function pageLink(settings: Settings, token: string): string {
  throw new Error("not implemented");
}

/** A ready-to-run curl PUT for a command upload (FR-002a). */
export function curlLine(upload: UploadInstructions, filePath: string): string {
  throw new Error("not implemented");
}
