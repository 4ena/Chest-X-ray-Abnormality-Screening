"use client";

import { useState } from "react";
import { ArrowRight, AlertTriangle, Minus } from "lucide-react";
import { patients } from "@/data/mock";

interface TriageViewProps {
  onSelectPatient: (id: number) => void;
}

const severityStyles = {
  critical: { badge: "bg-red-50 text-red-600", dot: "bg-red-500", row: "hover:bg-red-50/50" },
  moderate: { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500", row: "hover:bg-amber-50/50" },
  mild: { badge: "bg-yellow-50 text-yellow-600", dot: "bg-yellow-500", row: "hover:bg-yellow-50/50" },
  normal: { badge: "bg-green-50 text-green-600", dot: "bg-green-500", row: "hover:bg-green-50/50" },
};

export default function TriageView({ onSelectPatient }: TriageViewProps) {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "critical", "moderate", "mild", "normal"];

  const filtered = filter === "all" ? patients : patients.filter(p => p.severityLevel === filter);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Triage Queue</h1>
        <p className="text-sm text-muted mt-1">Patients ranked by severity</p>
      </div>

      <div className="flex gap-2 mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
              filter === f
                ? "bg-foreground text-white"
                : "bg-white text-muted border border-border hover:border-foreground/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-5 py-3">Patient</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-5 py-3">Age / Sex</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-5 py-3">Top Finding</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-5 py-3">Confidence</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted font-medium px-5 py-3">Severity</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(patient => {
              const styles = severityStyles[patient.severityLevel];
              const topConf = patient.findings[0]?.confidence || 0;
              const pct = Math.round(topConf * 100);

              return (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${styles.row}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                      <span className="text-sm font-medium">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">{patient.age}y {patient.sex}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {patient.severityLevel === "critical" && <AlertTriangle size={12} className="text-critical" />}
                      <span className="text-sm">{patient.topFinding}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${
                          pct >= 70 ? "bg-critical" : pct >= 45 ? "bg-moderate" : "bg-normal"
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted font-medium">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${styles.badge}`}>
                      {patient.severityLevel}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
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
