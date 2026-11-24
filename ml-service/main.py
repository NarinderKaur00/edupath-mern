"""
EduPath ML micro-service (FastAPI)
==================================
This is the ONLY Python part of the MERN stack. It keeps the real XGBoost
models (which Node.js cannot run) behind a tiny HTTP API that the Node backend
calls.

Endpoints
---------
GET  /health            -> is the model loaded?
GET  /meta              -> feature columns + model stats (for the dashboard)
POST /predict  {marks}  -> full recommendation payload (electives + fields + reasons)

Run:
    uvicorn main:app --port 8000
"""
import os
import shutil
import tempfile
from typing import Dict, Optional

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml_core import (
    load_bundle, recommend_for_student, explain_prediction, train_and_save, GRADE_LETTERS,
)
from thapar_map import (
    enrich_predictions, recommended_fields, FEATURE_NAME,
)

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(HERE, "models")
DATA_PATH = os.path.join(HERE, "data", "Grade_Thapar_Students.csv")

BUNDLE = load_bundle(MODELS_DIR)   # loaded once at startup


def validate_dataset(path, expected_cols):
    """Check an uploaded CSV before retraining (ported from app.py)."""
    import pandas as pd
    try:
        df = pd.read_csv(path, na_values=["NA"])
    except Exception as e:
        return False, f"Could not read the CSV ({e})."
    missing = set(expected_cols) - set(df.columns)
    if missing:
        sample = ", ".join(sorted(missing)[:6])
        return False, f"Missing {len(missing)} required column(s): {sample} …"
    if len(df) < 30:
        return False, f"Too few rows ({len(df)}). Need at least 30 students."
    sub = df[list(expected_cols)].apply(pd.to_numeric, errors="coerce")
    mx, mn = sub.max().max(), sub.min().min()
    if pd.notna(mx) and mx > 100:
        return False, f"Some marks are above 100 (max found: {mx:g})."
    if pd.notna(mn) and mn < 0:
        return False, f"Some marks are negative (min found: {mn:g})."
    return True, f"Valid — {len(df)} students, {len(df.columns)} columns."

app = FastAPI(title="EduPath ML Service", version="1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


# ---- request body --------------------------------------------------------
class PredictIn(BaseModel):
    marks: Dict[str, float]          # {"UML501": 95, "UCS310": 88, ...}
    top_n: Optional[int] = 5


def build_reason(drivers):
    """Plain-English reason why an elective is a strong fit (ported from app.py)."""
    if not drivers:
        return ""
    good = [d for d in drivers if d["grade_class"] <= 4][:2]   # B or better
    if len(good) >= 2:
        return (f"Strong fit — you did well in {good[0]['name']} and "
                f"{good[1]['name']}, which this elective relies on most.")
    if len(good) == 1:
        return (f"Good fit — your strength in {good[0]['name']} "
                f"aligns with this elective.")
    names = " and ".join(d["name"] for d in drivers[:2])
    return f"This elective leans most on {names}."


@app.get("/health")
def health():
    return {"ok": BUNDLE is not None}


@app.get("/meta")
def meta():
    if BUNDLE is None:
        return {"ready": False}
    n_elec = len(BUNDLE["target_subjects"])
    avg_acc = round(sum(BUNDLE["accuracies"].values()) / n_elec * 100)
    # per-subject accuracy table (for an admin/models page later)
    perf = sorted(
        ({"subject": s, "accuracy": round(a * 100, 1)}
         for s, a in BUNDLE["accuracies"].items()),
        key=lambda x: -x["accuracy"],
    )
    # dataset size (for the admin dashboard)
    ds_rows = ds_cols = 0
    try:
        import pandas as pd
        _df = pd.read_csv(DATA_PATH, na_values=["NA"])
        ds_rows, ds_cols = len(_df), len(_df.columns)
    except Exception:
        pass

    # per-subject accuracy with the friendly elective name (for admin table)
    from thapar_map import TARGET_INFO
    perf_named = [{**p, "name": TARGET_INFO.get(p["subject"], {}).get("name", p["subject"])}
                  for p in perf]

    return {
        "ready": True,
        "n_subjects": len(BUNDLE["feature_columns"]),
        "n_electives": n_elec,
        "avg_accuracy": avg_acc,
        "feature_columns": BUNDLE["feature_columns"],
        "perf": perf_named,
        "dataset_rows": ds_rows,
        "dataset_cols": ds_cols,
    }


@app.post("/predict")
def predict(body: PredictIn):
    if BUNDLE is None:
        return {"error": "Model not trained. Run train in the ml-service."}

    marks = {k: v for k, v in body.marks.items() if v and v > 0}
    result = recommend_for_student(marks, BUNDLE, top_n=body.top_n or 5)

    # add the "why" (driver subjects) to each recommended elective
    for p in result["recommended"]:
        drivers = explain_prediction(marks, BUNDLE, p["subject"], top_n=5)
        for d in drivers:
            d["name"] = FEATURE_NAME.get(d["feature"], d["feature"])
        p["drivers"] = drivers
        p["reason"] = build_reason(drivers)

    # friendly names + fields + icons, and the best-fit field aggregation
    enrich_predictions(result)
    result["fields"] = recommended_fields(result, top_k=3)
    return result


@app.post("/train")
def train(file: Optional[UploadFile] = File(None)):
    """Retrain the 14 models. Optional uploaded CSV (validated) else the bundled dataset."""
    global BUNDLE
    data_path = DATA_PATH
    msg = ""
    if file is not None and file.filename:
        if not file.filename.lower().endswith(".csv"):
            return {"ok": False, "error": "Please upload a .csv file."}
        tmp = os.path.join(tempfile.gettempdir(), "edupath_admin_upload.csv")
        with open(tmp, "wb") as f:
            shutil.copyfileobj(file.file, f)
        if BUNDLE is not None:
            expected = set(BUNDLE["feature_columns"]) | set(BUNDLE["target_subjects"])
            ok, vmsg = validate_dataset(tmp, expected)
            if not ok:
                return {"ok": False, "error": f"Dataset rejected: {vmsg}"}
            msg = f"Dataset check passed — {vmsg}. "
        data_path = tmp

    try:
        accuracies = train_and_save(data_path, MODELS_DIR)
        BUNDLE = load_bundle(MODELS_DIR)
        avg = round(sum(accuracies.values()) / len(accuracies) * 100, 1)
        return {"ok": True, "avg_accuracy": avg, "n_electives": len(accuracies),
                "dataset": os.path.basename(data_path), "message": msg}
    except Exception as e:
        return {"ok": False, "error": f"Retrain failed: {e}"}
