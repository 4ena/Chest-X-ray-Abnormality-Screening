"""
ChestGuard API — FastAPI backend for chest X-ray inference.

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
    title="ChestGuard API",
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
    {"name": "Atelectasis",       "tier": 4, "tier_label": "moderate",     "weight": 4},
    {"name": "Cardiomegaly",      "tier": 3, "tier_label": "semi-urgent",  "weight": 6},
    {"name": "Consolidation",     "tier": 2, "tier_label": "urgent",       "weight": 8},
    {"name": "Edema",             "tier": 2, "tier_label": "urgent",       "weight": 8},
    {"name": "Pleural Effusion",  "tier": 3, "tier_label": "semi-urgent",  "weight": 6},
]

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

    # Run inference (mock or real model)
    result = predict_image(image_bytes)

    # Build response with tier info
    findings = []
    for i, cond in enumerate(CONDITIONS):
        conf = result["confidences"][i]
        findings.append(ConditionResult(
            pathology=cond["name"],
            confidence=round(conf, 4),
            tier=cond["tier"],
            tier_label=cond["tier_label"],
            detected=conf >= 0.3,
        ))

    # Sort by confidence descending
    findings.sort(key=lambda f: f.confidence, reverse=True)

    # Calculate severity score
    total_weighted = sum(f.confidence * c["weight"] for f, c in zip(findings, CONDITIONS))
    total_weight = sum(c["weight"] for c in CONDITIONS)
    severity_score = round(total_weighted / total_weight, 4) if total_weight > 0 else 0

    # Highest tier among detected findings
    detected_tiers = [f.tier for f in findings if f.detected]
    highest_tier = min(detected_tiers) if detected_tiers else 5

    return PredictionResponse(
        findings=findings,
        highest_tier=highest_tier,
        severity_score=severity_score,
        model_version=result["model_version"],
        using_mock=result["using_mock"],
    )
