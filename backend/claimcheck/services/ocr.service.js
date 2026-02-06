import { createRequire } from "module";
import Tesseract from "tesseract.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

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
    const pdfData = await pdf(fileBuffer);
    if (pdfData.text && pdfData.text.trim().length > 0) {
      return pdfData.text;
    }
  } catch {
    // fall through to return empty text
  }

  // Scanned PDFs are not supported without conversion to images.
  return "";
}
