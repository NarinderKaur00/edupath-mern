// EduPath backend — Express API server (also serves the built React app in production).
import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import marksRoutes from "./routes/marks.js";
import recommendRoutes from "./routes/recommend.js";
import advisorRoutes from "./routes/advisor.js";
import metaRoutes from "./routes/meta.js";
import coursesRoutes from "./routes/courses.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "8mb" })); // room for an uploaded dataset (base64)

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/admin", adminRoutes);

// ---- serve the built React app (production) ----
// In dev the frontend runs on its own Vite server (port 5173). On Render the
// frontend is built to frontend/dist and served here, so it's one origin.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "..", "frontend", "dist");
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(join(DIST, "index.html")); // SPA fallback
    }
    next();
  });
  console.log("Serving React build from", DIST);
}

// catch-all error handler so a thrown error never crashes a request
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✔  EduPath backend running on http://127.0.0.1:${PORT}`);
      console.log(`   ML service expected at ${process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"}`);
      console.log(`   AI advisor: ${process.env.LLM_PROVIDER && process.env.LLM_PROVIDER !== "none" ? process.env.LLM_PROVIDER : "rule-based (no key)"}`);
    });
  })
  .catch((e) => {
    console.error("Failed to start:", e.message);
    process.exit(1);
  });
