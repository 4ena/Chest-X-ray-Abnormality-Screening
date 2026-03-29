# ChestGuard — Chest X-ray Triage Co-Pilot

## Team Proposal for RevolutionUC

---

## The Problem

- Radiologists read 20,000+ X-rays/year, often under 4 seconds per image at peak load
- Missed findings (pleural effusion, atelectasis, subtle opacities) lead to delayed treatment
- Rural/understaffed hospitals lack full-time radiologists — images queue for hours
- Burnout affects 44-65% of radiologists; workload grew 80% from 2009-2020
- Among the most common errors on chest X-rays are missed airspace opacities, pneumothorax, pleural effusion, and atelectasis

## Our Solution

A **triage co-pilot** that takes chest X-rays and:

1. **Detects multiple abnormalities** with confidence scores
2. **Ranks patients by clinical severity tiers** so the most critical get seen first
3. **Shows Grad-CAM heatmaps** highlighting exactly where the issue is on the X-ray
4. **Provides AI explanations** with clinical recommendations for each finding
5. **Compares X-rays side-by-side** for monitoring patient progression

**Not a replacement. A co-pilot.** The radiologist still makes the call — we make sure they look at the right image, at the right time.

---

## Severity Tier System

Tier ranking developed with EMS teammate's clinical input and backed by peer-reviewed sources. Full documentation and citations in [Model_Hospital_Ranking.md](Model_Hospital_Ranking.md).

### Tier 1 — Immediately Life-Threatening
| Condition | Rationale |
|-----------|-----------|
| Enlarged Cardiomediastinum | May represent aortic dissection or rupture |
| Pneumothorax | Tension pneumothorax: rapid deterioration, high mortality if untreated |

### Tier 2 — Urgent (hours)
| Condition | Rationale |
|-----------|-----------|
| Edema | Treatment window of hours; can cause severe hypoxia, multi-organ failure |
| Consolidation | May represent hemorrhage; can progress rapidly |
| Pneumonia | Risk of sepsis or respiratory failure within hours to days |

### Tier 3 — Semi-Urgent
| Condition | Rationale |
|-----------|-----------|
| Pleural Effusion | High 30-day mortality (15%), but acute decline slower than Tier 2 |
| Cardiomegaly | Indicator of cardiac disease; 1-year mortality ~30% for symptomatic HF |

### Tier 4 — Moderate
| Condition | Rationale |
|-----------|-----------|
| Atelectasis | Ranges from incidental to serious; often clinically insignificant |
| Fracture | Isolated rib fractures rarely acutely fatal (flail chest excluded) |
| Lung Opacity | Nonspecific; requires clinical correlation |
| Pleural Other | Low acute risk |

### Tier 5 — Low / Baseline
| Condition | Rationale |
|-----------|-----------|
| Support Devices | Ranges from no pathology to dislodged device |
| No Finding | No detected pathology |

### Severity Score Formula

```
severity = sum(confidence_i * tier_weight_i) / sum(tier_weight_i)
```

Tier weights map to numerical values for scoring:

| Tier | Weight | Priority Level | Color |
|------|--------|---------------|-------|
| 1 | 10 | Critical | Red |
| 2 | 8 | Urgent | Orange |
| 3 | 6 | Semi-urgent | Yellow |
| 4 | 4 | Moderate | Blue |
| 5 | 1 | Baseline | Green |

---

## Condition Set — v1 Active + Future Scale

**Decision (team-agreed):** Train on 5 CheXpert competition conditions first for higher confidence, then scale to 14.

### v1 Model — Active (5 conditions)

Model input: 224x224 resized chest X-ray
Model output: `[0, 1, 0, 0, 1]` — multi-label binary, one sigmoid per condition

| # | Condition | Tier | Weight | Mapped From |
|---|-----------|------|--------|-------------|
| 0 | Atelectasis | 4 | 4 | CheXpert |
| 1 | Cardiomegaly | 3 | 6 | CheXpert |
| 2 | Consolidation | 2 | 8 | CheXpert |
| 3 | Edema | 2 | 8 | CheXpert |
| 4 | Pleural Effusion | 3 | 6 | CheXpert |

### Future — Scale Target (9 additional conditions)

All code, explanations, pathology regions, and severity weights for these 9 conditions are kept in the codebase (commented out). Scaling up requires uncommenting them and retraining the model with additional output heads.

