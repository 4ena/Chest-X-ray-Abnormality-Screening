// Mock patient and findings data for the dashboard
//
// ACTIVE CONDITIONS (v1 model — CheXpert competition 5):
//   Atelectasis, Cardiomegaly, Consolidation, Edema, Pleural Effusion
//
// Model output format: [0, 1, 0, 0, 1] — multi-label binary, one per condition
// Input: 224x224 resized chest X-ray → DenseNet-121 → 5 sigmoid outputs
//
// FUTURE CONDITIONS (scale to 14 — kept in code, commented in ACTIVE_CONDITIONS):
//   Infiltration, Pneumothorax, Emphysema, Fibrosis, Effusion,
//   Pneumonia, Pleural Thickening, Nodule, Mass, Hernia

export type Tier = 2 | 3 | 4;
export type TierLabel = "urgent" | "semi-urgent" | "moderate";

export interface Finding {
  pathology: string;
  confidence: number;
  severity: "critical" | "moderate" | "mild" | "normal";
  tier: Tier;
  tierLabel: TierLabel;
  explanation: string;
  clinicalNote: string;
}

// Maps each active condition to its clinical tier (from Model_Hospital_Ranking.md)
export const CONDITION_TIERS: Record<string, { tier: Tier; label: TierLabel }> = {
  "Edema":             { tier: 2, label: "urgent" },
  "Consolidation":     { tier: 2, label: "urgent" },
  "Pleural Effusion":  { tier: 3, label: "semi-urgent" },
  "Cardiomegaly":      { tier: 3, label: "semi-urgent" },
  "Atelectasis":       { tier: 4, label: "moderate" },
};

export interface Patient {
  id: number;
  name: string;
  age: number;
  sex: "Male" | "Female";
  admissionDate: string;
  view: "Frontal" | "Lateral";
  apPa: "AP" | "PA";
  findings: Finding[];
  severityScore: number;
  severityLevel: "critical" | "moderate" | "mild" | "normal";
  topFinding: string;
  lungIndex: number;
  inflammation: "High" | "Medium" | "Low" | "None";
  ventilation: "Healthy" | "Impaired" | "Compromised";
  riskLevel: "High" | "Medium" | "Low";
  xrayImageUrl: string;
}

// ──────────────────────────────────────────────────────────
// ACTIVE: 5 conditions the model is trained on (v1)
// These match the CheXpert competition tasks and the model's
// multi-label output: [Atelectasis, Cardiomegaly, Consolidation, Edema, Pleural Effusion]
// ──────────────────────────────────────────────────────────
export const ACTIVE_CONDITIONS = [
  "Atelectasis",
  "Cardiomegaly",
  "Consolidation",
  "Edema",
  "Pleural Effusion",
];

// ──────────────────────────────────────────────────────────
// FUTURE: 9 additional conditions to scale to (kept for reference)
// Uncomment and add to ACTIVE_CONDITIONS when model supports them
// ──────────────────────────────────────────────────────────
// const FUTURE_CONDITIONS = [
//   "Infiltration",
//   "Pneumothorax",
//   "Emphysema",
//   "Fibrosis",
//   "Pneumonia",
//   "Pleural Thickening",
//   "Nodule",
//   "Mass",
//   "Hernia",
// ];

// Sample chest X-ray images from Wikimedia Commons (public domain)
const SAMPLE_XRAY_URLS = [
  "https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7a/Cardiomegally.PNG",
  "https://upload.wikimedia.org/wikipedia/commons/e/e7/Pleural_effusion.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/b/bb/Atelectasia.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Pneumothorax_CXR.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/34/Bilateral_Pleural_Effusion.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/d5/Cardiomegalia.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/Medical_X-Ray_imaging_AFJ02_nevit.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9f/Chest_X-ray_of_pneumothorax.png",
  "https://upload.wikimedia.org/wikipedia/commons/5/57/Left-sided_Pleural_Effusion.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/c/cb/02-01-Infiltrat_pa.png",
  "https://upload.wikimedia.org/wikipedia/commons/f/ff/Effusion.png",
  "https://upload.wikimedia.org/wikipedia/commons/2/25/09-01-Pneumothorax.png",
  "https://upload.wikimedia.org/wikipedia/commons/8/8d/Atelectasia1.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/b/ba/05-Spontanpneumothorax.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/df/Unilateral_Pleural_Effusion.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/8/8c/Rad_1300124.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/2/2d/Oberlappenatelektase_links_pa.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/PneumonisWedge09.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/3/30/Effusionhalf.PNG",
];

