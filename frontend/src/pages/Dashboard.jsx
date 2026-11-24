import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getUser } from "../api.js";

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [hasResults, setHasResults] = useState(false);
  const [recCount, setRecCount] = useState(0);
  const [latest, setLatest] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [marks, hist, l] = await Promise.all([
          api.get("/marks"),
          api.get("/recommend/history"),
          api.get("/recommend/latest"),
        ]);
        setHasResults(Object.keys(marks.marks || {}).length > 0);
        setRecCount(hist.length || 0);
        setLatest(l);
      } catch { /* ignore */ }
    })();
  }, []);

  async function generate() {
    setBusy(true);
    try {
      const rec = await api.post("/recommend", {});
      navigate(`/recommendation/${rec.id}`);
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <>
      <div className="hero-card">
        <div className="hero-card-text">
          <h2>Hi {firstName} 👋</h2>
          <p>Enter your marks and let EduPath predict the electives where you're most likely to excel.</p>
          <div className="hero-actions">
            {hasResults ? (
              <>
                <button className="btn btn-light" onClick={generate} disabled={busy}>
                  {busy ? "Working…" : "✨ Generate Recommendation"}
                </button>
                <Link to="/marks" className="btn btn-ghost">Edit My Results</Link>
              </>
            ) : (
              <Link to="/marks" className="btn btn-light">📝 Enter My Marks</Link>
            )}
          </div>
        </div>
        <div className="hero-card-art">🧭</div>
      </div>

      <div className="grid-2">
        {/* How it works */}
        <section className="panel">
          <h3 className="panel-title">How it works</h3>
          <ol className="steps">
            <li className={hasResults ? "done" : ""}>
              <span className="step-dot">1</span>
              <div><strong>Enter my marks</strong><p>Add your marks for past subjects.</p></div>
            </li>
            <li className={recCount > 0 ? "done" : ""}>
              <span className="step-dot">2</span>
              <div><strong>Generate recommendation</strong><p>Our ML model predicts your elective grades.</p></div>
            </li>
            <li>
              <span className="step-dot">3</span>
              <div><strong>View your best-fit electives</strong><p>Pick with confidence.</p></div>
            </li>
          </ol>
        </section>

        {/* Latest recommendation */}
        <section className="panel">
          <h3 className="panel-title">Latest recommendation</h3>
          {latest ? (
            <>
              <p className="muted small">Generated {new Date(latest.createdAt).toLocaleString()}</p>
              <div className="mini-recs">
                {latest.recommended?.slice(0, 3).map((r) => (
                  <div className="mini-rec" key={r.subject}>
                    <span className="subj">{r.subject}</span>
                    <span className="muted small">{r.field_icon || "🎯"} {r.field || ""}</span>
                    <span className="muted small">Fit {r.score}/100</span>
                  </div>
                ))}
              </div>
              <Link to={`/recommendation/${latest.id}`} className="btn btn-ghost btn-sm">View all →</Link>
            </>
          ) : (
            <div className="empty">
              <div className="empty-ico">🔮</div>
              <p>No recommendations yet.</p>
              {hasResults ? (
                <button className="btn btn-primary btn-sm" onClick={generate} disabled={busy}>Generate now</button>
              ) : (
                <Link to="/marks" className="btn btn-primary btn-sm">Start by adding results</Link>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
