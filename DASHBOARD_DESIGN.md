# Dashboard Design Decision Tree

Living document — tweak until it fits what we want.

---

## 1. Landing Page: Triage Queue

**Decision:** Doctor opens Pneumanosis → sees the worklist, not a single patient.

**Why:** Matches real radiology workflow (Aidoc, Annalise.ai, Philips). The first question is always "what needs my attention right now?"

### What's shown:

| Element | Current | Status | Notes |
|---------|---------|--------|-------|
| Stats cards (Total, Urgent, Semi-Urgent, Moderate) | Yes | ✅ Done | Top of page |
| Filter by tier | Yes | ✅ Done | Pill buttons: All, Urgent, Semi-Urgent, Moderate |
| Patient table | Yes | ✅ Done | Rank, name, age/sex, top finding, conditions bars, wait time, tier badge |
| Mini 5-condition bars per patient | Yes | ✅ Done | Tiny vertical bars showing all 5 confidences |
| Wait time column | Yes | ✅ Done | Time since admission |
| Tier badge per row | Yes | ✅ Done | URGENT (red), SEMI-URGENT (amber), MODERATE (blue) |
| Click row → patient detail | Yes | ✅ Done | Switches to dashboard view |

### Open questions:

- [ ] Should the table auto-refresh / show a "new patient" animation when a scan is uploaded?
- [ ] Should there be a search bar to find a specific patient by name/ID?
- [ ] Do we want a "batch actions" feature (e.g., mark multiple as reviewed)?
- [ ] Should the stats cards show change-over-time (e.g., "+3 since last hour")?

---

## 2. Patient Detail View

**Decision:** Click a patient → see their X-ray with AI findings overlaid.

### Layout:

```
┌─────┬──────────────┬──────────────────────────────────────────┐
│     │              │ [Summary Bar: 3 findings — Edema 91%    │
│  S  │  Patient     │  TIER 2 URGENT] + [5-condition bars]    │
│  I  │  Profile     ├──────────────────────────────────────────┤
│  D  │              │                                          │
│  E  │  Metric      │  [Card] ── ● X-RAY IMAGE ── [Card]     │
│  B  │  Cards       │            (fills 70%+)                  │
│  A  │              │  [Card] ── ●              ── [Card]     │
│  R  │  AI          │                                          │
│     │  Analysis    │  [Heatmap] [🔄] [🔍+] [🔍-]           │
└─────┴──────────────┴──────────────────────────────────────────┘
       Left (320px)          Right (fills remaining)
```

### Summary Bar (top of X-ray viewer):

| Element | Current | Status | Notes |
|---------|---------|--------|-------|
| Findings count | "3 findings detected" | ✅ Done | Counts findings with confidence ≥ 30% |
| Highest finding + confidence | "Edema 91%" | ✅ Done | Bold, colored by tier |
| Tier badge | "TIER 2 — URGENT" | ✅ Done | Colored pill |
| 5-condition mini bars | Yes | ✅ Done | All 5 conditions as tiny horizontal bars |

### Left Panel:

| Element | Current | Status | Notes |
|---------|---------|--------|-------|
| Patient profile (name, age, sex, contact) | Yes | ✅ Done | Includes initials avatar, risk badge |
| Demographics grid (age, gender, view type) | Yes | ✅ Done | 3-column grid |
| Admission details | Yes | ✅ Done | Date, imaging type, referring doctor |
| Medical history | Basic | ✅ Done | Primary concern + findings count |
| Severity score donut | Yes | ✅ Done | Canvas-rendered, colored by tier |
| Lung index + bar chart | Yes | ✅ Done | With inflammation badge |
| Ventilation sparkline | Yes | ✅ Done | Trending indicator |
| AI Analysis (all 5 conditions) | Yes | ✅ Done | Animated confidence bars, always showing all 5 |
| Detected findings (expandable) | Yes | ✅ Done | Tier badges, expand for clinical notes |

### Right Panel (X-ray Viewer):

| Element | Current | Status | Notes |
|---------|---------|--------|-------|
| Real X-ray image | Yes | ✅ Done | From Wikimedia Commons, brightness/contrast boosted |
| Image fills 70%+ of viewer | Yes | ✅ Done | Cards are 185px, X-ray gets the rest |
| Grad-CAM heatmap overlay | Canvas | ✅ Done | Colored by tier (red/amber/blue), adjustable opacity |
| Annotation cards (left/right) | Compact | ✅ Done | Name + confidence + tier badge, expand for detail |
| Bezier curve connector lines | SVG | ✅ Done | From heatmap dot to card edge, colored by tier |
| View type badge | "Frontal · AP" | ✅ Done | Overlaid on image top-left |
| X-ray View / Data View toggle | Yes | ✅ Done | Top-right |
| Bottom toolbar | Floating pill | ✅ Done | Heatmap toggle, opacity slider, zoom, rotate, layers |

### Open questions:

- [ ] Should clicking an annotation card scroll the left panel to that finding's details?
- [ ] Do we want a "confirm / dismiss" action per finding (doctor agrees/disagrees with AI)?
- [ ] Should the X-ray support pinch-to-zoom on touch devices?
- [ ] Window/level adjustment (brightness/contrast sliders) for the X-ray?
- [ ] Should there be a "flag for second opinion" button?

---

## 3. Annotation Card Design

**Decision:** Compact by default, expandable on demand. Doctor glances, confirms, moves on.

### Default state (collapsed):
```
┌─────────────────────────────┐
│ ● Edema              91%   │
│   URGENT                  ⌄ │
└─────────────────────────────┘
```

### Expanded state (on click):
```
┌─────────────────────────────┐
│ ● Edema              91%   │
│   URGENT                  ⌃ │
│ ─────────────────────────── │
│ Bilateral perihilar         │
│ haziness with Kerley B...   │
└─────────────────────────────┘
```

