import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";
const words = "filter pump drain valve rinse cycle detergent spray arm gasket hose inlet heater sensor door latch rack basket reset error code clean descale water softener salt warranty".split(" ");
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const sentence = () => Array.from({ length: 8 + Math.floor(rnd() * 10) }, () => words[Math.floor(rnd() * words.length)]).join(" ") + ".";
async function make(pages: number, padMB: number, name: string) {
  const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([612, 792]); let y = 760;
    page.drawText(`Section ${p + 1}: Maintenance`, { x: 50, y, size: 14, font }); y -= 24;
    while (y > 40) { page.drawText(sentence() + " " + sentence(), { x: 50, y, size: 8, font }); y -= 11; }
  }
  if (padMB > 0) { const pad = new Uint8Array(padMB * 1024 * 1024); crypto.getRandomValues(pad.subarray(0, 65536)); for (let i = 65536; i < pad.length; i += 65536) pad.set(pad.subarray(0, 65536), i); await doc.attach(pad, "pad.bin", { mimeType: "application/octet-stream" }); }
  const bytes = await doc.save({ useObjectStreams: false }); await Deno.writeFile(`${Deno.args[0]}/${name}`, bytes);
  console.log(name, pages, "pages", (bytes.length / 1048576).toFixed(1), "MB");
}
await make(10, 0, "m10.pdf"); await make(50, 0, "m50.pdf"); await make(50, 24, "m50-25mb.pdf"); await make(100, 0, "m100.pdf");
