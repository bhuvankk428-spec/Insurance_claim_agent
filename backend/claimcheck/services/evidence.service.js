import { extractText } from "./ocr.service.js";
import { extractFIRFields } from "./extractFields.service.js";
import { extractExif } from "./exif.service.js";
import { matchDocuments } from "./match.service.js";
import { claimStore } from "../store/claimStore.js";

// TOGGLE HERE
const STRICT_GEO_VALIDATION = process.env.STRICT_GEO === "true";

export async function checkEvidence(req, res) {
  const fir = req.files?.fir?.[0];
  const photos = req.files?.photos || [];
  const domain = req.body.claimType || "bike";
  const { claimId } = req.body; // ✅ READ claimId

  if (!claimId) {
    return res.json({
      status: "error",
      message: "Claim reference missing. Please restart the claim process.",
    });
  }

  const claim = claimStore.get(claimId); // ✅ FETCH CLAIM

  if (!claim || !claim.policyData) {
    return res.json({
      status: "error",
      message: "Policy context missing. Please re-upload policy document.",
    });
  }

  if (!fir || photos.length === 0) {
    return res.json({
      status: "error",
      message: "FIR and at least one image are required",
    });
  }

  /* ---------------- FIR OCR ---------------- */
  const firText = await extractText(fir.buffer, fir.mimetype);
  const firData = extractFIRFields(firText);

  /* ---------------- IMAGE CHECK ---------------- */
  let imageLocation = "UNKNOWN";
  let geoTagged = false;

  try {
    const geo = await extractExif(photos[0].buffer);
    if (geo?.latitude && geo?.longitude) {
      geoTagged = true;
      imageLocation = geo.resolvedLocation || "UNKNOWN";
    }
  } catch {
    // ignore EXIF errors in dev
  }

  if (STRICT_GEO_VALIDATION && !geoTagged) {
    return res.json({
      status: "error",
      message: "Image must be geo-tagged",
    });
  }


    /* ---------------- MATCH ---------------- */
  const result = matchDocuments({
    domain,
    policyData: claim.policyData,
    firData,
    imageLocation,
  });

  if (!result.ok) {
    return res.json({
      status: "error",
      message: result.reason,
    });
  }

  /* ---------------- STORE EVIDENCE ---------------- */
  claim.firData = firData;
  claim.imageLocation = imageLocation;
  claim.geoTagged = geoTagged;
  claim.matchLevel = result.level;   // ✅ ADD THIS LINE

  claimStore.set(claimId, claim);


  /* ---------------- SUCCESS ---------------- */
  return res.json({
    status: "success",
    geoTagged,
    mode: STRICT_GEO_VALIDATION ? "production" : "development",
    message: STRICT_GEO_VALIDATION
      ? "Documents matched successfully (geo verified)"
      : "Documents matched successfully (geo skipped for demo)",
  });
}
