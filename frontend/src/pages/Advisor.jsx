import { useState, useRef, useEffect } from "react";
import { api, getUser } from "../api.js";

// render **bold** and newlines like the Flask advisor does
function format(text) {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  return { __html: html };
}

export default function Advisor() {
  const user = getUser();
  const firstName = user?.name?.split(" ")[0] || "there";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    setMsgs([{ who: "bot", text: `Hi ${firstName}! 👋 I can help you pick your specialization. Try: **"Which specialization is best for me?"** or **"Tell me about Data Science"**.` }]);
  }, [firstName]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, open]);

  async function ask(text) {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { who: "me", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const { answer } = await api.post("/advisor/ask", { question });
      setMsgs((m) => [...m, { who: "bot", text: answer }]);
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: "Network error — please try again." }]);
    }
    setBusy(false);
  }

  return (
    <div id="advisor">
      <button id="advisor-fab" onClick={() => setOpen((o) => !o)} title="Ask the specialization advisor">🎓</button>
      <div id="advisor-box" className={open ? "" : "advisor-hidden"}>
        <div className="advisor-head">
          <span>🎓 Specialization Advisor</span>
          <button onClick={() => setOpen(false)} className="advisor-x">✕</button>
        </div>
        <div id="advisor-log" className="advisor-log" ref={logRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`advisor-msg ${m.who}`} dangerouslySetInnerHTML={format(m.text)} />
          ))}
          {busy && <div className="advisor-msg bot">…</div>}
        </div>
        <div className="advisor-chips">
          <button onClick={() => ask("Which specialization is best for me?")}>Best for me?</button>
          <button onClick={() => ask("List all specializations")}>All tracks</button>
          <button onClick={() => ask("What careers are in Data Science?")}>Careers</button>
        </div>
        <form className="advisor-form" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} type="text"
            placeholder="Ask about specializations…" autoComplete="off" />
          <button type="submit">➤</button>
        </form>
      </div>
    </div>
  );
}
