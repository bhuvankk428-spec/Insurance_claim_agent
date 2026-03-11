import { extractText } from "./ocr.service.js";
import { extractPolicyFields } from "./extractFields.service.js";
import { buildClaimContext, saveClaim } from "../store/claimStore.js";
import { detectDomain } from "./match.service.js";
import { validatePolicyDocument } from "./documentValidation.service.js";

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
  const validation = validatePolicyDocument(domain, fields);

  if (!validation.ok) {
    return res.json({
      valid: false,
      message: validation.message,
      extracted: fields,
      domain,
      missingFields: validation.missingFields,
    });
  }

  // ✅ CREATE CLAIM
  const claimId = generateClaimId();

  // ✅ STORE IN claimStore
  const claim = {
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
  };

  await saveClaim(claimId, claim);

  return res.json({
    valid: true,
    message: validation.message,
    warning: null,
    claimId,
    extracted: fields,
    domain,
    claimContext: buildClaimContext(claim),
  });
}
