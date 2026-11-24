import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import { courseGroups, stats, getCourse } from "../services/content.js";
import { generateStudyPlan, llmEnabled } from "../services/studyplan.js";

const router = Router();

async function enrolledCodes(userId) {
  const rows = await Enrollment.find({ user: userId });
  return new Set(rows.map((r) => r.code));
}
async function doneSet(userId, code) {
  const row = await Progress.findOne({ user: userId, code });
  return new Set(row?.done || []);
}

// GET /api/courses  -> grouped catalogue + stats + which are enrolled
router.get("/", requireAuth, async (req, res) => {
  const enrolled = await enrolledCodes(req.userId);
  res.json({
    groups: courseGroups,
    core_credits: stats.core_credits,
    n_total: stats.n_total,
    n_electives: stats.n_electives,
    n_enrolled: enrolled.size,
    enrolled: [...enrolled],
  });
});

// GET /api/courses/fields  -> elective-focus tracks + professional baskets
router.get("/fields", requireAuth, async (_req, res) => {
  const { fieldsData } = await import("../services/content.js");
  res.json(fieldsData);
});

// GET /api/courses/my-learning  -> enrolled courses with progress
router.get("/my-learning", requireAuth, async (req, res) => {
  const rows = await Enrollment.find({ user: req.userId });
  const items = [];
  for (const e of rows) {
    const course = getCourse(e.code);
    if (!course) continue;
    const topics = course.topics || [];
    const done = await doneSet(req.userId, e.code);
    items.push({
      code: e.code, name: course.name, where: course.where,
      pct: topics.length ? Math.round((done.size / topics.length) * 100) : 0,
      done: done.size, total: topics.length,
    });
  }
  items.sort((a, b) => b.pct - a.pct);
  const avg = items.length ? Math.round(items.reduce((s, i) => s + i.pct, 0) / items.length) : 0;
  res.json({ items, avg });
});

// GET /api/courses/:code  -> full course detail + enrolled + progress
router.get("/:code", requireAuth, async (req, res) => {
  const course = getCourse(req.params.code);
  if (!course) return res.status(404).json({ error: "Course not found." });
  const enrolled = (await enrolledCodes(req.userId)).has(req.params.code);
  const done = [...(await doneSet(req.userId, req.params.code))];
  const topics = course.topics || [];
  res.json({
    course, enrolled, done, ai_enabled: llmEnabled(),
    pct: topics.length ? Math.round((done.length / topics.length) * 100) : 0,
  });
});

// POST /api/courses/:code/enroll
router.post("/:code/enroll", requireAuth, async (req, res) => {
  if (!getCourse(req.params.code)) return res.status(404).json({ error: "Course not found." });
  await Enrollment.updateOne(
    { user: req.userId, code: req.params.code },
    { $setOnInsert: { user: req.userId, code: req.params.code } },
    { upsert: true }
  );
  res.json({ ok: true });
});

// POST /api/courses/:code/unenroll
router.post("/:code/unenroll", requireAuth, async (req, res) => {
  await Enrollment.deleteOne({ user: req.userId, code: req.params.code });
  res.json({ ok: true });
});

// POST /api/courses/:code/progress  { done: [indices] }  -> save + auto-enroll
router.post("/:code/progress", requireAuth, async (req, res) => {
  if (!getCourse(req.params.code)) return res.status(404).json({ error: "Course not found." });
  const done = Array.isArray(req.body?.done) ? req.body.done.map(Number).filter(Number.isFinite) : [];
  await Progress.updateOne({ user: req.userId, code: req.params.code }, { done }, { upsert: true });
  await Enrollment.updateOne(
    { user: req.userId, code: req.params.code },
    { $setOnInsert: { user: req.userId, code: req.params.code } },
    { upsert: true }
  );
  res.json({ ok: true });
});

// POST /api/courses/:code/studyplan  -> AI 4-week study plan
router.post("/:code/studyplan", requireAuth, async (req, res) => {
  const course = getCourse(req.params.code);
  if (!course) return res.status(404).json({ error: "Course not found." });
  res.json({ plan: await generateStudyPlan(course) });
});

export default router;