// Anatomical regions on the X-ray for heatmap marker placement
// Coordinates normalized 0-1 (relative to viewer dimensions)
export const PATHOLOGY_REGIONS: Record<string, { x: number; y: number; rx: number; ry: number; side: "left" | "right" }> = {
  // ── Active (v1 model) ──
  "Atelectasis":       { x: 0.65, y: 0.45, rx: 0.09, ry: 0.07, side: "right" },
  "Cardiomegaly":      { x: 0.48, y: 0.55, rx: 0.12, ry: 0.10, side: "left" },
  "Consolidation":     { x: 0.35, y: 0.42, rx: 0.09, ry: 0.07, side: "left" },
  "Edema":             { x: 0.50, y: 0.38, rx: 0.14, ry: 0.08, side: "right" },
  "Pleural Effusion":  { x: 0.30, y: 0.75, rx: 0.10, ry: 0.08, side: "left" },

  // ── Future (uncomment when model scales to 14) ──
  // "Infiltration":        { x: 0.36, y: 0.50, rx: 0.10, ry: 0.08, side: "left" },
  // "Pneumothorax":        { x: 0.70, y: 0.28, rx: 0.07, ry: 0.06, side: "right" },
  // "Emphysema":           { x: 0.67, y: 0.35, rx: 0.10, ry: 0.09, side: "right" },
  // "Fibrosis":            { x: 0.33, y: 0.60, rx: 0.08, ry: 0.07, side: "left" },
  // "Pneumonia":           { x: 0.64, y: 0.52, rx: 0.09, ry: 0.08, side: "right" },
  // "Pleural Thickening":  { x: 0.25, y: 0.55, rx: 0.06, ry: 0.10, side: "left" },
  // "Nodule":              { x: 0.68, y: 0.40, rx: 0.05, ry: 0.05, side: "right" },
  // "Mass":                { x: 0.34, y: 0.35, rx: 0.07, ry: 0.07, side: "left" },
  // "Hernia":              { x: 0.45, y: 0.80, rx: 0.08, ry: 0.06, side: "left" },
};

