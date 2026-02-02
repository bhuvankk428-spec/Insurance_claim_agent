import { exiftool } from "exiftool-vendored";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ALLOW_FAKE_GEO = process.env.ALLOW_FAKE_GEO === "true";

export async function extractExif(buffer) {
  const tempFile = path.join(
    os.tmpdir(),
    `img-${crypto.randomUUID()}.jpg`
  );

  try {
    fs.writeFileSync(tempFile, buffer);
    const data = await exiftool.read(tempFile);

    // ✅ DEV MODE: allow fake location
    if (
      ALLOW_FAKE_GEO &&
      (!data.GPSLatitude || !data.GPSLongitude)
    ) {
      console.warn("⚠️ DEV MODE: Fake geo location used");
      return {
        latitude: 12.9716,
        longitude: 77.5946 // Bengaluru
      };
    }

    return {
      latitude: data.GPSLatitude,
      longitude: data.GPSLongitude
    };
  } finally {
    fs.unlinkSync(tempFile);
  }
}
