// Thin client for the Python ML micro-service.
// Node cannot run XGBoost, so it asks the Python service over HTTP.
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function mlPredict(marks, topN = 5) {
  const r = await fetch(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ marks, top_n: topN }),
  });
  if (!r.ok) throw new Error(`ML service error (${r.status})`);
  return r.json();
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
