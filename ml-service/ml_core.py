"""
ml_core.py
----------
The brain of the portal: grade encoding + one XGBoost model per elective,
packaged so it can be:

  1. trained ONCE and saved to disk          -> train_and_save()
  2. loaded instantly by the web app          -> load_bundle()
  3. used to predict + recommend electives     -> recommend_for_student()

It is a plain, self-contained module (scikit-learn + XGBoost) — fast to train
and runs anywhere.
"""

import os
import logging
import numpy as np
import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

# ----------------------------------------------------------------------------
# Constants shared with the original pipeline
# ----------------------------------------------------------------------------

# The 14 advanced electives we want to recommend.
# Thapar B.E.(CSE) elective codes (dataset is relabeled via thapar_map.py).
TARGET_SUBJECTS = [
    'UCS548', 'UCS761', 'UCS534', 'UCS673', 'UCS531', 'UCS635', 'UCS664',
    'UCS748', 'UCS646', 'UCS532', 'UCS542', 'UCS537', 'UCS754', 'UCS645',
]

DROP_COLUMNS = ['Year of enrolment', 'ID']

# Grade class (0 = best) -> human readable letter, exactly matching encode_grade()
GRADE_LETTERS = {
    0: 'A+', 1: 'A', 2: 'A-', 3: 'B+', 4: 'B', 5: 'B-',
    6: 'C+', 7: 'C', 8: 'C-', 9: 'D+', 10: 'D', 11: 'E',
}

# Rough 4.0-scale GPA value for each grade, used for a friendly "suitability" score
GRADE_POINTS = {
    0: 4.0, 1: 4.0, 2: 3.7, 3: 3.3, 4: 3.0, 5: 2.7,
    6: 2.3, 7: 2.0, 8: 1.7, 9: 1.3, 10: 1.0, 11: 0.0,
}


def encode_grade(marks):
    """Turn a raw mark (0-100) into a grade class (0 = best, 11 = fail)."""
    marks = int(marks)
    if marks > 85:
        return 0    # A+
    elif 80 <= marks <= 85:
        return 1    # A
    elif 75 <= marks < 80:
        return 2    # A-
    elif 70 <= marks < 75:
        return 3    # B+
    elif 65 <= marks < 70:
        return 4    # B
    elif 60 <= marks < 65:
        return 5    # B-
    elif 55 <= marks < 60:
        return 6    # C+
    elif 50 <= marks < 55:
        return 7    # C
    elif 45 <= marks < 50:
        return 8    # C-
    elif 40 <= marks < 45:
        return 9    # D+
    elif 35 <= marks < 40:
        return 10   # D
    else:
        return 11   # E


def merge_small_classes(target_column, threshold=4):
    """Merge rare grade classes into a larger one so training is stable."""
    value_counts = target_column.value_counts()
    small_classes = value_counts[value_counts < threshold].index
    for small_class in small_classes:
        larger_classes = value_counts[value_counts >= threshold].index
        if len(larger_classes) > 0:
            target_column[target_column == small_class] = larger_classes[0]
    return target_column


# ----------------------------------------------------------------------------
# TRAINING  (run once -> produces models/bundle.joblib)
# ----------------------------------------------------------------------------

def train_and_save(data_path: str, models_dir: str) -> dict:
    """Read a CSV then train + save the model bundle (used by portal & admin)."""
    logging.info("Loading data from %s", data_path)
    df = pd.read_csv(data_path, na_values=['NA'])
    return train_bundle_from_dataframe(df, models_dir)


def train_bundle_from_dataframe(df, models_dir: str) -> dict:
    """
    Train one XGBoost model per elective from an in-memory DataFrame and save
    the bundle to disk. Returns accuracy per subject.
    """
    os.makedirs(models_dir, exist_ok=True)

    # Drop the non-mark columns
    df = df.drop(DROP_COLUMNS, axis=1)

    feature_columns = [c for c in df.columns if c not in TARGET_SUBJECTS]
    features = df[feature_columns].copy()
    targets = df[TARGET_SUBJECTS].copy()

    # --- Features: convert to numeric, remember the median, fill gaps, encode ---
    feature_medians = {}
    for col in feature_columns:
        features[col] = pd.to_numeric(features[col], errors='coerce')
        median = float(features[col].median())
        feature_medians[col] = median
        features[col] = features[col].fillna(median)

    features_encoded = features.map(encode_grade)

    # --- Targets: fill gaps, encode, merge rare classes ---
    for col in TARGET_SUBJECTS:
        targets[col] = pd.to_numeric(targets[col], errors='coerce')
        targets[col] = targets[col].fillna(targets[col].median())
    targets_encoded = targets.map(encode_grade)
    for col in TARGET_SUBJECTS:
        targets_encoded[col] = merge_small_classes(targets_encoded[col])

    models = {}
    label_encoders = {}
    accuracies = {}

    for col in TARGET_SUBJECTS:
        logging.info("Training model for %s", col)
        y = targets_encoded[col]

        # Balance the classes with SMOTE
        smote = SMOTE(k_neighbors=3)
        X_res, y_res = smote.fit_resample(features_encoded, y)

        X_train, X_test, y_train, y_test = train_test_split(
            X_res, y_res, test_size=0.2, random_state=42)

        le = LabelEncoder()
        y_train_enc = le.fit_transform(y_train)
        y_test_enc = le.transform(y_test)

        # Accuracy for display (held-out test set)
        eval_model = XGBClassifier(eval_metric='mlogloss')
        eval_model.fit(X_train, y_train_enc)
        acc = accuracy_score(y_test_enc, eval_model.predict(X_test))
        accuracies[col] = round(float(acc), 4)

        # Final deployed model: refit on ALL balanced data for best predictions
        final_model = XGBClassifier(eval_metric='mlogloss')
        final_le = LabelEncoder()
        y_all_enc = final_le.fit_transform(y_res)
        final_model.fit(X_res, y_all_enc)

        models[col] = final_model
        label_encoders[col] = final_le

    bundle = {
        'feature_columns': feature_columns,
        'feature_medians': feature_medians,
        'target_subjects': TARGET_SUBJECTS,
        'models': models,
        'label_encoders': label_encoders,
        'accuracies': accuracies,
    }
    joblib.dump(bundle, os.path.join(models_dir, 'bundle.joblib'))
    logging.info("Saved bundle to %s", models_dir)
    return accuracies


