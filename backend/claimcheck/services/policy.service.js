import { extractText } from "./ocr.service.js";
import { extractPolicyFields } from "./extractFields.service.js";
import { claimStore } from "../store/claimStore.js";
import { detectDomain } from "./match.service.js";

/* ---------------- CLAIM ID GENERATOR ---------------- */
function generateClaimId() {
  return "CLM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function checkPolicy(req, res) {
  const file = req.file;
  const email = req.body?.email || null;
  if (!file) {
    return res.json({ valid: false, message: "Policy missing" });
  }

  const text = await extractText(file.buffer, file.mimetype);
  const fields = extractPolicyFields(text);
  const domain = detectDomain(text, fields);

  if (!fields.ownerName && !fields.companyName && !fields.patientName) {
    return res.json({
      valid: false,
      message: "Primary insured/owner name not found in policy",
    });
  }

  // ✅ CREATE CLAIM
  const claimId = generateClaimId();

  // ✅ STORE IN claimStore
  claimStore.set(claimId, {
    email,
    domain,
    policyData: fields,
    policyText: text.slice(0, 20000),
    firData: null,
    imageLocation: null,
    imageAnalysis: null,
    evidenceRisk: null,
    matchLevel: null,
    riskLevel: null,
    claimCode: null,
    createdAt: Date.now(),
  });


  return res.json({
    valid: true,
    message: "Policy verified",
    claimId,              // ✅ SEND TO FRONTEND
    extracted: fields,
    domain,
  });
}