// ──────────────────────────────────────────────────────────
// Explanations & clinical notes for ALL 14 conditions
// Kept complete so scaling up only requires uncommenting ACTIVE_CONDITIONS
// ──────────────────────────────────────────────────────────
const ALL_EXPLANATIONS: Record<string, { explanation: string; clinicalNote: string }> = {
  // ── Active (v1) ──
  "Atelectasis": {
    explanation: "Volume loss detected in the affected lung region with displacement of fissures and increased opacity. The model identified a wedge-shaped density consistent with lobar or segmental collapse.",
    clinicalNote: "Assess for obstructive causes (mucus plug, endobronchial lesion). Incentive spirometry recommended. If persistent, consider bronchoscopy."
  },
  "Cardiomegaly": {
    explanation: "The cardiac silhouette appears enlarged beyond the normal cardiothoracic ratio of 0.5. The model detected increased opacity in the mediastinal region consistent with an enlarged heart shadow.",
    clinicalNote: "Consider echocardiography to assess ventricular function. May indicate congestive heart failure, valvular disease, or pericardial effusion. Correlate with patient symptoms (dyspnea, edema)."
  },
  "Consolidation": {
    explanation: "Air bronchograms visible within an area of increased opacity, suggesting replacement of alveolar air by fluid or inflammatory exudate. Pattern is consistent with lobar consolidation.",
    clinicalNote: "High suspicion for pneumonia. Obtain sputum culture and initiate empiric antibiotics per guidelines. Follow-up imaging in 6-8 weeks if clinically indicated."
  },
  "Edema": {
    explanation: "Bilateral perihilar haziness with Kerley B lines and peribronchial cuffing detected. Upper lobe pulmonary venous distension suggests elevated pulmonary capillary wedge pressure.",
    clinicalNote: "Likely cardiogenic pulmonary edema. Assess cardiac function, BNP levels, and fluid balance. Consider diuretic therapy. Rule out ARDS if clinical context suggests non-cardiogenic etiology."
  },
  "Pleural Effusion": {
    explanation: "Blunting of the costophrenic angle detected with increased opacity in the lower lung zones. The meniscus sign is present, indicating fluid accumulation in the pleural space.",
    clinicalNote: "Quantify effusion size. Small effusions may be monitored; large effusions may require thoracentesis. Rule out infectious, malignant, or cardiac causes."
  },

  // ── Future (kept for scale-up) ──
  "Infiltration": {
    explanation: "Diffuse or patchy opacities detected in the lung parenchyma suggesting interstitial or alveolar infiltrates. The pattern may indicate infection, inflammation, or fluid in the lung tissue.",
    clinicalNote: "Correlate with clinical symptoms — fever suggests infection (pneumonia), dyspnea may suggest pulmonary edema. CBC, CRP, and sputum culture may help differentiate. Follow-up imaging recommended."
  },
  "Pneumothorax": {
    explanation: "Visceral pleural line detected with absence of lung markings beyond this line. The model identified a lucent area between the chest wall and the lung edge.",
    clinicalNote: "Urgent assessment required. Small pneumothorax (<2cm) may be observed with serial imaging. Large or symptomatic pneumothorax requires chest tube insertion."
  },
  "Emphysema": {
    explanation: "Hyperinflated lung fields with flattened diaphragms and increased retrosternal airspace. The model detected decreased lung markings peripherally consistent with parenchymal destruction.",
    clinicalNote: "Correlate with pulmonary function tests (FEV1/FVC ratio). Smoking cessation is critical. Assess for alpha-1 antitrypsin deficiency in younger patients. Consider pulmonary rehabilitation referral."
  },
  "Fibrosis": {
    explanation: "Reticular or reticulonodular opacities detected, predominantly in the lower lung zones. The pattern suggests interstitial fibrotic changes with possible honeycombing in advanced disease.",
    clinicalNote: "High-resolution CT recommended for further characterization. Assess for occupational exposures, connective tissue disease, or medication-related causes. Pulmonary function tests with DLCO warranted."
  },
  "Pneumonia": {
    explanation: "Focal or multifocal airspace opacities detected with possible air bronchograms. The distribution and pattern suggest an infectious process involving the lung parenchyma.",
    clinicalNote: "Initiate empiric antibiotics based on clinical setting (community vs hospital acquired). Obtain blood cultures and sputum if possible. Follow-up imaging in 6-8 weeks to confirm resolution."
  },
  "Pleural Thickening": {
    explanation: "Irregular thickening of the pleural lining detected along the chest wall. The model identified areas where the pleural surface appears denser than normal, suggesting chronic pleural disease.",
    clinicalNote: "Assess for history of asbestos exposure, prior infection (empyema/TB), or hemothorax. If new or progressive, CT recommended to rule out mesothelioma. Pulmonary function tests may show restrictive pattern."
  },
  "Nodule": {
    explanation: "A small, well-circumscribed rounded opacity (< 3 cm) identified in the lung field. The model flagged this as a focal density distinct from surrounding vasculature and airways.",
    clinicalNote: "Assess size, morphology, and growth rate. Follow Fleischner Society guidelines for management. PET-CT or biopsy may be warranted depending on size and risk factors. Compare with prior imaging if available."
  },
  "Mass": {
    explanation: "A large opacity (> 3 cm) detected in the lung field. The model identified a dense, space-occupying lesion that may represent primary lung malignancy, metastasis, or other etiology.",
    clinicalNote: "Urgent CT with contrast recommended. Consider biopsy (CT-guided or bronchoscopic). Staging workup if malignancy suspected. Multidisciplinary team discussion recommended."
  },
  "Hernia": {
    explanation: "Abnormal soft tissue density or gas pattern detected at the level of the diaphragm, suggesting herniation of abdominal contents into the thoracic cavity through a diaphragmatic defect.",
    clinicalNote: "Confirm with lateral view or CT scan. Assess for Bochdalek (posterior) or Morgagni (anterior) hernia. Surgical consultation recommended if symptomatic or if bowel is at risk of incarceration."
  },
};

// Build explanations map from only active conditions
const EXPLANATIONS: Record<string, { explanation: string; clinicalNote: string }> = {};
for (const name of ACTIVE_CONDITIONS) {
  EXPLANATIONS[name] = ALL_EXPLANATIONS[name];
}

// Seeded random
let seed = 42;
function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function severityFromConfidence(c: number): Finding["severity"] {
  if (c >= 0.7) return "critical";
  if (c >= 0.45) return "moderate";
  if (c >= 0.25) return "mild";
  return "normal";
}

function severityLevel(score: number): Patient["severityLevel"] {
  if (score >= 0.7) return "critical";
  if (score >= 0.45) return "moderate";
  if (score >= 0.25) return "mild";
  return "normal";
}

