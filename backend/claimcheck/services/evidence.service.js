import { extractText } from "./ocr.service.js";
import { extractFIRFields } from "./extractFields.service.js";
import { extractExif } from "./exif.service.js";
import { extractGeoFromImageText } from "./geoText.service.js";
import { matchDocuments, detectDomain } from "./match.service.js";
import { verifyIncidentWithVision } from "./image.service.js";
import { validateFirDocument } from "./documentValidation.service.js";
import {
  buildClaimContext,
  getClaim,
  restoreClaimFromContext,
  saveClaim,
} from "../store/claimStore.js";

// Geo is a positive signal only (no hard rejection)
const STRICT_GEO_VALIDATION = process.env.STRICT_GEO === "true";
const LOG_GEO_DETAILS = process.env.LOG_GEO_DETAILS !== "false";

export async function checkEvidence(req, res) {
  const fir = req.files?.fir?.[0];
  const photos = req.files?.photos || [];
  const { claimId } = req.body;
  const rawClaimContext = req.body?.claimContext;

  if (!claimId) {
    return res.json({
      status: "error",
      message: "Claim reference missing. Please restart the claim process.",
    });
  }

  let claim = await getClaim(claimId);
  if ((!claim || !claim.policyData) && rawClaimContext) {
    try {
      const parsedContext =
        typeof rawClaimContext === "string"
          ? JSON.parse(rawClaimContext)
          : rawClaimContext;
      claim = await restoreClaimFromContext(claimId, parsedContext);
    } catch {
      claim = null;
    }
  }

  if (!claim || !claim.policyData) {
    return res.json({
      status: "error",
      message: "Policy context missing. Please re-upload policy document.",
    });
  }

  const domain = req.body.claimType || claim?.domain || "automobile";

  if (!fir || photos.length === 0) {
    return res.json({
      status: "error",
      message: "Evidence document and at least one image are required",
    });
  }

  if (fir.mimetype !== "application/pdf") {
    return res.json({
      status: "error",
      message: "Evidence document must be a PDF",
    });
  }

  /* ---------------- FIR OCR ---------------- */
  const firText = await extractText(fir.buffer, fir.mimetype);
  const firData = extractFIRFields(firText);
  const resolvedDomain = detectDomain(firText, claim.policyData) || domain;
  const firValidation = validateFirDocument(resolvedDomain, firData);

  if (!firValidation.ok) {
    return res.json({
      status: "error",
      message: firValidation.message,
      missingFields: firValidation.missingFields,
    });
  }

  /* ---------------- IMAGE CHECK ---------------- */
  let imageLocation = "UNKNOWN";
  let geoTagged = false;

  try {
    let firstGeo = null;

    for (const photo of photos) {
      const geo = await extractExif(photo.buffer, photo.mimetype);
      let hasGps =
        Number.isFinite(geo?.latitude) && Number.isFinite(geo?.longitude);
      let geoSource = hasGps ? "exif" : "none";

      let fallbackGeo = null;
      if (!hasGps) {
        fallbackGeo = await extractGeoFromImageText(photo.buffer, photo.mimetype);
        hasGps =
          Number.isFinite(fallbackGeo?.latitude) &&
          Number.isFinite(fallbackGeo?.longitude);
        if (hasGps) {
          geoSource = fallbackGeo?.source || "overlay";
        }
      }

      if (LOG_GEO_DETAILS) {
        console.info("[geo-check]", {
          file: photo.originalname,
          mimeType: photo.mimetype,
          sizeBytes: photo.size,
          geoDetected: hasGps,
          geoSource,
          latitude: hasGps ? (fallbackGeo?.latitude ?? geo.latitude) : null,
          longitude: hasGps ? (fallbackGeo?.longitude ?? geo.longitude) : null,
        });
      }

      if (!firstGeo && hasGps) {
        firstGeo = fallbackGeo || geo;
      }
    }

    if (firstGeo) {
      geoTagged = true;
      imageLocation = firstGeo.resolvedLocation || "UNKNOWN";
    }
  } catch (error) {
    if (LOG_GEO_DETAILS) {
      console.warn("[geo-check] exif extraction failed", {
        error: error?.message || "unknown error",
      });
    }
  }

  // If geo is missing, continue. Geo is a bonus signal only.

  /* ---------------- MATCH ---------------- */
  const result = matchDocuments({
    domain: resolvedDomain,
    policyData: claim.policyData,
    firData,
    imageLocation,
    geoTagged,
  });

  const evidenceIssues = [];
  if (!result.ok) {
    evidenceIssues.push(result.reason);
  }

  /* ---------------- VISION CHECK ---------------- */
  const vision = await verifyIncidentWithVision({
    image: photos[0],
    incident: firData?.incident,
    domain: resolvedDomain,
    policyData: claim.policyData,
    firData,
  });

  if (vision.status === "reject") {
    evidenceIssues.push(vision.reason || "Image does not match the incident");
  }

  let finalLevel = result.ok ? result.level : "reject";
  if (vision.status === "partial") {
    finalLevel = "partial";
  }
  if (vision.status === "reject") {
    finalLevel = "reject";
  }

  const visionConfidence = Number(vision.confidence ?? 0);
  let riskScore = result.ok ? result.riskScore : 80;
  if (vision.status === "ok" && visionConfidence >= 0.6) {
    riskScore = Math.max(0, riskScore - 10);
  }
  if (geoTagged) {
    riskScore = Math.max(0, riskScore - 5);
  }
  if (vision.status === "partial") {
    riskScore = Math.min(100, riskScore + 10);
  }
  if (vision.quality?.blur) {
    riskScore = Math.min(100, riskScore + 10);
  }
  if (vision.quality?.suspected_fake || vision.quality?.irrelevant) {
    riskScore = Math.min(100, riskScore + 25);
  }

  /* ---------------- STORE EVIDENCE ---------------- */
  claim.firData = firData;
  claim.imageLocation = imageLocation;
  claim.geoTagged = geoTagged;
  claim.matchLevel = finalLevel;
  claim.evidenceRisk = {
    riskScore,
    riskLevel: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
    reasons: [
      ...(result.reasons || []),
      ...evidenceIssues,
      vision.status === "partial" ? vision.reason : null,
    ].filter(Boolean),
    signals: [
      ...(result.signals || []),
      vision.status === "ok" ? vision.reason : null,
    ].filter(Boolean),
    domain: resolvedDomain,
  };
  claim.domain = resolvedDomain;
  claim.imageAnalysis = vision;

  await saveClaim(claimId, claim);

  /* ---------------- SUCCESS ---------------- */
  return res.json({
    status: "success",
    geoTagged,
    domain: resolvedDomain,
    riskLevel: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
    riskScore,
    visionStatus: vision.status,
    mode: STRICT_GEO_VALIDATION ? "geo-optional" : "development",
    message: evidenceIssues.length
      ? `Evidence uploaded with warnings: ${evidenceIssues[0]}`
      : geoTagged
        ? "Documents matched successfully (geo verified)"
        : "Documents matched successfully (geo not provided)",
    claimContext: buildClaimContext(claim),
  });
}
