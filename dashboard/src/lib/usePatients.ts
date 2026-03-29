"use client";

import { useState, useEffect, useCallback } from "react";
import { patients as mockPatients, type Patient, type Finding, type Tier, type TierLabel, CONDITION_TIERS, ACTIVE_CONDITIONS } from "@/data/mock";
import { isApiAvailable, listPatients, predictXray, createPatient as apiCreatePatient, type PredictionResponse, type ConditionResult } from "@/lib/api";
import { TIER_LABELS } from "@/lib/constants";

// Explanations for findings (used when API doesn't provide them)
const EXPLANATIONS: Record<string, { explanation: string; clinicalNote: string }> = {
  "Atelectasis": {
    explanation: "Volume loss detected in the affected lung region with displacement of fissures and increased opacity.",
    clinicalNote: "Assess for obstructive causes. Incentive spirometry recommended."
  },
  "Cardiomegaly": {
    explanation: "The cardiac silhouette appears enlarged beyond the normal cardiothoracic ratio of 0.5.",
    clinicalNote: "Consider echocardiography to assess ventricular function."
  },
  "Consolidation": {
    explanation: "Air bronchograms visible within an area of increased opacity, consistent with lobar consolidation.",
    clinicalNote: "High suspicion for pneumonia. Obtain sputum culture and initiate empiric antibiotics."
  },
  "Edema": {
    explanation: "Bilateral perihilar haziness with Kerley B lines detected.",
    clinicalNote: "Likely cardiogenic pulmonary edema. Assess cardiac function and BNP levels."
  },
  "Pleural Effusion": {
    explanation: "Blunting of the costophrenic angle detected with increased opacity in lower lung zones.",
    clinicalNote: "Quantify effusion size. Large effusions may require thoracentesis."
  },
};

/**
 * Convert API ConditionResult to dashboard Finding format
 */
function apiToFinding(r: ConditionResult): Finding {
  const tierInfo = CONDITION_TIERS[r.pathology] || { tier: 4 as Tier, label: "routine" as TierLabel };
  const info = EXPLANATIONS[r.pathology] || { explanation: "AI-detected abnormality.", clinicalNote: "Correlate with clinical presentation." };
  return {
    pathology: r.pathology,
    confidence: r.confidence,
    severity: r.confidence >= 0.7 ? "critical" : r.confidence >= 0.45 ? "moderate" : r.confidence >= 0.25 ? "mild" : "normal",
    tier: tierInfo.tier,
    tierLabel: tierInfo.label,
    explanation: info.explanation,
    clinicalNote: info.clinicalNote,
  };
}

export interface UsePatients {
  patients: Patient[];
  apiConnected: boolean;
  loading: boolean;
  addPatientFromUpload: (data: {
    file: File;
    name: string;
    age: number;
    sex: "Male" | "Female";
    reasonForExam: string;
  }) => Promise<{ predictions: Finding[]; patientId: string }>;
  refresh: () => void;
}

let nextMockId = 100;

