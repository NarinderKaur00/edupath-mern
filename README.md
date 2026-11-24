# EduPath — MERN edition 🎓

Course & Field Recommendation System, rebuilt as a **MERN** app with a clean
**frontend / backend split** (plus a small Python ML service, because the
machine-learning models are XGBoost and only Python can run them).

```
EduPath_MERN/
├── frontend/     React (Vite)              ← the user interface
├── backend/      Node + Express + MongoDB  ← auth, data, the AI advisor
└── ml-service/   Python (FastAPI)          ← the XGBoost ML brain (predictions)
```

**How they talk to each other**

```
 Browser ──HTTP──> React (frontend, :5173)
                      │  /api/*  (proxied)
                      ▼
                  Express (backend, :5000) ──> MongoDB  (users, marks, history)
                      │                    └──> Groq LLM (AI advisor, optional)
                      │  POST /predict
                      ▼
                  FastAPI (ml-service, :8000) ──> bundle.joblib (14 XGBoost models)
```

---

## ▶️ How to run it (3 terminals)

You need **Node 18+** and **Python 3.10+**.

### 1) ML service (Python) — terminal 1
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --port 8000
```
It loads the pre-trained `models/bundle.joblib`, so it works immediately.

### 2) Backend (Node) — terminal 2
```bash
cd backend
npm install
copy .env.example .env      # (Mac/Linux: cp .env.example .env)
npm start
```
- Leave `MONGODB_URI` **blank** in `.env` to use a zero-setup in-memory database
  (great for a quick demo).
- Or paste your **MongoDB Atlas** connection string (the same one the Flask app
  used) to keep real data.

### 3) Frontend (React) — terminal 3
```bash
cd frontend
npm install
npm run dev
```
Open **http://127.0.0.1:5173** → register → enter marks → get recommendations.

> **Tip (Windows):** double-click **`start_all.bat`** to open all three at once
> (after you've done the one-time `pip install` / `npm install`).

---

## 🤖 Turn on the real AI advisor (optional, free)
In `backend/.env`:
```
LLM_PROVIDER=groq
LLM_API_KEY=gsk_your_free_groq_key
```
Get a free key at **https://console.groq.com**. Without a key, the advisor still
works using a built-in rule-based engine.

---

## 🖥️ Pages (full parity with the Flask app)
Student: **Login, Register, Dashboard, My Results (marks), Recommendations (history + detail),
Courses & Curriculum, Course detail (syllabus progress + AI study plan), My Learning,
Fields & Electives, Privacy**, plus the floating **AI Specialization Advisor**.
Admin (`/admin`, default `admin` / `admin123`): **KPIs, dataset & retrain, popular fields,
students table (reset/delete), per-elective accuracy, audit log, JSON backup export.**

## 🧩 What each part does

| Part | Folder | Key files |
|---|---|---|
| **Frontend** | `frontend/` | `src/pages/*` (all pages), `src/components/Layout.jsx` (sidebar+topbar), `src/api.js` |
| **Backend** | `backend/` | `src/server.js`, `src/routes/*` (auth, marks, recommend, advisor, meta, courses, admin), `src/models/*` (Mongoose), `src/services/*` (advisor, studyplan, content, ml) |
| **ML service** | `ml-service/` | `main.py` (FastAPI: `/predict`, `/meta`, `/train`), `ml_core.py` (XGBoost + SMOTE), `models/bundle.joblib`, `data/` |

## 🔌 API (backend)
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | sign up / sign in (JWT) |
| GET/PUT | `/api/marks` | load / save the student's marks |
| POST | `/api/recommend` · GET `/latest` `/:id` `/history` | run / fetch recommendations |
| GET | `/api/courses` · `/:code` · `/my-learning` · `/fields` | catalogue, detail, learning, tracks |
| POST | `/api/courses/:code/enroll` · `/unenroll` · `/progress` · `/studyplan` | learning actions |
| POST | `/api/advisor/ask` | AI specialization advisor |
| GET | `/api/meta` | model stats + subject list for the form |
| POST | `/api/admin/login` · GET `/dashboard` · POST `/retrain` · GET `/export` | admin console |

---

## ⚠️ Honest note
The dataset is a **relabeled stand-in** (real student grade patterns with Thapar
course codes) — a demonstration dataset, **not real Thapar records**. The ML and
AI methods are fully genuine.
