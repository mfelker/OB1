/** The phone upload page's routes (contracts/upload-page.md): token-only, JSON, no brain key. */
import { Hono } from "npm:hono@4.9.2";
import { baseName, checkDeclared } from "./intake.ts";
import { publicUrl } from "./links.ts";
import type { AcceptedType, AttachmentRow, Deps, Services } from "./types.ts";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ACCEPTED_TYPES: AcceptedType[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const megabytes = (mb: number) => Math.floor(mb * 1024 * 1024);

const EXPIRED = "This link has expired or was already used. Ask your assistant for a new one";

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** The page's routes (contracts/upload-page.md), as a Hono sub-app. */
export function pageRoutes(deps: Deps, services: Services): Hono {
  const app = new Hono();

  // CORS only for the page's own origin (or the function's own origin, when it serves the page).
  const pageOrigin = originOf(deps.settings.uploadPageUrl);
  app.use("/page/*", async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && (origin === pageOrigin || origin === new URL(c.req.url).origin)) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Vary", "Origin");
      c.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      c.header("Access-Control-Allow-Headers", "content-type");
    }
    if (c.req.method === "OPTIONS") return c.body(null, 204);
    await next();
  });

  /** The attachment a request's token is for, or null when the token is unknown, used or past its deadline. */
  async function attachmentFor(body: { token?: unknown }): Promise<AttachmentRow | null> {
    if (typeof body.token !== "string" || body.token === "") return null;
    const found = await deps.store.attachmentForPageToken(await sha256Hex(body.token));
    if (!("data" in found) || found.data === null) return null;
    if (deps.now().getTime() >= new Date(found.data.upload_deadline).getTime()) return null;
    return found.data;
  }

  app.post("/page/info", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const row = await attachmentFor(body);
    if (!row) return c.json({ error: EXPIRED }, 410);
    const { maxImageMb, maxPdfMb, maxPdfPages } = deps.settings;
    return c.json({
      expected_kind: row.expected_kind,
      accepted_types: ACCEPTED_TYPES,
      caps: { image_bytes: megabytes(maxImageMb), pdf_bytes: megabytes(maxPdfMb), pdf_pages: maxPdfPages },
    });
  });

  app.post("/page/start", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const row = await attachmentFor(body);
    if (!row) return c.json({ error: EXPIRED }, 410);
    if (!row.declared_by_page && row.declared_type !== null && row.declared_type !== body.type) {
      return c.json({ code: "wrong_type", message: "The picked file is " + body.type + ", not the declared " + row.declared_type + "." }, 400);
    }
    if (!row.declared_by_page && row.declared_size !== null && row.declared_size !== body.size) {
      return c.json({ code: "wrong_size", message: "The picked file is " + body.size + " bytes, not the declared " + row.declared_size + "." }, 400);
    }
    const name = baseName(body.name);
    const refusal = checkDeclared({ name, type: body.type, size: body.size }, deps.settings);
    if (refusal) return c.json(refusal, 400);
    if (row.expected_kind !== null && (body.type === "application/pdf") !== (row.expected_kind === "pdf")) {
      const wanted = row.expected_kind === "pdf" ? "a PDF" : "a photo (JPEG, PNG or WebP)";
      return c.json({ code: "wrong_type", message: "The assistant expected " + wanted + ", but the picked file is " + body.type + "." }, 400);
    }
    const path = `attachments/${row.id}/${name}`;
    await deps.store.setDeclaration(row.id, {
      file_name: name,
      declared_type: body.type as AcceptedType,
      declared_size: body.size,
      storage_path: path,
    });
    const signed = await deps.store.signUpload(path);
    if (!("data" in signed)) return c.json({ error: signed.error }, 500);
    return c.json({
      upload: { url: publicUrl(deps.settings, signed.data.url), method: "PUT", headers: { "content-type": body.type } },
    });
  });

  app.post("/page/finish", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const row = await attachmentFor(body);
    if (!row) return c.json({ error: EXPIRED }, 410);
    const outcome = await services.finish(row.id, {});
    // Busy and "no file uploaded yet" leave the token valid, so the page can retry (T005 Q5).
    const reachedOutcome = outcome.busy === undefined && outcome.state !== "pending_upload";
    if (reachedOutcome) await deps.store.consumePageToken(row.id, await sha256Hex(body.token));
    return c.json(outcome);
  });

  return app;
}
