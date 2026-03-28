# ChestGuard — Chest X-ray Triage Co-Pilot

An AI-powered chest X-ray abnormality screening system that helps health professionals prioritize critical cases. Built for [RevolutionUC](https://revolutionuc.com/) hackathon by a team of 4.

## What It Does

Upload a chest X-ray and get:
- **Multi-abnormality detection** across 14 conditions with confidence scores
- **Tier-based triage ranking** so the most critical patients get seen first
- **Grad-CAM heatmap overlays** showing exactly where on the X-ray the AI is flagging
- **Side-by-side comparison** for tracking patient progression
- **AI explanations** with clinical recommendations for each finding

**Not a replacement for radiologists — a co-pilot.** The doctor still makes the call. We make sure they look at the right image, at the right time.

## Detectable Conditions

### v1 Model (Active) — CheXpert Competition 5

Model output: `[Atelectasis, Cardiomegaly, Consolidation, Edema, Pleural Effusion]` as multi-label binary `[0,1,0,0,1]`.

| Condition | Tier | Urgency |
|-----------|------|---------|
| Edema | 2 | Urgent (hours) |
| Consolidation | 2 | Urgent (hours) |
| Pleural Effusion | 3 | Semi-urgent |
| Cardiomegaly | 3 | Semi-urgent |
| Atelectasis | 4 | Moderate |

### Future (9 additional — scaling target)

Pneumothorax, Infiltration, Pneumonia, Emphysema, Fibrosis, Pleural Thickening, Nodule, Mass, Hernia

See [Model_Hospital_Ranking.md](Model_Hospital_Ranking.md) for the full 5-tier system with clinical sources.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| ML Model | DenseNet-121 (fine-tuned, PyTorch) | Gold standard for chest X-ray classification |
| Explainability | Grad-CAM | Visual heatmaps showing model attention regions |
| Dataset | NIH Chest X-rays (112K images, 30K patients) | Public domain, well-labeled |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Modern dashboard with real-time interactivity |
| Backend API | FastAPI | Fast async inference serving |
| Animations | Framer Motion | Smooth UI transitions |
| Charts | Recharts + Canvas | Data visualization |

## Dashboard

The dashboard (`/dashboard`) provides four views:

1. **Patient Overview** — X-ray viewer with Grad-CAM heatmap overlay, floating annotation cards connected by bezier curves to flagged regions, tier-based severity scoring, and clinical notes
2. **Triage Queue** — All patients ranked by severity tier, filterable, color-coded
3. **Compare** — Side-by-side X-ray comparison (two patients or same patient over time)
4. **Upload** — Drag-and-drop X-ray upload with instant AI analysis

## Dataset

**NIH Chest X-ray Dataset** — CC0 Public Domain
- 112,120 frontal-view X-ray images (1024x1024)
- 30,805 unique patients
- NLP-extracted labels (~90% accuracy)
- Source: https://www.kaggle.com/datasets/nih-chest-xrays/data

> **Note:** The tier ranking in [Model_Hospital_Ranking.md](Model_Hospital_Ranking.md) uses the CheXpert label set. The team needs to finalize which label set to use — see [PROPOSAL.md](PROPOSAL.md) for details on the alignment.

## Getting Started

### Dashboard (Frontend)

```bash
cd dashboard
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). Currently runs with mock patient data.

### Model Training

*(Coming soon — pending team coordination)*

## Project Structure

```
├── dashboard/                  # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js app router pages
│   │   ├── components/         # UI components
│   │   └── data/               # Mock data & types
│   └── public/                 # Static assets
├── Model_Hospital_Ranking.md   # Tier-based severity ranking (with clinical sources)
├── PROPOSAL.md                 # Team proposal & pitch narrative
└── README.md                   # This file
```

## Team

| Role | Focus |
|------|-------|
| Mustapha | Architecture, data pipeline, pitch, integration |
| EMS Teammate | Clinical validation, tier ranking, label review, pitch credibility |
| ML Teammate | Model training (DenseNet-121), Grad-CAM, evaluation |
| Frontend Teammate | Dashboard UI/UX |

## Why This Matters

- Radiologist burnout affects 44-65% of the specialty
- Workload grew 80% from 2009-2020 with no matching increase in positions
- Rural hospitals average 130 days to fill a radiology position
- AI triage reduced turnaround time by 77% in clinical studies
- Missed-case rates dropped from 44.8% to 2.6% with AI prioritization

## License

Dataset: CC0 Public Domain (NIH)
