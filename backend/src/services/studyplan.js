// AI study-plan generator (ported from ai_assist.py).
//  - If an LLM is configured -> a real 4-week plan from the model.
//  - Otherwise -> a built-in rule-based plan from the syllabus topics.
const PROVIDER = (process.env.LLM_PROVIDER || "none").toLowerCase();
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "";
const DEFAULT_MODEL = { groq: "openai/gpt-oss-20b", openai: "gpt-4o-mini" };
const LABEL = { groq: "AI · Llama (Groq)", openai: "AI · GPT" };

function llmEnabled() {
  return ["groq", "openai"].includes(PROVIDER) && Boolean(API_KEY);
}
export { llmEnabled };

function prompt(course) {
  const topics = (course.topics || []).join(", ") || course.name;
  const books = (course.textbooks || []).join("; ") || "standard textbooks";
  return (
    `You are a study coach. Create a concise, motivating 4-week study plan ` +
    `for the university course '${course.code} — ${course.name}'.\n` +
    `Syllabus topics: ${topics}.\n` +
    `Recommended books: ${books}.\n` +
    `For each week give a heading and 3-4 bullet tasks (learn, practice, ` +
    `checkpoint). End with one mini-project idea. Keep it under 250 words.`
  );
}

async function callLLM(text) {
  const url = PROVIDER === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL || DEFAULT_MODEL[PROVIDER] || DEFAULT_MODEL.groq,
      max_tokens: 700,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!r.ok) throw new Error(`LLM error ${r.status}`);
  const data = await r.json();
  return data.choices[0].message.content;
}

function fallbackPlan(course) {
  let topics = course.topics || [];
  if (!topics.length) topics = [`Core concepts of ${course.name}`];
  const per = Math.max(1, Math.ceil(topics.length / 4));
  const weeks = [];
  for (let w = 0; w < topics.length; w += per) {
    const chunk = topics.slice(w, w + per);
    const items = chunk.map((t) => `📖 Learn: ${t}`);
    items.push("✍️ Practice problems / revise with notes");
    items.push("✅ Checkpoint: explain this week's topics in your own words");
    weeks.push({ title: `Week ${weeks.length + 1}`, items });
  }
  weeks.push({
    title: `Week ${weeks.length + 1} — Apply it`,
    items: [
      `🚀 Build a mini-project using ${course.name}`,
      "📝 Revise all topics & attempt past questions",
      "🎯 Use the resources on this page (videos / Coursera / docs)",
    ],
  });
  return { source: "Built-in study planner", weeks, text: null };
}

export async function generateStudyPlan(course) {
  if (llmEnabled()) {
    try {
      const text = await callLLM(prompt(course));
      return { source: LABEL[PROVIDER] || "AI", weeks: null, text: text.trim() };
    } catch (e) {
      const fb = fallbackPlan(course);
      fb.source = `Built-in planner (AI unavailable: ${e.name})`;
      return fb;
    }
  }
  return fallbackPlan(course);
}
