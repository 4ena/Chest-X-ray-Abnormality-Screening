"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PatientProfile from "@/components/PatientProfile";
import MetricCards from "@/components/MetricCards";
import DiagnoseNotes from "@/components/DiagnoseNotes";
import XrayViewer from "@/components/XrayViewer";
import TriageView from "@/components/TriageView";
import CompareView from "@/components/CompareView";
import UploadView from "@/components/UploadView";
import { patients, type Finding } from "@/data/mock";

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  function handleSelectPatient(id: number) {
    setSelectedPatientId(id);
    setSelectedFinding(null);
    setActiveView("dashboard");
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      <div className="ml-14 flex-1 flex h-screen">
        {activeView === "dashboard" && (
          <>
            {/* ── Left panel (scrollable) ── */}
            <div className="w-[320px] min-w-[320px] border-r border-border overflow-y-auto bg-white">
              <div className="p-4 space-y-3">
                <PatientProfile patient={patient} />
                <MetricCards patient={patient} />
                <DiagnoseNotes
                  findings={patient.findings}
                  onSelectFinding={setSelectedFinding}
                  selectedFinding={selectedFinding}
                />
              </div>
            </div>

            {/* ── Right panel: X-ray viewer fills remaining space ── */}
            <div className="flex-1 min-w-0 h-full">
              <XrayViewer
                patient={patient}
                selectedFinding={selectedFinding}
                onSelectFinding={setSelectedFinding}
              />
            </div>
          </>
        )}

        {activeView === "triage" && (
          <div className="flex-1 overflow-y-auto">
            <TriageView onSelectPatient={handleSelectPatient} />
          </div>
        )}

        {activeView === "compare" && (
          <div className="flex-1 overflow-y-auto">
            <CompareView />
          </div>
        )}

        {activeView === "upload" && (
          <div className="flex-1 overflow-y-auto">
            <UploadView />
          </div>
        )}
      </div>
    </div>
  );
}
