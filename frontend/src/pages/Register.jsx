import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => document.body.classList.remove("auth-body");
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/register", { ...form, consent });
      // match the Flask flow: created -> go to sign in with a success message
      navigate("/login", { state: { flash: { type: "success", msg: "Account created! Please sign in." } } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <div className="brand-logo big">🎓</div>
          <h1>Elective AI</h1>
          <p className="tagline">Create your student account and discover the electives that fit you best.</p>
          <ul className="hero-points">
            <li>✓ Personalised to your grades</li>
            <li>✓ 14 electives analysed instantly</li>
            <li>✓ Keep a history of recommendations</li>
          </ul>
        </div>
      </div>

      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="muted">It takes less than a minute.</p>
        {error && <div className="flash flash-danger">{error}</div>}
        <form className="form" onSubmit={submit}>
          <label>Full name
            <input type="text" value={form.name} onChange={set("name")} placeholder="Jane Perera" required autoFocus />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={set("password")} placeholder="At least 4 characters" required />
          </label>
          <label>Confirm password
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" required />
          </label>
          <label className="consent-row">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link>
              {" "}and consent to my academic data being used for recommendations.</span>
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating…" : "Create Account"}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