# ----------------------------------------------------------------------------
# PREDICTION  (used live by the web app)
# ----------------------------------------------------------------------------

def load_bundle(models_dir: str):
    """Load the trained bundle produced by train_and_save()."""
    path = os.path.join(models_dir, 'bundle.joblib')
    if not os.path.exists(path):
        return None
    return joblib.load(path)


def _encode_student_row(marks: dict, bundle) -> pd.DataFrame:
    """Build a single-row encoded DataFrame for one student from their raw marks."""
    row = {}
    for col in bundle['feature_columns']:
        val = marks.get(col, None)
        if val is None or val == '' or (isinstance(val, float) and np.isnan(val)):
            val = bundle['feature_medians'][col]        # fill gaps with training median
        try:
            val = float(val)
        except (TypeError, ValueError):
            val = bundle['feature_medians'][col]
        row[col] = encode_grade(val)
    return pd.DataFrame([row], columns=bundle['feature_columns'])


def explain_prediction(marks: dict, bundle, code: str, top_n: int = 5) -> list:
    """
    Explain WHY the model predicted a grade for one elective:
    the past subjects it weighed most (feature importances) and how the
    student did in each of them.
    """
    model = bundle['models'][code]
    feats = bundle['feature_columns']
    importances = model.feature_importances_
    X = _encode_student_row(marks, bundle)       # one encoded row
    order = np.argsort(importances)[::-1][:top_n]
    drivers = []
    total = float(importances.sum()) or 1.0
    for i in order:
        f = feats[i]
        gcode = int(X.iloc[0][f])
        drivers.append({
            'feature': f,
            'importance': round(float(importances[i]) / total * 100, 1),
            'grade_class': gcode,
            'letter': GRADE_LETTERS.get(gcode, '?'),
        })
    return drivers


def recommend_for_student(marks: dict, bundle, top_n: int = 5) -> dict:
    """
    Predict the likely grade in every elective and rank them.
    Returns a dict ready to show in the UI and save to history.
    """
    X = _encode_student_row(marks, bundle)
    predictions = []

    for col in bundle['target_subjects']:
        model = bundle['models'][col]
        le = bundle['label_encoders'][col]

        pred_label = int(model.predict(X)[0])
        grade_class = int(le.inverse_transform([pred_label])[0])

        # Confidence = model's probability for the predicted class
        try:
            proba = model.predict_proba(X)[0]
            confidence = round(float(np.max(proba)) * 100, 1)
        except Exception:
            confidence = None

        # Fit score blends TWO things so electives don't all tie on the same
        # number: (a) how good the predicted grade is, and (b) how CONFIDENT
        # the model is in that prediction. Grade is weighted more (0.75) so a
        # better predicted grade still leads, but confidence (0.25) separates
        # electives that share the same grade band.
        grade_score = (11 - grade_class) / 11 * 100
        conf = confidence if confidence is not None else 70.0
        fit = round(0.75 * grade_score + 0.25 * conf)

        predictions.append({
            'subject': col,
            'grade_class': grade_class,
            'letter': GRADE_LETTERS.get(grade_class, '?'),
            'gpa': GRADE_POINTS.get(grade_class, 0.0),
            'score': fit,                       # 0..100, distinct per elective
            'confidence': confidence,
            'accuracy': round(bundle['accuracies'].get(col, 0) * 100),
        })

    # Highest blended fit first (ties fall back to the better predicted grade)
    ranked = sorted(predictions, key=lambda p: (-p['score'], p['grade_class']))
    recommended = ranked[:top_n]

    return {
        'recommended': recommended,     # top electives to take
        'all_predictions': ranked,      # every elective, ranked
    }
