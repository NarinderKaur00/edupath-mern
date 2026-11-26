import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Marks() {
  const [groups, setGroups] = useState([]);
  const [marks, setMarks] = useState({}); // { CODE: "88" }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const meta = await api.get("/meta");
        setGroups(meta.groups || []);
        const saved = await api.get("/marks");
        const init = {};
        for (const g of meta.groups || []) {
          for (const it of g.items) {
            init[it.code] = String(Math.round(saved.marks?.[it.code] ?? 0));
          }
        }
        setMarks(init);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  const setMark = (code) => (e) => setMarks({ ...marks, [code]: e.target.value });

  function clearAll() {
    const z = {};
    for (const k of Object.keys(marks)) z[k] = "0";
    setMarks(z);
  }

  function collect() {
    const out = {};
    for (const [code, v] of Object.entries(marks)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[code] = n;
    }
    return out;
  }

  async function submit(action) {
    setError("");
    setBusy(true);
    try {
      await api.put("/marks", { marks: collect() });
      if (action === "recommend") {
        const rec = await api.post("/recommend", {});
        navigate(`/recommendation/${rec.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit("recommend"); }} className="results-form">
      {error && <div className="flash flash-danger">{error}</div>}

      <div className="results-toolbar">
        <div className="muted small">
          💡 Enter the marks you scored in each subject. Leave any subject you didn't take at 0.
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>↺ Clear all</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => submit("save")}>💾 Save Results</button>
        </div>
      </div>

      {groups.map((g) => (
        <section className="panel" key={g.semester}>
          <h3 className="panel-title">{g.semester}</h3>
          <div className="marks-grid">
            {g.items.map((s) => (
              <div className="mark-field" key={s.code} title={s.name}>
                <label htmlFor={s.code}>{s.code}</label>
                <span className="mark-name">{s.name}</span>
                <input type="number" min="0" max="100" step="1" id={s.code}
                  value={marks[s.code] ?? "0"} onChange={setMark(s.code)} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {error && <div className="flash flash-danger">{error}</div>}
      {busy && (
        <div className="muted small" style={{ textAlign: "right" }}>
          ⏳ Working… if the server was asleep this can take up to a minute.
        </div>
      )}
      <div className="sticky-actions">
        <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit("save")}>💾 Save Results</button>
        <button type="submit" className="btn btn-accent" disabled={busy}>{busy ? "⏳ Please wait…" : <>✨ Save &amp; Recommend</>}</button>
      </div>
    </form>
  );
}
