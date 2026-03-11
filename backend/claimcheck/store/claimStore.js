// In-memory claim store (temporary replacement for DB)
export const claimStore = new Map();

export function buildClaimContext(claim = {}) {
  return {
    email: claim.email || null,
    domain: claim.domain || "automobile",
    policyData: claim.policyData || null,
    policyText: typeof claim.policyText === "string" ? claim.policyText : "",
    firData: claim.firData || null,
    imageLocation: claim.imageLocation || null,
    imageAnalysis: claim.imageAnalysis || null,
    evidenceRisk: claim.evidenceRisk || null,
    matchLevel: claim.matchLevel || null,
    riskLevel: claim.riskLevel || null,
    claimCode: claim.claimCode || null,
    geoTagged: claim.geoTagged ?? false,
    createdAt: claim.createdAt || Date.now(),
  };
}

export function restoreClaimFromContext(claimId, context) {
  if (!claimId || !context || typeof context !== "object") {
    return null;
  }

  const restored = buildClaimContext(context);
  if (!restored.policyData) {
    return null;
  }

  claimStore.set(claimId, restored);
  return restored;
}
