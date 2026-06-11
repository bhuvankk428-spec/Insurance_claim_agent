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

  let text = await extractText(file.buffer, file.mimetype);
  let fields = extractPolicyFields(text);
  let domain = detectDomain(text, fields);
  let validation = validatePolicyDocument(domain, fields);

  if (!validation.ok && file.mimetype === "application/pdf") {
    const ocrText = await extractText(file.buffer, file.mimetype, {
      forceOcr: true,
    });
    if (ocrText && ocrText !== text) {
      const combinedText = `${text}\n${ocrText}`.trim();
      const combinedFields = extractPolicyFields(combinedText);
      const combinedDomain = detectDomain(combinedText, combinedFields);
      const combinedValidation = validatePolicyDocument(
        combinedDomain,
        combinedFields
      );

      if (
        combinedValidation.ok ||
        combinedValidation.missingFields.length < validation.missingFields.length
      ) {
        text = combinedText;
        fields = combinedFields;
        domain = combinedDomain;
        validation = combinedValidation;
      }
    }
  }

  if (!validation.ok) {
    return res.json({
      valid: false,
      message: validation.message,
      extracted: fields,
      domain,
      missingFields: validation.missingFields,
      textExtracted: text.trim().length > 0,
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
