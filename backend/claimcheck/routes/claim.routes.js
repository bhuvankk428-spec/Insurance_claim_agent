import express from "express";
import multer from "multer";
import { checkPolicy } from "../services/policy.service.js";
import { checkEvidence } from "../services/evidence.service.js";
import { analyzeStory } from "../services/story.service.js";
import {
  listClaims,
  listClaimsByEmail,
  updateAdminDecision,
} from "../services/supabase.service.js";

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

function isPdfUpload(file) {
  if (!file?.buffer) return false;
  // Browsers normally send application/pdf, but drag-and-drop and some mobile
  // browsers send application/octet-stream. The file signature is authoritative.
  return (
    file.mimetype === "application/pdf" ||
    file.buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

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
  (req, res, next) => {
    if (!req.file || isPdfUpload(req.file)) return next();
    return res.status(400).json({
      valid: false,
      message: "Policy document must be a PDF",
    });
  },
  (req, _res, next) => {
    // Give the extraction service a stable MIME type for valid PDFs uploaded
    // with the generic application/octet-stream MIME type.
    if (req.file) req.file.mimetype = "application/pdf";
    next();
  },
  checkPolicy
);

// STEP 2: Evidence check
router.post(
  "/claim-evidence",
  uploadEvidence.fields([
    { name: "fir", maxCount: 1 },
    { name: "photos", maxCount: 5 },
  ]),
  (req, res, next) => {
    const fir = req.files?.fir?.[0];
    if (!fir || isPdfUpload(fir)) return next();
    return res.status(400).json({
      status: "error",
      message: "Evidence document must be a PDF",
    });
  },
  (req, _res, next) => {
    const fir = req.files?.fir?.[0];
    if (fir) fir.mimetype = "application/pdf";
    next();
  },
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
      !["approved", "partial", "rejected", "pending"].includes(adminDecision)
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

router.get("/my-claims", async (req, res) => {
  try {
    const email = String(
      req.query.email || req.headers["x-user-email"] || ""
    ).trim();

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 100;
    const claims = await listClaimsByEmail(email, limit);
    return res.json({ status: "success", claims });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Failed to load claims",
    });
  }
});

export default router;
