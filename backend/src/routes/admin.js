import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/adminAuth.js";
import User from "../models/User.js";
import Result from "../models/Result.js";
import Recommendation from "../models/Recommendation.js";
import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import AuditLog from "../models/AuditLog.js";
import { mlMeta, mlTrain } from "../services/ml.js";

const router = Router();
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

async function log(actor, action, detail = "") {
  try { await AuditLog.create({ actor, action, detail }); } catch { /* ignore */ }
}

// POST /api/admin/login { username, password } -> admin token
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    await log("admin", "login", "admin signed in");
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "1d" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Invalid admin credentials." });
});

function topFieldOf(rec) {
  return rec?.payload?.fields?.[0]?.field || "";
}

// GET /api/admin/dashboard -> everything the admin dashboard shows
router.get("/dashboard", requireAdmin, async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  const students = [];
  for (const u of users) {
    const hasResults = !!(await Result.findOne({ user: u._id }));
    const recCount = await Recommendation.countDocuments({ user: u._id });
    const latest = await Recommendation.findOne({ user: u._id }).sort({ createdAt: -1 });
    students.push({
      id: u._id, name: u.name, email: u.email,
      created_at: new Date(u.createdAt).toLocaleString(),
      has_results: hasResults, rec_count: recCount, top_field: topFieldOf(latest),
    });
  }

  // popular fields across all recommendations
  const allRecs = await Recommendation.find();
  const tally = {};
  for (const r of allRecs) {
    const f = topFieldOf(r);
    if (f) tally[f] = (tally[f] || 0) + 1;
  }
  const popular = Object.entries(tally)
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count);

  let meta = { perf: [], n_subjects: 0, n_electives: 0, avg_accuracy: 0, dataset_rows: 0, dataset_cols: 0 };
  try { meta = await mlMeta(); } catch { /* ML down */ }

  const audit = (await AuditLog.find().sort({ createdAt: -1 }).limit(15)).map((a) => ({
    created_at: new Date(a.createdAt).toLocaleString(),
    actor: a.actor, action: a.action, detail: a.detail,
  }));

  res.json({
    students,
    n_students: students.length,
    n_with_results: students.filter((s) => s.has_results).length,
    n_recs: allRecs.length,
    popular,
    perf: meta.perf || [],
    n_feat: meta.n_subjects || 0,
    n_elec: meta.n_electives || 0,
    avg_acc: meta.avg_accuracy || 0,
    ds_rows: meta.dataset_rows || 0,
    ds_cols: meta.dataset_cols || 0,
    audit,
  });
});

// POST /api/admin/retrain  { filename?, dataB64? } -> retrain via ML service
router.post("/retrain", requireAdmin, async (req, res) => {
  let upload;
  if (req.body?.dataB64) {
    upload = { buffer: Buffer.from(req.body.dataB64, "base64"), filename: req.body.filename || "upload.csv" };
  }
  try {
    const out = await mlTrain(upload);
    if (!out.ok) {
      await log("admin", "retrain_rejected", out.error || "");
      return res.status(400).json({ error: out.error });
    }
    await log("admin", "retrain", `${out.dataset} avg=${out.avg_accuracy}%`);
    res.json({ ok: true, message: `${out.message || ""}Models retrained on ${out.dataset} — average accuracy ${out.avg_accuracy}% across ${out.n_electives} electives.` });
  } catch (e) {
    res.status(502).json({ error: `Retrain failed: ${e.message}. Is the ML service running?` });
  }
});

// GET /api/admin/export -> full JSON backup (password hashes stripped)
router.get("/export", requireAdmin, async (_req, res) => {
  const strip = (docs) => docs.map((d) => { const o = d.toObject(); delete o.passwordHash; return o; });
  const dump = {
    users: strip(await User.find()),
    results: (await Result.find()).map((d) => d.toObject()),
    recommendations: (await Recommendation.find()).map((d) => d.toObject()),
    enrollments: (await Enrollment.find()).map((d) => d.toObject()),
    progress: (await Progress.find()).map((d) => d.toObject()),
    audit_log: (await AuditLog.find()).map((d) => d.toObject()),
  };
  await log("admin", "export_backup", `${Object.values(dump).reduce((s, v) => s + v.length, 0)} rows`);
  res.setHeader("Content-Disposition", "attachment; filename=edupath_backup.json");
  res.json(dump);
});

async function purge(uid) {
  await Promise.all([
    Result.deleteMany({ user: uid }),
    Recommendation.deleteMany({ user: uid }),
    Enrollment.deleteMany({ user: uid }),
    Progress.deleteMany({ user: uid }),
  ]);
}

// POST /api/admin/student/:id/reset
router.post("/student/:id/reset", requireAdmin, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: "Not found." });
  await purge(u._id);
  await log("admin", "reset_student", u.name);
  res.json({ ok: true });
});

// POST /api/admin/student/:id/delete
router.post("/student/:id/delete", requireAdmin, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: "Not found." });
  await purge(u._id);
  await User.deleteOne({ _id: u._id });
  await log("admin", "delete_student", u.name);
  res.json({ ok: true });
});

export default router;
