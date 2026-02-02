import { extractText } from "./ocr.service.js";
import { extractPolicyFields } from "./extractFields.service.js";
import { claimStore } from "../store/claimStore.js";

/* ---------------- CLAIM ID GENERATOR ---------------- */
function generateClaimId() {
  return "CLM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function checkPolicy(req, res) {
  const file = req.file;
  if (!file) {
    return res.json({ valid: false, message: "Policy missing" });
  }

  const text = await extractText(file.buffer, file.mimetype);
  const fields = extractPolicyFields(text);

  if (!fields.ownerName) {
    return res.json({
      valid: false,
      message: "Owner name not found in policy",
    });
  }

  // ✅ CREATE CLAIM
  const claimId = generateClaimId();

  // ✅ STORE IN claimStore
  claimStore.set(claimId, {
    policyData: fields,
    createdAt: Date.now(),
  });

  return res.json({
    valid: true,
    message: "Policy verified",
    claimId,              // ✅ SEND TO FRONTEND
    extracted: fields,
  });
}