| Condition | Tier | Notes |
|-----------|------|-------|
| Pneumothorax | 1 | Immediately life-threatening |
| Pneumonia | 2 | Risk of sepsis |
| Infiltration | 2-3 | Broad differential |
| Mass | 1-2 | Possible malignancy |
| Nodule | 3-4 | Early malignancy screening |
| Hernia | 3-4 | Bowel incarceration risk |
| Emphysema | 4 | Chronic management |
| Fibrosis | 4 | Progressive monitoring |
| Pleural Thickening | 4 | Chronic, lower acuity |

---

## Dashboard Features

### 1. Patient Overview (Main Screen)
- **Real X-ray display** with the uploaded scan filling the viewer
- **Grad-CAM heatmap overlay** with adjustable opacity — shows where the model is "looking"
- **Floating annotation cards** connected by bezier curves to flagged regions on the X-ray
- Each card shows: condition name, AI explanation, confidence score, severity tier
- **X-ray View / Data View toggle** — switch between visual scan and detailed findings breakdown
- **Patient profile panel** with demographics, medical history, risk level
- **Severity metrics**: overall score (donut gauge), lung index (bar chart), ventilation status (sparkline)
- **Diagnose notes**: expandable findings list with clinical recommendations

### 2. Triage Queue
- All patients listed, **ranked by severity tier** (Tier 1 at top)
- Each row shows: patient name, age/sex, top finding, confidence, tier badge
- Filterable by tier level
- Color coding: RED (Tier 1) > ORANGE (Tier 2) > YELLOW (Tier 3) > BLUE (Tier 4) > GREEN (Tier 5)
- Click any patient to jump to their full overview

### 3. Comparison Screen
- Select any two patients/X-rays and compare side by side
- Two columns showing X-rays + findings
- Center column shows the **diff** — what's different between the two
- Use case: compare a patient's X-ray from admission vs. follow-up

### 4. Upload & Analyze
- Drag-and-drop X-ray upload (PNG, JPG, JPEG, DICOM)
- Model runs inference in seconds
- Returns flagged conditions + heatmap
- Auto-inserts into triage queue at the appropriate tier position

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| ML Model | DenseNet-121 (fine-tuned, PyTorch) | Gold standard for chest X-ray, pretrained on ImageNet |
| Explainability | Grad-CAM | Visual heatmaps showing model attention |
| Backend API | FastAPI | Fast, async, auto-generates API docs |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 | Modern, responsive, component-based dashboard |
| Charts | Recharts + HTML5 Canvas | Data visualizations (bar charts, donut gauges, sparklines) |
| Animations | Framer Motion | Smooth transitions and micro-interactions |
| Icons | Lucide React | Consistent medical-grade iconography |
| Data | NIH Chest X-rays (112K images, 30K patients) | Public domain, all target conditions labeled |

---

## Dataset: NIH Chest X-rays

**Source:** https://www.kaggle.com/datasets/nih-chest-xrays/data

| Property | Value |
|----------|-------|
| Total images | 112,120 |
| Unique patients | 30,805 |
| Image size | 1024 x 1024 |
| Labels | NLP-extracted (~90% accuracy) |
| Classes | 14 diseases + "No Finding" |
| License | CC0 Public Domain |
| Total size | ~45 GB (12 zip files) |

**Data strategy:**
- Filter to target conditions + No Finding
- Class-weighted loss to handle imbalanced conditions
- Data augmentation (flips, rotations, contrast) to increase effective training set
- EMS teammate validates 50-100 sample labels for clinical credibility

---

## Work Distribution

| Person | Owns | Delivers |
|--------|------|----------|
| **Mustapha** | Architecture, data pipeline, pitch | System design, API integration, dashboard architecture, demo narrative |
| **EMS Teammate** | Clinical validation | Tier ranking system, label review (50-100 images), pitch credibility, clinical sourcing |
| **ML Teammate** | Model training | Fine-tuned DenseNet-121, Grad-CAM outputs, AUC metrics, model serving |
| **Frontend Teammate** | UI/UX | Dashboard polish, responsive design, visual refinements |

### Parallel Workflow
- Frontend works against **mock data** immediately (no model needed to start)
- ML trains model independently on Kaggle/Colab GPU
- Backend serves mock data first, swaps to real model when ready
- Everyone productive from minute one

---

## Pitch Narrative

**Open:** "Radiologists are reading X-rays in under 4 seconds. Not because they're careless — because they're drowning."

**Problem:** "Every year, missed chest X-ray findings contribute to delayed diagnoses for millions of patients. The system is broken — too many images, too few specialists, especially in rural hospitals that can't afford a full-time radiologist."

