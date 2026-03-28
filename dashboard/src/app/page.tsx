"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import XrayCard from "@/components/XrayCard";
import RegionsChart from "@/components/RegionsChart";
import FindingsCard from "@/components/FindingsCard";
import RiskCard from "@/components/RiskCard";
import SeverityDonut from "@/components/SeverityDonut";
import PatientInfo from "@/components/PatientInfo";
import ExplanationCard from "@/components/ExplanationCard";
import TriageView from "@/components/TriageView";
import CompareView from "@/components/CompareView";
import UploadView from "@/components/UploadView";
import { patients, type Finding } from "@/data/mock";

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const severityPct = Math.round(patient.severityScore * 100);

  function handleSelectPatient(id: number) {
    setSelectedPatientId(id);
    setSelectedFinding(null);
    setActiveView("dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeView={activeView} onViewChange={setActiveView} />

      {activeView === "dashboard" && (
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 auto-rows-min">
            {/* Row 1: X-ray (2 cols, 2 rows) + Regions chart + Findings */}
            <XrayCard patient={patient} />
            <RegionsChart />
            <FindingsCard
              findings={patient.findings}
              onSelectFinding={setSelectedFinding}
              selectedFinding={selectedFinding}
            />

            {/* Row 2: Risk cards + Severity donut */}
            <RiskCard
              title={patient.findings[0]?.pathology || "Pleural Effusion"}
              percentage={Math.round((patient.findings[0]?.confidence || 0) * 100)}
              trend="up"
              status={(patient.findings[0]?.confidence || 0) >= 0.6 ? "elevated" : "normal"}
            />
            <RiskCard
              title={patient.findings[1]?.pathology || "Cardiomegaly"}
              percentage={Math.round((patient.findings[1]?.confidence || 0) * 100)}
              trend="down"
              status={(patient.findings[1]?.confidence || 0) >= 0.6 ? "elevated" : "normal"}
            />

            {/* Row 3: Severity + Patient Info + Explanation */}
            <SeverityDonut score={severityPct} level={patient.severityLevel} />
            <PatientInfo patient={patient} />
            <ExplanationCard finding={selectedFinding} />
          </div>
        </div>
      )}

      {activeView === "triage" && (
        <TriageView onSelectPatient={handleSelectPatient} />
      )}

      {activeView === "compare" && <CompareView />}

      {activeView === "upload" && <UploadView />}
    </div>
  );
}
