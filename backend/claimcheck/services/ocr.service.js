import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import Tesseract from "tesseract.js";
import PDFParser from "pdf2json";
import { PDFParse } from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfjsBase = path.dirname(require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl =
  pathToFileURL(path.join(pdfjsBase, "standard_fonts")).toString() + "/";
const cMapUrl = pathToFileURL(path.join(pdfjsBase, "cmaps")).toString() + "/";

function extractPdf2JsonText(fileBuffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1);
    parser.once("pdfParser_dataError", (error) => {
      reject(error?.parserError || error);
    });
    parser.once("pdfParser_dataReady", () => {
      resolve(parser.getRawTextContent()?.trim() || "");
    });
    parser.parseBuffer(fileBuffer);
  });
}

async function extractPdfText(fileBuffer) {
  const maxPages = Number(process.env.PDF_TEXT_MAX_PAGES || 5);

  // This parser is self-contained and avoids the external font/worker files
  // that serverless bundlers can omit from PDF.js deployments.
  try {
    const text = await extractPdf2JsonText(fileBuffer);
    if (text) return text;
  } catch {
    // Continue with the other parsers for PDFs pdf2json cannot read.
  }

  // pdf-parse packages its worker with the parser and is reliable in Vercel's
  // serverless bundle. PDF.js remains below as a fallback for malformed files.
  let parser;
  try {
    parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText({
      partial: Array.from({ length: maxPages }, (_, index) => index + 1),
    });
    if (result?.text?.trim()) return result.text.trim();
  } catch {
    // Fall through to the lower-level parser.
  } finally {
    await parser?.destroy?.().catch(() => undefined);
  }

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

async function extractPdfOcrText(fileBuffer) {
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
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
    const imageBuffer = canvas.toBuffer("image/png");
    const { data } = await Tesseract.recognize(imageBuffer, "eng");
    if (data?.text) text += data.text + "\n";
  }

  return text.trim();
}

/**
 * Extract text from PDF or image
 */
export async function extractText(fileBuffer, mimeType, options = {}) {
  // IMAGE (JPG / PNG)
  if (mimeType.startsWith("image/")) {
    const { data } = await Tesseract.recognize(fileBuffer, "eng");
    return data.text;
  }

  if (options.forceOcr) {
    try {
      return await extractPdfOcrText(fileBuffer);
    } catch {
      return "";
    }
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
    return await extractPdfOcrText(fileBuffer);
  } catch {
    return "";
  }
}
