/**
 * ChestGuard API client
 *
 * Connects the dashboard to the FastAPI backend for real inference.
 * Falls back gracefully if the API is unavailable (mock mode continues to work).
 *
 * Usage in components:
 *   import { predictXray, checkHealth } from "@/lib/api";
 *   const result = await predictXray(file);
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types matching the API response models ──

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

// ── API calls ──

export async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function predictXray(file: File): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return await res.json();
}

export async function getConditions(): Promise<ConditionInfo[]> {
  const res = await fetch(`${API_URL}/conditions`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

/**
 * Check if the API is reachable. Use this to decide whether to
 * show "Live" or "Mock" mode in the UI.
 */
export async function isApiAvailable(): Promise<boolean> {
  const health = await checkHealth();
  return health !== null && health.status === "ok";
}
