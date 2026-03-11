import { ensureSupabase } from "../services/supabase.service.js";

// Small in-process cache to avoid repeated round-trips within one request burst.
export const claimStore = new Map();

const CLAIM_CONTEXT_COLUMNS = [
  "claim_id",
  "email",
  "domain",
  "policy_text",
  "policy_data",
  "fir_data",
  "image_location",
  "image_analysis",
  "evidence_risk",
  "match_level",
  "risk_level",
  "claim_code",
  "geo_tagged",
  "created_at",
  "updated_at",
].join(",");

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

function normalizeTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

function hydrateClaimRow(row) {
  if (!row) return null;

  return buildClaimContext({
    email: row.email || null,
    domain: row.domain || "automobile",
    policyData: row.policy_data || null,
    policyText: typeof row.policy_text === "string" ? row.policy_text : "",
    firData: row.fir_data || null,
    imageLocation: row.image_location || null,
    imageAnalysis: row.image_analysis || null,
    evidenceRisk: row.evidence_risk || null,
    matchLevel: row.match_level || null,
    riskLevel: row.risk_level || null,
    claimCode: row.claim_code || null,
    geoTagged: row.geo_tagged ?? false,
    createdAt: row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
  });
}

function buildClaimPersistenceRecord(claimId, claim) {
  const normalized = buildClaimContext(claim);

  return {
    claim_id: claimId,
    email: normalized.email,
    domain: normalized.domain,
    policy_text: normalized.policyText || null,
    policy_data: normalized.policyData,
    fir_data: normalized.firData,
    image_location: normalized.imageLocation,
    image_analysis: normalized.imageAnalysis,
    evidence_risk: normalized.evidenceRisk,
    match_level: normalized.matchLevel,
    risk_level: normalized.riskLevel,
    claim_code: normalized.claimCode,
    geo_tagged: normalized.geoTagged,
    policy_owner_name: normalized.policyData?.ownerName || null,
    policy_bike_number:
      normalized.policyData?.vehicleNumber ||
      normalized.policyData?.bikeNumber ||
      null,
    policy_land_location: normalized.policyData?.landLocation || null,
    fir_incident: normalized.firData?.incident || null,
    fir_bike_number:
      normalized.firData?.vehicleNumber || normalized.firData?.bikeNumber || null,
    fir_location: normalized.firData?.location || null,
    created_at: normalizeTimestamp(normalized.createdAt),
    updated_at: new Date().toISOString(),
  };
}

async function fetchClaimFromSupabase(claimId) {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from("claims")
      .select(CLAIM_CONTEXT_COLUMNS)
      .eq("claim_id", claimId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return hydrateClaimRow(data);
  } catch (error) {
    console.error("[claim-store] failed to load claim", {
      claimId,
      error: error?.message || error,
    });
    return null;
  }
}

async function persistClaimToSupabase(claimId, claim) {
  try {
    const client = ensureSupabase();
    const record = buildClaimPersistenceRecord(claimId, claim);
    const { error } = await client
      .from("claims")
      .upsert(record, { onConflict: "claim_id" });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("[claim-store] failed to persist claim", {
      claimId,
      error: error?.message || error,
    });
  }
}

export async function getClaim(claimId) {
  if (!claimId) return null;

  const cached = claimStore.get(claimId);
  if (cached) {
    return cached;
  }

  const persisted = await fetchClaimFromSupabase(claimId);
  if (persisted) {
    claimStore.set(claimId, persisted);
  }
  return persisted;
}

export async function saveClaim(claimId, claim) {
  if (!claimId || !claim) {
    return null;
  }

  const normalized = buildClaimContext(claim);
  claimStore.set(claimId, normalized);
  await persistClaimToSupabase(claimId, normalized);
  return normalized;
}

export async function restoreClaimFromContext(claimId, context) {
  if (!claimId || !context || typeof context !== "object") {
    return null;
  }

  const restored = buildClaimContext(context);
  if (!restored.policyData) {
    return null;
  }

  await saveClaim(claimId, restored);
  return restored;
}
