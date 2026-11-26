import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api, setAuth } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // success flash passed from the register page ("Account created! Please sign in.")
  const flash = location.state?.flash;

  // the auth pages use a full-screen maroon background
  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => document.body.classList.remove("auth-body");
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = await api.post("/auth/login", { email, password });
      setAuth(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <div className="brand-logo big">🎓</div>
          <h1>Elective AI</h1>
          <p className="tagline">Smart elective &amp; field recommendations, powered by your own academic results.</p>
          <ul className="hero-points">
            <li>✓ Predict your grade in every elective</li>
            <li>✓ Get your best-fit subjects ranked</li>
            <li>✓ Backed by machine learning on real data</li>
          </ul>
        </div>
      </div>

      <div className="auth-card">
        <h2>Welcome back 👋</h2>
        <p className="muted">Sign in to view your recommendations.</p>
        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}
        {error && <div className="flash flash-danger">{error}</div>}
        <form className="form" onSubmit={submit}>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
        <p className="auth-switch muted small">🛠️ <Link to="/admin/login">Admin sign in</Link></p>
      </div>
    </div>
  );
}
