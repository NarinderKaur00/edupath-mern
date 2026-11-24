import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Result from "../models/Result.js";
import Recommendation from "../models/Recommendation.js";
import { mlPredict } from "../services/ml.js";

const router = Router();

// POST /api/recommend  -> run the ML model on the saved marks, store + return it
router.post("/", requireAuth, async (req, res) => {
  const row = await Result.findOne({ user: req.userId });
  if (!row || !Object.keys(row.marks || {}).length) {
    return res.status(400).json({ error: "Please enter your marks first." });
  }
  let payload;
  try {
    payload = await mlPredict(row.marks, 5); // calls the Python ML service
  } catch (e) {
    return res.status(502).json({ error: "The ML service is not reachable. Start it on port 8000." });
  }
  const rec = await Recommendation.create({ user: req.userId, payload });
  res.json({ id: rec._id, createdAt: rec.createdAt, ...payload });
});

// GET /api/recommend/latest  -> most recent saved recommendation
router.get("/latest", requireAuth, async (req, res) => {
  const rec = await Recommendation.findOne({ user: req.userId }).sort({ createdAt: -1 });
  if (!rec) return res.json(null);
  res.json({ id: rec._id, createdAt: rec.createdAt, ...rec.payload });
});

// GET /api/recommend/history  -> list of past recommendations (summary)
router.get("/history", requireAuth, async (req, res) => {
  const rows = await Recommendation.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(
    rows.map((r) => ({
      id: r._id,
      createdAt: r.createdAt,
      top: r.payload?.recommended?.[0] || null,
      count: r.payload?.recommended?.length || 0,
    }))
  );
});

// GET /api/recommend/:id  -> one saved recommendation in full
router.get("/:id", requireAuth, async (req, res) => {
  const rec = await Recommendation.findOne({ _id: req.params.id, user: req.userId });
  if (!rec) return res.status(404).json({ error: "Not found." });
  res.json({ id: rec._id, createdAt: rec.createdAt, ...rec.payload });
});

export default router;