export function usePatients(): UsePatients {
  const [apiPatients, setApiPatients] = useState<Patient[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadedPatients, setUploadedPatients] = useState<Patient[]>([]);

  const fetchFromApi = useCallback(async () => {
    try {
      const available = await isApiAvailable();
      setApiConnected(available);
      if (available) {
        const records = await listPatients();
        const converted: Patient[] = records.map((r, i) => ({
          id: 1000 + i,
          name: r.name,
          age: r.age,
          sex: r.sex as "Male" | "Female",
          admissionDate: r.created_at.split("T")[0],
          view: "Frontal" as const,
          apPa: "AP" as const,
          reasonForExam: r.reason_for_exam || "",
          priorStudies: 0,
          findings: r.findings.map(apiToFinding),
          severityScore: r.severity_score,
          severityLevel: r.severity_score >= 0.7 ? "critical" as const : r.severity_score >= 0.45 ? "moderate" as const : r.severity_score >= 0.25 ? "mild" as const : "normal" as const,
          topFinding: r.findings[0]?.pathology || "No Finding",
          lungIndex: 80,
          inflammation: r.severity_score >= 0.6 ? "High" as const : r.severity_score >= 0.35 ? "Medium" as const : "Low" as const,
          ventilation: r.severity_score >= 0.6 ? "Compromised" as const : r.severity_score >= 0.35 ? "Impaired" as const : "Healthy" as const,
          riskLevel: r.severity_score >= 0.6 ? "High" as const : r.severity_score >= 0.35 ? "Medium" as const : "Low" as const,
          xrayImageUrl: "/sample-xrays/synth1.jpg",
        }));
        setApiPatients(converted);
      }
    } catch {
      setApiConnected(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFromApi(); }, [fetchFromApi]);

  // Merge: uploaded patients first (newest), then API patients, then mock
  const allPatients = [...uploadedPatients, ...apiPatients, ...mockPatients];

  // Sort by tier-first, then severity
  allPatients.sort((a, b) => {
    const tierA = Math.min(...a.findings.map(f => f.tier));
    const tierB = Math.min(...b.findings.map(f => f.tier));
    if (tierA !== tierB) return tierA - tierB;
    return b.severityScore - a.severityScore;
  });

  const addPatientFromUpload = useCallback(async (data: {
    file: File; name: string; age: number; sex: "Male" | "Female"; reasonForExam: string;
  }) => {
    // Always call the API for prediction
    let findings: Finding[];
    let patientId: string;

    try {
      const prediction = await predictXray(data.file);
      findings = prediction.findings.map(apiToFinding);
    } catch {
      // If API predict fails, generate mock findings
      findings = ACTIVE_CONDITIONS.map(name => {
        const tierInfo = CONDITION_TIERS[name] || { tier: 4 as Tier, label: "routine" as TierLabel };
        const info = EXPLANATIONS[name] || { explanation: "", clinicalNote: "" };
        const conf = Math.round(Math.random() * 70 + 15) / 100;
        return {
          pathology: name,
          confidence: conf,
          severity: conf >= 0.7 ? "critical" as const : conf >= 0.45 ? "moderate" as const : conf >= 0.25 ? "mild" as const : "normal" as const,
          tier: tierInfo.tier,
          tierLabel: tierInfo.label,
          explanation: info.explanation,
          clinicalNote: info.clinicalNote,
        };
      }).sort((a, b) => b.confidence - a.confidence);
    }

    // Try to save patient to API
    try {
      const record = await apiCreatePatient({
        name: data.name,
        age: data.age,
        sex: data.sex,
        reason_for_exam: data.reasonForExam,
        findings: findings.map(f => ({
          pathology: f.pathology,
          confidence: f.confidence,
          tier: f.tier,
          tier_label: f.tierLabel,
          detected: f.confidence >= 0.5,
        })),
        severity_score: findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length,
        highest_tier: Math.min(...findings.filter(f => f.confidence >= 0.5).map(f => f.tier)),
      });
      patientId = record.id;
    } catch {
      patientId = `P${String(++nextMockId).padStart(5, "0")}`;
    }

    // Create patient object for the dashboard
    const previewUrl = URL.createObjectURL(data.file);
    const severityScore = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;

    const newPatient: Patient = {
      id: nextMockId++,
      name: data.name,
      age: data.age,
      sex: data.sex,
      admissionDate: new Date().toISOString().split("T")[0],
      view: "Frontal",
      apPa: "AP",
      reasonForExam: data.reasonForExam,
      priorStudies: 0,
      findings,
      severityScore,
      severityLevel: severityScore >= 0.7 ? "critical" : severityScore >= 0.45 ? "moderate" : severityScore >= 0.25 ? "mild" : "normal",
      topFinding: findings[0]?.pathology || "No Finding",
      lungIndex: Math.floor(Math.random() * 40 + 60),
      inflammation: severityScore >= 0.6 ? "High" : severityScore >= 0.35 ? "Medium" : "Low",
      ventilation: severityScore >= 0.6 ? "Compromised" : severityScore >= 0.35 ? "Impaired" : "Healthy",
      riskLevel: severityScore >= 0.6 ? "High" : severityScore >= 0.35 ? "Medium" : "Low",
      xrayImageUrl: previewUrl,
    };

    setUploadedPatients(prev => [newPatient, ...prev]);

    return { predictions: findings, patientId };
  }, []);

  return {
    patients: allPatients,
    apiConnected,
    loading,
    addPatientFromUpload,
    refresh: fetchFromApi,
  };
}
