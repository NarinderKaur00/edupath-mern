// Tiny API helper. Stores the login token in localStorage and attaches it to
// every request as "Authorization: Bearer <token>".
const TOKEN_KEY = "edupath_token";
const USER_KEY = "edupath_user";
const ADMIN_KEY = "edupath_admin_token";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminToken() { return localStorage.getItem(ADMIN_KEY); }
export function setAdminToken(t) { localStorage.setItem(ADMIN_KEY, t); }
export function clearAdminToken() { localStorage.removeItem(ADMIN_KEY); }

async function request(method, path, body, { admin } = {}) {
  const headers = { "content-type": "application/json" };
  const token = admin ? getAdminToken() : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  put: (p, b) => request("PUT", p, b),
};

export const adminApi = {
  get: (p) => request("GET", p, null, { admin: true }),
  post: (p, b) => request("POST", p, b, { admin: true }),
};

// download a protected JSON file (admin backup)
export async function adminDownload(path, filename) {
  const res = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
