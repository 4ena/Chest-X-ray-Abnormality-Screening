// Mock patient and findings data for the dashboard

export interface Finding {
  pathology: string;
  confidence: number;
  severity: "critical" | "moderate" | "mild" | "normal";
  explanation: string;
  clinicalNote: string;
}

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
}

const EXPLANATIONS: Record<string, { explanation: string; clinicalNote: string }> = {
  "Cardiomegaly": {
    explanation: "The cardiac silhouette appears enlarged beyond the normal cardiothoracic ratio of 0.5. The model detected increased opacity in the mediastinal region consistent with an enlarged heart shadow.",
    clinicalNote: "Consider echocardiography to assess ventricular function. May indicate congestive heart failure, valvular disease, or pericardial effusion. Correlate with patient symptoms (dyspnea, edema)."
  },
  "Pleural Effusion": {
    explanation: "Blunting of the costophrenic angle detected with increased opacity in the lower lung zones. The meniscus sign is present, indicating fluid accumulation in the pleural space.",
    clinicalNote: "Quantify effusion size. Small effusions may be monitored; large effusions may require thoracentesis. Rule out infectious, malignant, or cardiac causes."
  },
  "Atelectasis": {
    explanation: "Volume loss detected in the affected lung region with displacement of fissures and increased opacity. The model identified a wedge-shaped density consistent with lobar or segmental collapse.",
    clinicalNote: "Assess for obstructive causes (mucus plug, endobronchial lesion). Incentive spirometry recommended. If persistent, consider bronchoscopy."
  },
  "Consolidation": {
    explanation: "Air bronchograms visible within an area of increased opacity, suggesting replacement of alveolar air by fluid or inflammatory exudate. Pattern is consistent with lobar consolidation.",
    clinicalNote: "High suspicion for pneumonia. Obtain sputum culture and initiate empiric antibiotics per guidelines. Follow-up imaging in 6-8 weeks if clinically indicated."
  },
  "Edema": {
    explanation: "Bilateral perihilar haziness with Kerley B lines and peribronchial cuffing detected. Upper lobe pulmonary venous distension suggests elevated pulmonary capillary wedge pressure.",
    clinicalNote: "Likely cardiogenic pulmonary edema. Assess cardiac function, BNP levels, and fluid balance. Consider diuretic therapy. Rule out ARDS if clinical context suggests non-cardiogenic etiology."
  },
  "Lung Opacity": {
    explanation: "A region of increased density identified in the lung parenchyma that partially obscures underlying structures. The pattern is non-specific and requires clinical correlation.",
    clinicalNote: "Differential includes infection, hemorrhage, aspiration, or mass. Correlate with clinical presentation. CT may be warranted for further characterization."
  },
  "Pneumothorax": {
    explanation: "Visceral pleural line detected with absence of lung markings beyond this line. The model identified a lucent area between the chest wall and the lung edge.",
    clinicalNote: "Urgent assessment required. Small pneumothorax (<2cm) may be observed with serial imaging. Large or symptomatic pneumothorax requires chest tube insertion."
  },
  "Enlarged Cardiomediastinum": {
    explanation: "Widening of the mediastinal silhouette detected beyond normal limits. Superior mediastinal width exceeds expected proportions relative to thoracic width.",
    clinicalNote: "Differential includes aortic aneurysm, lymphadenopathy, or mass. CT angiography recommended if aortic pathology is suspected. Correlate with clinical history."
  },
};

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

const CONDITIONS = Object.keys(EXPLANATIONS);
const FIRST_NAMES = ["James", "Maria", "Robert", "Linda", "Michael", "Patricia", "William", "Elizabeth", "David", "Jennifer", "Richard", "Susan", "Joseph", "Margaret", "Thomas", "Dorothy", "Charles", "Karen", "Daniel", "Nancy"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const SEVERITY_WEIGHTS: Record<string, number> = {
  "Pneumothorax": 10, "Edema": 8, "Pleural Effusion": 8, "Cardiomegaly": 7,
  "Consolidation": 6, "Atelectasis": 6, "Lung Opacity": 5, "Enlarged Cardiomediastinum": 4,
};

function generatePatients(): Patient[] {
  const patients: Patient[] = [];

  for (let i = 1; i <= 20; i++) {
    const numFindings = Math.floor(random() * 4) + 1;
    const shuffled = [...CONDITIONS].sort(() => random() - 0.5);
    const selected = shuffled.slice(0, numFindings);

    const findings: Finding[] = selected.map(name => {
      const confidence = Math.round((random() * 0.7 + 0.15) * 100) / 100;
      const info = EXPLANATIONS[name];
      return {
        pathology: name,
        confidence,
        severity: severityFromConfidence(confidence),
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
