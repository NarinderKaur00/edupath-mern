// Thin client for the Python ML micro-service.
// Node cannot run XGBoost, so it asks the Python service over HTTP.
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function mlPredict(marks, topN = 5) {
  const body = JSON.stringify({ marks, top_n: topN });
  let lastErr;
  // The ML service runs on a free tier and may be "cold" (asleep) after idle.
  // Waking it takes ~60-90s, so we retry a few times instead of failing on the
  // very first click. Once it's warm, the first attempt succeeds instantly.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch(`${ML_URL}/predict`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (r.ok) return r.json();
      lastErr = new Error(`ML service error (${r.status})`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < 5) await new Promise((res) => setTimeout(res, 15000)); // wait, then retry
  }
  throw lastErr;
}

export async function mlMeta() {
  const r = await fetch(`${ML_URL}/meta`);
  if (!r.ok) throw new Error(`ML service error (${r.status})`);
  return r.json();
}

// Retrain the models. Optional { buffer, filename } forwards an uploaded CSV.
export async function mlTrain(upload) {
  let body;
  if (upload?.buffer) {
    const fd = new FormData();
    fd.append("file", new Blob([upload.buffer], { type: "text/csv" }), upload.filename || "upload.csv");
    body = fd;
  }
  const r = await fetch(`${ML_URL}/train`, { method: "POST", body });
  if (!r.ok) throw new Error(`ML service error (${r.status})`);
  return r.json();
}
