// PDF text extraction using pdfjs-dist
import * as pdfjsLib from "pdfjs-dist";
// Bundle the worker as a real Web Worker — this is the most reliable Vite pattern
// and avoids dynamic import / MIME-type issues in deployed previews.
// @ts-ignore
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str || "");
    text += strings.join(" ") + "\n\n";
  }
  return text.trim();
}
