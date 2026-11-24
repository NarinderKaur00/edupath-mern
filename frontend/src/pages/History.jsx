import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function History() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    (async () => {
      try { setItems(await api.get("/recommend/history")); } catch { setItems([]); }
    })();
  }, []);

  if (items === null) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="results-toolbar">
        <div className="muted small">🗂️ {items.length} recommendation(s) on record</div>
        <Link to="/marks" className="btn btn-primary btn-sm">＋ New prediction</Link>
      </div>

      {items.length ? (
        <div className="history-list">
          {items.map((it) => (
            <Link to={`/recommendation/${it.id}`} className="history-item" key={it.id}>
              <div className="hi-icon">📄</div>
              <div className="hi-main">
                <strong>Recommendation</strong>
                <span className="muted small">{new Date(it.createdAt).toLocaleString()}</span>
              </div>
              <div className="hi-top">
                {it.top && (
                  <>
                    <span className="muted small">Top pick</span>
                    <span className="subj">{it.top.subject}</span>
                    <span className="muted small">{it.top.field_icon || "🎯"} {it.top.field || ""}</span>
                  </>
                )}
              </div>
              <div className="hi-arrow">→</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="empty">
            <div className="empty-ico">🗂️</div>
            <p>You haven't generated any recommendations yet.</p>
            <Link to="/marks" className="btn btn-primary btn-sm">Add results to begin</Link>
          </div>
        </div>
      )}
    </>
  );
}
