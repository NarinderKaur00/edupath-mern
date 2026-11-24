import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAdminToken } from "../api.js";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => document.body.classList.remove("auth-body");
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token } = await api.post("/admin/login", { username, password });
      setAdminToken(token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero admin-hero">
        <div className="auth-hero-inner">
          <div className="brand-logo big">🛠️</div>
          <h1>Admin Console</h1>
          <p className="tagline">Manage the dataset, retrain models and monitor students.</p>
          <ul className="hero-points">
            <li>✓ View all registered students</li>
            <li>✓ Upload a dataset &amp; retrain models</li>
            <li>✓ Track model accuracy &amp; popular fields</li>
          </ul>
        </div>
      </div>
      <div className="auth-card">
        <h2>Admin sign in 🔒</h2>
        <p className="muted">Restricted area.</p>
        {error && <div className="flash flash-danger">{error}</div>}
        <form className="form" onSubmit={submit}>
          <label>Username
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required autoFocus />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
        </form>
        <p className="auth-switch"><Link to="/login">← Student sign in</Link></p>
      </div>
    </div>
  );
}
