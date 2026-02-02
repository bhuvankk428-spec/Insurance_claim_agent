import express from "express";
import multer from "multer";
import { checkPolicy } from "../services/policy.service.js";
import { checkEvidence } from "../services/evidence.service.js";
import { analyzeStory } from "../services/story.service.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ------------------ ROUTES ------------------ */

// STEP 1: Policy check
router.post(
  "/claim-check",
  upload.single("pdf"),
  checkPolicy
);

// STEP 2: Evidence check
router.post(
  "/claim-evidence",
  upload.fields([
    { name: "fir", maxCount: 1 },
    { name: "photos", maxCount: 5 },
  ]),
  checkEvidence
);

// STEP 3: Story analysis 
router.post("/claim-story", analyzeStory);

export default router;
