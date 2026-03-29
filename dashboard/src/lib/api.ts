/**
 * Pneumanosis API client
 *
 * Connects the dashboard to the FastAPI backend.
 * Falls back gracefully if the API is unavailable (mock mode continues).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types matching API response models ──

export interface ConditionResult {
  pathology: string;
  confidence: number;
  tier: number;
  tier_label: string;
  detected: boolean;
}

export interface PredictionResponse {
  patient_id: string | null;
  findings: ConditionResult[];
  highest_tier: number;
  severity_score: number;
  model_version: string;
  using_mock: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_version: string;
  using_mock: boolean;
}

export interface ConditionInfo {
  name: string;
  tier: number;
  tier_label: string;
  weight: number;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  sex: string;
  reason_for_exam: string;
  findings: ConditionResult[];
  severity_score: number;
  highest_tier: number;
  created_at: string;
}

export interface FindingActionResponse {
  patient_id: string;
  pathology: string;
  status: string;
  flagged: boolean;
}

// ── Health & conditions ──

export async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function isApiAvailable(): Promise<boolean> {
  const health = await checkHealth();
  return health !== null && health.status === "ok";
}

export async function getConditions(): Promise<ConditionInfo[]> {
  const res = await fetch(`${API_URL}/conditions`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

// ── Prediction ──

export async function predictXray(file: File): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/predict`, { method: "POST", body: formData });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return await res.json();
}

// ── Patient CRUD ──

export async function listPatients(): Promise<PatientRecord[]> {
  const res = await fetch(`${API_URL}/patients`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

export async function createPatient(data: {
  name: string;
  age: number;
  sex: string;
  reason_for_exam?: string;
  findings?: ConditionResult[];
  severity_score?: number;
  highest_tier?: number;
}): Promise<PatientRecord> {
  const res = await fetch(`${API_URL}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return await res.json();
}

export async function updatePatient(id: string, data: {
  name: string; age: number; sex: string; reason_for_exam?: string;
}): Promise<PatientRecord> {
  const res = await fetch(`${API_URL}/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

// ── Finding actions ──

export async function updateFindingAction(
  patientId: string, pathology: string, action: "confirm" | "dismiss" | "flag" | "unflag"
): Promise<FindingActionResponse> {
  const res = await fetch(`${API_URL}/findings/${patientId}/${encodeURIComponent(pathology)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}
