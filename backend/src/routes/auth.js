import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function makeToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, confirm, consent } = req.body || {};
  const mail = (email || "").trim().toLowerCase();

  if (!name?.trim() || !mail || !password) return res.status(400).json({ error: "All fields are required." });
  if (!EMAIL_RE.test(mail)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (password !== confirm) return res.status(400).json({ error: "Passwords do not match." });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters." });
  if (!consent) return res.status(400).json({ error: "Please accept the privacy policy to continue." });

  if (await User.findOne({ email: mail })) return res.status(409).json({ error: "That email is already registered." });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: mail, passwordHash, consent: true });
  res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const mail = (email || "").trim().toLowerCase();
  const user = await User.findOne({ email: mail });
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
});

export default router;
