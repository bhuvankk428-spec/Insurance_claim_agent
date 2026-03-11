import { extractText } from "./ocr.service.js";
import { extractGeoFromImageWithVision } from "./image.service.js";

function isValidLatitude(value) {
  return Number.isFinite(value) && Math.abs(value) <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && Math.abs(value) <= 180;
}

function normalizePair(latitude, longitude, source) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!isValidLatitude(lat) || !isValidLongitude(lon)) return null;
  return { latitude: lat, longitude: lon, source };
}

function parseLabeledPair(text) {
  const pattern =
    /(?:lat|latitude)\s*[:=]?\s*([+-]?\d{1,2}(?:\.\d+)?)[^\d+-]+(?:lon|long|longitude)\s*[:=]?\s*([+-]?\d{1,3}(?:\.\d+)?)/i;
  const match = text.match(pattern);
  if (!match) return null;
  return normalizePair(match[1], match[2], "ocr-labeled");
}

function parseDecimalPair(text) {
  // Common overlays: "12.9715987,77.5945627" or "12.9715987 77.5945627"
  const pattern = /([+-]?\d{1,2}\.\d{4,})[,\s]+([+-]?\d{1,3}\.\d{4,})/g;
  let match = pattern.exec(text);
  while (match) {
    const pair = normalizePair(match[1], match[2], "ocr-decimal-pair");
    if (pair) return pair;
    match = pattern.exec(text);
  }
  return null;
}

function parseCoordinatesFromText(text) {
  if (!text) return null;
  const compact = String(text).replace(/\s+/g, " ").trim();
  if (!compact) return null;
  return parseLabeledPair(compact) || parseDecimalPair(compact);
}

export async function extractGeoFromImageText(buffer, mimeType) {
  try {
    const ocrText = await extractText(buffer, mimeType);
    const parsedFromOcr = parseCoordinatesFromText(ocrText);
    if (parsedFromOcr) {
      return parsedFromOcr;
    }
  } catch {
    console.log("error from ocr moving to openai vision");
  }

  const parsedFromVision = await extractGeoFromImageWithVision({
    buffer,
    mimeType,
  });
  if (parsedFromVision) {
    return normalizePair(
      parsedFromVision.latitude,
      parsedFromVision.longitude,
      parsedFromVision.source || "vision"
    );
  }

  return null;
}
