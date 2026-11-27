// Stub: throws until its stream replaces it (tasks.md "Seams").
import { extractText, getDocumentProxy } from "npm:unpdf@2.2.2";
import type { PdfDoc, R, Settings } from "./types.ts";

export async function openPdf(bytes: Uint8Array): Promise<R<PdfDoc>> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  return {
    data: {
      pageCount: pdf.numPages,
      pageTexts: async () => (await extractText(pdf, { mergePages: false })).text,
    },
  };
}

export function isScanned(pageTexts: string[], settings: Settings): boolean {
  const chars = pageTexts.reduce((sum, text) => sum + text.length, 0);
  return chars / pageTexts.length < settings.scannedMinCharsPerPage;
}
