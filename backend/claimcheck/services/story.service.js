import OpenAI from "openai";
import {
  buildClaimContext,
  getClaim,
  restoreClaimFromContext,
  saveClaim,
} from "../store/claimStore.js";
import { upsertClaimDecision } from "./supabase.service.js";
import { checkCoverage } from "./coverage.service.js";

/* ---------------- CLAIM CODE GENERATORS ---------------- */
function generateFullClaimCode() {
  return "CLM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generatePartialClaimCode() {
  return "CLM-P-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ---------------- OPENAI SETUP ---------------- */
const hasOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY) &&
  !process.env.OPENAI_API_KEY.startsWith("your_");

const openai = hasOpenAIKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
    })
  : null;

let openAICallCount = 0;

if (hasOpenAIKey) {
  console.log("[claim-story] OpenAI key detected. OpenAI checks are enabled.");
} else {
  console.log(
    "[claim-story] OpenAI key not detected. Falling back to local rule-based check."
  );
}

/* ---------------- JSON EXTRACT ---------------- */
function extractJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;

    const parsed = JSON.parse(text.slice(start, end + 1));

    // strict shape validation
    if (
      typeof parsed.consistent !== "boolean" ||
      !parsed.reason ||
      !parsed.riskLevel
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isImageDateReason(reason = "") {
  const text = String(reason || "").toLowerCase();
  if (!text) return false;

  const hasDateOrTime =
    /\b(date|dated|timestamp|time|timing|captured|exif|metadata)\b/.test(text) ||
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/.test(text);
  const hasImageContext = /\b(photo|image|picture|evidence)\b/.test(text);

  return hasDateOrTime && hasImageContext;
}

/* ---------------- STORY ANALYSIS ---------------- */
export async function analyzeStory(req, res) {
  try {
    const { story, claimId, claimContext } = req.body;

    if (!story || !claimId) {
      return res.json({
        eligible: false,
        reason: "Story or claim reference missing.",
        message: "Story or claim reference missing.",
      });
    }

    if (story.trim().length < 40) {
      return res.json({
        eligible: false,
        reason: "Please describe the incident in at least 2-3 sentences.",
        message: "Please describe the incident in at least 2-3 sentences.",
      });
    }

    let claim = await getClaim(claimId);
    if (
      (!claim || !claim.policyData || !claim.firData || !claim.matchLevel) &&
      claimContext
    ) {
      claim = await restoreClaimFromContext(claimId, claimContext);
    }

    if (!claim || !claim.policyData || !claim.firData || !claim.matchLevel) {
      return res.json({
        eligible: false,
        reason: "Claim context missing. Please restart the claim process.",
        message: "Claim context missing. Please restart the claim process.",
      });
    }

    const {
      policyData,
      firData,
      imageLocation,
      evidenceRisk,
      imageAnalysis,
      policyText,
      domain,
    } = claim;
    const evidenceReasons = (evidenceRisk?.reasons || []).filter(
      (reason) => !isImageDateReason(reason)
    );
    const evidenceRejected =
      claim.matchLevel === "reject" && evidenceReasons.length > 0;
    const geoMismatch = evidenceReasons.some((reason) =>
      reason
        ?.toString()
        .toLowerCase()
        .includes("image location does not match incident location")
    );

    /* ---------------- PRECHECK ---------------- */
    const incidentCheck = checkIncidentConsistency(story, firData?.incident);
    const storyMismatch = !incidentCheck.ok;

    /* ---------------- COVERAGE CHECK ---------------- */
    const coverage = await checkCoverage({
      policyText,
      incident: firData?.incident,
      domain: domain || "automobile",
      policyData,
      firData,
    });

    if (coverage?.status === "excluded" || coverage?.status === "not_covered") {
      const reason =
        coverage?.reason ||
        "Incident is not covered under the policy terms.";

      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "rejected",
          risk_level: "high",
          claim_code: null,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number:
            claim.policyData?.vehicleNumber ||
            claim.policyData?.bikeNumber ||
            null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number:
            claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: null,
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: false,
        reason,
        message: reason,
      });
    }

    const coverageIsPartial =
      coverage?.status === "related" ||
      coverage?.status === "ambiguous" ||
      coverage?.status === "unknown";

    if (coverageIsPartial) {
      claim.matchLevel = "partial";
    }

    const coverageRisk =
      coverage?.status === "covered"
        ? "low"
        : coverage?.status === "related" ||
            coverage?.status === "ambiguous" ||
            coverage?.status === "unknown"
          ? "high"
          : "medium";

    if (storyMismatch && geoMismatch) {
      const reason =
        "Story and geo evidence both mismatch with the reported incident.";
      return res.json({
        eligible: false,
        reason,
        message: reason,
      });
    }

    if ((storyMismatch && !geoMismatch) || (!storyMismatch && geoMismatch)) {
      const claimCode = generatePartialClaimCode();
      claim.claimCode = claimCode;
      claim.riskLevel = "high";
      claim.matchLevel = "partial";
      await saveClaim(claimId, claim);

      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "partial",
          risk_level: "high",
          claim_code: claimCode,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number:
            claim.policyData?.vehicleNumber ||
            claim.policyData?.bikeNumber ||
            null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number:
            claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: storyMismatch
            ? "Story mismatch with incident; manual review required"
            : "Geo mismatch with incident location; manual review required",
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: true,
        claimCode,
        level: "partial",
        riskLevel: "high",
        explanation:
          storyMismatch
            ? "Story does not fully match incident evidence. Manual review required."
            : "Image geo location does not match the incident location. Manual review required.",
        eligibilityStatus: "partial",
        reasons: [
          storyMismatch ? incidentCheck.reason : null,
          geoMismatch ? "Image location does not match incident location" : null,
          "Manual review required",
        ].filter(Boolean),
        claimContext: buildClaimContext(claim),
      });
    }

    /* ---------------- OPENAI ---------------- */
    let aiResult = null;

    if (openai) {
      try {
        openAICallCount += 1;
        console.log(
          `[claim-story] OpenAI used for claimId=${claimId}. total_calls=${openAICallCount}`
        );

        const evidenceSummary = {
          domain: evidenceRisk?.domain || claim.domain || "automobile",
          riskLevel: evidenceRisk?.riskLevel || "medium",
          riskScore: evidenceRisk?.riskScore ?? 50,
          signals: evidenceRisk?.signals || [],
          reasons: evidenceRisk?.reasons || [],
        };

        const prompt = `
You are an insurance claim assessment assistant.

Policy details:
${JSON.stringify(policyData, null, 2)}

FIR details:
${JSON.stringify(firData, null, 2)}

Image evidence location:
${JSON.stringify(imageLocation, null, 2)}

Image analysis summary:
${JSON.stringify(imageAnalysis || {}, null, 2)}

Evidence summary:
${JSON.stringify(evidenceSummary, null, 2)}

Coverage check:
${JSON.stringify(coverage || {}, null, 2)}

User story:
"${story}"

RULES:
- Missing fields are inconclusive, not incorrect
- Ignore UNKNOWN image location
- Ignore image/photo date or timestamp (including EXIF date/time)
- Do not reject based on photo date mismatch
- Reject only on clear contradictions
- Prefer approval if core details match

Respond STRICTLY in JSON:
{
  "consistent": true | false,
  "decision": "approved" | "partially_approved" | "rejected",
  "reason": "clear explanation for user",
  "riskLevel": "low" | "medium" | "high"
}
`;

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are an insurance claim verification and fraud risk expert.",
            },
            { role: "user", content: prompt },
          ],
        });

        const text = completion.choices[0]?.message?.content;
        aiResult = extractJSON(text || "");
      } catch (err) {
        console.error("OpenAI error:", err.message || err);
      }
    }

    /* ---------------- FALLBACK ---------------- */
    if (!aiResult) {
      if (!hasOpenAIKey) {
        aiResult = {
          consistent: true,
          decision: "partially_approved",
          reason:
            "OpenAI verification unavailable. Claim marked partial for manual review.",
          riskLevel: "medium",
        };
      } else {
        aiResult = {
          consistent: true,
          decision: "partially_approved",
          reason:
            "OpenAI response unavailable. Claim marked partial for manual review.",
          riskLevel: evidenceRisk?.riskLevel || "medium",
        };
      }
    }

    if (isImageDateReason(aiResult?.reason)) {
      aiResult = {
        ...aiResult,
        consistent: true,
        decision: "partially_approved",
        reason: "Image date metadata is ignored; geo location is used for location checks.",
      };
    }

    if (evidenceRejected && !geoMismatch) {
      const reason =
        evidenceReasons?.[0] ||
        "Evidence does not sufficiently match policy details.";
      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "rejected",
          risk_level: "high",
          claim_code: null,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number:
            claim.policyData?.vehicleNumber ||
            claim.policyData?.bikeNumber ||
            null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number:
            claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: null,
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: false,
        reason,
        message: reason,
      });
    }

    if (!aiResult.consistent || aiResult.decision === "rejected") {
      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "rejected",
          risk_level: aiResult.riskLevel || null,
          claim_code: null,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number:
            claim.policyData?.vehicleNumber ||
            claim.policyData?.bikeNumber ||
            null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number:
            claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: null,
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: false,
        reason: aiResult.reason,
        message: aiResult.reason,
      });
    }

    /* ---------------- FINAL DECISION ---------------- */
    const isPartial =
      aiResult.decision === "partially_approved" || coverageIsPartial;

    if (coverage?.status === "related") {
      const claimCode = generatePartialClaimCode();
      claim.claimCode = claimCode;
      claim.riskLevel = "high";
      claim.matchLevel = "partial";
      await saveClaim(claimId, claim);

      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "pending",
          risk_level: "high",
          claim_code: claimCode,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number:
            claim.policyData?.vehicleNumber ||
            claim.policyData?.bikeNumber ||
            null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number:
            claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: "Manual review required: related coverage",
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: true,
        claimCode,
        level: "partial",
        riskLevel: "high",
        explanation:
          "Coverage is related but not clearly listed. Manual review required.",
        eligibilityStatus: "pending",
        reasons: [
          "Coverage related to policy terms",
          "Manual approval required",
        ],
        message:
          "Claim submitted for manual review due to related coverage terms.",
        claimContext: buildClaimContext(claim),
      });
    }

    let finalRiskLevel = mergeRiskLevels(
      aiResult.riskLevel,
      mergeRiskLevels(evidenceRisk?.riskLevel, coverageRisk)
    );

    const claimCode = isPartial
      ? generatePartialClaimCode()
      : generateFullClaimCode();

    if (!isPartial && finalRiskLevel !== "high") {
      finalRiskLevel = claim.geoTagged ? "low" : "medium";
    }

    claim.claimCode = claimCode;
    claim.riskLevel = finalRiskLevel;
    claim.matchLevel = isPartial ? "partial" : "full";

    await saveClaim(claimId, claim);

    try {
      await upsertClaimDecision({
        claim_id: claimId,
        email: claim.email || null,
        eligibility_status: isPartial ? "partial" : "approved",
        risk_level: finalRiskLevel || null,
        claim_code: claimCode,
        match_level: claim.matchLevel || null,
        image_location: claim.imageLocation || null,
        geo_tagged: claim.geoTagged ?? null,
        policy_owner_name: claim.policyData?.ownerName || null,
        policy_bike_number:
          claim.policyData?.vehicleNumber || claim.policyData?.bikeNumber || null,
        policy_land_location: claim.policyData?.landLocation || null,
        fir_incident: claim.firData?.incident || null,
        fir_bike_number:
          claim.firData?.vehicleNumber || claim.firData?.bikeNumber || null,
        fir_location: claim.firData?.location || null,
        admin_decision: null,
        admin_notes: null,
        created_at: claim.createdAt
          ? new Date(claim.createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Supabase save error:", err.message || err);
    }

    const evidenceSignals = evidenceRisk?.signals || [];

    const coverageNote =
      coverage?.status === "related"
        ? "Incident is related to covered terms; treated as partial"
        : coverage?.status === "ambiguous" || coverage?.status === "unknown"
          ? "Coverage unclear; flagged as high risk"
          : null;

    return res.json({
      eligible: true,
      claimCode,
      level: claim.matchLevel,
      riskLevel: finalRiskLevel,
      explanation: aiResult.reason,
      eligibilityStatus: isPartial ? "partial" : "approved",
      reasons: [
        ...evidenceSignals.slice(0, 3),
        ...evidenceReasons.slice(0, 2),
        coverageNote,
        isPartial
          ? "Some evidence requires manual verification"
          : "All required evidence verified successfully",
      ].filter(Boolean),
      claimContext: buildClaimContext(claim),
    });
  } catch (err) {
    console.error("Story analysis error:", err);
    return res.json({
      eligible: false,
      reason: "Internal error while analyzing claim.",
      message: "Internal error while analyzing claim.",
    });
  }
}

function mergeRiskLevels(aiLevel, evidenceLevel) {
  const rank = {
    low: 1,
    medium: 2,
    high: 3,
  };
  const ai = aiLevel || "medium";
  const ev = evidenceLevel || "medium";
  return rank[ai] >= rank[ev] ? ai : ev;
}

function checkIncidentConsistency(story, incident) {
  if (!incident) {
    return { ok: true };
  }

  const normalizedStory = story.toLowerCase();
  const normalizedIncident = incident.toLowerCase();

  const keywords = [
    "accident",
    "collision",
    "theft",
    "fire",
    "flood",
    "cyber",
    "injury",
    "hospital",
    "damage",
    "loss",
  ];

  const matched = keywords.find((k) => normalizedIncident.includes(k));
  if (!matched) {
    return { ok: true };
  }

  if (!normalizedStory.includes(matched)) {
    return {
      ok: false,
      reason:
        "Story does not mention the incident type found in the evidence document.",
    };
  }

  return { ok: true };
}