**Why compact:** Research shows on-demand explanations have higher user acceptance than forced detail. Doctors under time pressure scan — they don't read paragraphs while reading X-rays.

### Open questions:

- [ ] Should the expanded state show the clinical recommendation too, or just the AI explanation?
- [ ] Do cards need a "copy to report" button for dictation workflows?

---

## 4. Color System

**Decision:** Tier-based colors, not generic severity. Reserve red for truly urgent.

| Tier | Color | Hex | Used For |
|------|-------|-----|----------|
| 2 — Urgent | Red | `#ef4444` | Edema, Consolidation |
| 3 — Semi-Urgent | Amber | `#f59e0b` | Pleural Effusion, Cardiomegaly |
| 4 — Moderate | Blue | `#3b82f6` | Atelectasis |
| No finding / <30% | Gray | `#e2e8f0` | Below detection threshold |
| Accent | Indigo | `#4a6cf7` | UI elements, buttons, active states |

**Why not red for everything critical:** Alert fatigue. If everything is red, nothing is red. Aidoc uses this same approach — bright color only for the highest priority.

### Open questions:

- [ ] Is blue right for Tier 4, or should it be a muted gray/green?
- [ ] Should the 30% threshold be configurable?

---

## 5. Tier System (from Model_Hospital_Ranking.md)

### Active (v1 model — 5 conditions):

| Condition | Tier | Weight | Color |
|-----------|------|--------|-------|
| Edema | 2 — Urgent | 8 | Red |
| Consolidation | 2 — Urgent | 8 | Red |
| Pleural Effusion | 3 — Semi-Urgent | 6 | Amber |
| Cardiomegaly | 3 — Semi-Urgent | 6 | Amber |
| Atelectasis | 4 — Moderate | 4 | Blue |

### Severity Score:
```
score = sum(confidence × weight) / sum(weight)
```

### Priority mapping:
| Score | Level | Action |
|-------|-------|--------|
| ≥ 0.70 | Critical | Immediate review |
| 0.45–0.69 | Moderate | Priority review |
| 0.25–0.44 | Mild | Standard queue |
| < 0.25 | Normal | Routine |

### Open questions:

- [ ] Should the score formula factor in the NUMBER of findings, not just confidence × weight?
- [ ] Should a patient with 5 low-confidence findings rank higher than one with 1 high-confidence?

---

## 6. Data View (Alternative to X-ray View)

**Decision:** Toggle between visual X-ray and structured data breakdown.

### What's shown:

| Element | Status | Notes |
|---------|--------|-------|
| Selected finding detail | ✅ Done | Name, tier badge, confidence |
| "Why AI Flagged This" | ✅ Done | Expandable explanation |
| "Clinical Recommendation" | ✅ Done | From clinicalNote field |
| All findings table with bars | ✅ Done | Horizontal confidence bars, tier badges |

### Open questions:

- [ ] Should Data View show a structured radiology report template?
- [ ] Export to PDF for the patient's chart?

---

## 7. Upload Flow

**Current:** Drag-and-drop upload → mock 2-second analysis → shows results.

### Target flow (when inference pipeline is ready):
```
Upload PNG/JPG → POST /predict → Model inference (DenseNet-121)
→ Returns 5 confidences + Grad-CAM heatmap
→ Patient auto-inserted into triage queue at correct tier
→ Dashboard shows results with heatmap overlay
```

### Open questions:

- [ ] Should upload accept DICOM in addition to PNG/JPG?
- [ ] Batch upload (multiple X-rays at once)?
- [ ] Should there be a "re-analyze" button if the model is updated?

---

## 8. Compare View

**Current:** Side-by-side two-patient comparison with mini X-rays and finding diffs.

### Open questions:

- [ ] Same-patient over time (progression tracking) vs. two different patients?
- [ ] Should the comparison overlay both heatmaps on a split-screen?
- [ ] Is this view useful enough to keep, or should we cut it for hackathon scope?

---

## 9. Visual Design Principles

Based on research (Eleken healthcare UI guide, Aidoc integration patterns, JMIR trust study):

1. **Clarity over aesthetics** — every pixel serves a clinical purpose
2. **Summaries before detail** — overview first, drill down on demand
3. **Role-specific** — this is for radiologists, not patients
4. **Reserve red** — only for Tier 2 (Urgent), prevents alert fatigue
5. **White/light backgrounds** — calm, professional, reduces eye strain during long reads
6. **Confidence as trust signal** — the % IS what builds doctor trust in the AI
7. **Heatmap as verification** — "the AI sees what I see" builds confidence
8. **Persistent navigation** — sidebar always visible, never lost

---

## 10. Implementation Status

| Feature | Status | File(s) |
|---------|--------|---------|
| Triage queue landing page | ✅ | page.tsx, TriageView.tsx |
| Tier badges everywhere | ✅ | TriageView, XrayViewer, DiagnoseNotes |
| Summary bar | ✅ | XrayViewer.tsx |
| Compact annotation cards | ✅ | XrayViewer.tsx |
| Animated 5-condition bars | ✅ | DiagnoseNotes.tsx |
| Real X-ray images | ✅ | mock.ts, XrayViewer.tsx |
| Heatmap overlay | ✅ | XrayViewer.tsx |
| Tier-based color system | ✅ | All components |
| Wait time column | ✅ | TriageView.tsx |
| Mini condition bars in table | ✅ | TriageView.tsx |
| API integration | ⏳ | Waiting for inference pipeline |
| Docker setup | ⏳ | Waiting for team coordination |
| Real Grad-CAM overlays | ⏳ | Waiting for model .pth |
