import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Courses() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try { setData(await api.get("/courses")); } catch { setData(null); }
    })();
  }, []);

  const enrolled = useMemo(() => new Set(data?.enrolled || []), [data]);

  if (!data) return <p className="muted">Loading…</p>;
  const needle = q.toLowerCase();

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-ico blue">📚</div>
          <div><div className="stat-num">{data.n_total}</div><div className="stat-lbl">Courses</div></div></div>
        <div className="stat-card"><div className="stat-ico purple">🎓</div>
          <div><div className="stat-num">{data.core_credits}</div><div className="stat-lbl">Core credits (Sem I–VII)</div></div></div>
        <div className="stat-card"><div className="stat-ico orange">🧭</div>
          <div><div className="stat-num">{data.n_electives}</div><div className="stat-lbl">Electives</div></div></div>
        <div className="stat-card"><div className="stat-ico green">✅</div>
          <div><div className="stat-num">{data.n_enrolled}</div><div className="stat-lbl">In My Learning</div></div></div>
      </div>

      <div className="results-toolbar">
        <div className="muted small">💡 Click a course to open its syllabus, free resources and progress tracker.</div>
        <input type="text" className="search-box" placeholder="🔎 Search courses…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {data.groups.map((g) => {
        const items = g.items.filter((c) =>
          !needle || `${c.name} ${c.code}`.toLowerCase().includes(needle));
        if (!items.length) return null;
        return (
          <section className="panel" key={g.group}>
            <div className="rec-head">
              <h3 className="panel-title">{g.group}</h3>
              <span className="muted small">{items.length} course(s){g.credits ? ` · ${g.credits} credits` : ""}</span>
            </div>
            <div className="course-grid">
              {items.map((c) => (
                <Link to={`/course/${c.code}`} className="course-tile" key={c.code}>
                  <div className="course-tile-top">
                    <span className="course-code">{c.code}</span>
                    {enrolled.has(c.code) && <span className="enrolled-dot" title="In My Learning">✅</span>}
                  </div>
                  <div className="course-tile-name">{c.name}</div>
                  <div className="course-tile-meta">
                    {c.cr && <span className="muted small">{c.cr} credits</span>}
                    {c.ltp && <span className="muted small">· L-T-P {c.ltp}</span>}
                    {c.field && <span className="muted small">· {c.field}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="panel info-panel">
        <p className="muted small">
          💡 From Semester V you also pick <strong>Professional Electives</strong> from the specialization
          tracks — see <Link to="/fields">Fields &amp; Electives</Link>, and use
          {" "}<Link to="/marks">My Results</Link> → <em>Save &amp; Recommend</em> to find your best fit.
        </p>
      </section>
    </>
  );
}
