import { exiftool } from "exiftool-vendored";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ALLOW_FAKE_GEO = process.env.ALLOW_FAKE_GEO === "true";

function extensionFromMime(mimeType = "") {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return map[mimeType.toLowerCase()] || ".jpg";
}

function normalizeCoordinate(value, ref) {
  if (value === null || value === undefined || value === "") return null;

  let parsed = null;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    const cleaned = value.trim();
    const numeric = Number(cleaned);
    if (Number.isFinite(numeric)) {
      parsed = numeric;
    } else {
      const dmsMatch = cleaned.match(
        /(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?\D*([NSEW])?/i
      );
      if (dmsMatch) {
        const deg = Number(dmsMatch[1] || 0);
        const min = Number(dmsMatch[2] || 0);
        const sec = Number(dmsMatch[3] || 0);
        const hemi = (dmsMatch[4] || "").toUpperCase();
        const abs = deg + min / 60 + sec / 3600;
        parsed = hemi === "S" || hemi === "W" ? -abs : abs;
      }
    }
  }

  if (!Number.isFinite(parsed)) return null;

  const signRef = String(ref || "").trim().toUpperCase();
  if (signRef === "S" || signRef === "W") return -Math.abs(parsed);
  if (signRef === "N" || signRef === "E") return Math.abs(parsed);
  return parsed;
}

function getGps(data = {}) {
  const latitudeRaw = data.GPSLatitude ?? data["Composite:GPSLatitude"];
  const longitudeRaw = data.GPSLongitude ?? data["Composite:GPSLongitude"];

  const latitude = normalizeCoordinate(latitudeRaw, data.GPSLatitudeRef);
  const longitude = normalizeCoordinate(longitudeRaw, data.GPSLongitudeRef);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }

  return null;
}

export async function extractExif(buffer, mimeType) {
  const tempFile = path.join(
    os.tmpdir(),
    `img-${crypto.randomUUID()}${extensionFromMime(mimeType)}`
  );

  try {
    fs.writeFileSync(tempFile, buffer);
    const data = await exiftool.read(tempFile);
    const gps = getGps(data);

    // DEV MODE: allow fallback location when GPS is missing.
    if (ALLOW_FAKE_GEO && !gps) {
      console.warn("DEV MODE: Fake geo location used");
      return {
        latitude: 12.9716,
        longitude: 77.5946, // Bengaluru
      };
    }

    return gps || { latitude: null, longitude: null };
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}
