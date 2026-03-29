"use client";

import { useState } from "react";
import { ArrowRight, AlertTriangle, Clock, Users, Activity, Search } from "lucide-react";
import { patients, CONDITION_TIERS, ACTIVE_CONDITIONS } from "@/data/mock";

interface TriageViewProps {
  onSelectPatient: (id: number) => void;
}

const tierStyles = {
  2: { badge: "bg-red-50 text-red-600 border border-red-100", dot: "bg-red-500", row: "hover:bg-red-50/40", label: "URGENT" },
  3: { badge: "bg-amber-50 text-amber-600 border border-amber-100", dot: "bg-amber-500", row: "hover:bg-amber-50/40", label: "SEMI-URGENT" },
  4: { badge: "bg-blue-50 text-blue-600 border border-blue-100", dot: "bg-blue-500", row: "hover:bg-blue-50/40", label: "MODERATE" },
};

const tierColors: Record<number, string> = { 2: "#ef4444", 3: "#f59e0b", 4: "#3b82f6" };

function getHighestTier(findings: { tier: number }[]): 2 | 3 | 4 {
  let highest = 4;
  for (const f of findings) {
    if (f.tier < highest) highest = f.tier;
  }
  return highest as 2 | 3 | 4;
}

function timeSinceAdmission(dateStr: string): string {
  const now = new Date("2026-03-28");
  const admitted = new Date(dateStr);
  const diffMs = now.getTime() - admitted.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "< 1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function TriageView({ onSelectPatient }: TriageViewProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filters = [
    { key: "all", label: "All Patients" },
    { key: "2", label: "Urgent" },
    { key: "3", label: "Semi-Urgent" },
    { key: "4", label: "Moderate" },
  ];

  let filtered = filter === "all"
    ? patients
    : patients.filter(p => getHighestTier(p.findings) === Number(filter));

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).padStart(5, "0").includes(q) ||
      p.topFinding.toLowerCase().includes(q)
    );
  }

  // Stats
  const urgent = patients.filter(p => getHighestTier(p.findings) === 2).length;
  const semiUrgent = patients.filter(p => getHighestTier(p.findings) === 3).length;
  const moderate = patients.filter(p => getHighestTier(p.findings) === 4).length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Triage Queue</h1>
          <p className="text-sm text-muted mt-1">{patients.length} patients ranked by clinical severity tier</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock size={13} />
          <span>Last updated: just now</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-panel-bg flex items-center justify-center">
            <Users size={16} className="text-muted" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{patients.length}</p>
            <p className="text-[10px] text-muted">Total Patients</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{urgent}</p>
            <p className="text-[10px] text-muted">Tier 2 — Urgent</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Activity size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{semiUrgent}</p>
            <p className="text-[10px] text-muted">Tier 3 — Semi-Urgent</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{moderate}</p>
            <p className="text-[10px] text-muted">Tier 4 — Moderate</p>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-foreground text-white"
                  : "bg-white text-muted border border-border hover:border-foreground/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search patient or finding..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-panel-bg/50">
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5 w-8">#</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Patient</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Age / Sex</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Top Finding</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Conditions (5)</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Wait Time</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-4 py-2.5">Tier</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient, idx) => {
              const highestTier = getHighestTier(patient.findings);
              const styles = tierStyles[highestTier];
              const topConf = patient.findings[0]?.confidence || 0;

              return (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`border-b border-border/40 cursor-pointer transition-colors ${styles.row}`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted font-mono">{idx + 1}</span>
                  </td>

                  {/* Patient name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
                      <span className="text-sm font-medium text-foreground">{patient.name}</span>
                    </div>
                  </td>

                  {/* Age/Sex */}
                  <td className="px-4 py-3 text-sm text-muted">{patient.age}y {patient.sex[0]}</td>

                  {/* Top finding + confidence */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{patient.topFinding}</span>
                      <span className="text-[11px] font-bold" style={{ color: tierColors[patient.findings[0]?.tier || 4] }}>
                        {Math.round(topConf * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Mini 5-condition bars */}
                  <td className="px-4 py-3">
                    <MiniConditionBars findings={patient.findings} />
                  </td>

                  {/* Wait time */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock size={10} />
                      {timeSinceAdmission(patient.admissionDate)}
                    </span>
                  </td>

                  {/* Tier badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide ${styles.badge}`}>
                      {styles.label}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-3 py-3">
                    <ArrowRight size={14} className="text-muted" />
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

/* ── Mini 5-condition confidence bars ── */
function MiniConditionBars({ findings }: { findings: { pathology: string; confidence: number; tier: number }[] }) {
  const findingMap = new Map(findings.map(f => [f.pathology, f]));

  return (
    <div className="flex items-center gap-0.5">
      {ACTIVE_CONDITIONS.map(name => {
        const f = findingMap.get(name);
        const conf = f ? Math.round(f.confidence * 100) : 0;
        const color = f ? tierColors[f.tier] || "#cbd5e1" : "#e2e8f0";

        return (
          <div
            key={name}
            title={`${name}: ${conf}%`}
            className="w-4 h-5 bg-gray-100 rounded-sm overflow-hidden flex flex-col-reverse"
          >
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: `${conf}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}
