// PDF text extraction using pdfjs-dist
import * as pdfjsLib from "pdfjs-dist";

// Use CDN-hosted worker to avoid Vite bundling / dynamic import issues in deployed previews.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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
