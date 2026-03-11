import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfjsBase = path.dirname(require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl =
  pathToFileURL(path.join(pdfjsBase, "standard_fonts")).toString() + "/";
const cMapUrl = pathToFileURL(path.join(pdfjsBase, "cmaps")).toString() + "/";

async function extractPdfText(fileBuffer) {
  const maxPages = Number(process.env.PDF_TEXT_MAX_PAGES || 5);
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    disableWorker: true,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
    disableFontFace: true,
  }).promise;

  const totalPages = Math.min(doc.numPages || 0, maxPages);
  let text = "";

  for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || [])
      .map((item) => item.str)
      .join("\n");
    if (pageText) text += pageText + "\n";
  }

  return text.trim();
}

/**
 * Extract text from PDF or image
 */
export async function extractText(fileBuffer, mimeType) {
  // IMAGE (JPG / PNG)
  if (mimeType.startsWith("image/")) {
    const { data } = await Tesseract.recognize(fileBuffer, "eng");
    return data.text;
  }

  // PDF (text extraction only; no OCR on PDF buffer)
  try {
    const pdfText = await extractPdfText(fileBuffer);
    if (pdfText && pdfText.trim().length > 0) return pdfText;
  } catch {
    // fall through to return empty text
  }

  // Scanned PDFs: render pages to images and OCR.
  try {
    const maxPages = Number(process.env.OCR_PDF_MAX_PAGES || 3);
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(fileBuffer),
      disableWorker: true,
      standardFontDataUrl,
      cMapUrl,
      cMapPacked: true,
      disableFontFace: true,
    }).promise;

    const totalPages = Math.min(doc.numPages || 0, maxPages);
    let text = "";

    for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
      const page = await doc.getPage(pageNo);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      const imageBuffer = canvas.toBuffer("image/png");
      const { data } = await Tesseract.recognize(imageBuffer, "eng");
      if (data?.text) text += data.text + "\n";
    }

    return text.trim();
  } catch {
    return "";
  }
}
