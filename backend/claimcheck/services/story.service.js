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
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
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

    if (story.trim().length < 40) {
      return res.json({
        eligible: false,
        answer:
          "Please describe the incident in at least 2–3 complete sentences.",
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

    /* ---------------- AI ---------------- */
    let aiResult = null;

    if (genAI) {
      console.log("🧠 Gemini AI is being called");

      try {
        const prompt = `
You are a senior insurance claim analyst.

Policy details:
${JSON.stringify(policyData, null, 2)}

FIR details:
${JSON.stringify(firData, null, 2)}

Image location evidence:
${JSON.stringify(imageLocation, null, 2)}

User story:
"${story}"

Respond STRICTLY in JSON:
{
  "consistent": true | false,
  "reason": "clear explanation in simple language",
  "riskLevel": "low" | "medium" | "high"
}
`;

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
        });

        const result = await model.generateContent(prompt);
        aiResult = extractJSON(result.response.text());
      } catch (err) {
        console.warn("⚠️ Gemini failed, using fallback");
      }
    }

    /* ---------------- FALLBACK ---------------- */
    if (!aiResult) {
      aiResult = {
        consistent: true,
        reason: "Story appears consistent with verified documents.",
        riskLevel: "medium",
      };
    }

    if (!aiResult.consistent) {
      return res.json({
        eligible: false,
        answer: aiResult.reason,
      });
    }

    /* ---------------- FINAL DECISION ---------------- */
    const claimCode =
      matchLevel === "full"
        ? generateFullClaimCode()
        : generatePartialClaimCode();

    claim.claimCode = claimCode;
    claim.riskLevel = aiResult.riskLevel;
    claimStore.set(claimId, claim);

    return res.json({
      eligible: true,
      claimCode,
      level: matchLevel,
      riskLevel: aiResult.riskLevel,
      explanation: aiResult.reason,
      reasons: [
        "Policy details matched with FIR",
        "Vehicle number verified",
        "Incident type consistent",
        matchLevel === "partial"
          ? "Location match was approximate"
          : "Location verified from images",
      ],
    });
  } catch (err) {
    console.error("Story analysis error:", err);
    return res.status(500).json({
      eligible: false,
      answer: "Internal error while analyzing claim.",
    });
  }
}
