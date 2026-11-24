import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Result from "../models/Result.js";

const router = Router();

// GET /api/marks  -> the student's saved marks (or {} if none yet)
router.get("/", requireAuth, async (req, res) => {
  const row = await Result.findOne({ user: req.userId });
  res.json({ marks: row?.marks || {}, updatedAt: row?.updatedAt || null });
});

// PUT /api/marks  -> save/overwrite marks. Body: { marks: { CODE: number, ... } }
router.put("/", requireAuth, async (req, res) => {
  const raw = req.body?.marks || {};
  // keep only valid 1-100 marks (0 / blank = subject not taken -> skip)
  const marks = {};
  for (const [code, v] of Object.entries(raw)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) marks[code] = Math.max(0, Math.min(100, n));
  }
  const row = await Result.findOneAndUpdate(
    { user: req.userId },
    { marks },
    { upsert: true, new: true }
  );
  res.json({ marks: row.marks, updatedAt: row.updatedAt });
});

export default router;
