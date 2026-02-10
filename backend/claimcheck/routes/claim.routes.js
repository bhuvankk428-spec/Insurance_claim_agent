import express from "express";
import multer from "multer";
import { checkPolicy } from "../services/policy.service.js";
import { checkEvidence } from "../services/evidence.service.js";
import { analyzeStory } from "../services/story.service.js";
import { listClaims, updateAdminDecision } from "../services/supabase.service.js";

const router = express.Router();
const MAX_PDF_MB = Number(process.env.MAX_PDF_MB || 10);
const MAX_PHOTO_MB = Number(process.env.MAX_PHOTO_MB || 5);

const uploadPolicy = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_MB * 1024 * 1024 },
});

const uploadEvidence = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Math.max(MAX_PDF_MB, MAX_PHOTO_MB) * 1024 * 1024 },
});

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "qk-admin-2026";

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  next();
}

/* ------------------ ROUTES ------------------ */

// STEP 1: Policy check
router.post(
  "/claim-check",
  uploadPolicy.single("pdf"),
  checkPolicy
);

// STEP 2: Evidence check
router.post(
  "/claim-evidence",
  uploadEvidence.fields([
    { name: "fir", maxCount: 1 },
    { name: "photos", maxCount: 5 },
  ]),
  checkEvidence
);

// STEP 3: Story analysis 
router.post("/claim-story", analyzeStory);

/* ------------------ ADMIN ------------------ */
router.get("/admin/claims", requireAdmin, async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50;
    const claims = await listClaims(limit);
    return res.json({ status: "success", claims });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Failed to load claims",
    });
  }
});

router.patch("/admin/claims/:claimId", requireAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { adminDecision, adminNotes } = req.body || {};

    if (!claimId) {
      return res
        .status(400)
        .json({ status: "error", message: "Claim ID is required" });
    }

    if (
      adminDecision &&
      !["approved", "rejected", "pending"].includes(adminDecision)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid admin decision",
      });
    }

    const updated = await updateAdminDecision(claimId, {
      admin_decision: adminDecision || null,
      admin_notes: adminNotes || null,
    });

    return res.json({ status: "success", claim: updated });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Failed to update claim",
    });
  }
});

export default router;
