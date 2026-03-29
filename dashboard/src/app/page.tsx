"use client";

import { useState, useRef, useCallback } from "react";
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
  const [activeView, setActiveView] = useState("triage");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  function handleSelectPatient(id: number) {
    setSelectedPatientId(id);
    setSelectedFinding(null);
    setActiveView("dashboard");
  }

  // When a finding is selected (from annotation card or elsewhere),
  // scroll the left panel to that finding's details
  const handleSelectFinding = useCallback((f: Finding) => {
    setSelectedFinding(f);
    // Scroll left panel to the finding element
    requestAnimationFrame(() => {
      const el = document.getElementById(`finding-${f.pathology.replace(/\s+/g, "-")}`);
      if (el && leftPanelRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      <div className="ml-14 flex-1 flex h-screen">
        {activeView === "dashboard" && (
          <>
            {/* ── Left panel (scrollable) ── */}
            <div ref={leftPanelRef} className="w-[320px] min-w-[320px] border-r border-border overflow-y-auto bg-white">
              <div className="p-4 space-y-3">
                <PatientProfile patient={patient} />
                <MetricCards patient={patient} />
                <DiagnoseNotes
                  findings={patient.findings}
                  onSelectFinding={handleSelectFinding}
                  selectedFinding={selectedFinding}
                />
              </div>
            </div>

            {/* ── Right panel: X-ray viewer fills remaining space ── */}
            <div className="flex-1 min-w-0 h-full">
              <XrayViewer
                patient={patient}
                selectedFinding={selectedFinding}
                onSelectFinding={handleSelectFinding}
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
            <UploadView onViewTriage={() => setActiveView("triage")} />
          </div>
        )}
      </div>
    </div>
  );
}