// Use only active conditions for patient generation
const CONDITIONS = ACTIVE_CONDITIONS;

const FIRST_NAMES = ["James", "Maria", "Robert", "Linda", "Michael", "Patricia", "William", "Elizabeth", "David", "Jennifer", "Richard", "Susan", "Joseph", "Margaret", "Thomas", "Dorothy", "Charles", "Karen", "Daniel", "Nancy"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

// Severity weights based on tier system (see Model_Hospital_Ranking.md)
// Tier 2 (Urgent) = 8, Tier 3 (Semi-urgent) = 6, Tier 4 (Moderate) = 4
const SEVERITY_WEIGHTS: Record<string, number> = {
  // ── Active (v1) ──
  "Edema": 8,              // Tier 2 — Urgent
  "Consolidation": 8,      // Tier 2 — Urgent
  "Pleural Effusion": 6,   // Tier 3 — Semi-urgent
  "Cardiomegaly": 6,       // Tier 3 — Semi-urgent
  "Atelectasis": 4,        // Tier 4 — Moderate

  // ── Future (uncomment when scaling) ──
  // "Pneumothorax": 10,         // Tier 1 — Immediately life-threatening
  // "Pneumonia": 8,             // Tier 2 — Urgent
  // "Infiltration": 7,          // Tier 2-3
  // "Mass": 9,                  // Tier 1-2 (malignancy concern)
  // "Nodule": 6,                // Tier 3-4
  // "Hernia": 6,                // Tier 3-4
  // "Emphysema": 5,             // Tier 4
  // "Fibrosis": 5,              // Tier 4
  // "Pleural Thickening": 4,    // Tier 4
};

function generatePatients(): Patient[] {
  const patients: Patient[] = [];

  for (let i = 1; i <= 20; i++) {
    const numFindings = Math.floor(random() * 4) + 1;
    const shuffled = [...CONDITIONS].sort(() => random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numFindings, CONDITIONS.length));

    const findings: Finding[] = selected.map(name => {
      const confidence = Math.round((random() * 0.7 + 0.15) * 100) / 100;
      const info = EXPLANATIONS[name];
      const tierInfo = CONDITION_TIERS[name] || { tier: 4 as Tier, label: "moderate" as TierLabel };
      return {
        pathology: name,
        confidence,
        severity: severityFromConfidence(confidence),
        tier: tierInfo.tier,
        tierLabel: tierInfo.label,
        explanation: info.explanation,
        clinicalNote: info.clinicalNote,
      };
    }).sort((a, b) => b.confidence - a.confidence);

    let weightedSum = 0, totalWeight = 0;
    for (const f of findings) {
      const w = SEVERITY_WEIGHTS[f.pathology] || 5;
      weightedSum += f.confidence * w;
      totalWeight += w;
    }
    const score = Math.round((weightedSum / totalWeight) * 100) / 100;

    const age = Math.floor(random() * 60) + 20;
    const sex = random() > 0.5 ? "Male" as const : "Female" as const;

    patients.push({
      id: i,
      name: `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]}`,
      age, sex,
      admissionDate: `2026-03-${String(Math.floor(random() * 28) + 1).padStart(2, "0")}`,
      view: random() > 0.14 ? "Frontal" : "Lateral",
      apPa: random() > 0.28 ? "AP" : "PA",
      findings,
      severityScore: score,
      severityLevel: severityLevel(score),
      topFinding: findings[0]?.pathology || "No Finding",
      lungIndex: Math.floor(random() * 40 + 60),
      inflammation: score >= 0.6 ? "High" : score >= 0.35 ? "Medium" : "Low",
      ventilation: score >= 0.6 ? "Compromised" : score >= 0.35 ? "Impaired" : "Healthy",
      riskLevel: score >= 0.6 ? "High" : score >= 0.35 ? "Medium" : "Low",
      xrayImageUrl: SAMPLE_XRAY_URLS[i % SAMPLE_XRAY_URLS.length],
    });
  }

  return patients.sort((a, b) => b.severityScore - a.severityScore);
}

export const patients = generatePatients();

export const regionData = [
  { region: "RUL", ventilation: 78, inflammation: 32 },
  { region: "RML", ventilation: 85, inflammation: 18 },
  { region: "RLL", ventilation: 62, inflammation: 45 },
  { region: "LUL", ventilation: 80, inflammation: 25 },
  { region: "LLL", ventilation: 58, inflammation: 52 },
];
