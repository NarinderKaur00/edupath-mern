import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Fields() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await api.get("/courses/fields")); } catch { setData(null); }
    })();
  }, []);

  if (!data) return <p className="muted">Loading…</p>;

  return (
    <>
      <h3 className="section-head">🏆 Elective-Focus specialization tracks</h3>
      <div className="field-grid">
        {data.focus.map((f) => (
          <div className="field-card" key={f.name}>
            <div className="field-top">
              <span className="field-ico">{f.icon}</span>
              <span className="field-tag">{f.tag}</span>
            </div>
            <h4 className="field-name">{f.name}</h4>
            <ul className="field-courses">
              {f.courses.map((c) => (
                <li key={c.code}><span className="course-code">{c.code}</span> {c.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="section-head">📋 Professional Elective baskets</h3>
      <div className="grid-2">
        {Object.entries(data.prof_electives).map(([basket, courses]) => (
          <section className="panel" key={basket}>
            <h3 className="panel-title">{basket}</h3>
            <ul className="basket-list">
              {courses.map((c) => (
                <li key={c.code}><span className="course-code">{c.code}</span> {c.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="muted small" style={{ marginTop: 14 }}>
        📌 Note: the model is trained on a relabeled stand-in dataset (demonstration data, not real Thapar records).
      </p>
    </>
  );
}
