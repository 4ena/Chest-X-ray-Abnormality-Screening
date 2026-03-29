"""
Pneumanosis API — FastAPI backend for chest X-ray inference.

Serves the trained MobileNetV3-Small model for multi-label classification
of 5 chest X-ray conditions.

Usage:
  uvicorn api.main:app --reload --port 8000

Endpoints:
  POST /predict     — Upload X-ray image, get predictions
  GET  /health      — Health check
  GET  /conditions  — List supported conditions + tier info
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.inference import predict_image, get_model_status

app = FastAPI(
    title="Pneumanosis API",
    description="Chest X-ray triage co-pilot — multi-label abnormality detection",
    version="0.1.0",
)

# Allow dashboard (Next.js dev server) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Response models ──

class ConditionResult(BaseModel):
    pathology: str
    confidence: float
    tier: int
    tier_label: str
    detected: bool

class PredictionResponse(BaseModel):
    patient_id: str | None = None
    findings: list[ConditionResult]
    highest_tier: int
    severity_score: float
    model_version: str
    using_mock: bool

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    using_mock: bool

class ConditionInfo(BaseModel):
    name: str
    tier: int
    tier_label: str
    weight: int

# ── Condition + tier mapping (matches dashboard mock.ts) ──

CONDITIONS = [
    {"name": "Atelectasis",       "tier": 4, "tier_label": "routine",   "weight": 4},
    {"name": "Cardiomegaly",      "tier": 3, "tier_label": "priority",  "weight": 6},
    {"name": "Consolidation",     "tier": 2, "tier_label": "stat",      "weight": 8},
    {"name": "Edema",             "tier": 2, "tier_label": "stat",      "weight": 8},
    {"name": "Pleural Effusion",  "tier": 3, "tier_label": "priority",  "weight": 6},
]

# ── In-memory store (replace with DB in production) ──

_patients: dict[str, dict] = {}
_finding_actions: dict[str, dict] = {}  # key: "patientId:pathology"

class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    reason_for_exam: str = ""
    findings: list[ConditionResult] = []
    severity_score: float = 0
    highest_tier: int = 4

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    sex: str
    reason_for_exam: str
    findings: list[ConditionResult]
    severity_score: float
    highest_tier: int
    created_at: str

class FindingAction(BaseModel):
    action: str  # "confirm" | "dismiss" | "flag" | "unflag"

class FindingActionResponse(BaseModel):
    patient_id: str
    pathology: str
    status: str
    flagged: bool

# ── Endpoints ──

@app.get("/health", response_model=HealthResponse)
def health_check():
    status = get_model_status()
    return HealthResponse(
        status="ok",
        model_loaded=status["loaded"],
        model_version=status["version"],
        using_mock=status["using_mock"],
    )

@app.get("/conditions", response_model=list[ConditionInfo])
def list_conditions():
    return [ConditionInfo(**c) for c in CONDITIONS]

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG)")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    result = predict_image(image_bytes)

    findings_data = []
    for i, cond in enumerate(CONDITIONS):
        conf = result["confidences"][i]
        findings_data.append({
            "pathology": cond["name"],
            "confidence": round(conf, 4),
            "tier": cond["tier"],
            "tier_label": cond["tier_label"],
            "weight": cond["weight"],
            "detected": conf >= 0.5,  # Threshold for detection
        })

    total_weighted = sum(f["confidence"] * f["weight"] for f in findings_data)
    total_weight = sum(f["weight"] for f in findings_data)
    severity_score = round(total_weighted / total_weight, 4) if total_weight > 0 else 0.0

    findings_data.sort(key=lambda f: f["confidence"], reverse=True)

    response_findings = [
        ConditionResult(
            pathology=f["pathology"],
            confidence=f["confidence"],
            tier=f["tier"],
            tier_label=f["tier_label"],
            detected=f["detected"],
        )
        for f in findings_data
    ]

    detected_tiers = [f["tier"] for f in findings_data if f["detected"]]
    highest_tier = min(detected_tiers) if detected_tiers else 5

    return PredictionResponse(
        findings=response_findings,
        highest_tier=highest_tier,
        severity_score=severity_score,
        model_version=result["model_version"],
        using_mock=result["using_mock"],
    )
# ── Patient endpoints ──

@app.get("/patients")
def list_patients():
    return list(_patients.values())

@app.post("/patients", response_model=PatientResponse)
def create_patient(patient: PatientCreate):
    from datetime import datetime
    pid = f"P{len(_patients) + 1:05d}"
    record = {
        "id": pid,
        **patient.model_dump(),
        "created_at": datetime.now().isoformat(),
    }
    _patients[pid] = record
    return PatientResponse(**record)

@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    if patient_id not in _patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patients[patient_id]

@app.put("/patients/{patient_id}")
def update_patient(patient_id: str, patient: PatientCreate):
    if patient_id not in _patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    _patients[patient_id].update(patient.model_dump())
    return _patients[patient_id]

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):
    if patient_id not in _patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    del _patients[patient_id]
    return {"deleted": patient_id}

# ── Finding action endpoints ──

@app.post("/findings/{patient_id}/{pathology}/action", response_model=FindingActionResponse)
def update_finding_action(patient_id: str, pathology: str, action: FindingAction):
    key = f"{patient_id}:{pathology}"
    current = _finding_actions.get(key, {"status": "pending", "flagged": False})

    if action.action == "confirm":
        current["status"] = "confirmed"
    elif action.action == "dismiss":
        current["status"] = "dismissed"
    elif action.action == "flag":
        current["flagged"] = True
    elif action.action == "unflag":
        current["flagged"] = False

    _finding_actions[key] = current
    return FindingActionResponse(
        patient_id=patient_id,
        pathology=pathology,
        status=current["status"],
        flagged=current["flagged"],
    )

@app.get("/findings/{patient_id}/{pathology}/action", response_model=FindingActionResponse)
def get_finding_action(patient_id: str, pathology: str):
    key = f"{patient_id}:{pathology}"
    current = _finding_actions.get(key, {"status": "pending", "flagged": False})
    return FindingActionResponse(
        patient_id=patient_id,
        pathology=pathology,
        status=current["status"],
        flagged=current["flagged"],
    )
