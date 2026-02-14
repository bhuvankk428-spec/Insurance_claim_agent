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

function normalizePair(rawLatitude, rawLongitude, latitudeRef, longitudeRef) {
  const latitude = normalizeCoordinate(rawLatitude, latitudeRef);
  const longitude = normalizeCoordinate(rawLongitude, longitudeRef);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }
  return null;
}

function parseGpsPosition(position) {
  if (position === null || position === undefined) return null;

  if (Array.isArray(position) && position.length >= 2) {
    return normalizePair(position[0], position[1], null, null);
  }

  if (typeof position === "string") {
    const cleaned = position.trim();

    // Example: "12.958746 77.557346"
    const parts = cleaned.split(/[,\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const direct = normalizePair(parts[0], parts[1], null, null);
      if (direct) return direct;
    }

    // Example: "12 deg 34' 56.7\" N, 77 deg 33' 12.5\" E"
    const dmsMatch = cleaned.match(
      /(\d+(?:\.\d+)?(?:\D+\d+(?:\.\d+)?)?(?:\D+\d+(?:\.\d+)?)?\D*[NS])\D+(\d+(?:\.\d+)?(?:\D+\d+(?:\.\d+)?)?(?:\D+\d+(?:\.\d+)?)?\D*[EW])/i
    );
    if (dmsMatch) {
      const dms = normalizePair(dmsMatch[1], dmsMatch[2], null, null);
      if (dms) return dms;
    }
  }

  return null;
}

function getGps(data = {}) {
  const direct = normalizePair(
    data.GPSLatitude ?? data["Composite:GPSLatitude"] ?? data.CompositeGPSLatitude,
    data.GPSLongitude ??
      data["Composite:GPSLongitude"] ??
      data.CompositeGPSLongitude,
    data.GPSLatitudeRef,
    data.GPSLongitudeRef
  );
  if (direct) {
    return direct;
  }

  const position =
    parseGpsPosition(data.GPSPosition) ??
    parseGpsPosition(data["Composite:GPSPosition"]) ??
    parseGpsPosition(data.CompositeGPSPosition);

  if (position) {
    return position;
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
