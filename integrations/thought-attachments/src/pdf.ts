// Stub: throws until its stream replaces it (tasks.md "Seams").
import { getDocumentProxy } from "npm:unpdf@2.2.2";
import type { PdfDoc, R, Settings } from "./types.ts";

export async function openPdf(bytes: Uint8Array): Promise<R<PdfDoc>> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  return {
    data: {
      pageCount: pdf.numPages,
      pageTexts: () => {
        throw new Error("not implemented");
      },
    },
  };
}

export function isScanned(pageTexts: string[], settings: Settings): boolean {
  throw new Error("not implemented");
}
