import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Recommendation from "../models/Recommendation.js";
import { answer, llmEnabled } from "../services/advisor.js";

const router = Router();

// POST /api/advisor/ask  { question }  -> advisor answer grounded in the student's result
router.post("/ask", requireAuth, async (req, res) => {
  const question = (req.body?.question || "").trim();
  if (!question) {
    return res.json({ answer: "Ask me anything about choosing your specialization 🙂", ai: llmEnabled() });
  }

  // ground the answer in the student's latest recommendation (best-fit fields)
  const ctx = { top_fields: [], reason: null };
  const latest = await Recommendation.findOne({ user: req.userId }).sort({ createdAt: -1 });
  if (latest?.payload) {
    ctx.top_fields = (latest.payload.fields || []).map((f) => ({ field: f.field, avg: f.avg }));
    const recs = latest.payload.recommended || [];
    if (recs.length) ctx.reason = recs[0].reason || null;
  }

  res.json({ answer: await answer(question, ctx), ai: llmEnabled() });
});

export default router;
