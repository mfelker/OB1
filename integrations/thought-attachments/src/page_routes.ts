/** The phone upload page's routes (contracts/upload-page.md): token-only, JSON, no brain key. */
import { Hono } from "npm:hono@4.9.2";
import { baseName, checkDeclared } from "./intake.ts";
import { publicUrl } from "./links.ts";
import type { AcceptedType, Deps, Services } from "./types.ts";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EXPIRED = "This link has expired or was already used. Ask your assistant for a new one";

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** The page's routes (contracts/upload-page.md), as a Hono sub-app. */
export function pageRoutes(deps: Deps, _services: Services): Hono {
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
  // Attachments whose declaration came from this page: a new pick replaces those. A declaration
  // from the attach call is confirmed, never replaced. (No column tells them apart.)
  const declaredByPage = new Set<string>();

  app.post("/page/start", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const found = typeof body.token === "string" && body.token !== ""
      ? await deps.store.attachmentForPageToken(await sha256Hex(body.token))
      : null;
    if (!found || !("data" in found) || found.data === null) return c.json({ error: EXPIRED }, 410);
    const row = found.data;
    if (deps.now().getTime() >= new Date(row.upload_deadline).getTime()) return c.json({ error: EXPIRED }, 410);
    if (!declaredByPage.has(row.id) && row.declared_type !== null && row.declared_type !== body.type) {
      return c.json({ code: "wrong_type", message: "The picked file is " + body.type + ", not the declared " + row.declared_type + "." }, 400);
    }
    if (!declaredByPage.has(row.id) && row.declared_size !== null && row.declared_size !== body.size) {
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
    declaredByPage.add(row.id);
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

  return app;
}
