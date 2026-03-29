"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, Phone, Mail, Calendar, Eye, FileText, ClipboardList, Images, AlertTriangle, Check, X, Flag, ClipboardCopy } from "lucide-react";
import type { Patient, Finding } from "@/data/mock";
import { patients, PATHOLOGY_REGIONS, ACTIVE_CONDITIONS } from "@/data/mock";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";

interface PatientDetailViewProps {
  patient: Patient;
  selectedFinding: Finding | null;
  onSelectFinding: (f: Finding) => void;
  onBack: () => void;
  onSelectPatient: (id: number) => void;
}

export default function PatientDetailView({ patient, selectedFinding, onSelectFinding, onBack, onSelectPatient }: PatientDetailViewProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"xray" | "findings" | "data">("xray");

  useEffect(() => { setImageLoaded(false); }, [patient.id]);

  const highestTier = Math.min(...patient.findings.map(f => f.tier)) as 2 | 3 | 4;
  const tierColor = TIER_COLORS[highestTier];

  return (
    <div className="h-[calc(100vh-64px)] max-w-screen-2xl mx-auto flex">
      {/* ── Left: Patient list ── */}
      <div className="w-[240px] border-r border-gray-100 overflow-y-auto bg-white">
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Patient Lists ({patients.length})</h3>
          </div>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          {patients.map(p => {
            const isActive = p.id === patient.id;
            const initials = p.name.split(" ").map(n => n[0]).join("").toUpperCase();
            const pTier = Math.min(...p.findings.map(f => f.tier));
            const dotColor = pTier === 2 ? "bg-red-500" : pTier === 3 ? "bg-amber-500" : "bg-blue-400";

            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className={`w-full px-3 py-2.5 flex items-center gap-3 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-white shadow-sm ring-1 ring-gray-200"
                    : "hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                    isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {initials}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isActive ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>{p.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{p.topFinding} · {Math.round(p.findings[0]?.confidence * 100)}%</p>
                </div>
                <ChevronRight size={14} className={isActive ? "text-gray-500" : "text-gray-300"} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center: X-ray + findings ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {/* Breadcrumb + tabs */}
        <div className="px-6 pt-4 pb-0">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors">
            <ChevronLeft size={16} /> Back to Queue
          </button>

          <div className="flex items-center gap-6 border-b border-gray-100">
            {[
              { id: "xray" as const, label: "X-ray View" },
              { id: "findings" as const, label: "Findings" },
              { id: "data" as const, label: "Clinical Data" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "xray" && (
            <XrayPanel patient={patient} showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap} imageLoaded={imageLoaded} setImageLoaded={setImageLoaded} selectedFinding={selectedFinding} onSelectFinding={onSelectFinding} />
          )}
          {activeTab === "findings" && (
            <FindingsPanel patient={patient} selectedFinding={selectedFinding} onSelectFinding={onSelectFinding} />
          )}
          {activeTab === "data" && (
            <ClinicalDataPanel patient={patient} />
          )}
        </div>
      </div>

      {/* ── Right: Patient info panel ── */}
      <div className="w-[300px] border-l border-gray-100 overflow-y-auto bg-white">
        <PatientInfoPanel patient={patient} highestTier={highestTier} tierColor={tierColor} />
      </div>
    </div>
  );
}

/* ── X-ray Panel (center) ── */
function XrayPanel({ patient, showHeatmap, setShowHeatmap, imageLoaded, setImageLoaded, selectedFinding, onSelectFinding }: {
  patient: Patient; showHeatmap: boolean; setShowHeatmap: (v: boolean) => void;
  imageLoaded: boolean; setImageLoaded: (v: boolean) => void;
  selectedFinding: Finding | null; onSelectFinding: (f: Finding) => void;
}) {
  const findingMap = new Map(patient.findings.map(f => [f.pathology, f]));

  return (
    <div className="space-y-6">
      {/* X-ray image */}
      <div className="bg-black rounded-2xl overflow-hidden relative" style={{ minHeight: 420 }}>
        <img
          src={patient.xrayImageUrl}
          alt={`Chest X-ray for ${patient.name}`}
          className={`w-full h-auto max-h-[520px] object-contain transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          style={{ filter: "brightness(1.1) contrast(1.1)" }}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-lg">
          {patient.view} · {patient.apPa}
        </div>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            showHeatmap ? "bg-white text-gray-900" : "bg-black/50 text-white backdrop-blur-sm"
          }`}
        >
          {showHeatmap ? "Heatmap On" : "Heatmap Off"}
        </button>
      </div>

      {/* All 5 conditions — animated bars */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Detection Results</h3>
        <div className="space-y-3">
          {ACTIVE_CONDITIONS.map(name => {
            const f = findingMap.get(name);
            const conf = f ? Math.round(f.confidence * 100) : 0;
            const color = f ? TIER_COLORS[f.tier] : "#e5e7eb";
            const detected = conf >= 30;
            const isSelected = selectedFinding?.pathology === name;

            return (
              <div
                key={name}
                onClick={() => f && onSelectFinding(f)}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected ? "bg-gray-50 ring-1 ring-gray-200" : detected ? "hover:bg-gray-50/60" : "opacity-50"
                }`}
              >
                <span className={`text-sm w-36 ${detected ? "font-medium text-gray-900" : "text-gray-400"}`}>{name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${conf}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-semibold w-10 text-right" style={{ color: detected ? color : "#d1d5db" }}>{conf}%</span>
                {f && detected && (
                  <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                    style={{ color, backgroundColor: `${color}12` }}>
                    {TIER_LABELS[f.tier]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Findings Panel ── */
function FindingsPanel({ patient, selectedFinding, onSelectFinding }: {
  patient: Patient; selectedFinding: Finding | null; onSelectFinding: (f: Finding) => void;
}) {
  return (
    <div className="space-y-4">
      {patient.findings.filter(f => f.confidence >= 0.25).map(f => {
        const color = TIER_COLORS[f.tier];
        const isSelected = selectedFinding?.pathology === f.pathology;
        const [status, setStatus] = useState<"pending" | "confirmed" | "dismissed">("pending");
        const [flagged, setFlagged] = useState(false);

        return (
          <div
            key={f.pathology}
            onClick={() => onSelectFinding(f)}
            className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${
              isSelected ? "border-gray-300 shadow-sm" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <h4 className="text-base font-semibold text-gray-900">{f.pathology}</h4>
                <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded"
                  style={{ color, backgroundColor: `${color}12` }}>
                  {TIER_LABELS[f.tier]}
                </span>
              </div>
              <span className="text-lg font-bold" style={{ color }}>{Math.round(f.confidence * 100)}%</span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.explanation}</p>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Clinical Recommendation</p>
              <p className="text-sm text-gray-600 leading-relaxed">{f.clinicalNote}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setStatus(status === "confirmed" ? "pending" : "confirmed"); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <Check size={12} /> {status === "confirmed" ? "Confirmed" : "Confirm"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setStatus(status === "dismissed" ? "pending" : "dismissed"); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === "dismissed" ? "bg-gray-200 text-gray-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <X size={12} /> Dismiss
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFlagged(!flagged); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  flagged ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                }`}
              >
                <Flag size={12} /> {flagged ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Clinical Data Panel ── */
function ClinicalDataPanel({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Patient Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{patient.findings.length}</p>
            <p className="text-xs text-gray-400 mt-1">Findings</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{Math.round(patient.severityScore * 100)}</p>
            <p className="text-xs text-gray-400 mt-1">Severity Score</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{patient.lungIndex}</p>
            <p className="text-xs text-gray-400 mt-1">Lung Index</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Vitals & Indicators</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Inflammation</span>
            <span className={`text-sm font-semibold ${patient.inflammation === "High" ? "text-red-500" : patient.inflammation === "Medium" ? "text-amber-500" : "text-emerald-500"}`}>{patient.inflammation}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ventilation</span>
            <span className={`text-sm font-semibold ${patient.ventilation === "Compromised" ? "text-red-500" : patient.ventilation === "Impaired" ? "text-amber-500" : "text-emerald-500"}`}>{patient.ventilation}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Risk Level</span>
            <span className={`text-sm font-semibold ${patient.riskLevel === "High" ? "text-red-500" : patient.riskLevel === "Medium" ? "text-amber-500" : "text-emerald-500"}`}>{patient.riskLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Right Panel: Patient Info (Wellbeing-inspired) ── */
function PatientInfoPanel({ patient, highestTier, tierColor }: { patient: Patient; highestTier: number; tierColor: string }) {
  const initials = patient.name.split(" ").map(n => n[0]).join("").toUpperCase();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "exam", "history"]));

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="p-5">
      {/* Patient header */}
      <div className="text-center mb-5 pb-5 border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center mx-auto mb-3">
          {initials}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{patient.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">P#{String(patient.id).padStart(5, "0")}</p>
        <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ color: tierColor, backgroundColor: `${tierColor}12` }}>
          {TIER_LABELS[highestTier]}
        </span>
      </div>

      {/* Collapsible sections */}
      <CollapsibleSection title="Basic Information" count={6} expanded={expandedSections.has("basic")} onToggle={() => toggleSection("basic")}>
        <InfoRow label="Gender" value={patient.sex} />
        <InfoRow label="Age" value={`${patient.age}`} />
        <InfoRow label="Phone" value={`(513) 555-0${patient.id}42`} />
        <InfoRow label="Email" value={`${patient.name.split(" ")[0].toLowerCase()}@email.com`} />
        <InfoRow label="Admitted" value={patient.admissionDate} />
        <InfoRow label="Referring" value="Dr. Williams" />
      </CollapsibleSection>

      <CollapsibleSection title="Exam Details" count={3} expanded={expandedSections.has("exam")} onToggle={() => toggleSection("exam")}>
        <InfoRow label="View" value={`${patient.view} (${patient.apPa})`} />
        <InfoRow label="Prior Studies" value={patient.priorStudies === 0 ? "None on file" : `${patient.priorStudies} prior CXR${patient.priorStudies > 1 ? "s" : ""}`} />
        <div className="py-2">
          <p className="text-xs text-gray-400 mb-1">Reason for Exam</p>
          <p className="text-sm text-gray-900 leading-relaxed">{patient.reasonForExam}</p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Findings Summary" count={patient.findings.length} expanded={expandedSections.has("history")} onToggle={() => toggleSection("history")}>
        {patient.findings.map(f => {
          const color = TIER_COLORS[f.tier];
          return (
            <div key={f.pathology} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-700">{f.pathology}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>{Math.round(f.confidence * 100)}%</span>
            </div>
          );
        })}
      </CollapsibleSection>
    </div>
  );
}

/* ── Helpers ── */
function CollapsibleSection({ title, count, expanded, onToggle, children }: {
  title: string; count: number; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-3 text-left">
        <span className="text-sm font-medium text-gray-900">{title} ({count})</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
