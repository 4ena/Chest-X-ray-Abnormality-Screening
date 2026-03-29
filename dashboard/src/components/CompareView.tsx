"use client";

import { useState } from "react";
import { ArrowLeftRight, User, Calendar, Eye, Activity, Heart, Wind, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Patient } from "@/data/mock";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";

function getHighestTier(p: Patient): number {
  return Math.min(...p.findings.map(f => f.tier));
}

export default function CompareView({ patients }: { patients: Patient[] }) {
  const [selectedA, setSelectedA] = useState<number>(patients[0]?.id || 1);
  const [selectedB, setSelectedB] = useState<number>(patients[1]?.id || 2);

  const patientA = patients.find(p => p.id === selectedA)!;
  const patientB = patients.find(p => p.id === selectedB)!;

  const allPathologies = new Set([
    ...patientA.findings.map(f => f.pathology),
    ...patientB.findings.map(f => f.pathology),
  ]);

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Compare Scans</h1>
        <p className="text-sm text-muted mt-1">Side-by-side analysis of two patients</p>
      </div>

      {/* Patient selectors */}
      <div className="flex items-center gap-4 mb-8">
        <PatientSelector value={selectedA} onChange={setSelectedA} label="Patient A" patients={patients} />
        <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
          <ArrowLeftRight size={16} className="text-muted" />
        </div>
        <PatientSelector value={selectedB} onChange={setSelectedB} label="Patient B" patients={patients} />
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-[1fr_1fr] gap-6 mb-8">
        <PatientCard patient={patientA} label="A" />
        <PatientCard patient={patientB} label="B" />
      </div>

      {/* Findings comparison table */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">Findings Comparison</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-6 py-3">Condition</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-6 py-3">Patient A</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-muted font-medium px-6 py-3 w-24">Delta</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-muted font-medium px-6 py-3">Patient B</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(allPathologies).map(pathology => {
              const fA = patientA.findings.find(f => f.pathology === pathology);
              const fB = patientB.findings.find(f => f.pathology === pathology);
              const confA = Math.round((fA?.confidence || 0) * 100);
              const confB = Math.round((fB?.confidence || 0) * 100);
              const delta = confB - confA;
              const tier = fA?.tier || fB?.tier || 4;
              const color = TIER_COLORS[tier];

              return (
                <tr key={pathology} className="border-b border-border/40 hover:bg-panel-bg/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-foreground">{pathology}</span>
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color, backgroundColor: `${color}12` }}>
                        {TIER_LABELS[tier]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-accent-light overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${confA}%`, backgroundColor: confA >= 50 ? color : "var(--border)" }} />
                      </div>
                      <span className={`text-sm font-semibold w-10 ${confA >= 50 ? "text-foreground" : "text-muted/50"}`}>{confA}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {delta !== 0 ? (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                        delta > 0 ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {delta > 0 ? "+" : ""}{delta}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted/50 flex items-center justify-center"><Minus size={12} /></span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-semibold w-10 text-right ${confB >= 50 ? "text-foreground" : "text-muted/50"}`}>{confB}%</span>
                      <div className="w-24 h-1.5 rounded-full bg-accent-light overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${confB}%`, backgroundColor: confB >= 50 ? color : "var(--border)" }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Patient Selector dropdown ── */
function PatientSelector({ value, onChange, label, patients }: { value: number; onChange: (id: number) => void; label: string; patients: Patient[] }) {
  return (
    <div className="flex-1">
      <label className="text-[11px] text-muted uppercase tracking-wider font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(+e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent/10 appearance-none cursor-pointer"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {TIER_LABELS[getHighestTier(p)]} — Score: {Math.round(p.severityScore * 100)}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
    </div>
  );
}

/* ── Patient summary card ── */
function PatientCard({ patient, label }: { patient: Patient; label: string }) {
  const tier = getHighestTier(patient);
  const color = TIER_COLORS[tier];
  const initials = patient.name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header with tier color accent */}
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-5">
        {/* Patient identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-accent-light text-foreground/70 text-sm font-semibold flex items-center justify-center">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">{patient.name}</h3>
            <p className="text-xs text-muted">P#{String(patient.id).padStart(5, "0")}</p>
          </div>
          <span className="text-[9px] font-bold tracking-wide px-2 py-1 rounded"
            style={{ color, backgroundColor: `${color}12` }}>
            {TIER_LABELS[tier]}
          </span>
        </div>

        {/* X-ray image */}
        <div className="bg-gray-950 rounded-xl overflow-hidden mb-4 relative" style={{ height: 220 }}>
          <img
            src={patient.xrayImageUrl}
            alt={`X-ray for ${patient.name}`}
            className="w-full h-full object-contain"
            style={{ filter: "brightness(1.1) contrast(1.1)" }}
          />
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
            {patient.view} · {patient.apPa}
          </div>
        </div>

        {/* Info grid with icons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2.5 bg-panel-bg rounded-xl px-3 py-2.5">
            <User size={14} className="text-muted" />
            <div>
              <p className="text-[10px] text-muted">Age / Sex</p>
              <p className="text-sm font-medium text-foreground">{patient.age}y {patient.sex}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-panel-bg rounded-xl px-3 py-2.5">
            <Calendar size={14} className="text-muted" />
            <div>
              <p className="text-[10px] text-muted">Admitted</p>
              <p className="text-sm font-medium text-foreground">{patient.admissionDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-panel-bg rounded-xl px-3 py-2.5">
            <Eye size={14} className="text-muted" />
            <div>
              <p className="text-[10px] text-muted">View</p>
              <p className="text-sm font-medium text-foreground">{patient.view} ({patient.apPa})</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-panel-bg rounded-xl px-3 py-2.5">
            <Activity size={14} className="text-muted" />
            <div>
              <p className="text-[10px] text-muted">Severity</p>
              <p className="text-sm font-bold" style={{ color }}>{Math.round(patient.severityScore * 100)}</p>
            </div>
          </div>
        </div>

        {/* Vitals row */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-muted" />
            <span className="text-muted">Inflammation:</span>
            <span className={`font-medium ${patient.inflammation === "High" ? "text-red-500" : patient.inflammation === "Medium" ? "text-amber-500" : "text-emerald-500"}`}>
              {patient.inflammation}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind size={12} className="text-muted" />
            <span className="text-muted">Ventilation:</span>
            <span className={`font-medium ${patient.ventilation === "Compromised" ? "text-red-500" : patient.ventilation === "Impaired" ? "text-amber-500" : "text-emerald-500"}`}>
              {patient.ventilation}
            </span>
          </div>
        </div>

        {/* Findings bars */}
        <div className="space-y-2">
          {patient.findings.map(f => {
            const conf = Math.round(f.confidence * 100);
            const fc = TIER_COLORS[f.tier];
            const detected = conf >= 50;
            return (
              <div key={f.pathology} className={`flex items-center gap-3 ${!detected ? "opacity-40" : ""}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: detected ? fc : "var(--border)" }} />
                <span className={`text-sm w-32 truncate ${detected ? "font-medium text-foreground" : "text-muted"}`}>{f.pathology}</span>
                <div className="flex-1 h-1.5 rounded-full bg-accent-light overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${conf}%`, backgroundColor: detected ? fc : "var(--border)" }} />
                </div>
                <span className="text-sm font-semibold w-10 text-right" style={{ color: detected ? fc : "var(--muted)" }}>{conf}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
