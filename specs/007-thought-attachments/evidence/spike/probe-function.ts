import { extractText, getDocumentProxy } from "npm:unpdf@2.2.3";
import { encodeBase64 } from "jsr:@std/encoding@1.0.10/base64";
const enc = new TextEncoder();
async function sha256(s: string) { const h = await crypto.subtle.digest("SHA-256", enc.encode(s)); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
Deno.serve(async (req) => {
  const body = await req.json();
  if (body.mode === "image") { const t0 = performance.now(); const b = new Uint8Array(await (await fetch(body.url)).arrayBuffer()); const t1 = performance.now(); const payload = JSON.stringify({ model: "x", messages: [{ role: "user", content: [{ type: "text", text: "Describe" }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + encodeBase64(b) } }] }] }); const t2 = performance.now(); return Response.json({ bytes: b.length, payloadMB: +(payload.length / 1048576).toFixed(1), ms: { download: Math.round(t1 - t0), encode: Math.round(t2 - t1) } }); }
  const { url, chunkChars = 1500, fakeEmbed = true } = body;
  const t = { start: performance.now() } as Record<string, number>;
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer()); t.downloaded = performance.now();
  const pdf = await getDocumentProxy(bytes); t.opened = performance.now();
  const { totalPages, text } = await extractText(pdf, { mergePages: false }); t.extracted = performance.now();
  const chunks: string[] = [];
  (text as string[]).forEach((pageText, i) => { const clean = pageText.replace(/\s+/g, " ").trim(); for (let o = 0; o < clean.length; o += chunkChars) chunks.push(`From manual.pdf, page ${i + 1} (attachment abc123): ` + clean.slice(o, o + chunkChars)); });
  const fps = await Promise.all(chunks.map(sha256)); t.chunked = performance.now();
  let parsedFloats = 0;
  if (fakeEmbed) { const vec = JSON.stringify({ data: chunks.map((_, i) => ({ index: i, embedding: Array.from({ length: 1536 }, (_, k) => Math.sin(i + k) * 0.01) })) }); const back = JSON.parse(vec); parsedFloats = back.data.length * 1536; JSON.stringify(chunks.map((c, i) => ({ content: c, fp: fps[i], embedding: back.data[i].embedding }))); }
  t.embedSim = performance.now();
  const ms = (a: string, b: string) => Math.round(t[b] - t[a]);
  return Response.json({ bytes: bytes.length, totalPages, chunks: chunks.length, chars: chunks.reduce((n, c) => n + c.length, 0), parsedFloats, ms: { download: ms("start", "downloaded"), open: ms("downloaded", "opened"), extract: ms("opened", "extracted"), chunkHash: ms("extracted", "chunked"), embedSim: ms("chunked", "embedSim"), total: ms("start", "embedSim") } });
});
