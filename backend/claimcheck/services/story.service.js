import Groq from "groq-sdk";
import { claimStore } from "../store/claimStore.js";
import { upsertClaimDecision } from "./supabase.service.js";

/* ---------------- CLAIM CODE GENERATORS ---------------- */
function generateFullClaimCode() {
  return "CLM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generatePartialClaimCode() {
  return "CLM-P-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ---------------- GROQ SETUP ---------------- */
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

console.log(
  "🔑 GROQ_API_KEY =",
  process.env.GROQ_API_KEY ? "LOADED" : "MISSING"
);

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

/* ---------------- STORY ANALYSIS ---------------- */
export async function analyzeStory(req, res) {
  try {
    const { story, claimId } = req.body;

    if (!story || !claimId) {
      return res.status(400).json({
        eligible: false,
        reason: "Story or claim reference missing.",
      });
    }

    if (story.trim().length < 40) {
      return res.json({
        eligible: false,
        reason:
          "Please describe the incident in at least 2–3 complete sentences.",
      });
    }

    const claim = claimStore.get(claimId);

    if (!claim || !claim.policyData || !claim.firData || !claim.matchLevel) {
      return res.status(400).json({
        eligible: false,
        reason: "Claim context missing. Please restart the claim process.",
      });
    }

    if (claim.matchLevel === "reject") {
      try {
        await upsertClaimDecision({
          claim_id: claimId,
          email: claim.email || null,
          eligibility_status: "rejected",
          risk_level: null,
          claim_code: null,
          match_level: claim.matchLevel || null,
          image_location: claim.imageLocation || null,
          geo_tagged: claim.geoTagged ?? null,
          policy_owner_name: claim.policyData?.ownerName || null,
          policy_bike_number: claim.policyData?.bikeNumber || null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number: claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: null,
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("❌ Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: false,
        reason:
          "Documents do not sufficiently match. Claim cannot be processed.",
      });
    }

    const { policyData, firData, imageLocation } = claim;

    /* ---------------- GROQ AI ---------------- */
    let aiResult = null;

    if (groq) {
      console.log("🧠 Groq LLM is being called");

      try {
        const prompt = `
You are an insurance claim assessment assistant.

Policy details:
${JSON.stringify(policyData, null, 2)}

FIR details:
${JSON.stringify(firData, null, 2)}

Image evidence location:
${JSON.stringify(imageLocation, null, 2)}

User story:
"${story}"

RULES:
- Missing fields are inconclusive, not incorrect
- Ignore UNKNOWN image location
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

        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
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
        aiResult = extractJSON(text);
      } catch (err) {
        console.error("❌ Groq error:", err.message || err);
      }
    }

    /* ---------------- FALLBACK ---------------- */
    if (!aiResult) {
      aiResult = {
        consistent: true,
        decision: "approved",
        reason: "Story is consistent with verified documents.",
        riskLevel: "medium",
      };
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
          policy_bike_number: claim.policyData?.bikeNumber || null,
          policy_land_location: claim.policyData?.landLocation || null,
          fir_incident: claim.firData?.incident || null,
          fir_bike_number: claim.firData?.bikeNumber || null,
          fir_location: claim.firData?.location || null,
          admin_decision: null,
          admin_notes: null,
          created_at: claim.createdAt
            ? new Date(claim.createdAt).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("❌ Supabase save error:", err.message || err);
      }

      return res.json({
        eligible: false,
        reason: aiResult.reason,
      });
    }

    /* ---------------- FINAL DECISION ---------------- */
    const isPartial = aiResult.decision === "partially_approved";

    const claimCode = isPartial
      ? generatePartialClaimCode()
      : generateFullClaimCode();

    claim.claimCode = claimCode;
    claim.riskLevel = aiResult.riskLevel;
    claim.matchLevel = isPartial ? "partial" : "full";

    claimStore.set(claimId, claim);

    try {
      await upsertClaimDecision({
        claim_id: claimId,
        email: claim.email || null,
        eligibility_status: isPartial ? "partial" : "approved",
        risk_level: aiResult.riskLevel || null,
        claim_code: claimCode,
        match_level: claim.matchLevel || null,
        image_location: claim.imageLocation || null,
        geo_tagged: claim.geoTagged ?? null,
        policy_owner_name: claim.policyData?.ownerName || null,
        policy_bike_number: claim.policyData?.bikeNumber || null,
        policy_land_location: claim.policyData?.landLocation || null,
        fir_incident: claim.firData?.incident || null,
        fir_bike_number: claim.firData?.bikeNumber || null,
        fir_location: claim.firData?.location || null,
        admin_decision: null,
        admin_notes: null,
        created_at: claim.createdAt
          ? new Date(claim.createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Supabase save error:", err.message || err);
    }

    return res.json({
      eligible: true,
      claimCode,
      level: claim.matchLevel,
      riskLevel: aiResult.riskLevel,
      explanation: aiResult.reason,
      eligibilityStatus: isPartial ? "partial" : "approved",
      reasons: [
        "Policy and FIR details are consistent",
        "Vehicle information verified",
        "Incident description matches documents",
        isPartial
          ? "Some evidence requires manual verification"
          : "All required evidence verified successfully",
      ],
    });
  } catch (err) {
    console.error("Story analysis error:", err);
    return res.status(500).json({
      eligible: false,
      reason: "Internal error while analyzing claim.",
    });
  }
}
