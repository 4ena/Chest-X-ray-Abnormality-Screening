"use client";

import { useState, useCallback } from "react";
import TopNav from "@/components/TopNav";
import TriageView from "@/components/TriageView";
import PatientDetailView from "@/components/PatientDetailView";
import CompareView from "@/components/CompareView";
import UploadView from "@/components/UploadView";
import { usePatients } from "@/lib/usePatients";
import type { Finding } from "@/data/mock";

export default function Home() {
  const [activeView, setActiveView] = useState("triage");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const { patients, apiConnected, addPatientFromUpload, deletePatient } = usePatients();

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  function handleSelectPatient(id: number) {
    setSelectedPatientId(id);
    setSelectedFinding(null);
    setActiveView("dashboard");
  }

  const handleSelectFinding = useCallback((f: Finding) => {
    setSelectedFinding(f);
  }, []);

  return (
    <div className="h-screen bg-gray-100/50 flex flex-col overflow-hidden">
      <TopNav
        activeView={activeView}
        onViewChange={setActiveView}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        apiConnected={apiConnected}
      />

      <main className="flex-1 overflow-hidden">
        {activeView === "triage" && (
          <div className="h-full overflow-y-auto">
            <TriageView
              patients={patients}
              onSelectPatient={handleSelectPatient}
              onDeletePatient={deletePatient}
              globalSearch={globalSearch}
            />
          </div>
        )}

        {activeView === "dashboard" && patient && (
          <PatientDetailView
            patient={patient}
            allPatients={patients}
            selectedFinding={selectedFinding}
            onSelectFinding={handleSelectFinding}
            onBack={() => setActiveView("triage")}
            onSelectPatient={(id) => { setSelectedPatientId(id); setSelectedFinding(null); }}
          />
        )}

        {activeView === "compare" && (
          <div className="h-full overflow-y-auto">
            <CompareView patients={patients} />
          </div>
        )}

        {activeView === "upload" && (
          <div className="h-full overflow-y-auto">
            <UploadView
              onViewTriage={() => setActiveView("triage")}
              onUploadAndPredict={addPatientFromUpload}
              existingPatients={patients}
            />
          </div>
        )}
      </main>
    </div>
  );
}
