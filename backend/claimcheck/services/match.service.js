import { DOMAIN_RULES } from "../config/domains.js";

export function matchDocuments({
  domain,
  policyData,
  firData,
  imageLocation
}) {
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

  let partial = false;

  // 🔒 ASSET MATCH
  for (const field of rules.assetMatch) {
    const policyValue = policyData[field];
    const firValue = firData[field];

    if (!policyValue || !firValue) {
      return {
        ok: false,
        level: "reject",
        reason: `${field} missing in documents`
      };
    }

    if (normalize(policyValue) !== normalize(firValue)) {
      return {
        ok: false,
        level: "reject",
        reason: `${field} mismatch between policy and FIR`
      };
    }
  }

  // 🌍 LOCATION MATCH (SOFT)
  if (imageLocation && firData.location) {
    if (!locationMatch(imageLocation, firData.location)) {
      partial = true; // ⚠️ allow partial
    }
  }

  return {
    ok: true,
    level: partial ? "partial" : "full"
  };
}

function normalize(value) {
  return value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function locationMatch(imageLoc, firLoc) {
  return imageLoc
    .toLowerCase()
    .includes(
      firLoc.toLowerCase().split(",")[0]
    );
}
