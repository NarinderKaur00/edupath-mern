// AI Specialization Advisor (ported from advisor.py + ai_assist.py).
//  - If LLM_PROVIDER=groq and a key is set -> answers with the real Groq LLM.
//  - Otherwise -> a built-in rule-based engine, so it always works.
import { SPEC_KB, ALIASES } from "./specKB.js";

const PROVIDER = (process.env.LLM_PROVIDER || "none").toLowerCase();
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "";

const DEFAULT_MODEL = {
  groq: "openai/gpt-oss-20b",
  openai: "gpt-4o-mini",
};

export function llmEnabled() {
  return ["groq", "openai"].includes(PROVIDER) && Boolean(API_KEY);
}

// ---- find a field mentioned in free text --------------------------------
function matchField(text) {
  const t = text.toLowerCase();
  for (const name of Object.keys(SPEC_KB)) {
    if (t.includes(name.toLowerCase())) return name;
  }
  // longest alias first so "full stack" beats "ai"
  const keys = Object.keys(ALIASES).sort((a, b) => b.length - a.length);
  for (const kw of keys) if (t.includes(kw)) return ALIASES[kw];
  return null;
}

function describe(field) {
  const kb = SPEC_KB[field];
  if (!kb) return `**${field}** is one of the specialization tracks you can choose.`;
  return (
    `**${field}** — ${kb.what}\n\n` +
    `💼 Careers: ${kb.careers.join(", ")}.\n` +
    `📚 Do well in these subjects for it: ${kb.strengths.join(", ")}.`
  );
}

// ---- rule-based engine ---------------------------------------------------
function ruleBased(question, ctx) {
  const q = question.toLowerCase().trim();
  const topFields = ctx.top_fields || [];
  const topName = topFields.length ? topFields[0].field : null;

  const wantsPick = ["which", "best for me", "suggest", "recommend", "should i",
    "what should", "choose", "pick", "right for me", "suit"].some((k) => q.includes(k));
  if (wantsPick) {
    if (topFields.length) {
      const lines = ["Based on the marks you entered, your best-fit tracks are:"];
      topFields.slice(0, 3).forEach((f, i) =>
        lines.push(`${i + 1}. **${f.field}** — fit ${f.avg ?? "?"}/100`));
      lines.push("", describe(topFields[0].field));
      lines.push("\n💡 Open **Recommendations** to see the full list and the reasons.");
      return lines.join("\n");
    }
    return ("I can suggest a specialization once you've entered your marks. " +
      "Go to **Enter Marks**, add them and hit *Save & Recommend*, then ask me again!");
  }

  const field = matchField(q);
  if (field) {
    let ans = describe(field);
    if (["career", "job", "scope", "salary", "future"].some((k) => q.includes(k))) {
      ans = `💼 Careers in **${field}**: ${(SPEC_KB[field]?.careers || []).join(", ")}.\n\n` + ans;
    }
    return ans;
  }

  if (q.includes("why") && topName) {
    let base = `Your top track is **${topName}**.`;
    if (ctx.reason) base += ` ${ctx.reason}`;
    return base + "\n\n" + describe(topName);
  }

  if (["career", "job", "scope"].some((k) => q.includes(k)) && topName) {
    return `For your top track **${topName}**, common careers are: ` +
      `${(SPEC_KB[topName]?.careers || []).join(", ")}.`;
  }

  if (["list", "all", "options", "tracks", "specialization", "fields"].some((k) => q.includes(k))) {
    const names = Object.keys(SPEC_KB).map((n) => `• ${n}`).join("\n");
    return "Here are the specialization tracks you can choose:\n" + names +
      "\n\nAsk me about any one (e.g. *'tell me about Data Science'*).";
  }

  const hint = topName ? ` Your current best-fit track is **${topName}**.` : "";
  return ("I'm your specialization advisor 🎓. Ask me things like:\n" +
    "• *Which specialization is best for me?*\n" +
    "• *Tell me about Data Science*\n" +
    "• *What careers are in Cyber Security?*" + hint);
}

// ---- real LLM (Groq / OpenAI-compatible) ---------------------------------
async function llmAnswer(question, ctx) {
  const top = (ctx.top_fields || []).slice(0, 3)
    .map((f) => `${f.field} (${f.avg ?? "?"}/100)`).join(", ") || "not computed yet";
  const kbLines = Object.entries(SPEC_KB)
    .map(([n, d]) => `- ${n}: ${d.what} Careers: ${d.careers.join(", ")}.`).join("\n");
  const prompt =
    "You are Elective AI's friendly specialization advisor for B.E. (CSE) students. " +
    "Answer ONLY about choosing an Elective-Focus specialization and related careers. " +
    "Be concise (under 130 words), warm and practical.\n\n" +
    `The student's best-fit tracks from their marks: ${top}.\n` +
    `Reason given by the recommender: ${ctx.reason || "n/a"}.\n\n` +
    `Specialization tracks available:\n${kbLines}\n\n` +
    `Student's question: ${question}`;

  const url = PROVIDER === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL || DEFAULT_MODEL[PROVIDER] || DEFAULT_MODEL.groq,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`LLM error ${r.status}`);
  const data = await r.json();
  return data.choices[0].message.content.trim();
}

// ---- public entry --------------------------------------------------------
export async function answer(question, ctx) {
  if (llmEnabled()) {
    try {
      return await llmAnswer(question, ctx);
    } catch {
      /* fall back silently */
    }
  }
  return ruleBased(question, ctx);
}
