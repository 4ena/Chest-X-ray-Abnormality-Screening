# ChestGuard - Chest X-ray Triage Co-Pilot

## Team Proposal for RevolutionUC

---

## The Problem

- Radiologists read 20,000+ X-rays/year, often under 4 seconds per image at peak load
- Missed findings (pleural effusion, atelectasis, subtle opacities) lead to delayed treatment
- Rural/understaffed hospitals lack full-time radiologists — images queue for hours
- Burnout affects 44-65% of radiologists; workload grew 80% from 2009-2020

## Our Solution

A **triage co-pilot** that takes chest X-rays and:

1. **Detects multiple abnormalities** with confidence scores
2. **Ranks patients by severity** so the most critical get seen first
3. **Shows heatmaps** highlighting exactly where the issue is on the X-ray
4. **Compares X-rays side-by-side** (like GSM Arena) for monitoring patient progression

**Not a replacement. A co-pilot.** The radiologist still makes the call — we make sure they look at the right image, at the right time.

---

## Dashboard Features

### 1. Triage Queue (Main Screen)
- All patients listed, **ranked by severity score** (most critical at top)
- Each card shows: patient name, age, top finding, severity color bar
- Color coding: RED (critical) > ORANGE (moderate) > YELLOW (mild) > GREEN (normal)
- One glance tells the radiologist where to focus

### 2. Patient Detail View
- Click any patient to see full breakdown
- **Left side:** X-ray with Grad-CAM heatmap overlay (adjustable opacity slider)
- **Right side:** All detected conditions with confidence bars
- **3D parallax effect** on the X-ray — mouse hover tilts the image for a striking visual
- Heatmap uses color intensity to show where the model is "looking"

### 3. Comparison Screen (GSM Arena Style)
- Select any two patients/X-rays and compare side by side
- Two columns showing X-rays + findings
- Center column shows the **diff** — what's different between the two
- Use case: compare a patient's X-ray from admission vs. follow-up to track progression
- Draggable slider divider between images

### 4. Upload & Analyze (Stretch Goal)
- Upload a new X-ray image
- Model runs inference in seconds
- Returns flagged conditions + heatmap
- Auto-inserts into triage queue at the appropriate severity position

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| ML Model | DenseNet-121 (fine-tuned, PyTorch) | Gold standard for chest X-ray, pretrained on ImageNet |
| Explainability | Grad-CAM | Visual heatmaps showing model attention |
| Backend API | FastAPI | Fast, async, auto-generates API docs |
| Frontend | Vanilla HTML/CSS/JS | No build step, fast iteration, full layout control |
| UI Design | Dark medical theme, glassmorphism | Modern, professional, impressive for demo |
| Data | CheXpert-v1.0-small (224K images) | Stanford's benchmark dataset with uncertainty labels |

---

## Severity Score Formula

```
severity = sum(confidence_i * weight_i) / sum(weight_i)
```

Weights determined by clinical urgency (with EMS teammate input):
- Pneumothorax: 10 (life-threatening)
- Pleural Effusion: 8
- Cardiomegaly: 7
- Atelectasis: 6
- Edema: 8
- Consolidation: 5
- Lung Opacity: 4

---

## Work Distribution

| Person | Owns | Delivers |
|--------|------|----------|
| **Mustapha** | Architecture, data pipeline, pitch | FastAPI backend, API design, integration, demo narrative |
| **EMS Teammate** | Clinical validation | Severity weights, label review (50 images), pitch credibility |
| **ML Teammate** | Model training | Fine-tuned DenseNet-121, Grad-CAM outputs, AUC metrics |
| **Frontend Teammate** | UI/UX | Dashboard views, heatmap overlay, comparison screen, polish |

### Parallel Workflow
- Frontend works against **mock data** immediately (no model needed to start)
- ML trains model independently
- Backend serves mock data first, swaps to real model when ready
- Everyone productive from minute one

---

## Pitch Narrative

**Open:** "Radiologists are reading X-rays in under 4 seconds. Not because they're careless — because they're drowning."

**Problem:** "Missed chest X-ray findings cause delayed diagnoses. The system is broken — too many images, too few specialists."

**Solution:** "We built ChestGuard — a triage co-pilot. Upload an X-ray, get flagged abnormalities in seconds, with visual heatmaps showing exactly where to look. Patients are ranked by severity so the critical ones never wait."

**Differentiator:** "Not a black box — every prediction comes with a visual explanation. Not a replacement — a tool that makes radiologists faster and more accurate."

**Human story:** "We built this with an EMS professional who has been in the back of an ambulance, watching the clock, hoping the ER catches it in time."

**Impact:**
- AI triage reduced turnaround time by 77% in clinical studies
- Missed-case rates dropped from 44.8% to 2.6% with AI prioritization
- Earlier detection = shorter hospital stays = lower costs = lives saved

---

## Key Stats for Judges

- AI triage cut X-ray turnaround time by **77%** (2024 clinical study, 43 radiologists)
- Missed findings dropped from **44.8% to 2.6%** with AI prioritization
- Radiologist burnout: **44-65%** report high burnout
- Rural hospitals: **130 days average** to fill a radiology position
- A missed pleural effusion can cost **$4,000-$10,000/day** in ICU

---

## Questions for Team Discussion

1. **Which 5 conditions?** CheXpert's competition tasks (Atelectasis, Cardiomegaly, Consolidation, Edema, Pleural Effusion) or a custom set?
2. **Dataset confirmed?** CheXpert-v1.0-small or are we considering others?
3. **Uncertainty labels:** How do we handle -1.0 values? U-Ones strategy is simplest.
4. **GPU for training?** Local M3 Pro can handle it, or use Kaggle/Colab free GPU?
5. **Project name?** ChestGuard? ClearScan? TriageAI? Something else?
6. **Comparison screen scope:** Patient-over-time comparison? Or comparing two different patients? Both?
