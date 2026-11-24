import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";

export default function CourseDetail() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [done, setDone] = useState(new Set());
  const [plan, setPlan] = useState(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    try {
      const d = await api.get(`/courses/${code}`);
      setData(d);
      setDone(new Set(d.done || []));
    } catch { setNotFound(true); }
  }
  useEffect(() => { load(); }, [code]);

  if (notFound) {
    return (
      <Layout title="Course" sub="">
        <div className="empty"><div className="empty-ico">🚧</div><p>Course not found.</p>
          <Link to="/courses" className="btn btn-primary btn-sm">← All courses</Link></div>
      </Layout>
    );
  }
  if (!data) return <Layout title="Course" sub=""><p className="muted">Loading…</p></Layout>;

  const c = data.course;
  const topics = c.topics || [];
  const pct = topics.length ? Math.round((done.size / topics.length) * 100) : 0;

  async function toggleEnroll() {
    await api.post(`/courses/${code}/${data.enrolled ? "unenroll" : "enroll"}`, {});
    load();
  }
  function toggleTopic(i) {
    const n = new Set(done);
    n.has(i) ? n.delete(i) : n.add(i);
    setDone(n);
  }
  async function saveProgress(e) {
    e.preventDefault();
    await api.post(`/courses/${code}/progress`, { done: [...done] });
    load();
  }
  async function genPlan() {
    setPlanBusy(true);
    try { setPlan((await api.post(`/courses/${code}/studyplan`, {})).plan); } catch { /* ignore */ }
    setPlanBusy(false);
  }

  return (
    <Layout title={`${c.code} — ${c.name}`} sub={`${c.where} · ${c.ltp} · ${c.cr} credits`}>
      <div className="course-head">
        {c.predicted_field && (
          <span className="field-chip">{c.predicted_icon} Elective in {c.predicted_field}</span>
        )}
        <div className="course-head-actions">
          {data.enrolled ? (
            <>
              <span className="badge-enrolled">✅ In My Learning</span>
              <button className="btn btn-ghost btn-sm" onClick={toggleEnroll}>Remove</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={toggleEnroll}>➕ Add to My Learning</button>
          )}
        </div>
      </div>

      {c.objective && (
        <section className="panel">
          <h3 className="panel-title">🎯 Course objective</h3>
          <p>{c.objective}</p>
        </section>
      )}

      <section className="panel ai-panel highlight-panel">
        <div className="rec-head">
          <h3 className="panel-title">🤖 AI Study Assistant</h3>
          <span className="muted small">{data.ai_enabled ? "Powered by your LLM" : "Built-in planner (add an LLM key to supercharge)"}</span>
        </div>
        {plan ? (
          <>
            <div className="ai-source">✨ {plan.source}</div>
            {plan.weeks ? (
              <div className="ai-weeks">
                {plan.weeks.map((w) => (
                  <div className="ai-week" key={w.title}>
                    <strong>{w.title}</strong>
                    <ul>{w.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="ai-text">{plan.text}</pre>
            )}
            <button className="btn btn-ghost btn-sm" onClick={genPlan} disabled={planBusy}>↻ Regenerate plan</button>
          </>
        ) : (
          <>
            <p className="muted small">✨ Get a personalized <strong>4-week study plan</strong> for this course, generated for you.</p>
            <button className="btn btn-accent" onClick={genPlan} disabled={planBusy}>
              {planBusy ? "Generating…" : "✨ Generate my study plan"}
            </button>
          </>
        )}
      </section>

      <div className="grid-2">
        <section className="panel">
          <h3 className="panel-title">📋 Syllabus topics</h3>
          {topics.length ? (
            <form onSubmit={saveProgress}>
              <div className="score-bar" style={{ marginBottom: 12 }}><span style={{ width: `${pct}%` }} /></div>
              <p className="muted small" style={{ marginBottom: 10 }}>{pct}% complete — tick topics as you finish them.</p>
              <ul className="topic-list">
                {topics.map((t, i) => (
                  <li key={i}>
                    <label className="topic-check">
                      <input type="checkbox" checked={done.has(i)} onChange={() => toggleTopic(i)} />
                      <span>{t}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>💾 Save progress</button>
            </form>
          ) : (
            <p className="muted">Detailed topic breakdown coming soon for this course.</p>
          )}
        </section>

        <section className="panel">
          <h3 className="panel-title">🎓 Learn &amp; practice</h3>
          <div className="res-list">
            {c.resources?.map((r) => (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="res-link" key={r.url}>
                <span className="res-ico">{r.icon}</span> {r.label}
                <span className="res-ext">↗</span>
              </a>
            ))}
          </div>
          {c.textbooks?.length > 0 && (
            <>
              <h3 className="panel-title" style={{ marginTop: 18 }}>📚 Textbooks</h3>
              <ul className="book-list">{c.textbooks.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </>
          )}
        </section>
      </div>

      <div className="sticky-actions">
        <Link to="/courses" className="btn btn-ghost">← All courses</Link>
        <Link to="/my-learning" className="btn btn-primary">My Learning →</Link>
      </div>
    </Layout>
  );
}
