import pdf from "pdf-parse";
import Tesseract from "tesseract.js";

/**
 * Extract text from PDF or image
 */
export async function extractText(fileBuffer, mimeType) {
  // IMAGE (JPG / PNG)
  if (mimeType.startsWith("image/")) {
    const { data } = await Tesseract.recognize(fileBuffer, "eng");
    return data.text;
  }

  // PDF
  const pdfData = await pdf(fileBuffer);
  if (pdfData.text.trim().length > 50) {
    return pdfData.text;
  }

  // SCANNED PDF → OCR
  const { data } = await Tesseract.recognize(fileBuffer, "eng");
  return data.text;
}
