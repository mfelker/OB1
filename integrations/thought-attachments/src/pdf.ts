// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { PdfDoc, R, Settings } from "./types.ts";

export function openPdf(bytes: Uint8Array): Promise<R<PdfDoc>> {
  throw new Error("not implemented");
}

export function isScanned(pageTexts: string[], settings: Settings): boolean {
  throw new Error("not implemented");
}
