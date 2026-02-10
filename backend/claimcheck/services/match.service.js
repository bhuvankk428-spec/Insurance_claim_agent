import { DOMAIN_RULES } from "../config/domains.js";

export function matchDocuments({
  domain,
  policyData,
  firData,
  imageLocation,
}) {
  /* ---------------- HARD GUARDS ---------------- */
  if (!policyData) {
    return { ok: false, level: "reject", reason: "Policy data missing" };
  }

  if (!firData) {
    return { ok: false, level: "reject", reason: "FIR data missing" };
  }

  const rules = DOMAIN_RULES[domain];

  if (!rules) {
    return { ok: false, level: "reject", reason: "Unsupported claim domain" };
  }

  // Match all overlapping fields between policy and FIR
  const overlappingFields = Object.keys(policyData || {}).filter(
    (field) => policyData[field] && firData?.[field]
  );
  for (const field of overlappingFields) {
    if (normalize(policyData[field]) !== normalize(firData[field])) {
      return {
        ok: false,
        level: "reject",
        reason: `${field} mismatch between policy and FIR`,
      };
    }
  }

  let partial = false;
  const reasons = [];
  const signals = [];
  let riskScore = 50;

  /* ---------------- ASSET MATCH ---------------- */
  for (const field of rules.assetMatch) {
    const policyValue = policyData[field];
    const firValue = firData[field];

    if (!policyValue || !firValue) {
      return {
        ok: false,
        level: "reject",
        reason: `${field} missing in documents`,
      };
    }

    if (normalize(policyValue) !== normalize(firValue)) {
      return {
        ok: false,
        level: "reject",
        reason: `${field} mismatch between policy and FIR`,
      };
    }

    riskScore -= 15;
    signals.push(`${field} matched`);
  }

  /* ---------------- OPTIONAL MATCH ---------------- */
  for (const field of rules.optionalMatch || []) {
    const policyValue = policyData[field];
    const firValue = firData[field];

    if (!policyValue || !firValue) {
      riskScore += 5;
      reasons.push(`${field} missing in one document`);
      continue;
    }

    if (normalize(policyValue) !== normalize(firValue)) {
      partial = true;
      riskScore += 15;
      reasons.push(`${field} mismatch`);
    } else {
      riskScore -= 5;
      signals.push(`${field} matched`);
    }
  }

  /* ---------------- POLICY VALIDITY ---------------- */
  const policyExpiry = parseDate(policyData.policyValidTill);
  const incidentDate = parseDate(firData.incidentDate);
  if (policyExpiry && incidentDate && incidentDate > policyExpiry) {
    return {
      ok: false,
      level: "reject",
      reason: "Policy expired before incident date",
    };
  }

  /* ---------------- LOCATION MATCH (SOFT) ---------------- */
  if (
    imageLocation &&
    imageLocation !== "UNKNOWN" &&
    firData.location
  ) {
    if (!locationMatch(imageLocation, firData.location)) {
      return {
        ok: false,
        level: "reject",
        reason: "Image location does not match incident location",
      };
    } else {
      riskScore -= 5;
      signals.push("Image location matches incident location");
    }
  }

  if (imageLocation === "UNKNOWN") {
    riskScore += 8;
    reasons.push("Image geo not available");
  }

  if (firData.incident && !incidentMentioned(firData.incident)) {
    reasons.push("Incident type not recognized");
    riskScore += 5;
  }

  /* ---------------- SUCCESS ---------------- */
  const clampedScore = clamp(riskScore, 0, 100);

  return {
    ok: true,
    level: partial ? "partial" : "full",
    riskScore: clampedScore,
    riskLevel: toRiskLevel(clampedScore),
    reasons,
    signals,
  };
}

/* ---------------- HELPERS ---------------- */

function normalize(value) {
  return value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function locationMatch(imageLoc, firLoc) {
  if (!imageLoc || !firLoc) return false;

  const score = locationSimilarity(imageLoc, firLoc);
  return score >= 0.8;
}

function locationSimilarity(a, b) {
  const tokensA = tokenizeLocation(a);
  const tokensB = tokenizeLocation(b);
  if (!tokensA.length || !tokensB.length) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;

  for (const t of setA) {
    if (setB.has(t)) intersection += 1;
  }

  const union = new Set([...setA, ...setB]).size || 1;
  return intersection / union;
}

function tokenizeLocation(value) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function parseDate(value) {
  if (!value) return null;
  const cleaned = value.toString().trim();
  const iso = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const dmy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
    return isNaN(date.getTime()) ? null : date;
  }

  if (dmy) {
    const date = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRiskLevel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function incidentMentioned(incident) {
  const normalized = incident.toString().toLowerCase();
  const known = [
    "accident",
    "theft",
    "fire",
    "flood",
    "damage",
    "loss",
    "cyber",
    "hospital",
    "injury",
    "collision",
  ];
  return known.some((k) => normalized.includes(k));
}

export function detectDomain(rawText, policyData = {}) {
  const text = (rawText || "").toLowerCase();

  if (policyData.vehicleNumber || text.includes("vehicle") || text.includes("bike") || text.includes("car")) {
    return "automobile";
  }

  if (
    policyData.cropType ||
    policyData.landLocation ||
    text.includes("crop") ||
    text.includes("farm") ||
    text.includes("agri")
  ) {
    return "crop";
  }

  if (
    policyData.businessLocation ||
    text.includes("business") ||
    text.includes("warehouse") ||
    text.includes("shop")
  ) {
    return "business_property";
  }

  if (policyData.propertyAddress || text.includes("property") || text.includes("house")) {
    return "property";
  }

  if (policyData.domainName || text.includes("cyber") || text.includes("data breach")) {
    return "cyber";
  }

  if (policyData.patientName || text.includes("hospital") || text.includes("health") || text.includes("medical")) {
    return "health";
  }

  return "automobile";
}
