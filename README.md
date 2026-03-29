# Pneumanosis — Chest X-ray Triage Co-Pilot

An AI-powered chest X-ray abnormality screening system that helps health professionals prioritize critical cases. Built for [RevolutionUC](https://revolutionuc.com/) hackathon by a team of 4.

### THIS PROJECT IS FOR EDUCATIONAL PURPOSES ONLY. THIS PROJECT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, MANAGE, OR PREVENT ANY DISEASE. CONSULT A TRUSTED MEDICAL PROFESSIONAL IF YOU HAVE QUESTIONS REGARDING YOUR HEALTH.

## What It Does

Upload a chest X-ray and get:
- **Multi-abnormality detection** across 5 conditions with confidence scores
- **Tier-based triage ranking** (STAT / PRIORITY / ROUTINE) so the most critical patients get seen first
- **Real-time model inference** — MobileNetV3-Small trained on CheXpert (0.87 AUC, 15 epochs)
- **Side-by-side comparison** for tracking patient progression
- **Patient management** — save, search, flag, delete, and export patient records

**Not a replacement for radiologists — a co-pilot.** The doctor still makes the call. We make sure they look at the right image, at the right time.

## Detectable Conditions

### v1 Model — MobileNetV3-Small (0.87 AUC)

Trained on CheXpert dataset, 15 epochs with augmented data. Input: 224x224 chest X-ray → 5 sigmoid outputs.

| Condition | Tier | Priority Label |
|-----------|------|----------------|
| Edema | 2 | STAT |
| Consolidation | 2 | STAT |
| Pleural Effusion | 3 | PRIORITY |
| Cardiomegaly | 3 | PRIORITY |
| Atelectasis | 4 | ROUTINE |

Detection threshold: 50% confidence. Tier ranking based on clinical severity from [Model_Hospital_Ranking.md](Model_Hospital_Ranking.md) with peer-reviewed sources.

## Dashboard

Four views:

1. **Triage Queue** (landing page) — patients ranked by clinical tier, stats cards, priority donut chart, search, filter, export CSV, pagination
2. **Patient Detail** — 3-panel layout (patient list | X-ray + findings tabs | patient info), confirm/dismiss/flag findings
3. **Upload** — drag-and-drop X-ray, real-time model inference, patient info form, save to API
4. **Compare** — side-by-side patient comparison with delta indicators

### Key Features
- **API Live/Mock indicator** in navbar — shows connection status
- **Real model inference** with timing (e.g., "Real model inference 125ms")
- **STAT/PRIORITY/ROUTINE** tier badges — standard radiology PACS terminology
- **Tier-first clinical sorting** — all STAT above PRIORITY above ROUTINE
- **Patient CRUD** — create, view, update, delete via API
- **Finding actions** — confirm, dismiss, flag for second opinion
- **Export** — download triage queue as CSV

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| ML Model | MobileNetV3-Small (fine-tuned, PyTorch) | Lightweight, fast inference on CPU |
| Training Data | CheXpert (224K chest radiographs) | Stanford's benchmark with uncertainty labels |
| Backend API | FastAPI (Python) | Async inference, auto-generated docs at /docs |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Modern responsive dashboard |
| Charts | Recharts | Priority distribution donut chart |
| Animations | Framer Motion | Smooth transitions |
| State | React hooks + API client | usePatients hook manages API + local data |

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Trained model file (`models/best_model.pth`)

### Run the backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r api/requirements.txt
uvicorn api.main:app --reload --port 8000
```

You should see:
```
[Pneumanosis] Model loaded from .../models/best_model.pth
```

If you see "Using mock predictions" instead, the model file is missing from `models/`.

### Run the frontend (separate terminal)

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000

### Verify it works

1. Check navbar shows **"API Live"** (green dot)
2. Go to **Upload** → drop a chest X-ray image
3. Results show **"Real model inference"** with timing
4. Click **"View in Queue"** → patient appears in triage

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API status, model loaded, mock vs real |
| `GET` | `/conditions` | List 5 conditions with tier info |
| `POST` | `/predict` | Upload X-ray image → predictions |
| `GET` | `/patients` | List all patients |
| `POST` | `/patients` | Create patient with findings |
| `GET` | `/patients/{id}` | Get patient by ID |
| `PUT` | `/patients/{id}` | Update patient |
| `DELETE` | `/patients/{id}` | Delete patient |
| `POST` | `/findings/{patient_id}/{pathology}/action` | Confirm/dismiss/flag finding |

Interactive API docs: http://localhost:8000/docs

### Prediction Response

```json
{
  "findings": [
    {"pathology": "Cardiomegaly", "confidence": 0.83, "tier": 3, "tier_label": "priority", "detected": true},
    {"pathology": "Pleural Effusion", "confidence": 0.81, "tier": 3, "tier_label": "priority", "detected": true},
    {"pathology": "Edema", "confidence": 0.16, "tier": 2, "tier_label": "stat", "detected": false}
  ],
  "highest_tier": 3,
  "severity_score": 0.45,
  "model_version": "0.1.0",
  "using_mock": false
}
```

## Project Structure

```
├── api/                        # FastAPI backend
│   ├── main.py                 # API endpoints (predict, patients, findings)
│   ├── inference.py            # Model loading + inference (auto-detects .pth)
│   └── requirements.txt        # Python dependencies
├── dashboard/                  # Next.js frontend
│   ├── src/
│   │   ├── app/                # Pages (page.tsx, layout.tsx)
│   │   ├── components/         # UI components (TriageView, PatientDetailView, etc.)
│   │   ├── data/               # Type definitions
│   │   └── lib/                # API client, usePatients hook, constants
│   └── public/sample-xrays/    # Sample X-ray images for testing
├── src/                        # ML training code
│   ├── model.py                # MobileNetV3-Small + augmentation
│   ├── train.py                # Training loop
│   ├── evaluate.py             # Evaluation (AUC metric)
│   └── dataset.py              # CheXpert data loading
├── tools/
│   └── batch_inference.py      # CLI batch inference with TorchXRayVision
├── data/synthetic/             # Synthetic test images + labels
├── models/                     # Trained .pth files (gitignored)
├── config.py                   # Training config
├── main.py                     # Training entrypoint (saves best_model.pth)
├── Model_Hospital_Ranking.md   # Clinical tier system with sources
├── PROPOSAL.md                 # Team proposal & pitch
├── DASHBOARD_DESIGN.md         # UI decision tree
└── docker-compose.yml          # Docker setup
```

## Model Performance

| Metric | Value |
|--------|-------|
| Architecture | MobileNetV3-Small |
| Training Data | CheXpert (224K images) |
| Epochs | 15 |
| AUC | 0.87 |
| Augmentation | RandomRotation, ColorJitter |
| Detection Threshold | 50% confidence |
| Inference Time | ~100-125ms on CPU |

## Team

| Member | Role |
|--------|------|
| Mustapha | Architecture, API integration, dashboard, pitch |
| DOS889X | Backend infrastructure, Docker, dev containers |
| plot | ML model training, dataset pipeline, evaluation |
| Nate | TorchXRayVision research, batch inference tool |

## Why This Matters

- Radiologist burnout affects 44-65% of the specialty
- Workload grew 80% from 2009-2020 with no matching increase in positions
- Rural hospitals average 130 days to fill a radiology position
- AI triage reduced turnaround time by 77% in clinical studies
- Missed-case rates dropped from 44.8% to 2.6% with AI prioritization

## License

Apache 2.0 — See [LICENSE](LICENSE)

Dataset: CC0 Public Domain (NIH/CheXpert)
