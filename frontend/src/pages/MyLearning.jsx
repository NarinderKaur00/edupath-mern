import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyLearning() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await api.get("/courses/my-learning")); } catch { setData({ items: [], avg: 0 }); }
    })();
  }, []);

  if (!data) return <p className="muted">Loading…</p>;
  const { items, avg } = data;
  const completed = items.filter((i) => i.pct === 100).length;

  if (!items.length) {
    return (
      <div className="panel">
        <div className="empty">
          <div className="empty-ico">📚</div>
          <p>You haven't added any courses yet.</p>
          <Link to="/courses" className="btn btn-primary btn-sm">Browse courses</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-ico blue">📖</div>
          <div><div className="stat-num">{items.length}</div><div className="stat-lbl">Courses enrolled</div></div></div>
        <div className="stat-card"><div className="stat-ico green">✅</div>
          <div><div className="stat-num">{avg}%</div><div className="stat-lbl">Average progress</div></div></div>
        <div className="stat-card"><div className="stat-ico purple">🎯</div>
          <div><div className="stat-num">{completed}</div><div className="stat-lbl">Completed</div></div></div>
      </div>

      <div className="learn-list">
        {items.map((it) => (
          <Link to={`/course/${it.code}`} className="learn-row" key={it.code}>
            <div className="learn-main">
              <strong>{it.code} — {it.name}</strong>
              <span className="muted small">{it.where} · {it.done}/{it.total} topics</span>
            </div>
            <div className="learn-bar">
              <div className="score-bar"><span style={{ width: `${it.pct}%` }} /></div>
            </div>
            <div className="learn-pct">{it.pct}%</div>
          </Link>
        ))}
      </div>
    </>
  );
}
