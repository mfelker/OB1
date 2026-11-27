/** Links handed out to the owner: public Storage links, the phone page link and the curl line. */
import type { Settings, UploadInstructions } from "./types.ts";

/** Rewrites a link's internal Supabase origin to PUBLIC_BASE_URL, keeping its path and query (R6). */
export function publicUrl(settings: Settings, url: string): string {
  // Signed links always come from the store's own Supabase origin, so whatever origin
  // the link has is the internal one; the rest of it is kept character for character.
  const rest = url.slice(new URL(url).origin.length);
  return settings.publicBaseUrl + rest;
}

/** `UPLOAD_PAGE_URL#t=<token>` (contracts/upload-page.md "The link"). */
export function pageLink(settings: Settings, token: string): string {
  return `${settings.uploadPageUrl}#t=${token}`;
}

/** A ready-to-run curl PUT for a command upload (FR-002a). */
export function curlLine(upload: UploadInstructions, filePath: string): string {
  const headers = Object.entries(upload.headers).map(([k, v]) => ` -H ${shellQuote(`${k}: ${v}`)}`).join("");
  return `curl -X ${upload.method}${headers} -T ${shellQuote(filePath)} ${shellQuote(upload.url)}`;
}

/** One POSIX shell word: single-quoted, with each `'` written as `'\''`. */
function shellQuote(text: string): string {
  return `'${text.replaceAll("'", `'\\''`)}'`;
}