**Solution:** "We built ChestGuard — a triage co-pilot. Upload an X-ray, get flagged abnormalities in seconds, with visual heatmaps showing exactly where to look. Patients are automatically ranked by clinical severity tiers — Tier 1 life-threatening cases surface immediately, so the critical ones never wait."

**Differentiator:** "Not a black box — every prediction comes with a visual explanation and clinical recommendation. Not a replacement — a tool that makes radiologists faster and more accurate. Our tier system was built with an EMS professional and backed by peer-reviewed mortality data."

**Human story:** "We didn't build this in a seminar room. We built it with an EMS professional who has been in the back of an ambulance, watching the clock, knowing that somewhere in a hospital, a chest X-ray is sitting in a queue. Our tool doesn't replace the doctor. It makes sure the doctor sees the right image, at the right moment, before it's too late."

**Impact:**
- AI triage reduced X-ray turnaround time by **77%** (2024 clinical study, 43 radiologists)
- Missed findings dropped from **44.8% to 2.6%** with AI prioritization
- A missed pleural effusion can escalate to ICU at **$4,000-$10,000/day**
- Earlier detection = shorter stays = lower costs = lives saved

---

## Key Stats for Judges

| Stat | Source |
|------|--------|
| AI triage cut turnaround time by **77%** | 2024 prospective study, 43 radiologists (ScienceDirect) |
| Missed findings dropped **44.8% → 2.6%** | AI worklist prioritization study (ResearchGate) |
| Radiologist burnout: **44-65%** | ACR workforce data |
| Rural radiology vacancy: **130 days avg** to fill | Medicushcs workforce report |
| Missed effusion ICU cost: **$4K-$10K/day** | Hospital cost data |
| Radiologist workload up **80%** since 2009 | Diagnostic Imaging |
| NHS: **100%** of radiology units missed targets in 2024 | Aag UK study |
| Each month delayed cancer diagnosis: **~10% increased mortality** | Aag research |
| Pneumothorax mortality: **6.4% overall**, up to **25% in AIDS patients** | PMC multicenter study |
| Pleural effusion: **15% dead at 30 days**, **32% at 1 year** | PMC hospitalized patients study |
| Pulmonary edema: **26-31% hospital mortality** | JAHA 806-patient study |

---

## Data Flow (How It Works in Production)

```
Patient gets X-ray
        ↓
DICOM file generated by scanner
        ↓
Sent to PACS (hospital image storage)
        ↓
  ┌─────────────────────────────┐
  │  ChestGuard intercepts      │  ← Our insertion point
  │  Runs DenseNet-121          │
  │  Generates Grad-CAM         │
  │  Assigns severity TIER      │
  │  Ranks in triage queue      │
  └─────────────────────────────┘
        ↓
Radiologist sees tier-prioritized worklist
with heatmaps + clinical context
```

For the hackathon demo: Upload PNG/JPG → Model inference → Results + heatmap in the dashboard.

In production: Integrates directly into existing PACS workflows via DICOM — no change to the radiologist's existing tools.

---

## Model Benchmarks (CheXpert Leaderboard Context)

| Model Type | AUC | Context |
|-----------|-----|---------|
| Baseline DenseNet-121 (single) | 0.724 | Our starting point |
| Top single models | ~0.90 | Achievable with good training strategy |
| Top ensembles | ~0.93 | State of the art, beats 2.8/3 radiologists |
| Our target | 0.85+ | Realistic for hackathon with fine-tuning |

Strategy to beat baseline:
- Transfer learning from ImageNet-pretrained DenseNet-121
- Class-weighted loss for imbalanced conditions
- Data augmentation (flips, rotations, contrast adjustments)
- Uncertainty handling (U-Ones strategy for ambiguous labels)

---

## Current Status

- [x] Dataset selected (NIH Chest X-rays)
- [x] Tier-based severity ranking system with clinical sources
- [x] Condition set decided — 5 CheXpert competition tasks (v1), scale to 14
- [x] Dashboard UI built (Next.js) with all 4 views
- [x] Mock data system with 20 generated patients (5 active conditions)
- [x] Real X-ray images integrated from Wikimedia Commons
- [x] Proposal and pitch narrative finalized
- [ ] Model training — DenseNet-121 on 5 conditions (in progress, training without augmentation first)
- [ ] Docker setup — containerize API + dashboard for reproducible dev
- [ ] FastAPI backend — `/predict` endpoint serving trained model
- [ ] Grad-CAM integration
- [ ] End-to-end pipeline (upload → inference → display)
- [ ] EMS teammate label validation
