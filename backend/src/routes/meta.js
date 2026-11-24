import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { mlMeta } from "../services/ml.js";
import { feature_groups } from "../services/features.js";

const router = Router();

// GET /api/meta  -> model stats + the grouped subject list for the marks form
router.get("/", requireAuth, async (_req, res) => {
  let meta = { ready: false };
  try {
    meta = await mlMeta();
  } catch {
    /* ML service down -> still return the subject groups so the form renders */
  }
  res.json({ ...meta, groups: feature_groups() });
});

export default router;
