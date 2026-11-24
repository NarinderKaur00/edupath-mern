import jwt from "jsonwebtoken";

// Protects routes: the client must send "Authorization: Bearer <token>".
// If the token is valid we attach req.userId and continue; else 401.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please sign in." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}
