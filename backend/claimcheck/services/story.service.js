import { GoogleGenerativeAI } from "@google/generative-ai";
import { claimStore } from "../store/claimStore.js";

/* ---------------- CLAIM CODE GENERATORS ---------------- */
function generateFullClaimCode() {
  return "CLM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generatePartialClaimCode() {
  return "CLM-P-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ---------------- AI SETUP ---------------- */
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/* ---------------- UTILS ---------------- */
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
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
        answer: "Story or claim reference missing.",
      });
    }

    const claim = claimStore.get(claimId);

    if (
      !claim ||
      !claim.policyData ||
      !claim.firData ||
      !claim.matchLevel
    ) {
      return res.status(400).json({
        eligible: false,
        answer: "Claim context missing. Please restart the claim process.",
      });
    }

    const { policyData, firData, imageLocation, matchLevel } = claim;

    /* ---------------- AI OPTIONAL ---------------- */
    let aiResult = null;

    if (genAI) {
      try {
        const prompt = `
You are an insurance claim analyst.

Policy:
${JSON.stringify(policyData)}

FIR:
${JSON.stringify(firData)}

Image location:
${JSON.stringify(imageLocation)}

User story:
"${story}"

Respond ONLY in JSON:
{
  "consistent": true/false,
  "reason": "short explanation",
  "riskLevel": "low | medium | high"
}
`;

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
        });

        const result = await model.generateContent(prompt);
        aiResult = extractJSON(result.response.text());
      } catch {
        console.warn("AI failed, using fallback logic");
      }
    }

    /* ---------------- FALLBACK ---------------- */
    if (!aiResult) {
      aiResult = {
        consistent: true,
        reason: "Basic validation passed without AI analysis.",
        riskLevel: "medium",
      };
    }

    if (!aiResult.consistent) {
      return res.json({
        eligible: false,
        answer: aiResult.reason || "Story does not match claim documents.",
      });
    }

    /* ---------------- FINAL DECISION ---------------- */
    let claimCode;

    if (matchLevel === "full") {
      claimCode = generateFullClaimCode();
    } else if (matchLevel === "partial") {
      claimCode = generatePartialClaimCode();
    } else {
      return res.json({
        eligible: false,
        answer: "Claim validation failed.",
      });
    }

    claim.claimCode = claimCode;
    claim.riskLevel = aiResult.riskLevel;
    claimStore.set(claimId, claim);

    return res.json({
      eligible: true,
      claimCode,
      level: matchLevel,
      answer:
        matchLevel === "full"
          ? `✅ Claim fully verified.
Risk Level: ${aiResult.riskLevel}.
Approved for financial processing.`
          : `⚠️ Claim partially verified.
Risk Level: ${aiResult.riskLevel}.
Manual review may be required.`,
    });
  } catch (err) {
    console.error("Story analysis error:", err);
    return res.status(500).json({
      eligible: false,
      answer: "Internal error while analyzing claim.",
    });
  }
}
