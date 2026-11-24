"""
thapar_map.py
-------------
Mapping that re-labels the ORIGINAL dataset (Grade_CS_Students.csv, 335 real
students) into Thapar B.E.(CSE) 2025 course codes.

IMPORTANT / DISCLOSURE:
  The grades are REAL student grade-correlation patterns from the original
  open dataset. We only RENAME the columns to Thapar course codes so the whole
  portal speaks one consistent language. This is a relabeled stand-in dataset
  for demonstration — it is NOT real Thapar student data.

  FEATURE_MAP : ~22 Thapar Sem I–IV core courses  <- source Peradeniya columns
  TARGET_MAP  : 14 Thapar electives (grouped by Elective-Focus field) <- source
"""

# Thapar CORE courses used as model INPUTS (what a student has already studied).
# (thapar_code, friendly_name, semester_label, source_column_in_original_csv)
FEATURE_MAP = [
    ("UES103", "Programming for Problem Solving", "Semester 1", "CS101"),
    ("UMA022", "Calculus for Engineers",          "Semester 1", "MA101"),
    ("UCB009", "Chemistry",                        "Semester 1", "PH102"),
    ("UES013", "Electrical & Electronics Engg.",   "Semester 1", "PH103"),
    ("UPH013", "Physics",                          "Semester 2", "PH101"),
    ("UES101", "Engineering Drawing",              "Semester 2", "PH104"),
    ("UHU003", "Professional Communication",       "Semester 2", "GS102"),
    ("UES102", "Manufacturing Processes",          "Semester 2", "OR201"),
    ("UMA023", "Differential Eqns & Linear Algebra","Semester 2", "MA112"),
    ("UCS301", "Data Structures",                  "Semester 3", "CS201"),
    ("UTA018", "Object Oriented Programming",      "Semester 3", "CS202"),
    ("UCS303", "Operating System",                 "Semester 3", "CS301"),
    ("UCS405", "Discrete Mathematical Structures", "Semester 3", "MA201"),
    ("UMA021", "Numerical Linear Algebra",         "Semester 3", "MA121"),
    ("UCS310", "Database Management Systems",       "Semester 4", "CS302"),
    ("UCS414", "Computer Networks",                "Semester 4", "CS303"),
    ("UCS415", "Design & Analysis of Algorithms",  "Semester 4", "CS304"),
    ("UMA401", "Probability & Statistics",         "Semester 4", "ST111"),
    ("UCS321", "AI for Engineers",                 "Semester 4", "CS305"),
    ("UML501", "Machine Learning",                 "Semester 5", "CS306"),
    ("UCS503", "Software Engineering",             "Semester 5", "CS307"),
    ("UCS510", "Computer Architecture & Org.",     "Semester 5", "CS308"),
]

# Thapar ELECTIVES the model PREDICTS, grouped by Elective-Focus field.
# (thapar_code, friendly_name, field, source_target_column)
TARGET_MAP = [
    ("UCS548", "Foundation of Data Science",            "Data Science",                     "CS501"),
    ("UCS761", "Deep Learning",                         "Data Science",                     "CS502"),
    ("UCS534", "Computer & Network Security",           "Information & Cyber Security",      "CS503"),
    ("UCS673", "Ethical Hacking-1",                     "Cyber Forensics & Ethical Hacking", "CS504"),
    ("UCS531", "Cloud Computing",                       "High Performance Computing",       "CS505"),
    ("UCS635", "GPU Computing",                         "High Performance Computing",       "CS506"),
    ("UCS664", "Conversational AI: NLP",                "Conversational AI",                "CS507"),
    ("UCS748", "Generative AI",                         "Conversational AI",                "CS508"),
    ("UCS646", "Game Design & Development",             "Computer Animation & Gaming",      "CS509"),
    ("UCS532", "Computer Vision",                       "Computer Animation & Gaming",      "CS510"),
    ("UCS542", "UI & UX Specialist",                    "Full Stack",                       "CS512"),
    ("UCS537", "Source Code Management",                "DevOps & Continuous Delivery",     "CS597"),
    ("UCS754", "Blockchain Technology & Applications",  "Information & Cyber Security",      "CS598"),
    ("UCS645", "Parallel & Distributed Computing",      "High Performance Computing",       "MM507"),
]

# Emoji per field (for the UI)
FIELD_ICON = {
    "Data Science": "📊",
    "Information & Cyber Security": "🔐",
    "Cyber Forensics & Ethical Hacking": "🕵️",
    "High Performance Computing": "⚡",
    "Conversational AI": "🗣️",
    "Computer Animation & Gaming": "🎮",
    "Full Stack": "🖥️",
    "DevOps & Continuous Delivery": "🔁",
}

# --- Derived lookups used by the app ---------------------------------------
# code -> {"name":..., "field":..., "icon":...}
TARGET_INFO = {
    code: {"name": name, "field": field, "icon": FIELD_ICON.get(field, "🎯")}
    for code, name, field, _src in TARGET_MAP
}

# code -> friendly name (features)
FEATURE_NAME = {code: name for code, name, _sem, _src in FEATURE_MAP}


def feature_groups():
    """Group feature courses by semester for a tidy results form."""
    groups = {}
    for code, name, sem, _src in FEATURE_MAP:
        groups.setdefault(sem, []).append({"code": code, "name": name})
    return groups


def enrich_predictions(payload):
    """Add friendly name + field + icon to each prediction in a saved payload."""
    for key in ("recommended", "all_predictions"):
        for p in payload.get(key, []):
            info = TARGET_INFO.get(p["subject"], {})
            p["name"] = info.get("name", p["subject"])
            p["field"] = info.get("field", "")
            p["field_icon"] = info.get("icon", "🎯")
    return payload


def recommended_fields(payload, top_k=3):
    """Aggregate the recommended electives into best-fit FIELDS."""
    scores = {}
    for p in payload.get("all_predictions", []):
        info = TARGET_INFO.get(p["subject"], {})
        field = info.get("field")
        if not field:
            continue
        scores.setdefault(field, {"field": field, "icon": info.get("icon", "🎯"),
                                  "score_sum": 0, "n": 0, "best": None, "electives": []})
        s = scores[field]
        s["score_sum"] += p["score"]
        s["n"] += 1
        s["electives"].append({
            "subject": p["subject"],
            "name": p.get("name", info.get("name", p["subject"])),
            "score": p["score"],
        })
        if s["best"] is None or p["score"] > s["best"]["score"]:
            s["best"] = p
    ranked = []
    for s in scores.values():
        s["avg"] = round(s["score_sum"] / s["n"])
        s["electives"].sort(key=lambda e: -e["score"])
        ranked.append(s)
    ranked.sort(key=lambda x: -x["avg"])
    return ranked[:top_k]
