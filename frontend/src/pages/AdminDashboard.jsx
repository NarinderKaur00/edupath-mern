import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, adminDownload, clearAdminToken } from "../api.js";

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [flash, setFlash] = useState(null); // {type, msg}
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  async function load() {
    try { setD(await adminApi.get("/admin/dashboard")); }
    catch (e) {
      if (/expired|sign-in|Admin only/i.test(e.message)) { clearAdminToken(); navigate("/admin/login"); }
      else setFlash({ type: "danger", msg: e.message });
    }
  }
  useEffect(() => { load(); }, []);

  function logout() { clearAdminToken(); navigate("/admin/login"); }

  async function retrain(e) {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    try {
      let payload = {};
      const file = fileRef.current?.files?.[0];
      if (file) {
        if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Please upload a .csv file.");
        const dataB64 = await fileToB64(file);
        payload = { filename: file.name, dataB64 };
      }
      const out = await adminApi.post("/admin/retrain", payload);
      setFlash({ type: "success", msg: out.message });
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      setFlash({ type: "danger", msg: err.message });
    }
    setBusy(false);
  }

  async function resetStudent(s) {
    if (!confirm(`Reset ${s.name}'s results & recommendations? The account stays.`)) return;
    await adminApi.post(`/admin/student/${s.id}/reset`, {});
    load();
  }
  async function deleteStudent(s) {
    if (!confirm(`DELETE ${s.name} and ALL their data permanently?`)) return;
    await adminApi.post(`/admin/student/${s.id}/delete`, {});
    load();
  }
  async function backup() {
    try { await adminDownload("/admin/export", "edupath_backup.json"); } catch { /* ignore */ }
  }

  if (!d) return (
    <div className="admin-shell"><main className="content" style={{ maxWidth: 1150, margin: "0 auto" }}>
      <p className="muted">Loading…</p></main></div>
  );

  const maxPopular = d.popular[0]?.count || 1;

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="admin-brand">🛠️ <strong>Elective AI Admin</strong></div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </header>

      <main className="content" style={{ maxWidth: 1150, margin: "0 auto" }}>
        {flash && <div className="flash-area"><div className={`flash flash-${flash.type}`}>{flash.msg}</div></div>}

        <h1 className="page-title" style={{ margin: "6px 0 18px" }}>Admin Dashboard</h1>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-ico blue">👥</div>
            <div><div className="stat-num">{d.n_students}</div><div className="stat-lbl">Registered students</div></div></div>
          <div className="stat-card"><div className="stat-ico green">📝</div>
            <div><div className="stat-num">{d.n_with_results}</div><div className="stat-lbl">Entered results</div></div></div>
          <div className="stat-card"><div className="stat-ico orange">✨</div>
            <div><div className="stat-num">{d.n_recs}</div><div className="stat-lbl">Recommendations made</div></div></div>
          <div className="stat-card"><div className="stat-ico purple">🤖</div>
            <div><div className="stat-num">{d.avg_acc}%</div><div className="stat-lbl">Avg model accuracy</div></div></div>
        </div>

        <div className="grid-2">
          <section className="panel">
            <h3 className="panel-title">🗂️ Training dataset &amp; models</h3>
            <ul className="kv">
              <li><span>Dataset rows (students)</span><strong>{d.ds_rows}</strong></li>
              <li><span>Columns</span><strong>{d.ds_cols}</strong></li>
              <li><span>Input courses (features)</span><strong>{d.n_feat}</strong></li>
              <li><span>Electives predicted</span><strong>{d.n_elec}</strong></li>
            </ul>
            <form onSubmit={retrain} className="retrain-form">
              <label className="muted small">Optional: upload a new student dataset (.csv) with the same columns</label>
              <input type="file" accept=".csv" className="file-input" ref={fileRef} />
              <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Retraining…" : "🔄 Retrain models"}</button>
              <p className="muted small">Uploaded files are validated (columns, rows, 0–100 range) before training. Leave empty to retrain on the current dataset.</p>
            </form>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={backup}>⬇️ Download data backup (JSON)</button>
          </section>

          <section className="panel">
            <h3 className="panel-title">🧭 Most-recommended fields</h3>
            {d.popular.length ? (
              <div className="perf-list">
                {d.popular.map((p) => (
                  <div className="perf-row" key={p.field}>
                    <span className="perf-subj" style={{ width: 170 }}>{p.field}</span>
                    <div className="perf-bar"><span className="good" style={{ width: `${Math.round(p.count / maxPopular * 100)}%` }} /></div>
                    <span className="perf-val">{p.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="muted">No recommendations generated yet.</p>}
          </section>
        </div>

        <section className="panel">
          <h3 className="panel-title">👥 Students</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Results?</th><th>Recs</th><th>Top field</th><th>Actions</th></tr></thead>
              <tbody>
                {d.students.length ? d.students.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="muted">{s.email}</td>
                    <td className="muted">{s.created_at}</td>
                    <td>{s.has_results ? "✅" : "—"}</td>
                    <td>{s.rec_count}</td>
                    <td className="muted">{s.top_field || "—"}</td>
                    <td className="row-actions">
                      <button className="btn btn-ghost btn-xs" onClick={() => resetStudent(s)} title="Clear results & recommendations">↺ Reset</button>
                      <button className="btn btn-danger btn-xs" onClick={() => deleteStudent(s)} title="Delete student">🗑 Delete</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="muted">No students registered yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h3 className="panel-title">🤖 Model accuracy per elective</h3>
          <div className="perf-list">
            {d.perf.map((p) => (
              <div className="perf-row" key={p.subject}>
                <span className="perf-subj" title={p.name}>{p.subject}</span>
                <div className="perf-bar"><span className={p.accuracy >= 80 ? "good" : (p.accuracy >= 70 ? "ok" : "low")} style={{ width: `${p.accuracy}%` }} /></div>
                <span className="perf-val">{p.accuracy}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3 className="panel-title">📜 Audit log (recent admin actions)</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
              <tbody>
                {d.audit.length ? d.audit.map((a, i) => (
                  <tr key={i}>
                    <td className="muted">{a.created_at}</td>
                    <td><strong>{a.actor}</strong></td>
                    <td>{a.action}</td>
                    <td className="muted">{a.detail}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="muted">No actions logged yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function fileToB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
