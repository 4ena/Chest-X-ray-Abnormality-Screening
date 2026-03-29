"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { patients, type Patient } from "@/data/mock";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";

function MiniXray({ patient, size = 260 }: { patient: Patient; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = size, h = size;

    ctx.fillStyle = "#080c18";
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w / 2, h * 0.45, 15, w / 2, h * 0.45, w * 0.4);
    grad.addColorStop(0, "rgba(150,160,180,0.25)");
    grad.addColorStop(0.5, "rgba(90,100,120,0.18)");
    grad.addColorStop(1, "rgba(10,15,30,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(20,25,40,0.4)";
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.4, w * 0.11, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.4, w * 0.11, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.4;
    const positions: Record<string, [number, number, number]> = {
      "Cardiomegaly": [0.44, 0.5, 0.1],
      "Pleural Effusion": [0.32, 0.68, 0.08],
      "Atelectasis": [0.36, 0.52, 0.07],
      "Edema": [0.5, 0.38, 0.12],
      "Consolidation": [0.63, 0.35, 0.07],
    };
    for (const f of patient.findings) {
      const pos = positions[f.pathology] || [0.5, 0.4, 0.08];
      const cx = w * pos[0], cy = h * pos[1], r = w * pos[2];
      const color = TIER_COLORS[f.tier] || "#3b82f6";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `${color}99`);
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(100,110,130,0.4)";
    ctx.font = "10px monospace";
    ctx.fillText(`ID: ${String(patient.id).padStart(5, "0")}`, 8, 16);
  }, [patient, size]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={ref} width={size} height={size} className="w-full rounded-xl" />;
}

function getHighestTier(findings: { tier: number }[]): number {
  return Math.min(...findings.map(f => f.tier));
}

export default function CompareView() {
  const [selectedA, setSelectedA] = useState<number>(patients[0]?.id || 1);
  const [selectedB, setSelectedB] = useState<number>(patients[1]?.id || 2);

  const patientA = patients.find(p => p.id === selectedA)!;
  const patientB = patients.find(p => p.id === selectedB)!;

  const allPathologies = new Set([
    ...patientA.findings.map(f => f.pathology),
    ...patientB.findings.map(f => f.pathology),
  ]);

  function PatientCard({ patient, label }: { patient: Patient; label: string }) {
    const tier = getHighestTier(patient.findings);
    const color = TIER_COLORS[tier] || "#3b82f6";

    return (
      <div className="space-y-4">
        <div className="bg-card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{patient.name}</h4>
            <span className="text-[8px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}22` }}>
              {TIER_LABELS[tier]}
            </span>
          </div>
          <MiniXray patient={patient} />
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[10px] uppercase text-muted">Age</span><p className="font-medium">{patient.age}y</p></div>
            <div><span className="text-[10px] uppercase text-muted">Sex</span><p className="font-medium">{patient.sex}</p></div>
            <div>
              <span className="text-[10px] uppercase text-muted">Severity</span>
              <p className="font-bold" style={{ color }}>{Math.round(patient.severityScore * 100)}</p>
            </div>
            <div><span className="text-[10px] uppercase text-muted">View</span><p className="font-medium">{patient.view}</p></div>
          </div>
          {/* Findings list */}
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            {patient.findings.map(f => {
              const fc = TIER_COLORS[f.tier] || "#3b82f6";
              return (
                <div key={f.pathology} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fc }} />
                    <span className="text-xs text-foreground">{f.pathology}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: fc }}>{Math.round(f.confidence * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Compare Scans</h1>
        <p className="text-sm text-muted mt-1">Side-by-side analysis of two patients</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select
          value={selectedA}
          onChange={e => setSelectedA(+e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} — Tier {getHighestTier(p.findings)}</option>
          ))}
        </select>
        <span className="text-muted text-sm font-medium px-2">vs</span>
        <select
          value={selectedB}
          onChange={e => setSelectedB(+e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} — Tier {getHighestTier(p.findings)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[1fr_220px_1fr] gap-4">
        <PatientCard patient={patientA} label="Patient A" />

        {/* Diff Column */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Differences</h4>
          <div className="space-y-3">
            {Array.from(allPathologies).map(pathology => {
              const fA = patientA.findings.find(f => f.pathology === pathology);
              const fB = patientB.findings.find(f => f.pathology === pathology);
              const confA = fA?.confidence || 0;
              const confB = fB?.confidence || 0;
              const delta = Math.round((confB - confA) * 100);
              const tier = fA?.tier || fB?.tier || 4;
              const color = TIER_COLORS[tier] || "#3b82f6";

              return (
                <div key={pathology} className="pb-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-[11px] font-semibold truncate">{pathology}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-semibold">{Math.round(confA * 100)}%</span>
                    <span className="text-muted">vs</span>
                    <span className="font-semibold">{Math.round(confB * 100)}%</span>
                    {delta !== 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        delta > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                      }`}>
                        {delta > 0 ? "+" : ""}{delta}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PatientCard patient={patientB} label="Patient B" />
      </div>
    </div>
  );
}
