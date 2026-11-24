import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function Recommendation() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setRec(await api.get(id ? `/recommend/${id}` : "/recommend/latest"));
      } catch { setRec(null); }
      setLoading(false);
    })();
  }, [id]);

  // draw the compact horizontal bar chart (same as the Flask app)
  useEffect(() => {
    if (!rec?.recommended || !chartRef.current || !window.Chart) return;
    if (chartInst.current) chartInst.current.destroy();
    const labels = rec.recommended.map((r) => r.subject);
    const data = rec.recommended.map((r) => r.score);
    chartInst.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: { labels, datasets: [{ label: "Fit /100", data, backgroundColor: "#c76f80", borderRadius: 6 }] },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        scales: { x: { suggestedMin: 0, suggestedMax: 100 } },
        plugins: { legend: { display: false } },
      },
    });
    return () => { if (chartInst.current) chartInst.current.destroy(); };
  }, [rec]);

  function toggleField(e) {
    const card = e.currentTarget.closest(".field-rec");
    const open = card.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!rec) {
    return (
      <div className="empty">
        <div className="empty-ico">🔮</div>
        <p>No recommendation yet.</p>
        <Link to="/marks" className="btn btn-primary btn-sm">Enter my marks</Link>
      </div>
    );
  }

  return (
    <>
      {/* Best-fit fields */}
      <section className="panel highlight-panel">
        <div className="rec-head">
          <h3 className="panel-title">🧭 Best-fit fields (Elective Focus) for you</h3>
          <span className="muted small">Specialization tracks that suit you best</span>
        </div>
        <div className="field-rec-row">
          {rec.fields?.map((f, i) => (
            <div className={`field-rec rank-${i + 1}`} key={f.field}>
              <button type="button" className="field-rec-head" onClick={toggleField} aria-expanded="false">
                <span className="field-rec-ico">{f.icon}</span>
                <div className="field-rec-main">
                  <strong>{f.field}</strong>
                  <span className="muted small">Fit {f.avg}/100 · {f.n} elective(s)</span>
                </div>
                <span className="field-rec-rank">#{i + 1}</span>
                <span className="field-rec-caret">▾</span>
              </button>
              <div className="field-rec-electives">
                {f.electives?.map((e) => (
                  <div className="field-elective" key={e.subject}>
                    <span className="fe-name">{e.subject} — {e.name}</span>
                    <span className="muted small">Fit {e.score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>💡 Click a field (▾) to see the elective subjects inside it.</p>
      </section>

      {/* Compact chart */}
      <section className="panel chart-panel">
        <div className="chart-row">
          <div className="chart-intro">
            <h3 className="panel-title">📊 Top electives at a glance</h3>
            <p className="muted small">Your recommended electives ranked by <strong>fit score</strong> (out of 100).
              The longer the bar, the better the match for your marks.</p>
          </div>
          <div className="chart-box-sm"><canvas ref={chartRef} /></div>
        </div>
      </section>

      {/* Recommended electives */}
      <section className="panel">
        <h3 className="panel-title">🏆 Recommended electives for you</h3>
        <p className="muted small">These are the electives where your marks suggest the strongest fit.</p>
        <div className="erec-list">
          {rec.recommended?.map((r, i) => (
            <div className={`erec rank-${i + 1}`} key={r.subject}>
              <div className="erec-rank">#{i + 1}</div>
              <div className="erec-main">
                <div className="erec-title">
                  <strong>{r.subject} — {r.name}</strong>
                  <span className="field-chip">{r.field_icon} {r.field}</span>
                </div>
                <div className="erec-fit">
                  <div className="score-bar sm2"><span style={{ width: `${r.score}%` }} /></div>
                  <span className="muted small">Fit {r.score}/100{r.confidence ? ` · confidence ${r.confidence}%` : ""}</span>
                </div>
                {r.reason && <p className="erec-reason">✅ {r.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why these electives */}
      <section className="panel">
        <h3 className="panel-title">🔍 Why these electives? — the factors the model weighed</h3>
        <p className="muted small">For each elective, these are the past subjects the model relied on
          most, and how you performed in them (your real grades).</p>
        <div className="why-list">
          {rec.recommended?.filter((r) => r.drivers?.length).map((r) => (
            <div className="why-block" key={r.subject}>
              <div className="why-head">
                <span className="field-chip">{r.field_icon} {r.field}</span>
                <strong>{r.subject} — {r.name}</strong>
              </div>
              <div className="why-drivers">
                {r.drivers.map((d) => (
                  <div className="why-row" key={d.feature}>
                    <span className="why-subj">{d.name}</span>
                    <div className="why-bar"><span style={{ width: `${Math.round(d.importance * 4)}%` }} /></div>
                    <span className="why-weight muted small">{d.importance}%</span>
                    <span className={`grade-pill grade-${d.grade_class}`} title="your grade in this subject">{d.letter}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          💡 The <strong>bar/%</strong> is how much the model weighs that subject for this elective;
          the colored letter is <strong>your</strong> grade in it. Good grades in high-weight subjects → strong fit.
        </p>
      </section>

      <div className="sticky-actions">
        <Link to="/dashboard" className="btn btn-ghost">← Dashboard</Link>
        <Link to="/marks" className="btn btn-primary">＋ New prediction</Link>
      </div>
    </>
  );
}
